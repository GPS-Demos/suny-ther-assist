
import React, { useState } from 'react';
import { SparklesIcon, LoadingSpinner } from '../utils/icons';

interface TranscriptInputProps {
  onAnalyze: (transcript: string) => void;
  isLoading: boolean;
}

const TranscriptInput: React.FC<TranscriptInputProps> = ({ onAnalyze, isLoading }) => {
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const handleAnalyzeClick = () => {
    if (transcript.trim().length < 50) {
      setError('Please enter a transcript of at least 50 characters.');
      return;
    }
    setError('');
    onAnalyze(transcript);
  };

  const handleSampleClick = () => {
    setTranscript(`Social Worker: "Hi Maria, thanks for meeting with me. I wanted to start by checking in about how things have been since we last spoke. How is little Leo doing?"

Client (Maria): "Things are okay. Leo is... he's a handful. Always running around."

Social Worker: "It sounds like he has a lot of energy! That can be tough to manage. You mentioned last time that you were feeling overwhelmed. I'm wondering what kind of support you have. Is there anyone you can call on when things get difficult?"

Client: "Not really. My mom lives out of state. It's just me."

Social Worker: "That sounds incredibly difficult, doing it all on your own. It shows a lot of strength. I want to be clear that my role here is to support you and help you find resources, not to judge. We want to work together to make sure Leo is safe and you feel supported. Have you ever heard of the local Family Resource Center? They have drop-in childcare and parenting groups."

Client: "I think I saw a flyer for it once. I don't know..."

Social Worker: "How about we look at their website together right now? Maybe we can find a group that looks interesting to you. No pressure at all, just exploring options."`);
     setError('');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 h-full flex flex-col">
      <h2 className="text-xl font-bold text-slate-800 mb-2">Submit Your Transcript</h2>
      <p className="text-slate-600 mb-4 text-sm">
        Paste your training exercise transcript below. The AI will provide feedback to help you grow.
      </p>
      <div className="flex-grow flex flex-col">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste your transcript here..."
          className="w-full flex-grow p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 resize-none text-sm text-slate-700 bg-slate-50"
          aria-label="Transcript Input"
        />
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <button
            onClick={handleAnalyzeClick}
            disabled={isLoading || !transcript}
            className="w-full sm:w-auto flex-grow inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
            {isLoading ? <LoadingSpinner /> : <SparklesIcon className="h-5 w-5 mr-2" />}
            Analyze Transcript
        </button>
         <button
            onClick={handleSampleClick}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
            Use Sample
        </button>
      </div>
    </div>
  );
};

export default TranscriptInput;
