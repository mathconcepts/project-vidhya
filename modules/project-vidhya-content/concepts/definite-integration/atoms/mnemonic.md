---
id: definite-integration.mnemonic
concept_id: definite-integration
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
modality: mnemonic
exam_ids: ["*"]
---

**"Flip the interval, not the function."** King's Rule, $\int_a^b f(x)\,dx=\int_a^b f(a+b-x)\,dx$, is easy to misremember as changing what you integrate. It doesn't — it relabels where you START counting from. Picture reading the same strip of area left-to-right versus right-to-left: the total area under the strip cannot depend on which end you started measuring from, so the two integrals are forced to be equal, whatever $f$ happens to be.

**"Odd cancels, even doubles."** On a symmetric interval $[-a,a]$: an ODD function has equal-and-opposite area on each side of $0$, so it cancels to exactly $0$. An EVEN function has mirror-image area on each side, so it doubles instead of cancelling. The two words rhyme with the two outcomes on purpose — say "odd, cancels; even, doubles" out loud once, and the pairing sticks.

**The trap this mnemonic does NOT cover:** neither shortcut applies to a function that is neither odd nor even. Check the actual definitions, $f(-x)=\pm f(x)$, before reaching for either doubling or cancelling — a function that merely "looks balanced" is not automatically one or the other.
