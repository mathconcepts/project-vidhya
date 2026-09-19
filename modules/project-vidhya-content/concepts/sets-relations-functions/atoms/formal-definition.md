---
id: sets-relations-functions.formal-definition
concept_id: sets-relations-functions
atom_type: formal_definition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

**Set**: a well-defined collection of distinct objects, e.g. $A = \{1,2,3\}$.

**Union $A \cup B$**: everything in $A$, in $B$, or in both.

**Intersection $A \cap B$**: only what is in both $A$ and $B$.

**Difference $A - B$**: what is in $A$ but not in $B$.

**Complement $A'$**: everything in the universal set that is not in $A$.

**Relation from $A$ to $B$**: any subset of $A \times B$ — any collection of ordered pairs $(a,b)$ with $a \in A$, $b \in B$.

**Reflexive**: $(a,a) \in R$ for every $a$ in the set.

**Symmetric**: $(a,b) \in R \Rightarrow (b,a) \in R$.

**Transitive**: $(a,b) \in R$ and $(b,c) \in R \Rightarrow (a,c) \in R$.

**Equivalence relation**: reflexive, symmetric, and transitive — all three, together.

**Function (mapping) $f: A \to B$**: a relation in which every element of $A$ appears as the first entry of exactly one ordered pair.

**Domain**: the set $A$. **Codomain**: the set $B$. **Range**: the actual set of outputs, $\{f(a) : a \in A\} \subseteq B$.

**One-one (injective)**: $f(x_1) = f(x_2) \Rightarrow x_1 = x_2$ — distinct inputs give distinct outputs.

**Onto (surjective)**: range $=$ codomain — every element of $B$ is hit.

**Bijective**: one-one and onto together.

**Composition $(f \circ g)(x) = f(g(x))$**: defined only for $x$ in the domain of $g$ such that $g(x)$ lies in the domain of $f$.

**Inverse function $f^{-1}$**: exists if and only if $f$ is bijective, and satisfies $f^{-1}(f(x)) = x$ for every $x$ in the domain of $f$.
