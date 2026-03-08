// 앱 전체 레이아웃 셸 — 뱅크샐러드 스타일

import { TabBar } from './TabBar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-full flex flex-col bg-bg-app">
      {/* 상단 safe area (노치/다이나믹아일랜드 대응) */}
      <div className="pt-[env(safe-area-inset-top,0px)]" />

      {/* 메인 콘텐츠 영역 — 하단 탭바 + safe area 높이만큼 padding */}
      <main id="app-main-scroll" className="flex-1 overflow-y-auto pb-28">
        <div className="mx-auto max-w-lg px-4 pt-2">
          {children}
        </div>
      </main>

      {/* 하단 탭 네비게이션 */}
      <TabBar />
    </div>
  );
}
