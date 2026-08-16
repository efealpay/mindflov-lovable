// @ts-nocheck
import React from 'react';
import { X, Command, Delete, CornerDownLeft, MousePointerClick, ZoomIn, Move, MousePointer2 } from 'lucide-react';

const CheatSheetModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "Ctrl / Cmd + Z", label: "Undo", icon: <CornerDownLeft className="w-4 h-4 scale-x-[-1]" /> },
    { key: "Ctrl / Cmd + Y", label: "Redo", icon: <CornerDownLeft className="w-4 h-4" /> },
    { key: "Delete / Backspace", label: "Delete selected node(s)", icon: <Delete className="w-4 h-4" /> },
    { key: "Double Click Canvas", label: "Create new node", icon: <MousePointerClick className="w-4 h-4" /> },
    { key: "Double Click Node", label: "Edit node label", icon: <Command className="w-4 h-4" /> },
    { key: "Drag from Node Ring", label: "Create connection", icon: <MousePointer2 className="w-4 h-4" /> },
    { key: "Scroll Wheel", label: "Zoom canvas", icon: <ZoomIn className="w-4 h-4" /> },
    { key: "Left / Middle Drag", label: "Pan canvas", icon: <Move className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0f172a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-2">
          <ul className="divide-y divide-white/5">
            {shortcuts.map((shortcut, index) => (
              <li key={index} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors">
                <div className="flex items-center gap-3 text-white/70">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
                    {shortcut.icon}
                  </div>
                  <span className="text-sm font-medium">{shortcut.label}</span>
                </div>
                <div className="px-2.5 py-1 text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 rounded">
                  {shortcut.key}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CheatSheetModal;
