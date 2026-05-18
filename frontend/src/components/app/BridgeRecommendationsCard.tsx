/**
 * BridgeRecommendationsCard — student-facing surface for syllabus-bridge content.
 *
 * For students whose exam profile has a knowledge_track_id set (e.g.
 * TN-HSE-12-MATH), GBrain ranks the bridge entries that bridge their school
 * curriculum to their exam target. This card surfaces the top 3 with ready
 * content links and inline feedback.
 *
 * Renders nothing when there is no relevant mapping for the student — safe
 * to drop into any planner page; it disappears for students without a track.
 */

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client';
import { clsx } from 'clsx';
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
  // Track which content_ids the student has already rated, so we don't
  // show the rate buttons again post-feedback (less noisy UI).
  const [ratedContent, setRatedContent] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // 1. Read student's onboard meta -> get their knowledge_track + exam
        const metaRes = await authFetch('/api/onboard/meta');
        if (!metaRes.ok) return;
        const meta = await metaRes.json();
        if (cancelled) return;
        const track = meta.knowledge_track as KnowledgeTrack | null;
        if (!track) { setLoading(false); return; }   // student has no track -> hide card
        setKnowledgeTrack(track);

        // 2. Find a mapping whose source_curriculum_id matches this track
        //    (or whose target_exam_id matches their primary exam).
        const mapRes = await authFetch('/api/syllabus-bridge/mappings');
        if (!mapRes.ok) return;
        const { mappings } = await mapRes.json() as { mappings: Mapping[] };
        if (cancelled) return;

        // Heuristic: match on the prefix shared between track id and curriculum id.
        // Track 'TN-HSE-12-MATH' aligns with curriculum 'TN-12-MATH'; we look for
        // any mapping whose source curriculum mentions the same board + grade + subject.
        const target = mappings.find(m => {
          // Source curriculum naming convention is e.g. 'TN-12-MATH'.
          // Track ids are 'TN-HSE-12-MATH'. Strip a known mid segment and compare.
          const trackTokens = track.id.split('-');           // TN, HSE, 12, MATH
          const sourceTokens = m.source_curriculum_id.split('-'); // TN, 12, MATH
          // Compare board, grade, subject
          return trackTokens[0] === sourceTokens[0]
              && trackTokens.slice(-2).join('-') === sourceTokens.slice(-2).join('-')
              && m.target_exam_id === meta.exam_id;
        });
        if (!target) { setLoading(false); return; }
        setMapping(target);

        // 3. Fetch top-3 recommendations
        const recRes = await authFetch(`/api/syllabus-bridge/mappings/${target.id}/recommendations?limit=3`);
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
  }, []);

  async function rateContent(content_id: string, rating: 'helpful' | 'not-helpful') {
    try {
      await authFetch(`/api/syllabus-bridge/content/${content_id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      setRatedContent(prev => new Set(prev).add(content_id));
    } catch { /* silent — student doesn't need an error toast */ }
  }

  // Nothing to show — return null so this card doesn't take up space.
  if (loading) return null;
  if (error) return null;
  if (!mapping || !knowledgeTrack) return null;
  if (recs.length === 0) return null;

  return (
    <div className="rounded-xl bg-gradient-to-br from-sky-500/10 to-emerald-500/5 border border-sky-500/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-sky-400" />
        <h3 className="text-sm font-semibold text-zinc-100">
          Bridge content for {knowledgeTrack.display_name}
        </h3>
      </div>
      <p className="text-xs text-zinc-400 mb-3">
        GBrain picked these topics based on where you are right now — they connect what you know
        from school to what your exam expects.
      </p>

      <div className="space-y-2">
        {recs.map(r => {
          const primaryContent = r.ready_content[0];
          return (
            <div key={r.entry_id} className="rounded-lg bg-zinc-950/50 border border-zinc-800 overflow-hidden">
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-100">
                      {primaryContent?.title ?? r.entry_id}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{r.reason}</div>
                  </div>
                  <div className="text-[10px] text-sky-400 shrink-0">
                    need {Math.round(r.need_score * 100)}
                  </div>
                </div>

                {r.needs_generation && (
                  <div className="mt-2 text-[11px] text-zinc-500 italic">
                    Material not generated yet. Ask your teacher to enable it.
                  </div>
                )}

                {primaryContent && (
                  <button
                    onClick={() => setExpandedContentId(
                      expandedContentId === primaryContent.content_id ? null : primaryContent.content_id
                    )}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    <BookOpen className="w-3 h-3" />
                    {expandedContentId === primaryContent.content_id ? 'Hide' : 'Read'}
                    <ChevronRight className={clsx(
                      'w-3 h-3 transition-transform',
                      expandedContentId === primaryContent.content_id && 'rotate-90',
                    )} />
                  </button>
                )}
              </div>

              {primaryContent && expandedContentId === primaryContent.content_id && (
                <div className="border-t border-zinc-800 bg-zinc-950 p-4 space-y-3">
                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {primaryContent.body_markdown}
                  </pre>

                  {!ratedContent.has(primaryContent.content_id) && (
                    <div className="border-t border-zinc-800 pt-3 flex items-center gap-2 text-xs">
                      <span className="text-zinc-400">Did this help?</span>
                      <button
                        onClick={() => rateContent(primaryContent.content_id, 'helpful')}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                      >
                        <ThumbsUp className="w-3 h-3" /> Helpful
                      </button>
                      <button
                        onClick={() => rateContent(primaryContent.content_id, 'not-helpful')}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                      >
                        <ThumbsDown className="w-3 h-3" /> Not really
                      </button>
                    </div>
                  )}

                  {ratedContent.has(primaryContent.content_id) && (
                    <div className="text-[11px] text-emerald-400 italic border-t border-zinc-800 pt-3">
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
