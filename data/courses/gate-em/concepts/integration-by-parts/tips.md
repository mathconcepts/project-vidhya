# Teaching Tips: Integration by Parts

## Common Student Errors

- **Wrong u choice:** Students choose exponential as $u$ when polynomial should be $u$ (LIATE rule).
- **Forgetting the minus:** The formula is $uv - \int v du$, not $uv + \int v du$.
- **Not simplifying before reapplying:** Students get stuck in loops when reapplying by-parts to the same integral.

## GATE Question Pattern

GATE asks: evaluate $\int f(x) g(x) dx$ by parts (MCQ or NAT). Typical: $x e^x$, $x \sin(x)$, $\ln(x)$. Often 2 marks. Sometimes requires two applications or solving recursively (like $e^x \cos(x)$).

## Speed Tricks for MCQs

- **LIATE priority:** Log, Inverse trig, Algebraic, Trig, Exponential — choose $u$ in this order.
- **Simpler-when-differentiated rule:** Pick $u$ to be a function that gets simpler when you differentiate it.
- **Recursive case:** If you get $\int e^x \cos(x)$ type integrals, you'll reapply by-parts and solve algebraically.

## Must-Memorize Formulas / Results

- **Integration by parts:** $\int u \, dv = uv - \int v \, du$
- **LIATE rule:** Prioritize Log > Inverse trig > Algebraic > Trigonometric > Exponential for choosing $u$.
- **Common results:** $\int x e^x dx = e^x(x-1) + C$, $\int x \sin(x) dx = -x \cos(x) + \sin(x) + C$, $\int \ln(x) dx = x \ln(x) - x + C$.
