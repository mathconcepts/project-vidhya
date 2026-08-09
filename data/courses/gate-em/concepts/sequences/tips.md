# Teaching Tips: Sequences

## Common Student Errors

- **Confusing oscillation with divergence:** Students think $\{(-1)^n\}$ might have a limit because it's bounded. Bounded $\neq$ convergent. A sequence converges only if it eventually stays close to ONE point.
- **Forgetting to divide by highest power:** When finding limits of rational sequences, students write $\frac{3n^2 + 2n}{n^2 + 5} \to 3 + 2 = 5$ instead of dividing by $n^2$ first.
- **Not checking the Monotone Convergence Theorem conditions:** Students claim a sequence converges without verifying BOTH monotonicity AND boundedness.

## GATE Question Pattern

GATE typically asks: (1) Does this sequence converge (MCQ)? (2) Find the limit (NAT, usually a rational sequence). (3) Prove boundedness or monotonicity (rare, only for 2-mark theory). The trap: sequences that look random like $\{(-1)^n/n\}$ still converge to $0$ via the Squeeze Theorem.

## Speed Tricks for MCQs

- **Divide by highest power rule:** For $\frac{P(n)}{Q(n)}$ where $P, Q$ are polynomials, the limit is the ratio of leading coefficients (or $0$ if denominator has higher degree, or $\infty$ if numerator has higher degree).
- **Squeeze Theorem shortcut:** If $|a_n| \leq b_n$ and $b_n \to 0$, then $a_n \to 0$. Useful for oscillating sequences like $\sin(n)/n$.
- **Classic limits to memorize:** $\{1/n\} \to 0$, $\{(1 + 1/n)^n\} \to e$, $\{n^{1/n}\} \to 1$, $\{r^n\} \to 0$ if $|r| < 1$.

## Must-Memorize Formulas / Results

- **Definition of convergence:** $\lim_{n \to \infty} a_n = L \iff \forall \epsilon > 0, \exists N$ such that $|a_n - L| < \epsilon$ for all $n > N$.
- **Monotone Convergence Theorem:** If $(a_n)$ is monotone and bounded, it converges.
- **Squeeze Theorem:** If $a_n \leq b_n \leq c_n$ and $\lim a_n = \lim c_n = L$, then $\lim b_n = L$.
- **Key limits:** $\lim_{n \to \infty} (1 + 1/n)^n = e$, $\lim_{n \to \infty} n^{1/n} = 1$, $\lim_{n \to \infty} r^n = 0$ for $|r| < 1$.
