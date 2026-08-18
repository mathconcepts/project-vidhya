---
# Alternative body for cayley-hamilton.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: cayley-hamilton.worked-example.assured
concept_id: cayley-hamilton
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: cayley-hamilton.worked_example
for_stance: assured
---

## $A = \begin{pmatrix} 1 & 1 \\ 0 & 2 \end{pmatrix}$: $A^4$ and $A^{-1}$ from one relation

$p(\lambda) = \lambda^2 - 3\lambda + 2$, so $A^2 = 3A - 2I$. Everything below is that one substitution, applied twice.

**Powers:** square the recurrence — $A^4 = (3A-2I)^2 = 9A^2-12A+4I$, then substitute $A^2$ back in: $A^4 = 15A - 14I$. For an odd or larger exponent, reduce mod the recurrence rather than expanding by hand; you're always one substitution from a linear combination of $A$ and $I$.

**Inverse:** rearrange the same relation as $A(A-3I) = -2I$, so $A^{-1} = \frac{1}{2}(3I-A) = \begin{pmatrix} 1 & -1/2 \\ 0 & 1/2 \end{pmatrix}$ — no cofactor expansion needed.

Triangular $A$ made the eigenvalues free reads off the diagonal ($1, 2$); on a dense matrix, forming $p(\lambda)$ is the real cost of this method, not the substitution.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Matrix power reduction via Cayley-Hamilton","steps":[{"prompt":"Step 1: Write the characteristic polynomial for $A = \\begin{pmatrix} 1 & 1 \\\\ 0 & 2 \\end{pmatrix}$. What is $\\det(\\lambda I - A)$?","hint":"Expand the determinant: $(\\lambda - 1)(\\lambda - 2) = \\lambda^2 - 3\\lambda + 2$. By Cayley-Hamilton, $A^2 - 3A + 2I = 0$.","answer":"$\\lambda^2 - 3\\lambda + 2 = 0$, so $A^2 = 3A - 2I$"},{"prompt":"Step 2: Use the recurrence $A^2 = 3A - 2I$ to compute $A^4 = (A^2)^2$. Expand $(3A - 2I)^2$.","hint":"$(3A - 2I)^2 = 9A^2 - 12A + 4I$. Now substitute $A^2 = 3A - 2I$ to eliminate the $A^2$ term.","answer":"$A^4 = 9(3A - 2I) - 12A + 4I = 27A - 18I - 12A + 4I = 15A - 14I$"},{"prompt":"Step 3: For part (b), rearrange $A^2 - 3A + 2I = 0$ to solve for $A^{-1}$. Start by factoring out $A$ on the left.","hint":"Write $A(A - 3I) = -2I$. Divide both sides by $-2$ and rearrange.","answer":"$A^{-1} = \\frac{1}{2}(3I - A)$"}],"caption":"Cayley-Hamilton reduces infinite matrix powers to a finite recurrence, and rearranging gives the inverse formula without computing the determinant explicitly."}
```
