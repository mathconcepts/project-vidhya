---
# Alternative body for vector-fields.worked-example, served when the learner
# stance is `shaken`. Prose held at or below the base atom's length; the
# extra steps live in the walkthrough below.
id: vector-fields.worked-example.shaken
concept_id: vector-fields
atom_type: worked_example
bloom_level: 3
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
variant_of: vector-fields.worked-example
for_stance: shaken
---

**Problem:** $\mathbf F(x,y)=(3x^2y,\ x^3+3y^2)$. Find its scalar potential $\phi$ and evaluate $\phi(2,1)-\phi(0,0)$.

---

**Step 1 — Name $P$ and $Q$.** $P=3x^2y$, $Q=x^3+3y^2$.

---

**Step 2 — Compare $\partial Q/\partial x$ and $\partial P/\partial y$.** $\partial Q/\partial x=3x^2$. $\partial P/\partial y=3x^2$. Equal, so $\mathbf F$ is conservative and a potential exists.

---

**Step 3 — Integrate $P$ in $x$.** $\phi = \int 3x^2y\,dx = x^3y + g(y)$.

---

**Step 4 — Match $\partial\phi/\partial y$ to $Q$.** $x^3+g'(y)=x^3+3y^2 \Rightarrow g'(y)=3y^2 \Rightarrow g(y)=y^3$.

$$\phi(x,y)=x^3y+y^3$$

---

**Step 5 — Evaluate.** $\phi(2,1)=8+1=9$. $\phi(0,0)=0$.

$$\boxed{\phi(2,1)-\phi(0,0)=9}$$

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: potential of F = (3x²y, x³+3y²)",
  "steps": [
    {
      "prompt": "Step 1: Name P and Q from F = (3x²y, x³+3y²).",
      "hint": "F = (P, Q), so P is the first component and Q is the second.",
      "answer": "P = 3x²y, Q = x³+3y²"
    },
    {
      "prompt": "Step 2: Test whether F is conservative. What do you compare?",
      "hint": "Compute ∂Q/∂x and ∂P/∂y and check whether they match.",
      "answer": "∂Q/∂x = 3x² and ∂P/∂y = 3x² — equal, so F is conservative.",
      "eqn": "∂Q/∂x = ∂/∂x(x³+3y²) = 3x²;  ∂P/∂y = ∂/∂y(3x²y) = 3x²"
    },
    {
      "prompt": "Step 3: Integrate P = 3x²y with respect to x to start building φ.",
      "hint": "Treat y as constant while integrating in x, and add an unknown function g(y).",
      "answer": "φ = x³y + g(y)",
      "eqn": "∫ 3x²y dx = x³y + g(y)"
    },
    {
      "prompt": "Step 4: Differentiate this φ in y and match it to Q = x³+3y² to find g(y).",
      "hint": "∂φ/∂y = x³ + g'(y). Set this equal to Q, solve for g'(y), then integrate.",
      "answer": "g'(y) = 3y² ⟹ g(y) = y³, so φ(x,y) = x³y + y³",
      "eqn": "x³ + g'(y) = x³ + 3y² ⟹ g'(y) = 3y² ⟹ g(y) = y³"
    },
    {
      "prompt": "Step 5: Evaluate φ(2,1) − φ(0,0).",
      "hint": "Substitute both points into φ = x³y + y³ and subtract.",
      "answer": "φ(2,1) − φ(0,0) = 9 − 0 = 9"
    }
  ],
  "caption": "The last line is only valid because Step 2 confirmed F is conservative — for a non-conservative field the path itself would matter."
}
```
