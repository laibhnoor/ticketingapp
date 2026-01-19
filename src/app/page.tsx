'use client';

import { useState } from 'react';
import VoiceRecorder from '@/components/voice/VoiceRecorder';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Voice Support
            </h1>
            <p className="text-lg text-gray-600">
              Talk to our AI assistant for instant answers, or connect with a human agent.
            </p>
          </div>

          {/* Voice Recorder Component */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <VoiceRecorder onLoadingChange={setIsLoading} />
          </div>

          {/* Info Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow">
              <div className="text-2xl mb-2">??</div>
              <h3 className="font-semibold text-gray-900 mb-2">Speak Naturally</h3>
              <p className="text-gray-600 text-sm">
                Just ask your question in a natural voice.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <div className="text-2xl mb-2">??</div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Powered</h3>
              <p className="text-gray-600 text-sm">
                Our AI understands your question and finds answers fast.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <div className="text-2xl mb-2">??</div>
              <h3 className="font-semibold text-gray-900 mb-2">Human Support</h3>
              <p className="text-gray-600 text-sm">
                Complex questions escalate to our support team.
              </p>
            </div>
          </div>

          {/* Admin Link */}
          <div className="mt-12 text-center">
            <a
              href="/admin/dashboard"
              className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
            >
              Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
