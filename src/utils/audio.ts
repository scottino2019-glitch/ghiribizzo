/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class WackyAudioEngine {
  private ctx: AudioContext | null = null;
  private recorderDestination: MediaStreamAudioDestinationNode | null = null;
  private scribbleNoiseNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private scribbleGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private isMuted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    // Lazy initialized on first interaction
  }

  private initCtx() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Recorder node for capturing sound in video
      if (typeof this.ctx.createMediaStreamDestination === 'function') {
        this.recorderDestination = this.ctx.createMediaStreamDestination();
        this.masterGain.connect(this.recorderDestination);
      }

      this.initScribbleGenerator();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  // Gets the recorder audio stream track to add to MediaRecorder
  public getAudioStreamTrack(): MediaStreamTrack | null {
    this.initCtx();
    if (this.recorderDestination) {
      const tracks = this.recorderDestination.stream.getAudioTracks();
      return tracks.length > 0 ? tracks[0] : null;
    }
    return null;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  /**
   * Sound of typewriter keys clacking, using synthesis (Oscillator + Filter + Envelope)
   */
  public playTypewriterClack(isSpace = false, isEnter = false) {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    
    // Space makes a deep wooden thud, Enter makes a clack + "Ding!"
    if (isEnter) {
      // Clack first
      this.createClackNode(300, 0.04);
      // Carriage return bell (retro typewriter Ding!)
      this.playBellSound();
    } else if (isSpace) {
      this.createClackNode(120, 0.08, 0.4);
    } else {
      // Standard key click
      const frequency = 220 + Math.random() * 280;
      const duration = 0.015 + Math.random() * 0.015;
      this.createClackNode(frequency, duration, 0.6);
    }
  }

  private createClackNode(frequency: number, duration: number, gainValue = 0.5) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, now);
    
    // Add micro frequency modulation for extra "clickyness"
    osc.frequency.exponentialRampToValueAtTime(frequency / 3, now + duration);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency + 500, now);
    filter.Q.setValueAtTime(2, now);

    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  private playBellSound() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    const bandpass = this.ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1800, now); // Sweet bell frequency

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2600, now);

    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(2000, now);

    bellGain.gain.setValueAtTime(0.3, now);
    bellGain.gain.setValueAtTime(0.3, now + 0.01);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(bandpass);
    osc2.connect(bandpass);
    bandpass.connect(bellGain);
    bellGain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  }

  /**
   * Brush scratch white noise generator
   */
  private initScribbleGenerator() {
    if (!this.ctx || !this.masterGain) return;

    // We can simulate pencil noise using an oscillator with rapid amplitude random modifications
    // or synthesized white noise. Let's build a simple white noise buffer since ScriptProcessor can be slow
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    // Populate white noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // Create a node to play the noise in a loop
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter to make it sound scratchy/grainy (bandpass around 1200 - 3000 Hz)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.scribbleGain = this.ctx.createGain();
    this.scribbleGain.gain.setValueAtTime(0, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(this.scribbleGain);
    this.scribbleGain.connect(this.masterGain);

    noiseSource.start();
  }

  /**
   * Triggers or updates a scribble sound level based on mouse movement speed
   */
  public updateScribbleVolume(speed: number) {
    this.initCtx();
    if (!this.ctx || !this.scribbleGain || this.isMuted) return;

    const targetGain = Math.min(0.2, speed * 0.007); // Cap scribble noise at 0.2
    
    const now = this.ctx.currentTime;
    // Fast ramp to prevent glitchy popping sounds
    this.scribbleGain.gain.setTargetAtTime(targetGain, now, 0.05);
  }

  /**
   * Stop drawing scribble noise
   */
  public stopScribbleVolume() {
    if (!this.ctx || !this.scribbleGain) return;
    this.scribbleGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
  }

  /**
   * Play whoosh sound (board clear)
   */
  public playClearSound() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    // Apply high cut filter
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(800, now);

    osc.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  /**
   * Sound cues for starting/stopping video captures
   */
  public playRecordCue(isStart: boolean) {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    
    if (isStart) {
      // Double beep
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0.2, now + 0.08);
      gain.gain.setValueAtTime(0.001, now + 0.09);
      
      const secondOsc = this.ctx.createOscillator();
      const secondGain = this.ctx.createGain();
      secondOsc.type = 'sine';
      secondOsc.frequency.setValueAtTime(880, now + 0.15);
      secondGain.gain.setValueAtTime(0, now);
      secondGain.gain.setValueAtTime(0.2, now + 0.15);
      secondGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      secondOsc.connect(secondGain);
      secondGain.connect(this.masterGain);
      secondOsc.start(now);
      secondOsc.stop(now + 0.3);
    } else {
      // Descending warning sound
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.linearRampToValueAtTime(330, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  /**
   * Plays a custom synth note (random pitches) for crazy background/interactions
   */
  public playBoingSound() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const randomFreq = 150 + Math.random() * 200;
    osc.frequency.setValueAtTime(randomFreq, now);
    osc.frequency.exponentialRampToValueAtTime(randomFreq * 2.2, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const audioService = new WackyAudioEngine();
