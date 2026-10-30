#!/usr/bin/env bash
# Update the lab-desk photo.
#
#   scripts/add-lab-photo.sh <photo> [YYYY-MM-DD]
#
# Converts the photo (HEIC, JPG, PNG) to web JPEGs at 800/1200/1600/2400 px wide in
# images/lab/<date>-<width>.jpg, then adds an entry at the top of _data/lab.yml. The homepage
# photo and the archive page /lab/ are both generated from that file, so nothing else to edit.
# The date shown on /lab/ is the day the photo was taken (default: today; pass it for older shots). macOS only (uses `sips`).

set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "usage: $0 <photo> [YYYY-MM-DD]" >&2
  exit 1
fi

src="$1"
date="${2:-$(date +%Y-%m-%d)}"
case "$date" in
  [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]) ;;
  *) echo "date must look like 2026-10-30, got: $date" >&2; exit 1 ;;
esac
[ -f "$src" ] || { echo "not found: $src" >&2; exit 1; }

root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/images/lab"
yml="$root/_data/lab.yml"
mkdir -p "$out"

if [ -e "$out/$date-2400.jpg" ] || grep -q "^- date: $date\$" "$yml" 2>/dev/null; then
  echo "an entry for $date already exists. Pass a different date, or remove it first." >&2
  exit 1
fi

for w in 800 1200 1600 2400; do
  sips -s format jpeg -s formatOptions 92 -Z "$w" "$src" --out "$out/$date-$w.jpg" >/dev/null
done

width="$(sips -g pixelWidth "$out/$date-2400.jpg" | awk '/pixelWidth/ {print $2}')"
height="$(sips -g pixelHeight "$out/$date-2400.jpg" | awk '/pixelHeight/ {print $2}')"

python3 - "$yml" "$date" "$width" "$height" <<'PY'
import sys
path, date, w, h = sys.argv[1:5]
entry = f"- date: {date}\n  width: {w}\n  height: {h}\n"
lines = open(path, encoding="utf-8").read().split("\n")
i = next((k for k, l in enumerate(lines) if l.startswith("- date:")), None)
if i is None:
    text = "\n".join(lines).rstrip("\n") + "\n\n" + entry
else:
    text = "\n".join(lines[:i]) + "\n" + entry + "\n" + "\n".join(lines[i:])
open(path, "w", encoding="utf-8").write(text)
PY

echo "added $date (${width}x${height}) to _data/lab.yml"
echo "files: images/lab/$date-{800,1200,1600,2400}.jpg"
