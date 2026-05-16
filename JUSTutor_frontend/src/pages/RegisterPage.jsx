import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Brain, UserPlus } from 'lucide-react';
import { useAuth }     from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 14,
  color: '#c8d0e8',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#4a5878' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { t }        = useLanguage();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', email: '', password: '', password2: '',
  });
  const [showPw, setShowPw]   = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = field => e => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const focusStyle = { borderColor: 'rgba(124,58,237,0.5)', boxShadow: '0 0 0 3px rgba(124,58,237,0.12)' };
  const blurStyle  = { borderColor: 'rgba(255,255,255,0.1)', boxShadow: 'none' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.password2) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/chat');
    } catch (err) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-slate-100">{t.auth.registerTitle}</h1>
        <p className="text-sm mt-1" style={{ color: '#4a5878' }}>{t.auth.registerSub}</p>
      </div>

      {/* Card */}
      <div
        className="p-7 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
      >
        {error && (
          <div
            className="mb-5 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.auth.firstName}>
              <input
                type="text" style={inputStyle} placeholder="Ahmad"
                value={form.first_name} onChange={set('first_name')} required
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => Object.assign(e.target.style, blurStyle)}
              />
            </Field>
            <Field label={t.auth.lastName}>
              <input
                type="text" style={inputStyle} placeholder="Ali"
                value={form.last_name} onChange={set('last_name')} required
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => Object.assign(e.target.style, blurStyle)}
              />
            </Field>
          </div>

          <Field label={t.auth.username}>
            <input
              type="text" style={inputStyle} placeholder="ahmad_ali"
              value={form.username} onChange={set('username')} required autoComplete="username"
              onFocus={e => Object.assign(e.target.style, focusStyle)}
              onBlur={e => Object.assign(e.target.style, blurStyle)}
            />
          </Field>

          <Field label={t.auth.email}>
            <input
              type="email" style={inputStyle} placeholder="ahmad@example.com"
              value={form.email} onChange={set('email')} required autoComplete="email"
              onFocus={e => Object.assign(e.target.style, focusStyle)}
              onBlur={e => Object.assign(e.target.style, blurStyle)}
            />
          </Field>

          <Field label={t.auth.password}>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                style={{ ...inputStyle, paddingRight: 44 }}
                placeholder="Min. 8 characters"
                value={form.password} onChange={set('password')} required autoComplete="new-password"
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => Object.assign(e.target.style, blurStyle)}
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#3a4660' }}
                onMouseEnter={e => e.currentTarget.style.color = '#c8d0e8'}
                onMouseLeave={e => e.currentTarget.style.color = '#3a4660'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <Field label={t.auth.confirmPassword || 'Confirm Password'}>
            <div className="relative">
              <input
                type={showPw2 ? 'text' : 'password'}
                style={{ ...inputStyle, paddingRight: 44 }}
                placeholder="Repeat your password"
                value={form.password2} onChange={set('password2')} required autoComplete="new-password"
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => Object.assign(e.target.style, blurStyle)}
              />
              <button type="button" onClick={() => setShowPw2(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#3a4660' }}
                onMouseEnter={e => e.currentTarget.style.color = '#c8d0e8'}
                onMouseLeave={e => e.currentTarget.style.color = '#3a4660'}
              >
                {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all mt-2 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <UserPlus size={16} />
            {loading ? t.auth.registering : t.auth.register}
          </button>
        </form>
      </div>

      <p className="text-center text-sm mt-6" style={{ color: '#4a5878' }}>
        {t.auth.haveAccount}{' '}
        <Link
          to="/login"
          className="font-medium transition-colors"
          style={{ color: '#c084fc' }}
          onMouseEnter={e => e.currentTarget.style.color = '#e879f9'}
          onMouseLeave={e => e.currentTarget.style.color = '#c084fc'}
        >
          {t.auth.signInHere}
        </Link>
      </p>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
