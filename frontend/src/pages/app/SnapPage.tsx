/**
 * SnapPage — multimodal capture
 *
 * Lets the student snap a photo / upload an image of a math problem, their
 * own handwritten work, or a textbook page. Optionally adds a caption. Then
 * taps an intent: Explain / Solve / Practice / Check.
 *
 * The UI lives at /snap. On submit it POSTs to /api/multimodal/analyze and
 * renders the structured response based on detected intent.
 *
 * Every submission flows through the GBrain logger server-side, so usage
 * shows up in the admin Content Engine dashboard without any extra work.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Image as ImageIcon, Upload, Loader2, Sparkles, BookOpen,
  CheckCircle2, XCircle, Brain, Target, HelpCircle, FileText, X,
  Clock, DollarSign, ArrowRight, ClipboardCheck, MinusCircle,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import NextStepChip, { type NextStepData } from '@/components/app/NextStepChip';

// ============================================================================
// Types mirroring server
// ============================================================================

type Intent =
  | 'concept_question'
  | 'solve_problem'
  | 'practice_request'
  | 'solution_check'
  | 'expressing_confusion'
  | 'extract_text';

type Mode = 'analyze' | 'diagnostic';

interface DiagnosticProblem {
  index: number;
  problem_text: string;
  student_answer: string | null;
  correct_answer: string | null;
  concept_id: string | null;
  topic: string | null;
  verdict: 'correct' | 'incorrect' | 'unverifiable' | 'skipped';
  verification_method: 'wolfram' | 'bundle-match' | 'none';
  estimated_difficulty: number;
}

interface DiagnosticSummary {
  total_attempts: number;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  unverifiable_count: number;
  weak_concepts: string[];
  elapsed_ms: number;
  next_step: NextStepData | null;
}

interface SyllabusPreview {
  scope: string;
  stats: {
    total_concepts: number;
    estimated_days: number;
    total_study_minutes: number;
  };
  intro: string;
  nodes: Array<{
    concept_id: string;
    concept_label: string;
    topic: string;
    inclusion_reason: string;
    scheduled_day: number;
    estimated_study_minutes: number;
  }>;
}

interface AnalysisResponse {
  request_id: string;
  processed_at: string;
  analysis: {
    image_category: string;
    intent: Intent;
    intent_confidence: number;
    detected_concepts: string[];
    detected_topic: string | null;
    extracted_problem_text: string | null;
    estimated_difficulty: number;
    summary: string;
  };
  explanation?: {
    summary: string;
    steps: string[];
    key_concepts: string[];
    example?: string;
  };
  practice_problems?: Array<{
    id: string;
    concept_id: string;
    topic: string;
    difficulty: number;
    question_text: string;
    correct_answer: string;
    source: string;
    wolfram_verified: boolean;
  }>;
  solution?: {
    final_answer: string;
    steps: string[];
    verification_method?: string;
  };
  ocr?: { text: string; latex: string };
  strategy_hints?: string[];
  next_step?: NextStepData;
  latency_ms: number;
  cost_estimate_usd: number;
}

// ============================================================================
// Intent picker data
// ============================================================================

const INTENTS: Array<{
  id: Intent;
  label: string;
  description: string;
  icon: typeof Sparkles;
  style: { color: string; background: string; border: string };
}> = [
  {
    id: 'concept_question',
    label: 'Explain',
    description: 'Overview and intuition for the concept',
    icon: BookOpen,
    style: { color: 'var(--indigo-ink)', background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.22)' },
  },
  {
    id: 'solve_problem',
    label: 'Solve',
    description: 'Worked solution with steps',
    icon: Target,
    style: { color: 'var(--green-ink)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)' },
  },
  {
    id: 'practice_request',
    label: 'Similar',
    description: 'More problems like this',
    icon: Sparkles,
    style: { color: 'var(--indigo-ink)', background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.22)' },
  },
  {
    id: 'solution_check',
    label: 'Check my work',
    description: "Verify the answer you wrote",
    icon: CheckCircle2,
    style: { color: 'var(--orange)', background: 'rgba(255,149,0,.06)', border: '1px solid rgba(255,149,0,.22)' },
  },
  {
    id: 'expressing_confusion',
    label: "I'm stuck",
    description: 'Walk me through it',
    icon: HelpCircle,
    style: { color: 'var(--orange)', background: 'rgba(255,149,0,.06)', border: '1px solid rgba(255,149,0,.22)' },
  },
  {
    id: 'extract_text',
    label: 'Transcribe',
    description: 'Just OCR, no reasoning',
    icon: FileText,
    style: { color: 'var(--text-tertiary)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' },
  },
];

// ============================================================================
// Image helpers — downsize in browser before upload
// ============================================================================

async function fileToResizedBase64(file: File, maxDim = 1200): Promise<{ data: string; mimeType: string }> {
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Image decode failed'));
    img.src = url;
  });

  const { width, height } = img;
  let outW = width, outH = height;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    outW = Math.round(width * scale);
    outH = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  ctx.drawImage(img, 0, 0, outW, outH);
  URL.revokeObjectURL(url);

  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const dataURL = canvas.toDataURL(mimeType, 0.85);
  const base64 = dataURL.split(',')[1];
  return { data: base64, mimeType };
}

// ============================================================================
// Main component
// ============================================================================

export default function SnapPage() {
  const sessionId = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'diagnostic' ? 'diagnostic' : 'analyze');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Diagnostic-mode state — populated progressively via SSE
  const [diagStatus, setDiagStatus] = useState<string | null>(null);
  const [diagProblems, setDiagProblems] = useState<DiagnosticProblem[]>([]);
  const [diagSummary, setDiagSummary] = useState<DiagnosticSummary | null>(null);
  const [diagSyllabus, setDiagSyllabus] = useState<SyllabusPreview | null>(null);
  const [diagSyllabusRevealed, setDiagSyllabusRevealed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    trackEvent('page_view', { page: 'snap', mode });
  }, [mode]);

  // Keep URL in sync when user toggles mode
  useEffect(() => {
    const current = searchParams.get('mode');
    if (mode === 'diagnostic' && current !== 'diagnostic') {
      setSearchParams({ mode: 'diagnostic' }, { replace: true });
    } else if (mode === 'analyze' && current === 'diagnostic') {
      setSearchParams({}, { replace: true });
    }
  }, [mode, searchParams, setSearchParams]);

  const onFileSelected = useCallback((file: File | null | undefined) => {
    setError(null);
    setResponse(null);
    setDiagProblems([]);
    setDiagSummary(null);
    setDiagSyllabus(null);
    setDiagStatus(null);
    setDiagSyllabusRevealed(false);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPEG or PNG).');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl]);

  const clearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(null);
    setPreviewUrl(null);
    setCaption('');
    setResponse(null);
    setSelectedIntent(null);
    setError(null);
    setDiagProblems([]);
    setDiagSummary(null);
    setDiagSyllabus(null);
    setDiagStatus(null);
    setDiagSyllabusRevealed(false);
  };

  const submit = useCallback(async () => {
    if (!imageFile) return;
    if (mode === 'diagnostic') return submitDiagnostic();
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const { data, mimeType } = await fileToResizedBase64(imageFile);
      const payload = {
        image: data,
        image_mime_type: mimeType,
        text: caption.trim() || undefined,
        user_hinted_intent: selectedIntent || undefined,
        scope: 'mcq-rigorous',
        session_id: sessionId,
      };
      const res = await fetch('/api/multimodal/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data2: AnalysisResponse = await res.json();
      setResponse(data2);
      trackEvent('multimodal_analyzed', {
        intent: data2.analysis.intent,
        category: data2.analysis.image_category,
        cost: data2.cost_estimate_usd,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [imageFile, caption, selectedIntent, sessionId, mode]);

  // SSE consumer for diagnostic mode — reads the server's server-sent event
  // stream and progressively builds up state as problems are verified.
  const submitDiagnostic = useCallback(async () => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    setDiagProblems([]);
    setDiagSummary(null);
    setDiagSyllabus(null);
    setDiagStatus('Preparing…');
    setDiagSyllabusRevealed(false);

    try {
      const { data, mimeType } = await fileToResizedBase64(imageFile);
      const res = await fetch('/api/multimodal/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: data,
          image_mime_type: mimeType,
          scope: 'mcq-rigorous',
          exam_id: 'gate-ma',
          session_id: sessionId,
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Standard SSE parser: lines starting with "data: " carry JSON payloads.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Split on SSE event delimiter (double newline)
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const line = evt.split('\n').find(l => l.startsWith('data: '));
          if (!line) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          let payload: any;
          try { payload = JSON.parse(jsonStr); } catch { continue; }

          switch (payload.type) {
            case 'parsing':
            case 'start':
              if (payload.message) setDiagStatus(payload.message);
              break;
            case 'problem':
              setDiagProblems(prev => [...prev, payload as DiagnosticProblem]);
              break;
            case 'syllabus':
              if (payload.syllabus) setDiagSyllabus(payload.syllabus as SyllabusPreview);
              break;
            case 'done':
              setDiagSummary(payload as DiagnosticSummary);
              setDiagStatus(null);
              trackEvent('diagnostic_done', {
                attempts: payload.total_attempts,
                correct: payload.correct_count,
              });
              break;
            case 'syllabus_error':
              // Non-fatal — just means we couldn't build a plan, but per-problem
              // results are still shown.
              break;
            case 'error':
              setError(payload.error || 'Diagnostic failed');
              setDiagStatus(null);
              break;
          }
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [imageFile, sessionId]);

  // Next-step handler — called when user taps the chip's accept button
  const handleNextStep = useCallback((step: NextStepData) => {
    if (step.action === 'practice_problems' && step.target.concept_id) {
      navigate(`/smart-practice?concept=${step.target.concept_id}`);
    } else if (step.action === 'explain_concept' && step.target.concept_id) {
      navigate(`/chat?prompt=Explain+${encodeURIComponent(step.target.concept_id.replace(/-/g, ' '))}+with+a+worked+example`);
    } else if (step.action === 'build_syllabus') {
      setDiagSyllabusRevealed(true);
    } else if (step.action === 'review_misconception' && step.target.concept_id) {
      navigate(`/chat?prompt=Help+me+understand+where+I+went+wrong+on+${encodeURIComponent(step.target.concept_id.replace(/-/g, ' '))}`);
    } else if (step.action === 'save_to_notes') {
      navigate('/materials');
    }
  }, [navigate]);

  const intentMeta = INTENTS.find(i => i.id === response?.analysis.intent);

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Camera size={20} style={{ color: 'var(--indigo-ink)' }} />
          Snap
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {mode === 'analyze'
            ? "Photograph a problem, your notes, or a textbook page. I'll figure out what to do with it."
            : "Upload a photo of your completed test. I'll grade it and build a study plan for your weak spots."}
        </p>
      </motion.div>

      {/* Mode toggle — segmented control */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex rounded-lg p-0.5"
        style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
      >
        <button
          onClick={() => { setMode('analyze'); clearImage(); }}
          className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
          style={mode === 'analyze'
            ? { color: 'var(--indigo-ink)', background: 'rgba(88,86,214,.08)' }
            : { color: 'var(--text-tertiary)' }}
        >
          <Sparkles size={12} />
          Single problem
        </button>
        <button
          onClick={() => { setMode('diagnostic'); clearImage(); }}
          className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
          style={mode === 'diagnostic'
            ? { color: 'var(--green-ink)', background: 'rgba(52,199,89,.06)' }
            : { color: 'var(--text-tertiary)' }}
        >
          <ClipboardCheck size={12} />
          Grade full test
        </button>
      </motion.div>

      {/* Image input */}
      {!imageFile ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="p-5 rounded-xl transition-colors flex flex-col items-center gap-2"
            style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
          >
            <Camera size={28} style={{ color: 'var(--indigo-ink)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Take photo</span>
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Camera</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-5 rounded-xl transition-colors flex flex-col items-center gap-2"
            style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
          >
            <Upload size={28} style={{ color: 'var(--green-ink)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Upload</span>
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>From device</span>
          </button>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
                 className="hidden" onChange={e => onFileSelected(e.target.files?.[0])} />
          <input ref={fileInputRef} type="file" accept="image/*"
                 className="hidden" onChange={e => onFileSelected(e.target.files?.[0])} />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div
            className="relative rounded-xl overflow-hidden"
            style={{ border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-sunken)' }}
          >
            <img src={previewUrl!} alt="preview" className="w-full max-h-72 object-contain" />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1.5 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--text-on-accent)' }}
            >
              <X size={14} />
            </button>
          </div>

          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Optional: add a note ('I got stuck at step 3', 'is this right?', etc.)"
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{
              background: 'var(--surface-card)',
              border: 'var(--hairline) solid var(--separator)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
            }}
          />
        </motion.div>
      )}

      {/* Intent picker — only in Single Problem (analyze) mode */}
      {imageFile && mode === 'analyze' && !response && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            What should I do? <span style={{ color: 'var(--text-tertiary)' }}>(or tap "Auto-detect")</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {INTENTS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSelectedIntent(selectedIntent === opt.id ? null : opt.id)}
                className="p-2.5 rounded-lg text-left transition-all"
                style={selectedIntent === opt.id
                  ? { ...opt.style, boxShadow: '0 0 0 2px var(--indigo)' }
                  : { background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)' }
                }
              >
                <div className="flex items-start gap-2">
                  <opt.icon size={14} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">{opt.label}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">{opt.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--green)', color: 'var(--text-on-accent)' }}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
            {loading ? 'Analyzing...' : selectedIntent ? 'Analyze' : 'Auto-detect & analyze'}
          </button>
        </motion.div>
      )}

      {/* Diagnostic-mode CTA — single, unambiguous call to action */}
      {imageFile && mode === 'diagnostic' && !diagSummary && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div
            className="p-3 rounded-xl text-xs leading-relaxed"
            style={{ background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)', color: 'var(--green-ink)' }}
          >
            I'll read every problem on the page, compare your answers with Wolfram, and suggest a plan for the spots that need work. No pressure — we'll go at your pace.
          </div>
          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--green)', color: 'var(--text-on-accent)' }}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <ClipboardCheck size={16} />}
            {loading ? (diagStatus || 'Grading…') : 'Grade my test'}
          </button>
        </motion.div>
      )}

      {/* Diagnostic streaming results */}
      {mode === 'diagnostic' && (diagStatus || diagProblems.length > 0 || diagSummary) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {diagStatus && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <Loader2 size={12} className="animate-spin" />
              <span>{diagStatus}</span>
            </div>
          )}

          {diagProblems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                  Problem-by-problem
                </p>
                {diagSummary && (
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {diagSummary.correct_count}/{diagSummary.total_attempts} verified correct
                  </p>
                )}
              </div>
              {diagProblems.map(p => {
                const verdictMeta = {
                  correct: { icon: CheckCircle2, label: 'Correct', style: { color: 'var(--green-ink)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)' } },
                  incorrect: { icon: XCircle, label: 'Off', style: { color: 'var(--red)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)' } },
                  skipped: { icon: MinusCircle, label: 'Skipped', style: { color: 'var(--text-tertiary)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' } },
                  unverifiable: { icon: HelpCircle, label: 'Needs review', style: { color: 'var(--orange)', background: 'rgba(255,149,0,.06)', border: '1px solid rgba(255,149,0,.22)' } },
                }[p.verdict];
                const VIcon = verdictMeta.icon;
                return (
                  <div key={p.index} className="p-3 rounded-xl" style={verdictMeta.style}>
                    <div className="flex items-start gap-2">
                      <VIcon size={14} className="shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className="text-[10px] uppercase tracking-wide font-semibold">
                            {p.index + 1}. {verdictMeta.label}
                          </p>
                          {p.concept_id && (
                            <span className="text-[10px] opacity-70">{p.concept_id.replace(/-/g, ' ')}</span>
                          )}
                        </div>
                        <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{p.problem_text}</p>
                        {(p.student_answer || p.correct_answer) && (
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono">
                            {p.student_answer && (
                              <span style={{ color: 'var(--text-tertiary)' }}>You: {p.student_answer}</span>
                            )}
                            {p.correct_answer && p.correct_answer !== p.student_answer && (
                              <span style={{ color: 'var(--green-ink)' }}>Answer: {p.correct_answer}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary + offer to reveal syllabus */}
          {diagSummary && (
            <div
              className="p-4 rounded-xl space-y-2"
              style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
            >
              <div className="flex items-center gap-2">
                <Brain size={13} style={{ color: 'var(--indigo-ink)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>How you did</h3>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold" style={{ color: 'var(--green-ink)' }}>{diagSummary.correct_count}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>correct</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: 'var(--red)' }}>{diagSummary.incorrect_count}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>off</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-tertiary)' }}>{diagSummary.skipped_count}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>skipped</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: 'var(--orange)' }}>{diagSummary.unverifiable_count}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>need review</p>
                </div>
              </div>
              {diagSummary.weak_concepts.length > 0 && (
                <div className="pt-2" style={{ borderTop: 'var(--hairline) solid var(--separator)' }}>
                  <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>Focus areas</p>
                  <div className="flex flex-wrap gap-1">
                    {diagSummary.weak_concepts.map(c => (
                      <span
                        key={c}
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,59,48,.06)', color: 'var(--red)', border: '1px solid rgba(255,59,48,.22)' }}
                      >
                        {c.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* The permission-seeking chip — only if a next step was suggested AND syllabus is ready */}
          {diagSummary?.next_step && diagSyllabus && !diagSyllabusRevealed && (
            <NextStepChip
              step={diagSummary.next_step}
              onAccept={handleNextStep}
              acceptLabel="Show the plan"
            />
          )}

          {/* Expanded syllabus — only shown after explicit consent via the chip */}
          {diagSyllabus && diagSyllabusRevealed && (
            <div
              className="p-4 rounded-xl space-y-3"
              style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={13} style={{ color: 'var(--indigo-ink)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Your focused plan</h3>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                <span>{diagSyllabus.stats.total_concepts} concepts</span>
                <span>~{diagSyllabus.stats.estimated_days} days</span>
                <span>~{Math.round(diagSyllabus.stats.total_study_minutes / 60)} study hours</span>
                <span>scope: {diagSyllabus.scope}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {diagSyllabus.intro}
              </p>
              <div className="space-y-1.5 pt-1">
                {diagSyllabus.nodes.slice(0, 8).map((n, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(`/lesson/${n.concept_id}`)}
                    className="w-full flex items-start gap-2 text-xs text-left p-1.5 -mx-1.5 rounded-lg transition-colors"
                  >
                    <span
                      className="shrink-0 w-5 h-5 rounded-full text-[10px] flex items-center justify-center"
                      style={{ background: 'var(--surface-fill)', color: 'var(--text-tertiary)' }}
                    >
                      {n.scheduled_day}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        {n.concept_label}
                        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          → study
                        </span>
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        {n.topic.replace(/-/g, ' ')} · {n.estimated_study_minutes}min · {n.inclusion_reason.replace(/-/g, ' ')}
                      </p>
                    </div>
                  </button>
                ))}
                {diagSyllabus.nodes.length > 8 && (
                  <p className="text-[10px] pl-7" style={{ color: 'var(--text-tertiary)' }}>
                    …and {diagSyllabus.nodes.length - 8} more concept{diagSyllabus.nodes.length - 8 === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-xl text-sm"
          style={{ background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', color: 'var(--red)' }}
        >
          {error}
        </motion.div>
      )}

      {/* Response */}
      <AnimatePresence mode="wait">
        {response && (
          <motion.div
            key={response.request_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Analysis header */}
            {intentMeta && (
              <div className="p-3 rounded-xl" style={intentMeta.style}>
                <div className="flex items-start gap-2">
                  <intentMeta.icon size={14} className="shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide">
                        Detected: {intentMeta.label}
                      </p>
                      <div className="flex gap-3 text-[10px] shrink-0">
                        <span className="flex items-center gap-1"><Clock size={10} />{response.latency_ms}ms</span>
                        <span className="flex items-center gap-1"><DollarSign size={10} />{response.cost_estimate_usd.toFixed(4)}</span>
                      </div>
                    </div>
                    <p className="text-xs opacity-80 mt-1">{response.analysis.summary}</p>
                    {response.analysis.detected_concepts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {response.analysis.detected_concepts.map(c => (
                          <span
                            key={c}
                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ background: 'var(--surface-fill)', color: 'var(--text-secondary)', border: 'var(--hairline) solid var(--separator)' }}
                          >
                            {c.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Explanation */}
            {response.explanation && (
              <div
                className="p-4 rounded-xl space-y-2"
                style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={13} style={{ color: 'var(--indigo-ink)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Overview</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{response.explanation.summary}</p>
                {response.explanation.steps.length > 0 && (
                  <ol className="list-decimal pl-5 space-y-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {response.explanation.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                )}
                {response.explanation.example && (
                  <div
                    className="mt-2 p-2 rounded-lg text-xs font-mono whitespace-pre-wrap"
                    style={{ background: 'var(--surface-sunken)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)' }}
                  >
                    {response.explanation.example}
                  </div>
                )}
              </div>
            )}

            {/* Solution */}
            {response.solution && (
              <div
                className="p-4 rounded-xl space-y-2"
                style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={13} style={{ color: 'var(--green-ink)' }} />
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Solution</h3>
                  </div>
                  {response.solution.verification_method === 'wolfram' && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(52,199,89,.06)', color: 'var(--green-ink)', border: '1px solid rgba(52,199,89,.22)' }}
                    >
                      Wolfram ✓
                    </span>
                  )}
                </div>
                {response.solution.final_answer && (
                  <p className="text-sm font-mono" style={{ color: 'var(--green-ink)' }}>Answer: {response.solution.final_answer}</p>
                )}
                {response.solution.steps.length > 0 && (
                  <ol className="list-decimal pl-5 space-y-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {response.solution.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                )}
              </div>
            )}

            {/* Practice problems */}
            {response.practice_problems && response.practice_problems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} style={{ color: 'var(--indigo-ink)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Similar problems</h3>
                </div>
                {response.practice_problems.map(p => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl space-y-1"
                    style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
                  >
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                      <span>{p.topic.replace(/-/g, ' ')} · difficulty {p.difficulty.toFixed(2)}</span>
                      {p.wolfram_verified && (
                        <span style={{ color: 'var(--green-ink)' }}>Wolfram ✓</span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{p.question_text}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>A: {p.correct_answer}</p>
                  </div>
                ))}
              </div>
            )}

            {/* OCR */}
            {response.ocr && (
              <div
                className="p-4 rounded-xl space-y-2"
                style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
              >
                <div className="flex items-center gap-2">
                  <FileText size={13} style={{ color: 'var(--text-tertiary)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Transcription</h3>
                </div>
                <pre className="text-xs whitespace-pre-wrap font-mono" style={{ color: 'var(--text-secondary)' }}>{response.ocr.text}</pre>
              </div>
            )}

            {/* Strategy hints */}
            {response.strategy_hints && response.strategy_hints.length > 0 && (
              <div
                className="p-3 rounded-xl space-y-1.5"
                style={{ background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.22)' }}
              >
                <div className="flex items-center gap-2">
                  <Brain size={12} style={{ color: 'var(--indigo-ink)' }} />
                  <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: 'var(--indigo-ink)' }}>Strategy</p>
                </div>
                <ul className="space-y-1">
                  {response.strategy_hints.map((h, i) => (
                    <li key={i} className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>• {h}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* The permission-seeking chip — at most one suggestion, dismissible */}
            {response.next_step && (
              <NextStepChip
                step={response.next_step}
                onAccept={handleNextStep}
              />
            )}

            <button
              onClick={clearImage}
              className="w-full py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)' }}
            >
              Try another image
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
