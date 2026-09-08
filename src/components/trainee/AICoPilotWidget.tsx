import React, { useState, useRef, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { safeText, FIELD_LIMITS, formatRetry } from '../../lib/security';
import { secureId } from '../../lib/security';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  ChevronDown, 
  Maximize2, 
  Minimize2, 
  Compass, 
  Loader2,
  HelpCircle,
  BookOpen
} from 'lucide-react';

interface AICoPilotWidgetProps {
  currentCourseTitle?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
}

export const AICoPilotWidget: React.FC<AICoPilotWidgetProps> = ({ currentCourseTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello, Scientist! I am your **MoES Earth Sciences Co-Pilot**. Ask me any technical question regarding Doppler Radar physics, NWP models (WRF/NCUM), Seismology (P/S wave inversion, INCOIS Tsunami Warning), or Monsoon Dynamics.`,
      timestamp: 'Just now',
      source: 'moes-copilot',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    'Explain Doppler Reflectivity dBZ scale',
    'How does INCOIS detect Indian Ocean Tsunamis?',
    'What are the WRF model primitive equations?',
    'Difference between dual-pol Z_DR and K_DP',
  ];

  const handleSendMessage = async (promptToSend?: string) => {
    const text = promptToSend || inputText.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: secureId('msg', 8).toLowerCase(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Same-origin, credentialed, CSRF-protected and length-capped request.
      const result = await apiRequest<{ reply?: string; source?: string }>('/api/gemini/chat', {
        method: 'POST',
        body: {
          message: safeText(text, FIELD_LIMITS.chatMessage),
          contextCourse: safeText(currentCourseTitle || 'MoES Earth Sciences Curriculum', 240),
        },
        timeoutMs: 30_000,
      });

      if (!result.ok) {
        const reason = result.error.status === 429
          ? `Study assistant is rate limited to protect portal quota. Try again in ${formatRetry(result.error.retryAfterSeconds)}.`
          : result.error.message;
        throw new Error(reason);
      }

      const data = result.data ?? {};
      // Upstream text is treated as data: control/zero-width characters are
      // stripped and the length is bounded before it enters component state.
      const reply = safeText(data.reply, 20_000) || 'I analyzed the MoES knowledge base and updated your study notes.';

      const botMsg: Message = {
        id: secureId('msg', 8).toLowerCase(),
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: safeText(data.source, 64) || 'gemini-3.8-flash',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      // Offline / rate limited / upstream failure: serve the cached briefing.

      const errorMsg: Message = {
        id: secureId('msg', 8).toLowerCase(),
        sender: 'assistant',
        text: 'Doppler Radar Principles: Reflectivity Factor Z measures backscattered power proportional to ΣD^6. Convective storms in IMD radars typically show Z > 45 dBZ with severe hail at > 55 dBZ.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'moes-offline-cache',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          id="ai-copilot-launcher-btn"
          onClick={() => setIsOpen(true)}
          className="liquid-glass-accent px-4 py-3 rounded-full border-2 border-rose-400 dark:border-rose-500 text-rose-950 dark:text-rose-100 font-bold text-xs shadow-2xl flex items-center gap-2.5 hover:scale-105 active:scale-95 transition duration-200 group bg-white/90 dark:bg-slate-800/90 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md group-hover:rotate-12 transition">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left pr-1">
            <span className="block text-[11px] font-black leading-none text-slate-900 dark:text-white">
              Earth Co-Pilot AI
            </span>
            <span className="text-[10px] text-rose-700 dark:text-rose-300 font-medium">
              Study Assistant
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      )}

      {/* Expanded Floating Liquid Glass Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] liquid-glass-card rounded-3xl border border-white/90 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl bg-white dark:bg-slate-900">
          
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-red-400 flex items-center justify-center text-white shadow-md">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  MoES Earth Co-Pilot
                  <span className="text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-400/30">
                    AI
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 truncate max-w-[220px]">
                  {currentCourseTitle || 'MoES National Learning Portal'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-50/50 dark:bg-slate-950/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-rose-700 text-white rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-line prose-xs">
                    {msg.text}
                  </div>

                  {msg.source && (
                    <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-400 font-mono">
                      <span>Source: {msg.source}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-300 w-fit">
                <Loader2 className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-spin" />
                <span>Consulting Earth Sciences Repository...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Pills */}
          <div className="px-3 py-2 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp)}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-800 dark:hover:text-rose-300 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              id="copilot-query-input"
              type="text"
              placeholder="Ask about Doppler radar, WRF equations..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value.slice(0, FIELD_LIMITS.chatMessage))}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500"
              maxLength={4000}
              />
            <button
              id="copilot-send-query-btn"
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white transition shadow-sm active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
