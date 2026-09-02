---
id: numerical-ode.intuition
concept_id: numerical-ode
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

## Stepping along a slope you can only see locally

Given $y'=f(t,y)$, $y(t_0)=y_0$, the only tool available at each point is the slope $f$ evaluated there — no global formula.

**Euler's method** takes that single slope and commits fully to it for one whole step:

$$y_{n+1}=y_n+h\,f(t_n,y_n)$$

This is first-order: the *global* error is $O(h)$, so halving $h$ only halves the error — twice the work for half the gain.

**RK4** samples the slope four times per step — once at the start, twice near the midpoint (using two different trial estimates), once near the end — and combines them with fixed weights $1,2,2,1$ (divided by $6$):

$$y_{n+1}=y_n+\frac{h}{6}(k_1+2k_2+2k_3+k_4)$$

The extra sampling buys fourth-order global accuracy, $O(h^4)$: halving $h$ cuts the error by roughly $16\times$, at the cost of four function evaluations per step instead of one.

**Stability** is a separate concern from accuracy: a method can be mathematically higher-order and still blow up numerically if the step size is too large for how fast the true solution is decaying or oscillating — checking a method's stability region matters as much as checking its order.
