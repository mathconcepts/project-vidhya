---
# for_stance: assured — the one distinction that costs marks: a repeated complex root needs the x^k multiplier on BOTH trig terms, not just one.
id: ode-higher-order.intuition.assured
concept_id: ode-higher-order
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: ode-higher-order.intuition
for_stance: assured
---

A repeated complex pair needs the $x^k$ multiplier on both trig terms, not just one — a natural-looking wrong guess is $e^{\alpha x}(A\cos\beta x+Bx\sin\beta x)$ for a double complex root, tacking $x$ onto only the $\sin$ term because it "looks like the newer piece." The correct pair is $e^{\alpha x}\big[(A_1+A_2x)\cos\beta x+(B_1+B_2x)\sin\beta x\big]$ — both families need the same power of $x$ at the same multiplicity, since the multiplicity describes the root, not either trig function individually. Undercounting one side silently loses an arbitrary constant, leaving an $n$-th order equation with fewer than $n$ free parameters.
