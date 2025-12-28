
import React, { useState, useEffect } from 'react';
import { dataService } from '../dataService';
import { Task, UserProfile } from '../types';
import { getPrioritization, getWellnessInsight } from '../geminiService';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const StudentDashboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [dailyStrategy, setDailyStrategy] = useState('');
  const [wellnessInsight, setWellnessInsight] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshData();
  }, [user.uid]);

  const refreshData = async () => {
    setLoading(true);
    const studentStats = await dataService.getStudentStressStats(user.uid);
    setTasks(studentStats.allTasks);
    setStats(studentStats);
    setHeatmap(dataService.getWeeklyHeatmap(studentStats.allTasks));
    
    if (studentStats.allTasks.length > 0) {
      try {
        const [prioData, insight] = await Promise.all([
          getPrioritization(studentStats.allTasks),
          getWellnessInsight(studentStats.score, studentStats.risk, studentStats.activeTasks.length)
        ]);
        setRecommendations(prioData.priorities || []);
        setDailyStrategy(prioData.dailyStrategy || "Maintain a steady cognitive rhythm.");
        setWellnessInsight(insight || "Your mental health is the engine of your success.");
      } catch (e) {
        console.error("AI Sync failed", e);
      }
    } else {
      setWellnessInsight("No tasks detected. Your academic pulse is in deep rest state.");
      setDailyStrategy("Reset and recharge for future cycles.");
    }
    setLoading(false);
  };

  const handleToggleTask = async (taskId: string, current: boolean) => {
    await dataService.togglePulse(taskId, !current);
    refreshData();
  };

  if (!stats) return null;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto pb-32 animate-in fade-in duration-700">
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-white tracking-tight">Academic Pulse</h2>
          <p className="text-gray-500 font-medium italic">"{dailyStrategy}"</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`px-5 py-2 rounded-2xl border-2 font-black tracking-widest text-sm shadow-lg transition-all duration-500 ${
            stats.risk === 'CRITICAL' ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse' : 
            stats.risk === 'HIGH' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 
            stats.risk === 'MODERATE' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' :
            'bg-green-500/10 border-green-500 text-green-500'
          }`}>
            RISK: {stats.risk}
          </div>
          {loading && <span className="text-[10px] font-mono text-blue-500 animate-pulse uppercase">AI Recalculating...</span>}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Analytics & Tasks */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Stress Index Card */}
          <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md relative overflow-hidden group">
            <div className={`absolute -top-20 -right-20 w-64 h-64 blur-[100px] opacity-20 transition-all duration-1000 ${stats.score > 70 ? 'bg-red-500' : 'bg-blue-600'}`}></div>
            
            <div className="flex justify-between items-end mb-8 relative z-10">
               <div>
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Cognitive Load Index</h3>
                  <p className={`text-7xl font-black tracking-tighter ${stats.score > 70 ? 'text-red-500' : 'text-blue-500'}`}>{stats.score}%</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Weekly Load Heatmap</p>
                  <div className="h-16 w-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={heatmap}>
                        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                          {heatmap.map((entry, index) => (
                            <Cell key={index} fill={entry.score > 60 ? '#ef4444' : '#2563eb'} fillOpacity={0.6} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>

            <div className="flex gap-6 border-t border-gray-800/50 pt-6 relative z-10">
              {heatmap.map((d, i) => (
                <div key={i} className="flex-1 text-center">
                  <div className={`h-1.5 rounded-full mb-2 transition-all duration-500 ${d.score > 60 ? 'bg-red-500' : 'bg-blue-600/30'}`} style={{ width: `${d.score}%`, margin: '0 auto' }}></div>
                  <span className="text-[10px] font-bold text-gray-600 uppercase">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task Feed */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white px-2">Workload Stream</h3>
            {tasks.length === 0 ? (
              <div className="py-20 text-center bg-gray-900/20 border-2 border-dashed border-gray-800 rounded-[2rem] text-gray-700 italic">
                No academic vectors detected. Add a personal task or join a class.
              </div>
            ) : tasks.map(task => {
              const rec = recommendations.find(r => r.taskId === task.id);
              return (
                <div key={task.id} className={`bg-gray-950/80 border p-6 rounded-[2rem] flex items-center justify-between group transition-all ${
                  rec?.category === 'DO_NOW' ? 'border-blue-500/40 bg-blue-500/5 shadow-lg shadow-blue-500/5' : 'border-gray-800 hover:border-blue-500/20 hover:bg-gray-900/50'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        task.type === 'CLASS' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
                      }`}>
                        {task.type}
                      </span>
                      <h4 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{task.title}</h4>
                      {rec?.category && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${
                          rec.category === 'DO_NOW' ? 'bg-red-600 text-white' : 
                          rec.category === 'QUICK_WIN' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {rec.category.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Due: {task.dueDate}</p>
                      {rec?.impactOnBurnout && (
                        <span className="text-[10px] text-blue-400 font-medium italic opacity-0 group-hover:opacity-100 transition-opacity">
                          {rec.impactOnBurnout}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    {task.type === 'PERSONAL' && (
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-gray-700 font-black uppercase mb-2 tracking-tighter">Impact Pulse</span>
                        <button 
                          onClick={() => handleToggleTask(task.id, task.includeInPulse)}
                          className={`w-12 h-6 rounded-full relative transition-all duration-500 ${task.includeInPulse ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-gray-800'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 ${task.includeInPulse ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    )}
                    <div className="text-center min-w-[80px]">
                      <div className="text-[9px] font-black text-gray-700 uppercase mb-0.5">Stress Factor</div>
                      <div className={`text-2xl font-black ${task.stressScore > 75 ? 'text-red-500' : 'text-blue-500'}`}>{task.stressScore}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Insights */}
        <div className="lg:col-span-4 space-y-8">
          {/* AI Wellness Sync */}
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
             <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
             <div className="flex items-center gap-3 mb-4 relative z-10">
                <span className="text-xl">🧬</span>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Wellness Sync</h3>
             </div>
             <p className="text-sm text-gray-300 font-medium leading-relaxed italic relative z-10">
               {wellnessInsight || "Analyzing cognitive bio-rhythms..."}
             </p>
          </div>

          {/* AI Prioritization Summary */}
          <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-2xl text-white space-y-6">
            <h3 className="text-[10px] font-black text-blue-100 uppercase tracking-[0.3em]">Neural Priority List</h3>
            <div className="space-y-4">
              {recommendations.length > 0 ? recommendations.slice(0, 3).map((r, idx) => (
                <div key={idx} className="flex gap-4 items-start border-l border-blue-400 pl-4 py-1">
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase text-blue-100">{r.category.replace('_', ' ')}</p>
                    <p className="text-sm font-bold truncate">{tasks.find(t => t.id === r.taskId)?.title || 'Loading task...'}</p>
                    <p className="text-[10px] opacity-70 leading-tight mt-1 line-clamp-2">{r.reason}</p>
                  </div>
                </div>
              )) : <p className="text-sm opacity-70">No immediate priorities. Use this time for reflection.</p>}
            </div>
          </div>

          {/* Impact Warning Section */}
          {stats.score > 60 && (
            <div className="bg-red-500/10 border-2 border-red-500/30 p-8 rounded-[2.5rem] space-y-4">
               <h3 className="text-red-500 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                 <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span> Impact Advisory
               </h3>
               <p className="text-xs text-red-200/80 leading-relaxed font-medium">
                 Your cognitive load has entered the 'Burnout Warning Zone' ({stats.score}%). AI suggests deferring any new personal projects for the next 48 hours to prevent systemic crash.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
