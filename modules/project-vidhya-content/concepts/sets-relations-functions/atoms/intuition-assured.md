---
id: sets-relations-functions.intuition-assured
concept_id: sets-relations-functions
atom_type: intuition
variant_of: sets-relations-functions.intuition
for_stance: assured
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Arrow diagrams and the domain/range/codomain split are old news by this stage. What actually separates a pass from a fail here: reflexive **and** symmetric does **not** force transitive. On $\{1,2,3\}$, let $R$ hold $(1,1),(2,2),(3,3),(1,2),(2,1),(2,3),(3,2)$. Reflexive: yes. Symmetric: yes, every pair reverses. Transitive: $(1,2)$ and $(2,3)$ are both in $R$, but $(1,3)$ is not — fails. This relation is not an equivalence relation, despite having two of the three properties. All three must be checked; none implies another.

The second trap sits in composition domains. $(f \circ g)(x) = f(g(x))$ is only defined where $g(x)$ actually lands inside $f$'s domain — not wherever $g$ itself is defined. If $g(x) = x - 4$ and $f(x) = \sqrt{x}$, then $g$ accepts every real $x$, but $f \circ g$ only accepts $x \ge 4$, because $f$ needs a non-negative input. Computing $f(g(x))$ correctly and skipping this domain check is the single most common way a correct-looking answer loses marks on composition questions.
