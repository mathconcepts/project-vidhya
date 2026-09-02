---
# Alternative body for lu-factorization.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# The fenced interactive block below is copied verbatim from the base atom
# so the widget cannot drift between variants; only prose differs.
id: lu-factorization.intuition.shaken
concept_id: lu-factorization
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: lu-factorization.intuition
for_stance: shaken
---

Picture solving $Ax=b$ in two stages. $L$ records the row operations that cleared everything below the diagonal. $U$ is what's left after clearing — a triangular system. Multiply $L$ and $U$ back together and you must recover $A$ exactly: $LU=A$.

Once both are known, a new $b$ takes two easy passes: forward through $L$ gives $y$ from $Ly=b$, then backward through $U$ gives $x$ from $Ux=y$. Neither pass touches $A$ again. Drag the sliders below and watch $L$ and $U$ update together as $A$'s entries change.

```interactive-spec
{"v":1,"kind":"manipulable","title":"Drag A's entries and watch L, U update","inputs":[{"id":"a","label":"a (top-left)","min":1,"max":8,"step":1,"initial":4},{"id":"b","label":"b (top-right)","min":0,"max":8,"step":1,"initial":3},{"id":"c","label":"c (bottom-left)","min":0,"max":8,"step":1,"initial":6},{"id":"d","label":"d (bottom-right)","min":0,"max":8,"step":1,"initial":5}],"outputs":[{"label":"u11 = a","formula":"a","digits":2},{"label":"u12 = b","formula":"b","digits":2},{"label":"l21 = c / a","formula":"c/a","digits":2},{"label":"u22 = d - l21*b","formula":"d-(c/a)*b","digits":2}],"caption":"a is kept at 1 or above on these sliders, so the first pivot never hits zero. Drag c up relative to a and watch l21 grow — a real pivot-zero would force PA = LU instead, which these sliders are built to avoid."}
```
