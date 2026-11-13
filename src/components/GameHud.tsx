import React, { useState } from 'react';
import {
  Backpack,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Compass,
  MapPin,
  Pause,
  Save,
  Settings,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GameHudState } from '../game/types';
import { MISSIONS, REGION_NAMES, UI_STRINGS, t } from '../game/jawaData';
import { Minimap } from './Minimap';
import { DrawerTab } from './PlayerMenuModal';

interface GameHudProps {
  hud: GameHudState;
  onOpenDrawer: (tab: DrawerTab) => void;
  onInteract: () => void;
  onToggleVehicle: () => void;
  onHorn: () => void;
  onToggleWeather: () => void;
  onToggleMute: () => void;
  onSaveGame: () => void;
  onPause: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  onOpenDrawer,
  onInteract,
  onToggleVehicle,
  onHorn,
  onToggleWeather,
  onToggleMute,
  onSaveGame,
  onPause,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const lang = hud.language;

  const activeMission = hud.activeMissionId
    ? MISSIONS.find((m) => m.id === hud.activeMissionId)
    : null;
  const activeStep = activeMission ? activeMission.steps[hud.activeStepIndex] : null;

  const hours = Math.floor(hud.timeOfDay).toString().padStart(2, '0');
  const mins = Math.floor((hud.timeOfDay % 1) * 60)
    .toString()
    .padStart(2, '0');

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
      {/* Top Row: Minimap (Left) & Player Stats (Right) */}
      <div className="flex items-start justify-between gap-4">
        <div className="pointer-events-auto">
          <Minimap hud={hud} onOpenMap={() => onOpenDrawer('map')} />
        </div>

        {/* Top-Center Toast Notification */}
        {hud.toastMessage && (
          <div className="hidden md:flex items-center px-4 py-2 rounded-xl bg-[#121614]/94 border border-[#d99b26]/55 text-xs sm:text-sm font-medium text-[#f8f5ee] shadow-lg">
            {hud.toastMessage}
          </div>
        )}

        {/* Top-Right Compact Stats Panel */}
        <div className="pointer-events-auto bg-[#121614]/90 border border-white/12 rounded-xl p-3 shadow-xl min-w-[215px] sm:min-w-[245px] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#b8b1a3] font-mono-tabular">
            <span className="truncate max-w-[135px] text-[#f5f2eb] font-medium">
              {t(REGION_NAMES[hud.region], lang)}
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span>{hours}:{mins}</span>
              <span aria-hidden="true">·</span>
              <span>{hud.weather === 'hujan' ? t(UI_STRINGS.rain, lang) : t(UI_STRINGS.clear, lang)}</span>
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="font-mono-tabular text-base sm:text-lg font-bold text-[#f5b942]">
              Rp {hud.money.toLocaleString('id-ID')}
            </span>
            <span className="font-mono-tabular text-[11px] text-[#cfc9bc]">
              Lv.{hud.level} · Rep {hud.reputation}
            </span>
          </div>

          {/* Health & Stamina Bars */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] w-11 text-[#a8a195] truncate">
                {t(UI_STRINGS.health, lang)}
              </span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150"
                  style={{ width: `${(hud.health / hud.maxHealth) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] w-11 text-[#a8a195] truncate">
                {t(UI_STRINGS.stamina, lang)}
              </span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#f5b942] transition-all duration-150"
                  style={{ width: `${(hud.stamina / hud.maxStamina) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Area: Mission Brief (Left) + Interaction/Speedometer + Collapsible Bottom Dock */}
      <div className="flex flex-col items-center gap-2.5">
        {/* Interaction Prompt & Speedometer floating just above bottom dock */}
        {!hud.activeDialogue && !hud.activeShopId && (
          <div className="flex flex-wrap items-center justify-center gap-3 pointer-events-auto">
            {hud.interactPrompt && (
              <button
                type="button"
                onClick={onInteract}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#d99b26] hover:bg-[#e5aa38] text-[#111311] font-semibold text-xs sm:text-sm shadow-xl cursor-pointer transition-colors"
              >
                <span className="px-1.5 py-0.5 rounded bg-[#111311]/15 font-mono-tabular text-xs font-bold">
                  {hud.interactPrompt.kind === 'vehicle' ? 'F' : 'E'}
                </span>
                <span>{t(hud.interactPrompt.label, lang)}</span>
              </button>
            )}

            {hud.inVehicle && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#121614]/92 border border-[#d99b26]/45 shadow-xl">
                <div>
                  <div className="text-[10px] text-[#b8b1a3] leading-none">
                    {hud.vehicleName}
                  </div>
                  <div className="font-mono-tabular text-lg font-bold text-[#f5b942] leading-tight">
                    {hud.speedKmh} <span className="text-xs font-normal text-[#cfc9bc]">km/j</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onHorn}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-[#f5f2eb] cursor-pointer"
                >
                  Klakson (H)
                </button>
                <button
                  type="button"
                  onClick={onToggleVehicle}
                  className="px-2.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-xs font-semibold text-white cursor-pointer"
                >
                  {t(UI_STRINGS.exitVehicle, lang)}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active Mission Compact Card (Bottom Left on Desktop) */}
        {activeMission && activeStep && !hud.activeDialogue && (
          <div className="self-start sm:absolute sm:bottom-4 sm:left-4 max-w-xs bg-[#121614]/90 border border-white/12 rounded-xl p-3 shadow-xl pointer-events-auto">
            <div className="text-[10px] font-mono-tabular text-[#f5b942] font-semibold">
              {activeMission.code} · {t(activeMission.title, lang)}
            </div>
            <p className="text-xs text-[#e5e0d5] mt-1 leading-snug">
              {t(activeStep.objective, lang)}
            </p>
          </div>
        )}

        {/* Collapsible Unified Bottom Control Dock */}
        {!hud.activeDialogue && !hud.activeShopId && (
          <div className="pointer-events-auto flex flex-col items-center">
            <button
              type="button"
              onClick={() => setDockCollapsed((v) => !v)}
              className="flex items-center gap-1 px-3 py-1 rounded-t-lg bg-[#121614]/90 border border-b-0 border-white/12 text-[11px] text-[#b8b1a3] hover:text-white cursor-pointer"
            >
              {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{dockCollapsed ? 'Kontrol' : 'Tutup'}</span>
            </button>

            {!dockCollapsed && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#121614]/92 border border-white/12 shadow-2xl">
                <button
                  type="button"
                  onClick={() => onOpenDrawer('missions')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-medium text-[#f5f2eb] cursor-pointer whitespace-nowrap"
                >
                  <Compass className="w-3.5 h-3.5 text-[#f5b942]" />
                  <span>Misi</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDrawer('inventory')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-medium text-[#f5f2eb] cursor-pointer whitespace-nowrap"
                >
                  <Backpack className="w-3.5 h-3.5 text-[#f5b942]" />
                  <span>Tas & Klambi</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDrawer('map')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-medium text-[#f5f2eb] cursor-pointer whitespace-nowrap"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#f5b942]" />
                  <span>Peta GPS</span>
                </button>
                <button
                  type="button"
                  onClick={onToggleWeather}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-medium text-[#f5f2eb] cursor-pointer whitespace-nowrap"
                >
                  {hud.weather === 'hujan' ? (
                    <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-[#f5b942]" />
                  )}
                  <span>Cuaca</span>
                </button>
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-medium text-[#f5f2eb] cursor-pointer whitespace-nowrap"
                >
                  {hud.audioMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-[#a8a195]" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-[#f5b942]" />
                  )}
                  <span>Audio</span>
                </button>
                <button
                  type="button"
                  onClick={onSaveGame}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-medium text-[#f5f2eb] cursor-pointer whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Simpen</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDrawer('settings')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-medium text-[#f5f2eb] cursor-pointer whitespace-nowrap"
                >
                  <Settings className="w-3.5 h-3.5 text-[#cfc9bc]" />
                  <span>Setelan</span>
                </button>
                <button
                  type="button"
                  onClick={onPause}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-xs font-medium text-[#f5f2eb] cursor-pointer whitespace-nowrap"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
