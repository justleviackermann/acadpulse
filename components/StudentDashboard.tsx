import React, { useState, useEffect, useRef } from 'react';
import { dataService } from '../dataService';
import { Task, UserProfile } from '../types';
import { getPrioritization, getStressInsights } from '../geminiService';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import CalendarView from './CalendarView';

const StudentDashboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [executionOrder, setExecutionOrder] = useState<any[]>([]);
  const [dailyStrategy, setDailyStrategy] = useState('');
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Private Mode State
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [manualWeightage, setManualWeightage] = useState<string>(''); // string input for ease
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    refreshData();
  }, [user.uid]);

  /* Update refreshData to pass classId */
  const refreshData = async () => {
    setLoading(true);
    await dataService.seedExamData(user.uid, user.classId); // Pass classId for visibility
    const studentStats = await dataService.getStudentStressStats(user.uid);
    setTasks(studentStats.allTasks);
    setStats(studentStats);
    setHeatmap(dataService.getWeeklyHeatmap(studentStats.allTasks));

    if (studentStats.allTasks.length > 0) {
      try {
        const [prioData, insightData] = await Promise.all([
          getPrioritization(studentStats.allTasks),
          getStressInsights(studentStats.allTasks)
        ]);
        setExecutionOrder(prioData.executionOrder || []);
        setDailyStrategy(prioData.dailyStrategy || "Maintain a steady cognitive rhythm.");
        setInsights(insightData);
      } catch (e) {
        console.error("AI Sync failed", e);
      }
    } else {
      setDailyStrategy("Reset and recharge for future cycles.");
      setInsights(null);
    }
    setLoading(false);
  };

  const handleToggleTask = async (taskId: string, current: boolean) => {
    await dataService.togglePulse(taskId, !current);
    refreshData();
  };

  // Ref for the form to scroll to
  const formRef = useRef<HTMLDivElement>(null);

  const handleDateClick = (date: string) => {
    setIsPrivateMode(true);
    setNewTaskDate(date);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleCreatePersonalTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDate) return;
    setIsSubmitting(true);

    try {
      const stressScore = isPrivateMode && manualWeightage ? parseInt(manualWeightage) : undefined;

      await dataService.createTask({
        title: newTaskTitle,
        description: newTaskDesc || 'Personal vector',
        type: 'PERSONAL',
        studentUid: user.uid,
        dueDate: newTaskDate,
        includeInPulse: true, // Actually let's just make it active so it shows up in lists
        isPrivate: isPrivateMode,
        stressScore: stressScore,
      });

      // Reset form
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDate('');
      setManualWeightage('');
      refreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!stats) return null;

  // Filtering Logic
  // If Private Mode is OFF: Hide tasks where isPrivate === true
  // If Private Mode is ON: Show all tasks
  const visibleTasks = tasks.filter(t => isPrivateMode ? true : !t.isPrivate);

  return (
    <div className={`p-8 space-y-8 max-w-7xl mx-auto pb-32 animate-in fade-in duration-700 transition-colors duration-1000 ${isPrivateMode ? 'bg-black/80' : ''}`}>
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-white tracking-tight">Academic Pulse</h2>
          <p className="text-gray-500 font-medium italic">"{dailyStrategy}"</p>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-3 bg-gray-900/50 p-2 pr-4 rounded-full border border-gray-700">
            <button
              onClick={() => setIsPrivateMode(!isPrivateMode)}
              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isPrivateMode ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isPrivateMode ? 'left-7' : 'left-1'}`} />
            </button>
            <span className={`text-xs font-black uppercase tracking-widest ${isPrivateMode ? 'text-purple-400' : 'text-gray-500'}`}>
              {isPrivateMode ? 'Private Mode Active' : 'Public View'}
            </span>
          </div>

          <div className={`px-5 py-2 rounded-2xl border-2 font-black tracking-widest text-sm shadow-lg transition-all duration-500 ${stats.score > 75 ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse' :
            stats.score > 50 ? 'bg-orange-500/10 border-orange-500 text-orange-500' :
              'bg-green-500/10 border-green-500 text-green-500'
            }`}>
            RISK: {insights?.burnoutRiskScore > 70 ? 'CRITICAL' : stats.risk}
          </div>
          {loading && <span className="text-[10px] font-mono text-blue-500 animate-pulse uppercase">AI Recalculating...</span>}
        </div>
      </header>

      {/* Calendar Section - Prioritized Visibility */}
      <CalendarView tasks={visibleTasks} onDateClick={handleDateClick} />

      {/* Private Task Entry Form - Only Visible in Private Mode */}
      {isPrivateMode && (
        <div ref={formRef} className="bg-purple-900/10 border border-purple-500/30 p-6 rounded-[2rem] animate-in slide-in-from-top-4">
          <h3 className="text-purple-400 font-black uppercase tracking-widest text-sm mb-4">Add Private Vector</h3>
          <form onSubmit={handleCreatePersonalTask} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Task Title</label>
              <input
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:border-purple-500 outline-none"
                placeholder="Personal Goal..."
              />
            </div>
            <div className="w-32">
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Due Date</label>
              <input
                type="date"
                value={newTaskDate}
                onChange={e => setNewTaskDate(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:border-purple-500 outline-none"
              />
            </div>
            <div className="w-32">
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Weight (0-100)</label>
              <input
                type="number"
                value={manualWeightage}
                onChange={e => setManualWeightage(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:border-purple-500 outline-none"
                placeholder="Auto"
                max="100"
              />
            </div>
            <button
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest h-[38px] transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Private'}
            </button>
          </form>
        </div>
      )}

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
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Weekly Load Pattern</p>
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

          {/* Workload Feed with AI Recommended Order */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white px-2">Strategic Execution Path</h3>
            {visibleTasks.length === 0 ? (
              <div className="py-20 text-center bg-gray-900/20 border-2 border-dashed border-gray-800 rounded-[2rem] text-gray-700 italic">
                No active vectors. Add a personal task to initiate analysis.
              </div>
            ) : visibleTasks.sort((a, b) => {
              const orderA = executionOrder.find(o => o.taskId === a.id)?.sequence || 99;
              const orderB = executionOrder.find(o => o.taskId === b.id)?.sequence || 99;
              return orderA - orderB;
            }).map((task, idx) => {
              const orderInfo = executionOrder.find(o => o.taskId === task.id);
              return (
                <div key={task.id} className={`bg-gray-950/80 border p-6 rounded-[2rem] flex items-center justify-between group transition-all relative overflow-hidden ${task.isPrivate ? 'border-purple-500/30' :
                  idx === 0 ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-gray-800 hover:border-gray-700'
                  }`}>
                  {task.isPrivate && <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-[4rem]" />}

                  <div className="flex items-center gap-6 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border-2 ${task.isPrivate ? 'bg-purple-900/20 border-purple-500/50 text-purple-400' :
                      idx === 0 ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-900 border-gray-800 text-gray-600'
                      }`}>
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${task.isPrivate ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                          task.type === 'CLASS' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
                          }`}>
                          {task.isPrivate ? 'PRIVATE' : task.type}
                        </span>
                        <h4 className="font-bold text-white text-lg">{task.title}</h4>
                        {orderInfo?.category && (
                          <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-tighter">
                            {orderInfo.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                        {orderInfo?.reason || `Due: ${task.dueDate}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-10 relative z-10">
                    {task.type === 'PERSONAL' && (
                      <button
                        onClick={() => handleToggleTask(task.id, task.includeInPulse)}
                        className={`w-12 h-6 rounded-full relative transition-all duration-500 ${task.includeInPulse ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-gray-800'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 ${task.includeInPulse ? 'left-7' : 'left-1'}`} />
                      </button>
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
          {/* Stress Profile Insight */}
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 blur-3xl"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <span className="text-xl">📊</span>
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Cognitive Report</h3>
            </div>
            {insights ? (
              <div className="space-y-4 relative z-10">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Classification</p>
                  <p className="text-lg font-black text-white">{insights.workloadType}</p>
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Primary Stressor</p>
                  <p className="text-sm text-gray-300 font-medium">{insights.primaryStressor}</p>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400 italic leading-relaxed">"{insights.healthInsight}"</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 italic">Initiate vectors to generate neural report...</p>
            )}
          </div>

          {/* Actionable Advice List */}
          <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-2xl text-white space-y-6">
            <h3 className="text-[10px] font-black text-blue-100 uppercase tracking-[0.3em]">AI Directives</h3>
            <div className="space-y-4">
              {insights?.actionableAdvice?.map((advice: string, idx: number) => (
                <div key={idx} className="flex gap-4 items-start border-l border-blue-400 pl-4 py-1">
                  <p className="text-sm font-bold leading-snug">{advice}</p>
                </div>
              ))}
              {!insights && <p className="text-sm opacity-70">Awaiting system synchronization...</p>}
            </div>
          </div>

          {/* Critical Warning */}
          {(stats.score > 60 || insights?.burnoutRiskScore > 60) && (
            <div className="bg-red-500/10 border-2 border-red-500/30 p-8 rounded-[2.5rem] space-y-4">
              <h3 className="text-red-500 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span> Critical Advisory
              </h3>
              <p className="text-xs text-red-200/80 leading-relaxed font-bold">
                System identifies elevated risk of academic burnout. Neural resources should be reallocated to "Quick Win" tasks immediately.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
