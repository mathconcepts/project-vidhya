---
id: numerical-error-analysis.intuition
concept_id: numerical-error-analysis
atom_type: intuition
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
---

# Understanding Error: How Wrong, and Wrong Compared to What?

Every numerical computation works with approximations — a measured length, a truncated decimal, a value read off an instrument. **Error analysis** is about tracking exactly how far an approximation strays from the true value, and how that gap grows or shrinks as you do arithmetic with it.

## Three Key Ideas

**Absolute vs. relative error**: If $x_t$ is the true value and $x_a$ is the approximation, the **absolute error** $E_a = |x_t - x_a|$ tells you the raw gap — but the same absolute error means very different things depending on the size of $x_t$. A 1 cm error measuring a 10 m beam is trivial; a 1 cm error measuring a 2 cm bolt is a disaster. The **relative error** $E_r = \frac{|x_t - x_a|}{|x_t|}$ fixes this by normalizing against the true value's size, and multiplying by 100 gives the **percentage error**.

**Rounding vs. truncation error**: These are two *different sources* of error, often confused. **Rounding error** comes from representing a number with only finitely many digits — chopping 3.14159... down to 3.1416 by rounding the last kept digit. **Truncation error** comes from cutting short an infinite or iterative mathematical process — stopping a Taylor series after a few terms, or stopping an iterative root-finder after $n$ steps. One is about *representation*; the other is about *approximating a process*.

**Error propagation**: When you combine two approximate quantities arithmetically, their errors combine too — and the rule depends on the operation. For **addition/subtraction**, absolute errors add (in the worst case, they don't cancel — even when subtracting). For **multiplication/division**, it's the *relative* errors that approximately add. Knowing which rule applies tells you how "noisy" a derived quantity will be, given how noisy its inputs are.

## Why It Matters for GATE

Numerical methods problems — root-finding, interpolation, numerical integration — all depend on quantifying how much error an approximation carries and how that error compounds through further computation. Misreading the error type or forgetting to propagate it correctly is one of the most common sources of lost marks in this topic.

---
