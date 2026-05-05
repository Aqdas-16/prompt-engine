import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Zap, Users, Target, Clock, PieChart as PieChartIcon, Activity, Sparkles, MoreHorizontal, ArrowUpRight, ArrowDownRight, Bell, Search, RefreshCw, Flame } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from 'recharts';
import { counterService } from '../services/counterService';
import { computeAnalytics, getUserStreak, getFootprintMetrics } from '../services/analyticsEngine';

export function AnalyticsPage({ historyItems, onClose, userData, onOpenAssistant, user }: { historyItems: any[], onClose: () => void, userData?: any, onOpenAssistant?: () => void, user?: any }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState<{id: string, text: string, time: string}[]>([]);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`notifications_${user.uid}`);
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        setNotifications([{ id: 'init', text: 'Welcome to your dashboard!', time: new Date().toLocaleTimeString() }]);
      }
    }
  }, [user, refreshTrigger]);

  const refreshDashboard = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
      setIsRefreshing(false);
    }, 500);
  };

  const [globalStats, setGlobalStats] = React.useState(() => counterService.getCounts());

  React.useEffect(() => {
    counterService.fetchCounts();
    const handler = () => refreshDashboard();
    const syncStats = () => setGlobalStats(counterService.getCounts());
    window.addEventListener("pe-analytics-updated", handler);
    window.addEventListener("statsUpdated", syncStats);
    return () => {
       window.removeEventListener("pe-analytics-updated", handler);
       window.removeEventListener("statsUpdated", syncStats);
    };
  }, []);

  const storedStats = React.useMemo(() => {
     const userId = user ? user.uid : "anonymous";
     try {
       const stored = localStorage.getItem(`user_stats_${userId}`);
       if (stored) return JSON.parse(stored);
     } catch (e) {}
     // Return default if empty
     return {
       totalPrompts: 0,
       timeSaved: 0
     };
  }, [user, refreshTrigger]);

  const {
    peakUsage,
    modeUsage,
    trend,
    productivityScore,
    userType,
    hasEnoughData,
    totalPrompts,
    timeSaved
  } = React.useMemo(() => {
    return computeAnalytics(user?.uid);
  }, [user, refreshTrigger]);

  const streakData = React.useMemo(() => getUserStreak(user?.uid), [user, refreshTrigger]);
  const footprintData = React.useMemo(() => getFootprintMetrics(user?.uid), [user, refreshTrigger]);

  const userPrompts = totalPrompts;
  const globalPrompts = globalStats.totalPrompts; 
  const globalUsers = globalStats.totalUsers; 
  
  const advancedCount = Math.round((modeUsage.advancedPercent / 100) * totalPrompts);
  const normalCount = Math.round((modeUsage.normalPercent / 100) * totalPrompts);
  const total = Math.max(1, userPrompts);
  const mostUsedMode = modeUsage.advancedPercent > modeUsage.normalPercent ? 'Advanced' : 'Normal';
  
  const displayTimeSaved = timeSaved >= 60 ? `${(timeSaved / 60).toFixed(1)} hrs` : `${timeSaved} min`;

  const logStr = user ? `activity_log_user_${user.uid}` : 'activity_log_guest';
  const activityLog = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem(logStr) || '[]'); }
    catch { return []; }
  }, [user, refreshTrigger, logStr]);

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyPrompts = activityLog.filter((h: any) => new Date(h.timestamp || Date.now()).getTime() > oneWeekAgo).length;
  const activityStr = userPrompts > 0 ? `${Math.round((weeklyPrompts / Math.max(1, userPrompts)) * 100)}%` : '0%';

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  // use dynamic trend from computeAnalytics instead of static values for "Your Prompts" & "Weekly Activity"
  const yourPromptsTrendString = trend ? (trend.trend === "UP" ? `+${trend.percentageChange}%` : (trend.trend === "DOWN" ? `-${trend.percentageChange}%` : `Stable`)) : `Stable`;
  const yourPromptsTrendUp = trend ? trend.trend !== "DOWN" : true;

  const kpis = [
    { label: "Platform Prompts", value: `${formatNumber(globalPrompts)}+`, icon: Zap, trend: "+12%", up: true, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
    { label: "Platform Users", value: `${formatNumber(globalUsers)}+`, icon: Users, trend: "+8%", up: true, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Your Prompts", value: formatNumber(userPrompts), icon: Target, trend: yourPromptsTrendString, up: yourPromptsTrendUp, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { label: "Time Saved", value: displayTimeSaved, icon: Clock, trend: "+4%", up: true, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "Preferred Mode", value: mostUsedMode, icon: PieChartIcon, trend: "Active", up: true, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
    { label: "Weekly Activity", value: activityStr, icon: Activity, trend: yourPromptsTrendString, up: yourPromptsTrendUp, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
  ];

  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      data[d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })] = 0; 
    }
    
    if (activityLog && activityLog.length > 0) {
      activityLog.forEach((item: any) => {
        const d = new Date(item.timestamp || Date.now());
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (data[dateStr] !== undefined) {
          data[dateStr] += 1;
        }
      });
    }
    return Object.keys(data).slice(-7).map(date => ({
      name: date.split(' ')[0], 
      prompts: data[date]
    }));
  }, [activityLog]);

  const pieData = [
    { name: 'Normal', value: normalCount },
    { name: 'Advanced', value: advancedCount }
  ];
  const pieColors = ['#818cf8', '#6366f1'];

  const recentActivity = React.useMemo(() => {
    const histKey = user ? `prompt_history_user_${user.uid}` : `prompt_history_user_anonymous`;
    try {
      const hist = JSON.parse(localStorage.getItem(histKey) || '[]');
      return hist.slice(0, 5); 
    } catch {
      return [];
    }
  }, [user, refreshTrigger]);

  const greetingName = user?.displayName ? user.displayName.split(' ')[0] : (user?.email ? user.email.split('@')[0] : 'User');

  return (
    <div className="w-full relative min-h-screen flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 font-sans overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* Dark mode background */}
      <div className="fixed inset-0 z-0 hidden dark:block" style={{
        background: `radial-gradient(circle at 20% 20%, rgba(0,120,255,0.25), transparent 40%),
                     radial-gradient(circle at 80% 80%, rgba(0,80,200,0.2), transparent 50%),
                     linear-gradient(135deg, #0b0f1a, #0f172a)`
      }}></div>
      
      {/* Light mode background */}
      <div className="fixed inset-0 z-0 block dark:hidden" style={{
        background: `radial-gradient(circle at 20% 20%, rgba(0,120,255,0.05), transparent 40%),
                     radial-gradient(circle at 80% 80%, rgba(0,80,200,0.05), transparent 50%),
                     linear-gradient(135deg, #f8fafc, #e2e8f0)`
      }}></div>
      
      {/* Main Glass Container */}
      <div className="w-full max-w-[1300px] mx-auto flex flex-col gap-6 sm:gap-8 relative z-10 p-6 sm:p-8 rounded-[24px] bg-white/60 dark:bg-white/[0.06] backdrop-blur-[18px] border border-white/60 dark:border-white/[0.15] shadow-[0_20px_60px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] text-gray-900 dark:text-gray-100">
      
      {/* Top Bar Navigation */}
      <div className="w-full flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 text-sm font-medium hover:bg-white dark:hover:bg-white/20 transition-all shadow-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <span className="font-bold text-lg tracking-tight hidden sm:block">Dashboard</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block z-[200]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-64 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all" 
            />
            {searchTerm && (
              <div className="absolute top-12 left-0 w-80 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-[100] max-h-64 overflow-y-auto backdrop-blur-xl">
                 {historyItems.filter(h => (h.input||'').toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                    historyItems.filter(h => (h.input||'').toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5).map(item => (
                      <div key={item.id} className="p-3 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors" onClick={() => { setSearchTerm(''); alert('Opened prompt: ' + item.input); }}>
                        <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-1 font-medium">
                           {item.input.split(new RegExp(`(${searchTerm})`, 'gi')).map((part: string, i: number) => 
                             part.toLowerCase() === searchTerm.toLowerCase() ? <span key={i} className="text-indigo-500 bg-indigo-500/10 rounded-sm px-0.5">{part}</span> : part
                           )}
                        </p>
                        <span className="text-[10px] text-gray-500 mt-1 inline-block">{item.mode || 'Normal'}</span>
                      </div>
                    ))
                 ) : (
                    <div className="p-4 text-sm text-gray-500 text-center">No results found</div>
                 )}
              </div>
            )}
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all relative"
            >
              <Bell size={16} />
              {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#0f172a]"></span>}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-[100] overflow-hidden backdrop-blur-xl">
                <div className="p-3 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                  <span className="font-semibold text-sm">Notifications</span>
                  <button onClick={() => {
                    setNotifications([]);
                    if(user) localStorage.setItem(`notifications_${user.uid}`, '[]');
                  }} className="text-xs text-indigo-500 hover:text-indigo-600">Clear all</button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map(notif => (
                    <div key={notif.id} className="p-3 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <p className="text-sm text-gray-800 dark:text-gray-200">{notif.text}</p>
                      <span className="text-[10px] text-gray-500">{notif.time}</span>
                    </div>
                  )) : (
                    <div className="p-4 text-center text-sm text-gray-500">No new notifications</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={onOpenAssistant} className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2">
            <Sparkles size={14} /> Get AI Insight
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col gap-6 mt-2 relative z-10">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">Welcome back, {greetingName}!</h1>
              {userPrompts > 0 && <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full">{userType}</span>}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {userPrompts === 0 ? "You haven't generated any prompts yet. Let's get started!" : "Here's your latest prompt generation data."}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={refreshDashboard} disabled={isRefreshing} className="px-3 py-2 bg-white/70 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-white dark:hover:bg-white/20 transition-all shadow-sm flex items-center gap-2">
               <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} /> {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-500/20 transition-all">
              Create Prompt
            </button>
          </div>
        </div>

        {/* KPIs Container */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((kpi, i) => (
            <motion.div 
              key={i}
              animate={{ y: [0, -2, 0] }}
              transition={{ repeat: Infinity, duration: 4 + (i%3), ease: "easeInOut", delay: i * 0.1 }}
              className="p-4 rounded-[16px] bg-white/80 dark:bg-[#0b0f1a]/60 backdrop-blur-[14px] border border-white/80 dark:border-white/[0.1] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 dark:hover:shadow-[0_0_12px_rgba(0,120,255,0.4)]"
            >
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-500/10 to-transparent dark:from-[rgba(0,120,255,0.2)] dark:to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  <div className={`p-1.5 rounded-lg ${kpi.bg} ${kpi.color}`}>
                    <kpi.icon size={14} />
                  </div>
                  <span className="truncate">{kpi.label}</span>
                </div>
                <MoreHorizontal size={14} className="text-gray-400 shrink-0 cursor-pointer" />
              </div>
              <div className="flex items-end justify-between mt-auto relative z-10">
                <div className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{kpi.value}</div>
                <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${kpi.up ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                  {kpi.up ? <ArrowUpRight size={10} strokeWidth={3}/> : <ArrowDownRight size={10} strokeWidth={3}/>}
                  {kpi.trend}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {userPrompts > 0 ? (
           <>
              {/* Footprint & Streak Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-6">
                
                {/* Streak Section */}
                <motion.div className="p-4 sm:p-5 rounded-[16px] bg-white/40 dark:bg-white/[0.04] backdrop-blur-[14px] border border-white/50 dark:border-white/[0.1] shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col text-gray-900 dark:text-gray-100 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-base font-semibold">Your Activity</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Daily generation streak</p>
                    </div>
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  
                  {streakData ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-center flex flex-col gap-1 items-center justify-center">
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Current Streak</span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{streakData.currentStreak} <span className="text-sm font-normal text-gray-500">days</span></span>
                      </div>
                      <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-center flex flex-col gap-1 items-center justify-center">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Best Streak</span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{streakData.longestStreak} <span className="text-sm font-normal text-gray-500">days</span></span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                      Generate a few prompts to unlock usage insights
                    </div>
                  )}
                </motion.div>

                {/* Footprint Section */}
                <motion.div className="p-4 sm:p-5 rounded-[16px] bg-white/40 dark:bg-white/[0.04] backdrop-blur-[14px] border border-white/50 dark:border-white/[0.1] shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col text-gray-900 dark:text-gray-100 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-base font-semibold">Your Usage Behavior</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Interaction footprint metrics</p>
                    </div>
                    <Activity className="w-5 h-5 text-emerald-500" />
                  </div>
                  
                  {footprintData ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 rounded-lg bg-white/50 dark:bg-[#0b0f1a]/50 border border-gray-100 dark:border-white/5 flex items-center justify-between">
                         <span className="text-xs text-gray-500 dark:text-gray-400">Avg Typing Time</span>
                         <span className="text-sm font-bold text-gray-900 dark:text-white">{footprintData.avgTypingTime}s</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/50 dark:bg-[#0b0f1a]/50 border border-gray-100 dark:border-white/5 flex items-center justify-between">
                         <span className="text-xs text-gray-500 dark:text-gray-400">Avg Edits</span>
                         <span className="text-sm font-bold text-gray-900 dark:text-white">{footprintData.avgEdits} edits</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/50 dark:bg-[#0b0f1a]/50 border border-gray-100 dark:border-white/5 flex items-center justify-between">
                         <span className="text-xs text-gray-500 dark:text-gray-400">Retry Rate</span>
                         <span className="text-sm font-bold text-gray-900 dark:text-white">{footprintData.retryRate}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/50 dark:bg-[#0b0f1a]/50 border border-gray-100 dark:border-white/5 flex items-center justify-between">
                         <span className="text-xs text-gray-500 dark:text-gray-400">Abandonment</span>
                         <span className="text-sm font-bold text-gray-900 dark:text-white">{footprintData.abandonmentRate}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                      Generate a few prompts to unlock usage insights
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 1. Area Chart */}
          <motion.div className="lg:col-span-6 p-4 sm:p-5 rounded-[16px] bg-white/40 dark:bg-white/[0.04] backdrop-blur-[14px] border border-white/50 dark:border-white/[0.1] shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col text-gray-900 dark:text-gray-100 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-semibold">Generation Performance</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last 7 days overview</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Prompts</span>
              </div>
            </div>
            <div className="w-full h-[180px]">
              {chartData && chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrompts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.95)', color: '#1e293b', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 'bold', color: '#6366f1' }}
                    />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} dy={5} />
                    <Area type="monotone" dataKey="prompts" stroke="#6366f1" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPrompts)" activeDot={{ r: 4, fill: "#fff", stroke: "#6366f1", strokeWidth: 1.5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* 2. Donut Chart */}
          <motion.div className="lg:col-span-3 p-4 sm:p-5 rounded-[16px] bg-white/40 dark:bg-white/[0.04] backdrop-blur-[14px] border border-white/50 dark:border-white/[0.1] shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
            <h3 className="text-base font-semibold mb-1">Usage Types</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Distribution</p>
            <div className="flex-grow flex items-center justify-center relative min-h-[140px]">
               {pieData && pieData.length > 0 && (
                 <ResponsiveContainer width="100%" height={140}>
                   <PieChart>
                     <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                        {pieData.map((e, i) => <Cell key={i} fill={pieColors[i]} />)}
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                   </PieChart>
                 </ResponsiveContainer>
               )}
               {/* Center Text */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-xs text-gray-500">Advanced</span>
                 <span className="text-xl font-bold tracking-tight">{total > 0 ? Math.round((advancedCount/total)*100) : 0}%</span>
               </div>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-[10px] font-medium">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#6366f1]"></span> Advanced</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#818cf8]"></span> Normal</div>
            </div>
          </motion.div>

          {/* 3. Top Formats */}
          <motion.div className="lg:col-span-3 p-4 sm:p-5 rounded-[16px] bg-white/40 dark:bg-white/[0.04] backdrop-blur-[14px] border border-white/50 dark:border-white/[0.1] shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-semibold">Top Formats</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Best performers</p>
              </div>
              <span className="text-indigo-500 text-[10px] font-semibold cursor-pointer hover:underline">View All</span>
            </div>
            
            <div className="flex flex-col gap-3 mt-1">
              {/* Item 1 */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-transparent">
                <h4 className="text-xs font-medium mb-1">Standard Queries</h4>
                <div className="flex justify-between items-end mb-1.5">
                   <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{total > 0 ? Math.round((normalCount/total)*100) : 0}%</span>
                </div>
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${total > 0 ? (normalCount/total)*100 : 0}%` }}></div>
                </div>
              </div>
              
              {/* Item 2 */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-transparent">
                <h4 className="text-xs font-medium mb-1">Structured Outputs</h4>
                <div className="flex justify-between items-end mb-1.5">
                   <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{total > 0 ? Math.round((advancedCount/total)*100) : 0}%</span>
                </div>
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${total > 0 ? (advancedCount/total)*100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 4. Bar Chart (Usage Growth) */}
          <motion.div className="lg:col-span-4 p-5 sm:p-6 rounded-[16px] bg-white/40 dark:bg-white/[0.04] backdrop-blur-[14px] border border-white/50 dark:border-white/[0.1] shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
             <h3 className="text-base font-semibold mb-6">Usage Growth</h3>
             <div className="flex-grow w-full min-h-[220px]">
               {chartData && chartData.length > 0 && (
                 <ResponsiveContainer width="100%" height={220}>
                   <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                     <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.95)', color: '#1e293b', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                        cursor={{ fill: 'currentColor', opacity: 0.05 }}
                     />
                     <Bar dataKey="prompts" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={24} />
                     <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} dy={10} />
                   </BarChart>
                 </ResponsiveContainer>
               )}
             </div>
          </motion.div>

          {/* 5. Recent Prompts Table */}
          <motion.div className="lg:col-span-5 p-5 sm:p-6 rounded-[16px] bg-white/40 dark:bg-white/[0.04] backdrop-blur-[14px] border border-white/50 dark:border-white/[0.1] shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-base font-semibold">Recent Generation</h3>
               <span 
                 onClick={() => { window.history.pushState({}, '', '/history'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                 className="text-indigo-500 text-xs font-semibold cursor-pointer hover:underline"
               >View All</span>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5">
                   <tr>
                     <th className="pb-3 font-medium">Prompt</th>
                     <th className="pb-3 font-medium">Mode</th>
                     <th className="pb-3 font-medium">Date</th>
                     <th className="pb-3"></th>
                   </tr>
                 </thead>
                 <tbody>
                   {recentActivity.length === 0 ? (
                     <tr><td colSpan={4} className="py-8 text-center text-gray-400">No recent activity</td></tr>
                   ) : (
                     recentActivity.map((item, i) => (
                       <tr key={i} className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                         <td className="py-3 pr-4 max-w-[150px] truncate font-medium text-gray-800 dark:text-gray-200">
                           {item.title || item.input || 'Untitled'}
                         </td>
                         <td className="py-3">
                           <span className={`px-2 py-1 rounded text-[10px] font-semibold ${item.mode === 'advanced' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                             {item.mode === 'advanced' ? 'Active' : 'Completed'}
                           </span>
                         </td>
                         <td className="py-3 text-xs text-gray-500">
                           {item.createdAt || item.timestamp ? new Date(item.createdAt || item.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'Today'}
                         </td>
                         <td className="py-3 text-right">
                           <MoreHorizontal size={14} className="text-gray-400 cursor-pointer inline-block" />
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
          </motion.div>

          {/* 6. AI Insights */}
          <motion.div className="lg:col-span-3 p-5 sm:p-6 rounded-[16px] bg-white/40 dark:bg-white/[0.04] backdrop-blur-[14px] border border-white/50 dark:border-white/[0.1] shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
             <div className="flex justify-between items-center mb-1">
               <h3 className="text-base font-semibold">AI Insights</h3>
               {hasEnoughData && productivityScore !== null && (
                 <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                   Productivity Score: {productivityScore}/100
                 </span>
               )}
             </div>
             
             {!hasEnoughData ? (
               <div className="text-sm text-gray-500 text-center py-6 mt-4 opacity-80 font-medium">Start generating prompts to unlock insights</div>
             ) : (
               <>
                 <div className="flex gap-3 items-start p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-transparent">
                  <Clock className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold mb-0.5">Peak Usage Time</h4>
                    <p className="text-[10px] text-gray-500 leading-tight">Peak Usage: {peakUsage || "Not enough data"}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-transparent">
                  <Target className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold mb-0.5">Mode Suggestion</h4>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      {modeUsage.advancedPercent > modeUsage.normalPercent 
                        ? "You are using Advanced efficiently"
                        : "Try Advanced mode for better results"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-transparent">
                  <Activity className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold mb-0.5">Activity Trend</h4>
                    <p className="text-[10px] text-gray-500 leading-tight">Trend: {trend ? `${trend.percentageChange}% ${trend.trend}` : "Not enough data"}</p>
                  </div>
                </div>
               </>
             )}
             
             <button onClick={onOpenAssistant} className="w-full mt-auto py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
               <Sparkles size={14} /> Open AI Assistant
             </button>
          </motion.div>
        </div>
        </>
        ) : (
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center py-20 px-6 bg-white/50 dark:bg-white/[0.04] backdrop-blur-[14px] border border-white/60 dark:border-white/[0.1] rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] mt-10 relative overflow-hidden">
             
             {/* Glow behind button/icon */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none"></div>
             
             <div className="w-20 h-20 bg-white/80 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white/80 dark:border-white/10 relative z-10">
                <PieChartIcon size={32} className="text-indigo-500 dark:text-indigo-400" />
             </div>
             <h3 className="text-2xl font-bold tracking-tight mb-3 text-gray-900 dark:text-white relative z-10">No Data Available</h3>
             <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md text-center relative z-10 text-sm">Your dashboard is empty because you haven't generated any prompts yet. Head back to the PromptEngine and create your first masterpiece.</p>
             <button onClick={onClose} className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white rounded-xl text-sm font-semibold shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-all hover:-translate-y-0.5 relative z-10">
                Create Prompt
             </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}


