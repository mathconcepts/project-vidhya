---
id: oscillations-shm.formal-definition
concept_id: oscillations-shm
atom_type: formal_definition
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
---

**Simple harmonic motion**: motion satisfying $F=-kx$ (restoring force proportional to displacement $x$, from the equilibrium point, always directed back toward it), equivalently $\dfrac{d^2x}{dt^2}=-\omega^2x$.

**Displacement, velocity, acceleration** ($A$ = amplitude in m, $\omega$ = angular frequency in rad/s, $\phi$ = initial phase in rad): $x(t)=A\sin(\omega t+\phi)$; $v(t)=A\omega\cos(\omega t+\phi)$; $a(t)=-\omega^2x(t)$.

**Time period and frequency**: $T=\dfrac{2\pi}{\omega}$ (s); $f=\dfrac{1}{T}$ (Hz).

**Spring-mass system**: $\omega=\sqrt{k/m}$, $T=2\pi\sqrt{m/k}$ ($k$ = spring constant, N/m; $m$ = mass, kg).

**Simple pendulum** (small-angle approximation, $\theta$ in radians small enough that $\sin\theta\approx\theta$): $T=2\pi\sqrt{L/g}$ ($L$ = length, m; $g$ = acceleration due to gravity, $\text{m/s}^2$).

**Energy in SHM**: kinetic energy $KE=\frac{1}{2}m\omega^2(A^2-x^2)$; potential energy $PE=\frac{1}{2}m\omega^2x^2=\frac{1}{2}kx^2$; total energy $E=\frac{1}{2}m\omega^2A^2=\frac{1}{2}kA^2$ (J), constant at every instant.

**Damped oscillation**: amplitude decays as $A(t)=A_0e^{-bt/2m}$ ($b$ = damping constant, kg/s), since energy is steadily lost to resistive forces.

**Forced oscillation and resonance**: when an external periodic force drives the system at a frequency close to its own natural frequency $\omega_0=\sqrt{k/m}$, the amplitude of oscillation grows sharply — this condition is called resonance.
