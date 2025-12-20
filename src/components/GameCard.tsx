import React from 'react';

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

interface GameCardProps {
  game: Game;
  onViewDetails: (gameId: string) => void;
  onShowTooltip: (data: TooltipData, e: React.MouseEvent) => void;
  onHideTooltip: () => void;
  onUpdateTooltipPosition: (e: React.MouseEvent) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onViewDetails, onShowTooltip, onHideTooltip, onUpdateTooltipPosition }) => {
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    const developerText = game.developer?.join(', ') || '';
    const publisherText = game.publisher?.join(', ') || '';
    
    if (!developerText && !publisherText) {
        onShowTooltip({ 
            title: game.title, 
            developer: game.profiles?.username || 'Unknown Studio',
            publisher: ''
        }, e);
    } else {
        onShowTooltip({ 
            title: game.title, 
            developer: developerText, 
            publisher: publisherText 
        }, e);
    }
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center p-4 sm:p-8 cursor-pointer hover:bg-slate-800 transition-colors duration-300"
      onClick={() => onViewDetails(game.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onHideTooltip}
      onMouseMove={onUpdateTooltipPosition}
    >
      <img
        src={game.image_url || 'https://images.pexels.com/photos/275033/pexels-photo-275033.jpeg?auto=compress&cs=tinysrgb&w=800'}
        alt={game.title}
        // Benzersiz geçiş ismi veriyoruz
        style={{ viewTransitionName: `game-image-${game.id}` } as React.CSSProperties}
        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
      />
    </div>
  );
};

export default GameCard;