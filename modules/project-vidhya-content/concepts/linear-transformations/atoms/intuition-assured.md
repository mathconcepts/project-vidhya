---
# Alternative body for linear-transformations.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: linear-transformations.intuition.assured
concept_id: linear-transformations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: linear-transformations.intuition
for_stance: assured
---

$T(\vec u+\vec v)=T(\vec u)+T(\vec v)$ and $T(c\vec u)=cT(\vec u)$ together say one thing: $T$ is determined entirely by what it does to a basis, since every other vector is a linear combination of basis vectors. That's the whole reason "linear transformation" and "matrix" are interchangeable once a basis is fixed.

**Kernel and image, fast.** $\text{Ker}(T)$ answers "what collapses to zero"; $\text{Im}(T)$ answers "what's reachable." Rank-Nullity, $\dim(V)=\text{rank}(T)+\text{nullity}(T)$, is a dimension count you already trust once you know $\text{Ker}$ and $\text{Im}$ are both subspaces — treat it as your check, not a separate derivation.

**The common miss:** $T$ injective $\iff$ $\text{Ker}(T)=\{\vec 0\}$ — a fact GATE tests by giving a nontrivial kernel vector and asking what it implies, not by asking for the definition directly.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the entries of A = [[2,-1],[1,1]] and watch the basis vectors move",
  "inputs": [
    {"id": "a", "label": "a (row 1, col 1)", "min": -3, "max": 3, "step": 0.5, "initial": 2},
    {"id": "b", "label": "b (row 1, col 2)", "min": -3, "max": 3, "step": 0.5, "initial": -1},
    {"id": "c", "label": "c (row 2, col 1)", "min": -3, "max": 3, "step": 0.5, "initial": 1},
    {"id": "d", "label": "d (row 2, col 2)", "min": -3, "max": 3, "step": 0.5, "initial": 1}
  ],
  "outputs": [
    {"label": "T(e1) x-coordinate", "formula": "a", "digits": 2},
    {"label": "T(e1) y-coordinate", "formula": "c", "digits": 2},
    {"label": "T(e2) x-coordinate", "formula": "b", "digits": 2},
    {"label": "T(e2) y-coordinate", "formula": "d", "digits": 2},
    {"label": "trace = a + d", "formula": "a + d", "digits": 2},
    {"label": "det = ad - bc", "formula": "a*d - b*c", "digits": 2}
  ],
  "caption": "e1 = (1,0) and e2 = (0,1) are the standard basis vectors. Drag any entry and watch its column move — that column IS where the transform sends that basis vector."
}
```
