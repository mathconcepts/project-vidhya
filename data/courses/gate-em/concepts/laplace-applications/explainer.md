# Laplace Applications

> GATE Engineering Mathematics | Transform Theory | high frequency | difficulty: 0.6

## Intuition First

The Laplace transform's true power emerges when applied to real problems: solving differential equations (the backbone of circuits and control systems), analyzing system stability (poles tell the story), and computing convolution effortlessly. Instead of solving ODEs by hand (messy, error-prone), transform them to algebra, solve, and inverse-transform back. It's like changing the coordinate system to make a hard problem simple.

## Core Definition

**Laplace Method for Solving ODEs**: To solve an ODE like $\frac{d^2y}{dt^2} + 3\frac{dy}{dt} + 2y = f(t)$ with initial conditions $y(0) = y_0, y'(0) = y_1$:

1. **Transform:** Take the Laplace transform of both sides.
2. **Substitute initial conditions:** Use $\mathcal{L}\{y'\} = sY(s) - y(0)$ and $\mathcal{L}\{y''\} = s^2Y(s) - sy(0) - y'(0)$.
3. **Solve algebraically:** Rearrange to get $Y(s) = \frac{\text{[numerator]}}{\text{[denominator]}}$ (a rational function).
4. **Inverse transform:** Use partial fractions to decompose $Y(s)$ and match standard pairs.

**Convolution Theorem**: If $y(t) = \int_0^t x(\tau) h(t-\tau) d\tau$ (convolution of input and impulse response), then in the $s$-domain:

$$Y(s) = X(s) \cdot H(s)$$

Multiplication in the $s$-domain corresponds to convolution in the time domain. This is profound: complex time-domain operations become simple $s$-domain multiplication.

**Geometric interpretation:** Solving an ODE via Laplace is a coordinate transformation: the time-domain ODE (a differential equation) becomes an algebraic equation in $s$-space (multiplication and addition), which is trivial. Poles of $Y(s)$ encode the system's natural response modes (exponentials and sinusoids); their locations dictate stability.

## What Happens (Worked Example)

**Example**: Solve the ODE $y'' + 3y' + 2y = 0$ with $y(0) = 1, y'(0) = 0$.

**What happens:**

Take the Laplace transform of both sides:
$$\mathcal{L}\{y'' + 3y' + 2y\} = \mathcal{L}\{0\}$$

Using the linearity and derivative properties:
$$[s^2 Y(s) - s \cdot 1 - 0] + 3[sY(s) - 1] + 2Y(s) = 0$$

Collect terms:
$$s^2 Y(s) - s + 3sY(s) - 3 + 2Y(s) = 0$$
$$(s^2 + 3s + 2)Y(s) = s + 3$$

Solve for $Y(s)$:
$$Y(s) = \frac{s+3}{s^2 + 3s + 2} = \frac{s+3}{(s+1)(s+2)}$$

Partial fractions:
$$\frac{s+3}{(s+1)(s+2)} = \frac{A}{s+1} + \frac{B}{s+2}$$

At $s = -1$: $2 = A(1) \Rightarrow A = 2$  
At $s = -2$: $1 = B(-1) \Rightarrow B = -1$

So: $Y(s) = \frac{2}{s+1} - \frac{1}{s+2}$

Inverse transform:
$$y(t) = 2e^{-t} - e^{-2t}, \quad t \geq 0$$

**Why it works:**

The Laplace transform converts the differential operator $\frac{d}{dt}$ into multiplication by $s$. Initial conditions are automatically incorporated. The resulting algebraic problem (factoring and partial fractions) is elementary compared to solving the ODE directly. The two poles at $s = -1$ and $s = -2$ (both in the left half-plane) guarantee that $y(t) \to 0$ as $t \to \infty$—the system is stable and decays to equilibrium.

## GATE MA Relevance

> **Why it matters in GATE MA:** Laplace applications appear in 8–12% of GATE papers. Problems typically combine ODE solving, system response analysis (step response, impulse response, frequency response), transfer-function calculation, and stability determination. This is the nexus where GATE testing bridges mathematics into engineering: circuits, control systems, and signal processing all pivot on Laplace-based analysis.
