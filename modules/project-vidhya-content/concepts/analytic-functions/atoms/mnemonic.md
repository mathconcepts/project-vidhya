---
id: analytic-functions.mnemonic
concept_id: analytic-functions
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Same, then flip-and-negate."** The Cauchy-Riemann equations, remembered as one phrase: $u_x=v_y$ is the "same" pair (x-partial of the real part equals y-partial of the imaginary part), and $u_y=-v_x$ is "flip-and-negate" (swap which variable, then negate).

**Worked micro-example.** For $f(z)=e^z$: $u=e^x\cos y$, $v=e^x\sin y$. Same pair: $u_x=e^x\cos y$, $v_y=e^x\cos y$ — match. Flip-and-negate pair: $u_y=-e^x\sin y$, $-v_x=-e^x\sin y$ — match.

**Sanity-check reflex.** Before writing out all four partials, check whether $u$ is harmonic ($u_{xx}+u_{yy}=0$) — analytic always forces harmonic, so a non-harmonic $u$ rules out analyticity in one line, before the CR equations are even needed.
