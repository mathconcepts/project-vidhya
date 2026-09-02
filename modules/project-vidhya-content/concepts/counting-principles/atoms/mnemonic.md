---
id: counting-principles.mnemonic
concept_id: counting-principles
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Order screams Permutation."** If a problem's wording implies a sequence — a ranking, a password, a race finish — that's a permutation. If it implies a group with no internal order — a team, a hand of cards, a subset — that's a combination.

**The conversion habit: "divide by the redundancy."** Any ordered count can become an unordered one by dividing out how many times each group was re-ordered: $C(n,r) = P(n,r)/r!$. Try it on a tiny case first: 3 books have $3!=6$ orderings but only $1$ way to pick all 3 as an unordered group — $6/6=1$. That check-in-miniature is the pattern for every combination formula you'll ever write.

**Sanity-check reflex:** after computing a count, ask "did I just count arrangements, or selections?" If the question asked for one and you computed the other, divide or multiply by $r!$ before you trust the number.
