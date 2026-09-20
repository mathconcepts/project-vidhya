---
id: haloalkanes-haloarenes.worked-example-shaken
concept_id: haloalkanes-haloarenes
atom_type: worked_example
variant_of: haloalkanes-haloarenes.worked-example
for_stance: shaken
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** 2-bromo-2-methylpropane, $(\text{CH}_3)_3\text{CBr}$, is heated with water. No base is added. Which mechanism operates?

---

**Step 1 — Classify the carbon.** Bonded to three other carbons: tertiary.

---

**Step 2 — Can $S_N2$ happen?** Three bulky groups surround the carbon. A nucleophile has no clear path to the back of it. $S_N2$ is out.

---

**Step 3 — Can $E2$ happen?** $E2$ needs a strong base. Water is a weak nucleophile, not a base. $E2$ is out too.

---

**Step 4 — What is left?** The bromine leaves on its own first, forming a carbocation on the tertiary carbon. Three neighbouring methyl groups donate electron density into the empty orbital — by hyperconjugation and the inductive effect — making this carbocation stable enough to form easily.

---

**Step 5 — Write the outcome and confirm it.** $\boxed{S_N1 \text{ operates}}$. Confirm: $S_N2$ ruled out by crowding, $E2$ ruled out by no base present — $S_N1$ is the only route left, and the substrate is exactly the kind ($3^\circ$) that favours it.

Use the decision tree below to check the same reasoning against different substrates and reagents:

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "SN1, SN2 or E2 — which pathway applies?",
  "why": "The same halogen can react by three genuinely different routes. Walk the tree below to see which one wins for a given substrate and reagent, and why the other two lose.",
  "steps": [
    {
      "prompt": "Two structurally different halides can react with the same reagent by completely different routes. What is the FIRST thing to check before predicting which route wins?",
      "hint": "Look at the carbon holding the halogen before looking at anything else.",
      "answer": "Whether that carbon is primary, secondary or tertiary -- this alone decides whether backside attack (SN2) is even physically possible."
    },
    {
      "prompt": "Backside attack is wide open on a primary carbon and essentially blocked on a tertiary one. What is the second thing to check?",
      "hint": "Look at what is doing the attacking, and what it is dissolved in.",
      "answer": "Whether the reagent is a strong nucleophile (favours substitution) or a strong base (favours elimination), and whether the solvent is polar aprotic (favours SN2) or polar protic (favours the carbocation routes, SN1/E1)."
    },
    {
      "prompt": "A tertiary substrate, no strong base present, dissolved in a protic solvent like water. Which pathway operates, and why can SN2 not compete?",
      "hint": "Ask whether backside attack has any open space at all.",
      "answer": "SN1 -- the halide leaves first, forming a stable tertiary carbocation (three neighbouring alkyl groups donate by hyperconjugation and the inductive effect), and the weak nucleophile attacks afterwards from either face. SN2 cannot compete because three bulky alkyl groups physically block the nucleophile's approach to the back of that carbon."
    }
  ],
  "branches": {
    "v": 1,
    "nodes": [
      {
        "id": "n_class",
        "question": "What class of carbon holds the halogen -- primary, secondary or tertiary?",
        "options": [
          { "label": "Primary", "next": "n_primary" },
          { "label": "Secondary", "next": "n_secondary" },
          { "label": "Tertiary", "next": "n_tertiary" }
        ]
      },
      {
        "id": "n_primary",
        "question": "What is doing the attacking -- a good nucleophile in a polar aprotic solvent, or a strong, bulky base?",
        "options": [
          { "label": "A good nucleophile, polar aprotic solvent", "next": "leaf_sn2_primary" },
          { "label": "A strong, bulky base (e.g. potassium tert-butoxide)", "next": "leaf_e2_primary_bulky" },
          { "label": "A weak nucleophile, polar protic solvent, no base", "next": "leaf_sn1_primary_wrong" }
        ]
      },
      {
        "id": "n_secondary",
        "question": "A secondary carbon can go either way. Is the reagent a good nucleophile that is a weak base, a weak nucleophile with no base present, or a strong base?",
        "options": [
          { "label": "Good nucleophile, weak base (e.g. NaCN), polar aprotic solvent", "next": "leaf_sn2_secondary" },
          { "label": "Weak nucleophile, polar protic solvent, no base", "next": "leaf_sn1_secondary" },
          { "label": "Strong base (e.g. sodium ethoxide)", "next": "leaf_e2_secondary" }
        ]
      },
      {
        "id": "n_tertiary",
        "question": "Backside attack is blocked by three alkyl groups here. The only real question left: is a strong base present?",
        "options": [
          { "label": "No strong base -- weak nucleophile, protic solvent", "next": "leaf_sn1_tertiary" },
          { "label": "A strong base is present", "next": "leaf_e2_tertiary" },
          { "label": "Attempt an SN2 attack anyway", "next": "leaf_sn2_tertiary_wrong" }
        ]
      }
    ],
    "leaves": [
      {
        "id": "leaf_sn2_primary",
        "method": "SN2: one-step backside attack, inversion of configuration.",
        "reason": "A primary carbon leaves the backside wide open, and a good nucleophile in an aprotic solvent (not tied up by hydrogen bonding) attacks it directly.",
        "best": true
      },
      {
        "id": "leaf_e2_primary_bulky",
        "method": "E2: the bulky base pulls off a neighbouring hydrogen instead.",
        "reason": "A bulky base struggles to reach the crowded backside carbon its own SN2 attack would need, so it removes an accessible hydrogen instead, favouring elimination even on a primary substrate.",
        "best": true
      },
      {
        "id": "leaf_sn1_primary_wrong",
        "method": "SN1",
        "reason": "This would require a primary carbocation to form first -- one of the least stable carbocations possible, with almost no hyperconjugation or inductive help available. It essentially never forms, so this pathway does not operate here.",
        "best": false
      },
      {
        "id": "leaf_sn2_secondary",
        "method": "SN2: one-step backside attack, inversion of configuration.",
        "reason": "A secondary carbon still has enough open space for backside attack when the nucleophile is strong and the solvent will not compete for it.",
        "best": true
      },
      {
        "id": "leaf_sn1_secondary",
        "method": "SN1, competing with some E1.",
        "reason": "With no base and a protic solvent stabilising the developing charges, the halide can ionise to a moderately stable secondary carbocation before the nucleophile attacks.",
        "best": true
      },
      {
        "id": "leaf_e2_secondary",
        "method": "E2: one-step, the base removes a neighbouring hydrogen as the halide leaves.",
        "reason": "A strong base reacts with the accessible hydrogens on the carbon before or as fast as it could attack the more hindered halide-bearing carbon, favouring elimination.",
        "best": true
      },
      {
        "id": "leaf_sn1_tertiary",
        "method": "SN1: the halide ionises first, forming a stable tertiary carbocation.",
        "reason": "Three neighbouring alkyl groups stabilise the positive charge by hyperconjugation and the inductive effect, so ionisation is fast even without a strong nucleophile pushing it along.",
        "best": true
      },
      {
        "id": "leaf_e2_tertiary",
        "method": "E2: the base removes a neighbouring hydrogen as the halide leaves.",
        "reason": "A strong base finds it far easier to reach an exposed hydrogen than to force its way past three crowding alkyl groups to attack the carbon directly.",
        "best": true
      },
      {
        "id": "leaf_sn2_tertiary_wrong",
        "method": "SN2",
        "reason": "Three alkyl groups physically block the nucleophile's path to the back of this carbon. Backside attack cannot happen here at any useful rate, regardless of how strong the nucleophile is.",
        "best": false
      }
    ]
  }
}
```
