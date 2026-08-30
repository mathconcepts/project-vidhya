---
# Alternative body for laplace-applications.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: laplace-applications.worked-example.shaken
concept_id: laplace-applications
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: laplace-applications.worked-example
for_stance: shaken
---

KVL gives $L\dfrac{di}{dt}+Ri=V(t)$. With $L=1$, $R=2$, $V=10$:

$$\frac{di}{dt}+2i=10$$

Transform, using $\mathcal L\{i'\}=sI(s)-i(0)$ and $i(0)=0$:

$$sI(s)+2I(s)=\frac{10}{s}\ \Longrightarrow\ I(s)=\frac{10}{s(s+2)}$$

Partial fractions: $\dfrac{10}{s(s+2)}=\dfrac{A}{s}+\dfrac{B}{s+2}$. Multiply through: $10=A(s+2)+Bs$.

At $s=0$: $10=2A\Rightarrow A=5$. At $s=-2$: $10=-2B\Rightarrow B=-5$.

$$I(s)=\frac{5}{s}-\frac{5}{s+2}$$

Invert term by term with $\mathcal L^{-1}\{1/s\}=1$ and $\mathcal L^{-1}\{1/(s+a)\}=e^{-at}$:

$$i(t)=5-5e^{-2t}=5(1-e^{-2t})\ \text{A}$$

Check it: at $t=0$, $i(0)=5-5=0$ — matches the given initial condition. As $t\to\infty$, $i(t)\to5$ A, the expected steady current $V/R=10/2$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: RL step response","steps":[{"prompt":"Step 1: Write the differential equation from Kirchhoff's voltage law. What is the general form for an RL circuit?","hint":"Apply KVL: voltage across inductor + voltage across resistor = applied voltage. Voltage across L is L(di/dt), voltage across R is Ri.","answer":"L(di/dt) + Ri = V(t), which simplifies to di/dt + 2i = 10 after dividing by L=1"},{"prompt":"Step 2: Transform to s-domain. What happens to the derivative di/dt?","hint":"The Laplace transform of a derivative is sI(s) minus the initial condition. Since i(0)=0, we get sI(s).","answer":"sI(s) + 2I(s) = 10/s, leading to I(s) = 10/[s(s+2)]"},{"prompt":"Step 3: Use partial fractions to decompose 10/[s(s+2)]. What are A and B?","hint":"Write 10/[s(s+2)] = A/s + B/(s+2). Substitute s=0 and s=-2 to find A and B.","answer":"A = 5 (from s=0: 10=2A) and B = -5 (from s=-2: 10=-2B), so I(s) = 5/s - 5/(s+2)"}],"caption":"Key exam insight: The exponential decay rate (coefficient 2) comes directly from the RC time constant L/R."}
```
