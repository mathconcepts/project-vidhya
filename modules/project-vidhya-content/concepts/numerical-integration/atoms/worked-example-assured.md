---
# Alternative body for numerical-integration.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-integration.worked_example.assured
concept_id: numerical-integration
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: numerical-integration-worked-example
for_stance: assured
---

## State the two conditions, then the numbers

$n=4$ is even, satisfying Simpson's structural requirement, and $f(x)=(1+x)^{-1}$ has $f^{(4)}(x)=\frac{24}{(1+x)^5}$ continuous on $[0,1]$, maximised at $x=0$ where it equals $24$ — so the $O(h^4)$ bound genuinely applies here, not just nominally.

$$|E|\le\frac{(1)(0.25)^4}{180}(24)\approx0.00052$$

$$\text{Simpson},\,n{=}4:\ 0.693254\qquad \ln2\approx0.693147\qquad|E|=0.000107<0.00052$$

The measured error sits comfortably inside the theoretical bound; the trapezoidal rule at the same $h$ — only $O(h^2)$ — gives an error near $0.0039$, roughly twenty times worse for the same number of evaluations.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Simpson's 1/3 rule for ∫₀¹ 1/(1+x) dx","steps":[{"prompt":"For Simpson's 1/3 rule applied to ∫₀¹ 1/(1+x) dx with n=4, state the step size h and list all five nodes x₀ through x₄.","hint":"h = (b−a)/n = (1−0)/4 = 0.25. The nodes are x_i = 0 + i·h for i = 0, 1, 2, 3, 4.","answer":"h = 0.25; nodes are x₀=0, x₁=0.25, x₂=0.5, x₃=0.75, x₄=1"},{"prompt":"Evaluate f(xᵢ) = 1/(1+xᵢ) at each node and write the Simpson's 1/3 weighted sum [f₀ + 4f₁ + 2f₂ + 4f₃ + f₄].","hint":"f values: 1.0000, 0.8000, 0.6667, 0.5714, 0.5000. Weights for interior nodes alternate 4, 2, 4 (endpoints weight 1 each).","answer":"1.0000 + 4(0.8000) + 2(0.6667) + 4(0.5714) + 0.5000 = 1 + 3.2 + 1.3334 + 2.2857 + 0.5 = 8.3191"},{"prompt":"Complete the approximation and find the absolute error given that the exact value is ln 2 ≈ 0.6931.","hint":"Multiply the weighted sum by h/3 = 0.25/3 ≈ 0.08333. Then |approx − exact| gives the error. Keep more digits than you want in the answer — subtracting two 4dp roundings here doubles the error you report.","answer":"(0.25/3) × 8.3191 ≈ 0.69325; absolute error = |0.69325 − 0.69315| ≈ 0.0001"}]}
```

