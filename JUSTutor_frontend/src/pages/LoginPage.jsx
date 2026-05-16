import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Brain, LogIn } from 'lucide-react';
import { useAuth }     from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '11px 14px',
  fontSize: 14,
  color: '#c8d0e8',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

export default function LoginPage() {
  const { login, enterGuestMode } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm]   = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const set = field => e => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/chat');
    } catch (err) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => { enterGuestMode(); navigate('/chat'); };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 pulse-glow"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }}
        >
          <Brain size={26} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{t.auth.loginTitle}</h1>
        <p className="text-sm mt-1" style={{ color: '#4a5878' }}>{t.auth.loginSubtitle}</p>
      </div>

      {/* Card */}
      <div
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
      >
        {error && (
          <div
            className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#4a5878' }}>
              {t.auth.email}
            </label>
            <input
              type="email"
              style={inputStyle}
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
              onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#4a5878' }}>
              {t.auth.password}
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                style={{ ...inputStyle, paddingRight: 44 }}
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                required
                autoComplete="current-password"
                onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#3a4660' }}
                onMouseEnter={e => e.currentTarget.style.color = '#c8d0e8'}
                onMouseLeave={e => e.currentTarget.style.color = '#3a4660'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all mt-2 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <LogIn size={16} />
            {loading ? t.auth.loggingIn : t.auth.login}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span className="text-xs" style={{ color: '#2d3a52' }}>{t.common.or}</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>

        <button
          onClick={handleGuest}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8896b3' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#c8d0e8'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#8896b3'; }}
        >
          {t.auth.guestMode}
        </button>
      </div>

      <p className="text-center text-sm mt-6" style={{ color: '#4a5878' }}>
        {t.auth.noAccount}{' '}
        <Link
          to="/register"
          className="font-medium transition-colors"
          style={{ color: '#c084fc' }}
          onMouseEnter={e => e.currentTarget.style.color = '#e879f9'}
          onMouseLeave={e => e.currentTarget.style.color = '#c084fc'}
        >
          {t.auth.signUpHere}
        </Link>
      </p>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
