#!/usr/bin/env node

/**
 * Gera o convite de casamento em PDF (1 página A5, texto vetorial nítido).
 *
 * Design guiado por intenção (intention-driven): cada elemento existe para
 * conduzir o convidado à ação-alvo — confirmar presença. A hierarquia leva o
 * olho do selo da marca aos nomes, à data, aos detalhes do evento e, por fim,
 * ao CTA (ponto focal). Catedral aquarela integrada ao fundo dá atmosfera.
 *
 * Requer (instalar JUNTOS — npm --no-save reconcilia e remove um se separado):
 *   npm i --no-save qrcode sharp
 *
 * Uso:
 *   node scripts/generate-invite.mjs <CODE> <NomeFamilia> [host] [textoDoBotao]
 */

import fs from "node:fs";
import path from "node:path";

// --- Dependências (mensagem clara se faltar) ---
let QRCode, sharp;
try {
  QRCode = (await import("qrcode")).default;
  sharp = (await import("sharp")).default;
} catch {
  console.error("\n❌ Dependências ausentes. Instale JUNTOS:\n   npm i --no-save qrcode sharp\n");
  process.exit(1);
}

const [, , codeArg, nameArg, hostArg, buttonArg] = process.argv;

const code = codeArg || "EDRQ7ZSH";
const familyName = nameArg || "Matheus & Isadora";
const host = (hostArg || "https://site-convidados-main.vercel.app").replace(/\/$/, "");
const buttonText = buttonArg || "Confirmar Presença";
const rsvpUrl = `${host}/rsvp/${code}`;

// --- Conteúdo do evento (igual para todas as famílias) ---
const EVENT = {
  coupleFirst: "Matheus",
  coupleSecond: "Isadora",
  dateLong: "03 de Setembro de 2026",
  dateShort: "03 . 09 . 2026",
  city: "Brasília",
  ceremony: { title: "Cerimônia", place: "Catedral de Brasília", time: "19h" },
  reception: { title: "Recepção", place: "NAU — Lago Sul", time: "21h" },
};

// Helper: lê uma imagem e devolve data URL base64
function toDataUrl(relPath, mime = "image/png") {
  const abs = path.join(process.cwd(), relPath);
  if (!fs.existsSync(abs)) return "";
  return `data:${mime};base64,${fs.readFileSync(abs).toString("base64")}`;
}

// Catedral reduzida (PDF leve). Gera se ausente.
const cathedralSmall = "scripts/.cathedral-small.png";
if (!fs.existsSync(path.join(process.cwd(), cathedralSmall))) {
  await sharp("public/catedral-brasilia.png")
    .resize(1100)
    .png({ compressionLevel: 9 })
    .toFile(path.join(process.cwd(), cathedralSmall));
}

const monogram = toDataUrl("public/matheus-isadora-monogram_gold_trim.png");
const cathedral = toDataUrl(cathedralSmall);

const qrDataUrl = await QRCode.toDataURL(rsvpUrl, {
  width: 360,
  margin: 1,
  color: { dark: "#5b4a2a", light: "#ffffff" }, // marrom-dourado quente, na paleta
  errorCorrectionLevel: "M",
});

// Paleta oficial (app/globals.css)
const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Convite — ${familyName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  @page { size: A5 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --gold: #a6854a;          /* gold-dim oficial — legível sobre creme */
    --gold-bright: #c5a059;   /* gold oficial */
    --gold-deep: #7d6332;
    --ink: #2f3331;           /* on-surface oficial */
    --ink-soft: #5c605d;      /* on-surface-variant */
    --cream: #f5efe3;
    --cream-soft: #faf6ec;
  }
  html, body {
    width: 148mm; height: 210mm;
    background: var(--cream);
    color: var(--ink);
    font-family: 'Cormorant Garamond', serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    position: relative;
    width: 148mm; height: 210mm;
    background: var(--cream);
    overflow: hidden;
  }

  /* Catedral integrada ao fundo — ocupa toda a REGIÃO SUPERIOR (atrás do
     monograma, nomes, data e detalhes), esmaecendo nas bordas. Opacidade
     baixa para não atrapalhar a leitura do texto sobreposto; termina antes
     do card CTA. */
  .cathedral-bg {
    position: absolute;
    left: 50%; top: 4mm;
    transform: translateX(-50%);
    width: 250mm;
    opacity: 0.22;
    -webkit-mask-image:
      linear-gradient(180deg, transparent 2%, #000 16%, #000 78%, transparent 100%),
      radial-gradient(ellipse 60% 70% at 50% 50%, #000 55%, transparent 92%);
    -webkit-mask-composite: source-in;
    mask-image:
      linear-gradient(180deg, transparent 2%, #000 16%, #000 78%, transparent 100%),
      radial-gradient(ellipse 60% 70% at 50% 50%, #000 55%, transparent 92%);
    mask-composite: intersect;
    pointer-events: none;
  }
  .veil {
    position: absolute; inset: 0;
    background: linear-gradient(180deg,
      rgba(245,239,227,0.40) 0%, rgba(245,239,227,0.10) 22%,
      rgba(245,239,227,0.10) 56%, rgba(245,239,227,0.5) 72%, rgba(245,239,227,0.78) 100%);
    pointer-events: none;
  }

  /* Moldura dupla clássica + ornamentos de canto */
  .frame { position: absolute; inset: 7mm; border: 0.5mm solid rgba(166,133,74,0.6); pointer-events: none; }
  .frame::before { content:''; position:absolute; inset: 1.6mm; border: 0.2mm solid rgba(166,133,74,0.32); }
  .corner { position: absolute; width: 9mm; height: 9mm; z-index: 3; pointer-events: none; }
  .corner::before, .corner::after { content:''; position:absolute; background: var(--gold); }
  .corner::before { width: 9mm; height: 0.4mm; }
  .corner::after  { width: 0.4mm; height: 9mm; }
  .corner .gem { position:absolute; width: 1.8mm; height: 1.8mm; border: 0.3mm solid var(--gold); transform: rotate(45deg); }
  .corner.tl { top: 5.4mm; left: 5.4mm; }
  .corner.tl::before { top:0; left:0; } .corner.tl::after { top:0; left:0; }
  .corner.tl .gem { top: -0.9mm; left: -0.9mm; }
  .corner.tr { top: 5.4mm; right: 5.4mm; }
  .corner.tr::before { top:0; right:0; } .corner.tr::after { top:0; right:0; }
  .corner.tr .gem { top: -0.9mm; right: -0.9mm; }
  .corner.bl { bottom: 5.4mm; left: 5.4mm; }
  .corner.bl::before { bottom:0; left:0; } .corner.bl::after { bottom:0; left:0; }
  .corner.bl .gem { bottom: -0.9mm; left: -0.9mm; }
  .corner.br { bottom: 5.4mm; right: 5.4mm; }
  .corner.br::before { bottom:0; right:0; } .corner.br::after { bottom:0; right:0; }
  .corner.br .gem { bottom: -0.9mm; right: -0.9mm; }

  .content {
    position: absolute; inset: 0; z-index: 2;
    display: flex; flex-direction: column; align-items: center;
    padding: 15mm 16mm 20mm;
    text-align: center;
  }

  /* 1 — Selo da marca */
  .monogram { width: 26mm; height: auto; margin-bottom: 3.5mm; filter: drop-shadow(0 1mm 2mm rgba(120,95,45,0.18)); }

  /* 2 — Eyebrow acolhedor (tom suave: degrau abaixo dos labels dourados) */
  .eyebrow {
    font-family: 'Montserrat', sans-serif; font-weight: 400;
    font-size: 7pt; letter-spacing: 0.36em; text-transform: uppercase;
    color: var(--ink-soft); margin-bottom: 4.5mm;
  }

  /* 3 — Nomes (pico emocional) */
  .names { display: flex; align-items: baseline; justify-content: center; gap: 4mm; }
  .name {
    font-family: 'Playfair Display', serif; font-style: italic; font-weight: 500;
    font-size: 31pt; line-height: 1; color: var(--ink);
  }
  .amp { font-family: 'Alex Brush', cursive; font-size: 37pt; color: var(--gold-bright); line-height: 1; }

  /* 4 — Data / cidade (âncora) */
  .date {
    font-family: 'Montserrat', sans-serif; font-weight: 400;
    font-size: 9.5pt; letter-spacing: 0.42em; text-transform: uppercase;
    color: var(--ink); margin-top: 5mm;
  }
  .city {
    font-family: 'Montserrat', sans-serif; font-weight: 300;
    font-size: 7pt; letter-spacing: 0.34em; text-transform: uppercase;
    color: var(--ink-soft); margin-top: 2mm;
  }

  /* Divisor ornamental da marca */
  .ornament { display: flex; align-items: center; gap: 2.5mm; margin: 6mm 0 5mm; }
  .ornament .line { width: 16mm; height: 0.2mm; background: rgba(166,133,74,0.6); }
  .ornament .dot { width: 1.6mm; height: 1.6mm; border: 0.2mm solid var(--gold); transform: rotate(45deg); }

  /* 6 — Detalhes do evento (contexto, 2 colunas) */
  .details { display: flex; gap: 9mm; justify-content: center; margin-bottom: auto; }
  .detail { max-width: 42mm; }
  .detail .label {
    font-family: 'Montserrat', sans-serif; font-weight: 600;
    font-size: 6.5pt; letter-spacing: 0.26em; text-transform: uppercase;
    color: var(--gold-deep); margin-bottom: 1.5mm;
  }
  .detail .place {
    font-family: 'Cormorant Garamond', serif; font-weight: 600;
    font-size: 11.5pt; line-height: 1.2; color: var(--ink);
  }
  .detail .time {
    font-family: 'Montserrat', sans-serif; font-weight: 400;
    font-size: 8pt; letter-spacing: 0.18em; color: var(--ink); margin-top: 1.5mm;
  }

  /* 7 — Bloco CTA (ponto focal, levemente elevado) */
  .cta {
    width: 100%; z-index: 2;
    background: rgba(252,249,242,0.96);
    border: 0.4mm solid rgba(166,133,74,0.65);
    border-radius: 4mm;
    padding: 6mm 6mm 5.5mm;
  }
  .cta-eyebrow {
    font-family: 'Montserrat', sans-serif; font-weight: 600;
    font-size: 6.5pt; letter-spacing: 0.26em; text-transform: uppercase;
    color: var(--gold-deep); margin-bottom: 3.5mm;
  }
  .btn {
    display: inline-block;
    font-family: 'Montserrat', sans-serif; font-weight: 600;
    font-size: 11pt; letter-spacing: 0.1em; text-transform: uppercase;
    color: #fff; text-decoration: none;
    background: linear-gradient(160deg, #c9a85e 0%, #a6854a 60%, #8a6d38 100%);
    border: 0.35mm solid #7d6332;
    border-radius: 50mm; padding: 3.4mm 12mm;
    margin-bottom: 3mm;
  }
  .cta-desc {
    font-family: 'Cormorant Garamond', serif; font-weight: 500;
    font-size: 11pt; line-height: 1.4; color: var(--ink); max-width: 96mm; margin: 0 auto 4mm;
  }
  .cta-desc strong { color: var(--gold-deep); font-weight: 600; }

  .alt { display: flex; align-items: center; justify-content: center; gap: 3mm; }
  .qr-wrap { background: #fff; padding: 1.6mm; border-radius: 1.6mm; border: 0.2mm solid rgba(166,133,74,0.32); }
  .qr-wrap img { display: block; width: 17mm; height: 17mm; }
  .qr-hint {
    font-family: 'Montserrat', sans-serif; font-weight: 300;
    font-size: 6.5pt; letter-spacing: 0.16em; text-transform: uppercase;
    color: #9a8c72; text-align: left; max-width: 30mm; line-height: 1.4;
  }

  /* 8 — Rodapé discreto */
  .footer {
    position: absolute; bottom: 9mm; left: 0; right: 0; z-index: 2;
    text-align: center;
    font-family: 'Montserrat', sans-serif; font-weight: 400;
    font-size: 6.5pt; letter-spacing: 0.3em; color: #b3a585;
  }
</style>
</head>
<body>
  <div class="page">
    ${cathedral ? `<img class="cathedral-bg" src="${cathedral}" alt="" />` : ""}
    <div class="veil"></div>
    <div class="frame"></div>
    <span class="corner tl"><span class="gem"></span></span>
    <span class="corner tr"><span class="gem"></span></span>
    <span class="corner bl"><span class="gem"></span></span>
    <span class="corner br"><span class="gem"></span></span>

    <div class="content">
      ${monogram ? `<img class="monogram" src="${monogram}" alt="Monograma M&I" />` : ""}
      <div class="eyebrow">Com alegria, convidamos você</div>

      <div class="names">
        <span class="name">${EVENT.coupleFirst}</span>
        <span class="amp">&amp;</span>
        <span class="name">${EVENT.coupleSecond}</span>
      </div>

      <div class="date">${EVENT.dateShort}</div>
      <div class="city">${EVENT.city}</div>

      <div class="ornament"><span class="line"></span><span class="dot"></span><span class="line"></span></div>

      <div class="details">
        <div class="detail">
          <div class="label">${EVENT.ceremony.title}</div>
          <div class="place">${EVENT.ceremony.place}</div>
          <div class="time">${EVENT.ceremony.time}</div>
        </div>
        <div class="detail">
          <div class="label">${EVENT.reception.title}</div>
          <div class="place">${EVENT.reception.place}</div>
          <div class="time">${EVENT.reception.time}</div>
        </div>
      </div>

      <div class="cta">
        <div class="cta-eyebrow">Seu lugar está reservado</div>
        <a class="btn" href="${rsvpUrl}">${buttonText}</a>
        <div class="cta-desc">
          No link você <strong>confirma sua presença</strong>, vê os
          <strong>detalhes do evento</strong> e a nossa <strong>lista de presentes</strong>.
        </div>
        <div class="alt">
          <div class="qr-wrap"><img src="${qrDataUrl}" alt="QR Code do convite" /></div>
          <div class="qr-hint">ou aponte a câmera do celular</div>
        </div>
      </div>
    </div>

    <div class="footer">${code}</div>
  </div>
</body>
</html>`;

const outDir = path.join(process.cwd(), "convites");
fs.mkdirSync(outDir, { recursive: true });
const htmlFile = path.join(outDir, `convite-${code}.html`);
const pdfFile = path.join(outDir, `convite-${code}.pdf`);
fs.writeFileSync(htmlFile, html, "utf-8");

console.log("\n✅ HTML gerado:", htmlFile);

const browsers = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const { execFileSync } = await import("node:child_process");
const browser = browsers.find((b) => fs.existsSync(b));
const fileUrl = "file:///" + htmlFile.replace(/\\/g, "/");

if (!browser) {
  console.log("\n⚠️  Chrome/Edge não encontrado — abra o HTML e salve como PDF (A5).");
} else {
  try {
    execFileSync(
      browser,
      ["--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdfFile}`, fileUrl],
      { stdio: "ignore", timeout: 40000 }
    );
    console.log("✅ PDF gerado:", pdfFile);
  } catch (err) {
    console.log("⚠️  Falha no PDF:", err.message);
  }
}

console.log("\n🔗 Link de RSVP (produção):", rsvpUrl, "\n");
