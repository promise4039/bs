// 뱅크샐러드 스타일 바텀 시트 (거의 풀스크린, IMG_1501 참고)
import type { ReactNode } from 'react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black/60 z-40 animate-fade-overlay" onClick={onClose} />

      {/* 시트 — 거의 풀스크린 */}
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
                className="w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors text-xl ml-auto"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 콘텐츠 — 스크롤 가능 */}
          <div className="flex-1 overflow-y-auto px-5">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
