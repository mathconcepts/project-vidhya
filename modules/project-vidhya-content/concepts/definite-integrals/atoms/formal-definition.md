---
id: definite-integrals.formal_definition
concept_id: definite-integrals
atom_type: formal_definition
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
---

**Fundamental Theorem of Calculus (Part 2).** If $f$ is continuous on $[a,b]$ and $F$ is any antiderivative of $f$, then
$$
\int_a^b f(x)\,dx = F(b)-F(a).
$$

**Properties.** $\int_a^b [cf+g]\,dx=c\int_a^b f\,dx+\int_a^b g\,dx$ (linearity); $\int_a^c f\,dx+\int_c^b f\,dx=\int_a^b f\,dx$ for any $c$ (additivity); $\int_a^b f\,dx=-\int_b^a f\,dx$ (orientation); and over a symmetric interval, $\int_{-a}^{a} f\,dx=2\int_0^a f\,dx$ if $f$ is **even**, $0$ if $f$ is **odd**.

Apply the theorem directly when $f$ is continuous across the whole closed interval, endpoints included. If $f$ blows up or is undefined at a point inside $[a,b]$ — say $f(x)=1/x^2$ with $0\in[a,b]$ — plugging the antiderivative straight into both endpoints anyway is the tempting shortcut that silently produces a wrong finite number; that interval needs the limiting process of an improper integral instead, not this theorem as written.
