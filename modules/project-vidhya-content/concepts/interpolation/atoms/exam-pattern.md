---
id: interpolation.exam-pattern
concept_id: interpolation
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions** give a short table of $(x,y)$ pairs and ask for the interpolated value at one specific $x$ inside the table's range — the answer is a single number, graded to a stated tolerance.
- **MCQ questions** often test the *degree* of the required polynomial (three points → degree at most 2) or ask which value cannot legitimately be found by interpolation because it lies outside the node span (extrapolation, not interpolation).
- **A frequent MCQ pattern:** "Given $f(0)=1$, $f(1)=3$, find $f(0.5)$" — a two-point, linear case: $P(0.5)=1(1-0.5)+3(0.5)=2$.
- **A frequent conceptual pattern:** asking which method — Lagrange or Newton divided-difference — is cheaper when one more data point is added to an existing table (Newton, since it only needs one new term).

**Time budget:** a 2–3 point Lagrange evaluation is a 2-minute item if the basis polynomials are set up systematically, one row at a time, rather than expanded algebraically.
