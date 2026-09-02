---
# Alternative body for analytic-functions.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling.
id: analytic-functions.worked-example.shaken
concept_id: analytic-functions
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: analytic-functions.worked-example
for_stance: shaken
---

**Problem:** $u(x,y)=e^x\cos y$. Find $v$ so $f=u+iv$ is analytic.

**Step 1 — check $u$ is harmonic.** $u_x=e^x\cos y$, so $u_{xx}=e^x\cos y$. $u_y=-e^x\sin y$, so $u_{yy}=-e^x\cos y$. Add them: $e^x\cos y-e^x\cos y=0$. Harmonic, so a conjugate exists.

**Step 2 — first CR equation.** $v_y=u_x=e^x\cos y$. Integrate in $y$: $v=e^x\sin y+g(x)$.

**Step 3 — second CR equation.** $v_x=-u_y$. Differentiate the Step 2 answer: $v_x=e^x\sin y+g'(x)$. Set equal to $-u_y=e^x\sin y$: so $g'(x)=0$, meaning $g(x)=C$, a constant.

**Step 4 — assemble.** $v=e^x\sin y+C$. Then $f=u+iv=e^x\cos y+i(e^x\sin y+C)=e^x(\cos y+i\sin y)+iC$.

**Check.** $e^x(\cos y+i\sin y)=e^{x+iy}=e^z$. So $f(z)=e^z+iC$; taking $C=0$: $\boxed{f(z)=e^z}$. Confirm the derivative: $f'(z)=u_x+iv_x=e^x\cos y+ie^x\sin y=e^z$, matching $\frac{d}{dz}e^z=e^z$.

The two steps that matter, in order: integrate $v_y=u_x$ first, then use $v_x=-u_y$ only to pin down the leftover function of $x$ — never guess $v$ before doing this.
