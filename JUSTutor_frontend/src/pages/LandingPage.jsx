import { useNavigate } from 'react-router-dom';
import {
  Brain, MessageSquare, BookOpen, Clock, Code2, BarChart2,
  Calculator, ArrowRight, Sparkles, GraduationCap, Layers,
  CalendarDays, Sun, Moon, CheckCircle2, Zap,
} from 'lucide-react';
import { useTheme }    from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth }     from '../context/AuthContext';

/* ── Feature definitions with unique colors ─────── */
const FEATURES = [
  { icon: MessageSquare, color: '#6366f1', bg: 'rgba(99,102,241,0.12)',   key: 0 },
  { icon: BookOpen,      color: '#10b981', bg: 'rgba(16,185,129,0.12)',   key: 1 },
  { icon: Layers,        color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',   key: 2, isNew: true },
  { icon: CalendarDays,  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   key: 3, isNew: true },
  { icon: Code2,         color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)',   key: 4 },
  { icon: BarChart2,     color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',    key: 5 },
  { icon: Clock,         color: '#f97316', bg: 'rgba(249,115,22,0.12)',   key: 6 },
  { icon: Calculator,    color: '#14b8a6', bg: 'rgba(20,184,166,0.12)',   key: 7 },
];

/* ── In-hero app mockup ─────────────────────────── */
function AppMockup() {
  return (
    <div
      className="relative mx-auto"
      style={{ maxWidth: 580, perspective: '1400px' }}
    >
      {/* Drop shadow plane */}
      <div
        style={{
          position: 'absolute',
          bottom: -40,
          left: '10%',
          right: '10%',
          height: 80,
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.35) 0%, transparent 70%)',
          filter: 'blur(20px)',
          borderRadius: '50%',
        }}
      />

      {/* Window */}
      <div
        className="rounded-2xl overflow-hidden animate-float"
        style={{
          background: '#070a14',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08)',
          transform: 'rotateX(8deg) rotateY(-2deg)',
          transformOrigin: 'top center',
        }}
      >
        {/* Chrome */}
        <div style={{ height: 36, background: '#040610', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '2px 20px', fontSize: 11, color: '#1e2840', fontFamily: 'monospace' }}>
              justutor.app
            </div>
          </div>
          <div style={{ width: 72 }} />
        </div>

        {/* App body */}
        <div style={{ display: 'flex', height: 280 }}>
          {/* Mini icon rail */}
          <div style={{ width: 50, background: '#030510', borderRight: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, gap: 5 }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', boxShadow: '0 3px 10px rgba(99,102,241,0.5)' }}>
              <MessageSquare size={13} style={{ color: 'white' }} />
            </div>
            {[BookOpen, Layers, Code2, BarChart2].map((Icon, i) => (
              <div key={i} style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a2440' }}>
                <Icon size={13} />
              </div>
            ))}
          </div>

          {/* Chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 16px', gap: 10, overflow: 'hidden' }}>

            {/* AI message 1 */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Brain size={11} style={{ color: 'white' }} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px 10px 10px 10px', padding: '8px 12px', maxWidth: '78%' }}>
                <div style={{ fontSize: 10, color: '#818cf8', fontWeight: 600, marginBottom: 5 }}>JUSTutor</div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 3, marginBottom: 4, width: '88%' }} />
                <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: 4, width: '65%' }} />
                <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, width: '75%' }} />
                {/* Action chips */}
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  {['Explain', 'Example', 'Practice'].map((b, i) => (
                    <div key={i} style={{ background: i === 0 ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${i === 0 ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 5, padding: '2px 7px', fontSize: 9, color: i === 0 ? '#818cf8' : '#1e2840', fontWeight: 600 }}>
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* User message */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(34,211,238,0.2))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px 3px 10px 10px', padding: '7px 14px' }}>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.45)', borderRadius: 3, width: 110 }} />
              </div>
            </div>

            {/* AI message 2 */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Brain size={11} style={{ color: 'white' }} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px 10px 10px 10px', padding: '8px 12px', maxWidth: '78%' }}>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.13)', borderRadius: 3, marginBottom: 4, width: '92%' }} />
                <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, width: '58%' }} />
              </div>
            </div>

            {/* Input */}
            <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 11, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 3 }} />
              <div style={{ width: 22, height: 22, borderRadius: 7, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ArrowRight size={10} style={{ color: 'white' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute animate-float" style={{ top: 10, right: -10, animationDelay: '0.5s', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '8px 14px', backdropFilter: 'blur(10px)' }}>
        <div style={{ fontSize: 10, color: '#34d399', fontWeight: 700 }}>✓ Quiz Generated</div>
        <div style={{ fontSize: 9, color: '#065f46', marginTop: 2 }}>10 questions · OOP Inheritance</div>
      </div>

      <div className="absolute animate-float" style={{ bottom: 20, left: -20, animationDelay: '1.3s', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '8px 14px', backdropFilter: 'blur(10px)' }}>
        <div style={{ fontSize: 10, color: '#a855f7', fontWeight: 700 }}>8 Flashcards Ready</div>
        <div style={{ fontSize: 9, color: '#4c1d95', marginTop: 2 }}>Polymorphism & Interfaces</div>
      </div>

      <div className="absolute animate-float" style={{ top: 120, left: -30, animationDelay: '0.9s', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '8px 14px', backdropFilter: 'blur(10px)' }}>
        <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>Score: 92%</div>
        <div style={{ fontSize: 9, color: '#78350f', marginTop: 2 }}>Last Quiz · Excellent!</div>
      </div>
    </div>
  );
}

/* ── Feature card ───────────────────────────────── */
function FeatureCard({ feat, f }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative p-5 rounded-2xl cursor-default transition-all duration-250"
      style={{
        background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${hovered ? f.color + '40' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hovered ? `0 12px 32px ${f.color}20` : '0 1px 1px rgba(0,0,0,0.4)',
        transform: hovered ? 'translateY(-3px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {f.isNew && (
        <span
          className="absolute top-3 right-3 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide"
          style={{ background: f.bg, color: f.color, border: `1px solid ${f.color}30` }}
        >
          New
        </span>
      )}
      <div
        className="flex items-center justify-center rounded-xl mb-4 transition-transform duration-200"
        style={{
          width: 40, height: 40,
          background: f.bg,
          border: `1px solid ${f.color}25`,
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        <f.icon size={18} style={{ color: f.color }} />
      </div>
      <h3 className="font-bold text-sm mb-1.5" style={{ color: '#c8d0e8' }}>{feat.title}</h3>
      <p className="text-xs leading-relaxed" style={{ color: '#2d3a52' }}>{feat.desc}</p>
    </div>
  );
}

/* ── Page ───────────────────────────────────────── */
import { useState } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toggleLang, lang, t } = useLanguage();
  const { enterGuestMode } = useAuth();

  const handleGuest = () => { enterGuestMode(); navigate('/chat'); };

  return (
    <div
      style={{
        minHeight: '100vh',
        overflowX: 'hidden',
        background: '#03040b',
        color: '#e8eaf5',
      }}
    >
      {/* Mesh bg */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Nav ─────────────────────────────────── */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', height: 56,
          background: 'rgba(3,4,11,0.8)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(99,102,241,0.45)' }}>
            <Brain size={15} style={{ color: 'white' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#e8eaf5' }}>{t.appName}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={toggleLang} style={{ padding: '5px 10px', borderRadius: 8, background: 'transparent', border: 'none', color: '#3d4d6a', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#c8d0e8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3d4d6a'; }}>
            {lang === 'en' ? 'ع' : 'EN'}
          </button>
          <button onClick={toggleTheme} style={{ padding: '6px 8px', borderRadius: 8, background: 'transparent', border: 'none', color: '#3d4d6a', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#c8d0e8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3d4d6a'; }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={() => navigate('/login')}
            style={{ padding: '6px 14px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7a99', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.color = '#c8d0e8'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#6b7a99'; }}>
            {t.auth.login}
          </button>
          <button onClick={() => navigate('/register')} className="btn-primary text-sm px-4 py-1.5">
            {t.auth.register}
          </button>
        </div>
      </nav>

      {/* ── Hero: 2-column ───────────────────────── */}
      <section
        style={{
          position: 'relative', zIndex: 10,
          minHeight: '100vh',
          display: 'flex', alignItems: 'center',
          padding: '80px 48px 60px',
          gap: 64,
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {/* Left: copy */}
        <div style={{ flex: '0 0 auto', maxWidth: 460 }}>
          {/* Badge */}
          <div
            className="animate-slide-up"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', borderRadius: 999,
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: '#818cf8',
              fontSize: 12, fontWeight: 600,
              marginBottom: 28,
            }}
          >
            <Sparkles size={12} />
            RAG-Powered · Built for JUST University
          </div>

          {/* Heading */}
          <h1
            className="animate-slide-up"
            style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 20 }}
          >
            <span className="shimmer-text">Study Smarter.</span>
            <br />
            <span style={{ color: '#e8eaf5' }}>Score Higher.</span>
          </h1>

          {/* Subtext */}
          <p
            className="animate-slide-up"
            style={{ fontSize: 17, lineHeight: 1.7, color: '#3d4d6a', marginBottom: 36, maxWidth: 400 }}
          >
            Your AI tutor grounded in your <strong style={{ color: '#6b7a99' }}>actual JUST course material</strong>.
            Ask questions, generate quizzes, build flashcards, and get a personalised study schedule — all in one place.
          </p>

          {/* CTAs */}
          <div className="animate-slide-up" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary px-6 py-3 text-base gap-2"
            >
              {t.landing.getStarted}
              <ArrowRight size={17} />
            </button>
            <button
              onClick={handleGuest}
              style={{
                padding: '10px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#4a5878',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.color = '#c8d0e8'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#4a5878'; }}
            >
              {t.landing.tryGuest}
            </button>
          </div>

          {/* Proof points */}
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Answers grounded in your real lecture PDFs',
              'Quizzes & flashcards from actual course content',
              'Personalised study schedule around your exam date',
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={14} style={{ color: '#22d3ee', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#2d3a52' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: mockup */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <AppMockup />
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────── */}
      <div
        style={{
          position: 'relative', zIndex: 10,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '28px 48px',
          display: 'flex', justifyContent: 'center', gap: 64,
          flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.015)',
        }}
      >
        {[
          { value: '8+', label: 'AI-Powered Tools', icon: Zap, color: '#6366f1' },
          { value: 'RAG', label: 'Course-Grounded Answers', icon: Brain, color: '#22d3ee' },
          { value: '100%', label: 'Free for JUST Students', icon: GraduationCap, color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: s.color + '15', border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, background: `linear-gradient(135deg, ${s.color}, ${s.color}aa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#2d3a52', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Features grid ────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 10, padding: '80px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#6366f1', marginBottom: 12 }}>
            Everything Included
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#e8eaf5', marginBottom: 14, letterSpacing: '-0.02em' }}>
            {t.landing.features}
          </h2>
          <p style={{ fontSize: 15, color: '#2d3a52', maxWidth: 480, margin: '0 auto' }}>
            Eight specialised tools, one platform. From first lecture to exam day.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
          {t.landing.feat.map((feat, i) => {
            const f = FEATURES[i];
            if (!f) return null;
            return <FeatureCard key={i} feat={feat} f={f} />;
          })}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 10, padding: '0 48px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div
          style={{
            borderRadius: 28,
            padding: '60px 48px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(34,211,238,0.06) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
            boxShadow: '0 0 60px rgba(99,102,241,0.08)',
          }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 28px rgba(99,102,241,0.4)' }}>
            <GraduationCap size={26} style={{ color: 'white' }} />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#e8eaf5', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Ready to ace your exams?
          </h2>
          <p style={{ fontSize: 15, color: '#2d3a52', marginBottom: 32, maxWidth: 420, margin: '0 auto 32px' }}>
            Join students who are learning smarter with an AI that understands their syllabus.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} className="btn-primary px-7 py-3 gap-2">
              {t.landing.getStarted}
              <ArrowRight size={16} />
            </button>
            <button onClick={handleGuest}
              style={{ padding: '10px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#4a5878', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.color = '#c8d0e8'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#4a5878'; }}>
              {t.landing.tryGuest}
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '24px 48px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#1a2440' }}>
        © {new Date().getFullYear()} JUSTutor · Built for students, powered by AI
      </footer>
    </div>
  );
}
