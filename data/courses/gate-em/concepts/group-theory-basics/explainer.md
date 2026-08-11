# Group Theory Basics
> GATE Engineering Mathematics | Discrete Mathematics | low frequency | difficulty: 0.6

## Intuition First
A group is a set of objects with a "rule" (operation) for combining them that behaves predictably. Think of rotations of a square: you can rotate it 0°, 90°, 180°, or 270°. Rotating twice in a row gives another valid rotation. Groups capture this algebraic structure—they're the language for symmetries, permutations, and systems where "combining things gives another thing of the same type." Understanding groups unlocks deep connections in mathematics and physics.

## Core Definition
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

## What Happens (Worked Example)
**What happens:** Consider the group $(\mathbb{Z}_4, +)$, integers modulo 4 under addition.

Set: $\mathbb{Z}_4 = \{0, 1, 2, 3\}$. Operation: $a + b \pmod{4}$.

**Verify group axioms:**
1. **Closure**: $1 + 2 = 3 \pmod{4}$ ✓; $3 + 2 = 1 \pmod{4}$ ✓ (all sums stay in $\{0,1,2,3\}$).
2. **Associativity**: $(a + b) + c = a + (b + c) \pmod{4}$ (inherited from integer addition) ✓.
3. **Identity**: $0 + a = a + 0 = a$ for all $a$ ✓. Identity is $e = 0$.
4. **Inverses**: $0^{-1} = 0$ (since $0 + 0 = 0$), $1^{-1} = 3$ (since $1 + 3 = 0 \pmod{4}$), $2^{-1} = 2$ (since $2 + 2 = 0 \pmod{4}$), $3^{-1} = 1$ ✓.

**Compute orders of elements**: $\text{ord}(0) = 1$ (since $0 = e$), $\text{ord}(1) = 4$ (since $1+1+1+1 = 0 \pmod{4}$), $\text{ord}(2) = 2$ (since $2+2 = 0 \pmod{4}$), $\text{ord}(3) = 4$ (since $3+3+3+3 = 0 \pmod{4}$).

**Subgroups**: $H_1 = \{0\}$ (trivial), $H_2 = \{0, 2\}$ (order 2), $H_3 = \mathbb{Z}_4$ (order 4). By Lagrange, subgroups have order dividing $|\mathbb{Z}_4| = 4$, so orders $1, 2, 4$ ✓.

**Why it works**: Modular arithmetic respects the group structure—wrapping around at modulus 4 preserves closure and associativity. Every element has an inverse (the additive opposite modulo 4) and a unique identity (0). This algebraic regularity is what makes groups powerful: any abstract object with this structure inherits all theorems proved for groups.

## GATE MA Relevance
> **Why it matters in GATE MA:** Group theory appears sparingly in GATE Engineering Mathematics (1-2% of papers), but when it does, questions are typically straightforward: verify group axioms for a concrete set (integers modulo $n$, permutations, matrix multiplication), compute orders of elements, identify subgroups, or apply Lagrange's theorem. The difficulty is high because students often lack familiarity, but the definitions are elementary. Expect 1 mark per question, with NAT questions asking "What is the order of element $a$ in group $G$?" or "How many subgroups of order $k$ does $G$ have?"
