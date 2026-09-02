---
# Alternative body for vector-fields.worked-example, served when the learner
# stance is `assured`. Terse, assumes the mechanics, spends its words on the
# distinction that costs marks rather than re-teaching the procedure.
id: vector-fields.worked-example.assured
concept_id: vector-fields
atom_type: worked_example
bloom_level: 3
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
variant_of: vector-fields.worked-example
for_stance: assured
---

**Problem:** $\mathbf F(x,y)=(3x^2y,\ x^3+3y^2)$. Find $\phi$ and evaluate $\phi(2,1)-\phi(0,0)$.

**By inspection.** $\partial Q/\partial x=\partial P/\partial y=3x^2$ — conservative. Recognizing $3x^2y \leftrightarrow x^3y$ and $3y^2\leftrightarrow y^3$ directly gives

$$\boxed{\phi(x,y)=x^3y+y^3,\quad \phi(2,1)-\phi(0,0)=9-0=9}$$

**Worth knowing.** Pattern-matching the antiderivative is only safe *after* the mixed-partials check passes — guessing a plausible-looking $\phi$ for a field that fails the test produces a potential that reproduces neither partial derivative correctly, and nothing in the guess itself flags the error.

This number is not a coincidence of this one field: because $\mathbf F$ is conservative, $\phi(2,1)-\phi(0,0)$ equals $\int_C \mathbf F\cdot d\mathbf r$ along *any* path from $(0,0)$ to $(2,1)$ — a path-independence fact that turns a line-integral computation into two function evaluations.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: potential of F = (3x²y, x³+3y²)",
  "steps": [
    {
      "prompt": "Step 1: Confirm F = (3x²y, x³+3y²) is conservative.",
      "hint": "∂Q/∂x and ∂P/∂y should match.",
      "answer": "∂Q/∂x = 3x² and ∂P/∂y = 3x² — equal, so F is conservative.",
      "eqn": "∂Q/∂x = ∂/∂x(x³+3y²) = 3x²;  ∂P/∂y = ∂/∂y(3x²y) = 3x²"
    },
    {
      "prompt": "Step 2: Recognize the antiderivative pattern for φ.",
      "hint": "3x²y is the x-derivative of x³y; 3y² is the y-derivative of y³.",
      "answer": "φ = x³y + g(y)",
      "eqn": "∫ 3x²y dx = x³y + g(y)"
    },
    {
      "prompt": "Step 3: Pin down g(y) by matching ∂φ/∂y to Q.",
      "hint": "∂φ/∂y = x³ + g'(y) must equal x³+3y².",
      "answer": "g'(y) = 3y² ⟹ g(y) = y³, so φ(x,y) = x³y + y³",
      "eqn": "x³ + g'(y) = x³ + 3y² ⟹ g'(y) = 3y² ⟹ g(y) = y³"
    },
    {
      "prompt": "Step 4: Evaluate φ(2,1) − φ(0,0).",
      "hint": "Substitute and subtract.",
      "answer": "φ(2,1) − φ(0,0) = 9 − 0 = 9"
    }
  ],
  "caption": "Conservative ⇒ path-independent: this same number is the line integral of F along any path from (0,0) to (2,1)."
}
```
