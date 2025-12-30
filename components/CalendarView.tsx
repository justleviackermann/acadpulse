
import React from 'react';
import { Task } from '../types';

interface CalendarViewProps {
    tasks: Task[];
    onDateClick?: (date: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onDateClick }) => {
    const [currentDate, setCurrentDate] = React.useState(new Date());

    const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Adjust start day to correct position
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyStartDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const getRiskColor = (dailyStress: number) => {
        if (dailyStress > 80) return 'bg-red-500/20 border-red-500/40 hover:bg-red-500/30';
        if (dailyStress > 50) return 'bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30';
        if (dailyStress > 20) return 'bg-yellow-500/20 border-yellow-500/40 hover:bg-yellow-500/30';
        return 'bg-gray-900/50 border-gray-800/50 hover:bg-gray-800/30';
    };

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-[2.5rem] p-8 backdrop-blur-xl mb-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">Academic Calendar</h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={prevMonth}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition"
                    >
                        &lt;
                    </button>

                    <span className="text-blue-400 font-mono uppercase tracking-widest text-sm min-w-[100px] text-center">
                        {currentDate.toLocaleString('default', { month: 'long' })}
                    </span>

                    <button
                        onClick={nextMonth}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition"
                    >
                        &gt;
                    </button>

                    <select
                        value={year}
                        onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month, 1))}
                        className="bg-gray-800 text-white text-sm font-bold py-1 px-3 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                    >
                        {Array.from({ length: 5 }, (_, i) => year - 2 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-gray-500 text-xs uppercase tracking-widest py-2">
                        {day}
                    </div>
                ))}

                {emptyStartDays.map(i => <div key={`empty-${i}`} />)}

                {days.map(day => {
                    const dateObj = new Date(year, month, day);
                    // Manually construct YYYY-MM-DD to avoid timezone issues
                    const y = dateObj.getFullYear();
                    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const d = String(dateObj.getDate()).padStart(2, '0');
                    const dateStr = `${y}-${m}-${d}`;

                    const dayTasks = tasks.filter(t => {
                        if (!t.dueDate) return false;
                        // t.dueDate is already stored as YYYY-MM-DD string
                        return t.dueDate === dateStr;
                    });

                    const dailyStress = dayTasks.reduce((acc, t) => acc + (t.stressScore || 0), 0);
                    const riskClass = getRiskColor(dailyStress);

                    return (
                        <div
                            key={day}
                            onClick={() => onDateClick && onDateClick(dateStr)}
                            className={`min-h-[100px] border rounded-2xl p-3 transition relative group cursor-pointer ${riskClass}`}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`text-sm font-bold ${dayTasks.length > 0 ? 'text-white' : 'text-gray-600'}`}>{day}</span>
                                {dailyStress > 0 && <span className="text-[9px] font-black text-white bg-black/40 px-1.5 rounded">{dailyStress}</span>}
                            </div>

                            <div className="mt-2 space-y-1">
                                {dayTasks.map(task => (
                                    <div key={task.id} className={`p-1.5 rounded text-[10px] truncate border ${task.type === 'CLASS' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-200' : 'bg-blue-500/20 border-blue-500/30 text-blue-200'
                                        }`}>
                                        {task.title}
                                    </div>
                                ))}
                            </div>
                            {/* Add "+" hint on hover */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span className="text-2xl font-black text-white/20">+</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;
