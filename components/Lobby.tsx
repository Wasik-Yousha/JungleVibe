import React, { useEffect, useState, useRef } from 'react';
import { User, Gender } from '../types';
import { firebaseUsers } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Zap, MessageCircle, AlertTriangle, X, Settings, LogOut, Info } from 'lucide-react';
import { JUNGLE_WARNING_TEXT } from '../constants';

interface LobbyProps {
  onJoinWild: () => void;
  onJoinPrivate: (userId: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoinWild, onJoinPrivate }) => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    // Initial popup after 1.5s
    const initialTimer = setTimeout(() => {
      setShowPromo(true);
    }, 1500);

    // Recurring popup every 30s
    const interval = setInterval(() => {
      setShowPromo(true);
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const onlineUsers = await firebaseUsers.getOnlineUsers();
    setUsers(onlineUsers);
    setTimeout(() => {
      setIsRefreshing(false);
      setPullDistance(0);
    }, 800);
  };

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0 && scrollRef.current && scrollRef.current.scrollTop === 0) {
      setPullDistance(Math.min(diff * 0.5, 80));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60 && !isRefreshing) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
    isPulling.current = false;
  };

  useEffect(() => {
    // Subscribe to real-time online users
    const unsubscribe = firebaseUsers.subscribeToOnlineUsers((onlineUsers) => {
      setUsers(onlineUsers);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-retro-bg bg-pixel-pattern relative">
      {/* Wild Tribe Promo Modal */}
      {showPromo && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-jungle-900 border-4 border-jungle-accent p-6 max-w-xs w-full shadow-[0_0_20px_rgba(74,140,74,0.5)] relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-jungle-pattern opacity-30 pointer-events-none"></div>
            
            <button 
              onClick={() => setShowPromo(false)}
              className="absolute top-2 right-2 text-jungle-accent hover:text-white z-20"
            >
              <X size={24} />
            </button>

            <div className="relative z-10 text-center">
              <div className="w-16 h-16 bg-jungle-800 rounded-full border-2 border-jungle-neon mx-auto mb-4 flex items-center justify-center shadow-[0_0_15px_rgba(74,140,74,0.3)]">
                <Zap size={32} className="text-jungle-warning animate-pulse" />
              </div>

              <h2 className="font-display text-xl text-jungle-accent mb-2 tracking-wider">THE WILD TRIBE</h2>
              <p className="font-sans text-sm text-jungle-text mb-6 leading-relaxed">
                Enter the deep jungle where identities are hidden and chaos reigns.
                <br/><br/>
                <span className="text-jungle-warning">Anonymous. No Limits.</span>
              </p>

              <button 
                onClick={() => {
                  setShowPromo(false);
                  setShowWarning(true);
                }}
                className="w-full py-3 bg-jungle-accent text-jungle-900 font-display text-sm border-b-4 border-jungle-neon active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 hover:bg-white"
              >
                <Zap size={16} />
                GO WILD NOW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-retro-panel border-4 border-retro-dark p-6 max-w-xs w-full shadow-pixel relative">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-2 right-2 text-retro-dark hover:text-retro-red"
            >
              <X size={24} />
            </button>

            <h2 className="font-display text-xl text-retro-dark text-center mb-6 border-b-4 border-retro-dark pb-2">SETTINGS</h2>

            <div className="space-y-4">
              <div className="bg-white border-2 border-retro-dark p-4">
                <div className="flex items-center gap-2 mb-2 text-retro-blue">
                  <Info size={20} />
                  <h3 className="font-display text-sm">ABOUT US</h3>
                </div>
                <p className="font-sans text-xs text-retro-dark leading-relaxed">
                  Jungle Vibe is a retro-styled messaging experience. Connect with your tribe, or go wild in the deep jungle.
                </p>
                <p className="font-sans text-[10px] text-retro-dark/50 mt-2">v1.0.0 Beta</p>
              </div>

              <button 
                onClick={logout}
                className="w-full py-3 bg-retro-red border-4 border-retro-dark text-white font-display text-sm shadow-pixel active:translate-y-1 active:shadow-none flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarning && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-jungle-900 border-4 border-jungle-700 p-8 max-w-sm w-full shadow-[0_0_30px_rgba(10,31,10,0.8)] animate-bounce-in relative overflow-hidden">
            
            {/* Jungle Vines/Texture Effect */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-jungle-pattern mix-blend-overlay"></div>

            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <AlertTriangle className="text-jungle-warning w-20 h-20 animate-pulse" />
                  <AlertTriangle className="text-jungle-accent w-20 h-20 absolute top-0 left-0 animate-ping opacity-20" />
                </div>
              </div>
              
              <h2 className="font-display text-2xl text-jungle-text text-center mb-2 tracking-widest uppercase drop-shadow-md">
                DEEP JUNGLE
              </h2>
              
              <div className="border-t-2 border-b-2 border-jungle-700 py-4 mb-6 bg-black/40 backdrop-blur-sm">
                <p className="font-sans text-jungle-accent text-center text-lg leading-relaxed tracking-wide opacity-90">
                  {JUNGLE_WARNING_TEXT}
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowWarning(false)}
                  className="flex-1 py-4 border-4 border-jungle-700 text-jungle-700 font-display text-xs hover:bg-jungle-800 hover:text-jungle-accent transition-all uppercase tracking-widest"
                >
                  Retreat
                </button>
                <button 
                  onClick={onJoinWild}
                  className="flex-1 py-4 bg-jungle-700 border-4 border-jungle-accent text-jungle-accent font-display text-xs hover:bg-jungle-accent hover:text-jungle-900 hover:shadow-[0_0_15px_#8fbc8f] transition-all shadow-[4px_4px_0_#0a1f0a] uppercase tracking-widest"
                >
                  Enter Wild
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="p-3 border-b-4 border-retro-dark bg-retro-panel flex items-center justify-between safe-top">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-1.5 border-2 border-retro-dark bg-white text-retro-dark active:scale-95 hover:bg-retro-light"
          >
            <Settings size={18} />
          </button>
          <h1 className="font-display text-lg text-retro-dark">JUNGLE PARK</h1>
        </div>
        <button 
          onClick={() => setShowWarning(true)}
          className="pixel-btn px-3 py-1.5 bg-jungle-800 text-jungle-neon border-jungle-neon shadow-[3px_3px_0_#4a8c4a] flex items-center gap-1.5 active:scale-95"
        >
          <Zap size={14} />
          <span className="font-display text-[10px]">GO WILD</span>
        </button>
      </header>

      {/* Pull to Refresh Indicator */}
      <div 
        className={`flex justify-center items-center overflow-hidden transition-all duration-300 bg-retro-light`}
        style={{ height: pullDistance }}
      >
        {isRefreshing ? (
          <div className="w-6 h-6 border-2 border-retro-dark border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <p className={`font-display text-xs text-retro-dark ${pullDistance > 60 ? 'opacity-100' : 'opacity-50'}`}>
            {pullDistance > 60 ? 'Release to refresh' : 'Pull down to refresh'}
          </p>
        )}
      </div>

      {/* User List */}
      <div 
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto p-3 space-y-2 native-scroll scrollbar-hide"
      >
        <h2 className="font-display text-xs text-retro-dark/50 mb-1">ONLINE MEMBERS</h2>
        
        {users.filter(u => u.id !== user?.id).map(u => (
          <div 
            key={u.id}
            onClick={() => onJoinPrivate(u.id)}
            className="bg-white border-2 border-retro-dark p-2 flex items-center gap-3 shadow-pixel-sm cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 border-2 border-retro-dark overflow-hidden bg-retro-bg flex-shrink-0 relative">
              {u.avatarUrl ? (
                <img 
                  src={u.avatarUrl} 
                  className="w-full h-full object-cover" 
                  style={{imageRendering: 'pixelated'}}
                  loading="lazy"
                  onError={(e) => {
                    // Fallback for broken images
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-retro-light">
                  <span className="text-retro-dark font-display text-xs">{u.name?.charAt(0) || '?'}</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xs text-retro-dark truncate">{u.name}</h3>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-sans">
                <span className={`w-1.5 h-1.5 rounded-full ${u.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                {u.isOnline ? 'Online' : 'Offline'}
              </div>
            </div>

            <MessageCircle className="text-retro-blue" size={20} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Lobby;
