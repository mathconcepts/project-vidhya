---
# Alternative body for counting-principles.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: counting-principles.intuition.shaken
concept_id: counting-principles
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: counting-principles.intuition
for_stance: shaken
---

## Arrange three letters, by hand

A, B, C: write out every order — ABC, ACB, BAC, BCA, CAB, CBA. That's 6, and $3!=3\times2\times1=6$ matches exactly. For $n$ distinct objects placed into $r$ of $n$ slots, that same count generalizes to $P(n,r)=\dfrac{n!}{(n-r)!}$.

## Now group the same three, without order

$\{A,B\}$, $\{A,C\}$, $\{B,C\}$ — 3 groups, not 6, because $\{A,B\}$ and $\{B,A\}$ are the same group. Order removed a factor of $2!$ from the 6 arrangements: $C(n,r)=\dfrac{n!}{r!(n-r)!}$ divides out every internal reordering of the chosen $r$.

## Pigeonhole, concretely

Put 4 letters into 3 boxes, one letter per box at most — impossible, since 4 items need 4 boxes' worth of room. One box must hold 2. That's the whole principle: $n+1$ objects, $n$ boxes, guaranteed repeat.

## Which to use

Order changes the outcome → permutation. Order doesn't → combination. Neither → check whether pigeonhole even applies before counting anything at all.
