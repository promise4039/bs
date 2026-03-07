// 하단 탭 네비게이션 (뱅크샐러드 스타일 5탭)

import { useLocation, useNavigate } from 'react-router-dom';

interface TabItem {
  path: string;
  label: string;
  icon: string;
  iconActive: string;
}

const TABS: TabItem[] = [
  { path: '/',              label: '홈',       icon: '🏠', iconActive: '🏠' },
  { path: '/assets',        label: '자산',     icon: '🏦', iconActive: '🏦' },
  { path: '/transactions',  label: '가계부',   icon: '📋', iconActive: '📋' },
  { path: '/calendar',      label: '캘린더',   icon: '📅', iconActive: '📅' },
  { path: '/stats',         label: '통계',     icon: '📊', iconActive: '📊' },
];

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-bg-tabbar/95 backdrop-blur-xl border-t border-border-primary">
      <div className="mx-auto max-w-lg flex items-center justify-around h-16 px-2">
        {TABS.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors ${
                isActive ? 'text-accent' : 'text-text-tertiary'
              }`}
            >
              <span className="text-xl leading-none">
                {isActive ? tab.iconActive : tab.icon}
              </span>
              <span className={`text-[10px] font-medium ${
                isActive ? 'text-accent' : 'text-text-tertiary'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* iOS safe area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
