---
id: three-d-geometry.common-traps
concept_id: three-d-geometry
atom_type: common_traps
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
tested_by_atom: three-d-geometry.micro-exercise
---

- **Direction-ratio sign error from a "flipped" Cartesian equation.** $\dfrac{x-1}{2}$ and $\dfrac{1-x}{2}$ are not the same reading. Rewrite $\dfrac{1-x}{2}$ as $\dfrac{x-1}{-2}$ first — the direction ratio is $-2$, not $2$. Copying the denominator's number without checking which side $x$ sits on flips the sign of one whole component of the direction vector.

- **Direction ratios are not unique — do not compare them by equality.** $(2,3,6)$ and $(4,6,12)$ are the same direction. To check two lines are parallel, check the ratios are *proportional*, $\dfrac{a_1}{a_2}=\dfrac{b_1}{b_2}=\dfrac{c_1}{c_2}$ — never that the numbers match exactly.

- **The shortest distance between skew lines runs along the common perpendicular, never along either line.** It is tempting to project the connecting vector onto $\vec b_1$ or $\vec b_2$ directly and call that the answer. The correct direction is $\vec b_1\times\vec b_2$ — perpendicular to *both* lines at once — and nothing shorter than the distance along that one direction actually separates the two lines.

- **Not parallel does not automatically mean skew.** Skew needs two conditions together: not parallel, *and* not intersecting. Two non-parallel lines can still meet at a point — check $(\vec a_2-\vec a_1)\cdot(\vec b_1\times\vec b_2)=0$ before declaring them skew; a zero result with non-parallel directions means they intersect, not that the shortest-distance formula was computed wrong.

- **Line-plane angle uses $\sin$, not $\cos$, of the reported angle.** The formula $\dfrac{|\vec b\cdot\vec n|}{|\vec b||\vec n|}$ computes the cosine of the angle between the *line and the normal* — but the angle the question wants is measured from the *plane*, which is the complement of that angle, so it is a sine, not a cosine, of the reported answer. Plugging the same fraction in as $\cos\theta$ gives the wrong angle.
