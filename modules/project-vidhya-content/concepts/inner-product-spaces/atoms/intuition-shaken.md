---
# Alternative body for inner-product-spaces.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: inner-product-spaces.intuition.shaken
concept_id: inner-product-spaces
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: inner-product-spaces.intuition
for_stance: shaken
---

Start with $u=(1,0)$ and $v=(1,1)$ in $\mathbb{R}^2$.

$$\langle u,v\rangle = (1)(1)+(0)(1) = 1$$

Not zero, so they're not perpendicular — you can see that on paper too.

An inner product is that multiply-and-add recipe, generalized so it also works on things that aren't arrows: polynomials, functions, matrices. The rule stays the same shape: pair two objects, get one number back.

Two facts follow directly from that one number. Length: $\|v\| = \sqrt{\langle v,v\rangle}$. Orthogonality: $\langle u,v\rangle = 0$ exactly when $u$ and $v$ are perpendicular.

Check: $\langle u,u\rangle = 1$, so $\|u\| = \sqrt{1} = 1$ — and $u=(1,0)$ is indeed a unit vector.
