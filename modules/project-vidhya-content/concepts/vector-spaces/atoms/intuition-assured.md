---
# Alternative body for vector-spaces-intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# variant_of names the base's literal (unusually hyphenated, not dotted) id
# field — see the concept's atoms/intuition.md front matter.
id: vector-spaces.intuition.assured
concept_id: vector-spaces
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: vector-spaces-intuition
for_stance: assured
---

A vector space is any set closed under addition and scalar multiplication, satisfying 8 axioms that reduce to: you can add, you can scale, you never leave the set. $\mathbb{R}^n$, polynomials of degree $\le n$, $C[0,1]$, and $m\times n$ matrices are all instances — the same span/basis/dimension machinery applies to every one.

**Subspace, fast.** Skip all 8 axioms for a subset $W$ of a known space; check only $\mathbf{0}\in W$, closed under $+$, closed under scalar $\cdot$. Fail the zero-vector test and you're done in one line.

**One identity, not two facts.** Rank-Nullity, $\dim(\text{Col}(A))+\dim(\text{Null}(A))=n$, is a dimension count on the same decomposition — $\text{Col}(A)$ and $\text{Null}(A)$ are both subspaces of spaces whose dimensions you already know, so this isn't a separate thing to memorize.

**The proof gap that costs the mark.** "Closed under addition" must hold for *arbitrary* members of $W$, proved algebraically — a subset that survives the two vectors you happened to try can still fail in general.
