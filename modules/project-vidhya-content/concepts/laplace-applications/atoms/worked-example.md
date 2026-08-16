---
id: laplace-applications.worked-example
concept_id: laplace-applications
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# RL Circuit Step Response: Solving with Laplace

**Problem (GATE-style):**
An RL circuit has $R = 2\,\Omega$, $L = 1\,\text{H}$, and is driven by a step voltage $V(t) = 10\,\text{V}$ for $t \geq 0$. Find the current $i(t)$ for $t > 0$ given $i(0) = 0$.

## Solution

**Step 1: Write the circuit equation**

Applying Kirchhoff's voltage law:
$$L\frac{di}{dt} + Ri = V(t)$$
$$\frac{di}{dt} + 2i = 10$$

**Step 2: Take the Laplace transform**

Applying the transform to both sides (using $\mathcal{L}\{i'\} = sI(s) - i(0)$ with $i(0) = 0$):
$$sI(s) + 2I(s) = \frac{10}{s}$$
$$(s + 2)I(s) = \frac{10}{s}$$
$$I(s) = \frac{10}{s(s+2)}$$

**Step 3: Use partial fractions**

$$\frac{10}{s(s+2)} = \frac{A}{s} + \frac{B}{s+2}$$

Multiplying both sides by $s(s+2)$:
$$10 = A(s+2) + Bs$$

- At $s = 0$: $10 = 2A \Rightarrow A = 5$
- At $s = -2$: $10 = -2B \Rightarrow B = -5$

$$I(s) = \frac{5}{s} - \frac{5}{s+2}$$

**Step 4: Take the inverse Laplace transform**

Using standard transform pairs: $\mathcal{L}^{-1}\{\frac{1}{s}\} = 1$ and $\mathcal{L}^{-1}\{\frac{1}{s+a}\} = e^{-at}$:

$$i(t) = 5 - 5e^{-2t} = 5(1 - e^{-2t})\,\text{A}$$

## Interpretation

The current rises from $0$ A at $t=0$ toward the steady-state value of $\frac{V}{R} = \frac{10}{2} = 5$ A as the exponential term $e^{-2t}$ decays to zero. The time constant is $\tau = \frac{L}{R} = \frac{1}{2} = 0.5$ s, so the circuit reaches about 63% of steady-state in half a second.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: RL step response","steps":[{"prompt":"Step 1: Write the differential equation from Kirchhoff's voltage law. What is the general form for an RL circuit?","hint":"Apply KVL: voltage across inductor + voltage across resistor = applied voltage. Voltage across L is L(di/dt), voltage across R is Ri.","answer":"L(di/dt) + Ri = V(t), which simplifies to di/dt + 2i = 10 after dividing by L=1"},{"prompt":"Step 2: Transform to s-domain. What happens to the derivative di/dt?","hint":"The Laplace transform of a derivative is sI(s) minus the initial condition. Since i(0)=0, we get sI(s).","answer":"sI(s) + 2I(s) = 10/s, leading to I(s) = 10/[s(s+2)]"},{"prompt":"Step 3: Use partial fractions to decompose 10/[s(s+2)]. What are A and B?","hint":"Write 10/[s(s+2)] = A/s + B/(s+2). Substitute s=0 and s=-2 to find A and B.","answer":"A = 5 (from s=0: 10=2A) and B = -5 (from s=-2: 10=-2B), so I(s) = 5/s - 5/(s+2)"}],"caption":"Key exam insight: The exponential decay rate (coefficient 2) comes directly from the RC time constant L/R."}
```

---

**Summary of atoms created:**

1. **intuition.md** - Explains how Laplace transforms convert calculus problems to algebra, with exam strategy tips
2. **visual-analogy.md** - Uses damped oscillation as an analogy, with animated GIF showing exponential decay
3. **worked-example.md** - Complete GATE-style RL circuit problem with step-by-step solution and guided walkthrough
