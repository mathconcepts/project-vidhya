---
# Alternative body for vector-spaces-intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# variant_of names the base's literal (unusually hyphenated, not dotted) id
# field — see the concept's atoms/intuition.md front matter.
id: vector-spaces.intuition.shaken
concept_id: vector-spaces
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: vector-spaces-intuition
for_stance: shaken
---

Take $W = \{(x,y,z) : x+y+z=0\}$ in $\mathbb{R}^3$. Is $W$ a vector space on its own — a subspace?

Three checks, in order:

1. Is $(0,0,0)$ in $W$? Yes: $0+0+0=0$.
2. Add two members: $(1,-1,0)+(2,-3,1)=(3,-4,1)$. Check: $3-4+1=0$. Still in $W$.
3. Scale one: $3(1,-1,0)=(3,-3,0)$. Check: $3-3+0=0$. Still in $W$.

All three pass, so $W$ is a subspace — a vector space sitting inside a bigger one.

## The 8 axioms, in short

Every vector space obeys 8 rules, but they group into four ideas you already use: closure (stay inside the set), identity elements (a zero vector; multiplying by $1$ changes nothing), inverses and order-doesn't-matter for addition, and distributing a scalar over a sum. $\mathbb{R}^n$ satisfies all eight automatically — so do polynomials and $m\times n$ matrices.

## The three-test shortcut

For a subset $W$ of a known vector space, checking all 8 axioms is unnecessary. Three tests decide it: zero vector in $W$, closed under addition, closed under scaling. One failure — usually the zero vector — is enough to disqualify $W$.

## What GATE asks

Given a specific $W$, run the three tests, in order, on general members — not just one example. Given a matrix $A$, identify $\text{Col}(A)$ and $\text{Null}(A)$, then apply Rank-Nullity: $\dim(\text{Col}(A)) + \dim(\text{Null}(A)) = n$.
