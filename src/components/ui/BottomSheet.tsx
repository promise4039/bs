// 뱅크샐러드 스타일 바텀 시트 (아래에서 올라오는 모달)
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

      {/* 시트 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center animate-slide-up">
        <div className="w-full max-w-lg bg-bg-card rounded-t-[20px] relative" style={{ maxHeight: '90vh' }}>
          {/* 헤더: 드래그 핸들 + 닫기 버튼 */}
          <div className="sticky top-0 z-10 bg-bg-card rounded-t-[20px]">
            <div className="flex justify-center">
              <div className="w-9 h-1 bg-text-tertiary/50 rounded-full mt-3 mb-2" />
            </div>
            {title && (
              <div className="flex items-center justify-between px-5 pb-3">
                <span className="text-lg font-bold text-text-primary">{title}</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors text-xl"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* 콘텐츠 */}
          <div className="px-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
