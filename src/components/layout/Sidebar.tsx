import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  LogOut,
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  UserCheck,
  Terminal,
  Database,
  School,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role, User } from "@/types";
import { apiService } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { SimpleTooltip } from "@/components/shared/SimpleTooltip";
import { Logo } from "@/components/shared/Logo";

interface NavItem {
  id: number;
  title: string;
  icon: string | null;
  path: string;
  parentId: number | null;
  sortOrder: number;
  roleIds: number[];
  subItems?: NavItem[];
}

interface SidebarProps {
  user: User;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

// Icon mapping helper
const getIcon = (iconName: string | null) => {
  if (!iconName) return null;
  // @ts-ignore
  const Icon = LucideIcons[iconName];
  return Icon || null;
};

export default function Sidebar({ user, onLogout, isMobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState<NavItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        setIsLoading(true);
        // Preference for numeric RoleId for more robust RBAC filtering
        const currentRoleId = user.roleId || 0;
        
        // Fetch navigation filtered by roleId from backend
        const response = await apiService.getNavigations(currentRoleId);
        let rawData = response.data?.data || response.data || [];
        
        // Ensure rawData is an array
        if (!rawData || !Array.isArray(rawData)) {
          console.warn("API did not return an array for navigation, using hardcoded fallback");
          rawData = [];
        }

        // Fallback to hardcoded defaults if API returns nothing
        if (rawData.length === 0) {
          console.warn("API returned empty navigation data, using hardcoded fallback");
          // IDs: SuperAdmin=1, Admin=2, Teacher=3, Student=4, Parent=5, All=0
          const allRoles = [1, 2, 3, 4, 5];
          const adminRoles = [1, 2];

          rawData = [
            { id: 1, title: "Dashboard", icon: "LayoutDashboard", path: "/", parentId: null, sortOrder: 1, roleIds: allRoles },
            
            // Academic Operations Group
            { id: 2, title: "Academic Operations", icon: "BookOpen", path: null, parentId: null, sortOrder: 2, roleIds: allRoles },
            { id: 3, title: "Student Registry", icon: "GraduationCap", path: "/students", parentId: 2, sortOrder: 1, roleIds: [1, 2, 3, 5] },
            { id: 4, title: "Attendance Tracking", icon: "CalendarCheck", path: null, parentId: 2, sortOrder: 2, roleIds: allRoles },
            
            // Attendance Tracking Children (IDs 5 to 11)
            { id: 5, title: "Roll Call", icon: "CalendarCheck", path: "/attendance/daily", parentId: 4, sortOrder: 1, roleIds: allRoles },
            { id: 6, title: "Manual Upload", icon: "Upload", path: "/attendance/manual", parentId: 4, sortOrder: 2, roleIds: allRoles },
            { id: 7, title: "Leaves Register", icon: "CalendarClock", path: "/attendance/leaves", parentId: 4, sortOrder: 3, roleIds: allRoles },
            { id: 8, title: "Reprocess Range", icon: "RefreshCw", path: "/attendance/reprocess", parentId: 4, sortOrder: 4, roleIds: allRoles },
            { id: 9, title: "Payroll Lock", icon: "Lock", path: "/attendance/lock", parentId: 4, sortOrder: 5, roleIds: [1, 2] },
            { id: 10, title: "Correction Audit", icon: "History", path: "/attendance/audit", parentId: 4, sortOrder: 6, roleIds: [1, 2] },
            { id: 11, title: "Reports", icon: "BarChart3", path: "/attendance/report", parentId: 4, sortOrder: 7, roleIds: allRoles },

            { id: 12, title: "Examination & Marks", icon: "BarChart3", path: "/marks", parentId: 2, sortOrder: 3, roleIds: allRoles },
            
            // Staff & HR Group
            { id: 13, title: "Staff & HR", icon: "Users", path: null, parentId: null, sortOrder: 3, roleIds: adminRoles },
            { id: 14, title: "Staff Directory", icon: "UserCheck", path: "/staff", parentId: 13, sortOrder: 1, roleIds: adminRoles },
            { id: 15, title: "Manage Users", icon: "UserPlus", path: "/configuration/users", parentId: 13, sortOrder: 2, roleIds: adminRoles },
            
            // Administrative Group
            { id: 16, title: "Administrative", icon: "ShieldCheck", path: null, parentId: null, sortOrder: 4, roleIds: allRoles },
            { id: 17, title: "Fee Management", icon: "CreditCard", path: "/fees", parentId: 16, sortOrder: 1, roleIds: [1, 2, 5] },
            { id: 18, title: "Communication Hub", icon: "MessageSquare", path: "/messages", parentId: 16, sortOrder: 2, roleIds: allRoles },
            { id: 19, title: "Notification Center", icon: "Bell", path: "/notifications", parentId: 16, sortOrder: 3, roleIds: allRoles },
            
            // Masters & Config Group
            { id: 20, title: "Masters & Config", icon: "Database", path: "/configuration", parentId: null, sortOrder: 5, roleIds: adminRoles },
            { id: 21, title: "Global Schools", icon: "School", path: "/configuration/schools", parentId: 20, sortOrder: 1, roleIds: adminRoles },
            
            // RBAC Sub-group
            { id: 22, title: "Access Control (RBAC)", icon: "Key", path: null, parentId: 20, sortOrder: 2, roleIds: adminRoles },
            { id: 23, title: "Role Master", icon: "Shield", path: "/configuration/role-master", parentId: 22, sortOrder: 1, roleIds: adminRoles },
            { id: 24, title: "User Accounts", icon: "UserCheck", path: "/configuration/role-assignment", parentId: 22, sortOrder: 2, roleIds: adminRoles },
            
            // Menu Designer Sub-group
            { id: 25, title: "Menu Designer", icon: "Layout", path: null, parentId: 20, sortOrder: 3, roleIds: adminRoles },
            { id: 26, title: "Navigation Builder", icon: "LayoutGrid", path: "/configuration/navigation", parentId: 25, sortOrder: 1, roleIds: adminRoles },
            
            // Academic Masters Sub-group
            { id: 27, title: "Academic Masters", icon: "BookOpen", path: null, parentId: 20, sortOrder: 4, roleIds: adminRoles },
            { id: 28, title: "Standards & Grades", icon: "Layers", path: "/configuration/standards", parentId: 27, sortOrder: 1, roleIds: adminRoles },
            { id: 29, title: "Divisions/Sections", icon: "Hash", path: "/configuration/sections", parentId: 27, sortOrder: 2, roleIds: adminRoles },
            { id: 30, title: "Academic Years", icon: "Calendar", path: "/configuration/academic-years", parentId: 27, sortOrder: 3, roleIds: adminRoles },
            { id: 31, title: "Subject Registry", icon: "BookOpen", path: "/configuration/subjects", parentId: 27, sortOrder: 4, roleIds: adminRoles },
            
            // General Masters Sub-group
            { id: 32, title: "General Masters", icon: "Database", path: null, parentId: 20, sortOrder: 5, roleIds: adminRoles },
            { id: 33, title: "Religion Master", icon: "Heart", path: "/configuration/religions", parentId: 32, sortOrder: 1, roleIds: adminRoles },
            { id: 34, title: "Blood Group Master", icon: "Droplets", path: "/configuration/blood-groups", parentId: 32, sortOrder: 2, roleIds: adminRoles },
            { id: 35, title: "Caste Category", icon: "Users", path: "/configuration/castes", parentId: 32, sortOrder: 3, roleIds: adminRoles },
            { id: 36, title: "Sub-Caste Master", icon: "UserCircle", path: "/configuration/sub-castes", parentId: 32, sortOrder: 4, roleIds: adminRoles },
            { id: 37, title: "School House", icon: "Home", path: "/configuration/houses", parentId: 32, sortOrder: 5, roleIds: adminRoles },
            { id: 38, title: "Admission Types", icon: "UserCheck", path: "/configuration/admission-types", parentId: 32, sortOrder: 6, roleIds: adminRoles },
            { id: 39, title: "States Master", icon: "Map", path: "/configuration/states", parentId: 32, sortOrder: 7, roleIds: adminRoles },
            { id: 40, title: "Cities Master", icon: "MapPin", path: "/configuration/cities", parentId: 32, sortOrder: 8, roleIds: adminRoles },
            { id: 41, title: "School Sections", icon: "Layers", path: "/configuration/school-sections", parentId: 32, sortOrder: 9, roleIds: adminRoles },
            { id: 42, title: "Shift Timetable", icon: "Clock", path: "/configuration/shifts", parentId: 32, sortOrder: 10, roleIds: adminRoles },
            { id: 43, title: "Category Master", icon: "LayoutGrid", path: "/configuration/categories", parentId: 32, sortOrder: 11, roleIds: adminRoles },
            { id: 44, title: "Session Master", icon: "Clock", path: "/configuration/sessions", parentId: 32, sortOrder: 12, roleIds: adminRoles },
            { id: 45, title: "Batch Master", icon: "Users", path: "/configuration/batches", parentId: 32, sortOrder: 13, roleIds: adminRoles },
            { id: 46, title: "Exam Type Master", icon: "Award", path: "/configuration/exam-types", parentId: 32, sortOrder: 14, roleIds: adminRoles },
            { id: 47, title: "Designation Master", icon: "Briefcase", path: "/configuration/designations", parentId: 32, sortOrder: 15, roleIds: adminRoles },
            { id: 48, title: "Occupation Master", icon: "Hammer", path: "/configuration/occupations", parentId: 32, sortOrder: 16, roleIds: adminRoles },
            { id: 49, title: "Staff Initials", icon: "UserRound", path: "/configuration/staff-initials", parentId: 32, sortOrder: 17, roleIds: adminRoles },
            { id: 50, title: "Weekday Master", icon: "Calendar", path: "/configuration/weekdays", parentId: 32, sortOrder: 18, roleIds: adminRoles },
            { id: 51, title: "Holiday Master", icon: "CalendarCheck", path: "/configuration/holidays", parentId: 32, sortOrder: 19, roleIds: adminRoles },
            { id: 52, title: "Attendance Statuses", icon: "CalendarCheck", path: "/configuration/attendance-statuses", parentId: 32, sortOrder: 20, roleIds: adminRoles },
            
            { id: 53, title: "System Audit", icon: "Terminal", path: "/system-logs", parentId: null, sortOrder: 6, roleIds: [1] }
          ];
        }

        // Dynamically ensure General Masters has States Master, Cities Master, and School Sections
        const generalMastersItem = rawData.find((item: any) => item.title === "General Masters");
        if (generalMastersItem) {
          const generalMastersId = Number(generalMastersItem.id);
          const adminRoles = [1, 2];

          // 1. Ensure States Master (ID 39) is present under General Masters
          const hasStates = rawData.some((item: any) => 
            item.title === "States Master" || 
            (item.path && item.path.includes("/states"))
          );
          if (!hasStates) {
            rawData.push({
              id: 39,
              title: "States Master",
              icon: "Map",
              path: "/configuration/states",
              parentId: generalMastersId,
              sortOrder: 7,
              roleIds: adminRoles
            });
          } else {
            // If States exists but has wrong parentId (e.g. from static fallback mismatches), correct it
            const statesItem = rawData.find((item: any) => 
              item.title === "States Master" || 
              (item.path && item.path.includes("/states"))
            );
            if (statesItem && Number(statesItem.parentId) !== generalMastersId) {
              statesItem.parentId = generalMastersId;
            }
          }

          // 2. Ensure Cities Master (ID 40) is present under General Masters
          const hasCities = rawData.some((item: any) => 
            item.title === "Cities Master" || 
            (item.path && item.path.includes("/cities"))
          );
          if (!hasCities) {
            rawData.push({
              id: 40,
              title: "Cities Master",
              icon: "MapPin",
              path: "/configuration/cities",
              parentId: generalMastersId,
              sortOrder: 8,
              roleIds: adminRoles
            });
          } else {
            // Correct parentId if mismatch
            const citiesItem = rawData.find((item: any) => 
              item.title === "Cities Master" || 
              (item.path && item.path.includes("/cities"))
            );
            if (citiesItem && Number(citiesItem.parentId) !== generalMastersId) {
              citiesItem.parentId = generalMastersId;
            }
          }

          // 3. Ensure School Sections (ID 41) is present under General Masters
          const hasSchoolSections = rawData.some((item: any) => 
            item.title === "School Sections" || 
            (item.path && item.path.includes("/school-sections"))
          );
          if (!hasSchoolSections) {
            rawData.push({
              id: 41,
              title: "School Sections",
              icon: "Layers",
              path: "/configuration/school-sections",
              parentId: generalMastersId,
              sortOrder: 9,
              roleIds: adminRoles
            });
          } else {
            // Correct parentId if mismatch (e.g. from table seeding with parentId 45 instead of 17)
            const schoolSecItem = rawData.find((item: any) => 
              item.title === "School Sections" || 
              (item.path && item.path.includes("/school-sections"))
            );
            if (schoolSecItem && Number(schoolSecItem.parentId) !== generalMastersId) {
              schoolSecItem.parentId = generalMastersId;
            }
          }

          // 4. Ensure Shift Timetable (ID 42) is present under General Masters
          const hasShiftsNav = rawData.some((item: any) => 
            item.title === "Shift Timetable" || 
            (item.path && item.path.includes("/shifts"))
          );
          if (!hasShiftsNav) {
            rawData.push({
              id: 42,
              title: "Shift Timetable",
              icon: "Clock",
              path: "/configuration/shifts",
              parentId: generalMastersId,
              sortOrder: 10,
              roleIds: adminRoles
            });
          } else {
            const shiftsNavItem = rawData.find((item: any) => 
              item.title === "Shift Timetable" || 
              (item.path && item.path.includes("/shifts"))
            );
            if (shiftsNavItem && Number(shiftsNavItem.parentId) !== generalMastersId) {
              shiftsNavItem.parentId = generalMastersId;
            }
          }

          // 5. Ensure Category Master (ID 43) is present under General Masters
          const hasCategories = rawData.some((item: any) => 
            item.title === "Category Master" || 
            (item.path && item.path.includes("/categories"))
          );
          if (!hasCategories) {
            rawData.push({
              id: 43,
              title: "Category Master",
              icon: "LayoutGrid",
              path: "/configuration/categories",
              parentId: generalMastersId,
              sortOrder: 11,
              roleIds: adminRoles
            });
          }

          // 6. Ensure Session Master (ID 44) is present under General Masters
          const hasSessions = rawData.some((item: any) => 
            item.title === "Session Master" || 
            (item.path && item.path.includes("/sessions"))
          );
          if (!hasSessions) {
            rawData.push({
              id: 44,
              title: "Session Master",
              icon: "Clock",
              path: "/configuration/sessions",
              parentId: generalMastersId,
              sortOrder: 12,
              roleIds: adminRoles
            });
          }

          // 7. Ensure Batch Master (ID 45) is present under General Masters
          const hasBatches = rawData.some((item: any) => 
            item.title === "Batch Master" || 
            (item.path && item.path.includes("/batches"))
          );
          if (!hasBatches) {
            rawData.push({
              id: 45,
              title: "Batch Master",
              icon: "Users",
              path: "/configuration/batches",
              parentId: generalMastersId,
              sortOrder: 13,
              roleIds: adminRoles
            });
          }

          // 8. Ensure Exam Type Master (ID 46) is present under General Masters
          const hasExamTypes = rawData.some((item: any) => 
            item.title === "Exam Type Master" || 
            (item.path && item.path.includes("/exam-types"))
          );
          if (!hasExamTypes) {
            rawData.push({
              id: 46,
              title: "Exam Type Master",
              icon: "Award",
              path: "/configuration/exam-types",
              parentId: generalMastersId,
              sortOrder: 14,
              roleIds: adminRoles
            });
          }

          // 9. Ensure Designation Master (ID 47) is present under General Masters
          const hasDesignations = rawData.some((item: any) => 
            item.title === "Designation Master" || 
            (item.path && item.path.includes("/designations"))
          );
          if (!hasDesignations) {
            rawData.push({
              id: 47,
              title: "Designation Master",
              icon: "Briefcase",
              path: "/configuration/designations",
              parentId: generalMastersId,
              sortOrder: 15,
              roleIds: adminRoles
            });
          }

          // 10. Ensure Occupation Master (ID 48) is present under General Masters
          const hasOccupations = rawData.some((item: any) => 
            item.title === "Occupation Master" || 
            (item.path && item.path.includes("/occupations"))
          );
          if (!hasOccupations) {
            rawData.push({
              id: 48,
              title: "Occupation Master",
              icon: "Hammer",
              path: "/configuration/occupations",
              parentId: generalMastersId,
              sortOrder: 16,
              roleIds: adminRoles
            });
          }

          // 11. Ensure Staff Initials (ID 49) is present under General Masters
          const hasStaffInitials = rawData.some((item: any) => 
            item.title === "Staff Initials" || 
            (item.path && item.path.includes("/staff-initials"))
          );
          if (!hasStaffInitials) {
            rawData.push({
              id: 49,
              title: "Staff Initials",
              icon: "UserRound",
              path: "/configuration/staff-initials",
              parentId: generalMastersId,
              sortOrder: 17,
              roleIds: adminRoles
            });
          }

          // 12. Ensure Weekday Master (ID 50) is present under General Masters
          const hasWeekdays = rawData.some((item: any) => 
            item.title === "Weekday Master" || 
            (item.path && item.path.includes("/weekdays"))
          );
          if (!hasWeekdays) {
            rawData.push({
              id: 50,
              title: "Weekday Master",
              icon: "Calendar",
              path: "/configuration/weekdays",
              parentId: generalMastersId,
              sortOrder: 18,
              roleIds: adminRoles
            });
          } else {
            // Correct parentId if mismatch or external DB set it to null/something else
            const weekdaysItem = rawData.find((item: any) => 
              item.title === "Weekday Master" || 
              (item.path && item.path.includes("/weekdays"))
            );
            if (weekdaysItem && Number(weekdaysItem.parentId) !== generalMastersId) {
              weekdaysItem.parentId = generalMastersId;
            }
          }

          // 13. Ensure Holiday Master (ID 51) is present under General Masters
          const hasHolidays = rawData.some((item: any) => 
            item.title === "Holiday Master" || 
            (item.path && item.path.includes("/holidays"))
          );
          if (!hasHolidays) {
            rawData.push({
              id: 51,
              title: "Holiday Master",
              icon: "CalendarCheck",
              path: "/configuration/holidays",
              parentId: generalMastersId,
              sortOrder: 19,
              roleIds: adminRoles
            });
          } else {
            // Correct parentId if mismatch or external DB set it to null/something else
            const holidaysItem = rawData.find((item: any) => 
              item.title === "Holiday Master" || 
              (item.path && item.path.includes("/holidays"))
            );
            if (holidaysItem && Number(holidaysItem.parentId) !== generalMastersId) {
              holidaysItem.parentId = generalMastersId;
            }
          }

          // 14. Ensure Attendance Statuses (ID 52) is present under General Masters
          const hasAttendanceStatuses = rawData.some((item: any) => 
            item.title === "Attendance Statuses" || 
            (item.path && item.path.includes("/attendance-statuses"))
          );
          if (!hasAttendanceStatuses) {
            rawData.push({
              id: 52,
              title: "Attendance Statuses",
              icon: "CalendarCheck",
              path: "/configuration/attendance-statuses",
              parentId: generalMastersId,
              sortOrder: 20,
              roleIds: adminRoles
            });
          } else {
            // Correct parentId if mismatch or external DB set it to null/something else
            const attendanceStatusesItem = rawData.find((item: any) => 
              item.title === "Attendance Statuses" || 
              (item.path && item.path.includes("/attendance-statuses"))
            );
            if (attendanceStatusesItem && Number(attendanceStatusesItem.parentId) !== generalMastersId) {
              attendanceStatusesItem.parentId = generalMastersId;
            }
          }
        }

        // 1. Map to consistent NavItem format and normalize values
        const flatItems: NavItem[] = rawData.map((item: any) => {
          let roleIds: number[] = [];
          if (Array.isArray(item.roleIds)) {
            roleIds = item.roleIds.map(Number);
          } else if (item.navigationRoles && Array.isArray(item.navigationRoles)) {
            roleIds = item.navigationRoles.map((nr: any) => Number(nr.roleId)).filter(Boolean);
          } else {
            // Default: All roles can see if no specific roles defined
            roleIds = [0];
          }

          return {
            id: Number(item.id),
            title: item.title,
            icon: item.icon,
            path: item.path || "#",
            parentId: item.parentId ? Number(item.parentId) : null,
            sortOrder: Number(item.sortOrder || 0),
            roleIds
          };
        });

        // 2. Filter by roleId
        // SuperAdmin (ID: 1) bypasses filtering to see everything
        const roleFiltered = currentRoleId === 1 
          ? flatItems 
          : flatItems.filter(item => 
              item.roleIds.includes(currentRoleId) || 
              item.roleIds.includes(0)
            );

        // 3. Recursive hierarchy builder
        const buildMenu = (pId: number | null): NavItem[] => {
          return roleFiltered
            .filter(item => item.parentId === pId)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(item => ({
              ...item,
              subItems: buildMenu(item.id)
            }));
        };

        const hierarchicalMenu = buildMenu(null);
        setMenuItems(hierarchicalMenu);

      } catch (error) {
        console.error("Failed to fetch navigation:", error);
        // On error, show minimal safety fallback
        setMenuItems([
          { id: 1, title: "Dashboard", icon: "LayoutDashboard", path: "/", parentId: null, sortOrder: 1, roleIds: [1, 2, 3, 4, 5] },
          { id: 11, title: "Masters & Config", icon: "Database", path: "/configuration", parentId: null, sortOrder: 2, roleIds: [1, 2] }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNavigation();
  }, [user.roleId]);

  // Sync expanded items when path changes - Accordion behavior for navigation
  useEffect(() => {
    if (menuItems.length > 0) {
      const getActiveParents = (items: NavItem[], path: string): number[] => {
        for (const item of items) {
          // Check if this item is a parent of the active path
          if (item.subItems && item.subItems.length > 0) {
            const hasChildMatch = (sub: NavItem): boolean => {
              if (sub.path !== "#" && sub.path !== "/" && path.startsWith(sub.path)) return true;
              if (sub.subItems) return sub.subItems.some(hasChildMatch);
              return false;
            };

            if (hasChildMatch(item)) {
              return [item.id, ...getActiveParents(item.subItems, path)];
            }
          }
        }
        return [];
      };

      const activeParents = getActiveParents(menuItems, location.pathname);
      
      // If we found active parents, we update the expanded state.
      // To enforce accordion, we can replace the expanded state with the active branch.
      // But we only want to do this if the path has actually changed to a new branch.
      if (activeParents.length > 0) {
        setExpandedItems(activeParents);
      }
    }
  }, [location.pathname, menuItems]);

  const toggleExpand = (id: number, pId: number | null) => {
    // If sidebar is collapsed, expand it first so the sub-items are visible
    if (isCollapsed) {
      setIsCollapsed(false);
    }

    setExpandedItems(prev => {
      // If already expanded, just collapse it
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }

      // Accordion logic: Find all items at the same level (sharing the same parent)
      // and remove them from the expanded state before adding the new ID.
      const findSiblings = (items: NavItem[]): number[] => {
        // Try to find if the pId parent exists in this list
        const itemsAtLevel = items.filter(item => item.parentId === pId);
        if (itemsAtLevel.length > 0) {
          return itemsAtLevel.map(i => i.id);
        }
        
        // If not found, search in subItems
        for (const item of items) {
          if (item.subItems && item.subItems.length > 0) {
            const result = findSiblings(item.subItems);
            if (result.length > 0) return result;
          }
        }
        return [];
      };

      const siblingIds = findSiblings(menuItems);
      const filtered = prev.filter(itemId => !siblingIds.includes(itemId));
      return [...filtered, id];
    });
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.path !== "#" && item.path !== "/" && location.pathname.startsWith(item.path)) return true;
    if (item.subItems) {
      return item.subItems.some(sub => isItemActive(sub));
    }
    return false;
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isActive = location.pathname === item.path;
    const isParentActive = isItemActive(item);
    const isExpanded = expandedItems.includes(item.id);
    const Icon = getIcon(item.icon);

    return (
      <div key={item.id} className="space-y-1">
        <SimpleTooltip content={isCollapsed && level === 0 ? item.title : ""} side="right" nativeButton={false}>
          <div className="w-full">
            {hasSubItems ? (
              <button
                onClick={() => toggleExpand(item.id, item.parentId)}
                className={cn(
                  "w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 relative group h-12 text-left",
                  isParentActive 
                    ? "bg-white/10 text-white shadow-sm shadow-black/20" 
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5",
                  isCollapsed && level === 0 && "justify-center px-0",
                  level > 0 && "px-3 h-10"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center shrink-0 transition-all duration-300",
                  isParentActive ? "text-blue-400 scale-110" : "group-hover:scale-110",
                  isCollapsed && level === 0 && "w-full"
                )}>
                  {Icon ? (
                    <Icon size={level === 0 ? 22 : 18} strokeWidth={isParentActive ? 2.5 : 2} />
                  ) : (
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      isParentActive ? "bg-blue-400 scale-125 shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "bg-slate-700"
                    )} />
                  )}
                </div>
                
                {!isCollapsed && (
                  <>
                    <span className={cn(
                      "ml-4 font-bold whitespace-nowrap overflow-hidden tracking-tight flex-1 transition-colors duration-300",
                      level === 0 ? "text-sm" : "text-xs",
                      isParentActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    )}>
                      {item.title}
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn("transition-colors", isParentActive ? "text-blue-400" : "text-slate-600")}
                    >
                      <ChevronRight size={14} strokeWidth={3} />
                    </motion.div>
                  </>
                )}
              </button>
            ) : (
              <Link
                to={item.path}
                onClick={() => {
                  if (isCollapsed) setIsCollapsed(false);
                }}
                className={cn(
                  "flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 relative group h-12",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5",
                  isCollapsed && level === 0 && "justify-center px-0",
                  level > 0 && "px-3 h-10"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center shrink-0 transition-all duration-300",
                  isActive ? "text-white scale-110" : "group-hover:scale-110",
                  isCollapsed && level === 0 && "w-full"
                )}>
                  {Icon ? (
                    <Icon size={level === 0 ? 22 : 18} strokeWidth={isActive ? 2.5 : 2} />
                  ) : (
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      isActive ? "bg-blue-400 scale-125 shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "bg-slate-700"
                    )} />
                  )}
                </div>
                
                {!isCollapsed && (
                  <span className={cn(
                    "ml-4 font-bold whitespace-nowrap overflow-hidden tracking-tight",
                    level === 0 ? "text-sm" : "text-xs",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  )}>
                    {item.title}
                  </span>
                )}
              </Link>
            )}
          </div>
        </SimpleTooltip>

        <AnimatePresence initial={false}>
          {hasSubItems && isExpanded && !isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={cn(
                "overflow-hidden space-y-1 relative",
                level === 0 ? "ml-9 pl-4 border-l border-white/5 mt-1" : "ml-4 pl-3 border-l border-white/5 mt-1"
              )}
            >
              {Array.isArray(item.subItems) && item.subItems.map((subItem) => renderNavItem(subItem, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const sidebarVariants = {
    expanded: { width: 288 }, // Width increased to 72 (288px)
    collapsed: { width: 80 }
  };

  const textVariants = {
    hidden: { 
      opacity: 0, 
      width: 0,
      marginLeft: 0,
      transition: { duration: 0.2 } 
    },
    visible: { 
      opacity: 1, 
      width: "auto",
      marginLeft: 16,
      transition: { duration: 0.3 } 
    }
  };

  return (
    <motion.div 
      initial={false}
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "bg-slate-950 text-white h-full flex flex-col relative z-50 border-r border-slate-800/50 shadow-2xl transition-all duration-300",
        // Mobile styles
        "fixed lg:relative inset-y-0 left-0 transform",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className={cn(
        "p-6 flex flex-col items-center relative min-h-[140px] justify-center transition-all duration-300",
        isCollapsed ? "px-2" : "p-6"
      )}>
        {/* Mobile close button */}
        {isMobileOpen && (
          <button 
            onClick={onCloseMobile}
            className="lg:hidden absolute right-4 top-4 text-slate-400 hover:text-white"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <SimpleTooltip content={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"} side="right" nativeButton={true}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-10 bg-blue-600 text-white rounded-full p-1.5 shadow-xl hover:bg-blue-500 transition-all z-50 border-2 border-slate-950 scale-100 hover:scale-110 active:scale-95 hidden lg:block"
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
          </button>
        </SimpleTooltip>

        <div className="flex items-center justify-center mb-4 min-h-[48px] w-full px-2">
          <Logo isCollapsed={isCollapsed} size="md" />
        </div>
        
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex flex-col items-center"
            >
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] text-center">
                {user.role}
              </p>
              <div className="h-0.5 w-8 bg-blue-600/30 rounded-full mt-2" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-visible custom-scrollbar scrollbar-hide">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-20 space-y-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          Array.isArray(menuItems) && menuItems.map((item) => renderNavItem(item))
        )}
      </nav>

      <div className={cn(
        "p-3 border-t border-slate-800/50 space-y-1.5",
        isCollapsed && "px-3"
      )}>
        <SimpleTooltip content={isCollapsed ? "Settings" : ""} side="right" nativeButton={false}>
          <Link 
            to="/settings"
            className={cn(
              "w-full flex items-center px-3 py-2.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-xl transition-all group relative h-11",
              location.pathname === "/settings" && "bg-blue-600/10 text-blue-400",
              isCollapsed && "justify-center"
            )}
          >
            {location.pathname === "/settings" && (
              <motion.div 
                layoutId="active-nav-bottom"
                className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
              />
            )}
            <div className="flex items-center justify-center shrink-0 group-hover:rotate-45 transition-transform duration-300">
              <Settings size={20} />
            </div>
            {!isCollapsed && (
              <span className={cn(
                "ml-3 font-semibold text-sm tracking-tight",
                location.pathname === "/settings" ? "text-slate-100" : "text-slate-400"
              )}>Settings</span>
            )}
          </Link>
        </SimpleTooltip>
        
        <SimpleTooltip content={isCollapsed ? "Logout" : ""} side="right" nativeButton={true}>
          <button 
            onClick={onLogout}
            className={cn(
              "w-full flex items-center px-3 py-2.5 text-red-400/80 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all group relative h-11",
              isCollapsed && "justify-center"
            )}
          >
            <div className="flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
              <LogOut size={20} />
            </div>
            {!isCollapsed && (
              <span className="ml-3 font-semibold text-sm tracking-tight text-red-400/80">Logout</span>
            )}
          </button>
        </SimpleTooltip>
      </div>
    </motion.div>
  );
}
