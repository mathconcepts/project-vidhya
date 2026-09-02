---
id: integration-basics.formal-definition
concept_id: integration-basics
atom_type: formal_definition
bloom_level: 2
difficulty: 0.24
exam_ids: ["*"]
---

**Antiderivative (Indefinite Integral)**: An antiderivative of $f$ is a function $F$ such that $F'(x) = f(x)$. We write:
$$\int f(x) \, dx = F(x) + C$$

**Power Rule for Integration**: 
$$\int x^n \, dx = \frac{x^{n+1}}{n+1} + C \quad (n \neq -1)$$

**Standard Integrals**:
- $\int e^x \, dx = e^x + C$
- $\int \frac{1}{x} \, dx = \ln|x| + C$
- $\int \sin(x) \, dx = -\cos(x) + C$
- $\int \cos(x) \, dx = \sin(x) + C$

**When a direct formula applies:** use a basic formula the moment the integrand IS an elementary form (a bare power of $x$, $e^x$, $\sin x$, $\cos x$, or $1/x$) — not a composition of one. Students often try to force the power rule onto something like $(3x+1)^5$ as if it were $x^5$; that pattern-matches the shape but ignores the inner linear function, and silently drops the constant factor substitution would supply. A composed argument is substitution's job, not a direct-formula lookup.
