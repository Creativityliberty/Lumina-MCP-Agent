import React, { useState, useEffect } from 'react';
import { ScrapedPage } from '../types';

interface PageTriageProps {
  url: string;
  onStartChat: () => void;
  onGenerateArch: () => void;
}

const PageTriage: React.FC<PageTriageProps> = ({ url, onStartChat, onGenerateArch }) => {
  const [pages, setPages] = useState<ScrapedPage[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock Scraper Simulation
  useEffect(() => {
    setLoading(true);
    const mockData: ScrapedPage[] = [
      { title: 'Introduction', url: `${url}/intro`, category: 'Docs', status: 'indexed' },
      { title: 'Authentication', url: `${url}/auth`, category: 'API', status: 'indexed' },
      { title: 'Collections', url: `${url}/collections`, category: 'Guide', status: 'indexed' },
      { title: 'API Rules', url: `${url}/api-rules`, category: 'API', status: 'indexed' },
      { title: 'Realtime', url: `${url}/realtime`, category: 'Guide', status: 'indexed' },
      { title: 'File Storage', url: `${url}/files`, category: 'Guide', status: 'indexed' },
      { title: 'System Architecture', url: `${url}/architecture`, category: 'Other', status: 'indexed' },
      { title: 'Web APIs reference', url: `${url}/web-api`, category: 'API', status: 'indexed' },
    ];

    const timer = setTimeout(() => {
      setPages(mockData);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [url]);

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Docs': return 'bg-blue-100 text-blue-600';
      case 'API': return 'bg-purple-100 text-purple-600';
      case 'Guide': return 'bg-amber-100 text-amber-600';
      case 'Other': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const copyMcpLink = () => {
      navigator.clipboard.writeText(`https://tomcp.org/${url.replace(/https?:\/\//, '')}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="relative w-24 h-24">
           <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
           <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
           </div>
        </div>
        <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-slate-800">Analyzing Structure</h3>
            <p className="text-slate-500">Retrieving nodes from {url}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fadeIn pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Knowledge Graph</h2>
          <p className="text-slate-500 font-medium mt-1">Found {pages.length} connectable endpoints.</p>
        </div>
        <div className="flex gap-3">
             <button onClick={onGenerateArch} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold transition-all">
                View Architecture
             </button>
             <button onClick={onStartChat} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-indigo-200 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                Chat with Context
             </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
         
         {/* Card Header */}
         <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.546-3.131 1.567-4.333M8 21h8" />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Discovered Nodes</h3>
         </div>

         {/* List Items */}
         <div className="space-y-6 pl-2">
            {pages.map((page, idx) => (
                <div key={idx} className="flex items-center gap-6 group">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide min-w-[60px] text-center ${getCategoryStyles(page.category)}`}>
                        {page.category}
                    </span>
                    <span className="text-slate-700 font-medium text-lg group-hover:text-indigo-600 transition-colors cursor-default">
                        {page.title}
                    </span>
                </div>
            ))}
         </div>
      </div>
      
      {/* Simplified MCP Config Access */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex items-center justify-between">
            <div>
                <h4 className="font-semibold text-slate-800">MCP Merge Tool</h4>
                <p className="text-sm text-slate-500">Access all {pages.length} endpoints via a single MCP server.</p>
            </div>
            <button 
                onClick={copyMcpLink}
                className="text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
                Copy Config Link
            </button>
      </div>

    </div>
  );
};

export default PageTriage;