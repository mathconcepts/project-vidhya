---
id: continuity.formal_definition
concept_id: continuity
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Continuity at a point.** $f$ is **continuous** at $x=a$ if all three hold: (1) $f(a)$ is defined, (2) $\lim_{x\to a}f(x)$ exists, (3) $\lim_{x\to a}f(x)=f(a)$. $f$ is continuous **on an interval** if it is continuous at every point of that interval.

**Intermediate Value Theorem (IVT).** If $f$ is continuous on $[a,b]$ and $k$ lies between $f(a)$ and $f(b)$, then $f(c)=k$ for some $c\in[a,b]$.

**Method selector:** reach for the IVT when a question only asks whether a root or a specific value is *attained* somewhere on an interval — not for numerical root-solving methods (Newton–Raphson, bisection by hand), which some students reach for even when the question never asks for the root's actual location. The IVT proves **existence** in one line from a sign change; it never identifies where.
