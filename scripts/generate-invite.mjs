#!/usr/bin/env node

/**
 * Generates the wedding invite as a self-contained HTML file and a PDF.
 *
 * The approved invite artwork lives in public/convite/convite-base.jpeg.
 * Interactivity is implemented as transparent hotspots over the artwork so the
 * visual invite stays identical to the approved reference while links remain
 * accessible in HTML and preserved by Chrome's PDF export.
 *
 * Usage:
 *   node scripts/generate-invite.mjs <CODE> <NomeFamilia> [host] [textoDoBotao]
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const [, , codeArg, nameArg, hostArg, buttonArg] = process.argv;

const code = codeArg || "EDRQ7ZSH";
const familyName = nameArg || "Matheus & Isadora";
const host = (hostArg || "https://site-convidados-main.vercel.app").replace(/\/$/, "");
const buttonText = buttonArg || "Site do casamento";

const siteUrl = `${host}/rsvp/${encodeURIComponent(code)}`;
const cathedralUrl =
  "https://www.google.com/maps/search/?api=1&query=Catedral+Metropolitana+Nossa+Senhora+Aparecida+Brasilia";
const nauUrl =
  "https://www.google.com/maps/search/?api=1&query=NAU+Frutos+do+Mar+Brasilia+Lago+Sul";

function toDataUrl(relPath, mime = "image/jpeg") {
  const abs = path.join(process.cwd(), relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Required invite asset not found: ${relPath}`);
  }
  return `data:${mime};base64,${fs.readFileSync(abs).toString("base64")}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const inviteImage = toDataUrl("public/convite/convite-base.jpeg");

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Convite - ${escapeHtml(familyName)}</title>
<style>
  @page { size: 1024px 1536px; margin: 0; }

  * { box-sizing: border-box; }

  html,
  body {
    width: 1024px;
    min-height: 1536px;
    margin: 0;
    background: #f8f5ef;
  }

  body {
    display: grid;
    place-items: start center;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .invite {
    position: relative;
    width: 1024px;
    height: 1536px;
    overflow: hidden;
    background: #f8f5ef;
  }

  .invite-image {
    display: block;
    width: 1024px;
    height: 1536px;
    object-fit: cover;
    user-select: none;
  }

  .hotspot {
    position: absolute;
    display: block;
    border-radius: 12px;
    text-indent: -9999px;
    overflow: hidden;
    color: transparent;
    background: transparent;
  }

  .hotspot:focus-visible {
    outline: 5px solid rgba(31, 106, 153, 0.9);
    outline-offset: 4px;
    background: rgba(31, 106, 153, 0.08);
  }

  .site-link {
    left: 300px;
    top: 767px;
    width: 424px;
    height: 80px;
    border-radius: 44px;
  }

  .cathedral-link {
    left: 220px;
    top: 905px;
    width: 272px;
    height: 116px;
  }

  .nau-link {
    left: 532px;
    top: 905px;
    width: 302px;
    height: 116px;
  }
</style>
</head>
<body>
  <main class="invite" aria-label="Convite de casamento de Isadora e Matheus">
    <img
      class="invite-image"
      src="${inviteImage}"
      alt="Convite de casamento de Isadora e Matheus, dia 03 de setembro de 2026."
      draggable="false"
    />
    <a class="hotspot site-link" href="${siteUrl}" aria-label="${escapeHtml(buttonText)}">
      ${escapeHtml(buttonText)}
    </a>
    <a
      class="hotspot cathedral-link"
      href="${cathedralUrl}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir localizacao da Catedral de Brasilia no Google Maps"
    >
      Catedral de Brasilia
    </a>
    <a
      class="hotspot nau-link"
      href="${nauUrl}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir localizacao do Restaurante NAU no Google Maps"
    >
      Restaurante NAU
    </a>
  </main>
</body>
</html>`;

const outDir = path.join(process.cwd(), "convites");
fs.mkdirSync(outDir, { recursive: true });

const htmlFile = path.join(outDir, `convite-${code}.html`);
const pdfFile = path.join(outDir, `convite-${code}.pdf`);
fs.writeFileSync(htmlFile, html, "utf-8");

console.log("\nHTML gerado:", htmlFile);

const browsers = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const browser = browsers.find((candidate) => fs.existsSync(candidate));
const fileUrl = "file:///" + htmlFile.replace(/\\/g, "/");

if (!browser) {
  console.log("\nChrome/Edge nao encontrado. Abra o HTML e salve como PDF.");
} else {
  try {
    execFileSync(
      browser,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        `--print-to-pdf=${pdfFile}`,
        fileUrl,
      ],
      { stdio: "ignore", timeout: 40000 }
    );
    console.log("PDF gerado:", pdfFile);
  } catch (err) {
    console.log("Falha no PDF:", err.message);
  }
}

console.log("\nLink do botao:", siteUrl);
console.log("Link da Catedral:", cathedralUrl);
console.log("Link do NAU:", nauUrl, "\n");
