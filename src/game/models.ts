import * as THREE from 'three';
import { OutfitId, VehicleType } from './types';
import { ProceduralTexturePack } from './textures';

export interface CharacterRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  torso: THREE.Mesh;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftElbow: THREE.Group;
  rightElbow: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftKnee: THREE.Group;
  rightKnee: THREE.Group;
}

export interface VehicleModelResult {
  group: THREE.Group;
  wheels: THREE.Object3D[];
  headlights: THREE.Mesh[];
  seatY: number;
  seatZ: number;
  isOpenRide: boolean;
  halfW: number;
  halfL: number;
}

const OUTFIT_COLORS: Record<OutfitId, { shirt: number; collar: number; pants: number; metalness: number }> = {
  kasual: { shirt: 0x1e40af, collar: 0xe2e8f0, pants: 0x1e293b, metalness: 0.05 },
  batik: { shirt: 0x92400e, collar: 0xfef3c7, pants: 0x1c1917, metalness: 0.08 },
  jaket_motor: { shirt: 0x15803d, collar: 0x111827, pants: 0x0f172a, metalness: 0.15 },
  lurik: { shirt: 0x44403c, collar: 0xd97706, pants: 0x292524, metalness: 0.1 },
};

// Shared smooth sculpted geometries (reused across all 16+ characters for fast GPU instancing/caching)
const CHAR_GEOS = (() => {
  const torsoPts = [
    new THREE.Vector2(0.01, 0.0),
    new THREE.Vector2(0.155, 0.02),
    new THREE.Vector2(0.148, 0.14),
    new THREE.Vector2(0.172, 0.34),
    new THREE.Vector2(0.195, 0.50),
    new THREE.Vector2(0.155, 0.59),
    new THREE.Vector2(0.072, 0.62),
    new THREE.Vector2(0.0, 0.62),
  ];
  const torso = new THREE.LatheGeometry(torsoPts, 16);
  torso.scale(1.18, 1.0, 0.72);
  torso.computeVertexNormals();

  return {
    torso,
    pelvis: new THREE.SphereGeometry(0.165, 12, 10),
    collar: new THREE.TorusGeometry(0.088, 0.024, 8, 14),
    hipSphere: new THREE.SphereGeometry(0.088, 10, 8),
    thigh: new THREE.CylinderGeometry(0.086, 0.068, 0.34, 12),
    kneeCap: new THREE.SphereGeometry(0.068, 10, 8),
    calf: new THREE.CylinderGeometry(0.066, 0.05, 0.34, 12),
    shoeUpper: new THREE.CapsuleGeometry(0.054, 0.12, 4, 8),
    shoeSole: new THREE.CapsuleGeometry(0.056, 0.125, 4, 8),
    shoulderCap: new THREE.SphereGeometry(0.068, 10, 8),
    sleeve: new THREE.CylinderGeometry(0.064, 0.054, 0.22, 12),
    elbowJoint: new THREE.SphereGeometry(0.048, 8, 8),
    forearm: new THREE.CylinderGeometry(0.048, 0.036, 0.23, 12),
    hand: new THREE.SphereGeometry(0.042, 8, 8),
    neck: new THREE.CylinderGeometry(0.056, 0.068, 0.13, 10),
    cranium: new THREE.SphereGeometry(0.142, 16, 14),
    jaw: new THREE.SphereGeometry(0.095, 12, 10),
    ear: new THREE.SphereGeometry(0.032, 8, 6),
    nose: new THREE.CapsuleGeometry(0.015, 0.032, 4, 6),
    eyeSclera: new THREE.SphereGeometry(0.022, 8, 8),
    eyeIris: new THREE.SphereGeometry(0.013, 8, 6),
    brow: new THREE.CapsuleGeometry(0.008, 0.034, 3, 6),
    hairCap: new THREE.SphereGeometry(0.148, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairBack: new THREE.SphereGeometry(0.138, 12, 10),
    hairFringe: new THREE.CapsuleGeometry(0.038, 0.12, 4, 8),
    caping: new THREE.ConeGeometry(0.34, 0.19, 18),
    peci: new THREE.CylinderGeometry(0.138, 0.148, 0.11, 16),
    policeCap: new THREE.CylinderGeometry(0.165, 0.148, 0.1, 16),
    policeBrim: new THREE.CylinderGeometry(0.15, 0.15, 0.018, 14, 1, false, -Math.PI * 0.4, Math.PI * 0.8),
  };
})();

const SHARED_CHAR_MATS = {
  shoe: new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.42, metalness: 0.12 }),
  sole: new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.7 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x171412, roughness: 0.85, metalness: 0.04 }),
  sclera: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }),
  iris: new THREE.MeshStandardMaterial({ color: 0x171412, roughness: 0.2 }),
  caping: new THREE.MeshStandardMaterial({ color: 0xc29b61, roughness: 0.85 }),
  peci: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.88 }),
  policeCap: new THREE.MeshStandardMaterial({ color: 0x3f2e1d, roughness: 0.6 }),
  policeBrim: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.25 }),
};

export function createCharacterRig(options: {
  shirtColor?: number;
  pantsColor?: number;
  skinColor?: number;
  hatType?: 'caping' | 'peci' | 'polisi' | 'none';
  outfit?: OutfitId;
  textures?: ProceduralTexturePack;
}): CharacterRig {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  const skinMat = new THREE.MeshStandardMaterial({
    color: options.skinColor ?? 0xd19a72,
    roughness: 0.62,
    metalness: 0.02,
  });

  const outfitCfg = options.outfit ? OUTFIT_COLORS[options.outfit] : null;
  const shirtColor = outfitCfg ? outfitCfg.shirt : (options.shirtColor ?? 0x2563eb);
  const pantsColor = outfitCfg ? outfitCfg.pants : (options.pantsColor ?? 0x1e293b);

  const shirtMat = new THREE.MeshStandardMaterial({
    color: shirtColor,
    roughness: 0.74,
    metalness: outfitCfg?.metalness ?? 0.05,
    map: options.outfit === 'batik' && options.textures ? options.textures.batikWall : null,
  });

  const collarMat = new THREE.MeshStandardMaterial({
    color: outfitCfg ? outfitCfg.collar : 0xe5e7eb,
    roughness: 0.6,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: pantsColor,
    roughness: 0.82,
    metalness: 0.03,
  });

  // Articulated smooth Legs (pivoted at hip y = 0.78)
  const makeLeg = (xOff: number) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(xOff, 0.78, 0);

    const hipSphere = new THREE.Mesh(CHAR_GEOS.hipSphere, pantsMat);
    legPivot.add(hipSphere);

    const thigh = new THREE.Mesh(CHAR_GEOS.thigh, pantsMat);
    thigh.position.y = -0.17;
    legPivot.add(thigh);

    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.35, 0);
    legPivot.add(kneePivot);

    const kneeCap = new THREE.Mesh(CHAR_GEOS.kneeCap, pantsMat);
    kneePivot.add(kneeCap);

    const calf = new THREE.Mesh(CHAR_GEOS.calf, pantsMat);
    calf.position.y = -0.18;
    kneePivot.add(calf);

    const shoeUpper = new THREE.Mesh(CHAR_GEOS.shoeUpper, SHARED_CHAR_MATS.shoe);
    shoeUpper.rotation.x = Math.PI / 2;
    shoeUpper.position.set(0, -0.37, 0.048);
    shoeUpper.scale.set(1.02, 1.0, 0.78);

    const shoeSole = new THREE.Mesh(CHAR_GEOS.shoeSole, SHARED_CHAR_MATS.sole);
    shoeSole.rotation.x = Math.PI / 2;
    shoeSole.position.set(0, -0.405, 0.048);
    shoeSole.scale.set(1.04, 1.0, 0.32);

    kneePivot.add(shoeUpper, shoeSole);

    return { legPivot, kneePivot };
  };

  const leftLegBuilt = makeLeg(-0.115);
  const rightLegBuilt = makeLeg(0.115);
  const leftLeg = leftLegBuilt.legPivot;
  const rightLeg = rightLegBuilt.legPivot;
  const leftKnee = leftLegBuilt.kneePivot;
  const rightKnee = rightLegBuilt.kneePivot;
  bodyGroup.add(leftLeg, rightLeg);

  const pelvis = new THREE.Mesh(CHAR_GEOS.pelvis, pantsMat);
  pelvis.position.y = 0.79;
  pelvis.scale.set(1.22, 0.65, 0.84);
  bodyGroup.add(pelvis);

  const torso = new THREE.Mesh(CHAR_GEOS.torso, shirtMat);
  torso.position.y = 0.79;
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyGroup.add(torso);

  const collar = new THREE.Mesh(CHAR_GEOS.collar, collarMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 1.4, 0.01);
  collar.scale.set(1.08, 0.92, 1);
  bodyGroup.add(collar);

  const makeArm = (xOff: number) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(xOff, 1.32, 0);

    const shoulderCap = new THREE.Mesh(CHAR_GEOS.shoulderCap, shirtMat);
    armPivot.add(shoulderCap);

    const sleeve = new THREE.Mesh(CHAR_GEOS.sleeve, shirtMat);
    sleeve.position.y = -0.11;
    armPivot.add(sleeve);

    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(0, -0.23, 0);
    armPivot.add(elbowPivot);

    const elbowJoint = new THREE.Mesh(CHAR_GEOS.elbowJoint, skinMat);
    elbowPivot.add(elbowJoint);

    const forearm = new THREE.Mesh(CHAR_GEOS.forearm, skinMat);
    forearm.position.y = -0.12;
    elbowPivot.add(forearm);

    const hand = new THREE.Mesh(CHAR_GEOS.hand, skinMat);
    hand.position.set(0, -0.25, 0.008);
    hand.scale.set(0.85, 1.15, 0.72);
    elbowPivot.add(hand);

    return { armPivot, elbowPivot };
  };

  const leftArmBuilt = makeArm(-0.245);
  const rightArmBuilt = makeArm(0.245);
  const leftArm = leftArmBuilt.armPivot;
  const rightArm = rightArmBuilt.armPivot;
  const leftElbow = leftArmBuilt.elbowPivot;
  const rightElbow = rightArmBuilt.elbowPivot;
  bodyGroup.add(leftArm, rightArm);

  const head = new THREE.Group();
  head.position.set(0, 1.42, 0);

  const neck = new THREE.Mesh(CHAR_GEOS.neck, skinMat);
  neck.position.y = 0.04;
  head.add(neck);

  const cranium = new THREE.Mesh(CHAR_GEOS.cranium, skinMat);
  cranium.position.y = 0.21;
  cranium.scale.set(0.95, 1.08, 1.02);
  cranium.castShadow = true;
  head.add(cranium);

  const jaw = new THREE.Mesh(CHAR_GEOS.jaw, skinMat);
  jaw.position.set(0, 0.14, 0.03);
  jaw.scale.set(0.94, 0.85, 0.96);
  head.add(jaw);

  const earL = new THREE.Mesh(CHAR_GEOS.ear, skinMat);
  earL.position.set(-0.134, 0.2, -0.005);
  earL.scale.set(0.45, 1.15, 0.75);
  const earR = earL.clone();
  earR.position.x = 0.134;
  head.add(earL, earR);

  const nose = new THREE.Mesh(CHAR_GEOS.nose, skinMat);
  nose.position.set(0, 0.195, 0.145);
  nose.rotation.x = -0.25;
  head.add(nose);

  [-0.05, 0.05].forEach((ex) => {
    const sclera = new THREE.Mesh(CHAR_GEOS.eyeSclera, SHARED_CHAR_MATS.sclera);
    sclera.position.set(ex, 0.225, 0.125);
    sclera.scale.set(1.05, 0.85, 0.65);
    const iris = new THREE.Mesh(CHAR_GEOS.eyeIris, SHARED_CHAR_MATS.iris);
    iris.position.set(ex, 0.225, 0.136);
    const brow = new THREE.Mesh(CHAR_GEOS.brow, SHARED_CHAR_MATS.hair);
    brow.rotation.z = Math.PI / 2;
    brow.position.set(ex, 0.256, 0.128);
    head.add(sclera, iris, brow);
  });

  const hairCap = new THREE.Mesh(CHAR_GEOS.hairCap, SHARED_CHAR_MATS.hair);
  hairCap.position.set(0, 0.215, -0.01);
  hairCap.scale.set(0.97, 1.07, 1.04);
  hairCap.rotation.x = -0.18;
  head.add(hairCap);

  const hairBack = new THREE.Mesh(CHAR_GEOS.hairBack, SHARED_CHAR_MATS.hair);
  hairBack.position.set(0, 0.18, -0.035);
  hairBack.scale.set(0.95, 0.92, 0.88);
  head.add(hairBack);

  const hairFringe = new THREE.Mesh(CHAR_GEOS.hairFringe, SHARED_CHAR_MATS.hair);
  hairFringe.rotation.z = Math.PI / 2 - 0.18;
  hairFringe.position.set(0.01, 0.325, 0.078);
  hairFringe.scale.set(0.7, 1, 0.75);
  head.add(hairFringe);

  if (options.hatType === 'caping') {
    const caping = new THREE.Mesh(CHAR_GEOS.caping, SHARED_CHAR_MATS.caping);
    caping.position.y = 0.41;
    head.add(caping);
  } else if (options.hatType === 'peci') {
    const peci = new THREE.Mesh(CHAR_GEOS.peci, SHARED_CHAR_MATS.peci);
    peci.position.set(0, 0.36, -0.005);
    peci.scale.set(0.96, 1, 1.12);
    head.add(peci);
  } else if (options.hatType === 'polisi') {
    const cap = new THREE.Mesh(CHAR_GEOS.policeCap, SHARED_CHAR_MATS.policeCap);
    cap.position.set(0, 0.365, -0.005);
    const brim = new THREE.Mesh(CHAR_GEOS.policeBrim, SHARED_CHAR_MATS.policeBrim);
    brim.position.set(0, 0.315, 0.055);
    brim.rotation.x = 0.15;
    head.add(cap, brim);
  }

  bodyGroup.add(head);

  return {
    group,
    bodyGroup,
    torso,
    head,
    leftArm,
    rightArm,
    leftElbow,
    rightElbow,
    leftLeg,
    rightLeg,
    leftKnee,
    rightKnee,
  };
}

export function applyOutfitToRig(
  rig: CharacterRig,
  outfit: OutfitId,
  textures: ProceduralTexturePack
) {
  const cfg = OUTFIT_COLORS[outfit];
  const shirtMat = rig.torso.material as THREE.MeshStandardMaterial;
  shirtMat.color.setHex(cfg.shirt);
  shirtMat.metalness = cfg.metalness;
  shirtMat.map = outfit === 'batik' ? textures.batikWall : null;
  shirtMat.needsUpdate = true;

  // Update shoulder cap & sleeves on arms
  [rig.leftArm, rig.rightArm].forEach((arm) => {
    arm.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const m = child.material as THREE.MeshStandardMaterial;
        m.color.setHex(cfg.shirt);
        m.map = outfit === 'batik' ? textures.batikWall : null;
        m.needsUpdate = true;
      }
    });
  });
}

export function createVehicleModel(type: VehicleType, primaryColor: number): VehicleModelResult {
  const group = new THREE.Group();
  const wheels: THREE.Object3D[] = [];
  const headlights: THREE.Mesh[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.24,
    metalness: 0.65,
    envMapIntensity: 1.15,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.75,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.18,
    metalness: 0.92,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.88,
    metalness: 0.05,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.12,
    metalness: 0.2,
    transparent: true,
    opacity: 0.62,
  });
  const seatMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.85,
  });
  const makeHeadlightMat = () =>
    new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      emissive: 0xfef08a,
      emissiveIntensity: 0.2,
      roughness: 0.2,
    });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0xef4444,
    emissiveIntensity: 0.5,
    roughness: 0.3,
  });

  const makeWheel = (radius: number, width: number, x: number, y: number, z: number) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(x, y, z);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 12), tireMat);
    tire.rotation.z = Math.PI / 2;
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.56, radius * 0.56, width + 0.02, 10),
      chromeMat
    );
    rim.rotation.z = Math.PI / 2;
    wGroup.add(tire, rim);
    group.add(wGroup);
    wheels.push(wGroup);
    return wGroup;
  };

  if (type === 'motor_bebek' || type === 'motor_matic' || type === 'motor_sport' || type === 'sepeda') {
    const r = type === 'sepeda' ? 0.36 : 0.31;
    const w = type === 'sepeda' ? 0.07 : type === 'motor_sport' ? 0.17 : 0.13;
    makeWheel(r, w, 0, r, 0.72);
    makeWheel(r, w, 0, r, -0.68);

    // Frame / body
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(type === 'sepeda' ? 0.1 : 0.34, type === 'sepeda' ? 0.12 : 0.36, 1.32),
      bodyMat
    );
    frame.position.set(0, r + 0.28, 0);
    frame.castShadow = true;
    group.add(frame);

    if (type === 'motor_sport') {
      const tank = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.62), bodyMat);
      tank.position.set(0, r + 0.52, 0.22);
      const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.52), bodyMat);
      fairing.position.set(0, r + 0.46, 0.62);
      fairing.rotation.x = 0.25;
      group.add(tank, fairing);
    } else if (type === 'motor_matic' || type === 'motor_bebek') {
      const shield = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.56, 0.22), bodyMat);
      shield.position.set(0, r + 0.46, 0.54);
      shield.rotation.x = -0.18;
      group.add(shield);
    }

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.11, 0.68), seatMat);
    seat.position.set(0, r + 0.48, -0.22);
    group.add(seat);

    // Front Fork & Handlebar
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 8), chromeMat);
    fork.position.set(0, r + 0.44, 0.62);
    fork.rotation.x = -0.22;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.66, 8), darkMetalMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, r + 0.78, 0.52);
    group.add(fork, bar);

    // Exhaust (except bicycle)
    if (type !== 'sepeda') {
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.85, 8), chromeMat);
      exhaust.rotation.x = Math.PI / 2;
      exhaust.position.set(0.2, r + 0.06, -0.35);
      group.add(exhaust);
    }

    // Headlight & Taillight
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.08), makeHeadlightMat());
    hl.position.set(0, r + 0.65, 0.71);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.06), tailMat);
    tl.position.set(0, r + 0.48, -0.76);
    group.add(hl, tl);
    headlights.push(hl);

    return {
      group,
      wheels,
      headlights,
      seatY: r + 0.42,
      seatZ: -0.12,
      isOpenRide: true,
      halfW: 0.48,
      halfL: 1.05,
    };
  }

  // 4-Wheeled Vehicles
  const isTruck = type === 'truk';
  const isBus = type === 'bus';
  const isPickup = type === 'pickup';

  const width = isBus ? 2.35 : isTruck ? 2.15 : 1.85;
  const length = isBus ? 7.2 : isTruck ? 5.2 : isPickup ? 4.3 : 4.1;
  const wheelR = isBus || isTruck ? 0.46 : 0.36;
  const wheelZFront = length * 0.33;
  const wheelZBack = -length * 0.32;

  makeWheel(wheelR, 0.26, -width * 0.46, wheelR, wheelZFront);
  makeWheel(wheelR, 0.26, width * 0.46, wheelR, wheelZFront);
  makeWheel(wheelR, 0.26, -width * 0.46, wheelR, wheelZBack);
  makeWheel(wheelR, 0.26, width * 0.46, wheelR, wheelZBack);

  // Chassis
  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.1, 0.36, length - 0.1),
    darkMetalMat
  );
  chassis.position.y = wheelR + 0.12;
  chassis.castShadow = true;
  group.add(chassis);

  if (isBus) {
    const hull = new THREE.Mesh(new THREE.BoxGeometry(width, 2.05, length), bodyMat);
    hull.position.y = wheelR + 1.25;
    hull.castShadow = true;
    hull.receiveShadow = true;
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.03, 0.26, length + 0.02),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 })
    );
    stripe.position.y = wheelR + 0.95;
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(width - 0.16, 0.85, 0.08), glassMat);
    windshield.position.set(0, wheelR + 1.68, length * 0.5 + 0.01);
    const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(width + 0.02, 0.65, length * 0.78), glassMat);
    sideGlass.position.set(0, wheelR + 1.65, -0.1);
    group.add(hull, stripe, windshield, sideGlass);
  } else if (isTruck) {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(width - 0.08, 1.35, 1.55), bodyMat);
    cab.position.set(0, wheelR + 0.92, length * 0.5 - 0.82);
    cab.castShadow = true;
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(width - 0.24, 0.62, 0.08), glassMat);
    windshield.position.set(0, wheelR + 1.15, length * 0.5 - 0.02);
    const cargoBox = new THREE.Mesh(
      new THREE.BoxGeometry(width, 1.75, length - 1.8),
      new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.75 })
    );
    cargoBox.position.set(0, wheelR + 1.14, -0.82);
    cargoBox.castShadow = true;
    group.add(cab, windshield, cargoBox);
  } else if (isPickup) {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(width - 0.06, 1.08, 1.65), bodyMat);
    cab.position.set(0, wheelR + 0.78, 0.85);
    cab.castShadow = true;
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(width - 0.22, 0.55, 0.08), glassMat);
    windshield.position.set(0, wheelR + 0.98, 1.69);
    const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.52, 2.2), bodyMat);
    bedFloor.position.set(0, wheelR + 0.52, -1.0);
    bedFloor.castShadow = true;
    group.add(cab, windshield, bedFloor);
  } else {
    // Mobil Keluarga MPV
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(width, 0.68, length), bodyMat);
    lowerBody.position.y = wheelR + 0.52;
    lowerBody.castShadow = true;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width - 0.16, 0.66, length * 0.64), bodyMat);
    cabin.position.set(0, wheelR + 1.15, -0.22);
    cabin.castShadow = true;
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(width - 0.24, 0.54, 0.08), glassMat);
    windshield.position.set(0, wheelR + 1.12, length * 0.32 - 0.18);
    windshield.rotation.x = -0.35;
    const sideWindows = new THREE.Mesh(new THREE.BoxGeometry(width - 0.12, 0.45, length * 0.55), glassMat);
    sideWindows.position.set(0, wheelR + 1.16, -0.25);
    group.add(lowerBody, cabin, windshield, sideWindows);
  }

  // Headlights & Taillights
  const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.08), makeHeadlightMat());
  hlL.position.set(-width * 0.33, wheelR + 0.48, length * 0.5 + 0.01);
  const hlR = hlL.clone();
  hlR.material = makeHeadlightMat();
  hlR.position.x = width * 0.33;
  const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.08), tailMat);
  tlL.position.set(-width * 0.33, wheelR + 0.48, -length * 0.5 - 0.01);
  const tlR = tlL.clone();
  tlR.position.x = width * 0.33;
  group.add(hlL, hlR, tlL, tlR);
  headlights.push(hlL, hlR);

  return {
    group,
    wheels,
    headlights,
    seatY: wheelR + 0.55,
    seatZ: 0.1,
    isOpenRide: false,
    halfW: width * 0.55,
    halfL: length * 0.55,
  };
}

export function createJogloHouse(
  textures: ProceduralTexturePack,
  wallColor = 0xfef3c7,
  scale = 1
): THREE.Group {
  const g = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  const wallMat = new THREE.MeshStandardMaterial({
    color: wallColor,
    roughness: 0.85,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodPlank,
    roughness: 0.72,
    metalness: 0.05,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    map: textures.roofTile,
    roughness: 0.78,
    metalness: 0.04,
  });
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.25,
    roughness: 0.4,
  });

  // Raised foundation plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.5, 8.2), stoneMat);
  plinth.position.y = 0.25;
  plinth.receiveShadow = true;
  g.add(plinth);

  // Main Dalem room
  const body = new THREE.Mesh(new THREE.BoxGeometry(8.2, 3.0, 5.4), wallMat);
  body.position.set(0, 2.0, -0.8);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Wooden door & windows
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.2, 0.12), woodMat);
  door.position.set(0, 1.6, 1.92);
  const winL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.12), winMat);
  winL.position.set(-2.4, 2.0, 1.92);
  const winR = winL.clone();
  winR.position.x = 2.4;
  g.add(door, winL, winR);

  // Pendopo front pillars (Soko Guru)
  const pillarGeo = new THREE.BoxGeometry(0.24, 2.9, 0.24);
  [-3.8, -1.4, 1.4, 3.8].forEach((px) => {
    const p = new THREE.Mesh(pillarGeo, woodMat);
    p.position.set(px, 1.95, 3.4);
    p.castShadow = true;
    g.add(p);
  });

  // Lower Limasan Roof
  const lowerRoof = new THREE.Mesh(new THREE.ConeGeometry(7.2, 2.1, 4), roofMat);
  lowerRoof.position.set(0, 4.45, 0.3);
  lowerRoof.rotation.y = Math.PI / 4;
  lowerRoof.scale.set(1.1, 1, 0.95);
  lowerRoof.castShadow = true;
  g.add(lowerRoof);

  // Upper Joglo Tajug crown
  const upperRoof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 2.3, 4), roofMat);
  upperRoof.position.set(0, 6.1, -0.2);
  upperRoof.rotation.y = Math.PI / 4;
  upperRoof.castShadow = true;
  g.add(upperRoof);

  g.scale.setScalar(scale);
  return g;
}

export function createWarungKopi(textures: ProceduralTexturePack): THREE.Group {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ map: textures.woodPlank, roughness: 0.78 });
  const roofMat = new THREE.MeshStandardMaterial({ map: textures.roofTile, roughness: 0.8 });
  const tarpMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.65 });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.2,
  });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.3, 6), woodMat);
  floor.position.y = 0.15;
  floor.receiveShadow = true;
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 2.8, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.82 })
  );
  backWall.position.set(0, 1.7, -2.6);
  backWall.castShadow = true;

  const counter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.05, 0.8), woodMat);
  counter.position.set(-0.6, 0.82, -0.7);
  counter.castShadow = true;

  const bench = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.45, 0.55), woodMat);
  bench.position.set(-0.6, 0.5, 1.0);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 1.7, 4), roofMat);
  roof.position.set(0, 3.8, -0.3);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;

  const awning = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.08, 2.2), tarpMat);
  awning.position.set(0, 2.75, 2.2);
  awning.rotation.x = 0.24;

  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), lanternMat);
  lantern.position.set(2.4, 2.55, 1.8);

  g.add(floor, backWall, counter, bench, roof, awning, lantern);
  return g;
}

export function createPosRonda(textures: ProceduralTexturePack): THREE.Group {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ map: textures.woodPlank, roughness: 0.75 });
  const roofMat = new THREE.MeshStandardMaterial({ map: textures.roofTile, roughness: 0.8 });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.45, 3.4), woodMat);
  deck.position.y = 0.225;
  deck.receiveShadow = true;

  const postGeo = new THREE.BoxGeometry(0.18, 2.4, 0.18);
  [
    [-1.4, -1.4],
    [1.4, -1.4],
    [-1.4, 1.4],
    [1.4, 1.4],
  ].forEach(([px, pz]) => {
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(px, 1.6, pz);
    post.castShadow = true;
    g.add(post);
  });

  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.9, 1.4, 4), roofMat);
  roof.position.y = 3.45;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;

  // Kentongan bamboo drum
  const kentongan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.7, 10),
    new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.65 })
  );
  kentongan.position.set(1.4, 2.1, 1.55);

  g.add(deck, roof, kentongan);
  return g;
}

export function createCityBuilding(
  w: number,
  h: number,
  d: number,
  color: number,
  accentColor = 0xe2e8f0
): THREE.Group {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color, roughness: 0.78 });
  const trimMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.55 });
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0xfde68a,
    emissiveIntensity: 0.22,
    roughness: 0.25,
    metalness: 0.4,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const parapet = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.45, d + 0.3), trimMat);
  parapet.position.y = h + 0.2;
  g.add(parapet);

  const floors = Math.max(1, Math.floor(h / 3.4));
  for (let f = 0; f < floors; f++) {
    const wy = 2.0 + f * 3.1;
    if (wy > h - 0.8) break;
    const winStrip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.74, 1.1, d + 0.08), winMat);
    winStrip.position.y = wy;
    g.add(winStrip);
  }

  return g;
}

export function createSPBU(): THREE.Group {
  const g = new THREE.Group();
  const concrete = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.88 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.42 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.42 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });

  const pad = new THREE.Mesh(new THREE.BoxGeometry(14, 0.25, 10), concrete);
  pad.position.y = 0.125;
  pad.receiveShadow = true;

  const pillarGeo = new THREE.BoxGeometry(0.65, 4.6, 0.65);
  [-4.5, 4.5].forEach((px) => {
    const p = new THREE.Mesh(pillarGeo, whiteMat);
    p.position.set(px, 2.4, 0);
    p.castShadow = true;
    g.add(p);
  });

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.9, 8.2), whiteMat);
  canopy.position.y = 4.9;
  canopy.castShadow = true;
  const redBand = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.32, 8.3), redMat);
  redBand.position.y = 5.2;
  const blueBand = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.25, 8.3), blueMat);
  blueBand.position.y = 4.55;

  // Fuel Pumps
  [-2.2, 2.2].forEach((px) => {
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.7, 0.6), redMat);
    pump.position.set(px, 1.1, 0);
    pump.castShadow = true;
    g.add(pump);
  });

  g.add(pad, canopy, redBand, blueBand);
  return g;
}

export function createCandiMajapahit(textures: ProceduralTexturePack): THREE.Group {
  const g = new THREE.Group();
  const brickMat = new THREE.MeshStandardMaterial({
    map: textures.redBrick,
    roughness: 0.86,
    metalness: 0.04,
  });

  const tiers = [
    { w: 12, h: 1.6, d: 12, y: 0.8 },
    { w: 9.2, h: 2.2, d: 9.2, y: 2.7 },
    { w: 6.4, h: 2.8, d: 6.4, y: 5.2 },
    { w: 4.4, h: 2.2, d: 4.4, y: 7.7 },
    { w: 2.6, h: 1.8, d: 2.6, y: 9.7 },
    { w: 1.3, h: 1.4, d: 1.3, y: 11.3 },
  ];
  tiers.forEach((t) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), brickMat);
    m.position.y = t.y;
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  });

  // Grand staircase front (+Z)
  for (let s = 0; s < 5; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 1.1), brickMat);
    step.position.set(0, 0.3 + s * 0.55, 6.4 - s * 0.75);
    g.add(step);
  }

  // Split Gate (Candi Bentar) in front
  [-3.2, 3.2].forEach((gx) => {
    const gateHalf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 5.2, 2.2), brickMat);
    gateHalf.position.set(gx, 2.6, 12.5);
    gateHalf.castShadow = true;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.0, 4), brickMat);
    crown.position.set(gx, 6.2, 12.5);
    crown.rotation.y = Math.PI / 4;
    g.add(gateHalf, crown);
  });

  return g;
}

export function createPerahuNelayan(): THREE.Group {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.58 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.82 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 5.2), hullMat);
  hull.position.y = 0.35;
  hull.castShadow = true;
  const prow = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.6, 4), trimMat);
  prow.rotation.x = Math.PI / 2;
  prow.rotation.y = Math.PI / 4;
  prow.position.set(0, 0.45, 3.3);

  // Outriggers (Katir)
  [-1.6, 1.6].forEach((ox) => {
    const floatBar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.2, 8), woodMat);
    floatBar.rotation.x = Math.PI / 2;
    floatBar.position.set(ox, 0.18, 0);
    const armF = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.1), woodMat);
    armF.position.set(ox * 0.5, 0.42, 1.1);
    const armB = armF.clone();
    armB.position.z = -1.1;
    g.add(floatBar, armF, armB);
  });

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.6, 8), woodMat);
  mast.position.set(0, 2.0, 0.5);

  g.add(hull, prow, mast);
  return g;
}

export function createAnimal(kind: 'kambing' | 'sapi', white = true): THREE.Group {
  const g = new THREE.Group();
  const coatMat = new THREE.MeshStandardMaterial({
    color: kind === 'kambing' ? (white ? 0xf5f5f4 : 0x78350f) : 0x9a3412,
    roughness: 0.9,
  });
  const spotMat = new THREE.MeshStandardMaterial({ color: 0xfafaf9, roughness: 0.88 });
  const scale = kind === 'sapi' ? 1.55 : 0.95;

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.52, 0.98), coatMat);
  body.position.y = 0.62;
  body.castShadow = true;
  g.add(body);

  if (kind === 'sapi') {
    const patch = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.34, 0.42), spotMat);
    patch.position.set(0, 0.68, 0.05);
    g.add(patch);
  }

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.42), coatMat);
  head.position.set(0, 0.88, 0.58);
  head.castShadow = true;
  g.add(head);

  const legGeo = new THREE.BoxGeometry(0.11, 0.44, 0.11);
  [
    [-0.18, 0.34],
    [0.18, 0.34],
    [-0.18, -0.34],
    [0.18, -0.34],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, coatMat);
    leg.position.set(lx, 0.22, lz);
    g.add(leg);
  });

  g.scale.setScalar(scale);
  return g;
}

export function createWitAsem(scale = 1.4): THREE.Group {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x452b18, roughness: 0.92 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f6b25, roughness: 0.82 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.95, 4.2, 10), trunkMat);
  trunk.position.y = 2.1;
  trunk.castShadow = true;
  g.add(trunk);

  const crowns = [
    { x: 0, y: 5.2, z: 0, r: 3.1 },
    { x: -1.8, y: 4.5, z: 1.2, r: 2.2 },
    { x: 1.9, y: 4.6, z: -1.0, r: 2.3 },
    { x: 0.5, y: 6.2, z: 0.6, r: 2.1 },
  ];
  crowns.forEach((c) => {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 1), leafMat);
    m.position.set(c.x, c.y, c.z);
    m.castShadow = true;
    g.add(m);
  });

  g.scale.setScalar(scale);
  return g;
}
