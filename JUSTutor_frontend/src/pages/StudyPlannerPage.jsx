import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Loader2, Sparkles, BookOpen, RotateCcw,
  CheckSquare, Lightbulb, Clock, Brain, Coffee, AlertCircle,
  ChevronDown, ChevronUp, Lock,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth }     from '../context/AuthContext';
import api             from '../services/api';

const PLAN_COLOR = '#34d399'; // emerald — planner identity

const SUBJECTS = [
  'Object-Oriented Programming', 'Data Structures', 'Algorithms',
  'Databases', 'Networks', 'Operating Systems', 'General',
];

const TYPE_CONFIG = {
  learn:    { color: '#6366f1', bg: 'rgba(99,102,241,0.10)',  label: 'Learn',    icon: Brain },
  review:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', label: 'Review',   icon: BookOpen },
  practice: { color: '#10b981', bg: 'rgba(16,185,129,0.10)', label: 'Practice', icon: CheckSquare },
  rest:     { color: '#64748b', bg: 'rgba(100,116,139,0.10)', label: 'Rest',    icon: Coffee },
};

/* ── DayCard ─────────────────────────────────────────────────── */
function DayCard({ day, t }) {
  const [open, setOpen] = useState(true);
  const cfg = TYPE_CONFIG[day.type] || TYPE_CONFIG.learn;
  const Icon = cfg.icon;

  return (
    <div
      className="rounded-2xl overflow-hidden border transition-all duration-200"
      style={{ borderColor: `${cfg.color}30` }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ background: cfg.bg }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: cfg.color, boxShadow: `0 4px 10px ${cfg.color}40` }}
        >
          <Icon size={15} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
              {t.planner.types[day.type] || day.type} · {t.planner.days ? `Day ${day.day}` : `Day ${day.day}`}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-100 truncate">
            {day.date_label || day.focus_topic}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Clock size={11} />
            {day.hours}h
          </span>
          {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 py-3 space-y-3 border-t" style={{ borderColor: `${cfg.color}15`, background: 'rgba(0,0,0,0.15)' }}>
          {/* Tasks */}
          {day.tasks && day.tasks.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#2d3a52' }}>{t.planner.tasks}</p>
              <ul className="space-y-1.5">
                {day.tasks.map((task, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#8896b3' }}>
                    <span className="mt-1 w-4 h-4 rounded shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: cfg.color }}>{i + 1}</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tip */}
          {day.tip && (
            <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 rounded-lg px-3 py-2"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <Lightbulb size={12} className="mt-0.5 shrink-0 text-amber-500" />
              {day.tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Setup form ──────────────────────────────────────────────── */
function SetupForm({ onGenerate, loading, t }) {
  const today = new Date();
  today.setDate(today.getDate() + 7);
  const defaultDate = today.toISOString().split('T')[0];

  const [cfg, setCfg] = useState({
    subject: SUBJECTS[0],
    topics: '',
    examDate: defaultDate,
    dailyHours: 2,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const topicList = cfg.topics.split(',').map(t => t.trim()).filter(Boolean);
    if (!topicList.length) return;
    onGenerate({ ...cfg, topics: topicList });
  };

  // PLAN_COLOR from module scope
  const iSt = {
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
        style={{ background: `linear-gradient(180deg, ${PLAN_COLOR}12 0%, transparent 100%)`, borderBottom: `1px solid ${PLAN_COLOR}18` }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: `linear-gradient(135deg, ${PLAN_COLOR}cc, ${PLAN_COLOR}66)`, boxShadow: `0 8px 32px ${PLAN_COLOR}44` }}
        >
          <CalendarDays size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{t.planner.title}</h1>
        <p className="text-sm mt-1" style={{ color: '#4a5878' }}>{t.planner.subtitle}</p>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: PLAN_COLOR }}>
                {t.planner.subject}
              </label>
              <select
                style={{ ...iSt, cursor: 'pointer' }}
                value={cfg.subject}
                onChange={e => setCfg(p => ({ ...p, subject: e.target.value }))}
                onFocus={e => { e.target.style.borderColor = `${PLAN_COLOR}60`; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: PLAN_COLOR }}>
                {t.planner.topics} *
              </label>
              <textarea
                style={{ ...iSt, resize: 'none' }}
                rows={3}
                placeholder={t.planner.topicsPH}
                value={cfg.topics}
                onChange={e => setCfg(p => ({ ...p, topics: e.target.value }))}
                required
                onFocus={e => { e.target.style.borderColor = `${PLAN_COLOR}60`; e.target.style.boxShadow = `0 0 0 3px ${PLAN_COLOR}15`; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              />
              <p className="text-xs mt-1" style={{ color: '#2d3a52' }}>{t.planner.topicsHint}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: PLAN_COLOR }}>
                  {t.planner.examDate} *
                </label>
                <input
                  type="date"
                  style={iSt}
                  value={cfg.examDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setCfg(p => ({ ...p, examDate: e.target.value }))}
                  required
                  onFocus={e => { e.target.style.borderColor = `${PLAN_COLOR}60`; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: PLAN_COLOR }}>
                  {t.planner.dailyHours}
                </label>
                <select
                  style={{ ...iSt, cursor: 'pointer' }}
                  value={cfg.dailyHours}
                  onChange={e => setCfg(p => ({ ...p, dailyHours: +e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = `${PLAN_COLOR}60`; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  {[1, 1.5, 2, 2.5, 3, 4, 5, 6].map(h => (
                    <option key={h} value={h}>{h}h</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !cfg.topics.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${PLAN_COLOR}, #059669)`, boxShadow: `0 4px 20px ${PLAN_COLOR}44` }}
              onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" />{t.planner.generating}</>
                : <><Sparkles size={16} />{t.planner.generate}</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Plan view ───────────────────────────────────────────────── */
function PlanView({ plan, onNew, t }) {
  const typeColors = {
    learn: '#6366f1', review: '#f59e0b', practice: '#10b981', rest: '#64748b',
  };

  const typeCounts = (plan.days || []).reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-auto p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{t.planner.planReady}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: '#4a5878' }}>
              <span className="flex items-center gap-1">
                <CalendarDays size={13} /> {plan.total_days ?? (plan.days || plan.schedule || []).length} {t.planner.days}
              </span>
            </div>
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#8896b3' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#c8d0e8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#8896b3'; }}
          >
            <RotateCcw size={14} />
            {t.planner.newPlan}
          </button>
        </div>

        {/* Summary card */}
        {(plan.summary || plan.notes) && (
          <div
            className="rounded-2xl px-5 py-4 text-sm leading-relaxed"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#8896b3' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#f59e0b' }}>{t.planner.summary}</p>
            {plan.summary || plan.notes}
          </div>
        )}

        {/* Type legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeCounts).map(([type, count]) => {
            const color = typeColors[type] || '#6366f1';
            return (
              <div
                key={type}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium"
                style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                {t.planner.types[type] || type} ({count})
              </div>
            );
          })}
        </div>

        {/* Day cards */}
        <div className="space-y-3">
          {(plan.days || plan.schedule || []).map((day, i) => (
            <DayCard key={i} day={day} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function StudyPlannerPage() {
  const { t } = useLanguage();
  const { isGuest } = useAuth();
  const navigate = useNavigate();

  if (isGuest) return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: `${PLAN_COLOR}15`, border: `1px solid ${PLAN_COLOR}25` }}>
        <Lock size={28} style={{ color: PLAN_COLOR }} />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-100 mb-2">Sign in to generate a study plan</p>
        <p className="text-sm max-w-xs" style={{ color: '#4a5878' }}>Create a free account to get a personalized AI-generated day-by-day study schedule tailored to your exam date.</p>
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

  const [stage, setStage]   = useState('setup');
  const [plan, setPlan]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleGenerate = async (cfg) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.generatePlan({
        subject: cfg.subject,
        topics: cfg.topics,
        exam_date: cfg.examDate,
        daily_hours: cfg.dailyHours,
      });
      setPlan(data);
      setStage('plan');
    } catch (err) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setStage('setup');
    setPlan(null);
    setError('');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {error && (
        <div className="mx-6 mt-5 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      {stage === 'setup' && (
        <SetupForm onGenerate={handleGenerate} loading={loading} t={t} />
      )}
      {stage === 'plan' && plan && (
        <PlanView plan={plan} onNew={handleNew} t={t} />
      )}
    </div>
  );
}
