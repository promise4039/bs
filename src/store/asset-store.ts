// 자산 관리 스토어 — 계좌, 카드, 현금, 대출, 증권, 페이머니
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Asset, InvestmentHolding } from '../types/asset';

interface AssetStore {
  assets: Asset[];

  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  /** ID 기준으로 있으면 업데이트, 없으면 추가 (엑셀 import용) */
  upsertAssets: (newAssets: Asset[]) => void;

  // 투자 종목 관리
  addHolding: (assetId: string, holding: InvestmentHolding) => void;
  updateHolding: (assetId: string, holdingId: string, updates: Partial<InvestmentHolding>) => void;
  deleteHolding: (assetId: string, holdingId: string) => void;
}

export const useAssetStore = create<AssetStore>()(
  persist(
    (set) => ({
      assets: [],

      addAsset: (asset) =>
        set((state) => ({
          assets: [...state.assets, asset],
        })),

      updateAsset: (id, updates) =>
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      deleteAsset: (id) =>
        set((state) => ({
          assets: state.assets.filter((a) => a.id !== id),
        })),

      upsertAssets: (newAssets) =>
        set((state) => {
          const existingIds = new Set(state.assets.map((a) => a.id));
          const updated = state.assets.map((existing) => {
            const incoming = newAssets.find((n) => n.id === existing.id);
            if (!incoming) return existing;
            // 기존 자산의 사용자 커스텀 필드 유지, 잔액/holdings 등은 갱신
            return {
              ...existing,
              balance: incoming.balance,
              holdings: incoming.holdings ?? existing.holdings,
              // 대출 필드 갱신
              ...(incoming.type === 'loan' ? {
                loanPrincipal: incoming.loanPrincipal ?? existing.loanPrincipal,
                loanRate: incoming.loanRate ?? existing.loanRate,
                loanStartDate: incoming.loanStartDate ?? existing.loanStartDate,
                maturityDate: incoming.maturityDate ?? existing.maturityDate,
                loanTermMonths: incoming.loanTermMonths ?? existing.loanTermMonths,
              } : {}),
            };
          });
          const added = newAssets.filter((n) => !existingIds.has(n.id));
          return { assets: [...updated, ...added] };
        }),

      addHolding: (assetId, holding) =>
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === assetId
              ? { ...a, holdings: [...(a.holdings || []), holding] }
              : a
          ),
        })),

      updateHolding: (assetId, holdingId, updates) =>
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === assetId
              ? {
                  ...a,
                  holdings: (a.holdings || []).map((h) =>
                    h.id === holdingId ? { ...h, ...updates } : h
                  ),
                }
              : a
          ),
        })),

      deleteHolding: (assetId, holdingId) =>
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === assetId
              ? {
                  ...a,
                  holdings: (a.holdings || []).filter((h) => h.id !== holdingId),
                }
              : a
          ),
        })),
    }),
    {
      name: 'bs_assets',
    },
  ),
);
