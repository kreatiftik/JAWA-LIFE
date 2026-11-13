import React from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { LanguageMode } from '../game/types';
import { SHOPS, t } from '../game/jawaData';

interface ShopModalProps {
  shopId: string;
  money: number;
  language: LanguageMode;
  onBuy: (shopId: string, itemId: string) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  shopId,
  money,
  language,
  onBuy,
  onClose,
}) => {
  const shop = SHOPS[shopId];
  if (!shop) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/55">
      <div className="w-full max-w-xl bg-[#121614] border border-[#d99b26]/40 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d99b26]/20 border border-[#d99b26]/40 flex items-center justify-center text-[#f5b942] shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-[#f5f2eb]">
                {t(shop.title, language)}
              </h3>
              <div className="text-xs text-[#b8b1a3] flex items-center gap-2 mt-0.5">
                <span>{shop.keeper}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular text-[#f5b942] font-semibold">
                  Rp {money.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#a8a195] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-[#d6d0c4] italic">
          “{t(shop.greeting, language)}”
        </p>

        <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
          {shop.items.map((item) => {
            const canAfford = money >= item.price;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#1a201c] border border-white/10"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-[#f5f2eb]">
                    {t(item.name, language)}
                  </div>
                  <p className="text-xs text-[#a8a195] mt-0.5 leading-snug">
                    {t(item.description, language)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => onBuy(shopId, item.id)}
                  className={`shrink-0 px-4 py-2 rounded-lg text-xs font-semibold font-mono-tabular transition-colors whitespace-nowrap ${
                    canAfford
                      ? 'bg-[#d99b26] hover:bg-[#e5aa38] text-[#111311] cursor-pointer'
                      : 'bg-white/5 text-white/35 cursor-not-allowed'
                  }`}
                >
                  Rp {item.price.toLocaleString('id-ID')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
