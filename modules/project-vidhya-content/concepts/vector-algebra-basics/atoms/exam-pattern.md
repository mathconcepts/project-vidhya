---
id: vector-algebra-basics.exam_pattern
concept_id: vector-algebra-basics
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions asking for "the area of the triangle" want a single number from a half cross-product**, built from two edge vectors formed at one shared vertex — not the full parallelogram area, and not a vector.

  Example: for $A=(1,2,0)$, $B=(3,1,0)$, $C=(2,4,0)$: $\overrightarrow{AB}=(2,-1,0)$, $\overrightarrow{AC}=(1,2,0)$, $\overrightarrow{AB}\times\overrightarrow{AC}=(0,0,5)$, so the triangle's area is $\tfrac12|5|=2.5$ — half the parallelogram, exactly as the formula requires.

- **MCQ "coplanar" questions test the scalar triple product being zero**, not any dot- or cross-product fact alone — three vectors can be pairwise non-perpendicular and non-parallel and still be coplanar.

- **MSQ stems mix true and false vector-algebra facts on purpose**: "$\vec a\times\vec b=\vec b\times\vec a$" (false — anti-commutative) sits beside "$\vec a\cdot\vec b=\vec b\cdot\vec a$" (true — commutative) specifically to catch a rule applied to the wrong product.

- **Time budget:** once $\overrightarrow{AB}$ and $\overrightarrow{AC}$ are formed correctly, the cross product and half-magnitude should resolve in under 60 seconds — most of the time lost on this question type goes into forming the edge vectors, not computing the product.
