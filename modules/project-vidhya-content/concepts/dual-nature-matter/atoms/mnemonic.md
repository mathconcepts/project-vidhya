---
id: dual-nature-matter.mnemonic
concept_id: dual-nature-matter
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Frequency decides the fastest one; brightness decides the count."** Two separate jobs, two separate knobs — frequency (colour) sets $KE_{max}$ through $hf-\phi$; brightness (intensity) only sets how many photoelectrons leave per second.

**For de Broglie, remember: "big and slow gives no show."** A heavy, everyday object (a cricket ball, a bus) has such large momentum $p$ that $\lambda=h/p$ works out far too small to ever notice — only something as light as an electron gets a wavelength worth measuring.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag work function and wavelength — watch photon energy and stopping potential update",
  "why": "Photon energy, kinetic energy, and stopping potential are all just arithmetic on work function and wavelength — drag either slider and watch all three rebuild instantly, for any metal, not just sodium.",
  "inputs": [
    {"id": "phi", "label": "work function φ (eV)", "min": 1, "max": 6, "step": 0.1, "initial": 2.3},
    {"id": "lam", "label": "wavelength λ (nm)", "min": 100, "max": 700, "step": 10, "initial": 400}
  ],
  "outputs": [
    {"label": "Photon energy E = 1240/λ (eV)", "formula": "1240/lam", "digits": 2},
    {"label": "Max kinetic energy = max(0, E - φ) (eV)", "formula": "max(0, 1240/lam - phi)", "digits": 2},
    {"label": "Stopping potential V0 (V)", "formula": "max(0, 1240/lam - phi)", "digits": 2}
  ],
  "caption": "Start at φ=2.3 eV, λ=400 nm: E=3.10 eV, KE_max=0.80 eV, V0=0.80 V — matching the worked example. Drag λ past about 539 nm (below sodium's threshold) and KE_max locks at 0.00 however much further you drag — nothing goes negative, because nothing is emitted."
}
```
