
import React from 'react';
import { UserRole } from '../types';
import { authService } from '../authService';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const handleSelectRole = (role: UserRole) => {
    authService.setRole(role);
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-gray-950 flex items-center justify-center p-6 z-[100] overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full"></div>
      
      <div className="max-w-4xl w-full text-center space-y-12 relative z-10">
        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tight text-white">Welcome to <span className="text-blue-500">AcadPulse</span></h1>
          <p className="text-xl text-gray-400">To tailor your experience, please identify your primary role.</p>
          <p className="text-sm text-red-500/80 font-mono uppercase tracking-widest">Note: This cannot be changed later</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button 
            onClick={() => handleSelectRole(UserRole.STUDENT)}
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
            onClick={() => handleSelectRole(UserRole.TEACHER)}
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
};

export default Onboarding;
