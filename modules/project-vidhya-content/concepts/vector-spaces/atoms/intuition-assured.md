---
# Alternative body for vector-spaces.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: vector-spaces.intuition.assured
concept_id: vector-spaces
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: vector-spaces.intuition
for_stance: assured
---

A vector space is any set closed under addition and scalar multiplication, satisfying 8 axioms that reduce to: add, scale, never leave the set. $\mathbb{R}^n$, polynomials of degree $\le n$, $C[0,1]$, and $m\times n$ matrices are all instances — the same span/basis/dimension machinery applies to every one.

**Subspace, fast.** Skip all 8 axioms for a subset $W$ of a known space; check only $\mathbf{0}\in W$, closed under $+$, closed under scalar $\cdot$. Fail the zero-vector test and it's done in one line.

**One identity, not two facts.** Rank-Nullity, $\dim(\text{Col}(A))+\dim(\text{Null}(A))=n$, is a dimension count on the same decomposition — $\text{Col}(A)$ and $\text{Null}(A)$ are both subspaces of spaces whose dimensions you already know.

**The proof gap that costs the mark.** "Closed under addition" must hold for *arbitrary* members of $W$, proved algebraically — a subset that survives the two vectors you happened to try can still fail in general.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Is W = {x+y+z=0} a subspace of R³?",
  "steps": [
    {
      "prompt": "What are the three conditions to verify W is a subspace of R^3?",
      "hint": "Think about what a subspace must contain and what operations must keep you inside W.",
      "answer": "(1) The zero vector (0,0,0) must be in W. (2) W must be closed under vector addition. (3) W must be closed under scalar multiplication."
    },
    {
      "prompt": "Take u=(x1,y1,z1) and v=(x2,y2,z2) both satisfying x+y+z=0. Show their sum is also in W.",
      "hint": "Add the two constraint equations together.",
      "answer": "(x1+x2)+(y1+y2)+(z1+z2) = (x1+y1+z1)+(x2+y2+z2) = 0+0 = 0. So u+v satisfies the constraint."
    },
    {
      "prompt": "What is a basis for W and what is dim(W)? Use the free-variable method.",
      "hint": "From x+y+z=0, let y=s and z=t be free.",
      "answer": "Basis: {(-1,1,0), (-1,0,1)}. From x = -s-t: (x,y,z) = s(-1,1,0) + t(-1,0,1). dim(W) = 2."
    }
  ]
}
```
