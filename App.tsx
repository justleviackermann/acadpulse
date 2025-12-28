
import React, { useState, useEffect } from 'react';
import { AppView, UserRole, UserProfile } from './types';
import { authService } from './authService';
import Sidebar from './components/Sidebar';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import Onboarding from './components/Onboarding';
import MemoryBank from './components/MemoryBank';
import VisionLab from './components/VisionLab';
import VoiceIntel from './components/VoiceIntel';
import IntelligenceHub from './components/IntelligenceHub';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isLoaded, setIsLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      setIsLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSigningUp) {
        await authService.signUp(email, password, displayName);
      } else {
        await authService.login(email, password);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentView(AppView.DASHBOARD);
  };

  const refreshUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
  };

  if (!isLoaded) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center font-mono text-blue-500 animate-pulse uppercase tracking-[0.5em] text-xs">
      Syncing Neural Core...
    </div>
  );

  if (!currentUser) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden text-white">
        <div className="absolute top-[-30%] right-[-10%] w-[60%] h-[60%] bg-blue-600/5 blur-[160px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[160px] rounded-full"></div>
        
        <div className="max-w-md w-full bg-gray-900/40 border border-gray-800/60 p-12 rounded-[3.5rem] shadow-2xl backdrop-blur-xl space-y-8 relative z-10 text-center">
          <div className="space-y-3">
             <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1.5rem] mx-auto flex items-center justify-center text-3xl font-black shadow-2xl shadow-blue-500/30">A</div>
             <h1 className="text-3xl font-black text-white tracking-tighter pt-2">AcadPulse</h1>
             <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">Cognitive Load Intelligence</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSigningUp && (
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-gray-500 uppercase px-4 tracking-widest">Display Identity</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Architect / Scholar" 
                  className="w-full bg-gray-950/50 border border-gray-800 px-6 py-4 rounded-2xl outline-none focus:border-blue-500 transition text-sm text-white" 
                />
              </div>
            )}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black text-gray-500 uppercase px-4 tracking-widest">Access Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="university@scholar.edu" 
                className="w-full bg-gray-950/50 border border-gray-800 px-6 py-4 rounded-2xl outline-none focus:border-blue-500 transition text-sm text-white" 
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black text-gray-500 uppercase px-4 tracking-widest">Secure Protocol</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••" 
                className="w-full bg-gray-950/50 border border-gray-800 px-6 py-4 rounded-2xl outline-none focus:border-blue-500 transition text-sm text-white" 
              />
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black text-white transition-all shadow-xl shadow-blue-900/40 text-sm uppercase tracking-widest">
              {isSigningUp ? 'Establish Connection' : 'Initiate Sync'}
            </button>
          </form>

          <button 
            onClick={() => setIsSigningUp(!isSigningUp)}
            className="text-[10px] text-gray-500 hover:text-blue-400 uppercase tracking-widest font-black transition-all"
          >
            {isSigningUp ? 'Already have credentials? Log In' : 'New Scholar? Register Profile'}
          </button>
        </div>
      </div>
    );
  }

  if (currentUser?.role === UserRole.UNSET) {
    return <Onboarding onComplete={refreshUser} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
      case AppView.ASSIGNMENTS: // Assignments view maps to relevant dashboard for simplicity
        return currentUser.role === UserRole.TEACHER 
          ? <TeacherDashboard user={currentUser} /> 
          : <StudentDashboard user={currentUser} />;
      
      case AppView.INTELLIGENCE_HUB:
        return <IntelligenceHub user={currentUser} />;
        
      case AppView.STRESS_ANALYSIS:
        return <VoiceIntel />;
        
      case AppView.RESOURCES:
        return (
          <div className="space-y-8 pb-32">
            <MemoryBank />
            <VisionLab />
          </div>
        );
      
      default:
        return currentUser.role === UserRole.TEACHER 
          ? <TeacherDashboard user={currentUser} /> 
          : <StudentDashboard user={currentUser} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#020617] overflow-hidden font-sans text-white">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        role={currentUser.role}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 h-screen overflow-y-auto relative custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.03),transparent_50%)]">
        <div className="relative z-10 min-h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
