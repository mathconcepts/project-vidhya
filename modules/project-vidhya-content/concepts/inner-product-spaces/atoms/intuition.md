---
id: inner-product-spaces.intuition
concept_id: inner-product-spaces
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

You already know one: $(1,2)\cdot(3,1) = 1(3)+2(1) = 5$ — the dot product from the hook. An **inner product** is that same recipe, generalised: pair two vectors — or two polynomials, two functions, anything living in a vector space — and get back one number, following the same rules the dot product already obeys.

Once you have that number, everything else follows. Length: $\|v\|=\sqrt{\langle v,v\rangle}$ (the inner product of a vector with itself). Angle: for $u=(1,2)$, $v=(3,1)$, $\|u\|=\sqrt5$ and $\|v\|=\sqrt{10}$, so $\cos\theta = \dfrac{5}{\sqrt5\sqrt{10}}=\dfrac{1}{\sqrt2}$, meaning $\theta=45°$ — the two vectors are moderately aligned, not perpendicular. Orthogonality is the special case $\langle u,v\rangle=0$ — the hook's animation shows exactly that moment, when the rotating arrow sits at a right angle to the fixed one.