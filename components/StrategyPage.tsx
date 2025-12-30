import React, { useState, useEffect } from 'react';
import { dataService } from '../dataService';
import { Task, UserProfile } from '../types';
import PlanningView from './PlanningView';
import { getPrioritization } from '../geminiService';

const StrategyPage: React.FC<{ user: UserProfile }> = ({ user }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [strategy, setStrategy] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [includeOverdue, setIncludeOverdue] = useState(false); // New State

    useEffect(() => {
        loadData();
    }, [user.uid, includeOverdue]); // Reload when toggle changes

    const loadData = async () => {
        setLoading(true);
        try {
            const stats = await dataService.getStudentStressStats(user.uid);

            let activeTasks = stats.allTasks.filter(t => !t.isCompleted);

            // Filter out overdue if toggle is OFF
            if (!includeOverdue) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                activeTasks = activeTasks.filter(t => new Date(t.dueDate) >= today);
            }

            setTasks(activeTasks);

            if (activeTasks.length > 0) {
                try {
                    const strat = await getPrioritization(activeTasks);
                    setStrategy(strat);
                } catch (err) {
                    console.error(err);
                }
            } else {
                setStrategy(null); // Clear strategy if no active tasks
            }
        } catch (e) {
            console.error("Failed to load strategy", e);
            setStrategy(null);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-32 animate-in fade-in duration-700">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight">Executive Strategy</h2>
                    <p className="text-gray-500 font-medium">AI-driven prioritization engine.</p>
                </div>

                <div className="flex items-center gap-3 bg-gray-900/50 p-2 pr-4 rounded-full border border-gray-700">
                    <button
                        onClick={() => setIncludeOverdue(!includeOverdue)}
                        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${includeOverdue ? 'bg-red-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${includeOverdue ? 'left-7' : 'left-1'}`} />
                    </button>
                    <span className={`text-xs font-black uppercase tracking-widest ${includeOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                        {includeOverdue ? 'Include Overdue' : 'Future Only'}
                    </span>
                </div>
            </header>

            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-blue-500 font-mono animate-pulse">Running Neural Analysis...</p>
                </div>
            ) : (
                <PlanningView tasks={tasks} strategy={strategy} />
            )}
        </div>
    );
};

export default StrategyPage;
