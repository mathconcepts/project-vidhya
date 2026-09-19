---
id: electromagnetic-induction.formal-definition
concept_id: electromagnetic-induction
atom_type: formal_definition
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
---

**Magnetic flux**: $\Phi = B \cdot A \cdot \cos\theta$, where $\theta$ is the angle between the field $B$ and the normal to the surface of area $A$. Unit: weber (Wb).

**Faraday's law of induction**: the induced emf in a circuit equals the negative rate of change of flux through it, $\varepsilon = -\dfrac{d\Phi}{dt}$. For a coil of $N$ turns, $\varepsilon = -N\dfrac{d\Phi}{dt}$.

**Lenz's law** (the sign in Faraday's law): the induced current always flows in the direction that opposes the *change* producing it — never in a direction that merely mirrors or cancels the field present at that instant.

**Motional emf**: a straight conductor of length $L$ moving with velocity $v$ perpendicular to a field $B$, with $v$, $B$, and $L$ mutually perpendicular, develops $\varepsilon = BLv$.

**Self-inductance**: for a coil, flux linkage is proportional to its own current, $N\Phi = LI$. Back-emf: $\varepsilon = -L\dfrac{dI}{dt}$. Unit of $L$: henry (H). Energy stored: $U = \dfrac{1}{2}LI^2$.

**Mutual inductance**: a changing current $I_1$ in one coil induces an emf in a second, nearby coil: $\varepsilon_2 = -M\dfrac{dI_1}{dt}$, where $M$ is the mutual inductance (also in henries) between the pair.

**Eddy currents**: currents induced within the *body* of a bulk conductor (not a thin wire loop) whenever the flux through it changes — from motion through a field or from a changing field on a stationary block. They oppose the change that creates them (heating the conductor and, in a moving conductor, acting as a braking force), exactly as Lenz's law requires for any induced current.
