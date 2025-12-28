
import React, { useState } from 'react';
import { generateBrainstormImage } from '../geminiService';
import { BrainstormItem } from '../types';

const VisionLab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [items, setItems] = useState<BrainstormItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const url = await generateBrainstormImage(prompt);
      if (url) {
        setItems([{ id: Math.random().toString(), prompt, imageUrl: url, timestamp: Date.now() }, ...items]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  return (
    <div className="p-8 h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto w-full space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Vision Lab</h2>
          <p className="text-gray-400 text-lg">Synthesize concepts into cinematic visualizations in real-time.</p>
        </div>

        <div className="relative group">
          <input 
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            placeholder="Describe a futuristic neural network architecture..." 
            className="w-full bg-gray-950 border-2 border-gray-800 p-6 rounded-3xl text-xl outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xl pr-32"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition flex items-center gap-2"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Manifest'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-32">
          {items.map(item => (
            <div key={item.id} className="group relative overflow-hidden rounded-3xl border border-gray-800 bg-gray-950 shadow-2xl hover:border-blue-500/50 transition-all duration-500">
              <img src={item.imageUrl} alt={item.prompt} className="w-full aspect-video object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-90 p-6 flex flex-col justify-end">
                <p className="text-sm font-medium text-gray-200 line-clamp-2">{item.prompt}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  <button className="p-2 bg-gray-800/80 rounded-xl hover:bg-white hover:text-black transition">Download</button>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="aspect-video rounded-3xl border-2 border-dashed border-gray-800 bg-gray-900/50 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-gray-500 font-mono animate-pulse">Rendering latent space...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisionLab;
