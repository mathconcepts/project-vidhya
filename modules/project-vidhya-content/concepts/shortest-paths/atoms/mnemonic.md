---
id: shortest-paths.mnemonic
concept_id: shortest-paths
atom_type: mnemonic
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
modality: mnemonic
---

**"Once settled, stays settled"** — Dijkstra's entire non-negative-weight requirement collapses into that one phrase. A vertex extracted from the frontier is declared final and never revisited, so the algorithm only works if nothing extracted *later* could ever offer a cheaper route back to it.

**Worked micro-example of the phrase breaking.** Vertices $S,X,Y$; edges $S\to X=1$, $S\to Y=5$, $Y\to X=-10$. Dijkstra extracts $X$ first (distance $1$) and declares it final. Later it extracts $Y$ (distance $5$) and relaxes $Y\to X$: $5+(-10)=-5$, which is cheaper than the "final" $1$ — but $X$ is already settled, so Dijkstra never applies this update. The true shortest distance to $X$ is $-5$; Dijkstra reports $1$. Wrong, silently.

**Sanity-check reflex:** before running Dijkstra on any graph, scan every edge weight for a minus sign. One negative edge anywhere breaks "once settled, stays settled" — switch to Bellman-Ford, which never declares anything final until every edge has been relaxed $V-1$ times.
