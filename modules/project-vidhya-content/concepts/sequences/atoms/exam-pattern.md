---
id: sequences.exam_pattern
concept_id: sequences
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions** typically hand you an explicit or recursive formula for $a_n$ and ask for the numeric limit — the answer is a number, not a proof. Example: $a_n=\dfrac{5n-1}{2n+3}\to\dfrac{5}{2}$ (divide numerator and denominator by $n$); the working is one line, so don't over-invest in setting up an $\epsilon$–$N$ argument for a question that only wants the value.
- **MCQ/MSQ "which statement is true" questions** target the boundary cases directly: "every bounded sequence converges" (false — $(-1)^n$), "every convergent sequence is bounded" (true — convergence forces boundedness), "every monotonic sequence converges" (false — $a_n=n$).
- **Recursive-sequence questions** ($a_{n+1}=f(a_n)$, find $\lim a_n$) reward checking monotonicity/boundedness first, then solving $L=f(L)$ — solving the fixed-point equation alone, without that check, can hand back a root the sequence never actually approaches.
- **Time budget:** a direct-formula limit question should take under a minute — it is algebra, not analysis. A recursive-sequence question earns its extra two minutes only because of the boundedness/monotonicity check, not extra computation.
