// PIN 잠금 화면 — 설정/해제/입력 통합
import { useState, useCallback, useEffect } from 'react';
import { useAuthStore, hashPin } from '../store/auth-store';

type Mode = 'enter' | 'setup' | 'confirm';

export function PinLockScreen() {
  const { pinHash, unlock, setPinHash } = useAuthStore();

  const [mode, setMode] = useState<Mode>(pinHash ? 'enter' : 'setup');
  const [pin, setPin] = useState('');
  const [setupPin, setSetupPin] = useState(''); // setup 모드에서 첫 입력값 저장
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const PIN_LENGTH = 4;

  // 에러 시 흔들기 애니메이션
  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  // PIN 입력 완료 처리
  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;

    const handleComplete = async () => {
      if (mode === 'enter') {
        // PIN 검증
        const hash = await hashPin(pin);
        if (hash === pinHash) {
          unlock();
        } else {
          setError('PIN이 일치하지 않습니다');
          triggerShake();
          setPin('');
        }
      } else if (mode === 'setup') {
        // 첫 입력 → 확인 모드로
        setSetupPin(pin);
        setPin('');
        setMode('confirm');
        setError('');
      } else if (mode === 'confirm') {
        // 확인 입력
        if (pin === setupPin) {
          const hash = await hashPin(pin);
          setPinHash(hash);
          unlock();
        } else {
          setError('PIN이 일치하지 않습니다. 다시 입력해주세요.');
          triggerShake();
          setPin('');
          setSetupPin('');
          setMode('setup');
        }
      }
    };

    handleComplete();
  }, [pin, mode, pinHash, setupPin, unlock, setPinHash, triggerShake]);

  // 숫자 버튼 클릭
  const handleDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    setError('');
    setPin((prev) => prev + digit);
  };

  // 백스페이스
  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const title = mode === 'enter'
    ? 'PIN을 입력해주세요'
    : mode === 'setup'
      ? 'PIN을 설정해주세요'
      : 'PIN을 다시 입력해주세요';

  return (
    <div className="fixed inset-0 bg-bg-app z-[100] flex flex-col items-center justify-center select-none">
      <div className="w-full max-w-xs flex flex-col items-center px-6">
        {/* 자물쇠 아이콘 */}
        <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        {/* 타이틀 */}
        <p className="text-lg font-bold text-text-primary mb-2">{title}</p>
        {error && <p className="text-xs text-expense mb-2">{error}</p>}

        {/* PIN 도트 표시 */}
        <div className={`flex gap-4 mb-10 ${shake ? 'animate-shake' : ''}`}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                i < pin.length ? 'bg-accent scale-110' : 'bg-border-secondary'
              }`}
            />
          ))}
        </div>

        {/* 숫자 키패드 */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key) => {
            if (key === '') return <div key="empty" />;
            if (key === 'back') {
              return (
                <button
                  key="back"
                  type="button"
                  onClick={handleBackspace}
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-text-secondary active:bg-bg-elevated transition-colors bg-transparent border-none cursor-pointer"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                </button>
              );
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleDigit(key)}
                className="w-16 h-16 mx-auto rounded-full bg-bg-card text-text-primary text-2xl font-medium flex items-center justify-center active:bg-accent/20 transition-colors border border-border-primary cursor-pointer hover:bg-bg-elevated"
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* PIN 미설정 시 건너뛰기 */}
        {mode === 'setup' && (
          <button
            type="button"
            onClick={unlock}
            className="mt-6 text-sm text-text-tertiary bg-transparent border-none cursor-pointer hover:text-text-secondary"
          >
            나중에 설정하기
          </button>
        )}
      </div>
    </div>
  );
}
