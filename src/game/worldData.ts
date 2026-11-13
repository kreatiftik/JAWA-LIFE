import { LandmarkPoint, LocalizedText, RegionId, VehicleType } from './types';

export interface RoadSegment {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  width: number;
  paved: boolean;
}

export interface BuildingCollider {
  x: number;
  z: number;
  halfW: number;
  halfD: number;
  height: number;
}

export interface NpcSpawn {
  id: string;
  name: string;
  role: LocalizedText;
  region: RegionId;
  x: number;
  z: number;
  yaw: number;
  shirtColor: number;
  pantsColor: number;
  hatType?: 'caping' | 'peci' | 'polisi' | 'none';
  shopId?: string;
  missionGiverId?: string;
  ambientQuotes: LocalizedText[];
  patrolRadius?: number;
}

export interface VehicleSpawn {
  id: string;
  type: VehicleType;
  x: number;
  z: number;
  yaw: number;
  color: number;
}

export const WORLD_PLAY_LIMIT = 248;

export const ROAD_SEGMENTS: RoadSegment[] = [
  // Main East-West Highway: Desa <-> Kota
  { x1: -65, z1: 0, x2: 185, z2: 0, width: 10, paved: true },
  // Desa North-South Village Road
  { x1: -12, z1: -55, x2: -12, z2: 65, width: 7, paved: false },
  // Desa West Road to Balai Desa & Peternakan
  { x1: -55, z1: -45, x2: -55, z2: 55, width: 6.5, paved: false },
  { x1: -65, z1: -42, x2: -12, z2: -42, width: 6, paved: false },
  // Desa to Sawah Bridge & Wisata Southwest
  { x1: -55, z1: 52, x2: -140, z2: 145, width: 6.5, paved: false },
  { x1: -140, z1: 145, x2: -95, z2: 185, width: 6, paved: false },
  // Kota North-South Avenues
  { x1: 88, z1: -72, x2: 88, z2: 75, width: 10, paved: true },
  { x1: 145, z1: -72, x2: 145, z2: 75, width: 10, paved: true },
  { x1: 185, z1: -65, x2: 185, z2: 65, width: 9, paved: true },
  // Kota East-West Streets
  { x1: 75, z1: -58, x2: 185, z2: -58, width: 9, paved: true },
  { x1: 75, z1: 42, x2: 185, z2: 42, width: 9, paved: true },
  // Kota South Highway to Pesisir Pantai Kidul
  { x1: 88, z1: 75, x2: 88, z2: 162, width: 9, paved: true },
  { x1: 45, z1: 158, x2: 155, z2: 158, width: 7.5, paved: true },
  // Mountain Road: Kota/Desa North up to Pegunungan Arjuno Air Terjun
  { x1: 20, z1: 0, x2: 20, z2: -75, width: 8, paved: true },
  { x1: 20, z1: -75, x2: -25, z2: -125, width: 7.5, paved: true },
  { x1: -25, z1: -125, x2: -70, z2: -176, width: 7, paved: true },
];

function distToSegment(px: number, pz: number, x1: number, z1: number, x2: number, z2: number): number {
  const vx = x2 - x1;
  const vz = z2 - z1;
  const wx = px - x1;
  const wz = pz - z1;
  const lenSq = vx * vx + vz * vz;
  if (lenSq < 0.0001) return Math.hypot(px - x1, pz - z1);
  const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / lenSq));
  const cx = x1 + t * vx;
  const cz = z1 + t * vz;
  return Math.hypot(px - cx, pz - cz);
}

export function isOnRoad(x: number, z: number): { onRoad: boolean; paved: boolean; dist: number } {
  let minD = 9999;
  let paved = false;
  let hit = false;
  for (const r of ROAD_SEGMENTS) {
    const d = distToSegment(x, z, r.x1, r.z1, r.x2, r.z2);
    if (d < r.width * 0.55) {
      hit = true;
      if (r.paved) paved = true;
    }
    if (d < minD) minD = d;
  }
  return { onRoad: hit, paved, dist: minD };
}

/**
 * Continuous deterministic terrain height across all regions of East Java map.
 * Flat around Desa & Kota for crisp road/building grounding, gently rising in Pegunungan,
 * dipping to beach & ocean in Pesisir, and dipping into Danau Ranu lake basin.
 */
export function groundHeightAt(x: number, z: number): number {
  let h = 0;

  // Pegunungan Arjuno (North, z < -85)
  if (z < -85) {
    const t = Math.min(1, (-85 - z) / 145);
    const ridge = t * t * 22 + Math.sin(x * 0.035) * 3.2 * t + Math.cos(z * 0.04) * 2.0 * t;
    // Keep mountain road corridor smoother
    const roadInfo = isOnRoad(x, z);
    const roadSmooth = roadInfo.dist < 10 ? 0.55 + 0.45 * (roadInfo.dist / 10) : 1;
    h += ridge * (0.72 + 0.28 * roadSmooth);
  }

  // Far outer mountain hills perimeter for natural world enclosure
  const radial = Math.hypot(x, z);
  if (radial > 250 && z < 165) {
    const edgeT = Math.min(1, (radial - 250) / 130);
    h += edgeT * edgeT * 28 + Math.sin(x * 0.05) * Math.cos(z * 0.05) * 4 * edgeT;
  }

  // Gentle rolling Desa hills on far west (x < -115, z < 100)
  if (x < -115 && z < 100) {
    const wt = Math.min(1, (-115 - x) / 110);
    h += Math.sin(z * 0.04) * 1.8 * wt + wt * 2.5;
  }

  // Danau Ranu volcanic lake depression at (-95, 200)
  const lakeDist = Math.hypot(x - -95, z - 202);
  if (lakeDist < 34) {
    const lt = 1 - lakeDist / 34;
    h -= lt * lt * 3.8;
  }

  // Kali Brantas river bed running near x = -72.. -80, z = -30..105
  if (z > -25 && z < 115) {
    const riverCenter = -78 + Math.sin(z * 0.05) * 8;
    const rd = Math.abs(x - riverCenter);
    if (rd < 7.5) {
      const rt = 1 - rd / 7.5;
      h -= rt * rt * 1.5;
    }
  }

  // Pesisir Pantai Kidul (South-East, z > 165, x > 10) slopes into sea
  if (z > 165 && x > 5) {
    const st = Math.min(1, (z - 165) / 55);
    h -= st * 2.8;
  }

  // Distant ocean south (z > 220)
  if (z > 220) {
    const ot = Math.min(1, (z - 220) / 40);
    h -= ot * 3.0;
  }

  return h;
}

export function getRegionAt(x: number, z: number): RegionId {
  if (z < -92) return 'pegunungan';
  if (z > 132 && x >= 15) return 'pesisir';
  if (x < -68 && z > 105) return 'wisata';
  if (x >= 55) return 'kota';
  return 'desa';
}

export const LANDMARKS: LandmarkPoint[] = [
  { id: 'lm_desa', name: 'Desa Sukamaju', region: 'desa', x: -12, z: 10, type: 'desa' },
  { id: 'lm_warung', name: 'Warung Kopi Mbah Darto', region: 'desa', x: 16, z: 14, type: 'toko', shopId: 'warung_desa' },
  { id: 'lm_balai', name: 'Balai Desa & Wit Asem', region: 'desa', x: -52, z: -38, type: 'desa' },
  { id: 'lm_peternakan', name: 'Peternakan Pak Karjo', region: 'desa', x: -72, z: 24, type: 'desa' },
  { id: 'lm_spbu', name: 'SPBU Mojosari', region: 'kota', x: 78, z: -28, type: 'spbu' },
  { id: 'lm_alun', name: 'Alun-Alun Kota Mojosari', region: 'kota', x: 120, z: -10, type: 'desa' },
  { id: 'lm_pasar', name: 'Pasar Tradisional Mojosari', region: 'kota', x: 145, z: 28, type: 'pasar', shopId: 'pasar_kota' },
  { id: 'lm_toko_klambi', name: 'Toko Batik & Klambi', region: 'kota', x: 102, z: 26, type: 'toko', shopId: 'toko_klambi' },
  { id: 'lm_bengkel', name: 'Bengkel Motor Mas Joko', region: 'kota', x: 158, z: -14, type: 'bengkel', shopId: 'bengkel_kota' },
  { id: 'lm_polisi', name: 'Kantor Polisi Mojosari', region: 'kota', x: 92, z: -55, type: 'polisi' },
  { id: 'lm_rs', name: 'RSUD Mojosari', region: 'kota', x: 165, z: -55, type: 'rs' },
  { id: 'lm_airterjun', name: 'Air Terjun Gunung Arjuno', region: 'pegunungan', x: -70, z: -176, type: 'gunung' },
  { id: 'lm_tpi', name: 'TPI & Kampung Nelayan', region: 'pesisir', x: 78, z: 162, type: 'pantai' },
  { id: 'lm_seafood', name: 'Warung Seafood Bu Wati', region: 'pesisir', x: 55, z: 152, type: 'toko', shopId: 'warung_seafood' },
  { id: 'lm_candi', name: 'Candi Majapahit', region: 'wisata', x: -140, z: 145, type: 'wisata' },
  { id: 'lm_danau', name: 'Danau Ranu & Goa Alam', region: 'wisata', x: -95, z: 185, type: 'wisata' },
];

export const NPC_SPAWNS: NpcSpawn[] = [
  {
    id: 'bu_siti',
    name: 'Bu Siti',
    role: { ngoko: 'Tangga Desa', krama: 'Tangga Dhusun', indonesia: 'Tetangga Desa' },
    region: 'desa',
    x: -22,
    z: 14,
    yaw: 1.2,
    shirtColor: 0xb45309,
    pantsColor: 0x3b2f2f,
    missionGiverId: 'misi_1_tangga',
    ambientQuotes: [
      {
        ngoko: 'Heh, Mas Bagas! Arep menyang endi? Ati-ati nek nyebrang dalan ya!',
        krama: 'Nuwun sewu, Mas Bagas. Badhe tindak pundi? Ngatos-atos menawi nyabrang margi nggih!',
        indonesia: 'Hei, Mas Bagas! Mau pergi ke mana? Hati-hati kalau menyeberang jalan ya!',
      },
      {
        ngoko: 'Esuk-esuk ngene hawane seger tenan ing Desa Sukamaju.',
        krama: 'Enjang-enjang mekaten hawanipun seger sanget ing Dhusun Sukamaju.',
        indonesia: 'Pagi-pagi begini udaranya segar sekali di Desa Sukamaju.',
      },
    ],
  },
  {
    id: 'pak_lurah',
    name: 'Pak Lurah Hadi',
    role: { ngoko: 'Kepala Desa Sukamaju', krama: 'Pangarsa Dhusun Sukamaju', indonesia: 'Kepala Desa Sukamaju' },
    region: 'desa',
    x: -52,
    z: -38,
    yaw: 0.4,
    shirtColor: 0x6b7280,
    pantsColor: 0x1f2937,
    hatType: 'peci',
    missionGiverId: 'misi_6_wisata',
    ambientQuotes: [
      {
        ngoko: 'Desa kene kudu rukun lan gotong royong, Bagas. Nek butuh pitulung, langsung omong wae.',
        krama: 'Dhusun mriki kedah rukun lan gotong royong, Bagas. Menawi betah pitulungan, matur kemawon.',
        indonesia: 'Desa ini harus rukun dan gotong royong, Bagas. Kalau perlu bantuan, bilang saja.',
      },
    ],
  },
  {
    id: 'mbah_darto',
    name: 'Mbah Darto',
    role: { ngoko: 'Bakul Warung Kopi', krama: 'Bakul Wande Kopi', indonesia: 'Pemilik Warung Kopi' },
    region: 'desa',
    x: 16,
    z: 14,
    yaw: -1.4,
    shirtColor: 0x78350f,
    pantsColor: 0x292524,
    hatType: 'peci',
    shopId: 'warung_desa',
    missionGiverId: 'misi_4_pasar',
    ambientQuotes: [
      {
        ngoko: 'Monggo ngopi dhisik Le! Kopi tubruk anget karo gorengan pas kanggo ngancani esuk.',
        krama: 'Sumangga ngunjuk kopi rumiyin Nak! Kopi tubruk benter kaliyan gorengan sae sanget.',
        indonesia: 'Silakan ngopi dulu Nak! Kopi tubruk hangat dengan gorengan pas menemani pagi.',
      },
    ],
  },
  {
    id: 'pak_karjo',
    name: 'Pak Karjo',
    role: { ngoko: 'Peternak Sapi & Kambing', krama: 'Peternak Lembu & Menda', indonesia: 'Peternak Sapi & Kambing' },
    region: 'desa',
    x: -70,
    z: 24,
    yaw: 0.8,
    shirtColor: 0x3f6212,
    pantsColor: 0x365314,
    hatType: 'caping',
    missionGiverId: 'misi_2_kambing',
    ambientQuotes: [
      {
        ngoko: 'Sapi karo wedhus kudu diwenehi suket seger saben dina ben lemu.',
        krama: 'Lembu kaliyan menda kedah dipun paringi suket seger saben dinten supados lemu.',
        indonesia: 'Sapi dan kambing harus diberi rumput segar setiap hari supaya sehat.',
      },
    ],
  },
  {
    id: 'dik_rino',
    name: 'Dik Rino',
    role: { ngoko: 'Murid SD', krama: 'Siswa Sekolah', indonesia: 'Pelajar Sekolah' },
    region: 'desa',
    x: 6,
    z: -28,
    yaw: -0.3,
    shirtColor: 0xf8fafc,
    pantsColor: 0xb91c1c,
    missionGiverId: 'misi_3_sekolah',
    ambientQuotes: [
      {
        ngoko: 'Mas Bagas, motormu apik tenan! Kapan-kapan ajari aku nyetir ya!',
        krama: 'Mas Bagas, motoripun sae sanget! Benjang-benjang wucalana kula nggih!',
        indonesia: 'Mas Bagas, motormu keren sekali! Kapan-kapan ajari aku mengendarainya ya!',
      },
    ],
  },
  {
    id: 'yu_sri',
    name: 'Yu Sri',
    role: { ngoko: 'Pedagang Pasar', krama: 'Bakul Peken', indonesia: 'Pedagang Pasar' },
    region: 'kota',
    x: 145,
    z: 28,
    yaw: -1.5,
    shirtColor: 0xbe185d,
    pantsColor: 0x4c1d95,
    shopId: 'pasar_kota',
    ambientQuotes: [
      {
        ngoko: 'Pasar Mojosari rame saben esuk. Sayur, bumbu, beras lengkap kabeh!',
        krama: 'Peken Mojosari rame saben enjang. Janganan, bumbu, uwos jangkep sedaya!',
        indonesia: 'Pasar Mojosari ramai setiap pagi. Sayur, bumbu, beras lengkap semua!',
      },
    ],
  },
  {
    id: 'mbak_ratna',
    name: 'Mbak Ratna',
    role: { ngoko: 'Bakul Batik & Klambi', krama: 'Bakul Bathik & Ageman', indonesia: 'Penjaga Toko Batik' },
    region: 'kota',
    x: 102,
    z: 26,
    yaw: 0.2,
    shirtColor: 0x92400e,
    pantsColor: 0x1c1917,
    shopId: 'toko_klambi',
    ambientQuotes: [
      {
        ngoko: 'Batik Parang iki asli tenunan pengrajin Jawa Timur, Mas. Cocok kanggo sampeyan!',
        krama: 'Bathik Parang punika asli damelanipun pengrajin Jawi Wetan, Mas. Trep sanget!',
        indonesia: 'Batik Parang ini asli buatan pengrajin Jawa Timur, Mas. Cocok untukmu!',
      },
    ],
  },
  {
    id: 'mas_joko',
    name: 'Mas Joko',
    role: { ngoko: 'Montir Bengkel', krama: 'Mekanik Bengkel', indonesia: 'Mekanik Bengkel' },
    region: 'kota',
    x: 158,
    z: -14,
    yaw: -2.2,
    shirtColor: 0x1d4ed8,
    pantsColor: 0x1e293b,
    shopId: 'bengkel_kota',
    ambientQuotes: [
      {
        ngoko: 'Motor bebek opo motor sport kabeh iso diservis neng kene, Mas!',
        krama: 'Motor bebek menapa motor sport sedaya saged dipun servis wonten mriki!',
        indonesia: 'Motor bebek maupun motor sport semua bisa diservis di sini, Mas!',
      },
    ],
  },
  {
    id: 'pak_polisi',
    name: 'Pak Polisi Bima',
    role: { ngoko: 'Polisi Patroli', krama: 'Polisi Patroli', indonesia: 'Polisi Lalu Lintas' },
    region: 'kota',
    x: 96,
    z: -48,
    yaw: 0.3,
    shirtColor: 0x715a3a,
    pantsColor: 0x423522,
    hatType: 'polisi',
    patrolRadius: 12,
    ambientQuotes: [
      {
        ngoko: 'Ati-ati nyetir ing dalan raya Kota Mojosari, Mas! Patuhi rambu lan aja ngebut ing pasar.',
        krama: 'Ngatos-atos nitih ing margi ageng Kitha Mojosari, Mas! Tansah tertib lalu lintas.',
        indonesia: 'Hati-hati berkendara di jalan raya Kota Mojosari, Mas! Jaga ketertiban lalu lintas.',
      },
    ],
  },
  {
    id: 'pak_slamet',
    name: 'Pak Slamet',
    role: { ngoko: 'Nelayan Pesisir', krama: 'Nelayan Pasisir', indonesia: 'Nelayan Pantai' },
    region: 'pesisir',
    x: 78,
    z: 162,
    yaw: 0.6,
    shirtColor: 0x0369a1,
    pantsColor: 0x334155,
    hatType: 'caping',
    missionGiverId: 'misi_5_nelayan',
    ambientQuotes: [
      {
        ngoko: 'Ombak Pantai Kidul dina iki tenang, tangkapan iwak kakap lan tongkol akeh banget!',
        krama: 'Alun Seganten Kidul dinten punika anteng, asil ulam kakap kathah sanget!',
        indonesia: 'Ombak Pantai Selatan hari ini tenang, tangkapan ikan kakap dan tongkol melimpah!',
      },
    ],
  },
  {
    id: 'bu_wati',
    name: 'Bu Wati',
    role: { ngoko: 'Bakul Warung Seafood', krama: 'Bakul Wande Seafood', indonesia: 'Pemilik Warung Seafood' },
    region: 'pesisir',
    x: 55,
    z: 152,
    yaw: 0.2,
    shirtColor: 0x0f766e,
    pantsColor: 0x1e293b,
    shopId: 'warung_seafood',
    ambientQuotes: [
      {
        ngoko: 'Mampir dhahar iwak bakar sik Mas, angin segara marai weteng luwe!',
        krama: 'Pinarak dhahar ulam bakar rumiyin Mas, angin seganten damel luwe!',
        indonesia: 'Mampir makan ikan bakar dulu Mas, angin laut bikin perut lapar!',
      },
    ],
  },
  {
    id: 'juru_kunci',
    name: 'Mbah Sastro',
    role: { ngoko: 'Juru Kunci Candi', krama: 'Juru Kunci Candhi', indonesia: 'Juru Kunci Candi' },
    region: 'wisata',
    x: -135,
    z: 140,
    yaw: 0.9,
    shirtColor: 0x4338ca,
    pantsColor: 0x1c1917,
    hatType: 'peci',
    ambientQuotes: [
      {
        ngoko: 'Candi bata abang iki warisan leluhur Majapahit. Jaganen kelestariane ya, Le.',
        krama: 'Candhi banon abrit punika warisanipun leluhur Majapahit. Jagenen kelestarianipun nggih.',
        indonesia: 'Candi bata merah ini warisan leluhur Majapahit. Jaga kelestariannya ya, Nak.',
      },
    ],
  },
  // Ambient patrolling villagers & farmers
  {
    id: 'petani_1',
    name: 'Pak Tani Kromo',
    role: { ngoko: 'Petani Sawah', krama: 'Tani Sabin', indonesia: 'Petani Sawah' },
    region: 'desa',
    x: -55,
    z: 5,
    yaw: 0,
    shirtColor: 0x57534e,
    pantsColor: 0x292524,
    hatType: 'caping',
    patrolRadius: 15,
    ambientQuotes: [
      {
        ngoko: 'Parine wis mulai kuning, minggu ngarep siap panen raya!',
        krama: 'Pantunipun sampun wiwit jene, minggu ngajeng siap panen raya!',
        indonesia: 'Padinya sudah mulai menguning, minggu depan siap panen raya!',
      },
    ],
  },
  {
    id: 'warga_alun',
    name: 'Mbak Dewi',
    role: { ngoko: 'Warga Kota', krama: 'Warga Kitha', indonesia: 'Warga Kota' },
    region: 'kota',
    x: 118,
    z: -8,
    yaw: 2.0,
    shirtColor: 0xd97706,
    pantsColor: 0x334155,
    patrolRadius: 18,
    ambientQuotes: [
      {
        ngoko: 'Sore-sore mlaku ing Alun-alun Mojosari karo mangan pentol enak banget!',
        krama: 'Sonten-sonten mlampah ing Alun-alun Mojosari kaliyan dhahar pentol sekeca sanget!',
        indonesia: 'Sore-sore jalan di Alun-alun Mojosari sambil makan bakso tusuk enak sekali!',
      },
    ],
  },
  {
    id: 'warga_gunung',
    name: 'Kang Hendra',
    role: { ngoko: 'Petani Kopi Gunung', krama: 'Tani Kopi Redi', indonesia: 'Petani Kopi Pegunungan' },
    region: 'pegunungan',
    x: -64,
    z: -168,
    yaw: 1.1,
    shirtColor: 0x15803d,
    pantsColor: 0x1e293b,
    hatType: 'caping',
    patrolRadius: 8,
    ambientQuotes: [
      {
        ngoko: 'Adem tenan ing lereng Gunung Arjuno kene. Air terjun ing mburi kono apik banget!',
        krama: 'Asrep sanget ing pereng Redi Arjuno mriki. Grojogan wonten wingking mrika endah sanget!',
        indonesia: 'Sejuk sekali di lereng Gunung Arjuno ini. Air terjun di belakang sana indah sekali!',
      },
    ],
  },
];

export const VEHICLE_SPAWNS: VehicleSpawn[] = [
  // Bagas starter Motor Bebek near home in Desa
  { id: 'veh_bebek_desa', type: 'motor_bebek', x: -6, z: 6, yaw: Math.PI / 2, color: 0xb91c1c },
  // Sepeda Onthel near Pos Ronda
  { id: 'veh_sepeda_desa', type: 'sepeda', x: -16, z: -15, yaw: 0.4, color: 0x1f2937 },
  // Motor Matic near Warung Mbah Darto
  { id: 'veh_matic_warung', type: 'motor_matic', x: 22, z: 8, yaw: -1.1, color: 0x0284c7 },
  // Pickup L300 near Peternakan / Balai Desa
  { id: 'veh_pickup_desa', type: 'pickup', x: -46, z: -28, yaw: 0, color: 0x1e293b },
  // Mobil Keluarga near Alun-Alun Kota
  { id: 'veh_avanza_kota', type: 'mobil_keluarga', x: 105, z: -14, yaw: Math.PI / 2, color: 0x94a3b8 },
  // Motor Sport near Bengkel Mas Joko
  { id: 'veh_sport_bengkel', type: 'motor_sport', x: 162, z: -8, yaw: -Math.PI / 2, color: 0x16a34a },
  // Bus at Terminal Bus Kota
  { id: 'veh_bus_terminal', type: 'bus', x: 175, z: 48, yaw: Math.PI, color: 0xd97706 },
  // Truk near Pasar Kota
  { id: 'veh_truk_pasar', type: 'truk', x: 155, z: 36, yaw: 0, color: 0xeab308 },
  // Motor Bebek at Pesisir TPI
  { id: 'veh_bebek_pantai', type: 'motor_bebek', x: 70, z: 160, yaw: 1.5, color: 0x1d4ed8 },
];

export const TRAFFIC_LOOP: Array<{ x: number; z: number }> = [
  { x: -12, z: 0 },
  { x: 88, z: 0 },
  { x: 145, z: 0 },
  { x: 185, z: 0 },
  { x: 185, z: -58 },
  { x: 88, z: -58 },
  { x: 88, z: 42 },
  { x: 145, z: 42 },
  { x: 145, z: 0 },
  { x: -12, z: 0 },
];
