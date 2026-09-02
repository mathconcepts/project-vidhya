---
id: limits.formal_definition
concept_id: limits
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Limit of a function.** Let $f$ be defined in a neighborhood of $a$ (except possibly at $a$ itself). $\lim_{x\to a}f(x)=L$ if for every $\epsilon>0$ there exists $\delta>0$ such that $|f(x)-L|<\epsilon$ whenever $0<|x-a|<\delta$.

**One-sided limits:** $\lim_{x\to a^+}f(x)$ (from the right) and $\lim_{x\to a^-}f(x)$ (from the left). The two-sided limit exists **iff** both one-sided limits exist and are equal.

**L'Hôpital's Rule:** if $\lim_{x\to a}f(x)/g(x)$ is $\frac00$ or $\frac{\infty}{\infty}$, and $f,g$ are differentiable near $a$, then $\lim_{x\to a}\dfrac{f(x)}{g(x)}=\lim_{x\to a}\dfrac{f'(x)}{g'(x)}$, provided the right-hand limit exists.

**Method selector:** reach for L'Hôpital's rule when substitution gives $\frac00$ or $\frac{\infty}{\infty}$ **and** the pieces are easy to differentiate — not algebraic factoring, which some students try from habit even when there is no common factor to cancel (e.g. $\frac{1-\cos x}{x^2}$ has nothing to factor). Re-check the form after every application: it can still be $\frac00$, and applying the rule to an already-resolved limit silently produces the wrong answer.
