
import React, { useState, useEffect } from 'react';
import { dataService } from '../dataService';
import { simulateImpact } from '../geminiService';
import { Task, UserProfile } from '../types';

const IntelligenceHub: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [simTarget, setSimTarget] = useState('');
  const [delay, setDelay] = useState(2);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      const data = await dataService.getStudentTasks();
      setTasks(data);
    };
    fetchTasks();
  }, [user.uid]);

  const runSim = async () => {
    if (!simTarget) return;
    setLoading(true);
    try {
      const res = await simulateImpact(tasks, simTarget, `delay task by ${delay} days`);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto pb-24 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Impact Simulator</h2>
          <p className="text-gray-500 font-medium">Test hypothetical schedule shifts before committing.</p>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-xl text-[10px] font-black text-blue-500 uppercase tracking-widest">
          Monte Carlo Logic Enabled
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-[2.5rem] shadow-2xl space-y-8 backdrop-blur-md">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="p-2 bg-gray-950 rounded-lg text-sm">🛠️</span>
            Scenario Config
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Vector Selection</span>
              <select 
                value={simTarget}
                onChange={e => setSimTarget(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 p-5 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer"
              >
                <option value="">Choose task for simulation...</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Temporal Displacement</span>
                <span className="text-blue-500 font-black text-xs">+{delay} Days</span>
              </div>
              <input 
                type="range" min="1" max="14" 
                value={delay} 
                onChange={e => setDelay(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer mt-4 accent-blue-600"
              />
            </div>

            <button 
              onClick={runSim}
              disabled={loading || !simTarget}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
                loading ? 'bg-gray-800 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-900/40'
              }`}
            >
              {loading ? "Calculating Probabilities..." : "Execute Simulation"}
            </button>
          </div>
        </div>

        <div className="bg-gray-950 border border-gray-800 p-10 rounded-[2.5rem] relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
          {!result && !loading && (
            <div className="text-center space-y-4 opacity-30">
              <div className="text-5xl">🔭</div>
              <p className="font-mono text-[10px] uppercase tracking-widest">Select vectors to begin projection</p>
            </div>
          )}
          
          {loading && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="font-black text-blue-500 text-[10px] uppercase tracking-[0.5em] animate-pulse">Neural Pathfinding...</p>
            </div>
          )}

          {result && !loading && (
            <div className="w-full space-y-8 animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-center border-b border-gray-800 pb-8">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Projected Peak Load</p>
                  <p className={`text-6xl font-black ${result.newStressScore > 75 ? 'text-red-500' : 'text-blue-500'}`}>{result.newStressScore}%</p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-xs font-black border uppercase tracking-widest ${
                  result.burnoutRisk === 'high' || result.burnoutRisk === 'critical' 
                    ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse' 
                    : 'bg-green-500/10 border-green-500 text-green-500'
                }`}>
                  {result.burnoutRisk} Risk
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-gray-900/50 border border-gray-800 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Outcome Summary</p>
                  <p className="text-sm text-gray-200 leading-relaxed font-medium">"{result.warning}"</p>
                </div>
                
                <div className="p-5 bg-blue-600/5 border border-blue-500/20 rounded-2xl">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">AI-Optimized Alternative</p>
                  <p className="text-sm text-blue-100/80 leading-relaxed italic">"{result.alternativeAction}"</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceHub;
