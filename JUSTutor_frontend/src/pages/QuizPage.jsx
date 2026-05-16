import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Loader2, CheckCircle2, XCircle, RotateCcw,
  ChevronRight, ChevronLeft, AlertCircle, Trophy, Sparkles, Lock,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth }     from '../context/AuthContext';
import api             from '../services/api';

const SUBJECTS = ['Object-Oriented Programming','Data Structures','Algorithms','Databases','Networks','Operating Systems','General'];
const COLOR = '#22d3ee'; // cyan — quiz page identity color

function saveQuizResult(result) {
  try {
    const prev = JSON.parse(localStorage.getItem('quiz_results') || '[]');
    prev.unshift({ ...result, id: Date.now(), date: new Date().toISOString().split('T')[0] });
    localStorage.setItem('quiz_results', JSON.stringify(prev.slice(0, 50)));
  } catch {}
}

/* ── Setup ──────────────────────────────────────────────── */
function QuizSetup({ onGenerate, loading, t }) {
  const [cfg, setCfg] = useState({
    topic: '', subject: SUBJECTS[0], difficulty: 'medium',
    numQuestions: 5,
    types: { multiple: true, boolean: true, short: false },
  });
  const set = k => v => setCfg(p => ({ ...p, [k]: v }));
  const toggleType = k => setCfg(p => ({ ...p, types: { ...p.types, [k]: !p.types[k] } }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const types = Object.entries(cfg.types).filter(([,v]) => v).map(([k]) => k);
    if (!types.length) return alert('Select at least one question type.');
    onGenerate({ ...cfg, types });
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header strip */}
      <div
        className="px-6 py-8 text-center shrink-0"
        style={{
          background: `linear-gradient(180deg, ${COLOR}12 0%, transparent 100%)`,
          borderBottom: `1px solid ${COLOR}18`,
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: `linear-gradient(135deg, ${COLOR}cc, ${COLOR}66)`, boxShadow: `0 8px 32px ${COLOR}44` }}
        >
          <BookOpen size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.quiz.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.quiz.subtitle}</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-4 py-6">
        <div className="max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Topic */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: COLOR }}>
                {t.quiz.topic} *
              </label>
              <input
                type="text"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#c8d0e8',
                }}
                onFocus={e => { e.target.style.borderColor = `${COLOR}60`; e.target.style.boxShadow = `0 0 0 3px ${COLOR}15`; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                placeholder={t.quiz.topicPH}
                value={cfg.topic}
                onChange={e => set('topic')(e.target.value)}
                required
              />
            </div>

            {/* Subject + Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: t.quiz.subject,     key: 'subject',    opts: SUBJECTS.map(s => ({ k: s, v: s })) },
                { label: t.quiz.difficulty,  key: 'difficulty', opts: Object.entries(t.quiz.difficulties).map(([k,v]) => ({ k, v })) },
              ].map(({ label, key, opts }) => (
                <div key={key}>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: COLOR }}>
                    {label}
                  </label>
                  <select
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#c8d0e8' }}
                    onFocus={e => { e.target.style.borderColor = `${COLOR}60`; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    value={cfg[key]}
                    onChange={e => set(key)(e.target.value)}
                  >
                    {opts.map(({ k, v }) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Number of questions */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: COLOR }}>
                {t.quiz.numQuestions}
              </label>
              <div className="flex gap-2">
                {[3, 5, 8, 10].map(n => (
                  <button
                    key={n} type="button"
                    onClick={() => set('numQuestions')(n)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                    style={{
                      background: cfg.numQuestions === n ? `linear-gradient(135deg, ${COLOR}cc, ${COLOR}66)` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${cfg.numQuestions === n ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                      color: cfg.numQuestions === n ? '#fff' : '#5a6888',
                      boxShadow: cfg.numQuestions === n ? `0 4px 16px ${COLOR}33` : 'none',
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>

            {/* Question types */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: COLOR }}>
                {t.quiz.types}
              </label>
              <div className="flex gap-2">
                {Object.entries(t.quiz.qTypes).map(([k, label]) => (
                  <button
                    key={k} type="button"
                    onClick={() => toggleType(k)}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all duration-150"
                    style={{
                      background: cfg.types[k] ? `linear-gradient(135deg, ${COLOR}cc, ${COLOR}66)` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${cfg.types[k] ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                      color: cfg.types[k] ? '#fff' : '#5a6888',
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${COLOR}, #0891b2)`, boxShadow: `0 4px 20px ${COLOR}44` }}
              onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" />{t.quiz.generating}</>
                : <><Sparkles size={16} />{t.quiz.generate}</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── One-at-a-time quiz taker ──────────────────────────── */
function QuizTaker({ quiz, quizId, onSubmit, submitting, t, isGuest }) {
  const questions = quiz.questions || [];
  const [answers,  setAnswers]  = useState({});
  const [current,  setCurrent]  = useState(0);
  const [revealed, setRevealed] = useState(false);

  const q    = questions[current];
  const type = q?.type === 'multiple_choice' ? 'multiple' : q?.type === 'true_false' ? 'boolean' : q?.type;
  const opts = q?.options || [];
  const answered = answers[current] !== undefined;
  const totalAnswered = Object.keys(answers).length;

  const setAnswer = (val) => setAnswers(p => ({ ...p, [current]: val }));

  const goNext = () => {
    setRevealed(false);
    if (current < questions.length - 1) setCurrent(c => c + 1);
  };
  const goPrev = () => {
    setRevealed(false);
    if (current > 0) setCurrent(c => c - 1);
  };

  const handleSubmit = () => {
    const backendAnswers = {};
    questions.forEach((q, i) => {
      const qt = q.type === 'multiple_choice' ? 'multiple' : q.type === 'true_false' ? 'boolean' : q.type;
      if (qt === 'multiple') {
        const idx2letter = { 0:'A',1:'B',2:'C',3:'D' };
        backendAnswers[i] = idx2letter[answers[i]] ?? answers[i];
      } else if (qt === 'boolean') {
        backendAnswers[i] = answers[i] ? 'True' : 'False';
      } else {
        backendAnswers[i] = answers[i] ?? '';
      }
    });
    onSubmit(backendAnswers, answers);
  };

  const pct = Math.round((totalAnswered / questions.length) * 100);

  return (
    <div className="min-h-full flex flex-col">
      {/* Progress header */}
      <div className="px-6 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: COLOR }}>
            {t.quiz.question} {current + 1} / {questions.length}
          </span>
          <span className="text-xs" style={{ color: '#3a4660' }}>{totalAnswered} answered</span>
        </div>
        {/* Segmented progress */}
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              onClick={() => { setRevealed(false); setCurrent(i); }}
              className="flex-1 h-1.5 rounded-full cursor-pointer transition-all duration-200"
              style={{
                background: i === current
                  ? COLOR
                  : answers[i] !== undefined
                    ? `${COLOR}60`
                    : 'rgba(255,255,255,0.08)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col px-4 py-6">
        <div className="max-w-2xl mx-auto w-full flex flex-col flex-1">
          {/* Question card */}
          <div
            className="rounded-2xl p-6 mb-6"
            style={{
              background: `${COLOR}08`,
              border: `1px solid ${COLOR}20`,
              boxShadow: `0 0 40px ${COLOR}08`,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${COLOR}cc, ${COLOR}66)` }}
              >
                {current + 1}
              </div>
              <p className="text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed pt-1">
                {q?.question}
              </p>
            </div>
          </div>

          {/* Answer area */}
          <div className="flex-1 space-y-3">
            {type === 'multiple' && opts.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => setAnswer(oi)}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-150"
                style={{
                  background: answers[current] === oi
                    ? `${COLOR}15`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${answers[current] === oi ? COLOR + '50' : 'rgba(255,255,255,0.07)'}`,
                  transform: answers[current] === oi ? 'scale(1.005)' : 'scale(1)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                  style={{
                    background: answers[current] === oi ? COLOR : 'rgba(255,255,255,0.06)',
                    color: answers[current] === oi ? '#fff' : '#3a4660',
                  }}
                >
                  {['A','B','C','D'][oi]}
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
              </button>
            ))}

            {type === 'boolean' && (
              <div className="flex gap-3">
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    onClick={() => setAnswer(v)}
                    className="flex-1 py-5 rounded-xl font-semibold text-sm transition-all duration-150"
                    style={{
                      background: answers[current] === v ? `${COLOR}15` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${answers[current] === v ? COLOR + '50' : 'rgba(255,255,255,0.07)'}`,
                      color: answers[current] === v ? COLOR : '#5a6888',
                    }}
                  >
                    {v ? '✓ True' : '✗ False'}
                  </button>
                ))}
              </div>
            )}

            {type === 'short' && (
              <textarea
                rows={4}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all resize-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#c8d0e8',
                }}
                onFocus={e => { e.target.style.borderColor = `${COLOR}60`; e.target.style.boxShadow = `0 0 0 3px ${COLOR}15`; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                placeholder="Type your answer…"
                value={answers[current] || ''}
                onChange={e => setAnswer(e.target.value)}
              />
            )}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={goPrev}
              disabled={current === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#5a6888' }}
              onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#c8d0e8'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#5a6888'; }}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {current < questions.length - 1 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all text-white"
                style={{ background: `linear-gradient(135deg, ${COLOR}cc, ${COLOR}66)`, boxShadow: `0 4px 16px ${COLOR}33` }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || totalAnswered < questions.length}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all text-white disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${COLOR}cc, ${COLOR}66)`, boxShadow: `0 4px 16px ${COLOR}33` }}
              >
                {submitting
                  ? <><Loader2 size={15} className="animate-spin" />{t.quiz.submitting}</>
                  : t.quiz.submit
                }
              </button>
            )}
          </div>

          {isGuest && (
            <div
              className="mt-3 flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}
            >
              <AlertCircle size={13} />
              {t.quiz.guestNote}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Results ─────────────────────────────────────────── */
function QuizResults({ quiz, result, onRetake, onNew, t }) {
  const questions = quiz.questions || [];
  const score     = result?.score ?? 0;
  const total     = result?.total_questions ?? questions.length;
  const correct   = result?.correct_answers ?? 0;
  const pct       = Math.round(score);
  const isPerfect = pct === 100;
  const isGood    = pct >= 80;
  const accent    = isPerfect ? '#f59e0b' : isGood ? COLOR : '#f97316';

  /* SVG ring */
  const r = 52, circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;

  return (
    <div className="min-h-full flex flex-col">
      {/* Score hero */}
      <div
        className="px-6 py-10 text-center shrink-0"
        style={{ background: `linear-gradient(180deg, ${accent}10 0%, transparent 100%)`, borderBottom: `1px solid ${accent}18` }}
      >
        {/* SVG ring */}
        <div className="relative w-36 h-36 mx-auto mb-4">
          <svg width="144" height="144" viewBox="0 0 144 144">
            <circle cx="72" cy="72" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle
              cx="72" cy="72" r={r} fill="none"
              stroke={accent} strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dash}
              transform="rotate(-90 72 72)"
              style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 8px ${accent}88)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{pct}%</span>
            <span className="text-xs" style={{ color: accent }}>
              {isPerfect ? '🏆 Perfect!' : isGood ? '🎉 Great!' : '💪 Keep going!'}
            </span>
          </div>
        </div>

        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          {correct} / {total} correct
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetake}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#c8d0e8' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <RotateCcw size={14} />{t.quiz.retake}
          </button>
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${COLOR}cc, ${COLOR}66)`, boxShadow: `0 4px 16px ${COLOR}33` }}
          >
            <BookOpen size={14} />{t.quiz.newQuiz}
          </button>
        </div>
      </div>

      {/* Per-question feedback */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-3">
          {questions.map((q, i) => {
            const fb = result?.feedback?.[i];
            const ok = fb?.correct ?? false;
            return (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{
                  background: ok ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                  border: `1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}
              >
                <div className="flex items-start gap-3 mb-2">
                  {ok
                    ? <CheckCircle2 size={16} style={{ color: COLOR, flexShrink: 0, marginTop: 2 }} />
                    : <XCircle     size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} />
                  }
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{q.question}</p>
                </div>
                {fb && (
                  <div className="ml-7 space-y-1 text-xs">
                    <div style={{ color: '#4a5878' }}>
                      <span className="font-medium text-slate-500 dark:text-slate-400">{t.quiz.yourAnswer}: </span>
                      <span style={{ color: ok ? COLOR : '#f87171' }}>{fb.user_answer || t.quiz.skipped}</span>
                    </div>
                    {!ok && (
                      <div style={{ color: '#4a5878' }}>
                        <span className="font-medium text-slate-500 dark:text-slate-400">{t.quiz.correctAnswer}: </span>
                        <span style={{ color: COLOR }}>{fb.correct_answer}</span>
                      </div>
                    )}
                    {fb.explanation && (
                      <div
                        className="mt-2 p-3 rounded-lg text-xs leading-relaxed"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#8896b3' }}
                      >
                        <span className="font-semibold text-slate-400">{t.quiz.explanation}: </span>
                        {fb.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────── */
export default function QuizPage() {
  const { t } = useLanguage();
  const { isGuest } = useAuth();
  const navigate = useNavigate();

  if (isGuest) return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: `${COLOR}15`, border: `1px solid ${COLOR}25` }}>
        <Lock size={28} style={{ color: COLOR }} />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-100 mb-2">Sign in to generate quizzes</p>
        <p className="text-sm max-w-xs" style={{ color: '#4a5878' }}>Create a free account to access AI-powered quiz generation, detailed feedback, and score tracking.</p>
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

  const [phase,      setPhase]      = useState('setup');
  const [quiz,       setQuiz]       = useState(null);
  const [quizId,     setQuizId]     = useState(null);
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const handleGenerate = async (cfg) => {
    setError(''); setLoading(true);
    try {
      const res = await api.generateQuiz(cfg);
      setQuiz(res); setQuizId(res.quiz_id || res.id || null);
      setPhase('taking');
    } catch (err) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (backendAnswers, localAnswers) => {
    if (isGuest || !quizId) {
      const questions = quiz.questions || [];
      let correct = 0;
      const feedback = questions.map((q, i) => {
        const ua = backendAnswers[i] ?? '';
        const ca = q.correct_answer ?? '';
        const ok = typeof ua === 'string' && typeof ca === 'string' && ua.toUpperCase() === ca.toUpperCase();
        if (ok) correct++;
        return { correct: ok, user_answer: ua, correct_answer: ca, explanation: q.explanation || '' };
      });
      setResult({ score: (correct / questions.length) * 100, correct_answers: correct, total_questions: questions.length, feedback });
      setPhase('results'); return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitQuiz(quizId, backendAnswers);
      setResult(res);
      saveQuizResult({ topic: quiz.topic || 'Quiz', subject: quiz.subject || '', score: res.score, totalQuestions: res.total_questions });
      setPhase('results');
    } catch (err) {
      setError(err.message);
      const questions = quiz.questions || [];
      let correct = 0;
      const feedback = questions.map((q, i) => {
        const ua = backendAnswers[i] ?? ''; const ca = q.correct_answer ?? '';
        const ok = ua.toUpperCase() === ca.toUpperCase();
        if (ok) correct++;
        return { correct: ok, user_answer: ua, correct_answer: ca, explanation: q.explanation || '' };
      });
      setResult({ score: (correct / questions.length) * 100, correct_answers: correct, total_questions: questions.length, feedback });
      setPhase('results');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {error && (
        <div
          className="mx-4 mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
        >
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {phase === 'setup'   && <QuizSetup onGenerate={handleGenerate} loading={loading} t={t} />}
      {phase === 'taking'  && quiz && (
        <QuizTaker quiz={quiz} quizId={quizId} onSubmit={handleSubmit} submitting={submitting} t={t} isGuest={isGuest} />
      )}
      {phase === 'results' && quiz && result && (
        <QuizResults
          quiz={quiz} result={result}
          onRetake={() => setPhase('taking')}
          onNew={() => { setPhase('setup'); setQuiz(null); setResult(null); setQuizId(null); }}
          t={t}
        />
      )}
    </div>
  );
}
