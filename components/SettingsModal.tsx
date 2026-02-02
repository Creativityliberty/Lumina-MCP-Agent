import React, { useState, useEffect } from 'react';
import { AppConfig, AIProvider } from '../types';
import { getAppConfig, saveAppConfig } from '../services/storageService';
import { AVAILABLE_MODELS } from '../services/geminiService';

interface SettingsProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsProps> = ({ onClose }) => {
  const [config, setConfig] = useState<AppConfig>({
    provider: 'google',
    googleKey: '',
    openRouterKey: '',
    selectedModelId: 'gemini-3-flash-preview'
  });

  useEffect(() => {
    setConfig(getAppConfig());
  }, []);

  const handleSave = () => {
    saveAppConfig(config);
    onClose();
  };

  const handleProviderChange = (provider: AIProvider) => {
    // Set default model when switching provider
    const defaultModel = provider === 'google' 
      ? 'gemini-3-flash-preview' 
      : 'openrouter/auto';
      
    setConfig(prev => ({ ...prev, provider, selectedModelId: defaultModel }));
  };

  // Filter models based on selected provider
  const currentModels = AVAILABLE_MODELS.filter(m => m.provider === config.provider);

  return (
    <div className="w-full max-w-2xl mx-auto animate-fadeIn pb-20">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">System Configuration</h2>
        <p className="text-slate-500 mb-8">Choose your intelligence provider and manage access keys.</p>
        
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-8">
            
            {/* Provider Selection */}
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">AI Provider</label>
               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleProviderChange('google')}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      config.provider === 'google' 
                        ? 'border-indigo-500 bg-indigo-50/50' 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                     <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-green-500 flex items-center justify-center text-[10px] text-white font-bold">G</div>
                        <span className={`font-semibold ${config.provider === 'google' ? 'text-indigo-900' : 'text-slate-600'}`}>Google Gemini</span>
                     </div>
                     <p className="text-xs text-slate-400">Native integration, fast & reliable.</p>
                     {config.provider === 'google' && <div className="absolute top-3 right-3 w-3 h-3 bg-indigo-500 rounded-full shadow-lg ring-2 ring-white"></div>}
                  </button>

                  <button 
                    onClick={() => handleProviderChange('openrouter')}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      config.provider === 'openrouter' 
                        ? 'border-purple-500 bg-purple-50/50' 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                     <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-[10px] text-white font-bold">OR</div>
                        <span className={`font-semibold ${config.provider === 'openrouter' ? 'text-purple-900' : 'text-slate-600'}`}>OpenRouter</span>
                     </div>
                     <p className="text-xs text-slate-400">Access Llama, Qwen, DeepSeek & more.</p>
                     {config.provider === 'openrouter' && <div className="absolute top-3 right-3 w-3 h-3 bg-purple-500 rounded-full shadow-lg ring-2 ring-white"></div>}
                  </button>
               </div>
            </div>

            {/* API Key Input */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  {config.provider === 'google' ? 'Google API Key' : 'OpenRouter API Key'}
                </label>
                <div className="relative group">
                    <input 
                        type="password" 
                        value={config.provider === 'google' ? config.googleKey : config.openRouterKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfig(prev => config.provider === 'google' 
                            ? { ...prev, googleKey: val } 
                            : { ...prev, openRouterKey: val }
                          );
                        }}
                        placeholder={config.provider === 'google' ? "AIzaSy..." : "sk-or-v1..."}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono text-slate-700"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                        {config.provider === 'google' ? 'ai.google.dev' : 'openrouter.ai/keys'}
                    </div>
                </div>
            </div>

            {/* Model Selection */}
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Select Model</label>
               <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                  {currentModels.map((model) => (
                    <div 
                      key={model.id}
                      onClick={() => setConfig(prev => ({ ...prev, selectedModelId: model.id }))}
                      className={`
                        flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                        ${config.selectedModelId === model.id 
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                          : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}
                      `}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{model.name}</span>
                          {model.isFree && (
                             <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide">Free</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{model.description}</div>
                      </div>
                      
                      {config.selectedModelId === model.id && (
                        <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                           </svg>
                        </div>
                      )}
                    </div>
                  ))}
               </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                <button 
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
                >
                    Save Configuration
                </button>
            </div>
        </div>
    </div>
  );
};

export default SettingsModal;