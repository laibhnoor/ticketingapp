'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface VoiceRecorderProps {
  onLoadingChange?: (isLoading: boolean) => void;
}

export default function VoiceRecorder({ onLoadingChange }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use a format supported by most browsers
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await sendAudioToAPI(webmBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript('');
      setResponse('');
    } catch (err) {
      toast.error('Unable to access microphone');
      console.error('Microphone error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Convert webm to wav using Web Audio API
  const convertToWav = async (webmBlob: Blob): Promise<Blob> => {
    try {
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create WAV file
      const wavBuffer = audioBufferToWav(audioBuffer);
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } catch (err) {
      console.error('Conversion error:', err);
      throw new Error('Failed to convert audio format');
    }
  };

  // Helper function to convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF identifier
    setUint32(0x46464952);
    // file length minus RIFF identifier length and file description length
    setUint32(length - 8);
    // RIFF type
    setUint32(0x45564157);
    // format chunk identifier
    setUint32(0x20746d66);
    // format chunk length
    setUint32(16);
    // sample format (raw)
    setUint16(1);
    // channel count
    setUint16(buffer.numberOfChannels);
    // sample rate
    setUint32(buffer.sampleRate);
    // byte rate (sample rate * block align)
    setUint32(buffer.sampleRate * buffer.numberOfChannels * 2);
    // block align (channel count * bytes per sample)
    setUint16(buffer.numberOfChannels * 2);
    // bits per sample
    setUint16(16);
    // data chunk identifier
    setUint32(0x61746164);
    // data chunk length
    setUint32(length - pos - 4);

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return arrayBuffer;
  };

  const sendAudioToAPI = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      // Convert webm to wav before sending
      const wavBlob = await convertToWav(audioBlob);
      
      // 1️⃣ Transcribe audio
      const formData = new FormData();
      formData.append('file', wavBlob, 'recording.wav');

      const transcribeRes = await fetch('/api/transcribe', { 
        method: 'POST', 
        body: formData 
      });
      
      if (!transcribeRes.ok) throw new Error('Transcription failed');
      const transcribeData = await transcribeRes.json();
      const text = transcribeData.text || 'Could not transcribe audio';
      setTranscript(text);

      // 2️⃣ Send text to your AI / voice API
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      setResponse(data.message);

      // 3️⃣ Play TTS response if provided
      if (data.audio_url) {
        const audio = new Audio(data.audio_url);
        audio.play().catch((err) => console.error('Audio play error:', err));
      }

      // 4️⃣ Notifications
      if (data.ticket_created) {
        toast.success('Your issue has been escalated to our support team');
      } else if (data.faq_matched) {
        toast.success(`Confidence: ${(data.confidence * 100).toFixed(0)}%`);
      }
    } catch (err) {
      toast.error('Error processing request');
      console.error('API error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isLoading}
        className={`px-8 py-4 rounded-full font-semibold text-white text-lg transition ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? '⏳ Processing...' : isRecording ? '🎤 Stop Recording' : '🎤 Start Recording'}
      </button>

      {transcript && (
        <div className="w-full bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-gray-600 mb-1">You said:</div>
          <div className="text-gray-900">{transcript}</div>
        </div>
      )}

      {response && (
        <div className="w-full bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-gray-600 mb-1">AI Response:</div>
          <div className="text-gray-900">{response}</div>
        </div>
      )}

      {isLoading && (
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      )}
    </div>
  );
}