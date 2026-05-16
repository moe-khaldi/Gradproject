import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send, Brain, User, Plus, Lightbulb, BookOpen,
  PenLine, AlignLeft, AlertCircle, Copy, Check,
  Sparkles, ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth }     from '../context/AuthContext';
import api             from '../services/api';

const CHAT_COLOR = '#a78bfa';

/* ─── Markdown ───────────────────────────────────────── */
function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function InlineText({ text }) {
  const html = escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(167,139,250,0.15);border:1px solid rgba(167,139,250,0.25);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:0.85em;color:#c4b5fd">$1</code>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-400 transition-colors px-2 py-1 rounded hover:bg-indigo-500/10"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function renderMarkdown(content) {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.flatMap((part, pi) => {
    if (part.startsWith('```')) {
      const lines = part.split('\n');
      const lang  = lines[0].slice(3).trim() || 'code';
      const code  = lines.slice(1, -1).join('\n');
      return (
        <div key={pi} className="my-3 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(167,139,250,0.2)', background: '#0a0d1a' }}>
          <div className="flex items-center justify-between px-4 py-2" style={{ background: 'rgba(167,139,250,0.08)', borderBottom: '1px solid rgba(167,139,250,0.12)' }}>
            <span className="font-mono text-xs" style={{ color: '#c4b5fd' }}>{lang}</span>
            <CopyBtn text={code} />
          </div>
          <pre className="p-4 overflow-x-auto text-sm leading-relaxed" style={{ color: '#c8d0e8', fontFamily: 'monospace' }}><code>{code}</code></pre>
        </div>
      );
    }
    return part.split('\n').map((line, li) => {
      const k = `${pi}-${li}`;
      if (line.startsWith('### ')) return <h3 key={k} className="font-semibold text-base mt-4 mb-1 text-slate-900 dark:text-slate-100"><InlineText text={line.slice(4)} /></h3>;
      if (line.startsWith('## '))  return <h2 key={k} className="font-bold text-lg mt-4 mb-1 text-slate-900 dark:text-slate-100"><InlineText text={line.slice(3)} /></h2>;
      if (line.startsWith('# '))   return <h1 key={k} className="font-bold text-xl mt-4 mb-2 text-slate-900 dark:text-slate-100"><InlineText text={line.slice(2)} /></h1>;
      if (line.match(/^[-*] /))    return <div key={k} className="flex gap-2 ml-3 my-0.5 text-sm leading-relaxed"><span style={{ color: CHAT_COLOR }} className="mt-0.5 shrink-0">•</span><span className="text-slate-700 dark:text-slate-300"><InlineText text={line.slice(2)} /></span></div>;
      if (line.match(/^\d+\.\s/))  return <div key={k} className="flex gap-2 ml-3 my-0.5 text-sm leading-relaxed"><span style={{ color: CHAT_COLOR }} className="font-medium shrink-0 min-w-[20px]">{line.match(/^\d+/)[0]}.</span><span className="text-slate-700 dark:text-slate-300"><InlineText text={line.replace(/^\d+\.\s/, '')} /></span></div>;
      if (line.match(/^---+$/))    return <hr key={k} className="my-3" style={{ borderColor: 'rgba(99,102,241,0.15)' }} />;
      if (!line.trim())            return <div key={k} className="h-1.5" />;
      return <p key={k} className="text-sm leading-relaxed my-0.5 text-slate-700 dark:text-slate-300"><InlineText text={line} /></p>;
    });
  });
}

/* ─── Guest demo responses ──────────────────────────── */
function guestReply(message, actionType) {
  const demos = {
    explain:   `## Explanation\n\nHere's a clear breakdown of the concept:\n\n**Core Idea:** The topic you're asking about is fundamental to understanding how software systems are designed and built.\n\n**Key Points:**\n- Abstraction helps manage complexity\n- Encapsulation protects data integrity\n- Inheritance promotes code reuse\n\n\`\`\`python\nclass Example:\n    def __init__(self, value):\n        self.value = value\n    \n    def describe(self):\n        return f"Value: {self.value}"\n\`\`\`\n\n> 💡 Sign in to get RAG-powered answers from your actual course materials.`,
    example:   `## Practical Example\n\nHere's a concrete code example:\n\n\`\`\`python\nclass Animal:\n    def __init__(self, name):\n        self.name = name\n\n    def speak(self):\n        raise NotImplementedError\n\nclass Dog(Animal):\n    def speak(self):\n        return f"{self.name} says Woof!"\n\`\`\`\n\nThis demonstrates **polymorphism** — same interface, different behaviour.\n\n> 💡 Sign in for personalized examples from your course content.`,
    practice:  `## Practice Problems\n\n**Problem 1:** Design a class hierarchy for a university system.\n\n**Problem 2:** Implement a Stack using an array with push, pop, and peek.\n\n**Problem 3:** Write a function to check if a binary tree is balanced.\n\n> 💡 Sign in to generate AI-powered practice problems tailored to your course.`,
    summarize: `## Summary\n\n**Key Concepts:**\n1. **Classes** — Blueprints for creating objects\n2. **Objects** — Instances with state and behaviour\n3. **Encapsulation** — Bundling data + methods\n4. **Inheritance** — Deriving new classes\n5. **Polymorphism** — Same interface, different implementations\n\n> 💡 Sign in for AI-generated summaries of your actual course materials.`,
  };
  if (demos[actionType]) return demos[actionType];
  return `## AI Tutor Response\n\nYou asked: *"${message}"*\n\nThis is a great question! In computer science, this concept relates to how we organize and structure programs for maintainability and scalability.\n\n**Key aspects to understand:**\n- The fundamental principles behind this topic\n- How it applies in real-world software development\n- Common patterns and best practices\n\n> 🔒 You're in **guest mode**. Sign in to get accurate, RAG-powered answers from your actual course materials with source references.`;
}

/* ─── Components ─────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 2px 12px rgba(124,58,237,0.45)' }}
      >
        <Brain size={15} className="text-white" />
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {[0,1,2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: CHAT_COLOR, animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}
         style={{ animation: 'fadeSlideUp 0.25s ease-out' }}>
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={isUser
          ? { background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 2px 10px rgba(124,58,237,0.35)' }
          : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }
        }
      >
        {isUser
          ? <User size={15} className="text-white" />
          : <Brain size={15} style={{ color: '#818cf8' }} />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
          style={isUser
            ? { background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', borderRadius: '18px 4px 18px 18px' }
            : msg.error
              ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px 18px 18px 18px', color: '#f87171' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 18px 18px 18px' }
          }
        >
          {isUser
            ? <p>{msg.content}</p>
            : <div>{renderMarkdown(msg.content)}</div>
          }
        </div>

        {/* Sources */}
        {msg.references?.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {msg.references.map((r, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: 'rgba(167,139,250,0.12)', color: CHAT_COLOR, border: '1px solid rgba(167,139,250,0.2)' }}
              >
                {r}
              </span>
            ))}
          </div>
        )}

        <span className="text-[10px] px-1" style={{ color: '#3a4660' }}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

/* ─── Welcome screen ─────────────────────────────────── */
function WelcomeScreen({ actions, onAction, isGuest, t }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-10 text-center px-6">
      {/* Orb */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-30"
          style={{ background: 'radial-gradient(circle, #7c3aed, #ec4899)', transform: 'scale(1.4)' }}
        />
        <div
          className="relative w-20 h-20 rounded-2xl flex items-center justify-center pulse-glow"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 8px 40px rgba(124,58,237,0.5)' }}
        >
          <Brain size={36} className="text-white" />
        </div>
      </div>

      {/* Text */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t.chat.welcome}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">{t.chat.welcomeSub}</p>
      </div>

      {/* Action chips */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {actions.map(({ icon: Icon, key, label, color }) => (
          <button
            key={key}
            onClick={() => onAction(label, key)}
            className="group flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${color}12`;
              e.currentTarget.style.borderColor = `${color}35`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
          </button>
        ))}
      </div>

      {isGuest && (
        <p
          className="text-xs max-w-sm px-4 py-2.5 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}
        >
          {t.chat.guestBanner}
        </p>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────── */
export default function ChatPage() {
  const { t } = useLanguage();
  const { isGuest } = useAuth();
  const [searchParams] = useSearchParams();

  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [isTyping,  setIsTyping]  = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [subject,   setSubject]   = useState(t.chat.subjects[0]);
  const [error,     setError]     = useState('');
  const [showSub,   setShowSub]   = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Load session from URL param (e.g. /chat?session=123 from History page)
  useEffect(() => {
    const sid = searchParams.get('session');
    if (!sid || isGuest) return;
    api.getSession(sid)
      .then(data => {
        setSessionId(data.id);
        if (data.subject) setSubject(data.subject);
        const loaded = (data.messages || []).map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.created_at || new Date().toISOString(),
        }));
        if (loaded.length) setMessages(loaded);
      })
      .catch(() => {}); // silent fail — just start a fresh chat
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const ACTION_BTNS = [
    { icon: Lightbulb, key: 'explain',   label: t.chat.actions.explain,   color: '#f59e0b' },
    { icon: BookOpen,  key: 'example',   label: t.chat.actions.example,   color: '#10b981' },
    { icon: PenLine,   key: 'practice',  label: t.chat.actions.practice,  color: '#6366f1' },
    { icon: AlignLeft, key: 'summarize', label: t.chat.actions.summarize, color: '#0ea5e9' },
  ];

  const sendMessage = async (text, actionType = null) => {
    const content = text?.trim() || actionType;
    if (!content) return;

    const userMsg = { role: 'user', content, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setError('');

    if (isGuest) {
      await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: guestReply(content, actionType),
        timestamp: new Date().toISOString(),
        guest: true,
      }]);
      setIsTyping(false);
      return;
    }

    try {
      const res = await api.sendMessage(content, subject, { actionType }, sessionId);
      if (res.session_id) setSessionId(res.session_id);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.response || res.message,
        timestamp: new Date().toISOString(),
        references: res.references?.map(r => r.source || r.file_name || JSON.stringify(r)) || [],
      }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'The AI service is temporarily unavailable. Please ensure the backend server and API keys are configured correctly.',
        timestamp: new Date().toISOString(),
        error: true,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full" style={{ background: 'transparent' }}>

      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(5,6,15,0.5)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Subject selector */}
        <div className="relative">
          <button
            onClick={() => setShowSub(s => !s)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'rgba(167,139,250,0.1)',
              border: '1px solid rgba(167,139,250,0.2)',
              color: CHAT_COLOR,
            }}
          >
            <Sparkles size={13} />
            <span className="max-w-[160px] truncate">{subject}</span>
            <ChevronDown size={13} style={{ opacity: 0.6 }} />
          </button>

          {showSub && (
            <div
              className="absolute top-full mt-1 left-0 z-50 rounded-xl overflow-hidden py-1"
              style={{
                background: '#0c0f1e',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                minWidth: 220,
              }}
            >
              {t.chat.subjects.map(s => (
                <button
                  key={s}
                  onClick={() => { setSubject(s); setShowSub(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                  style={{
                    color: s === subject ? CHAT_COLOR : '#5a6888',
                    background: s === subject ? 'rgba(167,139,250,0.1)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (s !== subject) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#e2e8f0'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = s === subject ? 'rgba(167,139,250,0.1)' : 'transparent'; e.currentTarget.style.color = s === subject ? CHAT_COLOR : '#5a6888'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => { setMessages([]); setSessionId(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ color: '#3a4660' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#c8d0e8'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3a4660'; }}
        >
          <Plus size={13} />
          {t.chat.newChat}
        </button>
      </div>

      {/* ── Messages ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: isEmpty ? 0 : '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}
        onClick={() => showSub && setShowSub(false)}
      >
        {isEmpty
          ? <WelcomeScreen actions={ACTION_BTNS} onAction={sendMessage} isGuest={isGuest} t={t} />
          : (
            <>
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              {isTyping && <TypingIndicator />}
              <div ref={bottomRef} />
            </>
          )
        }
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          className="mx-4 mb-2 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
        >
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* ── Input area ── */}
      <div
        className="px-4 py-4 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Quick actions */}
        {!isEmpty && (
          <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar">
            {ACTION_BTNS.map(({ icon: Icon, key, label, color }) => (
              <button
                key={key}
                onClick={() => sendMessage(label, key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#4a5878' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.color = color; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#4a5878'; }}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-3">
          <div
            className="flex-1 relative rounded-2xl transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.1)'; }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t.chat.placeholder}
              className="w-full bg-transparent text-sm resize-none focus:outline-none py-3 px-4"
              style={{
                color: '#c8d0e8',
                minHeight: 44,
                maxHeight: 128,
                height: Math.min(128, Math.max(44, input.split('\n').length * 22 + 22)) + 'px',
              }}
            />
          </div>

          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 4px 16px rgba(124,58,237,0.45)' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Send size={16} className="text-white" />
          </button>
        </div>

        <p className="text-center text-[10px] mt-2" style={{ color: '#2d3a52' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
