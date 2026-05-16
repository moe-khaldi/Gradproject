import { useState, useEffect, useMemo } from 'react';
import { BarChart2, Trophy, Target, TrendingUp, BookOpen, Loader2, Zap, Flame, MessageSquare, Hash } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell, Area, AreaChart,
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { useAuth }     from '../context/AuthContext';
import api             from '../services/api';

const COLOR = '#fbbf24'; // amber — dashboard identity color

function getLocalResults() {
  try { return JSON.parse(localStorage.getItem('quiz_results') || '[]'); } catch { return []; }
}

function normaliseResults(raw) {
  return raw.map(r => ({
    topic:   r.topic   || r.subject || 'Quiz',
    subject: r.subject || 'General',
    score:   typeof r.score === 'number' ? r.score : Number(r.score) || 0,
    date:    r.date || r.submitted_at
      ? new Date(r.date || r.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : '',
    total_questions: r.total_questions ?? null,
  }));
}

/* ── Stat card ─────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 group"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}20`,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.borderColor = `${color}35`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.borderColor = `${color}20`; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-0.5 tabular-nums">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      {sub && <div className="text-xs mt-1 font-medium" style={{ color }}>{sub}</div>}
    </div>
  );
}

/* ── Chart tooltip ─────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs"
      style={{ background: '#0c0f1e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
    >
      <p className="font-semibold text-slate-200 mb-1">{label}</p>
      <p style={{ color: COLOR }}>{payload[0].value}%</p>
    </div>
  );
};

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user, isGuest } = useAuth();

  const [results,    setResults]    = useState([]);
  const [apiStats,   setApiStats]   = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (isGuest) {
      setResults(normaliseResults(getLocalResults()));
      setLoading(false);
      return;
    }
    // Fetch quiz history and dashboard stats in parallel
    Promise.allSettled([
      api.getQuizHistory(),
      api.getDashboardStats(),
    ]).then(([historyResult, statsResult]) => {
      if (historyResult.status === 'fulfilled') {
        const data = historyResult.value;
        const api_ = Array.isArray(data) ? normaliseResults(data) : [];
        setResults(api_.length ? api_ : normaliseResults(getLocalResults()));
      } else {
        setResults(normaliseResults(getLocalResults()));
      }
      if (statsResult.status === 'fulfilled') {
        setApiStats(statsResult.value);
      }
    }).finally(() => setLoading(false));
  }, [isGuest]);

  const stats = useMemo(() => {
    if (!results.length) return null;
    const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);

    const byTopic = {};
    results.forEach(r => {
      const key = r.topic || 'General';
      if (!byTopic[key]) byTopic[key] = { total: 0, count: 0 };
      byTopic[key].total += r.score;
      byTopic[key].count += 1;
    });
    const topicData = Object.entries(byTopic).map(([topic, d]) => ({
      topic: topic.length > 14 ? topic.slice(0, 12) + '…' : topic,
      score: Math.round(d.total / d.count),
    }));
    const sorted = [...topicData].sort((a, b) => b.score - a.score);

    const lineData = results.slice(0, 10).reverse().map((r, i) => ({
      name: r.date || `Q${i + 1}`,
      score: Math.round(r.score),
    }));

    const streak = Math.min(results.length, 7);

    return { avg, total: results.length, best: sorted[0]?.topic, weak: sorted[sorted.length - 1]?.topic, topicData, lineData, streak };
  }, [results]);

  const displayName = user
    ? (user.first_name ? user.first_name : user.username)
    : 'Guest';

  return (
    <div className="min-h-full">

      {/* ── Hero greeting ── */}
      <div
        className="px-6 pt-8 pb-6"
        style={{
          background: `linear-gradient(180deg, ${COLOR}10 0%, transparent 100%)`,
          borderBottom: `1px solid ${COLOR}15`,
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: COLOR }}>
                  {t.dashboard.title}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {isGuest ? 'Welcome, Guest' : `Welcome back, ${displayName}`} 👋
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.dashboard.subtitle}</p>
            </div>

            {stats && (
              <div
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                style={{ background: `${COLOR}10`, border: `1px solid ${COLOR}20` }}
              >
                <Flame size={18} style={{ color: COLOR }} />
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{stats.streak} quizzes</div>
                  <div className="text-xs text-slate-400">recent activity</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto">

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={28} style={{ color: COLOR }} className="animate-spin" />
            </div>
          ) : !stats && !apiStats ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: `${COLOR}10`, border: `1px solid ${COLOR}20` }}
              >
                <BarChart2 size={32} style={{ color: COLOR }} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-lg">{t.dashboard.noData}</p>
                <p className="text-sm text-slate-400 mt-2 max-w-sm">{t.dashboard.noDataSub}</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Stat cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatCard
                  icon={BookOpen}
                  label={t.dashboard.totalQuizzes}
                  value={apiStats?.total_quizzes ?? stats.total}
                  color="#6366f1"
                />
                <StatCard
                  icon={Target}
                  label={t.dashboard.avgScore}
                  value={`${stats.avg}%`}
                  color={stats.avg >= 80 ? '#10b981' : stats.avg >= 60 ? '#f59e0b' : COLOR}
                  sub={stats.avg >= 80 ? 'Excellent' : stats.avg >= 60 ? 'Good progress' : 'Keep practicing'}
                />
                <StatCard
                  icon={Trophy}
                  label={t.dashboard.bestTopic}
                  value={stats.best || '—'}
                  color="#f59e0b"
                />
                <StatCard
                  icon={MessageSquare}
                  label="Chat Sessions"
                  value={apiStats?.total_sessions ?? '—'}
                  color="#a78bfa"
                  sub={apiStats ? `${apiStats.total_messages} messages sent` : null}
                />
                <StatCard
                  icon={Hash}
                  label="Messages Sent"
                  value={apiStats?.total_messages ?? '—'}
                  color="#34d399"
                />
                <StatCard
                  icon={TrendingUp}
                  label={t.dashboard.weakTopic}
                  value={stats.weak || '—'}
                  color="#f87171"
                />
              </div>

              {/* ── Charts ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Area chart */}
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <Zap size={14} style={{ color: COLOR }} />
                    <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t.dashboard.recentChart}</h2>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={stats.lineData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLOR} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLOR} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#3a4660' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0,100]} tick={{ fontSize: 10, fill: '#3a4660' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Area type="monotone" dataKey="score" stroke={COLOR} strokeWidth={2.5} fill="url(#scoreGrad)"
                        dot={{ fill: COLOR, r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: COLOR, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar chart */}
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <BarChart2 size={14} style={{ color: '#6366f1' }} />
                    <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t.dashboard.topicChart}</h2>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats.topicData} margin={{ top: 5, right: 5, left: -25, bottom: 25 }}>
                      <XAxis dataKey="topic" tick={{ fontSize: 10, fill: '#3a4660' }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                      <YAxis domain={[0,100]} tick={{ fontSize: 10, fill: '#3a4660' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {stats.topicData.map((e, i) => (
                          <Cell key={i} fill={e.score >= 80 ? '#10b981' : e.score >= 60 ? '#6366f1' : '#f59e0b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Recent activity ── */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="px-5 py-4 flex items-center gap-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
                >
                  <BookOpen size={14} style={{ color: '#4a5878' }} />
                  <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t.dashboard.recentSessions}</h2>
                </div>
                <div>
                  {results.slice(0, 8).map((r, i) => {
                    const score = Math.round(r.score);
                    const c = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : COLOR;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between px-5 py-3.5 transition-colors"
                        style={{ borderBottom: i < results.slice(0,8).length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: `${c}15`, color: c, border: `1px solid ${c}25` }}
                          >
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{r.topic || 'Quiz'}</p>
                            <p className="text-xs text-slate-400">
                              {r.subject}{r.date ? ` · ${r.date}` : ''}{r.total_questions ? ` · ${r.total_questions}Q` : ''}
                            </p>
                          </div>
                        </div>
                        <div
                          className="text-sm font-bold tabular-nums px-3 py-1 rounded-lg"
                          style={{ background: `${c}12`, color: c, border: `1px solid ${c}20` }}
                        >
                          {score}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
