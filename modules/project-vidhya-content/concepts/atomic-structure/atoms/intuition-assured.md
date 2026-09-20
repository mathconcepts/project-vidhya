---
id: atomic-structure.intuition-assured
concept_id: atomic-structure
atom_type: intuition
variant_of: atomic-structure.intuition
for_stance: assured
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

$l$ ranges from $0$ to $n-1$ — necessary, and it is easy to over-trust as if it were the whole story. For $n=3$: $l$ can be $0, 1, 2$ ($3s, 3p, 3d$), so the maximum orbitals in that shell are $1+3+5=9$ (one $s$, three $p$, five $d$), holding at most $2 \times 9 = 18$ electrons — but a real atom's $3d$ subshell is *higher energy* than $4s$, so $4s$ fills first (Aufbau's actual energy-order rule, not a strict shell-by-shell fill). Writing $3d$ before $4s$ from "$n=3$ comes before $n=4$" reasoning alone is a real, common error.

A second precise distinction: $(n,l)$ being individually valid (each within its own allowed range) does not make the *pair* automatically valid together — $(2,2)$ has a valid $n$ and a valid $l$ in isolation, but $l$ must satisfy $l \le n-1$, and $2 \le 2-1$ is false. Both conditions must be checked jointly, on the same pair, not separately.
