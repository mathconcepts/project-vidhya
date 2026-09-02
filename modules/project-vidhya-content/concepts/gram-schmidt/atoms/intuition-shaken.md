---
# Alternative body for gram-schmidt.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: gram-schmidt.intuition.shaken
concept_id: gram-schmidt
atom_type: intuition
bloom_level: 2
difficulty: 0.1
modality: visual
exam_ids: ["*"]
variant_of: gram-schmidt.intuition
for_stance: shaken
---

$u_1=(1,1)$ is the rail. $v_2=(2,0)$ leans against it.

Find how much of $v_2$ lies along $u_1$: $c = \dfrac{v_2\cdot u_1}{u_1\cdot u_1} = \dfrac{2}{2} = 1$. So the along-rail part is $c\,u_1=(1,1)$.

Subtract it: $u_2 = v_2 - (1,1) = (1,-1)$.

Check: $u_1\cdot u_2 = 1(1)+1(-1)=0$. Exactly orthogonal — try dragging $v_2$ below and the check always lands on $0$.

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
