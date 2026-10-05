#!/usr/bin/env python3
"""Download a 1,000-row Austin 311 subset for a human to upload to CARTO Builder.

Writes outside the repo by default. Do not commit the CSV.
Publish the map as Public at clausa.app.carto.com, then set VITE_CARTO_MAP_URL.
"""

from __future__ import annotations

import argparse
import csv
import sys
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.austin311 import EXPORT_WHERE, SODA_RESOURCE, soda_get

COLUMNS = [
    "sr_number",
    "sr_type_desc",
    "sr_status_desc",
    "sr_created_date",
    "sr_location",
    "sr_location_city",
    "sr_location_county",
    "sr_location_lat",
    "sr_location_long",
]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        default="/tmp/austin_311_subset.csv",
        help="Destination CSV (default: /tmp/austin_311_subset.csv, not the repo)",
    )
    parser.add_argument("--limit", type=int, default=1000)
    args = parser.parse_args()

    destination = Path(args.output).expanduser()
    if "workspace" in destination.parts or destination.is_relative_to(Path.cwd()):
        raise SystemExit("Refusing to write the 311 CSV inside the git worktree. Use --output /tmp/...")

    query = urllib.parse.urlencode(
        {
            "$select": ",".join(COLUMNS),
            "$where": EXPORT_WHERE,
            "$order": "sr_created_date DESC",
            "$limit": str(args.limit),
        }
    )
    rows = soda_get(f"{SODA_RESOURCE}?{query}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column, "") for column in COLUMNS})

    print(f"Wrote {len(rows)} rows to {destination}")
    print("Upload that file in CARTO Builder, add a Category widget on sr_type_desc")
    print("and an H3 hexbin, set visibility to Public, then put the share URL in")
    print("frontend/.env as VITE_CARTO_MAP_URL. Do not commit the CSV or a login-gated map.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
