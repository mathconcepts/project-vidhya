# Sets & Relations
> GATE Engineering Mathematics | Discrete Mathematics | medium frequency | difficulty: 0.3

## Intuition First
A set is simply a collection of distinct objects (called elements), and a relation is a way to connect or pair elements from two sets. Think of it like a friendship network: the set is all people, and the relation is "who is friends with whom"—each person is either linked to another or not. Relations help us describe connections, dependencies, and structures in discrete systems.

## Core Definition
**Set**: A well-defined collection of distinct objects. Notation: $S = \{1, 2, 3\}$ (roster form) or $S = \{x : x \text{ is even and } x < 10\}$ (set-builder).

**Relation**: A subset $R$ of the Cartesian product $A \times B$ (for a relation from set $A$ to set $B$). For sets $A$ and $B$, we write $(a, b) \in R$ if $a$ is related to $b$.

**Properties of Relations** (on a set $A$ to itself):
- **Reflexive**: $(a, a) \in R$ for all $a \in A$.
- **Symmetric**: If $(a, b) \in R$, then $(b, a) \in R$.
- **Antisymmetric**: If $(a, b) \in R$ and $(b, a) \in R$, then $a = b$.
- **Transitive**: If $(a, b) \in R$ and $(b, c) \in R$, then $(a, c) \in R$.

**Equivalence Relation**: A relation that is reflexive, symmetric, and transitive. It partitions the set into equivalence classes.

## What Happens (Worked Example)
**What happens:** Let $A = \{1, 2, 3, 4\}$ and define the relation $R$ by $(a, b) \in R$ if $a \equiv b \pmod{2}$ (i.e., $a$ and $b$ have the same parity).

Compute the relation set:
- $(1, 1)$ ✓ (both odd), $(1, 3)$ ✓ (both odd)
- $(2, 2)$ ✓ (both even), $(2, 4)$ ✓ (both even)
- $(3, 1)$ ✓ (both odd), $(3, 3)$ ✓ (both odd)
- $(4, 2)$ ✓ (both even), $(4, 4)$ ✓ (both even)

So $R = \{(1,1), (1,3), (2,2), (2,4), (3,1), (3,3), (4,2), (4,4)\}$.

**Verify properties**:
- **Reflexive**: $(1,1), (2,2), (3,3), (4,4) \in R$ ✓
- **Symmetric**: $(1,3) \in R$ and $(3,1) \in R$ ✓; $(2,4) \in R$ and $(4,2) \in R$ ✓
- **Transitive**: $(1,3), (3,1) \in R$ implies $(1,1) \in R$ ✓ (verified for all chains)

This relation is an equivalence relation. It partitions $A$ into two equivalence classes: $[1] = \{1, 3\}$ (odd numbers) and $[2] = \{2, 4\}$ (even numbers). Geometrically, equivalence relations group elements into disjoint "equivalence classes" that partition the entire set—this reflects the fundamental partitioning property in discrete structures.

**Why it works**: Reflexivity ensures every element relates to itself. Symmetry ensures if $a$ is like $b$, then $b$ is like $a$. Transitivity ensures the "like" relation chains consistently, guaranteeing that the partition into classes is well-defined and mutually exclusive.

## GATE MA Relevance
> **Why it matters in GATE MA:** Relations and sets appear in 3-5% of GATE papers. Common questions involve verifying properties of relations (reflexivity, symmetry, transitivity), counting relations satisfying specific properties on finite sets, and recognizing equivalence classes. NAT questions often ask: "How many equivalence relations exist on a set of size $n$?" (related to Bell numbers). Pattern: MCQ testing definition recognition + quick property checks, or NAT requiring combinatorial counting of relations with constraints.
