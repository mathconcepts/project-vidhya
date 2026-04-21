/**
 * YourTeacherCard
 *
 * Shown on student home ONLY when the student has taught_by set.
 * Self-study students never see this. Makes the student-teacher
 * relationship explicit and transparent.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, Eye, EyeOff, ChevronDown, Mail, ExternalLink } from 'lucide-react';
import { authFetch } from '@/lib/auth/client';

interface MyTeacherResp {
  teacher: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  } | null;
  teacher_can_see?: Record<string, string>;
  pushed_reviews?: Array<{
    concept_id: string;
    pushed_by_teacher_id: string;
    pushed_at: string;
  }>;
}

export function YourTeacherCard() {
  const [data, setData] = useState<MyTeacherResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTransparency, setExpandedTransparency] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await authFetch('/api/student/my-teacher');
        if (r.ok) setData(await r.json());
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading || !data?.teacher) return null;

  const t = data.teacher;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/6 via-surface-900 to-sky-500/6 border border-emerald-500/20 space-y-2.5"
    >
      <div className="flex items-center gap-3">
        {t.picture ? (
          <img src={t.picture} alt="" className="w-10 h-10 rounded-full shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center shrink-0">
            <UserCheck size={18} className="text-emerald-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-emerald-400 uppercase tracking-wide font-medium">
            Your teacher
          </p>
          <p className="text-sm font-medium text-surface-100 truncate">{t.name}</p>
          <a
            href={`mailto:${t.email}`}
            className="text-[11px] text-surface-400 hover:text-sky-300 inline-flex items-center gap-1 truncate"
          >
            <Mail size={9} />
            {t.email}
          </a>
        </div>
      </div>

      {/* Transparency preview */}
      <button
        onClick={() => setExpandedTransparency(v => !v)}
        className="w-full flex items-center justify-between text-[11px] text-surface-500 hover:text-surface-300 py-1"
      >
        <span className="inline-flex items-center gap-1.5">
          {expandedTransparency ? <EyeOff size={10} /> : <Eye size={10} />}
          What {t.name.split(' ')[0]} can see
        </span>
        <ChevronDown
          size={11}
          className={`transition-transform ${expandedTransparency ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {expandedTransparency && data.teacher_can_see && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pt-1 pb-0.5">
              {Object.entries(data.teacher_can_see).map(([k, v]) => {
                const label = k.replace(/_/g, ' ');
                const isNo = v.startsWith('no');
                return (
                  <div
                    key={k}
                    className={`flex items-center gap-2 text-[11px] ${isNo ? 'text-emerald-300/70' : 'text-surface-400'}`}
                  >
                    <span className="w-1 h-1 rounded-full shrink-0 bg-current opacity-50" />
                    <span className="capitalize flex-1 truncate">{label}</span>
                    <span className="text-[10px]">{v}</span>
                  </div>
                );
              })}
              <p className="text-[10px] text-surface-600 pt-1.5 italic">
                Privacy is part of the design. Your raw answers and emotional data stay yours.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
