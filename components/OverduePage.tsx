import React, { useState, useEffect } from 'react';
import { dataService } from '../dataService';
import { Task, UserProfile } from '../types';

interface OverduePageProps {
    user: UserProfile;
}

const OverduePage: React.FC<OverduePageProps> = ({ user }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshData = async () => {
        setLoading(true);
        const stats = await dataService.getStudentStressStats(user.uid);
        // Filter for overdue tasks: Not completed AND Due Date < Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdue = stats.allTasks.filter(t =>
            !t.isCompleted && new Date(t.dueDate) < today
        );
        setTasks(overdue);
        setLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, [user.uid]);

    const handleToggleCompletion = async (taskId: string, isCompleted: boolean) => {
        await dataService.toggleTaskCompletion(taskId, isCompleted);
        refreshData();
    };

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto pb-32 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight">Critical Overdue</h2>
                    <p className="text-red-400 font-medium">Missed deadlines requiring immediate mitigation.</p>
                </div>
            </header>

            <div className="space-y-4">
                {tasks.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-gray-800 rounded-[2rem]">
                        <p className="text-gray-600 font-bold">No overdue vectors detected. Excellent velocity.</p>
                    </div>
                ) : tasks.map(task => (
                    <div key={task.id} className="bg-gray-900/40 border p-6 rounded-[2rem] flex items-center justify-between group transition border-red-500/30">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${task.type === 'CLASS' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
                                    }`}>
                                    {task.type}
                                </span>
                                <h4 className="font-bold text-white text-lg">{task.title}</h4>
                            </div>
                            <p className="text-xs text-red-400/70 font-mono">DUE: {task.dueDate}</p>
                        </div>

                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => handleToggleCompletion(task.id, true)}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest transition"
                            >
                                Mark Done
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OverduePage;
