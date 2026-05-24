#!/usr/bin/env python3
"""Add a shape-level animation to an ODP slide.

Effect kinds and names:
- entrance:  appear, fade-in, fly-in, wipe-in
- exit:      disappear, fade-out, fly-out, wipe-out
- emphasis:  pulse, spin, grow-shrink, color-change
- motion:    linear, arc, curve

CLI selects slide via --slide N or --slide-name, target shape via --shape NAME
(matched against draw:name), and effect via --effect KIND:NAME.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

from odp_common import (
    ensure_shape_id,
    ensure_timing_root,
    find_shape_by_name,
    parse_xml_from_zip,
    q,
    select_slide,
    update_meta_for_edit,
    write_odp_with_replacements,
    xml_bytes,
)

ENTRANCE_EFFECTS = {"appear", "fade-in", "fly-in", "wipe-in"}
EXIT_EFFECTS = {"disappear", "fade-out", "fly-out", "wipe-out"}
EMPHASIS_EFFECTS = {"pulse", "spin", "grow-shrink", "color-change"}
MOTION_EFFECTS = {"linear", "arc", "curve"}

TRIGGER_NODE_TYPE = {
    "on-click": "on-click",
    "on-previous": "after-previous",
    "with-previous": "with-previous",
    "after-previous": "after-previous",
}


def parse_effect(effect: str) -> tuple[str, str]:
    if ":" not in effect:
        raise SystemExit(f"--effect must be KIND:NAME (e.g. entrance:fade-in), got {effect!r}")
    kind, name = effect.split(":", 1)
    valid = {
        "entrance": ENTRANCE_EFFECTS,
        "exit": EXIT_EFFECTS,
        "emphasis": EMPHASIS_EFFECTS,
        "motion": MOTION_EFFECTS,
    }
    if kind not in valid:
        raise SystemExit(f"unknown effect kind {kind!r}; choose from {sorted(valid)}")
    if name not in valid[kind]:
        raise SystemExit(f"unknown {kind} effect {name!r}; choose from {sorted(valid[kind])}")
    return kind, name


def preset_id_for(kind: str, name: str, direction: str | None) -> str:
    """Map (kind, name, direction) to LibreOffice's ooo-* preset-id."""
    if kind == "entrance":
        base = f"ooo-entrance-{name}"
    elif kind == "exit":
        base = f"ooo-exit-{name}"
    elif kind == "emphasis":
        base = f"ooo-emphasis-{name}"
    else:  # motion
        return f"ooo-motionpath-{name}"
    if direction and name in {"fly-in", "fly-out", "wipe-in", "wipe-out"}:
        return f"{base}-{direction}"
    return base


def build_entrance_or_exit(
    kind: str,
    name: str,
    direction: str | None,
    duration: str,
    target_id: str,
) -> ET.Element:
    """Build the inner anim:par subtree for entrance/exit effects."""
    inner_attribs = {
        q("smil", "begin"): "0s",
        q("smil", "dur"): duration,
        q("smil", "fill"): "hold",
    }
    inner = ET.Element(q("anim", "par"), inner_attribs)
    visibility = "visible" if kind == "entrance" else "hidden"
    ET.SubElement(
        inner,
        q("anim", "set"),
        {
            q("smil", "attributeName"): "visibility",
            q("smil", "to"): visibility,
            q("smil", "targetElement"): target_id,
        },
    )
    if name in {"fade-in", "fade-out"}:
        from_val, to_val = ("0", "1") if name == "fade-in" else ("1", "0")
        ET.SubElement(
            inner,
            q("anim", "animate"),
            {
                q("smil", "attributeName"): "opacity",
                q("smil", "from"): from_val,
                q("smil", "to"): to_val,
                q("smil", "dur"): duration,
                q("smil", "targetElement"): target_id,
            },
        )
    elif name in {"fly-in", "fly-out", "wipe-in", "wipe-out"}:
        # Motion or wipe: use an animate on x or y per direction.
        dim = "x" if (direction or "").endswith(("left", "right")) else "y"
        if name in {"fly-in", "wipe-in"}:
            from_val = "1" if (direction or "").startswith("from-") else "0"
            to_val = "0"
        else:
            from_val = "0"
            to_val = "1"
        ET.SubElement(
            inner,
            q("anim", "animate"),
            {
                q("smil", "attributeName"): dim,
                q("smil", "from"): from_val,
                q("smil", "to"): to_val,
                q("smil", "dur"): duration,
                q("smil", "targetElement"): target_id,
            },
        )
    return inner


def build_emphasis(name: str, duration: str, target_id: str) -> ET.Element:
    """Build inner subtree for emphasis effects."""
    inner = ET.Element(
        q("anim", "par"),
        {q("smil", "begin"): "0s", q("smil", "dur"): duration, q("smil", "fill"): "hold"},
    )
    if name == "pulse":
        ET.SubElement(
            inner,
            q("anim", "animate"),
            {
                q("smil", "attributeName"): "opacity",
                q("smil", "values"): "1;0.3;1",
                q("smil", "dur"): duration,
                q("smil", "targetElement"): target_id,
            },
        )
    elif name == "spin":
        ET.SubElement(
            inner,
            q("anim", "animate"),
            {
                q("smil", "attributeName"): "rotate",
                q("smil", "from"): "0",
                q("smil", "to"): "360",
                q("smil", "dur"): duration,
                q("smil", "targetElement"): target_id,
            },
        )
    elif name == "grow-shrink":
        ET.SubElement(
            inner,
            q("anim", "animate"),
            {
                q("smil", "attributeName"): "scale",
                q("smil", "values"): "1,1;1.5,1.5;1,1",
                q("smil", "dur"): duration,
                q("smil", "targetElement"): target_id,
            },
        )
    elif name == "color-change":
        ET.SubElement(
            inner,
            q("anim", "animate-color"),
            {
                q("smil", "attributeName"): "fill-color",
                q("smil", "values"): "#000000;#ff0000;#000000",
                q("smil", "dur"): duration,
                q("smil", "targetElement"): target_id,
            },
        )
    return inner


def build_motion(name: str, direction: str | None, duration: str, target_id: str) -> ET.Element:
    """Build inner subtree for motion-path effects."""
    inner = ET.Element(
        q("anim", "par"),
        {q("smil", "begin"): "0s", q("smil", "dur"): duration, q("smil", "fill"): "hold"},
    )
    # SVG path strings for predefined directions
    path = "M 0,0 L 1,0"
    if direction == "right":
        path = "M 0,0 L 0.5,0"
    elif direction == "left":
        path = "M 0,0 L -0.5,0"
    elif direction == "down":
        path = "M 0,0 L 0,0.5"
    elif direction == "up":
        path = "M 0,0 L 0,-0.5"
    elif name == "arc":
        path = "M 0,0 Q 0.25,-0.25 0.5,0"
    elif name == "curve":
        path = "M 0,0 C 0.1,0.1 0.4,-0.1 0.5,0"
    ET.SubElement(
        inner,
        q("anim", "animateMotion"),
        {
            q("smil", "path"): path,
            q("smil", "dur"): duration,
            q("smil", "targetElement"): target_id,
        },
    )
    return inner


def build_animation(
    effect_kind: str,
    effect_name: str,
    direction: str | None,
    duration: str,
    delay: str,
    trigger: str,
    target_id: str,
) -> ET.Element:
    """Build the outer anim:par with preset-id; pick the inner builder by kind."""
    outer = ET.Element(
        q("anim", "par"),
        {
            q("presentation", "node-type"): TRIGGER_NODE_TYPE.get(trigger, "on-click"),
            q("presentation", "preset-id"): preset_id_for(effect_kind, effect_name, direction),
            q("presentation", "preset-class"): effect_kind,
        },
    )
    if direction:
        outer.set(q("presentation", "preset-sub-type"), direction)
    if delay and delay != "0ms" and delay != "0s":
        outer.set(q("smil", "begin"), delay)

    if effect_kind in {"entrance", "exit"}:
        outer.append(build_entrance_or_exit(effect_kind, effect_name, direction, duration, target_id))
    elif effect_kind == "emphasis":
        outer.append(build_emphasis(effect_name, duration, target_id))
    else:  # motion
        outer.append(build_motion(effect_name, direction, duration, target_id))
    return outer


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odp", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--slide", help="slide index (1-based) or draw:name")
    group.add_argument("--slide-name", help="alias for --slide with explicit name")
    parser.add_argument("--shape", required=True, help="target draw:name")
    parser.add_argument("--effect", required=True, help="KIND:NAME (e.g. entrance:fly-in)")
    parser.add_argument("--direction", help="from-bottom/-top/-left/-right or left/right/up/down")
    parser.add_argument("--duration", default="500ms")
    parser.add_argument("--delay", default="0ms")
    parser.add_argument(
        "--trigger",
        default="on-click",
        choices=["on-click", "on-previous", "with-previous", "after-previous"],
    )
    args = parser.parse_args()

    kind, name = parse_effect(args.effect)

    content = parse_xml_from_zip(args.input_odp, "content.xml")
    slide_arg = args.slide if args.slide is not None else args.slide_name
    slide = select_slide(content, slide_arg)
    shape = find_shape_by_name(slide, args.shape)
    if shape is None:
        print(f"warning: shape {args.shape!r} not found in slide; no animation added", file=sys.stderr)
        write_odp_with_replacements(args.input_odp, args.output, {})
        return

    target_id = ensure_shape_id(shape, content)
    timing_root = ensure_timing_root(slide)
    anim = build_animation(kind, name, args.direction, args.duration, args.delay, args.trigger, target_id)
    timing_root.append(anim)

    meta = parse_xml_from_zip(args.input_odp, "meta.xml")
    update_meta_for_edit(meta)
    write_odp_with_replacements(
        args.input_odp,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(f"animation: {kind}:{name} on shape {args.shape!r} (id={target_id})")


if __name__ == "__main__":
    main()
