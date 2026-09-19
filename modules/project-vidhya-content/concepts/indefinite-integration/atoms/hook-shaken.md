---
id: indefinite-integration.hook.shaken
concept_id: indefinite-integration
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: indefinite-integration.hook
for_stance: shaken
---

Look at $\int \dfrac{2x+3}{x^2+3x+7}\,dx$. First move: differentiate the bottom. $\dfrac{d}{dx}(x^2+3x+7)=2x+3$. That is exactly the top. So set $u=x^2+3x+7$. Then $du=(2x+3)\,dx$ — the whole top, in one line. The integral becomes $\int \dfrac{du}{u}=\ln|u|+C=\ln|x^2+3x+7|+C$. Check it: differentiate $\ln(x^2+3x+7)$ and you get $\dfrac{2x+3}{x^2+3x+7}$ back — the exact question you started with.
