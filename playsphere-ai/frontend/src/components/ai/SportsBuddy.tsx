'use client';

import { useState, useRef, useEffect } from 'react';
import { Dumbbell, Send, Loader2, Lightbulb, Target } from 'lucide-react';
import { AIMessage } from '@/shared/types';
import { cn } from '@/shared/helpers/utils';

type Sport = 'badminton' | 'football' | 'swimming' | 'kabaddi' | '';

const SPORT_OPTIONS: { id: Sport; label: string; emoji: string }[] = [
  { id: '', label: 'All Sports', emoji: '🏆' },
  { id: 'badminton', label: 'Badminton', emoji: '🏸' },
  { id: 'football', label: 'Football', emoji: '⚽' },
  { id: 'swimming', label: 'Swimming', emoji: '🏊' },
  { id: 'kabaddi', label: 'Kabaddi', emoji: '🤼' },
];

const QUICK_PROMPTS = [
  "I'm a complete beginner, where do I start?",
  'Find me affordable venues under ₹300',
  'What sport is best for fitness?',
  'Tips for morning workout sessions',
  'Best time to practice to avoid crowds',
];

const INITIAL_MESSAGE: AIMessage = {
  role: 'assistant',
  content: "Hi! I'm your AI Sports Buddy 🏆\n\nI'm here to help you get started with sports in Lucknow — whether you're a complete beginner or looking to improve your game.\n\nAsk me anything:\n• Which sport suits you?\n• Affordable venue recommendations\n• Beginner tips & techniques\n• Best training times",
  timestamp: new Date(),
};

export function SportsBuddy() {
  const [messages, setMessages] = useState<AIMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport>('');
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMsg: AIMessage = { role: 'user', content: messageText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/ai/buddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, sport: selectedSport || undefined, history }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response || data.error || 'Something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#080a10] border-3 border-black rounded-lg overflow-hidden shadow-[6px_6px_0px_#000]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-black bg-emerald-600 text-white">
        <div className="w-9 h-9 rounded-md bg-yellow-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
          <Dumbbell className="w-5 h-5 text-black" />
        </div>
        <div>
          <div className="font-display font-black text-white uppercase tracking-wider text-sm [text-shadow:1.5px_1.5px_0px_#000]">
            AI Sports Buddy
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 border border-black animate-pulse" />
            <span className="text-xs text-white/95 font-semibold">Beginner-friendly guidance</span>
          </div>
        </div>
        <Target className="w-4 h-4 text-yellow-400 ml-auto" />
      </div>

      {/* Sport Selector */}
      <div className="px-4 pt-3 pb-2 border-b border-black/30">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Focus sport</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {SPORT_OPTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSport(s.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border-2 border-black font-bold transition-all',
                selectedSport === s.id
                  ? 'bg-emerald-400 text-black shadow-[1px_1px_0px_#000] translate-x-0.5 translate-y-0.5'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#000] shadow-[2px_2px_0px_#000]'
              )}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="h-72 overflow-y-auto p-4 space-y-4 scrollbar-hide scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-md bg-emerald-500 border-2 border-black flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 shadow-[1px_1px_0px_#000]">
                <Dumbbell className="w-3.5 h-3.5 text-black" />
              </div>
            )}
            <div
              className={`max-w-[82%] px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-400 text-black border-2 border-black rounded-md rounded-br-none shadow-[2px_2px_0px_#000]'
                  : 'bg-[#121620] text-slate-200 border-2 border-black rounded-md rounded-bl-none shadow-[2px_2px_0px_#000]'
              }`}
            >
              <pre className="font-sans whitespace-pre-wrap">{msg.content}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-500 border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0px_#000]">
              <Dumbbell className="w-3.5 h-3.5 text-black" />
            </div>
            <div className="bg-[#121620] border-2 border-black rounded-md rounded-bl-none px-4 py-3 shadow-[2px_2px_0px_#000] flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce animation-delay-150ms" />
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce animation-delay-300ms" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-4 pb-2 flex flex-wrap gap-2 border-t border-black/20 pt-2">
        <div className="w-full flex items-center gap-1.5 mb-1">
          <Lightbulb className="w-3 h-3 text-yellow-400" />
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Quick questions</span>
        </div>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            disabled={loading}
            className="text-xs bg-[#121526] border-2 border-black rounded-md px-3 py-1.5 text-slate-300 font-bold hover:bg-emerald-400 hover:text-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_#000] transition-all cursor-pointer disabled:opacity-40"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 p-4 border-t-2 border-black">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask your sports buddy anything..."
          className="flex-1 min-w-0"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-11 h-11 rounded-md bg-emerald-600 text-white font-bold border-2 border-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all flex-shrink-0 cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white fill-white" />}
        </button>
      </div>
    </div>
  );
}
