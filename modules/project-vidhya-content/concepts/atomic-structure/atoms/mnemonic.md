---
id: atomic-structure.mnemonic
concept_id: atomic-structure
atom_type: mnemonic
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: mnemonic
---

**"n, l, m, s — Size, Shape, Setting, Spin."** The four quantum numbers in order: $n$ fixes the shell **size** (and energy), $l$ fixes the subshell **shape** ($s,p,d,f$), $m_l$ fixes the orbital's **setting** (orientation in space), $s$ fixes the electron's **spin**.

**For filling order, remember: "Energy decides, not the shell number."** $4s$ genuinely fills before $3d$ because $4s$ sits lower in energy — never assume shells fill strictly $1,2,3,\dots$ in order.

**"Half-fill happy, then pair up."** Hund's rule, in one line: every orbital in a subshell gets one electron each, all spins the same way, before any orbital gets a second.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag n — watch the hydrogen energy level and orbit radius scale update live",
  "why": "Both the energy level and the orbit radius of a hydrogen atom are fixed once n is chosen — drag the slider and watch both numbers rebuild instantly from the same n, for any shell, not only n=1 or n=2.",
  "inputs": [
    {"id": "n", "label": "n (principal quantum number)", "min": 1, "max": 6, "step": 1, "initial": 1}
  ],
  "outputs": [
    {"label": "Energy level (eV) = -13.6 / n^2", "formula": "-13.6/(n^2)", "digits": 2},
    {"label": "Orbit radius, relative to n=1 (= n^2)", "formula": "n^2", "digits": 0}
  ],
  "caption": "Start at n=1: energy should read -13.60 eV and relative radius 1. Move to n=2: energy rises to -3.40 eV (one quarter as negative) while the relative radius jumps to 4 (four times as large) — energy and radius do not scale the same way with n."
}
```
