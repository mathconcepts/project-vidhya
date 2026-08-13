---
id: conformal-mapping.visual-analogy
concept_id: conformal-mapping
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

**The Lens Analogy**

Imagine looking at a grid of city blocks through a curved glass lens. The lens warps your view—distant blocks appear stretched, nearby blocks appear compressed—but wherever streets cross at right angles through the lens, they *still* cross at right angles. No matter how the magnification changes across the lens, the angles are preserved.

That's conformal mapping: a transformation that can magnify and shrink different regions *unevenly*, but always preserves the angles at which curves meet. The Joukowski transformation ($w = z + 1/z$) is a famous "lens" that maps a circle to an airfoil shape—the tool aeronautical engineers use to analyze lift and drag without needing to solve flow equations directly.

```gif-scene
{"type":"function-trace","expression":"cos(x) + 0.1*sin(2*x)","x_range":[0,3.14],"y_range":[-0.3,1.3],"frames":30,"fps":12}
```
```

---

## **FILE 3: worked-example.md**
**Path:**
