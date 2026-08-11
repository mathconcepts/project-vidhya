# Teaching Tips: Infinite Series

## Common Student Errors

- **p-series exponent confusion:** Students forget that $\sum 1/n^p$ converges for $p > 1$, not $p \geq 1$. They'll claim $\sum 1/n^{1.1}$ diverges or $\sum 1/n$ converges.
- **Ratio test $L = 1$ trap:** When D'Alembert gives $L = 1$, the test is inconclusive. Students often guess the answer instead of switching to another test (like p-series or comparison).
- **Harmonic series vs. alternating harmonic:** Students confuse $\sum 1/n$ (diverges) with $\sum (-1)^n/n$ (converges conditionally). The alternating aspect matters!

## GATE Question Pattern

GATE gives: (1) Test convergence of a specific series (MCQ), often using ratio test or p-series. (2) Find the sum (NAT) for geometric or telescoping series. (3) Distinguish convergent from conditionally/absolutely convergent (rare, 2-mark MCQ). Typical series have factorials, powers, or ratios of polynomials.

## Speed Tricks for MCQs

- **p-series fast-track:** If you see $\sum 1/n^p$, just check: is $p > 1$? If yes, converge; if no, diverge. Done in 3 seconds.
- **Ratio test shortcut:** For factorials or exponentials, use D'Alembert. Write $a_{n+1}/a_n$, cancel, simplify. If the answer has $n$ in it still, take the limit.
- **Comparison test rescue:** If a series looks messy, compare to a similar p-series. Example: $\frac{3n^2 + 7}{n^5 + 2} \sim 3/n^3$ for large $n$, so it converges like $\sum 1/n^3$.

## Must-Memorize Formulas / Results

- **Geometric series:** $\sum_{n=0}^{\infty} ar^n = \frac{a}{1-r}$ if $|r| < 1$.
- **p-series:** $\sum_{n=1}^{\infty} \frac{1}{n^p}$ converges iff $p > 1$.
- **Harmonic series diverges:** $\sum_{n=1}^{\infty} \frac{1}{n} = \infty$.
- **D'Alembert's Ratio Test:** $L = \lim_{n \to \infty} |a_{n+1}/a_n|$. Converges if $L < 1$, diverges if $L > 1$, inconclusive if $L = 1$.
- **Alternating Series Test:** If $a_n$ decreases to $0$, then $\sum (-1)^n a_n$ converges.
- **Telescoping series:** If $a_n = b_n - b_{n+1}$, then $\sum a_n = b_1 - \lim b_n$.
