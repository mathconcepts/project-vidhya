---
id: indefinite-integration.hook.assured
concept_id: indefinite-integration
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: indefinite-integration.hook
for_stance: assured
---

$\int \dfrac{2x+3}{x^2+3x+7}\,dx$ looks like a partial-fractions job until you check the discriminant of $x^2+3x+7$: $9-28=-19$, irreducible over the reals. Partial fractions on an irreducible quadratic still works in principle, with a linear numerator $Ax+B$ over it — but it is needless machinery here, because the numerator already IS the denominator's derivative. Test that first, always, before you test whether the denominator factors: "is the top proportional to the bottom's derivative" is a five-second check, and it answers this question before "does the bottom factor" would even finish asking it.
