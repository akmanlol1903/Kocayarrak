import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Shield, Home, Upload, Search, Menu, X, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Arama sonuçları için tip tanımı
type SearchResult = {
    id: string;
    title: string;
    category: string;
    steam_appid: number | null;
    image_url: string | null;
}

interface HeaderProps {
    onViewChange: (view: string) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onGameSelect: (gameId: string) => void;
    isHeaderSidebar: boolean;
}

const Header: React.FC<HeaderProps> = ({ onViewChange, searchTerm, setSearchTerm, onGameSelect, isHeaderSidebar }) => {
    const { user, signOut, isAdmin } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
  
    // Dinamik yükseklik için referanslar
    const searchContentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(0);
  
    useEffect(() => {
      if (isSearchOpen && searchContentRef.current) {
        setContentHeight(searchContentRef.current.scrollHeight);
      } else {
        setContentHeight(0);
      }
    }, [isSearchOpen, searchResults, isSearching]);
  
  
    const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;
      setSearchTerm(term);
  
      if (term.trim().length > 1) {
          setIsSearching(true);
          try {
              const { data, error } = await supabase
                  .from('games')
                  .select('id, title, category, steam_appid, image_url')
                  .ilike('title', `%${term}%`)
                  .limit(5);
  
              if (error) throw error;
              setSearchResults(data || []);
  
          } catch (error) {
              console.error('Error searching games:', error);
              setSearchResults([]);
          } finally {
              setIsSearching(false);
          }
      } else {
          setSearchResults([]);
      }
    };
  
    const handleNavClick = (view: string) => {
      onViewChange(view);
      setIsMenuOpen(false);
      setIsSearchOpen(false);
    }
  
    const handleSignOut = async () => {
      await signOut();
      setIsMenuOpen(false);
      onViewChange('home');
    }
  
    const navItems = [
      { view: 'home', label: 'Home', requiredAuth: false },
      { view: 'profile', label: 'Profile', requiredAuth: true },
      { view: 'admin', label: 'Admin', requiredAuth: true, requiredAdmin: true },
      { view: 'upload', label: 'Upload', requiredAuth: true, requiredAdmin: true },
    ];
  
    const mainHeaderContent = () => {
      if (isSearchOpen) {
        return <span className="text-xl font-bold text-white tracking-widest">SEARCH</span>;
      }
      return (
        <div onClick={() => handleNavClick('home')} className="flex items-center gap-2 cursor-pointer">
          <span className="text-xl font-black text-white hidden sm:block">KOCAYARRAK</span>
        </div>
      );
    };
  
    const headerHeight = 55 + (isSearchOpen ? contentHeight : 0) + (isMenuOpen ? 280 : 0);
  
    const handleSearchIconClick = () => {
      if (isSearchOpen) {
        setIsSearchOpen(false);
        setSearchTerm('');
        setSearchResults([]);
      } else {
        setIsSearchOpen(true);
        setIsMenuOpen(false);
      }
    };

    const getSearchResultImage = (game: SearchResult) => {
        if (game.steam_appid) {
            return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.steam_appid}/capsule_sm_120.jpg`;
        }
        return game.image_url || 'https://via.placeholder.com/120x45?text=No+Image';
    };
  
    return (
      <>
        <div 
          className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isMenuOpen || isSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => {
              setIsMenuOpen(false);
              setIsSearchOpen(false);
              setSearchTerm('');
              setSearchResults([]);
          }}
        />
  
        <header className={`fixed top-6 left-0 right-0 z-50 flex justify-center transition-transform duration-500 ease-in-out ${isHeaderSidebar ? 'translate-x-[calc(50vw-240px)]' : ''}`}>
          <div 
            className="relative w-[590px] bg-slate-800/70 backdrop-blur-md border border-slate-700 shadow-lg transition-[height] duration-300 ease-in-out"
            style={{ height: `${headerHeight}px` }}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between h-[55px] px-0 flex-shrink-0">
                <div className="flex-1 flex justify-start">
                  <button 
                    onClick={() => { setIsMenuOpen(!isMenuOpen); setIsSearchOpen(false); }} 
                    className="w-[50px] h-[55px] flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                  >
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </button>
                </div>
                
                <div className="flex-1 flex justify-center transition-opacity duration-300">
                  {mainHeaderContent()}
                </div>
  
                <div className="flex-1 flex justify-end">
                  <button 
                    onClick={handleSearchIconClick} 
                    className="w-[50px] h-[55px] flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                  >
                    {isSearchOpen ? <X className="h-6 w-6" /> : <Search className="h-6 w-6" />}
                  </button>
                </div>
              </div>
  
              <div className="flex-grow overflow-hidden flex flex-col">
                {isSearchOpen && (
                  <div ref={searchContentRef} className="overflow-hidden">
                    <div className="p-4 space-y-4">
                      <form onSubmit={(e) => e.preventDefault()} className="w-full flex-shrink-0">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={handleSearchChange}
                          className="w-full bg-transparent text-white font-bold tracking-wider uppercase text-lg focus:outline-none"
                          autoFocus
                          placeholder="SEARCH GAMES..."
                        />
                      </form>
                      
                      {(isSearching || searchResults.length > 0 || (searchTerm.length > 1 && !isSearching)) && (
                        <hr className="border-t border-gray-700 flex-shrink-0" />
                      )}
  
                      <div className="overflow-y-auto">
                        <ul className="flex flex-col">
                            {searchResults.map((game) => (
                                <li
                                    key={game.id}
                                    onClick={() => {
                                        onGameSelect(game.id);
                                        setIsSearchOpen(false);
                                        setSearchTerm('');
                                        setSearchResults([]);
                                    }}
                                    className="relative group cursor-pointer overflow-hidden border-b border-gray-700 last:border-b-0"
                                >
                                    <div className="absolute bottom-0 left-0 w-full h-0 bg-black group-hover:h-full transition-all duration-300 ease-in-out z-0"></div>
                                    <div className="relative z-10 flex justify-between items-center py-3 px-0 gap-3 transition-all duration-300 ease-in-out group-hover:px-4">
                                        <div className="flex-shrink-0 w-[100px] flex items-center justify-center bg-slate-900 overflow-hidden">
                                            <img 
                                                src={getSearchResultImage(game)} 
                                                alt={game.title}
                                                className="w-full h-auto"
                                            />
                                        </div>
                                        
                                        <div className="flex-grow min-w-0">
                                            <p className="font-bold text-sm text-white truncate transition-colors">
                                                {game.title.toUpperCase()}
                                            </p>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" />
                                    </div>
                                </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
  
                {isMenuOpen && (
                  <div className="h-full flex flex-col justify-center items-center">
                    <nav className="flex flex-col items-center text-center">
                      {navItems.map(item => {
                        if (item.requiredAuth && !user) return null;
                        if (item.requiredAdmin && !isAdmin) return null;
                        return (
                          <button
                            key={item.view}
                            onClick={() => handleNavClick(item.view)}
                            className="h-[35px] flex items-center justify-center text-2xl font-black text-gray-300 hover:text-white transition-colors uppercase"
                          >
                            {item.label}
                          </button>
                        );
                      })}
                      {user ? (
                        <button onClick={handleSignOut} className="h-[35px] flex items-center justify-center text-2xl font-black text-red-400 hover:text-red-300 transition-colors uppercase">Sign Out</button>
                      ) : (
                        <>
                          <button onClick={() => handleNavClick('login')} className="h-[35px] flex items-center justify-center text-2xl font-black text-gray-300 hover:text-white transition-colors uppercase">Login</button>
                          <button onClick={() => handleNavClick('register')} className="h-[35px] flex items-center justify-center text-2xl font-black text-gray-300 hover:text-white transition-colors uppercase">Sign Up</button>
                        </>
                      )}
                    </nav>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      </>
    );
};
  
export default Header;