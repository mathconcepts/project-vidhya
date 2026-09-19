---
id: atomic-structure.common-traps
concept_id: atomic-structure
atom_type: common_traps
bloom_level: 4
difficulty: 0.45
exam_ids: ["*"]
---

- **Treating $(n,l)$ values as independently valid without checking them together**: $n=2$ is a valid principal quantum number and $l=2$ is a valid azimuthal quantum number *in isolation*, but the rule is $l \le n-1$, so the *pair* $(2,2)$ is invalid. Check the condition on both numbers together, never one at a time.

- **Filling $3d$ before $4s$ from shell number alone**: "$n=3$ comes before $n=4$" is not how Aufbau order actually works — $4s$ is lower in energy than $3d$ and fills first. The correct filling order comes from energy, not from sorting $n$ numerically.

- **Ignoring Hund's rule and pairing electrons early**: filling $2p^2$ as $2p_x^{\uparrow\downarrow}$ (both electrons crammed into one orbital) instead of $2p_x^{\uparrow}\,2p_y^{\uparrow}$ (one electron in each of two separate orbitals first) — the second is correct and gives a different number of unpaired electrons, which changes whether the atom is predicted to be magnetic.

- **Confusing per-mole photon energy with per-photon energy**: a Bohr-formula answer in eV is the energy of *one* photon from *one* atom's transition — multiplying or dividing it by Avogadro's number without being asked to (e.g. to convert to a per-mole energy in kJ/mol) silently changes what the number means.

- **Getting the emission-energy subtraction backwards**: computing (lower level) $-$ (higher level) instead of (higher, starting level) $-$ (lower, landing level) flips the sign of the released energy, even though both levels used are individually correct.
