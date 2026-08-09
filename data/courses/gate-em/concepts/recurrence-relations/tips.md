# Teaching Tips: Recurrence Relations

## Common Student Errors
- **Forgetting to apply initial conditions**: Students solve the characteristic equation correctly but forget to use $a_0, a_1, \ldots$ to determine the constants $A_1, A_2, \ldots$ in the general solution. Without this step, the answer is a family of solutions, not the unique solution. **Check**: Always plug initial conditions back into the final answer.
- **Algebraic errors in the characteristic equation**: Common mistakes: writing $r^n = c_1 r^{n-1} + \cdots$ without simplifying, or incorrectly moving terms. Always **divide through by $r^{n-k}$** first to get a polynomial equation of degree $k$, not a transcendental equation.
- **Confusing repeated roots**: When the characteristic equation has a repeated root $r$ of multiplicity $m$, the solution includes terms like $(A_1 + A_2 n + A_3 n^2 + \cdots + A_m n^{m-1}) r^n$, NOT just $A \cdot r^n$. Forgetting the polynomial factor is a critical error.

## GATE Question Pattern
Recurrence relation questions in GATE typically appear as:
- **Closed-form derivation** (1-2 marks, MCQ or NAT): Solve the recurrence via the characteristic equation and compute a specific term. Trap: tricky algebra in solving the characteristic polynomial (e.g., repeated roots or complex coefficients).
- **Combinatorial recurrences** (1-2 marks, NAT): "Binary strings of length $n$ without consecutive 1s" or "ways to tile a $2 \times n$ board"—given the recurrence, compute $a_n$ for some $n$. Usually solved by iteration (simpler than closed form for small $n$).
- **Divide-and-conquer recurrences** (1 mark, MCQ on asymptotic order): $T(n) = aT(n/b) + f(n)$ recurrences. Identify the order of growth (e.g., $O(n \log n)$, $O(n^2)$) using the Master Theorem.

## Speed Tricks for MCQs
- **Iterate for small $n$**: If you need $a_5$ or $a_6$, don't bother solving the full closed form—just compute iteratively using the recurrence. It's often faster than solving the characteristic equation.
- **Identify patterns**: For recurrences like $a_n = 2a_{n-1}$ (exponential growth) or $a_n = a_{n-1} + a_{n-2}$ (Fibonacci-like), recognize the pattern immediately and guess the closed form (e.g., $2^n$ for the first, $\phi^n$ for the second), then verify with initial conditions.
- **Master Theorem shortcut**: If $f(n) = n^c \log^d n$ and $n^{\\log_b a}$: compare the exponents. If $c > \\log_b a$, then $T(n) = \\Theta(n^c \log^d n)$. If $c < \\log_b a$, then $T(n) = \\Theta(n^{\\log_b a})$. If $c = \\log_b a$, then $T(n) = \\Theta(n^c \\log^{d+1} n)$.

## Must-Memorize Formulas / Results
$$\\text{Linear homogeneous recurrence of order } k: \quad a_n = c_1 a_{n-1} + c_2 a_{n-2} + \\cdots + c_k a_{n-k}$$
$$\\text{Characteristic equation:} \\quad r^k - c_1 r^{k-1} - c_2 r^{k-2} - \\cdots - c_k = 0$$
$$\\text{If roots are distinct } r_1, \\ldots, r_k: \\quad a_n = A_1 r_1^n + \\cdots + A_k r_k^n$$
$$\\text{If root } r \\text{ has multiplicity } m: \\quad (A_1 + A_2 n + \\cdots + A_m n^{m-1}) r^n$$
$$\\text{Fibonacci recurrence:} \\quad F_n = F_{n-1} + F_{n-2}, \\quad F_n = \\frac{\\phi^n - \\psi^n}{\\sqrt{5}} \\quad \\text{where } \\phi = \\frac{1+\\sqrt{5}}{2}, \\psi = \\frac{1-\\sqrt{5}}{2}$$
$$\\text{Master Theorem (Divide-and-Conquer):} \\quad T(n) = aT(n/b) + f(n)$$
$$\\text{Case 1:} \\ f(n) = O(n^{\\log_b a - \\epsilon}) \\Rightarrow T(n) = \\Theta(n^{\\log_b a})$$
$$\\text{Case 2:} \\ f(n) = \\Theta(n^{\\log_b a} \\log^k n) \\Rightarrow T(n) = \\Theta(n^{\\log_b a} \\log^{k+1} n)$$
$$\\text{Case 3:} \\ f(n) = \\Omega(n^{\\log_b a + \\epsilon}) \\text{ and regularity holds} \\Rightarrow T(n) = \\Theta(f(n))$$
