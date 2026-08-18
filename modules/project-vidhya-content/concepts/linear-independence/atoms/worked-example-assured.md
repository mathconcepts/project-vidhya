---
# Alternative body for linear-independence.worked-example, served when the
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
id: linear-independence.worked-example.assured
concept_id: linear-independence
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
variant_of: linear-independence.worked-example
for_stance: assured
---

Check $\{v_1,v_2,v_3\}=\{(1,2,1),(2,1,0),(5,4,1)\}$ for independence. Stack as columns:

$$M=\begin{pmatrix}1&2&5\\2&1&4\\1&0&1\end{pmatrix}$$

From the homogeneous system, $c_1+c_3=0$ and $c_1+2c_2+5c_3=0$ leave a one-parameter family: $c_1=-c_3,\ c_2=-2c_3$. So $\text{rank}(M)<3$ and the set is **dependent**.

Taking $c_3=1$: $-v_1-2v_2+v_3=0 \implies \boxed{v_3=v_1+2v_2}$.

**Faster on paper:** with 3 vectors in $\mathbb{R}^3$, dependence is equivalent to $\det(M)=0$ — compute the determinant directly when you only need a yes/no answer. Build the explicit combination (as above) only when the question asks which vector is redundant.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Determine linear independence",
  "steps": [
    {
      "prompt": "Set up the equation $c_1 \\mathbf{v}_1 + c_2 \\mathbf{v}_2 + c_3 \\mathbf{v}_3 = \\mathbf{0}$. How many scalar equations will you have?",
      "hint": "You have 3 vectors, each with 3 components. That gives 3 equations in 3 unknowns.",
      "answer": "3 equations (one per row of the vectors)"
    },
    {
      "prompt": "From the third equation $c_1 + c_3 = 0$, express $c_1$ in terms of $c_3$.",
      "hint": "Rearrange: $c_1 = -c_3$.",
      "answer": "$c_1 = -c_3$"
    },
    {
      "prompt": "Substitute $c_1 = -c_3$ into the first equation $c_1 + 2c_2 + 5c_3 = 0$. What is $c_2$ in terms of $c_3$?",
      "hint": "You get $-c_3 + 2c_2 + 5c_3 = 0$, so $2c_2 = -4c_3$, thus $c_2 = -2c_3$.",
      "answer": "$c_2 = -2c_3$"
    },
    {
      "prompt": "Since there is a non-trivial solution (e.g., $c_3 = 1 \\Rightarrow c_1 = -1, c_2 = -2$), is the set linearly independent or dependent?",
      "hint": "Non-trivial solution means linearly dependent.",
      "answer": "The set is linearly dependent; $\\mathbf{v}_3 = \\mathbf{v}_1 + 2\\mathbf{v}_2$"
    }
  ],
  "caption": "Walk through: checking linear independence by solving the homogeneous system"
}
```
