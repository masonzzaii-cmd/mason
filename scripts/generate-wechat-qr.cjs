const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

async function generateWeChatQR() {
  // Generate QR code data matrix using qrcode package
  const qrText = 'https://u.wechat.com/MASON_DESIGN_STUDIO';
  
  const qr = QRCode.create(qrText, {
    errorCorrectionLevel: 'H',
  });

  const modules = qr.modules;
  const size = modules.size; // e.g., 37 or 33
  const padding = 3; // padding in modules
  const moduleSize = 10;
  const totalModules = size + padding * 2;
  const viewBoxSize = totalModules * moduleSize;

  let rects = [];

  // Generate modules
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!modules.get(r, c)) continue;

      // Skip finder pattern zones (7x7 plus 1 module border)
      const isTopLeftFinder = r < 8 && c < 8;
      const isTopRightFinder = r < 8 && c >= size - 8;
      const isBottomLeftFinder = c < 8 && r >= size - 8;
      
      // Skip center logo zone
      const centerStart = Math.floor(size / 2) - 4;
      const centerEnd = Math.floor(size / 2) + 4;
      const isCenterLogo = r >= centerStart && r <= centerEnd && c >= centerStart && c <= centerEnd;

      if (isTopLeftFinder || isTopRightFinder || isBottomLeftFinder || isCenterLogo) {
        continue;
      }

      const x = (c + padding) * moduleSize;
      const y = (r + padding) * moduleSize;
      rects.push(`<rect x="${x}" y="${y}" width="${moduleSize - 0.8}" height="${moduleSize - 0.8}" rx="2.5" fill="#000000"/>`);
    }
  }

  // Render Finder Patterns
  function renderFinder(col, row) {
    const x = (col + padding) * moduleSize;
    const y = (row + padding) * moduleSize;
    const w = 7 * moduleSize;
    
    return `
      <!-- Finder Outer Box -->
      <rect x="${x}" y="${y}" width="${w}" height="${w}" rx="${moduleSize * 1.8}" fill="#000000"/>
      <!-- Finder Inner White Gap -->
      <rect x="${x + moduleSize}" y="${y + moduleSize}" width="${w - 2 * moduleSize}" height="${w - 2 * moduleSize}" rx="${moduleSize * 1.2}" fill="#ffffff"/>
      <!-- Finder Center Eye -->
      <rect x="${x + 2 * moduleSize}" y="${y + 2 * moduleSize}" width="${w - 4 * moduleSize}" height="${w - 4 * moduleSize}" rx="${moduleSize * 0.8}" fill="#000000"/>
    `;
  }

  const topLeftFinder = renderFinder(0, 0);
  const topRightFinder = renderFinder(size - 7, 0);
  const bottomLeftFinder = renderFinder(0, size - 7);

  // Render Center WeChat Badge
  const centerCol = (size - 7) / 2 + padding;
  const badgeX = centerCol * moduleSize;
  const badgeY = centerCol * moduleSize;
  const badgeW = 7 * moduleSize;

  const centerBadge = `
    <!-- Center Black Badge Box -->
    <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeW}" rx="${moduleSize * 1.6}" fill="#000000"/>
    <!-- WeChat Icon SVG inside center badge -->
    <g transform="translate(${badgeX + badgeW * 0.12}, ${badgeY + badgeW * 0.15}) scale(${badgeW * 0.024})">
      <path fill="#ffffff" d="M 12 4 C 6.48 4 2 7.58 2 12 C 2 14.5 3.3 16.7 5.4 18.2 L 4.5 21 L 7.5 19.6 C 8.9 20.2 10.4 20.5 12 20.5 C 12.3 20.5 12.7 20.5 13 20.4 C 12.3 19.1 12 17.6 12 16 C 12 10.5 16.5 6 22 6 C 22.7 6 23.3 6.1 24 6.2 C 22.3 4.8 17.4 4 12 4 Z M 8.5 9.5 C 9.3 9.5 10 10.2 10 11 C 10 11.8 9.3 12.5 8.5 12.5 C 7.7 12.5 7 11.8 7 11 C 7 10.2 7.7 9.5 8.5 9.5 Z M 15.5 9.5 C 16.3 9.5 17 10.2 17 11 C 17 11.8 16.3 12.5 15.5 12.5 C 14.7 12.5 14 11.8 14 11 C 14 10.2 14.7 9.5 15.5 9.5 Z"/>
      <path fill="#ffffff" d="M 21 9 C 16.6 9 13 12.1 13 16 C 13 19.9 16.6 23 21 23 C 22.2 23 23.4 22.7 24.5 22.2 L 27 23.3 L 26.2 21 C 27.9 19.8 29 18 29 16 C 29 12.1 25.4 9 21 9 Z M 18.5 13.5 C 19.1 13.5 19.5 14 19.5 14.5 C 19.5 15 19.1 15.5 18.5 15.5 C 17.9 15.5 17.5 15 17.5 14.5 C 17.5 14 17.9 13.5 18.5 13.5 Z M 23.5 13.5 C 24.1 13.5 24.5 14 24.5 14.5 C 24.5 15 24.1 15.5 23.5 15.5 C 22.9 15.5 22.5 15 22.5 14.5 C 22.5 14 22.9 13.5 23.5 13.5 Z"/>
    </g>
  `;

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="100%" height="100%">
  <!-- Background Card -->
  <rect width="${viewBoxSize}" height="${viewBoxSize}" rx="${viewBoxSize * 0.06}" fill="#ffffff"/>

  <!-- Position Finders -->
  ${topLeftFinder}
  ${topRightFinder}
  ${bottomLeftFinder}

  <!-- Data Modules -->
  <g fill="#000000">
    ${rects.join('\n    ')}
  </g>

  <!-- Center WeChat Badge -->
  ${centerBadge}
</svg>`;

  fs.writeFileSync(path.join(__dirname, '../public/wechat-qr.svg'), svgContent, 'utf8');
  console.log('Successfully updated public/wechat-qr.svg');
}

generateWeChatQR().catch(console.error);
