#!/usr/bin/env python3
"""
build.py — render Manim scenes to MP4 + auto-emit a VTT caption sibling.

Usage:
    python build.py scenes/<scene>.py        # render one scene
    python build.py --all                    # render every scene under scenes/
    python build.py --check                  # CI mode: list scenes whose
                                              .mp4 is missing or stale

The script invokes the system `manim` CLI (avoids tight binding to manim
internals across versions). It expects each scene file to expose:
  - exactly one Scene subclass
  - that class with a CAPTION_LINES = [(start, end, text), ...] attribute

Outputs are written to ../media/manim/<basename>.mp4 (and .vtt). The lesson
page references them via `:::manim{src="/media/manim/<basename>.mp4"}` —
the public web root resolves /media/* to that directory.
"""

from __future__ import annotations

import argparse
import importlib.util
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCENES_DIR = ROOT / "scenes"
OUT_DIR = (ROOT.parent / "media" / "manim").resolve()
QUALITY = "-qm"  # 720p30 — good balance of size + clarity


def _scene_class_name(scene_path: Path) -> str:
    """Find the first Scene subclass in the module via static import."""
    spec = importlib.util.spec_from_file_location(scene_path.stem, scene_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not load module from {scene_path}")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[scene_path.stem] = mod
    try:
        spec.loader.exec_module(mod)  # type: ignore[union-attr]
    except Exception as e:
        raise RuntimeError(f"importing {scene_path} failed: {e}") from e
    from manim import Scene  # local import — only needed at build time
    candidates = [
        name for name, val in mod.__dict__.items()
        if isinstance(val, type) and issubclass(val, Scene) and val is not Scene
    ]
    if not candidates:
        raise RuntimeError(f"{scene_path}: no Scene subclass found")
    if len(candidates) > 1:
        # Prefer one whose name doesn't start with underscore.
        non_private = [c for c in candidates if not c.startswith("_")]
        if non_private:
            return non_private[0]
    return candidates[0]


def _seconds_to_vtt_ts(s: float) -> str:
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = s - h * 3600 - m * 60
    return f"{h:02d}:{m:02d}:{sec:06.3f}"


def _emit_vtt(scene_path: Path, target: Path) -> None:
    spec = importlib.util.spec_from_file_location(scene_path.stem, scene_path)
    mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    cls_name = _scene_class_name(scene_path)
    cls = getattr(mod, cls_name)
    lines = getattr(cls, "CAPTION_LINES", None)
    if not lines:
        print(f"  ! {scene_path.name}: no CAPTION_LINES — skipping VTT (a11y gap!)")
        return
    out = ["WEBVTT", ""]
    for i, (start, end, text) in enumerate(lines, start=1):
        out.append(str(i))
        out.append(f"{_seconds_to_vtt_ts(start)} --> {_seconds_to_vtt_ts(end)}")
        out.append(text)
        out.append("")
    target.write_text("\n".join(out), encoding="utf-8")
    print(f"  ✓ wrote {target.name}")


def _render(scene_path: Path) -> None:
    if shutil.which("manim") is None:
        print("manim CLI not found — `pip install manim` first.", file=sys.stderr)
        sys.exit(2)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cls_name = _scene_class_name(scene_path)
    basename = scene_path.stem
    cmd = [
        "manim", QUALITY,
        "--output_file", basename,
        "--media_dir", str(OUT_DIR.parent),
        str(scene_path),
        cls_name,
    ]
    print("→", " ".join(cmd))
    res = subprocess.run(cmd, check=False)
    if res.returncode != 0:
        print(f"manim render failed for {scene_path}", file=sys.stderr)
        sys.exit(res.returncode)
    # Manim writes to a nested directory by default; flatten.
    found = list((OUT_DIR.parent / "videos").rglob(f"{basename}.mp4"))
    if found:
        target = OUT_DIR / f"{basename}.mp4"
        shutil.copy2(found[0], target)
        print(f"  ✓ {target}")
    _emit_vtt(scene_path, OUT_DIR / f"{basename}.vtt")


def _stale(scene_path: Path) -> bool:
    target = OUT_DIR / f"{scene_path.stem}.mp4"
    if not target.exists():
        return True
    return scene_path.stat().st_mtime > target.stat().st_mtime


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("scene", nargs="?", help="scene file to render")
    p.add_argument("--all", action="store_true", help="render every scene under scenes/")
    p.add_argument("--check", action="store_true", help="exit 1 if any scene is stale (CI use)")
    args = p.parse_args()

    if args.check:
        stale = [s for s in SCENES_DIR.glob("*.py") if not s.name.startswith("_") and _stale(s)]
        if stale:
            print("Stale scenes (re-run build.py --all):")
            for s in stale:
                print(f"  - {s.name}")
            sys.exit(1)
        print("All scene renders are current.")
        return

    if args.all:
        for s in sorted(SCENES_DIR.glob("*.py")):
            if s.name.startswith("_"):
                continue
            print(f"\n=== {s.name} ===")
            _render(s)
        return

    if not args.scene:
        p.print_help()
        sys.exit(2)
    _render(Path(args.scene).resolve())


if __name__ == "__main__":
    main()
