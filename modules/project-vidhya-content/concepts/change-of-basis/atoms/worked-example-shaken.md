---
# Alternative body for change-of-basis.worked-example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# The scaffolding is REAL but it is not on the page: prose is held at or below
# the base atom's length, because a screen that is visibly longer than the one
# that already defeated this reader signals difficulty no matter how kindly it
# is written. No praise, no reassurance, and no mention of how the reader
# might be feeling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: change-of-basis.worked-example.shaken
concept_id: change-of-basis
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
scaffold_fade: true
exam_ids: ["*"]
variant_of: change-of-basis.worked-example
for_stance: shaken
---

Basis $B=\{v_1,v_2\}$, $v_1=(1,1)$, $v_2=(1,-1)$. $[x]_B=(2,1)$. Find $[x]_E$.

---

**Step 1 — Put $v_1$ and $v_2$ as the columns of $P$.**

$$P = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$$

---

**Step 2 — Multiply $P$ by $[x]_B$.**

$$P[x]_B = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}\begin{pmatrix} 2 \\ 1 \end{pmatrix} = \begin{pmatrix} 1(2)+1(1) \\ 1(2)-1(1) \end{pmatrix} = \begin{pmatrix} 3 \\ 1 \end{pmatrix}$$

---

**Step 3 — Check by adding $2v_1+v_2$ directly.**

$$2(1,1)+1(1,-1) = (2,2)+(1,-1) = (3,1) \quad\checkmark$$

$$\boxed{[x]_E=(3,1)}$$

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "why": "Try rebuilding this exact coordinate change yourself, one step at a time, before trusting the shortcut on a new problem.",
  "title": "Walk through: converting coordinates from basis B to standard basis E",
  "steps": [
    {
      "prompt": "What are the columns of the change-of-basis matrix $P$?",
      "hint": "The columns of $P$ are the basis vectors $v_1$ and $v_2$, written in standard coordinates.",
      "answer": "$P = [v_1 \\mid v_2] = \\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}$"
    },
    {
      "prompt": "Now compute $P[x]_B$. Multiply $\\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}$ by $\\begin{pmatrix}2\\\\1\\end{pmatrix}$.",
      "hint": "Row 1: $(1)(2)+(1)(1)=3$. Row 2: $(1)(2)+(-1)(1)=1$.",
      "answer": "$[x]_E = \\begin{pmatrix}3\\\\1\\end{pmatrix}$"
    },
    {
      "prompt": "Verify: compute $2v_1+1v_2$ directly and check you get $\\begin{pmatrix}3\\\\1\\end{pmatrix}$.",
      "hint": "$2\\begin{pmatrix}1\\\\1\\end{pmatrix}+1\\begin{pmatrix}1\\\\-1\\end{pmatrix}=\\begin{pmatrix}2\\\\2\\end{pmatrix}+\\begin{pmatrix}1\\\\-1\\end{pmatrix}=\\begin{pmatrix}3\\\\1\\end{pmatrix}$",
      "answer": "Verification complete: $2v_1+1v_2=\\begin{pmatrix}3\\\\1\\end{pmatrix}$"
    }
  ],
  "caption": "Converting a vector's coordinates when you switch from basis B to the standard basis E"
}
```
