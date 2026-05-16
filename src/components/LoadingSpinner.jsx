import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] text-slate-400 animate-in fade-in duration-300">
      <Loader2 className="w-10 h-10 animate-spin text-green-500 mb-3" />
      <p className="text-sm font-bold tracking-wider uppercase">{message}</p>
    </div>
  );
}