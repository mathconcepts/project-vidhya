---
# Alternative body for numerical-integration.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: numerical-integration.worked_example.shaken
concept_id: numerical-integration
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: numerical-integration-worked-example
for_stance: shaken
---

$n=4$ is even — Simpson's 1/3 rule needs that before anything else runs. Step size: $h=\frac{1-0}{4}=0.25$.

$$i=0:\ x_0=0,\quad f(x_0)=\frac{1}{1+0}=1.0000$$

$$i=1:\ x_1=0.25,\quad f(x_1)=\frac{1}{1.25}=0.8000$$

Two nodes down, three left. The remaining $f(x_2),f(x_3),f(x_4)$ combine with these under the same weight pattern, $\frac{h}{3}[1,4,2,4,1]$, giving the full estimate $\approx0.693254$ against the exact $\ln2\approx0.693147$ — a gap of only $0.000107$. Subtract before you round, not after.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Simpson's 1/3 rule for ∫₀¹ 1/(1+x) dx","steps":[{"prompt":"For Simpson's 1/3 rule applied to ∫₀¹ 1/(1+x) dx with n=4, state the step size h and list all five nodes x₀ through x₄.","hint":"h = (b−a)/n = (1−0)/4 = 0.25. The nodes are x_i = 0 + i·h for i = 0, 1, 2, 3, 4.","answer":"h = 0.25; nodes are x₀=0, x₁=0.25, x₂=0.5, x₃=0.75, x₄=1"},{"prompt":"Evaluate f(xᵢ) = 1/(1+xᵢ) at each node and write the Simpson's 1/3 weighted sum [f₀ + 4f₁ + 2f₂ + 4f₃ + f₄].","hint":"f values: 1.0000, 0.8000, 0.6667, 0.5714, 0.5000. Weights for interior nodes alternate 4, 2, 4 (endpoints weight 1 each).","answer":"1.0000 + 4(0.8000) + 2(0.6667) + 4(0.5714) + 0.5000 = 1 + 3.2 + 1.3334 + 2.2857 + 0.5 = 8.3191"},{"prompt":"Complete the approximation and find the absolute error given that the exact value is ln 2 ≈ 0.6931.","hint":"Multiply the weighted sum by h/3 = 0.25/3 ≈ 0.08333. Then |approx − exact| gives the error. Keep more digits than you want in the answer — subtracting two 4dp roundings here doubles the error you report.","answer":"(0.25/3) × 8.3191 ≈ 0.69325; absolute error = |0.69325 − 0.69315| ≈ 0.0001"}]}
```

