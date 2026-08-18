---
# Alternative body for linear-independence.worked-example, served when the
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
id: linear-independence.worked-example.shaken
concept_id: linear-independence
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
variant_of: linear-independence.worked-example
for_stance: shaken
---

Check whether $v_1=(1,2,1)$, $v_2=(2,1,0)$, $v_3=(5,4,1)$ are independent.

Set up $c_1v_1+c_2v_2+c_3v_3=0$ and write out the three equations:

$$c_1+2c_2+5c_3=0, \quad 2c_1+c_2+4c_3=0, \quad c_1+c_3=0$$

From the third: $c_1=-c_3$. Substitute into the first: $-c_3+2c_2+5c_3=0 \Rightarrow c_2=-2c_3$.

Pick $c_3=1$: then $c_1=-1,\ c_2=-2$ — a **non-trivial** solution. So the set is **dependent**.

$$\boxed{v_3=v_1+2v_2}$$

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
