import React, { useEffect, useState } from 'react';
import { ChatSession } from '../types';
import { getSessions, deleteSession } from '../services/storageService';

interface HistoryViewProps {
  onSelectSession: (session: ChatSession) => void;
  onStartNew: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ onSelectSession, onStartNew }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const loadSessions = () => {
    setSessions(getSessions());
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this session?")) {
      deleteSession(id);
      loadSessions();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fadeIn pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h2 className="text-3xl font-bold text-slate-800">Chat History</h2>
           <p className="text-slate-500 mt-1">Manage and resume your previous conversations</p>
        </div>
        <button 
          onClick={onStartNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-medium transition-all shadow-lg hover:shadow-indigo-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Chat
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           <p className="text-lg">No saved sessions yet.</p>
           <button onClick={onStartNew} className="mt-4 text-indigo-600 hover:underline">Start a new conversation</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div 
              key={session.id}
              onClick={() => onSelectSession(session)}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3.75h9m-9 3.75h9m-9 3.75h9m-9-15h9.75M3.75 6.75h-.75v13.5h.75m1.5-12h-.75v10.5h.75m1.5-9h-.75v7.5h.75m1.5-6h-.75v4.5h.75" />
                       </svg>
                    </div>
                 </div>
                 <button 
                   onClick={(e) => handleDelete(e, session.id)}
                   className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                   title="Delete Session"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                   </svg>
                 </button>
              </div>

              <h3 className="font-bold text-slate-800 mb-2 truncate pr-6">{session.title}</h3>
              
              <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                    {formatDate(session.date)}
                  </span>
                  {session.contextUrl && (
                     <span className="text-xs font-medium text-blue-500 bg-blue-50 px-2 py-1 rounded-md truncate max-w-[120px]">
                        {session.contextUrl.replace(/https?:\/\//, '')}
                     </span>
                  )}
              </div>

              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                 {session.messages.length > 1 ? session.messages[session.messages.length - 1].text : 'No messages yet.'}
              </p>
              
              <div className="absolute inset-0 border-2 border-indigo-500 opacity-0 group-hover:opacity-100 rounded-[2rem] pointer-events-none transition-opacity duration-300" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;