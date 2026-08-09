# Boolean Algebra
> GATE Engineering Mathematics | Discrete Mathematics | medium frequency | difficulty: 0.4

## Intuition First
Boolean algebra is the mathematics of true/false (1/0) logic, used in every digital circuit and computer program. Think of a light switch: it's either ON (1) or OFF (0). When you combine switches with logic operators (AND, OR, NOT), you're doing Boolean algebra. Engineers use it to simplify digital circuit designs and programmers use it to optimize conditional statements. It's the foundation of how computers work at the hardware level.

## Core Definition
**Boolean Algebra**: An algebraic structure with:
- **Variables**: Take values in $\{0, 1\}$ (FALSE/TRUE).
- **Operations**:
  - **AND** ($\land$ or $\cdot$): $x \land y = 1$ iff $x=1$ AND $y=1$
  - **OR** ($\lor$ or $+$): $x \lor y = 1$ iff $x=1$ OR $y=1$
  - **NOT** ($\neg$ or $\bar{x}$): $\neg x = 1$ iff $x=0$

**Key Laws** (all Boolean algebras satisfy these):
- **Idempotence**: $x \lor x = x$, $x \land x = x$
- **Commutativity**: $x \lor y = y \lor x$, $x \land y = y \land x$
- **Associativity**: $(x \lor y) \lor z = x \lor (y \lor z)$, similarly for AND
- **Absorption**: $x \lor (x \land y) = x$, $x \land (x \lor y) = x$
- **De Morgan's Laws**: $\neg(x \land y) = \neg x \lor \neg y$, $\neg(x \lor y) = \neg x \land \neg y$
- **Distributivity**: $x \land (y \lor z) = (x \land y) \lor (x \land z)$, $x \lor (y \land z) = (x \lor y) \land (x \lor z)$
- **Complement**: $x \lor \neg x = 1$ (tautology), $x \land \neg x = 0$ (contradiction)

## What Happens (Worked Example)
**What happens:** Simplify the Boolean expression $F = xy + x\bar{y}z + \bar{x}z$ (using $+$ for OR and $\cdot$ for AND).

**Step 1: Factor out $x$ from the first two terms.**
$$F = xy + x\bar{y}z + \bar{x}z = x(y + \bar{y}z) + \bar{x}z$$

**Step 2: Apply absorption/distribution to $y + \bar{y}z$.**
$$y + \bar{y}z = (y + \bar{y})(y + z) = 1 \cdot (y + z) = y + z$$
(Use distributivity: $A + BC = (A+B)(A+C)$ reversed, or note that $y + \bar{y}z = y(1 + z) + \bar{y}z = y + \bar{y}z$, then apply consensus: $A + \bar{A}B = A + B$ when factoring.)

Actually, simpler: $y + \bar{y}z$. If $y=1$, the expression is 1. If $y=0$, then $\bar{y}=1$, so $\bar{y}z = z$. Thus $y + \bar{y}z = y + z$ (consensus theorem).

**Step 3: Substitute back.**
$$F = x(y+z) + \bar{x}z = xy + xz + \bar{x}z$$

**Step 4: Simplify $xz + \bar{x}z$.**
$$xz + \bar{x}z = z(x + \bar{x}) = z \cdot 1 = z$$

**Step 5: Final form.**
$$F = xy + z$$

**Verification via truth table** (only showing rows where $F=1$):
- $x=1, y=1$: $xy=1$ → $F=1$ ✓
- $z=1$: (any $x, y$) → $F=1$ ✓

**Why it works**: Each simplification step uses Boolean laws to remove redundant terms. The factoring and consensus theorems leverage the complement law ($x + \bar{x} = 1$) and the fact that "garbage" terms (like $\bar{y}z$ when $y$ is forced true) don't affect the output. Geometrically, we're eliminating dimensions in the truth-table hyperplane—fewer variables means smaller circuit implementations.

## GATE MA Relevance
> **Why it matters in GATE MA:** Boolean algebra appears in 2-4% of GATE Engineering Mathematics papers (more heavily in Digital Logic/Electronics). Questions typically involve: simplifying expressions using laws and theorems (especially De Morgan's, absorption, consensus), converting between SOP (sum-of-products) and POS (product-of-sums) forms, finding minimal Boolean expressions, and verifying algebraic identities. Common trap: students write $x + xy = x$ correctly but forget duals like $x(x + y) = x$. Usually 1-2 marks per question, mixing quick law recognition with systematic simplification.
