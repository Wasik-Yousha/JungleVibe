import React from 'react';
import { Gender, ChatMode } from '../types';
import { JUNGLE_AVATAR_MALE, JUNGLE_AVATAR_FEMALE } from '../constants';

interface AvatarProps {
  gender: Gender;
  mode: ChatMode;
  url: string;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ gender, mode, url, size = 'md' }) => {
  const isJungle = mode === ChatMode.JUNGLE;
  
  let src = url;
  if (isJungle) {
    src = gender === Gender.MALE ? JUNGLE_AVATAR_MALE : JUNGLE_AVATAR_FEMALE;
  }

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-32 h-32'
  };

  return (
    <div className={`relative ${sizeClasses[size]} p-1 transition-all duration-300 ${isJungle ? 'bg-jungle-neon' : 'bg-retro-dark'}`}>
      <div className={`w-full h-full bg-white relative overflow-hidden`}>
        <img 
          src={src} 
          alt="Avatar" 
          className="w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }} 
        />
        {/* Scanline effect for Jungle */}
        {isJungle && (
          <div className="absolute inset-0 bg-jungle-purple/20 pointer-events-none" style={{ backgroundSize: '100% 4px', backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)' }}></div>
        )}
      </div>
    </div>
  );
};

export default Avatar;