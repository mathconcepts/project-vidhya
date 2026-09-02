---
id: ode-classification.formal-definition
concept_id: ode-classification
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Order.** The order of an ODE is the order of the highest derivative appearing in it. $\dfrac{d^3y}{dx^3} + x\dfrac{dy}{dx} = 0$ has order $3$.

**Degree.** Once the equation is written as a **polynomial in its derivatives** — free of roots, fractional powers, and derivatives inside denominators or transcendental functions like $\sin$, $\log$, $e^{(\cdot)}$ — the degree is the power carried by the *highest-order* derivative in that polynomial form. If the equation cannot be brought to that form at all, degree is **undefined**.

**Linearity.** An ODE is **linear** if it can be written as
$$a_n(x)\,y^{(n)} + a_{n-1}(x)\,y^{(n-1)} + \cdots + a_1(x)\,y' + a_0(x)\,y = g(x)$$
— every coefficient depends only on $x$, and $y$ and each derivative appears to the first power, with no products between them.

**Decision rule:** call an equation linear only if *every* term satisfies this — not just the term with the highest derivative. A tempting-but-wrong shortcut is to check linearity by looking at the highest-order derivative alone: $y'' + y\,y' = 0$ has $y''$ appearing to the first power, which reads as "linear" if you stop there, but the product $y\,y'$ elsewhere in the equation is what actually decides it, and it fails the test.
