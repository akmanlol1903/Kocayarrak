import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import GameList from './components/GameList';
import GameDetails from './components/GameDetails';
import AuthForm from './components/AuthForm';
import AdminPanel from './components/AdminPanel';
import GameUpload from './components/GameUpload';
import Profile from './components/Profile';

interface TooltipData {
  title: string;
  developer: string;
  publisher: string;
}

// Seçilen oyun için basit bir tip tanımı
interface SelectedGame {
  id: string;
  title: string;
  image_url: string | null;
}

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'register' | 'admin' | 'upload' | 'profile' | 'game-details'>('home');
  const [selectedGame, setSelectedGame] = useState<SelectedGame | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [searchTerm, setSearchTerm] = useState('');
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipSide, setTooltipSide] = useState<'left' | 'right'>('right');
  const [isHeaderSidebar, setIsHeaderSidebar] = useState(false);

  const handleGameSelect = (game: SelectedGame) => {
    setTooltipVisible(false);
    
    // View Transition API desteği varsa animasyonlu geçiş yap
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => {
          setSelectedGame(game);
          setCurrentView('game-details');
          setIsHeaderSidebar(true);
        });
      });
    } else {
      setSelectedGame(game);
      setCurrentView('game-details');
      setIsHeaderSidebar(true);
    }
  };

  const handleViewChange = (view: string) => {
    // View Transition ile sayfa değişimi
    const updateView = () => {
      setCurrentView(view as any);
      if (view === 'login') {
        setAuthMode('login');
      } else if (view === 'register') {
        setAuthMode('register');
      }
      if (view !== 'game-details') {
          setIsHeaderSidebar(false);
      }
    };

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(updateView);
      });
    } else {
      updateView();
    }
  };

  const handleBackFromDetails = () => {
    if (document.startViewTransition) {
        document.startViewTransition(() => {
            flushSync(() => {
                setCurrentView('home');
                setIsHeaderSidebar(false);
            });
        });
    } else {
        setCurrentView('home');
        setIsHeaderSidebar(false);
    }
  }

  const updateTooltipSide = (xPosition: number) => {
    if (xPosition > window.innerWidth / 2) {
      setTooltipSide('left');
    } else {
      setTooltipSide('right');
    }
  };

  const handleShowTooltip = (data: TooltipData, e: React.MouseEvent) => {
    setTooltipData(data);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
    updateTooltipSide(e.clientX);
    setTooltipVisible(true);
  };

  const handleHideTooltip = () => {
    setTooltipVisible(false);
  };

  const handleUpdateTooltipPosition = (e: React.MouseEvent) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
    updateTooltipSide(e.clientX);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user && (currentView === 'login' || currentView === 'register')) {
    return (
      <AuthForm
        mode={authMode}
        onModeChange={setAuthMode}
      />
    );
  }

  if (!user && (currentView === 'admin' || currentView === 'upload' || currentView === 'profile')) {
    setCurrentView('home');
  }

  const tooltipStyle: React.CSSProperties = {
    top: tooltipPosition.y,
    transform: 'translateY(-50%)',
    ...(tooltipSide === 'right' 
      ? { left: tooltipPosition.x + 20 } 
      : { right: window.innerWidth - tooltipPosition.x + 20 }),
  };

  return (
    <>
      <Layout
        isHeaderSidebar={isHeaderSidebar}
        currentView={currentView}
        onViewChange={handleViewChange}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onGameSelect={(id) => {
            // Header search için uyumluluk
            handleGameSelect({ id, title: '', image_url: null });
        }}
      >
        {currentView === 'home' && (
          <GameList 
              onGameSelect={handleGameSelect} 
              onShowTooltip={handleShowTooltip}
              onHideTooltip={handleHideTooltip}
              onUpdateTooltipPosition={handleUpdateTooltipPosition}
          />
        )}
        {currentView === 'game-details' && selectedGame && (
          <GameDetails 
            gameId={selectedGame.id} 
            initialData={selectedGame}
            onBack={handleBackFromDetails} 
          />
        )}
        {currentView === 'admin' && user && (
          <AdminPanel />
        )}
        {currentView === 'upload' && user && (
          <GameUpload />
        )}
        {currentView === 'profile' && user && (
          <Profile />
        )}
      </Layout>
      {/* Global Tooltip */}
      {tooltipVisible && tooltipData && (
        <div
          className="fixed z-50 pointer-events-none"
          style={tooltipStyle}
        >
          <div className="relative">
            {/* Üst Kutu */}
            <div className="bg-white text-black text-lg font-black uppercase px-3 py-1 border border-black shadow-lg">
              {tooltipData.title}
            </div>
            {/* Alt Kutu */}
            {(tooltipData.developer || tooltipData.publisher) && (
              <div className="absolute top-full left-0 -mt-px whitespace-nowrap bg-white text-black text-sm font-semibold px-3 py-2 border border-black shadow-lg flex flex-col space-y-1">
                {tooltipData.developer && <p><span className="font-bold">Geliştirici:</span> {tooltipData.developer}</p>}
                {tooltipData.publisher && <p><span className="font-bold">Yayıncı:</span> {tooltipData.publisher}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;