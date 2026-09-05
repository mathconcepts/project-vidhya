---
id: cayley-hamilton.mnemonic
concept_id: cayley-hamilton
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Every matrix is a root of its own equation."** That sentence is the whole theorem. Swap $\lambda^k \to A^k$ and the constant term $\to$ (constant)$\times I$, and the matrix satisfies it too.

**The 2×2 shortcut worth memorising outright:**

$$A^2 = \text{tr}(A)\, A - \det(A)\, I$$

Here $\text{tr}(A)$ ("trace") just means add the two diagonal entries; $\det(A)$ is the usual determinant, $ad-bc$. Read those two numbers off $A$ directly — no need to expand $\det(\lambda I - A)$ first.

**And the inverse falls straight out of it:**

$$A^{-1} = \frac{1}{\det(A)}\big(\text{tr}(A)\, I - A\big)$$

For $A = \begin{pmatrix} 1 & 1 \\ 0 & 2 \end{pmatrix}$: trace $=3$, determinant $=2$, so $A^{-1} = \frac{1}{2}(3I - A)$ — one line, no cofactor grid to build first.

**Watch the constant term.** The $I$ is not optional and not a bare $1$. Writing $A^2 - 3A + 2 = 0$ instead of $A^2 - 3A + 2I = 0$ mixes a scalar into a matrix equation — the single most common slip on this theorem.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag A's entries — watch the Cayley-Hamilton shortcut rebuild A⁻¹",
  "why": "Trace and determinant are just two numbers read off A — drag its entries and watch this exact combination rebuild A inverse every time, not only for the one example above.",
  "inputs": [
    {"id": "a", "label": "a (top-left)", "min": 1, "max": 4, "step": 0.5, "initial": 1},
    {"id": "b", "label": "b (top-right)", "min": 0, "max": 3, "step": 0.5, "initial": 1},
    {"id": "c", "label": "c (bottom-left)", "min": -2, "max": 0, "step": 0.5, "initial": 0},
    {"id": "d", "label": "d (bottom-right)", "min": 1, "max": 4, "step": 0.5, "initial": 2}
  ],
  "outputs": [
    {"label": "trace(A) = a + d", "formula": "a + d", "digits": 2},
    {"label": "det(A) = ad - bc", "formula": "a*d - b*c", "digits": 2},
    {"label": "A⁻¹ entry (1,1) = (tr - a)/det", "formula": "((a + d) - a) / (a*d - b*c)", "digits": 2},
    {"label": "A⁻¹ entry (1,2) = -b/det", "formula": "(0 - b) / (a*d - b*c)", "digits": 2},
    {"label": "A⁻¹ entry (2,1) = -c/det", "formula": "(0 - c) / (a*d - b*c)", "digits": 2},
    {"label": "A⁻¹ entry (2,2) = (tr - d)/det", "formula": "((a + d) - d) / (a*d - b*c)", "digits": 2}
  ],
  "caption": "Start at a=1, b=1, c=0, d=2 — the mnemonic's own matrix — and check A⁻¹ reads (1, -0.5, 0, 0.5), exactly as computed above. Then drag any entry: trace and det update, and A⁻¹ rebuilds from just those two numbers, every time."
}
```
