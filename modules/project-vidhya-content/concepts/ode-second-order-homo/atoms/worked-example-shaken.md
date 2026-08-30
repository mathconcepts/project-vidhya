---
# Alternative body for ode-second-order-homo.worked-example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: ode-second-order-homo.worked-example.shaken
concept_id: ode-second-order-homo
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: ode-second-order-homo.worked-example
for_stance: shaken
---

## Solve $y''-3y'+2y=0$

**Classify.** Homogeneous, constant coefficients — guess $y=e^{rx}$.

**Solve.** $y'=re^{rx}$, $y''=r^2e^{rx}$. Substituting: $e^{rx}(r^2-3r+2)=0$, so $r^2-3r+2=0$. Factor: $(r-1)(r-2)=0$, giving $r_1=1$, $r_2=2$.

$$\boxed{y=c_1e^{x}+c_2e^{2x}}$$

**Check.** $y'=c_1e^x+2c_2e^{2x}$ and $y''=c_1e^x+4c_2e^{2x}$. Then $y''-3y'+2y=c_1e^x(1-3+2)+c_2e^{2x}(4-6+2)=0$. Holds.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: y'' - 3y' + 2y = 0","steps":[{"prompt":"Step 1: Assume $y = e^{rx}$ and find $y'$ and $y''$.","hint":"Use the chain rule: if $y = e^{rx}$ then $y' = re^{rx}$ and $y'' = r^2 e^{rx}$.","answer":"$y' = re^{rx}$ and $y'' = r^2 e^{rx}$"},{"prompt":"Step 2: Substitute into $y'' - 3y' + 2y = 0$ and factor out $e^{rx}$.","hint":"You should get $e^{rx}(r^2 - 3r + 2) = 0$. Since $e^{rx} \\neq 0$, set the bracket to zero.","answer":"The characteristic equation is $r^2 - 3r + 2 = 0$."},{"prompt":"Step 3: Factor the quadratic $r^2 - 3r + 2 = 0$ to find both roots.","hint":"Look for two numbers that multiply to 2 and add to -3. They are -1 and -2.","answer":"$(r - 1)(r - 2) = 0$, so $r_1 = 1$ and $r_2 = 2$."},{"prompt":"Step 4: Write the general solution for two distinct real roots.","hint":"The formula is $y = c_1 e^{r_1 x} + c_2 e^{r_2 x}$.","answer":"$y = c_1 e^x + c_2 e^{2x}$"}],"caption":"Key exam insight: characteristic equation → roots → general solution. The formula structure is the same for all second-order homogeneous ODEs."}
```

The whole method in one line: turn $y=e^{rx}$ into an algebra problem, then read the answer off the roots.
