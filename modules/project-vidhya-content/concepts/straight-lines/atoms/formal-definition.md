---
id: straight-lines.formal-definition
concept_id: straight-lines
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**General equation of a line.** $ax+by+c=0$, where $a,b$ are not both zero. Slope $m=-a/b$ (when $b\neq0$).

**Standard forms (already familiar from Class 11).** Slope-intercept $y=mx+c$; point-slope $y-y_1=m(x-x_1)$; two-point $\dfrac{y-y_1}{y_2-y_1}=\dfrac{x-x_1}{x_2-x_1}$; intercept form $\dfrac{x}{p}+\dfrac{y}{q}=1$; normal form $x\cos\alpha+y\sin\alpha=p$.

**Angle between two lines.** For slopes $m_1,m_2$: $\tan\theta=\left|\dfrac{m_1-m_2}{1+m_1m_2}\right|$. Parallel: $m_1=m_2$. Perpendicular: $m_1m_2=-1$.

**Family of lines through the intersection of $L_1=0$ and $L_2=0$.** Every member is $L_1+\lambda L_2=0$ for some real $\lambda$ — except $L_2=0$ itself, which this form cannot express. One extra condition (a point, a parallel direction, a perpendicular direction) fixes $\lambda$.

**Equations of the angle bisectors** of $L_1: a_1x+b_1y+c_1=0$ and $L_2: a_2x+b_2y+c_2=0$ (with $c_1,c_2$ first made the same sign):
$$\frac{a_1x+b_1y+c_1}{\sqrt{a_1^2+b_1^2}}=\pm\frac{a_2x+b_2y+c_2}{\sqrt{a_2^2+b_2^2}}$$
With $c_1,c_2$ same sign: if $a_1a_2+b_1b_2>0$, the $-$ sign gives the **acute** bisector and the $+$ sign the obtuse one; if $a_1a_2+b_1b_2<0$, it is the other way round.

**Pair of straight lines.** The general second-degree equation $ax^2+2hxy+by^2+2gx+2fy+c=0$ represents a pair of straight lines exactly when
$$\Delta=abc+2fgh-af^2-bg^2-ch^2=0,$$
and the lines are real (rather than a pair of imaginary lines meeting at one real point) exactly when additionally $h^2\ge ab$. The angle between the pair is $\tan\theta=\dfrac{2\sqrt{h^2-ab}}{|a+b|}$; the pair is perpendicular exactly when $a+b=0$. For a pair through the origin, $ax^2+2hxy+by^2=0$, no $\Delta$ condition is needed at all — it is automatically two lines (real and distinct when $h^2>ab$, coincident when $h^2=ab$).

**Method Selector.** Reach for family of lines only when a problem hands you two lines AND one extra condition on a third — not when it directly gives you a point and a direction (then a single point-slope equation is faster). Reach for the pair-of-lines machinery only when the equation is genuinely second-degree in both $x$ and $y$ with a nonzero $xy$ term or nonzero $g,f,c$ — a pure $y^2=$ constant or $x^2+y^2=$ constant is a different curve entirely, not a pair of lines in disguise.
