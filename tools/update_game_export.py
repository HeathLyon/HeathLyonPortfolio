#!/usr/bin/env python3
"""Refresh a single-threaded Godot web export without overwriting the site shell.

Usage: python update_game_export.py EXPORT_FOLDER WEBSITE_FOLDER
Export with the basename 'index'. Keep matching WASM/PCK/engine files together.
"""
import argparse
import json
import re
import shutil
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("export_folder", type=Path)
parser.add_argument("website_folder", type=Path)
args = parser.parse_args()
export = args.export_folder.resolve()
site = args.website_folder.resolve()
shell = export / "index.html"
if not shell.is_file():
    parser.error("Export as index.html and provide the complete export folder.")
text = shell.read_text(encoding="utf-8")
match = re.search(r"const GODOT_CONFIG\s*=\s*(\{[^\n]+\});", text)
if not match:
    parser.error("Could not find the export configuration. Use a standard Godot web export.")
if re.search(r"GODOT_THREADS_ENABLED\s*=\s*true", text):
    parser.error("This site shell is configured for a single-threaded export. Disable Thread Support and export again.")
config = json.loads(match.group(1))
if config.get("executable") != "index":
    parser.error("Use index as the export basename so engine/data URLs stay consistent.")
required = ["index.js", "index.pck", "index.wasm"]
for name in required:
    if not (export / name).is_file():
        parser.error(f"Missing required exported file: {name}")
for name, expected in config.get("fileSizes", {}).items():
    if not (export / name).is_file() or (export / name).stat().st_size != expected:
        parser.error(f"Export is incomplete or mismatched: {name}")
main = site / "js/main.js"
code = main.read_text(encoding="utf-8")
pattern = r"const GODOT_EXPORT_CONFIG = \{[^\n]+\};"
if len(re.findall(pattern, code)) != 1:
    parser.error("Expected exactly one GODOT_EXPORT_CONFIG entry in js/main.js.")
code = re.sub(pattern, lambda _: "const GODOT_EXPORT_CONFIG = " + json.dumps(config) + ";", code)
destination = site / "games/drone-rush"
destination.mkdir(parents=True, exist_ok=True)
for path in export.glob("index.*"):
    if path.is_file() and path.name != "index.html":
        shutil.copyfile(path, destination / path.name)
main.write_text(code, encoding="utf-8")
print("Game binaries/configuration updated; portfolio game shell preserved.")
