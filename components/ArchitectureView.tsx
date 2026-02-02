import React, { useEffect, useState } from 'react';
import { generateArchitectureDoc } from '../services/geminiService';
import { getAppConfig } from '../services/storageService';

interface ArchitectureViewProps {
  url: string;
}

const ArchitectureView: React.FC<ArchitectureViewProps> = ({ url }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchArch = async () => {
        setLoading(true);
        const config = getAppConfig();
        
        // Basic check to see if *an* API key is set based on provider
        const hasKey = config.provider === 'google' ? !!config.googleKey : !!config.openRouterKey;

        if (hasKey && url) {
            const doc = await generateArchitectureDoc(config, url);
            setContent(doc);
        } else if (!url) {
            setContent("Please start by triaging a URL in the Home tab.");
        } else {
             setContent("Please configure your API Provider and Key in Settings.");
        }
        setLoading(false);
    };
    fetchArch();
  }, [url]);

  return (
    <div className="w-full max-w-5xl mx-auto h-[85vh] bg-white rounded-[2.5rem] shadow-xl border border-white/50 overflow-hidden flex flex-col animate-slideUp">
         <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">System Architecture</h2>
                <p className="text-slate-500 text-sm mt-1">Generated based on documentation analysis</p>
            </div>
            <button className="text-indigo-600 text-sm font-medium hover:underline">Download Markdown</button>
         </div>

         <div className="flex-1 overflow-y-auto p-10 bg-white">
            {loading ? (
                <div className="space-y-4 animate-pulse">
                    <div className="h-8 bg-slate-100 rounded w-1/3 mb-8"></div>
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                    <div className="h-32 bg-slate-100 rounded w-full mt-8"></div>
                </div>
            ) : (
                <article className="prose prose-slate lg:prose-lg max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-slate-600 leading-relaxed">
                        {content}
                    </pre>
                </article>
            )}
         </div>
    </div>
  );
};

export default ArchitectureView;