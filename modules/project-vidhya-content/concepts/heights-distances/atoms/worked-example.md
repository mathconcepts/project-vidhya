---
id: heights-distances.worked-example
concept_id: heights-distances
atom_type: worked_example
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
---

**From a point on level ground, the angle of elevation of a tower's top is $30°$. Walking $20$ m towards the tower, the angle becomes $60°$. Find the height of the tower.**

Let the tower's height be $h$, and let $d$ be the distance from the FAR point to the foot of the tower. Reason: naming both unknowns before writing any equation stops the two triangles from getting tangled together.

**Far triangle**: at distance $d$, the elevation is $30°$. Since height is opposite the angle and distance is adjacent to it, tangent connects them:

$$\tan30°=\dfrac{h}{d}\implies h=d\tan30°=\dfrac{d}{\sqrt3}$$

**Near triangle**: after walking $20$ m closer, the new distance is $d-20$, and the elevation is $60°$. Same reasoning, new numbers:

$$\tan60°=\dfrac{h}{d-20}\implies h=(d-20)\sqrt3$$

Both expressions equal the SAME height $h$, so set them equal — this is the whole idea behind two-position elevation problems, that the height does not change even though the angle and distance both do:

$$\dfrac{d}{\sqrt3}=(d-20)\sqrt3\implies d=3(d-20)\implies d=3d-60\implies d=30$$

Substitute back: $h=\dfrac{30}{\sqrt3}=10\sqrt3\approx17.32$ m.

**Check**: from the near point, $10$ m away, $h=10\tan60°=10\sqrt3$. Matches.
