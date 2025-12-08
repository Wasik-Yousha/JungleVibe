import React, { useState } from 'react';
import { Skull, X, Zap } from 'lucide-react';

interface JungleToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

const JungleToggle: React.FC<JungleToggleProps> = ({ isActive, onToggle }) => {
  const [showWarning, setShowWarning] = useState(false);

  const handleClick = () => {
    if (!isActive) {
      setShowWarning(true);
    } else {
      onToggle(); 
    }
  };

  const confirmJungle = () => {
    setShowWarning(false);
    onToggle();
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`pixel-btn px-2 py-1 flex items-center gap-2 text-sm font-display uppercase tracking-widest ${
          isActive 
            ? 'bg-jungle-800 text-jungle-neon border-jungle-neon shadow-[4px_4px_0_#6daa2c]' 
            : 'bg-retro-light text-retro-dark'
        }`}
      >
        <span className="text-xs">{isActive ? 'PVP ON' : 'GO WILD'}</span>
        <Zap size={14} className={isActive ? 'fill-current' : ''} />
      </button>

      {/* Retro Warning Box */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-retro-panel border-4 border-retro-dark p-6 max-w-sm w-full shadow-pixel relative">
            <button onClick={() => setShowWarning(false)} className="absolute top-2 right-2 text-retro-dark hover:text-retro-red">
               <X size={24} />
            </button>
            
            <div className="text-center mb-6">
              <Skull size={48} className="mx-auto mb-4 text-retro-red" />
              <h2 className="text-xl font-display text-retro-dark mb-2">WARNING: 18+ ZONE</h2>
              <p className="font-sans text-lg leading-tight text-retro-dark/80">
                You are entering the Jungle.<br/>
                Identities are HIDDEN.<br/>
                Chat logs are TEMPORARY.<br/>
                Behavior is UNMODERATED.
              </p>
            </div>

            <div className="flex gap-4 font-display text-xs">
              <button 
                onClick={() => setShowWarning(false)}
                className="flex-1 py-3 bg-retro-light border-2 border-retro-dark shadow-pixel-sm hover:translate-y-1 hover:shadow-none transition-all text-retro-dark"
              >
                RETREAT
              </button>
              <button 
                onClick={confirmJungle}
                className="flex-1 py-3 bg-retro-red text-white border-2 border-retro-dark shadow-pixel-sm hover:translate-y-1 hover:shadow-none transition-all"
              >
                ENTER
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JungleToggle;