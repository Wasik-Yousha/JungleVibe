import React, { useState } from 'react';
import { ArrowRight, Shield, Heart } from 'lucide-react';
import { Gender } from '../types';

interface OnboardingProps {
  onNext: (name: string, gender: Gender) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onNext }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.MALE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNext(name, gender);
    }
  };

  return (
    <div className="h-full w-full bg-retro-bg flex flex-col items-center justify-center p-4 bg-pixel-pattern overflow-y-auto native-scroll">
      <div className="w-full max-w-sm border-4 border-retro-dark bg-retro-panel p-4 shadow-pixel">
        
        <div className="text-center mb-6 border-b-4 border-retro-dark pb-3">
          <h1 className="text-3xl font-display text-jungle-neon mb-2 text-shadow-sm drop-shadow-md flex flex-col gap-0.5">
            <span>JUNGLE</span>
            <span>VIBE</span>
          </h1>
          <p className="font-sans text-lg text-retro-dark">IDENTIFY YOURSELF</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-retro-light border-2 border-retro-dark p-3">
            <label className="block font-display text-[10px] text-retro-dark mb-1">ENTER REAL NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="YOUR NAME"
              className="w-full bg-transparent border-b-2 border-retro-dark py-1.5 font-sans text-xl outline-none text-retro-dark placeholder-retro-dark/30 uppercase"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => setGender(Gender.MALE)}
              className={`cursor-pointer border-2 p-3 text-center transition-all active:scale-95 ${
                gender === Gender.MALE 
                  ? 'border-retro-blue bg-white shadow-pixel-sm' 
                  : 'border-retro-dark bg-retro-light opacity-60'
              }`}
            >
              <Shield className="mx-auto mb-1 text-retro-blue" size={24} />
              <h3 className="font-display text-[10px] text-retro-blue">MALE</h3>
            </div>

            <div 
              onClick={() => setGender(Gender.FEMALE)}
              className={`cursor-pointer border-2 p-3 text-center transition-all active:scale-95 ${
                gender === Gender.FEMALE 
                  ? 'border-retro-red bg-white shadow-pixel-sm' 
                  : 'border-retro-dark bg-retro-light opacity-60'
              }`}
            >
              <Heart className="mx-auto mb-1 text-retro-red" size={24} />
              <h3 className="font-display text-[10px] text-retro-red">FEMALE</h3>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 bg-retro-green border-4 border-retro-dark shadow-pixel font-display text-white text-base active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
          >
            NEXT <ArrowRight size={18} />
          </button>
        </form>
      </div>
      
      <div className="mt-4 font-display text-[8px] text-retro-dark/50 text-center">
        © 2025 JUNGLE INC.
      </div>
    </div>
  );
};

export default Onboarding;