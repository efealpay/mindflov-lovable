// @ts-nocheck
import React, { useState } from 'react';
import { Plus, Settings, LogOut, ArrowRight, Layers, LogIn, Edit2, Check, X, Trash2, Copy, MessageSquare, Home, ArrowDown, ArrowUp, ShieldAlert } from 'lucide-react';

const HomeScreen = ({ 
    user, 
    mindmaps, 
    subscriptionTier, 
    onOpenMap, 
    onCreateMap, 
    onRenameMap, 
    onDeleteMap,
    onDuplicateMap,
    onShowSelectAuth, 
    onShowSettings,
    onShowUpgrade,
    onSignOut,
    onFeedback,
    isAdmin,
    onShowAdmin
}) => {
    const [editingMapId, setEditingMapId] = useState(null);
    const [editingMapTitle, setEditingMapTitle] = useState('');
    const [sortBy, setSortBy] = useState('updated');
    const [sortOrder, setSortOrder] = useState('desc');

    const handleEditClick = (e, map) => {
        e.stopPropagation();
        setEditingMapId(map.id);
        setEditingMapTitle(map.title || 'Untitled Map');
    };

    const handleRenameSubmit = (e, mapId) => {
        e.stopPropagation();
        if (editingMapTitle.trim()) {
            onRenameMap(mapId, editingMapTitle.trim());
        }
        setEditingMapId(null);
    };

    const formatTimestamp = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const sortedMindmaps = [...mindmaps].sort((a, b) => {
        let diff = 0;
        if (sortBy === 'updated') {
            diff = (b.updatedAt || 0) - (a.updatedAt || 0);
        } else if (sortBy === 'created') {
            diff = (b.createdAt || 0) - (a.createdAt || 0);
        } else if (sortBy === 'nodes') {
            diff = (b.nodes?.length || 0) - (a.nodes?.length || 0);
        }
        return sortOrder === 'asc' ? -diff : diff;
    });

    const renderPreview = (nodes, links) => {
        if (!nodes || nodes.length === 0) return <Layers className="w-4 h-4 text-white/50" />;
        const minX = Math.min(...nodes.map(n => n.x));
        const maxX = Math.max(...nodes.map(n => n.x));
        const minY = Math.min(...nodes.map(n => n.y));
        const maxY = Math.max(...nodes.map(n => n.y));
        const width = Math.max(maxX - minX + 200, 400);
        const height = Math.max(maxY - minY + 200, 400);
        const padding = 100;

        return (
            <svg viewBox={`${minX - padding} ${minY - padding} ${width} ${height}`} className="w-full h-full opacity-40 group-hover:opacity-100 transition-opacity">
                {links && links.map((l, index) => {
                    const src = nodes.find(n => n.id === l.source);
                    const tgt = nodes.find(n => n.id === l.target);
                    if (!src || !tgt) return null;
                    return <line key={`preview-link-${l.source}-${l.target}-${index}`} x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y} stroke="white" strokeWidth="12" strokeOpacity="0.4" />
                })}
                {nodes.map(n => (
                    <circle key={n.id} cx={n.x} cy={n.y} r="35" fill={n.color || '#6366f1'} className="stroke-black stroke-[4px]" />
                ))}
            </svg>
        );
    };

    return (
        <div className="flex h-screen w-full overflow-y-auto bg-[#020617] text-white font-sans p-8">
            <div className="max-w-7xl mx-auto w-full space-y-12 h-fit">
                
                {/* Header */}
                <header className="flex justify-between items-center bg-black/40 backdrop-blur-3xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <img src="/logoCircle.svg" alt="Mindflov App" className="w-8 h-8" />
                        </div>
                        <div>
                            <img src="/logo.svg" alt="Mindflov Logo" className="h-[28px] drop-shadow-xl" />
                            <p className="text-sm font-semibold text-white/50 tracking-wide">Workspace Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => window.location.href = 'https://mindflov.com'} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-colors text-sm flex items-center gap-2" title="Return to Website">
                            <Home className="w-4 h-4" /> Home
                        </button>
                        
                        {user ? (
                            <>
                                <button onClick={onFeedback} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-colors text-sm flex items-center gap-2" title="Send Feedback">
                                    <MessageSquare className="w-4 h-4" /> Feedback
                                </button>
                                {isAdmin && (
                                    <button onClick={onShowAdmin} className="p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors" title="Admin Dashboard">
                                        <ShieldAlert className="w-5 h-5 text-red-400" />
                                    </button>
                                )}
                                <button onClick={onShowSettings} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors" title="Settings">
                                    <Settings className="w-5 h-5 text-white/70" />
                                </button>
                                <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                                    <div className="text-right">
                                        <div className="text-sm font-bold">{user.isAnonymous ? 'Guest User' : user.displayName || user.email}</div>
                                        <div className="text-xs font-semibold text-indigo-400 capitalize tracking-widest">{subscriptionTier} Plan</div>
                                    </div>
                                    <button onClick={onSignOut} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-colors" title="Sign Out">
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                    {subscriptionTier === 'free' && (
                                        <button onClick={onShowUpgrade} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-sm tracking-wide">
                                            Upgrade
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <button onClick={onShowSelectAuth} className="px-6 py-2.5 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all text-sm flex items-center gap-2">
                                <LogIn className="w-4 h-4" /> Sign In
                            </button>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                {user ? (
                    <main className="space-y-8">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight mb-2">Your Canvases</h2>
                                <p className="text-white/50 font-medium">Create a new concept or continue where you left off.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                                    <button 
                                        onClick={() => setSortBy('updated')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'updated' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                                    >
                                        Last Edited
                                    </button>
                                    <button 
                                        onClick={() => setSortBy('created')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'created' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                                    >
                                        Created
                                    </button>
                                    <button 
                                        onClick={() => setSortBy('nodes')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'nodes' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                                    >
                                        Node Count
                                    </button>
                                </div>
                                <button
                                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                                    title={sortOrder === 'desc' ? "Descending" : "Ascending"}
                                >
                                    {sortOrder === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            {/* Create New Card */}
                            <button 
                                onClick={onCreateMap}
                                className="h-48 rounded-3xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-indigo-400/50 transition-all flex flex-col items-center justify-center gap-4 group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <span className="font-bold tracking-wide text-white/70 group-hover:text-white">Create New Canvas</span>
                            </button>

                            {/* Saved Maps */}
                            {sortedMindmaps.map(map => (
                                <div 
                                    key={map.id} 
                                    onClick={() => onOpenMap(map.id)}
                                    className="h-48 group relative rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl hover:bg-black/60 hover:border-white/30 transition-all cursor-pointer flex flex-col shadow-2xl overflow-hidden"
                                >
                                    <div className="absolute inset-0 z-0 flex items-center justify-center">
                                        {renderPreview(map.nodes, map.links)}
                                    </div>
                                    <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

                                    {/* Content */}
                                    <div className="mt-auto relative z-10 p-6">
                                        {editingMapId === map.id ? (
                                            <div className="flex items-center gap-2 mb-2 w-full">
                                                <input 
                                                    autoFocus
                                                    value={editingMapTitle}
                                                    onChange={(e) => setEditingMapTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleRenameSubmit(e, map.id);
                                                        if (e.key === 'Escape') setEditingMapId(null);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-1 bg-black/50 border border-indigo-500 rounded px-2 py-1 text-sm font-bold text-white focus:outline-none"
                                                />
                                                <button onClick={(e) => handleRenameSubmit(e, map.id)} className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setEditingMapId(null); }} className="p-1 hover:bg-white/10 text-white/40 rounded">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <h3 className="text-xl font-bold tracking-tight text-white mb-2 line-clamp-1">{map.title || 'Untitled Map'}</h3>
                                        )}
                                        <div className="flex justify-between items-center text-xs font-semibold text-white/40">
                                            <span>{map.nodes ? map.nodes.length : 0} Nodes</span>
                                            <span>{formatTimestamp(map.updatedAt)}</span>
                                        </div>
                                    </div>

                                    {/* Hover Actions */}
                                    {editingMapId !== map.id && (
                                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDuplicateMap(map.id); }}
                                                className="p-2 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-all backdrop-blur-md bg-black/50"
                                                title="Duplicate Map"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={(e) => handleEditClick(e, map)}
                                                className="p-2 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-all backdrop-blur-md bg-black/50"
                                                title="Rename Map"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteMap(map.id); }}
                                                className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all backdrop-blur-md bg-black/50"
                                                title="Delete Map"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </main>
                ) : (
                    <main className="flex-1 flex items-center justify-center py-20">
                         <div className="text-center max-w-lg">
                            <div className="w-24 h-24 bg-indigo-500/20 text-indigo-400 rounded-3xl mx-auto flex flex-col items-center justify-center mb-8 rotate-3 shadow-2xl">
                                <Layers className="w-12 h-12" />
                            </div>
                            <h2 className="text-4xl font-black mb-4 tracking-tight">Sign in to sync your mind</h2>
                            <p className="text-white/50 text-lg font-medium mb-10 leading-relaxed">
                                Access your workspaces from anywhere. Cloud synchronization and powerful AI expansion available across all your linked devices.
                            </p>
                            <button onClick={onShowSelectAuth} className="mx-auto px-8 py-4 bg-white text-black font-black tracking-wide rounded-2xl hover:bg-gray-200 transition-all text-sm flex items-center justify-center gap-3 shadow-xl">
                                <LogIn className="w-5 h-5" /> Sign In / Create Account
                            </button>
                         </div>
                    </main>
                )}
            </div>
        </div>
    );
};

export default HomeScreen;
