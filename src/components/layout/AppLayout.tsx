// 앱 전체 레이아웃 셸

import { TabBar } from './TabBar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-full flex flex-col bg-bg-app">
      {/* 메인 콘텐츠 영역 - 하단 탭바 + safe area 높이만큼 padding */}
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="mx-auto max-w-lg px-4 pt-2">
          {children}
        </div>
      </main>
      <TabBar />
    </div>
  );
}
