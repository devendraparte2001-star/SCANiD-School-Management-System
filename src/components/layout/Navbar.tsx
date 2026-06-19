import * as React from "react";
import { Bell, Search, User, Settings as SettingsIcon, LogOut, School, Calendar, Menu, Info, AlertTriangle, CheckCircle, X, Languages } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

import { useNavigate } from "react-router-dom";
import { searchItems, SearchItem } from "@/lib/search-data";
import { useRef, useEffect } from "react";
import { apiService } from "@/lib/api";
import { SimpleTooltip } from "@/components/shared/SimpleTooltip";

import { Role, User as UserType } from "@/types";
import { useLanguage, LanguageCode } from "@/context/LanguageContext";

interface NavbarProps {
  user: UserType;
  onLogout: () => void;
  onUserUpdate: (user: UserType) => void;
  toggleSidebar?: () => void;
}

export default function Navbar({ user, onLogout, onUserUpdate, toggleSidebar }: NavbarProps) {
  const { language, setLanguage, t } = useLanguage();
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [filteredResults, setFilteredResults] = useState<SearchItem[]>([]);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keydown keyboard shortcut event listener to bind Cmd/Ctrl + K to focus the search input, and Escape to dismiss it.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setShowResults(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [schools, setSchools] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [navigationItems, setNavigationItems] = useState<any[]>([]);

  const fetchLookups = useCallback(async () => {
    try {
      const notifParams: any = {};
      const userRoleLower = user.role?.toLowerCase() || "";
      const isUserAdmin = userRoleLower === "superadmin" || userRoleLower === "admin";
      
      if (!isUserAdmin) {
        if (user.id) notifParams.userId = parseInt(user.id) || undefined;
        if (user.roleId) notifParams.roleId = user.roleId;
        if (user.schoolId && user.schoolId !== "all") notifParams.schoolId = parseInt(user.schoolId) || undefined;
      }

      const [schoolsRes, yearsRes, notifsRes, navsRes] = await Promise.all([
        apiService.getSchools(),
        apiService.getAcademicYears(),
        apiService.getNotifications(notifParams),
        apiService.getNavigations(user.roleId || 0)
      ]);
      
      const schoolData = schoolsRes.data && Array.isArray(schoolsRes.data) ? schoolsRes.data : (schoolsRes.data && Array.isArray(schoolsRes.data.data) ? schoolsRes.data.data : []);
      const yearData = yearsRes.data && Array.isArray(yearsRes.data) ? yearsRes.data : (yearsRes.data && Array.isArray(yearsRes.data.data) ? yearsRes.data.data : []);
      const notifData = notifsRes.data && Array.isArray(notifsRes.data) ? notifsRes.data : (notifsRes.data && Array.isArray(notifsRes.data.data) ? notifsRes.data.data : []);
      const navData = navsRes.data?.data || navsRes.data || [];
      
      setSchools(schoolData);
      setAcademicYears(yearData);
      setNotifications(notifData);
      setUnreadCount(Array.isArray(notifData) ? notifData.filter((n: any) => !n.isRead).length : 0);
      setNavigationItems(Array.isArray(navData) ? navData : []);

      // Auto-initialize school if not set
      if (!user.schoolId && schoolData.length > 0) {
        onUserUpdate({
          ...user,
          schoolId: schoolData[0].id.toString(),
          schoolName: schoolData[0].name
        });
      }

      // Auto-initialize academic year if not set or invalid (always default to current academic year as per user requirements)
      if (yearData.length > 0) {
        const currentYear = yearData.find((y: any) => y.IsCurrent || y.isCurrent || y.isCurrentYear) || yearData[0];
        const isUserAdminOrSuperAdmin = user.role === "superadmin" || user.role === "admin";
        if (!user.academicYearId || !isUserAdminOrSuperAdmin || !yearData.some((y: any) => y.id?.toString() === user.academicYearId?.toString())) {
          onUserUpdate({
            ...user,
            academicYearId: currentYear.id.toString(),
            academicYearName: currentYear.name
          });
        }
      }
    } catch (error) {
      console.error("Navbar lookups error:", error);
    }
  }, []);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  const handleSchoolChange = (schoolId: string) => {
    const school = schools.find(s => s.id.toString() === schoolId);
    if (schoolId === "all") {
      onUserUpdate({
        ...user,
        schoolId: "all",
        schoolName: "All Schools"
      });
    } else if (school) {
      onUserUpdate({
        ...user,
        schoolId: schoolId,
        schoolName: school.name
      });
    } else if (schoolId === "") {
      onUserUpdate({
        ...user,
        schoolId: undefined,
        schoolName: undefined
      });
    }
  };

  const handleYearChange = (yearId: string) => {
    const year = academicYears.find(y => y.id.toString() === yearId);
    if (year) {
      onUserUpdate({
        ...user,
        academicYearId: yearId,
        academicYearName: year.name
      });
    } else if (yearId === "") {
      onUserUpdate({
        ...user,
        academicYearId: undefined,
        academicYearName: undefined
      });
    }
  };

  const FALLBACK_MENUS = [
    { id: 1, title: "Dashboard", path: "/" },
    { id: 3, title: "Student Registry", path: "/students" },
    { id: 4, title: "Attendance Tracking", path: "/attendance" },
    { id: 5, title: "Examination & Marks", path: "/marks" },
    { id: 7, title: "Staff Directory", path: "/staff" },
    { id: 24, title: "Manage Users", path: "/configuration/users" },
    { id: 9, title: "Fee Management", path: "/fees" },
    { id: 10, title: "Communication Hub", path: "/messages" },
    { id: 11, title: "Masters & Config", path: "/configuration" },
    { id: 12, title: "Global Schools", path: "/configuration/schools" },
    { id: 14, title: "Role Master", path: "/configuration/role-master" },
    { id: 15, title: "User Accounts", path: "/configuration/role-assignment" },
    { id: 17, title: "Navigation Builder", path: "/configuration/navigation" },
    { id: 19, title: "Standards & Grades", path: "/configuration/standards" },
    { id: 20, title: "Divisions/Sections", path: "/configuration/sections" },
    { id: 21, title: "Academic Years", path: "/configuration/academic-years" },
    { id: 22, title: "Subject Registry", path: "/configuration/subjects" },
    { id: 26, title: "Religions", path: "/configuration/religions" },
    { id: 27, title: "Blood Group", path: "/configuration/blood-groups" },
    { id: 28, title: "Caste Category", path: "/configuration/castes" },
    { id: 29, title: "Sub-Caste", path: "/configuration/sub-castes" },
    { id: 30, title: "School House", path: "/configuration/houses" },
    { id: 31, title: "Admission Types", path: "/configuration/admission-types" },
    { id: 32, title: "States Master", path: "/configuration/states" },
    { id: 33, title: "Cities Master", path: "/configuration/cities" },
    { id: 34, title: "School Sections", path: "/configuration/school-sections" },
    { id: 35, title: "Shift Timetable", path: "/configuration/shifts" },
    { id: 36, title: "Category Master", path: "/configuration/categories" },
    { id: 37, title: "Session Master", path: "/configuration/sessions" },
    { id: 38, title: "Batch Master", path: "/configuration/batches" },
    { id: 39, title: "Exam Type Master", path: "/configuration/exam-types" },
    { id: 40, title: "Designation Master", path: "/configuration/designations" },
  ];

  useEffect(() => {
    if (!search.trim()) {
      setFilteredResults([]);
      setShowResults(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const queryTerm = search.trim();
        
        // 1. Sidebar menu matching
        const activeNavs = navigationItems.length > 0 ? navigationItems : FALLBACK_MENUS;
        const matchingMenus = activeNavs
          .filter((nav: any) => nav && nav.path && nav.path.startsWith("/") && nav.title.toLowerCase().includes(queryTerm.toLowerCase()))
          .map((nav: any) => ({
            id: `menu-${nav.id}`,
            title: nav.title,
            subtitle: `Sidebar Menu`,
            type: "page" as const,
            link: nav.path
          }));

        // 2. Fetch students dynamically if search target looks like index/name/GR
        const parsedSchoolId = user.schoolId && user.schoolId !== "all" ? parseInt(user.schoolId) : undefined;
        const parsedYearId = user.academicYearId ? parseInt(user.academicYearId) : undefined;
        
        const searchNotifParams: any = {};
        const userRoleLowerSearch = user.role?.toLowerCase() || "";
        const isUserAdminSearch = userRoleLowerSearch === "superadmin" || userRoleLowerSearch === "admin";
        
        if (!isUserAdminSearch) {
          if (user.id) searchNotifParams.userId = parseInt(user.id) || undefined;
          if (user.roleId) searchNotifParams.roleId = user.roleId;
          if (user.schoolId && user.schoolId !== "all") searchNotifParams.schoolId = parseInt(user.schoolId) || undefined;
        }

        const [studentsRes, staffRes, notificationsRes] = await Promise.all([
          apiService.getStudents(parsedSchoolId, parsedYearId, { search: queryTerm, pageSize: 20 }),
          apiService.getStaff(parsedSchoolId, parsedYearId, { search: queryTerm, pageSize: 20 }),
          apiService.getNotifications(searchNotifParams)
        ]);

        const rawStudents = studentsRes.data?.data || studentsRes.data || [];
        const rawStaff = staffRes.data?.data || staffRes.data || [];
        const rawNotifs = notificationsRes.data?.data || notificationsRes.data || [];

        const matchingStudents = (Array.isArray(rawStudents) ? rawStudents : []).map((s: any) => {
          const grNoStr = s.grNo || s.grno || s.GRNO || s.registrationNumber || "N/A";
          const classStr = s.standardName || s.Standard || s.class || "";
          const secStr = s.sectionName || s.Section || "";
          const detailStr = classStr ? `${classStr}${secStr ? " - " + secStr : ""}` : "Student";
          return {
            id: `student-${s.id}`,
            title: s.fullName || s.name || "Unknown Student",
            subtitle: `GR: ${grNoStr} • ${detailStr}`,
            type: "student" as const,
            link: `/students?search=${encodeURIComponent(s.fullName || s.name)}`
          };
        });

        const matchingStaff = (Array.isArray(rawStaff) ? rawStaff : []).map((st: any) => {
          const designationStr = st.designationName || st.designation || st.role || "Staff Member";
          return {
            id: `staff-${st.id}`,
            title: st.fullName || st.name || "Unknown Staff",
            subtitle: `${st.phone || ""} • ${designationStr}`,
            type: "staff" as const,
            link: `/staff?search=${encodeURIComponent(st.fullName || st.name)}`
          };
        });

        const matchingNotifications = (Array.isArray(rawNotifs) ? rawNotifs : [])
          .filter((n: any) => 
            n && n.title && (
              n.title.toLowerCase().includes(queryTerm.toLowerCase()) || 
              (n.message && n.message.toLowerCase().includes(queryTerm.toLowerCase()))
            )
          )
          .map((n: any) => ({
            id: `notif-${n.id}`,
            title: n.title,
            subtitle: n.message || "",
            type: "notification" as const,
            link: "/notifications"
          }));

        // Combine everything
        const combined = [...matchingMenus, ...matchingStudents, ...matchingStaff, ...matchingNotifications];
        setFilteredResults(combined.slice(0, 10)); // return top 10 matches
        setShowResults(true);
      } catch (err) {
        console.error("Global search error:", err);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [search, navigationItems, user.schoolId, user.academicYearId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredResults.length > 0) {
      handleSelect(filteredResults[0]);
    }
  };

  const handleSelect = (item: SearchItem) => {
    navigate(item.link);
    setSearch("");
    setShowResults(false);
    toast.success(`Navigating to ${item.title}`, {
      description: `Viewing ${item.type}: ${item.subtitle}`,
    });
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const uId = user.id ? parseInt(user.id) : undefined;
      const sId = user.schoolId ? parseInt(user.schoolId) : undefined;
      const rId = user.roleId;
      await apiService.markAllNotificationsRead({ userId: uId, schoolId: sId, roleId: rId });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read!");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await apiService.deleteNotification(id);
      const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={14} className="text-amber-500" />;
      case 'success': return <CheckCircle size={14} className="text-emerald-500" />;
      case 'error': return <X size={14} className="text-red-500" />;
      default: return <Info size={14} className="text-blue-500" />;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-20 shrink-0 shadow-sm">
      <div className="flex items-center flex-1 gap-2 sm:gap-4">
        {/* Mobile Sidebar Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden text-slate-600"
          onClick={toggleSidebar}
        >
          <Menu size={20} />
        </Button>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {user.role === "superadmin" ? (
            <div className="hidden md:block">
      <Select value={user.schoolId?.toString() || ""} onValueChange={handleSchoolChange}>
        <SelectTrigger className="w-[180px] h-9 bg-slate-50 border-slate-200 text-xs font-bold rounded-lg focus:ring-2 focus:ring-blue-500/10">
          <div className="flex items-center gap-2 truncate">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0"></div>
            {/* Explicitly mapping school name to avoid ID display in trigger */}
            <SelectValue placeholder="Select School Branch">
              {user.schoolId ? (user.schoolId === "all" ? "Global Admin View" : schools.find(s => s.id.toString() === user.schoolId.toString())?.name) : undefined}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
          <SelectItem value="" className="text-xs italic text-slate-400">Select School Branch</SelectItem>
                  <SelectItem value="all" className="text-xs font-black text-blue-600">Global Admin View</SelectItem>
                  {Array.isArray(schools) && schools.map(s => (
                    <SelectItem key={s.id || Math.random()} value={s.id ? s.id.toString() : ""} className="text-xs font-medium">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg hidden sm:flex items-center gap-2 border border-slate-100">
              <School size={14} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider truncate max-w-[140px]">
                {user.schoolName || "Institutional Access"}
              </span>
            </div>
          )}

          <div className="hidden lg:block">
      <Select value={user.academicYearId?.toString() || ""} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[140px] h-9 bg-blue-50 border-blue-100 text-xs font-black text-blue-700 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar size={13} strokeWidth={3} />
            {/* Explicitly mapping year name to ensure correct display */}
            <SelectValue placeholder="Select Academic Year">
              {user.academicYearId ? academicYears.find(y => y.id.toString() === user.academicYearId.toString())?.name : undefined}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
          <SelectItem value="" className="text-xs italic text-slate-400">Select Academic Year</SelectItem>
                {Array.isArray(academicYears) && academicYears
                  .filter(y => (user.role === "superadmin" || user.role === "admin") || y.IsCurrent || y.isCurrent || y.isCurrentYear)
                  .map(y => (
                    <SelectItem key={y.id || Math.random()} value={y.id ? y.id.toString() : ""} className="text-xs font-bold">
                      {y.name} {(y.isCurrent || y.IsCurrent) ? "★" : ""}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative flex-1 max-w-sm sm:max-w-md ml-auto" ref={searchRef}>
          <form onSubmit={handleSearch} className="flex items-center bg-slate-100/80 rounded-xl px-2 sm:px-4 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white transition-all duration-300 border border-transparent focus-within:border-blue-500/20 group">
          <Search size={16} className="text-slate-400 shrink-0 transition-colors group-focus-within:text-blue-500" />
          <Input 
            ref={inputRef}
            placeholder={t("searchPlaceholder")} 
            className="border-none bg-transparent focus-visible:ring-0 shadow-none text-xs sm:text-sm h-8 font-medium placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => search.trim() && setShowResults(true)}
          />
          <div 
            onClick={() => inputRef.current?.focus()}
            className="hidden sm:flex items-center gap-1 cursor-pointer select-none"
            title="Search Shortcut (Cmd+K or Ctrl+K)"
          >
            <kbd className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-400 shadow-sm transition-colors hover:bg-slate-50 active:scale-95">
              ⌘
            </kbd>
            <kbd className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-400 shadow-sm transition-colors hover:bg-slate-50 active:scale-95">
              K
            </kbd>
          </div>
          </form>

        {showResults && filteredResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 border-b border-slate-50 bg-slate-50/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Matching Records</p>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {filteredResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors group cursor-pointer"
                >
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    item.type === "student" ? "bg-blue-100 text-blue-600" :
                    item.type === "teacher" || item.type === "staff" ? "bg-emerald-100 text-emerald-600" :
                    item.type === "notification" ? "bg-amber-100 text-amber-600" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {item.type === "notification" ? <Bell size={14} /> : <Search size={14} />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-slate-900 leading-none mb-1 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </span>
                    <span className="text-xs text-slate-500 truncate capitalize font-medium">{item.type} • {item.subtitle}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-slate-50 bg-slate-50/30 text-center">
              <p className="text-[10px] text-slate-400 font-medium">Press Enter to select first result</p>
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="flex items-center gap-4">
        <DropdownMenu>
          <SimpleTooltip content={t("language")} side="bottom" nativeButton={true}>
            <DropdownMenuTrigger asChild nativeButton={true}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-600 hover:bg-slate-50 outline-none flex items-center justify-center cursor-pointer"
              >
                <Languages size={20} />
              </Button>
            </DropdownMenuTrigger>
          </SimpleTooltip>
          <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-slate-100 shadow-xl p-1 bg-white">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-slate-400 font-black px-3 py-1.5 uppercase tracking-wider">{t("selectLanguage")}</DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 bg-slate-100" />
              <DropdownMenuItem 
                onClick={() => setLanguage("en")}
                className={cn("cursor-pointer rounded-md px-2.5 py-2 text-xs font-bold flex items-center justify-between", language === "en" ? "bg-blue-50 text-blue-600" : "text-slate-700")}
              >
                <span>English (US)</span>
                {language === "en" && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLanguage("hi")}
                className={cn("cursor-pointer rounded-md px-2.5 py-2 text-xs font-bold flex items-center justify-between", language === "hi" ? "bg-blue-50 text-blue-600" : "text-slate-700")}
              >
                <span>हिन्दी (Hindi)</span>
                {language === "hi" && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLanguage("es")}
                className={cn("cursor-pointer rounded-md px-2.5 py-2 text-xs font-bold flex items-center justify-between", language === "es" ? "bg-blue-50 text-blue-600" : "text-slate-700")}
              >
                <span>Español</span>
                {language === "es" && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLanguage("ar")}
                className={cn("cursor-pointer rounded-md px-2.5 py-2 text-xs font-bold flex items-center justify-between", language === "ar" ? "bg-blue-50 text-blue-600" : "text-slate-700")}
              >
                <span>العربية (Arabic)</span>
                {language === "ar" && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLanguage("fr")}
                className={cn("cursor-pointer rounded-md px-2.5 py-2 text-xs font-bold flex items-center justify-between", language === "fr" ? "bg-blue-50 text-blue-600" : "text-slate-700")}
              >
                <span>Français</span>
                {language === "fr" && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <SimpleTooltip content="Notifications" side="bottom" nativeButton={true}>
            <DropdownMenuTrigger asChild nativeButton={true}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-slate-600 hover:bg-slate-50 outline-none"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
          </SimpleTooltip>
          
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-slate-50/50 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                <p className="text-[10px] text-slate-500 font-medium">You have {unreadCount} unread alerts</p>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-[350px] overflow-y-auto">
              {Array.isArray(notifications) && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                    <Bell size={18} className="text-slate-400" />
                  </div>
                  <p className="text-xs font-medium text-slate-500">All caught up!</p>
                  <p className="text-[10px] text-slate-400 mt-1">No new notifications at the moment.</p>
                </div>
              ) : (
                Array.isArray(notifications) && notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={cn(
                      "p-4 border-b border-slate-50 transition-colors relative group hover:bg-slate-50/50",
                      !notif.isRead && "bg-blue-50/20"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center",
                        notif.type === 'warning' ? "bg-amber-100/50" :
                        notif.type === 'success' ? "bg-emerald-100/50" :
                        notif.type === 'error' ? "bg-red-100/50" : "bg-blue-100/50"
                      )}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-xs leading-none mb-1", notif.isRead ? "font-semibold text-slate-700" : "font-bold text-slate-900")}>
                            {notif.title}
                          </p>
                          <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                            1h ago
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          {!notif.isRead && (
                            <button 
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(notif.id)}
                            className="text-[10px] font-bold text-slate-400 hover:text-red-500"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-2 border-t border-slate-50 bg-slate-50/30 text-center">
              <button 
                onClick={() => navigate("/notifications")}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-700 uppercase"
              >
                View all notifications
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
            <SimpleTooltip content="User Menu" side="bottom" nativeButton={false}>
            <DropdownMenuTrigger
              nativeButton={false}
              render={
                <div className={cn("flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors text-slate-600 cursor-pointer border-none bg-transparent outline-none")}>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-900 leading-tight">{user.name}</p>
                  </div>
                  <Avatar className="h-8 w-8 border border-slate-200">
                    <AvatarFallback className="bg-slate-900 text-white text-xs">
                      {user.name ? user.name.split(" ").map(n => n[0]).join("") : "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              }
            />
          </SimpleTooltip>
          <DropdownMenuContent align="end" className="w-64 p-0 overflow-hidden">
            <div className="flex items-center gap-3 p-4 bg-slate-50/50 border-b border-slate-100">
              <Avatar className="h-10 w-10 border border-white shadow-sm shrink-0">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {user.name ? user.name.split(" ").map(n => n[0]).join("") : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate leading-none">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate leading-none">{user.email}</p>
              </div>
            </div>
            <div className="p-1.5">
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer gap-3 py-2.5 rounded-md px-3 text-sm font-medium" onClick={() => navigate("/profile")}>
                  <User size={16} className="text-slate-400" />
                  <span>My Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-3 py-2.5 rounded-md px-3 text-sm font-medium" onClick={() => navigate("/settings")}>
                  <SettingsIcon size={16} className="text-slate-400" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-1.5 mx-1" />
              <DropdownMenuItem 
                className="text-red-600 cursor-pointer gap-3 py-2.5 rounded-md px-3 text-sm font-bold hover:bg-red-50 hover:text-red-700" 
                onClick={onLogout}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
