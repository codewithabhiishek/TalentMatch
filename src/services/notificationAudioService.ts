/**
 * TalentMatch Notification & Audio Chime Service
 * 
 * Provides:
 * 1. Web Audio API synthesized harmonic clinical chime (zero external audio file dependencies)
 * 2. Electron Native OS Notifications (Windows Action Center & macOS Notification Center)
 * 3. HTML5 Web Notification API for standard browser sessions
 * 4. Window focus & dock/taskbar alerting when running in background
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationAlertOptions {
  title: string;
  message: string;
  type?: NotificationType;
  soundEnabled?: boolean;
  desktopEnabled?: boolean;
}

class NotificationAudioService {
  private audioCtx: AudioContext | null = null;

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

  /**
   * Plays a crisp, melodic 2-note harmonic clinical chime (D5 -> A5)
   */
  public playChime(type: NotificationType = 'success'): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Uplifting high-tech chime for success/info, cautionary drop for warning/error
      const isPositive = type === 'success' || type === 'info';
      const note1 = isPositive ? 587.33 : 659.25; // D5 vs E5
      const note2 = isPositive ? 880.00 : 523.25; // A5 vs C5

      // Note 1 (First harmonic tone)
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

      // Note 2 (Second sparkling tone)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(note2, now + 0.07);
      gain2.gain.setValueAtTime(0.0001, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.26, now + 0.10);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.45);
    } catch (err) {
      console.warn('[NotificationAudioService] Failed to synthesize chime:', err);
    }
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
      desktopEnabled = true,
    } = options;

    if (typeof window === 'undefined') return;

    // 1. Play synthesized Web Audio chime if sound is enabled
    if (soundEnabled) {
      this.playChime(type);
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

