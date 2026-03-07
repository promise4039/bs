import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, EmptyState } from '../components/ui';
import { useAssetStore } from '../store';
import type { AssetType } from '../types/asset';
import { ASSET_TYPE_LABELS, ASSET_TYPE_ICONS } from '../types/asset';
import { formatNumber } from '../utils/currency';

// 자산 타입 표시 순서
const SECTION_ORDER: AssetType[] = ['account', 'cash', 'securities', 'card', 'pay', 'loan'];

export default function AssetPage() {
  const navigate = useNavigate();
  const assets = useAssetStore((s) => s.assets);

  // 타입별 자산 그룹화
  const grouped = useMemo(() => {
    const map = new Map<AssetType, typeof assets>();
    for (const type of SECTION_ORDER) {
      map.set(type, []);
    }
    for (const asset of assets) {
      const list = map.get(asset.type);
      if (list) list.push(asset);
    }
    return map;
  }, [assets]);

  // 총 자산 / 총 부채 / 순자산 계산
  const totalAssets = useMemo(() => {
    return assets
      .filter((a) => a.type !== 'loan')
      .reduce((sum, a) => sum + a.balance, 0);
  }, [assets]);

  const totalLiabilities = useMemo(() => {
    return assets
      .filter((a) => a.type === 'loan')
      .reduce((sum, a) => sum + a.balance, 0);
  }, [assets]);

  const netWorth = totalAssets - totalLiabilities;

  // 섹션별 소계
  const sectionTotal = (type: AssetType) => {
    return (grouped.get(type) || []).reduce((sum, a) => sum + a.balance, 0);
  };

  // 증권 계좌 평가금 합계 (보유종목 currentPrice 합산)
  const securitiesTotal = useMemo(() => {
    const secAssets = grouped.get('securities') || [];
    return secAssets.reduce((sum, a) => {
      if (a.holdings && a.holdings.length > 0) {
        return sum + a.holdings.reduce((s, h) => s + h.currentPrice, 0);
      }
      return sum + a.balance;
    }, 0);
  }, [grouped]);

  const hasAssets = assets.length > 0;

  return (
    <div className="pb-28 space-y-5 animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-text-primary">자산</h1>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="text-text-tertiary hover:text-text-primary transition-colors text-lg bg-transparent border-none cursor-pointer"
        >
          ⚙️
        </button>
      </div>

      {/* 순자산 카드 */}
      <Card className="space-y-1">
        <p className="text-xs text-text-tertiary">순자산</p>
        <p
          className={`text-2xl font-bold ${netWorth >= 0 ? 'text-income' : 'text-expense'}`}
        >
          {netWorth < 0 ? '-' : ''}
          {formatNumber(Math.abs(netWorth))}원
        </p>
      </Card>

      {!hasAssets ? (
        <EmptyState
          icon="🏦"
          title="등록된 자산이 없습니다"
          description="+ 버튼을 눌러 계좌, 카드, 대출 등을 추가하세요"
        />
      ) : (
        <>
          {SECTION_ORDER.map((type) => {
            const items = grouped.get(type) || [];
            if (items.length === 0) return null;

            const total =
              type === 'securities' ? securitiesTotal : sectionTotal(type);

            return (
              <section key={type}>
                {/* 섹션 헤더 + 소계 */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-primary">
                    {ASSET_TYPE_LABELS[type]}
                  </span>
                  <span
                    className={`text-sm font-semibold ${type === 'loan' ? 'text-expense' : 'text-text-primary'}`}
                  >
                    {type === 'loan' ? '-' : ''}
                    {formatNumber(total)}원
                  </span>
                </div>

                <Card className="divide-y divide-border-primary">
                  {items.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => navigate(`/asset/${asset.id}`)}
                      className="flex items-center w-full py-3 px-1 bg-transparent border-none cursor-pointer hover:bg-bg-card-hover transition-colors text-left"
                    >
                      {/* 아이콘 */}
                      <span className="text-2xl mr-3 shrink-0">
                        {ASSET_TYPE_ICONS[asset.type]}
                      </span>
                      {/* 이름 + 기관 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">
                          {asset.name}
                        </p>
                        {asset.institution && (
                          <p className="text-xs text-text-tertiary">
                            {asset.institution}
                          </p>
                        )}
                      </div>
                      {/* 잔액 */}
                      <div className="text-right shrink-0 ml-2">
                        <p
                          className={`text-sm font-medium ${type === 'loan' ? 'text-expense' : 'text-text-primary'}`}
                        >
                          {formatNumber(asset.balance)}원
                        </p>
                        {/* 증권 보유종목 수익/손실 표시 */}
                        {type === 'securities' &&
                          asset.holdings &&
                          asset.holdings.length > 0 &&
                          (() => {
                            const invested = asset.holdings!.reduce(
                              (s, h) => s + h.avgPrice * h.quantity,
                              0,
                            );
                            const current = asset.holdings!.reduce(
                              (s, h) => s + h.currentPrice,
                              0,
                            );
                            const diff = current - invested;
                            const pct =
                              invested > 0 ? (diff / invested) * 100 : 0;
                            return (
                              <p
                                className={`text-xs ${diff >= 0 ? 'text-expense' : 'text-blue-400'}`}
                              >
                                {diff >= 0 ? '▲' : '▼'}{' '}
                                {formatNumber(Math.abs(diff))}원(
                                {Math.abs(pct).toFixed(2)}%)
                              </p>
                            );
                          })()}
                      </div>
                    </button>
                  ))}
                </Card>
              </section>
            );
          })}
        </>
      )}

      {/* FAB: 자산 추가 */}
      <button
        type="button"
        onClick={() => navigate('/asset/new')}
        className="fixed bottom-20 right-4 z-20 w-14 h-14 rounded-full bg-accent text-white text-2xl font-bold shadow-lg hover:bg-accent-hover transition-colors flex items-center justify-center"
        aria-label="자산 추가"
      >
        +
      </button>
    </div>
  );
}
