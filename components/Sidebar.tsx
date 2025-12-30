
import React from 'react';
import { AppView, UserRole } from '../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  role: UserRole;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, role, onLogout }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Pulse Dashboard', icon: '📊' },
    role === UserRole.STUDENT && { id: AppView.STRATEGY, label: 'Strategy', icon: '🧠' },
    role === UserRole.STUDENT && { id: AppView.CLASSES, label: 'Classes', icon: '🏫' },
  ].filter(Boolean) as { id: AppView, label: string, icon: string }[];

  return (
    <div className="w-64 h-screen bg-gray-950 border-r border-gray-800 flex flex-col p-4">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20">A</div>
        <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">AcadPulse</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${currentView === item.id
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold'
              : 'text-gray-500 hover:bg-gray-900 hover:text-gray-200'
              }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{role} Portal</span>
          </div>
          <p className="text-[10px] text-gray-600 font-mono leading-tight">
            Acad-Sync Engine v1.1<br />
            Neural Predictor Active
          </p>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-3 text-xs font-bold text-gray-500 hover:text-red-400 transition flex items-center justify-center gap-2"
        >
          <span>🚪</span> Exit System
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
