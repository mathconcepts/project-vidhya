---
id: group-theory-basics.formal-definition
concept_id: group-theory-basics
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**Group**: A set $G$ with a binary operation $\cdot: G \times G \to G$ satisfying:
1. **Closure**: For all $a, b \in G$, $a \cdot b \in G$.
2. **Associativity**: $(a \cdot b) \cdot c = a \cdot (b \cdot c)$ for all $a, b, c \in G$.
3. **Identity element**: There exists $e \in G$ such that $a \cdot e = e \cdot a = a$ for all $a \in G$.
4. **Inverse element**: For each $a \in G$, there exists $a^{-1} \in G$ such that $a \cdot a^{-1} = a^{-1} \cdot a = e$.

**Special properties**:
- **Abelian (Commutative) group**: $a \cdot b = b \cdot a$ for all $a, b \in G$.
- **Order of group**: The cardinality $|G|$ (number of elements).
- **Order of element**: The smallest positive integer $n$ such that $a^n = e$. (Denoted $\text{ord}(a)$.)
- **Subgroup**: A subset $H \subseteq G$ that forms a group under the same operation.
- **Lagrange's Theorem**: If $H$ is a subgroup of finite group $G$, then $|H|$ divides $|G|$.

**Method selector — verifying a group vs. a subgroup**: when checking a fresh set from scratch, verify all four axioms directly. When checking whether a subset $H$ of an already-established group $G$ is a subgroup, use the one-step test instead — $H$ is a subgroup iff $H \neq \emptyset$ and $a \cdot b^{-1} \in H$ for all $a, b \in H$ — since associativity is inherited automatically from $G$. Re-deriving all four axioms for a subset of a known group is the tempting-but-wrong alternative: it is not incorrect, but it spends time re-proving associativity (already guaranteed) and, in practice, more often skips checking the inverse than the compact test does.
