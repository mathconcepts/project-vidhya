---
id: matrices-and-determinants.interleaved-drill
concept_id: matrices-and-determinants
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
modality: drill
tested_by_atom: matrices-and-determinants.micro-exercise
---

**Cross-concept check: matrices and determinants → sequences and series.**

**Question 1 (sequences and series):** $a,b,c$ are in arithmetic progression, so $b=a+d$ and $c=a+2d$ for some common difference $d$. Using elementary row operations, what single operation on the rows of

$$M=\begin{vmatrix}x+2&x+3&x+2a\\x+3&x+4&x+2b\\x+4&x+5&x+2c\end{vmatrix}$$

would expose the AP structure hiding in column 3?

*Answer:* Apply $R_1\to R_1-R_2$ and $R_2\to R_2-R_3$. Column 3 entries become $(2a-2b)$ and $(2b-2c)$ — and since $a,b,c$ are in AP, $2a-2b=-2d$ and $2b-2c=-2d$: the SAME value in both new rows.

**Question 2 (matrices and determinants):** Given that two rows of the transformed determinant share the same third-column entry (and, after the same row operation, the same first- and second-column entries too), what is $\det(M)$, and why?

*Answer:* $R_1\to R_1-R_2$ gives $(-1,-1,-2d)$; $R_2\to R_2-R_3$ gives $(-1,-1,-2d)$ — two IDENTICAL rows. A determinant with two identical rows is always $0$, since swapping those two rows must flip the determinant's sign, but swapping two identical rows changes nothing — the only number that equals its own negative is $0$.

$$\det(M)=0$$

**Why this drill exists.** Row operations do not just simplify arithmetic — they can prove an entire family of determinants is always zero, for any $a,b,c$ in AP and any $x$, without computing a single $2\times2$ minor.
