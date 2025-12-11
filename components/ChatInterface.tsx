import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatMode, Message, UserRole, Gender } from '../types';
import { firebaseMessages, firebaseUsers } from '../services/firebase';
import { 
  DAILY_MESSAGE_LIMIT, 
  WILD_NAMES_MALE, 
  WILD_NAMES_FEMALE,
  AVATARS_MALE,
  AVATARS_FEMALE
} from '../constants';
import Avatar from './Avatar';
import { Send, Crown, ArrowLeft, Zap } from 'lucide-react';
import { generateTribeChallenge } from '../services/gemini';

interface ChatInterfaceProps {
  mode: ChatMode;
  recipientId?: string; // For private chat
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode, recipientId, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [challenge, setChallenge] = useState<string>('');
  const [recipient, setRecipient] = useState<any>(null);
  const [todaysMessageCount, setTodaysMessageCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || !scrollRef.current) return;
    if (scrollRef.current.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 80));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      // Refresh message count for private chats
      if (mode === ChatMode.NORMAL && user && recipientId) {
        const count = await firebaseMessages.getTodaysMessageCount(user.id, recipientId);
        setTodaysMessageCount(count);
      }
      if (mode === ChatMode.JUNGLE) {
        generateTribeChallenge().then(setChallenge);
      }
      setTimeout(() => setIsRefreshing(false), 500);
    }
    setPullDistance(0);
    isPulling.current = false;
  };

  // Fetch recipient info if private
  useEffect(() => {
    if (mode === ChatMode.NORMAL && recipientId) {
      firebaseUsers.getUserById(recipientId).then(r => {
        setRecipient(r);
      });
    }
  }, [recipientId, mode]);

  // Calculate today's message count for the room (recharges at midnight)
  useEffect(() => {
    const updateMessageCount = async () => {
      if (mode === ChatMode.NORMAL && user && recipientId) {
        const count = await firebaseMessages.getTodaysMessageCount(user.id, recipientId);
        setTodaysMessageCount(count);
      }
    };
    
    updateMessageCount();
    
    // Also check at midnight for recharge
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const midnightTimer = setTimeout(() => {
      setTodaysMessageCount(0); // Reset at midnight
    }, msUntilMidnight);
    
    return () => clearTimeout(midnightTimer);
  }, [mode, user, recipientId]);

  // Update count when messages change
  useEffect(() => {
    if (mode === ChatMode.NORMAL && user && recipientId) {
      firebaseMessages.getTodaysMessageCount(user.id, recipientId).then(count => {
        setTodaysMessageCount(count);
      });
    }
  }, [messages.length]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!user) return;

    let unsubscribe: () => void;

    if (mode === ChatMode.JUNGLE) {
      unsubscribe = firebaseMessages.subscribeToWildMessages(user.id, (msgs) => {
        setMessages(msgs);
      });
    } else if (recipientId) {
      unsubscribe = firebaseMessages.subscribeToPrivateMessages(user.id, recipientId, (msgs) => {
        setMessages(msgs);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [mode, user, recipientId]);

  useEffect(() => {
    if (mode === ChatMode.JUNGLE) {
       generateTribeChallenge().then(setChallenge);
    }
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    if (mode === ChatMode.NORMAL && todaysMessageCount >= DAILY_MESSAGE_LIMIT) {
      return;
    }

    try {
      await firebaseMessages.sendMessage(
        user.id,
        user.name,
        input,
        mode,
        recipientId
      );
      setInput('');
    } catch (error) {
      console.error("Send failed", error);
    }
  };

  const isJungle = mode === ChatMode.JUNGLE;

  // Helper to get Wild Identity for a message
  const getWildIdentity = (msg: Message) => {
    // Use message ID to seed the random choice for anonymity
    const seed = msg.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Random gender for anonymity
    const isFemale = seed % 2 === 0; 
    
    const nameList = isFemale ? WILD_NAMES_FEMALE : WILD_NAMES_MALE;
    const name = nameList[seed % nameList.length];

    // Shuffle through the 6 avatars for each gender
    const avatarList = isFemale ? AVATARS_FEMALE : AVATARS_MALE;
    const avatarUrl = avatarList[seed % avatarList.length];

    return { name, avatarUrl };
  };

  return (
    <div 
      className={`flex flex-col h-full w-full transition-colors duration-0 ${isJungle ? 'bg-jungle-900 bg-jungle-pattern' : 'bg-retro-bg bg-pixel-pattern'}`}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
    >
      {/* Header - Safe Area Top */}
      <header className={`p-3 border-b-4 flex items-center gap-3 z-20 safe-top ${isJungle ? 'bg-jungle-800 border-jungle-700 shadow-lg' : 'bg-retro-panel border-retro-dark'}`}>
        <button onClick={onBack} className={`p-1 border-2 active:scale-95 ${isJungle ? 'border-jungle-accent text-jungle-accent hover:bg-jungle-700' : 'border-retro-dark text-retro-dark'}`}>
          <ArrowLeft size={18} />
        </button>
        
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isJungle ? (
            <>
              <div className="min-w-0">
                <h1 className="font-display text-xs text-jungle-accent tracking-wider truncate">THE WILD TRIBE</h1>
                <p className="font-sans text-[10px] text-jungle-neon opacity-80">Deep Jungle • Anonymous</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 border-2 border-retro-dark overflow-hidden bg-white flex-shrink-0 relative">
                {recipient?.avatarUrl ? (
                  <img 
                    src={recipient.avatarUrl} 
                    className="w-full h-full object-cover" 
                    style={{imageRendering: 'pixelated'}}
                    loading="eager"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-retro-light">
                    <span className="text-retro-dark font-display text-xs">{recipient?.name?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-xs text-retro-dark truncate">{recipient?.name || 'Chat'}</h1>
                <div className="flex items-center gap-1">
                  <p className="font-sans text-[10px] text-gray-500">Private</p>
                  
                  {/* Compact Power Bar */}
                  <div className="relative ml-2">
                    <div className="w-24 h-5 bg-retro-dark absolute top-0.5 left-0.5"></div>
                    <div className="w-24 h-5 border-2 border-retro-dark bg-white relative z-10 flex">
                       <div 
                         className={`h-full transition-all duration-300 ${todaysMessageCount >= DAILY_MESSAGE_LIMIT ? 'bg-red-500' : 'bg-green-500'}`}
                         style={{ width: `${Math.max(0, (DAILY_MESSAGE_LIMIT - todaysMessageCount) / DAILY_MESSAGE_LIMIT * 100)}%` }}
                       ></div>
                       <span className="absolute inset-0 flex items-center justify-center text-[10px] font-display text-retro-dark">
                         {Math.max(0, DAILY_MESSAGE_LIMIT - todaysMessageCount)} / {DAILY_MESSAGE_LIMIT}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Pull to Refresh Indicator */}
      <div 
        className={`flex justify-center items-center overflow-hidden transition-all duration-300 ${isJungle ? 'bg-jungle-800' : 'bg-retro-light'}`}
        style={{ height: pullDistance }}
      >
        {isRefreshing ? (
          <div className={`w-6 h-6 border-2 ${isJungle ? 'border-jungle-accent' : 'border-retro-dark'} border-t-transparent rounded-full animate-spin`}></div>
        ) : (
          <p className={`font-display text-xs ${isJungle ? 'text-jungle-accent' : 'text-retro-dark'} ${pullDistance > 60 ? 'opacity-100' : 'opacity-50'}`}>
            {pullDistance > 60 ? 'Release to refresh' : 'Pull down to refresh'}
          </p>
        )}
      </div>

      {/* Quest Box - Compact */}
      {isJungle && challenge && (
        <div className="bg-jungle-800 border-b-2 border-jungle-700 py-2 px-3 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
          <p className="font-display text-[8px] text-jungle-warning mb-0.5 relative z-10 tracking-widest">QUEST</p>
          <p className="font-sans text-sm text-jungle-text relative z-10 italic truncate">"{challenge}"</p>
        </div>
      )}

      {/* Chat Log - Messenger Style */}
      <div 
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto p-2 space-y-2 native-scroll scrollbar-hide"
        style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}
      >
        {messages.map((msg, index) => {
          const isMe = msg.senderId === user?.id;
          const isAdminViewing = user?.role === UserRole.ADMIN;
          
          let displayName = "";
          let displayAvatar = "";

          if (isJungle) {
            // Wild Mode Logic
            const wildIdentity = getWildIdentity(msg);
            if (isMe) {
              displayName = "YOU";
              displayAvatar = wildIdentity.avatarUrl;
            } else {
              displayName = wildIdentity.name;
              displayAvatar = wildIdentity.avatarUrl;
            }
          } else {
            // Private Mode Logic
            if (isMe) {
              displayName = ""; // Don't show name for self in private
            } else {
              displayName = msg.realSenderName || "User";
              // In private, we'd ideally look up the sender's avatar from DB
              // For now, use recipient avatar if it matches, else generic
              displayAvatar = recipient?.id === msg.senderId ? recipient.avatarUrl : "";
            }
          }

          const bubbleColor = isMe 
            ? (isJungle ? 'bg-jungle-700 text-jungle-text border-jungle-accent' : 'bg-retro-blue text-white border-retro-dark')
            : (isJungle ? 'bg-black text-jungle-danger border-jungle-danger' : 'bg-white text-retro-dark border-retro-dark');

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              
              <div className={`flex items-end gap-1.5 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar - Smaller */}
                {(!isMe || isJungle) && (
                   <div className={`w-7 h-7 border p-0.5 overflow-hidden flex-shrink-0 ${isJungle ? (isMe ? 'border-jungle-accent bg-jungle-800' : 'border-jungle-danger bg-black') : 'border-retro-dark bg-white'}`}>
                      {displayAvatar && <img src={displayAvatar} className="w-full h-full object-cover" style={{imageRendering: 'pixelated'}} />}
                   </div>
                )}
                
                <div className="flex flex-col min-w-0">
                  {/* Name Tag - Smaller */}
                  {!isMe && (
                    <span className={`font-display text-[6px] mb-0.5 px-0.5 ${isJungle ? 'bg-jungle-danger text-black' : 'text-retro-dark'}`}>
                      {displayName}
                    </span>
                  )}

                  {/* Speech Bubble - Compact */}
                  <div className={`relative py-1.5 px-2.5 border-2 rounded-sm ${bubbleColor}`}>
                    <p className="font-sans text-sm leading-snug break-words">{msg.text}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Safe Area Bottom */}
      <div 
        className={`p-2 z-20 border-t-2 safe-bottom shrink-0 ${isJungle ? 'bg-jungle-800 border-jungle-700' : 'bg-retro-panel border-retro-dark'}`}
        style={{ minHeight: '60px', position: 'relative', paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <form onSubmit={handleSendMessage} className="relative flex items-center gap-2" style={{ visibility: 'visible' }}>
            {mode === ChatMode.NORMAL && todaysMessageCount >= DAILY_MESSAGE_LIMIT ? (
               <div className="w-full py-2 bg-gray-200 border-2 border-gray-400 text-gray-500 font-display text-center text-xs">
                 OUT OF POWERS
               </div>
            ) : (
              <>
                <div className={`flex-1 border-2 bg-white p-1.5 ${isJungle ? 'border-jungle-700 bg-jungle-900' : 'border-retro-dark'}`}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isJungle ? "Send into the wild..." : "Type a message..."}
                    className={`w-full font-sans text-base outline-none placeholder-gray-400 bg-transparent ${isJungle ? 'text-jungle-text' : 'text-black'}`}
                    style={{ fontSize: '16px', minHeight: '40px' }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={`p-2 border-2 transition-all active:scale-95 ${
                    input.trim() 
                      ? (isJungle ? 'bg-jungle-700 border-jungle-accent text-jungle-accent' : 'bg-retro-green border-retro-dark text-white') 
                      : 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed'
                  }`}
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  {isJungle ? <Zap size={20} /> : <Send size={20} />}
                </button>
              </>
            )}
        </form>
      </div>

    </div>
  );
};

export default ChatInterface;