---
id: current-electricity.intuition
concept_id: current-electricity
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Picture current as water flowing through pipes. A junction where three pipes meet must have exactly as much water flowing in as flowing out — nothing piles up, nothing appears from nowhere. That is **Kirchhoff's junction rule**: at any junction, the sum of currents flowing in equals the sum flowing out.

The **loop rule** is about walking around a closed loop of the circuit and adding up every voltage change, which must total zero by the time you get back to where you started — because voltage is like height, and you can't end up higher or lower than where you began by walking in a circle.

The part that trips almost everyone up is **sign bookkeeping**: before writing the loop equation, pick one direction to "walk" around the loop, and one assumed direction for each unknown current. Then, every time you cross a resistor in the direction you assumed the current flows, voltage *drops* (subtract $IR$); crossing it against that assumed direction, voltage *rises* (add $IR$). Crossing a cell from $-$ to $+$ inside it is a *rise* of its emf; from $+$ to $-$ is a *drop*. Mixing up even one of these signs makes the whole loop equation wrong, even if every individual formula used was correct.

