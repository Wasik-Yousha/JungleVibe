import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import AvatarSelection from './pages/AvatarSelection';
import ChatInterface from './components/ChatInterface';
import Lobby from './components/Lobby';
import { Gender, ChatMode } from './types';

enum AppStep {
  SPLASH,
  LANDING,
  ONBOARDING,
  AVATAR_SELECT,
  LOBBY,
  CHAT
}

const AppContent: React.FC = () => {
  const { user, loading, needsProfile, signInWithGoogle, completeProfile } = useAuth();
  const [step, setStep] = useState<AppStep>(AppStep.SPLASH);
  const [tempName, setTempName] = useState('');
  const [tempGender, setTempGender] = useState<Gender>(Gender.MALE);
  
  // Chat State
  const [chatMode, setChatMode] = useState<ChatMode>(ChatMode.NORMAL);
  const [chatRecipientId, setChatRecipientId] = useState<string | undefined>(undefined);

  // Handle auth state changes
  useEffect(() => {
    if (loading) return; // Wait for auth to initialize
    
    if (step === AppStep.SPLASH) return; // Don't navigate during splash
    
    if (user) {
      // User is fully authenticated with profile
      if (step !== AppStep.CHAT) {
        setStep(AppStep.LOBBY);
      }
    } else if (needsProfile) {
      // User is authenticated but needs profile
      setStep(AppStep.ONBOARDING);
    } else {
      // Not authenticated
      setStep(AppStep.LANDING);
    }
  }, [user, loading, needsProfile]);

  const handleSplashComplete = () => {
    if (loading) {
      // Still loading auth, wait a bit
      setTimeout(handleSplashComplete, 100);
      return;
    }
    
    if (user) {
      setStep(AppStep.LOBBY);
    } else if (needsProfile) {
      setStep(AppStep.ONBOARDING);
    } else {
      setStep(AppStep.LANDING);
    }
  };

  const handleLandingNext = async () => {
    try {
      await signInWithGoogle();
      // Auth state listener will handle navigation
    } catch (error) {
      console.error('Google sign in failed:', error);
    }
  };

  const handleOnboardingNext = (name: string, gender: Gender) => {
    setTempName(name);
    setTempGender(gender);
    setStep(AppStep.AVATAR_SELECT);
  };

  const handleAvatarComplete = async (gender: Gender, avatarUrl: string) => {
    await completeProfile(tempName, gender, avatarUrl);
    setStep(AppStep.LOBBY);
  };

  const handleJoinWild = () => {
    setChatMode(ChatMode.JUNGLE);
    setChatRecipientId(undefined);
    setStep(AppStep.CHAT);
  };

  const handleJoinPrivate = (recipientId: string) => {
    setChatMode(ChatMode.NORMAL);
    setChatRecipientId(recipientId);
    setStep(AppStep.CHAT);
  };

  const handleBackToLobby = () => {
    setStep(AppStep.LOBBY);
    setChatRecipientId(undefined);
  };

  return (
    <div className="antialiased w-full h-full bg-white overflow-hidden relative sm:max-w-md sm:mx-auto sm:shadow-2xl">
      {step === AppStep.SPLASH && <SplashScreen onComplete={handleSplashComplete} />}
      {step === AppStep.LANDING && <Landing onNext={handleLandingNext} />}
      {step === AppStep.ONBOARDING && <Onboarding onNext={handleOnboardingNext} />}
      {step === AppStep.AVATAR_SELECT && <AvatarSelection gender={tempGender} onComplete={handleAvatarComplete} />}
      {step === AppStep.LOBBY && <Lobby onJoinWild={handleJoinWild} onJoinPrivate={handleJoinPrivate} />}
      {step === AppStep.CHAT && (
        <ChatInterface 
          mode={chatMode} 
          recipientId={chatRecipientId} 
          onBack={handleBackToLobby} 
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;