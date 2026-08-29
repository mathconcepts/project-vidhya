---
id: matrix-operations.exam-pattern
concept_id: matrix-operations
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **When one entry is asked, compute one entry.** "Find $(AB)_{12}$" is a single dot product, not a full product. For $A = \begin{pmatrix} 2 & 1 \\ 0 & 3 \end{pmatrix}$, $B = \begin{pmatrix} 1 & 0 \\ 2 & 1 \end{pmatrix}$: row 1 of $A$ against column 2 of $B$ gives $2(0) + 1(1) = 1$. Done — four multiplications avoided. Students who compute all of $AB = \begin{pmatrix} 4 & 1 \\ 6 & 3 \end{pmatrix}$ spend four times as long for the same mark.

- **The algebra traps all come from non-commutativity.** $AB \ne BA$ in general, so:
  - $(A+B)^2 = A^2 + AB + BA + B^2$, **not** $A^2 + 2AB + B^2$. With the matrices above, $(A+B)^2 = \begin{pmatrix} 11 & 7 \\ 14 & 18 \end{pmatrix}$ while $A^2 + 2AB + B^2 = \begin{pmatrix} 13 & 7 \\ 16 & 16 \end{pmatrix}$ — different, and both are "clean-looking" answers.
  - $(A+B)(A-B) = A^2 - AB + BA - B^2 \ne A^2 - B^2$.
  - $(AB)^T = B^TA^T$ — order reverses.

- **MSQ "which must be true" standards:**
  - $AB = 0$ does **not** imply $A = 0$ or $B = 0$. Zero divisors exist among matrices.
  - $AB = AC$ with $A \ne 0$ does **not** imply $B = C$ — cancellation needs $A$ invertible.
  - Matrix multiplication *is* associative and distributive; only commutativity fails. GATE mixes a true associativity claim in with false commutativity claims in the same option set.

- **Dimension questions are free marks.** For $A_{2\times3}$ and $B_{3\times4}$: $AB$ is $2\times4$ and $BA$ does not exist at all. "Does not exist" is a real answer option and it is often correct.

- **Time budget:** a full $2\times2$ product is 30 seconds; a single entry is 10. Anything asking for a $3\times3$ product in full is either a 2-mark question or a sign you've missed a structural shortcut (a triangular or diagonal factor, say).
