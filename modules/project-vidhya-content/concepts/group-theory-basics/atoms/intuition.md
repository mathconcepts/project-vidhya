---
id: group-theory-basics-intuition
concept_id: group-theory-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Group Theory — Core Intuition

## What is a Group?

A **group** $(G, *)$ is a set $G$ with a binary operation $*$ satisfying four axioms:

| Axiom | Statement | In words |
|---|---|---|
| **Closure** | $\forall a, b \in G: a * b \in G$ | Operating on two group members gives a group member |
| **Associativity** | $(a * b) * c = a * (b * c)$ | Parentheses don't matter |
| **Identity** | $\exists e \in G: a * e = e * a = a$ | There is a "do-nothing" element |
| **Inverse** | $\forall a \in G, \exists a^{-1}: a * a^{-1} = e$ | Every element can be undone |

**Abelian (commutative) group:** additionally $a * b = b * a$ for all $a, b \in G$.

---

## Familiar Examples

| Group | Set | Operation | Identity | Inverse of $a$ |
|---|---|---|---|---|
| $(\mathbb{Z}, +)$ | Integers | Addition | 0 | $-a$ |
| $(\mathbb{Q} \setminus \{0\}, \times)$ | Non-zero rationals | Multiplication | 1 | $1/a$ |
| $(\mathbb{Z}_n, +_n)$ | $\{0,1,\ldots,n-1\}$ | Addition mod $n$ | 0 | $n - a$ |
| $(S_n, \circ)$ | Permutations of $n$ elements | Composition | identity permutation | inverse permutation |

---

## Order of a Group and an Element

- **Order of the group** $|G|$: the number of elements in $G$.
- **Order of an element** $\text{ord}(a)$: the smallest positive integer $k$ such that $a^k = e$.

In $(\mathbb{Z}_6, +)$: $\text{ord}(2) = 3$ because $2 + 2 + 2 = 6 \equiv 0 \pmod{6}$.

---

## Subgroups

A **subgroup** $H$ of $(G, *)$ is a non-empty subset that is itself a group under $*$. Check three things:

1. $e \in H$ (identity is in $H$)
2. $a, b \in H \Rightarrow a * b \in H$ (closed)
3. $a \in H \Rightarrow a^{-1} \in H$ (inverses exist)

**Lagrange's Theorem:** If $H$ is a subgroup of a finite group $G$, then $|H|$ divides $|G|$.

Consequence: the order of any element divides the order of the group.

---

## Cyclic Groups

A group $G$ is **cyclic** if there exists an element $g \in G$ (called a **generator**) such that every element of $G$ can be written as a power of $g$:

$$G = \langle g \rangle = \{e, g, g^2, g^3, \ldots\}$$

$\mathbb{Z}_n = \langle 1 \rangle$ under addition mod $n$.

**Key facts:**
- Every cyclic group is abelian.
- Subgroups of a cyclic group are cyclic.
- $\mathbb{Z}_n$ has exactly one subgroup of order $d$ for each divisor $d$ of $n$.
- The number of generators of $\mathbb{Z}_n$ = $\phi(n)$ (Euler's totient function).

---

## Cosets

For a subgroup $H \leq G$ and any element $a \in G$:

- **Left coset:** $aH = \{a * h : h \in H\}$
- **Right coset:** $Ha = \{h * a : h \in H\}$

Cosets **partition** $G$ into equal-sized pieces, each of size $|H|$.

Number of distinct left cosets $= [G : H] = |G| / |H|$ (the **index** of $H$ in $G$).
