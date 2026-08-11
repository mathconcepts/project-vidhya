# Propositional Logic
> GATE Engineering Mathematics | Discrete Mathematics | medium frequency | difficulty: 0.3

## Intuition First
Think of propositional logic as a system of true/false statements (propositions) connected by logical operators like AND, OR, and NOT. Just like you combine conditions in an if-statement ("if it's raining AND I'm late, then take the bus"), propositional logic combines propositions to build complex logical arguments that are either always true, always false, or depend on the truth values of their parts.

## Core Definition
**Propositional Logic**: A proposition is a declarative statement that is either true or false, but not both. The fundamental logical operators are:
- **Negation** ($\neg p$): "not $p$" — flips the truth value
- **Conjunction** ($p \land q$): "$p$ AND $q$" — true only when both are true
- **Disjunction** ($p \lor q$): "$p$ OR $q$" — true when at least one is true
- **Implication** ($p \rightarrow q$): "if $p$ then $q$" — false only when $p$ is true and $q$ is false
- **Biconditional** ($p \leftrightarrow q$): "$p$ if and only if $q$" — true when both have the same truth value

**Tautology**: A formula that is always true regardless of the truth values of its variables.

## What Happens (Worked Example)
**What happens:** Consider the propositions $p$: "2 is even" (TRUE), $q$: "3 is even" (FALSE), $r$: "5 is odd" (TRUE).

Evaluate: $(p \land r) \lor \neg q$

| Step | Computation | Result |
|---|---|---|
| 1 | Evaluate $p \land r$ | TRUE $\land$ TRUE = TRUE |
| 2 | Evaluate $\neg q$ | $\neg$FALSE = TRUE |
| 3 | Evaluate $(p \land r) \lor \neg q$ | TRUE $\lor$ TRUE = TRUE |

**Truth Table for the formula:**
$$\begin{array}{ccc|c}
p & q & r & (p \land r) \lor \neg q \\
\hline
T & T & T & T \\
T & F & T & T \\
T & T & F & F \\
T & F & F & T \\
F & T & T & F \\
F & F & T & T \\
F & T & F & F \\
F & F & F & T \\
\end{array}$$

**Why it works:** Each row systematically evaluates all possible truth combinations. The conjunction $(p \land r)$ requires both $p$ and $r$ to be true; the disjunction then makes the entire expression true if either branch ($(p \land r)$ or $\neg q$) is true. This geometric interpretation: the formula partitions the 8-dimensional truth space into 5 regions where it holds true.

## GATE MA Relevance
> **Why it matters in GATE MA:** Propositional logic appears in 2-4% of GATE papers, typically as MCQ problems requiring truth table construction, tautology verification, or logical equivalence checking. Common traps: confusing the implication truth table ($p \rightarrow q$ is NOT the same as $\neg p \lor q$ to beginners) and recognizing De Morgan's laws under disguise. Usually worth 1-2 marks per question.
