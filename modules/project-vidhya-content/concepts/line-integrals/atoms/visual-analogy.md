---
id: line-integrals.visual_analogy
concept_id: line-integrals
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

# Line Integrals as Water Flowing Through a Pipe

Picture a river flowing through a winding valley. A **scalar line integral** measures how much total "stuff" passes along the river—like integrating water temperature × path length. A **vector line integral** measures the work the current does on a boat floating downstream. 

The key insight: if you row upstream (against the field), you do negative work. If you row downstream (with the field), work is positive. But take a different path—say, you go overland—and the total work changes entirely. The path you choose *matters* for non-conservative fields.

This is why in exams, you can't just say "the work is 5 Joules"—you must specify *which path* you took. Unless the field is conservative (like gravity), then the work depends only on start and end points, and any path gives the same answer.

```gif-scene
{"type":"parametric","expression":"cos(x)*(1+0.3*sin(t))","x_range":[0,6.28],"y_range":[-1.5,1.5],"t_range":[0,6.28],"frames":30,"fps":12}
```

```

---

## ATOM 3: Worked Example

**File path:**
