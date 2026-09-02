---
id: conformal-mapping.exam-pattern
concept_id: conformal-mapping
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions want the magnification factor** $|f'(z_0)|$ at a named point, or the location of a critical point where $f'(z_0)=0$ — a single number, not a full proof of conformality.

  Example: magnification of $f(z)=z^3$ at $z=1+i$. $f'(z)=3z^2$, $f'(1+i)=3(2i)=6i$, so $|f'(1+i)|=6$ — read off in one substitution.

- **MCQ "where does this map fail to be conformal" questions** test solving $f'(z)=0$ explicitly, then checking whether that root is also excluded from the domain for another reason (like a pole).

- **MSQ "which of the following statements about conformal maps are true"** tests the local/global distinction: preserves angles locally always, but can (and often does) distort global shapes; is not the same claim as "preserves all distances" or "preserves area."

- **Time budget:** identifying analyticity and solving $f'(z)=0$ for a rational or polynomial map should cost under 90 seconds — it's ordinary differentiation and factoring, not new machinery.
