'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles } from 'lucide-react';
import { AIMessage } from '@/types';

const DEMO_MESSAGES: AIMessage[] = [
  {
    role: 'assistant',
    content: "Hi! I'm PlaySphere AI 🏆 I can help you find the perfect sports venue in Lucknow. Try asking me something like:\n\n• \"Beginner badminton near Gomti Nagar under ₹300\"\n• \"Football turf for 10 friends this weekend\"\n• \"Cheapest swimming pool near Hazratganj\"",
    timestamp: new Date(),
  },
];

export function AIConciergePreview() {
  const [messages, setMessages] = useState<AIMessage[]>(DEMO_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history }),
      });

      const data = await res.json();
      const aiMessage: AIMessage = {
        role: 'assistant',
        content: data.response || data.error || 'Something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    'Beginner badminton near Gomti Nagar',
    'Football turf under ₹1000',
    'Swimming lessons for beginners',
  ];

  return (
    <div className="bg-[#080a10] border-3 border-black rounded-lg overflow-hidden shadow-[6px_6px_0px_#000]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-black bg-purple-600 text-white">
        <div className="w-9 h-9 rounded-md bg-yellow-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
          <Bot className="w-5 h-5 text-black" />
        </div>
        <div>
          <div className="font-display font-black text-white uppercase tracking-wider text-sm [text-shadow:1.5px_1.5px_0px_#000]">PlaySphere AI Concierge</div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 border border-black animate-pulse" />
            <span className="text-xs text-white/95 font-semibold">Online • Powered by Llama 3.1</span>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-yellow-400 ml-auto fill-yellow-400" />
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-hide scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-400 text-black border-2 border-black rounded-md rounded-br-none shadow-[2px_2px_0px_#000]'
                  : 'bg-[#121620] text-slate-200 border-2 border-black rounded-md rounded-bl-none shadow-[2px_2px_0px_#000]'
              }`}
            >
              <pre className="font-sans whitespace-pre-wrap">{msg.content}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#121620] border-2 border-black rounded-md rounded-bl-none px-4 py-3 shadow-[2px_2px_0px_#000] flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            className="text-xs bg-[#121526] border-2 border-black rounded-md px-3 py-1.5 text-slate-300 font-bold hover:bg-cyan-400 hover:text-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_#000] transition-all cursor-pointer"
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
          placeholder="Ask me anything about sports venues..."
          className="flex-1 min-w-0"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-11 h-11 rounded-md bg-purple-600 text-white font-bold border-2 border-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all flex-shrink-0 cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white fill-white" />}
        </button>
      </div>
    </div>
  );
}
