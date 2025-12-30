import React, { useState, useEffect } from 'react';
import { dataService } from '../dataService';
import { Task, UserProfile } from '../types';
import PlanningView from './PlanningView';

const StrategyPage: React.FC<{ user: UserProfile }> = ({ user }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            // We use getStudentStressStats to get all tasks including class tasks
            const studentStats = await dataService.getStudentStressStats(user.uid);
            setTasks(studentStats.allTasks);
            setLoading(false);
        };
        fetchTasks();
    }, [user.uid]);

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-32 animate-in fade-in duration-700">
            {loading ? (
                <div className="flex h-64 items-center justify-center font-mono text-blue-500 animate-pulse uppercase tracking-[0.5em] text-xs">
                    Loading Strategic Data...
                </div>
            ) : (
                <PlanningView tasks={tasks} />
            )}
        </div>
    );
};

export default StrategyPage;
