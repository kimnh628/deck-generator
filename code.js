"use strict";
// Deck Generator — Figma Plugin
// design.md v2.3 tokens → Figma nodes
// ─── Color Tokens ───
function hex(h) {
    const r = parseInt(h.slice(1, 3), 16) / 255;
    const g = parseInt(h.slice(3, 5), 16) / 255;
    const b = parseInt(h.slice(5, 7), 16) / 255;
    return { r, g, b };
}
const C = {
    black: hex('#131313'),
    g800: hex('#2B292E'),
    g700: hex('#575757'),
    g600: hex('#666666'),
    g500: hex('#808080'),
    g400: hex('#C5C5C5'),
    g100: hex('#F7F7F7'),
    g50: hex('#F5F5F5'),
    accent: hex('#FF006A'),
    white: hex('#FFFFFF'),
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
// ─── Emoji image cache (set per generate call) ───
let _emojiBytes = {};
// ─── Font helpers ───
const FONT_PRETENDARD = { family: 'Pretendard', style: 'Medium' };
const FONT_INTER = { family: 'Inter', style: 'Medium' };
async function loadFonts() {
    const fonts = [
        { family: 'Pretendard', style: 'Medium' },
        { family: 'Pretendard', style: 'Bold' },
        { family: 'Pretendard', style: 'ExtraBold' },
        { family: 'Pretendard', style: 'SemiBold' },
        { family: 'Inter', style: 'Medium' },
        { family: 'Inter', style: 'Bold' },
        { family: 'Inter', style: 'ExtraBold' },
    ];
    for (const f of fonts) {
        try {
            await figma.loadFontAsync(f);
        }
        catch ( /* fallback handled below */_a) { /* fallback handled below */ }
    }
}
function fontName(weight) {
    const styleMap = {
        400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold'
    };
    return { family: 'Pretendard', style: styleMap[weight] || 'Medium' };
}
function solid(color) {
    return [{ type: 'SOLID', color }];
}
async function createText(parent, opts) {
    const t = figma.createText();
    t.fontName = fontName(opts.weight);
    t.fontSize = opts.size;
    t.lineHeight = { value: opts.size * opts.lh, unit: 'PIXELS' };
    t.letterSpacing = { value: opts.size * opts.ls, unit: 'PIXELS' };
    t.fills = solid(opts.color);
    t.characters = opts.text;
    t.x = opts.x;
    t.y = opts.y;
    if (opts.w) {
        t.resize(opts.w, t.height);
        t.textAutoResize = 'HEIGHT';
    }
    if (opts.align)
        t.textAlignHorizontal = opts.align;
    parent.appendChild(t);
    return t;
}
// ─── Slide Frame Factory ───
function createSlideFrame(name) {
    const frame = figma.createFrame();
    frame.name = name;
    frame.resize(CANVAS_W, CANVAS_H);
    frame.fills = solid(C.white);
    frame.clipsContent = true;
    return frame;
}
function createCard(parent, name, opts) {
    var _a;
    const card = figma.createFrame();
    card.name = name;
    card.x = opts.x;
    card.y = opts.y;
    card.resize(opts.w, opts.h);
    card.fills = solid(opts.bg || C.white);
    card.cornerRadius = (_a = opts.radius) !== null && _a !== void 0 ? _a : S.radiusCard;
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
function createCharacterPlaceholder(parent, label) {
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
async function createSplash(data) {
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
    }
    else {
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
async function createHeader(slide, eyebrow, headline, accentWord, headlineWidth) {
    await createText(slide, {
        text: eyebrow, x: 80, y: 46, w: 600,
        size: 32, weight: 600, lh: 1.45, ls: -0.02, color: C.black,
    });
    if (accentWord && headline.includes(accentWord)) {
        const before = headline.split(accentWord)[0];
        const after = headline.split(accentWord)[1] || '';
        const fullText = before + accentWord + after;
        const t = figma.createText();
        t.fontName = fontName(700);
        t.fontSize = 48;
        t.lineHeight = { value: 48 * 1.45, unit: 'PIXELS' };
        t.letterSpacing = { value: 48 * -0.02, unit: 'PIXELS' };
        t.characters = fullText;
        t.fills = solid(C.black);
        const start = before.length;
        const end = start + accentWord.length;
        t.setRangeFills(start, end, solid(C.accent));
        t.x = 80;
        t.y = 155;
        t.resize(headlineWidth || 1760, t.height);
        t.textAutoResize = 'HEIGHT';
        slide.appendChild(t);
    }
    else {
        await createText(slide, {
            text: headline, x: 80, y: 155, w: headlineWidth || 1760,
            size: 48, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
        });
    }
}
async function createIconCard(parent, data, opts) {
    const card = createCard(parent, `IconCard — ${data.title}`, Object.assign(Object.assign({}, opts), { shadow: true }));
    const emojiRect = figma.createRectangle();
    emojiRect.name = 'emoji';
    emojiRect.x = 50;
    emojiRect.y = 40;
    emojiRect.resize(48, 48);
    if (data.emoji && _emojiBytes[data.emoji]) {
        const img = figma.createImage(new Uint8Array(_emojiBytes[data.emoji]));
        emojiRect.fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: 'FIT' }];
    }
    else {
        emojiRect.fills = solid(C.g100);
        emojiRect.cornerRadius = 8;
    }
    card.appendChild(emojiRect);
    const titleY = 40 + 48 + S.gapXs;
    const titleNode = await createText(card, {
        text: data.title, x: 50, y: titleY, w: opts.w - 90,
        size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
    });
    const bodyY = titleY + titleNode.height + S.gapLg;
    await createText(card, {
        text: data.body, x: 50, y: bodyY, w: opts.w - 90,
        size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
    });
    return card;
}
async function createStatCard(parent, data, opts) {
    const card = createCard(parent, `StatCard — ${data.title}`, Object.assign(Object.assign({}, opts), { shadow: true }));
    const titleNode = await createText(card, {
        text: data.title, x: 40, y: 40, w: opts.w - 80,
        size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
    });
    const subY = 40 + titleNode.height;
    await createText(card, {
        text: data.sub, x: 40, y: subY, w: opts.w - 80,
        size: 24, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
    });
    const labelY = subY + 35 + S.gapLg;
    await createText(card, {
        text: data.label, x: 40, y: labelY, w: opts.w - 80,
        size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g700,
    });
    await createText(card, {
        text: data.stat, x: 40, y: labelY + 40, w: opts.w - 80,
        size: 58, weight: 700, lh: 1.45, ls: -0.02, color: C.accent,
    });
    return card;
}
// ─── DarkBanner ───
async function createDarkBanner(parent, text, accentPart, opts) {
    const banner = createCard(parent, 'DarkBanner', Object.assign(Object.assign({}, opts), { bg: C.g800, shadow: false }));
    const fullText = text;
    const t = figma.createText();
    t.fontName = fontName(700);
    t.fontSize = 36;
    t.lineHeight = { value: 36 * 1.45, unit: 'PIXELS' };
    t.letterSpacing = { value: 36 * -0.02, unit: 'PIXELS' };
    t.characters = fullText;
    t.fills = solid(C.white);
    t.textAlignHorizontal = 'CENTER';
    if (accentPart && fullText.includes(accentPart)) {
        const start = fullText.indexOf(accentPart);
        const end = start + accentPart.length;
        t.setRangeFills(start, end, solid(C.accent));
    }
    t.x = 60;
    t.y = (opts.h - 52) / 2;
    t.resize(opts.w - 120, t.height);
    t.textAutoResize = 'HEIGHT';
    banner.appendChild(t);
    return banner;
}
// ─── FooterBar (dark) ───
async function createFooterBar(parent, cells, opts) {
    const bar = createCard(parent, 'FooterBar', Object.assign(Object.assign({}, opts), { bg: C.g800, radius: S.radiusCard, shadow: false }));
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
async function createLightFooterRow(parent, blocks, y) {
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
async function createSectionTitle(parent, text, y) {
    await createText(parent, {
        text, x: S.margin, y, w: 1760,
        size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
    });
}
async function createCompareTableSlide(data) {
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
        labelRect.x = 0;
        labelRect.y = cy;
        labelRect.resize(labelW, rowH);
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
            cellRect.x = cx;
            cellRect.y = cy;
            cellRect.resize(dataW, rowH);
            if (isHeader && isWinner) {
                cellRect.fills = solid(C.g800);
            }
            else if (isHeader) {
                cellRect.fills = solid(C.g100);
            }
            else {
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
async function createIconCardGridSlide(data) {
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
async function createStatCardGridSlide(data) {
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
async function createBizModelSlide(data) {
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
async function createGrowthStatCard(parent, data, opts) {
    const card = createCard(parent, `GrowthStatCard — ${data.title}`, Object.assign(Object.assign({}, opts), { bg: C.g100, radius: S.radiusInner, shadow: false }));
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
    bar1.x = leftX;
    bar1.resize(barW, barAreaH * 0.35);
    bar1.y = barAreaY + barAreaH - bar1.height;
    bar1.fills = solid(C.black);
    bar1.topLeftRadius = S.radiusInner;
    bar1.topRightRadius = S.radiusInner;
    card.appendChild(bar1);
    const bar2 = figma.createRectangle();
    bar2.x = rightX;
    bar2.resize(barW, barAreaH * 0.85);
    bar2.y = barAreaY + barAreaH - bar2.height;
    bar2.fills = [{ type: 'GRADIENT_LINEAR', gradientStops: [
                { position: 0, color: Object.assign(Object.assign({}, C.accent), { a: 1 }) },
                { position: 1, color: Object.assign(Object.assign({}, C.accent), { a: 0.6 }) }
            ], gradientTransform: [[0, 1, 0], [-1, 0, 1]] }];
    bar2.topLeftRadius = S.radiusInner;
    bar2.topRightRadius = S.radiusInner;
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
async function createProblemSlide(data) {
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
async function createPersonCard(parent, data, opts) {
    const card = createCard(parent, `PersonCard — ${data.name}`, Object.assign(Object.assign({}, opts), { shadow: true }));
    const photoSize = Math.min(opts.h - 80, 215);
    const photo = figma.createEllipse();
    photo.name = 'Photo';
    photo.x = 40;
    photo.y = (opts.h - photoSize) / 2;
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
async function createBulletCard(parent, data, opts) {
    const card = createCard(parent, `BulletCard — ${data.title}`, Object.assign(Object.assign({}, opts), { shadow: true }));
    await createText(card, {
        text: data.title, x: S.padCard, y: S.padCard, w: opts.w - S.padCard * 2,
        size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
    });
    const bulletText = data.items.map(item => '•  ' + item).join('\n');
    const bulletLineH = 28 * 1.45;
    const bulletH = bulletLineH * data.items.length;
    const bulletY = opts.h - S.padCard - bulletH;
    await createText(card, {
        text: bulletText, x: S.padCard + 20, y: bulletY, w: opts.w - S.padCard * 2 - 20,
        size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
    });
    return card;
}
async function createSolutionSlide(data) {
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
async function createStatHeroCard(parent, data, opts) {
    const card = createCard(parent, `StatHeroCard — ${data.title}`, Object.assign(Object.assign({}, opts), { shadow: true }));
    const titleNode = await createText(card, {
        text: data.title, x: S.padCard, y: S.padCard, w: opts.w - S.padCard * 2,
        size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
    });
    const statY = S.padCard + titleNode.height + S.gapLg;
    await createText(card, {
        text: data.stat, x: S.padCard, y: statY, w: opts.w - S.padCard * 2,
        size: 58, weight: 700, lh: 1.45, ls: -0.02, color: C.accent,
    });
    await createText(card, {
        text: data.sub, x: S.padCard, y: statY + 84, w: opts.w - S.padCard * 2,
        size: 24, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
    });
    return card;
}
async function createLabeledListCard(parent, data, opts) {
    const card = createCard(parent, `LabeledListCard — ${data.title}`, Object.assign(Object.assign({}, opts), { shadow: true }));
    const titleNode = await createText(card, {
        text: data.title, x: S.padCard, y: S.padCard, w: opts.w - S.padCard * 2,
        size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
    });
    let groupY = S.padCard + titleNode.height + S.gapSm;
    for (const group of data.groups) {
        await createText(card, {
            text: group.label, x: S.padCard, y: groupY, w: opts.w - S.padCard * 2,
            size: 24, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
        });
        const itemNode = await createText(card, {
            text: group.items, x: S.padCard, y: groupY + 35, w: opts.w - S.padCard * 2,
            size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.black,
        });
        groupY += 35 + itemNode.height + S.gapSm;
    }
    return card;
}
async function createMixedGridSlide(data) {
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
        const cellOpts = {
            x: S.margin + col * (cardW + S.gapSm),
            y: contentTop + row * (cardH + S.gapSm),
            w: cardW, h: cardH,
        };
        const cell = data.cells[i];
        if (cell.kind === 'stat-hero') {
            await createStatHeroCard(slide, cell, cellOpts);
        }
        else if (cell.kind === 'labeled-list') {
            await createLabeledListCard(slide, cell, cellOpts);
        }
        else if (cell.kind === 'bullet') {
            await createBulletCard(slide, cell, cellOpts);
        }
    }
    return slide;
}
async function createStepFlowSlide(data) {
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
async function renderPrimitive(parent, p, opts) {
    switch (p.primitive) {
        case 'icon-card':
            await createIconCard(parent, { emoji: p.emoji, title: p.title, body: p.body }, opts);
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
        default:
            const fallback = createCard(parent, 'Unknown: ' + p.primitive, Object.assign(Object.assign({}, opts), { shadow: true }));
            await createText(fallback, {
                text: p.primitive + ': ' + (p.title || ''), x: S.padCard, y: S.padCard, w: opts.w - S.padCard * 2,
                size: 28, weight: 500, lh: 1.45, ls: -0.02, color: C.g500,
            });
    }
}
async function createCustomSlide(data) {
    const slide = createSlideFrame('Slide — Custom');
    const headlineW = data.lead ? (data.headlineWidth || 840) : 1760;
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
    const contentTop = 340;
    const contentBottom = CANVAS_H - S.margin;
    const totalRows = data.rows.length;
    const hasFooter = !!data.footer;
    let footerH = 0;
    if (hasFooter) {
        const fp = data.footer;
        if (fp.primitive === 'dark-banner')
            footerH = Math.floor((contentBottom - contentTop) * 0.25);
        else if (fp.primitive === 'footer-bar')
            footerH = 210;
        else if (fp.primitive === 'footer-card')
            footerH = Math.floor((contentBottom - contentTop) * 0.35);
        else
            footerH = 150;
    }
    const rowsH = contentBottom - contentTop - (hasFooter ? footerH + S.gapSm : 0);
    const gapTotal = S.gapSm * (totalRows - 1);
    const defaultRowH = (rowsH - gapTotal) / totalRows;
    let currentY = contentTop;
    for (const row of data.rows) {
        const rowH = row.height || defaultRowH;
        const cols = row.cards.length;
        const cardW = (1760 - S.gapSm * (cols - 1)) / cols;
        for (let c = 0; c < cols; c++) {
            const cardX = S.margin + c * (cardW + S.gapSm);
            await renderPrimitive(slide, row.cards[c], { x: cardX, y: currentY, w: cardW, h: rowH });
        }
        currentY += rowH + S.gapSm;
    }
    if (data.footer) {
        const fp = data.footer;
        const footerY = contentBottom - footerH;
        if (fp.primitive === 'dark-banner') {
            await createDarkBanner(slide, fp.text, fp.accentPart || '', {
                x: S.margin, y: footerY, w: 1760, h: footerH,
            });
        }
        else if (fp.primitive === 'footer-bar') {
            await createFooterBar(slide, fp.cells || [], {
                x: S.margin, y: footerY, w: 1760, h: footerH,
            });
        }
        else if (fp.primitive === 'footer-card') {
            const fc = createCard(slide, 'FooterCard', {
                x: S.margin, y: footerY, w: 1760, h: footerH, shadow: true,
            });
            if (fp.title) {
                await createText(fc, {
                    text: fp.title, x: S.padCard, y: S.padCard, w: 1760 - S.padCard * 2,
                    size: 36, weight: 700, lh: 1.45, ls: -0.02, color: C.black,
                });
            }
            if (fp.blocks) {
                const blockW = (1760 - S.padCard * 2) / fp.blocks.length;
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
// ─── Single Slide Router ───
async function generateSingleSlide(data) {
    switch (data.type) {
        case 'splash': return await createSplash(data);
        case 'icon-card-grid': return await createIconCardGridSlide(data);
        case 'stat-card-grid': return await createStatCardGridSlide(data);
        case 'compare-table': return await createCompareTableSlide(data);
        case 'biz-model': return await createBizModelSlide(data);
        case 'problem': return await createProblemSlide(data);
        case 'solution': return await createSolutionSlide(data);
        case 'mixed-grid': return await createMixedGridSlide(data);
        case 'step-flow': return await createStepFlowSlide(data);
        case 'custom': return await createCustomSlide(data);
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
            let slide;
            if (data.type === 'full-deck') {
                const slides = [];
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
            }
            else {
                const slide = await generateSingleSlide(data);
                if (!slide)
                    return;
                figma.currentPage.appendChild(slide);
                figma.viewport.scrollAndZoomIntoView([slide]);
                figma.notify('\u2705 Slide generated!');
            }
        }
        catch (err) {
            figma.notify('❌ Error: ' + err.message);
        }
    }
};
