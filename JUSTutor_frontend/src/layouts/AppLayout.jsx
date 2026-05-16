import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import {
  MessageSquare, BookOpen, Clock, Code2, BarChart2,
  Library, History, Calculator, Sun, Moon, LogOut,
  Brain, UserCircle2, Layers, CalendarDays,
} from 'lucide-react';
import { useTheme }    from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth }     from '../context/AuthContext';

/* ── Colour identity per tool ─────────────────────── */
const NAV_ITEMS = [
  { icon: MessageSquare, key: 'chat',       path: '/chat',       color: '#a78bfa' },
  { icon: BookOpen,      key: 'quiz',       path: '/quiz',       color: '#22d3ee' },
  { icon: Clock,         key: 'exam',       path: '/exam',       color: '#f87171' },
  { icon: Code2,         key: 'debug',      path: '/debug',      color: '#4ade80' },
  { icon: Layers,        key: 'flashcards', path: '/flashcards', color: '#f472b6', authOnly: true },
  { icon: CalendarDays,  key: 'planner',    path: '/planner',    color: '#34d399', authOnly: true },
  { icon: BarChart2,     key: 'dashboard',  path: '/dashboard',  color: '#fbbf24' },
  { icon: Library,       key: 'materials',  path: '/materials',  color: '#60a5fa', authOnly: true },
  { icon: History,       key: 'history',    path: '/history',    color: '#94a3b8', authOnly: true },
  { icon: Calculator,    key: 'gpa',        path: '/gpa',        color: '#a3e635' },
];

const MOBILE_BOTTOM = [
  { icon: MessageSquare, key: 'chat',      path: '/chat',       color: '#a78bfa' },
  { icon: BookOpen,      key: 'quiz',      path: '/quiz',       color: '#22d3ee' },
  { icon: Layers,        key: 'flashcards',path: '/flashcards', color: '#f472b6', authOnly: true },
  { icon: BarChart2,     key: 'dashboard', path: '/dashboard',  color: '#fbbf24' },
  { icon: Calculator,    key: 'gpa',       path: '/gpa',        color: '#a3e635' },
];

/* ── Single rail item with tooltip ───────────────── */
function RailItem({ icon: Icon, path, label, color, isRTL }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 64, height: 44 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NavLink to={path} style={{ display: 'block' }}>
        {({ isActive }) => (
          <div
            className="flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer"
            style={{
              width: 40, height: 40,
              background: isActive
                ? `linear-gradient(135deg, ${color}dd, ${color}88)`
                : hovered ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: isActive ? '#fff' : hovered ? '#e2e8f0' : '#4a5878',
              boxShadow: isActive ? `0 4px 18px ${color}55` : 'none',
            }}
          >
            <Icon size={17} />
          </div>
        )}
      </NavLink>

      {/* Tooltip */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            ...(isRTL
              ? { right: 'calc(100% + 6px)' }
              : { left: 'calc(100% + 6px)' }),
            background: '#0c0f1e',
            color: '#c8d0e8',
            padding: '5px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 200,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          {label}
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            ...(isRTL
              ? { left: '100%', borderRightWidth: 0, borderLeftColor: 'rgba(255,255,255,0.08)' }
              : { right: '100%', borderLeftWidth: 0, borderRightColor: 'rgba(255,255,255,0.08)' }),
            width: 0, height: 0,
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            borderRight: '5px solid rgba(255,255,255,0.08)',
          }} />
        </div>
      )}
    </div>
  );
}

/* ── Desktop icon rail ───────────────────────────── */
function DesktopRail({ items, t }) {
  const { theme, toggleTheme }         = useTheme();
  const { toggleLang, lang, isRTL }    = useLanguage();
  const { user, isGuest, logout }      = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/'); };

  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    : 'Guest';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside
      className="hidden md:flex flex-col items-center fixed top-0 bottom-0 z-40"
      style={{
        width: 64,
        background: '#05060f',
        borderRight: isRTL ? 'none' : '1px solid rgba(255,255,255,0.05)',
        borderLeft:  isRTL ? '1px solid rgba(255,255,255,0.05)' : 'none',
        ...(isRTL ? { right: 0 } : { left: 0 }),
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: 64, height: 64, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className="flex items-center justify-center rounded-xl pulse-glow cursor-pointer"
          style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          }}
          onClick={() => navigate('/chat')}
        >
          <Brain size={18} className="text-white" />
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center py-3 overflow-y-auto no-scrollbar">
        {items.map((item, i) => {
          const prev = items[i - 1];
          const showDivider = i > 0 && (
            (item.key === 'flashcards' && prev?.key === 'debug') ||
            (item.key === 'dashboard'  && prev?.key === 'planner') ||
            (item.key === 'gpa'        && prev?.key === 'history')
          );
          return (
            <div key={item.path}>
              {showDivider && (
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 12px', width: 32 }} />
              )}
              <RailItem
                icon={item.icon}
                path={item.path}
                label={t.nav[item.key]}
                color={item.color}
                isRTL={isRTL}
              />
            </div>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-2 pb-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer"
          style={{ width: 36, height: 36, color: '#4a5878', background: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#c8d0e8'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2d3a52'; }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Lang */}
        <button
          onClick={toggleLang}
          className="flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer"
          style={{ width: 36, height: 36, color: '#4a5878', background: 'transparent', fontSize: 11, fontWeight: 700 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#c8d0e8'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2d3a52'; }}
        >
          {lang === 'en' ? 'ع' : 'EN'}
        </button>

        {/* Avatar */}
        <button
          onClick={isGuest ? () => navigate('/login') : handleLogout}
          title={isGuest ? 'Sign in' : 'Sign out'}
          className="flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer"
          style={{
            width: 34, height: 34,
            background: isGuest
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(135deg, #7c3aed, #ec4899)',
            boxShadow: isGuest ? 'none' : '0 2px 10px rgba(124,58,237,0.45)',
            color: '#fff',
            fontSize: 11, fontWeight: 700,
          }}
        >
          {isGuest ? <UserCircle2 size={16} style={{ color: '#4a5878' }} /> : initials}
        </button>
      </div>
    </aside>
  );
}

/* ── Mobile bottom navigation ────────────────────── */
function MobileBottomNav({ items, t }) {
  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around"
      style={{
        height: 60,
        background: '#05060f',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {items.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className="flex flex-col items-center justify-center gap-0.5"
          style={{ flex: 1, height: '100%', cursor: 'pointer' }}
        >
          {({ isActive }) => (
            <>
              <div
                className="flex items-center justify-center rounded-xl transition-all duration-150"
                style={{
                  width: 36, height: 28,
                  background: isActive ? `${item.color}20` : 'transparent',
                  color: isActive ? item.color : '#4a5878',
                }}
              >
                <item.icon size={18} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: isActive ? item.color : '#4a5878', lineHeight: 1 }}>
                {t.nav[item.key]}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}

/* ── Mobile top mini bar ─────────────────────────── */
function MobileTopBar() {
  const { theme } = useTheme();
  return (
    <div
      className="md:hidden flex items-center justify-center shrink-0"
      style={{
        height: 48,
        background: theme === 'dark'
          ? 'rgba(3,4,11,0.9)'
          : 'rgba(245,246,252,0.9)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 26, height: 26, background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
        >
          <Brain size={13} className="text-white" />
        </div>
        <span className="font-bold text-sm text-[#0f1117] dark:text-white">JUSTutor</span>
      </div>
    </div>
  );
}

/* ── Main layout ─────────────────────────────────── */
export default function AppLayout() {
  const { isAuthenticated, isGuest, loading } = useAuth();
  const { isRTL, t }  = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-[#03040b]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex items-center justify-center rounded-2xl pulse-glow"
            style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
          >
            <Brain size={26} className="text-white" />
          </div>
          <div className="text-sm text-slate-500">Loading…</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isGuest) return <Navigate to="/" replace />;

  const visibleItems = NAV_ITEMS.filter(i => !(i.authOnly && isGuest));
  const visibleMobileItems = MOBILE_BOTTOM.filter(i => !(i.authOnly && isGuest));

  return (
    <div className="flex h-screen overflow-hidden dark mesh-bg" style={{ background: '#03040b' }}>
      {/* Desktop icon rail */}
      <DesktopRail items={visibleItems} t={t} />

      {/* Content */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ [isRTL ? 'marginRight' : 'marginLeft']: undefined }}
      >
        <div
          className={`flex-1 flex flex-col overflow-hidden ${isRTL ? 'md:mr-[64px]' : 'md:ml-[64px]'}`}
        >
          <MobileTopBar />

          <main className="flex-1 overflow-auto pb-[60px] md:pb-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav items={visibleMobileItems} t={t} />
    </div>
  );
}
