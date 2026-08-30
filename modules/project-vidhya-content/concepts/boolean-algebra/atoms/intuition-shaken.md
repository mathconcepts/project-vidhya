---
# Alternative body for boolean-algebra.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: boolean-algebra.intuition.shaken
concept_id: boolean-algebra
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["gate-ma"]
scaffold_fade: 0
variant_of: boolean-algebra-intuition
for_stance: shaken
---

Try every input pair for $A \cdot B$: $0\cdot 0=0$, $0\cdot 1=0$, $1\cdot 0=0$, $1\cdot 1=1$ — only the last pair produces $1$. Do the same for $A+B$: three of the four pairs give $1$, and only $0+0=0$ fails. Complement pairs work the same way with actual digits: $1+1'=1+0=1$, and $1\cdot 1'=1\cdot 0=0$, which holds for either value of $A$, not just $1$. De Morgan's swaps AND for OR under a bar — check it on numbers: $(1\cdot 0)'=0'=1$, and $1'+0'=0+1=1$, the same answer both ways.

A Karnaugh map lays those four output values out on a grid so the equal ones sit next to each other. Number the cells $0,1,2,3$ for the four $(A,B)$ settings:

```
      B'   B
  A' | 0 | 1 |
  A  | 2 | 3 |
```

Group the cells holding a $1$: if cells $1$ and $3$ both hold $1$, that group spans every value of $A$ while $B$ stays fixed at $1$ — the label is just $B$, since $A$ changed across the group and gets dropped.

The same grid scales to four variables. Every cell number below still traces to an $(A,B,C,D)$ setting, and adjacent cells still differ in exactly one variable — that is what lets a group erase it:

```
       CD:  00  01  11  10
  AB: 00  |  0 |  1 |  3 |  2 |
      01  |  4 |  5 |  7 |  6 |
      11  | 12 | 13 | 15 | 14 |
      10  |  8 |  9 | 11 | 10 |
```

A group of two cells drops one variable, a group of four drops two, a group of eight drops three — always a power of two, because that many settings share the dropped variables' values. A Karnaugh map is nothing but the truth table redrawn so that "differs in one input" becomes "sits next door."
