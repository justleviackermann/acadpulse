
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 600 },
  { name: 'Thu', value: 800 },
  { name: 'Fri', value: 500 },
  { name: 'Sat', value: 900 },
  { name: 'Sun', value: 1100 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back, Architect</h2>
          <p className="text-gray-400">Your cognitive workspace is synced and ready.</p>
        </div>
        <div className="bg-gray-900 p-2 rounded-lg border border-gray-800 flex gap-4 text-sm font-medium text-gray-400">
          <div className="px-3 py-1 bg-gray-800 rounded text-white">Today</div>
          <div className="px-3 py-1 hover:text-white cursor-pointer transition">Week</div>
          <div className="px-3 py-1 hover:text-white cursor-pointer transition">Month</div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl group hover:border-blue-500/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">🧠</span>
            <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">+12%</span>
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Total Notes</h3>
          <p className="text-3xl font-bold text-white">2,842</p>
        </div>
        <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl group hover:border-indigo-500/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">⚡</span>
            <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">+4.2h</span>
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Time Saved</h3>
          <p className="text-3xl font-bold text-white">128.5 hrs</p>
        </div>
        <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl group hover:border-purple-500/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">🔮</span>
            <span className="text-xs font-bold text-purple-500 bg-purple-500/10 px-2 py-1 rounded">PRO</span>
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Concepts Generated</h3>
          <p className="text-3xl font-bold text-white">412</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-950 p-8 rounded-3xl border border-gray-800 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
            Intelligence Velocity
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px' }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-950 p-8 rounded-3xl border border-gray-800 shadow-2xl flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-indigo-600 rounded-full"></span>
            Recent Synergies
          </h3>
          <div className="flex-1 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 hover:bg-gray-900 transition flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-xl">📄</div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-200">System Architecture v2.4</h4>
                  <p className="text-xs text-gray-500">Modified 2 hours ago • AI Summarized</p>
                </div>
                <button className="text-gray-500 hover:text-white transition">•••</button>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-3 bg-gray-900 text-gray-300 rounded-xl font-medium border border-gray-800 hover:border-gray-700 hover:bg-gray-800 transition">
            View All Projects
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
