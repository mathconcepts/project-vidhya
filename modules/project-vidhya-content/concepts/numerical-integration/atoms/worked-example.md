---
id: numerical-integration.worked-example
concept_id: numerical-integration
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Using Simpson's 1/3 rule with $n=4$, approximate $\int_0^1\frac{dx}{1+x}$; compare against the exact value.

---

**Step 1 — Nodes.** $h=\frac{1-0}{4}=0.25$. $f(x_i)$: $x_0=0\!\to\!1.0000$, $x_1=0.25\!\to\!0.8000$, $x_2=0.5\!\to\!0.6667$, $x_3=0.75\!\to\!0.5714$, $x_4=1\!\to\!0.5000$.

---

**Step 2 — Apply the formula.**
$$\int_0^1\frac{dx}{1+x}\approx\frac{0.25}{3}\bigl[1.0000+4(0.8000)+2(0.6667)+4(0.5714)+0.5000\bigr]=\frac{0.25}{3}(8.3191)\approx0.6933$$

---

**Step 3 — Compare with the exact value.** $\int_0^1\frac{dx}{1+x}=\ln2\approx0.6931$.

$$\boxed{\text{Absolute error}=|0.6933-0.6931|\approx0.000107}$$

---

**Verification against the theoretical bound.** $f^{(4)}(x)=\frac{24}{(1+x)^5}$, maximized at $x=0$ where it equals $24$: $|E|\le\frac{1\cdot0.25^4}{180}(24)\approx0.00052$. The measured error $0.000107$ sits comfortably inside this bound — carry extra digits through the subtraction and round only the final error, since rounding both numbers to 4dp first before subtracting can double what you report.

**GATE tip:** the trapezoidal rule at the same $h$ gives an error of about $0.0039$ — roughly 20× larger, for the same four function evaluations.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Simpson's 1/3 rule for ∫₀¹ 1/(1+x) dx","steps":[{"prompt":"For Simpson's 1/3 rule applied to ∫₀¹ 1/(1+x) dx with n=4, state the step size h and list all five nodes x₀ through x₄.","hint":"h = (b−a)/n = (1−0)/4 = 0.25. The nodes are x_i = 0 + i·h for i = 0, 1, 2, 3, 4.","answer":"h = 0.25; nodes are x₀=0, x₁=0.25, x₂=0.5, x₃=0.75, x₄=1"},{"prompt":"Evaluate f(xᵢ) = 1/(1+xᵢ) at each node and write the Simpson's 1/3 weighted sum [f₀ + 4f₁ + 2f₂ + 4f₃ + f₄].","hint":"f values: 1.0000, 0.8000, 0.6667, 0.5714, 0.5000. Weights for interior nodes alternate 4, 2, 4 (endpoints weight 1 each).","answer":"1.0000 + 4(0.8000) + 2(0.6667) + 4(0.5714) + 0.5000 = 1 + 3.2 + 1.3334 + 2.2857 + 0.5 = 8.3191"},{"prompt":"Complete the approximation and find the absolute error given that the exact value is ln 2 ≈ 0.6931.","hint":"Multiply the weighted sum by h/3 = 0.25/3 ≈ 0.08333. Then |approx − exact| gives the error. Keep more digits than you want in the answer — subtracting two 4dp roundings here doubles the error you report.","answer":"(0.25/3) × 8.3191 ≈ 0.69325; absolute error = |0.69325 − 0.69315| ≈ 0.0001"}]}
```
