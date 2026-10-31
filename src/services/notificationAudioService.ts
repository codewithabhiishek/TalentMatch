/**
 * TalentMatch Notification & Audio Chime Service
 * 
 * Provides:
 * 1. Web Audio API synthesized harmonic clinical chimes (zero external audio dependencies, 100% offline)
 * 2. Multi-sound library: Clinical Harmonic, Crystal Bell, Warm Marimba, Zen Harp, Radar Pulse, Minimalist Pop
 * 3. Electron Native OS Notifications (Windows Action Center & macOS Notification Center)
 * 4. HTML5 Web Notification API for standard browser sessions
 * 5. Window focus & dock/taskbar alerting when running in background
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type ChimeSound =
  | 'clinical-chime'
  | 'crystal-bell'
  | 'marimba-spark'
  | 'zen-harp'
  | 'radar-ping'
  | 'subtle-pop';

export interface SoundOption {
  id: ChimeSound;
  name: string;
  description: string;
  tag: string;
}

export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'clinical-chime',
    name: 'Clinical Harmonic',
    description: 'Uplifting 2-tone melodic medical chime (D5-A5)',
    tag: 'Default',
  },
  {
    id: 'crystal-bell',
    name: 'Crystal Bell',
    description: 'Bright 3-tone shimmering crystalline arpeggio',
    tag: 'Bright',
  },
  {
    id: 'marimba-spark',
    name: 'Warm Marimba',
    description: 'Resonant acoustic wooden percussion chords',
    tag: 'Mellow',
  },
  {
    id: 'zen-harp',
    name: 'Zen Harp',
    description: 'Gentle soothing pentatonic harp pluck',
    tag: 'Relaxing',
  },
  {
    id: 'radar-ping',
    name: 'Radar Pulse',
    description: 'Modern frequency-sweep sonar pulse',
    tag: 'Tech',
  },
  {
    id: 'subtle-pop',
    name: 'Minimalist Pop',
    description: 'Quick unobtrusive dual-click droplet pop',
    tag: 'Minimal',
  },
];

export interface NotificationAlertOptions {
  title: string;
  message: string;
  type?: NotificationType;
  soundEnabled?: boolean;
  soundChoice?: ChimeSound;
  desktopEnabled?: boolean;
}

class NotificationAudioService {
  private audioCtx: AudioContext | null = null;
  private currentSoundChoice: ChimeSound = 'clinical-chime';

  /**
   * Set user preferred sound choice
   */
  public setSoundChoice(choice: ChimeSound): void {
    this.currentSoundChoice = choice;
  }

  /**
   * Lazily initialize or resume AudioContext on user interaction
   */
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }

      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      return this.audioCtx;
    } catch (e) {
      console.warn('[NotificationAudioService] AudioContext unavailable:', e);
      return null;
    }
  }

  // --- Sound 1: Clinical Harmonic (D5 -> A5) ---
  private playClinicalHarmonic(ctx: AudioContext, now: number, isPositive: boolean): void {
    const note1 = isPositive ? 587.33 : 659.25; // D5 vs E5
    const note2 = isPositive ? 880.00 : 523.25; // A5 vs C5

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(note1, now);
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.28);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(note2, now + 0.07);
    gain2.gain.setValueAtTime(0.0001, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.10);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.45);
  }

  // --- Sound 2: Crystal Bell (C6 -> E6 -> G6) ---
  private playCrystalBell(ctx: AudioContext, now: number, isPositive: boolean): void {
    const notes = isPositive ? [1046.50, 1318.51, 1567.98] : [1318.51, 1046.50, 783.99];

    notes.forEach((freq, idx) => {
      const delay = idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      // Add soft bell sparkle
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.20, now + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.45);
    });

    // High crystalline shimmer overtone
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(isPositive ? 3135.96 : 2637.02, now + 0.12);
    shimmerGain.gain.setValueAtTime(0.0001, now + 0.12);
    shimmerGain.gain.exponentialRampToValueAtTime(0.06, now + 0.14);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmer.start(now + 0.12);
    shimmer.stop(now + 0.55);
  }

  // --- Sound 3: Warm Marimba (F4 -> A4 -> C5 acoustic wood) ---
  private playWarmMarimba(ctx: AudioContext, now: number, isPositive: boolean): void {
    const chords = isPositive ? [349.23, 440.00, 523.25] : [440.00, 392.00, 329.63];

    // Lowpass filter for warm wooden texture
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.connect(ctx.destination);

    chords.forEach((freq, idx) => {
      const delay = idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.24, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.32);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now + delay);
      osc.stop(now + delay + 0.32);
    });
  }

  // --- Sound 4: Zen Harp (G4 -> D5 -> G5) ---
  private playZenHarp(ctx: AudioContext, now: number, isPositive: boolean): void {
    const notes = isPositive ? [392.00, 587.33, 783.99] : [587.33, 440.00, 392.00];

    notes.forEach((freq, idx) => {
      const delay = idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.22, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.55);
    });
  }

  // --- Sound 5: Radar Pulse (High-tech frequency sweep) ---
  private playRadarPulse(ctx: AudioContext, now: number, isPositive: boolean): void {
    const startFreq = isPositive ? 960 : 600;
    const endFreq = isPositive ? 680 : 420;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.22);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.26, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    // Subtle resonance overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(startFreq * 1.5, now);
    osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.5, now + 0.18);

    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.22);
  }

  // --- Sound 6: Minimalist Pop (Quick dual droplet clicks) ---
  private playMinimalistPop(ctx: AudioContext, now: number, isPositive: boolean): void {
    const pop1Freq = isPositive ? 440 : 520;
    const pop2Freq = isPositive ? 680 : 380;

    // Click 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(pop1Freq, now);
    osc1.frequency.exponentialRampToValueAtTime(pop1Freq * 1.6, now + 0.035);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.20, now + 0.005);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Click 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(pop2Freq, now + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(pop2Freq * 1.5, now + 0.095);

    gain2.gain.setValueAtTime(0.0001, now + 0.06);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.065);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.12);
  }

  /**
   * Read saved sound preference from persistent storage
   */
  private getSavedSoundChoice(): ChimeSound {
    if (typeof window === 'undefined') return 'clinical-chime';
    try {
      const raw = localStorage.getItem('talentflow-storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.state?.notificationSettings?.soundChoice) {
          return parsed.state.notificationSettings.soundChoice;
        }
      }
    } catch {}
    return this.currentSoundChoice || 'clinical-chime';
  }

  /**
   * Play specific sound by ID (or user's saved preference)
   */
  public playSound(soundId?: ChimeSound, type: NotificationType = 'success'): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const isPositive = type === 'success' || type === 'info';
      const resolvedSound = soundId || this.getSavedSoundChoice();

      switch (resolvedSound) {
        case 'crystal-bell':
          this.playCrystalBell(ctx, now, isPositive);
          break;
        case 'marimba-spark':
          this.playWarmMarimba(ctx, now, isPositive);
          break;
        case 'zen-harp':
          this.playZenHarp(ctx, now, isPositive);
          break;
        case 'radar-ping':
          this.playRadarPulse(ctx, now, isPositive);
          break;
        case 'subtle-pop':
          this.playMinimalistPop(ctx, now, isPositive);
          break;
        case 'clinical-chime':
        default:
          this.playClinicalHarmonic(ctx, now, isPositive);
          break;
      }
    } catch (err) {
      console.warn('[NotificationAudioService] Failed to synthesize sound:', err);
    }
  }

  /**
   * Compatibility wrapper for playChime
   */
  public playChime(type: NotificationType = 'success', soundChoice?: ChimeSound): void {
    this.playSound(soundChoice || this.currentSoundChoice, type);
  }

  /**
   * Sends real-time Desktop / OS Notification with Sound
   */
  public async dispatchAlert(options: NotificationAlertOptions): Promise<void> {
    const {
      title,
      message,
      type = 'info',
      soundEnabled = true,
      soundChoice = 'clinical-chime',
      desktopEnabled = true,
    } = options;

    if (typeof window === 'undefined') return;

    // 1. Play chosen synthesized Web Audio sound if enabled
    if (soundEnabled) {
      this.playSound(soundChoice, type);
    }

    // If desktop push alerts are disabled in user settings, stop here
    if (!desktopEnabled) return;

    // 2. Check Electron Native Desktop Notification (Windows & macOS)
    const electronAPI = (window as unknown as { electronAPI?: { isElectron?: boolean; showNotification?: (opts: { title: string; body: string; silent: boolean }) => Promise<boolean> } }).electronAPI;

    if (electronAPI?.isElectron && typeof electronAPI.showNotification === 'function') {
      try {
        await electronAPI.showNotification({
          title,
          body: message,
          silent: !soundEnabled,
        });
        return;
      } catch (err) {
        console.warn('[NotificationAudioService] Electron notification failed:', err);
      }
    }

    // 3. Browser Web Notification API (HTML5)
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const notif = new Notification(title, {
            body: message,
            icon: '/favicon.svg',
            silent: !soundEnabled,
          });
          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        } catch (err) {
          console.warn('[NotificationAudioService] HTML5 notification failed:', err);
        }
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }

  /**
   * Request browser permission explicitly
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  }

  /**
   * Check current notification status
   */
  public getStatus(): { isElectron: boolean; permission: NotificationPermission | 'unsupported' } {
    if (typeof window === 'undefined') {
      return { isElectron: false, permission: 'unsupported' };
    }
    const isElectron = Boolean((window as unknown as { electronAPI?: { isElectron?: boolean } }).electronAPI?.isElectron);
    const permission = 'Notification' in window ? Notification.permission : 'unsupported';
    return { isElectron, permission };
  }
}

export const notificationAudio = new NotificationAudioService();
