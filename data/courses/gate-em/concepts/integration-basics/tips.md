# Teaching Tips: Integration Basics

## Common Student Errors

- **Forgetting the $+C$:** The indefinite integral ALWAYS has an arbitrary constant. This represents all antiderivatives.
- **Power rule off by one:** Students write $\int x^n dx = x^n + C$ instead of $x^{n+1}/(n+1) + C$.
- **Wrong trig integrals:** Students mix up $\sin$ and $\cos$ (which goes negative).

## GATE Question Pattern

GATE asks: compute $\int f(x) dx$ using the power rule or standard formulas (MCQ or NAT). Often 1–2 marks. Combined with initial conditions ("if $F(0) = k$, find $F(a)$").

## Speed Tricks for MCQs

- **Power rule instant:** $\int x^n = x^{n+1}/(n+1) + C$ — just increase the exponent, divide by new exponent.
- **Memorize key integrals:** $e^x$, $1/x = \ln|x|$, $\sin \to -\cos$, $\cos \to \sin$.
- **Constant rule:** $\int k \, dx = kx + C$.

## Must-Memorize Formulas / Results

- **Power rule:** $\int x^n \, dx = \frac{x^{n+1}}{n+1} + C$ (for $n \neq -1$)
- **Exponential:** $\int e^x \, dx = e^x + C$, $\int a^x \, dx = \frac{a^x}{\ln(a)} + C$
- **Logarithm:** $\int \frac{1}{x} \, dx = \ln|x| + C$
- **Trigonometric:** $\int \sin(x) \, dx = -\cos(x) + C$, $\int \cos(x) \, dx = \sin(x) + C$
