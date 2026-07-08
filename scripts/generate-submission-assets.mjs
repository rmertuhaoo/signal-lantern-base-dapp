import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");
const W = 1284;
const H = 2778;

const c = {
  bg: "#08090b",
  panel: "#151820",
  screen: "#050607",
  line: "#30343b",
  text: "#f4f1e8",
  muted: "#9ba3af",
  green: "#12f7a5",
  yellow: "#ffe66d",
  red: "#ff6b6b",
  blue: "#6bc7ff",
  purple: "#c77dff",
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function frame(content) {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${c.bg}"/>
    <path d="M0 0H${W}V${H}H0Z" fill="none"/>
    ${Array.from({ length: 44 }, (_, i) => `<path d="M${i * 34} 0V${H}" stroke="rgba(244,241,232,0.04)" stroke-width="2"/>`).join("")}
    ${Array.from({ length: 88 }, (_, i) => `<path d="M0 ${i * 34}H${W}" stroke="rgba(244,241,232,0.04)" stroke-width="2"/>`).join("")}
    ${content}
  </svg>`;
}

function header(title, subtitle) {
  return `
    <rect x="54" y="54" width="1176" height="270" rx="12" fill="${c.panel}" stroke="${c.line}" stroke-width="4"/>
    <text x="92" y="126" font-family="Courier New, monospace" font-size="34" font-weight="900" fill="${c.muted}">SIGNAL LANTERN</text>
    <text x="92" y="212" font-family="Arial, sans-serif" font-size="76" font-weight="900" fill="${c.text}">${esc(title)}</text>
    <text x="96" y="272" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="${c.muted}">${esc(subtitle)}</text>
  `;
}

function infoCard(x, y, w, h, label, lines, fill = c.panel) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${c.line}" stroke-width="4"/>
    <text x="${x + 26}" y="${y + 54}" font-family="Courier New, monospace" font-size="22" font-weight="900" fill="${c.muted}">${esc(label)}</text>
    ${lines.map((line, i) => `<text x="${x + 26}" y="${y + 112 + i * 40}" font-family="Arial, sans-serif" font-size="${i === 0 ? 36 : 28}" font-weight="900" fill="${c.text}">${esc(line)}</text>`).join("")}
  `;
}

function lantern(x, y, state, color, message, days) {
  const lines = wrap(message, 34);
  return `
    <rect x="${x}" y="${y}" width="1030" height="830" rx="16" fill="${c.panel}" stroke="${c.line}" stroke-width="5"/>
    <rect x="${x + 40}" y="${y + 40}" width="950" height="750" rx="10" fill="${c.screen}" stroke="${c.line}" stroke-width="4"/>
    <circle cx="${x + 110}" cy="${y + 112}" r="34" fill="${color}" stroke="rgba(255,255,255,0.25)" stroke-width="4"/>
    <circle cx="${x + 110}" cy="${y + 112}" r="56" fill="none" stroke="${color}" stroke-opacity="0.28" stroke-width="10"/>
    <text x="${x + 174}" y="${y + 124}" font-family="Courier New, monospace" font-size="28" font-weight="900" fill="${c.muted}">LIVE STATUS</text>
    <text x="${x + 70}" y="${y + 320}" font-family="Courier New, monospace" font-size="96" font-weight="900" fill="${color}">${esc(state)}</text>
    <rect x="${x + 70}" y="${y + 390}" width="890" height="220" rx="8" fill="#0b0d10" stroke="${c.line}" stroke-width="4"/>
    ${lines.map((line, i) => `<text x="${x + 100}" y="${y + 462 + i * 44}" font-family="Arial, sans-serif" font-size="32" font-weight="800" fill="${c.text}">${esc(line)}</text>`).join("")}
    <rect x="${x + 70}" y="${y + 660}" width="270" height="92" rx="8" fill="#0b0d10" stroke="${c.line}" stroke-width="4"/>
    <rect x="${x + 380}" y="${y + 660}" width="270" height="92" rx="8" fill="#0b0d10" stroke="${c.line}" stroke-width="4"/>
    <rect x="${x + 690}" y="${y + 660}" width="270" height="92" rx="8" fill="#0b0d10" stroke="${c.line}" stroke-width="4"/>
    <text x="${x + 100}" y="${y + 716}" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="${c.text}">${days} days</text>
    <text x="${x + 410}" y="${y + 716}" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="${c.text}">ON</text>
    <text x="${x + 720}" y="${y + 716}" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="${c.text}">Base</text>
  `;
}

function screenshot1() {
  return frame(`
    ${header("Turn status into a light.", "Pick a state, color, message, and active window.")}
    ${infoCard(72, 380, 548, 245, "COMPOSER", ["BUILDING", "Green signal", "3 active days"])}
    ${infoCard(664, 380, 548, 245, "WHY", ["A status people read fast", "Useful for builders"], c.panel)}
    ${lantern(127, 700, "BUILDING", c.green, "Shipping a new thing today. Open to feedback, not meetings.", 3)}
    <rect x="72" y="2528" width="1140" height="116" rx="10" fill="${c.green}"/>
    <text x="642" y="2600" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="${c.bg}">PUBLISH ON BASE</text>
  `);
}

function screenshot2() {
  return frame(`
    ${header("A visible public signal.", "The lantern format makes availability and focus clear at a glance.")}
    ${lantern(127, 390, "AVAILABLE", c.blue, "Open for one focused collaboration this week. Send the short version first.", 7)}
    ${infoCard(72, 1320, 548, 245, "IDENTITY", ["Public status", "For creators and builders"], c.panel)}
    ${infoCard(664, 1320, 548, 245, "CHAIN VALUE", ["Timestamped on Base", "Reload by ID"], c.panel)}
  `);
}

function screenshot3() {
  return frame(`
    ${header("Reload a prior lantern.", "Look up owner, state, message, active days, and publish date by ID.")}
    ${infoCard(72, 380, 1140, 230, "LOOKUP", ["Lantern ID 12", "Owner 0x9936...9652", "Published on Base"], c.panel)}
    ${lantern(127, 690, "FOCUS", c.yellow, "Deep work mode. Please send async notes and I will answer after the build block.", 2)}
    ${infoCard(72, 1620, 548, 245, "USE CASE", ["Available / paused / building", "Simple public presence"], c.panel)}
    ${infoCard(664, 1620, 548, 245, "READER", ["Know what to do next", "No noisy feed required"], c.panel)}
  `);
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${c.bg}"/>
    <rect x="160" y="192" width="704" height="640" rx="36" fill="${c.panel}" stroke="${c.line}" stroke-width="24"/>
    <rect x="220" y="252" width="584" height="520" rx="18" fill="${c.screen}" stroke="${c.line}" stroke-width="14"/>
    <circle cx="512" cy="398" r="108" fill="${c.green}" stroke="rgba(255,255,255,0.25)" stroke-width="16"/>
    <circle cx="512" cy="398" r="160" fill="none" stroke="${c.green}" stroke-opacity="0.22" stroke-width="30"/>
    <text x="512" y="660" text-anchor="middle" font-family="Courier New, monospace" font-size="96" font-weight="900" fill="${c.green}">ON</text>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1910" height="1000" fill="${c.bg}"/>
    <text x="96" y="168" font-family="Arial, sans-serif" font-size="116" font-weight="900" fill="${c.text}">Signal Lantern</text>
    <text x="102" y="236" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="${c.muted}">Publish a public status light on Base.</text>
    ${lantern(120, 310, "BUILDING", c.green, "Shipping a new thing today. Open to feedback, not meetings.", 3)}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).jpeg({ quality: 86, mozjpeg: true }).toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

await writeFile(
  join(outDir, "asset-manifest.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2),
  "utf8",
);

for (const file of files) console.log(file);
