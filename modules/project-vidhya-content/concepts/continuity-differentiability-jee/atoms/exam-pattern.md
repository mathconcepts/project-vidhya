---
id: continuity-differentiability-jee.exam-pattern
concept_id: continuity-differentiability-jee
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
modality: text
---

**How JEE Main actually asks this.**

- **NAT questions ask for $\dfrac{dy}{dx}$ at a specific point** — differentiate implicitly or parametrically, then substitute the given point's coordinates directly into the resulting expression, rather than solving for $y$ explicitly first (which is often impossible anyway).

- **MCQ "find the point(s) of non-differentiability" questions test corner-spotting, not computation.** Functions built from $|\cdot|$, $[\cdot]$ (greatest integer), or piecewise definitions are the standard setup — the answer is usually where two pieces meet, found by comparing left-hand and right-hand derivatives rather than differentiating a single unified formula.

- **Trap: domain-restricted inverse-trig derivatives applied blindly.** A problem gives $x$ in a range that straddles the boundary where a $\sin^{-1}(\sin(\cdot))$ or $\tan^{-1}(\tan(\cdot))$-style simplification changes form — the "obvious" closed-form derivative is correct on one side and sign-flipped on the other.

- **Time budget:** implicit differentiation of a JEE-standard equation, followed by substituting a given point, should take under 60 seconds. Spending time trying to solve for $y$ explicitly before differentiating is almost always the wrong first move — differentiate first, solve for $\dfrac{dy}{dx}$ second.
