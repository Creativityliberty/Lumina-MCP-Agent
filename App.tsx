import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import UrlInput from './components/UrlInput';
import PageTriage from './components/PageTriage';
import ChatInterface from './components/ChatInterface';
import SettingsModal from './components/SettingsModal';
import ArchitectureView from './components/ArchitectureView';
import HistoryView from './components/HistoryView';
import { AppView, ChatSession } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [contextUrl, setContextUrl] = useState<string>('');
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);

  const handleUrlSubmit = (url: string) => {
    setContextUrl(url);
    setCurrentSessionId(undefined); // Reset session for new triage
    setCurrentView('triage');
  };

  const handleStartChatFromTriage = () => {
    setCurrentSessionId(undefined); // Start fresh session
    setCurrentView('chat');
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setContextUrl(session.contextUrl || '');
    setCurrentView('chat');
  };

  const handleStartNewChat = () => {
    setCurrentSessionId(undefined);
    setContextUrl('');
    setCurrentView('home');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <UrlInput onUrlSubmit={handleUrlSubmit} />;
      case 'triage':
        return (
          <PageTriage 
            url={contextUrl} 
            onStartChat={handleStartChatFromTriage} 
            onGenerateArch={() => setCurrentView('architecture')}
          />
        );
      case 'chat':
        return (
          <ChatInterface 
            contextUrl={contextUrl} 
            sessionId={currentSessionId}
            onSessionChange={(id) => setCurrentSessionId(id)}
          />
        );
      case 'settings':
        return <SettingsModal onClose={() => setCurrentView('home')} />;
      case 'architecture':
        return <ArchitectureView url={contextUrl} />;
      case 'history':
        return (
          <HistoryView 
            onSelectSession={handleSelectSession} 
            onStartNew={handleStartNewChat}
          />
        );
      default:
        return <UrlInput onUrlSubmit={handleUrlSubmit} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* 
        Background gradients for the "Innovative" feel 
      */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-200/20 rounded-full blur-[100px] mix-blend-multiply filter"></div>
         <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-purple-200/20 rounded-full blur-[100px] mix-blend-multiply filter"></div>
         <div className="absolute bottom-[-10%] left-[20%] w-[45rem] h-[45rem] bg-pink-100/30 rounded-full blur-[100px] mix-blend-multiply filter"></div>
      </div>

      <Sidebar currentView={currentView} onChangeView={setCurrentView} />

      <main className="flex-1 ml-20 md:ml-32 p-8 md:p-12 relative z-10 transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;