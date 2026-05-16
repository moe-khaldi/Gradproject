import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Loader2, RotateCcw, ChevronRight, ChevronLeft,
  CheckCircle2, XCircle, Sparkles, RefreshCw, Trophy,
  Lightbulb, AlertCircle, Lock,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth }     from '../context/AuthContext';
import api             from '../services/api';

const SUBJECTS = [
  'Object-Oriented Programming', 'Data Structures', 'Algorithms',
  'Databases', 'Networks', 'Operating Systems', 'General',
];

/* ── 3-D card component ─────────────────────────────────────── */
function FlipCard({ front, back, hint, flipped, onClick }) {
  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer select-none"
      style={{ width: '100%', maxWidth: '560px', height: '320px', perspective: '1200px' }}
    >
      <div
        style={{
          position: 'absolute', inset: 0,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4,0.2,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 border"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)',
            borderColor: 'rgba(99,102,241,0.25)',
            boxShadow: '0 8px 40px rgba(99,102,241,0.12)',
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
            <Layers size={18} className="text-white" />
          </div>
          <p className="text-xl font-semibold text-slate-900 dark:text-slate-100 text-center leading-relaxed">
            {front}
          </p>
          {hint && (
            <div className="mt-5 flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400 opacity-70">
              <Lightbulb size={11} />
              <span>{hint}</span>
            </div>
          )}
          <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">Click to reveal answer</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 border"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.07) 0%, rgba(5,150,105,0.07) 100%)',
            borderColor: 'rgba(16,185,129,0.25)',
            boxShadow: '0 8px 40px rgba(16,185,129,0.10)',
          }}
        >
          <p className="text-base text-slate-700 dark:text-slate-200 text-center leading-relaxed">
            {back}
          </p>
          <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">Click to flip back</p>
        </div>
      </div>
    </div>
  );
}

const FC_COLOR = '#f472b6'; // pink — flashcards identity

/* ── Setup form ─────────────────────────────────────────────── */
function SetupForm({ onGenerate, loading, t }) {
  const [cfg, setCfg] = useState({
    topic: '', subject: SUBJECTS[0], numCards: 8,
  });

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#c8d0e8',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header strip */}
      <div
        className="px-6 py-8 text-center"
        style={{ background: `linear-gradient(180deg, ${FC_COLOR}12 0%, transparent 100%)`, borderBottom: `1px solid ${FC_COLOR}18` }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: `linear-gradient(135deg, ${FC_COLOR}cc, ${FC_COLOR}66)`, boxShadow: `0 8px 32px ${FC_COLOR}44` }}
        >
          <Layers size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{t.flashcards.title}</h1>
        <p className="text-sm mt-1" style={{ color: '#4a5878' }}>{t.flashcards.subtitle}</p>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="max-w-lg mx-auto space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: FC_COLOR }}>
              {t.flashcards.topic} *
            </label>
            <input
              style={inputStyle}
              placeholder={t.flashcards.topicPH}
              value={cfg.topic}
              onChange={e => setCfg(p => ({ ...p, topic: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = `${FC_COLOR}60`; e.target.style.boxShadow = `0 0 0 3px ${FC_COLOR}15`; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: t.flashcards.subject, key: 'subject', opts: SUBJECTS.map(s => ({ k: s, v: s })) },
              { label: t.flashcards.numCards, key: 'numCards', opts: [4,6,8,10,12,15,20].map(n => ({ k: n, v: n })) },
            ].map(({ label, key, opts }) => (
              <div key={key}>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: FC_COLOR }}>
                  {label}
                </label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={cfg[key]}
                  onChange={e => setCfg(p => ({ ...p, [key]: key === 'numCards' ? +e.target.value : e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = `${FC_COLOR}60`; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  {opts.map(({ k, v }) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            ))}
          </div>

          <button
            disabled={!cfg.topic.trim() || loading}
            onClick={() => cfg.topic.trim() && onGenerate(cfg)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${FC_COLOR}, #db2777)`, boxShadow: `0 4px 20px ${FC_COLOR}44` }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" />{t.flashcards.generating}</>
              : <><Sparkles size={16} />{t.flashcards.generate}</>
            }
          </button>

          <div
            className="rounded-xl px-4 py-3 text-xs text-center"
            style={{ background: `${FC_COLOR}08`, border: `1px solid ${FC_COLOR}18`, color: '#4a5878' }}
          >
            {t.flashcards.shortcuts}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Result screen ──────────────────────────────────────────── */
function ResultScreen({ total, known, onRestart, onNew, t }) {
  const pct = total > 0 ? Math.round((known / total) * 100) : 0;
  const isPerfect = known === total;
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div
        className="p-8 max-w-sm w-full text-center space-y-6 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: `${color}18`, border: `2px solid ${color}35` }}
        >
          <Trophy size={28} style={{ color }} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">{t.flashcards.sessionDone}</h2>
          <p className="text-sm" style={{ color: '#4a5878' }}>
            {isPerfect ? t.flashcards.perfect : t.flashcards.keepGoing}
          </p>
        </div>

        {/* Score ring */}
        <div className="relative w-28 h-28 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={color} strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${color}88)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color }}>{pct}%</span>
            <span className="text-xs" style={{ color: '#3a4660' }}>{known}/{total}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#c8d0e8' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <RefreshCw size={14} /> {t.flashcards.restart}
          </button>
          <button
            onClick={onNew}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${FC_COLOR}, #db2777)`, boxShadow: `0 4px 16px ${FC_COLOR}33` }}
          >
            <Sparkles size={14} /> {t.flashcards.newSet}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function FlashcardsPage() {
  const { t } = useLanguage();
  const { isGuest } = useAuth();
  const navigate = useNavigate();

  if (isGuest) return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: `${FC_COLOR}15`, border: `1px solid ${FC_COLOR}25` }}>
        <Lock size={28} style={{ color: FC_COLOR }} />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-100 mb-2">Sign in to generate flashcards</p>
        <p className="text-sm max-w-xs" style={{ color: '#4a5878' }}>Create a free account to auto-generate AI flashcards on any topic and track what you know.</p>
      </div>
      <button onClick={() => navigate('/login')}
        className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        Sign In / Create Account
      </button>
    </div>
  );

  const [stage, setStage]   = useState('setup'); // setup | study | done
  const [cards, setCards]   = useState([]);
  const [idx, setIdx]       = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown]   = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const currentCard = cards[idx];

  const handleGenerate = async (cfg) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.generateFlashcards({
        subject: cfg.subject,
        topic: cfg.topic,
        num_cards: cfg.numCards,
      });
      setCards(data.cards || []);
      setIdx(0);
      setFlipped(false);
      setKnown(new Set());
      setStage('study');
    } catch (err) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleKnow = useCallback((knows) => {
    const newKnown = new Set(known);
    if (knows) newKnown.add(idx);
    setKnown(newKnown);
    setFlipped(false);
    if (idx + 1 >= cards.length) {
      setTimeout(() => setStage('done'), 280);
    } else {
      setTimeout(() => setIdx(i => i + 1), 280);
    }
  }, [idx, cards.length, known]);

  const handleRestart = () => {
    setIdx(0);
    setFlipped(false);
    setKnown(new Set());
    setStage('study');
  };

  const handleNew = () => {
    setStage('setup');
    setCards([]);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (stage !== 'study') return;
    const handler = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFlipped(f => !f);
      } else if (e.key === 'ArrowRight') {
        handleKnow(true);
      } else if (e.key === 'ArrowLeft') {
        handleKnow(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stage, handleKnow]);

  if (stage === 'done') {
    return (
      <div className="h-full flex flex-col">
        <ResultScreen
          total={cards.length}
          known={known.size}
          onRestart={handleRestart}
          onNew={handleNew}
          t={t}
        />
      </div>
    );
  }

  if (stage === 'setup') {
    return (
      <div className="h-full flex flex-col">
        {isGuest && (
          <div className="mx-6 mt-5 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <AlertCircle size={14} className="shrink-0" />
            You need to sign in to generate flashcards.
          </div>
        )}
        {error && (
          <div className="mx-6 mt-5 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}
        <SetupForm onGenerate={handleGenerate} loading={loading} t={t} />
      </div>
    );
  }

  /* ── Study stage ─────────────────────────── */
  const progress = ((idx) / cards.length) * 100;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {t.flashcards.card} {idx + 1} {t.flashcards.of} {cards.length}
          </span>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={12} /> {known.size} {t.flashcards.known}
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <XCircle size={12} /> {idx - known.size} {t.flashcards.learning}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(100,116,139,0.15)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }}
          />
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {currentCard && (
          <FlipCard
            front={currentCard.front}
            back={currentCard.back}
            hint={currentCard.hint}
            flipped={flipped}
            onClick={() => setFlipped(f => !f)}
          />
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleKnow(false)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          >
            <ChevronLeft size={15} />
            {t.flashcards.dontKnow}
          </button>

          <button
            onClick={() => setFlipped(f => !f)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            style={{ background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.15)' }}
            title="Flip (Space)"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={() => handleKnow(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
          >
            {t.flashcards.know}
            <ChevronRight size={15} />
          </button>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-600">{t.flashcards.shortcuts}</p>
      </div>
    </div>
  );
}
