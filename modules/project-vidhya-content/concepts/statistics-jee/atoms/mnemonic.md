---
id: statistics-jee.mnemonic
concept_id: statistics-jee
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**"A-S-R-P": Absolute, Square, Root, Percent.** Four measures, in the exact order you build them from the mean's deviations: take the **A**bsolute value (mean deviation), or **S**quare it instead (variance), then take the square **R**oot of that (standard deviation), then turn it into a **P**ercent of the mean (coefficient of variation). Each letter is one operation away from the one before it.

**"N, not N minus 1."** JEE's variance divides by the total count $N$ — the exact formula you already used in Class 10, not a "corrected" version with $N-1$ in the denominator. If a question ever seems to want $N-1$, it is not this syllabus.

**"Lower CV wins" for consistency.** Say it as a race: whichever dataset has the SMALLER coefficient of variation is the steadier one — City A's tiny CV beats City B's large one, the same way a smaller margin of error beats a bigger one.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag SD and mean — watch the coefficient of variation change",
  "why": "CV turns spread into a percentage of the mean, which is the only fair way to compare two datasets that don't share the same scale — drag either number and watch CV respond.",
  "inputs": [
    {"id": "sd", "label": "standard deviation", "min": 0, "max": 30, "step": 0.5, "initial": 11.5},
    {"id": "mean", "label": "mean", "min": 1, "max": 50, "step": 1, "initial": 27}
  ],
  "outputs": [
    {"label": "CV = (SD / mean) x 100", "formula": "(sd / mean) * 100", "digits": 2}
  ],
  "caption": "Start at SD=11.5, mean=27 — the worked example's own numbers — and check CV is about 42.6%. Now drag SD down while mean stays fixed: CV drops, meaning the same average is now MORE consistent. Drag mean up while SD stays fixed: CV also drops — the same absolute spread matters less against a bigger average."
}
```
