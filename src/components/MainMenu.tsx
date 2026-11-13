import React from 'react';
import { Play, RotateCcw, Globe, Volume2, VolumeX, Compass } from 'lucide-react';
import { LanguageMode } from '../game/types';
import { UI_STRINGS, t } from '../game/jawaData';

interface MainMenuProps {
  language: LanguageMode;
  hasSaveData: boolean;
  audioMuted: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onChangeLanguage: (lang: LanguageMode) => void;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  language,
  hasSaveData,
  audioMuted,
  onNewGame,
  onContinue,
  onChangeLanguage,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-gradient-to-r from-[#0c100e]/92 via-[#0c100e]/68 to-transparent">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Hero Title & Primary Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono-tabular tracking-wider text-[#f5b942]">
              <span>JAWA TIMUR OPEN WORLD</span>
              <span aria-hidden="true">·</span>
              <span>3D ADVENTURE</span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-[#f8f5ee] leading-[1.06] text-balance">
              JAWA LIFE
            </h1>
            <p className="font-display text-xl sm:text-2xl font-semibold text-[#e2c27d]">
              Petualangan ing Tanah Jawa
            </p>
            <p className="text-sm sm:text-base text-[#cfc9bc] max-w-xl leading-relaxed">
              {language === 'ngoko'
                ? 'Jelajahi desa, kutha, sawah, gunung, candi, lan pesisir Pantai Kidul minangka Bagas. Numpak motor utawa mobil, ngobrol nganggo basa Jawa, lan ngrampungake misi warga.'
                : language === 'krama'
                  ? 'Tliti dhusun, kitha, sabin, redi, candhi, lan pasisir Seganten Kidul minangka Bagas. Nitih motor utawi mobil, sesambetan mawi basa Jawi, lan ngrampungaken ayahan.'
                  : 'Jelajahi desa, kota, sawah, pegunungan, candi, dan pesisir Pantai Selatan sebagai Bagas. Kendarai motor maupun mobil, berinteraksi dengan bahasa Jawa, dan selesaikan misi warga.'}
            </p>
          </div>

          {/* Primary Menu Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {hasSaveData && (
              <button
                type="button"
                onClick={onContinue}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#d99b26] hover:bg-[#e5aa38] text-[#111311] font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t(UI_STRINGS.continueGame, language)}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onNewGame}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap ${
                hasSaveData
                  ? 'bg-[#1c231f] hover:bg-[#27312b] text-[#f5f2eb] border border-white/15'
                  : 'bg-[#d99b26] hover:bg-[#e5aa38] text-[#111311]'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t(UI_STRINGS.newGame, language)}</span>
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-[#1c231f] hover:bg-[#27312b] text-[#e5e0d5] border border-white/15 text-sm transition-colors cursor-pointer whitespace-nowrap"
              aria-label="Toggle Audio"
            >
              {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{audioMuted ? 'Audio Bisu' : 'Gamelan & Audio'}</span>
            </button>
          </div>

          {/* Language Selector */}
          <div className="pt-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#b8b1a3]">
              <Globe className="w-3.5 h-3.5 text-[#f5b942]" />
              <span>Pilihan Basa Dialog & UI:</span>
            </div>
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#141916] border border-white/10">
              {(['ngoko', 'krama', 'indonesia'] as LanguageMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChangeLanguage(mode)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    language === mode
                      ? 'bg-[#d99b26] text-[#111311] font-semibold'
                      : 'text-[#cfc9bc] hover:text-white'
                  }`}
                >
                  {mode === 'ngoko' ? 'Jawa Ngoko' : mode === 'krama' ? 'Jawa Krama' : 'Bahasa Indonesia'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Controls & Region Guide Card */}
        <div className="lg:col-span-5 bg-[#121614]/92 border border-white/12 rounded-2xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center gap-2.5 text-[#f5b942]">
            <Compass className="w-5 h-5" />
            <h2 className="font-display text-lg font-semibold text-[#f5f2eb]">
              Panduan Kontrol & Wilayah
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/8 pb-1.5">
              <span className="text-[#a8a195]">Mlaku / Nyetir</span>
              <span className="font-mono-tabular font-semibold text-[#f5f2eb]">W A S D</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/8 pb-1.5">
              <span className="text-[#a8a195]">Mlayu / Rem</span>
              <span className="font-mono-tabular font-semibold text-[#f5f2eb]">Shift / Space</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/8 pb-1.5">
              <span className="text-[#a8a195]">Interaksi NPC</span>
              <span className="font-mono-tabular font-semibold text-[#f5b942]">E</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/8 pb-1.5">
              <span className="text-[#a8a195]">Numpak / Mudhun</span>
              <span className="font-mono-tabular font-semibold text-[#f5b942]">F</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/8 pb-1.5">
              <span className="text-[#a8a195]">Klakson</span>
              <span className="font-mono-tabular font-semibold text-[#f5f2eb]">H</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/8 pb-1.5">
              <span className="text-[#a8a195]">Putar Kamera</span>
              <span className="font-mono-tabular font-semibold text-[#f5f2eb]">Drag / Q C</span>
            </div>
          </div>

          <div className="pt-1 space-y-1.5 text-xs text-[#b8b1a3]">
            <div className="text-[#f5f2eb] font-medium">5 Kawasan Jawa Timur:</div>
            <p className="leading-relaxed">
              Desa Sukamaju · Kota Mojosari · Pegunungan Arjuno · Pesisir Pantai Kidul · Candi Majapahit & Danau Ranu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
