---
id: numerical-error-analysis.visual-analogy
concept_id: numerical-error-analysis
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.22
exam_ids: ["*"]
scaffold_fade: true
---

# A Ruler With Fuzzy Tick Marks

Picture an old wooden ruler where the ink on the tick marks has smudged slightly — you can read a length confidently to the nearest millimeter, but beyond that, the last digit is a guess. Every reading you take off this ruler carries a small, honest uncertainty: that's your **absolute error**, a fixed fuzziness that doesn't care what you're measuring. But hand someone a 3 mm bolt and a fuzziness of 1 mm ruins the measurement completely; hand someone a 3 m plank and the same 1 mm fuzziness barely matters. That's why **relative error** — the fuzziness *as a fraction of the thing being measured* — is the number that actually tells you whether to trust a reading.

Now picture two different situations where numbers get "cut short." In the first, you write down a measurement as 3.14 instead of the ruler's true fuzzy value of 3.14159... — you're **rounding**, discarding digits you never truly had access to anyway; this is like the smudged tick marks themselves. In the second, you're computing $e^x$ using its infinite Taylor series but you stop after 4 terms instead of adding on forever — you're **truncating** a process that, if you had infinite patience, would eventually reach the exact answer. Rounding error is baked into how finely you can *read* a number; truncation error is baked into how long you're willing to *keep computing*.

Finally, imagine stacking two fuzzy-ruler measurements together — end to end for a sum, or multiplying them for an area. The fuzziness doesn't cancel out just because you're combining two independent readings; in the worst case, the fuzziness of a sum is the sum of the fuzziness of the parts, and for a product, it's the *relative* fuzziness that adds. Errors compound — they don't average away just by combining more approximate numbers.

---
