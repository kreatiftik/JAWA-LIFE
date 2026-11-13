import { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameHudState } from './game/types';
import { UI_STRINGS, t } from './game/jawaData';
import { MainMenu } from './components/MainMenu';
import { GameHud } from './components/GameHud';
import { DialogueModal } from './components/DialogueModal';
import { ShopModal } from './components/ShopModal';
import { DrawerTab, PlayerMenuModal } from './components/PlayerMenuModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [hud, setHud] = useState<GameHudState | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab | null>(null);

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const engine = new GameEngine(mountEl, (nextState) => {
      setHud(nextState);
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const engine = engineRef.current;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1311]">
      {/* Dedicated isolated WebGL canvas container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* Main Menu Overlay */}
      {hud && hud.screen === 'menu' && (
        <MainMenu
          language={hud.language}
          hasSaveData={hud.hasSaveData}
          audioMuted={hud.audioMuted}
          onNewGame={() => engine?.startNewGame()}
          onContinue={() => engine?.loadGame()}
          onChangeLanguage={(lang) => engine?.setLanguage(lang)}
          onToggleMute={() => engine?.setAudioMuted(!hud.audioMuted)}
        />
      )}

      {/* Active Gameplay HUD */}
      {hud && hud.screen === 'playing' && (
        <GameHud
          hud={hud}
          onOpenDrawer={(tab) => setDrawerTab(tab)}
          onInteract={() => engine?.triggerInteract()}
          onToggleVehicle={() => engine?.toggleVehicle()}
          onHorn={() => {
            if (engine) {
              window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH' }));
            }
          }}
          onToggleWeather={() =>
            engine?.setWeather(hud.weather === 'cerah' ? 'hujan' : 'cerah')
          }
          onToggleMute={() => engine?.setAudioMuted(!hud.audioMuted)}
          onSaveGame={() => engine?.saveGame()}
          onPause={() => engine?.setScreen('paused')}
        />
      )}

      {/* Javanese NPC Dialogue Modal */}
      {hud && hud.screen === 'playing' && hud.activeDialogue && (
        <DialogueModal
          dialogue={hud.activeDialogue}
          language={hud.language}
          onSelectOption={(idx) => engine?.chooseDialogueOption(idx)}
          onClose={() => engine?.closeDialogue()}
        />
      )}

      {/* Shop Modal */}
      {hud && hud.screen === 'playing' && hud.activeShopId && (
        <ShopModal
          shopId={hud.activeShopId}
          money={hud.money}
          language={hud.language}
          onBuy={(shopId, itemId) => engine?.buyShopItem(shopId, itemId)}
          onClose={() => engine?.closeShop()}
        />
      )}

      {/* Player Drawer (Missions / Inventory / World Map GPS / Settings) */}
      {hud && hud.screen === 'playing' && drawerTab && (
        <PlayerMenuModal
          hud={hud}
          initialTab={drawerTab}
          onClose={() => setDrawerTab(null)}
          onUseItem={(id) => engine?.useInventoryItem(id)}
          onEquipOutfit={(o) => engine?.equipOutfit(o)}
          onStartMission={(id) => engine?.startMission(id)}
          onSetGps={(x, z, label) => engine?.setCustomGpsTarget(x, z, label)}
          onTeleport={(x, z, label) => engine?.teleportToLandmark(x, z, label)}
          onChangeLanguage={(l) => engine?.setLanguage(l)}
          onSetWeather={(w) => engine?.setWeather(w)}
          onSetTime={(h) => engine?.setTimeOfDay(h)}
          onSetGraphicsMode={(m) => engine?.setGraphicsMode(m)}
          onToggleMute={() => engine?.setAudioMuted(!hud.audioMuted)}
          onToggleGamelan={() => engine?.setGamelanEnabled(!hud.gamelanEnabled)}
          onSaveGame={() => engine?.saveGame()}
          onReturnToMenu={() => {
            setDrawerTab(null);
            engine?.setScreen('menu');
          }}
        />
      )}

      {/* Pause Menu Overlay */}
      {hud && hud.screen === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/65">
          <div className="w-full max-w-sm bg-[#121614] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="font-display text-2xl font-bold text-[#f5f2eb] text-center">
              Game Dipause
            </h2>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => engine?.setScreen('playing')}
                className="w-full py-3 rounded-xl bg-[#d99b26] hover:bg-[#e5aa38] text-[#111311] font-semibold text-sm cursor-pointer"
              >
                {t(UI_STRINGS.resume, hud.language)}
              </button>
              <button
                type="button"
                onClick={() => engine?.saveGame()}
                className="w-full py-3 rounded-xl bg-[#1c231f] hover:bg-[#27312b] border border-white/10 text-[#f5f2eb] font-medium text-sm cursor-pointer"
              >
                {t(UI_STRINGS.saveGame, hud.language)}
              </button>
              <button
                type="button"
                onClick={() => {
                  engine?.setScreen('playing');
                  setDrawerTab('settings');
                }}
                className="w-full py-3 rounded-xl bg-[#1c231f] hover:bg-[#27312b] border border-white/10 text-[#f5f2eb] font-medium text-sm cursor-pointer"
              >
                {t(UI_STRINGS.settings, hud.language)}
              </button>
              <button
                type="button"
                onClick={() => engine?.setScreen('menu')}
                className="w-full py-3 rounded-xl bg-[#1c231f] hover:bg-red-950/60 border border-white/10 text-[#f5f2eb] font-medium text-sm cursor-pointer"
              >
                {t(UI_STRINGS.backToMenu, hud.language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
