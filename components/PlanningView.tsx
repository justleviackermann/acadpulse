import React from 'react';
import { Task } from '../types';

interface PlanningViewProps {
    tasks: Task[];
    strategy?: any;
}

const PlanningView: React.FC<PlanningViewProps> = ({ tasks, strategy }) => {
    // Sort logic: If AI strategy exists, use its sequence. Otherwise date.
    const sortedTasks = React.useMemo(() => {
        if (!strategy?.executionOrder) {
            return [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        }

        // Map sequence to tasks
        return [...tasks].sort((a, b) => {
            const seqA = strategy.executionOrder.find((s: any) => s.taskId === a.id)?.sequence || 999;
            const seqB = strategy.executionOrder.find((s: any) => s.taskId === b.id)?.sequence || 999;
            return seqA - seqB;
        });
    }, [tasks, strategy]);

    const getAdvice = (task: Task) => {
        // Use AI reason if available
        if (strategy?.executionOrder) {
            const plan = strategy.executionOrder.find((s: any) => s.taskId === task.id);
            if (plan?.reason) return plan.reason;
        }

        const stress = task.stressScore || 50;
        const type = task.type === 'CLASS' ? 'Official' : 'Personal';

        if (stress > 80 && type === 'Official')
            return "Start 2 weeks early. Focus on high-yield revision.";
        if (stress > 60)
            return "Break this down. Start 5 days before deadline.";
        if (stress > 40)
            return "Review materials 2 days prior.";
        return "Can be completed in one sitting.";
    };

    const getRecommendationColor = (stress: number) => {
        if (stress > 75) return 'text-red-400';
        if (stress > 50) return 'text-orange-400';
        return 'text-green-400';
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <header className="mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight">Strategic Planner</h2>
                <p className="text-gray-500 font-medium">AI-optimized timeline for academic success.</p>
                {strategy?.dailyStrategy && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-3xl relative overflow-hidden">
                        <div className="flex items-start gap-4 relative z-10">
                            <span className="text-4xl">🤖</span>
                            <div>
                                <h3 className="text-blue-300 font-black uppercase tracking-widest text-xs mb-2">Gemini Tactical Advisory</h3>
                                <p className="text-blue-100 font-medium leading-relaxed">"{strategy.dailyStrategy}"</p>
                            </div>
                        </div>
                        {/* Decor */}
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timeline Column */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-black text-gray-600 uppercase tracking-[0.3em] px-2 mb-4">OPTIMIZED EXECUTION ORDER</h3>
                    {sortedTasks.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-gray-800 rounded-[2rem]">
                            <p className="text-gray-600 font-mono text-sm">NO ACTIVE VECTORS DETECTED</p>
                        </div>
                    ) : sortedTasks.map((task, index) => (
                        <div key={task.id} className="bg-gray-900/40 border border-gray-800 p-6 rounded-[2rem] hover:bg-gray-900/60 transition group flex gap-4">
                            <div className="flex flex-col items-center justify-center min-w-[3rem]">
                                <span className="text-xs font-black text-gray-600 uppercase tracking-widest">SEQ</span>
                                <span className={`text-2xl font-black ${index === 0 ? 'text-blue-400' : 'text-gray-500'}`}>{index + 1}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition">{task.title}</h4>
                                        <p className="text-gray-500 text-sm">{task.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-xs text-gray-400 mb-1">DUE {task.dueDate}</p>
                                        <span className={`text-[10px] font-black px-2 py-1 rounded border ${task.stressScore > 75 ? 'bg-red-500/10 border-red-500 text-red-500' :
                                            task.stressScore > 40 ? 'bg-orange-500/10 border-orange-500 text-orange-500' :
                                                'bg-green-500/10 border-green-500 text-green-500'
                                            }`}>{task.stressScore}% LOAD</span>
                                    </div>
                                </div>

                                {/* Advice Section */}
                                <div className="mt-4 pt-4 border-t border-gray-800 flex items-start gap-3">
                                    <span className="text-xl">💡</span>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Strategy Recommendation</p>
                                        <p className={`text-sm font-medium ${getRecommendationColor(task.stressScore)}`}>
                                            {getAdvice(task)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Readiness Score Column */}
                <div className="space-y-8">
                    <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-[2.5rem] relative overflow-hidden">
                        <h3 className="text-xl font-bold text-white mb-2">Readiness Score</h3>
                        <p className="text-gray-500 text-sm mb-6">Aggregate preparedness based on time-to-deadline ratio.</p>

                        {(() => {
                            // Calculate Real Readiness
                            // Formula: 100 - (AvgStress * (1 / AvgDaysToDeadline)) ... simplified:
                            // If no tasks, 100%. 
                            // Otherwise, inverse to the average stress load.
                            if (tasks.length === 0) return (
                                <div className="relative w-full aspect-square flex items-center justify-center">
                                    <div className="w-48 h-48 rounded-full border-8 border-gray-800 flex items-center justify-center relative">
                                        <span className="text-5xl font-black text-white">100%</span>
                                        <div className="absolute inset-0 rounded-full border-8 border-t-green-500 border-r-green-500 border-b-green-500 border-l-green-500"></div>
                                    </div>
                                </div>
                            );

                            const totalStress = tasks.reduce((acc, t) => acc + (t.stressScore || 0), 0);
                            const avgStress = totalStress / tasks.length;
                            const readiness = Math.max(0, Math.round(100 - (avgStress * 0.8))); // Simple heuristic

                            const getCircleColor = () => {
                                if (readiness > 80) return 'border-t-green-500 border-r-green-500';
                                if (readiness > 50) return 'border-t-blue-500 border-r-blue-500';
                                return 'border-t-red-500 border-r-red-500';
                            };

                            return (
                                <>
                                    <div className="relative w-full aspect-square flex items-center justify-center">
                                        <div className="w-48 h-48 rounded-full border-8 border-gray-800 flex items-center justify-center relative">
                                            <span className="text-5xl font-black text-white">{readiness}%</span>
                                            <div className={`absolute inset-0 rounded-full border-8 border-b-transparent border-l-transparent rotate-45 ${getCircleColor()}`}></div>
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-3">
                                        {readiness > 70 ? (
                                            <div className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/10 rounded-xl">
                                                <span className="text-green-500">✓</span>
                                                <p className="text-xs text-gray-400">Schedule is balanced.</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                                                <span className="text-red-500">!</span>
                                                <p className="text-xs text-gray-400">High load detected.</p>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                            <span className="text-blue-500">i</span>
                                            <p className="text-xs text-gray-400">{tasks.length} Active Tasks.</p>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanningView;
