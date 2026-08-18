---
# Alternative body for gram-schmidt.worked_example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: gram-schmidt.worked-example.assured
concept_id: gram-schmidt
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
variant_of: gram-schmidt.worked_example
for_stance: assured
---

**Problem:** Orthonormalize $v_1=(1,0,1)^T$, $v_2=(1,1,0)^T$, $v_3=(0,1,1)^T$.

$$e_1 = \frac{v_1}{\|v_1\|} = \frac{1}{\sqrt2}\begin{pmatrix}1\\0\\1\end{pmatrix}, \qquad \tilde u_2 = v_2 - \langle v_2,e_1\rangle e_1 \Rightarrow e_2 = \frac{1}{\sqrt6}\begin{pmatrix}1\\2\\-1\end{pmatrix}$$

$$\tilde u_3 = v_3 - \langle v_3,e_1\rangle e_1 - \langle v_3,e_2\rangle e_2 \Rightarrow e_3 = \frac{1}{\sqrt3}\begin{pmatrix}-1\\1\\1\end{pmatrix}$$

$$\boxed{e_1 = \begin{pmatrix} \frac{1}{\sqrt{2}} \\ 0 \\ \frac{1}{\sqrt{2}} \end{pmatrix}, \quad e_2 = \begin{pmatrix} \frac{1}{\sqrt{6}} \\ \frac{2}{\sqrt{6}} \\ -\frac{1}{\sqrt{6}} \end{pmatrix}, \quad e_3 = \begin{pmatrix} -\frac{1}{\sqrt{3}} \\ \frac{1}{\sqrt{3}} \\ \frac{1}{\sqrt{3}} \end{pmatrix}}$$

**Free check, always run it:** $\langle e_i,e_j\rangle=0$ for $i\neq j$ and $\|e_i\|=1$ — one dot product per pair catches an arithmetic slip before it compounds into the next projection.

**Where the effort actually goes:** projecting $v_3$ onto *both* $e_1$ and $e_2$, not just the most recent vector — a common shortcut error is subtracting only the immediately preceding one.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Gram-Schmidt on three vectors",
  "steps": [
    {
      "prompt": "Compute the norm of $v_1 = (1, 0, 1)^T$ and use it to normalize.",
      "hint": "$\\|v_1\\| = \\sqrt{1 + 0 + 1}$. Then divide $v_1$ by this norm to get $e_1$.",
      "answer": "$e_1 = \\begin{pmatrix} 1/\\sqrt{2} \\\\ 0 \\\\ 1/\\sqrt{2} \\end{pmatrix}$"
    },
    {
      "prompt": "Compute $\\langle v_2, e_1 \\rangle$, subtract the projection from $v_2$, and normalize the result.",
      "hint": "$\\langle v_2, e_1 \\rangle = 1 \\cdot \\frac{1}{\\sqrt{2}} + 1 \\cdot 0 + 0 \\cdot \\frac{1}{\\sqrt{2}} = \\frac{1}{\\sqrt{2}}$. Form $\\tilde{u}_2 = v_2 - \\frac{1}{\\sqrt{2}} e_1$, then normalize.",
      "answer": "$e_2 = \\begin{pmatrix} 1/\\sqrt{6} \\\\ 2/\\sqrt{6} \\\\ -1/\\sqrt{6} \\end{pmatrix}$"
    },
    {
      "prompt": "Compute $\\langle v_3, e_1 \\rangle$ and $\\langle v_3, e_2 \\rangle$. Subtract both projections from $v_3$ and normalize.",
      "hint": "Form $\\tilde{u}_3 = v_3 - \\langle v_3, e_1 \\rangle e_1 - \\langle v_3, e_2 \\rangle e_2$. The result should be proportional to $(-2/3, 2/3, 2/3)^T$.",
      "answer": "$e_3 = \\begin{pmatrix} -1/\\sqrt{3} \\\\ 1/\\sqrt{3} \\\\ 1/\\sqrt{3} \\end{pmatrix}$"
    }
  ],
  "caption": "Follow the three steps of Gram-Schmidt: normalize $v_1$, orthogonalize $v_2$, then orthogonalize $v_3$."
}
```
