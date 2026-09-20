---
id: semiconductor-electronics.intuition
concept_id: semiconductor-electronics
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

Every solid has electrons sitting in **energy bands** — wide ranges of allowed energy so closely spaced they behave like one continuous stretch, unlike the sharply separated single levels of one isolated atom. The **valence band** is the highest band that is (mostly) full of electrons; the **conduction band** is the next band up, where an electron can move freely and actually carry current. Between them sits a gap of forbidden energies, the **band gap** $E_g$, where no electron can sit at all.

In a conductor (a metal), the two bands overlap, so electrons are always free to move — that is why metals conduct well at any temperature. In an insulator, $E_g$ is huge (several eV), so essentially no electron ever gathers enough energy to cross it. A **semiconductor** sits in between: $E_g$ is small enough (around $1$ eV) that a modest amount of heat energy lets a few electrons hop across even at room temperature — few enough that pure ("intrinsic") silicon conducts poorly, but not zero, and its conductivity *rises* with temperature, unlike a metal's, which falls.

**Doping** deliberately adds a small number of chosen impurity atoms to shift this balance: a donor impurity contributes extra electrons close to the conduction band's edge; an acceptor impurity contributes extra "holes" (missing electrons that behave like moving positive charge) close to the valence band's edge. Either way, far more carriers become available than in the pure crystal, at the same temperature.
