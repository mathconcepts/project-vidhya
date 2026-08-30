---
# Alternative body for fourier-transform.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: fourier-transform.hook.assured
concept_id: fourier-transform
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: fourier-transform.hook
for_stance: assured
---

Continuous spectrum in place of discrete harmonics is the whole story; the trap sits in the shift theorems. A time shift $f(t-t_0)$ multiplies $F(\omega)$ by $e^{-i\omega t_0}$ — the phase term goes with the *time* variable, so it is easy under pressure to write $e^{+i\omega t_0}$ instead, or to attach it to the frequency shift $F(\omega-\omega_0)$ formula in reverse, swapping which one gets the sign.
