// 하단 탭 네비게이션 (뱅크샐러드 스타일 5탭)

import { useLocation, useNavigate } from 'react-router-dom';

interface TabItem {
  path: string;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { path: '/',              label: '홈',       icon: '🏠' },
  { path: '/assets',        label: '자산',     icon: '🏦' },
  { path: '/transactions',  label: '가계부',   icon: '📋' },
  { path: '/calendar',      label: '캘린더',   icon: '📅' },
  { path: '/stats',         label: '통계',     icon: '📊' },
];

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  // 현재 경로가 탭의 하위 경로인지 체크 (예: /transactions/detail → 가계부 활성)
  const isTabActive = (tabPath: string) => {
    if (tabPath === '/') return location.pathname === '/';
    return location.pathname.startsWith(tabPath);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-bg-tabbar/95 backdrop-blur-xl border-t border-border-primary">
      <div className="mx-auto max-w-lg flex items-center justify-around h-16 px-2">
        {TABS.map((tab) => {
          const active = isTabActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-colors duration-150 ${
                active ? 'text-accent' : 'text-text-tertiary'
              }`}
            >
              <span
                className="leading-none transition-transform duration-150"
                style={{ fontSize: '22px' }}
              >
                {tab.icon}
              </span>
              <span
                className={`font-medium leading-none transition-colors duration-150 ${
                  active ? 'text-accent' : 'text-text-tertiary'
                }`}
                style={{ fontSize: '11px' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* iOS safe area — 홈바 영역 */}
      <div className="pb-[env(safe-area-inset-bottom,8px)]" />
    </nav>
  );
}
