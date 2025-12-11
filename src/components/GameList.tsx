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
  searchTerm: string;
  onShowTooltip: (data: TooltipData, e: React.MouseEvent) => void;
  onHideTooltip: () => void;
  onUpdateTooltipPosition: (e: React.MouseEvent) => void;
}

const GameList: React.FC<GameListProps> = ({ 
    onGameSelect, 
    searchTerm, 
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

  const filteredGames = games.filter(game =>
    game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Minimum 12 slot mantığı: Eğer oyun sayısı 12'den azsa 12'ye tamamla, fazlaysa oyun sayısı kadar slot oluştur.
  const MIN_SLOTS = 12;
  const totalSlots = Math.max(filteredGames.length, MIN_SLOTS);
  // Slot dizisini oluştur (Oyun varsa oyunu koy, yoksa null koy)
  const slots = [...filteredGames, ...Array(Math.max(0, totalSlots - filteredGames.length)).fill(null)];

  return (
    <div>
      {/* Grid yapısı ve kenarlıklar burada tanımlanıyor */}
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
      
      {/* Eğer hiç oyun bulunamadıysa ve arama yapılıyorsa mesaj göster (ancak gridler hala görünür) */}
      {filteredGames.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No games found matching "{searchTerm}"</div>
        </div>
      )}
    </div>
  );
};

export default GameList;