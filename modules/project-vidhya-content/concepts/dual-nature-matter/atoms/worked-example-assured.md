---
id: dual-nature-matter.worked-example-assured
concept_id: dual-nature-matter
atom_type: worked_example
variant_of: dual-nature-matter.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A sodium surface (work function $\phi=2.3$ eV) gives stopping potential $V_0=0.8$ V for light of wavelength $400$ nm. Using a second point — $300$ nm gives $V_0\approx1.83$ V — find Planck's constant $h$ and check $\phi$, without assuming $\phi$ upfront.

---

**Step 1 — Convert both wavelengths to frequency.** $f=c/\lambda$: $f_1=\dfrac{3\times10^8}{400\times10^{-9}}=7.5\times10^{14}$ Hz, $f_2=1.0\times10^{15}$ Hz.

---

**Step 2 — Read $h/e$ straight off the slope.** $V_0=\dfrac{h}{e}f-\dfrac{\phi}{e}$ is a straight line in $f$, so $\dfrac{h}{e}=\dfrac{V_{0,2}-V_{0,1}}{f_2-f_1}=\dfrac{1.83-0.8}{2.5\times10^{14}}\approx4.13\times10^{-15}$ V s, giving $h\approx6.62\times10^{-34}$ J s — close to the accepted value, from **only two readings**, no metal-specific number assumed.

$$\boxed{h\approx6.62\times10^{-34}\text{ J s}}$$

**Why this beats solving each point separately.** Given a single $(\lambda, V_0)$ pair with $\phi$ already stated, Einstein's equation alone settles everything — no graph needed. But JEE often hands over **two** stopping-potential readings and asks for $h$ or $\phi$ with neither given directly; then the slope-intercept read of $V_0=\frac{h}{e}f-\frac{\phi}{e}$ is the only route that uses both readings at once, instead of guessing which one already carries a known constant.
