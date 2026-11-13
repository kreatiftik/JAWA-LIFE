/**
 * Procedural Web Audio API sound engine for Jawa Life:
 * - Gamelan Pelog pentatonic metallophone & Gong Ageng
 * - Dawn rooster crowing, tropical birds, rain noise, ocean surf
 * - Vehicle engine hum scaled by speed, klakson (horn), footsteps, mission fanfare
 */
export class JawaAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private rainNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;

  private muted = false;
  private gamelanEnabled = true;
  private gamelanTimer = 0;
  private gamelanStep = 0;
  private natureTimer = 0;
  private stepTimer = 0;

  // Pelog pentatonic scale frequencies (Hz)
  private readonly pelogScale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
  private readonly gamelanPattern = [0, 2, 4, 2, 5, 4, 2, 1, 0, 3, 4, 5, 4, 2, 1, 0];

  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.42;
    this.masterGain.connect(this.ctx.destination);

    // Continuous engine oscillator (idle silent until driving)
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 55;
    const engineFilter = this.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 260;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineOsc.connect(engineFilter);
    engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    this.engineOsc.start();

    // Rain noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const out = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      out[i] = Math.random() * 2 - 1;
    }
    this.rainNode = this.ctx.createBufferSource();
    this.rainNode.buffer = noiseBuffer;
    this.rainNode.loop = true;
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 1100;
    rainFilter.Q.value = 0.6;
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;
    this.rainNode.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    this.rainNode.start();
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.42, this.ctx.currentTime, 0.05);
    }
  }

  public setGamelanEnabled(enabled: boolean) {
    this.gamelanEnabled = enabled;
  }

  public isMuted() {
    return this.muted;
  }

  public isGamelanEnabled() {
    return this.gamelanEnabled;
  }

  public update(
    dt: number,
    opts: {
      inVehicle: boolean;
      speedRatio: number;
      isWalking: boolean;
      isRaining: boolean;
      timeOfDay: number;
      nearCandiOrDesa: boolean;
    }
  ) {
    if (!this.ctx || !this.masterGain || this.ctx.state !== 'running' || this.muted) return;
    const now = this.ctx.currentTime;

    // Engine hum
    if (this.engineGain && this.engineOsc) {
      if (opts.inVehicle) {
        const targetFreq = 48 + opts.speedRatio * 125;
        const targetGain = 0.04 + opts.speedRatio * 0.06;
        this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.06);
        this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
      } else {
        this.engineGain.gain.setTargetAtTime(0, now, 0.08);
      }
    }

    // Rain sound
    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(opts.isRaining ? 0.14 : 0, now, 0.3);
    }

    // Footsteps
    if (!opts.inVehicle && opts.isWalking) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.36;
        this.playSoftStep();
      }
    }

    // Gamelan background music when enabled & near Desa/Candi or gentle ambiance
    if (this.gamelanEnabled) {
      this.gamelanTimer -= dt;
      if (this.gamelanTimer <= 0) {
        this.gamelanTimer = 0.52;
        const vol = opts.nearCandiOrDesa ? 0.08 : 0.035;
        const noteIdx = this.gamelanPattern[this.gamelanStep % this.gamelanPattern.length];
        this.playSaronNote(this.pelogScale[noteIdx], vol);
        if (this.gamelanStep % 8 === 0) {
          this.playGongAgeng(vol * 0.9);
        }
        this.gamelanStep++;
      }
    }

    // Nature sounds: Dawn rooster or daytime birds
    this.natureTimer -= dt;
    if (this.natureTimer <= 0) {
      this.natureTimer = 7 + Math.random() * 6;
      if (opts.timeOfDay >= 5 && opts.timeOfDay <= 7.5) {
        this.playRoosterCrow();
      } else if (opts.timeOfDay > 7.5 && opts.timeOfDay < 17 && !opts.isRaining) {
        this.playBirdChirp();
      }
    }
  }

  private playSaronNote(freq: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const oscOver = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    oscOver.type = 'triangle';
    oscOver.frequency.setValueAtTime(freq * 2.01, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.95);

    const overGain = this.ctx.createGain();
    overGain.gain.value = 0.25;

    osc.connect(gain);
    oscOver.connect(overGain);
    overGain.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    oscOver.start(now);
    osc.stop(now + 1.0);
    oscOver.stop(now + 1.0);
  }

  private playGongAgeng(volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(73.42, now);
    osc.frequency.exponentialRampToValueAtTime(71.5, now + 2.2);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 2.6);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 2.7);
  }

  private playSoftStep() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.07);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  private playBirdChirp() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1850, now);
    osc.frequency.exponentialRampToValueAtTime(2450, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1750, now + 0.16);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.19);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  private playRoosterCrow() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.linearRampToValueAtTime(640, now + 0.2);
    osc.frequency.linearRampToValueAtTime(510, now + 0.45);
    osc.frequency.linearRampToValueAtTime(720, now + 0.72);
    osc.frequency.exponentialRampToValueAtTime(340, now + 1.15);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 950;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.2);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.25);
  }

  public playHorn() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    [349.23, 440].forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.27);
    });
  }

  public playChime() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    this.playSaronNote(523.25, 0.12);
    setTimeout(() => this.playSaronNote(659.25, 0.11), 110);
  }

  public playMissionFanfare() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    [261.63, 329.63, 392.0, 523.25].forEach((f, idx) => {
      setTimeout(() => this.playSaronNote(f, 0.14), idx * 120);
    });
    setTimeout(() => this.playGongAgeng(0.18), 420);
  }

  public dispose() {
    try {
      this.engineOsc?.stop();
      this.rainNode?.stop();
      void this.ctx?.close();
    } catch {
      // ignore audio teardown errors
    }
  }
}
