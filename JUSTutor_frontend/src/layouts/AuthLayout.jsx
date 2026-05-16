import { Outlet, Link } from 'react-router-dom';
import { Sun, Moon, Brain } from 'lucide-react';
import { useTheme }    from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();
  const { toggleLang, lang, t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden dark" style={{ background: '#03040b' }}>

      {/* Mesh grid */}
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-60" />

      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full opacity-30 dark:opacity-15"
          style={{ background: 'radial-gradient(circle at center, #7c3aed, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-48 -right-48 w-[600px] h-[600px] rounded-full opacity-20 dark:opacity-10"
          style={{ background: 'radial-gradient(circle at center, #ec4899, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full opacity-10 dark:opacity-5"
          style={{ background: 'radial-gradient(ellipse at center, #a855f7, transparent 65%)' }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              boxShadow: '0 4px 16px rgba(124,58,237,0.45)',
            }}
          >
            <Brain size={18} className="text-white" />
          </div>
          <span className="font-bold text-[#0f1117] dark:text-white">{t.appName}</span>
        </Link>

        <div className="flex items-center gap-1">
          <button onClick={toggleLang} className="btn-ghost text-xs font-bold px-2.5 py-1.5">
            {lang === 'en' ? 'ع' : 'EN'}
          </button>
          <button onClick={toggleTheme} className="btn-ghost p-2">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>

      {/* Center */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-4 text-xs text-slate-400 dark:text-slate-600">
        © {new Date().getFullYear()} JUSTutor · Built for students, powered by AI
      </div>
    </div>
  );
}
