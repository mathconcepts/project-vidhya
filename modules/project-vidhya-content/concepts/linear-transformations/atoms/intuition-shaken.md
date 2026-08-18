---
# Alternative body for linear-transformations.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: linear-transformations.intuition.shaken
concept_id: linear-transformations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: linear-transformations.intuition
for_stance: shaken
---

Take $T(x,y) = (2x, x+y)$. Try $\vec u = (1,0)$ and $\vec v = (0,1)$.

$$T(\vec u + \vec v) = T(1,1) = (2, 2)$$
$$T(\vec u) + T(\vec v) = (2,1) + (0,1) = (2,2)$$

Same answer both ways. That's what "linear" checks — every time, not just here.

## Kernel and image

**Kernel** = vectors $T$ sends to zero. Solve $T(x,y)=(0,0)$: $2x=0$ and $x+y=0$ give $x=0,\ y=0$ — here the kernel is just the origin.

**Image** = every output $T$ can actually produce.

**Rank-Nullity:** $\dim(\text{domain}) = \text{rank}(T) + \text{nullity}(T)$. It's a bookkeeping check — run it after computing kernel and image, and the two dimensions must add up to the domain's.

Once you fix a basis, $T$ becomes an ordinary matrix, and matrix multiplication takes over from here.

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
