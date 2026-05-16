import { useState, useEffect, useRef } from 'react';
import {
  Library, Upload, FileText, X, Loader2, BookOpen,
  Trash2, AlertCircle, Lock,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth }     from '../context/AuthContext';
import api             from '../services/api';

const COLOR = '#60a5fa'; // blue — materials identity
const SUBJECTS = ['Object-Oriented Programming','Data Structures','Algorithms','Databases','Networks','General'];

const EXT_COLORS = {
  pdf: '#f43f5e', txt: '#8896b3', py: '#3b82f6',
  js: '#f59e0b', ts: '#3b82f6', java: '#f97316',
  cpp: '#6366f1', c: '#6366f1', go: '#22d3ee', rs: '#f97316', md: '#10b981',
};

function extOf(name = '') {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : 'txt';
}

/* ── Explanation modal ───────────────────────────── */
function ExplanationModal({ text, onClose, t }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full max-h-[80vh] flex flex-col rounded-2xl"
        style={{ background: '#0c0f1e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            <BookOpen size={16} style={{ color: COLOR }} />
            <h3 className="font-semibold text-sm text-slate-200">{t.materials.explanation}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: '#3a4660' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#c8d0e8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3a4660'; }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#8896b3' }}>{text}</p>
        </div>
        <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#8896b3' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#c8d0e8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#8896b3'; }}
          >
            {t.materials.close}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── File card ───────────────────────────────────── */
function FileCard({ m, onExplain, onDelete, explaining, t }) {
  const [hovered, setHovered] = useState(false);
  const ext = extOf(m.title || '');
  const extColor = EXT_COLORS[ext] || '#8896b3';

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-2xl transition-all duration-150"
      style={{
        background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* File type icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-[10px] tracking-wider"
        style={{ background: `${extColor}18`, color: extColor, border: `1px solid ${extColor}25` }}
      >
        {ext.toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#c8d0e8' }}>
          {m.title || `Material ${m.id}`}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {m.courseCode && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${COLOR}15`, color: COLOR, border: `1px solid ${COLOR}25` }}
            >
              {m.courseCode}
            </span>
          )}
          {m.type && (
            <span className="text-[10px]" style={{ color: '#2d3a52' }}>
              {m.type}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onExplain(m)}
          disabled={explaining === m.id}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: explaining === m.id ? 'transparent' : `${COLOR}12`, color: explaining === m.id ? '#2d3a52' : COLOR, border: `1px solid ${COLOR}25` }}
          onMouseEnter={e => { if (explaining !== m.id) { e.currentTarget.style.background = `${COLOR}22`; } }}
          onMouseLeave={e => { if (explaining !== m.id) { e.currentTarget.style.background = `${COLOR}12`; } }}
        >
          {explaining === m.id
            ? <Loader2 size={12} className="animate-spin" />
            : <BookOpen size={12} />
          }
          {t.materials.explain}
        </button>
        <button
          onClick={() => onDelete(m.id)}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: '#3a4660' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3a4660'; }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────── */
export default function MaterialsPage() {
  const { t } = useLanguage();
  const { isGuest } = useAuth();
  const fileInput = useRef(null);

  const [materials,   setMaterials]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [uploading,   setUploading]   = useState(false);
  const [explaining,  setExplaining]  = useState(null);
  const [explanation, setExplanation] = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [error,       setError]       = useState('');
  const [drag,        setDrag]        = useState(false);
  const [subject,     setSubject]     = useState(SUBJECTS[0]);

  useEffect(() => {
    if (isGuest) { setLoading(false); return; }
    api.getMaterials()
      .then(setMaterials)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isGuest]);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 1024 * 1024) { setError('File too large (max 1 MB)'); return; }
    setUploading(true);
    setError('');
    try {
      const res = await api.uploadFile(file, { subject, topic: file.name });
      setExplanation(res.explanation || '');
      setShowModal(true);
      const updated = await api.getMaterials();
      setMaterials(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExplain = async (material) => {
    setExplaining(material.id);
    setError('');
    try {
      const res = await api.explainContent(material.title || `Material ${material.id}`, { subject: material.courseCode || 'General' });
      setExplanation(res.explanation || '');
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setExplaining(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await api.deleteMaterial(id);
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="min-h-full flex flex-col">
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
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${COLOR}cc, ${COLOR}66)`, boxShadow: `0 8px 32px ${COLOR}44` }}
          >
            <Library size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{t.materials.title}</h1>
            <p className="text-sm mt-0.5" style={{ color: '#4a5878' }}>{t.materials.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Error banner */}
          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              <AlertCircle size={14} className="shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} style={{ color: '#f87171' }}><X size={14} /></button>
            </div>
          )}

          {/* Guest lock */}
          {isGuest ? (
            <div className="flex flex-col items-center justify-center py-28 gap-5 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: `${COLOR}15`, border: `1px solid ${COLOR}25` }}
              >
                <Lock size={28} style={{ color: COLOR }} />
              </div>
              <div>
                <p className="font-semibold text-slate-200">Sign in to access your library</p>
                <p className="text-sm mt-1" style={{ color: '#4a5878' }}>Upload, manage, and get AI explanations of your study materials</p>
              </div>
            </div>
          ) : (
            <>
              {/* Subject selector + upload zone */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid rgba(255,255,255,0.07)` }}
              >
                {/* Subject bar */}
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: COLOR }}>
                    {t.materials.subject}
                  </span>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="flex-1 text-sm outline-none cursor-pointer"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#c8d0e8',
                      borderRadius: 8,
                      padding: '6px 10px',
                    }}
                    onFocus={e => { e.target.style.borderColor = `${COLOR}60`; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  >
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {/* Drop zone */}
                <div
                  onClick={() => !uploading && fileInput.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={onDrop}
                  className="p-10 text-center cursor-pointer transition-all duration-200"
                  style={{
                    background: drag
                      ? `${COLOR}0a`
                      : 'transparent',
                    borderTop: drag ? `2px dashed ${COLOR}60` : '2px dashed rgba(255,255,255,0.06)',
                  }}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: `${COLOR}18` }}
                      >
                        <Loader2 size={22} style={{ color: COLOR }} className="animate-spin" />
                      </div>
                      <p className="text-sm" style={{ color: '#4a5878' }}>Uploading and analyzing…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
                        style={{ background: drag ? `${COLOR}20` : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <Upload size={20} style={{ color: drag ? COLOR : '#3a4660' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: drag ? COLOR : '#8896b3' }}>
                          {drag ? 'Drop to upload' : t.materials.dropzone}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#2d3a52' }}>{t.materials.dropzoneSub}</p>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: `${COLOR}15`, color: COLOR, border: `1px solid ${COLOR}25` }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${COLOR}25`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${COLOR}15`; }}
                      >
                        <Upload size={12} /> {t.materials.upload}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <input
                ref={fileInput}
                type="file"
                className="sr-only"
                accept=".txt,.pdf,.py,.js,.java,.cpp,.c,.ts,.go,.rs,.md"
                onChange={e => handleFile(e.target.files[0])}
              />

              {/* Files list */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} style={{ color: COLOR }} className="animate-spin" />
                </div>
              ) : materials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <FileText size={24} style={{ color: '#2d3a52' }} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-400">{t.materials.noMaterials}</p>
                    <p className="text-sm mt-0.5" style={{ color: '#2d3a52' }}>{t.materials.noMatSub}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#2d3a52' }}>
                    {materials.length} file{materials.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {materials.map(m => (
                      <FileCard
                        key={m.id}
                        m={m}
                        onExplain={handleExplain}
                        onDelete={handleDelete}
                        explaining={explaining}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && <ExplanationModal text={explanation} onClose={() => setShowModal(false)} t={t} />}
    </div>
  );
}
