// 뱅크샐러드 스타일 바텀 시트 (거의 풀스크린, IMG_1501 참고)
// Portal로 body에 직접 렌더링하여 z-index 문제 해결
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children, footer }: BottomSheetProps) {
  // 배경 스크롤 방지 — body + 메인 스크롤 컨테이너 모두 잠금
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const mainEl = document.getElementById('app-main-scroll');
      if (mainEl) mainEl.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
        if (mainEl) mainEl.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black/60 z-40 animate-fade-overlay" onClick={onClose} />

      {/* 시트 — 거의 풀스크린, 탭바 위에 표시 */}
      <div className="fixed inset-x-0 bottom-0 top-10 z-50 flex justify-center animate-slide-up">
        <div className="w-full max-w-lg bg-bg-card rounded-t-[20px] flex flex-col h-full">
          {/* 헤더 */}
          <div className="shrink-0 rounded-t-[20px]">
            <div className="flex justify-center">
              <div className="w-9 h-1 bg-text-tertiary/50 rounded-full mt-3 mb-2" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2">
              {title && (
                <span className="text-lg font-bold text-text-primary">{title}</span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors text-xl ml-auto bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 콘텐츠 — 스크롤 가능 */}
          <div className="flex-1 overflow-y-auto px-5 overscroll-contain">
            {children}
          </div>

          {/* 하단 고정 영역 (저장 버튼 등) — 스크롤 밖에 위치 */}
          {footer && (
            <div className="shrink-0 px-5 pt-3 pb-8 bg-bg-card">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
