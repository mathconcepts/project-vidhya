---
id: lu-factorization.intuition
concept_id: lu-factorization
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

Think of solving $Ax=b$ as a two-stage delivery. Stage one, $L$, records the row operations elimination performed to clear everything below the diagonal — every multiplier you used, kept instead of thrown away. Stage two, $U$, is the simplified triangular system those operations leave behind. Multiply the stages back together and you recover the original matrix exactly: $LU=A$.

The payoff is that solving becomes two cheap passes instead of one expensive one. Forward through $L$ (row 1 down to $n$) recovers an intermediate vector $y$ from $Ly=b$; backward through $U$ (row $n$ up to 1) turns $y$ into $x$ from $Ux=y$. Neither pass ever needs to touch $A$ again once $L$ and $U$ exist — drag the entries below and watch both factors update together.

```interactive-spec
{"v":1,"kind":"manipulable","title":"Drag A's entries and watch L, U update","inputs":[{"id":"a","label":"a (top-left)","min":1,"max":8,"step":1,"initial":4},{"id":"b","label":"b (top-right)","min":0,"max":8,"step":1,"initial":3},{"id":"c","label":"c (bottom-left)","min":0,"max":8,"step":1,"initial":6},{"id":"d","label":"d (bottom-right)","min":0,"max":8,"step":1,"initial":5}],"outputs":[{"label":"u11 = a","formula":"a","digits":2},{"label":"u12 = b","formula":"b","digits":2},{"label":"l21 = c / a","formula":"c/a","digits":2},{"label":"u22 = d - l21*b","formula":"d-(c/a)*b","digits":2}],"caption":"a is kept at 1 or above on these sliders, so the first pivot never hits zero. Drag c up relative to a and watch l21 grow — a real pivot-zero would force PA = LU instead, which these sliders are built to avoid."}
```
