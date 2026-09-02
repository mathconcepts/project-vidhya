---
id: ode-classification.intuition
concept_id: ode-classification
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

**Order** tells you how many arbitrary constants the general solution needs — an order-$2$ equation's solution always carries two independent constants $C_1, C_2$, exactly matching how many conditions you'd need to pin down one specific curve (a position AND a velocity, not just a position). That's the fact worth holding onto: order isn't just "count the primes on $y$," it's "count the degrees of freedom in the solution family."

**Degree**, by contrast, says nothing about the solution family's size — it's a purely algebraic property of how the equation is *written*. Two equations of the same order can carry wildly different degrees, and neither constrains the other. Before assigning a degree, first check that every derivative appears as a clean integer power: clear roots, denominators involving a derivative, and transcendental wrappers like $\sin$ or $e^{(\cdot)}$ around a derivative. If that clearing is impossible — say, $y'$ sits inside $\sin(y')$ — degree is **undefined**, not defaulted to $1$. An undefined property is a different answer than a small one.

**Linearity** is the property with the biggest practical payoff: a linear ODE's solution set is closed under addition and scalar multiplication, which is exactly why the integrating-factor and superposition methods work at all. The moment $y$ or a derivative multiplies another derivative, or sits inside something like $y^2$ or $e^y$, that structure breaks — and an entirely different toolkit is needed.
