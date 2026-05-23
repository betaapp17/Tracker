#!/bin/bash
# Run this to generate icon PNGs from SVG
# Requires: inkscape or rsvg-convert

# Create 192px icon
echo '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192"><rect width="192" height="192" rx="48" fill="#1C1C1E"/><text x="96" y="136" font-family="system-ui" font-weight="900" font-size="100" fill="#FFCC00" text-anchor="middle">T</text></svg>' > /tmp/icon.svg

# Convert with whichever tool is available
if command -v rsvg-convert &>/dev/null; then
  rsvg-convert -w 192 -h 192 /tmp/icon.svg -o icon-192.png
  rsvg-convert -w 512 -h 512 /tmp/icon.svg -o icon-512.png
elif command -v inkscape &>/dev/null; then
  inkscape /tmp/icon.svg --export-png=icon-192.png -w 192 -h 192
  inkscape /tmp/icon.svg --export-png=icon-512.png -w 512 -h 512
else
  echo "Install rsvg-convert (brew install librsvg) or inkscape to generate icons"
fi
