// Voice synthesis: tries ElevenLabs first (if VITE_ELEVENLABS_API_KEY is set),
// otherwise falls back to the browser's SpeechSynthesis API.

const VOICE_IDS = {
  watson: "JBFqnCBsd6RMkjVDRZzb", // George — confident, authoritative
  crick: "TxGEqnHWrfWFTfGW9XjX", // Josh — younger, energetic
};

const MODEL_ID = "eleven_turbo_v2_5";

export type VoiceHandle = {
  audio: HTMLAudioElement | null;
  stop: () => void;
  source: "elevenlabs" | "browser";
};

export async function speak(text: string, voice: "watson" | "crick"): Promise<VoiceHandle> {
  const apiKey = (import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined)?.trim();

  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_IDS[voice]}/stream?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: MODEL_ID,
            voice_settings: {
              stability: 0.55,
              similarity_boost: 0.75,
              style: 0.4,
              use_speaker_boost: true,
            },
          }),
        },
      );
      if (!res.ok) throw new Error(`ElevenLabs failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      audio.addEventListener("ended", () => URL.revokeObjectURL(url));
      return {
        audio,
        source: "elevenlabs",
        stop: () => {
          audio.pause();
          audio.currentTime = 0;
          URL.revokeObjectURL(url);
        },
      };
    } catch (err) {
      console.warn("[voice] ElevenLabs failed, falling back to browser TTS:", err);
    }
  }

  return browserSpeak(text, voice);
}

function browserSpeak(text: string, voice: "watson" | "crick"): VoiceHandle {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { audio: null, source: "browser", stop: () => {} };
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = voice === "crick" ? 1.2 : 0.9;
  // Try to pick a male english voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => /en[-_]/i.test(v.lang) && /male|david|daniel|alex|fred|google uk english male/i.test(v.name),
  );
  if (preferred) utter.voice = preferred;
  window.speechSynthesis.speak(utter);
  return {
    audio: null,
    source: "browser",
    stop: () => window.speechSynthesis.cancel(),
  };
}

export function hasElevenLabsKey(): boolean {
  return Boolean((import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined)?.trim());
}