/**
 * ShareCard — client-side composed shareable "report card" image
 * (Wave U1, UX-100x doc §3.2 "Shareable report card").
 *
 * Renders a canvas-composed PNG with the plan headline + a forward-looking
 * gain statement, and the share URL baked visibly into the pixels —
 * screenshots must carry the link, not just a hyperlink. Deliberately carries
 * no "verified"/receipt-border visual language: nothing on this card is
 * backed by a verification_log record, so it doesn't borrow that trust cue.
 * Deliberately never shows the weakness/band map: only the plan, per the
 * agency-first law (see DiagnosticPage's results screen).
 *
 * No new dependency: plain <canvas> + toBlob(), matching the house
 * convention of favoring the pure-browser fallback (checked `package.json`
 * and the rest of the frontend for an SVG-to-PNG library first — none
 * exists). Uses the Web Share API (navigator.share) when the browser
 * supports attaching files to it, falling back to a plain PNG download,
 * with "copy link" always available as a third option (checked for an
 * existing navigator.share convention first — none exists yet, so this
 * establishes it).
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Share2, Download, Copy, Check } from 'lucide-react';
import { trackShare } from '@/lib/beacon';

interface ShareCardProps {
  /** Headline from the plan screen, e.g. "Your next 10 hours". */
  planHeadline: string;
  /** The forward-looking gain statement — never the weakness map. */
  planSubtext: string;
  /** Exam name, shown small next to the wordmark when known. */
  examName?: string;
  /** URL baked into the image and offered via the native share sheet / copy link. */
  shareUrl: string;
  onClose: () => void;
}

// A 1200x630 canvas keeps generous font sizes so the card stays legible at
// WhatsApp thumbnail size (~300px wide, ~4x downscale).
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Clarity system-sans / mono stacks (frontend/src/styles/tokens/fonts.css)
// duplicated here because <canvas> text can't read CSS custom properties —
// ctx.font needs a literal font-family string.
const FONT_SANS =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter Tight", "Segoe UI", system-ui, sans-serif';
const FONT_MONO = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace';

async function drawCard(
  canvas: HTMLCanvasElement,
  props: { planHeadline: string; planSubtext: string; examName?: string; shareUrl: string },
) {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Best-effort wait for the Inter Tight / JetBrains Mono webfonts already
  // loaded by the app shell; falls back to system sans/mono if unavailable
  // (e.g. jsdom).
  try {
    await (document as any).fonts?.ready;
  } catch {
    /* ignore — draw with fallback fonts */
  }

  // Background — Clarity canvas (DESIGN-SYSTEM.md --surface-canvas).
  ctx.fillStyle = '#f5f5f7';
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Deliberately NO border/badge here: this card carries a plan + a forward
  // projection, not a CAS-verified answer. The green "receipt" border and
  // any "Verified ✓" language are reserved for content backed by a real
  // verification_log record (see DESIGN-SYSTEM.md "Receipt Border") — putting
  // that visual language on a share card with nothing behind it is exactly
  // the decorative-trust-signal failure the receipt law exists to prevent.
  const left = 72;
  let y = 112;

  // Wordmark — Clarity mastery green (--green-ink, on white/canvas — clears
  // 4.5:1), never the retired emerald-500 (#10b981).
  ctx.fillStyle = '#248a3d';
  ctx.font = `600 32px ${FONT_SANS}`;
  ctx.fillText(props.examName ? `VIDHYA · ${props.examName.toUpperCase()}` : 'VIDHYA', left, y);

  // Headline — Clarity ink on canvas, system sans (no Fraunces).
  y += 96;
  ctx.fillStyle = '#1d1d1f';
  ctx.font = `700 78px ${FONT_SANS}`;
  const headlineLines = wrapText(ctx, props.planHeadline, CARD_WIDTH - left * 2);
  for (const line of headlineLines.slice(0, 2)) {
    y += 86;
    ctx.fillText(line, left, y);
  }

  // Subtext — the forward-looking gain statement only, never the weakness
  // map. Clarity secondary text (--text-secondary at full opacity for
  // legibility on a flattened canvas — no rgba compositing here).
  y += 66;
  ctx.fillStyle = '#6e6e73';
  ctx.font = `400 40px ${FONT_SANS}`;
  const subLines = wrapText(ctx, props.planSubtext, CARD_WIDTH - left * 2);
  for (const line of subLines.slice(0, 2)) {
    y += 52;
    ctx.fillText(line, left, y);
  }

  // URL baked directly into the pixels — a screenshot must carry the link.
  ctx.font = `600 34px ${FONT_MONO}`;
  ctx.fillStyle = '#248a3d';
  ctx.fillText(props.shareUrl, left, CARD_HEIGHT - 54);
}

export function ShareCard({ planHeadline, planSubtext, examName, shareUrl, onClose }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'sharing' | 'shared' | 'error'>('idle');

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCard(canvas, { planHeadline, planSubtext, examName, shareUrl }).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; };
  }, [planHeadline, planSubtext, examName, shareUrl]);

  const getBlob = (): Promise<Blob | null> =>
    new Promise(resolve => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve(null);
      canvas.toBlob(blob => resolve(blob), 'image/png');
    });

  const handleShare = async () => {
    setShareState('sharing');
    const blob = await getBlob();
    if (!blob) {
      setShareState('error');
      return;
    }
    const file = new File([blob], 'vidhya-report-card.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
    const canShareFiles = typeof nav.share === 'function' &&
      typeof nav.canShare === 'function' &&
      nav.canShare({ files: [file] });

    try {
      if (canShareFiles) {
        await nav.share({
          files: [file],
          title: 'My Vidhya study plan',
          text: `${planHeadline} — ${planSubtext}`,
        });
        trackShare('report_card');
        setShareState('shared');
      } else if (typeof nav.share === 'function') {
        // Share API present but this browser can't attach files — share the link instead.
        await nav.share({ title: 'My Vidhya study plan', text: planHeadline, url: shareUrl });
        trackShare('report_card');
        setShareState('shared');
      } else {
        // No Web Share API at all — fall back to a plain PNG download.
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vidhya-report-card.png';
        a.click();
        URL.revokeObjectURL(url);
        trackShare('report_card');
        setShareState('shared');
      }
    } catch (err) {
      // AbortError = user dismissed the native share sheet — not a failure.
      if ((err as DOMException)?.name === 'AbortError') {
        setShareState('idle');
      } else {
        setShareState('error');
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackShare('report_card');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the URL is still baked into the card image.
    }
  };

  const supportsShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Share your report card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 backdrop-blur-sm flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'rgba(0,0,0,.28)' }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        aria-label="Close"
      >
        <X size={20} />
      </button>

      <div className="w-full max-w-md space-y-4">
        <div
          className="rounded-xl overflow-hidden border"
          style={{ borderColor: 'rgba(52,199,89,.2)', background: 'var(--surface-card)' }}
        >
          <canvas ref={canvasRef} className="w-full h-auto block" aria-label="Report card preview" />
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleShare}
            disabled={!ready || shareState === 'sharing'}
            className="w-full py-3 rounded-xl disabled:opacity-50 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            style={{ background: 'var(--green)', color: 'var(--text-on-accent)' }}
          >
            {supportsShare ? <Share2 size={16} /> : <Download size={16} />}
            {supportsShare ? 'Share report card' : 'Download report card'}
          </button>
          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 rounded-xl border text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
            style={{ borderColor: 'var(--separator)', color: 'var(--text-secondary)' }}
          >
            {copied
              ? <Check size={14} style={{ color: 'var(--green-ink)' }} />
              : <Copy size={14} />}
            {copied ? 'Link copied' : 'Copy link'}
          </button>
        </div>

        {shareState === 'error' && (
          <p className="text-xs text-center" style={{ color: 'var(--red)' }}>
            Couldn't open the share sheet — try downloading instead.
          </p>
        )}
      </div>
    </motion.div>
  );
}
