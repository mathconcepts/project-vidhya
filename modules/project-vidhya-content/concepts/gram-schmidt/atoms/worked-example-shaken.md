---
# Alternative body for gram-schmidt.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# The scaffolding is REAL but it is not on the page: prose is held at or below
# the base atom's length, because a screen that is visibly longer than the one
# that already defeated this reader signals difficulty no matter how kindly it
# is written. The extra steps live in the walkthrough below, where they unfold
# one at a time when the student asks for them.
#
# The walkthrough may carry MORE steps than the base's, but every answer the
# base asserts survives here in order and the final answer is identical —
# scripts/check-variant-agreement.ts enforces that. Prompts and hints are the
# part that may differ, and they are where the gentler register lives.
id: gram-schmidt.worked-example.shaken
concept_id: gram-schmidt
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
variant_of: gram-schmidt.worked_example
for_stance: shaken
---

**Problem:** Orthonormalize $v_1=\begin{pmatrix}1\\0\\1\end{pmatrix}$, $v_2=\begin{pmatrix}1\\1\\0\end{pmatrix}$, $v_3=\begin{pmatrix}0\\1\\1\end{pmatrix}$.

---

**$v_1$ first — just normalize.** $\|v_1\|=\sqrt{2}$, so $e_1 = \frac{1}{\sqrt2}\begin{pmatrix}1\\0\\1\end{pmatrix}$.

**$v_2$ — subtract its shadow on $e_1$, then normalize.** $\langle v_2,e_1\rangle=\frac{1}{\sqrt2}$. Subtract: $v_2-\frac{1}{\sqrt2}e_1 = \begin{pmatrix}1/2\\1\\-1/2\end{pmatrix}$. Its length is $\frac{\sqrt6}{2}$, giving $e_2=\begin{pmatrix}1/\sqrt6\\2/\sqrt6\\-1/\sqrt6\end{pmatrix}$.

**$v_3$ — subtract its shadow on both $e_1$ and $e_2$.** $\langle v_3,e_1\rangle=\frac{1}{\sqrt2}$, $\langle v_3,e_2\rangle=\frac{1}{\sqrt6}$. Subtracting both leaves $\begin{pmatrix}-2/3\\2/3\\2/3\end{pmatrix}$, length $\frac{2}{\sqrt3}$, so $e_3=\begin{pmatrix}-1/\sqrt3\\1/\sqrt3\\1/\sqrt3\end{pmatrix}$.

$$\boxed{e_1 = \begin{pmatrix} \frac{1}{\sqrt{2}} \\ 0 \\ \frac{1}{\sqrt{2}} \end{pmatrix}, \quad e_2 = \begin{pmatrix} \frac{1}{\sqrt{6}} \\ \frac{2}{\sqrt{6}} \\ -\frac{1}{\sqrt{6}} \end{pmatrix}, \quad e_3 = \begin{pmatrix} -\frac{1}{\sqrt{3}} \\ \frac{1}{\sqrt{3}} \\ \frac{1}{\sqrt{3}} \end{pmatrix}}$$

Check: each $\|e_i\|=1$, and $\langle e_i,e_j\rangle=0$ for $i\neq j$.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Gram-Schmidt on three vectors",
  "steps": [
    {
      "prompt": "$v_1 = (1,0,1)$. Compute its length, then divide $v_1$ by that length to get $e_1$.",
      "hint": "$\\|v_1\\| = \\sqrt{1^2+0^2+1^2} = \\sqrt{2}$. Divide every entry of $v_1$ by $\\sqrt{2}$.",
      "answer": "$e_1 = \\begin{pmatrix} 1/\\sqrt{2} \\\\ 0 \\\\ 1/\\sqrt{2} \\end{pmatrix}$"
    },
    {
      "prompt": "Compute $\\langle v_2, e_1 \\rangle$ first, on its own.",
      "hint": "$\\langle v_2, e_1 \\rangle = 1 \\cdot \\frac{1}{\\sqrt{2}} + 1 \\cdot 0 + 0 \\cdot \\frac{1}{\\sqrt{2}}$.",
      "answer": "$\\langle v_2, e_1\\rangle = 1/\\sqrt{2}$"
    },
    {
      "prompt": "Now subtract that amount of $e_1$ from $v_2$, and normalize what's left.",
      "hint": "Form $\\tilde{u}_2 = v_2 - \\frac{1}{\\sqrt{2}} e_1$, then divide by its own length.",
      "answer": "$e_2 = \\begin{pmatrix} 1/\\sqrt{6} \\\\ 2/\\sqrt{6} \\\\ -1/\\sqrt{6} \\end{pmatrix}$"
    },
    {
      "prompt": "For $v_3$, compute $\\langle v_3, e_1 \\rangle$ and $\\langle v_3, e_2 \\rangle$. Subtract both projections from $v_3$ and normalize.",
      "hint": "Form $\\tilde{u}_3 = v_3 - \\langle v_3, e_1 \\rangle e_1 - \\langle v_3, e_2 \\rangle e_2$. The result should be proportional to $(-2/3, 2/3, 2/3)^T$.",
      "answer": "$e_3 = \\begin{pmatrix} -1/\\sqrt{3} \\\\ 1/\\sqrt{3} \\\\ 1/\\sqrt{3} \\end{pmatrix}$"
    }
  ],
  "caption": "Follow the three steps of Gram-Schmidt: normalize $v_1$, orthogonalize $v_2$, then orthogonalize $v_3$."
}
```
