export type LanguageMode = 'ngoko' | 'krama' | 'indonesia';

export type RegionId = 'desa' | 'kota' | 'pegunungan' | 'pesisir' | 'wisata';

export type WeatherType = 'cerah' | 'hujan';

export type VehicleType =
  | 'motor_bebek'
  | 'motor_matic'
  | 'motor_sport'
  | 'mobil_keluarga'
  | 'pickup'
  | 'truk'
  | 'bus'
  | 'sepeda';

export type OutfitId = 'kasual' | 'batik' | 'jaket_motor' | 'lurik';

export type LocalizedText = {
  ngoko: string;
  krama: string;
  indonesia: string;
};

export interface InventoryItem {
  id: string;
  name: LocalizedText;
  category: 'makanan' | 'barang_misi' | 'perlengkapan';
  quantity: number;
  healAmount?: number;
  staminaAmount?: number;
  description: LocalizedText;
}

export interface ShopItem {
  id: string;
  name: LocalizedText;
  category: 'makanan' | 'pakaian' | 'kendaraan' | 'perlengkapan';
  price: number;
  healAmount?: number;
  staminaAmount?: number;
  outfitId?: OutfitId;
  vehicleType?: VehicleType;
  description: LocalizedText;
}

export interface MissionStep {
  id: string;
  title: LocalizedText;
  objective: LocalizedText;
  targetX: number;
  targetZ: number;
  targetRadius: number;
  type: 'goto' | 'talk' | 'deliver' | 'collect' | 'escort_vehicle';
  targetNpcId?: string;
  requiredVehicleCategory?: 'motor' | 'any';
  waypointLabel?: string;
}

export interface MissionDef {
  id: string;
  code: string;
  title: LocalizedText;
  giverNpcId: string;
  giverName: string;
  region: RegionId;
  summary: LocalizedText;
  rewardMoney: number;
  rewardXp: number;
  rewardRep: number;
  steps: MissionStep[];
  startDialogue: LocalizedText;
  completeDialogue: LocalizedText;
}

export interface DialogueOption {
  label: LocalizedText;
  action: 'next' | 'accept_mission' | 'open_shop' | 'ask_direction' | 'close';
  reply?: LocalizedText;
  missionId?: string;
  shopId?: string;
}

export interface ActiveDialogue {
  npcId: string;
  npcName: string;
  npcRole: LocalizedText;
  region: RegionId;
  text: LocalizedText;
  options: DialogueOption[];
}

export interface LandmarkPoint {
  id: string;
  name: string;
  region: RegionId;
  x: number;
  z: number;
  type: 'desa' | 'pasar' | 'spbu' | 'wisata' | 'pantai' | 'gunung' | 'toko' | 'bengkel' | 'polisi' | 'rs';
  shopId?: string;
}

export interface InteractPrompt {
  id: string;
  kind: 'npc' | 'vehicle' | 'shop' | 'mission_item' | 'landmark';
  label: LocalizedText;
  sublabel?: string;
  targetX: number;
  targetZ: number;
  vehicleId?: string;
  npcId?: string;
  shopId?: string;
}

export interface MinimapEntity {
  x: number;
  z: number;
  kind: 'npc' | 'vehicle' | 'mission' | 'landmark' | 'goat';
  label?: string;
}

export interface GameHudState {
  screen: 'menu' | 'playing' | 'paused';
  language: LanguageMode;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  money: number;
  xp: number;
  level: number;
  reputation: number;
  region: RegionId;
  timeOfDay: number; // 0..24 hours
  weather: WeatherType;
  playerX: number;
  playerY: number;
  playerZ: number;
  playerYaw: number;
  inVehicle: boolean;
  vehicleName: string;
  vehicleType: VehicleType | null;
  speedKmh: number;
  outfit: OutfitId;
  ownedOutfits: OutfitId[];
  inventory: InventoryItem[];
  activeMissionId: string | null;
  activeStepIndex: number;
  completedMissionIds: string[];
  discoveredLandmarks: string[];
  gpsTarget: { x: number; z: number; label: string } | null;
  interactPrompt: InteractPrompt | null;
  activeDialogue: ActiveDialogue | null;
  activeShopId: string | null;
  toastMessage: string | null;
  minimapEntities: MinimapEntity[];
  audioMuted: boolean;
  gamelanEnabled: boolean;
  graphicsMode: 'lancar' | 'seimbang' | 'tinggi';
  hasSaveData: boolean;
}

export interface SaveData {
  version: number;
  savedAt: string;
  language: LanguageMode;
  health: number;
  stamina: number;
  money: number;
  xp: number;
  reputation: number;
  timeOfDay: number;
  weather: WeatherType;
  playerX: number;
  playerZ: number;
  outfit: OutfitId;
  ownedOutfits: OutfitId[];
  inventory: InventoryItem[];
  activeMissionId: string | null;
  activeStepIndex: number;
  completedMissionIds: string[];
  discoveredLandmarks: string[];
}
