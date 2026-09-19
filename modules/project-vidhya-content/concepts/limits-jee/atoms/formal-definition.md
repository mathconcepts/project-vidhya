---
id: limits-jee.formal-definition
concept_id: limits-jee
atom_type: formal_definition
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

**Limit at a point**: $\lim_{x\to a} f(x) = L$ means $f(x)$ can be made as close to $L$ as required by taking $x$ sufficiently close to $a$ (but not equal to $a$). The limit exists only if the left-hand limit and the right-hand limit both equal $L$.

**Indeterminate forms**: $\frac{0}{0}$, $\frac{\infty}{\infty}$, $0\cdot\infty$, $\infty-\infty$, $1^{\infty}$, $0^{0}$, $\infty^{0}$. None of these can be evaluated by direct substitution — each needs to be rewritten (algebra, a standard limit, or L'Hôpital's rule) before it resolves.

**L'Hôpital's rule**: if $\lim_{x\to a}\frac{f(x)}{g(x)}$ is of the form $\frac{0}{0}$ or $\frac{\infty}{\infty}$, and $\lim_{x\to a}\frac{f'(x)}{g'(x)}$ exists, then $\lim_{x\to a}\frac{f(x)}{g(x)} = \lim_{x\to a}\frac{f'(x)}{g'(x)}$. It may be applied repeatedly as long as the form stays indeterminate at each stage.

**Standard limits (all as $x\to0$, memorised, never re-derived under exam pressure)**:

$$\lim_{x\to0}\frac{\sin x}{x}=1,\quad \lim_{x\to0}\frac{\tan x}{x}=1,\quad \lim_{x\to0}\frac{1-\cos x}{x^2}=\frac12,\quad \lim_{x\to0}\frac{e^x-1}{x}=1,\quad \lim_{x\to0}\frac{\ln(1+x)}{x}=1,\quad \lim_{x\to0}\frac{a^x-1}{x}=\ln a,\quad \lim_{x\to0}(1+x)^{1/x}=e$$

**Scaled versions**: $\lim_{x\to0}\frac{\sin(kx)}{x}=k$ and $\lim_{x\to0}\frac{e^{kx}-1}{x}=k$ for any constant $k\neq0$ — the standard limit still applies, only after the argument and the denominator are made to match exactly.
