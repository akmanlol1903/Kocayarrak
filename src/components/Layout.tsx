import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onGameSelect: (gameId: string) => void;
  isHeaderSidebar: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange, searchTerm, setSearchTerm, onGameSelect, isHeaderSidebar }) => {
  const isFullScreenView = currentView === 'home' || currentView === 'game-details';

  const mainContentClass = isFullScreenView
    ? ""
    : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

  const mainContentStyle: React.CSSProperties = {
    paddingTop: !isFullScreenView ? '96px' : '0'
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header 
        onViewChange={onViewChange}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onGameSelect={onGameSelect}
        isHeaderSidebar={isHeaderSidebar}
      />
      <main className={mainContentClass} style={mainContentStyle}>
        {children}
      </main>
    </div>
  );
};

export default Layout;