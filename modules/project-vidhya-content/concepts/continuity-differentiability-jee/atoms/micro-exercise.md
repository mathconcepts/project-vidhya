---
id: continuity-differentiability-jee.micro-exercise
concept_id: continuity-differentiability-jee
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
estimated_minutes: 3
---

If $x^3+y^3=6xy$, find $\dfrac{dy}{dx}$ at the point $(3,3)$.

- **(A)** $1$
- **(B)** $-1$
- **(C)** $0$
- **(D)** $-3$
- **(E)** $3$

<details>
<summary>Answer</summary>

**B**. First confirm $(3,3)$ lies on the curve: $3^3+3^3=27+27=54$, and $6(3)(3)=54$ — yes.

Differentiate both sides with respect to $x$, treating $y$ as a function of $x$:

$$
3x^2+3y^2\frac{dy}{dx}=6y+6x\frac{dy}{dx}
$$

Collect $\dfrac{dy}{dx}$ terms:

$$
\frac{dy}{dx}\left(3y^2-6x\right)=6y-3x^2 \quad\Rightarrow\quad \frac{dy}{dx}=\frac{6y-3x^2}{3y^2-6x}=\frac{2y-x^2}{y^2-2x}
$$

At $(3,3)$: $\dfrac{2(3)-3^2}{3^2-2(3)}=\dfrac{6-9}{9-6}=\dfrac{-3}{3}=-1$.

**(A)** comes from dropping the sign when collecting terms. **(D)** and **(E)** come from forgetting to divide out the common factor of $3$ before substituting.

</details>
