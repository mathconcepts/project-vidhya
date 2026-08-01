/**
 * BridgeRecommendationsCard — student-facing surface for syllabus-bridge content.
 */

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client';
import { Sparkles, ChevronRight, ThumbsUp, ThumbsDown, BookOpen } from 'lucide-react';

interface GeneratedContentItem {
  content_id: string;
  unit_type: string;
  title: string;
  body_markdown: string;
  source: string;
  generated_at: string;
}

interface Recommendation {
  entry_id: string;
  need_score: number;
  reason: string;
  ready_content: GeneratedContentItem[];
  needs_generation: boolean;
}

interface Mapping {
  id: string;
  source_curriculum_id: string;
  target_exam_id: string;
  display_name: string;
}

interface KnowledgeTrack {
  id: string;
  display_name: string;
  board_name: string;
  grade_name: string;
  subject_name: string;
}

export function BridgeRecommendationsCard() {
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [knowledgeTrack, setKnowledgeTrack] = useState<KnowledgeTrack | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedContentId, setExpandedContentId] = useState<string | null>(null);
  const [ratedContent, setRatedContent] = useState<Set<string>>(new Set());
  const [profileIntent, setProfileIntent] = useState<string | null>(null);
  const [intentOverride, setIntentOverride] = useState<'board-focused' | 'bridge' | 'entrance-focused' | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const metaRes = await authFetch('/api/onboard/meta');
        if (!metaRes.ok) return;
        const meta = await metaRes.json();
        if (cancelled) return;
        const track = meta.knowledge_track as KnowledgeTrack | null;
        if (!track) { setLoading(false); return; }
        setKnowledgeTrack(track);
        setProfileIntent(meta.prep_intent ?? null);

        const mapRes = await authFetch('/api/syllabus-bridge/mappings');
        if (!mapRes.ok) return;
        const { mappings } = await mapRes.json() as { mappings: Mapping[] };
        if (cancelled) return;

        const target = mappings.find(m => {
          const trackTokens = track.id.split('-');
          const sourceTokens = m.source_curriculum_id.split('-');
          return trackTokens[0] === sourceTokens[0]
              && trackTokens.slice(-2).join('-') === sourceTokens.slice(-2).join('-')
              && m.target_exam_id === meta.exam_id;
        });
        if (!target) { setLoading(false); return; }
        setMapping(target);

        const qs = new URLSearchParams({ limit: '3' });
        if (intentOverride) qs.set('intent', intentOverride);
        const recRes = await authFetch(`/api/syllabus-bridge/mappings/${target.id}/recommendations?${qs.toString()}`);
        if (!recRes.ok) return;
        const { recommendations } = await recRes.json();
        if (cancelled) return;
        setRecs(recommendations);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Could not load recommendations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [intentOverride]);

  async function rateContent(content_id: string, rating: 'helpful' | 'not-helpful') {
    try {
      await authFetch(`/api/syllabus-bridge/content/${content_id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      setRatedContent(prev => new Set(prev).add(content_id));
    } catch { /* silent */ }
  }

  if (loading) return null;
  if (error) return null;
  if (!mapping || !knowledgeTrack) return null;
  if (recs.length === 0) return null;

  const effectiveIntent = intentOverride ?? profileIntent ?? 'bridge';

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      border: 'var(--hairline) solid var(--separator)',
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-raise)',
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Sparkles size={16} style={{ color: 'var(--indigo-ink)' }} />
        <h3 style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          Bridge content for {knowledgeTrack.display_name}
        </h3>
      </div>
      <p style={{ margin: '0 0 8px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
        GBrain picked these topics based on where you are right now — they connect what you know
        from school to what your exam expects.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 11 }}>
        <span style={{ color: 'var(--text-tertiary)' }}>View as:</span>
        {(['board-focused', 'bridge', 'entrance-focused'] as const).map(opt => {
          const active = effectiveIntent === opt;
          const labels: Record<typeof opt, string> = {
            'board-focused': 'Board',
            'bridge': 'Bridge',
            'entrance-focused': 'Entrance',
          };
          return (
            <button
              key={opt}
              onClick={() => setIntentOverride(opt === profileIntent ? null : opt)}
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                background: active ? 'rgba(88,86,214,.08)' : 'var(--surface-fill)',
                border: active ? '1px solid rgba(88,86,214,.3)' : 'var(--hairline) solid var(--separator)',
                color: active ? 'var(--indigo-ink)' : 'var(--text-secondary)',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {labels[opt]}
            </button>
          );
        })}
        {intentOverride && intentOverride !== profileIntent && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>temporary view</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {recs.map(r => {
          const primaryContent = r.ready_content[0];
          return (
            <div key={r.entry_id} style={{ borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', overflow: 'hidden' }}>
              <div style={{ padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
                      {primaryContent?.title ?? r.entry_id}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{r.reason}</div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--indigo-ink)', flexShrink: 0 }}>
                    need {Math.round(r.need_score * 100)}
                  </div>
                </div>

                {r.needs_generation && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    Material not generated yet. Ask your teacher to enable it.
                  </div>
                )}

                {primaryContent && (
                  <button
                    onClick={() => setExpandedContentId(
                      expandedContentId === primaryContent.content_id ? null : primaryContent.content_id
                    )}
                    style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-caption)', color: 'var(--indigo-ink)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <BookOpen size={12} />
                    {expandedContentId === primaryContent.content_id ? 'Hide' : 'Read'}
                    <ChevronRight size={12} style={{ transform: expandedContentId === primaryContent.content_id ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                  </button>
                )}
              </div>

              {primaryContent && expandedContentId === primaryContent.content_id && (
                <div style={{ borderTop: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <pre style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', lineHeight: 'var(--leading-relaxed)' }}>
                    {primaryContent.body_markdown}
                  </pre>

                  {!ratedContent.has(primaryContent.content_id) && (
                    <div style={{ borderTop: 'var(--hairline) solid var(--separator)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-caption)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Did this help?</span>
                      <button
                        onClick={() => rateContent(primaryContent.content_id, 'helpful')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)', color: 'var(--green-ink)', cursor: 'pointer', fontSize: 'var(--text-caption)' }}
                      >
                        <ThumbsUp size={12} /> Helpful
                      </button>
                      <button
                        onClick={() => rateContent(primaryContent.content_id, 'not-helpful')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-caption)' }}
                      >
                        <ThumbsDown size={12} /> Not really
                      </button>
                    </div>
                  )}

                  {ratedContent.has(primaryContent.content_id) && (
                    <div style={{ fontSize: 11, color: 'var(--green-ink)', fontStyle: 'italic', borderTop: 'var(--hairline) solid var(--separator)', paddingTop: 12 }}>
                      Thanks — your rating shapes what gets re-written.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
