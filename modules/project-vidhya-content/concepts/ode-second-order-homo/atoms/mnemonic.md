---
id: ode-second-order-homo.mnemonic
concept_id: ode-second-order-homo
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**The discriminant traffic light.** Compute $\Delta=b^2-4ac$ on the characteristic equation and read it like a signal:

- **Green ($\Delta>0$):** go straight — two distinct roots, two plain exponentials, $C_1e^{r_1x}+C_2e^{r_2x}$.
- **Yellow ($\Delta=0$):** one root only — tack on an $x$ before you drive off: $(C_1+C_2x)e^{rx}$.
- **Red, turn ($\Delta<0$):** no real root at all — rotate into the complex plane and come back out as $e^{\alpha x}(C_1\cos\beta x+C_2\sin\beta x)$.

**Worked micro-example:** $y''-2y'+5y=0$. $\Delta=4-20=-16<0$ — red, turn. $r=\frac{2\pm\sqrt{-16}}{2}=1\pm2i$, so $y=e^{x}(C_1\cos2x+C_2\sin2x)$.

**Sanity-check reflex:** once you've written the solution, check that its shape matches the light — a green answer should never contain $\cos$ or $\sin$, and a yellow answer should never contain two different exponential bases.
