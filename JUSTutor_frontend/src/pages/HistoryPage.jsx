import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, MessageSquare, Trash2, ArrowRight, Loader2, AlertCircle, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth }     from '../context/AuthContext';
import api             from '../services/api';

const COLOR = '#94a3b8'; // lighter slate — history identity

export default function HistoryPage() {
  const { t } = useLanguage();
  const { isGuest } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (isGuest) { setLoading(false); return; }
    api.getSessions()
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isGuest]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    setDeleting(id);
    try {
      await api.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (str) => {
    try { return new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return str; }
  };

  return (
    <div className="min-h-full">
      {/* Header strip */}
      <div
        className="px-6 py-8"
        style={{
          background: `linear-gradient(180deg, ${COLOR}10 0%, transparent 100%)`,
          borderBottom: `1px solid ${COLOR}18`,
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${COLOR}20`, border: `1px solid ${COLOR}30` }}
          >
            <History size={22} style={{ color: COLOR }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{t.history.title}</h1>
            <p className="text-sm" style={{ color: '#4a5878' }}>{t.history.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div
              className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {isGuest ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Lock size={24} style={{ color: '#3a4660' }} />
              </div>
              <div>
                <p className="font-semibold text-slate-100 mb-2">Chat history requires an account</p>
                <p className="text-sm max-w-xs" style={{ color: '#4a5878' }}>Sign in to save your conversations and continue where you left off.</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}
              >
                Sign In
              </button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={24} style={{ color: COLOR }} className="animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <MessageSquare size={28} style={{ color: '#2d3a52' }} />
              </div>
              <div>
                <p className="font-medium text-slate-200 mb-1">{t.history.noHistory}</p>
                <p className="text-sm" style={{ color: '#4a5878' }}>{t.history.noHistSub}</p>
              </div>
              <button
                onClick={() => navigate('/chat')}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white mt-2"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}
              >
                Start Chatting
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session, i) => (
                <div
                  key={session.id}
                  className="flex items-start gap-4 p-4 rounded-xl transition-all duration-150"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
                  >
                    <MessageSquare size={18} style={{ color: '#c084fc' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100">
                      {session.subject || 'General'}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: '#3a4660' }}>
                      {session.created_at && <span>{formatDate(session.created_at)}</span>}
                      {session.message_count != null && (
                        <span>{session.message_count} {t.history.messages}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => navigate(`/chat?session=${session.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#c084fc' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; }}
                    >
                      {t.history.continue} <ArrowRight size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      disabled={deleting === session.id}
                      className="p-1.5 rounded-lg transition-all disabled:opacity-40"
                      style={{ color: '#3a4660' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3a4660'; }}
                    >
                      {deleting === session.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
