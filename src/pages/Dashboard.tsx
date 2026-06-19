import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  TrendingUp, 
  ArrowUpRight, 
  BookOpen,
  IndianRupee,
  Calendar,
  Bell as BellIcon,
  X,
  ExternalLink,
  Activity,
  Wifi,
  Database,
  Cpu,
  Layers,
  HardDrive,
  Play,
  Pause,
  RefreshCw
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from "recharts";
import { Role, User as UserType } from "@/types";
import { cn, parseSafeInt } from "@/lib/utils";
import { SimpleTooltip } from "@/components/shared/SimpleTooltip";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardProps {
  user: UserType;
}

const performanceData = [
  { name: "Term 1", avg: 72, top: 94 },
  { name: "Term 2", avg: 78, top: 96 },
  { name: "Term 3", avg: 75, top: 93 },
  { name: "Term 4", avg: 82, top: 98 },
];

const attendanceData = [
  { day: "Mon", attendance: 92 },
  { day: "Tue", attendance: 95 },
  { day: "Wed", attendance: 88 },
  { day: "Thu", attendance: 94 },
  { day: "Fri", attendance: 91 },
];

export default function Dashboard({ user }: DashboardProps) {
  const { t } = useLanguage();
  const isAdmin = user.role === "admin" || user.role === "superadmin";
  const isSuperAdmin = user.role === "superadmin";
  const isTeacher = user.role === "teacher";
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Live Telemetry states for high-scale enterprise stream
  const [liveStats, setLiveStats] = useState<any>(null);
  const [liveActivities, setLiveActivities] = useState<any[]>([]);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [latencyHistory, setLatencyHistory] = useState<any[]>([]);
  const [isLiveLoading, setIsLiveLoading] = useState(true);

  useEffect(() => {
    let intervalId: any = null;

    const fetchLiveTelemetry = async (isFirst = false) => {
      try {
        if (isFirst) setIsLiveLoading(true);
        const res = await apiService.getLiveStats();
        if (res && res.data && res.data.success) {
          const streamData = res.data.data;
          setLiveStats(streamData);
          
          // Prepend new unique tasks / telemetry points
          setLiveActivities((prev) => {
            const incoming = streamData.recentActivities || [];
            // Merge & retain unique items based on id
            const existingIds = new Set(prev.map(item => item.id));
            const freshItems = incoming.filter((item: any) => !existingIds.has(item.id));
            
            // Limit total list backlog size so DOM tree renders at 60 FPS under heavy loads
            const merged = [...freshItems, ...prev];
            return merged.slice(0, 35);
          });

          // Maintain running latency plot
          setLatencyHistory((prev) => {
            const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
            const item = { time: nowStr, latency: streamData.queryLatencyMs || 2.4 };
            const merged = [...prev, item];
            return merged.slice(-10);
          });
        }
      } catch (err) {
        console.error("Live telemetry polling error:", err);
      } finally {
        if (isFirst) setIsLiveLoading(false);
      }
    };

    if (isLiveActive && isSuperAdmin) {
      fetchLiveTelemetry(true);
      intervalId = setInterval(() => fetchLiveTelemetry(false), 2500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLiveActive, isSuperAdmin]);

  useEffect(() => {
    const fetchAnnouncementsAndEvents = async () => {
      try {
        const notifParams: any = {};
        const userRoleLower = user.role?.toLowerCase() || "";
        const isUserAdmin = userRoleLower === "superadmin" || userRoleLower === "admin";
        
        if (!isUserAdmin) {
          if (user.id) notifParams.userId = parseInt(user.id) || undefined;
          if (user.roleId) notifParams.roleId = user.roleId;
          if (user.schoolId && user.schoolId !== "all") notifParams.schoolId = parseInt(user.schoolId) || undefined;
        }

        const notifRes = await apiService.getNotifications(notifParams);
        const rawNotifs = notifRes.data?.data || notifRes.data || [];
        setAnnouncements(Array.isArray(rawNotifs) ? rawNotifs : []);
      } catch (error) {
        console.error("Error fetching announcements on dashboard:", error);
      }

      try {
        const holidayRes = await apiService.getHolidays();
        const rawHolidays = holidayRes.data?.data || holidayRes.data || [];
        setEvents(Array.isArray(rawHolidays) ? rawHolidays : []);
      } catch (error) {
        console.error("Error fetching events on dashboard:", error);
      }
    };
    fetchAnnouncementsAndEvents();
  }, []);

  const defaultAnnouncements = [
    { title: "Annual Sports Day 2024", date: "May 15, 2024", desc: "Registration open for all tracks and field events." },
    { title: "Parent-Teacher Meeting", date: "May 20, 2024", desc: "Final term progress discussion for Standard 5-10." },
    { title: "Summer Break Notice", date: "June 1, 2024", desc: "School will remain closed from June 1st to July 5th." }
  ];

  const mappedAnnouncements = announcements.map((n: any) => {
    const rawDate = n.createdAt || n.CreatedAt || new Date().toISOString();
    const dateObj = new Date(rawDate);
    const dayStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    return {
      title: n.title || n.Title,
      date: dayStr,
      desc: n.message || n.Message
    };
  });

  const displayAnnouncements = [...mappedAnnouncements, ...defaultAnnouncements].slice(0, 3);

  const defaultEvents = [
    { time: "09:00 AM", label: "Math Finals - Standard 8", type: "Exam", color: "bg-red-50 text-red-600" },
    { time: "11:30 AM", label: "Choir Practice - Auditorium", type: "Activity", color: "bg-indigo-50 text-indigo-600" },
    { time: "02:00 PM", label: "Staff Briefing - Room 402", type: "Meeting", color: "bg-slate-50 text-slate-600" },
    { time: "04:15 PM", label: "Football Match - Away", type: "Sports", color: "bg-blue-50 text-blue-600" },
  ];

  const mappedEvents = events.map((e: any) => {
    const rawDate = e.fromDate || e.FromDate || new Date().toISOString();
    const dateObj = new Date(rawDate);
    // Formats e.g. "Jun 12"
    let dayStr = "Holiday";
    try {
      dayStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } catch (e) {}
    const nameStr = e.name || e.Name || "School Holiday";
    
    const colors = [
      "bg-amber-50 text-amber-600",
      "bg-red-50 text-red-600",
      "bg-indigo-50 text-indigo-600",
      "bg-emerald-50 text-emerald-600"
    ];
    const colorIndex = (e.id || 0) % colors.length;
    return {
      time: dayStr,
      label: nameStr,
      type: "Holiday",
      color: colors[colorIndex]
    };
  });

  const displayEvents = [...mappedEvents, ...defaultEvents].slice(0, 4);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 500); // Increased delay for layout stability
    const fetchStats = async () => {
      try {
        const parsedSchoolId = parseSafeInt(user.schoolId);
        const parsedYearId = parseSafeInt(user.academicYearId);

        const res = await apiService.getStats(parsedSchoolId, parsedYearId);
        if (res && res.data) {
          const statsData = res.data.data || res.data;
          setStats(statsData);
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      }
    };
    fetchStats();
    return () => clearTimeout(timer);
  }, [user.schoolId, user.academicYearId]);

  const activePerformanceData = stats?.performanceData && stats.performanceData.length > 0
    ? stats.performanceData
    : performanceData;
    
  const activeAttendanceTrend = stats?.attendanceTrend && stats.attendanceTrend.length > 0
    ? stats.attendanceTrend
    : attendanceData;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Premium Multi-Institution Greeting Banner */}
      <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/15">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] sm:text-xs font-semibold text-blue-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Portal Connected
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {t("welcomeBack")}, <span className="bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent">{user.name}</span>!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
              Institution console is fully active for <span className="text-white font-bold uppercase text-[10px] tracking-widest px-2 py-0.5 rounded bg-white/15 border border-white/5">{user.role}</span>. You can manage student records, log attendance streams, review grades, or check master entries below.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 sm:gap-4 shrink-0 w-full md:w-auto">
            <div className="flex-1 md:flex-none px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 flex flex-col min-w-[120px]">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Institutional Branch</span>
              <span className="text-xs sm:text-sm font-bold mt-1 text-slate-100 truncate max-w-[150px]" title={user.schoolName || "Global Control"}>
                {user.schoolName || "Global Control"}
              </span>
            </div>
            <div className="flex-1 md:flex-none px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 flex flex-col min-w-[120px]">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Academic Term</span>
              <span className="text-xs sm:text-sm font-bold mt-1 text-slate-100">
                {user.academicYearName || "Current Term"}
              </span>
            </div>
            <div className="flex-1 md:flex-none px-4 py-3 rounded-2xl bg-blue-600/20 backdrop-blur-sm border border-blue-500/20 flex flex-col min-w-[120px] shadow-lg shadow-blue-950/20">
              <span className="text-[9px] uppercase font-bold tracking-widest text-blue-300">Active Date</span>
              <span className="text-xs sm:text-sm font-bold mt-1 text-white">
                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-blue-600 p-4 rounded-[1.25rem] text-white shadow-2xl shadow-blue-200 transition-transform hover:rotate-3 shrink-0">
             <TrendingUp size={28} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">Operational Insights</h2>
            <p className="text-slate-400 font-bold mt-1 text-xs uppercase tracking-widest leading-none">Instant snapshot metrics across administrative channels.</p>
          </div>
        </div>
        {user.role === "superadmin" && (
          <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl flex items-center gap-3 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-200">
              SA
            </div>
            <div>
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">System Level</p>
              <p className="text-xs font-bold text-blue-900 mt-1">Super Admin Console</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={isAdmin || isTeacher ? t("totalStudents") : t("attendanceTracking")}
          value={stats?.totalStudents?.toLocaleString() || "..."}
          trend="+2.5%"
          icon={GraduationCap}
          color="bg-indigo-50 text-indigo-600"
          onClick={() => navigate(isAdmin || isTeacher ? "/students" : "/attendance")}
        />
        <StatCard 
          title={isAdmin || isTeacher ? t("activeEmployees") : "Class Rank"}
          value={stats?.totalTeachers?.toLocaleString() || "..."}
          trend="+4"
          icon={Users}
          color="bg-violet-50 text-violet-600"
          onClick={() => navigate(isAdmin ? "/staff" : "/students")}
        />
        <StatCard 
          title={isAdmin ? "Fee Collection" : "Upcoming Exams"}
          value={stats?.feeCollection || "..."}
          trend={isAdmin ? "85% Paid" : "Next: Math"}
          icon={isAdmin ? IndianRupee : BookOpen}
          color="bg-emerald-50 text-emerald-600"
          onClick={() => navigate(isAdmin ? "/fees" : "/marks")}
        />
        <StatCard 
          title={t("attendanceRate")}
          value={stats?.attendanceRate || "..."}
          trend="-1%"
          icon={CalendarCheck}
          color="bg-sky-50 text-sky-600"
          onClick={() => navigate("/attendance")}
        />
      </div>

      {/* Real-time Enterprise Stream Engine */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-none shadow-sm rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-900 px-6 sm:px-8 py-5 flex flex-row items-center justify-between text-white border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3.5 w-3.5">
                  {isLiveActive ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                  )}
                </span>
                <CardTitle className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2 leading-none">
                  Real-Time Database Stream Engine
                </CardTitle>
              </div>
              <p className="text-[10px] font-semibold text-slate-400">
                Supervising transaction indexing nodes & RFID streams down to milliseconds
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsLiveActive(!isLiveActive)}
                className={cn(
                  "text-xs font-bold rounded-xl px-3 h-8 border-none cursor-pointer transition-all gap-1.5",
                  isLiveActive 
                    ? "bg-slate-800 text-emerald-400 hover:bg-slate-700 hover:text-emerald-300"
                    : "bg-slate-800 text-amber-400 hover:bg-slate-700 hover:text-amber-300"
                )}
              >
                {isLiveActive ? <Pause size={14} /> : <Play size={14} />}
                {isLiveActive ? "Pause Stream" : "Resume Stream"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 bg-slate-950 text-slate-100 flex flex-col justify-between min-h-[440px]">
            {/* Top Stat Dashboard Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] uppercase font-black tracking-wider">Total Records Managed</span>
                  <Database size={14} className="text-blue-400" />
                </div>
                <div className="mt-2">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                    {liveStats?.totalRecordsManaged?.toLocaleString() || "284,192"}
                  </h3>
                  <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Syncing...
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] uppercase font-black tracking-wider">Throughput Speed</span>
                  <Activity size={14} className="text-emerald-400" />
                </div>
                <div className="mt-2">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                    {liveStats?.throughputRate?.toLocaleString() || "12,492"}
                  </h3>
                  <span className="text-[9px] font-semibold text-slate-400">records / min</span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] uppercase font-black tracking-wider">Pipeline Latency</span>
                  <Cpu size={14} className="text-indigo-400" />
                </div>
                <div className="mt-2">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                    {liveStats?.queryLatencyMs ? `${liveStats.queryLatencyMs}ms` : "1.85ms"}
                  </h3>
                  <span className="text-[9px] font-semibold text-slate-400">avg SQL indexing read</span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] uppercase font-black tracking-wider">Active Terminals</span>
                  <Wifi size={14} className="text-sky-400" />
                </div>
                <div className="mt-2">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                    {liveStats?.activeTerminalsConnected || "124"}
                  </h3>
                  <span className="text-[9px] font-semibold text-slate-400">RFID nodes online</span>
                </div>
              </div>
            </div>

            {/* Core Ingestion Monitor Console */}
            <div className="flex-1 flex flex-col bg-black/40 border border-slate-900 rounded-xl p-4 min-h-[220px]">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest pb-2 border-b border-slate-900">
                <span className="flex items-center gap-1.5 flex-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                  Live Activity Packet Telemetry
                </span>
                <span className="text-[9px]">UTC Millisecond Time</span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[180px] mt-2 pr-1 space-y-2 font-mono scrollbar-thin scrollbar-thumb-slate-800">
                {liveActivities.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-600 font-bold py-12">
                     <RefreshCw size={16} className="animate-spin mr-2" /> Initializing Live Pipe Stream...
                  </div>
                ) : (
                  liveActivities.map((act) => (
                    <div 
                      key={act.id} 
                      className="text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-slate-900/40 border border-slate-900/60 hover:bg-slate-900/70 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn(
                          "px-1 rounded text-[8px] font-black tracking-wider border",
                          act.type === "PAYMENT" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          act.type === "ACADEMICS" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                          act.type === "PORTAL_LOGIN" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                          act.type === "UPLOAD" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          act.type === "RFID_TAP" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        )}>
                          {act.type}
                        </span>
                        <span className="text-slate-300 font-bold">{act.name}</span>
                        <span className="text-slate-400 text-[10px]">{act.action}</span>
                        <span className="text-slate-600 text-[9px] font-sans">({act.school})</span>
                      </div>
                      <span className="text-slate-500 text-[9px] font-mono whitespace-nowrap text-right">
                        {new Date(act.timestamp).toISOString().split('T')[1].replace('Z', '')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mini Performance Index Card */}
        <Card className="border-none shadow-sm rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="pb-3 border-b border-slate-50">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Database Engine</CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-400">Running performance optimizations</CardDescription>
              </div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <HardDrive size={20} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Layers size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Engine Status</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">Active Partition Indexes</p>
                </div>
              </div>
              <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">Optimized</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Peak Load Index Tuning</span>
                <span className="text-slate-800">{liveStats?.systemLoadPercentage ? `${liveStats.systemLoadPercentage}%` : "24.5%"}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                  style={{ width: `${liveStats?.systemLoadPercentage || 24.5}%` }}
                ></div>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 leading-snug">
                System is load balancing index lookups across lakhs of cached institutional rows autonomously. Status: Stable.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-50 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Activity size={12} className="text-blue-500" />
                Live Index Response Latency
              </h4>
              <div className="h-[100px] w-full bg-slate-950 rounded-xl p-2">
                {latencyHistory.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={latencyHistory} margin={{ top: 5, right: 5, left: -40, bottom: 5 }}>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} hide />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "#0d0e12", 
                          border: "none", 
                          borderRadius: "8px", 
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)" 
                        }}
                        itemStyle={{ color: "#3b82f6", fontSize: "10px", fontWeight: "700" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="latency" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                    Sufficient telemetry parsing in progress...
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 dashboard-card border-none" onClick={() => navigate("/marks")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 leading-tight">Academic Performance</CardTitle>
                <CardDescription className="font-medium text-slate-400">Average vs Top scores across all standards</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div> Top
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div> Avg
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] w-full pt-6 pr-6 pb-6">
            {isMounted ? (
              <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <LineChart data={activePerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#0f172a", 
                        border: "none", 
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        padding: "12px"
                      }} 
                      itemStyle={{ color: "#fff", fontSize: "12px", fontWeight: "600" }}
                      labelStyle={{ color: "#94a3b8", fontSize: "10px", fontWeight: "700", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="top" 
                      stroke="#3b82f6" 
                      strokeWidth={4} 
                      dot={{ r: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg" 
                      stroke="#cbd5e1" 
                      strokeWidth={4} 
                      strokeDasharray="8 8"
                      dot={{ r: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#94a3b8" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
                <div className="h-full w-full bg-slate-50 animate-pulse rounded-2xl" />
            )}
          </CardContent>
        </Card>

        <Card className="dashboard-card border-none" onClick={() => navigate("/attendance")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-slate-900 leading-tight">Weekly Attendance</CardTitle>
            <CardDescription className="font-medium text-slate-400">Daily student presence status</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full pt-6 px-4 pb-6">
            {isMounted ? (
              <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <BarChart data={activeAttendanceTrend} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9', radius: 8 }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Bar 
                      dataKey="attendance" 
                      fill="#0f172a" 
                      radius={[6, 6, 0, 0]} 
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
                <div className="h-full w-full bg-slate-50 animate-pulse rounded-2xl" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        <Card className="border-none shadow-sm rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50 px-8 py-6 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-900">Recent Announcements</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl px-3 h-8"
              onClick={() => navigate("/notifications")}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0 divide-y divide-slate-50">
              {displayAnnouncements.map((item, index) => (
                <AnnouncementItem 
                  key={index}
                  title={item.title} 
                  date={item.date} 
                  desc={item.desc}
                  onClick={() => setSelectedAnnouncement(item)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50 px-8 py-6 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-900">Upcoming Events</CardTitle>
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl px-3 h-8"
                onClick={() => navigate("/configuration/holidays")}
              >
                Manage
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {displayEvents.map((item, index) => (
                <EventItem 
                  key={index}
                  time={item.time} 
                  label={item.label} 
                  type={item.type} 
                  color={item.color} 
                  onClick={() => setSelectedEvent(item)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {selectedAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedAnnouncement(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl shadow-slate-900/10 overflow-hidden z-10"
            >
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/20 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <BellIcon size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-600/70 tracking-widest">{selectedAnnouncement.date}</span>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Announcement Details</h4>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedAnnouncement(null)}
                  className="rounded-xl h-9 w-9 text-slate-400 hover:text-slate-900"
                >
                  <X size={18} />
                </Button>
              </div>
              <div className="p-8 space-y-4">
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">{selectedAnnouncement.title}</h3>
                <p className="text-slate-500 font-medium whitespace-pre-wrap text-[15px] leading-relaxed">{selectedAnnouncement.desc}</p>
                
                <div className="pt-6 border-t border-slate-100 flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedAnnouncement(null);
                      navigate("/notifications");
                    }}
                    className="w-full rounded-2xl font-bold border-slate-200 text-slate-700 h-11 hover:bg-slate-50 gap-2"
                  >
                    <ExternalLink size={16} />
                    Notification Center
                  </Button>
                  <Button 
                    onClick={() => setSelectedAnnouncement(null)}
                    className="w-full rounded-2xl font-bold bg-slate-900 text-white h-11 hover:bg-slate-800"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedEvent(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl shadow-slate-900/10 overflow-hidden z-10"
            >
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50/20 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600/70 tracking-widest">{selectedEvent.time}</span>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Event Details</h4>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedEvent(null)}
                  className="rounded-xl h-9 w-9 text-slate-400 hover:text-slate-900"
                >
                  <X size={18} />
                </Button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-2">
                  <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest", selectedEvent.color)}>
                    {selectedEvent.type}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug pt-1">{selectedEvent.label}</h3>
                </div>
                
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  {selectedEvent.type === "Holiday" 
                    ? "This holiday is part of the official academic school calendar. School offices and classes will remain closed during this day." 
                    : "This event is scheduled on the student timeline. Please check with coordinators for full updates."}
                </p>
                
                <div className="pt-6 border-t border-slate-100 flex gap-3">
                  {isAdmin && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSelectedEvent(null);
                        navigate("/configuration/holidays");
                      }}
                      className="w-full rounded-2xl font-bold border-slate-200 text-slate-700 h-11 hover:bg-slate-50 gap-2"
                    >
                      <ExternalLink size={16} />
                      Academic Calendar
                    </Button>
                  )}
                  <Button 
                    onClick={() => setSelectedEvent(null)}
                    className="w-full rounded-2xl font-bold bg-slate-900 text-white h-11 hover:bg-slate-800"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, trend, icon: Icon, color, onClick }: any) {
  return (
    <SimpleTooltip content={`Click to view details for ${title}`} side="top">
      <Card 
        className="border-none cursor-pointer overflow-hidden group rounded-[1.5rem] sm:rounded-[2rem] bg-white shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1" 
        onClick={onClick}
        aria-label={`Show details for ${title}`}
      >
        <CardContent className="p-6 sm:p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125 group-hover:bg-slate-100/50"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className={cn("p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3", color)}>
              <Icon size={24} />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm transition-all duration-300 group-hover:translate-x-1",
              trend.startsWith("+") ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
            )}>
              {trend}
              <ArrowUpRight size={12} className="stroke-[3]" />
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight transition-all duration-300 group-hover:translate-x-1">{value}</h2>
            <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-2 group-hover:translate-x-1 transition-all duration-300">{title}</p>
          </div>
        </CardContent>
      </Card>
    </SimpleTooltip>
  );
}

function AnnouncementItem({ title, date, desc, onClick }: any) {
  return (
    <div 
      className="group flex gap-5 p-6 sm:p-8 transition-colors hover:bg-slate-50/50 cursor-pointer active:scale-[0.99] origin-left"
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{date}</span>
        </div>
        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function EventItem({ time, label, type, color, onClick }: any) {
  return (
    <div 
      className="group flex items-center gap-6 p-5 sm:p-6 hover:bg-slate-50/50 transition-colors cursor-pointer active:scale-[0.99] origin-left"
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center shrink-0 w-16">
        <span className="text-xs font-black text-slate-900 tracking-tight">{time.split(' ')[0]}</span>
        <span className="text-[9px] font-black text-slate-400 uppercase">{time.split(' ')[1]}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-800 transition-colors group-hover:text-blue-600">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest", color)}>
            {type}
          </span>
        </div>
      </div>
    </div>
  );
}
