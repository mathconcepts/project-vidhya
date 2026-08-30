---
# Alternative body for laplace-applications.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: laplace-applications.worked-example.assured
concept_id: laplace-applications
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: laplace-applications.worked-example
for_stance: assured
---

$L=1,R=2,V=10$ step, $i(0)=0$ gives $I(s)=\dfrac{10}{s(s+2)}=\dfrac{5}{s}-\dfrac{5}{s+2}$ by cover-up — skip re-deriving $\frac{di}{dt}+\frac{R}{L}i=\frac{V}{L}$ once it is automatic.

$$i(t)=5(1-e^{-2t})\ \text{A}$$

The number worth checking isn't the algebra, it's the physical read: steady-state current is $V/R=5$ A by Ohm's law alone, and the time constant $\tau=L/R=0.5$ s is the coefficient of $t$ in the exponent — $e^{-2t}=e^{-t/\tau}$, not $e^{-Rt}$ and not $e^{-t/L}$. Matching the exponent's coefficient to $1/\tau$, not to $R$ or $L$ in isolation, is the fast sanity check on the whole derivation.

Final-value theorem confirms it without inverting anything: $\lim_{s\to0}sI(s)=\lim_{s\to0}\dfrac{10}{s+2}=5$ — valid here since the only pole of $sI(s)$, at $s=-2$, sits in the left half-plane.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: RL step response","steps":[{"prompt":"Step 1: Write the differential equation from Kirchhoff's voltage law. What is the general form for an RL circuit?","hint":"Apply KVL: voltage across inductor + voltage across resistor = applied voltage. Voltage across L is L(di/dt), voltage across R is Ri.","answer":"L(di/dt) + Ri = V(t), which simplifies to di/dt + 2i = 10 after dividing by L=1"},{"prompt":"Step 2: Transform to s-domain. What happens to the derivative di/dt?","hint":"The Laplace transform of a derivative is sI(s) minus the initial condition. Since i(0)=0, we get sI(s).","answer":"sI(s) + 2I(s) = 10/s, leading to I(s) = 10/[s(s+2)]"},{"prompt":"Step 3: Use partial fractions to decompose 10/[s(s+2)]. What are A and B?","hint":"Write 10/[s(s+2)] = A/s + B/(s+2). Substitute s=0 and s=-2 to find A and B.","answer":"A = 5 (from s=0: 10=2A) and B = -5 (from s=-2: 10=-2B), so I(s) = 5/s - 5/(s+2)"}],"caption":"Key exam insight: The exponential decay rate (coefficient 2) comes directly from the RC time constant L/R."}
```
