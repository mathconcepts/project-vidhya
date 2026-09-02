---
id: ode-higher-order.intuition
concept_id: ode-higher-order
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

## The Second-Order Rule, Extended

Nothing new happens conceptually going from order $2$ to order $n$ — substituting $y=e^{rx}$ still turns the ODE into one polynomial, now of degree $n$:
$$a_nr^n+a_{n-1}r^{n-1}+\cdots+a_1r+a_0=0$$
An $n$-th degree polynomial has $n$ roots (counted with multiplicity), and the general solution always needs exactly $n$ arbitrary constants — one contribution per root, according to the same rules as before, just applied root-by-root instead of once:

| Root type | Contribution to $y$ |
|---|---|
| Simple real $r$ | $Ce^{rx}$ |
| Real $r$, multiplicity $m$ | $(C_1+C_2x+\cdots+C_mx^{m-1})e^{rx}$ |
| Simple complex pair $\alpha\pm i\beta$ | $e^{\alpha x}(A\cos\beta x+B\sin\beta x)$ |
| Complex pair, multiplicity $m$ | $e^{\alpha x}\big[(A_1+\cdots+A_mx^{m-1})\cos\beta x+(B_1+\cdots+B_mx^{m-1})\sin\beta x\big]$ |

For $y'''-3y''+3y'-y=0$: the auxiliary equation is $(r-1)^3=0$ — one root, multiplicity $3$. Following the second row of the table: $y=(C_1+C_2x+C_3x^2)e^{x}$, three constants for a third-order equation, exactly as required.

The only genuinely new bookkeeping is tracking multiplicity correctly when factoring a degree-$n$ polynomial — the root-to-solution translation itself never changes.
