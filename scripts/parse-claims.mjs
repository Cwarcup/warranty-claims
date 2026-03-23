import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CSV_PATH = resolve(__dirname, '../../Recordofclaim.csv');
const OUTPUT_PATH = resolve(__dirname, '../src/data/claims.json');

// Minimal but correct RFC 4180 CSV parser
// Handles quoted fields (with embedded commas) and "" escaped double-quotes
function parseCSVLine(line) {
  const fields = [];
  let i = 0;
  while (i <= line.length) {
    if (i === line.length) {
      // end of line — push empty field only if we were in the middle of something
      fields.push('');
      break;
    }
    if (line[i] === '"') {
      // quoted field
      let field = '';
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            // escaped double-quote
            field += '"';
            i += 2;
          } else {
            // closing quote
            i++;
            break;
          }
        } else {
          field += line[i];
          i++;
        }
      }
      fields.push(field);
      // skip comma separator
      if (i < line.length && line[i] === ',') i++;
    } else {
      // unquoted field
      const commaIdx = line.indexOf(',', i);
      if (commaIdx === -1) {
        fields.push(line.slice(i));
        break;
      } else {
        fields.push(line.slice(i, commaIdx));
        i = commaIdx + 1;
      }
    }
  }
  return fields;
}

// Because some rows have the location+description merged into fewer columns when
// the CSV has no quote wrapping and a comma inside the location field shifts everything,
// we need to handle the column count carefully.
// Expected columns (0-indexed):
//   0: Item #
//   1: Date Submitted to Travelers
//   2: Date Defect Discovered by Claimant
//   3: Date Defect Reported to Builder
//   4: Has any repairs been conducted by the builder?
//   5: (empty)
//   6: Location Room/Area
//   7: Description of Claim
//   8: Reference Doc

const raw = readFileSync(CSV_PATH, 'utf-8');

// Normalize line endings
const rawLines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

// We need to handle multi-line quoted fields. Build a list of logical CSV rows first.
function splitIntoLogicalLines(text) {
  const logicalLines = [];
  let current = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuote && i + 1 < text.length && text[i + 1] === '"') {
        // escaped double-quote inside quoted field
        current += '""';
        i++;
      } else {
        inQuote = !inQuote;
        current += ch;
      }
    } else if (ch === '\n' && !inQuote) {
      logicalLines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.length > 0) logicalLines.push(current);
  return logicalLines;
}

const logicalLines = splitIntoLogicalLines(rawLines);

// Extract metadata from lines 5-11 (1-indexed → 0-indexed: 4-10)
const ownerLine = logicalLines[4];  // line 5
const addressLine = logicalLines[6]; // line 7
const warrantyLine = logicalLines[8]; // line 9
const builderLine = logicalLines[9];  // line 10
const ownershipLine = logicalLines[10]; // line 11

function extractMeta(line) {
  const fields = parseCSVLine(line);
  return fields[2]?.trim() ?? '';
}

const owner = {
  name: extractMeta(ownerLine),
  address: extractMeta(addressLine),
  warrantyNumber: extractMeta(warrantyLine),
  builder: extractMeta(builderLine),
  ownershipDate: extractMeta(ownershipLine),
};

// Data rows start at line 14 (1-indexed) → index 13 (0-indexed)
// Headers are at index 12

const DATA_START = 13; // 0-indexed

// Regex to detect attached image filenames like 162-2350165Street-183.JPG
const IMAGE_FILENAME_RE = /\b(\d{3}-\d+Street-\d+\.\w{3,4})\b/i;

const claims = [];

for (let idx = DATA_START; idx < logicalLines.length; idx++) {
  const line = logicalLines[idx];
  if (!line.trim()) continue;

  const fields = parseCSVLine(line);

  const itemId = fields[0]?.trim();
  if (!itemId) continue; // skip rows with no Item #

  // Validate it looks like a numeric ID
  if (!/^\d+$/.test(itemId)) continue;

  const dateSubmitted = fields[1]?.trim() ?? '';
  const dateDiscovered = fields[2]?.trim() ?? '';
  const dateReported = fields[3]?.trim() ?? '';
  const repairsRaw = fields[4]?.trim().toLowerCase() ?? '';
  // field 5 is empty column
  const location = fields[6]?.trim() ?? '';
  const description = fields[7]?.trim() ?? '';
  const referenceDocUrl = fields[8]?.trim() ?? '';

  const repairsDone = repairsRaw === 'yes';

  // Derive imageFilename from description if it mentions a file
  const imageMatch = description.match(IMAGE_FILENAME_RE);
  const imageFilename = imageMatch ? imageMatch[1] : '';

  claims.push({
    id: itemId,
    dateSubmitted,
    dateDiscovered,
    dateReported,
    repairsDone,
    location,
    description,
    referenceDocUrl,
    imageFilename,
  });
}

const output = { owner, claims };

writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');

console.log(`Parsed ${claims.length} claims.`);
console.log(`Output written to: ${OUTPUT_PATH}`);
console.log('Owner:', JSON.stringify(owner, null, 2));
console.log('First claim:', JSON.stringify(claims[0], null, 2));
console.log('Last claim:', JSON.stringify(claims[claims.length - 1], null, 2));
