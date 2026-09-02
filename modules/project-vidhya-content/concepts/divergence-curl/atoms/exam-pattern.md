---
id: divergence-curl.exam-pattern
concept_id: divergence-curl
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions want div or curl evaluated at a specific point**, not left as a general expression in $x,y,z$.

  Example: for $\mathbf F=(x^2,y^2,z^2)$ at $(1,1,1)$, the expected entry is $6$ (verified above), the number, not "$2x+2y+2z$."

- **MCQ "which identity is always true" stems test $\operatorname{curl}(\nabla\phi)=\mathbf 0$ and $\operatorname{div}(\operatorname{curl}\mathbf F)=0$** as fixed facts, independent of the specific $\phi$ or $\mathbf F$ named in the option — no computation is needed if the option is phrased as one of these two identities in disguise.

- **MSQ questions on "is $\mathbf F$ conservative" pair curl-zero with a domain condition** on purpose — one option states curl-zero alone as sufficient (false in general), another adds "on a simply connected domain" (true). Reading past the curl condition to the domain clause is what separates the two options.

- **Time budget:** a div-and-curl evaluation at a numeric point should take under 90 seconds; if curl's three components are taking longer than that combined, differentiate one component pattern and reuse it via any symmetry the field displays, rather than expanding all nine partial derivatives independently.
