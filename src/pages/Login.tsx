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
  const [username, setUsername] = useState("admin");
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
      
      setSchools(schoolData);
      setAcademicYears(yearData);
      
      // Find the current academic year (IsCurrent === true) by default as per user request
      const currentYear = yearData.find((y: any) => y.IsCurrent || y.isCurrent || y.isCurrentYear);
      if (currentYear) {
        setSelectedYear(currentYear.id.toString());
      } else if (yearData.length > 0) {
        setSelectedYear(yearData[0].id.toString());
      } else {
        setSelectedYear("");
      }
      setSelectedSchool("");
    } catch (error) {
      console.error("Fetch lookups error:", error);
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
      if (!userData.name) userData.name = username.split("@")[0] || "User";
      if (!userData.role) userData.role = role;
      if (!userData.roleId) userData.roleId = ROLE_MAP[role as string] || 0;

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
      
      const errorData = err.response?.data;
      const errorMessage = typeof errorData === 'string' ? errorData : (errorData?.message || "Invalid username or password");
      setErrorVisible(errorMessage);
      
      // FALLBACK for development ONLY if it's a connection error (not a 401/403)
      if (import.meta.env.DEV && (!err.response || err.response.status >= 500)) {
        console.warn("API Error/Offline - Using dev fallback");
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
          name: username.split("@")[0] || "Demo User",
          email: username.includes("@") ? username : `${username}@school.com`,
          role: role,
          roleId: ROLE_MAP[role as string] || 0,
          schoolId: isAll ? undefined : selectedSchool,
          schoolName: isAll ? "All Schools" : school?.name,
          academicYearId: selectedYear,
          academicYearName: year?.name
        };
        localStorage.setItem("user", JSON.stringify(mockUser));
        onLogin(mockUser);
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
      if (import.meta.env.DEV) {
        setRecoverySuccess(true);
      } else {
        setErrorVisible(err.response?.data || "Could not process request. Ensure username is correct.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[128px]"></div>
      </div>

      <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl relative z-10 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-full flex items-center justify-center p-2">
            <Logo size="lg" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-white text-xl font-bold tracking-tight">
              {showForgot ? "Reset Password" : "Member Login"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {showForgot ? "Enter your username to receive recovery instructions" : "Multi-Institution Enterprise Portal"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {showForgot ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              {recoverySuccess ? (
                <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm text-center font-medium animate-in zoom-in duration-300">
                  <p className="font-bold mb-1 italic underline">REQUEST RECEIVED!</p>
                  <p className="text-[10px]">Recovery link has been sent to your registered contact details. Please check your inbox.</p>
                </div>
              ) : (
                <>
                  {errorVisible && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-xs text-center font-medium">
                      {errorVisible}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="recovery-username" className="text-slate-300 text-xs">Username / Employee ID</Label>
                    <Input 
                      id="recovery-username" 
                      type="text" 
                      placeholder="Enter your username" 
                      required 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-10"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base font-bold shadow-lg shadow-blue-500/20 uppercase tracking-widest disabled:opacity-50"
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
                className="w-full text-slate-400 hover:text-white text-xs"
              >
                ← Back to Login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {errorVisible && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-xs text-center font-medium animate-in fade-in slide-in-from-top-1">
                  {errorVisible}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username" className={cn("text-slate-300 text-xs", formErrors.username && "text-red-400")}>
                  Username {formErrors.username && <span className="text-[10px] font-bold italic ml-1">- {formErrors.username}</span>}
                </Label>
                <Input 
                  id="username" 
                  ref={usernameRef}
                  type="text" 
                  placeholder="Enter username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={cn(
                    "bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-9",
                    formErrors.username && "border-red-500/50 ring-1 ring-red-500/20"
                  )}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className={cn("text-slate-300 text-xs", formErrors.password && "text-red-400")}>
                    Password {formErrors.password && <span className="text-[10px] font-bold italic ml-1">- {formErrors.password}</span>}
                  </Label>
                  <button 
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[10px] text-blue-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    Forgot password?
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
                    "bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-9",
                    formErrors.password && "border-red-500/50 ring-1 ring-red-500/20"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {role === "superadmin" ? (
                  <div className="space-y-2 col-span-1">
                    <Label className={cn("text-slate-300 text-xs flex items-center gap-2", formErrors.school && "text-red-400")}>
                      <School size={12} /> Target School {formErrors.school && <span className="text-[10px] font-bold italic ml-1">*</span>}
                    </Label>
                    <Select 
                      value={selectedSchool} 
                      onValueChange={(v) => { setSelectedSchool(v); setFormErrors(prev => ({...prev, school: ""})); }}
                    >
                      <SelectTrigger ref={schoolRef} className={cn(
                        "bg-slate-800/50 border-slate-700 text-white h-9 text-xs",
                        formErrors.school && "border-red-500/50 ring-1 ring-red-500/20"
                      )}>
                        {/* Custom display logic to show correct names and handle placeholder via undefined children */}
                        <SelectValue placeholder="Select Current School">
                          {selectedSchool ? (selectedSchool === "all" ? "All Schools (System-wide)" : schools.find(s => s.id.toString() === selectedSchool)?.name) : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="" className="text-xs italic text-slate-400">Select Current School</SelectItem>
                        <SelectItem value="all" className="text-xs font-bold text-blue-400">All Schools (System-wide)</SelectItem>
                        {Array.isArray(schools) && schools.map(s => (
                          <SelectItem key={s.id || Math.random()} value={s.id ? s.id.toString() : ""} className="text-xs">{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2 col-span-1">
                    <Label className="text-slate-500 text-xs flex items-center gap-2">
                      <School size={12} /> Current School
                    </Label>
                    <div className="h-9 flex items-center px-3 rounded-md bg-slate-800/30 border border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider overflow-hidden truncate">
                      {Array.isArray(schools) && schools.length > 0 ? schools[0].name : "No Schools Configured"}
                    </div>
                  </div>
                )}

                <div className="space-y-2 col-span-1">
                  <Label className={cn("text-slate-300 text-xs flex items-center gap-2", formErrors.year && "text-red-400")}>
                    <Calendar size={12} /> Academic Year {formErrors.year && <span className="text-[10px] font-bold italic ml-1">*</span>}
                  </Label>
                  <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); setFormErrors(prev => ({...prev, year: ""})); }}>
                    <SelectTrigger ref={yearRef} className={cn(
                      "bg-slate-800/50 border-slate-700 text-white h-9 text-xs",
                      formErrors.year && "border-red-500/50 ring-1 ring-red-500/20"
                    )}>
                      {/* Custom display logic to show correct year name and handle placeholder via undefined children */}
                      <SelectValue placeholder="Select Academic Year">
                        {selectedYear ? academicYears.find(y => y.id.toString() === selectedYear)?.name : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="" className="text-xs italic text-slate-400">Select Academic Year</SelectItem>
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
              
              {/* Temporarily hidden as per request. Roles are auto-detected by username or handled during validation */}
              <div className="hidden space-y-3 pt-2" aria-hidden="true">
                <Label className="text-slate-300 text-xs">Select Role</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["superadmin", "admin", "teacher"] as Role[]).map((r) => (
                    <Button
                      key={r}
                      type="button"
                      variant={role === r ? "default" : "outline"}
                      className={cn(
                        "h-8 text-[10px] uppercase tracking-wider font-bold",
                        role === r ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                      )}
                      onClick={() => setRole(r)}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["parent", "student"] as Role[]).map((r) => (
                    <Button
                      key={r}
                      type="button"
                      variant={role === r ? "default" : "outline"}
                      className={cn(
                        "h-8 text-[10px] uppercase tracking-wider font-bold",
                        role === r ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                      )}
                      onClick={() => setRole(r)}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base font-bold shadow-lg shadow-blue-500/20 mt-4 uppercase tracking-widest disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Sign In to Portal"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center">
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Secure, Encypted & Scalable School Management Solutions
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
