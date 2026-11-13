import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ActiveDialogue,
  GameHudState,
  InteractPrompt,
  InventoryItem,
  LanguageMode,
  MinimapEntity,
  MissionDef,
  OutfitId,
  SaveData,
  VehicleType,
  WeatherType,
} from './types';
import {
  INITIAL_INVENTORY,
  MISSIONS,
  REGION_NAMES,
  SHOPS,
  VEHICLE_LABELS,
  t,
} from './jawaData';
import {
  BuildingCollider,
  LANDMARKS,
  NPC_SPAWNS,
  NpcSpawn,
  TRAFFIC_LOOP,
  VEHICLE_SPAWNS,
  WORLD_PLAY_LIMIT,
  getRegionAt,
  groundHeightAt,
} from './worldData';
import { createProceduralTextures, ProceduralTexturePack } from './textures';
import {
  CharacterRig,
  VehicleModelResult,
  applyOutfitToRig,
  createCharacterRig,
  createVehicleModel,
} from './models';
import { buildJawaWorld } from './worldBuilder';
import { JawaAudioEngine } from './audio';

const SAVE_STORAGE_KEY = 'jawa_life_save_v1';

// Pre-allocated math helpers for zero GC in render loop
const _vec3 = new THREE.Vector3();
const _camIdeal = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _skyDay = new THREE.Color(0x7cc4f8);
const _skySunset = new THREE.Color(0xf59e6b);
const _skyNight = new THREE.Color(0x0b1326);
const _skyRain = new THREE.Color(0x4b5c6b);
const _skyCurrent = new THREE.Color();

interface VehicleRuntime {
  id: string;
  type: VehicleType;
  model: VehicleModelResult;
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  isTraffic: boolean;
  trafficIndex: number;
}

interface NpcRuntime {
  spawn: NpcSpawn;
  rig: CharacterRig;
  x: number;
  y: number;
  z: number;
  yaw: number;
  patrolAngle: number;
}

export class GameEngine {
  private container: HTMLElement;
  private onHudUpdate: (state: GameHudState) => void;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private textures!: ProceduralTexturePack;
  private audio = new JawaAudioEngine();

  private isSoftwareGl = false;
  private frameId = 0;
  private disposed = false;
  private lastTime = performance.now();

  // Lighting
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private streetLampBulbs: THREE.MeshStandardMaterial[] = [];

  // World & animated props
  private colliders: BuildingCollider[] = [];
  private waterfallMesh!: THREE.Mesh;
  private oceanMesh!: THREE.Mesh;
  private boats: THREE.Group[] = [];
  private lostGoat!: THREE.Group;
  private lostGoatCollected = false;
  private missionPropFishCrate!: THREE.Group;
  private farmAnimals: Array<{ mesh: THREE.Group; baseX: number; baseZ: number; phase: number }> = [];

  // Rain particles
  private rainPoints!: THREE.Points;
  private rainPositions!: Float32Array;

  // GPS 3D Beacon
  private gpsBeacon!: THREE.Group;
  private gpsRing!: THREE.Mesh;

  // Player (Bagas)
  private playerRig!: CharacterRig;
  private playerX = -12;
  private playerY = 0;
  private playerZ = 10;
  private playerVy = 0;
  private playerYaw = 0;
  private isGrounded = true;
  private walkAnimTime = 0;

  // Camera orbit
  private camYaw = 0;
  private camPitch = 0.28;
  private isDraggingCamera = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  // Entities
  private vehicles: VehicleRuntime[] = [];
  private npcs: NpcRuntime[] = [];
  private currentVehicle: VehicleRuntime | null = null;

  // Input state
  private keys = new Set<string>();
  private virtualMove = { x: 0, y: 0 };

  // Gameplay state
  private state: GameHudState;
  private hudSyncAccum = 0;
  private toastTimeout: number | null = null;
  private elapsedTotal = 0;

  constructor(container: HTMLElement, onHudUpdate: (state: GameHudState) => void) {
    this.container = container;
    this.onHudUpdate = onHudUpdate;

    const hasSave = Boolean(localStorage.getItem(SAVE_STORAGE_KEY));
    this.state = {
      screen: 'menu',
      language: 'ngoko',
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      money: 50000,
      xp: 0,
      level: 1,
      reputation: 10,
      region: 'desa',
      timeOfDay: 8.5,
      weather: 'cerah',
      playerX: this.playerX,
      playerY: 0,
      playerZ: this.playerZ,
      playerYaw: 0,
      inVehicle: false,
      vehicleName: '',
      vehicleType: null,
      speedKmh: 0,
      outfit: 'kasual',
      ownedOutfits: ['kasual'],
      inventory: structuredClone(INITIAL_INVENTORY),
      activeMissionId: 'misi_1_tangga',
      activeStepIndex: 0,
      completedMissionIds: [],
      discoveredLandmarks: ['lm_desa'],
      gpsTarget: null,
      interactPrompt: null,
      activeDialogue: null,
      activeShopId: null,
      toastMessage: null,
      minimapEntities: [],
      audioMuted: false,
      gamelanEnabled: true,
      graphicsMode: 'seimbang',
      hasSaveData: hasSave,
    };

    this.initThree();
    this.bindEvents();
    this.updateGpsTarget();
    this.emitHud();
    this.startLoop();
  }

  private detectSoftwareWebGL(): boolean {
    try {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return false;
    }
  }

  private initThree() {
    this.isSoftwareGl = this.detectSoftwareWebGL();
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.25));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setSize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7cc4f8);
    this.scene.fog = new THREE.FogExp2(0x7cc4f8, 0.0046);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.3, 275);

    // 3-Point Outdoor Lighting Rig (Warm Sun Key + Cool Hemisphere Fill)
    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x3f6212, 0.78);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff1d6, 1.85);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(768, 768);
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 120;
    const d = 38;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Procedural textures & world build
    this.textures = createProceduralTextures(this.renderer.capabilities.getMaxAnisotropy());
    const world = buildJawaWorld(this.scene, this.textures);
    this.colliders = world.colliders;
    this.streetLampBulbs = world.streetLampBulbs;
    this.waterfallMesh = world.waterfallMesh;
    this.oceanMesh = world.oceanMesh;
    this.boats = world.boats;
    this.lostGoat = world.lostGoat;
    this.farmAnimals = world.farmAnimals;
    this.missionPropFishCrate = world.missionPropFishCrate;

    // Bagas character rig
    this.playerRig = createCharacterRig({
      outfit: this.state.outfit,
      textures: this.textures,
    });
    this.playerY = groundHeightAt(this.playerX, this.playerZ);
    this.playerRig.group.position.set(this.playerX, this.playerY, this.playerZ);
    this.scene.add(this.playerRig.group);

    // Spawn NPCs
    NPC_SPAWNS.forEach((spawn) => {
      const rig = createCharacterRig({
        shirtColor: spawn.shirtColor,
        pantsColor: spawn.pantsColor,
        hatType: spawn.hatType,
      });
      const gy = groundHeightAt(spawn.x, spawn.z);
      rig.group.position.set(spawn.x, gy, spawn.z);
      rig.group.rotation.y = spawn.yaw;
      this.scene.add(rig.group);
      this.npcs.push({
        spawn,
        rig,
        x: spawn.x,
        y: gy,
        z: spawn.z,
        yaw: spawn.yaw,
        patrolAngle: Math.random() * Math.PI * 2,
      });
    });

    // Spawn Playable Vehicles
    VEHICLE_SPAWNS.forEach((vs) => {
      const model = createVehicleModel(vs.type, vs.color);
      const gy = groundHeightAt(vs.x, vs.z);
      model.group.position.set(vs.x, gy, vs.z);
      model.group.rotation.y = vs.yaw;
      this.scene.add(model.group);
      this.vehicles.push({
        id: vs.id,
        type: vs.type,
        model,
        x: vs.x,
        y: gy,
        z: vs.z,
        yaw: vs.yaw,
        speed: 0,
        isTraffic: false,
        trafficIndex: 0,
      });
    });

    // Spawn Autonomous Traffic Vehicles looping Kota <-> Desa roads
    const trafficSpecs: Array<{ type: VehicleType; color: number; idx: number }> = [
      { type: 'mobil_keluarga', color: 0xe2e8f0, idx: 0 },
      { type: 'motor_bebek', color: 0x0f172a, idx: 2 },
      { type: 'pickup', color: 0x1d4ed8, idx: 4 },
      { type: 'bus', color: 0xd97706, idx: 6 },
      { type: 'truk', color: 0x15803d, idx: 8 },
    ];
    trafficSpecs.forEach((ts, k) => {
      const pt = TRAFFIC_LOOP[ts.idx];
      const model = createVehicleModel(ts.type, ts.color);
      const gy = groundHeightAt(pt.x, pt.z);
      model.group.position.set(pt.x, gy, pt.z);
      this.scene.add(model.group);
      this.vehicles.push({
        id: `traffic_${k}`,
        type: ts.type,
        model,
        x: pt.x,
        y: gy,
        z: pt.z,
        yaw: 0,
        speed: 8,
        isTraffic: true,
        trafficIndex: (ts.idx + 1) % TRAFFIC_LOOP.length,
      });
    });

    // 3D GPS Beacon Pillar
    this.gpsBeacon = new THREE.Group();
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 1.4, 24, 16, 1, true), beamMat);
    beam.position.y = 12;
    this.gpsRing = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 2.2, 24),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    this.gpsRing.rotation.x = -Math.PI / 2;
    this.gpsRing.position.y = 0.25;
    this.gpsBeacon.add(beam, this.gpsRing);
    this.scene.add(this.gpsBeacon);

    // Rain Particle System
    const rainCount = 850;
    this.rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 75;
      this.rainPositions[i * 3 + 1] = Math.random() * 28;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 75;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    this.rainPoints = new THREE.Points(
      rainGeo,
      new THREE.PointsMaterial({
        color: 0xcbd5e1,
        size: 0.24,
        transparent: true,
        opacity: 0.68,
      })
    );
    this.rainPoints.visible = false;
    this.scene.add(this.rainPoints);

    // Pre-warm shaders on GPU
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // WebGL context loss guard
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
    });
  }

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  private handleResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handlePointerDown = (e: PointerEvent) => {
    this.audio.init();
    if (this.state.screen !== 'playing' || this.state.activeDialogue || this.state.activeShopId) return;
    this.isDraggingCamera = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isDraggingCamera) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.camYaw -= dx * 0.0055;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * 0.004, 0.06, 0.85);
  };

  private handlePointerUp = () => {
    this.isDraggingCamera = false;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    const code = e.code;
    this.keys.add(code);
    this.audio.init();

    if (this.state.screen === 'playing') {
      if (code === 'Escape') {
        if (this.state.activeDialogue) {
          this.closeDialogue();
        } else if (this.state.activeShopId) {
          this.closeShop();
        } else {
          this.setScreen('paused');
        }
        return;
      }

      if (this.state.activeDialogue || this.state.activeShopId) return;

      if (code === 'KeyE') {
        this.triggerInteract();
      } else if (code === 'KeyF') {
        this.toggleVehicle();
      } else if (code === 'KeyH' && this.currentVehicle) {
        this.audio.playHorn();
        this.showToast('Tin! Tin! Klakson muni.');
      } else if (code === 'Space' && !this.currentVehicle && this.isGrounded) {
        this.playerVy = 7.4;
        this.isGrounded = false;
      }
    } else if (this.state.screen === 'paused' && code === 'Escape') {
      this.setScreen('playing');
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private startLoop() {
    const tick = () => {
      if (this.disposed) return;
      const now = performance.now();
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      this.stepSimulation(dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };
    this.frameId = requestAnimationFrame(tick);
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (status === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private stepSimulation(dt: number) {
    this.elapsedTotal += dt;

    // Gentle menu camera orbit when on main menu
    if (this.state.screen === 'menu') {
      const angle = this.elapsedTotal * 0.14;
      this.camera.position.set(
        this.playerX + Math.sin(angle) * 24,
        this.playerY + 11,
        this.playerZ + Math.cos(angle) * 24
      );
      this.camera.lookAt(this.playerX, this.playerY + 2.2, this.playerZ);
      this.updateAtmosphere(dt * 0.15);
      return;
    }

    if (this.state.screen === 'paused') {
      return;
    }

    // 1. Update Time of Day & Weather Atmosphere
    this.updateAtmosphere(dt);

    // 2. Animate Water, Boats, Waterfall, Farm Animals, GPS Beacon
    this.animateWorldProps(dt);

    // 3. Autonomous Traffic & NPCs
    this.updateTraffic(dt);
    this.updateNpcs(dt);

    // 4. Player / Vehicle Controls (paused during dialogue/shop)
    const inputBlocked = Boolean(this.state.activeDialogue || this.state.activeShopId);
    let isWalking = false;

    if (!inputBlocked) {
      // Keyboard camera rotation Q / Z
      if (this.keys.has('KeyQ')) this.camYaw += 1.9 * dt;
      if (this.keys.has('KeyC')) this.camYaw -= 1.9 * dt;

      if (this.currentVehicle) {
        this.updateDriving(dt);
      } else {
        isWalking = this.updateOnFoot(dt);
      }
    }

    // 5. Update Region & Landmark Discovery & Mission Proximity
    const newRegion = getRegionAt(this.playerX, this.playerZ);
    if (newRegion !== this.state.region) {
      this.state.region = newRegion;
      this.showToast(`Mlebu ing ${t(REGION_NAMES[newRegion], this.state.language)}`);
    }

    for (const lm of LANDMARKS) {
      if (!this.state.discoveredLandmarks.includes(lm.id)) {
        if (Math.hypot(this.playerX - lm.x, this.playerZ - lm.z) < 22) {
          this.state.discoveredLandmarks.push(lm.id);
          this.gainXp(25);
          this.showToast(`Lokasi ditemokake: ${lm.name} (+25 XP)`);
          this.audio.playChime();
        }
      }
    }

    this.checkMissionStepProgress();
    this.updateInteractPrompt();

    // 6. Smooth Third-Person Camera Follow
    this.updateCamera(dt);

    // 7. Audio Update
    const vehSpec = this.currentVehicle ? VEHICLE_LABELS[this.currentVehicle.type] : null;
    const speedRatio =
      this.currentVehicle && vehSpec
        ? Math.min(1, Math.abs(this.currentVehicle.speed) / vehSpec.maxSpeed)
        : 0;
    const nearDesaOrCandi = this.state.region === 'desa' || this.state.region === 'wisata';
    this.audio.update(dt, {
      inVehicle: Boolean(this.currentVehicle),
      speedRatio,
      isWalking,
      isRaining: this.state.weather === 'hujan',
      timeOfDay: this.state.timeOfDay,
      nearCandiOrDesa: nearDesaOrCandi,
    });

    // 8. Sync HUD at ~9Hz to keep React ultra-snappy without overhead
    this.hudSyncAccum += dt;
    if (this.hudSyncAccum >= 0.11) {
      this.hudSyncAccum = 0;
      this.emitHud();
    }
  }

  private lastLampNight: boolean | null = null;

  private updateAtmosphere(dt: number) {
    // 1 game hour every ~28 real seconds
    this.state.timeOfDay = (this.state.timeOfDay + dt * 0.035) % 24;
    const hr = this.state.timeOfDay;
    const sunAngle = ((hr - 6) / 24) * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    const isDay = sunHeight > 0;

    // Snap Sun shadow target to 2m grid around player to reduce shadow shimmer
    const snapX = Math.round(this.playerX * 0.5) * 2;
    const snapZ = Math.round(this.playerZ * 0.5) * 2;
    const sunDist = 55;
    this.sunLight.position.set(
      snapX + Math.cos(sunAngle) * sunDist,
      Math.max(12, Math.abs(sunHeight) * sunDist + 10),
      snapZ + 24
    );
    this.sunLight.target.position.set(snapX, this.playerY, snapZ);

    // Sky & Fog color blending
    if (this.state.weather === 'hujan') {
      _skyCurrent.copy(_skyRain);
      if (!isDay) _skyCurrent.lerp(_skyNight, 0.72);
    } else if (hr >= 5.5 && hr < 7.5) {
      const k = (hr - 5.5) / 2;
      _skyCurrent.copy(_skySunset).lerp(_skyDay, k);
    } else if (hr >= 7.5 && hr < 16.5) {
      _skyCurrent.copy(_skyDay);
    } else if (hr >= 16.5 && hr < 18.8) {
      const k = (hr - 16.5) / 2.3;
      _skyCurrent.copy(_skyDay).lerp(_skySunset, Math.min(1, k * 1.4));
      if (k > 0.65) _skyCurrent.lerp(_skyNight, (k - 0.65) / 0.35);
    } else {
      _skyCurrent.copy(_skyNight);
    }

    (this.scene.background as THREE.Color).copy(_skyCurrent);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(_skyCurrent);
      this.scene.fog.density = this.state.weather === 'hujan' ? 0.0082 : isDay ? 0.0038 : 0.0055;
    }

    // Light intensities
    const dayFactor = THREE.MathUtils.clamp((sunHeight + 0.15) / 0.7, 0, 1);
    const rainDim = this.state.weather === 'hujan' ? 0.62 : 1.0;
    this.sunLight.intensity = (0.28 + dayFactor * 1.75) * rainDim;
    this.sunLight.color.setHex(hr > 16.2 && hr < 18.6 ? 0xffb37a : isDay ? 0xfff3db : 0x818cf8);
    this.hemiLight.intensity = (0.38 + dayFactor * 0.55) * rainDim;

    // Streetlamps & Vehicle Headlights glow at dusk/night (only update materials when state changes)
    const isLampNight = hr < 6 || hr > 17.6;
    if (this.lastLampNight !== isLampNight) {
      this.lastLampNight = isLampNight;
      const lampGlow = isLampNight ? 1.8 : 0.12;
      for (const bulb of this.streetLampBulbs) {
        bulb.emissiveIntensity = lampGlow;
      }
      for (const v of this.vehicles) {
        for (const hl of v.model.headlights) {
          (hl.material as THREE.MeshStandardMaterial).emissiveIntensity = isLampNight ? 2.2 : 0.2;
        }
      }
    }

    // Rain particle movement
    this.rainPoints.visible = this.state.weather === 'hujan';
    if (this.rainPoints.visible) {
      this.rainPoints.position.set(this.playerX, this.playerY, this.playerZ);
      const count = this.rainPositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.rainPositions[i * 3 + 1] -= 32 * dt;
        if (this.rainPositions[i * 3 + 1] < -2) {
          this.rainPositions[i * 3 + 1] = 26 + Math.random() * 4;
        }
      }
      this.rainPoints.geometry.attributes.position.needsUpdate = true;
    }
  }

  private animateWorldProps(dt: number) {
    // Waterfall texture scroll & ocean bobbing
    this.textures.water.offset.y -= dt * 0.25;
    if (this.playerZ > 45) {
      this.oceanMesh.position.y = -0.75 + Math.sin(this.elapsedTotal * 1.6) * 0.12;
      this.boats.forEach((b, idx) => {
        b.position.y = -0.45 + Math.sin(this.elapsedTotal * 1.8 + idx) * 0.12;
        b.rotation.z = Math.sin(this.elapsedTotal * 1.3 + idx) * 0.04;
      });
    }

    // Farm animals gentle grazing sway (only when within 95m)
    for (const a of this.farmAnimals) {
      const dx = a.baseX - this.playerX;
      const dz = a.baseZ - this.playerZ;
      if (dx * dx + dz * dz < 9025) {
        a.mesh.visible = true;
        a.mesh.position.x = a.baseX + Math.sin(this.elapsedTotal * 0.4 + a.phase) * 1.2;
        a.mesh.rotation.y = Math.cos(this.elapsedTotal * 0.4 + a.phase) * 0.6;
      } else {
        a.mesh.visible = false;
      }
    }

    // Lost goat visibility
    this.lostGoat.visible = !this.lostGoatCollected;
    if (this.lostGoat.visible) {
      this.lostGoat.rotation.y = Math.sin(this.elapsedTotal * 1.2) * 0.5;
    }

    // GPS Beacon pulse rotation (non-UI 3D marker)
    if (this.state.gpsTarget) {
      this.gpsBeacon.visible = true;
      const gy = groundHeightAt(this.state.gpsTarget.x, this.state.gpsTarget.z);
      this.gpsBeacon.position.set(this.state.gpsTarget.x, gy, this.state.gpsTarget.z);
      this.gpsRing.rotation.z += dt * 1.5;
    } else {
      this.gpsBeacon.visible = false;
    }
  }

  private updateOnFoot(dt: number): boolean {
    let moveX = this.virtualMove.x;
    let moveZ = this.virtualMove.y;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveZ -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveZ += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveX -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveX += 1;

    const inputLen = Math.hypot(moveX, moveZ);
    const isMoving = inputLen > 0.05;
    const isSprinting = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) && this.state.stamina > 2;

    if (isMoving && isSprinting) {
      this.state.stamina = Math.max(0, this.state.stamina - 18 * dt);
    } else {
      this.state.stamina = Math.min(this.state.maxStamina, this.state.stamina + 14 * dt);
    }

    const speed = isSprinting ? 11.2 : 6.2;

    if (isMoving) {
      const nx = moveX / inputLen;
      const nz = moveZ / inputLen;
      const sinY = Math.sin(this.camYaw);
      const cosY = Math.cos(this.camYaw);
      // Convert camera-relative input to world XZ
      const worldDx = nx * cosY + nz * sinY;
      const worldDz = -nx * sinY + nz * cosY;

      const nextX = THREE.MathUtils.clamp(this.playerX + worldDx * speed * dt, -WORLD_PLAY_LIMIT, WORLD_PLAY_LIMIT);
      const nextZ = THREE.MathUtils.clamp(this.playerZ + worldDz * speed * dt, -WORLD_PLAY_LIMIT, WORLD_PLAY_LIMIT);

      const resolved = this.resolveBuildingCollision(nextX, nextZ, 0.55);
      this.playerX = resolved.x;
      this.playerZ = resolved.z;

      const targetYaw = Math.atan2(worldDx, worldDz);
      this.playerYaw = this.lerpAngle(this.playerYaw, targetYaw, Math.min(1, 12 * dt));
    }

    // Vertical gravity & ground collision
    const floorY = Math.max(-0.6, groundHeightAt(this.playerX, this.playerZ));
    if (!this.isGrounded || this.playerY > floorY + 0.05) {
      this.playerVy -= 20 * dt;
      this.playerY += this.playerVy * dt;
      if (this.playerY <= floorY) {
        this.playerY = floorY;
        this.playerVy = 0;
        this.isGrounded = true;
      }
    } else {
      this.playerY = floorY;
    }

    // Apply transform & limb animation
    this.playerRig.group.visible = true;
    this.playerRig.group.position.set(this.playerX, this.playerY, this.playerZ);
    this.playerRig.group.rotation.y = this.playerYaw;

    if (!this.isGrounded) {
      this.playerRig.bodyGroup.position.y = 0;
      this.playerRig.leftLeg.rotation.x = -0.35;
      this.playerRig.rightLeg.rotation.x = 0.25;
      this.playerRig.leftKnee.rotation.x = 0.55;
      this.playerRig.rightKnee.rotation.x = 0.45;
      this.playerRig.leftArm.rotation.x = -0.6;
      this.playerRig.rightArm.rotation.x = -0.6;
      this.playerRig.leftElbow.rotation.x = -0.45;
      this.playerRig.rightElbow.rotation.x = -0.45;
    } else if (isMoving) {
      this.walkAnimTime += dt * (isSprinting ? 12.5 : 8.2);
      const swing = Math.sin(this.walkAnimTime) * (isSprinting ? 0.72 : 0.48);
      this.playerRig.bodyGroup.position.y = Math.abs(Math.sin(this.walkAnimTime)) * (isSprinting ? 0.045 : 0.025);
      this.playerRig.leftLeg.rotation.x = swing;
      this.playerRig.rightLeg.rotation.x = -swing;
      this.playerRig.leftKnee.rotation.x = Math.max(0, -swing * 0.85);
      this.playerRig.rightKnee.rotation.x = Math.max(0, swing * 0.85);
      this.playerRig.leftArm.rotation.x = -swing * 0.82;
      this.playerRig.rightArm.rotation.x = swing * 0.82;
      this.playerRig.leftElbow.rotation.x = -0.35 - Math.max(0, -swing * 0.45);
      this.playerRig.rightElbow.rotation.x = -0.35 - Math.max(0, swing * 0.45);
    } else {
      const breathe = Math.sin(this.elapsedTotal * 2.2) * 0.008;
      this.playerRig.bodyGroup.position.y = THREE.MathUtils.damp(this.playerRig.bodyGroup.position.y, breathe, 8, dt);
      this.playerRig.leftLeg.rotation.x = THREE.MathUtils.damp(this.playerRig.leftLeg.rotation.x, 0, 10, dt);
      this.playerRig.rightLeg.rotation.x = THREE.MathUtils.damp(this.playerRig.rightLeg.rotation.x, 0, 10, dt);
      this.playerRig.leftKnee.rotation.x = THREE.MathUtils.damp(this.playerRig.leftKnee.rotation.x, 0, 10, dt);
      this.playerRig.rightKnee.rotation.x = THREE.MathUtils.damp(this.playerRig.rightKnee.rotation.x, 0, 10, dt);
      this.playerRig.leftArm.rotation.x = THREE.MathUtils.damp(this.playerRig.leftArm.rotation.x, 0, 10, dt);
      this.playerRig.rightArm.rotation.x = THREE.MathUtils.damp(this.playerRig.rightArm.rotation.x, 0, 10, dt);
      this.playerRig.leftElbow.rotation.x = THREE.MathUtils.damp(this.playerRig.leftElbow.rotation.x, -0.14, 10, dt);
      this.playerRig.rightElbow.rotation.x = THREE.MathUtils.damp(this.playerRig.rightElbow.rotation.x, -0.14, 10, dt);
    }

    this.state.playerX = this.playerX;
    this.state.playerY = this.playerY;
    this.state.playerZ = this.playerZ;
    this.state.playerYaw = this.playerYaw;
    this.state.speedKmh = isMoving ? Math.round(speed * 3.6) : 0;

    return isMoving && this.isGrounded;
  }

  private updateDriving(dt: number) {
    const veh = this.currentVehicle!;
    const spec = VEHICLE_LABELS[veh.type];

    let throttle = -this.virtualMove.y;
    let steer = -this.virtualMove.x;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) throttle += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) throttle -= 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) steer += 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) steer -= 1;

    if (throttle > 0.05) {
      veh.speed += spec.accel * throttle * dt;
    } else if (throttle < -0.05) {
      veh.speed += spec.accel * 1.15 * throttle * dt;
    } else {
      // Natural rolling friction
      veh.speed = THREE.MathUtils.damp(veh.speed, 0, 2.4, dt);
    }

    // Handbrake on Space
    if (this.keys.has('Space')) {
      veh.speed = THREE.MathUtils.damp(veh.speed, 0, 6.5, dt);
    }

    veh.speed = THREE.MathUtils.clamp(veh.speed, -spec.maxSpeed * 0.4, spec.maxSpeed);

    // Steering scales with speed
    if (Math.abs(veh.speed) > 0.5) {
      const dirSign = veh.speed >= 0 ? 1 : -1;
      const speedFactor = Math.min(1, Math.abs(veh.speed) / 8);
      veh.yaw += steer * spec.turnSpeed * speedFactor * dirSign * dt;
    }

    const fwdX = Math.sin(veh.yaw);
    const fwdZ = Math.cos(veh.yaw);
    const nextX = THREE.MathUtils.clamp(veh.x + fwdX * veh.speed * dt, -WORLD_PLAY_LIMIT, WORLD_PLAY_LIMIT);
    const nextZ = THREE.MathUtils.clamp(veh.z + fwdZ * veh.speed * dt, -WORLD_PLAY_LIMIT, WORLD_PLAY_LIMIT);

    const pad = Math.max(veh.model.halfW, veh.model.halfL) * 0.78;
    const resolved = this.resolveBuildingCollision(nextX, nextZ, pad);
    if (Math.abs(resolved.x - nextX) > 0.05 || Math.abs(resolved.z - nextZ) > 0.05) {
      veh.speed *= 0.25;
    }
    veh.x = resolved.x;
    veh.z = resolved.z;
    veh.y = Math.max(-0.4, groundHeightAt(veh.x, veh.z));

    veh.model.group.position.set(veh.x, veh.y, veh.z);
    veh.model.group.rotation.y = veh.yaw;

    // Spin wheels
    const wheelSpin = veh.speed * dt * 2.5;
    for (const w of veh.model.wheels) {
      w.rotation.x += wheelSpin;
    }

    // Position Bagas on open vehicles (motorcycles & bicycle) or hide inside closed cabins
    if (veh.model.isOpenRide) {
      this.playerRig.group.visible = true;
      const cosY = Math.cos(veh.yaw);
      const sinY = Math.sin(veh.yaw);
      this.playerRig.group.position.set(
        veh.x + sinY * veh.model.seatZ,
        veh.y + veh.model.seatY - 0.55,
        veh.z + cosY * veh.model.seatZ
      );
      this.playerRig.group.rotation.y = veh.yaw;
      this.playerRig.bodyGroup.position.y = 0;
      this.playerRig.leftLeg.rotation.x = -0.95;
      this.playerRig.rightLeg.rotation.x = -0.95;
      this.playerRig.leftKnee.rotation.x = 1.05;
      this.playerRig.rightKnee.rotation.x = 1.05;
      this.playerRig.leftArm.rotation.x = -0.65;
      this.playerRig.rightArm.rotation.x = -0.65;
      this.playerRig.leftElbow.rotation.x = -0.45;
      this.playerRig.rightElbow.rotation.x = -0.45;
    } else {
      this.playerRig.group.visible = false;
    }

    this.playerX = veh.x;
    this.playerY = veh.y;
    this.playerZ = veh.z;
    this.playerYaw = veh.yaw;
    this.state.playerX = veh.x;
    this.state.playerY = veh.y;
    this.state.playerZ = veh.z;
    this.state.playerYaw = veh.yaw;
    this.state.speedKmh = Math.round(Math.abs(veh.speed) * 3.6);

    // Gentle auto-chase camera alignment behind moving vehicle when not dragging
    if (!this.isDraggingCamera && Math.abs(veh.speed) > 2.5) {
      const targetCamYaw = veh.yaw + Math.PI;
      this.camYaw = this.lerpAngle(this.camYaw, targetCamYaw, Math.min(1, 2.2 * dt));
    }
  }

  private updateTraffic(dt: number) {
    for (const v of this.vehicles) {
      if (!v.isTraffic || v === this.currentVehicle) continue;
      const wp = TRAFFIC_LOOP[v.trafficIndex];
      const dx = wp.x - v.x;
      const dz = wp.z - v.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 4.5) {
        v.trafficIndex = (v.trafficIndex + 1) % TRAFFIC_LOOP.length;
      }

      // Slow down if Bagas or player vehicle is right in front
      const playerDist = Math.hypot(this.playerX - v.x, this.playerZ - v.z);
      const targetSpeed = playerDist < 9 ? 0 : 8.5;
      v.speed = THREE.MathUtils.damp(v.speed, targetSpeed, 4, dt);

      const targetYaw = Math.atan2(dx, dz);
      v.yaw = this.lerpAngle(v.yaw, targetYaw, Math.min(1, 4.5 * dt));

      v.x += Math.sin(v.yaw) * v.speed * dt;
      v.z += Math.cos(v.yaw) * v.speed * dt;
      v.y = groundHeightAt(v.x, v.z);
      v.model.group.position.set(v.x, v.y, v.z);
      v.model.group.rotation.y = v.yaw;

      for (const w of v.model.wheels) {
        w.rotation.x += v.speed * dt * 2.2;
      }
    }
  }

  private updateNpcs(dt: number) {
    const isNight = this.state.timeOfDay < 5.5 || this.state.timeOfDay > 19.5;
    for (const npc of this.npcs) {
      const distSq = (this.playerX - npc.x) ** 2 + (this.playerZ - npc.z) ** 2;
      // Hide distant NPCs (> 135m) to save GPU draw calls
      if (distSq > 18225) {
        npc.rig.group.visible = false;
        continue;
      }
      npc.rig.group.visible = true;

      if (npc.spawn.patrolRadius && npc.spawn.patrolRadius > 0) {
        const walkSpeed = isNight ? 0.25 : 0.65;
        npc.patrolAngle += dt * walkSpeed * 0.45;
        const tx = npc.spawn.x + Math.cos(npc.patrolAngle) * npc.spawn.patrolRadius;
        const tz = npc.spawn.z + Math.sin(npc.patrolAngle) * npc.spawn.patrolRadius;
        const dx = tx - npc.x;
        const dz = tz - npc.z;
        npc.x += dx * dt * 0.7;
        npc.z += dz * dt * 0.7;
        npc.y = groundHeightAt(npc.x, npc.z);
        npc.yaw = Math.atan2(dx, dz);
        npc.rig.group.position.set(npc.x, npc.y, npc.z);
        npc.rig.group.rotation.y = npc.yaw;

        // Only animate limbs when within 80m
        if (distSq < 6400) {
          const swing = Math.sin(this.elapsedTotal * 4.5 + npc.patrolAngle) * 0.35;
          npc.rig.bodyGroup.position.y = Math.abs(Math.sin(this.elapsedTotal * 4.5 + npc.patrolAngle)) * 0.02;
          npc.rig.leftLeg.rotation.x = swing;
          npc.rig.rightLeg.rotation.x = -swing;
          npc.rig.leftKnee.rotation.x = Math.max(0, -swing * 0.7);
          npc.rig.rightKnee.rotation.x = Math.max(0, swing * 0.7);
          npc.rig.leftArm.rotation.x = -swing * 0.7;
          npc.rig.rightArm.rotation.x = swing * 0.7;
          npc.rig.leftElbow.rotation.x = -0.25;
          npc.rig.rightElbow.rotation.x = -0.25;
        }
      } else if (distSq < 36) {
        const faceYaw = Math.atan2(this.playerX - npc.x, this.playerZ - npc.z);
        npc.rig.group.rotation.y = this.lerpAngle(npc.rig.group.rotation.y, faceYaw, Math.min(1, 5 * dt));
      }
    }
  }

  private updateCamera(dt: number) {
    const dist = this.currentVehicle
      ? this.currentVehicle.type === 'bus'
        ? 12.5
        : this.currentVehicle.type === 'truk'
          ? 10.5
          : 8.2
      : 5.6;
    const heightOffset = this.currentVehicle ? 2.4 : 1.7;

    // Speed-based FOV widening
    const targetFov = 60 + Math.min(16, this.state.speedKmh * 0.14);
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, dt);
      this.camera.updateProjectionMatrix();
    }

    const horizDist = dist * Math.cos(this.camPitch);
    const vertDist = dist * Math.sin(this.camPitch) + heightOffset;

    _camIdeal.set(
      this.playerX + Math.sin(this.camYaw) * horizDist,
      Math.max(groundHeightAt(this.playerX, this.playerZ) + 1.2, this.playerY + vertDist),
      this.playerZ + Math.cos(this.camYaw) * horizDist
    );

    const smooth = 1 - Math.exp(-10 * dt);
    this.camera.position.lerp(_camIdeal, smooth);
    _camTarget.set(this.playerX, this.playerY + (this.currentVehicle ? 1.4 : 1.5), this.playerZ);
    this.camera.lookAt(_camTarget);
  }

  private resolveBuildingCollision(x: number, z: number, radius: number): { x: number; z: number } {
    let rx = x;
    let rz = z;
    for (const c of this.colliders) {
      const minX = c.x - c.halfW - radius;
      const maxX = c.x + c.halfW + radius;
      const minZ = c.z - c.halfD - radius;
      const maxZ = c.z + c.halfD + radius;
      if (rx > minX && rx < maxX && rz > minZ && rz < maxZ) {
        const dLeft = Math.abs(rx - minX);
        const dRight = Math.abs(maxX - rx);
        const dBack = Math.abs(rz - minZ);
        const dFront = Math.abs(maxZ - rz);
        const m = Math.min(dLeft, dRight, dBack, dFront);
        if (m === dLeft) rx = minX;
        else if (m === dRight) rx = maxX;
        else if (m === dBack) rz = minZ;
        else rz = maxZ;
      }
    }
    return { x: rx, z: rz };
  }

  private lerpAngle(a: number, b: number, tAmt: number): number {
    let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * tAmt;
  }

  private updateInteractPrompt() {
    let prompt: InteractPrompt | null = null;

    if (!this.currentVehicle) {
      // Check nearest NPC within 3.8m
      let bestNpcDist = 3.8;
      for (const npc of this.npcs) {
        const d = Math.hypot(this.playerX - npc.x, this.playerZ - npc.z);
        if (d < bestNpcDist) {
          bestNpcDist = d;
          prompt = {
            id: `npc_${npc.spawn.id}`,
            kind: 'npc',
            npcId: npc.spawn.id,
            shopId: npc.spawn.shopId,
            label: {
              ngoko: `Ngomong karo ${npc.spawn.name}`,
              krama: `Matur kaliyan ${npc.spawn.name}`,
              indonesia: `Bicara dengan ${npc.spawn.name}`,
            },
            sublabel: t(npc.spawn.role, this.state.language),
            targetX: npc.x,
            targetZ: npc.z,
          };
        }
      }

      // Check nearest Vehicle within 4.2m if no closer NPC
      if (!prompt) {
        let bestVehDist = 4.2;
        for (const v of this.vehicles) {
          const d = Math.hypot(this.playerX - v.x, this.playerZ - v.z);
          if (d < bestVehDist) {
            bestVehDist = d;
            const vInfo = VEHICLE_LABELS[v.type];
            prompt = {
              id: `veh_${v.id}`,
              kind: 'vehicle',
              vehicleId: v.id,
              label: {
                ngoko: `Numpak ${vInfo.name}`,
                krama: `Nitih ${vInfo.name}`,
                indonesia: `Naik ${vInfo.name}`,
              },
              sublabel: 'Tekan F / E',
              targetX: v.x,
              targetZ: v.z,
            };
          }
        }
      }
    }

    this.state.interactPrompt = prompt;
  }

  public triggerInteract() {
    if (this.state.screen !== 'playing') return;
    const prompt = this.state.interactPrompt;
    if (!prompt) return;

    if (prompt.kind === 'vehicle' && prompt.vehicleId) {
      this.toggleVehicle(prompt.vehicleId);
      return;
    }

    if (prompt.kind === 'npc' && prompt.npcId) {
      this.openNpcDialogue(prompt.npcId);
    }
  }

  public toggleVehicle(explicitId?: string) {
    if (this.currentVehicle) {
      // Exit vehicle safely to the left
      const veh = this.currentVehicle;
      veh.speed = 0;
      const exitX = veh.x - Math.cos(veh.yaw) * (veh.model.halfW + 1.1);
      const exitZ = veh.z + Math.sin(veh.yaw) * (veh.model.halfW + 1.1);
      const resolved = this.resolveBuildingCollision(exitX, exitZ, 0.5);
      this.playerX = resolved.x;
      this.playerZ = resolved.z;
      this.playerY = groundHeightAt(this.playerX, this.playerZ);
      this.playerRig.group.visible = true;
      this.currentVehicle = null;
      this.state.inVehicle = false;
      this.state.vehicleName = '';
      this.state.vehicleType = null;
      this.state.speedKmh = 0;
      this.emitHud();
      return;
    }

    // Find closest vehicle
    let target: VehicleRuntime | null = null;
    if (explicitId) {
      target = this.vehicles.find((v) => v.id === explicitId) ?? null;
    } else {
      let best = 4.6;
      for (const v of this.vehicles) {
        const d = Math.hypot(this.playerX - v.x, this.playerZ - v.z);
        if (d < best) {
          best = d;
          target = v;
        }
      }
    }

    if (target) {
      target.isTraffic = false; // Player takes control
      this.currentVehicle = target;
      this.state.inVehicle = true;
      this.state.vehicleName = VEHICLE_LABELS[target.type].name;
      this.state.vehicleType = target.type;
      this.audio.playChime();
      this.showToast(`Numpak ${VEHICLE_LABELS[target.type].name}`);
      this.emitHud();
    }
  }

  private openNpcDialogue(npcId: string) {
    const npc = this.npcs.find((n) => n.spawn.id === npcId);
    if (!npc) return;

    this.audio.playChime();
    const activeMission = this.getActiveMission();
    const activeStep = activeMission ? activeMission.steps[this.state.activeStepIndex] : null;

    // 1. Check if this NPC completes the current active mission step!
    if (activeMission && activeStep && activeStep.type === 'talk' && activeStep.targetNpcId === npcId) {
      const isLastStep = this.state.activeStepIndex >= activeMission.steps.length - 1;
      if (isLastStep) {
        this.completeActiveMission();
        const dialogue: ActiveDialogue = {
          npcId,
          npcName: npc.spawn.name,
          npcRole: npc.spawn.role,
          region: npc.spawn.region,
          text: activeMission.completeDialogue,
          options: [
            {
              label: { ngoko: 'Sami-sami, matur nuwun!', krama: 'Sami-sami, matur nuwun!', indonesia: 'Sama-sama, terima kasih!' },
              action: 'close',
            },
          ],
        };
        this.state.activeDialogue = dialogue;
        this.emitHud();
        return;
      } else {
        this.advanceMissionStep();
        const dialogue: ActiveDialogue = {
          npcId,
          npcName: npc.spawn.name,
          npcRole: npc.spawn.role,
          region: npc.spawn.region,
          text: {
            ngoko: 'Apik Mas Bagas! Iki barang wis siap, saiki langsung terusna menyang tujuan sabanjure ya!',
            krama: 'Sae sanget Mas Bagas! Punika sampun siap, sakmenika langsung dipun lajengaken dhateng tujuan salajengipun!',
            indonesia: 'Bagus Mas Bagas! Ini sudah siap, sekarang lanjutkan ke tujuan berikutnya ya!',
          },
          options: [
            {
              label: { ngoko: 'Siap, tak terusake!', krama: 'Inggih, sendika dawuh!', indonesia: 'Siap, saya lanjutkan!' },
              action: 'close',
            },
          ],
        };
        this.state.activeDialogue = dialogue;
        this.emitHud();
        return;
      }
    }

    // 2. Check if NPC offers an uncompleted mission
    const availableMission = MISSIONS.find(
      (m) =>
        m.giverNpcId === npcId &&
        !this.state.completedMissionIds.includes(m.id) &&
        this.state.activeMissionId !== m.id
    );

    const options: ActiveDialogue['options'] = [];

    if (availableMission) {
      options.push({
        label: {
          ngoko: `Tampani Misi: ${availableMission.title.ngoko}`,
          krama: `Tampi Ayahan: ${availableMission.title.krama}`,
          indonesia: `Terima Misi: ${availableMission.title.indonesia}`,
        },
        action: 'accept_mission',
        missionId: availableMission.id,
      });
    }

    if (npc.spawn.shopId) {
      options.push({
        label: {
          ngoko: 'Bukak Warung / Toko',
          krama: 'Bikak Wande / Toko',
          indonesia: 'Buka Warung / Toko',
        },
        action: 'open_shop',
        shopId: npc.spawn.shopId,
      });
    }

    options.push({
      label: {
        ngoko: 'Takon arah sekitar kene',
        krama: 'Nyuwun pirsa arah mriki',
        indonesia: 'Tanya arah sekitar sini',
      },
      action: 'ask_direction',
      reply: {
        ngoko: 'Oalah, nek arep menyang Pasar utawa Alun-alun Kota Mojosari, tinggal melu dalan aspal ngulon-ngetan iki wae. Ati-ati ing dalan!',
        krama: 'Oalah, menawi badhe dhateng Peken utawi Alun-alun Kitha Mojosari, ndherek margi aspal punika kemawon. Ngatos-atos!',
        indonesia: 'Kalau mau ke Pasar atau Alun-alun Kota Mojosari, ikuti saja jalan aspal utama ini ke arah timur. Hati-hati di jalan!',
      },
    });

    options.push({
      label: { ngoko: 'Pamit dhisik', krama: 'Nyuwun pamit rumiyin', indonesia: 'Pamit dulu' },
      action: 'close',
    });

    const quote = availableMission
      ? availableMission.startDialogue
      : npc.spawn.ambientQuotes[Math.floor(Math.random() * npc.spawn.ambientQuotes.length)];

    this.state.activeDialogue = {
      npcId,
      npcName: npc.spawn.name,
      npcRole: npc.spawn.role,
      region: npc.spawn.region,
      text: quote,
      options,
    };
    this.emitHud();
  }

  public chooseDialogueOption(idx: number) {
    const dlg = this.state.activeDialogue;
    if (!dlg) return;
    const opt = dlg.options[idx];
    if (!opt) return;

    if (opt.action === 'close') {
      this.closeDialogue();
    } else if (opt.action === 'accept_mission' && opt.missionId) {
      this.startMission(opt.missionId);
      this.closeDialogue();
    } else if (opt.action === 'open_shop' && opt.shopId) {
      this.state.activeDialogue = null;
      this.state.activeShopId = opt.shopId;
      this.emitHud();
    } else if (opt.action === 'ask_direction' && opt.reply) {
      this.state.activeDialogue = {
        ...dlg,
        text: opt.reply,
        options: [
          {
            label: { ngoko: 'Matur nuwun infone!', krama: 'Matur nuwun pangandikanipun!', indonesia: 'Terima kasih infonya!' },
            action: 'close',
          },
        ],
      };
      this.emitHud();
    }
  }

  public closeDialogue() {
    this.state.activeDialogue = null;
    this.emitHud();
  }

  public closeShop() {
    this.state.activeShopId = null;
    this.emitHud();
  }

  public startMission(missionId: string) {
    const m = MISSIONS.find((x) => x.id === missionId);
    if (!m) return;
    this.state.activeMissionId = m.id;
    this.state.activeStepIndex = 0;
    if (m.id === 'misi_2_kambing') {
      this.lostGoatCollected = false;
    }
    this.updateGpsTarget();
    this.audio.playChime();
    this.showToast(`${m.code}: ${t(m.title, this.state.language)}`);
    this.emitHud();
  }

  private checkMissionStepProgress() {
    const m = this.getActiveMission();
    if (!m) return;
    const step = m.steps[this.state.activeStepIndex];
    if (!step) return;

    const dist = Math.hypot(this.playerX - step.targetX, this.playerZ - step.targetZ);
    if (dist > step.targetRadius) return;

    if (step.type === 'goto' || step.type === 'collect' || step.type === 'escort_vehicle') {
      if (step.type === 'escort_vehicle' && !this.currentVehicle) {
        return; // Needs to arrive on a vehicle
      }
      if (m.id === 'misi_2_kambing' && step.id === 'm2_s1') {
        this.lostGoatCollected = true;
        this.showToast('Wedhus ketemu! Gawa balik menyang Pak Karjo!');
      }
      if (m.id === 'misi_5_nelayan' && step.id === 'm5_s1') {
        this.missionPropFishCrate.visible = false;
        this.showToast('Peti iwak dijupuk! Kirim menyang TPI Pesisir!');
      }

      if (this.state.activeStepIndex >= m.steps.length - 1) {
        this.completeActiveMission();
      } else {
        this.advanceMissionStep();
      }
    }
  }

  private advanceMissionStep() {
    this.state.activeStepIndex += 1;
    this.audio.playChime();
    this.updateGpsTarget();
    const m = this.getActiveMission();
    if (m) {
      const s = m.steps[this.state.activeStepIndex];
      if (s) this.showToast(t(s.title, this.state.language));
    }
    this.emitHud();
  }

  private completeActiveMission() {
    const m = this.getActiveMission();
    if (!m) return;
    if (!this.state.completedMissionIds.includes(m.id)) {
      this.state.completedMissionIds.push(m.id);
    }
    this.state.money += m.rewardMoney;
    this.state.reputation += m.rewardRep;
    this.gainXp(m.rewardXp);
    this.audio.playMissionFanfare();
    this.showToast(
      `Misi Rampung! +Rp ${m.rewardMoney.toLocaleString('id-ID')} · +${m.rewardXp} XP · +${m.rewardRep} Reputasi`
    );

    // Auto-select next uncompleted mission if available
    const nextMission = MISSIONS.find((x) => !this.state.completedMissionIds.includes(x.id));
    this.state.activeMissionId = nextMission ? nextMission.id : null;
    this.state.activeStepIndex = 0;
    this.missionPropFishCrate.visible = true;
    this.updateGpsTarget();
    this.saveGame(true);
    this.emitHud();
  }

  private gainXp(amount: number) {
    this.state.xp += amount;
    const nextLevel = 1 + Math.floor(this.state.xp / 250);
    if (nextLevel > this.state.level) {
      this.state.level = nextLevel;
      this.state.maxHealth = 100 + (nextLevel - 1) * 10;
      this.state.health = this.state.maxHealth;
    }
  }

  private getActiveMission(): MissionDef | null {
    if (!this.state.activeMissionId) return null;
    return MISSIONS.find((m) => m.id === this.state.activeMissionId) ?? null;
  }

  private updateGpsTarget() {
    const m = this.getActiveMission();
    if (m) {
      const s = m.steps[this.state.activeStepIndex];
      if (s) {
        this.state.gpsTarget = {
          x: s.targetX,
          z: s.targetZ,
          label: s.waypointLabel || t(s.title, this.state.language),
        };
        return;
      }
    }
    this.state.gpsTarget = null;
  }

  public setCustomGpsTarget(x: number, z: number, label: string) {
    this.state.gpsTarget = { x, z, label };
    this.showToast(`GPS diarahake menyang: ${label}`);
    this.emitHud();
  }

  public buyShopItem(shopId: string, itemId: string) {
    const shop = SHOPS[shopId];
    if (!shop) return;
    const item = shop.items.find((i) => i.id === itemId);
    if (!item) return;

    if (this.state.money < item.price) {
      this.showToast('Dhuwite durung cukup, Mas!');
      return;
    }

    this.state.money -= item.price;
    this.audio.playChime();

    if (item.category === 'pakaian' && item.outfitId) {
      if (!this.state.ownedOutfits.includes(item.outfitId)) {
        this.state.ownedOutfits.push(item.outfitId);
      }
      this.equipOutfit(item.outfitId);
      this.showToast(`Klambi anyar dipasang: ${t(item.name, this.state.language)}`);
    } else if (item.category === 'kendaraan' && item.vehicleType) {
      this.spawnPurchasedVehicle(item.vehicleType);
      this.showToast(`${t(item.name, this.state.language)} wis siap ing cedhak bengkel!`);
      this.closeShop();
    } else {
      const existing = this.state.inventory.find((inv) => inv.id === item.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        this.state.inventory.push({
          id: item.id,
          name: item.name,
          category: item.category === 'makanan' ? 'makanan' : 'perlengkapan',
          quantity: 1,
          healAmount: item.healAmount,
          staminaAmount: item.staminaAmount,
          description: item.description,
        });
      }
      this.showToast(`Tuku sukses: ${t(item.name, this.state.language)}`);
    }
    this.emitHud();
  }

  private spawnPurchasedVehicle(type: VehicleType) {
    const sx = this.playerX + 4.5;
    const sz = this.playerZ + 4.5;
    const colors: Record<VehicleType, number> = {
      motor_bebek: 0xdc2626,
      motor_matic: 0x0284c7,
      motor_sport: 0x16a34a,
      mobil_keluarga: 0xe2e8f0,
      pickup: 0x1e293b,
      truk: 0xeab308,
      bus: 0xf59e0b,
      sepeda: 0x334155,
    };
    const model = createVehicleModel(type, colors[type]);
    const gy = groundHeightAt(sx, sz);
    model.group.position.set(sx, gy, sz);
    this.scene.add(model.group);
    this.vehicles.push({
      id: `owned_${Date.now()}`,
      type,
      model,
      x: sx,
      y: gy,
      z: sz,
      yaw: 0,
      speed: 0,
      isTraffic: false,
      trafficIndex: 0,
    });
  }

  public useInventoryItem(itemId: string) {
    const idx = this.state.inventory.findIndex((i) => i.id === itemId);
    if (idx === -1) return;
    const item = this.state.inventory[idx];
    if (item.category !== 'makanan') {
      this.showToast(t(item.description, this.state.language));
      return;
    }

    this.state.health = Math.min(this.state.maxHealth, this.state.health + (item.healAmount ?? 25));
    this.state.stamina = Math.min(this.state.maxStamina, this.state.stamina + (item.staminaAmount ?? 30));
    item.quantity -= 1;
    if (item.quantity <= 0) {
      this.state.inventory.splice(idx, 1);
    }
    this.audio.playChime();
    this.showToast(`Mangan ${t(item.name, this.state.language)} (+Tenaga & Waras)`);
    this.emitHud();
  }

  public equipOutfit(outfit: OutfitId) {
    if (!this.state.ownedOutfits.includes(outfit)) return;
    this.state.outfit = outfit;
    applyOutfitToRig(this.playerRig, outfit, this.textures);
    this.emitHud();
  }

  public setLanguage(lang: LanguageMode) {
    this.state.language = lang;
    this.updateGpsTarget();
    this.emitHud();
  }

  public setWeather(weather: WeatherType) {
    this.state.weather = weather;
    this.showToast(weather === 'hujan' ? 'Langit mendhung, udan deres mulai mudhun...' : 'Cuaca bali cerah lan padhang.');
    this.emitHud();
  }

  public setTimeOfDay(hour: number) {
    this.state.timeOfDay = ((hour % 24) + 24) % 24;
    this.emitHud();
  }

  public setAudioMuted(muted: boolean) {
    this.audio.init();
    this.audio.setMuted(muted);
    this.state.audioMuted = muted;
    this.emitHud();
  }

  public setGamelanEnabled(enabled: boolean) {
    this.audio.init();
    this.audio.setGamelanEnabled(enabled);
    this.state.gamelanEnabled = enabled;
    this.emitHud();
  }

  public setGraphicsMode(mode: 'lancar' | 'seimbang' | 'tinggi') {
    this.state.graphicsMode = mode;
    if (this.isSoftwareGl) {
      this.emitHud();
      return;
    }
    if (mode === 'lancar') {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      this.sunLight.castShadow = false;
    } else if (mode === 'seimbang') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
      this.renderer.shadowMap.enabled = true;
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(768, 768);
      this.sunLight.shadow.map?.dispose();
      this.sunLight.shadow.map = null;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      this.renderer.shadowMap.enabled = true;
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(1024, 1024);
      this.sunLight.shadow.map?.dispose();
      this.sunLight.shadow.map = null;
    }
    this.handleResize();
    this.showToast(
      mode === 'lancar'
        ? 'Mode Grafis: Lancar (FPS Maksimal)'
        : mode === 'seimbang'
          ? 'Mode Grafis: Seimbang'
          : 'Mode Grafis: Tinggi'
    );
    this.emitHud();
  }

  public setVirtualMove(x: number, y: number) {
    this.virtualMove.x = x;
    this.virtualMove.y = y;
  }

  public setScreen(screen: 'menu' | 'playing' | 'paused') {
    this.audio.init();
    this.state.screen = screen;
    this.emitHud();
  }

  public startNewGame() {
    this.audio.init();
    if (this.currentVehicle) this.toggleVehicle();
    this.playerX = -12;
    this.playerZ = 10;
    this.playerY = groundHeightAt(this.playerX, this.playerZ);
    this.playerYaw = 0;
    this.lostGoatCollected = false;
    this.state = {
      ...this.state,
      screen: 'playing',
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      money: 50000,
      xp: 0,
      level: 1,
      reputation: 10,
      region: 'desa',
      timeOfDay: 8.5,
      weather: 'cerah',
      outfit: 'kasual',
      ownedOutfits: ['kasual'],
      inventory: structuredClone(INITIAL_INVENTORY),
      activeMissionId: 'misi_1_tangga',
      activeStepIndex: 0,
      completedMissionIds: [],
      discoveredLandmarks: ['lm_desa'],
      activeDialogue: null,
      activeShopId: null,
    };
    applyOutfitToRig(this.playerRig, 'kasual', this.textures);
    this.updateGpsTarget();
    this.showToast('Sugeng rawuh ing Desa Sukamaju, Bagas!');
    this.emitHud();
  }

  public saveGame(silent = false) {
    const payload: SaveData = {
      version: 1,
      savedAt: new Date().toISOString(),
      language: this.state.language,
      health: this.state.health,
      stamina: this.state.stamina,
      money: this.state.money,
      xp: this.state.xp,
      reputation: this.state.reputation,
      timeOfDay: this.state.timeOfDay,
      weather: this.state.weather,
      playerX: this.playerX,
      playerZ: this.playerZ,
      outfit: this.state.outfit,
      ownedOutfits: this.state.ownedOutfits,
      inventory: this.state.inventory,
      activeMissionId: this.state.activeMissionId,
      activeStepIndex: this.state.activeStepIndex,
      completedMissionIds: this.state.completedMissionIds,
      discoveredLandmarks: this.state.discoveredLandmarks,
    };
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
    this.state.hasSaveData = true;
    if (!silent) {
      this.audio.playChime();
      this.showToast('Progress game wis disimpen!');
    }
    this.emitHud();
  }

  public loadGame(): boolean {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw) as SaveData;
      if (this.currentVehicle) this.toggleVehicle();
      this.playerX = data.playerX ?? -12;
      this.playerZ = data.playerZ ?? 10;
      this.playerY = groundHeightAt(this.playerX, this.playerZ);

      this.state.language = data.language ?? 'ngoko';
      this.state.health = data.health ?? 100;
      this.state.stamina = data.stamina ?? 100;
      this.state.money = data.money ?? 50000;
      this.state.xp = data.xp ?? 0;
      this.state.level = 1 + Math.floor(this.state.xp / 250);
      this.state.maxHealth = 100 + (this.state.level - 1) * 10;
      this.state.reputation = data.reputation ?? 10;
      this.state.timeOfDay = data.timeOfDay ?? 8.5;
      this.state.weather = data.weather ?? 'cerah';
      this.state.outfit = data.outfit ?? 'kasual';
      this.state.ownedOutfits = data.ownedOutfits ?? ['kasual'];
      this.state.inventory = data.inventory ?? structuredClone(INITIAL_INVENTORY);
      this.state.activeMissionId = data.activeMissionId ?? null;
      this.state.activeStepIndex = data.activeStepIndex ?? 0;
      this.state.completedMissionIds = data.completedMissionIds ?? [];
      this.state.discoveredLandmarks = data.discoveredLandmarks ?? ['lm_desa'];
      this.state.screen = 'playing';
      this.state.activeDialogue = null;
      this.state.activeShopId = null;

      applyOutfitToRig(this.playerRig, this.state.outfit, this.textures);
      this.updateGpsTarget();
      this.showToast('Sugeng rawuh malih ing Tanah Jawa!');
      this.emitHud();
      return true;
    } catch {
      return false;
    }
  }

  public teleportToLandmark(x: number, z: number, label: string) {
    if (this.currentVehicle) this.toggleVehicle();
    this.playerX = x;
    this.playerZ = z;
    this.playerY = groundHeightAt(x, z);
    this.showToast(`Pindhah menyang ${label}`);
    this.emitHud();
  }

  private showToast(msg: string) {
    this.state.toastMessage = msg;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = window.setTimeout(() => {
      this.state.toastMessage = null;
      this.emitHud();
    }, 4000);
  }

  private emitHud() {
    const entities: MinimapEntity[] = [];
    for (const n of this.npcs) {
      entities.push({ x: n.x, z: n.z, kind: 'npc', label: n.spawn.name });
    }
    for (const v of this.vehicles) {
      if (!v.isTraffic) {
        entities.push({ x: v.x, z: v.z, kind: 'vehicle' });
      }
    }
    for (const lm of LANDMARKS) {
      entities.push({ x: lm.x, z: lm.z, kind: 'landmark', label: lm.name });
    }
    if (this.state.gpsTarget) {
      entities.push({ x: this.state.gpsTarget.x, z: this.state.gpsTarget.z, kind: 'mission' });
    }

    this.state.minimapEntities = entities;
    this.onHudUpdate({ ...this.state });
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.audio.dispose();
  }
}
