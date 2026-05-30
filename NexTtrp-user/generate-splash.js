/**
 * NEXTTRP Splash Screen Generator
 * Generates a 1080×1920 splash.png from the logo file.
 * Uses: jimp-compact (already in node_modules)
 *
 * Run: node generate-splash.js
 */

const jimp = require('jimp-compact');
const path = require('path');

const W = 1080;
const H = 1920;

// Brand colours
const BG_CENTER  = { r: 0x15, g: 0x28, b: 0x42 }; // #152842 – deep navy (centre)
const BG_EDGE    = { r: 0x06, g: 0x0D, b: 0x18 }; // #060D18 – near-black (edge)
const GLOW_COLOR = { r: 0xF5, g: 0x80, b: 0x1E }; // #F5801E – brand orange

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function lerp(a, b, t) { return Math.round(a * (1 - t) + b * t); }

async function makeBackground() {
  const bg = await jimp.create(W, H, jimp.rgbaToInt(BG_EDGE.r, BG_EDGE.g, BG_EDGE.b, 255));

  // Radial gradient: lighter in the centre, very dark at the edges
  bg.scan(0, 0, W, H, function (x, y, idx) {
    const dx = (x - W * 0.5) / (W * 0.55);
    const dy = (y - H * 0.43) / (H * 0.55);
    const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy));

    this.bitmap.data[idx]     = lerp(BG_CENTER.r, BG_EDGE.r, dist);
    this.bitmap.data[idx + 1] = lerp(BG_CENTER.g, BG_EDGE.g, dist);
    this.bitmap.data[idx + 2] = lerp(BG_CENTER.b, BG_EDGE.b, dist);
    this.bitmap.data[idx + 3] = 255;
  });

  return bg;
}

function addStars(bg, logoX, logoY, logoSize) {
  const rng = () => Math.random();

  for (let i = 0; i < 220; i++) {
    const x = Math.floor(rng() * W);
    const y = Math.floor(rng() * H);

    // Skip pixels that fall inside the logo area (leave room for glow too)
    const margin = 130;
    if (x > logoX - margin && x < logoX + logoSize + margin &&
        y > logoY - margin && y < logoY + logoSize + margin) continue;

    const bright = Math.floor(rng() * 90 + 130);  // 130-220
    const alpha  = Math.floor(rng() * 160 + 50);   // 50-210

    bg.setPixelColor(jimp.rgbaToInt(bright, bright, bright, alpha), x, y);

    // Occasionally make a 2-pixel "bright" star
    if (rng() > 0.78) {
      const a2 = Math.floor(alpha * 0.45);
      if (x + 1 < W) bg.setPixelColor(jimp.rgbaToInt(bright, bright, bright, a2), x + 1, y);
      if (y + 1 < H) bg.setPixelColor(jimp.rgbaToInt(bright, bright, bright, a2), x, y + 1);
    }
  }
}

async function makeGlow(size) {
  const glow = await jimp.create(size, size, 0x00000000);
  const cx = size / 2;

  glow.scan(0, 0, size, size, function (x, y, idx) {
    const dx = x - cx;
    const dy = y - cx;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= cx) return;

    const t = 1 - dist / cx;           // 1 at centre → 0 at ring edge
    const alpha = Math.round(Math.pow(t, 1.8) * 55); // max ~55 / 255

    this.bitmap.data[idx]     = GLOW_COLOR.r;
    this.bitmap.data[idx + 1] = GLOW_COLOR.g;
    this.bitmap.data[idx + 2] = GLOW_COLOR.b;
    this.bitmap.data[idx + 3] = alpha;
  });

  return glow;
}

async function loadLogo(logoPath, targetSize) {
  const img = await jimp.read(logoPath);

  // Remove the white / near-white background that surrounds the badge
  // (threshold: all channels ≥ 248 → fully transparent)
  img.scan(0, 0, img.getWidth(), img.getHeight(), function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    if (r >= 248 && g >= 248 && b >= 248) {
      this.bitmap.data[idx + 3] = 0;
    }
  });

  img.resize(targetSize, targetSize, jimp.RESIZE_BEZIER);
  return img;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  console.log('🎨  Generating NEXTTRP splash screen …\n');

  const LOGO_SIZE = 740;                              // logo badge diameter
  const logoX     = Math.round((W - LOGO_SIZE) / 2); // 170
  const logoY     = Math.round((H - LOGO_SIZE) / 2 - 90); // slightly above centre

  // 1. Background gradient
  process.stdout.write('   [1/5] Rendering background gradient … ');
  const bg = await makeBackground();
  console.log('done');

  // 2. Star field
  process.stdout.write('   [2/5] Scattering stars … ');
  addStars(bg, logoX, logoY, LOGO_SIZE);
  console.log('done');

  // 3. Warm glow circle behind the logo
  process.stdout.write('   [3/5] Adding brand glow … ');
  const GLOW_SIZE = 920;
  const glowImg   = await makeGlow(GLOW_SIZE);
  const glowX     = Math.round((W - GLOW_SIZE) / 2);
  const glowY     = Math.round((H - GLOW_SIZE) / 2 - 90);
  bg.composite(glowImg, glowX, glowY);
  console.log('done');

  // 4. Load + process logo (remove white bg, resize)
  process.stdout.write('   [4/5] Processing logo … ');
  const logoPath = path.join(__dirname, 'assets', 'splash-nexttrp.png');
  const logo     = await loadLogo(logoPath, LOGO_SIZE);
  bg.composite(logo, logoX, logoY);
  console.log('done');

  // 5. Write output
  process.stdout.write('   [5/5] Saving splash.png … ');
  const out = path.join(__dirname, 'assets', 'splash.png');
  await bg.writeAsync(out);
  console.log('done\n');

  console.log(`✅  Saved → assets/splash.png  (${W} × ${H} px)`);
  console.log('   app.json is already configured to use this file.\n');
}

main().catch(err => {
  console.error('\n❌  Error:', err.message);
  process.exit(1);
});
