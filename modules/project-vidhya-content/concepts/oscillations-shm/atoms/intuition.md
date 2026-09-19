---
id: oscillations-shm.intuition
concept_id: oscillations-shm
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Before any formula, sketch the picture: a block on a spring, pulled to one side and released. Draw its position on a horizontal axis, with the centre (its resting point, where the spring is neither stretched nor compressed) marked as zero. As the block moves, plot that position against time — the curve rises to a maximum, falls back through zero, dips to a minimum on the other side, and rises again, repeating forever if nothing slows it down.

The restoring force at any moment always points back toward the centre, and its size is directly proportional to how far the block currently is from centre: $F=-kx$, where $k$ (in N/m) is the spring's stiffness and the minus sign means the force always opposes the displacement $x$. Newton's second law then turns this into a differential equation, $m\dfrac{d^2x}{dt^2}=-kx$, whose solution is $x(t)=A\sin(\omega t+\phi)$ — a sine wave, with amplitude $A$ (the maximum displacement, in metres) and angular frequency $\omega=\sqrt{k/m}$ (in rad/s).

Differentiating once gives velocity, $v(t)=A\omega\cos(\omega t+\phi)$, and again gives acceleration, $a(t)=-\omega^2x(t)$ — acceleration always points opposite to displacement and grows with it, exactly matching the restoring-force picture drawn at the start. Velocity is a cosine while displacement is a sine: the two curves are shifted relative to each other by a quarter cycle, which is the mathematical fingerprint of "speed peaks where displacement is zero, not where displacement is maximum."

Energy sloshes between two forms as this happens: kinetic energy $\frac{1}{2}mv^2$ is greatest at the centre, and potential energy $\frac{1}{2}kx^2$ is greatest at the extremes, but their sum, the total mechanical energy $E=\frac{1}{2}kA^2$, stays exactly constant throughout — for an ideal oscillator with no friction.
