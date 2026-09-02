---
id: taylor-laurent.interleaved-drill
concept_id: taylor-laurent
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
tested_by_atom: taylor-laurent.micro-exercise
---

**Cross-concept check: taylor-laurent → residue-calculus.**

**Question 1 (taylor-laurent):** $f(z)=\dfrac1{(z-1)^2}$ has a pole of order $2$ at $z=1$ — its Laurent series there is exactly $(z-1)^{-2}$, nothing else. What is the residue, i.e. the coefficient of $(z-1)^{-1}$?

*Answer:* There is no $(z-1)^{-1}$ term in the expansion at all, so the coefficient — the residue — is $0$.

**Question 2 (residue-calculus):** Contrast with $g(z)=\dfrac{e^z}{z^2}$ at $z=0$, also a pole of order $2$. Is its residue also $0$?

*Answer:* No — expanding $e^z=1+z+\frac{z^2}2+\cdots$ and dividing by $z^2$ gives $\frac1{z^2}+\frac1z+\frac12+\cdots$; the coefficient of $z^{-1}$ is $1$. Residue $=1$, not $0$.

**Why this drill exists:** a common false belief is "a pole of order $\geq1$ always has a nonzero residue." This pair is a direct counterexample: same pole order, one residue is $0$ and the other isn't — the order tells you how many terms *could* be nonzero, never whether the specific one at $(z-z_0)^{-1}$ actually is.
