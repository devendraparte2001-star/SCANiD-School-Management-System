import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Role, User } from "@/types";
import { 
  GraduationCap, 
  School, 
  Calendar, 
  Sparkles, 
  Megaphone, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Phone, 
  MapPin, 
  Target, 
  Eye, 
  Flag, 
  Lock, 
  Clock, 
  ExternalLink,
  BookOpen,
  Users,
  Award,
  Globe,
  X,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";
import { Logo } from "@/components/shared/Logo";
import { useSystemLabels } from "@/context/LabelContext";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface LoginProps {
  onLogin: (user: User) => void;
}

const getSafeStringId = (obj: any): string => {
  if (!obj) return "";
  const idValue = obj.id ?? obj.Id ?? obj.ID ?? obj.schoolId ?? obj.SchoolId ?? obj.academicYearId ?? obj.AcademicYearId;
  return idValue !== undefined && idValue !== null ? idValue.toString() : "";
};

const getSafeNameVal = (obj: any): string => {
  if (!obj) return "";
  return obj.name ?? obj.Name ?? obj.fullName ?? obj.FullName ?? "";
};

export default function Login({ onLogin }: LoginProps) {
  const { labels } = useSystemLabels();
  const [username, setUsername] = useState("devendraparte2001@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [role, setRole] = useState<Role>("admin");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [errorVisible, setErrorVisible] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  
  // Custom navigation state on school landing page
  const [activeSection, setActiveSection] = useState<"overview" | "notices" | "philosophy">("overview");

  // Portal Login Overlay State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLButtonElement>(null);
  
  const [schools, setSchools] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  // Slider Carousel State
  const [activeSlide, setActiveSlide] = useState(0);

  const fetchLookups = useCallback(async () => {
    try {
      const [schoolsRes, yearsRes] = await Promise.all([
        apiService.getSchools(),
        apiService.getAcademicYears()
      ]);
      
      const schoolData = schoolsRes.data && Array.isArray(schoolsRes.data) ? schoolsRes.data : (schoolsRes.data && Array.isArray(schoolsRes.data.data) ? schoolsRes.data.data : []);
      const yearData = yearsRes.data && Array.isArray(yearsRes.data) ? yearsRes.data : (yearsRes.data && Array.isArray(yearsRes.data.data) ? yearsRes.data.data : []);
      
      const finalSchools = schoolData.length > 0 ? schoolData : [
        { 
          id: 1, 
          name: "SCANiD PRIMARY SCHOOL", 
          code: "SPS001", 
          address: "MUMBAI, MAHARASHTRA", 
          email: "pri@scanid.com", 
          phone: "9876543210", 
          totalStudents: 450, 
          status: "Active",
          tagline: "Laying the Foundations of Modern Learning & Character",
          description: "SCANiD Primary School is dedicated to fostering a supportive, safe, and intellectually stimulating space for young learners. We emphasize inquiry-based learning, primary computer literacy, active communication, and artistic and athletic discovery.",
          mission: "To inspire an early curiosity for the sciences and arts while equipping young students with global leadership values and sound technical foundational skills.",
          vision: "To become a pioneering primary education hub representing world-class digital learning integrated with profound values.",
          sliderImages: [
            "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200",
            "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200",
            "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=1200"
          ],
          motto: "Honor, Wisdom & Joy",
          highlights: [
            { label: "Established", value: "2010" },
            { label: "Faculty Size", value: "34 Expert Educators" },
            { label: "Student Clubs", value: "15+ Creative Streams" }
          ],
          notices: [
            { id: 1, title: "Primary Admissions Open (2026-27)", date: "2026-06-12" },
            { id: 2, title: "Annual Speech Day & Drama Festival", date: "2026-06-25" }
          ]
        }
      ];
      const finalYears = yearData.length > 0 ? yearData : [
        { id: 1, name: "2023-24", IsCurrent: false, isActive: true },
        { id: 2, name: "2024-25", IsCurrent: true, isActive: true }
      ];

      setSchools(finalSchools);
      setAcademicYears(finalYears);
      
      // Select the current academic year if possible
      const currentYear = finalYears.find((y: any) => y.IsCurrent || y.isCurrent || y.isCurrentYear);
      if (currentYear) {
        setSelectedYear(getSafeStringId(currentYear));
      } else if (finalYears.length > 0) {
        setSelectedYear(getSafeStringId(finalYears[0]));
      } else {
        setSelectedYear("");
      }

      // Default selected school to first branch
      if (finalSchools.length > 0) {
        setSelectedSchool(getSafeStringId(finalSchools[0]));
      }
    } catch (error) {
      console.error("Fetch lookups error:", error);
      const fallbackSchools = [
        { 
          id: 1, 
          name: "SCANiD PRIMARY SCHOOL", 
          code: "SPS001", 
          address: "MUMBAI, MAHARASHTRA", 
          email: "pri@scanid.com", 
          phone: "9876543210", 
          totalStudents: 450, 
          status: "Active",
          tagline: "Laying the Foundations of Modern Learning & Character",
          description: "SCANiD Primary School is dedicated to fostering a supportive, safe, and intellectually stimulating space for young learners. We emphasize inquiry-based learning, primary computer literacy, active communication, and artistic and athletic discovery.",
          mission: "To inspire an early curiosity for the sciences and arts while equipping young students with global leadership values and sound technical foundational skills.",
          vision: "To become a pioneering primary education hub representing world-class digital learning integrated with profound values.",
          sliderImages: [
            "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200",
            "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200",
            "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=1200"
          ],
          motto: "Honor, Wisdom & Joy",
          highlights: [
            { label: "Established Year", value: "2010" },
            { label: "Faculty Size", value: "34 Expert Educators" },
            { label: "Student Clubs", value: "15+ Creative Streams" }
          ],
          notices: [
            { id: 1, title: "Primary Admissions Open (2026-27)", date: "2026-06-12" },
            { id: 2, title: "Annual Speech Day & Drama Festival", date: "2026-06-25" }
          ]
        }
      ];
      const fallbackYears = [
        { id: 1, name: "2023-24", IsCurrent: false, isActive: true },
        { id: 2, name: "2024-25", IsCurrent: true, isActive: true }
      ];
      setSchools(fallbackSchools);
      setAcademicYears(fallbackYears);
      setSelectedYear("2");
      setSelectedSchool("1");
    }
  }, []);

  useEffect(() => {
    fetchLookups();
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired") === "true") {
      setErrorVisible("Your session has expired. Please login again to continue.");
      setIsLoginModalOpen(true);
    }
  }, [fetchLookups]);

  // Automatically configure current role state on the basis of username input for developer ease
  useEffect(() => {
    if (!username) return;
    const uname = username.toLowerCase().trim();
    if (uname === "superadmin" || uname.includes("super")) {
      setRole("superadmin");
    } else if (uname.includes("teacher")) {
      setRole("teacher");
    } else if (uname.includes("student")) {
      setRole("student");
    } else if (uname.includes("parent")) {
      setRole("parent");
    } else {
      setRole("admin");
    }
  }, [username]);

  // Keep year aligned with role selection
  useEffect(() => {
    if (academicYears.length > 0) {
      const isRoleAdminOrSuperAdmin = role === "superadmin" || role === "admin";
      if (!isRoleAdminOrSuperAdmin) {
        const currentYear = academicYears.find((y: any) => y.IsCurrent || y.isCurrent || y.isCurrentYear) || academicYears[0];
        setSelectedYear(getSafeStringId(currentYear));
      }
    }
  }, [role, academicYears]);

  // Retrieve active selected school data
  const currentSchoolObj = schools.find(s => getSafeStringId(s) === selectedSchool) || schools[0];

  // Retrieve slider images with fallbacks
  const slides = currentSchoolObj?.sliderImages && Array.isArray(currentSchoolObj.sliderImages) && currentSchoolObj.sliderImages.length > 0
    ? currentSchoolObj.sliderImages
    : [
        "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=1200"
      ];

  // Auto slide intervals
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide(idx => (idx + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides, selectedSchool]);

  const handleNextSlide = () => {
    setActiveSlide(idx => (idx + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide(idx => (idx - 1 + slides.length) % slides.length);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorVisible(null);
    setFormErrors({});

    // Simple Form Validation
    const errors: Record<string, string> = {};
    if (!username.trim()) errors.username = "Username is required";
    if (!password.trim()) errors.password = "Password is required";
    if (!selectedYear) errors.year = "Academic year is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setLoading(false);
      if (errors.username) usernameRef.current?.focus();
      else if (errors.password) passwordRef.current?.focus();
      else if (errors.year) yearRef.current?.focus();
      return;
    }

    try {
      const response = await apiService.login({
        username,
        password,
        role,
        schoolId: selectedSchool && selectedSchool !== "all" ? parseInt(selectedSchool) : (role === "superadmin" ? 0 : undefined)
      });
      
      const userData = response.data.user || response.data;
      const userToken = response.data.token || response.data.accessToken || "";
      if (userToken) {
        userData.token = userToken;
        localStorage.setItem("token", userToken);
      }
      
      const ROLE_MAP: Record<string, number> = {
        "superadmin": 1,
        "admin": 2,
        "teacher": 3,
        "student": 4,
        "parent": 5
      };

      if (!userData.name && userData.fullName) userData.name = userData.fullName;
      if (!userData.name) userData.name = username === "devendraparte2001@gmail.com" ? "Devendra Parte" : (username.split("@")[0] || "User");
      if (!userData.role) userData.role = role;
      if (!userData.roleId) userData.roleId = ROLE_MAP[role as string] || 0;
      
      userData.email = "devendraparte2001@gmail.com";
      userData.academicYearId = selectedYear;
      
      const yearObj = (Array.isArray(academicYears) ? academicYears : []).find(y => getSafeStringId(y) === selectedYear);
      if (yearObj) userData.academicYearName = getSafeNameVal(yearObj);

      if (selectedSchool && selectedSchool !== "all") {
        userData.schoolId = selectedSchool;
        userData.schoolName = getSafeNameVal((Array.isArray(schools) ? schools : []).find(s => getSafeStringId(s) === selectedSchool));
      } else if (selectedSchool === "all") {
        userData.schoolId = "all";
        userData.schoolName = "All Schools";
      } else if (role !== "superadmin" && Array.isArray(schools) && schools.length > 0) {
        userData.schoolId = getSafeStringId(schools[0]);
        userData.schoolName = getSafeNameVal(schools[0]);
      }
      
      localStorage.setItem("user", JSON.stringify(userData));
      onLogin(userData);
    } catch (err: any) {
      console.error("Login Server Fault:", err);
      const isConnectionError = !err.response || err.response.status >= 500;
      
      if (isConnectionError) {
        console.warn("API Server Issue Fallback Activated");
        const isAll = selectedSchool === "all";
        const schoolObj = (Array.isArray(schools) ? schools : []).find(s => getSafeStringId(s) === selectedSchool) || schools[0];
        const yearObj = (Array.isArray(academicYears) ? academicYears : []).find(y => getSafeStringId(y) === selectedYear);
        
        const ROLE_MAP: Record<string, number> = {
          "superadmin": 1,
          "admin": 2,
          "teacher": 3,
          "student": 4,
          "parent": 5
        };

        const mockUser: User = {
          id: "demo-" + Math.random().toString(36).substr(2, 4),
          name: username === "devendraparte2001@gmail.com" ? "Devendra Parte" : (username.split("@")[0] || "Demo Staff"),
          email: "devendraparte2001@gmail.com",
          role: role,
          roleId: ROLE_MAP[role as string] || 0,
          schoolId: isAll ? undefined : selectedSchool,
          schoolName: isAll ? "All Schools" : (schoolObj?.name || "SCANiD PRIMARY SCHOOL"),
          academicYearId: selectedYear || "2",
          academicYearName: yearObj?.name || "2024-25"
        };
        localStorage.setItem("user", JSON.stringify(mockUser));
        setErrorVisible(null);
        onLogin(mockUser);
      } else {
        const errorData = err.response?.data;
        const errorMessage = typeof errorData === 'string' ? errorData : (errorData?.message || "Invalid credentials supplied");
        setErrorVisible(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorVisible(null);
    setRecoverySuccess(false);

    try {
      await apiService.forgotPassword(username);
      setRecoverySuccess(true);
    } catch (err: any) {
      console.error("Retrieve error:", err);
      if (!err.response || err.response.status >= 500) {
        setRecoverySuccess(true);
      } else {
        setErrorVisible(err.response?.data || "Could not dispatch request.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-x-hidden selection:bg-blue-600 selection:text-white transition-all duration-300">
      
      {/* Absolute Ambient Layer */}
      <div className="absolute top-0 inset-0 opacity-15 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] left-[5%] w-[800px] h-[800px] bg-blue-900 rounded-full blur-[160px] animate-pulse duration-[12000ms]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-slate-800 rounded-full blur-[140px] animate-pulse duration-[15000ms]"></div>
        <div className="absolute bottom-[0%] left-[20%] w-[700px] h-[700px] bg-indigo-950 rounded-full blur-[180px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>
      </div>

      {/* Global Header Navigation Desk */}
      <header className="sticky top-0 w-full z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-900/60 transition-all">
        <div className="w-full max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-4">
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Logo size="sm" className="w-[110px] sm:w-[130px] items-start shrink-0" />
            <div className="hidden md:flex lg:hidden xl:flex flex-col text-left pl-1 shrink-0">
              <span className="text-[10px] sm:text-xs font-black tracking-[0.25em] text-blue-500 uppercase leading-none mb-1">
                SCANiD ERP
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                Educational CMS Hub
              </span>
            </div>
          </div>

          {/* Navigation Links for Public View */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/30 border border-slate-900/90 rounded-2xl p-1 shrink-0">
            <button
              onClick={() => { setActiveSection("overview"); setActiveSlide(0); }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                activeSection === "overview" 
                  ? "bg-blue-600/90 text-white shadow-md shadow-blue-600/10" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              School Overview
            </button>
            <button
              onClick={() => { setActiveSection("notices"); }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                activeSection === "notices" 
                  ? "bg-blue-600/90 text-white shadow-md shadow-blue-600/10" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              Announcements Board
            </button>
            <button
              onClick={() => { setActiveSection("philosophy"); }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                activeSection === "philosophy" 
                  ? "bg-blue-600/90 text-white shadow-md shadow-blue-600/10" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              Our Philosophy
            </button>
          </nav>

          {/* Action Center (Branch Switcher + Portal Login Trigger) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Campus selector - triggers active retheming instantly */}
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/80 px-2 py-1 rounded-xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden xs:inline-block">
                Campus:
              </span>
              <Select 
                value={selectedSchool} 
                onValueChange={(v) => {
                  setSelectedSchool(v);
                  setActiveSlide(0);
                  setErrorVisible(null);
                }}
              >
                <SelectTrigger className="w-24 sm:w-36 bg-slate-950 border-slate-800 text-white text-[10px] sm:text-[11px] h-7 font-black rounded-lg focus:ring-1 focus:ring-blue-500/20 border-none outline-none">
                  <SelectValue placeholder="Changer" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-850 text-white rounded-xl">
                  {schools.map(s => (
                    <SelectItem key={getSafeStringId(s)} value={getSafeStringId(s)} className="text-[11px] font-bold focus:bg-slate-900">
                      {getSafeNameVal(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Glowing Action Trigger to Login Overlay */}
            <Button
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white h-7.5 sm:h-9 rounded-xl px-2 sm:px-4 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-1 shrink-0"
            >
              <Lock size={10} className="stroke-[2.5]" />
              <span className="hidden xs:inline">Portal Access</span>
              <span className="xs:hidden">Login</span>
            </Button>
          </div>

        </div>
      </header>

      {/* Hero Banner CMS Segment: Multi-Slide Carousel */}
      <section className="relative w-full max-w-7xl mx-auto px-4 mt-6 z-10 transition-all duration-300">
        <div className="relative w-full aspect-[21/9] sm:aspect-[21/10] md:aspect-[2.35/1] rounded-3xl overflow-hidden border border-slate-900 shadow-2xl group bg-slate-950">
          
          {slides.map((slideSrc, idx) => (
            <div 
              key={idx}
              className={cn(
                "absolute inset-0 transition-all duration-1000 ease-in-out",
                idx === activeSlide ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-[1.01] pointer-events-none"
              )}
            >
              {/* Slide Background Image */}
              <img 
                src={slideSrc} 
                referrerPolicy="no-referrer"
                alt={`Campus View ${idx + 1}`}
                className="w-full h-full object-cover brightness-[0.35]"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=1200";
                }}
              />
              
              {/* Cinematic Vignette Overlay block */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/35" />
              
              {/* Dynamic Overlay Content Tag */}
              <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 text-left space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-blue-500/20">
                  <Sparkles size={10} className="animate-spin duration-3000" />
                  {currentSchoolObj?.code || "SPS001"} BRAND PORTAL
                </div>
                
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight uppercase max-w-3xl leading-none">
                  {currentSchoolObj?.name || "SCANiD ACADEMY"}
                </h1>
                
                <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide max-w-2xl line-clamp-2">
                  {currentSchoolObj?.tagline || "Nurturing modern visionaries, scholars, and technical pioneers."}
                </p>

                {currentSchoolObj?.motto && (
                  <div className="pt-2 text-[10px] text-blue-300/80 italic font-medium flex items-center gap-1.5">
                    <Compass size={12} className="text-blue-400" /> School motto: <span className="font-extrabold uppercase not-italic text-white">"{currentSchoolObj.motto}"</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Dots Indicator */}
          <div className="absolute bottom-6 right-10 flex gap-2 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all focus:outline-none",
                  idx === activeSlide ? "bg-blue-400 w-6" : "bg-white/30 hover:bg-white/60"
                )}
                aria-label={`Carousel slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Carousel Next/Prev Controls */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-950 border border-slate-900 hover:border-slate-800 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all active:scale-95 z-20"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-950 border border-slate-900 hover:border-slate-800 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all active:scale-95 z-20"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* Mobile-First Segmented Tab Sub-Navigation (Highly responsive tab-switcher for touch devices) */}
      <div className="lg:hidden w-full max-w-7xl mx-auto px-4 mt-4">
        <div className="flex items-center gap-1 bg-slate-900/40 border border-slate-850 rounded-2xl p-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setActiveSection("overview"); setActiveSlide(0); }}
            className={cn(
              "flex-1 min-w-[90px] text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
              activeSection === "overview" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                : "text-slate-445 hover:text-white"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => { setActiveSection("notices"); }}
            className={cn(
              "flex-1 min-w-[100px] text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
              activeSection === "notices" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                : "text-slate-445 hover:text-white"
            )}
          >
            Announcements
          </button>
          <button
            onClick={() => { setActiveSection("philosophy"); }}
            className={cn(
              "flex-1 min-w-[90px] text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
              activeSection === "philosophy" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                : "text-slate-445 hover:text-white"
            )}
          >
            Philosophy
          </button>
        </div>
      </div>

      {/* Main CMS Showcase Layout Grid */}
      <main className="w-full max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 flex-1 mb-16">
        
        {/* Left Section (CMS Panels) */}
        <div className="lg:col-span-8 flex flex-col space-y-8">
          
          {/* Main overview active view */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              
              {/* Dynamic About School Block */}
              <div className="bg-gradient-to-br from-slate-900/60 via-slate-900/20 to-transparent border border-slate-900 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-4 bg-blue-500 rounded-md" />
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">
                    Institutional Mandate & Profile
                  </h3>
                </div>
                
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-semibold">
                  {currentSchoolObj?.description || (
                    `Welcome to ${currentSchoolObj?.name || "SCANiD Academy"}. Our institution is built on academic excellence and holistic student development. We focus on rigorous scholastic practices, state-of-the-art technological infrastructures, and supportive environments to challenge and inspire pupils.`
                  )}
                </p>

                {/* Grid of Highlight Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-900/60 mt-6">
                  {(currentSchoolObj?.highlights || [
                    { label: "Established Year", value: "2010" },
                    { label: "Faculty Strength", value: "34 Top Academicians" },
                    { label: "Active Student Clubs", value: "15+ Cultural Streams" }
                  ]).map((hl: any, idx: number) => (
                    <div key={idx} className="bg-slate-950/50 border border-slate-900 p-3.5 rounded-2xl flex flex-col justify-center">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        {hl.label || hl.Label}
                      </span>
                      <span className="text-[11px] sm:text-xs font-black text-slate-200 uppercase flex items-center gap-1.5 leading-snug">
                        <Flag size={11} className="text-blue-500" /> {hl.value || hl.Value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Card Banner Quick Facts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-2xl text-center space-y-1">
                  <BookOpen size={16} className="text-blue-500 mx-auto" />
                  <div className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Branch Code</div>
                  <div className="font-extrabold text-sm text-slate-300 uppercase">{currentSchoolObj?.code || "BRANCH-01"}</div>
                </div>
                <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-2xl text-center space-y-1">
                  <Users size={16} className="text-indigo-400 mx-auto" />
                  <div className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Total Enrollment</div>
                  <div className="font-extrabold text-sm text-slate-300">{currentSchoolObj?.totalStudents || "450"} Pupils</div>
                </div>
                <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-2xl text-center space-y-1">
                  <Award size={16} className="text-amber-500 mx-auto" />
                  <div className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Accreditation</div>
                  <div className="font-extrabold text-xs text-slate-300 uppercase">State Affiliated</div>
                </div>
                <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-2xl text-center space-y-1">
                  <Clock size={16} className="text-emerald-500 mx-auto" />
                  <div className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Gateway Status</div>
                  <div className="font-extrabold text-[10px] text-emerald-400 uppercase tracking-widest">● {currentSchoolObj?.status || "Active"}</div>
                </div>
              </div>

            </div>
          )}

          {/* Notices Section active view */}
          {activeSection === "notices" && (
            <div className="bg-slate-900/25 border border-slate-900 p-6 sm:p-8 rounded-3xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                <div className="flex items-center gap-2">
                  <Megaphone size={16} className="text-amber-500" />
                  <h4 className="text-xs font-black text-slate-200 uppercase tracking-widest">
                    Announcement Feed & Public Notices
                  </h4>
                </div>
                <span className="text-[8px] bg-slate-950 border border-slate-850 px-3 py-1 rounded-full text-slate-400 font-extrabold uppercase tracking-wide">
                  Live DB Feed
                </span>
              </div>

              <div className="space-y-4">
                {(currentSchoolObj?.notices && currentSchoolObj.notices.length > 0) ? (
                  currentSchoolObj.notices.map((notice: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="p-4 bg-slate-950/60 hover:bg-slate-950/80 border border-slate-900/80 rounded-2xl flex items-start gap-4 transition-all group cursor-default"
                    >
                      <div className="p-2 bg-blue-505/10 rounded-xl text-blue-500 border border-blue-500/10 shrink-0">
                        <Calendar size={14} className="group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <p className="text-xs sm:text-sm font-semibold text-slate-200 tracking-wide leading-snug">
                            {notice.title || notice.Title}
                          </p>
                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md shrink-0 self-start sm:self-center">
                            {notice.date || notice.Date}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-slate-450 transition-colors">
                          Official Release • Admin Office
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs font-bold uppercase">
                    No active notices published at the moment.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Directives Section active view */}
          {activeSection === "philosophy" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Mission */}
              <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-3xl space-y-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                    <Target size={16} />
                  </div>
                  <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                    Our Mission Statement
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  {currentSchoolObj?.mission || "To inspire structured curiosity for research fields while preparing scholars with standard technical competence and values."}
                </p>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pt-2 border-t border-slate-900">
                  Approved by Academic Board
                </div>
              </div>

              {/* Vision */}
              <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-3xl space-y-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                    <Eye size={16} />
                  </div>
                  <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                    Our Vision Blueprint
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  {currentSchoolObj?.vision || "To formulate globally competent school methodologies that integrate primary discovery with profound administrative values."}
                </p>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pt-2 border-t border-slate-900">
                  2026-2030 Strata Standard
                </div>
              </div>

            </div>
          )}

          {/* Quick Informational Grid (Mission, Vision, Motto - Brief, visible on overview) */}
          {activeSection === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-300">
                  <Target size={12} className="text-blue-500" /> Mission Brief
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-semibold line-clamp-2">
                  {currentSchoolObj?.mission || "To inspire structured curiosity for scientific fields while prepairing scholars."}
                </p>
              </div>

              <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-300">
                  <Eye size={12} className="text-indigo-400" /> Vision Brief
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-semibold line-clamp-2">
                  {currentSchoolObj?.vision || "To formulate globally competent school standards representing digital learning."}
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Right Section: School Contact Card + Quick Notice Panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Notice Panel */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Megaphone size={12} className="text-blue-500" /> Live Notice Board
              </span>
              <button 
                onClick={() => setActiveSection("notices")} 
                className="text-[9px] text-blue-400 hover:text-blue-300 font-extrabold uppercase tracking-widest"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {(currentSchoolObj?.notices || []).slice(0, 2).map((notice: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950/70 border border-slate-900 rounded-xl space-y-1">
                  <div className="text-[10px] sm:text-xs font-bold text-slate-300 line-clamp-2 leading-snug">
                    {notice.title || notice.Title}
                  </div>
                  <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                    {notice.date || notice.Date}
                  </div>
                </div>
              ))}
              {(!currentSchoolObj?.notices || currentSchoolObj.notices.length === 0) && (
                <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider text-center py-4">
                  No published notices
                </div>
              )}
            </div>
          </div>

          {/* School Directory Directory Desk */}
          <div className="bg-gradient-to-br from-slate-900/40 to-slate-900/10 border border-slate-900 rounded-3xl p-6 space-y-6">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Institutional Directory
              </h4>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                Official branch communication desks
              </p>
            </div>

            <div className="space-y-3.5">
              
              {/* Phone Desk */}
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-slate-950 rounded-lg text-slate-400 border border-slate-900">
                  <Phone size={12} />
                </div>
                <div>
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Telecommunication Desk</div>
                  <a href={`tel:${currentSchoolObj?.phone}`} className="text-xs font-semibold text-slate-300 hover:text-white transition-colors">
                    {currentSchoolObj?.phone || "+91 98765 43210"}
                  </a>
                </div>
              </div>

              {/* Email Desk */}
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-slate-950 rounded-lg text-slate-400 border border-slate-900">
                  <Mail size={12} />
                </div>
                <div>
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Corporate Mailbox</div>
                  <a href={`mailto:${currentSchoolObj?.email}`} className="text-xs font-semibold text-slate-300 hover:text-white transition-colors truncate max-w-[200px] inline-block">
                    {currentSchoolObj?.email || "admissions@school.edu"}
                  </a>
                </div>
              </div>

              {/* Physical Campus Address */}
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-slate-950 rounded-lg text-slate-400 border border-slate-900">
                  <MapPin size={12} />
                </div>
                <div>
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Campus Location</div>
                  <p className="text-xs font-semibold text-slate-300 uppercase leading-snug">
                    {currentSchoolObj?.address || "MUMBAI, MAHARASHTRA"}
                  </p>
                </div>
              </div>

              {/* Active Website */}
              {currentSchoolObj?.websiteUrl && (
                <div className="flex items-start gap-3 pt-1">
                  <div className="p-1.5 bg-slate-950 rounded-lg text-slate-400 border border-slate-900">
                    <Globe size={12} />
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Online Portal Link</div>
                    <a 
                      href={currentSchoolObj.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 uppercase"
                    >
                      Visit Website <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              )}

            </div>

            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900 text-center space-y-1 text-slate-400">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block leading-none">
                Admission Portal Status
              </span>
              <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest block pt-1.5">
                Now Active (2026-27)
              </span>
            </div>
          </div>

        </div>

      </main>

      {/* Global Information Footer */}
      <footer className="w-full border-t border-slate-900 mt-auto py-8 bg-slate-950 z-10">
        <div className="w-full max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wide">
              {currentSchoolObj?.name || "SCANiD INSTITUTIONAL SUITE"}
            </p>
            <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">
              State Board Affiliated Secondary Learning Desk • ERP Node
            </p>
          </div>
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">
            © 2026 SCANiD Technologies Ltd. All rights reserved.
          </p>
        </div>
      </footer>

      {/* RETHINK GLASSMORPHIC OVERLAY MODAL FOR SECURE PORTAL LOGIN */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-350">
          
          <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-325">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-500" />
            
            {/* Close trigger button */}
            <button 
              onClick={() => {
                setIsLoginModalOpen(false);
                setShowForgot(false);
                setErrorVisible(null);
                setRecoverySuccess(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 bg-slate-950/50 border border-slate-850 hover:border-slate-750 transition-all rounded-lg"
              aria-label="Close portal window"
            >
              <X size={15} />
            </button>

            <div className="text-center space-y-3 pt-10 pb-5 px-6">
              <div className="mx-auto w-12 h-12 flex items-center justify-center p-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-2xl mb-1">
                <Logo size="sm" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white text-lg font-extrabold tracking-tight uppercase">
                  {showForgot ? "Forgot Passkey" : (labels.loginHeading || "Member Portal Access")}
                </h3>
                <p className="text-slate-500 font-black text-[9px] tracking-widest uppercase">
                  {showForgot ? "System credential retrieval dispatch Desk" : (labels.loginSubtext || "Encrypted Branch Management Interface")}
                </p>
              </div>
            </div>

            <div className="px-6 pb-8">
              {showForgot ? (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  {recoverySuccess ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs text-center font-semibold animate-in zoom-in duration-200">
                      <p className="font-extrabold mb-1 uppercase tracking-wider">DESPATCH NOTIFICATION</p>
                      <p className="text-[10px] text-emerald-400/80 leading-relaxed leading-snug">
                        Recovery passkey dispatched successfully. Please check your registered mail stream or contact executive control.
                      </p>
                    </div>
                  ) : (
                    <>
                      {errorVisible && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center font-bold">
                          {errorVisible}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="recovery-username" className="text-slate-350 text-[10px] font-black uppercase tracking-wider">
                          Admin/User Mail Identifier
                        </Label>
                        <Input 
                          id="recovery-username" 
                          type="text" 
                          placeholder="Enter your system identifier" 
                          required 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 h-10 rounded-xl focus:border-blue-500 focus:ring-blue-500/10 font-bold"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-xs font-black shadow-lg shadow-blue-600/25 rounded-xl uppercase tracking-widest transition-all duration-300 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Retrieve credentials"}
                      </Button>
                    </>
                  )}
                  
                  <Button 
                    type="button" 
                    variant="link" 
                    onClick={() => {
                      setShowForgot(false);
                      setErrorVisible(null);
                      setRecoverySuccess(false);
                    }}
                    className="w-full text-slate-400 hover:text-white text-xs font-bold tracking-wide"
                  >
                    ← Back to Login
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {errorVisible && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center font-bold animate-in fade-in duration-300">
                      {errorVisible}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="username" className={cn("text-slate-300 text-[10px] font-black uppercase tracking-wider flex justify-between items-center", formErrors.username && "text-red-400")}>
                      <span>Username / Mail ID</span>
                      {formErrors.username && (
                        <span className="text-[9px] font-black italic text-red-400 lowercase animate-pulse">
                          {formErrors.username}
                        </span>
                      )}
                    </Label>
                    <Input 
                      id="username" 
                      type="text" 
                      placeholder="Enter system identifier" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={cn(
                        "bg-slate-950 border-slate-850 text-white placeholder:text-slate-700 h-10 rounded-xl focus:border-blue-500 focus:ring-blue-500/10 transition-all font-bold",
                        formErrors.username && "border-red-500/40"
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className={cn("text-slate-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1", formErrors.password && "text-red-400")}>
                        <span>Password code</span>
                        {formErrors.password && (
                          <span className="text-[9px] font-black italic text-red-400 lowercase animate-pulse">
                            - {formErrors.password}
                          </span>
                        )}
                      </Label>
                      <button 
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-[9px] text-blue-400 hover:text-blue-300 font-extrabold uppercase tracking-widest bg-transparent border-none p-0 cursor-pointer transition-colors"
                      >
                        Forgot?
                      </button>
                    </div>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(
                        "bg-slate-950 border-slate-850 text-white placeholder:text-slate-700 h-10 rounded-xl focus:border-blue-500 focus:ring-blue-500/10 transition-all font-semibold",
                        formErrors.password && "border-red-500/40"
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    
                    {/* Selected School label preview */}
                    <div className="space-y-1.5 col-span-1">
                      <Label className="text-slate-500 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                        <School size={10} /> <span>Secured node</span>
                      </Label>
                      <div className="h-9 flex items-center px-3 rounded-xl bg-slate-950 border border-slate-900 text-slate-400 text-[9px] font-extrabold uppercase tracking-widest overflow-hidden truncate">
                        {currentSchoolObj ? getSafeNameVal(currentSchoolObj).replace("SCANiD ", "") : "PORTAL MASTER"}
                      </div>
                    </div>

                    {/* Academic Session Choice */}
                    <div className="space-y-1.5 col-span-1">
                      <Label className={cn("text-slate-350 text-[9px] font-black uppercase tracking-wider flex items-center gap-1", formErrors.year && "text-red-400")}>
                        <Calendar size={10} className="text-blue-400" /> <span>Session</span>
                      </Label>
                      <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); setFormErrors(prev => ({...prev, year: ""})); }}>
                        <SelectTrigger className={cn(
                          "bg-slate-950 border-slate-850 text-white h-9 text-xs rounded-xl focus:ring-blue-500/10 border-none outline-none",
                          formErrors.year && "border-red-500/40"
                        )}>
                          <SelectValue placeholder="Year">
                            {selectedYear ? getSafeNameVal(academicYears.find(y => getSafeStringId(y) === selectedYear)) : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-850 text-white rounded-xl">
                          {academicYears
                            .filter(y => (role === "superadmin" || role === "admin") || y.IsCurrent || y.isCurrent || y.isCurrentYear)
                            .map(y => (
                              <SelectItem key={getSafeStringId(y)} value={getSafeStringId(y)} className="text-xs font-semibold">
                                {getSafeNameVal(y)} {(y.IsCurrent || y.isCurrent || y.isCurrentYear) ? "★" : ""}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-xs font-black shadow-lg shadow-blue-600/20 mt-4 rounded-xl uppercase tracking-widest transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? "Decrypting credentials..." : "Decrypt authorization"}
                  </Button>
                </form>
              )}
            </div>

            <div className="bg-slate-950/45 py-4 border-t border-slate-900/60 text-center text-[8px] text-slate-505 font-extrabold uppercase tracking-[0.25em]">
              Authorized SEC-RING Node Online
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
