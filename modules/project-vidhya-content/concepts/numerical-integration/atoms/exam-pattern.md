---
id: numerical-integration.exam-pattern
concept_id: numerical-integration
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions** typically name a rule (trapezoidal or Simpson's), an $n$, and an integral, then ask for the numeric estimate to a stated number of decimal places.
- **MCQ questions** often compare two rules on the same data — "which of the following is the trapezoidal estimate?" alongside a Simpson's-rule distractor built from the same table, testing whether you apply the right weight pattern to the right rule.
- **A frequent MCQ pattern:** "Using Simpson's 1/3 rule with $n=2$ on $\int_0^2\frac{dx}{1+x}$" — worked exactly as $h=1$, nodes $0,1,2$, $I\approx\frac{1}{3}[1+4(0.5)+0.3333]\approx1.111$.
- **A frequent conceptual pattern:** a question states $n$ is odd and asks which rule fails structurally — Simpson's 1/3 (needs $n$ even), not the trapezoidal rule (works for any $n$).

**Time budget:** a single-rule NAT estimate with $n\le4$ is a 2–3 minute item if the node table is written out before any arithmetic begins.
