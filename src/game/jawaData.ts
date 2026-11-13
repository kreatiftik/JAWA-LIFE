import {
  InventoryItem,
  LanguageMode,
  LocalizedText,
  MissionDef,
  OutfitId,
  RegionId,
  ShopItem,
  VehicleType,
} from './types';

export function t(text: LocalizedText, lang: LanguageMode): string {
  return text[lang];
}

export const REGION_NAMES: Record<RegionId, LocalizedText> = {
  desa: {
    ngoko: 'Desa Sukamaju',
    krama: 'Dhusun Sukamaju',
    indonesia: 'Desa Sukamaju',
  },
  kota: {
    ngoko: 'Kota Mojosari',
    krama: 'Kitha Mojosari',
    indonesia: 'Kota Mojosari',
  },
  pegunungan: {
    ngoko: 'Gunung Arjuno Kidul',
    krama: 'Redi Arjuno Kidul',
    indonesia: 'Pegunungan Arjuno',
  },
  pesisir: {
    ngoko: 'Pesisir Pantai Kidul',
    krama: 'Pasisir Seganten Kidul',
    indonesia: 'Pesisir Pantai Selatan',
  },
  wisata: {
    ngoko: 'Wisata Candi & Danau',
    krama: 'Pariwisata Candhi & Tlaga',
    indonesia: 'Wisata Candi & Danau',
  },
};

export const VEHICLE_LABELS: Record<VehicleType, { name: string; category: 'motor' | 'mobil' | 'sepeda'; maxSpeed: number; accel: number; turnSpeed: number }> = {
  motor_bebek: {
    name: 'Motor Bebek Supra',
    category: 'motor',
    maxSpeed: 28,
    accel: 18,
    turnSpeed: 2.8,
  },
  motor_matic: {
    name: 'Motor Matic Beat',
    category: 'motor',
    maxSpeed: 26,
    accel: 20,
    turnSpeed: 3.0,
  },
  motor_sport: {
    name: 'Motor Sport Ninja',
    category: 'motor',
    maxSpeed: 42,
    accel: 25,
    turnSpeed: 2.6,
  },
  mobil_keluarga: {
    name: 'Mobil Keluarga Avanza',
    category: 'mobil',
    maxSpeed: 36,
    accel: 15,
    turnSpeed: 2.1,
  },
  pickup: {
    name: 'Mobil Pickup L300',
    category: 'mobil',
    maxSpeed: 32,
    accel: 14,
    turnSpeed: 2.0,
  },
  truk: {
    name: 'Truk Engkel Jawa',
    category: 'mobil',
    maxSpeed: 26,
    accel: 10,
    turnSpeed: 1.6,
  },
  bus: {
    name: 'Bus Sumber Kencono',
    category: 'mobil',
    maxSpeed: 34,
    accel: 11,
    turnSpeed: 1.4,
  },
  sepeda: {
    name: 'Sepeda Onthel Klasik',
    category: 'sepeda',
    maxSpeed: 14,
    accel: 12,
    turnSpeed: 3.1,
  },
};

export const OUTFIT_LABELS: Record<OutfitId, LocalizedText> = {
  kasual: {
    ngoko: 'Kaos Santai Bagas',
    krama: 'Rasukan Santai Bagas',
    indonesia: 'Kaos Santai Bagas',
  },
  batik: {
    ngoko: 'Klambi Batik Parang',
    krama: 'Ageman Bathik Parang',
    indonesia: 'Kemeja Batik Parang',
  },
  jaket_motor: {
    ngoko: 'Jaket Touring Ijo',
    krama: 'Jaket Touring Ijem',
    indonesia: 'Jaket Touring Hijau',
  },
  lurik: {
    ngoko: 'Beskap Lurik Jawa',
    krama: 'Ageman Lurik Jawi',
    indonesia: 'Baju Adat Lurik Jawa',
  },
};

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'sega_pecel',
    name: {
      ngoko: 'Sega Pecel Pincuk',
      krama: 'Sekul Pecel Pincuk',
      indonesia: 'Nasi Pecel Daun Pisang',
    },
    category: 'makanan',
    quantity: 2,
    healAmount: 35,
    staminaAmount: 40,
    description: {
      ngoko: 'Sega pecel nganggo sambel kacang lan rempeyek. Nambah tenaga!',
      krama: 'Sekul pecel mawi sambel kacang lan rempeyek. Nambah tenaga!',
      indonesia: 'Nasi pecel dengan sambal kacang dan rempeyek. Memulihkan energi!',
    },
  },
  {
    id: 'kopi_tubruk',
    name: {
      ngoko: 'Kopi Tubruk Gula Jawa',
      krama: 'Kopi Tubruk Gendhis Jawi',
      indonesia: 'Kopi Tubruk Gula Aren',
    },
    category: 'makanan',
    quantity: 1,
    healAmount: 15,
    staminaAmount: 60,
    description: {
      ngoko: 'Kopi ireng anget gaweane Mbah Darto, langsung melek!',
      krama: 'Kopi cemeng anget damelanipun Mbah Darto, saged seger malih.',
      indonesia: 'Kopi hitam hangat buatan Mbah Darto, memulihkan stamina!',
    },
  },
];

export const SHOPS: Record<
  string,
  {
    id: string;
    title: LocalizedText;
    keeper: string;
    greeting: LocalizedText;
    items: ShopItem[];
  }
> = {
  warung_desa: {
    id: 'warung_desa',
    title: {
      ngoko: 'Warung Kopi Mbah Darto',
      krama: 'Wande Kopi Mbah Darto',
      indonesia: 'Warung Kopi Mbah Darto',
    },
    keeper: 'Mbah Darto',
    greeting: {
      ngoko: 'Monggo Mas Bagas, mampir ngopi dhisik! Ana sega pecel karo wedang jahe.',
      krama: 'Sumangga Mas Bagas, pinarak ngunjuk rumiyin! Wonten sekul pecel kaliyan wedang jahe.',
      indonesia: 'Silakan Mas Bagas, mampir minum dulu! Ada nasi pecel dan wedang jahe.',
    },
    items: [
      {
        id: 'kopi_tubruk',
        name: { ngoko: 'Kopi Tubruk Anget', krama: 'Kopi Tubruk Benter', indonesia: 'Kopi Tubruk Hangat' },
        category: 'makanan',
        price: 5000,
        healAmount: 15,
        staminaAmount: 60,
        description: { ngoko: 'Kopi ireng kental khas warung desa.', krama: 'Kopi cemeng kenthel khas dhusun.', indonesia: 'Kopi hitam kental khas warung desa.' },
      },
      {
        id: 'sega_pecel',
        name: { ngoko: 'Sega Pecel Pincuk', krama: 'Sekul Pecel Pincuk', indonesia: 'Nasi Pecel Pincuk' },
        category: 'makanan',
        price: 12000,
        healAmount: 35,
        staminaAmount: 40,
        description: { ngoko: 'Wareg tenan nganggo peyek kacang.', krama: 'Tuwuk sanget mawi rempeyek.', indonesia: 'Mengenyangkan dengan rempeyek kacang.' },
      },
      {
        id: 'es_dawet',
        name: { ngoko: 'Es Dawet Ayu', krama: 'Es Dawet Ayu', indonesia: 'Es Dawet Ayu' },
        category: 'makanan',
        price: 8000,
        healAmount: 25,
        staminaAmount: 50,
        description: { ngoko: 'Seger tenan diombe pas awan panas.', krama: 'Seger sanget dipun unjuk wekdal siyang.', indonesia: 'Segar diminum saat siang terik.' },
      },
    ],
  },
  pasar_kota: {
    id: 'pasar_kota',
    title: {
      ngoko: 'Pasar Tradisional Mojosari',
      krama: 'Peken Tradisional Mojosari',
      indonesia: 'Pasar Tradisional Mojosari',
    },
    keeper: 'Yu Sri',
    greeting: {
      ngoko: 'Ayo Mas, tumbas blanjaan opo? Sayur, beras, rawon, kabeh seger!',
      krama: 'Mangga Mas, mundhut blanjan punapa? Janganan, uwos, rawon, sedaya seger!',
      indonesia: 'Ayo Mas, mau beli belanjaan apa? Sayur, beras, rawon, semua segar!',
    },
    items: [
      {
        id: 'rawon_setan',
        name: { ngoko: 'Rawon Daging Sapi', krama: 'Rawon Ulaming Lembu', indonesia: 'Nasi Rawon Daging' },
        category: 'makanan',
        price: 22000,
        healAmount: 65,
        staminaAmount: 60,
        description: { ngoko: 'Rawon khas Jawa Timur nganggo kecambah lan endog asin.', krama: 'Rawon khas Jawi Wetan mawi thokolan lan tigan asin.', indonesia: 'Rawon khas Jawa Timur dengan tauge dan telur asin.' },
      },
      {
        id: 'paket_sembako',
        name: { ngoko: 'Paket Blanjaan Pasar (Beras & Kopi)', krama: 'Paket Blanjan Peken (Uwos & Kopi)', indonesia: 'Paket Belanja Pasar (Beras & Kopi)' },
        category: 'perlengkapan',
        price: 35000,
        description: { ngoko: 'Kebutuhan pawon kanggo Warung Mbah Darto utawa warga.', krama: 'Kabetahan pawon kangge Wande Mbah Darto.', indonesia: 'Kebutuhan dapur untuk Warung Mbah Darto atau warga.' },
      },
      {
        id: 'sate_ayam',
        name: { ngoko: 'Sate Ayam Ponorogo', krama: 'Sate Ayam Ponorogo', indonesia: 'Sate Ayam Ponorogo' },
        category: 'makanan',
        price: 18000,
        healAmount: 50,
        staminaAmount: 45,
        description: { ngoko: 'Sate daging empuk disiram bumbu kacang gurih.', krama: 'Sate daging empuk mawi bumbu kacang gurih.', indonesia: 'Sate ayam empuk dengan bumbu kacang gurih.' },
      },
    ],
  },
  toko_klambi: {
    id: 'toko_klambi',
    title: {
      ngoko: 'Toko Klambi & Batik Nusantara',
      krama: 'Toko Ageman & Bathik Nuswantara',
      indonesia: 'Toko Pakaian & Batik Nusantara',
    },
    keeper: 'Mbak Ratna',
    greeting: {
      ngoko: 'Sugeng rawuh Mas Bagas! Monggo dipilih klambi batik utawa jaket anyar.',
      krama: 'Sugeng rawuh Mas Bagas! Sumangga dipun pilih ageman bathik utawi jaket enggal.',
      indonesia: 'Selamat datang Mas Bagas! Silakan pilih kemeja batik atau jaket baru.',
    },
    items: [
      {
        id: 'outfit_batik',
        name: { ngoko: 'Klambi Batik Parang', krama: 'Ageman Bathik Parang', indonesia: 'Kemeja Batik Parang' },
        category: 'pakaian',
        price: 65000,
        outfitId: 'batik',
        description: { ngoko: 'Batik alus cocok kanggo sowan Pak Lurah utawa kondangan.', krama: 'Bathik alus trep kangge sowan Pak Lurah.', indonesia: 'Batik halus cocok untuk berkunjung ke Pak Lurah atau acara resmi.' },
      },
      {
        id: 'outfit_jaket',
        name: { ngoko: 'Jaket Touring Ijo', krama: 'Jaket Touring Ijem', indonesia: 'Jaket Touring Hijau' },
        category: 'pakaian',
        price: 55000,
        outfitId: 'jaket_motor',
        description: { ngoko: 'Jaket tahan angin nek numpak motor menyang gunung.', krama: 'Jaket tahan angin menawi nitih motor dhateng redi.', indonesia: 'Jaket tahan angin saat mengendarai motor ke pegunungan.' },
      },
      {
        id: 'outfit_lurik',
        name: { ngoko: 'Beskap Lurik Jawa', krama: 'Ageman Lurik Jawi', indonesia: 'Baju Adat Lurik Jawa' },
        category: 'pakaian',
        price: 90000,
        outfitId: 'lurik',
        description: { ngoko: 'Pakaian adat Jawa gagah lan berwibawa.', krama: 'Ageman adat Jawi ingkang gagah lan wibawa.', indonesia: 'Pakaian adat Jawa yang gagah dan berwibawa.' },
      },
    ],
  },
  bengkel_kota: {
    id: 'bengkel_kota',
    title: {
      ngoko: 'Bengkel & Showroom Mas Joko',
      krama: 'Bengkel & Showroom Mas Joko',
      indonesia: 'Bengkel & Showroom Mas Joko',
    },
    keeper: 'Mas Joko',
    greeting: {
      ngoko: 'Piye kabare Mas Bagas? Pengin nyoba motor sport opo mobil anyar? Tinggal pilih!',
      krama: 'Kados pundi pawartanipun Mas Bagas? Karsa nyobi motor sport menapa mobil enggal?',
      indonesia: 'Apa kabar Mas Bagas? Mau coba motor sport atau mobil baru? Silakan pilih!',
    },
    items: [
      {
        id: 'buy_motor_sport',
        name: { ngoko: 'Motor Sport Ninja', krama: 'Motor Sport Ninja', indonesia: 'Motor Sport Ninja' },
        category: 'kendaraan',
        price: 180000,
        vehicleType: 'motor_sport',
        description: { ngoko: 'Motor banter banget kanggo njelajah dalan raya lan pegunungan.', krama: 'Motor kenceng sanget kangge njelajah margi ageng.', indonesia: 'Motor sport kencang untuk menjelajah jalan raya dan pegunungan.' },
      },
      {
        id: 'buy_pickup',
        name: { ngoko: 'Mobil Pickup L300', krama: 'Mobil Pickup L300', indonesia: 'Mobil Pickup L300' },
        category: 'kendaraan',
        price: 240000,
        vehicleType: 'pickup',
        description: { ngoko: 'Kuat nggawa muatan akeh, cocok ngewangi warga lan nelayan.', krama: 'Kiyat mbekta momotan kathah, trep mbiyantu warga.', indonesia: 'Kuat membawa muatan, cocok membantu warga dan nelayan.' },
      },
      {
        id: 'buy_mobil_keluarga',
        name: { ngoko: 'Mobil Keluarga Avanza', krama: 'Mobil Keluarga Avanza', indonesia: 'Mobil Keluarga Avanza' },
        category: 'kendaraan',
        price: 320000,
        vehicleType: 'mobil_keluarga',
        description: { ngoko: 'Nyaman lan adem kanggo keliling Jawa Timur.', krama: 'Sekeca lan asrep kangge keliling Jawi Wetan.', indonesia: 'Nyaman dan sejuk untuk berkeliling Jawa Timur.' },
      },
    ],
  },
  warung_seafood: {
    id: 'warung_seafood',
    title: {
      ngoko: 'Warung Seafood Pesisir Bu Wati',
      krama: 'Wande Seafood Pasisir Bu Wati',
      indonesia: 'Warung Seafood Pesisir Bu Wati',
    },
    keeper: 'Bu Wati',
    greeting: {
      ngoko: 'Iwak bakare nembe dientas saka segara, Mas! Monggo mampir dhahar.',
      krama: 'Ulam bakaripun nembe mentas saking seganten, Mas! Sumangga dhahar.',
      indonesia: 'Ikan bakarnya baru turun dari laut, Mas! Silakan mampir makan.',
    },
    items: [
      {
        id: 'iwak_bakar',
        name: { ngoko: 'Iwak Kakap Bakar Sambel Kecap', krama: 'Ulam Kakap Bakar Sambel Kecap', indonesia: 'Ikan Kakap Bakar Sambal Kecap' },
        category: 'makanan',
        price: 25000,
        healAmount: 75,
        staminaAmount: 55,
        description: { ngoko: 'Iwak seger hasil tangkapan nelayan Pantai Kidul.', krama: 'Ulam seger asil tangkapan nelayan Pasisir Kidul.', indonesia: 'Ikan segar hasil tangkapan nelayan Pantai Selatan.' },
      },
      {
        id: 'es_degan',
        name: { ngoko: 'Es Degan Ijo', krama: 'Es Degan Ijem', indonesia: 'Es Kelapa Muda Hijau' },
        category: 'makanan',
        price: 10000,
        healAmount: 30,
        staminaAmount: 65,
        description: { ngoko: 'Banyu degan asli pinggir pantai.', krama: 'Toya degan asli pinggir seganten.', indonesia: 'Air kelapa muda asli pinggir pantai.' },
      },
    ],
  },
};

export const MISSIONS: MissionDef[] = [
  {
    id: 'misi_1_tangga',
    code: 'MISI 1',
    title: {
      ngoko: 'Nglayani Tangga',
      krama: 'Ngladosi Tangga Tepalih',
      indonesia: 'Membantu Tetangga',
    },
    giverNpcId: 'bu_siti',
    giverName: 'Bu Siti',
    region: 'desa',
    summary: {
      ngoko: 'Anterna besek selamatan saka omahe Bu Siti menyang omahe Pak Lurah cedhak wit asem gedhe.',
      krama: 'Aturaken besek slametan saking dalemipun Bu Siti dhateng dalemipun Pak Lurah celak wit asem ageng.',
      indonesia: 'Antarkan besek selamatan dari rumah Bu Siti ke rumah Pak Lurah dekat pohon asam besar.',
    },
    rewardMoney: 45000,
    rewardXp: 120,
    rewardRep: 15,
    startDialogue: {
      ngoko: 'Mas Bagas, tulung anterna besek selamatan iki menyang omahe Pak Lurah ing Balai Desa. Lurus wae, terus belok kiwa cedhak wit asem gedhe!',
      krama: 'Mas Bagas, nyuwun tulung aturaken besek slametan punika dhateng dalemipun Pak Lurah ing Bale Dhusun. Lurus kemawon, lajeng menggok kiwa celak wit asem ageng!',
      indonesia: 'Mas Bagas, tolong antarkan besek selamatan ini ke rumah Pak Lurah di Balai Desa. Lurus saja, lalu belok kiri dekat pohon asam besar!',
    },
    completeDialogue: {
      ngoko: 'Wah, matur nuwun sanget Le, Bagas! Iki dhuwit jajan lan titipan salam kanggo Bu Siti ya.',
      krama: 'Wah, matur nuwun sanget Mas Bagas! Punika arta jajan kaliyan salam kagem Bu Siti nggih.',
      indonesia: 'Wah, terima kasih banyak Nak Bagas! Ini uang jajan dan titip salam untuk Bu Siti ya.',
    },
    steps: [
      {
        id: 'm1_s1',
        title: {
          ngoko: 'Menyang Omahe Pak Lurah',
          krama: 'Dhateng Dalemipun Pak Lurah',
          indonesia: 'Menuju Rumah Pak Lurah',
        },
        objective: {
          ngoko: 'Gawa besek menyang Balai Desa / Omahe Pak Lurah cedhak wit asem gedhe.',
          krama: 'Bektan besek dhateng Bale Dhusun / Dalemipun Pak Lurah celak wit asem ageng.',
          indonesia: 'Bawa besek ke Balai Desa / Rumah Pak Lurah dekat pohon asam besar.',
        },
        targetX: -52,
        targetZ: -38,
        targetRadius: 5,
        type: 'talk',
        targetNpcId: 'pak_lurah',
        waypointLabel: 'Omahe Pak Lurah',
      },
    ],
  },
  {
    id: 'misi_2_kambing',
    code: 'MISI 2',
    title: {
      ngoko: 'Nggoleki Kambing Ilang',
      krama: 'Madosi Menda Ical',
      indonesia: 'Mencari Kambing Hilang',
    },
    giverNpcId: 'pak_karjo',
    giverName: 'Pak Karjo',
    region: 'desa',
    summary: {
      ngoko: 'Kambing (wedhus) duweke Pak Karjo ucul menyang pinggir kali lan sawah. Golekana banjur balikna menyang kandhang!',
      krama: 'Menda kagunganipun Pak Karjo ucul dhateng pinggir lepen lan sabin. Padosana lajeng wangsulaken dhateng kandhang!',
      indonesia: 'Kambing milik Pak Karjo lepas ke pinggir sungai dan sawah. Temukan lalu kembalikan ke kandang!',
    },
    rewardMoney: 60000,
    rewardXp: 150,
    rewardRep: 20,
    startDialogue: {
      ngoko: 'Waduh Mas Bagas! Wedhusku sing putih ucul mau esuk, mlayune nyabrang jembatan menyang cedhak sawah kidul. Tulung golekana ya!',
      krama: 'Waduh Mas Bagas! Menda kula ingkang pethak ucul wau enjang, mlajengipun nyabrang kreteg dhateng celak sabin kidul. Nyuwun tulung padosaken nggih!',
      indonesia: 'Waduh Mas Bagas! Kambing saya yang putih lepas tadi pagi, larinya menyeberang jembatan ke dekat sawah selatan. Tolong carikan ya!',
    },
    completeDialogue: {
      ngoko: 'Alhamdulillah ketemu wedhusku! Matur suwun banget Mas Bagas, kowe pancen pemuda desa sing tanggap!',
      krama: 'Alhamdulillah pinanggih menda kula! Matur nuwun sanget Mas Bagas, panjenengan pancen pemudha dhusun ingkang sae!',
      indonesia: 'Alhamdulillah kambing saya ketemu! Terima kasih banyak Mas Bagas, kamu memang pemuda desa yang sigap!',
    },
    steps: [
      {
        id: 'm2_s1',
        title: {
          ngoko: 'Temokna Wedhus ing Sawah Kidul',
          krama: 'Panggihaken Menda ing Sabin Kidul',
          indonesia: 'Temukan Kambing di Sawah Selatan',
        },
        objective: {
          ngoko: 'Goleki wedhus putih sing mlayu ing pinggir sawah & kali.',
          krama: 'Padosi menda pethak ingkang mlajeng ing pinggir sabin & lepen.',
          indonesia: 'Cari kambing putih yang berkeliaran di pinggir sawah & sungai.',
        },
        targetX: -95,
        targetZ: 74,
        targetRadius: 5,
        type: 'collect',
        waypointLabel: 'Wedhus Pak Karjo',
      },
      {
        id: 'm2_s2',
        title: {
          ngoko: 'Balikna menyang Pak Karjo',
          krama: 'Wangsulaken dhateng Pak Karjo',
          indonesia: 'Kembalikan ke Pak Karjo',
        },
        objective: {
          ngoko: 'Balik menyang Kandhang Peternakan lan ngomong karo Pak Karjo.',
          krama: 'Wangsul dhateng Kandhang Peternakan lan matur dhateng Pak Karjo.',
          indonesia: 'Kembali ke Kandang Peternakan dan bicara dengan Pak Karjo.',
        },
        targetX: -72,
        targetZ: 24,
        targetRadius: 5,
        type: 'talk',
        targetNpcId: 'pak_karjo',
        waypointLabel: 'Kandhang Pak Karjo',
      },
    ],
  },
  {
    id: 'misi_3_sekolah',
    code: 'MISI 3',
    title: {
      ngoko: 'Nganter Sekolah',
      krama: 'Ngateraken Sekolah',
      indonesia: 'Mengantar Sekolah',
    },
    giverNpcId: 'dik_rino',
    giverName: 'Dik Rino',
    region: 'desa',
    summary: {
      ngoko: 'Dik Rino telat mangkat sekolah menyang Kota Mojosari. Goncengen nganggo sepeda motor!',
      krama: 'Dik Rino kantun bidhal sekolah dhateng Kitha Mojosari. Goncengaken nitih sepeda motor!',
      indonesia: 'Dik Rino hampir terlambat sekolah ke Kota Mojosari. Bonceng dia naik sepeda motor!',
    },
    rewardMoney: 75000,
    rewardXp: 180,
    rewardRep: 20,
    startDialogue: {
      ngoko: 'Mas Bagas! Tulung goncengake aku menyang Sekolah ing Kota Mojosari cedhak Alun-alun, bel-e wis meh muni iki!',
      krama: 'Mas Bagas! Nyuwun tulung goncengaken kula dhateng Sekolah ing Kitha Mojosari celak Alun-alun, bel-ipun sampun badhe mungel!',
      indonesia: 'Mas Bagas! Tolong bonceng saya ke Sekolah di Kota Mojosari dekat Alun-alun, belnya sudah mau bunyi!',
    },
    completeDialogue: {
      ngoko: 'Asik, ora telat! Matur nuwun banget ya Mas Bagas, numpak motormu penak tenan!',
      krama: 'Asik, mboten telat! Matur nuwun sanget nggih Mas Bagas!',
      indonesia: 'Asik, tidak terlambat! Terima kasih banyak ya Mas Bagas, naik motormu nyaman sekali!',
    },
    steps: [
      {
        id: 'm3_s1',
        title: {
          ngoko: 'Numpak Motor Menyang Sekolah Kota',
          krama: 'Nitih Motor Dhateng Sekolah Kitha',
          indonesia: 'Naik Motor ke Sekolah Kota',
        },
        objective: {
          ngoko: 'Numpak kendaraan (luwih becik motor) menyang Sekolah cedhak Alun-alun Kota Mojosari.',
          krama: 'Nitih kendaraan dhateng Sekolah celak Alun-alun Kitha Mojosari.',
          indonesia: 'Kendarai motor atau mobil menuju Sekolah dekat Alun-alun Kota Mojosari.',
        },
        targetX: 118,
        targetZ: -45,
        targetRadius: 7,
        type: 'escort_vehicle',
        requiredVehicleCategory: 'any',
        waypointLabel: 'Sekolah Kota Mojosari',
      },
    ],
  },
  {
    id: 'misi_4_pasar',
    code: 'MISI 4',
    title: {
      ngoko: 'Tuku ing Pasar',
      krama: 'Mundhut ing Peken',
      indonesia: 'Belanja di Pasar',
    },
    giverNpcId: 'mbah_darto',
    giverName: 'Mbah Darto',
    region: 'desa',
    summary: {
      ngoko: 'Mbah Darto kehabisan stok kopi lan beras. Tuku Paket Blanjaan ing Pasar Mojosari banjur gawa balik menyang Warung!',
      krama: 'Mbah Darto telas stok kopi lan uwos. Mundhut Paket Blanjan ing Peken Mojosari lajeng asta wangsul dhateng Wande!',
      indonesia: 'Mbah Darto kehabisan stok kopi dan beras. Beli Paket Belanja di Pasar Mojosari lalu bawa ke Warung!',
    },
    rewardMoney: 95000,
    rewardXp: 200,
    rewardRep: 25,
    startDialogue: {
      ngoko: 'Le Bagas, stok kopiku karo beras neng warung entek. Tulung tukokno Paket Blanjaan ing Pasar Tradisional Mojosari yo! Iki tak wenehi dhuwit sangune.',
      krama: 'Nak Bagas, stok kopi kaliyan uwos wonten wande telas. Nyuwun tulung tumbasaken Paket Blanjan ing Peken Mojosari nggih!',
      indonesia: 'Nak Bagas, stok kopi dan beras di warung habis. Tolong belikan Paket Belanja di Pasar Tradisional Mojosari ya!',
    },
    completeDialogue: {
      ngoko: 'Jos tenan! Saiki warung iso bukak terus lan warga iso ngopi kabeh. Matur nuwun Bagas!',
      krama: 'Sae sanget! Sakmenika wande saged bikak terus. Matur nuwun Mas Bagas!',
      indonesia: 'Mantap! Sekarang warung bisa buka terus dan warga bisa ngopi lagi. Terima kasih Bagas!',
    },
    steps: [
      {
        id: 'm4_s1',
        title: {
          ngoko: 'Menyang Pasar Mojosari',
          krama: 'Dhateng Peken Mojosari',
          indonesia: 'Pergi ke Pasar Mojosari',
        },
        objective: {
          ngoko: 'Parani Yu Sri ing Pasar Tradisional Kota Mojosari (tuku utawa jupuk blanjaan).',
          krama: 'Panggihi Yu Sri ing Peken Tradisional Kitha Mojosari.',
          indonesia: 'Temui Yu Sri di Pasar Tradisional Kota Mojosari untuk mengambil bahan dapur.',
        },
        targetX: 145,
        targetZ: 28,
        targetRadius: 6,
        type: 'talk',
        targetNpcId: 'yu_sri',
        waypointLabel: 'Pasar Tradisional',
      },
      {
        id: 'm4_s2',
        title: {
          ngoko: 'Gawa Blanjaan menyang Warung Mbah Darto',
          krama: 'Bektan Blanjan dhateng Wande Mbah Darto',
          indonesia: 'Antar Belanjaan ke Warung Mbah Darto',
        },
        objective: {
          ngoko: 'Balik menyang Warung Kopi Mbah Darto ing Desa Sukamaju.',
          krama: 'Wangsul dhateng Wande Kopi Mbah Darto ing Dhusun Sukamaju.',
          indonesia: 'Kembali ke Warung Kopi Mbah Darto di Desa Sukamaju.',
        },
        targetX: 16,
        targetZ: 14,
        targetRadius: 5,
        type: 'talk',
        targetNpcId: 'mbah_darto',
        waypointLabel: 'Warung Mbah Darto',
      },
    ],
  },
  {
    id: 'misi_5_nelayan',
    code: 'MISI 5',
    title: {
      ngoko: 'Nolong Nelayan',
      krama: 'Mbiyantu Nelayan',
      indonesia: 'Menolong Nelayan',
    },
    giverNpcId: 'pak_slamet',
    giverName: 'Pak Slamet',
    region: 'pesisir',
    summary: {
      ngoko: 'Pak Slamet nembe mentas njala iwak akeh. Tulung gawa peti iwak seger saka Dermaga Pantai menyang Tempat Pelelangan Ikan (TPI)!',
      krama: 'Pak Slamet nembe mentas njala ulam kathah. Nyuwun tulung bekta peti ulam saking Dermaga dhateng TPI!',
      indonesia: 'Pak Slamet baru mendarat dengan tangkapan ikan melimpah. Bantu bawa peti ikan dari Dermaga ke TPI!',
    },
    rewardMoney: 110000,
    rewardXp: 240,
    rewardRep: 30,
    startDialogue: {
      ngoko: 'Wah Mas Bagas pas banget teka! Perahuku kebak iwak kakap karo tongkol. Tulung gawakna peti iwake menyang TPI lan Warung Bu Wati ya!',
      krama: 'Wah Mas Bagas pas sanget rawuh! Prau kula kebak ulam kakap. Nyuwun tulung bektakaken peti ulamipun dhateng TPI nggih!',
      indonesia: 'Wah Mas Bagas pas sekali datang! Perahuku penuh ikan kakap dan tongkol. Tolong bawakan peti ikannya ke TPI ya!',
    },
    completeDialogue: {
      ngoko: 'Matur suwun banget Mas Bagas! Nek butuh iwak seger, langsung mampir kampung nelayan wae.',
      krama: 'Matur nuwun sanget Mas Bagas! Menawi betah ulam seger, pinarak kemawon dhateng kampung nelayan.',
      indonesia: 'Terima kasih banyak Mas Bagas! Kalau butuh ikan segar, langsung mampir ke kampung nelayan saja.',
    },
    steps: [
      {
        id: 'm5_s1',
        title: {
          ngoko: 'Jupuk Peti Iwak ing Dermaga',
          krama: 'Mundhut Peti Ulam ing Dermaga',
          indonesia: 'Ambil Peti Ikan di Dermaga',
        },
        objective: {
          ngoko: 'Parani prahu nelayan ing pesisir Pantai Kidul.',
          krama: 'Murugi prau nelayan ing pasisir Seganten Kidul.',
          indonesia: 'Datangi perahu nelayan di pinggir Pantai Selatan.',
        },
        targetX: 110,
        targetZ: 196,
        targetRadius: 6,
        type: 'collect',
        waypointLabel: 'Dermaga Nelayan',
      },
      {
        id: 'm5_s2',
        title: {
          ngoko: 'Kirim menyang Tempat Pelelangan Ikan (TPI)',
          krama: 'Kintun dhateng TPI Pasisir',
          indonesia: 'Antar ke Tempat Pelelangan Ikan (TPI)',
        },
        objective: {
          ngoko: 'Gawa peti iwak menyang TPI lan lapor menyang Pak Slamet.',
          krama: 'Bekta peti ulam dhateng TPI lan lapor dhateng Pak Slamet.',
          indonesia: 'Bawa peti ikan ke TPI dan serahkan kepada Pak Slamet.',
        },
        targetX: 78,
        targetZ: 162,
        targetRadius: 6,
        type: 'talk',
        targetNpcId: 'pak_slamet',
        waypointLabel: 'TPI Pesisir',
      },
    ],
  },
  {
    id: 'misi_6_wisata',
    code: 'MISI 6',
    title: {
      ngoko: 'Petualangan Tanah Jawa',
      krama: 'Lelana ing Tanah Jawi',
      indonesia: 'Petualangan Tanah Jawa',
    },
    giverNpcId: 'pak_lurah',
    giverName: 'Pak Lurah',
    region: 'wisata',
    summary: {
      ngoko: 'Jelajahi telung situs alam lan sejarah Jawa Timur: Air Terjun Gunung, Candi Majapahit, lan Danau Ranu!',
      krama: 'Tliti tigang situs alam lan sejarah Jawi Wetan: Grojogan Redi, Candhi Majapahit, lan Tlaga Ranu!',
      indonesia: 'Jelajahi tiga lokasi wisata alam & sejarah Jawa Timur: Air Terjun Pegunungan, Candi Majapahit, dan Danau Ranu!',
    },
    rewardMoney: 160000,
    rewardXp: 350,
    rewardRep: 50,
    startDialogue: {
      ngoko: 'Bagas, minangka nom-noman Jawa kudu ngerti kaendahan tanah leluhur. Coba parani Air Terjun Pegunungan, Candi Majapahit, karo Danau Ranu!',
      krama: 'Bagas, minangka pemudha Jawi kedah mangertos kaendahan siti leluhur. Cobi panggihi Grojogan Redi, Candhi Majapahit, lan Tlaga Ranu!',
      indonesia: 'Bagas, sebagai pemuda Jawa kamu harus mengenal keindahan tanah leluhur. Kunjungi Air Terjun Pegunungan, Candi Majapahit, dan Danau Ranu!',
    },
    completeDialogue: {
      ngoko: 'Luar biasa Mas Bagas! Saiki kowe resmi dadi Sang Petualang Tanah Jawa sing sejati!',
      krama: 'Luar biasa Mas Bagas! Sakmenika panjenengan resmi dados Sang Petualang Tanah Jawi ingkang sejatos!',
      indonesia: 'Luar biasa Mas Bagas! Sekarang kamu resmi menjadi Sang Petualang Tanah Jawa sejati!',
    },
    steps: [
      {
        id: 'm6_s1',
        title: {
          ngoko: 'Tekan Air Terjun Pegunungan',
          krama: 'Dumugi Grojogan Redi',
          indonesia: 'Kunjungi Air Terjun Pegunungan',
        },
        objective: {
          ngoko: 'Tunggangi dalan munggah menyang Air Terjun ing Pegunungan Arjuno.',
          krama: 'Nitih margi minggah dhateng Grojogan ing Redi Arjuno.',
          indonesia: 'Naiki jalan menanjak menuju Air Terjun di Pegunungan Arjuno.',
        },
        targetX: -70,
        targetZ: -176,
        targetRadius: 9,
        type: 'goto',
        waypointLabel: 'Air Terjun Arjuno',
      },
      {
        id: 'm6_s2',
        title: {
          ngoko: 'Ziarah menyang Candi Majapahit',
          krama: 'Ziarah dhateng Candhi Majapahit',
          indonesia: 'Kunjungi Candi Majapahit',
        },
        objective: {
          ngoko: 'Menyang kawasan wisata sejarah Candi ing sisih kidul-kulon.',
          krama: 'Dhateng kawasan wisata sejarah Candhi ing sisih kidul-kilen.',
          indonesia: 'Menuju kawasan wisata sejarah Candi di sisi barat daya.',
        },
        targetX: -140,
        targetZ: 145,
        targetRadius: 9,
        type: 'goto',
        waypointLabel: 'Candi Majapahit',
      },
      {
        id: 'm6_s3',
        title: {
          ngoko: 'Nikmati Danau Ranu & Goa Alam',
          krama: 'Ngraosaken Tlaga Ranu & Guwa Alam',
          indonesia: 'Kunjungi Danau Ranu & Goa',
        },
        objective: {
          ngoko: 'Parani pinggir Danau Ranu ing cedhak Candi kanggo ngrampungake petualangan.',
          krama: 'Murugi pinggir Tlaga Ranu celak Candhi kangge ngrampungaken lelahanan.',
          indonesia: 'Datangi tepi Danau Ranu dekat Candi untuk menyelesaikan petualangan.',
        },
        targetX: -95,
        targetZ: 185,
        targetRadius: 10,
        type: 'goto',
        waypointLabel: 'Danau Ranu',
      },
    ],
  },
];

export const UI_STRINGS = {
  newGame: { ngoko: 'Mulai Anyar', krama: 'Wiwit Enggal', indonesia: 'Permainan Baru' },
  continueGame: { ngoko: 'Terusake', krama: 'Lajengaken', indonesia: 'Lanjutkan' },
  settings: { ngoko: 'Setelan', krama: 'Pangaturan', indonesia: 'Pengaturan' },
  saveGame: { ngoko: 'Simpen Game', krama: 'Simpen Game', indonesia: 'Simpan Game' },
  resume: { ngoko: 'Balik Main', krama: 'Wangsul Main', indonesia: 'Lanjut Bermain' },
  backToMenu: { ngoko: 'Menu Utama', krama: 'Menu Utama', indonesia: 'Menu Utama' },
  language: { ngoko: 'Basa', krama: 'Basa', indonesia: 'Bahasa' },
  health: { ngoko: 'Waras', krama: 'Saras', indonesia: 'Kesehatan' },
  stamina: { ngoko: 'Tenaga', krama: 'Karosan', indonesia: 'Stamina' },
  reputation: { ngoko: 'Jeneng Apik', krama: 'Asma Sae', indonesia: 'Reputasi' },
  inventory: { ngoko: 'Tas Gawan', krama: 'Tas Bektan', indonesia: 'Inventaris' },
  missions: { ngoko: 'Daftar Misi', krama: 'Pratelan Ayahan', indonesia: 'Daftar Misi' },
  wardrobe: { ngoko: 'Ganti Klambi', krama: 'Gantos Ageman', indonesia: 'Ganti Pakaian' },
  weather: { ngoko: 'Cuaca', krama: 'Cuaca', indonesia: 'Cuaca' },
  clear: { ngoko: 'Cerah', krama: 'Padhang', indonesia: 'Cerah' },
  rain: { ngoko: 'Udan', krama: 'Jawah', indonesia: 'Hujan' },
  interactHint: { ngoko: 'Pencet E kanggo interaksi', krama: 'Pencet E kangge sesambetan', indonesia: 'Tekan E untuk interaksi' },
  enterVehicle: { ngoko: 'Numpak (F)', krama: 'Nitih (F)', indonesia: 'Naik (F)' },
  exitVehicle: { ngoko: 'Mudhun (F)', krama: 'Mandhap (F)', indonesia: 'Turun (F)' },
};
