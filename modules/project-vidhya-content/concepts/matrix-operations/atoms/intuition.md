---
id: matrix-operations.intuition
concept_id: matrix-operations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

Addition and transpose are bookkeeping: add matching entries, or read the matrix by columns instead of rows. Multiplication is the operation that carries content — $(AB)_{ij}$ is row $i$ of $A$ dotted with column $j$ of $B$, and it exists only when the inner dimensions match.

Multiplication composes two transformations. If $B$ sends an input somewhere and $A$ then acts on that result, $AB$ bundles "$B$ first, then $A$" into one matrix. That composition is not symmetric — doing $B$ then $A$ is a different journey than doing $A$ then $B$ — so $AB \neq BA$ in general, even when both products are defined.

What holds regardless of order: multiplication is associative, $(AB)C = A(BC)$, so a chain of transformations can be grouped however is cheapest to compute, and addition distributes over it normally.

GATE tests three things here: computing a single entry without building the whole product, recognizing when a product is even defined, and the two reversals that trip people up — $(AB)^T = B^TA^T$ and $(AB)^{-1} = B^{-1}A^{-1}$ — order flips under both transpose and inverse, never stays put.

The walkthrough below uses hook's own two shears, $A=\begin{pmatrix}1&1\\0&1\end{pmatrix}$ and $B=\begin{pmatrix}1&0\\1&1\end{pmatrix}$ — multiply them by hand and you land on exactly the $AB$ and $BA$ matrices whose action on sixteen arrows you already watched.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "why": "Reading about matrix multiplication isn't the same as doing it with your own hand — these are hook's own two shears, the ones whose product you already watched move sixteen arrows.",
  "title": "Try It: A and B From the Hook Animation",
  "steps": [
    {
      "prompt": "Compute $(AB)_{11}$ for $A=\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$ and $B=\\begin{pmatrix}1&0\\\\1&1\\end{pmatrix}$ — the same two shears from the hook animation.",
      "hint": "Row 1 of $A$ is $(1,1)$. Column 1 of $B$ is $(1,1)$. The $(1,1)$ entry is their dot product.",
      "answer": "$(AB)_{11} = 1\\cdot1 + 1\\cdot1 = 1+1 = 2$ — matching the top-left entry of $AB=\\begin{pmatrix}2&1\\\\1&1\\end{pmatrix}$ from the hook."
    },
    {
      "prompt": "Now compute $(AB)_{12}$.",
      "hint": "Row 1 of $A$ is $(1,1)$. Column 2 of $B$ is $(0,1)$.",
      "answer": "$(AB)_{12} = 1\\cdot0 + 1\\cdot1 = 0+1 = 1$"
    },
    {
      "prompt": "Does $AB=BA$? Compute $(BA)_{11}$ to check.",
      "hint": "Row 1 of $B$ is $(1,0)$. Column 1 of $A$ is $(1,0)$.",
      "answer": "$(BA)_{11} = 1\\cdot1 + 0\\cdot0 = 1 \\neq 2$. Order matters — matrix multiplication is not commutative, and this $1$ is the top-left entry of the ghost matrix $BA=\\begin{pmatrix}1&1\\\\1&2\\end{pmatrix}$ you saw in the hook."
    }
  ],
  "caption": "Each entry $(AB)_{ij}$ = dot product of row $i$ of $A$ with column $j$ of $B$ — the exact numbers behind the hook's solid AB arrows and dashed BA ghosts."
}
```
