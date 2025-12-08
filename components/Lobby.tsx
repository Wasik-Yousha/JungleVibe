import React, { useEffect, useState } from 'react';
import { User, Gender } from '../types';
import { firebaseUsers } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Zap, MessageCircle, AlertTriangle, X, Settings, LogOut, Info, RefreshCw } from 'lucide-react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const onlineUsers = await firebaseUsers.getOnlineUsers();
    setUsers(onlineUsers);
    setTimeout(() => setIsRefreshing(false), 500);
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
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-1.5 border-2 border-retro-dark bg-white text-retro-dark active:scale-95 hover:bg-retro-light ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <button 
          onClick={() => setShowWarning(true)}
          className="pixel-btn px-3 py-1.5 bg-jungle-800 text-jungle-neon border-jungle-neon shadow-[3px_3px_0_#4a8c4a] flex items-center gap-1.5 active:scale-95"
        >
          <Zap size={14} />
          <span className="font-display text-[10px]">GO WILD</span>
        </button>
      </header>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 native-scroll scrollbar-hide">
        <h2 className="font-display text-xs text-retro-dark/50 mb-1">ONLINE MEMBERS</h2>
        
        {users.filter(u => u.id !== user?.id).map(user => (
          <div 
            key={user.id}
            onClick={() => onJoinPrivate(user.id)}
            className="bg-white border-2 border-retro-dark p-2 flex items-center gap-3 shadow-pixel-sm cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 border-2 border-retro-dark overflow-hidden bg-retro-bg flex-shrink-0">
              <img src={user.avatarUrl} className="w-full h-full object-cover" style={{imageRendering: 'pixelated'}} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xs text-retro-dark truncate">{user.name}</h3>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-sans">
                <span className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                {user.isOnline ? 'Online' : 'Offline'}
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
