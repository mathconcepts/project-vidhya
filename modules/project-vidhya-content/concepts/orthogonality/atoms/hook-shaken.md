---
# Alternative body for orthogonality.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: orthogonality.hook.shaken
concept_id: orthogonality
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: orthogonality.hook
for_stance: shaken
---

Two vectors are **orthogonal** when they meet at a right angle. The test: $u\cdot v=0$.

Push sixteen arrows through a rotation. Every arrow turns by the same amount.

Check any arrow's length before and after: exactly the same. Nothing stretched, nothing shrank — only direction changed.

```interactive-spec
{"v":1,"kind":"simulation","title":"Sixteen arrows meet a rotation — every length stays, every direction turns","duration_sec":9,"linear_map":{"matrix":[[0.76604444,-0.64278761],[0.64278761,0.76604444]],"num_vectors":16},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows, all length 1, are about to be pushed through a rotation matrix — $40°$ counterclockwise. Watch two things at once: each arrow's length, and its direction.","text_shaken":"Sixteen arrows, each length 1, stand around a circle. They're about to be rotated by $40°$. Watch their lengths as they turn.","text_assured":"$Q^TQ=I$ before anything moves — so whatever happens to these sixteen arrows, their lengths and the angles between them are locked in.","emphasize":false},{"at_progress":0.22,"text":"Push! Every single arrow turns — same $40°$, all together. Look closely: not one of them has grown or shrunk. Same length, new direction.","text_shaken":"Every arrow has swung around by the same angle. Check any one of them: still exactly length 1, just pointing somewhere new.","text_assured":"A rigid rotation of the whole field — the circle of tips stays exactly a circle, radius 1, the entire time.","emphasize":false},{"at_progress":0.55,"text":"The circle of arrow-tips is still a perfect circle, same radius as before — nothing stretched, nothing shrank. Every arrow turned by the identical $40°$.","text_shaken":"The circle is still a perfect circle, same size. It just spun around. Nothing got longer or shorter, anywhere on it.","text_assured":"$\\det=1$, both singular values $=1$: no stretching in any direction whatsoever — the strongest possible length-preservation guarantee.","emphasize":true},{"at_progress":0.8,"text":"No arrow ever changes length, and no two arrows change their angle to each other — but every single arrow DOES change direction. Orthogonal preserves lengths and angles, not direction.","text_shaken":"One thing to keep: an orthogonal matrix never changes any arrow's length. But it does change where each arrow points — every arrow here turned.","text_assured":"$\\|Qx\\|=\\|x\\|$ and $(Qu)\\cdot(Qv)=u\\cdot v$ are the guarantees; $Qx=x$ is not one of them — a rotation moves every direction except at most the axis of a reflection.","emphasize":false,"trap":{"text":"Students think 'orthogonal matrix' means directions are preserved, since lengths and angles between vectors are.","avoid":"Orthogonal preserves lengths and the angles BETWEEN vectors, not any single vector's own direction — a rotation turns every arrow while keeping the circle a circle."}}]}
```
