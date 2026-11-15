// Web Speech API helper — Elder Mode voice prompts and spoken confirmations.
// Silently no-ops on browsers without speechSynthesis.

export function ttsAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string): void {
  if (!ttsAvailable()) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.lang = "en-IN";
    window.speechSynthesis.speak(utterance);
  } catch {
    // speech is a nicety, never a dependency
  }
}

export function stopSpeaking(): void {
  if (!ttsAvailable()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
