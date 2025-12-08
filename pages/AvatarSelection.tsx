import React, { useState } from 'react';
import { Gender } from '../types';
import { ArrowRight, Check } from 'lucide-react';
import { AVATARS_MALE, AVATARS_FEMALE } from '../constants';

interface AvatarSelectionProps {
  gender: Gender;
  onComplete: (gender: Gender, avatarUrl: string) => void;
}

const AvatarSelection: React.FC<AvatarSelectionProps> = ({ gender, onComplete }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const avatars = gender === Gender.MALE ? AVATARS_MALE : AVATARS_FEMALE;

  const handleConfirm = () => {
    if (selectedIndex !== null) {
      onComplete(gender, avatars[selectedIndex]);
    }
  };

  return (
    <div className="h-full w-full bg-retro-bg flex flex-col justify-center p-4 bg-pixel-pattern overflow-y-auto native-scroll">
      <div className="w-full max-w-sm mx-auto border-4 border-retro-dark bg-retro-panel p-4 shadow-pixel">
        
        <div className="text-center mb-4 border-b-4 border-retro-dark pb-3">
          <h2 className="text-lg font-display text-retro-dark">CHOOSE YOUR AVATAR</h2>
          <p className="font-sans text-sm text-retro-dark/60 mt-1">{gender === Gender.MALE ? 'MALE' : 'FEMALE'} OPTIONS</p>
        </div>

        {/* 6 Avatar Grid - 2x3 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {avatars.map((url, index) => (
            <div 
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`cursor-pointer border-2 p-1 text-center transition-all relative bg-white aspect-square active:scale-95 ${
                selectedIndex === index 
                  ? 'border-retro-green shadow-pixel-sm ring-2 ring-retro-green/30' 
                  : 'border-retro-dark opacity-70'
              }`}
            >
              <img 
                src={url} 
                className="w-full h-full object-cover" 
                style={{imageRendering: 'pixelated'}} 
                alt={`Avatar ${index + 1}`}
              />
              
              {selectedIndex === index && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-retro-green rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={selectedIndex === null}
          className={`w-full py-3 border-4 border-retro-dark shadow-pixel font-display text-base transition-all flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none ${
            selectedIndex !== null
              ? 'bg-retro-green text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          ENTER JUNGLE <ArrowRight size={18} />
        </button>

      </div>
    </div>
  );
};

export default AvatarSelection;
