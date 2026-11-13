import * as THREE from 'three';
import {
  BuildingCollider,
  LANDMARKS,
  ROAD_SEGMENTS,
  groundHeightAt,
} from './worldData';
import { ProceduralTexturePack } from './textures';
import {
  createAnimal,
  createCandiMajapahit,
  createCityBuilding,
  createJogloHouse,
  createPerahuNelayan,
  createPosRonda,
  createSPBU,
  createWarungKopi,
  createWitAsem,
} from './models';

export interface WorldBuildResult {
  colliders: BuildingCollider[];
  streetLampBulbs: THREE.MeshStandardMaterial[];
  waterfallMesh: THREE.Mesh;
  oceanMesh: THREE.Mesh;
  boats: THREE.Group[];
  lostGoat: THREE.Group;
  farmAnimals: Array<{ mesh: THREE.Group; baseX: number; baseZ: number; phase: number }>;
  missionPropFishCrate: THREE.Group;
}

export function buildJawaWorld(
  scene: THREE.Scene,
  textures: ProceduralTexturePack
): WorldBuildResult {
  const colliders: BuildingCollider[] = [];
  const streetLampBulbs: THREE.MeshStandardMaterial[] = [];
  const farmAnimals: Array<{ mesh: THREE.Group; baseX: number; baseZ: number; phase: number }> = [];
  const boats: THREE.Group[] = [];

  // 1. CONTINUOUS TERRAIN MESH (900x900m extending smoothly beyond playable 500x500m)
  const terrainSize = 860;
  const segs = 96;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segs, segs);
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = groundHeightAt(x, z);
    posAttr.setY(i, y);

    // Biome vertex tinting blended with grass texture
    if (z > 168 && x > 5) {
      // Coastal sand
      tmpColor.setHex(0xe8d09a);
    } else if (z < -95) {
      // Mountain forest & rock
      tmpColor.setHex(y > 14 ? 0x3b5e34 : 0x456b34);
    } else if (x >= 72 && x <= 198 && z >= -72 && z <= 68) {
      // City urban ground
      tmpColor.setHex(0x6c756d);
    } else if (x < -42 && x > -115 && z > -5 && z < 92) {
      // Sawah lush paddy zone
      tmpColor.setHex(0x65a30d);
    } else {
      tmpColor.setHex(0x528238);
    }
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    map: textures.grass,
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.02,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  // 2. WATER BODIES: Ocean South, Danau Ranu, Kali Brantas River
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    map: textures.water,
    roughness: 0.18,
    metalness: 0.25,
    envMapIntensity: 1.1,
    transparent: true,
    opacity: 0.88,
  });

  // Ocean Pantai Kidul
  const oceanGeo = new THREE.PlaneGeometry(900, 320, 12, 8);
  oceanGeo.rotateX(-Math.PI / 2);
  const oceanMesh = new THREE.Mesh(oceanGeo, waterMat);
  oceanMesh.position.set(80, -0.75, 340);
  scene.add(oceanMesh);

  // Danau Ranu (Southwest Volcanic Lake)
  const lakeGeo = new THREE.CircleGeometry(31, 24);
  lakeGeo.rotateX(-Math.PI / 2);
  const lakeMesh = new THREE.Mesh(lakeGeo, waterMat);
  lakeMesh.position.set(-95, -0.55, 202);
  scene.add(lakeMesh);

  // Kali Brantas Kecil River ribbon
  const riverMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    map: textures.water,
    roughness: 0.2,
    metalness: 0.15,
    transparent: true,
    opacity: 0.85,
  });
  const riverMesh = new THREE.Mesh(new THREE.PlaneGeometry(11, 138, 8, 24), riverMat);
  riverMesh.rotation.x = -Math.PI / 2;
  const rPos = riverMesh.geometry.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    const rz = rPos.getY(i); // local Y before rotateX becomes -Z
    rPos.setX(i, rPos.getX(i) + Math.sin(-rz * 0.05) * 6);
  }
  riverMesh.position.set(-78, -0.42, 42);
  scene.add(riverMesh);

  // Wooden Bridge over Kali Brantas at (-75, 52)
  const bridgeWoodMat = new THREE.MeshStandardMaterial({ map: textures.woodPlank, roughness: 0.8 });
  const bridge = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(17, 0.35, 6.2), bridgeWoodMat);
  deck.position.y = 0.55;
  deck.castShadow = true;
  deck.receiveShadow = true;
  const railF = new THREE.Mesh(new THREE.BoxGeometry(17, 0.8, 0.2), bridgeWoodMat);
  railF.position.set(0, 1.0, 2.9);
  const railB = railF.clone();
  railB.position.z = -2.9;
  bridge.add(deck, railF, railB);
  bridge.position.set(-76, 0, 52);
  scene.add(bridge);

  // 3. ROAD NETWORK (Sampled along terrain height so roads climb hills smoothly)
  const asphaltMat = new THREE.MeshStandardMaterial({
    map: textures.asphalt,
    roughness: 0.82,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const dirtRoadMat = new THREE.MeshStandardMaterial({
    map: textures.dirtRoad,
    roughness: 0.94,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  ROAD_SEGMENTS.forEach((seg) => {
    const dx = seg.x2 - seg.x1;
    const dz = seg.z2 - seg.z1;
    const length = Math.hypot(dx, dz);
    const steps = Math.max(4, Math.ceil(length / 8));
    const roadGeo = new THREE.PlaneGeometry(seg.width, length, 2, steps);
    roadGeo.rotateX(-Math.PI / 2);
    const angle = Math.atan2(dx, dz);
    const midX = (seg.x1 + seg.x2) / 2;
    const midZ = (seg.z1 + seg.z2) / 2;

    const rp = roadGeo.attributes.position;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    for (let i = 0; i < rp.count; i++) {
      const lx = rp.getX(i);
      const lz = rp.getZ(i);
      const wx = midX + lx * cosA + lz * sinA;
      const wz = midZ - lx * sinA + lz * cosA;
      const gy = groundHeightAt(wx, wz);
      rp.setY(i, gy + 0.08);
    }
    roadGeo.computeVertexNormals();
    const uvs = roadGeo.attributes.uv;
    for (let i = 0; i < uvs.count; i++) {
      uvs.setY(i, uvs.getY(i) * (length / 26));
    }

    const roadMesh = new THREE.Mesh(roadGeo, seg.paved ? asphaltMat : dirtRoadMat);
    roadMesh.position.set(midX, 0, midZ);
    roadMesh.rotation.y = angle;
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);
  });

  // 4. SAWAH (Terraced Green Rice Paddies in Desa West)
  const sawahMat = new THREE.MeshStandardMaterial({
    map: textures.sawah,
    roughness: 0.72,
    metalness: 0.06,
  });
  const bundMat = new THREE.MeshStandardMaterial({ color: 0x5c4028, roughness: 0.95 });
  [
    { x: -46, z: 24, w: 22, d: 28 },
    { x: -46, z: 58, w: 22, d: 28 },
    { x: -102, z: 24, w: 26, d: 34 },
    { x: -102, z: 66, w: 26, d: 34 },
  ].forEach((p) => {
    const gy = groundHeightAt(p.x, p.z);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(p.w, 0.16, p.d), sawahMat);
    pad.position.set(p.x, gy + 0.04, p.z);
    pad.receiveShadow = true;
    const border = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.8, 0.24, p.d + 0.8), bundMat);
    border.position.set(p.x, gy - 0.02, p.z);
    scene.add(border, pad);
  });

  // 5. DESA SUKAMAJU STRUCTURES
  const placeJoglo = (x: number, z: number, yaw: number, wallColor: number, scale = 1) => {
    const house = createJogloHouse(textures, wallColor, scale);
    house.position.set(x, groundHeightAt(x, z), z);
    house.rotation.y = yaw;
    scene.add(house);
    colliders.push({ x, z, halfW: 4.5 * scale, halfD: 3.8 * scale, height: 6 });
  };

  // Bagas's family house
  placeJoglo(-22, 8, Math.PI / 2, 0xfef3c7, 0.95);
  // Bu Siti's house
  placeJoglo(-24, 24, Math.PI / 2, 0xfde68a, 0.92);
  // Village neighbor houses
  placeJoglo(4, -22, -Math.PI / 2, 0xe7e5e4, 0.95);
  placeJoglo(-22, -24, Math.PI / 2, 0xfecdd3, 0.9);
  placeJoglo(12, 34, Math.PI, 0xd9f99d, 0.9);
  // Balai Desa & Pak Lurah's Pendopo
  placeJoglo(-52, -46, 0, 0xfef9c3, 1.32);

  // Wit Asem Gedhe (Big Tamarind Tree) near Pak Lurah's house
  const witAsem = createWitAsem(1.65);
  witAsem.position.set(-40, groundHeightAt(-40, -34), -34);
  scene.add(witAsem);
  colliders.push({ x: -40, z: -34, halfW: 1.4, halfD: 1.4, height: 8 });

  // Warung Kopi Mbah Darto
  const warung = createWarungKopi(textures);
  warung.position.set(18, groundHeightAt(18, 16), 16);
  warung.rotation.y = -Math.PI / 2;
  scene.add(warung);
  colliders.push({ x: 18, z: 16, halfW: 3.4, halfD: 3.6, height: 4.5 });

  // Pos Ronda Desa
  const posRonda = createPosRonda(textures);
  posRonda.position.set(-4, groundHeightAt(-4, -18), -18);
  scene.add(posRonda);
  colliders.push({ x: -4, z: -18, halfW: 1.8, halfD: 1.8, height: 4 });

  // Peternakan Pak Karjo (Wooden Fence + Sapi + Kambing)
  const fenceMat = new THREE.MeshStandardMaterial({ map: textures.woodPlank, roughness: 0.85 });
  const barnGroup = new THREE.Group();
  const barnRoof = new THREE.Mesh(
    new THREE.ConeGeometry(5.5, 1.8, 4),
    new THREE.MeshStandardMaterial({ map: textures.roofTile, roughness: 0.85 })
  );
  barnRoof.position.y = 3.2;
  barnRoof.rotation.y = Math.PI / 4;
  barnGroup.add(barnRoof);
  [
    [-3.2, -3.2],
    [3.2, -3.2],
    [-3.2, 3.2],
    [3.2, 3.2],
  ].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.6, 0.25), fenceMat);
    post.position.set(px, 1.3, pz);
    barnGroup.add(post);
  });
  barnGroup.position.set(-76, groundHeightAt(-76, 24), 24);
  scene.add(barnGroup);

  // Farm Cows & Goats
  const animalConfigs: Array<{ kind: 'sapi' | 'kambing'; x: number; z: number; white: boolean }> = [
    { kind: 'sapi', x: -75, z: 18, white: false },
    { kind: 'sapi', x: -79, z: 27, white: false },
    { kind: 'kambing', x: -67, z: 19, white: true },
    { kind: 'kambing', x: -69, z: 29, white: false },
  ];
  animalConfigs.forEach((a, idx) => {
    const mesh = createAnimal(a.kind, a.white);
    mesh.position.set(a.x, groundHeightAt(a.x, a.z), a.z);
    scene.add(mesh);
    farmAnimals.push({ mesh, baseX: a.x, baseZ: a.z, phase: idx * 1.4 });
  });

  // Lost Goat for Mission 2 at (-95, 74)
  const lostGoat = createAnimal('kambing', true);
  lostGoat.position.set(-95, groundHeightAt(-95, 74), 74);
  scene.add(lostGoat);

  // 6. KOTA MOJOSARI (Alun-Alun, Pasar, Pertokoan, SPBU, Sekolah, Polisi, RS, Terminal)
  // Alun-Alun Cobblestone Square
  const alunFloor = new THREE.Mesh(
    new THREE.BoxGeometry(36, 0.14, 36),
    new THREE.MeshStandardMaterial({ map: textures.cobblestone, roughness: 0.85 })
  );
  alunFloor.position.set(116, 0.05, -18);
  alunFloor.receiveShadow = true;
  scene.add(alunFloor);

  // Twin Pohon Beringin in Alun-Alun
  const beringin1 = createWitAsem(1.7);
  beringin1.position.set(110, 0, -18);
  const beringin2 = createWitAsem(1.7);
  beringin2.position.set(122, 0, -18);
  scene.add(beringin1, beringin2);
  colliders.push(
    { x: 110, z: -18, halfW: 1.5, halfD: 1.5, height: 8 },
    { x: 122, z: -18, halfW: 1.5, halfD: 1.5, height: 8 }
  );

  // SPBU Mojosari
  const spbu = createSPBU();
  spbu.position.set(76, 0, -28);
  spbu.rotation.y = Math.PI / 2;
  scene.add(spbu);
  colliders.push({ x: 76, z: -28, halfW: 4.5, halfD: 6.5, height: 5.5 });

  // Helper for city buildings
  const placeCityBldg = (
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: number,
    accent = 0xe2e8f0
  ) => {
    const b = createCityBuilding(w, h, d, color, accent);
    b.position.set(x, groundHeightAt(x, z), z);
    scene.add(b);
    colliders.push({ x, z, halfW: w * 0.5, halfD: d * 0.5, height: h });
  };

  // Sekolah Kota Mojosari
  placeCityBldg(118, -50, 18, 6.5, 9, 0xfef3c7, 0x991b1b);
  // Kantor Polisi
  placeCityBldg(96, -68, 13, 7.5, 10, 0x78716c, 0x1e293b);
  // Rumah Sakit (RSUD)
  placeCityBldg(166, -68, 20, 11, 12, 0xf8fafc, 0xdc2626);
  // Toko Klambi & Batik
  placeCityBldg(102, 26, 12, 6, 9, 0x92400e, 0xfde68a);
  // Bengkel & Showroom Mas Joko
  placeCityBldg(162, -16, 14, 5.5, 10, 0x1e3a8a, 0x38bdf8);
  // Pertokoan Ruko row
  placeCityBldg(124, 24, 12, 7.5, 9, 0x475569, 0xf59e0b);
  placeCityBldg(165, 22, 13, 8.5, 10, 0x334155, 0x10b981);
  // Terminal Bus Shelter
  placeCityBldg(175, 56, 18, 5, 10, 0x64748b, 0xfacc15);

  // Pasar Tradisional Stalls
  const tarpColors = [0xdc2626, 0x2563eb, 0x16a34a, 0xd97706];
  for (let i = 0; i < 4; i++) {
    const sx = 136 + (i % 2) * 14;
    const sz = 22 + Math.floor(i / 2) * 10;
    const stall = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.8, 4.5),
      new THREE.MeshStandardMaterial({ map: textures.woodPlank, roughness: 0.85 })
    );
    base.position.y = 0.4;
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(9, 0.14, 5.6),
      new THREE.MeshStandardMaterial({ color: tarpColors[i], roughness: 0.65 })
    );
    canopy.position.y = 2.9;
    stall.add(base, canopy);
    stall.position.set(sx, 0, sz);
    scene.add(stall);
    colliders.push({ x: sx, z: sz, halfW: 4.2, halfD: 2.5, height: 3 });
  }

  // 7. PEGUNUNGAN ARJUNO (Air Terjun + Cliff Rocks)
  const cliffMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.92 });
  const cliffX = -70;
  const cliffZ = -194;
  const cliffBaseY = groundHeightAt(cliffX, cliffZ);
  const cliff = new THREE.Mesh(new THREE.DodecahedronGeometry(14, 1), cliffMat);
  cliff.scale.set(1.4, 1.8, 0.9);
  cliff.position.set(cliffX, cliffBaseY + 10, cliffZ);
  cliff.castShadow = true;
  scene.add(cliff);

  const waterfallMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.25,
    roughness: 0.2,
    transparent: true,
    opacity: 0.85,
  });
  const waterfallMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 22, 4, 12), waterfallMat);
  waterfallMesh.position.set(cliffX, cliffBaseY + 9, cliffZ + 11.2);
  scene.add(waterfallMesh);

  const poolMesh = new THREE.Mesh(new THREE.CircleGeometry(10, 20), waterMat);
  poolMesh.rotation.x = -Math.PI / 2;
  poolMesh.position.set(cliffX, groundHeightAt(cliffX, -178) + 0.18, -178);
  scene.add(poolMesh);

  // 8. PESISIR PANTAI KIDUL (TPI, Warung Seafood, Dermaga, Perahu Nelayan, Fish Crate)
  const tpiBuilding = createCityBuilding(14, 4.5, 9, 0x0ea5e9, 0xfef08a);
  tpiBuilding.position.set(78, groundHeightAt(78, 168), 168);
  scene.add(tpiBuilding);
  colliders.push({ x: 78, z: 168, halfW: 7, halfD: 4.5, height: 4.5 });

  const seafoodWarung = createWarungKopi(textures);
  seafoodWarung.position.set(55, groundHeightAt(55, 152), 152);
  scene.add(seafoodWarung);
  colliders.push({ x: 55, z: 152, halfW: 3.5, halfD: 3.2, height: 4 });

  // Wooden Pier (Dermaga)
  const pier = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.4, 30), bridgeWoodMat);
  pier.position.set(108, 0.45, 195);
  pier.receiveShadow = true;
  scene.add(pier);

  // Moored Fishing Boats (Perahu Nelayan)
  [
    { x: 102, z: 204, yaw: 0.15 },
    { x: 115, z: 208, yaw: -0.25 },
    { x: 132, z: 215, yaw: 0.4 },
  ].forEach((bCfg) => {
    const boat = createPerahuNelayan();
    boat.position.set(bCfg.x, -0.5, bCfg.z);
    boat.rotation.y = bCfg.yaw;
    scene.add(boat);
    boats.push(boat);
  });

  // Mission 5 Fish Crate Prop on Pier
  const missionPropFishCrate = new THREE.Group();
  const crateBox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 0.8), bridgeWoodMat);
  crateBox.position.y = 0.375;
  const fishSilver = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.18, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.25 })
  );
  fishSilver.position.y = 0.78;
  missionPropFishCrate.add(crateBox, fishSilver);
  missionPropFishCrate.position.set(110, 0.65, 196);
  scene.add(missionPropFishCrate);

  // 9. TEMPAT WISATA (Candi Majapahit & Goa Alam)
  const candi = createCandiMajapahit(textures);
  candi.position.set(-140, groundHeightAt(-140, 145), 145);
  candi.rotation.y = 0.4;
  scene.add(candi);
  colliders.push({ x: -140, z: 145, halfW: 6.2, halfD: 6.2, height: 12 });

  // Goa Alam Rock Arch at (-165, 195)
  const goaGroup = new THREE.Group();
  const goaArch = new THREE.Mesh(new THREE.DodecahedronGeometry(8, 1), cliffMat);
  goaArch.scale.set(1.5, 1.1, 1.2);
  goaArch.position.y = 4.2;
  const goaMouth = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 4.2, 4),
    new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 1 })
  );
  goaMouth.position.set(0, 2.1, 4.2);
  goaGroup.add(goaArch, goaMouth);
  goaGroup.position.set(-158, groundHeightAt(-158, 196), 196);
  goaGroup.rotation.y = 0.6;
  scene.add(goaGroup);

  // 10. STREETLAMPS (Kota & Desa Main Road)
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.35 });
  const lampPositions: Array<[number, number]> = [
    [-12, 8],
    [35, 8],
    [82, 8],
    [118, 8],
    [152, 8],
    [94, -36],
    [152, -36],
    [94, 48],
    [152, 48],
    [82, 118],
  ];
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, 5.2, 8);
  const armGeo = new THREE.BoxGeometry(1.1, 0.1, 0.1);
  const bulbGeo = new THREE.SphereGeometry(0.22, 8, 8);

  lampPositions.forEach(([lx, lz]) => {
    const gy = groundHeightAt(lx, lz);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(lx, gy + 2.6, lz);
    pole.castShadow = true;
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(lx, gy + 5.1, lz - 0.45);
    arm.rotation.y = Math.PI / 2;
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.1,
    });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(lx, gy + 4.95, lz - 0.9);
    streetLampBulbs.push(bulbMat);
    scene.add(pole, arm, bulb);
  });

  // 11. INSTANCED FOLIAGE (Tropical Coconut Palms, Banyan/Teak Trees, Rocks)
  // Deterministic PRNG for consistent scenic layout
  let seed = 133742;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Helper to check if point is clear of roads & buildings
  const isClearSpot = (x: number, z: number, minPad = 9): boolean => {
    for (const c of colliders) {
      if (Math.abs(x - c.x) < c.halfW + minPad && Math.abs(z - c.z) < c.halfD + minPad) {
        return false;
      }
    }
    for (const lm of LANDMARKS) {
      if (Math.hypot(x - lm.x, z - lm.z) < minPad) return false;
    }
    // Keep Alun-alun & Sawah clear
    if (x > 96 && x < 138 && z > -40 && z < 4) return false;
    if (x > -118 && x < -32 && z > 6 && z < 90) return false;
    // Keep road corridors clear
    for (const r of ROAD_SEGMENTS) {
      const vx = r.x2 - r.x1;
      const vz = r.z2 - r.z1;
      const lenSq = vx * vx + vz * vz;
      const t = Math.max(0, Math.min(1, ((x - r.x1) * vx + (z - r.z1) * vz) / lenSq));
      const d = Math.hypot(x - (r.x1 + t * vx), z - (r.z1 + t * vz));
      if (d < r.width * 0.8 + 3.5) return false;
    }
    return true;
  };

  // A. Teak / Banyan Forest Trees (Instanced trunks + crowns)
  const treeSpots: Array<{ x: number; z: number; s: number }> = [];
  for (let i = 0; i < 420 && treeSpots.length < 220; i++) {
    const x = (rand() - 0.5) * 520;
    const z = (rand() - 0.5) * 440 - 30;
    if (z > 175) continue; // not in ocean
    if (Math.hypot(x - -95, z - 202) < 35) continue; // not in lake
    if (Math.abs(x - -78) < 12 && z > -25 && z < 115) continue; // not in river
    if (!isClearSpot(x, z, 6.5)) continue;
    treeSpots.push({ x, z, s: 0.85 + rand() * 0.45 });
  }

  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.48, 3.6, 7);
  trunkGeo.translate(0, 1.8, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a301d, roughness: 0.92 });
  const crownGeo = new THREE.DodecahedronGeometry(2.15, 1);
  crownGeo.translate(0, 4.6, 0);
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x2f6b24, roughness: 0.84 });

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeSpots.length);
  const crownInst = new THREE.InstancedMesh(crownGeo, crownMat, treeSpots.length);
  trunkInst.castShadow = false;
  crownInst.castShadow = true;
  crownInst.receiveShadow = false;

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  treeSpots.forEach((t, idx) => {
    const gy = groundHeightAt(t.x, t.z);
    dummy.position.set(t.x, gy, t.z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.setScalar(t.s);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, dummy.matrix);
    crownInst.setMatrixAt(idx, dummy.matrix);
    tint.setHSL(0.27 + (rand() - 0.5) * 0.05, 0.48, 0.28 + (rand() - 0.5) * 0.08);
    crownInst.setColorAt(idx, tint);
  });
  trunkInst.instanceMatrix.needsUpdate = true;
  crownInst.instanceMatrix.needsUpdate = true;
  if (crownInst.instanceColor) crownInst.instanceColor.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  crownInst.computeBoundingSphere();
  scene.add(trunkInst, crownInst);

  // B. Coconut Palms along Pesisir Beach & Desa
  const palmSpots: Array<{ x: number; z: number; s: number }> = [];
  for (let i = 0; i < 140 && palmSpots.length < 65; i++) {
    const x = 15 + rand() * 195;
    const z = 132 + rand() * 52;
    if (!isClearSpot(x, z, 5)) continue;
    palmSpots.push({ x, z, s: 0.9 + rand() * 0.35 });
  }
  const palmTrunkGeo = new THREE.CylinderGeometry(0.18, 0.32, 6.2, 6);
  palmTrunkGeo.translate(0, 3.1, 0);
  const palmHeadGeo = new THREE.ConeGeometry(2.4, 1.3, 6);
  palmHeadGeo.translate(0, 6.3, 0);
  const palmTrunkInst = new THREE.InstancedMesh(palmTrunkGeo, trunkMat, palmSpots.length);
  const palmHeadInst = new THREE.InstancedMesh(
    palmHeadGeo,
    new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.78 }),
    palmSpots.length
  );
  palmTrunkInst.castShadow = false;
  palmHeadInst.castShadow = true;

  palmSpots.forEach((p, idx) => {
    const gy = groundHeightAt(p.x, p.z);
    dummy.position.set(p.x, gy, p.z);
    dummy.rotation.set((rand() - 0.5) * 0.14, rand() * Math.PI * 2, (rand() - 0.5) * 0.14);
    dummy.scale.setScalar(p.s);
    dummy.updateMatrix();
    palmTrunkInst.setMatrixAt(idx, dummy.matrix);
    palmHeadInst.setMatrixAt(idx, dummy.matrix);
  });
  palmTrunkInst.instanceMatrix.needsUpdate = true;
  palmHeadInst.instanceMatrix.needsUpdate = true;
  palmTrunkInst.computeBoundingSphere();
  palmHeadInst.computeBoundingSphere();
  scene.add(palmTrunkInst, palmHeadInst);

  // C. Instanced Boulders & Mountain Rocks
  const rockGeo = new THREE.DodecahedronGeometry(1.1, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.92 });
  const rockCount = 90;
  const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  for (let i = 0; i < rockCount; i++) {
    const rx = (rand() - 0.5) * 460;
    const rz = -90 - rand() * 145;
    const ry = groundHeightAt(rx, rz);
    dummy.position.set(rx, ry + 0.3, rz);
    dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    dummy.scale.set(0.7 + rand() * 1.4, 0.6 + rand() * 1.0, 0.7 + rand() * 1.4);
    dummy.updateMatrix();
    rockInst.setMatrixAt(i, dummy.matrix);
  }
  rockInst.instanceMatrix.needsUpdate = true;
  rockInst.computeBoundingSphere();
  scene.add(rockInst);

  return {
    colliders,
    streetLampBulbs,
    waterfallMesh,
    oceanMesh,
    boats,
    lostGoat,
    farmAnimals,
    missionPropFishCrate,
  };
}
