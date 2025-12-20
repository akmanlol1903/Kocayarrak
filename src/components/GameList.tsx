import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import GameCard from './GameCard';

interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  image_url: string | null;
  screenshots: string[] | null;
  download_count: number;
  rating: number;
  created_by: string;
  created_at: string;
  profiles: { username: string } | null;
  developer: string[] | null;
  publisher: string[] | null;
  steam_appid: number | null;
}

interface TooltipData {
    title: string;
    developer: string;
    publisher: string;
}

interface GameListProps {
  onGameSelect: (game: { id: string; title: string; image_url: string | null }) => void;
  onShowTooltip: (data: TooltipData, e: React.MouseEvent) => void;
  onHideTooltip: () => void;
  onUpdateTooltipPosition: (e: React.MouseEvent) => void;
}

const GameList: React.FC<GameListProps> = ({ 
    onGameSelect, 
    onShowTooltip, 
    onHideTooltip, 
    onUpdateTooltipPosition 
}) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [exitingId, setExitingId] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('games')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching games:', error);
        return;
      }

      setGames(data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameClick = (game: Game) => {
    setExitingId(game.id);
    setTimeout(() => {
        onGameSelect(game);
    }, 500); 
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Grid'in düzgün görünmesi için toplam slot sayısını 4'ün katına yuvarlıyoruz.
  const MIN_SLOTS = 12;
  const rawTotal = Math.max(games.length, MIN_SLOTS);
  const totalSlots = Math.ceil(rawTotal / 4) * 4; 
  
  const slots = [...games, ...Array(Math.max(0, totalSlots - games.length)).fill(null)];
  const isExiting = exitingId !== null;

  // Satır sayıları
  const mobileRowCount = totalSlots / 2;
  const desktopRowCount = totalSlots / 4;

  return (
    <div className="relative">
      
      {/* --- GRID ÇİZGİLERİ KATMANI (Overlay) --- */}
      <div className="absolute inset-0 pointer-events-none z-10">
        
        {/* 1. DİKEY ÇİZGİLER (Vertical Lines)
            Animasyon: origin-top + scale-y-0 -> Aşağıdan yukarı doğru yok olur.
        */}
        {/* Sol Kenar */}
        <div className={`absolute top-0 left-0 w-px h-full bg-slate-700 transition-transform duration-500 ease-in-out origin-top ${isExiting ? 'scale-y-0' : 'scale-y-100'}`} />
        
        {/* %25 (Sadece Desktop) */}
        <div className={`hidden md:block absolute top-0 left-1/4 w-px h-full bg-slate-700 transition-transform duration-500 ease-in-out origin-top ${isExiting ? 'scale-y-0' : 'scale-y-100'}`} />
        
        {/* %50 (Hem Mobil Hem Desktop) */}
        <div className={`absolute top-0 left-1/2 w-px h-full bg-slate-700 transition-transform duration-500 ease-in-out origin-top ${isExiting ? 'scale-y-0' : 'scale-y-100'}`} />
        
        {/* %75 (Sadece Desktop) */}
        <div className={`hidden md:block absolute top-0 left-3/4 w-px h-full bg-slate-700 transition-transform duration-500 ease-in-out origin-top ${isExiting ? 'scale-y-0' : 'scale-y-100'}`} />
        
        {/* Sağ Kenar */}
        <div className={`absolute top-0 right-0 w-px h-full bg-slate-700 transition-transform duration-500 ease-in-out origin-top ${isExiting ? 'scale-y-0' : 'scale-y-100'}`} />


        {/* 2. YATAY ÇİZGİLER (Horizontal Lines)
            Animasyon: origin-left + scale-x-0 -> Sağdan sola doğru yok olur.
        */}
        
        {/* Üst Kenar */}
        <div className={`absolute top-0 left-0 w-full h-px bg-slate-700 transition-transform duration-500 ease-in-out origin-left ${isExiting ? 'scale-x-0' : 'scale-x-100'}`} />

        {/* Mobil Ara Çizgiler (2 Sütunlu Yapı İçin) */}
        <div className="md:hidden">
            {[...Array(mobileRowCount)].map((_, i) => (
                <div 
                    key={`mob-row-${i}`}
                    className={`absolute left-0 w-full h-px bg-slate-700 transition-transform duration-500 ease-in-out origin-left ${isExiting ? 'scale-x-0' : 'scale-x-100'}`}
                    style={{ top: `${((i + 1) / mobileRowCount) * 100}%` }}
                />
            ))}
        </div>

        {/* Desktop Ara Çizgiler (4 Sütunlu Yapı İçin) */}
        <div className="hidden md:block">
            {[...Array(desktopRowCount)].map((_, i) => (
                <div 
                    key={`desk-row-${i}`}
                    className={`absolute left-0 w-full h-px bg-slate-700 transition-transform duration-500 ease-in-out origin-left ${isExiting ? 'scale-x-0' : 'scale-x-100'}`}
                    style={{ top: `${((i + 1) / desktopRowCount) * 100}%` }}
                />
            ))}
        </div>

      </div>

      {/* --- OYUNLAR GRID'İ --- */}
      {/* Gap-0 kullanıyoruz çünkü çizgileri biz çizdik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 bg-slate-900">
        {slots.map((game, index) => {
            const shouldHide = exitingId !== null && game?.id !== exitingId;
            const isSelected = exitingId !== null && game?.id === exitingId;

            return (
              <div
                key={game ? game.id : `empty-${index}`}
                className={`
                    relative group aspect-square flex items-center justify-center overflow-hidden 
                    ${isSelected ? 'z-20' : 'z-0'}
                `}
              >
                {/* İçerik Animasyonu */}
                <div className={`
                    w-full h-full flex items-center justify-center 
                    transition-all duration-500 ease-in-out transform
                    ${shouldHide ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
                `}>
                    {game ? (
                      <GameCard
                        game={game}
                        onViewDetails={() => handleGameClick(game)}
                        onShowTooltip={onShowTooltip}
                        onHideTooltip={onHideTooltip}
                        onUpdateTooltipPosition={onUpdateTooltipPosition}
                      />
                    ) : (
                      <div className="w-full h-full"></div>
                    )}
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default GameList;