---
# Alternative body for gram-schmidt.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: gram-schmidt.intuition.assured
concept_id: gram-schmidt
atom_type: intuition
bloom_level: 2
difficulty: 0.1
modality: visual
exam_ids: ["*"]
variant_of: gram-schmidt.intuition
for_stance: assured
---

The recursion is $u_i = v_i - \sum_{j<i}\text{proj}_{u_j}v_i$, projections onto the $u_j$'s already built — never onto the original $v_j$'s. Using $v_j$ instead of $u_j$ in a later step is the single most common slip: it silently reintroduces a component the earlier orthogonalization already removed.

**Where the marks are.** QR decomposition *is* Gram-Schmidt with the bookkeeping made explicit: $Q$'s columns are the normalized $u_i$'s, and $R$'s entries are exactly the projection coefficients computed along the way — nothing new to compute if you already ran the process. Numerically, classical Gram-Schmidt (project onto all original $v_j$'s at once) loses precision when vectors are nearly dependent; the exam-level fix worth knowing exists (modified Gram-Schmidt, one $u_j$ at a time) even if you're never asked to derive it.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag v2 and watch its orthogonal leftover against a fixed u1 = (1,1)",
  "inputs": [
    {"id": "v2x", "label": "v2 (x)", "min": -3, "max": 3, "step": 0.5, "initial": 2},
    {"id": "v2y", "label": "v2 (y)", "min": -3, "max": 3, "step": 0.5, "initial": 0}
  ],
  "outputs": [
    {"label": "projection coefficient c = (v2·u1)/(u1·u1)", "formula": "(v2x + v2y) / 2", "digits": 2},
    {"label": "u2 (x) = v2x − c", "formula": "v2x - (v2x + v2y) / 2", "digits": 2},
    {"label": "u2 (y) = v2y − c", "formula": "v2y - (v2x + v2y) / 2", "digits": 2},
    {"label": "check: u1 · u2 (always 0)", "formula": "1 * (v2x - (v2x + v2y) / 2) + 1 * (v2y - (v2x + v2y) / 2)", "digits": 4}
  ],
  "caption": "u1 = (1,1) is fixed. Wherever you drag v2, the check stays 0 — subtracting the exact projection guarantees orthogonality, not an approximation of it."
}
```
