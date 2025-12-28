
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { 
  decodeBase64Audio, 
  decodeAudioData, 
  createAudioBlob,
  getGeminiAI 
} from '../geminiService';
import { TranscriptionItem } from '../types';

const VoiceIntel: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = getGeminiAI();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Voice Intel Connected');
            setIsActive(true);
            setIsConnecting(false);

            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createAudioBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (msg) => {
            // Handle audio output
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const ctx = audioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(decodeBase64Audio(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Transcriptions
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              setTranscriptions(prev => {
                const last = prev[0];
                if (last && last.speaker === 'ai') {
                  return [{ ...last, text: last.text + text }, ...prev.slice(1)];
                }
                return [{ id: Math.random().toString(), speaker: 'ai', text, timestamp: Date.now() }, ...prev];
              });
            } else if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text;
              setTranscriptions(prev => {
                const last = prev[0];
                if (last && last.speaker === 'user') {
                  return [{ ...last, text: last.text + text }, ...prev.slice(1)];
                }
                return [{ id: Math.random().toString(), speaker: 'user', text, timestamp: Date.now() }, ...prev];
              });
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error('Voice Error', e),
          onclose: () => {
            setIsActive(false);
            setIsConnecting(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are an advanced voice intelligence agent. Be extremely fast, professional, and insight-driven.'
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsActive(false);
  };

  return (
    <div className="p-8 h-full flex flex-col items-center animate-in fade-in duration-500 overflow-hidden">
      <div className="w-full max-w-4xl flex flex-col h-full space-y-8">
        <div className="flex justify-between items-center bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all duration-700 ${isActive ? 'bg-blue-600 animate-pulse shadow-[0_0_30px_rgba(37,99,235,0.5)]' : 'bg-gray-800'}`}>
              🎙️
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Voice Intelligence</h3>
              <p className="text-sm text-gray-500">{isActive ? 'Session in progress...' : 'Ready for cognitive sync'}</p>
            </div>
          </div>
          
          <button 
            onClick={isActive ? stopSession : startSession}
            disabled={isConnecting}
            className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-xl ${
              isActive 
                ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isConnecting ? 'Syncing...' : isActive ? 'Terminate Session' : 'Initiate Sync'}
          </button>
        </div>

        <div className="flex-1 bg-gray-950 rounded-3xl border border-gray-800 p-6 overflow-y-auto space-y-6 relative custom-scrollbar">
          {transcriptions.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
              <div className="w-1 h-12 bg-gray-800 rounded-full animate-bounce"></div>
              <p className="font-mono uppercase tracking-widest text-xs">Waiting for Signal</p>
            </div>
          )}
          {transcriptions.map((item) => (
            <div key={item.id} className={`flex ${item.speaker === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                item.speaker === 'user' 
                  ? 'bg-blue-600/10 text-blue-200 border border-blue-600/20' 
                  : 'bg-gray-900 text-gray-300 border border-gray-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                    {item.speaker === 'user' ? 'Inbound' : 'Neural Core'}
                  </span>
                  <span className="text-[10px] opacity-30">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
          <div id="anchor"></div>
        </div>
      </div>
    </div>
  );
};

export default VoiceIntel;
