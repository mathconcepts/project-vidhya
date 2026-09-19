---
id: semiconductor-electronics.formal-definition
concept_id: semiconductor-electronics
atom_type: formal_definition
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
---

**Energy band**: a range of closely-spaced allowed electron energies in a crystal, wide enough to act as one continuous stretch rather than separate single levels.

**Valence band / conduction band**: the highest band that is (mostly) full of electrons, and the next band up where an electron can move freely and carry current, respectively.

**Band gap** $E_g$: the range of forbidden energies between the two bands, where no electron can sit. Conductors: bands overlap ($E_g=0$). Semiconductors: $E_g$ small (silicon $\approx1.1$ eV, germanium $\approx0.7$ eV). Insulators: $E_g$ large (several eV).

**Intrinsic semiconductor**: a pure crystal with no deliberate impurities; the number of free electrons equals the number of "holes" (missing electrons, behaving like moving positive charge), $n_e=n_h$.

**Extrinsic semiconductor**: an intrinsic semiconductor with deliberate impurity **doping** added.

**n-type**: doped with a pentavalent (five-valence-electron) impurity (e.g. phosphorus in silicon), which donates one extra free electron per impurity atom. Majority carrier: electrons. Minority carrier: holes.

**p-type**: doped with a trivalent (three-valence-electron) impurity (e.g. boron in silicon), which creates one extra hole per impurity atom. Majority carrier: holes. Minority carrier: electrons. The crystal stays electrically neutral overall in both cases — doping changes which carrier conducts, not the total charge.

**p-n junction and depletion region**: where a p-type and n-type region meet, carriers diffuse across and cancel near the junction, leaving a narrow carrier-free **depletion region** with a built-in **barrier potential** (silicon $\approx0.7$ V, germanium $\approx0.3$ V).

**Forward bias / reverse bias**: connecting the p-side to the higher potential (forward) narrows the depletion region and allows large current once the barrier potential is exceeded; connecting it the other way (reverse) widens the depletion region and allows only a tiny leakage current.

**Zener diode**: a diode designed to operate safely in reverse breakdown, holding a fixed voltage across itself — used for voltage regulation.

**Rectifier**: a circuit using a diode's one-way conduction to convert alternating current (AC, which reverses direction periodically) into direct current (DC, which flows one way); a half-wave rectifier uses one diode, a full-wave (bridge) rectifier uses four.
