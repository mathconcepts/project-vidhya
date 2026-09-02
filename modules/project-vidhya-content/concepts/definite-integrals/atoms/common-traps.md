---
id: definite-integrals.common_traps
concept_id: definite-integrals
atom_type: common_traps
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: definite-integrals.micro-exercise
---

**Trap 1 — Forgetting to change the limits after a substitution.** After setting $u=g(x)$, the bounds must become $g(a)$ and $g(b)$ in $u$ — carrying the original $x$-bounds into the $u$-integral mixes two different number lines and silently gives a wrong value.

**Trap 2 — Treating any symmetric interval as automatically zero.** Odd functions vanish over $[-a,a]$; even ones do not. $\int_{-1}^1 x^2\,dx=\tfrac23$, not $0$ — check oddness before applying the shortcut, never assume it from symmetric-looking bounds alone.

**Trap 3 — Plugging FTC across a hidden interior discontinuity.** If the integrand is undefined anywhere strictly inside $[a,b]$ — not just at an endpoint — the Fundamental Theorem does not apply as written; the interval must be split and each piece checked for convergence first.
