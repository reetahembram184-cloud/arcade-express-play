type SoundName = "start" | "score" | "best" | "over" | "click";

const SOUND_KEY = "opplay:sound-enabled";
let context: AudioContext | null = null;

export function isGameSoundEnabled() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SOUND_KEY) !== "false";
}

export function setGameSoundEnabled(enabled: boolean) {
  localStorage.setItem(SOUND_KEY, String(enabled));
}

function audioContext() {
  if (context) return context;
  const AudioContextClass = window.AudioContext;
  context = new AudioContextClass();
  return context;
}

export function playGameSound(name: SoundName) {
  if (typeof window === "undefined" || !isGameSoundEnabled()) return;
  try {
    const ctx = audioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const notes: Record<SoundName, Array<[number, number, OscillatorType]>> = {
      start: [[330, 0, "square"], [494, 0.08, "square"], [659, 0.16, "square"]],
      score: [[720, 0, "sine"], [960, 0.045, "sine"]],
      best: [[523, 0, "triangle"], [659, 0.1, "triangle"], [784, 0.2, "triangle"]],
      over: [[330, 0, "sawtooth"], [247, 0.13, "sawtooth"], [165, 0.26, "sawtooth"]],
      click: [[440, 0, "square"]],
    };

    for (const [frequency, delay, type] of notes[name]) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const begins = ctx.currentTime + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, begins);
      gain.gain.setValueAtTime(name === "over" ? 0.045 : 0.035, begins);
      gain.gain.exponentialRampToValueAtTime(0.001, begins + 0.1);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(begins);
      oscillator.stop(begins + 0.11);
    }
  } catch {
    // Audio is an enhancement; browser restrictions must never affect play.
  }
}