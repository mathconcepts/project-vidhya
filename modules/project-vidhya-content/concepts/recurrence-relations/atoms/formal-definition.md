---
id: recurrence-relations.formal-definition
concept_id: recurrence-relations
atom_type: formal_definition
bloom_level: 2
difficulty: 0.45
exam_ids: ["*"]
---

A **linear homogeneous recurrence with constant coefficients**, $a_n = c_1a_{n-1}+c_2a_{n-2}$, has **characteristic equation** $x^2-c_1x-c_2=0$. If the roots $r_1\ne r_2$ are distinct, the general solution is $a_n=A r_1^n+B r_2^n$; if there's a repeated root $r$, it's $a_n=(A+Bn)r^n$. Constants $A,B$ come from the initial conditions $a_0,a_1$.

A **nonhomogeneous** recurrence, $a_n=c_1a_{n-1}+c_2a_{n-2}+f(n)$, needs a **particular solution** $a_n^{(p)}$ added to the homogeneous solution: $a_n=a_n^{(h)}+a_n^{(p)}$.

**Method selector.** Solve the homogeneous characteristic equation first, always — that holds whether or not $f(n)=0$. Only reach for a particular-solution guess (matching the form of $f(n)$) when $f(n)\ne0$; applying the pure-homogeneous formula to a recurrence with a nonzero forcing term satisfies it only at $n=0,1$ (from the fitted constants) and silently drifts wrong for larger $n$.
