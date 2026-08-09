---
id: implicit-differentiation.retrieval-prompt
concept_id: implicit-differentiation
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Find $\dfrac{dy}{dx}$ for the folium of Descartes: $x^3 + y^3 = 3axy$ (where $a$ is a constant).

- **(A)** $\dfrac{ay - x^2}{y^2 - ax}$
- **(B)** $\dfrac{x^2 - ay}{y^2 - ax}$
- **(C)** $\dfrac{3x^2 - 3ay}{3y^2 - 3ax}$
- **(D)** $\dfrac{x^2 + ay}{y^2 + ax}$

<details>
<summary>Answer</summary>

**A**. Differentiate both sides w.r.t. $x$: $\frac{d}{dx}(x^3) + \frac{d}{dx}(y^3) = \frac{d}{dx}(3axy)$. Compute each term: $3x^2 + 3y^2\frac{dy}{dx} = 3a\left(y + x\frac{dy}{dx}\right)$ (product rule on right). Expand: $3x^2 + 3y^2\frac{dy}{dx} = 3ay + 3ax\frac{dy}{dx}$. Collect $\frac{dy}{dx}$ terms: $3y^2\frac{dy}{dx} - 3ax\frac{dy}{dx} = 3ay - 3x^2$. Factor: $\frac{dy}{dx}(3y^2 - 3ax) = 3(ay - x^2)$. Divide: $\frac{dy}{dx} = \frac{3(ay-x^2)}{3(y^2-ax)} = \frac{ay-x^2}{y^2-ax}$. Option C is the same expression before cancelling the common factor of 3 — identical value, less simplified.

</details>
