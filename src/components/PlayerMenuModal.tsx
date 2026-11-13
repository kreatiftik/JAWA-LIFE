import React, { useState } from 'react';
import {
  Backpack,
  CheckCircle2,
  Compass,
  MapPin,
  Settings,
  Shirt,
  Sun,
  CloudRain,
  Save,
  X,
  Navigation,
} from 'lucide-react';
import { GameHudState, LanguageMode, OutfitId, WeatherType } from '../game/types';
import { MISSIONS, OUTFIT_LABELS, REGION_NAMES, UI_STRINGS, t } from '../game/jawaData';
import { LANDMARKS } from '../game/worldData';

export type DrawerTab = 'inventory' | 'missions' | 'map' | 'settings';

interface PlayerMenuModalProps {
  hud: GameHudState;
  initialTab: DrawerTab;
  onClose: () => void;
  onUseItem: (id: string) => void;
  onEquipOutfit: (outfit: OutfitId) => void;
  onStartMission: (missionId: string) => void;
  onSetGps: (x: number, z: number, label: string) => void;
  onTeleport: (x: number, z: number, label: string) => void;
  onChangeLanguage: (lang: LanguageMode) => void;
  onSetWeather: (w: WeatherType) => void;
  onSetTime: (hour: number) => void;
  onSetGraphicsMode: (mode: 'lancar' | 'seimbang' | 'tinggi') => void;
  onToggleMute: () => void;
  onToggleGamelan: () => void;
  onSaveGame: () => void;
  onReturnToMenu: () => void;
}

export const PlayerMenuModal: React.FC<PlayerMenuModalProps> = ({
  hud,
  initialTab,
  onClose,
  onUseItem,
  onEquipOutfit,
  onStartMission,
  onSetGps,
  onTeleport,
  onChangeLanguage,
  onSetWeather,
  onSetTime,
  onSetGraphicsMode,
  onToggleMute,
  onToggleGamelan,
  onSaveGame,
  onReturnToMenu,
}) => {
  const [tab, setTab] = useState<DrawerTab>(initialTab);
  const lang = hud.language;

  const tabs: Array<{ id: DrawerTab; label: string; icon: React.ReactNode }> = [
    { id: 'missions', label: t(UI_STRINGS.missions, lang), icon: <Compass className="w-4 h-4" /> },
    { id: 'inventory', label: t(UI_STRINGS.inventory, lang), icon: <Backpack className="w-4 h-4" /> },
    { id: 'map', label: 'Peta & GPS', icon: <MapPin className="w-4 h-4" /> },
    { id: 'settings', label: t(UI_STRINGS.settings, lang), icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-4xl bg-[#121614] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh]">
        {/* Header & Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-white/10 bg-[#161b18]">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0e1210] border border-white/10">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => setTab(tb.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  tab === tb.id
                    ? 'bg-[#d99b26] text-[#111311]'
                    : 'text-[#cfc9bc] hover:text-white'
                }`}
              >
                {tb.icon}
                <span>{tb.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-xs font-medium text-[#f5f2eb] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Tutup</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {tab === 'missions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#b8b1a3]">
                <span>
                  Misi Rampung: {hud.completedMissionIds.length} / {MISSIONS.length}
                </span>
                <span>Reputasi Warga: {hud.reputation}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {MISSIONS.map((m) => {
                  const isDone = hud.completedMissionIds.includes(m.id);
                  const isActive = hud.activeMissionId === m.id;
                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-xl border space-y-2.5 ${
                        isActive
                          ? 'bg-[#1f261e] border-[#d99b26]'
                          : 'bg-[#181d1a] border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono-tabular text-[#f5b942] font-semibold">
                          {m.code} · {t(REGION_NAMES[m.region], lang)}
                        </span>
                        {isDone && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Rampung
                          </span>
                        )}
                      </div>
                      <h4 className="font-display text-base font-bold text-[#f5f2eb]">
                        {t(m.title, lang)}
                      </h4>
                      <p className="text-xs text-[#b8b1a3] leading-relaxed">
                        {t(m.summary, lang)}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-white/8 text-xs">
                        <span className="font-mono-tabular text-[#d6d0c4]">
                          Rp {m.rewardMoney.toLocaleString('id-ID')} · +{m.rewardXp} XP
                        </span>
                        {!isDone && (
                          <button
                            type="button"
                            onClick={() => {
                              onStartMission(m.id);
                              onClose();
                            }}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-emerald-600/30 text-emerald-300'
                                : 'bg-[#d99b26] hover:bg-[#e5aa38] text-[#111311]'
                            }`}
                          >
                            {isActive ? 'Lagi Dijalanke' : 'Aktifke GPS'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Items */}
              <div className="space-y-3">
                <h4 className="font-display text-base font-bold text-[#f5f2eb] flex items-center gap-2">
                  <Backpack className="w-4 h-4 text-[#f5b942]" />
                  <span>{t(UI_STRINGS.inventory, lang)}</span>
                </h4>
                {hud.inventory.length === 0 ? (
                  <p className="text-xs text-[#a8a195]">Tas kosong. Mampir menyang Warung utawa Pasar!</p>
                ) : (
                  <div className="space-y-2.5">
                    {hud.inventory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#181d1a] border border-white/10"
                      >
                        <div>
                          <div className="text-sm font-semibold text-[#f5f2eb]">
                            {t(item.name, lang)}{' '}
                            <span className="font-mono-tabular text-[#f5b942]">×{item.quantity}</span>
                          </div>
                          <div className="text-xs text-[#a8a195] mt-0.5">
                            {t(item.description, lang)}
                          </div>
                        </div>
                        {item.category === 'makanan' && (
                          <button
                            type="button"
                            onClick={() => onUseItem(item.id)}
                            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#d99b26] hover:bg-[#e5aa38] text-[#111311] text-xs font-semibold cursor-pointer"
                          >
                            Dhahar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Wardrobe / Outfits */}
              <div className="space-y-3">
                <h4 className="font-display text-base font-bold text-[#f5f2eb] flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-[#f5b942]" />
                  <span>{t(UI_STRINGS.wardrobe, lang)} Bagas</span>
                </h4>
                <div className="space-y-2.5">
                  {(['kasual', 'batik', 'jaket_motor', 'lurik'] as OutfitId[]).map((oid) => {
                    const owned = hud.ownedOutfits.includes(oid);
                    const equipped = hud.outfit === oid;
                    return (
                      <div
                        key={oid}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#181d1a] border border-white/10"
                      >
                        <div>
                          <div className="text-sm font-semibold text-[#f5f2eb]">
                            {t(OUTFIT_LABELS[oid], lang)}
                          </div>
                          <div className="text-xs text-[#a8a195]">
                            {owned ? 'Wis diduweni' : 'Tuku ing Toko Batik Kota Mojosari'}
                          </div>
                        </div>
                        {owned && (
                          <button
                            type="button"
                            onClick={() => onEquipOutfit(oid)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                              equipped
                                ? 'bg-emerald-600/30 text-emerald-300'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            {equipped ? 'Dipakai' : 'Anggo'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'map' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#b8b1a3]">
                <span>
                  Lokasi Ditemokake: {hud.discoveredLandmarks.length} / {LANDMARKS.length}
                </span>
                <span>Klik "GPS" kanggo nuntun dalan, utawa "Tuju" kanggo cepet tekan lokasi.</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {LANDMARKS.map((lm) => {
                  const dist = Math.round(Math.hypot(lm.x - hud.playerX, lm.z - hud.playerZ));
                  return (
                    <div
                      key={lm.id}
                      className="p-3.5 rounded-xl bg-[#181d1a] border border-white/10 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="text-[11px] font-mono-tabular text-[#f5b942]">
                          {t(REGION_NAMES[lm.region], lang)} · {dist}m
                        </div>
                        <div className="font-semibold text-sm text-[#f5f2eb] mt-0.5">
                          {lm.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSetGps(lm.x, lm.z, lm.name);
                            onClose();
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#d99b26] hover:bg-[#e5aa38] text-[#111311] text-xs font-semibold cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>GPS</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onTeleport(lm.x, lm.z, lm.name);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-[#f5f2eb] cursor-pointer"
                        >
                          Tuju
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#b8b1a3]">
                    {t(UI_STRINGS.language, lang)}
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-[#0e1210] border border-white/10">
                    {(['ngoko', 'krama', 'indonesia'] as LanguageMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onChangeLanguage(mode)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                          lang === mode ? 'bg-[#d99b26] text-[#111311]' : 'text-[#cfc9bc]'
                        }`}
                      >
                        {mode === 'ngoko' ? 'Jawa Ngoko' : mode === 'krama' ? 'Jawa Krama' : 'Indonesia'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#b8b1a3]">
                    {t(UI_STRINGS.weather, lang)}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onSetWeather('cerah')}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        hud.weather === 'cerah'
                          ? 'bg-[#d99b26] text-[#111311] border-[#d99b26]'
                          : 'bg-[#181d1a] text-[#f5f2eb] border-white/10'
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                      <span>{t(UI_STRINGS.clear, lang)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetWeather('hujan')}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        hud.weather === 'hujan'
                          ? 'bg-[#38bdf8] text-[#0f172a] border-[#38bdf8]'
                          : 'bg-[#181d1a] text-[#f5f2eb] border-white/10'
                      }`}
                    >
                      <CloudRain className="w-4 h-4" />
                      <span>{t(UI_STRINGS.rain, lang)}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#b8b1a3]">
                    Wektu (Jam {Math.floor(hud.timeOfDay).toString().padStart(2, '0')}:00)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Esuk', hr: 6.5 },
                      { label: 'Awan', hr: 12 },
                      { label: 'Sore', hr: 17.3 },
                      { label: 'Wengi', hr: 21.5 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => onSetTime(preset.hr)}
                        className="px-3 py-2 rounded-lg bg-[#181d1a] hover:bg-white/10 border border-white/10 text-xs font-medium text-[#f5f2eb] cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#b8b1a3]">
                    Kualitas Grafis & Performa FPS
                  </label>
                  <div className="flex gap-1.5 p-1 rounded-xl bg-[#0e1210] border border-white/10">
                    {(
                      [
                        { id: 'lancar', label: 'Lancar (FPS)' },
                        { id: 'seimbang', label: 'Seimbang' },
                        { id: 'tinggi', label: 'Tinggi' },
                      ] as const
                    ).map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => onSetGraphicsMode(g.id)}
                        className={`flex-1 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                          hud.graphicsMode === g.id
                            ? 'bg-[#d99b26] text-[#111311]'
                            : 'text-[#cfc9bc] hover:text-white'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#8d877a]">
                    {hud.graphicsMode === 'lancar'
                      ? 'Bayangan dipateni kanggo FPS paling entheng lan lancar.'
                      : hud.graphicsMode === 'seimbang'
                        ? 'Standar entheng nganggo bayangan cepet lan gambar tajem.'
                        : 'Resolusi dhuwur lan bayangan alus kanggo piranti kuwat.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#b8b1a3]">
                    Audio & Musik Gamelan
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onToggleMute}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-[#181d1a] hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#f5f2eb] cursor-pointer"
                    >
                      {hud.audioMuted ? 'Suara: Bisu' : 'Suara: Aktif'}
                    </button>
                    <button
                      type="button"
                      onClick={onToggleGamelan}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-[#181d1a] hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#f5f2eb] cursor-pointer"
                    >
                      {hud.gamelanEnabled ? 'Gamelan: Aktif' : 'Gamelan: Mati'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={onSaveGame}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#d99b26] hover:bg-[#e5aa38] text-[#111311] text-sm font-semibold cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{t(UI_STRINGS.saveGame, lang)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onReturnToMenu}
                    className="w-full px-4 py-3 rounded-xl bg-[#181d1a] hover:bg-red-950/60 border border-white/10 text-sm font-medium text-[#f5f2eb] cursor-pointer"
                  >
                    {t(UI_STRINGS.backToMenu, lang)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
