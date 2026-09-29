#!/usr/bin/env bash
# Prepare photos for the Travels page.
#
#   scripts/add-travel-photos.sh <folder> <photo> [<photo> ...]
#
# Converts each photo (HEIC, JPG, PNG) to a web-friendly JPEG (long edge 1600px, quality 82)
# in images/travels/<folder>/, then prints the lines to paste under `photos:` in _data/travels.yml.
# Browsers other than Safari cannot display HEIC, so the conversion is not optional.
# macOS only (uses the built-in `sips`). The EXIF rotation flag is kept, so portrait shots stay upright.

set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "usage: $0 <folder> <photo> [<photo> ...]" >&2
  echo "  e.g. $0 hanoi ~/Desktop/IMG_0123.HEIC ~/Desktop/IMG_0124.HEIC" >&2
  exit 1
fi

folder="$1"; shift
case "$folder" in
  _*|.*) echo "folder name must not start with _ or . (Jekyll ignores those, the photos would never appear)" >&2; exit 1 ;;
esac
root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/images/travels/$folder"
mkdir -p "$out"

for src in "$@"; do
  if [ ! -f "$src" ]; then echo "skip (not found): $src" >&2; continue; fi
  name="$(basename "${src%.*}" | tr ' ' '-')"
  dest="$out/$name.jpg"
  if [ -e "$dest" ]; then echo "skip (already exists): $folder/$name.jpg" >&2; continue; fi
  sips -s format jpeg -s formatOptions 82 -Z 1600 "$src" --out "$dest" >/dev/null
  echo "      - $folder/$name.jpg"
done
