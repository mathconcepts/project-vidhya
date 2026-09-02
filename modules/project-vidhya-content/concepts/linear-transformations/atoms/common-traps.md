---
id: linear-transformations.common-traps
concept_id: linear-transformations
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Thinking translations are linear**: Adding a fixed vector to every input isn't linear — a true linear map always sends $\mathbf{0}$ to $\mathbf{0}$ ($T(\mathbf{0})=\mathbf{0}$), and a translation doesn't. Check this first.
- **Confusing matrix columns**: A transformation's matrix columns are just $T$ applied to the standard basis vectors ($e_1, e_2, \ldots$) — nothing more. Don't compute $T$ on random vectors first; plug in the basis vectors and read off the columns directly.
- **Mixing up kernel and image dimensions**: The kernel (inputs $T$ sends to $\mathbf{0}$) and the image (everything $T$ can output) are linked by the rank-nullity theorem — their dimensions add up to the input space's dimension. Forget this and dimension calculations go wrong.
