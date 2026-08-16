// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, getFirestore } from '@/lib/cloud/db';
import { X, Users, Settings, Activity, ShieldAlert, CheckCircle2, BarChart2, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';

const db = getFirestore();

interface UserData {
  id: string;
  email: string;
  displayName: string | null;
  subscriptionTier: string;
  tokensUsed: number;
  lastTokenReset: number;
  createdAt: number;
  licenseKey?: string;
}

interface ConfigData {
  WEEKLY_LIMIT: number;
  PLUS_TOKEN_LIMIT: number;
  PRO_TOKEN_LIMIT: number;
  PLUS_LINK?: string;
  PRO_LINK?: string;
  PLUS_NAME?: string;
  PLUS_DESC?: string;
  PRO_NAME?: string;
  PRO_DESC?: string;
}

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['#ef4444', '#10b981', '#8b5cf6'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'analytics'>('users');
  const [users, setUsers] = useState<UserData[]>([]);
  const [sortField, setSortField] = useState<'email' | 'tier' | 'tokens' | 'joined'>('tokens');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Config
      const configDoc = await getDoc(doc(db, 'config', 'global'));
      if (configDoc.exists()) {
        setConfig(configDoc.data() as ConfigData);
      } else {
        setConfig({ WEEKLY_LIMIT: 10, PLUS_TOKEN_LIMIT: 100000, PRO_TOKEN_LIMIT: 250000, PLUS_LINK: 'https://aikreativ.gumroad.com/l/mindflov?option=pizz1rFrLl29En5bhfwGnw%3D%3D', PRO_LINK: 'https://aikreativ.gumroad.com/l/mindflov?option=OCbMeuNmxIesF2k8l6Bh5Q%3D%3D' });
      }

      // Fetch Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const fetchedUsers: UserData[] = [];
      usersSnap.forEach((d) => {
        fetchedUsers.push({ id: d.id, ...d.data() } as UserData);
      });
      // Sort by tokens used descending
      fetchedUsers.sort((a, b) => (b.tokensUsed || 0) - (a.tokensUsed || 0));
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setMessage("Error loading data. Are you sure you are an admin?");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'config', 'global'), config);
      setMessage("Configuration saved successfully!");
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage("Error saving config: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateUserTier = async (userId: string, tier: string) => {
    try {
      await setDoc(doc(db, 'users', userId), { subscriptionTier: tier }, { merge: true });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionTier: tier } : u));
    } catch (err) {
      console.error("Error updating user tier:", err);
      alert("Failed to update user tier.");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user.");
    }
  };

  const tierData = useMemo(() => {
    const counts = { free: 0, plus: 0, pro: 0 };
    users.forEach(u => {
      if (u.subscriptionTier === 'plus') counts.plus++;
      else if (u.subscriptionTier === 'pro') counts.pro++;
      else counts.free++;
    });
    return [
      { name: 'Free', value: counts.free },
      { name: 'Plus', value: counts.plus },
      { name: 'Pro', value: counts.pro }
    ];
  }, [users]);

  const topUsersByTokens = useMemo(() => {
    return [...users]
      .sort((a, b) => (b.tokensUsed || 0) - (a.tokensUsed || 0))
      .slice(0, 10)
      .map(u => ({
        email: u.email ? u.email.split('@')[0] : (u.id.slice(0, 6) + '...'),
        tokens: u.tokensUsed || 0
      }));
  }, [users]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'email') {
        comparison = (a.email || '').localeCompare(b.email || '');
      } else if (sortField === 'tier') {
        const tierValues = { pro: 3, plus: 2, free: 1 };
        comparison = (tierValues[a.subscriptionTier as keyof typeof tierValues] || 0) - (tierValues[b.subscriptionTier as keyof typeof tierValues] || 0);
      } else if (sortField === 'tokens') {
        comparison = (a.tokensUsed || 0) - (b.tokensUsed || 0);
      } else if (sortField === 'joined') {
        comparison = (a.createdAt || 0) - (b.createdAt || 0);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [users, sortField, sortDirection]);

  const SortHeader = ({ field, label, className = '' }: { field: 'email'|'tier'|'tokens'|'joined', label: string, className?: string }) => (
    <button 
      onClick={() => {
        if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDirection('desc'); }
      }} 
      className={`flex items-center gap-1 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold ${sortField === field ? 'text-white' : 'text-slate-500'} ${className}`}
    >
      {label}
      {sortField === field ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
    </button>
  );

  const monthlyTrendData = useMemo(() => {
    const monthlyStats: Record<string, { month: string, timestamp: number, newUsers: number, tokens: number }> = {};
    
    users.forEach(u => {
      if (!u.createdAt) return;
      const date = new Date(u.createdAt);
      const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' }); // e.g., "Jan 26"
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[sortKey]) {
        monthlyStats[sortKey] = { month: monthYear, timestamp: date.getTime(), newUsers: 0, tokens: 0 };
      }
      monthlyStats[sortKey].newUsers += 1;
      monthlyStats[sortKey].tokens += (u.tokensUsed || 0);
    });

    return Object.values(monthlyStats)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [users]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#0f172a] border border-red-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/50 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Admin Console</h2>
              <p className="text-xs text-red-200/60 font-medium">Restricted Access</p>
            </div>
          </div>
          
          <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Users</div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <div className="flex items-center gap-2"><BarChart2 className="w-4 h-4" /> Analytics</div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <div className="flex items-center gap-2"><Settings className="w-4 h-4" /> Global Settings</div>
            </button>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gradient-to-b from-transparent to-black/20">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Activity className="w-8 h-8 animate-spin mb-4 text-red-400" />
              <p>Authenticating & Loading Data...</p>
            </div>
          ) : (
            <>
              {message && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> {message}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                    <div className="text-sm font-bold text-white"><Users className="inline w-4 h-4 mr-2 text-indigo-400" /> Total Users: {users.length}</div>
                    <div className="flex items-center gap-2">
                        <select 
                            value={sortField} 
                            onChange={(e) => setSortField(e.target.value as any)}
                            className="bg-black/50 border border-slate-700 rounded-lg py-1 px-2 text-xs text-white focus:outline-none"
                        >
                            <option value="tokens">Sort by Tokens</option>
                            <option value="joined">Sort by Joined Date</option>
                            <option value="tier">Sort by Tier</option>
                        </select>
                        <button onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')} className="p-1 hover:bg-white/10 rounded">
                            <ArrowUpDown className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-black/20 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <div className="col-span-4">User</div>
                      <div className="col-span-2">Tier</div>
                      <div className="col-span-2 text-right">Tokens</div>
                      <div className="col-span-2 text-right">Joined</div>
                      <div className="col-span-2 text-center">Actions</div>
                    </div>
                    
                    {/* Body */}
                    <div className="divide-y divide-white/5 max-h-[calc(100vh-300px)] overflow-y-auto">
                      {sortedUsers.map(u => (
                        <div key={u.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                          <div className="col-span-4 overflow-hidden">
                            <div className="text-sm font-medium text-white truncate">{u.email}</div>
                            <div className="text-[10px] text-slate-500 truncate">{u.id}</div>
                          </div>
                          <div className="col-span-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                u.subscriptionTier === 'pro' ? 'bg-indigo-500/20 text-indigo-400' :
                                u.subscriptionTier === 'plus' ? 'bg-emerald-500/20 text-emerald-400' :
                                'bg-slate-500/20 text-slate-400'
                            }`}>
                              {u.subscriptionTier}
                            </span>
                            {u.licenseKey && <div className="text-[9px] text-slate-500 mt-1 truncate" title={u.licenseKey}>🔑 {u.licenseKey}</div>}
                          </div>
                          <div className="col-span-2 text-right text-sm font-mono text-slate-300">
                            {u.tokensUsed?.toLocaleString() || 0}
                          </div>
                          <div className="col-span-2 text-right text-xs text-slate-400">
                            {new Date(u.createdAt || 0).toLocaleDateString()}
                          </div>
                          <div className="col-span-2 flex flex-wrap justify-end gap-1">
                             <select 
                                value={u.subscriptionTier || 'free'}
                                onChange={(e) => updateUserTier(u.id, e.target.value)}
                                className="bg-black/40 border border-slate-700 text-xs text-slate-300 rounded px-1 py-1 focus:outline-none focus:border-red-500"
                             >
                               <option value="free">Free</option>
                               <option value="plus">Plus</option>
                               <option value="pro">Pro</option>
                             </select>
                             <button 
                                onClick={() => deleteUser(u.id)}
                                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded px-2 py-1 text-xs transition-colors"
                             >
                                Del
                             </button>
                          </div>
                        </div>
                      ))}
                      {users.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-sm">No users found</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Subscriptions Pie Chart */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col">
                      <h3 className="text-lg font-bold text-white mb-4">Subscription Distribution</h3>
                      <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={tierData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {tierData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                              itemStyle={{ color: '#e2e8f0' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Top Token Users Bar Chart */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col">
                      <h3 className="text-lg font-bold text-white mb-4">Top Token Usage</h3>
                      <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topUsersByTokens} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                            <YAxis dataKey="email" type="category" stroke="#64748b" fontSize={12} width={80} />
                            <RechartsTooltip 
                              cursor={{fill: 'rgba(255,255,255,0.05)'}}
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                              formatter={(value: number) => [value.toLocaleString(), 'Tokens']}
                            />
                            <Bar dataKey="tokens" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Trends Area Chart */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-4">Monthly Growth & Usage</h3>
                    <div className="w-full min-h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                          <YAxis yAxisId="left" stroke="#10b981" fontSize={12} />
                          <YAxis yAxisId="right" orientation="right" stroke="#6366f1" fontSize={12} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                          />
                          <Legend verticalAlign="top" height={36}/>
                          <Line yAxisId="left" type="monotone" dataKey="newUsers" name="New Users" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} />
                          <Line yAxisId="right" type="monotone" dataKey="tokens" name="Tokens Consumed" stroke="#6366f1" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'settings' && config && (
                <div className="max-w-2xl mx-auto space-y-6 bg-white/5 p-6 rounded-xl border border-white/10">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Limits Configuration</h3>
                    <p className="text-xs text-slate-400 mb-6">These values globally control the constraints applied to application usage.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Plus Plan Name</label>
                        <input
                          type="text"
                          value={config.PLUS_NAME || 'Plus'}
                          onChange={(e) => setConfig({ ...config, PLUS_NAME: e.target.value })}
                          className="w-full bg-black/50 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Plus Plan Description</label>
                        <input
                          type="text"
                          value={config.PLUS_DESC || 'Perfect for individual thinkers.'}
                          onChange={(e) => setConfig({ ...config, PLUS_DESC: e.target.value })}
                          className="w-full bg-black/50 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Plus Plan Gumroad Link</label>
                        <input
                          type="text"
                          value={config.PLUS_LINK || ''}
                          onChange={(e) => setConfig({ ...config, PLUS_LINK: e.target.value })}
                          className="w-full bg-black/50 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Pro Plan Name</label>
                        <input
                          type="text"
                          value={config.PRO_NAME || 'Pro'}
                          onChange={(e) => setConfig({ ...config, PRO_NAME: e.target.value })}
                          className="w-full bg-black/50 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Pro Plan Description</label>
                        <input
                          type="text"
                          value={config.PRO_DESC || 'For power users and teams.'}
                          onChange={(e) => setConfig({ ...config, PRO_DESC: e.target.value })}
                          className="w-full bg-black/50 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Pro Plan Gumroad Link</label>
                        <input
                          type="text"
                          value={config.PRO_LINK || ''}
                          onChange={(e) => setConfig({ ...config, PRO_LINK: e.target.value })}
                          className="w-full bg-black/50 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Free Tier Weekly Export Limit</label>
                        <input
                          type="number"
                          value={config.WEEKLY_LIMIT}
                          onChange={(e) => setConfig({ ...config, WEEKLY_LIMIT: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black/50 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 block">Plus Tier Token Limit (Monthly)</label>
                        <input
                          type="number"
                          value={config.PLUS_TOKEN_LIMIT}
                          onChange={(e) => setConfig({ ...config, PLUS_TOKEN_LIMIT: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black/50 border border-emerald-900 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2 block">Pro Tier Token Limit (Monthly)</label>
                        <input
                          type="number"
                          value={config.PRO_TOKEN_LIMIT}
                          onChange={(e) => setConfig({ ...config, PRO_TOKEN_LIMIT: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black/50 border border-indigo-900 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex justify-end">
                    <button
                      onClick={handleConfigSave}
                      disabled={saving}
                      className="px-6 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
