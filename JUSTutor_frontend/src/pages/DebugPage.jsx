import { useState, useRef } from 'react';
import {
  AlertCircle, CheckCircle, Copy, Check,
  Loader2, Play, Terminal, FileCode2, ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const LANGS = ['Python','JavaScript','Java','C++','C','TypeScript','Go','Rust','PHP','SQL','Other'];

const LANG_EXT = {
  Python:'py', JavaScript:'js', TypeScript:'ts', Java:'java',
  'C++':'cpp', C:'c', Go:'go', Rust:'rs', PHP:'php', SQL:'sql', Other:'txt',
};

/* ── copy button ───────────────────────────────────────── */
function CopyBtn({ text, className = '' }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors
        text-slate-400 hover:text-slate-200 hover:bg-white/5 ${className}`}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

/* ── response parser ───────────────────────────────────── */
function parseDebugResponse(text) {
  const sections = { errors: [], explanation: '', fixedCode: '', output: '' };

  const codeMatch = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
  if (codeMatch) sections.fixedCode = codeMatch[1].trim();

  const outMatch = text.match(/##\s*Output\s*\n([\s\S]*?)(?=\n##|$)/i);
  if (outMatch) {
    let out = outMatch[1].trim();
    out = out.replace(/^```[\w]*\n?/m, '').replace(/```$/m, '').trim();
    sections.output = out;
  }

  const errMatch = text.match(/##\s*Errors?\s*Found\s*\n([\s\S]*?)(?=\n##|$)/i);
  if (errMatch) {
    const errBlock = errMatch[1].trim();
    const noErr = /no errors?|no bugs?|no issues?|nothing wrong|code is correct|valid (python|javascript|java|code)/i;
    if (!noErr.test(errBlock)) {
      sections.errors = errBlock
        .split('\n')
        .map(l => l.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter(l => l.length > 4 && !/^errors?\s*found/i.test(l))
        .slice(0, 10);
    }
  }

  // plain-text explanation: strip markdown noise
  sections.explanation = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/#{1,4}\s*(Errors? Found|Output|Fixed Version)[^\n]*/gi, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,4}\s*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 900);

  return sections;
}

/* ── page ──────────────────────────────────────────────── */
export default function DebugPage() {
  const { t } = useLanguage();

  const [code,      setCode]      = useState('');
  const [lang,      setLang]      = useState('Python');
  const [analyzing, setAnalyzing] = useState(false);
  const [result,    setResult]    = useState(null);
  const [apiError,  setApiError]  = useState('');

  const lineNumRef = useRef(null);
  const taRef      = useRef(null);

  const lineCount = (code || '').split('\n').length;

  const syncScroll = () => {
    if (lineNumRef.current && taRef.current)
      lineNumRef.current.scrollTop = taRef.current.scrollTop;
  };

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    setAnalyzing(true);
    setResult(null);
    setApiError('');

    const prompt = `You are an expert ${lang} debugger and code reviewer.

Analyze the following ${lang} code and respond with EXACTLY these four sections in order:

## Errors Found
List every bug, syntax error, or logic error, numbered. If NO errors exist write exactly: "No errors found — the code is correct."

## Output
Show exactly what this code would print or return when executed. If it produces no output write: "No output."

## Explanation
Explain what the code does and what is wrong (if anything).

## Fixed Version
Provide the complete corrected code in a \`\`\`${lang.toLowerCase()}\`\`\` block. If no fix is needed repeat the original code.

Code to analyze:
\`\`\`${lang.toLowerCase()}
${code}
\`\`\``;

    try {
      const res = await api.sendMessage(prompt, 'Programming', { actionType: 'debug' });
      setResult(parseDebugResponse(res.response || ''));
    } catch (err) {
      setApiError(err.message || t.common.error);
    } finally {
      setAnalyzing(false);
    }
  };

  const isClean = result && result.errors.length === 0;
  const ext      = LANG_EXT[lang] || 'txt';

  /* status bar text + color */
  let statusText  = 'Ready';
  let statusColor = '#6366f1';
  if (analyzing)           { statusText = 'Analyzing…';                    statusColor = '#f59e0b'; }
  else if (result && isClean)   { statusText = '✓  No errors';              statusColor = '#10b981'; }
  else if (result && !isClean)  { statusText = `✗  ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}`; statusColor = '#ef4444'; }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#0d0f16' }}>

      {/* ── Tab bar ─────────────────────────────────────── */}
      <div
        className="flex items-center gap-1 px-2 shrink-0 border-b"
        style={{ background: '#090b10', borderColor: '#1a1d2e', height: '38px' }}
      >
        {/* active file tab */}
        <div
          className="flex items-center gap-1.5 px-3 h-full text-xs font-medium border-t-2"
          style={{ color: '#c9d1d9', borderTopColor: '#6366f1', background: '#0d0f16' }}
        >
          <FileCode2 size={12} className="text-indigo-400" />
          main.{ext}
        </div>

        <div className="flex-1" />

        {/* language picker */}
        <select
          value={lang}
          onChange={e => { setLang(e.target.value); setResult(null); }}
          className="text-xs rounded px-2 py-1 border focus:outline-none"
          style={{ background: '#161b22', color: '#8b949e', borderColor: '#30363d' }}
        >
          {LANGS.map(l => <option key={l}>{l}</option>)}
        </select>

        {code && <CopyBtn text={code} />}

        <button
          onClick={handleAnalyze}
          disabled={!code.trim() || analyzing}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded transition-all disabled:opacity-40"
          style={{ background: '#6366f1', color: 'white' }}
        >
          {analyzing
            ? <><Loader2 size={11} className="animate-spin" />Analyzing…</>
            : <><Play size={11} />Analyze</>
          }
        </button>
      </div>

      {/* ── Split panels ─────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — editor */}
        <div className="flex w-1/2 overflow-hidden border-r" style={{ borderColor: '#1a1d2e' }}>
          {/* line numbers */}
          <div
            ref={lineNumRef}
            className="select-none overflow-hidden shrink-0 text-right pt-4 pb-4 pr-3 pl-2"
            style={{
              background: '#090b10',
              color: '#3d4450',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              fontSize: '13px',
              lineHeight: '22px',
              minWidth: '46px',
            }}
          >
            {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* textarea */}
          <textarea
            ref={taRef}
            onScroll={syncScroll}
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            placeholder={`# Paste your ${lang} code here…`}
            className="flex-1 resize-none focus:outline-none pt-4 pb-4 pr-4 pl-3"
            style={{
              background: '#0d0f16',
              color: '#e2e8f0',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              fontSize: '13px',
              lineHeight: '22px',
              caretColor: '#6366f1',
            }}
          />
        </div>

        {/* Right — console */}
        <div className="flex flex-col w-1/2 overflow-hidden" style={{ background: '#090b10' }}>

          {/* console header */}
          <div
            className="flex items-center gap-2 px-4 shrink-0 border-b"
            style={{ borderColor: '#1a1d2e', height: '34px' }}
          >
            <Terminal size={12} style={{ color: '#454d5d' }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#454d5d' }}>
              Console
            </span>
          </div>

          {/* console body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm font-mono">

            {/* idle */}
            {!result && !analyzing && !apiError && (
              <div className="flex items-center gap-2" style={{ color: '#3d4450' }}>
                <ChevronRight size={13} />
                <span>Waiting for input…</span>
              </div>
            )}

            {/* analyzing */}
            {analyzing && (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#8b949e' }}>
                <Loader2 size={12} className="animate-spin" style={{ color: '#6366f1' }} />
                Analyzing {lang} code…
              </div>
            )}

            {/* api error */}
            {apiError && (
              <div className="flex items-start gap-2 text-xs" style={{ color: '#f85149' }}>
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                {apiError}
              </div>
            )}

            {/* ── results ── */}
            {result && !analyzing && (
              <>
                {/* clean */}
                {isClean && (
                  <>
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#3fb950' }}>
                      <CheckCircle size={13} />
                      No errors detected
                    </div>

                    {result.output && !/^no output/i.test(result.output) && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2 text-xs" style={{ color: '#8b949e' }}>
                          <Terminal size={11} />
                          stdout
                        </div>
                        <pre
                          className="rounded-md px-4 py-3 text-xs whitespace-pre-wrap leading-relaxed"
                          style={{ background: '#0a0c12', color: '#3fb950', border: '1px solid #1a1d2e' }}
                        >
                          {result.output}
                        </pre>
                      </div>
                    )}
                  </>
                )}

                {/* errors */}
                {!isClean && (
                  <>
                    {/* error list */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-3 text-xs" style={{ color: '#f85149' }}>
                        <AlertCircle size={11} />
                        {result.errors.length} error{result.errors.length !== 1 ? 's' : ''} found
                      </div>
                      <div className="space-y-2">
                        {result.errors.map((e, i) => (
                          <div key={i} className="flex gap-2 text-xs leading-relaxed">
                            <span className="shrink-0 font-bold" style={{ color: '#f85149' }}>[{i + 1}]</span>
                            <span style={{ color: '#c9d1d9' }}>{e}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* explanation */}
                    {result.explanation && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2 text-xs" style={{ color: '#e3b341' }}>
                          💡 Explanation
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: '#8b949e' }}>
                          {result.explanation}
                        </p>
                      </div>
                    )}

                    {/* fixed code */}
                    {result.fixedCode && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#3fb950' }}>
                            <CheckCircle size={11} />
                            Fixed Code
                          </div>
                          <CopyBtn text={result.fixedCode} />
                        </div>
                        <pre
                          className="rounded-md px-4 py-3 text-xs overflow-x-auto whitespace-pre leading-relaxed"
                          style={{ background: '#0a0c12', color: '#e2e8f0', border: '1px solid #1a1d2e' }}
                        >
                          {result.fixedCode}
                        </pre>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Status bar ───────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 shrink-0 text-xs font-medium select-none"
        style={{ background: statusColor, color: 'white', height: '22px', transition: 'background 0.3s' }}
      >
        <span>{lang}</span>
        <span style={{ opacity: 0.6 }}>·</span>
        <span>{lineCount} line{lineCount !== 1 ? 's' : ''}</span>
        <div className="flex-1" />
        <span>{statusText}</span>
      </div>

    </div>
  );
}
