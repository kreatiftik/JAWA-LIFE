import * as THREE from 'three';

function createCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export interface ProceduralTexturePack {
  asphalt: THREE.CanvasTexture;
  dirtRoad: THREE.CanvasTexture;
  grass: THREE.CanvasTexture;
  sawah: THREE.CanvasTexture;
  roofTile: THREE.CanvasTexture;
  woodPlank: THREE.CanvasTexture;
  batikWall: THREE.CanvasTexture;
  redBrick: THREE.CanvasTexture;
  sand: THREE.CanvasTexture;
  cobblestone: THREE.CanvasTexture;
  water: THREE.CanvasTexture;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTexturePack {
  const aniso = Math.min(8, Math.max(1, maxAnisotropy));

  // 1. Asphalt Road Texture (with subtle aggregate & dashed center line)
  const [asphC, asphCtx] = createCanvas(256);
  asphCtx.fillStyle = '#2c3034';
  asphCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) {
    const v = 35 + Math.floor(Math.random() * 28);
    asphCtx.fillStyle = `rgb(${v},${v + 2},${v + 4})`;
    asphCtx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  asphCtx.fillStyle = '#eab308';
  asphCtx.fillRect(124, 10, 8, 95);
  asphCtx.fillRect(124, 145, 8, 95);
  asphCtx.fillStyle = '#d1d5db';
  asphCtx.fillRect(10, 0, 5, 256);
  asphCtx.fillRect(241, 0, 5, 256);
  const asphalt = finalizeColorTexture(asphC, aniso, 1, 8);

  // 2. Village Dirt/Gravel Road
  const [dirtC, dirtCtx] = createCanvas(256);
  dirtCtx.fillStyle = '#8b6f4e';
  dirtCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const r = 115 + Math.floor(Math.random() * 45);
    const g = 88 + Math.floor(Math.random() * 35);
    const b = 56 + Math.floor(Math.random() * 28);
    dirtCtx.fillStyle = `rgb(${r},${g},${b})`;
    dirtCtx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }
  const dirtRoad = finalizeColorTexture(dirtC, aniso, 1, 8);

  // 3. Tropical Grass Texture
  const [grassC, grassCtx] = createCanvas(256);
  grassCtx.fillStyle = '#3f6e2d';
  grassCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) {
    const g = 88 + Math.floor(Math.random() * 52);
    grassCtx.fillStyle = `rgb(${48 + Math.floor(Math.random() * 30)},${g},${32 + Math.floor(Math.random() * 20)})`;
    grassCtx.fillRect(Math.random() * 256, Math.random() * 256, 3, 2);
  }
  const grass = finalizeColorTexture(grassC, aniso, 24, 24);

  // 4. Sawah Rice Paddy Texture
  const [sawahC, sawahCtx] = createCanvas(256);
  sawahCtx.fillStyle = '#4d7c0f';
  sawahCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) {
    sawahCtx.fillStyle = '#365314';
    sawahCtx.fillRect(0, y, 256, 3);
    sawahCtx.fillStyle = '#84cc16';
    for (let x = 0; x < 256; x += 8) {
      sawahCtx.fillRect(x + (y % 32 === 0 ? 0 : 4), y + 4, 3, 9);
    }
  }
  const sawah = finalizeColorTexture(sawahC, aniso, 6, 6);

  // 5. Javanese Terracotta Roof Tiles (Genteng Sokka)
  const [roofC, roofCtx] = createCanvas(256);
  roofCtx.fillStyle = '#9a3412';
  roofCtx.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 16; row++) {
    const y = row * 16;
    roofCtx.fillStyle = row % 2 === 0 ? '#7c2d12' : '#8c3214';
    roofCtx.fillRect(0, y, 256, 15);
    roofCtx.fillStyle = '#431407';
    roofCtx.fillRect(0, y + 14, 256, 2);
    for (let col = 0; col < 16; col++) {
      const x = col * 16 + (row % 2) * 8;
      roofCtx.fillStyle = 'rgba(255,210,170,0.12)';
      roofCtx.fillRect(x, y + 2, 10, 8);
    }
  }
  const roofTile = finalizeColorTexture(roofC, aniso, 3, 3);

  // 6. Teak Wood Planks (Kayu Jati)
  const [woodC, woodCtx] = createCanvas(256);
  woodCtx.fillStyle = '#5c3a21';
  woodCtx.fillRect(0, 0, 256, 256);
  for (let p = 0; p < 8; p++) {
    const y = p * 32;
    woodCtx.fillStyle = p % 2 === 0 ? '#654126' : '#53331c';
    woodCtx.fillRect(0, y, 256, 30);
    woodCtx.fillStyle = '#331d0d';
    woodCtx.fillRect(0, y + 30, 256, 2);
    for (let g = 0; g < 18; g++) {
      woodCtx.fillStyle = 'rgba(25,12,4,0.18)';
      woodCtx.fillRect(0, y + Math.random() * 28, 256, 1);
    }
  }
  const woodPlank = finalizeColorTexture(woodC, aniso, 2, 2);

  // 7. Batik / Javanese Wall Accent
  const [batikC, batikCtx] = createCanvas(256);
  batikCtx.fillStyle = '#fef3c7';
  batikCtx.fillRect(0, 0, 256, 256);
  batikCtx.strokeStyle = '#78350f';
  batikCtx.lineWidth = 3;
  for (let i = -256; i < 512; i += 32) {
    batikCtx.beginPath();
    batikCtx.moveTo(i, 0);
    batikCtx.lineTo(i + 256, 256);
    batikCtx.stroke();
    batikCtx.beginPath();
    batikCtx.arc(i + 128, 128, 10, 0, Math.PI * 2);
    batikCtx.stroke();
  }
  const batikWall = finalizeColorTexture(batikC, aniso, 2, 2);

  // 8. Majapahit Red Brick (Bata Merah Candi)
  const [brickC, brickCtx] = createCanvas(256);
  brickCtx.fillStyle = '#7f1d1d';
  brickCtx.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 12; row++) {
    const y = row * 21;
    for (let col = 0; col < 6; col++) {
      const x = col * 44 + (row % 2) * 22 - 12;
      const shade = 125 + Math.floor(Math.random() * 35);
      brickCtx.fillStyle = `rgb(${shade}, 46, 36)`;
      brickCtx.fillRect(x, y, 41, 18);
    }
  }
  const redBrick = finalizeColorTexture(brickC, aniso, 3, 3);

  // 9. Beach Sand
  const [sandC, sandCtx] = createCanvas(256);
  sandCtx.fillStyle = '#e6cc9a';
  sandCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    const s = 205 + Math.floor(Math.random() * 38);
    sandCtx.fillStyle = `rgb(${s},${s - 18},${s - 55})`;
    sandCtx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const sand = finalizeColorTexture(sandC, aniso, 12, 12);

  // 10. Cobblestone Alun-Alun
  const [cobC, cobCtx] = createCanvas(256);
  cobCtx.fillStyle = '#64748b';
  cobCtx.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const v = 110 + Math.floor(Math.random() * 30);
      cobCtx.fillStyle = `rgb(${v},${v + 4},${v + 10})`;
      cobCtx.fillRect(c * 32 + 2, r * 32 + 2, 28, 28);
    }
  }
  const cobblestone = finalizeColorTexture(cobC, aniso, 10, 10);

  // 11. Water Ripples
  const [watC, watCtx] = createCanvas(256);
  watCtx.fillStyle = '#0284c7';
  watCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 220; i++) {
    watCtx.fillStyle = 'rgba(186, 230, 253, 0.16)';
    watCtx.fillRect(Math.random() * 256, Math.random() * 256, 26, 3);
  }
  const water = finalizeColorTexture(watC, aniso, 14, 14);

  return {
    asphalt,
    dirtRoad,
    grass,
    sawah,
    roofTile,
    woodPlank,
    batikWall,
    redBrick,
    sand,
    cobblestone,
    water,
  };
}
