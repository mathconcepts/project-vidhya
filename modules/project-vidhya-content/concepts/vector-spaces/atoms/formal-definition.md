---
id: vector-spaces.formal-definition
concept_id: vector-spaces
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Vector space**: a set $V$ over a field $\mathbb{F}$ satisfying closure under addition and scalar multiplication, plus associativity/commutativity of addition, an additive identity $\mathbf{0}$, additive inverses, associativity/distributivity of scalar multiplication, and $1v=v$.

**Subspace**: $W\subseteq V$ is a subspace if $\mathbf{0}\in W$ and, for all $u,v\in W$, $c\in\mathbb{F}$: $u+v\in W$ and $cv\in W$.

**Basis**: $\{\mathbf{v}_1,\ldots,\mathbf{v}_n\}\subseteq V$ is a basis if every $v\in V$ is uniquely $v = c_1\mathbf{v}_1+\cdots+c_n\mathbf{v}_n$.

**Dimension**: $\dim(V)$ is the number of vectors in any basis.

**Method selector.** To decide whether a given $W$ is a subspace, run only the three-test shortcut (zero vector, closed under $+$, closed under scalar $\cdot$) — never re-verify all 8 vector-space axioms for a subset of an already-known space, since associativity, commutativity, and the rest are automatically inherited from $V$. The tempting wrong method is treating "closed under addition" alone as sufficient: a set can pass that test and still fail scalar closure (the first quadrant of $\mathbb{R}^2$ is closed under addition but not under multiplication by $-1$), so both closure tests are required, never just one.
