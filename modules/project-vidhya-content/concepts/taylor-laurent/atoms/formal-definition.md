---
id: taylor-laurent.formal-definition
concept_id: taylor-laurent
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**Taylor Series**: If $f$ is analytic in a disk $|z - z_0| < R$, then:
$$f(z) = \sum_{n=0}^{\infty} a_n (z - z_0)^n, \quad \text{where} \quad a_n = \frac{f^{(n)}(z_0)}{n!}$$

**Laurent Series**: If $f$ is analytic in an annulus $r < |z - z_0| < R$ around a singularity at $z_0$, then:
$$f(z) = \sum_{n=-\infty}^{\infty} c_n (z - z_0)^n$$

where the **principal part** (negative powers) reveals the singularity structure. The coefficient $c_{-1}$ of $(z - z_0)^{-1}$ is called the **residue** of $f$ at $z_0$.

**Which center to use.** Use the Laurent series centered **at** the singularity you're classifying — not a series centered elsewhere, which is a tempting shortcut when a partial-fraction expansion is already in hand. $\frac1{z-1}$ expanded about $z=0$ in the region $|z|>1$ carries infinitely many negative powers of $z$, which looks like an essential singularity at $z=0$; but $z=0$ isn't even a singularity of this function, and $z=1$ is a plain simple pole once the series is re-centered there. The series' shape depends on the chosen center; the singularity's actual type doesn't.
