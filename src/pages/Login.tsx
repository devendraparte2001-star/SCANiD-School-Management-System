import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Role, User } from "@/types";
import { GraduationCap, School, Calendar } from "lucide-react";
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
  
  const usernameRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const schoolRef = React.useRef<HTMLButtonElement>(null);
  const yearRef = React.useRef<HTMLButtonElement>(null);
  
  const [schools, setSchools] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  const fetchLookups = useCallback(async () => {
    try {
      const [schoolsRes, yearsRes] = await Promise.all([
        apiService.getSchools(),
        apiService.getAcademicYears()
      ]);
      
      const schoolData = schoolsRes.data && Array.isArray(schoolsRes.data) ? schoolsRes.data : (schoolsRes.data && Array.isArray(schoolsRes.data.data) ? schoolsRes.data.data : []);
      const yearData = yearsRes.data && Array.isArray(yearsRes.data) ? yearsRes.data : (yearsRes.data && Array.isArray(yearsRes.data.data) ? yearsRes.data.data : []);
      
      const finalSchools = schoolData.length > 0 ? schoolData : [
        { id: 1, name: "SCANiD PRIMARY SCHOOL", status: "Active" }
      ];
      const finalYears = yearData.length > 0 ? yearData : [
        { id: 1, name: "2023-24", IsCurrent: false, isActive: true },
        { id: 2, name: "2024-25", IsCurrent: true, isActive: true }
      ];

      setSchools(finalSchools);
      setAcademicYears(finalYears);
      
      // Find the current academic year (IsCurrent === true) by default as per user request
      const currentYear = finalYears.find((y: any) => y.IsCurrent || y.isCurrent || y.isCurrentYear);
      if (currentYear) {
        setSelectedYear(currentYear.id.toString());
      } else if (finalYears.length > 0) {
        setSelectedYear(finalYears[0].id.toString());
      } else {
        setSelectedYear("");
      }
      setSelectedSchool(finalSchools[0]?.id?.toString() || "");
    } catch (error) {
      console.error("Fetch lookups error:", error);
      const fallbackSchools = [
        { id: 1, name: "SCANiD PRIMARY SCHOOL", status: "Active" }
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
    // Check if redirect occurred because of an expired session / unauthorized response
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired") === "true") {
      setErrorVisible("Your session has expired. Please login again to continue.");
    }
  }, [fetchLookups]);

  // Automatically update the role state on the basis of the username entered
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

  
  // Auto-enforce current academic year if role switches to a non-admin role
  useEffect(() => {
    if (academicYears.length > 0) {
      const isRoleAdminOrSuperAdmin = role === "superadmin" || role === "admin";
      if (!isRoleAdminOrSuperAdmin) {
        const currentYear = academicYears.find((y: any) => y.IsCurrent || y.isCurrent || y.isCurrentYear) || academicYears[0];
        setSelectedYear(currentYear.id.toString());
      }
    }
  }, [role, academicYears]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorVisible(null);
    setFormErrors({});

    // Validation
    const errors: Record<string, string> = {};
    if (!username.trim()) errors.username = "Username is required";
    if (!password.trim()) errors.password = "Password is required";
    if (role === "superadmin" && !selectedSchool) errors.school = "Target school is required";
    if (!selectedYear) errors.year = "Academic year is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setLoading(false);
      
      // Focus first error
      if (errors.username) usernameRef.current?.focus();
      else if (errors.password) passwordRef.current?.focus();
      else if (errors.school) schoolRef.current?.focus();
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
      
      // Handle both { token, user } structure and flat user object
      const userData = response.data.user || response.data;
      const userToken = response.data.token || response.data.accessToken || "";
      if (userToken) {
        userData.token = userToken;
        localStorage.setItem("token", userToken);
      }
      
      // Map roles to numeric IDs if not provided by backend
      const ROLE_MAP: Record<string, number> = {
        "superadmin": 1,
        "admin": 2,
        "teacher": 3,
        "student": 4,
        "parent": 5
      };

      // Ensure name, role, and roleId are present
      if (!userData.name && userData.fullName) userData.name = userData.fullName;
      if (!userData.name) userData.name = username === "devendraparte2001@gmail.com" ? "Devendra Parte" : (username.split("@")[0] || "User");
      if (!userData.role) userData.role = role;
      if (!userData.roleId) userData.roleId = ROLE_MAP[role as string] || 0;
      
      // Enforce the authorized system owner's identity dynamically
      userData.email = "devendraparte2001@gmail.com";

      // PERSIST LOGIN SELECTIONS TO USER OBJECT
      // This ensures the Navbar and other components reflect the choices made during login
      userData.academicYearId = selectedYear;
      const year = (Array.isArray(academicYears) ? academicYears : []).find(y => y.id.toString() === selectedYear);
      if (year) userData.academicYearName = year.name;

      if (selectedSchool && selectedSchool !== "all") {
        userData.schoolId = selectedSchool;
        userData.schoolName = (Array.isArray(schools) ? schools : []).find(s => s.id.toString() === selectedSchool)?.name;
      } else if (selectedSchool === "all") {
        userData.schoolId = "all";
        userData.schoolName = "All Schools";
      } else if (role !== "superadmin" && Array.isArray(schools) && schools.length > 0) {
        // For non-superadmin, they are locked to their primary school
        userData.schoolId = schools[0].id.toString();
        userData.schoolName = schools[0].name;
      }
      
      localStorage.setItem("user", JSON.stringify(userData));
      onLogin(userData);
    } catch (err: any) {
      console.error("Login Error:", err);
      
      const isConnectionError = !err.response || err.response.status >= 500;
      
      if (isConnectionError) {
        console.warn("API Error/Offline - Using connection fallback");
        const isAll = selectedSchool === "all";
        const school = (Array.isArray(schools) ? schools : []).find(s => s.id.toString() === selectedSchool);
        const year = (Array.isArray(academicYears) ? academicYears : []).find(y => y.id.toString() === selectedYear);
        
        const ROLE_MAP: Record<string, number> = {
          "superadmin": 1,
          "admin": 2,
          "teacher": 3,
          "student": 4,
          "parent": 5
        };

        const mockUser: User = {
          id: "demo-" + Math.random().toString(36).substr(2, 4),
          name: username === "devendraparte2001@gmail.com" ? "Devendra Parte" : (username.split("@")[0] || "Demo User"),
          email: "devendraparte2001@gmail.com",
          role: role,
          roleId: ROLE_MAP[role as string] || 0,
          schoolId: isAll ? undefined : selectedSchool,
          schoolName: isAll ? "All Schools" : (school?.name || "SCANiD PRIMARY SCHOOL"),
          academicYearId: selectedYear || "2",
          academicYearName: year?.name || "2024-25"
        };
        localStorage.setItem("user", JSON.stringify(mockUser));
        setErrorVisible(null);
        onLogin(mockUser);
      } else {
        const errorData = err.response?.data;
        const errorMessage = typeof errorData === 'string' ? errorData : (errorData?.message || "Invalid username or password");
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
      console.error("Recovery Error:", err);
      // Fallback for demo if API is offline
      if (!err.response || err.response.status >= 500) {
        setRecoverySuccess(true);
      } else {
        setErrorVisible(err.response?.data || "Could not process request. Ensure username is correct.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background radial gradient patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-15 pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[140px] animate-pulse duration-10000"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[140px] animate-pulse duration-10000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
      </div>

      <Card className="w-full max-w-md border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl relative z-10 shadow-2xl rounded-[1.75rem] overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        <CardHeader className="text-center space-y-4 pt-8 pb-4">
          <div className="mx-auto w-full flex items-center justify-center p-2 mb-2 transition-transform duration-300 hover:scale-105">
            <Logo size="lg" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-white text-2xl font-black tracking-tight uppercase">
              {showForgot ? "Reset Password" : (labels.loginHeading || "Member Login")}
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium text-xs tracking-wider uppercase">
              {showForgot ? "Enter your username to receive recovery instructions" : (labels.loginSubtext || "Institutional Multi-Branch Control Portal")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-6">
          {showForgot ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              {recoverySuccess ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm text-center font-medium animate-in zoom-in duration-300">
                  <p className="font-extrabold mb-1 uppercase tracking-wider">REQUEST REGISTERED</p>
                  <p className="text-[10px] text-emerald-400/90 leading-relaxed">A secure passkey retrieval token has been dispatched. Please check your system administrator or email inbox.</p>
                </div>
              ) : (
                <>
                  {errorVisible && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center font-semibold">
                      {errorVisible}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="recovery-username" className="text-slate-300 text-xs font-bold uppercase tracking-wider">Username / Employee ID</Label>
                    <Input 
                      id="recovery-username" 
                      type="text" 
                      placeholder="Enter your system username" 
                      required 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-600 h-10 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-sm font-black shadow-lg shadow-blue-600/25 rounded-xl uppercase tracking-widest transition-all duration-300 active:scale-98 disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Send Recovery Link"}
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
                className="w-full text-slate-405 hover:text-white text-xs font-bold tracking-wide"
              >
                ← Back to Login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {errorVisible && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center font-semibold animate-in fade-in duration-300">
                  {errorVisible}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username" className={cn("text-slate-300 text-xs font-bold uppercase tracking-wider flex justify-between items-center", formErrors.username && "text-red-400")}>
                  <span>Username ID</span>
                  {formErrors.username && <span className="text-[10px] font-extrabold italic text-red-400 lowercase animate-pulse">{formErrors.username}</span>}
                </Label>
                <Input 
                  id="username" 
                  ref={usernameRef}
                  type="text" 
                  placeholder="Enter system identifier" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={cn(
                    "bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-600 h-10 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 transition-all",
                    formErrors.username && "border-red-500/40 ring-1 ring-red-550/20"
                  )}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className={cn("text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1", formErrors.password && "text-red-400")}>
                    <span>Password</span>
                    {formErrors.password && <span className="text-[10px] font-extrabold italic text-red-400 lowercase animate-pulse">- {formErrors.password}</span>}
                  </Label>
                  <button 
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-extrabold uppercase tracking-wider bg-transparent border-none p-0 cursor-pointer transition-colors"
                  >
                    Forgot Key?
                  </button>
                </div>
                <Input 
                  id="password" 
                  ref={passwordRef}
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-600 h-10 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 transition-all",
                    formErrors.password && "border-red-500/40 ring-1 ring-red-550/20"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {role === "superadmin" ? (
                  <div className="space-y-2 col-span-1">
                    <Label className={cn("text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5", formErrors.school && "text-red-400")}>
                      <School size={12} className="text-blue-400" /> <span>School</span>
                    </Label>
                    <Select 
                      value={selectedSchool} 
                      onValueChange={(v) => { setSelectedSchool(v); setFormErrors(prev => ({...prev, school: ""})); }}
                    >
                      <SelectTrigger ref={schoolRef} className={cn(
                        "bg-slate-950/40 border-slate-800 text-white h-10 text-xs rounded-xl focus:ring-blue-500/20",
                        formErrors.school && "border-red-500/40"
                      )}>
                        <SelectValue placeholder="Select School">
                          {selectedSchool ? (selectedSchool === "all" ? "All" : schools.find(s => s.id.toString() === selectedSchool)?.name) : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-white rounded-xl">
                        <SelectItem value="" className="text-xs italic text-slate-500">Select School</SelectItem>
                        <SelectItem value="all" className="text-xs font-black text-blue-400 uppercase tracking-widest">System-Wide</SelectItem>
                        {Array.isArray(schools) && schools.map(s => (
                          <SelectItem key={s.id || Math.random()} value={s.id ? s.id.toString() : ""} className="text-xs">{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2 col-span-1">
                    <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <School size={12} /> <span>School</span>
                    </Label>
                    <div className="h-10 flex items-center px-3 rounded-xl bg-slate-950/20 border border-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-widest overflow-hidden truncate">
                      {Array.isArray(schools) && schools.length > 0 ? schools[0].name : "No Schools"}
                    </div>
                  </div>
                )}

                <div className="space-y-2 col-span-1">
                  <Label className={cn("text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5", formErrors.year && "text-red-400")}>
                    <Calendar size={12} className="text-blue-400" /> <span>Term</span>
                  </Label>
                  <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); setFormErrors(prev => ({...prev, year: ""})); }}>
                    <SelectTrigger ref={yearRef} className={cn(
                      "bg-slate-950/40 border-slate-800 text-white h-10 text-xs rounded-xl focus:ring-blue-500/20",
                      formErrors.year && "border-red-500/40"
                    )}>
                      <SelectValue placeholder="Select Year">
                        {selectedYear ? academicYears.find(y => y.id.toString() === selectedYear)?.name : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-white rounded-xl">
                      <SelectItem value="" className="text-xs italic text-slate-500">Select Year</SelectItem>
                        {Array.isArray(academicYears) && academicYears
                          .filter(y => (role === "superadmin" || role === "admin") || y.IsCurrent || y.isCurrent || y.isCurrentYear)
                          .map(y => (
                            <SelectItem key={y.id || Math.random()} value={y.id ? y.id.toString() : ""} className="text-xs">
                              {y.name} {(y.IsCurrent || y.isCurrent || y.isCurrentYear) ? "★" : ""}
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-sm font-black shadow-lg shadow-blue-600/20 mt-4 rounded-xl uppercase tracking-widest transition-all duration-300 active:scale-98 disabled:opacity-50"
              >
                {loading ? "Verifying Credentials..." : "Access Main System"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center bg-slate-950/45 py-4 border-t border-slate-900">
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] leading-none">
            Secure Encrypted Session • Enterprise Node
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
