---
# Alternative body for propositional-logic.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: propositional-logic.worked_example.assured
concept_id: propositional-logic
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: propositional-logic.worked-example
for_stance: assured
---

$((p\to q)\land(q\to r))\to(p\to r)$ is the transitive law of implication and a tautology by construction — the fastest check isn't full conversion but a direct falsifying attempt: assume the whole thing false, which forces $p\to r$ false, i.e. $p=T,r=F$, and forces $(p\to q)\land(q\to r)$ true. $p\to q$ true with $p=T$ forces $q=T$; but $q\to r$ true with $r=F$ forces $q=F$. $q=T$ and $q=F$ contradict, so no falsifying row exists — tautology, without touching De Morgan's or building the disjunctive form at all.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Simplify: ((p → q) ∧ (q → r)) → (p → r)",
  "steps": [
    {
      "prompt": "Step 1: Convert all three implications using p → q ≡ ¬p ∨ q. What does (p → q) become?",
      "hint": "Replace the arrow with OR and negate the antecedent: ¬p ∨ q",
      "answer": "(p → q) ≡ (¬p ∨ q)"
    },
    {
      "prompt": "Step 2: Now convert the outer implication of the whole formula. A → B ≡ ¬A ∨ B, where A is the antecedent ((p → q) ∧ (q → r)). What is ¬A using De Morgan's law?",
      "hint": "¬(X ∧ Y) ≡ ¬X ∨ ¬Y. Negate each part: ¬(¬p ∨ q) ∨ ¬(¬q ∨ r). Then simplify each: (p ∧ ¬q) ∨ (q ∧ ¬r)",
      "answer": "¬((¬p ∨ q) ∧ (¬q ∨ r)) ≡ (p ∧ ¬q) ∨ (q ∧ ¬r)"
    },
    {
      "prompt": "Step 3: The full formula is now [(p ∧ ¬q) ∨ (q ∧ ¬r)] ∨ (¬p ∨ r). Test all 8 truth assignments for p, q, r. Does this ever evaluate to false?",
      "hint": "When p=F, (¬p ∨ r) is true, so the whole disjunction is true. When r=T, the same term is true. When p=T and r=F, check if (p ∧ ¬q) ∨ (q ∧ ¬r) is true. With r=F, ¬r=T, so (q ∧ ¬r) is true iff q=T. But then (p ∧ ¬q) is false. Sum: it's always true.",
      "answer": "No. The formula is a tautology (always true). This reflects the transitivity law of implication."
    }
  ],
  "caption": "Exam insight: Recognize tautologies by converting to normal form and testing systematically. Implication chains always preserve truth."
}
```

That is the general move for any implication claimed as a tautology: assume the conclusion false, propagate backward through the antecedent, and look for a forced contradiction. It is faster than truth-table conversion whenever the formula is itself an implication, and it is exactly what a converted-to-disjunction proof does implicitly, just without writing out $\neg p\lor q$ at every step.
