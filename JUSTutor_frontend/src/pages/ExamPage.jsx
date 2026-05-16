import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, CheckCircle2, XCircle, Trophy, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth }     from '../context/AuthContext';
import api             from '../services/api';

const EXAM_ACCENT = '#f87171';

const SUBJECTS = ['Object-Oriented Programming','Data Structures','Algorithms','Databases','Networks','General'];

function pad(n) { return String(n).padStart(2, '0'); }
function fmt(s) { return `${pad(Math.floor(s/60))}:${pad(s%60)}`; }

/* ─── Setup ─────────────────────────────────────── */
function ExamSetup({ onStart, loading, t }) {
  const [cfg, setCfg] = useState({ topic:'', subject: SUBJECTS[0], difficulty:'medium', numQuestions:10, duration:20 });
  const set = k => v => setCfg(p => ({...p, [k]: v}));

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart(cfg);
  };

  const EXAM_COLOR = EXAM_ACCENT;
  const inputSt = {
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
      <div
        className="px-6 py-8 text-center"
        style={{ background: `linear-gradient(180deg, ${EXAM_COLOR}12 0%, transparent 100%)`, borderBottom: `1px solid ${EXAM_COLOR}18` }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: `linear-gradient(135deg, ${EXAM_COLOR}cc, ${EXAM_COLOR}66)`, boxShadow: `0 8px 32px ${EXAM_COLOR}44` }}
        >
          <Clock size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{t.exam.title}</h1>
        <p className="text-sm mt-1" style={{ color: '#4a5878' }}>{t.exam.subtitle}</p>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: EXAM_COLOR }}>
              {t.exam.topic} *
            </label>
            <input
              type="text"
              style={inputSt}
              placeholder="e.g. Sorting Algorithms"
              value={cfg.topic}
              onChange={e => set('topic')(e.target.value)}
              onFocus={e => { e.target.style.borderColor = `${EXAM_COLOR}60`; e.target.style.boxShadow = `0 0 0 3px ${EXAM_COLOR}15`; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: EXAM_COLOR }}>Subject</label>
              <select style={{ ...inputSt, cursor: 'pointer' }} value={cfg.subject} onChange={e => set('subject')(e.target.value)}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: EXAM_COLOR }}>{t.exam.difficulty}</label>
              <select style={{ ...inputSt, cursor: 'pointer' }} value={cfg.difficulty} onChange={e => set('difficulty')(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: EXAM_COLOR }}>{t.exam.numQ}</label>
              <select style={{ ...inputSt, cursor: 'pointer' }} value={cfg.numQuestions} onChange={e => set('numQuestions')(Number(e.target.value))}>
                {[5,8,10,15,20].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: EXAM_COLOR }}>{t.exam.duration}</label>
              <select style={{ ...inputSt, cursor: 'pointer' }} value={cfg.duration} onChange={e => set('duration')(Number(e.target.value))}>
                {[10,15,20,30,45,60].map(n => <option key={n} value={n}>{n} min</option>)}
              </select>
            </div>
          </div>

          {/* Rules summary */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} style={{ color: '#fbbf24' }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#fbbf24' }}>Exam Rules</span>
            </div>
            <ul className="text-xs space-y-1" style={{ color: '#8896b3' }}>
              <li>• Timer starts immediately when you begin</li>
              <li>• Exam auto-submits when time runs out</li>
              <li>• Navigation is locked during the exam</li>
              <li>• You cannot pause or restart</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${EXAM_COLOR}, #dc2626)`, boxShadow: `0 4px 20px ${EXAM_COLOR}44` }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? 'Generating exam…' : t.exam.start}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Taking exam ─────────────────────────────────── */
function ExamTaker({ quiz, cfg, onSubmit, t }) {
  const totalSec = cfg.duration * 60;
  const [timeLeft, setTimeLeft]   = useState(totalSec);
  const [answers, setAnswers]     = useState({});
  const [autoSub, setAutoSub]     = useState(false);
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;

  // Block page close
  useEffect(() => {
    const handler = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Timer
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setAutoSub(true);
          setTimeout(() => submitRef.current(answers), 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const setAnswer = (i, val) => setAnswers(p => ({...p, [i]: val}));
  const answered  = Object.keys(answers).length;
  const pctTime   = (timeLeft / totalSec) * 100;
  const danger    = timeLeft <= 120; // < 2 min

  const questions = quiz.questions || [];

  const handleManualSubmit = () => {
    if (!window.confirm(t.exam.warnings.leave)) return;
    onSubmit(answers);
  };

  const EXAM_COLOR = EXAM_ACCENT;

  if (autoSub) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: `linear-gradient(135deg, ${EXAM_COLOR}, #ea580c)` }}
        >
          <Clock size={28} className="text-white" />
        </div>
        <p className="text-lg font-bold text-slate-100">{t.exam.autoSubmit}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Sticky timer header */}
      <div
        className="sticky top-0 z-10 mb-6 rounded-xl p-4 transition-all"
        style={{
          background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lock size={14} style={{ color: '#3a4660' }} />
            <span className="text-xs" style={{ color: '#3a4660' }}>{t.exam.locked}</span>
          </div>
          <div
            className="flex items-center gap-2 font-mono text-2xl font-bold"
            style={{ color: danger ? '#f87171' : '#c8d0e8' }}
          >
            <Clock size={20} style={{ color: danger ? '#f87171' : EXAM_COLOR }} />
            {fmt(timeLeft)}
          </div>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${pctTime}%`,
              background: danger
                ? '#ef4444'
                : `linear-gradient(90deg, ${EXAM_COLOR}, #ea580c)`,
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs" style={{ color: '#3a4660' }}>
          <span>{answered}/{questions.length} answered</span>
          <span>{cfg.topic} · {cfg.difficulty}</span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, i) => {
          const type = q.type === 'multiple_choice' ? 'multiple' : q.type === 'true_false' ? 'boolean' : q.type;
          const opts = q.options || [];
          const isAnswered = answers[i] !== undefined;

          return (
            <div
              key={i}
              className="p-5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-start gap-3 mb-4">
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{
                    background: isAnswered ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                    color: isAnswered ? '#10b981' : '#3a4660',
                    border: `1px solid ${isAnswered ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {i + 1}
                </span>
                <p className="text-sm font-medium leading-relaxed" style={{ color: '#c8d0e8' }}>{q.question}</p>
              </div>

              {type === 'multiple' && (
                <div className="space-y-2">
                  {opts.map((opt, oi) => {
                    const selected = answers[i] === oi;
                    return (
                      <label
                        key={oi}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                        style={{
                          background: selected ? `${EXAM_COLOR}12` : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${selected ? `${EXAM_COLOR}50` : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        <input type="radio" name={`q${i}`} className="sr-only" checked={selected} onChange={() => setAnswer(i, oi)} />
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                          style={{ borderColor: selected ? EXAM_COLOR : 'rgba(255,255,255,0.2)' }}
                        >
                          {selected && <div className="w-2 h-2 rounded-full" style={{ background: EXAM_COLOR }} />}
                        </div>
                        <span className="text-sm" style={{ color: selected ? '#c8d0e8' : '#8896b3' }}>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {type === 'boolean' && (
                <div className="flex gap-3">
                  {[true, false].map(v => {
                    const selected = answers[i] === v;
                    return (
                      <label
                        key={String(v)}
                        className="flex-1 flex items-center justify-center p-3 rounded-xl cursor-pointer text-sm font-semibold transition-all"
                        style={{
                          background: selected ? `${EXAM_COLOR}15` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${selected ? `${EXAM_COLOR}50` : 'rgba(255,255,255,0.07)'}`,
                          color: selected ? EXAM_COLOR : '#5a6888',
                        }}
                      >
                        <input type="radio" className="sr-only" checked={selected} onChange={() => setAnswer(i, v)} />
                        {v ? '✓ True' : '✗ False'}
                      </label>
                    );
                  })}
                </div>
              )}

              {type === 'short' && (
                <textarea
                  rows={2}
                  className="w-full text-sm resize-none outline-none rounded-xl p-3 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#c8d0e8',
                  }}
                  placeholder="Your answer…"
                  value={answers[i] || ''}
                  onChange={e => setAnswer(i, e.target.value)}
                  onFocus={e => { e.target.style.borderColor = `${EXAM_COLOR}60`; e.target.style.boxShadow = `0 0 0 3px ${EXAM_COLOR}12`; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <button
          onClick={handleManualSubmit}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: `linear-gradient(135deg, ${EXAM_COLOR}, #dc2626)`, boxShadow: `0 4px 20px ${EXAM_COLOR}44` }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {t.exam.finishEarly}
        </button>
        <p className="text-center text-xs mt-2" style={{ color: '#2d3a52' }}>Navigation is locked — refreshing will submit your exam</p>
      </div>
    </div>
  );
}

/* ─── Results ─────────────────────────────────────── */
function ExamResults({ quiz, result, timeTaken, onReset, t }) {
  const pct     = Math.round(result.score ?? 0);
  const correct = result.correct_answers ?? 0;
  const total   = result.total_questions ?? (quiz.questions?.length ?? 0);

  const color = pct >= 80 ? '#f59e0b' : pct >= 60 ? '#10b981' : '#f43f5e';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div
        className="p-8 text-center mb-5 rounded-2xl"
        style={{ background: `${color}08`, border: `1px solid ${color}20` }}
      >
        <Trophy size={40} style={{ color, margin: '0 auto 12px' }} />
        <div className="text-5xl font-bold mb-2 tabular-nums" style={{ color }}>{pct}%</div>
        <p className="text-sm mb-1" style={{ color: '#4a5878' }}>{correct} / {total} correct</p>
        {timeTaken && <p className="text-xs" style={{ color: '#2d3a52' }}>{t.exam.timeTaken}: {fmt(timeTaken)}</p>}
        <button
          onClick={onReset}
          className="mt-6 px-8 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: `linear-gradient(135deg, ${EXAM_ACCENT}, #dc2626)`, boxShadow: `0 4px 16px ${EXAM_ACCENT}44` }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Take Another Exam
        </button>
      </div>

      <div className="space-y-3">
        {(quiz.questions || []).map((q, i) => {
          const fb = result.feedback?.[i];
          const ok = fb?.correct;
          return (
            <div
              key={i}
              className="p-4 rounded-xl"
              style={{
                background: ok ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                border: `1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}
            >
              <div className="flex items-start gap-3 mb-2">
                {ok
                  ? <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                  : <XCircle     size={15} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} />
                }
                <p className="text-sm font-medium text-slate-100">{q.question}</p>
              </div>
              {fb && (
                <div className="ml-6 text-xs space-y-1">
                  <div style={{ color: '#4a5878' }}>
                    <span className="font-medium text-slate-400">Your answer: </span>
                    <span style={{ color: ok ? '#10b981' : '#f87171' }}>{fb.user_answer || 'Skipped'}</span>
                  </div>
                  {!ok && (
                    <div style={{ color: '#4a5878' }}>
                      <span className="font-medium text-slate-400">Correct: </span>
                      <span style={{ color: '#10b981' }}>{fb.correct_answer}</span>
                    </div>
                  )}
                  {fb.explanation && (
                    <p
                      className="mt-2 p-2.5 rounded-lg leading-relaxed"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#5a6888' }}
                    >
                      {fb.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────── */
export default function ExamPage() {
  const { t } = useLanguage();
  const { isGuest } = useAuth();
  const navigate = useNavigate();

  if (isGuest) return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: `${EXAM_ACCENT}15`, border: `1px solid ${EXAM_ACCENT}25` }}>
        <Lock size={28} style={{ color: EXAM_ACCENT }} />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-100 mb-2">Sign in to take exams</p>
        <p className="text-sm max-w-xs" style={{ color: '#4a5878' }}>Create a free account to access timed exam mode with auto-submission and detailed post-exam review.</p>
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
  const [phase, setPhase]       = useState('setup');
  const [quiz,  setQuiz]        = useState(null);
  const [cfg,   setCfg]         = useState(null);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timeTaken, setTimeTaken] = useState(null);

  const handleStart = async (config) => {
    setLoading(true);
    try {
      const res = await api.generateQuiz({
        topic: config.topic,
        subject: config.subject,
        difficulty: config.difficulty,
        num_questions: config.numQuestions,
        types: ['multiple', 'boolean'],
      });
      setQuiz(res);
      setCfg(config);
      setStartTime(Date.now());
      setPhase('taking');
    } catch (err) {
      alert(err.message || 'Failed to generate exam. Check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async (answers) => {
    const taken = startTime ? Math.round((Date.now() - startTime) / 1000) : null;
    setTimeTaken(taken);

    // Score locally
    const questions = quiz.questions || [];
    const backendAnswers = {};
    questions.forEach((q, i) => {
      const type = q.type === 'multiple_choice' ? 'multiple' : q.type === 'true_false' ? 'boolean' : q.type;
      if (type === 'multiple') {
        const idx2l = {0:'A',1:'B',2:'C',3:'D'};
        backendAnswers[i] = idx2l[answers[i]] ?? (answers[i] ?? '');
      } else if (type === 'boolean') {
        backendAnswers[i] = answers[i] ? 'True' : 'False';
      } else {
        backendAnswers[i] = answers[i] ?? '';
      }
    });

    let correct = 0;
    const feedback = questions.map((q, i) => {
      const ua = backendAnswers[i] ?? '';
      const ca = q.correct_answer ?? '';
      const ok = ua.toString().toUpperCase() === ca.toString().toUpperCase();
      if (ok) correct++;
      return { correct: ok, user_answer: ua, correct_answer: ca, explanation: q.explanation || '' };
    });

    setResult({ score: (correct / questions.length) * 100, correct_answers: correct, total_questions: questions.length, feedback });
    setPhase('results');
  }, [quiz, startTime]);

  const reset = () => { setPhase('setup'); setQuiz(null); setResult(null); setTimeTaken(null); };

  return (
    <div className="min-h-full px-4 py-8">
      {phase === 'setup' && <ExamSetup onStart={handleStart} loading={loading} t={t} />}
      {phase === 'taking' && quiz && <ExamTaker quiz={quiz} cfg={cfg} onSubmit={handleSubmit} t={t} />}
      {phase === 'results' && quiz && result && <ExamResults quiz={quiz} result={result} timeTaken={timeTaken} onReset={reset} t={t} />}
    </div>
  );
}
