/**
 * ElevenLabs Speech-to-Text Integration
 * Note: Browser Web Speech API is used as fallback
 */

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // TODO: Integrate ElevenLabs Whisper or use actual STT service
  // For MVP, using browser Web Speech API (see components/voice/VoiceRecorder.tsx)
  
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing ElevenLabs API key');
  }

  const formData = new FormData();
  formData.append('audio', audioBlob);

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`STT API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.text;
}
