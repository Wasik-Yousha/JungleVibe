import React, { useEffect, useState } from 'react';
import coverImage from '../assets/Cover.webp';
import { preloadAllImages } from '../utils/imagePreloader';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);

  // Preload cover image immediately
  useEffect(() => {
    const img = new Image();
    img.onload = () => setCoverLoaded(true);
    img.src = coverImage;
  }, []);

  // Preload all other images in background
  useEffect(() => {
    preloadAllImages().then(() => {
      setImagesPreloaded(true);
    });
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          // Only complete when images are preloaded
          if (imagesPreloaded) {
            setTimeout(onComplete, 300);
          }
          return 100;
        }
        // Faster loading since images are preloading in parallel
        return prev + Math.random() * 6 + 2;
      });
    }, 150);

    return () => {
      clearInterval(progressInterval);
    };
  }, [onComplete, imagesPreloaded]);

  // If progress is 100 but images not loaded, wait for them
  useEffect(() => {
    if (progress >= 100 && imagesPreloaded) {
      setTimeout(onComplete, 300);
    }
  }, [progress, imagesPreloaded, onComplete]);

  return (
    <div className="h-full w-full bg-black flex flex-col relative overflow-hidden">
      {/* Cover Image - Full Screen */}
      <div className="absolute inset-0 z-0">
        {coverLoaded ? (
          <img 
            src={coverImage} 
            alt="Jungle Vibe" 
            className="w-full h-full object-contain object-center"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {/* Subtle gradient at bottom to make bar pop but keep transparency */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
      </div>

      {/* Loading Bar - Floating at bottom, transparent background */}
      <div className="absolute bottom-4 left-6 right-6 z-10 flex flex-col items-center">
        {/* Medium thick bar with snake/jungle vibe */}
        <div className="w-full max-w-xs h-3 bg-black/30 backdrop-blur-sm rounded-full overflow-hidden border border-white/10 shadow-lg">
          <div 
            className="h-full bg-gradient-to-r from-green-900 via-green-500 to-emerald-400 transition-all duration-300 ease-out relative"
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            {/* Snake scale texture effect */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.3) 1px, transparent 1px)',
                backgroundSize: '4px 4px'
              }}
            ></div>
            {/* Shine */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30"></div>
          </div>
        </div>
        
        {/* Text */}
        <p className="text-[10px] text-white/90 text-center mt-2 tracking-[0.2em] font-medium drop-shadow-md uppercase">
          {progress < 100 ? 'Entering the Wild...' : 'Welcome'}
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
