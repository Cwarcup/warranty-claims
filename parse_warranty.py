#!/usr/bin/env python3
"""Parse warranty.html and append new entries to Recordofclaim.csv."""

import re
import csv
import io
from datetime import datetime

HTML_FILE = "warranty.html"
CSV_FILE = "Recordofclaim.csv"
MIN_ID = 1865000  # Skip old/completed items below this


def convert_date(date_str):
    """Convert '10-Mar-2026' to '10 Mar 2026'."""
    try:
        dt = datetime.strptime(date_str.strip(), "%d-%b-%Y")
        return dt.strftime("%-d %b %Y")
    except ValueError:
        return date_str.strip()


def decode_html_entities(text):
    """Decode common HTML entities."""
    text = text.replace("&amp;", "&")
    text = text.replace("&lt;", "<")
    text = text.replace("&gt;", ">")
    text = text.replace("&quot;", '"')
    text = text.replace("&#39;", "'")
    text = text.replace("&nbsp;", " ")
    return text


def strip_tags(html):
    """Remove HTML tags from a string."""
    return re.sub(r"<[^>]+>", "", html)


def parse_html(html_content):
    """Parse warranty HTML and return list of service request dicts."""
    # Split into card-body blocks
    blocks = re.split(r'<div class="card-body py-2">', html_content)

    entries = []
    for block in blocks[1:]:  # Skip content before first card-body
        # Request ID
        id_match = re.search(r'<span class="fw-normal">(\d+)</span>', block)
        if not id_match:
            continue
        request_id = id_match.group(1)

        # Skip old items
        if int(request_id) < MIN_ID:
            continue

        # Submitted On date
        date_match = re.search(r"Submitted On:\s*([\d]+-\w+-\d+)", block)
        submitted_date = convert_date(date_match.group(1)) if date_match else ""

        # Location
        loc_match = re.search(
            r'<span class="fw-bold">Location:</span>\s*<span>(.*?)</span>', block
        )
        location = loc_match.group(1).strip() if loc_match else ""
        location = decode_html_entities(location)

        # Description - get from <span style="word-wrap: break-word;">
        desc_match = re.search(
            r'<span style="word-wrap: break-word;">(.*?)</span>', block, re.DOTALL
        )
        description = ""
        if desc_match:
            description = desc_match.group(1).strip()
            description = strip_tags(description)
            description = decode_html_entities(description)
            # Clean up whitespace
            description = re.sub(r"\s+", " ", description).strip()

        # Reference doc URLs - extract from onclick GenerateDocument URLs
        url_matches = re.findall(
            r'GenerateDocument\?documentid=([^&"]+)', block
        )
        # Deduplicate (each URL appears twice in onclick)
        seen_urls = []
        for doc_id in url_matches:
            url = f"https://hc.homeinformationpackages.com/Homeowner/GenerateDocument?documentid={doc_id}"
            if url not in seen_urls:
                seen_urls.append(url)
        ref_doc = ", ".join(seen_urls) if seen_urls else ""

        entries.append(
            {
                "id": request_id,
                "submitted_date": submitted_date,
                "location": location,
                "description": description,
                "ref_doc": ref_doc,
            }
        )

    return entries


def main():
    # Read HTML
    with open(HTML_FILE, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Parse HTML entries
    html_entries = parse_html(html_content)
    print(f"Parsed {len(html_entries)} entries from HTML (ID >= {MIN_ID})")

    # Read existing CSV
    with open(CSV_FILE, "r", encoding="utf-8") as f:
        csv_content = f.read()

    # Parse CSV to find existing IDs
    lines = csv_content.split("\n")
    existing_ids = set()
    # Data rows start at line 14 (0-indexed: 13)
    for line in lines[13:]:
        if line.strip():
            # First field is Item #
            parts = line.split(",", 1)
            item_id = parts[0].strip()
            if item_id and item_id.isdigit():
                existing_ids.add(item_id)

    print(f"Found {len(existing_ids)} existing items in CSV")

    # Filter to new entries only
    new_entries = [e for e in html_entries if e["id"] not in existing_ids]
    # Sort by ID ascending
    new_entries.sort(key=lambda e: int(e["id"]))
    print(f"New entries to add: {len(new_entries)}")

    if not new_entries:
        print("No new entries to add.")
        return

    # Find where data rows end and empty rows begin
    # Header is line index 12, data starts at 13
    last_data_row = 12  # header row
    for i in range(13, len(lines)):
        line = lines[i]
        parts = line.split(",", 1)
        item_id = parts[0].strip() if parts else ""
        if item_id and item_id.isdigit():
            last_data_row = i
        else:
            break

    # Build new CSV rows
    new_rows = []
    for entry in new_entries:
        # Use csv writer to properly handle commas in fields
        row_buf = io.StringIO()
        writer = csv.writer(row_buf)
        writer.writerow(
            [
                entry["id"],         # Item #
                "",                  # Date Submitted to Travelers
                "",                  # Date Defect Discovered by Claimant
                entry["submitted_date"],  # Date Defect Reported to Builder
                "No",                # Has any repairs been conducted
                "",                  # Empty column
                entry["location"],   # Location Room/Area
                entry["description"],  # Description of Claim
                entry["ref_doc"],    # Reference Doc
            ]
        )
        new_rows.append(row_buf.getvalue().rstrip("\r\n"))

    # Insert new rows after last data row
    output_lines = lines[: last_data_row + 1] + new_rows + lines[last_data_row + 1 :]

    # Write updated CSV
    with open(CSV_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))

    print(f"Successfully added {len(new_entries)} new entries to {CSV_FILE}")
    print(f"New IDs: {', '.join(e['id'] for e in new_entries[:5])}... to {new_entries[-1]['id']}")


if __name__ == "__main__":
    main()
