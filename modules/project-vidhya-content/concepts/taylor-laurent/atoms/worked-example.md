---
id: taylor-laurent.worked-example
concept_id: taylor-laurent
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

## Worked Example: Laurent Series & Singularity Classification

**Problem** (GATE-style)

Find the Laurent series expansion of $f(z) = \frac{z}{(z-1)(z-2)}$ valid in the annulus $1 < |z| < 2$, and classify the singularities.

---

## Solution

**Step 1: Partial Fraction Decomposition**

Write:
$$\frac{z}{(z-1)(z-2)} = \frac{A}{z-1} + \frac{B}{z-2}$$

Multiplying both sides by $(z-1)(z-2)$:
$$z = A(z-2) + B(z-1)$$

- Set $z=1$: $1 = A(1-2) = -A \Rightarrow A = -1$
- Set $z=2$: $2 = B(2-1) = B \Rightarrow B = 2$

Therefore:
$$f(z) = \frac{-1}{z-1} + \frac{2}{z-2}$$

**Step 2: Expand Each Term for $1 < |z| < 2$**

*For the first term* $\frac{-1}{z-1}$: Since $|z| > 1$,
$$\frac{-1}{z-1} = \frac{-1}{z(1-1/z)} = \frac{-1}{z} \cdot \sum_{n=0}^{\infty} \frac{1}{z^n} = \sum_{n=1}^{\infty} \frac{-1}{z^n}$$

This gives the **principal part** (negative powers).

*For the second term* $\frac{2}{z-2}$: Since $|z| < 2$,
$$\frac{2}{z-2} = \frac{-2}{2-z} = -2 \cdot \frac{1}{2} \cdot \frac{1}{1-z/2} = -1 \cdot \sum_{n=0}^{\infty} \left(\frac{z}{2}\right)^n = -\sum_{n=0}^{\infty} \frac{z^n}{2^n}$$

This gives the **regular part** (non-negative powers).

**Step 3: Combine the Laurent Series**

$$f(z) = \sum_{n=1}^{\infty} \frac{-1}{z^n} - \sum_{n=0}^{\infty} \frac{z^n}{2^n}$$

Explicitly:
$$f(z) = \underbrace{\cdots + \frac{-1}{z^2} + \frac{-1}{z}}_{\text{principal part}} - 1 - \frac{z}{2} - \frac{z^2}{4} - \cdots$$

**Step 4: Singularity Classification**

- **At $z=1$**: The principal part $\sum_{n=1}^{\infty} \frac{-1}{z^n}$ has **one negative power** $(n=1)$. This is a **pole of order 1** (simple pole). The residue is $a_{-1} = -1$.
- **At $z=2$**: Not visible in this expansion (it's outside the annulus), but if we expanded for $|z|>2$, it would appear as a pole of order 1 with residue $+2$.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Laurent expansion in annulus","steps":[{"prompt":"Step 1: Why do we expand $\\frac{-1}{z-1}$ using $|z|>1$ but $\\frac{2}{z-2}$ using $|z|<2$?","hint":"The annulus is $1 < |z| < 2$. For the singularity at $z=1$, we need $|z|$ larger than 1. For the singularity at $z=2$, we need $|z|$ smaller than 2.","answer":"In the annulus $1 < |z| < 2$, the pole at $z=1$ is inside our region, so we expand $\\frac{1}{z-1}$ using the geometric series for $|z| > |1|$. The pole at $z=2$ is outside, so we expand $\\frac{1}{z-2}$ using the geometric series for $|z| < |2|$. Different regions, different series forms."},{"prompt":"Step 2: The principal part is $\\sum_{n=1}^\\infty \\frac{-1}{z^n}$. How many poles (and of what order) does this indicate at $z=0$?","hint":"Count the highest negative power in the principal part. If there are finitely many terms with $z^{-n}$ for $n \\geq 1$, that's a pole.","answer":"One negative power: $z^{-1}$. This indicates a **simple pole** (pole of order 1) at $z=1$ (the center of expansion). The residue $a_{-1} = -1$ is what we extract for the residue theorem."},{"prompt":"Step 3: If we instead expanded in the annulus $|z| > 2$, both singularities would appear as negative powers. Would the pole at $z=2$ have order 1 or higher?","hint":"Apply partial fractions again: the $\\frac{2}{z-2}$ term would appear as $\\frac{2}{z(1-2/z)}$ for $|z|>2$. Expand to find how many negative powers appear.","answer":"Expanding for $|z|>2$: $\\frac{2}{z-2} = \\frac{2}{z}\\cdot\\frac{1}{1-2/z} = \\frac{2}{z}\\sum \\frac{2^n}{z^n} = \\sum \\frac{2^{n+1}}{z^{n+1}}$. Only one negative power ($z^{-1}$ from the leading term), so it's also a **simple pole** with residue $+2$."}],"caption":"Key insight: The principal part structure (negative powers) instantly tells you the singularity type and residue without further calculation."}
```
```

---

## Key Takeaway

The Laurent expansion **automatically encodes singularity classification**:
- **Removable singularity**: principal part is zero ($a_{-n}=0$ for all $n>0$)
- **Pole of order $m$**: exactly $m$ negative powers, highest is $a_{-m}$
- **Essential singularity**: infinitely many negative powers

For GATE residue theorem problems, extract $a_{-1}$ from the principal part—no further computation needed.
```
