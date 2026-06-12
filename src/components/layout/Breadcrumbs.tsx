import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSystemLabels } from "@/context/LabelContext";
import { 
  ChevronRight, 
  Home, 
  LayoutDashboard, 
  GraduationCap, 
  CalendarCheck, 
  BarChart3, 
  Users, 
  UserCheck, 
  CreditCard, 
  MessageSquare, 
  Database, 
  School, 
  Key, 
  Shield, 
  Layout, 
  LayoutGrid, 
  Layers, 
  Hash, 
  Calendar, 
  BookOpen, 
  Heart, 
  Droplets, 
  UserCircle, 
  Terminal, 
  Map, 
  MapPin, 
  Clock, 
  Award, 
  Briefcase, 
  Hammer, 
  Bell, 
  User, 
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";

interface NavItem {
  id: number;
  title: string;
  icon: string | null;
  path: string;
}

interface BreadcrumbsProps {
  user?: any;
}

export default function Breadcrumbs({ user }: BreadcrumbsProps) {
  const { labels } = useSystemLabels();
  const location = useLocation();
  const [menuItems, setMenuItems] = useState<NavItem[]>([]);

  // Helper taxonomy translation mapping for white labelling
  const translateTitle = (title: string) => {
    if (!title || !labels) return title;
    let res = title;
    if (res === "Student Registry" || res.toLowerCase() === "student registry" || res === "Student" || res === "Students") {
      res = `${labels.student} Registry`;
    } else if (res === "Staff Directory" || res.toLowerCase() === "staff directory") {
      res = `${labels.staff.split('/')[0]} Directory`;
    } else if (res === "Staff & HR" || res.toLowerCase() === "staff & hr") {
      const staffLabel = labels.staffs || "Staff";
      res = staffLabel.includes("Staff") ? staffLabel : `${staffLabel} & HR`;
    } else if (res === "Standards & Grades" || res.toLowerCase() === "standards & grades") {
      res = `${labels.standard}s & Grades`;
    } else if (res === "Divisions/Sections" || res.toLowerCase() === "divisions/sections") {
      res = `Divisions/${labels.section}s`;
    } else if (res === "School Sections" || res.toLowerCase() === "school sections") {
      res = `School ${labels.section}s`;
    } else if (res === "Academic Years" || res.toLowerCase() === "academic years") {
      res = `${labels.academicYear}s`;
    } else if (res === "Attendance Tracking" || res.toLowerCase() === "attendance tracking" || res === "Attendance") {
      res = "Attendance Tracking";
    } else if (res === "Examination & Marks" || res.toLowerCase() === "marks" || res === "Marks") {
      res = "Examination & Marks";
    }
    return res;
  };

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const currentRoleId = user?.roleId || 0;
        const response = await apiService.getNavigations(currentRoleId);
        const rawData = response.data?.data || response.data || [];
        
        if (Array.isArray(rawData)) {
          setMenuItems(rawData.map((item: any) => ({
            id: Number(item.id),
            title: item.title,
            icon: item.icon,
            path: item.path || "#"
          })));
        }
      } catch (error) {
        console.error("Failed to fetch breadcrumb mapping from database:", error);
      }
    };

    fetchNavigation();
  }, [user?.roleId]);

  const breadcrumbs = useMemo(() => {
    const pathnames = location.pathname.split("/").filter((x) => x);
    const crumbs = [
      { name: "Home", path: "/" }
    ];
    
    pathnames.forEach((value, index) => {
      const path = `/${pathnames.slice(0, index + 1).join("/")}`;
      const cleanPath = path.toLowerCase().replace(/\/$/, "");

      // Match path dynamically against database-sourced navigation keys
      const match = menuItems.find(item => {
        const itemPath = (item.path || "").toLowerCase().replace(/\/$/, "");
        return itemPath === cleanPath;
      });

      let name = "";
      if (match) {
        name = match.title;
      } else {
        // Humanized fallback for parameterized or newly added routes
        name = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");
        if (name.toLowerCase() === "configuration") {
          name = "Masters & Config";
        } else if (name.toLowerCase() === "role-master") {
          name = "Role Master";
        } else if (name.toLowerCase() === "role-assignment") {
          name = "User Accounts";
        } else if (name.toLowerCase() === "system-logs") {
          name = "System Logs";
        } else if (name.toLowerCase() === "marks") {
          name = "Examination & Marks";
        }
      }
      
      // Dynamic white labeling replacement
      crumbs.push({ name: translateTitle(name), path });
    });
    
    return crumbs;
  }, [location.pathname, menuItems, labels]);

  const getIconForPath = (path: string, name: string) => {
    const cleanPath = path.toLowerCase().replace(/\/$/, "");
    const cleanName = name.toLowerCase();

    if (cleanPath === "" || cleanPath === "/") return Home;
    if (cleanPath === "/students") return GraduationCap;
    if (cleanPath === "/marks") return BarChart3;
    if (cleanPath === "/attendance") return CalendarCheck;
    if (cleanPath === "/fees") return CreditCard;
    if (cleanPath === "/messages") return MessageSquare;
    if (cleanPath === "/teachers" || cleanPath === "/staff") return Users;
    if (cleanPath === "/profile") return User;
    if (cleanPath === "/settings") return Settings;
    if (cleanPath === "/notifications") return Bell;
    if (cleanPath === "/system-logs") return Terminal;
    if (cleanPath === "/configuration") return Database;
    
    if (cleanPath.startsWith("/configuration/")) {
      const sub = cleanPath.split("/").pop() || "";
      switch (sub) {
        case "schools": return School;
        case "role-master": return Shield;
        case "role-assignment": return UserCheck;
        case "standards": return Layers;
        case "sections": return Hash;
        case "academic-years": return Calendar;
        case "subjects": return BookOpen;
        case "religions": return Heart;
        case "blood-groups": return Droplets;
        case "castes": return Users;
        case "sub-castes": return UserCircle;
        case "houses": return Home;
        case "admission-types": return UserCheck;
        case "states": return Map;
        case "cities": return MapPin;
        case "categories": return LayoutGrid;
        case "sessions": return Clock;
        case "batches": return Users;
        case "shifts": return Clock;
        case "exam-types": return Award;
        case "designations": return Briefcase;
        case "occupations": return Hammer;
        case "navigation": return LayoutGrid;
        case "users": return Users;
        default: return Database;
      }
    }

    if (cleanName.includes("home")) return Home;
    if (cleanName.includes("dashboard")) return LayoutDashboard;
    if (cleanName.includes("student")) return GraduationCap;
    if (cleanName.includes("mark") || cleanName.includes("report") || cleanName.includes("academic")) return BarChart3;
    if (cleanName.includes("attendance")) return CalendarCheck;
    if (cleanName.includes("fee")) return CreditCard;
    if (cleanName.includes("message") || cleanName.includes("chat") || cleanName.includes("comm")) return MessageSquare;
    if (cleanName.includes("teacher") || cleanName.includes("faculty") || cleanName.includes("staff")) return Users;
    if (cleanName.includes("profile")) return User;
    if (cleanName.includes("setting")) return Settings;
    if (cleanName.includes("log") || cleanName.includes("audit")) return Terminal;
    if (cleanName.includes("school")) return School;
    if (cleanName.includes("config") || cleanName.includes("master")) return Database;

    return Database;
  };

  return (
    <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 md:px-8 py-3 shrink-0 transition-all duration-300">
      <nav className="flex items-center space-x-1 overflow-x-auto whitespace-nowrap scrollbar-hide py-0.5">
        {breadcrumbs.map((crumb, index) => {
          const IconComponent = getIconForPath(crumb.path, crumb.name);
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <React.Fragment key={crumb.path}>
              {index > 0 && (
                <ChevronRight size={12} className="text-slate-300 mx-1.5 shrink-0" />
              )}
              <Link 
                to={crumb.path}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded-lg text-slate-400 font-bold text-[11px] uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
                  isLast 
                    ? "text-blue-600 bg-blue-50/50 hover:bg-blue-50" 
                    : "hover:text-slate-700 hover:bg-slate-100/70"
                )}
              >
                <IconComponent size={13} className={cn("shrink-0", isLast ? "text-blue-600" : "text-slate-400")} />
                <span>{crumb.name}</span>
              </Link>
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}
