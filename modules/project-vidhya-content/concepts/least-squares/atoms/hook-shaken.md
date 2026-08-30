---
# Alternative body for least-squares.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: least-squares.hook.shaken
concept_id: least-squares
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: least-squares.hook
for_stance: shaken
---

Three equations, two unknowns. No line passes through all three points exactly.

Least squares picks the line that misses by the least — the closest thing to a solution that actually exists.

```interactive-spec
{"v":1,"kind":"simulation","title":"Sliding along col(A)=span(2,1) hunting for the closest point to b=(1,3)","x_expr":"2*t","y_expr":"t","t_min":-1,"t_max":3,"duration_sec":7,"view_box":{"x_min":-2.5,"x_max":6.5,"y_min":-1.5,"y_max":3.5},"narration_steps":[{"at_progress":0.0,"text":"This traces $p(t)=t\\,a$ sliding along the line spanned by $a=(2,1)$, hunting for the point closest to the fixed target $b=(1,3)$.","text_shaken":"Start at $p=(-2,-1)$, $t=-1$. Target is $b=(1,3)$, off the line.","text_assured":"$\\mathrm{col}(A)$ here is one-dimensional — $\\mathrm{span}(a)$ — the simplest overdetermined case, one column against a target not on it."},{"at_progress":0.3,"text":"At $p=(0.4,0.2)$ the gap to $b$ is shrinking, but hasn't reached its shortest length yet.","text_shaken":"$p=(0.4,0.2)$, $t=0.2$. Residual length $\\approx2.86$, still falling.","text_assured":"Distance is a smooth function of $t$ here — differentiate $\\|b-ta\\|^2$ and set it to zero, don't guess by eye."},{"at_progress":0.5,"text":"At $t=1$, $p=(2,1)$ is the closest point on the line to $b=(1,3)$ — the residual $r=(-1,2)$, not zero.","text_shaken":"$p=(2,1)$ now, $r=b-p=(-1,2)$. Length $\\approx2.24$ — smaller than before, but not zero.","text_assured":"Check $a\\cdot r$: $2\\times(-1)+1\\times2=0$ — perpendicular, which is the actual stopping condition, not $r=0$.","emphasize":true,"trap":{"text":"Students expect the best fit to drive the residual to zero, the way an exact solution would.","avoid":"In an overdetermined system the minimum residual is only PERPENDICULAR to $\\mathrm{col}(A)$ — check $a\\cdot r=0$, never look for $r=0$."}},{"at_progress":1.0,"text":"Past $t=1$ the point overshoots and the gap widens again — $p=(2,1)$ was the unique closest point, the least-squares solution.","text_shaken":"$p=(6,3)$ now, $t=3$. Residual length back up to $5$ — worse than at $t=1$.","text_assured":"Uniqueness here follows from $a\\ne0$: the projection onto a line is always a single point, never a range."}],"ghost":{"x_expr":"1","y_expr":"3"}}
```
