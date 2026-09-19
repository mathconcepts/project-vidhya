---
id: aldehydes-ketones-acids.intuition-shaken
concept_id: aldehydes-ketones-acids
atom_type: intuition
variant_of: aldehydes-ketones-acids.intuition
for_stance: shaken
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

Ask one question first: does the carbon right next to the carbonyl carbon (the alpha carbon) have a hydrogen on it?

Case 1 — yes, it has a hydrogen. A strong base removes exactly that hydrogen, not any other hydrogen in the molecule. Doing so leaves a negative charge that spreads onto the carbonyl oxygen — the carbonyl group right next door stabilises it. This stabilised species is called an **enolate**. The enolate now has spare electron density of its own, so it attacks the carbonyl carbon of a second molecule: its electrons form a new bond there, while that second molecule's own carbonyl pi electrons shift onto its oxygen. This is the **aldol** reaction.

Case 2 — no, there is no alpha-hydrogen. The enolate route cannot start; there is nothing next to the carbonyl carbon for the base to pull off. The base attacks the carbonyl carbon directly instead. This alternative is the **Cannizzaro** reaction, worked in full detail next.

One yes/no check on one specific hydrogen decides which of these two happens.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Which carbonyl reaction actually happens?",
  "why": "One check — is there a hydrogen on the carbon next to the carbonyl carbon — decides between two completely different base-driven reactions.",
  "steps": [
    {
      "prompt": "You treat a carbonyl compound with concentrated NaOH. The compound has no hydrogen on the carbon next to its carbonyl carbon (no alpha-hydrogen) — for example benzaldehyde, whose carbonyl carbon is attached only to the benzene ring on one side and to a hydrogen on the other. What happens?",
      "hint": "Check one thing first: is there a hydrogen on the carbon right next to the carbonyl carbon for the base to remove?",
      "answer": "No alpha-hydrogen means no enolate can form, so the self-aldol route is closed before it starts. Hydroxide instead attacks the carbonyl carbon of one molecule directly, forming a tetrahedral intermediate that hands a hydride ion across to the carbonyl carbon of a second molecule of the same aldehyde. One molecule ends up oxidised to the carboxylate salt; the other is reduced to the alcohol. This disproportionation is the Cannizzaro reaction."
    }
  ],
  "branches": {
    "v": 1,
    "nodes": [
      {
        "id": "akac_alpha_h_check",
        "question": "You treat a carbonyl compound with concentrated NaOH. The compound has no hydrogen on the carbon next to its carbonyl carbon (no alpha-hydrogen) — for example benzaldehyde, whose carbonyl carbon is attached only to the benzene ring on one side and to a hydrogen on the other. What happens?",
        "options": [
          { "label": "Two molecules disproportionate: one is oxidised to the acid, the other reduced to the alcohol", "next": "akac_leaf_cannizzaro" },
          { "label": "One molecule's enolate attacks a second molecule's carbonyl carbon (self-aldol)", "next": "akac_leaf_aldol_wrong" },
          { "label": "Nothing happens — carbonyl compounds only react with acids, not bases", "next": "akac_leaf_nothing_wrong" }
        ]
      }
    ],
    "leaves": [
      {
        "id": "akac_leaf_cannizzaro",
        "method": "Cannizzaro reaction (disproportionation)",
        "reason": "Correct. No alpha-hydrogen means no enolate can form, so the base cannot open the aldol route at all. Hydroxide attacks the carbonyl carbon directly instead, forming a tetrahedral intermediate. That intermediate then transfers a hydride ion to the carbonyl carbon of a second molecule of the same aldehyde: the first molecule becomes the carboxylate (oxidised), the second becomes the alkoxide, which is protonated to the alcohol on workup (reduced). One base, two molecules, opposite fates.",
        "best": true
      },
      {
        "id": "akac_leaf_aldol_wrong",
        "method": "Self-aldol condensation",
        "reason": "Wrong for this compound. Aldol needs the base to remove an alpha-hydrogen first, forming the enolate that then acts as the attacking nucleophile. Benzaldehyde's only carbon next to the carbonyl carbon is an aromatic ring carbon, and it carries no hydrogen to remove — it is already bonded to three other ring atoms plus the carbonyl carbon. With no alpha-hydrogen to pull off, no enolate ever forms, so this route is closed before the first step.",
        "best": false
      },
      {
        "id": "akac_leaf_nothing_wrong",
        "method": "No reaction occurs",
        "reason": "Wrong. Hydroxide is a strong nucleophile and does attack the electrophilic carbonyl carbon of any aldehyde or ketone, whether or not that molecule has an alpha-hydrogen. The alpha-hydrogen check decides what happens AFTER that attack, not whether the base reacts at all.",
        "best": false
      }
    ]
  },
  "caption": "Every route is walkable. Pick the one you would actually take and read why it lands where it does."
}
```
