---
id: propositional-logic.visual-analogy
concept_id: propositional-logic
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

## Think of Propositional Logic as Electrical Circuits

Imagine a light bulb controlled by switches. Each proposition is a switch: **open** (false) or **closed** (true).

**AND ($p \land q$):** Two switches in **series**. The bulb lights only if *both* switches are closed. Open one switch, the circuit breaks—the bulb is dark.

**OR ($p \lor q$):** Two switches in **parallel**. The bulb lights if *either* switch is closed. Both must be open for the bulb to stay dark.

**NOT ($\neg p$):** A relay that flips the switch state. When the input is open, the relay closes; when open, the relay closes. Inversion.

**Why this works:** Just as current flows or stops based on switch configuration, truth propagates through logical formulas based on connective rules. Complex circuits are combinations of simple series–parallel patterns, just like complex formulas combine with AND, OR, and NOT.

```gif-scene
{
  "type": "parametric",
  "title": "Series vs. Parallel Circuits",
  "x_var": "t",
  "x_range": [0, 10],
  "functions": [
    {
      "expr": "3 * (t > 5 ? 1 : 0)",
      "label": "Series (AND): Output only when both closed",
      "color": "#00AA00"
    },
    {
      "expr": "3 + (t > 3 ? 1.5 : 0) + (t > 7 ? 1.5 : 0)",
      "label": "Parallel (OR): Output when either closed",
      "color": "#0066FF"
    }
  ]
}
```

This mental model makes equivalences intuitive: De Morgan's law simply says *how series and parallel rewire*.
```

## File 3: worked-example.md
**Path:**
