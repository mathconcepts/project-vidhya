---
id: kinetic-theory.intuition
concept_id: kinetic-theory
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Picture a sealed box of gas: $N$ identical molecules, each of mass $m$, darting around and bouncing elastically off the walls (elastic means no kinetic energy is lost in a collision — a molecule leaves a wall exactly as fast as it arrived, just moving the other way). Every single collision delivers a tiny push to the wall. Pressure — the macroscopic quantity a gauge measures — is nothing but millions of these tiny pushes, added up over one second, spread over the wall's area.

Working that sum out for molecules moving in every direction gives $PV=\frac{1}{3}Nm\langle v^2\rangle$, the kinetic theory pressure equation. Here $\langle v^2\rangle$ is the *average of the squared speed* across all $N$ molecules — squaring first matters, because molecules fly off in every possible direction, so their ordinary vector-average velocity is zero even though every one of them is clearly moving.

Compare this molecular equation to the macroscopic ideal gas law, $PV=nRT$ ($n$ = number of moles, $R=8.314\ \text{J/(mol\cdot K)}$, $T$ in kelvin) — both describe the same gas, so they must agree. Matching them up is exactly how temperature gets defined at the molecular level: $\frac{1}{2}m\langle v^2\rangle=\frac{3}{2}kT$, where $k=1.38\times10^{-23}\ \text{J/K}$ (Boltzmann constant, the gas constant $R$ scaled down to one single molecule). Temperature, at bottom, is just a measure of average molecular kinetic energy — nothing else.

Not every molecule moves at the same speed; a whole spread exists at any instant. Three "typical speeds" summarise that spread, and they always come out in this order, smallest to largest: the most probable speed (what the largest share of molecules actually have) < the plain average speed < the root-mean-square speed $v_{rms}=\sqrt{\langle v^2\rangle}$ (the one that plugs directly into pressure and kinetic energy).
