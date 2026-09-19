---
id: circles-coordinate.worked-example
concept_id: circles-coordinate
atom_type: worked_example
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
---

**Find the chord of contact of tangents drawn from $(7,1)$ to the circle $x^2+y^2-2x-4y-4=0$.**

**Step 1 — read off $g,f,c$ and confirm the point is genuinely outside.** Comparing to $x^2+y^2+2gx+2fy+c=0$: $g=-1$, $f=-2$, $c=-4$. Centre $(1,2)$, radius $r=\sqrt{1+4+4}=3$. The chord-of-contact formula only describes a real chord when real tangents exist, so check $S_1=7^2+1^2+2(-1)(7)+2(-2)(1)+(-4)=49+1-14-4-4=28$. Since $28>0$, the point is outside — two real tangents genuinely exist.

**Step 2 — write $T=0$ at the external point.** $T\equiv xx_1+yy_1+g(x+x_1)+f(y+y_1)+c=0$ with $(x_1,y_1)=(7,1)$: $7x+y-(x+7)-2(y+1)-4=0 \Rightarrow 6x-y-13=0$.

**Step 3 — confirm it, don't just trust the substitution.** Solving for the actual tangent lines through $(7,1)$ independently (setting up the tangency condition on a general line through the point) gives touch points $\left(\dfrac{91-6\sqrt7}{37},\dfrac{65-36\sqrt7}{37}\right)$ and $\left(\dfrac{91+6\sqrt7}{37},\dfrac{65+36\sqrt7}{37}\right)$. Both satisfy $6x-y-13=0$ exactly, and the line through them has slope $6$ — matching $6x-y-13=0$ rearranged as $y=6x-13$.

**Step 4 — the two extra numbers this setup hands you for free.** Distance from centre $(1,2)$ to $(7,1)$: $d=\sqrt{36+1}=\sqrt{37}$. Tangent length: $\sqrt{d^2-r^2}=\sqrt{37-9}=2\sqrt7$. Chord-of-contact length: $\dfrac{2r\sqrt{S_1}}{d}=\dfrac{2(3)(2\sqrt7)}{\sqrt{37}}=\dfrac{12\sqrt7}{\sqrt{37}}=\dfrac{12\sqrt{259}}{37}\approx5.22$ — matching the direct distance between the two touch points found in Step 3.

**Answer.** Chord of contact: $6x-y-13=0$.
