import React, { useState, useEffect } from 'react';
import { dataService } from '../dataService';
import { Class, UserProfile } from '../types';

const StudentClasses: React.FC<{ user: UserProfile }> = ({ user }) => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchClasses();
    }, [user.uid]);

    const fetchClasses = async () => {
        const data = await dataService.getStudentClasses();
        setClasses(data);
    };

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode) return;
        setLoading(true);
        setError('');

        try {
            const result = await dataService.joinClass(joinCode.toUpperCase());
            if (result) {
                setJoinCode('');
                fetchClasses();
            } else {
                setError("Invalid Class Code. Please check and try again.");
            }
        } catch (e) {
            setError("Error joining class. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-32 animate-in fade-in duration-700">
            <header>
                <h2 className="text-4xl font-black text-white tracking-tight">Academic Units</h2>
                <p className="text-gray-500 font-medium">Link your profile to institutional cohorts.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Join Class Form */}
                <div className="md:col-span-1">
                    <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="p-2 bg-blue-600/10 rounded-xl text-blue-500 text-lg">🔗</span>
                            Join Cohort
                        </h3>

                        <form onSubmit={handleJoinClass} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Access Code</label>
                                <input
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value)}
                                    placeholder="EX: AC3F9G"
                                    className="w-full bg-gray-950 border border-gray-800 p-4 rounded-2xl outline-none focus:border-blue-500 font-mono text-center text-lg tracking-[0.2em] transition-all uppercase placeholder:text-gray-800 text-white"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-bold text-center animate-shake">
                                    {error}
                                </div>
                            )}

                            <button
                                disabled={loading || !joinCode}
                                className="w-full bg-blue-600 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 transition disabled:opacity-50 shadow-xl shadow-blue-900/40 text-white"
                            >
                                {loading ? "Verifying..." : "Establish Link"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Joined Classes List */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-2">Active Enrollments</h3>

                    {classes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-900 rounded-[2.5rem] h-64 text-gray-800 gap-4">
                            <div className="text-5xl opacity-20">🏫</div>
                            <p className="text-xs font-mono uppercase tracking-widest">No active academic links found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {classes.map(c => (
                                <div key={c.id} className="bg-gray-900/40 border border-gray-800 p-6 rounded-[2rem] hover:border-gray-700 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-2xl group-hover:bg-indigo-600/20 transition-colors">
                                            🎓
                                        </div>
                                        <span className="bg-gray-950 px-3 py-1 rounded-lg border border-gray-800 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                                            {c.code}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{c.name}</h4>
                                        <p className="text-xs text-gray-500 font-medium">Instructor ID: {c.teacherUid.slice(0, 8)}...</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentClasses;
