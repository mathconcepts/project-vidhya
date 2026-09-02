---
id: continuity.exam_pattern
concept_id: continuity
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions** commonly give a piecewise function and ask for the constant that makes it continuous at the join point — set the left-hand piece's value equal to the right-hand piece's value at that point and solve. Example: $f(x)=x^2$ for $x<1$, $f(x)=kx$ for $x\ge1$; continuity at $x=1$ needs $1=k$, so $k=1$.
- **MCQ/MSQ classification questions** hand you a function with an obvious algebraic red flag (a denominator that vanishes, a piecewise join) and ask you to name the discontinuity type — removable, jump, or infinite — rather than just say "discontinuous."
- **IVT existence questions** (MSQ "which function must have a root in $[a,b]$") test whether you can apply the theorem from a sign change alone, without needing to find the root — computing an explicit root when only existence was asked wastes time the question never priced in.
- **Time budget:** a continuity-at-a-point check with an explicit formula is a two-line computation — under a minute. A piecewise constant-finding question is comparably fast once both one-sided expressions are written down; the setup, not the algebra, is where time is lost.
