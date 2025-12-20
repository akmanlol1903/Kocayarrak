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

  const MIN_SLOTS = 12;
  const totalSlots = Math.max(games.length, MIN_SLOTS);
  const slots = [...games, ...Array(Math.max(0, totalSlots - games.length)).fill(null)];

  return (
    <div>
      {/* GÜNCELLEME: "Gap Grid" Tekniği 
         - gap-px: Kutular arasında 1px boşluk bırakır.
         - bg-slate-700: Bu boşluklardan görünen renk (yani ızgara çizgilerinin rengi).
         - border border-slate-700: En dış çerçeve.
         - border-r ve border-b kaldırıldı çünkü gap ve dış border bunu hallediyor.
      */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-700 border border-slate-700">
        {slots.map((game, index) => {
            const shouldHide = exitingId !== null && game?.id !== exitingId;
            const isSelected = exitingId !== null && game?.id === exitingId;

            return (
              <div
                key={game ? game.id : `empty-${index}`}
                // GÜNCELLEME:
                // - border-t, border-l GİBİ sınıflar kaldırıldı. Çizgileri artık "gap" oluşturuyor.
                // - bg-slate-900: Hücrenin rengi. Bu renk sayesinde arkadaki slate-700 sadece boşluklarda görünür.
                className={`relative group bg-slate-900 aspect-square flex items-center justify-center overflow-hidden 
                    ${isSelected ? 'z-10' : 'z-0'}
                `}
              >
                {/* İÇERİK ANİMASYONU: Sabit kaldı */}
                <div className={`w-full h-full flex items-center justify-center transition-all duration-500 ease-in-out transform ${
                    shouldHide ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                }`}>
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