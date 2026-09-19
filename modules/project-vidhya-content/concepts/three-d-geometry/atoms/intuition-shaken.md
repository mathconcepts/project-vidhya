---
id: three-d-geometry.intuition-shaken
concept_id: three-d-geometry
atom_type: intuition
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
variant_of: three-d-geometry.intuition
for_stance: shaken
---

Look at one line: $\dfrac{x-1}{2}=\dfrac{y-2}{3}=\dfrac{z+4}{6}$.

The point $(1,2,-4)$ is sitting right there — it is $\vec a$ from the vector form $\vec r=\vec a+\lambda\vec b$. The numbers under the fractions, $2,3,6$, are $\vec b$'s components. So this same line, in vector form, is:

$$\vec r=(\hat i+2\hat j-4\hat k)+\lambda(2\hat i+3\hat j+6\hat k)$$

Nothing was computed. The two forms are the same information, written two ways.

Same idea for a plane: $2x+3y+6z=7$ has normal vector $\vec n=(2,3,6)$ — the coefficients themselves.

Why bother with both forms? Vector form makes some calculations short, like the shortest distance between two skew lines. Cartesian form is usually what the question gives you, and what you check your final numbers against. So: read a Cartesian equation, and you already know its vector form. No conversion step, just relabeling.
