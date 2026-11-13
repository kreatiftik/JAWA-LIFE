import React, { useEffect, useRef } from 'react';
import { GameHudState } from '../game/types';
import { ROAD_SEGMENTS } from '../game/worldData';

interface MinimapProps {
  hud: GameHudState;
  onOpenMap: () => void;
}

export const Minimap: React.FC<MinimapProps> = ({ hud, onOpenMap }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 164;
    const half = size / 2;
    const scale = 0.62; // pixels per meter

    ctx.clearRect(0, 0, size, size);

    // Background biome tint
    ctx.fillStyle = '#18221b';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(half, half);

    // Helper: world -> minimap
    const toMap = (wx: number, wz: number): [number, number] => [
      (wx - hud.playerX) * scale,
      (wz - hud.playerZ) * scale,
    ];

    // Draw Ocean south-east
    const [, oceanY] = toMap(0, 195);
    if (oceanY < half + 40) {
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(-half - 20, oceanY, size + 40, size + 60);
    }

    // Draw Danau Ranu (-95, 202)
    const [lx, ly] = toMap(-95, 202);
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.arc(lx, ly, 30 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Draw Kali Brantas river
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let z = -25; z <= 115; z += 14) {
      const rx = -78 + Math.sin(z * 0.05) * 8;
      const [mx, my] = toMap(rx, z);
      if (z === -25) ctx.moveTo(mx, my);
      else ctx.lineTo(mx, my);
    }
    ctx.stroke();

    // Draw Road Network
    for (const r of ROAD_SEGMENTS) {
      const [x1, y1] = toMap(r.x1, r.z1);
      const [x2, y2] = toMap(r.x2, r.z2);
      ctx.strokeStyle = r.paved ? '#64748b' : '#927452';
      ctx.lineWidth = Math.max(2.5, r.width * scale * 0.75);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw GPS Route Line to objective
    if (hud.gpsTarget) {
      const [gx, gy] = toMap(hud.gpsTarget.x, hud.gpsTarget.z);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(gx, gy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Clamp beacon marker inside edge if far
      const distPx = Math.hypot(gx, gy);
      const maxR = half - 10;
      const cx = distPx > maxR ? (gx / distPx) * maxR : gx;
      const cy = distPx > maxR ? (gy / distPx) * maxR : gy;

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw NPCs & Vehicles
    for (const ent of hud.minimapEntities) {
      if (ent.kind === 'mission') continue;
      const [ex, ey] = toMap(ent.x, ent.z);
      if (Math.abs(ex) > half || Math.abs(ey) > half) continue;

      if (ent.kind === 'npc') {
        ctx.fillStyle = '#34d399';
        ctx.fillRect(ex - 1.5, ey - 1.5, 3, 3);
      } else if (ent.kind === 'vehicle') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(ex - 2, ey - 2, 4, 4);
      } else if (ent.kind === 'landmark') {
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player heading arrow at center (0, 0)
    // In Three.js +Z is South (down on map), +X is East (right on map), yaw=0 faces +Z
    ctx.save();
    ctx.rotate(-hud.playerYaw);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(-5, -5);
    ctx.lineTo(0, -2.5);
    ctx.lineTo(5, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // Subtle North marker
    ctx.fillStyle = 'rgba(245, 242, 235, 0.78)';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.fillText('U', half - 3.5, 11);
  }, [hud]);

  const gpsDist = hud.gpsTarget
    ? Math.round(Math.hypot(hud.gpsTarget.x - hud.playerX, hud.gpsTarget.z - hud.playerZ))
    : null;

  return (
    <button
      type="button"
      onClick={onOpenMap}
      title="Bukak Peta & GPS"
      className="group relative flex flex-col items-center bg-[#121614]/90 border border-[#d99b26]/35 rounded-xl p-2 shadow-xl hover:border-[#d99b26] transition-colors text-left focus-visible:outline-2 focus-visible:outline-[#d99b26]"
    >
      <div className="relative overflow-hidden rounded-lg border border-white/10">
        <canvas ref={canvasRef} width={164} height={164} className="block w-[148px] h-[148px] sm:w-[164px] sm:h-[164px]" />
      </div>
      <div className="w-full mt-1.5 flex items-center justify-between text-[11px] font-mono-tabular text-[#d6d0c4] px-0.5">
        <span className="truncate max-w-[105px]">
          {hud.gpsTarget ? hud.gpsTarget.label : 'Eksplorasi Bebas'}
        </span>
        {gpsDist !== null && (
          <span className="text-[#f5b942] font-semibold shrink-0">{gpsDist}m</span>
        )}
      </div>
    </button>
  );
};
