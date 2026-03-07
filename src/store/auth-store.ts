// PIN 잠금 인증 스토어
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  /** SHA-256 해시된 PIN (null이면 PIN 미설정) */
  pinHash: string | null;
  /** 현재 세션에서 인증 완료 여부 (비영속) */
  isUnlocked: boolean;

  setPinHash: (hash: string | null) => void;
  unlock: () => void;
  lock: () => void;
}

/** 간단한 SHA-256 해시 (Web Crypto API) */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      pinHash: null,
      isUnlocked: false,

      setPinHash: (hash) => set({ pinHash: hash }),
      unlock: () => set({ isUnlocked: true }),
      lock: () => set({ isUnlocked: false }),
    }),
    {
      name: 'bs_auth',
      // isUnlocked는 영속하지 않음 (앱 재시작 시 항상 잠금)
      partialize: (state) => ({ pinHash: state.pinHash }),
    },
  ),
);
