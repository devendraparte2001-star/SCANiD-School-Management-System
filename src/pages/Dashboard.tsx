import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  TrendingUp, 
  ArrowUpRight, 
  BookOpen,
  IndianRupee
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
  const isAdmin = user.role === "admin" || user.role === "superadmin";
  const isTeacher = user.role === "teacher";
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

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

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-blue-600 p-4 rounded-[1.25rem] text-white shadow-2xl shadow-blue-200 transition-transform hover:rotate-3">
             <TrendingUp size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">Dashboard Overview</h1>
            <p className="text-slate-400 font-bold mt-1 text-xs sm:text-sm uppercase tracking-widest leading-none">Here's what's happening at {user.schoolName || "your school"} today.</p>
          </div>
        </div>
        {user.role === "superadmin" && (
          <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-200">
              SA
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-[8px]">System Access</p>
              <p className="text-sm font-bold text-blue-900">Super Admin View</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={isAdmin || isTeacher ? "Total Students" : "My Attendance"}
          value={stats?.totalStudents?.toLocaleString() || "..."}
          trend="+2.5%"
          icon={GraduationCap}
          color="bg-indigo-50 text-indigo-600"
          onClick={() => navigate(isAdmin || isTeacher ? "/students" : "/attendance")}
        />
        <StatCard 
          title={isAdmin || isTeacher ? "Active Staff" : "Class Rank"}
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
          title="Daily Attendance"
          value={stats?.attendanceRate || "..."}
          trend="-1%"
          icon={CalendarCheck}
          color="bg-sky-50 text-sky-600"
          onClick={() => navigate("/attendance")}
        />
      </div>

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
                  <LineChart data={stats?.performanceData || performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <BarChart data={stats?.attendanceTrend || attendanceData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
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
          <CardHeader className="bg-white border-b border-slate-50 px-8 py-6">
            <CardTitle className="text-lg font-bold text-slate-900">Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-4">
              <AnnouncementItem 
                title="Annual Sports Day 2024" 
                date="May 15, 2024" 
                desc="Registration open for all tracks and field events."
              />
              <AnnouncementItem 
                title="Parent-Teacher Meeting" 
                date="May 20, 2024" 
                desc="Final term progress discussion for Standard 5-10."
              />
              <AnnouncementItem 
                title="Summer Break Notice" 
                date="June 1, 2024" 
                desc="School will remain closed from June 1st to July 5th."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50 px-8 py-6">
            <CardTitle className="text-lg font-bold text-slate-900">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              <EventItem time="09:00 AM" label="Math Finals - Standard 8" type="Exam" color="bg-red-50 text-red-600" />
              <EventItem time="11:30 AM" label="Choir Practice - Auditorium" type="Activity" color="bg-indigo-50 text-indigo-600" />
              <EventItem time="02:00 PM" label="Staff Briefing - Room 402" type="Meeting" color="bg-slate-50 text-slate-600" />
              <EventItem time="04:15 PM" label="Football Match - Away" type="Sports" color="bg-blue-50 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
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

function AnnouncementItem({ title, date, desc }: any) {
  return (
    <div className="group flex gap-5 p-6 sm:p-8 transition-colors hover:bg-slate-50/50">
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

function EventItem({ time, label, type, color }: any) {
  return (
    <div className="group flex items-center gap-6 p-5 sm:p-6 hover:bg-slate-50/50 transition-colors">
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
