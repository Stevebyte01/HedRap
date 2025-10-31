import React from 'react';
import { AlertCircle, Loader } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center">
        <Loader className="w-12 h-12 animate-spin text-purple-500 mb-4" />
        <p className="text-xl">Loading...</p>
      </div>
    </div>
  );
}

export function ErrorBanner({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-white hover:text-gray-200">
          ✕
        </button>
      )}
    </div>
  );
}
