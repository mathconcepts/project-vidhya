---
id: interpolation.formal-definition
concept_id: interpolation
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Lagrange interpolation.** Given $n+1$ distinct points $(x_0,y_0),\dots,(x_n,y_n)$, the unique polynomial $P_n(x)$ of degree at most $n$ with $P_n(x_i)=y_i$ is

$$P_n(x)=\sum_{i=0}^n y_i L_i(x),\qquad L_i(x)=\prod_{j\neq i}\frac{x-x_j}{x_i-x_j}$$

Each $L_i$ equals $1$ at $x_i$ and $0$ at every other node.

**Method Selector.** Use Newton's divided-difference form when nodes may be added incrementally — each new point costs one more term, reusing every earlier computation — not the Lagrange form, which is more elegant to write down but must be rebuilt entirely from scratch the moment a single node changes, wasting all prior work.
