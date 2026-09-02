---
# Alternative body for vector-spaces.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
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
id: vector-spaces.intuition.shaken
concept_id: vector-spaces
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: vector-spaces.intuition
for_stance: shaken
---

Take $W=\{(x,y,z):x+y+z=0\}$ in $\mathbb{R}^3$. Is $W$ a subspace?

Three checks, in order. Is $(0,0,0)$ in $W$? Yes: $0+0+0=0$. Add two members: $(1,-1,0)+(2,-3,1)=(3,-4,1)$; check $3-4+1=0$ — still in $W$. Scale one: $3(1,-1,0)=(3,-3,0)$; check $3-3+0=0$ — still in $W$. All three pass, so $W$ is a subspace.

**The 8 axioms, in short.** Every vector space obeys 8 rules that group into four ideas already familiar: closure (stay inside the set), identity elements (a zero vector; multiplying by $1$ changes nothing), inverses and order-doesn't-matter for addition, and distributing a scalar over a sum.

**The three-test shortcut.** For a subset $W$ of a known vector space, checking all 8 axioms is unnecessary — three tests decide it: zero vector in $W$, closed under addition, closed under scaling. One failure disqualifies $W$.

**What GATE asks.** Given a specific $W$, run the three tests on general members — not just one example. Given a matrix $A$, identify $\text{Col}(A)$ and $\text{Null}(A)$, then apply Rank-Nullity: $\dim(\text{Col}(A))+\dim(\text{Null}(A))=n$.

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
