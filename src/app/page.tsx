'use client';

import { useState } from 'react';
import VoiceRecorder from '@/components/voice/VoiceRecorder';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">
            AI Voice Support
          </h1>
          <p className="text-gray-500">
            Talk to our AI assistant for instant answers, or connect with a human agent.
          </p>
        </div>

        {/* Voice Recorder Component */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8">
          <VoiceRecorder onLoadingChange={setIsLoading} />
        </div>

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Speak Naturally</h3>
            <p className="text-gray-500 text-sm">
              Just ask your question in a natural voice.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-1">AI Powered</h3>
            <p className="text-gray-500 text-sm">
              Our AI understands your question and finds answers fast.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Human Support</h3>
            <p className="text-gray-500 text-sm">
              Complex questions escalate to our support team.
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="mt-12 flex items-center justify-center gap-4">
          <a
            href="/tickets"
            className="inline-flex items-center gap-2 px-5 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View All Tickets
          </a>
          <a
            href="/admin/login"
            className="inline-block px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition"
          >
            Admin Login
          </a>
        </div>
      </div>
    </main>
  );
}
