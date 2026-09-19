---
id: sets-relations-functions.common-traps
concept_id: sets-relations-functions
atom_type: common_traps
bloom_level: 4
difficulty: 0.35
exam_ids: ["*"]
---

- **Assuming every relation is a function**: a relation only becomes a function when every input has *exactly one* output. $y^2 = x$ gives $y = \pm\sqrt{x}$ for $x > 0$ — two outputs for one input — so it is a relation, not a function of $x$, until it is split into two separate branches.

- **Confusing range with codomain**: the codomain is the set you *declared* as the target; the range is only the part actually hit. Assuming a function is onto just because its codomain "looks small enough" skips the step of actually finding the range and comparing.

- **Composing without checking the domain**: $(f \circ g)(x) = f(g(x))$ needs $g(x)$ to land inside $f$'s own domain, not just any real number. Writing out the formula for $f(g(x))$ correctly but forgetting this extra restriction is the most common way marks are lost on composition.

- **Reflexive plus symmetric is not automatically equivalence**: transitivity must be checked separately every time. A relation can satisfy the first two and still fail the third — always verify all three, never assume the third follows.

- **Believing every function has an inverse**: an inverse function exists only when $f$ is bijective. A many-one function (like $f(x) = x^2$ on all of $\mathbb{R}$) has no true inverse until its domain is restricted to make it one-one first.
