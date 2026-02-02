import React, { useState } from 'react';

interface UrlInputProps {
  onUrlSubmit: (url: string) => void;
}

const UrlInput: React.FC<UrlInputProps> = ({ onUrlSubmit }) => {
  const [url, setUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onUrlSubmit(url);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
      <div className="mb-8 text-center space-y-4">
         <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-600 mb-4">
            ✨ Convert any documentation to MCP
         </div>
         <h1 className="text-5xl md:text-6xl font-bold text-slate-800 tracking-tight leading-tight">
            Structure the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Web</span>
         </h1>
         <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
            Enter a documentation URL. We'll triage, index, and create an intelligent context for your AI agent.
         </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full relative group">
        <div className={`
          absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200
          ${isFocused ? 'opacity-75' : ''}
        `}></div>
        
        <div className="relative bg-white rounded-[1.8rem] p-2 flex items-center shadow-xl">
           <div className="pl-6 pr-4 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
           </div>
           
           <input
             type="text"
             value={url}
             onChange={(e) => setUrl(e.target.value)}
             onFocus={() => setIsFocused(true)}
             onBlur={() => setIsFocused(false)}
             placeholder="https://pocketbase.io/docs/"
             className="flex-1 bg-transparent border-none outline-none text-lg text-slate-700 placeholder:text-slate-300 h-14"
           />

           <button 
             type="submit"
             disabled={!url}
             className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.4rem] px-8 h-14 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
           >
             <span>Triage</span>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
             </svg>
           </button>
        </div>
      </form>
      
      <div className="mt-12 flex items-center justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
         {/* Fake logos for tools */}
         <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xs">C</div>
            <span className="text-xs font-medium">Cursor</span>
         </div>
         <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-[#D97757] rounded-lg flex items-center justify-center text-white font-bold text-xs">Cl</div>
            <span className="text-xs font-medium">Claude</span>
         </div>
         <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-[#007ACC] rounded-lg flex items-center justify-center text-white font-bold text-xs">VS</div>
            <span className="text-xs font-medium">Code</span>
         </div>
      </div>
    </div>
  );
};

export default UrlInput;