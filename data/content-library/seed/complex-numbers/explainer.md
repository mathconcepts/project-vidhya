# Complex numbers

## Intuition

Real numbers live on a line. Complex numbers live on a plane.

The imaginary unit $i$ is defined by $i^2 = -1$. A **complex number** is any number of the form $z = a + bi$ where $a, b$ are real. The "real part" is $a$, the "imaginary part" is $b$. When you plot $z = a + bi$ as the point $(a, b)$, you get the **complex plane**.

This one trick — treating numbers as 2-D rather than 1-D — unlocks a remarkable amount of mathematics. Rotations become multiplication; oscillations become exponentials; polynomial roots always exist.

## Three ways to represent the same number

The complex number $z$ can be written in three equivalent forms:

### Rectangular form

$$
z = a + bi
$$

Cartesian — $a$ is the horizontal coordinate, $b$ is the vertical.

### Polar form

$$
z = r(\cos\theta + i\sin\theta)
$$

Where $r = |z| = \sqrt{a^2 + b^2}$ is the distance from the origin, and $\theta = \arg(z) = \arctan(b/a)$ is the angle from the positive real axis.

### Euler form

$$
z = re^{i\theta}
$$

This is the same as polar form, using Euler's identity: $e^{i\theta} = \cos\theta + i\sin\theta$. This form makes multiplication and powers very clean.

## Why the three forms matter

Different operations are easy in different forms:

| Operation | Easiest form |
|---|---|
| Addition, subtraction | Rectangular |
| Multiplication, division | Euler (or polar) |
| Raising to a power | Euler |
| Extracting real/imaginary parts | Rectangular |

For example, multiplying in Euler form: $(r_1 e^{i\theta_1})(r_2 e^{i\theta_2}) = r_1 r_2 e^{i(\theta_1 + \theta_2)}$. The magnitudes multiply; the angles add. This is rotation-and-scaling.

## De Moivre's theorem

A direct consequence of Euler form:

$$
(r e^{i\theta})^n = r^n e^{in\theta}
$$

Or equivalently, $[r(\cos\theta + i\sin\theta)]^n = r^n(\cos n\theta + i\sin n\theta)$. This is one of the most-tested complex-number results on BITSAT and JEE Main.

## Euler's identity

Setting $r = 1$ and $\theta = \pi$:

$$
e^{i\pi} + 1 = 0
$$

Five of the most important constants in mathematics ($0, 1, i, \pi, e$) in one equation. Not a computational tool per se, but a touchstone for understanding why complex exponentials are the natural language for rotation.

## Why this matters for your exam

**BITSAT / JEE Main**: Complex numbers are a major topic. Expect 2-3 questions in BITSAT, 2-4 in JEE Main. Common question types:
- Finding nth roots (use Euler form)
- Evaluating $z^n$ for large $n$ (use De Moivre's)
- Converting between forms
- Locus problems: "$|z - 1| = 2$ traces what curve?" (a circle)

**UGEE**: Fewer complex-number questions, but the ones that appear reward conceptual understanding — e.g. "show that multiplication by $i$ is a 90° rotation."

## Common mistakes

1. **Using $\arctan$ without thinking about quadrants.** For $z = -1 - i$, $\arctan(b/a) = \arctan(1) = \pi/4$, but the actual angle is in the third quadrant: $-3\pi/4$ (or equivalently $5\pi/4$). Always sketch the complex plane.
2. **Forgetting $i^2 = -1$ in algebra.** When expanding $(a + bi)(c + di)$, the $bd \cdot i^2$ term becomes $-bd$, not $bd$.
3. **Taking "complex conjugate" to mean something other than flipping the imaginary part.** $\overline{z} = a - bi$, always. And $z \cdot \overline{z} = |z|^2$.

See [`worked-example.md`](./worked-example.md) for De Moivre's in action.
