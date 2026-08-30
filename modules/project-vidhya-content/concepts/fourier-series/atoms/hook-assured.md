---
# Alternative body for fourier-series.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: fourier-series.hook.assured
concept_id: fourier-series
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: fourier-series.hook
for_stance: assured
---

The decomposition is the whole content — a period-$2L$ signal is $\dfrac{a_0}{2}+\sum a_n\cos\frac{n\pi x}{L}+b_n\sin\frac{n\pi x}{L}$, nothing more exotic. Where GATE actually scores you is elsewhere: whether you exploit even/odd symmetry to kill half the coefficients before integrating, and whether you know the series at a jump discontinuity converges to the *average* of the two one-sided limits, not to $f$ itself.
