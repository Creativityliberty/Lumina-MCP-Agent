import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateArchitectureDoc } from '../services/geminiService';
import { getAppConfig } from '../services/storageService';

declare global {
  interface Window {
    mermaid: any;
  }
}

interface ArchitectureViewProps {
  url: string;
}

const ArchitectureView: React.FC<ArchitectureViewProps> = ({ url }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchArch = async () => {
        setLoading(true);
        const config = getAppConfig();
        
        const hasKey = config.provider === 'google' ? !!config.googleKey : !!config.openRouterKey;

        if (hasKey && url) {
            try {
                const doc = await generateArchitectureDoc(config, url);
                setContent(doc);
            } catch (e) {
                setContent(`# Error Generating Architecture\n\n${(e as Error).message}`);
            }
        } else if (!url) {
            setContent("# Waiting for Triage\n\nPlease go back to Home and enter a URL to analyze.");
        } else {
             setContent("# Configuration Missing\n\nPlease go to Settings and configure your API Provider.");
        }
        setLoading(false);
    };
    fetchArch();
  }, [url]);

  // Rerun mermaid when content changes
  useEffect(() => {
    if (content && !loading && window.mermaid) {
        setTimeout(() => {
            try {
                window.mermaid.contentLoaded();
            } catch (e) {
                console.error("Mermaid rendering failed", e);
            }
        }, 500);
    }
  }, [content, loading]);

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `architecture-${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  return (
    <div className="w-full max-w-5xl mx-auto h-[85vh] bg-white rounded-[2.5rem] shadow-xl border border-white/50 overflow-hidden flex flex-col animate-slideUp">
         <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center backdrop-blur-md sticky top-0 z-10">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">System Architecture</h2>
                <p className="text-slate-500 text-sm mt-1">Generated based on documentation analysis</p>
            </div>
            <button 
                onClick={handleDownload}
                disabled={!content || loading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download Markdown
            </button>
         </div>

         <div className="flex-1 overflow-y-auto p-10 bg-white" ref={contentRef}>
            {loading ? (
                <div className="space-y-6 animate-pulse max-w-3xl mx-auto mt-10">
                    <div className="h-10 bg-slate-100 rounded-lg w-1/3 mb-10"></div>
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                    <div className="h-64 bg-slate-50 border border-slate-100 rounded-2xl w-full mt-12 flex items-center justify-center">
                        <span className="text-slate-300 font-medium">Generating Diagrams...</span>
                    </div>
                </div>
            ) : (
                <div className="prose prose-slate prose-headings:font-bold prose-h1:text-3xl prose-h2:text-xl prose-p:text-slate-600 prose-pre:bg-slate-900 prose-pre:text-slate-50 lg:prose-lg max-w-none">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code({node, inline, className, children, ...props}: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const isMermaid = match && match[1] === 'mermaid';
                                
                                if (isMermaid) {
                                    return (
                                        <div className="mermaid">
                                            {String(children).replace(/\n$/, '')}
                                        </div>
                                    );
                                }
                                
                                if (inline) {
                                    return (
                                        <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-sm" {...props}>
                                            {children}
                                        </code>
                                    );
                                }

                                return (
                                    <pre className="rounded-xl overflow-hidden !bg-slate-900 !p-0 my-6 shadow-lg">
                                        <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700/50 text-xs text-slate-400 font-mono">
                                            {match ? match[1] : 'text'}
                                        </div>
                                        <div className="p-4 overflow-x-auto">
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        </div>
                                    </pre>
                                );
                            },
                            table: ({node, ...props}) => (
                                <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 shadow-sm">
                                  <table className="min-w-full divide-y divide-slate-200" {...props} />
                                </div>
                            ),
                            thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
                            th: ({node, ...props}) => <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider" {...props} />,
                            td: ({node, ...props}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 border-t border-slate-100" {...props} />,
                            blockquote: ({node, ...props}) => (
                                <blockquote className="border-l-4 border-indigo-500 pl-4 italic bg-indigo-50/30 py-2 pr-2 rounded-r-lg text-slate-600 my-4" {...props} />
                            )
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            )}
         </div>
    </div>
  );
};

export default ArchitectureView;