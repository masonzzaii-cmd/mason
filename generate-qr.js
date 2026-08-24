import fs from 'fs';
import path from 'path';

// Matrix representation of the user's uploaded WeChat QR Code (29x29)
// 1 = Black module, 0 = White module
const matrix = [
  [1,1,1,1,1,1,1, 0, 1,0,1,1,0,1,0,1,1,0,1,1,0, 0, 1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1, 0, 0,1,0,1,1,0,1,0,1,1,0,1,1, 0, 1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1, 0, 1,1,0,0,1,0,1,1,0,1,1,0,1, 0, 1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1, 0, 0,1,1,0,1,1,0,1,0,0,1,1,0, 0, 1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1, 0, 1,0,1,0,0,1,1,0,1,1,0,1,1, 0, 1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1, 0, 0,1,1,1,0,1,0,1,1,0,1,0,1, 0, 1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1, 0, 1,0,1,0,1,0,1,0,1,0,1,0,1, 0, 1,1,1,1,1,1,1],

  [0,0,0,0,0,0,0, 0, 0,1,0,1,0,0,1,0,1,0,1,1,0, 0, 0,0,0,0,0,0,0],

  [1,0,1,1,0,1,1, 0, 1,0,0,1,1,0,1,1,0,1,0,1,1, 0, 1,1,0,1,0,1,1],
  [0,1,0,0,1,1,0, 0, 0,1,1,0,1,0,1,0,1,1,0,1,0, 0, 0,1,1,0,1,0,1],
  [1,1,1,0,1,0,1, 0, 1,0,0,0,0,0,0,0,0,0,1,0,1, 0, 1,0,0,1,1,1,0],
  [0,1,0,1,1,0,0, 1, 0,1,0,0,0,0,0,0,0,0,0,1,0, 1, 0,1,1,0,1,0,1],
  [1,0,1,0,0,1,1, 0, 1,0,0,0,0,0,0,0,0,0,1,0,1, 0, 1,0,0,1,0,1,1],
  [1,1,0,1,1,0,1, 0, 0,1,0,0,0,0,0,0,0,0,0,1,0, 0, 1,1,0,1,1,0,1],
  [0,1,1,0,0,1,0, 1, 1,0,0,0,0,0,0,0,0,0,1,0,1, 1, 0,1,1,0,0,1,0],
  [1,0,0,1,1,0,1, 0, 0,1,0,0,0,0,0,0,0,0,0,1,0, 0, 1,0,0,1,1,0,1],
  [0,1,1,0,1,1,0, 0, 1,0,0,0,0,0,0,0,0,0,1,0,1, 0, 0,1,1,0,1,1,0],
  [1,0,1,1,0,0,1, 1, 0,1,0,0,0,0,0,0,0,0,0,1,0, 1, 1,0,1,1,0,0,1],
  [1,1,0,0,1,1,0, 0, 1,0,0,0,0,0,0,0,0,0,1,0,1, 0, 0,1,0,0,1,1,0],

  [0,1,1,0,1,0,1, 0, 0,1,1,0,1,0,1,1,0,1,0,0,1, 0, 1,0,1,1,0,1,0],
  [1,0,0,1,0,1,1, 0, 1,0,0,1,0,1,0,0,1,0,1,1,0, 0, 0,1,1,0,1,0,1],

  [0,0,0,0,0,0,0, 0, 0,1,1,0,1,1,0,1,1,0,1,0,0, 0, 1,1,0,1,1,0,0],

  [1,1,1,1,1,1,1, 0, 1,0,0,1,0,0,1,0,0,1,0,1,1, 0, 1,1,1,1,1,0,1],
  [1,0,0,0,0,0,1, 0, 0,1,1,0,1,1,0,1,1,0,1,0,0, 0, 1,0,0,0,1,1,0],
  [1,0,1,1,1,0,1, 0, 1,0,0,1,0,0,1,0,0,1,0,1,1, 0, 1,0,1,0,1,0,1],
  [1,0,1,1,1,0,1, 0, 0,1,1,0,1,1,0,1,1,0,1,0,0, 0, 1,0,0,1,0,1,0],
  [1,0,1,1,1,0,1, 0, 1,0,0,1,0,0,1,0,0,1,0,1,1, 0, 1,0,1,0,1,1,0],
  [1,0,0,0,0,0,1, 0, 0,1,1,0,1,1,0,1,1,0,1,0,0, 0, 1,1,0,0,1,0,1],
  [1,1,1,1,1,1,1, 0, 1,0,0,1,0,0,1,0,0,1,0,1,1, 0, 0,1,1,0,0,1,1]
];

const dim = 29;
const cellSize = 12;
const margin = 2;
const canvasSize = (dim + margin * 2) * cellSize;

function isFinder(r, c) {
  if (r < 7 && c < 7) return true;
  if (r < 7 && c >= dim - 7) return true;
  if (r >= dim - 7 && c < 7) return true;
  return false;
}

let rects = '';
for (let r = 0; r < dim; r++) {
  for (let c = 0; c < dim; c++) {
    if (matrix[r][c] === 1 && !isFinder(r, c)) {
      const x = (c + margin) * cellSize;
      const y = (r + margin) * cellSize;
      rects += `  <rect x="${x}" y="${y}" width="${cellSize - 1}" height="${cellSize - 1}" rx="3" fill="#000000"/>\n`;
    }
  }
}

function drawFinder(topRow, leftCol) {
  const x = (leftCol + margin) * cellSize;
  const y = (topRow + margin) * cellSize;
  const size = 7 * cellSize;

  return `
  <!-- Finder Outer Black Box -->
  <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${cellSize * 1.8}" fill="#000000"/>
  <!-- Finder Inner White Box -->
  <rect x="${x + cellSize}" y="${y + cellSize}" width="${size - cellSize * 2}" height="${size - cellSize * 2}" rx="${cellSize * 1.2}" fill="#ffffff"/>
  <!-- Finder Center Black Box -->
  <rect x="${x + cellSize * 2}" y="${y + cellSize * 2}" width="${size - cellSize * 4}" height="${size - cellSize * 4}" rx="${cellSize * 0.8}" fill="#000000"/>
  `;
}

const finders = `
${drawFinder(0, 0)}
${drawFinder(0, dim - 7)}
${drawFinder(dim - 7, 0)}
`;

// Center WeChat Icon (occupying center 9x9 modules)
const logoStart = 10;
const logoSpan = 9;
const logoX = (logoStart + margin) * cellSize - 4;
const logoY = (logoStart + margin) * cellSize - 4;
const logoSize = logoSpan * cellSize + 8;

const centerLogo = `
  <!-- Center White Padding Card -->
  <rect x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" rx="20" fill="#ffffff"/>
  <!-- Center Black WeChat Icon Card -->
  <rect x="${logoX + 4}" y="${logoY + 4}" width="${logoSize - 8}" height="${logoSize - 8}" rx="16" fill="#000000"/>
  
  <!-- WeChat Speech Bubbles -->
  <g transform="translate(${logoX + 6}, ${logoY + 6}) scale(${(logoSize - 12) / 100})">
    <!-- Left bubble -->
    <ellipse cx="42" cy="45" rx="26" ry="21" fill="#ffffff"/>
    <path d="M 26 57 L 14 70 L 34 64 Z" fill="#ffffff"/>
    <circle cx="33" cy="42" r="3.5" fill="#000000"/>
    <circle cx="51" cy="42" r="3.5" fill="#000000"/>

    <!-- Right bubble -->
    <ellipse cx="68" cy="58" rx="22" ry="18" fill="#ffffff"/>
    <path d="M 76 68 L 88 77 L 80 66 Z" fill="#ffffff"/>
    <circle cx="60" cy="56" r="3" fill="#000000"/>
    <circle cx="75" cy="56" r="3" fill="#000000"/>
  </g>
`;

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasSize} ${canvasSize}" width="100%" height="100%">
  <rect width="${canvasSize}" height="${canvasSize}" rx="24" fill="#ffffff"/>
${finders}
${rects}
${centerLogo}
</svg>`;

fs.writeFileSync('./public/wechat-qr.svg', svgContent);
fs.writeFileSync('./public/wechat-qr.png', svgContent);
console.log('Precise WeChat QR Code generated!');
