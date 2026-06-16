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
 *   npm i --no-save sharp
 *
 * Uso:
 *   node scripts/generate-invite.mjs <CODE> <NomeFamilia> [host] [textoDoBotao]
 */

import fs from "node:fs";
import path from "node:path";

// --- Dependências (mensagem clara se faltar) ---
let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("\n❌ Dependência ausente. Instale:\n   npm i --no-save sharp\n");
  process.exit(1);
}

const [, , codeArg, nameArg, hostArg, buttonArg] = process.argv;

const code = codeArg || "EDRQ7ZSH";
const familyName = nameArg || "Matheus & Isadora";
const host = (hostArg || "https://site-convidados-main.vercel.app").replace(/\/$/, "");
const buttonText = buttonArg || "Confirme sua presença e conheça nosso site";
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
    .resize(1400)
    .png({ compressionLevel: 9 })
    .toFile(path.join(process.cwd(), cathedralSmall));
}

const monogram = toDataUrl("public/matheus-isadora-monogram_gold_trim.png");
const cathedral = toDataUrl(cathedralSmall);

// Fonte caligráfica dos nomes (Alex Brush): EMBUTIDA como data URL.
// Sem isso, o Chrome headless não baixa a fonte remota a tempo e cai no
// fallback do Windows (Comic Sans). Baixa uma vez e cacheia localmente.
const alexBrushTtf = "scripts/.alex-brush.ttf";
const alexBrushAbs = path.join(process.cwd(), alexBrushTtf);
if (!fs.existsSync(alexBrushAbs)) {
  const fontUrl = "https://fonts.gstatic.com/s/alexbrush/v23/SZc83FzrJKuqFbwMKk6EtUI.ttf";
  try {
    const res = await fetch(fontUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(alexBrushAbs, buf);
    console.log("✅ Fonte Alex Brush baixada e cacheada:", alexBrushTtf);
  } catch (err) {
    console.error(
      `\n❌ Não foi possível obter a fonte Alex Brush (${err.message}).\n` +
      `   Sem ela o convite renderiza em Comic Sans. Conecte à internet e rode de novo,\n` +
      `   ou coloque manualmente o arquivo em ${alexBrushTtf}.\n`
    );
    process.exit(1);
  }
}
const alexBrushDataUrl = toDataUrl(alexBrushTtf, "font/ttf");

// Paleta oficial (app/globals.css)
const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Convite — ${familyName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<!-- Alex Brush NÃO entra aqui: é carregada só via @font-face embutido (base64) abaixo.
     Ter as duas (link remoto + embutida) fazia o Chrome não embutir o glifo no PDF,
     deixando os nomes invisíveis em alguns leitores. -->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  /* Alex Brush embutida (data URL) — garante render determinístico no headless,
     sem depender de download remoto (que cairia em Comic Sans). */
  @font-face {
    font-family: 'Alex Brush';
    font-style: normal; font-weight: 400; font-display: block;
    src: url('${alexBrushDataUrl}') format('truetype');
  }
  @page { size: 1080px 1920px; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    /* Paleta "save the date" azul (MJ): azul-marinho como tinta principal,
       dourado mantido como acento (filetes, gems, divisor). */
    --gold: #a6854a;          /* gold-dim — acento legível sobre creme */
    --gold-bright: #c5a059;   /* gold — acento (e o '&' dos nomes) */
    --gold-deep: #7d6332;     /* gold escuro — labels de acento */
    --navy: #1e3a5f;          /* azul-marinho — tinta principal */
    --navy-deep: #0a1f33;     /* azul profundo — nomes/títulos */
    --navy-soft: #3f5f80;     /* azul suave — textos secundários */
    --watercolor-blue: #5f7d99; /* azul-claro suave da aquarela da catedral (nomes + frase) */
    --ink: #2f3331;           /* on-surface oficial */
    --ink-soft: #5c605d;      /* on-surface-variant */
    --cream: #f5efe3;
    --cream-soft: #faf6ec;
  }
  html, body {
    width: 1080px; height: 1920px;
    background: var(--cream);
    color: var(--ink);
    font-family: 'Cormorant Garamond', serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    position: relative;
    width: 1080px; height: 1920px;
    background: linear-gradient(180deg, var(--cream-soft) 0%, var(--cream) 45%);
    overflow: hidden;
  }

  /* Moldura fina — ABERTA embaixo: filete só no topo e laterais, para a Catedral
     fluir livre até a base como fundo (destaque principal). */
  .frame {
    position: absolute; inset: 36px; pointer-events: none; z-index: 4;
    border: 1.5px solid rgba(30,58,95,0.55); border-bottom: none;
  }
  .frame::before {
    content:''; position:absolute; inset: 7px;
    border: 1px solid rgba(166,133,74,0.32); border-bottom: none;
  }

  /* === ZONA BASE: Catedral PROTAGONISTA do fundo — grande, sangrando até a
     base da página, subindo até logo abaixo do botão. === */
  .cathedral {
    position: absolute;
    left: 50%; bottom: 0;
    transform: translateX(-50%);
    width: 172%;
    display: block;
    z-index: 1;
    /* cor natural, leve dessaturação para casar com o creme; sem hue-rotate */
    filter: saturate(0.92) brightness(1.01);
    /* fade curto só na borda superior para fundir com o creme */
    -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 8%, #000 100%);
    mask-image: linear-gradient(180deg, transparent 0%, #000 8%, #000 100%);
    pointer-events: none;
  }

  /* === ZONA TOPO: conteúdo === */
  .content {
    position: absolute; top: 0; left: 0; right: 0;
    height: 56%;
    z-index: 3;
    display: flex; flex-direction: column; align-items: center;
    padding: 120px 96px 0;
    text-align: center;
  }

  /* 1 — Selo da marca */
  .monogram { width: 150px; height: auto; margin-bottom: 28px; filter: drop-shadow(0 4px 10px rgba(120,95,45,0.18)); }

  /* 2 — Nomes em Alex Brush (pico emocional) — azul-claro da aquarela */
  .names {
    font-family: 'Alex Brush', 'Cormorant Garamond', serif; line-height: 0.95;
    color: var(--watercolor-blue); font-size: 138px; margin-top: 8px;
  }
  .names .amp { color: var(--watercolor-blue); }

  /* 3 — Frase de convite, ABAIXO dos nomes (dourado, igual aos labels do evento) */
  .eyebrow {
    font-family: 'Montserrat', sans-serif; font-weight: 600;
    font-size: 19px; letter-spacing: 0.34em; text-transform: uppercase;
    color: var(--gold-deep); margin-top: 26px;
  }

  /* 4 — Data / cidade */
  .date {
    font-family: 'Montserrat', sans-serif; font-weight: 400;
    font-size: 28px; letter-spacing: 0.42em; text-transform: uppercase;
    color: var(--navy); margin-top: 34px;
  }
  .city {
    font-family: 'Montserrat', sans-serif; font-weight: 300;
    font-size: 19px; letter-spacing: 0.34em; text-transform: uppercase;
    color: var(--ink-soft); margin-top: 12px;
  }

  /* Divisor ornamental fino */
  .ornament { display: flex; align-items: center; gap: 14px; margin: 40px 0 34px; }
  .ornament .line { width: 90px; height: 1px; background: rgba(166,133,74,0.6); }
  .ornament .dot { width: 9px; height: 9px; border: 1px solid var(--gold); transform: rotate(45deg); }

  /* 6 — Detalhes do evento (2 colunas) */
  .details { display: flex; gap: 64px; justify-content: center; margin-bottom: 40px; }
  .detail { max-width: 280px; }
  .detail .label {
    font-family: 'Montserrat', sans-serif; font-weight: 600;
    font-size: 16px; letter-spacing: 0.26em; text-transform: uppercase;
    color: var(--gold-deep); margin-bottom: 10px;
  }
  .detail .place {
    font-family: 'Cormorant Garamond', serif; font-weight: 600;
    font-size: 30px; line-height: 1.2; color: var(--navy-deep);
  }
  .detail .time {
    font-family: 'Montserrat', sans-serif; font-weight: 400;
    font-size: 19px; letter-spacing: 0.18em; color: var(--navy); margin-top: 8px;
  }

  /* 7 — Botão único (CTA) */
  .btn {
    display: inline-block;
    font-family: 'Montserrat', sans-serif; font-weight: 600;
    font-size: 24px; letter-spacing: 0.08em;
    color: #fff; text-decoration: none;
    background: linear-gradient(160deg, #2f567f 0%, #1e3a5f 60%, #0a1f33 100%);
    border: 1px solid #0a1f33;
    /* Sem sombra externa com blur: o viewer de PDF do WhatsApp a rasteriza como
       um halo amarelado retangular. Só o highlight dourado interno (sem blur). */
    box-shadow: inset 0 1px 0 rgba(197,160,89,0.45);
    border-radius: 999px; padding: 22px 56px; max-width: 84%;
    line-height: 1.25;
  }
</style>
</head>
<body>
  <div class="page">
    <div class="frame"></div>
    ${cathedral ? `<img class="cathedral" src="${cathedral}" alt="Catedral de Brasília" />` : ""}

    <div class="content">
      ${monogram ? `<img class="monogram" src="${monogram}" alt="Monograma M&I" />` : ""}

      <div class="names">${EVENT.coupleFirst} <span class="amp">&amp;</span> ${EVENT.coupleSecond}</div>
      <div class="eyebrow">Convidam para o seu casamento</div>

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

      <a class="btn" href="${rsvpUrl}">${buttonText}</a>
    </div>
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
    // --headless=new + --virtual-time-budget: dá tempo de o @font-face embutido
    // (base64) ser decodificado e aplicado ANTES da impressão. Sem isso, o
    // --print-to-pdf imprime cedo demais e cai em Arial/Times (nomes "somem").
    execFileSync(
      browser,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--virtual-time-budget=5000",
        `--print-to-pdf=${pdfFile}`,
        fileUrl,
      ],
      { stdio: "ignore", timeout: 40000 }
    );
    console.log("✅ PDF gerado:", pdfFile);
  } catch (err) {
    console.log("⚠️  Falha no PDF:", err.message);
  }
}

console.log("\n🔗 Link de RSVP (produção):", rsvpUrl, "\n");
