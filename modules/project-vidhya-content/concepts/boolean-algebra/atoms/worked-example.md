---
id: boolean-algebra-worked-example
concept_id: boolean-algebra
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Boolean Algebra — Worked Examples

## Problem 1: K-Map Simplification (GATE Style)

**Question:** Simplify $F = A'BC + AB'C + ABC' + ABC$ using a K-map.

**Step 1 — Identify the minterms.**

Convert each term to minterm numbers (A is MSB, C is LSB):

| Term | A B C | Minterm |
|---|---|---|
| $A'BC$ | 0 1 1 | $m_3$ |
| $AB'C$ | 1 0 1 | $m_5$ |
| $ABC'$ | 1 1 0 | $m_6$ |
| $ABC$ | 1 1 1 | $m_7$ |

**Step 2 — Plot the K-map (3 variables).**

```
         C:  0    1
   AB: 00 |  0  |  0  |
       01 |  0  |  1  |  ← m3
       11 |  1  |  1  |  ← m6, m7
       10 |  0  |  1  |  ← m5
```

**Step 3 — Group the 1s.**

Group 1: $m_6$ and $m_7$ (adjacent in AB=11 row) → $AB$ (C dropped)

Group 2: $m_5$ and $m_7$ (AB=10 and AB=11, both $C=1$) → $AC$ (B dropped)

Group 3: $m_3$ and $m_7$ (both have $B=1, C=1$, A differs) → $BC$ (A dropped)

**Step 4 — Write the minimal SOP.**

$$\boxed{F = AB + AC + BC}$$

**Verification:** Check all minterms are covered. Check no minterm of $F'$ is included.

---

## Problem 2: Algebraic Simplification (GATE Style)

**Simplify $F = AB + AB' + A'B$ algebraically.**

$$F = AB + AB' + A'B$$
$$= A(B + B') + A'B \qquad \text{(factor A from first two terms)}$$
$$= A \cdot 1 + A'B \qquad \text{(complement law: } B + B' = 1)$$
$$= A + A'B \qquad \text{(Boolean identity: } A \cdot 1 = A)$$
$$= A + B \qquad \text{(absorption variant: } A + A'B = A + B) \checkmark$$

**Result:** $F = A + B$

---

## Problem 3: De Morgan's Application (GATE Style)

**Question:** Express $F = \overline{(A + B) \cdot C}$ in SOP form.

**Step 1 — Apply De Morgan's to the outer bar.**

$$F = (A + B)' + C'$$

**Step 2 — Apply De Morgan's to $(A + B)'$.**

$$(A + B)' = A' \cdot B'$$

**Step 3 — Expand.**

$$F = A'B' + C'$$

This is already in SOP form. Optionally expand further:

$$F = A'B'C + A'B'C' + AC' + A'C' + BC'$$

But $A'B' + C'$ is the minimal SOP.

---

## Problem 4: Minterm Count (GATE Style)

**Question:** A 3-variable Boolean function $F$ has the truth table below. How many minterms does $F$ have?

| A | B | C | F |
|---|---|---|---|
| 0 | 0 | 0 | 1 |
| 0 | 0 | 1 | 0 |
| 0 | 1 | 0 | 1 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 0 | 0 |
| 1 | 0 | 1 | 1 |
| 1 | 1 | 0 | 0 |
| 1 | 1 | 1 | 1 |

**Answer:** Rows where $F = 1$: rows 0, 2, 5, 7 → **4 minterms** → $F' $ has $8 - 4 = 4$ minterms also.

$$F = m_0 + m_2 + m_5 + m_7 = \Sigma(0,2,5,7)$$

K-map simplification gives: $F = B'C' + BC = \overline{B \oplus C}$ (XNOR of B and C — a clean result!).

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: De Morgan's theorem and absorption law simplification","steps":[{"prompt":"Using De Morgan's theorem, simplify (A·B)'. Which law applies and what is the result?","hint":"'Break the bar, change the operation': (A·B)' → split the bar across both variables and flip AND to OR.","answer":"A' + B'"},{"prompt":"Simplify F = A + A'B using absorption. What is the result?","hint":"The absorption variant states A + A'B = A + B. Verify: if A=1, F=1=A+B. If A=0, F=B=A+B.","answer":"A + B"}]}
```
