import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

// Layout components
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

// Pages
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Marks from "@/pages/Marks";
import Attendance from "@/pages/Attendance";
import Fees from "@/pages/Fees";
import Messages from "@/pages/Messages";
import Staff from "@/pages/Staff";
import Schools from "@/pages/Schools";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import SystemLogs from "@/pages/SystemLogs";
import Configuration from "@/pages/Configuration";
import Notifications from "@/pages/Notifications";
import UsersPage from "@/pages/Users";

import { Role, User } from "@/types";

function normalizeUser(u: User | null): User | null {
  if (!u) return null;
  const parsed = { ...u };
  const roleLower = (parsed.role || "").trim().toLowerCase().replace(/\s+/g, "");
  if (roleLower === "superadmin" || roleLower === "superadminrole" || roleLower === "super admin") {
    parsed.role = "superadmin";
    parsed.roleId = 1;
  } else if (roleLower === "admin") {
    parsed.role = "admin";
    parsed.roleId = 2;
  } else if (roleLower === "teacher") {
    parsed.role = "teacher";
    parsed.roleId = 3;
  } else if (roleLower === "student") {
    parsed.role = "student";
    parsed.roleId = 4;
  } else if (roleLower === "parent") {
    parsed.role = "parent";
    parsed.roleId = 5;
  }
  return parsed;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper to standardise state and local cache updates
  const handleSetUser = (u: User | null) => {
    const norm = normalizeUser(u);
    setUser(norm);
    if (norm) {
      localStorage.setItem("user", JSON.stringify(norm));
    } else {
      localStorage.removeItem("user");
    }
  };

  // Mock authentication for development
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed: User = JSON.parse(savedUser);
        if (parsed) {
          // Safeguard: Automatically map legacy sessions to the authorized owner
          if (parsed.email !== "devendraparte2001@gmail.com") {
            parsed.email = "devendraparte2001@gmail.com";
            parsed.name = parsed.name && parsed.name !== "Demo User" && parsed.name !== "User" ? parsed.name : "Devendra Parte";
          }
          handleSetUser(parsed);
        }
      } catch (err) {
        console.error("Invalid user JSON", err);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const handleUpdateUser = (updatedUser: User) => {
    handleSetUser(updatedUser);
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login onLogin={handleSetUser} />} />
          <Route path="/login" element={<Login onLogin={handleSetUser} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <TooltipProvider>
        <div className="flex h-screen bg-slate-50 relative">
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <Sidebar 
            user={user} 
            onLogout={handleLogout} 
            isMobileOpen={isSidebarOpen} 
            onCloseMobile={() => setIsSidebarOpen(false)} 
          />
          
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <Navbar 
              user={user} 
              onLogout={handleLogout} 
              onUserUpdate={handleUpdateUser} 
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            <Breadcrumbs user={user} />
            <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 min-w-0">
              <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/students" element={<Students user={user} />} />
                <Route path="/marks" element={<Marks user={user} />} />
                <Route path="/attendance" element={<Attendance user={user} defaultTab="daily" />} />
                <Route path="/attendance/daily" element={<Attendance user={user} defaultTab="daily" />} />
                <Route path="/attendance/manual" element={<Attendance user={user} defaultTab="manual" />} />
                <Route path="/attendance/leaves" element={<Attendance user={user} defaultTab="leaves" />} />
                <Route path="/attendance/reprocess" element={<Attendance user={user} defaultTab="reprocess" />} />
                <Route path="/attendance/lock" element={<Attendance user={user} defaultTab="lock" />} />
                <Route path="/attendance/audit" element={<Attendance user={user} defaultTab="audit" />} />
                <Route path="/attendance/report" element={<Attendance user={user} defaultTab="report" />} />
                <Route path="/fees" element={<Fees user={user} />} />
                <Route path="/messages" element={<Messages user={user} />} />
                <Route path="/notifications" element={<Notifications user={user} />} />
                <Route path="/staff" element={<Staff user={user} />} />
                <Route path="/profile" element={<Profile user={user} />} />
                <Route path="/settings" element={<Settings user={user} />} />
                {/* 
                  RBAC (Role Based Access Control) check:
                  Only render routes that the current user has permission to view.
                  Superadmin and Admin can access configuration.
                */}
                {((user.role?.toLowerCase() === "superadmin" || user.role?.toLowerCase() === "super admin") || user.role?.toLowerCase() === "admin") && (
                  <>
                    <Route path="/schools" element={<Navigate to="/configuration/schools" replace />} />
                    <Route path="/role-assignment" element={<Navigate to="/configuration/users" replace />} />
                    <Route path="/navigation-management" element={<Navigate to="/configuration/navigation" replace />} />
                    <Route path="/configuration" element={<Configuration user={user} />} />
                    <Route path="/configuration/schools" element={<Configuration user={user} defaultTab="schools" />} />
                    <Route path="/configuration/role-master" element={<Configuration user={user} defaultTab="role-master" />} />
                    <Route path="/configuration/role-assignment" element={<Navigate to="/configuration/users" replace />} />
                    <Route path="/configuration/standards" element={<Configuration user={user} defaultTab="standards" />} />
                    <Route path="/configuration/sections" element={<Configuration user={user} defaultTab="sections" />} />
                    <Route path="/configuration/academic-years" element={<Configuration user={user} defaultTab="academic-years" />} />
                    <Route path="/configuration/castes" element={<Configuration user={user} defaultTab="castes" />} />
                    <Route path="/configuration/sub-castes" element={<Configuration user={user} defaultTab="sub-castes" />} />
                    <Route path="/configuration/religions" element={<Configuration user={user} defaultTab="religions" />} />
                    <Route path="/configuration/states" element={<Configuration user={user} defaultTab="states" />} />
                    <Route path="/configuration/cities" element={<Configuration user={user} defaultTab="cities" />} />
                    <Route path="/configuration/school-sections" element={<Configuration user={user} defaultTab="school-sections" />} />
                    <Route path="/configuration/blood-groups" element={<Configuration user={user} defaultTab="blood-groups" />} />
                    <Route path="/configuration/houses" element={<Configuration user={user} defaultTab="houses" />} />
                    <Route path="/configuration/admission-types" element={<Configuration user={user} defaultTab="admission-types" />} />
                    <Route path="/configuration/categories" element={<Configuration user={user} defaultTab="categories" />} />
                    <Route path="/configuration/sessions" element={<Configuration user={user} defaultTab="sessions" />} />
                    <Route path="/configuration/batches" element={<Configuration user={user} defaultTab="batches" />} />
                    <Route path="/configuration/shifts" element={<Configuration user={user} defaultTab="shifts" />} />
                    <Route path="/configuration/weekdays" element={<Configuration user={user} defaultTab="weekdays" />} />
                    <Route path="/configuration/holidays" element={<Configuration user={user} defaultTab="holidays" />} />
                    <Route path="/configuration/attendance-statuses" element={<Configuration user={user} defaultTab="attendance-statuses" />} />
                    <Route path="/configuration/subjects" element={<Configuration user={user} defaultTab="subjects" />} />
                    <Route path="/configuration/exam-types" element={<Configuration user={user} defaultTab="exam-types" />} />
                    <Route path="/configuration/designations" element={<Configuration user={user} defaultTab="designations" />} />
                    <Route path="/configuration/occupations" element={<Configuration user={user} defaultTab="occupations" />} />
                    <Route path="/configuration/staff-initials" element={<Configuration user={user} defaultTab="staff-initials" />} />
                    <Route path="/configuration/navigation" element={<Configuration user={user} defaultTab="navigation" />} />
                    <Route path="/configuration/users" element={<UsersPage user={user} />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/system-logs" element={<SystemLogs user={user} />} />
                  </>
                )}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </BrowserRouter>
  );
}
