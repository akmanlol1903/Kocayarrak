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
  onGameSelect: (gameId: string) => void;
  // searchTerm prop'u buradan kaldırıldı
  onShowTooltip: (data: TooltipData, e: React.MouseEvent) => void;
  onHideTooltip: () => void;
  onUpdateTooltipPosition: (e: React.MouseEvent) => void;
}

const GameList: React.FC<GameListProps> = ({ 
    onGameSelect, 
    // searchTerm parametresi buradan kaldırıldı
    onShowTooltip, 
    onHideTooltip, 
    onUpdateTooltipPosition 
}) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

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

  // filteredGames mantığı kaldırıldı, doğrudan games state'i kullanılıyor.

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Minimum 12 slot mantığı: Artık filteredGames yerine direkt games kullanılıyor.
  const MIN_SLOTS = 12;
  const totalSlots = Math.max(games.length, MIN_SLOTS);
  // Slot dizisini oluştur (Oyun varsa oyunu koy, yoksa null koy)
  const slots = [...games, ...Array(Math.max(0, totalSlots - games.length)).fill(null)];

  return (
    <div>
      {/* Grid yapısı ve kenarlıklar */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-r border-b border-slate-700">
        {slots.map((game, index) => (
          <div
            key={game ? game.id : `empty-${index}`}
            // Grid hücresi stilleri: Arkaplan, kenarlıklar ve kare boyut (aspect-square)
            className="relative group bg-slate-900 border-t border-l border-slate-700 aspect-square flex items-center justify-center overflow-hidden"
          >
            {game ? (
              <GameCard
                game={game}
                onViewDetails={onGameSelect}
                onShowTooltip={onShowTooltip}
                onHideTooltip={onHideTooltip}
                onUpdateTooltipPosition={onUpdateTooltipPosition}
              />
            ) : (
              // Oyun olmayan boş slot
              <div className="w-full h-full"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameList;