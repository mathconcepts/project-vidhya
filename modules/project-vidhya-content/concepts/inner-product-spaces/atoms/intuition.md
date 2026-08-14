---
id: inner-product-spaces.intuition
concept_id: inner-product-spaces
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

You already know the dot product $u \cdot v = u_1v_1 + u_2v_2 + \cdots + u_nv_n$ in $\mathbb{R}^n$. An **inner product** is a generalization: it's a rule that pairs two vectors and returns a scalar, just like the dot product. But it works in *any* vector space—not just $\mathbb{R}^n$, also function spaces, matrix spaces, complex spaces. The inner product $\langle u, v \rangle$ lets you compute the "angle" between abstract vectors by asking: *how aligned are $u$ and $v$?* If $\langle u, v \rangle = 0$, they are orthogonal (perpendicular). If it's large, they point in similar directions. The length of a vector is $\|v\| = \sqrt{\langle v, v \rangle}$—the inner product of a vector with itself.