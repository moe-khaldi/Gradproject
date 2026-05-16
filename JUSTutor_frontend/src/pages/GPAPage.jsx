import { useState } from 'react';
import { Calculator, Plus, Trash2, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth }     from '../context/AuthContext';
import api             from '../services/api';

const COLOR = '#a3e635'; // lime-yellow — GPA page identity

const GRADE_MAP = {
  'A+': 4.2, 'A': 4.0, 'A-': 3.75,
  'B+': 3.5, 'B': 3.25, 'B-': 3.0,
  'C+': 2.75, 'C': 2.5, 'C-': 2.25,
  'D+': 2.0, 'D': 1.75, 'D-': 1.5,
  'F': 0.5,
};

const GRADE_HEX = {
  'A+': '#10b981', 'A': '#10b981', 'A-': '#34d399',
  'B+': '#6366f1', 'B': '#6366f1', 'B-': '#818cf8',
  'C+': '#f59e0b', 'C': '#f59e0b', 'C-': '#fbbf24',
  'D+': '#f97316', 'D': '#f97316', 'D-': '#fb923c',
  'F':  '#ef4444',
};

const ARABIC_CODES = {
  'A+': 'أ+', 'A': 'أ', 'A-': 'أ-',
  'B+': 'ب+', 'B': 'ب', 'B-': 'ب-',
  'C+': 'ج+', 'C': 'ج', 'C-': 'ج-',
  'D+': 'د+', 'D': 'د', 'D-': 'د-',
  'F':  'هـ',
};

function newCourse(id) { return { id, name: '', grade: 'B', credits: 3 }; }

function calcGPA(courses) {
  const valid = courses.filter(c => c.grade && c.credits > 0 && GRADE_MAP[c.grade] !== undefined);
  const totalCredits = valid.reduce((s, c) => s + Number(c.credits), 0);
  const weighted     = valid.reduce((s, c) => s + GRADE_MAP[c.grade] * Number(c.credits), 0);
  return { gpa: totalCredits > 0 ? (weighted / totalCredits).toFixed(2) : null, totalCredits, weighted, valid };
}

function gpaColor(gpa) {
  const g = parseFloat(gpa);
  if (g >= 3.5) return '#10b981';
  if (g >= 3.0) return '#6366f1';
  if (g >= 2.5) return '#f59e0b';
  if (g >= 1.5) return '#f97316';
  return '#ef4444';
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#c8d0e8',
  borderRadius: 12,
  padding: '8px 12px',
  fontSize: 13,
  width: '100%',
  outline: 'none',
};

export default function GPAPage() {
  const { t } = useLanguage();
  const { isGuest } = useAuth();

  const [courses,      setCourses]      = useState([newCourse(1), newCourse(2), newCourse(3)]);
  const [result,       setResult]       = useState(null);
  const [nextId,       setNextId]       = useState(4);
  const [showRef,      setShowRef]      = useState(false);
  const [advice,       setAdvice]       = useState('');
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError,  setAdviceError]  = useState('');

  const addCourse = () => { setCourses(p => [...p, newCourse(nextId)]); setNextId(id => id + 1); setResult(null); setAdvice(''); };
  const removeCourse = (id) => { setCourses(p => p.filter(c => c.id !== id)); setResult(null); setAdvice(''); };
  const setField = (id, field, value) => { setCourses(p => p.map(c => c.id === id ? { ...c, [field]: value } : c)); setResult(null); setAdvice(''); };
  const calculate = () => { setResult(calcGPA(courses)); setAdvice(''); setAdviceError(''); };
  const reset = () => { setCourses([newCourse(1), newCourse(2), newCourse(3)]); setNextId(4); setResult(null); setAdvice(''); setAdviceError(''); };

  const handleGetAdvice = async () => {
    if (!result || result.gpa === null) return;
    setAdviceLoading(true);
    setAdviceError('');
    try {
      const coursePayload = result.valid.map(c => ({
        name: c.name || 'Unnamed course',
        grade: c.grade,
        credits: c.credits,
      }));
      const data = await api.getGPAAdvice(parseFloat(result.gpa), coursePayload);
      setAdvice(data.advice);
    } catch (err) {
      setAdviceError(err.message || 'Failed to get AI advice.');
    } finally {
      setAdviceLoading(false);
    }
  };

  const formulaParts = result?.valid.map(c => `(${c.credits}×${GRADE_MAP[c.grade]})`).join(' + ');
  const formulaStr = result ? `(${formulaParts}) / ${result.totalCredits} = ${result.gpa}` : '';

  return (
    <div className="min-h-full">
      {/* Header */}
      <div
        className="px-6 py-8"
        style={{ background: `linear-gradient(180deg, ${COLOR}10 0%, transparent 100%)`, borderBottom: `1px solid ${COLOR}18` }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${COLOR}cc, ${COLOR}66)`, boxShadow: `0 6px 24px ${COLOR}44` }}
            >
              <Calculator size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">{t.gpa.title}</h1>
              <p className="text-sm" style={{ color: '#4a5878' }}>{t.gpa.subtitle}</p>
            </div>
          </div>
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: `${COLOR}15`, border: `1px solid ${COLOR}30`, color: COLOR }}
          >
            {t.gpa.scale}
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Grade reference toggle */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <button
              onClick={() => setShowRef(s => !s)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', color: '#8896b3' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              Grade Scale Reference
              <span style={{ opacity: 0.5, transform: showRef ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
            </button>
            {showRef && (
              <div
                className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-4"
                style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                {Object.entries(GRADE_MAP).map(([g, pts]) => (
                  <div
                    key={g}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs"
                    style={{ background: `${GRADE_HEX[g]}10`, border: `1px solid ${GRADE_HEX[g]}20` }}
                  >
                    <div>
                      <span className="font-bold" style={{ color: GRADE_HEX[g] }}>{g}</span>
                      <span className="ml-1 text-[10px]" style={{ color: '#3a4660' }}>({ARABIC_CODES[g]})</span>
                    </div>
                    <span className="font-mono font-semibold" style={{ color: '#8896b3' }}>{pts}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Course table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="grid px-5 py-3 text-xs font-bold uppercase tracking-widest"
              style={{ gridTemplateColumns: '1fr 100px 80px 40px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#2d3a52' }}
            >
              <div>{t.gpa.courseName}</div>
              <div className="text-center">{t.gpa.grade}</div>
              <div className="text-center">{t.gpa.credits}</div>
              <div />
            </div>

            <div className="p-4 space-y-2">
              {courses.map(c => (
                <div key={c.id}>
                  <div
                    className="grid gap-2 items-center"
                    style={{ gridTemplateColumns: '1fr 100px 80px 40px' }}
                  >
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder={t.gpa.placeholder}
                      value={c.name}
                      onChange={e => setField(c.id, 'name', e.target.value)}
                      onFocus={e => { e.target.style.borderColor = `${COLOR}60`; e.target.style.boxShadow = `0 0 0 3px ${COLOR}15`; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                    />
                    <select
                      style={{ ...inputStyle, textAlign: 'center', color: GRADE_HEX[c.grade] || '#c8d0e8', fontWeight: 700 }}
                      value={c.grade}
                      onChange={e => setField(c.id, 'grade', e.target.value)}
                    >
                      {Object.keys(GRADE_MAP).map(g => (
                        <option key={g} value={g}>{g} ({GRADE_MAP[g]})</option>
                      ))}
                    </select>
                    <input
                      type="number" min={1} max={6} step={1}
                      style={{ ...inputStyle, textAlign: 'center' }}
                      value={c.credits}
                      onChange={e => setField(c.id, 'credits', Number(e.target.value))}
                    />
                    <button
                      onClick={() => removeCourse(c.id)}
                      disabled={courses.length === 1}
                      className="flex items-center justify-center w-9 h-9 rounded-xl transition-all disabled:opacity-20"
                      style={{ color: '#3a4660' }}
                      onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; } }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3a4660'; }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {c.grade === 'F' && (
                    <div className="flex items-center gap-1.5 text-xs mt-1 ml-1" style={{ color: '#f87171' }}>
                      <AlertCircle size={11} /> {t.gpa.failFlag}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addCourse}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#3a4660', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${COLOR}08`; e.currentTarget.style.color = COLOR; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3a4660'; }}
            >
              <Plus size={15} /> {t.gpa.addCourse}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={calculate}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: `linear-gradient(135deg, ${COLOR}, #84cc16)`, boxShadow: `0 4px 20px ${COLOR}44` }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Calculator size={16} /> {t.gpa.calculate}
            </button>
            <button
              onClick={reset}
              className="px-5 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8896b3' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#c8d0e8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#8896b3'; }}
            >
              {t.gpa.reset}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-4" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
              {result.gpa === null ? (
                <div
                  className="p-6 rounded-2xl text-center"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  <AlertCircle size={22} style={{ color: '#fbbf24', margin: '0 auto 8px' }} />
                  <p className="text-sm" style={{ color: '#8896b3' }}>{t.gpa.noCoursesYet}</p>
                </div>
              ) : (
                <>
                  {/* GPA display */}
                  <div
                    className="p-8 rounded-2xl text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: gpaColor(result.gpa) }}>
                      {t.gpa.yourGPA}
                    </p>
                    <div
                      className="text-7xl font-bold mb-3 tabular-nums"
                      style={{ color: gpaColor(result.gpa), filter: `drop-shadow(0 0 20px ${gpaColor(result.gpa)}55)` }}
                    >
                      {result.gpa}
                    </div>
                    <p className="text-sm mb-5" style={{ color: '#4a5878' }}>
                      {result.totalCredits} {t.gpa.totalCredits}
                    </p>

                    {/* GPA progress bar */}
                    <div
                      className="h-2 rounded-full overflow-hidden mx-auto max-w-xs"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min((parseFloat(result.gpa) / 4.2) * 100, 100)}%`,
                          background: `linear-gradient(90deg, ${gpaColor(result.gpa)}, ${gpaColor(result.gpa)}aa)`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] mt-1.5 max-w-xs mx-auto" style={{ color: '#2d3a52' }}>
                      <span>0.0</span><span>1.5</span><span>2.5</span><span>3.5</span><span>4.2</span>
                    </div>
                  </div>

                  {/* Breakdown table */}
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div
                      className="px-5 py-4"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
                    >
                      <h3 className="font-semibold text-sm text-slate-200">{t.gpa.breakdown}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {[t.gpa.courseName, t.gpa.grade, 'Points', t.gpa.credits, 'Contribution'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#2d3a52' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.valid.map((c, i) => {
                            const pts = GRADE_MAP[c.grade];
                            return (
                              <tr
                                key={i}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <td className="px-4 py-3 text-slate-200 font-medium">
                                  {c.name || `Course ${i + 1}`}
                                  {c.grade === 'F' && (
                                    <span
                                      className="ml-2 text-xs px-1.5 py-0.5 rounded"
                                      style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}
                                    >
                                      {t.gpa.failFlag}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center font-bold" style={{ color: GRADE_HEX[c.grade] }}>{c.grade}</td>
                                <td className="px-4 py-3 text-center font-mono" style={{ color: '#5a6888' }}>{pts}</td>
                                <td className="px-4 py-3 text-center" style={{ color: '#5a6888' }}>{c.credits}</td>
                                <td className="px-4 py-3 text-center font-mono" style={{ color: '#5a6888' }}>{(pts * Number(c.credits)).toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: '2px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                            <td className="px-4 py-3 font-bold text-slate-100" colSpan={3}>Total</td>
                            <td className="px-4 py-3 text-center font-bold text-slate-100">{result.totalCredits}</td>
                            <td className="px-4 py-3 text-center font-bold font-mono text-slate-100">{result.weighted.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div
                      className="px-5 py-4"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
                    >
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#2d3a52' }}>{t.gpa.formula}</p>
                      <p className="text-xs font-mono break-all leading-relaxed" style={{ color: '#5a6888' }}>
                        GPA = {formulaStr}
                      </p>
                    </div>
                  </div>

                  {/* AI Advice */}
                  {!isGuest && (
                    <div
                      className="rounded-2xl overflow-hidden"
                      style={{ border: `1px solid ${COLOR}25` }}
                    >
                      <div
                        className="px-5 py-4 flex items-center justify-between"
                        style={{ background: `${COLOR}08`, borderBottom: advice ? `1px solid ${COLOR}15` : 'none' }}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles size={15} style={{ color: COLOR }} />
                          <h3 className="font-semibold text-sm text-slate-200">AI Academic Advice</h3>
                        </div>
                        {!advice && (
                          <button
                            onClick={handleGetAdvice}
                            disabled={adviceLoading}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40"
                            style={{ background: `linear-gradient(135deg, ${COLOR}, #84cc16)`, boxShadow: `0 3px 12px ${COLOR}44` }}
                            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            {adviceLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            {adviceLoading ? 'Analysing…' : 'Get AI Advice'}
                          </button>
                        )}
                      </div>

                      {adviceError && (
                        <div className="px-5 py-3 text-xs" style={{ color: '#f87171' }}>
                          {adviceError}
                        </div>
                      )}

                      {advice && (
                        <div className="px-5 py-4">
                          <p
                            className="text-sm leading-relaxed whitespace-pre-wrap"
                            style={{ color: '#c8d0e8' }}
                          >
                            {advice}
                          </p>
                          <button
                            onClick={() => setAdvice('')}
                            className="mt-3 text-xs transition-colors"
                            style={{ color: '#3a4660' }}
                            onMouseEnter={e => e.currentTarget.style.color = COLOR}
                            onMouseLeave={e => e.currentTarget.style.color = '#3a4660'}
                          >
                            Refresh advice
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
