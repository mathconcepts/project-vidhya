---
id: straight-lines.worked-example
concept_id: straight-lines
atom_type: worked_example
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
---

**Find the acute angle bisector of $L_1: 3x+4y-6=0$ and $L_2: 4x+3y-4=0$.**

**Step 1 — check the sign of $c_1,c_2$.** The bisector formula only works cleanly once $c_1$ and $c_2$ are the same sign. Here $c_1=-6$ and $c_2=-4$ — both already negative. No rewriting needed.

**Step 2 — normalise each line.** The bisector formula divides each line by its own $\sqrt{a^2+b^2}$, because that is what turns $a x+by+c$ into a true "distance from the line" — without it, the two sides of the equation are not comparable lengths. Here $\sqrt{3^2+4^2}=5$ and $\sqrt{4^2+3^2}=5$ — both $5$, conveniently.

**Step 3 — write both bisectors.** With both normalisers equal to $5$:
$$\frac{3x+4y-6}{5}=\pm\frac{4x+3y-4}{5}$$
Taking the $+$ sign: $3x+4y-6=4x+3y-4 \implies -x+y-2=0$, i.e. $x-y+2=0$.
Taking the $-$ sign: $3x+4y-6=-(4x+3y-4) \implies 7x+7y-10=0$.

**Step 4 — decide which one is acute.** Compute $a_1a_2+b_1b_2=(3)(4)+(4)(3)=24>0$. Since $c_1,c_2$ were already the same sign and this sum is positive, the $-$ sign result is the **acute** bisector: $7x+7y-10=0$, and the $+$ sign result, $x-y+2=0$, is the obtuse one.

**Step 5 — check it, don't just trust the rule.** The angle between $L_1$ and $L_2$ works out to $\tan\theta=\left|\dfrac{-3/4-(-4/3)}{1+(-3/4)(-4/3)}\right|=\dfrac{7}{24}$, so $\theta\approx16.26°$. The angle between $L_1$ (slope $-3/4$) and $7x+7y-10=0$ (slope $-1$) comes out to $\approx8.13°$ — exactly half of $16.26°$, which is what an angle bisector of an acute angle must do. The angle between $L_1$ and $x-y+2=0$ (slope $1$) comes out to $\approx81.87°$, half of the obtuse $163.74°$ instead — confirming the rule picked the right one.

**Answer.** Acute bisector: $7x+7y-10=0$.
