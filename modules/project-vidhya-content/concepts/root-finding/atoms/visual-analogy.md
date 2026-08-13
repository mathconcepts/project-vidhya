---
id: root-finding-visual-analogy
concept_id: root-finding
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# The Hot-Cold Game

Imagine you are blindfolded, searching for a hidden coin on a number line. Your only tool is a thermometer that reads "hot" when you are near the coin and "cold" when you are far.

---

## Bisection = Systematic Halving

Every time you guess a position, a friend tells you **"left"** or **"right"** — nothing more. The optimal strategy is to always guess the **midpoint** of the remaining search interval.

- Start: coin is somewhere in $[a, b]$. Width = $b - a$.
- Guess midpoint $c = (a+b)/2$. Friend says "left" → new interval $[a, c]$.
- Width halved: $(b-a)/2$. Guess midpoint again. Repeat.

This is exactly the bisection method: each step asks **"does $f$ change sign on the left half or the right half?"** and discards the half with no sign change.

**The cost:** after $n$ guesses, uncertainty is $(b-a)/2^n$. To locate the coin to within $10^{-6}$ starting from a window of width 1, you need $n \geq 20$ guesses. Guaranteed, but slow.

---

## Newton-Raphson = Reading the Slope

Now imagine the thermometer can also tell you **how steeply** the temperature is rising or falling. Instead of blindly bisecting, you extrapolate: "if the slope stays constant, the zero is about *here*." You jump straight to that predicted zero.

$$\text{predicted zero} = x_n - \frac{f(x_n)}{f'(x_n)}$$

When the function is nearly linear near the root, this leap is almost perfect, and you converge in just 3–5 steps. When the function curves sharply, a single Newton step can overshoot — the slope tip gives you a bad forecast — so you may need a good starting point.

---

## Visual: $f(x) = x^3 - x - 2$

The curve below crosses the $x$-axis near $x \approx 1.52$. Notice:

- **Bisection** would bracket $[1, 2]$, then $[1, 1.5]$, then $[1.5, 1.75]$, … creeping toward the root.
- **Newton-Raphson** at $x_0 = 2$ jumps to $x_1 = 2 - 4/11 \approx 1.636$, then $x_2 \approx 1.524$ — essentially done in two steps.

```gif-scene
{
  "type": "function-trace",
  "expression": "x^3 - x - 2",
  "x_range": [-2, 3],
  "y_range": [-5, 5],
  "label": "f(x)=x³−x−2: root near x≈1.52"
}
```

---

## Analogy Map

| Bisection | Newton-Raphson |
|---|---|
| "Left or right?" only | "Slope tells you where to jump" |
| Linear convergence — halves error | Quadratic — squares the error each step |
| Always works if bracket valid | Needs good start; can diverge |
| Needs only sign of $f$ | Needs $f$ and $f'$ |
| Hot-cold with no thermometer slope | Hot-cold with slope readout |

**Takeaway:** Bisection is the cautious, guaranteed searcher. Newton-Raphson is the aggressive, fast searcher that trusts the slope — and usually wins.
