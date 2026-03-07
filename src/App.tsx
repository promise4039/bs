import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout';
import { PinLockScreen } from './components/PinLockScreen';
import { useAuthStore } from './store/auth-store';
import HomePage from './pages/HomePage';
import TransactionsPage from './pages/TransactionsPage';
import StatsPage from './pages/StatsPage';
import SinkingFundPage from './pages/SinkingFundPage';
import SettingsPage from './pages/SettingsPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import CalendarPage from './pages/CalendarPage';
import ComparisonPage from './pages/ComparisonPage';
import CategoryManagePage from './pages/CategoryManagePage';
import AssetPage from './pages/AssetPage';
import AssetDetailPage from './pages/AssetDetailPage';
import AssetNewPage from './pages/AssetNewPage';

function App() {
  const { pinHash, isUnlocked } = useAuthStore();

  // PIN이 설정되어 있고 아직 잠금 해제 안 됐으면 잠금 화면 표시
  if (pinHash && !isUnlocked) {
    return <PinLockScreen />;
  }

  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/sinking-fund" element={<SinkingFundPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/assets" element={<AssetPage />} />
          <Route path="/asset/new" element={<AssetNewPage />} />
          <Route path="/asset/:assetId" element={<AssetDetailPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          <Route path="/category/:categoryName" element={<CategoryDetailPage />} />
          <Route path="/categories" element={<CategoryManagePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}

export default App;
