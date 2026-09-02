---
id: integration-substitution.interleaved-drill
concept_id: integration-substitution
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: integration-substitution.micro-exercise
---

**Cross-concept check: chain rule → u-substitution.**

**Question 1 (chain rule):** Differentiate $h(x)=\sin(x^3)$.

*Answer:* $h'(x)=\cos(x^3)\cdot3x^2$, by the chain rule (outer derivative times inner derivative).

**Question 2 (substitution):** Integrate $\int3x^2\cos(x^3)\,dx$.

*Answer:* Let $u=x^3$, $du=3x^2\,dx$: $\int\cos u\,du=\sin u+C=\sin(x^3)+C$ — the exact antiderivative that Question 1 just differentiated.

**Why this drill exists:** substitution IS the chain rule, read backwards — a student who differentiates $\sin(x^3)$ correctly but freezes when asked to integrate $3x^2\cos(x^3)$ has memorized the two rules as separate procedures instead of recognizing them as the same fact viewed from opposite directions.
