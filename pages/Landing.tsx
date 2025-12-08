import React from 'react';
import { ArrowRight } from 'lucide-react';

interface LandingProps {
  onNext: () => void;
}

const Landing: React.FC<LandingProps> = ({ onNext }) => {
  return (
    <div className="h-full w-full bg-retro-bg flex flex-col items-center justify-center p-4 bg-pixel-pattern relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

      <div className="w-full max-w-sm border-4 border-retro-dark bg-retro-panel p-6 shadow-pixel z-10 text-center">
        
        {/* Jungle Vibe Title - Dark Green */}
        <h1 className="text-4xl font-display text-jungle-neon mb-6 text-shadow-sm drop-shadow-md leading-tight flex flex-col items-center justify-center gap-1">
          <span>JUNGLE</span>
          <span>VIBE</span>
        </h1>
        
        <div className="mb-6 space-y-1">
          <p className="font-display text-xs text-retro-dark uppercase tracking-widest">Join the tribe.</p>
          <p className="font-display text-xs text-retro-red uppercase tracking-widest">Reveal your true nature.</p>
        </div>

        <button
          onClick={onNext}
          className="w-full py-3 bg-white border-4 border-retro-dark shadow-pixel font-sans text-lg text-retro-dark active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <div className="mt-4 text-[8px] font-display text-retro-dark/50">
          By joining, you agree to the Rules of the Jungle.
        </div>
      </div>
    </div>
  );
};

export default Landing;
