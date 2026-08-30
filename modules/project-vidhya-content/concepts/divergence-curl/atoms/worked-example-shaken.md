---
# Alternative body for divergence-curl.worked-example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: divergence-curl.worked_example.shaken
concept_id: divergence-curl
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: divergence-curl-worked-example
for_stance: shaken
---

For $\mathbf F=xy^2\hat i+yz^2\hat j+zx^2\hat k$, take one partial derivative at a time. $\partial_x(xy^2)=y^2$. $\partial_y(yz^2)=z^2$. $\partial_z(zx^2)=x^2$. Add them: $\nabla\cdot\mathbf F=x^2+y^2+z^2$. At $(1,2,3)$ that is $1+4+9=14$.

For the curl, the $\hat k$ component needs care first: $\partial_x(yz^2)-\partial_y(xy^2)=0-2xy$, so $-2xy$; at $(1,2,3)$ that is $-2(1)(2)=-4$. The $\hat i$ component is $\partial_y(zx^2)-\partial_z(yz^2)=0-2yz=-2yz$, which is $-12$ at the point. The $\hat j$ component carries the extra minus sign from the determinant expansion: $-[\partial_x(zx^2)-\partial_z(xy^2)]=-[2xz-0]=-2xz$, which is $-6$ at the point. So $\nabla\times\mathbf F=-12\hat i-6\hat j-4\hat k$ at $(1,2,3)$.

Last, check $\nabla\cdot(\nabla\times\mathbf F)$ using the general components $-2yz,-2xz,-2xy$: each partial derivative of these three is $0$, so the sum is $0$ — the identity holds.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: divergence and curl of F = (xy², yz², zx²)","steps":[{"prompt":"For F = (xy², yz², zx²), write down ∂F_x/∂x, ∂F_y/∂y, ∂F_z/∂z and sum them to get div F.","hint":"Differentiate xy² w.r.t. x, yz² w.r.t. y, and zx² w.r.t. z. Each is a straightforward partial.","answer":"y² + z² + x²; at (1,2,3): 4 + 9 + 1 = 14"},{"prompt":"Compute the k̂ component of curl F = ∂F_y/∂x − ∂F_x/∂y for F = (xy², yz², zx²).","hint":"∂(yz²)/∂x = 0, and ∂(xy²)/∂y = 2xy. The k̂ component is the difference.","answer":"0 − 2xy = −2xy. At (1,2,3): −2(1)(2) = −4"},{"prompt":"State the identity that guarantees div(curl F) = 0 for any smooth field, and confirm it for G = (−2yz, −2xz, −2xy).","hint":"Compute ∂(−2yz)/∂x + ∂(−2xz)/∂y + ∂(−2xy)/∂z.","answer":"The identity is ∇·(∇×F) = 0 always. Each partial is 0, confirming 0+0+0 = 0."}]}
```
