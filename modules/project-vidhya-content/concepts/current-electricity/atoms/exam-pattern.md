---
id: current-electricity.exam-pattern
concept_id: current-electricity
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
modality: text
---

**How JEE Main actually asks this.**

- **NAT: reduce the network, then apply Ohm's law once.** Combine series and parallel resistors down to a single equivalent resistance first, then find the total current or a specific branch current — never write Kirchhoff's rules for a network that's really just series-and-parallel in disguise.

- **MCQ: multi-loop circuits force Kirchhoff's rules.** The moment a circuit has more than one loop that can't be reduced by simple series/parallel combination, pick a walking direction and current directions for each loop, write the sign-consistent loop equations, and solve them together.

- **Trap: emf vs terminal voltage phrasing.** "What does the voltmeter read across the cell" is always asking for terminal voltage, never the emf printed on the cell, the instant any current flows.

- **Trap: sign consistency across a redrawn circuit.** A wrong option is often built by flipping exactly one sign in the loop equation — the fix is finishing one loop's signs before starting the next, never re-deciding a direction partway through.

- **Time budget:** a straightforward series-parallel reduction NAT should take under a minute; a genuine two-loop Kirchhoff problem is worth budgeting two to three minutes for, since setting up consistent signs takes longer than solving the resulting equations.

