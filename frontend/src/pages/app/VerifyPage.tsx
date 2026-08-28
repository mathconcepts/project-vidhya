/**
 * VerifyPage — "Verify Any Problem" with animations and auto-resize textarea.
 * Rate limited: 10/hr per session.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import { CheckCircle, XCircle, Loader2, AlertTriangle, Zap, Clock } from 'lucide-react';
import { CameraInput } from '@/components/app/CameraInput';

interface VerifyResult {
  traceId: string;
  status: string;
  confidence: number;
  tierUsed: string;
  durationMs: number;
  checks: Array<{
    verifier: string;
    status: string;
    confidence: number;
    details: string;
  }>;
}

export default function VerifyPage() {
  const sessionId = useSession();
  const [problem, setProblem] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');
  const [image, setImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    trackEvent('page_view', { page: 'verify' });
  }, []);

  const handleProblemChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProblem(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    }
  };

  const handleVerify = async () => {
    if ((!problem.trim() && !image) || !answer.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');

    trackEvent('verify_submit', { problemLength: problem.length, hasImage: !!image });

    try {
      const payload: Record<string, unknown> = { answer: answer.trim(), sessionId };
      if (problem.trim()) payload.problem = problem.trim();
      if (image) {
        payload.image = image.base64;
        payload.imageMimeType = image.mimeType;
      }
      const res = await apiFetch<VerifyResult>('/api/verify-any', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setResult(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'verified') return <CheckCircle size={20} style={{ color: 'var(--green-ink)' }} />;
    if (status === 'failed') return <XCircle size={20} style={{ color: 'var(--red)' }} />;
    return <AlertTriangle size={20} style={{ color: 'var(--orange)' }} />;
  };

  // 'verified' uses the same inset-border token as <ReceiptBorder> (DESIGN-SYSTEM.md's
  // receipt-border law) rather than a hand-rolled green rgba() — this panel already
  // carries its own "Answer verified correct" + tier/confidence meta, so it borrows the
  // receipt token treatment in place rather than nesting the full ReceiptBorder component.
  const statusColor = (status: string): React.CSSProperties => {
    if (status === 'verified') return { background: 'var(--surface-card)', boxShadow: 'inset 0 0 0 1px var(--receipt-line)' };
    if (status === 'failed') return { border: '1px solid var(--red-tint)', background: 'var(--red-tint)' };
    return { border: '1px solid var(--orange-tint)', background: 'var(--orange-tint)' };
  };

  const statusLabel = (status: string) => {
    if (status === 'verified') return 'Answer verified correct';
    if (status === 'failed') return 'Answer appears incorrect';
    if (status === 'partial') return 'Partially verified';
    return 'Could not verify';
  };

  const canSubmit = (problem.trim() || image) && answer.trim() && !loading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Scan & Verify</h1>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          Snap a photo of any math problem or type it in. We'll verify your answer through our 3-tier pipeline.
        </p>
      </div>

      {/* Camera Input */}
      <CameraInput
        onCapture={(b, m) => setImage({ base64: b, mimeType: m })}
        onClear={() => setImage(null)}
        preview={image?.base64 || null}
      />

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--separator)' }} />
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>or type manually</span>
        <div style={{ flex: 1, height: 1, background: 'var(--separator)' }} />
      </div>

      {/* Problem + Answer inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Problem</label>
          <textarea
            ref={textareaRef}
            value={problem}
            onChange={handleProblemChange}
            placeholder="e.g. Find the eigenvalues of the matrix [[2,1],[1,2]]"
            rows={3}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-card)',
              border: 'var(--hairline) solid var(--separator)',
              fontSize: 'var(--text-caption)',
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'none',
              minHeight: '5rem',
              overflow: 'hidden',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Your Answer</label>
          <input
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="e.g. 1 and 3"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-card)',
              border: 'var(--hairline) solid var(--separator)',
              fontSize: 'var(--text-caption)',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={handleVerify}
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: 'var(--text-caption)',
            fontWeight: 'var(--weight-semibold)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            background: canSubmit ? 'var(--indigo)' : 'var(--surface-fill)',
            color: canSubmit ? '#fff' : 'var(--text-tertiary)',
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 className="animate-spin" size={16} />
              Verifying...
            </span>
          ) : 'Verify Answer'}
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,59,48,.25)', background: 'rgba(255,59,48,.06)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div
              style={{
                padding: 16,
                borderRadius: 'var(--radius-md)',
                ...statusColor(result.status),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {result.status === 'verified' ? (
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    {statusIcon(result.status)}
                  </motion.div>
                ) : result.status === 'failed' ? (
                  <motion.div
                    initial={{ x: -5 }}
                    animate={{ x: [0, -3, 3, -3, 3, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    {statusIcon(result.status)}
                  </motion.div>
                ) : (
                  statusIcon(result.status)
                )}
                <span style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{statusLabel(result.status)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Zap size={12} />
                  {result.tierUsed
                    .replace('tier25_', 'Tier 2.5: ')
                    .replace('tier1_', 'Tier 1: ')
                    .replace('tier2_', 'Tier 2: ')
                    .replace('tier3_', 'Tier 3: ')}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} />
                  {result.durationMs}ms
                </span>
                <span>{Math.round(result.confidence * 100)}% confidence</span>
              </div>
            </div>

            {/* Verification Steps */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Verification Steps</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.checks.map((check, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 'var(--text-caption)' }}
                  >
                    <span style={{
                      marginTop: 2,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      flexShrink: 0,
                      background: check.status === 'verified' ? 'rgba(52,199,89,.15)' : check.status === 'failed' ? 'rgba(255,59,48,.15)' : 'var(--surface-fill)',
                      color: check.status === 'verified' ? 'var(--green-ink)' : check.status === 'failed' ? 'var(--red)' : 'var(--text-secondary)',
                    }}>
                      {i + 1}
                    </span>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>{check.verifier}</span>
                      <span style={{ color: 'var(--text-tertiary)', margin: '0 4px' }}>—</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>{check.details}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rate Limit Notice */}
      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>
        10 verifications per hour. Powered by RAG + LLM + Wolfram Alpha.
      </p>
    </div>
  );
}
