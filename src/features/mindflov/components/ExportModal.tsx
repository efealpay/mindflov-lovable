// @ts-nocheck
import React from 'react';
import { X, FileText, Globe, Image, Download, FileCode, Lock } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportTXT: () => void;
  onExportMD: () => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  subscriptionTier: string;
  onShowUpgrade: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExportTXT, onExportMD, onExportSVG, onExportPNG, subscriptionTier, onShowUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            Export Mind Map
          </h2>
          <p className="text-slate-400 text-xs mt-1">Choose a format to save your work.</p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          <button 
            onClick={() => { onExportMD(); onClose(); }}
            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-500/20 rounded-lg text-blue-400 group-hover:text-blue-300 group-hover:scale-110 transition-all">
                <FileCode className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white group-hover:text-blue-200">Markdown (.md)</div>
                <div className="text-[10px] text-slate-500">Notion-ready hierarchy with details</div>
              </div>
            </div>
          </button>

          <button 
            onClick={() => { onExportTXT(); onClose(); }}
            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:text-indigo-300 group-hover:scale-110 transition-all">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white group-hover:text-indigo-200">Text Hierarchy (.txt)</div>
                <div className="text-[10px] text-slate-500">Structured outline format</div>
              </div>
            </div>
          </button>

          <button 
            onClick={() => { 
              onExportSVG(); 
              onClose(); 
            }}
            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 rounded-xl transition-all group relative overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-emerald-500/20 rounded-lg text-emerald-400 group-hover:text-emerald-300 group-hover:scale-110 transition-all">
                <Globe className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white group-hover:text-emerald-200 flex items-center gap-2">
                  Vector Image (.svg)
                </div>
                <div className="text-[10px] text-slate-500">Infinite scaling, editable</div>
              </div>
            </div>
          </button>

          <button 
            onClick={() => { 
              onExportPNG(); 
              onClose(); 
            }}
            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 rounded-xl transition-all group relative overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-amber-500/20 rounded-lg text-amber-400 group-hover:text-amber-300 group-hover:scale-110 transition-all">
                <Image className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white group-hover:text-amber-200 flex items-center gap-2">
                  High-Res Image (.png)
                </div>
                <div className="text-[10px] text-slate-500">Universal format, 2x scale</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
