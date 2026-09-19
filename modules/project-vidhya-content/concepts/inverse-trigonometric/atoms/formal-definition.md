---
id: inverse-trigonometric.formal-definition
concept_id: inverse-trigonometric
atom_type: formal_definition
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
---

**$\sin^{-1}$ (arcsine)**: domain $[-1,1]$; principal value range $[-\pi/2,\pi/2]$.

**$\cos^{-1}$ (arccosine)**: domain $[-1,1]$; principal value range $[0,\pi]$.

**$\tan^{-1}$ (arctangent)**: domain all real numbers; principal value range $(-\pi/2,\pi/2)$.

**$\cot^{-1}$**: domain all real numbers; principal value range $(0,\pi)$.

**$\sec^{-1}$**: domain $|x|\ge1$; principal value range $[0,\pi]\setminus\{\pi/2\}$.

**$\text{cosec}^{-1}$**: domain $|x|\ge1$; principal value range $[-\pi/2,\pi/2]\setminus\{0\}$.

**Sum formula, $\tan^{-1}x+\tan^{-1}y$ — valid when $xy<1$**: equals $\tan^{-1}\!\left(\dfrac{x+y}{1-xy}\right)$ directly.

**Sum formula correction, $xy>1$, $x>0,y>0$**: equals $\pi+\tan^{-1}\!\left(\dfrac{x+y}{1-xy}\right)$.

**Sum formula correction, $xy>1$, $x<0,y<0$**: equals $-\pi+\tan^{-1}\!\left(\dfrac{x+y}{1-xy}\right)$.

**Difference formula, $\tan^{-1}x-\tan^{-1}y$ — valid when $xy>-1$**: equals $\tan^{-1}\!\left(\dfrac{x-y}{1+xy}\right)$ directly.

**Difference formula correction, $xy<-1$**: equals $\pi+\tan^{-1}\!\left(\dfrac{x-y}{1+xy}\right)$ when $x>0>y$, or $-\pi+\tan^{-1}\!\left(\dfrac{x-y}{1+xy}\right)$ when $x<0<y$.

**Why the condition can never be dropped**: $\tan^{-1}$'s own principal value range is only $(-\pi/2,\pi/2)$ wide, half a full period of tangent. The true sum or difference of two angles can land outside that window even when each angle alone sits inside it — the $xy$ condition is exactly the test for whether that has happened.
