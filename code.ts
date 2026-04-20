// Deck Generator — Figma Plugin
// design.md v2.4 tokens → Figma nodes

// ─── Color Tokens ───
function hex(h: string): RGB {
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  return { r, g, b };
}

const C = {
  black:   hex('#131313'),
  g800:    hex('#2B292E'),
  g700:    hex('#575757'),
  g600:    hex('#666666'),
  g500:    hex('#808080'),
  g400:    hex('#C5C5C5'),
  g100:    hex('#F7F7F7'),
  g50:     hex('#F5F5F5'),
  accent:  hex('#FE45A1'),
  white:   hex('#FFFFFF'),
};

// ─── Spacing Tokens ───
const S = {
  gapXs: 16, gapSm: 20, gapMd: 32, gapLg: 40,
  margin: 80, padCard: 40,
  radiusCard: 40, radiusCardSm: 20, radiusInner: 20,
};

// ─── Canvas ───
const CANVAS_W = 1920;
const CANVAS_H = 1080;

// ─── Image caches (set per generate call) ───
let _emojiBytes: Record<string, number[]> = {};
let _imageBytes: Record<string, number[]> = {};

// ─── Font helpers ───
async function loadFonts() {
  const fonts: FontName[] = [
    { family: 'Pretendard', style: 'Medium' },
    { family: 'Pretendard', style: 'Bold' },
    { family: 'Pretendard', style: 'ExtraBold' },
    { family: 'Pretendard', style: 'SemiBold' },
    { family: 'Inter', style: 'Medium' },
    { family: 'Inter', style: 'Bold' },
    { family: 'Inter', style: 'ExtraBold' },
  ];
  for (const f of fonts) {
    try { await figma.loadFontAsync(f); } catch { /* fallback handled below */ }
  }
}

function fontName(weight: number): FontName {
  const styleMap: Record<number, string> = {
    400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold'
  };
  return { family: 'Pretendard', style: styleMap[weight] || 'Medium' };
}

function solid(color: RGB): Paint[] {
  return [{ type: 'SOLID', color }];
}

// ─── Text Node Factory ───
interface TextOpts {
  text: string;
  x: number; y: number;
  w?: number;
  size: number; weight: number; lh: number; ls: number;
  color: RGB;
  align?: 'LEFT' | 'CENTER' | 'RIGHT';
}

function keepWords(text: string): string {
  const WJ = '\u2060';
  return text.split('\n').map(line =>
    line.split(' ').map(word =>
      word.split('').join(WJ)
    ).join(' ')
  ).join('\n');
}

async function createText(parent: FrameNode, opts: TextOpts): Promise<TextNode> {
  const t = figma.createText();
  t.fontName = fontName(opts.weight);
  t.fontSize = opts.size;
  t.lineHeight = { value: opts.size * opts.lh, unit: 'PIXELS' };
  t.letterSpacing = { value: opts.size * opts.ls, unit: 'PIXELS' };
  t.fills = solid(opts.color);
  t.characters = keepWords(opts.text);
  t.x = opts.x;
  t.y = opts.y;
  if (opts.w) {
    t.resize(opts.w, t.height);
    t.textAutoResize = 'HEIGHT';
  }
  if (opts.align) t.textAlignHorizontal = opts.align;
  parent.appendChild(t);
  return t;
}

// ─── Slide Frame Factory ───
function createSlideFrame(name: string): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(CANVAS_W, CANVAS_H);
  frame.fills = solid(C.white);
  frame.clipsContent = true;
  return frame;
}

// ─── Density System ───
// Padding (40px) and gap (20px) are always fixed per v2.4 rules.
// Only font size, line height, and emoji scale adapt.
type Density = 'normal' | 'dense' | 'compact';

interface DensityScale { font: number; lh: number; emoji: number; }

const DENSITY_SCALES: Record<Density, DensityScale> = {
  normal:  { font: 1.0,  lh: 1.0,  emoji: 1.0  },
  dense:   { font: 0.88, lh: 0.95, emoji: 0.85 },
  compact: { font: 0.78, lh: 0.88, emoji: 0.75 },
};

const MIN_FONT: Record<string, number> = { title: 28, body: 24, sub: 20, stat: 42 };

function scaledFont(base: number, scale: number, role: string): number {
  return Math.max(Math.round(base * scale), MIN_FONT[role] || 16);
}

function detectDensity(cardH: number, contentUnits: number): Density {
  const fillRatio = (contentUnits * 3 + 120) / cardH;
  if (fillRatio <= 0.9) return 'normal';
  if (fillRatio <= 1.3) return 'dense';
  return 'compact';
}

function ds(density: Density): DensityScale {
  return DENSITY_SCALES[density];
}

// ─── Card Factory ───
interface CardOpts {
  x: number; y: number; w: number; h: number;
  bg?: RGB; radius?: number; shadow?: boolean;
  density?: Density;
}

function createCard(parent: FrameNode, name: string, opts: CardOpts): FrameNode {
  const card = figma.createFrame();
  card.name = name;
  card.x = opts.x;
  card.y = opts.y;
  card.resize(opts.w, opts.h);
  card.fills = solid(opts.bg || C.white);
  card.cornerRadius = opts.radius ?? S.radiusCard;
  card.clipsContent = true;
  if (opts.shadow) {
    card.effects = [{
      type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 0 }, radius: 30, spread: 0, visible: true,
      blendMode: 'NORMAL',
    }];
  }
  parent.appendChild(card);
  return card;
}

// ─── Character Placeholder ───
function createCharacterPlaceholder(parent: FrameNode, label: string) {
  const char = figma.createFrame();
  char.name = 'Character Placeholder';
  char.x = 1340;
  char.y = -80;
  char.resize(820, 1240);
  char.fills = solid(C.g100);
  char.cornerRadius = 410;
  // top-right and bottom-right should be 0
  char.topRightRadius = 0;
  char.bottomRightRadius = 0;
  char.clipsContent = true;
  parent.appendChild(char);
}

// ═══════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════

// ─── SplashLayout ───
interface SplashData {
  type: 'splash';
  variant: 'name_top' | 'email_top';
  title: string[];
  titleLang?: 'en' | 'ko';
  titleColor?: 'black' | 'accent';
  subtitle: string;
  presenter: { name: string; email: string };
  character?: string;
}

async function createSplash(data: SplashData): Promise<FrameNode> {
  const slide = createSlideFrame(`Slide — ${data.variant === 'name_top' ? 'Cover' : 'Closing'}`);

  createCharacterPlaceholder(slide, data.character || 'Character');

  const titleText = data.title.join('\n');
  const titleLen = data.title.join('').length;
  const isLong = titleLen > 20;
  const titleSize = isLong ? 96 : 120;
  const titleColor = data.titleColor === 'accent' ? C.accent : C.black;

  await createText(slide, {
    text: titleText, x: 80, y: 176, w: 1240,
    size: titleSize, weight: 800, lh: 1.2, ls: -0.02,
    color: titleColor,
  });

  const subtitleY = 176 + (data.title.length * titleSize * 1.2) + 40;
  await createText(slide, {
    text: data.subtitle, x: 85, y: subtitleY, w: 1100,
    size: 36, weight: 700, lh: 1.45, ls: -0.02,
    color: C.g500,
  });

  const presenterBottom = CANVAS_H - S.margin;
  if (data.variant === 'name_top') {
    const emailH = 28 * 1.5;
    const nameH = 28 * 1.5;
    const emailY = presenterBottom - emailH;
    const nameY = emailY - nameH;
    await createText(slide, {
      text: data.presenter.name, x: 85, y: nameY, w: 610,
      size: 28, weight: 500, lh: 1.5, ls: -0.02, color: C.black,
    });
    await createText(slide, {
      text: data.presenter.email, x: 85, y: emailY, w: 610,
      size: 28, weight: 500, lh: 1.5, ls: -0.02, color: C.g500,
    });
  } else {
    const nameH = 28 * 1.5;
    const emailH = 36 * 1.45;
    const nameY = presenterBottom - nameH;
    const emailY = nameY - 8 - emailH;
    await createText(slide, {
      text: data.presenter.email, x: 85, y: emailY, w: 900,
      size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
    });
    await createText(slide, {
      text: data.presenter.name, x: 85, y: nameY, w: 900,
      size: 28, weight: 500, lh: 1.5, ls: -0.02, color: C.g500,
    });
  }

  return slide;
}

// ─── Eyebrow + Headline (shared header) ───
async function createHeader(slide: FrameNode, eyebrow: string, headline: string, accentWord?: string, headlineWidth?: number) {
  await createText(slide, {
    text: eyebrow, x: 80, y: 46, w: 600,
    size: 32, weight: 600, lh: 1.45, ls: -0.02, color: C.black,
  });

  if (accentWord && headline.includes(accentWord)) {
    const before = headline.split(accentWord)[0];
    const after = headline.split(accentWord)[1] || '';
    const fullText = keepWords(before + accentWord + after);
    const keptBefore = keepWords(before);
    const keptAccent = keepWords(accentWord);

    const t = figma.createText();
    t.fontName = fontName(700);
    t.fontSize = 48;
    t.lineHeight = { value: 48 * 1.45, unit: 'PIXELS' };
    t.letterSpacing = { value: 48 * -0.02, unit: 'PIXELS' };
    t.characters = fullText;
    t.fills = solid(C.black);

    const start = keptBefore.length;
    const end = start + keptAccent.length;
    t.setRangeFills(start, end, solid(C.accent));

    t.x = 80;
    t.y = 155;
    t.resize(headlineWidth || 1760, t.height);
    t.textAutoResize = 'HEIGHT';
    slide.appendChild(t);
  } else {
    await createText(slide, {
      text: headline, x: 80, y: 155, w: headlineWidth || 1760,
      size: 48, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
    });
  }
}

// ─── IconCard ───
interface IconCardData {
  emoji?: string;
  title: string;
  body: string;
  dark?: boolean;
  stat?: string;
  statSub?: string;
}

async function createIconCard(parent: FrameNode, data: IconCardData, opts: CardOpts): Promise<FrameNode> {
  const isDark = data.dark || false;
  const card = createCard(parent, `IconCard — ${data.title}`, {
    ...opts, bg: isDark ? C.g800 : C.white, shadow: !isDark,
  });
  const contentUnits = data.title.length + data.body.length + (data.stat || '').length;
  const d = opts.density || detectDensity(opts.h, contentUnits);
  const s = ds(d);

  const pad = S.padCard;
  const titleColor = isDark ? C.white : C.black;
  const bodyColor = isDark ? C.g400 : C.g500;
  const emojiSize = data.stat ? 87 : Math.round(48 * s.emoji);

  const emojiRect = figma.createRectangle();
  emojiRect.name = 'emoji';
  emojiRect.x = pad;
  emojiRect.y = pad;
  emojiRect.resize(emojiSize, emojiSize);
  if (data.emoji && _emojiBytes[data.emoji]) {
    const img = figma.createImage(new Uint8Array(_emojiBytes[data.emoji]));
    emojiRect.fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: 'FIT' }];
  } else {
    emojiRect.fills = solid(isDark ? C.g700 : C.g100);
    emojiRect.cornerRadius = 16;
  }
  card.appendChild(emojiRect);

  const hasStat = !!data.stat;
  const titleY = hasStat ? pad : pad + emojiSize + S.gapXs;
  const titleW = hasStat ? opts.w - pad * 3 - emojiSize : opts.w - pad * 2;
  const titleNode = await createText(card, {
    text: data.title, x: pad, y: titleY, w: titleW,
    size: scaledFont(36, s.font, 'title'), weight: 700, lh: 1.45 * s.lh, ls: -0.02, color: titleColor,
  });

  if (data.stat) {
    // stat mode: emoji top-right, text stack left
    emojiRect.x = opts.w - pad - emojiSize;
    emojiRect.y = pad;

    const textW = opts.w - pad * 3 - emojiSize;
    const bodyY = titleY + titleNode.height + 4;
    await createText(card, {
      text: data.body, x: pad, y: bodyY, w: textW,
      size: scaledFont(24, s.font, 'sub'), weight: 500, lh: 1.45 * s.lh, ls: -0.02, color: bodyColor,
    });

    const statSize = 36;
    const statLineH = Math.round(statSize * 1.45);
    const subSize = 24;
    const subLineH = data.statSub ? Math.round(subSize * 1.45) : 0;
    const statY = opts.h - pad - subLineH - statLineH;

    await createText(card, {
      text: data.stat, x: pad, y: statY, w: opts.w - pad * 2,
      size: statSize, weight: 700, lh: 1.45, ls: -0.02, color: C.accent,
    });
    if (data.statSub) {
      await createText(card, {
        text: data.statSub, x: pad, y: statY + statLineH, w: opts.w - pad * 2,
        size: subSize, weight: 500, lh: 1.45, ls: -0.02, color: bodyColor,
      });
    }
  } else {
    const bodyNode = await createText(card, {
      text: data.body, x: pad, y: 0, w: opts.w - pad * 2,
      size: scaledFont(28, s.font, 'body'), weight: 500, lh: 1.45 * s.lh, ls: -0.02, color: bodyColor,
    });
    bodyNode.y = opts.h - pad - bodyNode.height;
  }

  return card;
}

// ─── StatCard ───
interface StatCardData {
  title: string; sub: string; label: string; stat: string;
}

async function createStatCard(parent: FrameNode, data: StatCardData, opts: CardOpts): Promise<FrameNode> {
  const card = createCard(parent, `StatCard — ${data.title}`, { ...opts, shadow: true });
  const contentUnits = data.title.length + data.sub.length + data.label.length + data.stat.length;
  const d = opts.density || detectDensity(opts.h, contentUnits);
  const s = ds(d);

  const pad = S.padCard;

  const titleNode = await createText(card, {
    text: data.title, x: pad, y: pad, w: opts.w - pad * 2,
    size: scaledFont(36, s.font, 'title'), weight: 700, lh: 1.45 * s.lh, ls: -0.02, color: C.black,
  });
  const subY = pad + titleNode.height;
  await createText(card, {
    text: data.sub, x: pad, y: subY, w: opts.w - pad * 2,
    size: scaledFont(24, s.font, 'sub'), weight: 500, lh: 1.45 * s.lh, ls: -0.02, color: C.g500,
  });

  const labelY = subY + 35 + S.gapLg;
  await createText(card, {
    text: data.label, x: pad, y: labelY, w: opts.w - pad * 2,
    size: scaledFont(28, s.font, 'body'), weight: 500, lh: 1.45 * s.lh, ls: -0.02, color: C.g700,
  });
  await createText(card, {
    text: data.stat, x: pad, y: labelY + 40, w: opts.w - pad * 2,
    size: scaledFont(58, s.font, 'stat'), weight: 700, lh: 1.45 * s.lh, ls: -0.02, color: C.accent,
  });

  return card;
}

// ─── DarkBanner ───
async function createDarkBanner(parent: FrameNode, text: string, accentPart: string, opts: { x: number; y: number; w: number; h: number; density?: Density }) {
  const banner = createCard(parent, 'DarkBanner', { ...opts, bg: C.g800, shadow: false });
  const d = opts.density || (text.length > 60 ? 'dense' : 'normal');
  const s = ds(d);

  const fontSize = Math.round(36 * s.font);
  const fullText = text;
  const t = figma.createText();
  t.fontName = fontName(700);
  t.fontSize = fontSize;
  t.lineHeight = { value: fontSize * 1.45 * s.lh, unit: 'PIXELS' };
  t.letterSpacing = { value: fontSize * -0.02, unit: 'PIXELS' };
  t.characters = fullText;
  t.fills = solid(C.white);
  t.textAlignHorizontal = 'CENTER';

  if (accentPart && fullText.includes(accentPart)) {
    const start = fullText.indexOf(accentPart);
    const end = start + accentPart.length;
    t.setRangeFills(start, end, solid(C.accent));
  }

  t.x = 60;
  t.y = (opts.h - Math.round(fontSize * 1.45)) / 2;
  t.resize(opts.w - 120, t.height);
  t.textAutoResize = 'HEIGHT';
  banner.appendChild(t);

  return banner;
}

// ─── FooterBar (dark) ───
async function createFooterBar(parent: FrameNode, cells: { label: string; value: string }[], opts: { x: number; y: number; w: number; h: number }) {
  const bar = createCard(parent, 'FooterBar', { ...opts, bg: C.g800, radius: S.radiusCard, shadow: false });
  const cellW = opts.w / cells.length;
  for (let i = 0; i < cells.length; i++) {
    await createText(bar, {
      text: cells[i].label, x: i * cellW + 40, y: 40, w: cellW - 80,
      size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.white,
    });
    await createText(bar, {
      text: cells[i].value, x: i * cellW + 40, y: opts.h - 40 - 84, w: cellW - 80,
      size: 58, weight: 700, lh: 1.45, ls: -0.02, color: C.accent,
    });
  }
  return bar;
}

// ─── LightFooterRow ───
async function createLightFooterRow(parent: FrameNode, blocks: { stat: string; sub: string }[], y: number) {
  const blockW = 1760 / blocks.length;
  for (let i = 0; i < blocks.length; i++) {
    const cx = S.margin + i * blockW + blockW / 2;
    await createText(parent, {
      text: blocks[i].stat, x: cx - 100, y, w: 200,
      size: 58, weight: 700, lh: 1.45, ls: -0.02, color: C.accent, align: 'CENTER',
    });
    await createText(parent, {
      text: blocks[i].sub, x: cx - 100, y: y + 84, w: 200,
      size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500, align: 'CENTER',
    });
  }
}

// ─── SectionTitle ───
async function createSectionTitle(parent: FrameNode, text: string, y: number) {
  await createText(parent, {
    text, x: S.margin, y, w: 1760,
    size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
  });
}

// ─── CompareTable ───
interface CompareTableData {
  type: 'compare-table';
  eyebrow: string;
  headline: string;
  accentWord?: string;
  headers: string[];
  rows: string[][];
}

async function createCompareTableSlide(data: CompareTableData): Promise<FrameNode> {
  const slide = createSlideFrame('Slide — CompareTable');
  await createHeader(slide, data.eyebrow, data.headline, data.accentWord);

  const tableX = S.margin;
  const tableY = 310;
  const tableW = 1760;
  const tableH = CANVAS_H - S.margin - tableY;
  const cols = data.headers.length + 1;
  const labelW = 378;
  const dataW = (tableW - labelW) / data.headers.length;
  const rowCount = data.rows.length + 1;
  const rowH = (tableH - (rowCount - 1) * 2) / rowCount;
  const gapRow = 2;

  const container = createCard(slide, 'CompareTable', { x: tableX, y: tableY, w: tableW, h: tableH, shadow: true });
  container.clipsContent = true;

  for (let r = 0; r <= data.rows.length; r++) {
    const cy = r * (rowH + gapRow);
    const isHeader = r === 0;

    // label cell
    const labelRect = figma.createRectangle();
    labelRect.x = 0; labelRect.y = cy; labelRect.resize(labelW, rowH);
    labelRect.fills = solid(C.g100);
    container.appendChild(labelRect);

    const labelText = isHeader ? '' : data.rows[r - 1][0];
    if (labelText) {
      await createText(container, {
        text: labelText, x: 50, y: cy + (rowH - 40) / 2, w: labelW - 100,
        size: 28, weight: 700, lh: 1.45, ls: -0.02, color: C.g500,
      });
    }

    for (let c = 0; c < data.headers.length; c++) {
      const cx = labelW + gapRow + c * (dataW + gapRow);
      const isWinner = c === data.headers.length - 1;

      const cellRect = figma.createRectangle();
      cellRect.x = cx; cellRect.y = cy; cellRect.resize(dataW, rowH);
      if (isHeader && isWinner) {
        cellRect.fills = solid(C.g800);
      } else if (isHeader) {
        cellRect.fills = solid(C.g100);
      } else {
        cellRect.fills = solid(C.white);
      }
      container.appendChild(cellRect);

      const cellText = isHeader ? data.headers[c] : data.rows[r - 1][c + 1];
      if (cellText) {
        const textColor = isHeader && isWinner ? C.g100 : isHeader ? C.g500 : isWinner ? C.accent : C.black;
        const textWeight = isWinner && !isHeader ? 700 : isHeader ? 700 : 500;
        await createText(container, {
          text: cellText, x: cx + 50, y: cy + (rowH - 40) / 2, w: dataW - 100,
          size: 28, weight: textWeight, lh: 1.45, ls: -0.02, color: textColor, align: 'CENTER',
        });
      }
    }
  }

  return slide;
}

// ─── IconCard Grid Slide ───
interface IconCardGridData {
  type: 'icon-card-grid';
  eyebrow: string;
  headline: string;
  accentWord?: string;
  lead?: { subtitle: string; body: string };
  cards: IconCardData[];
  darkBanner?: { text: string; accentPart: string };
}

async function createIconCardGridSlide(data: IconCardGridData): Promise<FrameNode> {
  const slide = createSlideFrame('Slide — IconCard Grid');
  const headlineW = data.lead ? 840 : 1760;
  await createHeader(slide, data.eyebrow, data.headline, data.accentWord, headlineW);

  if (data.lead) {
    await createText(slide, {
      text: data.lead.subtitle, x: 970, y: 155, w: 870,
      size: 28, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
    });
    await createText(slide, {
      text: data.lead.body, x: 970, y: 200, w: 870,
      size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
    });
  }

  const cols = data.cards.length <= 2 ? 2 : data.cards.length <= 4 && data.cards.length !== 3 ? 2 : data.cards.length >= 4 ? 4 : 3;
  const rows = Math.ceil(data.cards.length / cols);
  const cardW = (1760 - S.gapSm * (cols - 1)) / cols;

  const hasBanner = !!data.darkBanner;
  const contentTop = 340;
  const contentBottom = CANVAS_H - S.margin;
  const bannerH = hasBanner ? Math.floor((contentBottom - contentTop - S.gapSm) / 3) : 0;
  const gridH = hasBanner ? (contentBottom - contentTop - S.gapSm - bannerH) : (contentBottom - contentTop);
  const cardH = (gridH - S.gapSm * (rows - 1)) / rows;

  for (let i = 0; i < data.cards.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    await createIconCard(slide, data.cards[i], {
      x: S.margin + col * (cardW + S.gapSm),
      y: contentTop + row * (cardH + S.gapSm),
      w: cardW, h: cardH,
    });
  }

  if (data.darkBanner) {
    await createDarkBanner(slide, data.darkBanner.text, data.darkBanner.accentPart, {
      x: S.margin, y: contentBottom - bannerH, w: 1760, h: bannerH,
    });
  }

  return slide;
}

// ─── StatCard Grid Slide ───
interface StatCardGridData {
  type: 'stat-card-grid';
  eyebrow: string;
  headline: string;
  accentWord?: string;
  lead?: { subtitle: string; body: string };
  cards: StatCardData[];
  darkBanner?: { text: string; accentPart: string };
  footerBar?: { label: string; value: string }[];
}

async function createStatCardGridSlide(data: StatCardGridData): Promise<FrameNode> {
  const slide = createSlideFrame('Slide — StatCard Grid');
  const headlineW = data.lead ? 840 : 1760;
  await createHeader(slide, data.eyebrow, data.headline, data.accentWord, headlineW);

  if (data.lead) {
    await createText(slide, {
      text: data.lead.subtitle, x: 970, y: 155, w: 870,
      size: 28, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
    });
    await createText(slide, {
      text: data.lead.body, x: 970, y: 200, w: 870,
      size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
    });
  }

  const cols = data.cards.length <= 3 ? data.cards.length : 4;
  const rows = Math.ceil(data.cards.length / cols);
  const cardW = (1760 - S.gapSm * (cols - 1)) / cols;
  const contentTop = 340;
  const contentBottom = CANVAS_H - S.margin;

  const hasFooter = !!data.footerBar;
  const hasBanner = !!data.darkBanner;
  const footerH = hasFooter ? 210 : 0;
  const bannerH = hasBanner ? Math.floor((contentBottom - contentTop - S.gapSm * 2 - footerH) / 3) : 0;
  const gridH = contentBottom - contentTop - (hasFooter ? footerH + S.gapSm : 0) - (hasBanner ? bannerH + S.gapSm : 0);
  const cardH = (gridH - S.gapSm * (rows - 1)) / rows;

  for (let i = 0; i < data.cards.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    await createStatCard(slide, data.cards[i], {
      x: S.margin + col * (cardW + S.gapSm),
      y: contentTop + row * (cardH + S.gapSm),
      w: cardW, h: cardH,
    });
  }

  let nextY = contentTop + gridH + S.gapSm;

  if (data.darkBanner) {
    await createDarkBanner(slide, data.darkBanner.text, data.darkBanner.accentPart, {
      x: S.margin, y: nextY, w: 1760, h: bannerH,
    });
    nextY += bannerH + S.gapSm;
  }

  if (data.footerBar) {
    await createFooterBar(slide, data.footerBar, {
      x: S.margin, y: nextY, w: 1760, h: footerH,
    });
  }

  return slide;
}

// ─── Business Model Slide (IconCard + SectionTitle + LightFooterRow) ───
interface BizModelData {
  type: 'biz-model';
  eyebrow: string;
  headline: string;
  accentWord?: string;
  lead?: { subtitle: string; body: string };
  cards: IconCardData[];
  sectionTitle: string;
  footerBlocks: { stat: string; sub: string }[];
}

async function createBizModelSlide(data: BizModelData): Promise<FrameNode> {
  const slide = createSlideFrame('Slide — Business Model');
  const headlineW = data.lead ? 840 : 1760;
  await createHeader(slide, data.eyebrow, data.headline, data.accentWord, headlineW);

  if (data.lead) {
    await createText(slide, {
      text: data.lead.subtitle, x: 970, y: 155, w: 870,
      size: 28, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
    });
    await createText(slide, {
      text: data.lead.body, x: 970, y: 200, w: 870,
      size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
    });
  }

  const cols = data.cards.length;
  const cardW = (1760 - S.gapSm * (cols - 1)) / cols;
  const cardH = 240;
  const contentTop = data.lead ? 300 : 340;

  for (let i = 0; i < data.cards.length; i++) {
    await createIconCard(slide, data.cards[i], {
      x: S.margin + i * (cardW + S.gapSm),
      y: contentTop, w: cardW, h: cardH,
    });
  }

  const sectionY = contentTop + cardH + S.gapSm;
  const footerCardY = sectionY;
  const footerCardH = CANVAS_H - S.margin - footerCardY;
  const footerCard = createCard(slide, 'FooterCard', {
    x: S.margin, y: footerCardY, w: 1760, h: footerCardH, shadow: true,
  });

  await createText(footerCard, {
    text: data.sectionTitle, x: S.padCard, y: S.padCard, w: 1760 - S.padCard * 2,
    size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
  });

  const statY = footerCardH / 2;
  const blockW = (1760 - S.padCard * 2) / data.footerBlocks.length;
  for (let i = 0; i < data.footerBlocks.length; i++) {
    const cx = S.padCard + i * blockW + blockW / 2;
    await createText(footerCard, {
      text: data.footerBlocks[i].stat, x: cx - 100, y: statY, w: 200,
      size: 58, weight: 700, lh: 1.45, ls: -0.02, color: C.accent, align: 'CENTER',
    });
    await createText(footerCard, {
      text: data.footerBlocks[i].sub, x: cx - 100, y: statY + 84, w: 200,
      size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500, align: 'CENTER',
    });
  }

  return slide;
}

// ─── GrowthStatCard ───
interface GrowthStatCardData {
  title: string;
  before: string;
  after: string;
  labels: string[];
}

async function createGrowthStatCard(parent: FrameNode, data: GrowthStatCardData, opts: CardOpts): Promise<FrameNode> {
  const card = createCard(parent, `GrowthStatCard — ${data.title}`, { ...opts, bg: C.g100, radius: S.radiusInner, shadow: false });

  await createText(card, {
    text: data.before + ' →', x: 40, y: 41, w: opts.w - 80,
    size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.g500,
  });
  await createText(card, {
    text: data.after, x: 40, y: 93, w: opts.w - 80,
    size: 58, weight: 700, lh: 1.45, ls: -0.02, color: C.accent,
  });

  const barAreaY = opts.h * 0.5;
  const barAreaH = opts.h * 0.35;
  const barW = (opts.w - 120) / 2 * 0.7;
  const leftX = 40;
  const rightX = opts.w / 2 + 20;

  const bar1 = figma.createRectangle();
  bar1.x = leftX; bar1.resize(barW, barAreaH * 0.35);
  bar1.y = barAreaY + barAreaH - bar1.height;
  bar1.fills = solid(C.black);
  bar1.topLeftRadius = S.radiusInner; bar1.topRightRadius = S.radiusInner;
  card.appendChild(bar1);

  const bar2 = figma.createRectangle();
  bar2.x = rightX; bar2.resize(barW, barAreaH * 0.85);
  bar2.y = barAreaY + barAreaH - bar2.height;
  bar2.fills = [{ type: 'GRADIENT_LINEAR', gradientStops: [
    { position: 0, color: { ...C.accent, a: 1 } },
    { position: 1, color: { ...C.accent, a: 0.6 } }
  ], gradientTransform: [[0, 1, 0], [-1, 0, 1]] }];
  bar2.topLeftRadius = S.radiusInner; bar2.topRightRadius = S.radiusInner;
  card.appendChild(bar2);

  const labelY = barAreaY + barAreaH + 8;
  await createText(card, {
    text: data.labels[0], x: leftX, y: labelY, w: barW,
    size: 24, weight: 500, lh: 1.45, ls: -0.02, color: C.g500, align: 'CENTER',
  });
  await createText(card, {
    text: data.labels[1], x: rightX, y: labelY, w: barW,
    size: 24, weight: 500, lh: 1.45, ls: -0.02, color: C.g500, align: 'CENTER',
  });

  return card;
}

// ─── Problem Slide (GrowthStatCard ×N + DarkBanner) ───
interface ProblemSlideData {
  type: 'problem';
  eyebrow: string;
  headline: string;
  accentWord?: string;
  lead?: { subtitle: string; body: string };
  cards: GrowthStatCardData[];
  darkBanner?: { text: string; accentPart: string };
}

async function createProblemSlide(data: ProblemSlideData): Promise<FrameNode> {
  const slide = createSlideFrame('Slide — Problem');
  const headlineW = data.lead ? 600 : 1760;
  await createHeader(slide, data.eyebrow, data.headline, data.accentWord, headlineW);

  if (data.lead) {
    await createText(slide, {
      text: data.lead.body, x: 970, y: 155, w: 770,
      size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
    });
  }

  const cols = data.cards.length;
  const cardW = (1760 - S.gapSm * (cols - 1)) / cols;
  const contentTop = 340;
  const contentBottom = CANVAS_H - S.margin;
  const hasBanner = !!data.darkBanner;
  const bannerH = hasBanner ? Math.floor((contentBottom - contentTop) / 3) : 0;
  const cardH = hasBanner ? contentBottom - contentTop - bannerH - S.gapSm : contentBottom - contentTop;

  for (let i = 0; i < cols; i++) {
    const titleNode = await createText(slide, {
      text: data.cards[i].title, x: S.margin + i * (cardW + S.gapSm), y: contentTop - 52, w: cardW,
      size: 32, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
    });
  }

  for (let i = 0; i < cols; i++) {
    await createGrowthStatCard(slide, data.cards[i], {
      x: S.margin + i * (cardW + S.gapSm), y: contentTop, w: cardW, h: cardH,
    });
  }

  if (data.darkBanner) {
    await createDarkBanner(slide, data.darkBanner.text, data.darkBanner.accentPart, {
      x: S.margin, y: contentBottom - bannerH, w: 1760, h: bannerH,
    });
  }

  return slide;
}

// ─── PersonCard ───
interface PersonCardData {
  name: string;
  role: string;
  highlights: string;
}

async function createPersonCard(parent: FrameNode, data: PersonCardData, opts: CardOpts): Promise<FrameNode> {
  const card = createCard(parent, `PersonCard — ${data.name}`, { ...opts, shadow: true });

  const photoSize = Math.min(opts.h - 80, 215);
  const photo = figma.createEllipse();
  photo.name = 'Photo';
  photo.x = 40; photo.y = (opts.h - photoSize) / 2;
  photo.resize(photoSize, photoSize);
  photo.fills = solid(C.g100);
  card.appendChild(photo);

  const infoX = 40 + photoSize + S.gapMd;
  const infoW = opts.w - infoX - 40;
  const nameY = (opts.h - 120) / 2;

  await createText(card, {
    text: data.name, x: infoX, y: nameY, w: infoW,
    size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
  });
  await createText(card, {
    text: data.role, x: infoX, y: nameY + 52, w: infoW,
    size: 24, weight: 500, lh: 1.45, ls: -0.02, color: C.accent,
  });
  await createText(card, {
    text: data.highlights, x: infoX, y: nameY + 86, w: infoW,
    size: 24, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
  });

  return card;
}

// ─── BulletCard ───
interface BulletCardData {
  title: string;
  items: string[];
}

async function createBulletCard(parent: FrameNode, data: BulletCardData, opts: CardOpts): Promise<FrameNode> {
  const card = createCard(parent, `BulletCard — ${data.title}`, { ...opts, shadow: true });
  const pad = S.padCard;

  const titleNode = await createText(card, {
    text: data.title, x: pad, y: pad, w: opts.w - pad * 2,
    size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
  });

  const bulletLineH = Math.round(28 * 1.45);
  const availableH = opts.h - pad * 2 - titleNode.height - S.gapSm;
  const singleColH = bulletLineH * data.items.length;
  const useTwoCols = singleColH > availableH && data.items.length > 2;

  const bulletY = pad + titleNode.height + S.gapSm;
  const contentW = opts.w - pad * 2;

  if (useTwoCols) {
    const colGap = S.gapSm;
    const colW = (contentW - colGap) / 2;
    const midIdx = Math.ceil(data.items.length / 2);
    const leftItems = data.items.slice(0, midIdx);
    const rightItems = data.items.slice(midIdx);

    const leftNode = await createText(card, {
      text: leftItems.map(it => '•  ' + it).join('\n'),
      x: pad, y: 0, w: colW,
      size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
    });
    leftNode.y = opts.h - pad - leftNode.height;
    const rightNode = await createText(card, {
      text: rightItems.map(it => '•  ' + it).join('\n'),
      x: pad + colW + colGap, y: 0, w: colW,
      size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
    });
    rightNode.y = opts.h - pad - rightNode.height;
  } else {
    const bulletNode = await createText(card, {
      text: data.items.map(it => '•  ' + it).join('\n'),
      x: pad + 20, y: 0, w: contentW - 20,
      size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
    });
    bulletNode.y = opts.h - pad - bulletNode.height;
  }

  return card;
}

// ─── Solution Slide (Pattern C: lead left + BulletCard + PersonCard) ───
interface SolutionSlideData {
  type: 'solution';
  eyebrow: string;
  headline: string;
  accentWord?: string;
  lead: { subtitle: string; body: string };
  bulletCards: BulletCardData[];
  personCards: PersonCardData[];
}

async function createSolutionSlide(data: SolutionSlideData): Promise<FrameNode> {
  const slide = createSlideFrame('Slide — Solution');
  await createHeader(slide, data.eyebrow, data.headline, data.accentWord, 425);

  await createText(slide, {
    text: data.lead.subtitle, x: 80, y: CANVAS_H - S.margin - 160, w: 425,
    size: 28, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
  });
  await createText(slide, {
    text: data.lead.body, x: 80, y: CANVAS_H - S.margin - 120, w: 425,
    size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
  });

  const rightX = 540;
  const rightW = CANVAS_W - rightX - S.margin;
  const contentTop = 155;
  const contentBottom = CANVAS_H - S.margin;
  const rowH = (contentBottom - contentTop - S.gapSm) / 2;
  const cardW = (rightW - S.gapSm) / 2;
  const bulletTop = contentTop;
  const personTop = contentTop + rowH + S.gapSm;

  for (let i = 0; i < data.bulletCards.length && i < 2; i++) {
    await createBulletCard(slide, data.bulletCards[i], {
      x: rightX + i * (cardW + S.gapSm), y: bulletTop, w: cardW, h: rowH,
    });
  }

  for (let i = 0; i < data.personCards.length && i < 2; i++) {
    await createPersonCard(slide, data.personCards[i], {
      x: rightX + i * (cardW + S.gapSm), y: personTop, w: cardW, h: rowH,
    });
  }

  return slide;
}

// ─── StatHeroCard ───
interface StatHeroCardData {
  title: string;
  stat: string;
  sub: string;
}

async function createStatHeroCard(parent: FrameNode, data: StatHeroCardData, opts: CardOpts): Promise<FrameNode> {
  const card = createCard(parent, `StatHeroCard — ${data.title}`, { ...opts, shadow: true });
  const pad = S.padCard;

  const titleNode = await createText(card, {
    text: data.title, x: pad, y: pad, w: opts.w - pad * 2,
    size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
  });

  const statSize = 58;
  const statLineH = Math.round(statSize * 1.45);
  const subSize = 24;
  const subLineH = Math.round(subSize * 1.45);

  const subY = opts.h - pad - subLineH;
  const statY = subY - statLineH;

  await createText(card, {
    text: data.stat, x: pad, y: statY, w: opts.w - pad * 2,
    size: statSize, weight: 700, lh: 1.45, ls: -0.02, color: C.accent,
  });
  await createText(card, {
    text: data.sub, x: pad, y: subY, w: opts.w - pad * 2,
    size: subSize, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
  });

  return card;
}

// ─── StatRowCard (timeline of stats) ───
interface StatRowCardData {
  title: string;
  values: { stat: string; label: string; accent?: boolean }[];
}

async function createStatRowCard(parent: FrameNode, data: StatRowCardData, opts: CardOpts): Promise<FrameNode> {
  const card = createCard(parent, `StatRow — ${data.title}`, { ...opts, shadow: true });
  const pad = S.padCard;

  const titleNode = await createText(card, {
    text: data.title, x: pad, y: pad, w: opts.w - pad * 2,
    size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
  });

  const cols = data.values.length;
  const colW = (opts.w - pad * 2) / cols;
  const statSize = 48;
  const labelSize = 24;
  const statLineH = Math.round(statSize * 1.3);
  const labelLineH = Math.round(labelSize * 1.45);

  const labelY = opts.h - pad - labelLineH;
  const statY = labelY - statLineH;

  for (let i = 0; i < cols; i++) {
    const v = data.values[i];
    const cx = pad + i * colW;
    const isAccent = v.accent || false;
    const statColor = isAccent ? C.accent : C.black;
    const labelColor = isAccent ? C.accent : C.g500;

    await createText(card, {
      text: v.stat, x: cx, y: statY, w: colW,
      size: statSize, weight: 700, lh: 1.3, ls: -0.02, color: statColor,
    });
    await createText(card, {
      text: v.label, x: cx, y: labelY, w: colW,
      size: labelSize, weight: 500, lh: 1.45, ls: -0.02, color: labelColor,
    });
  }

  return card;
}

// ─── LabeledListCard ───
interface LabeledListCardData {
  title: string;
  groups: { label: string; items: string }[];
}

async function createLabeledListCard(parent: FrameNode, data: LabeledListCardData, opts: CardOpts): Promise<FrameNode> {
  const card = createCard(parent, `LabeledListCard — ${data.title}`, { ...opts, shadow: true });
  const totalChars = data.title.length + data.groups.reduce((sum, g) => sum + g.label.length + g.items.length, 0);
  const contentUnits = totalChars + data.groups.length * 15;
  const d = opts.density || detectDensity(opts.h, contentUnits);
  const s = ds(d);

  const pad = S.padCard;

  const titleNode = await createText(card, {
    text: data.title, x: pad, y: pad, w: opts.w - pad * 2,
    size: scaledFont(36, s.font, 'title'), weight: 700, lh: 1.45 * s.lh, ls: -0.02, color: C.black,
  });
  let groupY = pad + titleNode.height + S.gapSm;
  for (const group of data.groups) {
    const labelSize = scaledFont(24, s.font, 'sub');
    await createText(card, {
      text: group.label, x: pad, y: groupY, w: opts.w - pad * 2,
      size: labelSize, weight: 500, lh: 1.45 * s.lh, ls: -0.02, color: C.g500,
    });
    const labelH = Math.round(labelSize * 1.45 * s.lh);
    const itemNode = await createText(card, {
      text: group.items, x: pad, y: groupY + labelH, w: opts.w - pad * 2,
      size: scaledFont(28, s.font, 'body'), weight: 500, lh: 1.45 * s.lh, ls: -0.02, color: C.black,
    });
    groupY += labelH + itemNode.height + S.gapSm;
  }

  return card;
}

// ─── GanttCard (timeline/roadmap) ───
interface GanttCardData {
  title: string;
  periods: string[];
  items: { label: string; spans: number[] }[];
}

async function createGanttCard(parent: FrameNode, data: GanttCardData, opts: CardOpts): Promise<FrameNode> {
  const card = createCard(parent, `Gantt — ${data.title}`, { ...opts, shadow: true });
  const pad = S.padCard;

  const titleNode = await createText(card, {
    text: data.title, x: pad, y: pad, w: opts.w - pad * 2,
    size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
  });

  const gridStartY = pad + titleNode.height + S.gapSm;
  const labelW = (opts.w - pad * 2) * 0.3;
  const chartW = (opts.w - pad * 2) - labelW;
  const chartX = pad + labelW;
  const periodW = chartW / data.periods.length;
  const allRows = data.items.length + 1;
  const availH = opts.h - gridStartY - pad;
  const rowH = availH / allRows;

  // Color tiers: changes every 2 columns
  const tierColors = [hex('#FFE5F0'), hex('#FFBFDA'), hex('#FF75AE')];
  function ganttColor(colIdx: number): RGB {
    const tier = Math.floor(colIdx / 2);
    return tierColors[Math.min(tier, tierColors.length - 1)];
  }
  function ganttTextColor(colIdx: number): RGB {
    const tier = Math.floor(colIdx / 2);
    return tier >= 2 ? C.white : C.g500;
  }

  // Grid container (clipped with inner radius)
  const gridW = opts.w - pad * 2;
  const gridH = availH;
  const grid = figma.createFrame();
  grid.name = 'gantt-grid';
  grid.x = pad; grid.y = gridStartY;
  grid.resize(gridW, gridH);
  grid.fills = solid(C.white);
  grid.cornerRadius = S.radiusInner;
  grid.clipsContent = true;
  card.appendChild(grid);

  // 1열: 가장 긴 라벨 기준 폭 계산 (글자수 × 14 + 패딩)
  const maxLabelLen = Math.max(...data.items.map(it => it.label.length), 4);
  const innerLabelW = Math.max(maxLabelLen * 24 + pad * 2, 240);

  // Label column background (g100)
  const labelBg = figma.createRectangle();
  labelBg.x = 0; labelBg.y = 0;
  labelBg.resize(innerLabelW, gridH);
  labelBg.fills = solid(C.g100);
  grid.appendChild(labelBg);

  const innerChartX = innerLabelW;
  const innerChartW = gridW - innerLabelW;
  const innerPeriodW = innerChartW / data.periods.length;

  // Header row
  for (let i = 0; i < data.periods.length; i++) {
    const px = innerChartX + i * innerPeriodW;
    const color = ganttColor(i);
    const headerRect = figma.createRectangle();
    headerRect.x = px; headerRect.y = 0;
    headerRect.resize(innerPeriodW, rowH - 2);
    headerRect.fills = solid(color);
    grid.appendChild(headerRect);

    await createText(grid, {
      text: data.periods[i], x: px, y: (rowH - 2 - 28) / 2, w: innerPeriodW,
      size: 24, weight: 700, lh: 1.45, ls: -0.02,
      color: ganttTextColor(i), align: 'CENTER',
    });
  }

  // Data rows
  for (let r = 0; r < data.items.length; r++) {
    const item = data.items[r];
    const ry = (r + 1) * rowH;

    await createText(grid, {
      text: item.label, x: pad, y: ry + (rowH - 28) / 2, w: innerLabelW - pad * 2,
      size: 24, weight: 600, lh: 1.45, ls: -0.02, color: C.black,
    });

    for (let s = 0; s < item.spans.length; s += 2) {
      const start = item.spans[s];
      const end = item.spans[s + 1];
      if (start === undefined || end === undefined) break;

      for (let col = start; col < end; col++) {
        const cellX = innerChartX + col * innerPeriodW;
        const barRect = figma.createRectangle();
        barRect.x = cellX;
        barRect.y = ry;
        barRect.resize(innerPeriodW, rowH - 2);
        barRect.fills = solid(ganttColor(col));
        grid.appendChild(barRect);
      }
    }
  }

  return card;
}

// ─── Mixed Grid Slide (2×2: any combo of StatHeroCard, LabeledListCard, InlineStatTimeline) ───
interface MixedGridSlideData {
  type: 'mixed-grid';
  eyebrow: string;
  headline: string;
  accentWord?: string;
  cells: ({ kind: 'stat-hero' } & StatHeroCardData | { kind: 'labeled-list' } & LabeledListCardData | { kind: 'bullet' } & BulletCardData)[];
}

async function createMixedGridSlide(data: MixedGridSlideData): Promise<FrameNode> {
  const slide = createSlideFrame('Slide — Mixed Grid');
  await createHeader(slide, data.eyebrow, data.headline, data.accentWord);

  const cols = 2;
  const rows = Math.ceil(data.cells.length / cols);
  const cardW = (1760 - S.gapSm) / cols;
  const contentTop = 315;
  const contentH = CANVAS_H - S.margin - contentTop;
  const cardH = (contentH - S.gapSm * (rows - 1)) / rows;

  for (let i = 0; i < data.cells.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellOpts: CardOpts = {
      x: S.margin + col * (cardW + S.gapSm),
      y: contentTop + row * (cardH + S.gapSm),
      w: cardW, h: cardH,
    };
    const cell = data.cells[i];
    if (cell.kind === 'stat-hero') {
      await createStatHeroCard(slide, cell, cellOpts);
    } else if (cell.kind === 'labeled-list') {
      await createLabeledListCard(slide, cell, cellOpts);
    } else if (cell.kind === 'bullet') {
      await createBulletCard(slide, cell, cellOpts);
    }
  }

  return slide;
}

// ─── Step Flow Slide (centered step cards + DarkBanner) ───
interface StepFlowData {
  type: 'step-flow';
  eyebrow: string;
  headline: string;
  accentWord?: string;
  steps: { icon: string; title: string; desc: string }[];
  darkBanner?: { text: string; accentPart: string };
}

async function createStepFlowSlide(data: StepFlowData): Promise<FrameNode> {
  const slide = createSlideFrame('Slide — Step Flow');
  await createHeader(slide, data.eyebrow, data.headline, data.accentWord);

  const cols = data.steps.length;
  const cardW = (1760 - S.gapSm * (cols - 1)) / cols;
  const contentTop = 340;
  const contentBottom = CANVAS_H - S.margin;
  const hasBanner = !!data.darkBanner;
  const bannerH = hasBanner ? Math.floor((contentBottom - contentTop) / 3) : 0;
  const cardH = hasBanner ? contentBottom - contentTop - bannerH - S.gapSm : contentBottom - contentTop;

  for (let i = 0; i < cols; i++) {
    const card = createCard(slide, `Step ${i + 1}`, {
      x: S.margin + i * (cardW + S.gapSm), y: contentTop, w: cardW, h: cardH, shadow: true,
    });

    const iconRect = figma.createRectangle();
    iconRect.name = 'step-icon';
    iconRect.resize(96, 96);
    iconRect.x = (cardW - 96) / 2;
    iconRect.y = cardH * 0.2;
    iconRect.fills = solid(C.g100);
    iconRect.cornerRadius = 16;
    card.appendChild(iconRect);

    await createText(card, {
      text: data.steps[i].title, x: 20, y: cardH * 0.2 + 120, w: cardW - 40,
      size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black, align: 'CENTER',
    });
    await createText(card, {
      text: data.steps[i].desc, x: 20, y: cardH * 0.2 + 176, w: cardW - 40,
      size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500, align: 'CENTER',
    });
  }

  if (data.darkBanner) {
    await createDarkBanner(slide, data.darkBanner.text, data.darkBanner.accentPart, {
      x: S.margin, y: contentBottom - bannerH, w: 1760, h: bannerH,
    });
  }

  return slide;
}

// ═══════════════════════════════════════
// CUSTOM LAYOUT SYSTEM
// ═══════════════════════════════════════

interface CustomPrimitive {
  primitive: string;
  span?: number;
  [key: string]: any;
}

interface CustomRow {
  cards: CustomPrimitive[];
  height?: number;
}

interface CustomSlideData {
  type: 'custom';
  eyebrow: string;
  headline: string;
  accentWord?: string;
  lead?: { subtitle: string; body: string; position?: 'right' | 'left' | 'bottom' };
  headlineWidth?: number;
  rows: CustomRow[];
  footer?: CustomPrimitive;
}

async function renderPrimitive(parent: FrameNode, p: CustomPrimitive, opts: CardOpts): Promise<void> {
  switch (p.primitive) {
    case 'icon-card':
      await createIconCard(parent, { emoji: p.emoji, title: p.title, body: p.body, dark: p.dark, stat: p.stat, statSub: p.statSub }, opts);
      break;
    case 'stat-card':
      await createStatCard(parent, { title: p.title, sub: p.sub || '', label: p.label || '', stat: p.stat }, opts);
      break;
    case 'stat-hero':
      await createStatHeroCard(parent, { title: p.title, stat: p.stat, sub: p.sub || '' }, opts);
      break;
    case 'person':
      await createPersonCard(parent, { name: p.name, role: p.role, highlights: p.highlights || '' }, opts);
      break;
    case 'bullet':
      await createBulletCard(parent, { title: p.title, items: p.items || [] }, opts);
      break;
    case 'labeled-list':
      await createLabeledListCard(parent, { title: p.title, groups: p.groups || [] }, opts);
      break;
    case 'growth-stat':
      await createGrowthStatCard(parent, { title: p.title, before: p.before, after: p.after, labels: p.labels || [] }, opts);
      break;
    case 'stat-row':
      await createStatRowCard(parent, { title: p.title, values: p.values || [] }, opts);
      break;
    case 'image':
      await createImagePlaceholder(parent, { label: p.label || p.title || '', caption: p.caption, imageUrl: p.imageUrl }, opts);
      break;
    case 'gantt':
      await createGanttCard(parent, { title: p.title, periods: p.periods || [], items: p.items || [] }, opts);
      break;
    default:
      const fallback = createCard(parent, 'Unknown: ' + p.primitive, { ...opts, shadow: true });
      await createText(fallback, {
        text: p.primitive + ': ' + (p.title || ''), x: S.padCard, y: S.padCard, w: opts.w - S.padCard * 2,
        size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
      });
  }
}

function measureSlideDensity(data: CustomSlideData): Density {
  let totalUnits = 0;
  for (const row of data.rows) {
    for (const card of row.cards) {
      const texts = [card.title, card.body, card.sub, card.stat, card.name, card.role, card.highlights, card.label, card.text].filter(Boolean);
      totalUnits += texts.reduce((sum: number, t: string) => sum + t.length, 0);
      if (card.items) totalUnits += (card.items as string[]).reduce((sum: number, it: string) => sum + it.length + 10, 0);
      if (card.groups) totalUnits += (card.groups as any[]).reduce((sum: number, g: any) => sum + g.label.length + g.items.length + 15, 0);
    }
  }
  const availableH = CANVAS_H - 340 - S.margin;
  const totalCards = data.rows.reduce((sum, r) => sum + r.cards.length, 0);
  const avgCardH = availableH / Math.max(data.rows.length, 1);
  const avgUnitsPerCard = totalUnits / Math.max(totalCards, 1);
  return detectDensity(avgCardH, avgUnitsPerCard);
}

async function createCustomSlide(data: CustomSlideData): Promise<FrameNode> {
  const slide = createSlideFrame('Slide — Custom');
  const leadPos = data.lead?.position || 'right';

  // Header width depends on lead position
  const headlineW = data.lead && leadPos === 'right' ? (data.headlineWidth || 840)
    : data.lead && leadPos === 'left' ? 396
    : 1760;
  await createHeader(slide, data.eyebrow, data.headline, data.accentWord, headlineW);

  let contentTop = 340;
  let cardAreaX = S.margin;
  let cardAreaW = 1760;

  if (data.lead) {
    if (leadPos === 'right') {
      await createText(slide, {
        text: data.lead.subtitle, x: 970, y: 155, w: 870,
        size: 28, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
      });
      await createText(slide, {
        text: data.lead.body, x: 970, y: 200, w: 870,
        size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
      });
    } else if (leadPos === 'left') {
      const leadW = 396;
      const bottomY = CANVAS_H - S.margin;
      // Render body first to measure actual height, then reposition
      const bodyNode = await createText(slide, {
        text: data.lead.body, x: S.margin, y: bottomY, w: leadW,
        size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
      });
      const actualBodyH = bodyNode.height;
      bodyNode.y = bottomY - actualBodyH;
      const subNode = await createText(slide, {
        text: data.lead.subtitle, x: S.margin, y: bodyNode.y - 4, w: leadW,
        size: 28, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
      });
      subNode.y = bodyNode.y - 4 - subNode.height;
      const leadGap = S.gapLg;
      cardAreaX = S.margin + leadW + leadGap;
      cardAreaW = 1760 - leadW - leadGap;
      contentTop = 155;
    } else if (leadPos === 'bottom') {
      const leadY = CANVAS_H - S.margin - 80;
      await createText(slide, {
        text: data.lead.subtitle, x: S.margin, y: leadY, w: 870,
        size: 28, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
      });
      await createText(slide, {
        text: data.lead.body, x: S.margin, y: leadY + 34, w: 1760,
        size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
      });
    }
  }

  const slideDensity = measureSlideDensity(data);

  const contentBottom = leadPos === 'bottom' && data.lead ? CANVAS_H - S.margin - 100 : CANVAS_H - S.margin;
  const totalRows = data.rows.length;
  const hasFooter = !!data.footer;

  let footerH = 0;
  if (hasFooter) {
    const fp = data.footer!;
    if (fp.primitive === 'dark-banner') footerH = Math.floor((contentBottom - contentTop) * 0.18);
    else if (fp.primitive === 'footer-bar') footerH = 210;
    else if (fp.primitive === 'footer-card') footerH = Math.floor((contentBottom - contentTop) * 0.35);
    else footerH = 150;
  }

  const rowsH = contentBottom - contentTop - (hasFooter ? footerH + S.gapSm : 0);
  const gapTotal = S.gapSm * (totalRows - 1);
  const fixedH = data.rows.reduce((sum, r) => sum + (r.height || 0), 0);
  const flexRows = data.rows.filter(r => !r.height).length;
  const flexRowH = flexRows > 0 ? (rowsH - gapTotal - fixedH) / flexRows : 0;

  let currentY = contentTop;
  for (const row of data.rows) {
    const rowH = row.height || flexRowH;
    const totalSpans = row.cards.reduce((sum, card) => sum + (card.span || 1), 0);
    const unitW = (cardAreaW - S.gapSm * (row.cards.length - 1)) / totalSpans;

    let cx = 0;
    for (let c = 0; c < row.cards.length; c++) {
      const span = row.cards[c].span || 1;
      const cardW = unitW * span + S.gapSm * (span - 1);
      const cardX = cardAreaX + cx;
      await renderPrimitive(slide, row.cards[c], { x: cardX, y: currentY, w: cardW, h: rowH, density: slideDensity });
      cx += cardW + S.gapSm;
    }
    currentY += rowH + S.gapSm;
  }

  if (data.footer) {
    const fp = data.footer;
    const footerY = contentBottom - footerH;

    if (fp.primitive === 'dark-banner') {
      await createDarkBanner(slide, fp.text, fp.accentPart || '', {
        x: cardAreaX, y: footerY, w: cardAreaW, h: footerH,
      });
    } else if (fp.primitive === 'footer-bar') {
      await createFooterBar(slide, fp.cells || [], {
        x: cardAreaX, y: footerY, w: cardAreaW, h: footerH,
      });
    } else if (fp.primitive === 'footer-card') {
      const fc = createCard(slide, 'FooterCard', {
        x: cardAreaX, y: footerY, w: cardAreaW, h: footerH, shadow: true,
      });
      if (fp.title) {
        await createText(fc, {
          text: fp.title, x: S.padCard, y: S.padCard, w: cardAreaW - S.padCard * 2,
          size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
        });
      }
      if (fp.blocks) {
        const blockW = (cardAreaW - S.padCard * 2) / fp.blocks.length;
        for (let i = 0; i < fp.blocks.length; i++) {
          const cx = S.padCard + i * blockW + blockW / 2;
          await createText(fc, {
            text: fp.blocks[i].stat, x: cx - 100, y: footerH / 2, w: 200,
            size: 58, weight: 700, lh: 1.45, ls: -0.02, color: C.accent, align: 'CENTER',
          });
          await createText(fc, {
            text: fp.blocks[i].sub, x: cx - 100, y: footerH / 2 + 84, w: 200,
            size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500, align: 'CENTER',
          });
        }
      }
    }
  }

  return slide;
}

// ─── DataTable Slide ───
interface DataTableData {
  type: 'data-table';
  eyebrow: string;
  headline: string;
  accentWord?: string;
  headers: string[];
  rows: string[][];
  summary?: { label: string; value: string };
  columnWidths?: number[];
}

async function createDataTableSlide(data: DataTableData): Promise<FrameNode> {
  const slide = createSlideFrame('Slide — DataTable');
  await createHeader(slide, data.eyebrow, data.headline, data.accentWord);

  const tableX = S.margin;
  const tableY = 310;
  const tableW = 1760;
  const hasSummary = !!data.summary;
  const totalRows = data.rows.length;
  const allRows = totalRows + 1 + (hasSummary ? 1 : 0);
  const maxTableH = CANVAS_H - S.margin - tableY;
  const gaps = allRows;
  const rowH = Math.floor((maxTableH - gaps) / allRows);
  const headerH = rowH;
  const actualRowH = rowH;
  const actualTableH = allRows * (rowH + 1);

  const container = createCard(slide, 'DataTable', {
    x: tableX, y: tableY, w: tableW, h: actualTableH, shadow: true,
  });
  container.clipsContent = true;

  const cols = data.headers.length;
  const colWidths: number[] = data.columnWidths
    ? data.columnWidths.map(w => w * tableW / data.columnWidths!.reduce((a, b) => a + b, 0))
    : data.headers.map(() => tableW / cols);

  const cellFontSize = rowH >= 80 ? 28 : 22;
  const cellLh = 1.45;
  const cellLs = -0.02;
  const cellPad = 20;
  let cy = 0;

  // Header row (light gray)
  let cx = 0;
  for (let c = 0; c < cols; c++) {
    const cellRect = figma.createRectangle();
    cellRect.x = cx; cellRect.y = cy;
    cellRect.resize(colWidths[c], headerH);
    cellRect.fills = solid(C.g100);
    container.appendChild(cellRect);

    const hAlign: 'LEFT' | 'CENTER' = c === 0 ? 'LEFT' : 'CENTER';
    const hPad = c === 0 ? S.padCard : cellPad;
    await createText(container, {
      text: data.headers[c], x: cx + hPad, y: cy + (headerH - 32) / 2, w: colWidths[c] - hPad - cellPad,
      size: cellFontSize, weight: 700, lh: cellLh, ls: cellLs, color: C.g500, align: hAlign,
    });
    cx += colWidths[c];
  }
  cy += headerH + 1;

  // Data rows
  for (let r = 0; r < totalRows; r++) {
    cx = 0;
    for (let c = 0; c < cols; c++) {
      const cellRect = figma.createRectangle();
      cellRect.x = cx; cellRect.y = cy;
      cellRect.resize(colWidths[c], actualRowH);
      cellRect.fills = solid(c === 0 ? C.g100 : C.white);
      container.appendChild(cellRect);

      const cellText = data.rows[r][c] || '';
      const cellAlign: 'LEFT' | 'CENTER' | 'RIGHT' = c === 0 ? 'LEFT' : 'CENTER';
      const cPad = c === 0 ? S.padCard : cellPad;
      const cellWeight = c === 0 ? 700 : 500;
      await createText(container, {
        text: cellText, x: cx + cPad, y: cy + (actualRowH - 32) / 2, w: colWidths[c] - cPad - cellPad,
        size: cellFontSize, weight: cellWeight, lh: cellLh, ls: cellLs, color: C.black, align: cellAlign,
      });
      cx += colWidths[c];
    }
    cy += actualRowH + 1;
  }

  // Summary row — same height, bottom radius matches container
  if (data.summary) {
    const summH = actualTableH - cy;
    const summRect = figma.createRectangle();
    summRect.x = 0; summRect.y = cy;
    summRect.resize(tableW, summH);
    summRect.fills = solid(C.g800);
    container.appendChild(summRect);

    const sTextY = cy + (summH - 32) / 2;
    const lastColX = colWidths.slice(0, -1).reduce((sum, w) => sum + w, 0);
    const lastColW = colWidths[colWidths.length - 1];
    await createText(container, {
      text: data.summary.label, x: S.padCard, y: sTextY, w: lastColX - S.padCard - cellPad,
      size: 28, weight: 700, lh: 1.45, ls: -0.02, color: C.white,
    });
    await createText(container, {
      text: data.summary.value, x: lastColX + cellPad, y: sTextY, w: lastColW - cellPad * 2,
      size: 28, weight: 700, lh: 1.45, ls: -0.02, color: C.accent, align: 'CENTER',
    });
  }

  return slide;
}

// ─── ImagePlaceholder Card ───
interface ImagePlaceholderData {
  label: string;
  caption?: string;
  aspect?: string;
  imageUrl?: string;
}

async function createImagePlaceholder(parent: FrameNode, data: ImagePlaceholderData, opts: CardOpts): Promise<FrameNode> {
  const card = createCard(parent, `Image — ${data.label}`, { ...opts, shadow: true });

  const imgPad = 16;
  const captionH = data.caption ? 60 : 0;
  const imgW = opts.w - imgPad * 2;
  const imgH = opts.h - imgPad * 2 - captionH;

  const imgRect = figma.createRectangle();
  imgRect.name = 'image-area';
  imgRect.x = imgPad;
  imgRect.y = imgPad;
  imgRect.resize(imgW, imgH);
  if (data.imageUrl && _imageBytes[data.imageUrl]) {
    const img = figma.createImage(new Uint8Array(_imageBytes[data.imageUrl]));
    imgRect.fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: 'FILL' }];
  } else {
    imgRect.fills = solid(C.g100);
  }
  imgRect.cornerRadius = S.radiusInner;
  card.appendChild(imgRect);

  if (!data.imageUrl || !_imageBytes[data.imageUrl]) {
    await createText(card, {
      text: data.label, x: imgPad, y: imgPad + imgH / 2 - 20, w: imgW,
      size: 28, weight: 600, lh: 1.45, ls: -0.02, color: C.g400, align: 'CENTER',
    });
  }

  if (data.caption) {
    await createText(card, {
      text: data.caption, x: S.padCard, y: opts.h - captionH, w: opts.w - S.padCard * 2,
      size: 22, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
    });
  }

  return card;
}

// ─── Single Slide Router ───
async function generateSingleSlide(data: any): Promise<FrameNode | null> {
  switch (data.type) {
    case 'splash': return await createSplash(data as SplashData);
    case 'icon-card-grid': return await createIconCardGridSlide(data as IconCardGridData);
    case 'stat-card-grid': return await createStatCardGridSlide(data as StatCardGridData);
    case 'compare-table': return await createCompareTableSlide(data as CompareTableData);
    case 'biz-model': return await createBizModelSlide(data as BizModelData);
    case 'problem': return await createProblemSlide(data as ProblemSlideData);
    case 'solution': return await createSolutionSlide(data as SolutionSlideData);
    case 'mixed-grid': return await createMixedGridSlide(data as MixedGridSlideData);
    case 'step-flow': return await createStepFlowSlide(data as StepFlowData);
    case 'custom': return await createCustomSlide(data as CustomSlideData);
    case 'data-table': return await createDataTableSlide(data as DataTableData);
    default:
      figma.notify('\u26A0\uFE0F Unsupported type: ' + data.type);
      return null;
  }
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════

figma.showUI(__html__, { width: 360, height: 520 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'error') {
    figma.notify('❌ ' + msg.message);
    return;
  }

  if (msg.type === 'generate') {
    try {
      await loadFonts();
      const data = msg.data;
      _emojiBytes = msg.emojiBytes || {};
      _imageBytes = msg.imageBytes || {};

      if (data.type === 'full-deck') {
        const slides: FrameNode[] = [];
        const deckName = data.name || 'Deck';
        for (let i = 0; i < data.slides.length; i++) {
          const s = data.slides[i];
          const frame = await generateSingleSlide(s);
          if (frame) {
            frame.name = `${deckName} — ${i + 1}`;
            frame.x = i * (CANVAS_W + 100);
            frame.y = 0;
            figma.currentPage.appendChild(frame);
            slides.push(frame);
          }
        }
        figma.viewport.scrollAndZoomIntoView(slides);
        figma.notify(`\u2705 ${slides.length} slides generated!`);
      } else {
        const slide = await generateSingleSlide(data);
        if (!slide) return;
        figma.currentPage.appendChild(slide);
        figma.viewport.scrollAndZoomIntoView([slide]);
        figma.notify('\u2705 Slide generated!');
      }
    } catch (err: any) {
      figma.notify('❌ Error: ' + err.message);
    }
  }
};
