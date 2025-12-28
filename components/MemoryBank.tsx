
import React, { useState } from 'react';
import { Note } from '../types';
import { generateResponse } from '../geminiService';

const MemoryBank: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([
    { id: '1', title: 'Product Roadmap Q3', content: 'Focus on multimodal interfaces and real-time streaming latency.', timestamp: Date.now(), tags: ['Strategy'], type: 'text' },
    { id: '2', title: 'AI Ethics Policy', content: 'Guidelines for bias mitigation in generative models.', timestamp: Date.now() - 86400000, tags: ['Legal'], type: 'text' }
  ]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);

  const handleAddNote = () => {
    if (!newNote.title || !newNote.content) return;
    const note: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: newNote.title,
      content: newNote.content,
      timestamp: Date.now(),
      tags: [],
      type: 'text'
    };
    setNotes([note, ...notes]);
    setNewNote({ title: '', content: '' });
  };

  const handleSummarize = async (note: Note) => {
    setIsSummarizing(note.id);
    try {
      const summary = await generateResponse(`Summarize this note briefly and extract 3 key action points:\n\n${note.content}`);
      setNotes(notes.map(n => n.id === note.id ? { ...n, content: n.content + "\n\n--- AI SUMMARY ---\n" + summary } : n));
    } catch (error) {
      console.error(error);
    } finally {
      setIsSummarizing(null);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Memory Bank</h2>
        <div className="flex gap-2">
           <input type="text" placeholder="Search knowledge..." className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64" />
        </div>
      </div>

      <div className="bg-gray-950 p-6 rounded-3xl border border-gray-800 shadow-2xl space-y-4">
        <input 
          value={newNote.title} 
          onChange={e => setNewNote({...newNote, title: e.target.value})}
          placeholder="Note Title" 
          className="w-full bg-transparent text-xl font-bold outline-none border-b border-gray-800 pb-2 focus:border-blue-500 transition" 
        />
        <textarea 
          value={newNote.content}
          onChange={e => setNewNote({...newNote, content: e.target.value})}
          placeholder="Stream of consciousness starts here..." 
          className="w-full bg-transparent h-32 outline-none resize-none text-gray-300"
        />
        <div className="flex justify-end">
          <button 
            onClick={handleAddNote}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-lg shadow-blue-900/20"
          >
            Capture Thought
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {notes.map(note => (
          <div key={note.id} className="bg-gray-950 p-6 rounded-2xl border border-gray-800 hover:border-gray-700 transition flex flex-col gap-4 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-white">{note.title}</h3>
                <span className="text-xs text-gray-500">{new Date(note.timestamp).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2">
                {note.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-wider font-bold">{tag}</span>
                ))}
              </div>
            </div>
            <p className="text-gray-400 text-sm line-clamp-4 leading-relaxed whitespace-pre-wrap">{note.content}</p>
            <div className="mt-auto pt-4 flex gap-3 border-t border-gray-900">
              <button 
                onClick={() => handleSummarize(note)}
                disabled={!!isSummarizing}
                className="flex-1 text-xs font-semibold py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg transition border border-gray-800 flex items-center justify-center gap-2"
              >
                {isSummarizing === note.id ? (
                   <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : '🪄 AI Analysis'}
              </button>
              <button className="p-2 text-gray-500 hover:text-red-400 transition">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryBank;
