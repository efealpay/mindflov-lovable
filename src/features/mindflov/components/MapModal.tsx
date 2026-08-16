// @ts-nocheck
import React, { useState } from 'react';
import { X, FolderOpen, Save, Plus, Trash2, Edit2, Check } from 'lucide-react';

const MapModal = ({ 
    isOpen, 
    onClose, 
    mode, 
    mindmaps, 
    currentMindmapId,
    onLoad, 
    onSave, 
    onDelete,
    onRename,
    newMapTitle,
    setNewMapTitle
}) => {
  const [editingMapId, setEditingMapId] = useState(null);
  const [editingMapTitle, setEditingMapTitle] = useState('');

  if (!isOpen) return null;

  const handleEditClick = (e, map) => {
      e.stopPropagation();
      setEditingMapId(map.id);
      setEditingMapTitle(map.title || 'Untitled Map');
  };

  const handleRenameSubmit = (e, mapId) => {
      e.stopPropagation();
      if (editingMapTitle.trim()) {
          onRename(mapId, editingMapTitle.trim());
      }
      setEditingMapId(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0f172a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            {mode === 'load' ? <FolderOpen className="w-4 h-4 text-indigo-400" /> : <Save className="w-4 h-4 text-emerald-400" />}
            {mode === 'load' ? 'Load Mindmap' : 'Save Mindmap'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
            {mode === 'save' && (
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest block mb-1">Save as New</label>
                        <div className="flex gap-2">
                            <input 
                                value={newMapTitle}
                                onChange={(e) => setNewMapTitle(e.target.value)}
                                placeholder="Concept Name..."
                                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                            <button 
                                onClick={() => onSave(newMapTitle, true)}
                                disabled={!newMapTitle.trim()}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 transition-colors"
                            >
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>
                    </div>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-white/20 text-xs font-bold uppercase tracking-widest">Or Update Existing</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>
                </div>
            )}

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {mindmaps.length === 0 ? (
                    <div className="text-center py-8 text-white/40 text-sm">No saved mindmaps found.</div>
                ) : (
                    mindmaps.map(map => (
                        <div key={map.id} className="group flex items-center justify-between p-3 bg-white/5 border border-white/5 hover:border-indigo-500/30 rounded-xl hover:bg-white/10 transition-all cursor-pointer">
                            <div 
                                className="flex-1 min-w-0 pr-4" 
                                onClick={(e) => {
                                    if (editingMapId === map.id) {
                                        e.stopPropagation();
                                        return;
                                    }
                                    mode === 'load' ? onLoad(map.id) : onSave(map.title, false, map.id);
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {editingMapId === map.id ? (
                                        <div className="flex items-center gap-2 w-full">
                                            <input 
                                                autoFocus
                                                value={editingMapTitle}
                                                onChange={(e) => setEditingMapTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRenameSubmit(e, map.id);
                                                    if (e.key === 'Escape') setEditingMapId(null);
                                                }}
                                                className="flex-1 bg-black/50 border border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                            />
                                            <button onClick={(e) => handleRenameSubmit(e, map.id)} className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded">
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setEditingMapId(null); }} className="p-1 hover:bg-white/10 text-white/40 rounded">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="text-sm font-bold text-white truncate group-hover:text-amber-50">{map.title || 'Untitled Map'}</h3>
                                            {map.id === currentMindmapId && <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-emerald-500/30">Current</span>}
                                            {map.id === 'current' && <span className="bg-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-amber-500/30">Auto-Save</span>}
                                        </>
                                    )}
                                </div>
                                {editingMapId !== map.id && (
                                    <div className="text-xs text-white/40 mt-1 flex items-center gap-3">
                                        <span>{map.nodes ? map.nodes.length : 0} Nodes</span>
                                        <span>{new Date(map.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                            
                            {editingMapId !== map.id && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => handleEditClick(e, map)}
                                        className="p-2 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-all"
                                        title="Rename Map"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDelete(map.id); }}
                                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                                        title="Delete Map"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
