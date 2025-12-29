
import React, { useState, useEffect } from 'react';
import { dataService } from '../dataService';
import { Class, Task, UserProfile } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { analyzeAssignmentStress } from '../geminiService';
import CalendarView from './CalendarView';

const TeacherDashboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [predictiveImpact, setPredictiveImpact] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [monthlyProjection, setMonthlyProjection] = useState<any[]>([]);

  useEffect(() => {
    // Corrected to await the async call and use zero arguments as defined in dataService
    const fetchClasses = async () => {
      const data = await dataService.getTeacherClasses();
      setClasses(data);
    };
    fetchClasses();
  }, [user.uid]);

  // Real-time AI simulation as teacher types
  useEffect(() => {
    if (taskTitle.length > 5 && taskDesc.length > 10) {
      const timer = setTimeout(() => handlePredictImpact(), 800);
      return () => clearTimeout(timer);
    }
  }, [taskTitle, taskDesc]);

  /* New State for Class Calendar */
  const [classTasks, setClassTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (selectedClass) {
      const fetchClassData = async () => {
        const [m, p, tasks] = await Promise.all([
          dataService.getClassStressMetrics(selectedClass.id),
          dataService.getMonthlyProjection(selectedClass.id),
          dataService.getClassTasks(selectedClass.id)
        ]);
        setMetrics(m);
        setMonthlyProjection(p);
        setClassTasks(tasks);
      };
      fetchClassData();
    } else {
      setMetrics([]);
      setMonthlyProjection([]);
      setClassTasks([]);
    }
  }, [selectedClass]);

  const handlePredictImpact = async () => {
    try {
      const analysis = await analyzeAssignmentStress(taskTitle, taskDesc);
      setPredictiveImpact(analysis);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;
    const nc = await dataService.createClass(newClassName);
    setClasses([...classes, nc]);
    setNewClassName('');
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !taskTitle || !taskDesc) return;

    // Check for stress overload
    const taskDateObj = new Date(taskDate);
    const dateStr = taskDateObj.toLocaleDateString('en-CA');

    // Simple check: fetch tasks for this date from classTasks
    const dailyLoad = classTasks
      .filter(t => t.dueDate === dateStr)
      .reduce((acc, t) => acc + (t.stressScore || 0), 0);

    if (dailyLoad > 100) {
      if (!window.confirm("WARNING: Students are already experiencing CRITICAL STRESS levels on this date. Are you sure you want to add more workload?")) {
        return;
      }
    } else if (dailyLoad > 60) {
      if (!window.confirm("Caution: Daily stress load is already high. Proceed with assignment?")) {
        return;
      }
    }

    setLoading(true);

    await dataService.assignToClass(
      selectedClass.id,
      taskTitle,
      taskDesc,
      taskDate
    );

    setLoading(false);
    setTaskTitle('');
    setTaskDesc('');
    setTaskDate('');
    setPredictiveImpact(null);
    alert("Assignment successfully synchronized with cohort pulse.");

    // Refresh to show new task
    const updatedTasks = await dataService.getClassTasks(selectedClass.id);
    setClassTasks(updatedTasks);
  };

  const classAvgStress = metrics.length > 0 ? Math.round(metrics.reduce((acc: number, m: any) => acc + m.score, 0) / metrics.length) : 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto pb-32 animate-in fade-in duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Educator Console</h2>
          <p className="text-gray-500 font-medium">Curriculum optimization & cohort mental health monitoring.</p>
        </div>
        <form onSubmit={handleCreateClass} className="flex gap-2">
          <input
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            placeholder="New Cohort Designation"
            className="bg-gray-900 border border-gray-800 px-6 py-3 rounded-2xl text-sm focus:border-blue-500 outline-none font-bold placeholder:text-gray-700 w-64 transition-all"
          />
          <button className="bg-blue-600 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-white hover:bg-blue-700 transition shadow-xl shadow-blue-900/20">Init Unit</button>
        </form>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Cohort Selection */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-4">Synchronized Units</h3>
          {classes.length === 0 ? (
            <div className="px-6 py-10 border-2 border-dashed border-gray-900 rounded-[2rem] text-xs text-gray-700 font-mono text-center">NO NODES DETECTED</div>
          ) : (
            classes.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClass(c)}
                className={`w-full p-6 rounded-[2rem] border text-left transition-all relative overflow-hidden group ${selectedClass?.id === c.id ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-2xl' : 'bg-gray-900/40 border-gray-800 text-gray-600 hover:border-gray-700'
                  }`}
              >
                <div className="relative z-10">
                  <p className="font-black text-lg mb-1">{c.name}</p>
                  <div className="flex justify-between items-center text-[10px] font-mono tracking-widest opacity-60">
                    <span>{c.studentUids.length} MEMBERS</span>
                    <span className="bg-gray-950 px-2 py-0.5 rounded border border-white/5 uppercase">{c.code}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-9 space-y-8">
          <CalendarView tasks={classTasks} />

          {selectedClass ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Overload Heatmap: 4-Week Projection */}
                <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                      <span className="w-1.5 h-6 bg-red-600 rounded-full"></span>
                      Cohort Stress Outlook
                    </h3>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Mean Stress</p>
                      <p className={`text-2xl font-black ${classAvgStress > 65 ? 'text-red-500' : 'text-blue-500'}`}>{classAvgStress}%</p>
                    </div>
                  </div>

                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyProjection}>
                        <XAxis dataKey="name" fontSize={10} stroke="#4b5563" axisLine={false} tickLine={false} dy={10} />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '11px' }}
                        />
                        <Bar dataKey="load" radius={[8, 8, 0, 0]} barSize={50}>
                          {monthlyProjection.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.load > 70 ? '#ef4444' : '#3b82f6'} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {monthlyProjection.some((p: any) => p.load > 75) && (
                    <div className="mt-6 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-3">
                      <span className="text-xl animate-bounce">🚨</span>
                      <p className="text-[11px] font-black text-red-500 uppercase tracking-widest leading-snug">
                        OVERLOAD ALERT: {monthlyProjection.find((p: any) => p.load > 75)?.name} exceeds cognitive safety thresholds.
                      </p>
                    </div>
                  )}
                </div>

                {/* Assignment Impact Predictor (The Tool) */}
                <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Workload Deployment</h3>
                    <div className="text-[9px] font-black text-gray-500 uppercase px-3 py-1 bg-gray-950 rounded-full border border-gray-800">PREDICTIVE AI ACTIVE</div>
                  </div>

                  <form onSubmit={handleAssignTask} className="space-y-4">
                    <input
                      required
                      value={taskTitle}
                      onChange={e => setTaskTitle(e.target.value)}
                      placeholder="Assignment Designation"
                      className="w-full bg-gray-950 border border-gray-800 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all placeholder:text-gray-800"
                    />
                    <textarea
                      required
                      value={taskDesc}
                      onChange={e => setTaskDesc(e.target.value)}
                      placeholder="Input learning objectives and effort requirements for impact simulation..."
                      className="w-full bg-gray-950 border border-gray-800 p-4 rounded-2xl outline-none focus:border-blue-500 h-28 resize-none text-sm transition-all placeholder:text-gray-800"
                    />
                    <input
                      type="date"
                      required
                      value={taskDate}
                      onChange={e => setTaskDate(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 p-4 rounded-2xl outline-none focus:border-blue-500 font-mono text-xs uppercase text-gray-400"
                    />

                    {predictiveImpact && (
                      <div className={`p-5 rounded-3xl border-2 transition-all animate-in zoom-in-95 duration-500 ${predictiveImpact.score > 70 ? 'bg-red-500/5 border-red-500/30' : 'bg-green-500/5 border-green-500/30'}`}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Predicted Load Delta</span>
                          <span className={`text-2xl font-black ${predictiveImpact.score > 70 ? 'text-red-500' : 'text-green-500'}`}>+{predictiveImpact.score}%</span>
                        </div>
                        <p className="text-[11px] leading-relaxed italic text-gray-400 border-l-2 border-gray-700 pl-4 mb-4">"{predictiveImpact.justification}"</p>
                        {predictiveImpact.score > 70 && (
                          <div className="flex items-center gap-2 text-[10px] font-black text-white bg-red-600 px-4 py-2 rounded-xl uppercase shadow-lg shadow-red-900/30">
                            <span>⚠️</span> DEPLOYMENT ADVISORY: Potential student burnout risk.
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      disabled={loading}
                      className="w-full bg-blue-600 py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-blue-700 transition disabled:opacity-50 shadow-2xl shadow-blue-900/40 text-white"
                    >
                      {loading ? "BROADCASTING TO PULSE..." : "DEPLOY COHORT TASK"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Individual Stress Matrix */}
              <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-[2.5rem] shadow-2xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                  <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                  Member Stress Matrix
                </h3>
                <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-3">
                  {metrics.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-gray-800 font-mono text-[10px] border-2 border-dashed border-gray-900 rounded-[2rem] uppercase tracking-[0.3em]">No student nodes detected in unit.</div>
                  ) : metrics.map((m, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-2xl transition-all cursor-crosshair relative group shadow-lg ${m.score > 80 ? 'bg-red-500 shadow-red-900/20 scale-105' :
                        m.score > 55 ? 'bg-orange-500 shadow-orange-900/10' :
                          m.score > 30 ? 'bg-yellow-500 shadow-yellow-900/5' : 'bg-green-600'
                        }`}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:block bg-gray-950 text-white text-[10px] px-4 py-3 rounded-2xl border border-gray-800 z-50 whitespace-nowrap shadow-2xl backdrop-blur-md">
                        <div className="flex items-center justify-between gap-6 mb-1">
                          <span className="font-black text-sm uppercase">Member {i + 1}</span>
                          <span className="font-black text-gray-400">{m.score}%</span>
                        </div>
                        <p className="opacity-60 uppercase tracking-tighter text-[9px] font-bold">
                          {m.hasPersonalTasks ? "INCLUDES EXTRACURRICULAR VECTORS" : "CURRICULUM ONLY"}
                        </p>
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-950 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-900 rounded-[3rem] h-[600px] text-gray-800 space-y-6">
              <div className="text-7xl opacity-10 select-none">🏫</div>
              <div className="text-center space-y-2">
                <p className="font-black uppercase tracking-[0.4em] text-xs">Waiting for Unit Synchronization</p>
                <p className="text-[10px] text-gray-800 font-mono italic">Select a managed unit to visualize cognitive dynamics.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
