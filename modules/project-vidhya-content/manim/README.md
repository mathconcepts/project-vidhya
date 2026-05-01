# Manim Authoring

Pre-rendered concept animations for the `:::manim` interactive directive.

Each scene is a Python file under `scenes/` that authors a single 15-30s
animation in [Manim Community](https://www.manim.community/). The build
script renders to MP4 + auto-generates a VTT caption sidecar, then writes
both into `../media/manim/` where the lesson page picks them up via:

```markdown
:::manim{src="/media/manim/<concept>-<topic>.mp4" alt="…"}
:::
```

## One-time setup

```bash
# In a fresh venv (Manim has heavy native deps; isolate):
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# System deps (Linux):
sudo apt-get install libcairo2-dev pkg-config python3-dev ffmpeg
# Or macOS:
brew install cairo pango ffmpeg
```

## Authoring a new scene

1. Copy `scenes/_template.py` to `scenes/<concept-id>-<topic>.py`.
2. Implement `class Scene(ManimScene)` with `construct()` and a `caption_lines`
   class attribute (list of `(start_seconds, end_seconds, text)` tuples).
3. Render with the build script:

   ```bash
   python build.py scenes/<concept-id>-<topic>.py
   ```

   This invokes `manim` at the project's standard quality preset (720p, 30fps),
   writes `../media/manim/<concept-id>-<topic>.mp4`, and emits the matching
   `.vtt` from `caption_lines`.

4. Reference the result from an atom:

   ```markdown
   :::manim{src="/media/manim/<concept-id>-<topic>.mp4" alt="<one-sentence summary>"}
   :::
   ```

5. Commit both the source `.py` and the rendered `.mp4` + `.vtt`. Pre-rendered
   videos are checked in because the eng review baseline says the lesson page
   must work without a CI render step.

## Quality bar

- 15-30s runtime; longer animations should be split into multiple scenes.
- Captions for every spoken or implied beat (accessibility floor).
- Theme palette: bg `#0b0d10`, primary `#10b981`, secondary `#a78bfa`, axes
  `#374151`. Constants live in `theme.py`.
- Reduced-motion users see a still frame fallback (configured in the React
  component, not authored per-scene).

## Re-rendering after a Manim upgrade

```bash
python build.py --all
```

Walks every scene under `scenes/` and re-renders to `../media/manim/`.
Idempotent — re-running on unchanged sources is a no-op (mtime check).
