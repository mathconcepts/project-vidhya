---
id: propositional-logic.intuition
concept_id: propositional-logic
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
modality: visual
---

Start from a guess many students make: that $P \to Q$ and $Q \to P$ say the same thing. Test it on one concrete pair.

Let $P$ = "the animal is a whale," $Q$ = "the animal is a mammal." $P \to Q$ says: every whale is a mammal — true. $Q \to P$ says: every mammal is a whale — false, since a dog is a mammal and not a whale.

One counterexample kills the guess: an implication and its **converse** ($Q\to P$) are independent statements. Swapping the direction can flip the truth value entirely.

What *does* stay equivalent to $P\to Q$? Only its **contrapositive**, $\neg Q \to \neg P$. "Not a mammal, so not a whale" carries exactly the same information as the original, because $P \to Q \equiv \neg Q \to \neg P$ holds for every assignment of truth values — that identity is the one worth keeping, not the assumption that any rearrangement is safe.
