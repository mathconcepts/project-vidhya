---
# Alternative body for linear-transformations.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# The scaffolding is REAL but it is not on the page: prose is held at or below
# the base atom's length, because a screen that is visibly longer than the one
# that already defeated this reader signals difficulty no matter how kindly it
# is written. The extra steps live in the walkthrough below, where they unfold
# one at a time when the student asks for them.
#
# The walkthrough may carry MORE steps than the base's, but every answer the
# base asserts survives here in order and the final answer is identical —
# scripts/check-variant-agreement.ts enforces that. Prompts and hints are the
# part that may differ, and they are where the gentler register lives.
id: linear-transformations.worked-example.shaken
concept_id: linear-transformations
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: linear-transformations.worked_example
for_stance: shaken
---

**Problem:** $T:\mathbb{R}^3\to\mathbb{R}^2$, $T(x,y,z)=(x+y,\,y+z)$. Find $\text{Ker}(T)$, $\text{Im}(T)$, and check Rank-Nullity.

---

## Finding Ker(T)

Set both outputs to zero:

$$x+y=0 \qquad y+z=0$$

From the first: $x=-y$. From the second: $z=-y$. Let $y=t$: then $(x,y,z)=(-t,t,-t)=t(-1,1,-1)$.

$$\boxed{\text{Ker}(T) = \{(-1,1,-1)\}}, \qquad \text{nullity}=1$$

## Finding Im(T)

Write the output as a combination:

$$
\begin{pmatrix}x+y\\y+z\end{pmatrix} = x\begin{pmatrix}1\\0\end{pmatrix} + y\begin{pmatrix}1\\1\end{pmatrix} + z\begin{pmatrix}0\\1\end{pmatrix}
$$

Three vectors in $\mathbb{R}^2$ — at most 2 can be independent. Check: $(1,0)$ and $(1,1)$ are not multiples of each other, so they're independent, and $(0,1)=(1,1)-(1,0)$ falls in their span.

$$\boxed{\text{Im}(T) = \{(1,0),(1,1)\}}, \qquad \text{rank}=2$$

## Check

$$\dim(\text{domain}) = \text{rank}+\text{nullity} \;\Rightarrow\; 3 = 2+1 \ \checkmark$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Finding Ker(T) and Im(T)","steps":[{"prompt":"Set both outputs of T(x,y,z) = (x+y, y+z) equal to zero. What two equations do you get?","hint":"The first coordinate x+y and the second coordinate y+z both have to equal 0.","answer":"$x + y = 0$ and $y + z = 0$"},{"prompt":"From x+y=0, what is x in terms of y? From y+z=0, what is z in terms of y?","hint":"Solve each equation for the other variable, one at a time.","answer":"$x = -y$ and $z = -y$."},{"prompt":"Let y = t. Write (x, y, z) as t times a single vector.","hint":"Substitute x = -t and z = -t from the previous step.","answer":"$x = -t$, $z = -t$. Kernel vectors are $t(-1, 1, -1)$, giving basis $\\{(-1, 1, -1)\\}$."},{"prompt":"For the image, write (x+y, y+z) as x·(1,0) + y·(1,1) + z·(0,1). Which two of these three vectors are independent?","hint":"Check whether (1,0) and (1,1) are scalar multiples of each other — they aren't, so they qualify.","answer":"Any two of the three vectors are independent; the third is in their span. Basis: $\\{(1, 0), (1, 1)\\}$ or $\\{(1, 0), (0, 1)\\}$."},{"prompt":"You have nullity = 1 and rank = 2. Does nullity + rank equal dim(R³) = 3?","hint":"Add the two numbers you already found.","answer":"Yes, $3 = 2 + 1$. The theorem is verified."}],"caption":"Key exam insight: Kernel finds what vanishes; image finds what can be reached. Rank-nullity is your algebra sanity check."}
```
