---
id: multiple-integrals.formal_definition
concept_id: multiple-integrals
atom_type: formal_definition
bloom_level: 2
difficulty: 0.5
exam_ids: ["*"]
---

**Fubini's theorem.** For $f$ continuous on a rectangle $R=[a,b]\times[c,d]$,
$$
\iint_R f(x,y)\,dA=\int_a^b\!\!\int_c^d f(x,y)\,dy\,dx=\int_c^d\!\!\int_a^b f(x,y)\,dx\,dy.
$$
For a non-rectangular region, express the inner variable's bounds as functions of the outer variable — e.g. a **Type I** region $a\le x\le b$, $g_1(x)\le y\le g_2(x)$.

**Change of variables (polar).** $dA=r\,dr\,d\theta$, not $dr\,d\theta$ — the extra factor of $r$ is the Jacobian of the polar-to-Cartesian map.

Swap the iteration order freely, on a rectangle, with a continuous integrand — the value is guaranteed to match either way. Switch to polar coordinates when the region or integrand has circular symmetry; the tempting-but-wrong alternative is grinding through the Cartesian double integral over a disk or circular sector, carrying $\sqrt{r^2-x^2}$-type bounds throughout, when the polar substitution (with its Jacobian factor) turns the same computation into a two-line one.
