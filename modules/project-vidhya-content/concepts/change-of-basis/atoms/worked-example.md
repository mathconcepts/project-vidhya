---
id: change-of-basis.worked-example
concept_id: change-of-basis
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
---

# Worked Example: Change of Basis in ℝ²

## Problem

Consider the standard basis $E = \{e_1, e_2\}$ of $\mathbb{R}^2$ and a non-standard basis 
$$B = \{v_1, v_2\} \quad \text{where} \quad v_1 = \begin{pmatrix} 1 \\ 1 \end{pmatrix}, \quad v_2 = \begin{pmatrix} 1 \\ -1 \end{pmatrix}.$$

A vector $x$ has coordinates $[x]_B = \begin{pmatrix} 2 \\ 1 \end{pmatrix}$ in basis $B$.

**(a)** Find the change-of-basis matrix $P$ from basis $B$ to the standard basis $E$.

**(b)** Find the coordinates of $x$ in the standard basis, $[x]_E$.

**(c)** Verify your answer by expressing $x$ as a linear combination $c_1 v_1 + c_2 v_2$.

---

## Solution

**Step 1: Construct the change-of-basis matrix**

The change-of-basis matrix $P$ from $B$ to $E$ has columns equal to the vectors of basis $B$ (expressed in standard coordinates):
$$P = [v_1 \,|\, v_2] = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}.$$

---

**Step 2: Convert coordinates to the standard basis**

Using the formula $[x]_E = P [x]_B$:
$$[x]_E = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix} \begin{pmatrix} 2 \\ 1 \end{pmatrix} = \begin{pmatrix} 1(2) + 1(1) \\ 1(2) + (-1)(1) \end{pmatrix} = \begin{pmatrix} 3 \\ 1 \end{pmatrix}.$$

---

**Step 3: Verify by direct computation**

$$x = 2v_1 + 1v_2 = 2 \begin{pmatrix} 1 \\ 1 \end{pmatrix} + 1 \begin{pmatrix} 1 \\ -1 \end{pmatrix} = \begin{pmatrix} 2 \\ 2 \end{pmatrix} + \begin{pmatrix} 1 \\ -1 \end{pmatrix} = \begin{pmatrix} 3 \\ 1 \end{pmatrix}. \quad \checkmark$$

---

## Final Answer

$$\boxed{P = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}, \quad [x]_E = \begin{pmatrix} 3 \\ 1 \end{pmatrix}}$$

---

## Interactive Walk-Through

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: Converting coordinates from basis B to standard basis E",
  "steps": [
    {
      "prompt": "What are the columns of the change-of-basis matrix P?",
      "hint": "The columns of P are the basis vectors v₁ and v₂, written in standard coordinates.",
      "answer": "P = [v₁ | v₂] = [[1, 1], [1, -1]]"
    },
    {
      "prompt": "Now compute P × [x]_B. Multiply [[1,1],[1,-1]] by [[2],[1]].",
      "hint": "Row 1: (1)(2) + (1)(1) = 3. Row 2: (1)(2) + (-1)(1) = 1.",
      "answer": "[x]_E = [[3], [1]]"
    },
    {
      "prompt": "Verify: compute 2v₁ + 1v₂ directly and check you get [[3],[1]].",
      "hint": "2[[1],[1]] + 1[[1],[-1]] = [[2],[2]] + [[1],[-1]] = [[3],[1]]",
      "answer": "Verification complete: 2v₁ + 1v₂ = [[3],[1]] ✓"
    }
  ],
  "caption": "Converting a vector's coordinates when you switch from basis B to the standard basis E"
}
```