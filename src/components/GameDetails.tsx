import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Star, Loader2, Send, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/supabase';

// Tipler
type Game = Database['public']['Tables']['games']['Row'];
type Comment = Database['public']['Tables']['comments']['Row'] & {
  profiles: { username: string; avatar_url: string | null; };
};
interface SteamDetails {
  about_the_game: string;
  screenshots: { id: number; url:string }[];
  pc_requirements: { minimum: string; recommended?: string };
  short_description: string;
  release_date: { coming_soon: boolean; date: string };
}

// AccordionSection bileşeni
const AccordionSection = React.memo(({ id, title, children, isOpen, onToggle }: {
  id: string;
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <div className="relative group overflow-hidden border-b border-gray-700 last:border-b-0">
    <div className="absolute bottom-0 left-0 w-full h-0 bg-black group-hover:h-full transition-all duration-300 ease-in-out z-0"></div>
    <button
      onClick={onToggle}
      className="relative z-10 w-full flex justify-between items-center p-4 cursor-pointer"
    >
      <span className="font-bold text-sm text-white transition-colors">
        {title.toUpperCase()}
      </span>
      <ChevronDown
        className={`h-5 w-5 text-gray-400 group-hover:text-white transition-transform duration-300 ${
          isOpen ? 'rotate-180' : ''
        }`}
      />
    </button>
    <div
      className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden relative z-10">
        <div className="px-4 pb-4 cursor-pointer" onClick={onToggle}>
          {children}
        </div>
      </div>
    </div>
  </div>
));

interface GameDetailsProps {
  gameId: string;
  initialData?: { id: string; title: string; image_url: string | null };
  onBack: () => void;
}

const GameDetails: React.FC<GameDetailsProps> = ({ gameId, initialData, onBack }) => {
  const { user } = useAuth();
  
  // State'i initialData ile başlatıyoruz ki resim hemen var olsun
  const [game, setGame] = useState<Game | null>(
    initialData 
      ? ({ 
          ...initialData, 
          description: '', 
          category: '', 
          file_url: '', 
          screenshots: [], 
          download_count: 0, 
          rating: 0, 
          created_by: '', 
          created_at: '',
          developer: null,
          publisher: null,
          steam_appid: null
        } as unknown as Game) 
      : null
  );

  const [steamDetails, setSteamDetails] = useState<SteamDetails | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState('');
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);

  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: gameData, error: gameError } = await supabase.from('games').select('*').eq('id', gameId).single();
        if (gameError || !gameData) throw new Error("Oyun bulunamadı.");
        setGame(gameData);

        if (!gameData.developer && !gameData.publisher) {
          const { data: profileData } = await supabase.from('profiles').select('username').eq('id', gameData.created_by).single();
          setCreatorName(profileData?.username || 'Anonymous');
        }

        fetchComments(gameId);

        if (gameData.steam_appid) {
          const { data: steamData, error: steamError } = await supabase.functions.invoke('steam-get-details', {
            body: { appId: gameData.steam_appid },
          });
          if (steamError || !steamData.success) {
            console.warn("Steam detayları alınamadı:", steamError || steamData.message);
          } else {
            setSteamDetails(steamData);
            if (steamData.screenshots && steamData.screenshots.length > 0) {
              const screenshotUrls = steamData.screenshots.map((ss: { url: string }) => ss.url);
              setGame(prevGame => prevGame ? { ...prevGame, screenshots: screenshotUrls } : null);
            }
          }
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  const fetchComments = async (currentGameId: string) => {
    const { data, error } = await supabase.from('comments').select('*, profiles(username, avatar_url)').eq('game_id', currentGameId).order('created_at', { ascending: false });
    if (error) {
      console.error("Error fetching comments:", error);
    } else {
      setComments(data || []);
    }
  };

  const handleToggleSection = (sectionId: string) => {
    setOpenSection(prev => (prev === sectionId ? null : sectionId));
  };
  
  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    setSubmitting(true);
    try {
        await supabase.from('comments').insert([{ game_id: gameId, user_id: user.id, content: newComment.trim(), rating: newRating }]);
        setNewComment('');
        setNewRating(5);
        fetchComments(gameId);
    } catch (e: any) {
        console.error("Error submitting comment:", e);
    } finally {
        setSubmitting(false);
    }
  };
  
  const handleDownload = async () => {
    if (!game) return;
    try {
        await supabase.from('games').update({ download_count: (game.download_count || 0) + 1 }).eq('id', game.id);
        let downloadLink = game.file_url;
        if (downloadLink.includes('drive.google.com')) {
            const fileIdMatch = downloadLink.match(/drive\.google\.com\/file\/d\/([^/]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
                downloadLink = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
            }
        }
        window.open(downloadLink, '_blank');
        setGame(prev => prev ? { ...prev, download_count: (prev.download_count || 0) + 1 } : null);
    } catch (error: any) {
        console.error('Download failed:', error.message);
    }
  };
  
  const handleNextScreenshot = () => {
    const screenshots = game?.screenshots || [];
    if (currentScreenshotIndex < screenshots.length - 1) {
      setCurrentScreenshotIndex(currentScreenshotIndex + 1);
    }
  };
  
  const handlePrevScreenshot = () => {
    if (currentScreenshotIndex > 0) {
      setCurrentScreenshotIndex(currentScreenshotIndex - 1);
    }
  };

  // initialData sayesinde game varsa render başlar
  if (loading && !game) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-purple-500" /></div>;
  if (error) return <div className="text-center text-red-400 p-8">{error}</div>;
  if (!game) return null;

  const screenshots = game.screenshots || [];
  const hasScreenshots = screenshots.length > 0;

  return (
    <div className="bg-slate-900 text-white min-h-screen">
        <div className="lg:grid lg:grid-cols-[1fr_640px]">
            {/* Sol Sütun (Ekran Görüntüleri) */}
            <div className="relative lg:h-screen bg-black">
                {hasScreenshots ? (
                  <img 
                      src={screenshots[currentScreenshotIndex]} 
                      alt={`${game.title} screenshot ${currentScreenshotIndex + 1}`} 
                      className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {loading ? <Loader2 className="animate-spin text-purple-500" /> : <p className="text-gray-500">No screenshots available.</p>}
                  </div>
                )}
                <div className="absolute top-5 left-5">
                    <button onClick={onBack} className="relative group overflow-hidden flex items-center justify-center h-[50px] w-[50px] border border-slate-700 bg-slate-900/50 backdrop-blur-sm">
                        <div className="absolute bottom-0 left-0 w-full h-0 bg-black/50 group-hover:h-full transition-all duration-300 ease-in-out z-0"></div>
                        <ArrowLeft className="relative z-10 h-6 w-6" />
                    </button>
                </div>
                {hasScreenshots && (
                  <div className="absolute bottom-5 left-5 flex">
                      <button
                          onClick={handlePrevScreenshot}
                          disabled={currentScreenshotIndex === 0}
                          className="relative group overflow-hidden flex items-center justify-center h-[50px] w-[50px] border border-r-0 border-slate-700 bg-slate-900/50 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <div className="absolute bottom-0 left-0 w-full h-0 bg-black/50 group-hover:h-full transition-all duration-300 ease-in-out z-0"></div>
                          <ChevronLeft className={`relative z-10 h-6 w-6 transition-colors ${currentScreenshotIndex === 0 ? 'text-slate-600' : 'text-white'}`} />
                      </button>
                      <button
                          onClick={handleNextScreenshot}
                          disabled={currentScreenshotIndex === screenshots.length - 1}
                          className="relative group overflow-hidden flex items-center justify-center h-[50px] w-[50px] border border-slate-700 bg-slate-900/50 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <div className="absolute bottom-0 left-0 w-full h-0 bg-black/50 group-hover:h-full transition-all duration-300 ease-in-out z-0"></div>
                          <ChevronRight className={`relative z-10 h-6 w-6 transition-colors ${currentScreenshotIndex === screenshots.length - 1 ? 'text-slate-600' : 'text-white'}`} />
                      </button>
                  </div>
                )}
            </div>
            
            {/* Sağ Sütun (Bilgiler) */}
            <div className="lg:h-screen lg:overflow-y-auto border-l border-black bg-slate-900 lg:pt-[100px] lg:px-6 lg:pb-6 p-6">
                <div>
                    <img 
                        src={game.image_url || 'https://via.placeholder.com/1280x720'} 
                        alt={game.title} 
                        // BURASI KRİTİK: GameCard'daki aynı ID ile viewTransitionName veriyoruz.
                        style={{ viewTransitionName: `game-image-${gameId}` } as React.CSSProperties}
                        className="w-full h-auto object-cover border border-slate-700"
                    />
                    <div className="border-b border-slate-700 mt-2 pb-2">
                        <h1 className="text-[32px] font-black uppercase tracking-wider mb-2">{game.title}</h1>
                        <div className="text-slate-400 text-sm">
                            {/* Veriler yükleniyorsa iskelet göster */}
                            {loading && !steamDetails ? (
                                <div className="animate-pulse flex space-x-4"><div className="h-4 bg-slate-700 rounded w-3/4"></div></div>
                            ) : (
                                <>
                                    {(steamDetails?.release_date?.date || game.created_at) && (
                                        <p className="mb-2">
                                            Çıkış Tarihi: {steamDetails?.release_date?.date 
                                                ? steamDetails.release_date.date 
                                                : new Date(game.created_at).toLocaleDateString()}
                                        </p>
                                    )}
                                    <div>
                                        {game.developer && game.developer.length > 0 && <p>Geliştirici: {game.developer.join(', ')}</p>}
                                        {game.publisher && game.publisher.length > 0 && <p>Yayıncı: {game.publisher.join(', ')}</p>}
                                        {(!game.developer || game.developer.length === 0) && (!game.publisher || game.publisher.length === 0) && <p>Yükleyen: {creatorName}</p>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* Açıklama ve diğer bölümler */}
                    <p className="text-slate-300 leading-relaxed text-sm mt-6">
                        {loading && !steamDetails && !game.description ? "Loading details..." : (steamDetails?.short_description || game.description)}
                    </p>

                    <div className="border-t border-slate-700 mt-6">
                        <div className="relative group cursor-pointer overflow-hidden border-b border-gray-700">
                            <div className="absolute bottom-0 left-0 w-full h-0 bg-black group-hover:h-full transition-all duration-300 ease-in-out z-0"></div>
                            <button onClick={handleDownload} disabled={loading && !game.file_url} className="relative z-10 w-full flex justify-between items-center p-4 disabled:opacity-50">
                                <span className="font-bold text-sm text-white transition-colors">DOWNLOAD</span>
                                <Download className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                        {steamDetails && (
                            <AccordionSection id="about" title="ABOUT" isOpen={openSection === 'about'} onToggle={() => handleToggleSection('about')}>
                                <div className="prose prose-invert text-gray-300 max-w-none text-sm" dangerouslySetInnerHTML={{ __html: steamDetails.about_the_game }} />
                            </AccordionSection>
                        )}
                        {steamDetails?.pc_requirements?.minimum && (
                            <AccordionSection id="requirements" title="SYSTEM REQUIREMENTS" isOpen={openSection === 'requirements'} onToggle={() => handleToggleSection('requirements')}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="font-semibold text-purple-400 mb-2 text-sm">MINIMUM:</h3>
                                        <div className="text-gray-300 prose prose-invert max-w-none prose-sm text-sm" dangerouslySetInnerHTML={{ __html: steamDetails.pc_requirements.minimum }} />
                                    </div>
                                    {steamDetails.pc_requirements.recommended && (
                                        <div>
                                            <h3 className="font-semibold text-purple-400 mb-2 text-sm">RECOMMENDED:</h3>
                                            <div className="text-gray-300 prose prose-invert max-w-none prose-sm text-sm" dangerouslySetInnerHTML={{ __html: steamDetails.pc_requirements.recommended }} />
                                        </div>
                                    )}
                                </div>
                            </AccordionSection>
                        )}
                        <AccordionSection id="comments" title="COMMENTS & REVIEWS" isOpen={openSection === 'comments'} onToggle={() => handleToggleSection('comments')}>
                            {user && (
                                <div className="bg-slate-800/50 p-4 mb-6">
                                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write your review..." className="w-full bg-slate-800 text-white p-3 border border-slate-600 focus:border-purple-500 text-sm" rows={3}/>
                                    <div className="flex justify-between items-center mt-3">
                                        <div className="flex items-center space-x-1">{[1, 2, 3, 4, 5].map(star => (<button key={star} onClick={() => setNewRating(star)} className={`h-6 w-6 ${star <= newRating ? 'text-yellow-400 fill-current' : 'text-gray-400'}`}><Star /></button>))}</div>
                                        <button onClick={handleSubmitComment} disabled={submitting || !newComment.trim()} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-5 py-2 flex items-center space-x-2 text-sm"><Send className="h-4 w-4" /><span>Submit</span></button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-4">
                                {comments.length === 0 ? (<p className="text-center text-gray-400 py-8 text-sm">No comments yet.</p>) : (
                                comments.map(c => (
                                    <div key={c.id} className="bg-slate-800 p-4 flex gap-4">
                                        <img src={c.profiles?.avatar_url || `https://api.dicebear.com/8.x/bottts/svg?seed=${c.profiles?.username}`} alt="avatar" className="w-10 h-10 rounded-full bg-slate-800"/>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-white text-sm">{c.profiles?.username || 'User'}</span>
                                                <div className="flex items-center gap-1">{[...Array(c.rating)].map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-current"/>)}{[...Array(5 - c.rating)].map((_, i) => <Star key={i} className="h-4 w-4 text-gray-500"/>)}</div>
                                            </div>
                                            <p className="text-gray-300 mt-1 text-sm">{c.content}</p>
                                        </div>
                                    </div>
                                ))
                                )}
                            </div>
                        </AccordionSection>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default GameDetails;