---
# Alternative body for lu-factorization.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# The fenced interactive block below is copied verbatim from the base atom
# so the widget cannot drift between variants; only prose differs.
id: lu-factorization.intuition.assured
concept_id: lu-factorization
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: lu-factorization.intuition
for_stance: assured
---

$A=LU$ is a factorization, not a new operation — $L$ carries the elimination multipliers, $U$ is the row-echelon result. The payoff is amortized cost: factor once at $O(n^3)$, then every right-hand side costs two $O(n^2)$ triangular solves instead of full elimination repeated from scratch. The distinction that costs marks: this holds for Doolittle ($L$ unit-diagonal) and Crout ($U$ unit-diagonal) alike, but they give genuinely *different* numeric $L,U$ for the same $A$ — stating the wrong convention on a GATE answer loses the mark even with correct arithmetic underneath.

```interactive-spec
{"v":1,"kind":"manipulable","title":"Drag A's entries and watch L, U update","inputs":[{"id":"a","label":"a (top-left)","min":1,"max":8,"step":1,"initial":4},{"id":"b","label":"b (top-right)","min":0,"max":8,"step":1,"initial":3},{"id":"c","label":"c (bottom-left)","min":0,"max":8,"step":1,"initial":6},{"id":"d","label":"d (bottom-right)","min":0,"max":8,"step":1,"initial":5}],"outputs":[{"label":"u11 = a","formula":"a","digits":2},{"label":"u12 = b","formula":"b","digits":2},{"label":"l21 = c / a","formula":"c/a","digits":2},{"label":"u22 = d - l21*b","formula":"d-(c/a)*b","digits":2}],"caption":"a is kept at 1 or above on these sliders, so the first pivot never hits zero. Drag c up relative to a and watch l21 grow — a real pivot-zero would force PA = LU instead, which these sliders are built to avoid."}
```
