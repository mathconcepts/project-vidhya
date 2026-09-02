---
id: pde-basics.mnemonic
concept_id: pde-basics
atom_type: mnemonic
bloom_level: 2
difficulty: 0.7
exam_ids: ["*"]
modality: mnemonic
---

**Borrow the conic-section names, because the test really is the conic-section test.** Picture slicing a cone at increasing tilt: shallow gives a closed loop, matched-to-the-side gives an open curve, steep enough to cross both nappes gives two branches — ellipse, parabola, hyperbola. $Au_{xx}+Bu_{xy}+Cu_{yy}$ carries the same $\Delta=B^2-4AC$ that classifies the conic $Ax^2+Bxy+Cy^2=\text{const}$, so the PDE's name is the shape of its characteristic curves, not decoration.

**Micro-example.** For $u_{xx}-u_{yy}=0$: $A=1$, $B=0$, $C=-1$, so $\Delta = 0^2-4(1)(-1)=4>0$ — hyperbolic, the steep-tilt case, exactly like the wave equation it resembles once $y$ stands for time.

**Sanity-check reflex.** Whatever type the discriminant returns, ask whether it matches the physics on the page: steady-state should land elliptic, diffusion parabolic, propagation hyperbolic. A mismatch means a coefficient was misread, not that the rule bent.
