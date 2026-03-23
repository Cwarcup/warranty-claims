import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "../src/data/claims.json");
const imgDir = path.join(__dirname, "../public/images/claims");

fs.mkdirSync(imgDir, { recursive: true });

const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (url, redirects) => {
      if (redirects > 5) return reject(new Error("Too many redirects"));
      const mod = url.startsWith("https") ? https : http;
      mod
        .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
          if (
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            res.resume();
            return follow(res.headers.location, redirects + 1);
          }
          if (res.statusCode !== 200) {
            res.resume();
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          const file = fs.createWriteStream(dest);
          res.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
          file.on("error", reject);
        })
        .on("error", reject);
    };
    follow(url, 0);
  });
}

async function main() {
  const claims = data.claims.filter((c) => c.referenceDocUrl);
  console.log(`Downloading images for ${claims.length} claims...`);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];
    const filename = `claim-${claim.id}.jpg`;
    const dest = path.join(imgDir, filename);

    if (fs.existsSync(dest) && fs.statSync(dest).size > 100) {
      claim.imageFilename = filename;
      success++;
      continue;
    }

    try {
      await download(claim.referenceDocUrl, dest);
      const stat = fs.statSync(dest);
      if (stat.size < 100) {
        fs.unlinkSync(dest);
        console.log(
          `  [${i + 1}/${claims.length}] ${claim.id}: too small (${stat.size}b), skipped`
        );
        fail++;
      } else {
        claim.imageFilename = filename;
        success++;
        if ((i + 1) % 20 === 0)
          console.log(`  [${i + 1}/${claims.length}] downloaded...`);
      }
    } catch (err) {
      console.log(
        `  [${i + 1}/${claims.length}] ${claim.id}: ${err.message}`
      );
      fail++;
      // Clean up partial file
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
    }

    // Small delay to be polite
    await new Promise((r) => setTimeout(r, 150));
  }

  // Update claims.json with image filenames
  for (const claim of data.claims) {
    const match = claims.find((c) => c.id === claim.id);
    if (match && match.imageFilename) {
      claim.imageFilename = match.imageFilename;
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`\nDone: ${success} downloaded, ${fail} failed`);
}

main().catch(console.error);
