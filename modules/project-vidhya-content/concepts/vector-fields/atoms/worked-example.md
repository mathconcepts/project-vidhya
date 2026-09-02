---
id: vector-fields.worked-example
concept_id: vector-fields
atom_type: worked_example
bloom_level: 3
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Let $\mathbf F(x,y)=(3x^2y,\ x^3+3y^2)$. Verify $\mathbf F$ is conservative, find its scalar potential $\phi$, and evaluate $\phi(2,1)-\phi(0,0)$.

---

**Step 1 — Test for conservative.** With $P=3x^2y$ and $Q=x^3+3y^2$: $\dfrac{\partial Q}{\partial x}=3x^2$ and $\dfrac{\partial P}{\partial y}=3x^2$. Equal, so $\mathbf F$ is conservative.

---

**Step 2 — Integrate $P$ in $x$.** $\phi = \displaystyle\int 3x^2y\,dx = x^3y + g(y)$, where $g(y)$ is unknown so far.

---

**Step 3 — Match $\partial\phi/\partial y$ to $Q$.** $\dfrac{\partial\phi}{\partial y}=x^3+g'(y)$ must equal $x^3+3y^2$, so $g'(y)=3y^2$, giving $g(y)=y^3$.

$$\phi(x,y)=x^3y+y^3$$

---

**Step 4 — Evaluate.** $\phi(2,1)=(8)(1)+1=9$ and $\phi(0,0)=0$, so

$$\boxed{\phi(2,1)-\phi(0,0)=9}$$

**Check.** $\nabla\phi=(3x^2y,\ x^3+3y^2)=\mathbf F$ — the potential really does reproduce the field it came from.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: potential of F = (3x²y, x³+3y²)",
  "steps": [
    {
      "prompt": "Step 1: Test whether F = (3x²y, x³+3y²) is conservative. What do you compare?",
      "hint": "Compute ∂Q/∂x and ∂P/∂y and check whether they match.",
      "answer": "∂Q/∂x = 3x² and ∂P/∂y = 3x² — equal, so F is conservative.",
      "eqn": "∂Q/∂x = ∂/∂x(x³+3y²) = 3x²;  ∂P/∂y = ∂/∂y(3x²y) = 3x²"
    },
    {
      "prompt": "Step 2: Integrate P = 3x²y with respect to x to start building φ.",
      "hint": "Treat y as constant while integrating in x, and add an unknown function g(y).",
      "answer": "φ = x³y + g(y)",
      "eqn": "∫ 3x²y dx = x³y + g(y)"
    },
    {
      "prompt": "Step 3: Differentiate this φ in y and match it to Q = x³+3y² to find g(y).",
      "hint": "∂φ/∂y = x³ + g'(y). Set this equal to Q, solve for g'(y), then integrate.",
      "answer": "g'(y) = 3y² ⟹ g(y) = y³, so φ(x,y) = x³y + y³",
      "eqn": "x³ + g'(y) = x³ + 3y² ⟹ g'(y) = 3y² ⟹ g(y) = y³"
    },
    {
      "prompt": "Step 4: Evaluate φ(2,1) − φ(0,0).",
      "hint": "Substitute both points into φ = x³y + y³ and subtract.",
      "answer": "φ(2,1) − φ(0,0) = 9 − 0 = 9"
    }
  ],
  "caption": "The last line is only valid because Step 1 confirmed F is conservative — for a non-conservative field the path itself would matter."
}
```
