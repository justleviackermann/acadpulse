
import React, { useState, useEffect } from 'react';
import { AppView, UserRole, UserProfile } from './types';
import { authService } from './authService';
import Sidebar from './components/Sidebar';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import Onboarding from './components/Onboarding';

import StrategyPage from './components/StrategyPage';
import StudentClasses from './components/StudentClasses';

enum AppFlow {
  ROLE_SELECTION,
  AUTH,
  DASHBOARD
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [appFlow, setAppFlow] = useState<AppFlow>(AppFlow.ROLE_SELECTION);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.UNSET);
  const [isLoaded, setIsLoaded] = useState(false);

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      if (user) {
        setCurrentUser(user);
        setAppFlow(AppFlow.DASHBOARD);
      } else {
        // If not logged in, we might stay at AUTH or ROLE_SELECTION depending on state
        // For now, let's default to ROLE_SELECTION if no user, unless we are in the middle of auth
        if (appFlow === AppFlow.DASHBOARD) {
          setAppFlow(AppFlow.ROLE_SELECTION);
        }
      }
      setIsLoaded(true);
    });
    return () => unsubscribe();
  }, [appFlow]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setAppFlow(AppFlow.AUTH);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSigningUp) {
        await authService.signUp(email, password, displayName, selectedRole);
      } else {
        await authService.login(email, password);
      }
      // The auth listener will update the flow to DASHBOARD
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setSelectedRole(UserRole.UNSET);
    setAppFlow(AppFlow.ROLE_SELECTION);
    setCurrentView(AppView.DASHBOARD);
  };

  if (!isLoaded) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center font-mono text-blue-500 animate-pulse uppercase tracking-[0.5em] text-xs">
      Syncing Neural Core...
    </div>
  );

  if (appFlow === AppFlow.ROLE_SELECTION) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center p-6 z-[100] overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full"></div>

        <div className="max-w-4xl w-full text-center space-y-12 relative z-10">
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tight text-white">Welcome to <span className="text-blue-500">AcadPulse</span></h1>
            <p className="text-xl text-gray-400">To tailor your experience, please identify your primary role.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button
              onClick={() => handleRoleSelect(UserRole.STUDENT)}
              className="group relative bg-gray-900 border-2 border-gray-800 p-10 rounded-3xl hover:border-blue-500/50 hover:bg-gray-800/50 transition-all text-left"
            >
              <div className="text-5xl mb-6">🎓</div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition">I am a Student</h3>
              <p className="text-gray-400 leading-relaxed">Track your workload, monitor stress levels, and get AI-powered study optimization.</p>
              <div className="mt-8 flex items-center text-blue-500 font-bold">
                Select Student Profile <span className="ml-2 group-hover:translate-x-2 transition">→</span>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect(UserRole.TEACHER)}
              className="group relative bg-gray-900 border-2 border-gray-800 p-10 rounded-3xl hover:border-indigo-500/50 hover:bg-gray-800/50 transition-all text-left"
            >
              <div className="text-5xl mb-6">👨‍🏫</div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-400 transition">I am a Teacher</h3>
              <p className="text-gray-400 leading-relaxed">Visualize class stress levels, analyze assignment impact, and optimize curriculum health.</p>
              <div className="mt-8 flex items-center text-indigo-500 font-bold">
                Select Teacher Profile <span className="ml-2 group-hover:translate-x-2 transition">→</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appFlow === AppFlow.AUTH) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden text-white">
        <div className="absolute top-[-30%] right-[-10%] w-[60%] h-[60%] bg-blue-600/5 blur-[160px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[160px] rounded-full"></div>

        <div className="max-w-md w-full bg-gray-900/40 border border-gray-800/60 p-12 rounded-[3.5rem] shadow-2xl backdrop-blur-xl space-y-8 relative z-10 text-center">

          <button
            onClick={() => setAppFlow(AppFlow.ROLE_SELECTION)}
            className="absolute top-4 left-4 text-gray-500 hover:text-white transition-colors"
          >
            ← Back
          </button>

          <div className="space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1.5rem] mx-auto flex items-center justify-center text-3xl font-black shadow-2xl shadow-blue-500/30">A</div>
            <h1 className="text-3xl font-black text-white tracking-tighter pt-2">AcadPulse</h1>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">{selectedRole} ACCESS</p>
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

  // Dashboard View
  if (!currentUser) return null; // Should not happen given flow logic, but safety check

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return currentUser.role === UserRole.TEACHER
          ? <TeacherDashboard user={currentUser} />
          : <StudentDashboard user={currentUser} />;

      case AppView.STRATEGY:
        return <StrategyPage user={currentUser} />;

      case AppView.CLASSES:
        return currentUser.role === UserRole.TEACHER
          ? <TeacherDashboard user={currentUser} /> // Teacher sees dashboard or maybe we add a specific classes view later, but for now they manage via dashboard
          : <StudentClasses user={currentUser} />;

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
