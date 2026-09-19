---
id: electromagnetic-induction.common-traps
concept_id: electromagnetic-induction
atom_type: common_traps
bloom_level: 4
difficulty: 0.45
exam_ids: ["*"]
---

- **Reading Lenz's law as "current opposes the field", not "current opposes the change".** These agree when a field is *increasing* (the induced current does then point opposite to the given field), which is why the wrong rule survives unnoticed for a while. They disagree the moment a field is *decreasing*: a coil in a field fading from $0.6\text{ T}$ to $0.2\text{ T}$ gets an induced current that **reinforces** the fading field, because reinforcing it is what opposes the drop. Always ask "is flux going up or down", never "which way does the field point".

- **Confusing $\varepsilon = BLv$'s conditions with a general formula.** This simple form only holds when $v$, $B$, and the rod's length $L$ are all mutually perpendicular. The moment the rod moves at an angle to the field, or the field is at an angle to the plane of motion, only the component of velocity perpendicular to $B$ (and to the rod) contributes — plugging in the full speed regardless of angle overstates the emf.

- **Treating back-emf as depending on the size of the current.** $\varepsilon = -L\,dI/dt$ depends only on how fast current is *changing*. A large, perfectly steady current in an inductor produces zero back-emf; a small current changing quickly can produce a large one. Assuming "more current means more opposition" swaps a rate-dependent law for a magnitude-dependent one.

- **Mixing up self-inductance's energy formula with the emf formula.** Energy stored is $U = \tfrac{1}{2}LI^2$ — a static snapshot at a given current, with no time derivative in it at all. Back-emf is $\varepsilon = -L\,dI/dt$ — it needs current to be *changing*. Writing $U = LI^2/t$ or a similar mash-up of the two formulas is a common slip under time pressure.

- **Assuming eddy currents only appear when a whole conductor moves.** A solid block of metal sitting still, inside a coil whose field is switched off, also has eddy currents induced in it — Lenz's law needs a *change* in flux through the material, and a changing field through a stationary block satisfies that just as well as a moving block in a steady field.
