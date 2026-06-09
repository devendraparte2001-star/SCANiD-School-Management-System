import express from "express";
// Import cors middleware for cross-origin requests
import cors from "cors";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import path from "path";
import http from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import fs from "fs";
import multer from "multer";

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  // Enforce port 3000 for standard environment routing
  const PORT = 3000;

  app.use(cors());

  app.use(express.json());

  // Rewrite /SCANiD_ERP_API/api/ to /api/ internally so that in-memory mock routes can handle them
  app.use((req, res, next) => {
    if (req.url.startsWith('/SCANiD_ERP_API/api')) {
      req.url = req.url.replace('/SCANiD_ERP_API/api', '/api');
    } else if (req.url.startsWith('/SCANiD_ERP_API/uploads')) {
      req.url = req.url.replace('/SCANiD_ERP_API/uploads', '/uploads');
    } else if (req.url.startsWith('/SCANiD_ERP_API/photos')) {
      req.url = req.url.replace('/SCANiD_ERP_API/photos', '/photos');
    } else if (req.url.startsWith('/SCANiD_ERP_API')) {
      req.url = req.url.replace('/SCANiD_ERP_API', '');
    }
    next();
  });

  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Keep track of the real .NET backend online status via periodic health checks
  let isBackendOnline = false;
  function checkBackendHealth() {
    const req = http.get("http://127.0.0.1:5000/api/health", (res) => {
      isBackendOnline = res.statusCode === 200;
      req.destroy();
    });
    req.on("error", () => {
      isBackendOnline = false;
    });
    req.setTimeout(1000, () => {
      isBackendOnline = false;
      req.destroy();
    });
  }
  checkBackendHealth();
  // Probe the .NET backend API every 5 seconds
  setInterval(checkBackendHealth, 5000);

  // Dynamic route redirection middleware: Proxy to the real .NET API if it is running,
  // else fall back to the in-memory mock handlers registered below. This ensures seamless
  // transitions between mocked offline state and active live DB workflows.
  let apiProxyInstance: any = null;
  app.use((req, res, next) => {
    if (isBackendOnline && apiProxyInstance && (req.url.startsWith('/api') || req.url.startsWith('/uploads') || req.url.startsWith('/photos') || req.url.startsWith('/SCANiD_ERP_API'))) {
      return apiProxyInstance(req, res, next);
    }
    next();
  });

  const dbPath = path.join(process.cwd(), "database", "db.json");
  const backendWwwRoot = path.join(process.cwd(), 'backend', 'ScanID.Api', 'wwwroot');
  const uploadsDir = path.join(backendWwwRoot, 'uploads');
  const photosDir = path.join(backendWwwRoot, 'photos');

  // Create folders dynamically if they do not exist
  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
  }

  // Multer Storage Configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".png";
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + ext);
    }
  });
  const upload = multer({ storage });

  let dbData: any = {};
  if (fs.existsSync(dbPath)) {
    try {
      dbData = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    } catch (e) {
      console.error("Error loading db.json, using defaults", e);
    }
  }

  // Mock data arrays for basic management (persisted dynamically in db.json)
  let schools = dbData.schools || [
    { id: 1, name: "SCANiD PRIMARY SCHOOL", code: "SPS001", address: "MUMBAI, MAHARASHTRA", email: "pri@scanid.com", phone: "9876543210", totalStudents: 450, status: "Active" },
    { id: 2, name: "SCANiD SECONDARY HIGH SCHOOL", code: "SSHS002", address: "PUNE, MAHARASHTRA", email: "sec@scanid.com", phone: "9876543211", totalStudents: 620, status: "Active" }
  ];

  let teachers = dbData.teachers || [
    { 
      id: 1, 
      userId: 3, 
      schoolId: 1, 
      employeeId: "EMP001", 
      department: "Mathematics",
      qualification: "MA B.Ed",
      experience: "5+ Years",
      subject: "Mathematics",
      standardId: 1,
      sectionId: 1,
      contactNumber: "9876543210",
      status: "Active",
      user: { id: 3, fullName: "Primary Teacher 01", email: "teacher01@scanid.com" } 
    }
  ];

  let students: any[] = dbData.students || [
    { 
      id: 1, 
      grNo: "REG1001", 
      registrationNumber: "REG1001",
      fullName: "SHIVANSH SANJAY KHOPKAR", 
      firstName: "SHIVANSH",
      middleName: "SANJAY",
      lastName: "KHOPKAR",
      dateOfBirth: "2020-04-27",
      standard: "1st", 
      section: "A", 
      rollNumber: 1, 
      gender: "Male",
      schoolId: 1,
      academicYearId: 2,
      academicyear: "2",
      standardId: 1,
      sectionId: 1,
      attendance: "95%",
      performance: "Excellent",
      fatherContactNo: "9823674019",
      motherName: "SANJANA",
      motherContactNo: "9823674020",
      sms: true,
      isStateBoard: true,
      address: "Lane 4, Pune",
      rfid: "RF-101",
      aadharCard: "123412341234",
      uniformId: "UNIFORM-101"
    },
    { 
      id: 2, 
      grNo: "REG1002", 
      registrationNumber: "REG1002",
      fullName: "AAVYA AMIT PATIL", 
      firstName: "AAVYA",
      middleName: "AMIT",
      lastName: "PATIL",
      dateOfBirth: "2020-08-20",
      standard: "1st", 
      section: "A", 
      rollNumber: 2, 
      gender: "Female",
      schoolId: 1,
      academicYearId: 2,
      academicyear: "2",
      standardId: 1,
      sectionId: 1,
      attendance: "92%",
      performance: "Good",
      fatherContactNo: "8888941563",
      motherName: "AMITA PATIL",
      motherContactNo: "8888941564",
      sms: false,
      isStateBoard: false,
      address: "Shivaji Nagar, Mumbai",
      rfid: "RF-102",
      aadharCard: "123412341235",
      uniformId: "UNIFORM-102"
    },
    { 
      id: 3, 
      grNo: "REG/2024/003", 
      registrationNumber: "REG/2024/003",
      fullName: "LIAM WILSON", 
      firstName: "LIAM",
      middleName: "",
      lastName: "WILSON",
      dateOfBirth: "2019-01-15",
      standard: "2nd", 
      section: "A", 
      rollNumber: 3, 
      gender: "Male",
      schoolId: 1,
      academicYearId: 2,
      academicyear: "2",
      standardId: 2,
      sectionId: 1,
      attendance: "88%",
      performance: "Average",
      fatherContactNo: "9999999999",
      motherName: "SARAH WILSON",
      motherContactNo: "9999999998",
      sms: true,
      isStateBoard: true,
      address: "123 Park Avenue, New York",
      rfid: "RF-103",
      aadharCard: "123412341236",
      uniformId: "UNIFORM-103"
    },
    { 
      id: 4, 
      grNo: "REG/2024/004", 
      registrationNumber: "REG/2024/004",
      fullName: "RAJESH PATEL", 
      firstName: "RAJESH",
      middleName: "",
      lastName: "PATEL",
      dateOfBirth: "2020-02-10",
      standard: "1st", 
      section: "A", 
      rollNumber: 4, 
      gender: "Male",
      schoolId: 1,
      academicYearId: 2,
      academicyear: "2",
      standardId: 1,
      sectionId: 1,
      attendance: "90%",
      performance: "Good",
      fatherContactNo: "8888888888",
      motherName: "MEENA PATEL",
      motherContactNo: "8888888889",
      sms: false,
      isStateBoard: true,
      address: "Main Sector 5, Ahmedabad",
      rfid: "RF-104",
      aadharCard: "123412341237",
      uniformId: "UNIFORM-104"
    }
  ];

  let auditLogs = [
    { id: 1, userId: "1", type: "Update", tableName: "Students", dateTime: new Date().toISOString(), primaryKey: "1", schoolId: 1, academicYearId: 2 },
    { id: 2, userId: "1", type: "Create", tableName: "Attendance", dateTime: new Date().toISOString(), primaryKey: "50", schoolId: 1, academicYearId: 2 },
    { id: 3, userId: "2", type: "Update", tableName: "Staff", dateTime: new Date(Date.now() - 400000).toISOString(), primaryKey: "12", schoolId: 1, academicYearId: 1 },
    { id: 4, userId: "3", type: "Create", tableName: "Holidays", dateTime: new Date(Date.now() - 800000).toISOString(), primaryKey: "1", schoolId: 2, academicYearId: 2 }
  ];

  let errorLogs: any[] = [
    { id: 1, message: "Database connection timeout", level: "Error", timestamp: new Date(Date.now() - 7200000).toISOString(), exception: "SqlException", properties: "Path: /api/students", schoolId: 1, academicYearId: 2 },
    { id: 2, message: "Invalid session", level: "Warning", timestamp: new Date(Date.now() - 3600000).toISOString(), exception: null, properties: "User: 5", schoolId: 1, academicYearId: 1 },
    { id: 3, message: "Constraint violation on RFID duplicate entry", level: "Critical", timestamp: new Date(Date.now() - 10000000).toISOString(), exception: "ConstraintException", properties: "Path: /api/students", schoolId: 2, academicYearId: 2 }
  ];
  
  // Master Data Mock Arrays
  let standards = dbData.standards || [{ id: 1, name: "1st" }, { id: 2, name: "2nd" }, { id: 3, name: "3rd" }, { id: 4, name: "4th" }, { id: 5, name: "5th" }, { id: 6, name: "LKG" }, { id: 7, name: "UKG" }];
  let sections = dbData.sections || [{ id: 1, name: "A" }, { id: 2, name: "B" }, { id: 3, name: "C" }];
  let academicYears = dbData.academicYears || [{ id: 1, name: "2024-2025", isCurrent: false }, { id: 2, name: "2025-2026", isCurrent: true }];
  let castes = dbData.castes || [{ id: 1, name: "OPEN" }, { id: 2, name: "OBC" }, { id: 3, name: "SC" }, { id: 4, name: "ST" }];
  let subCastes = dbData.subCastes || [{ id: 1, casteId: 2, name: "General" }, { id: 2, casteId: 2, name: "Kunbi" }];
  let religions = dbData.religions || [{ id: 1, name: "HINDU" }, { id: 2, name: "MUSLIM" }, { id: 3, name: "CHRISTIAN" }, { id: 4, name: "SIKH" }];
  let states = dbData.states || [{ id: 1, name: "Maharashtra" }];
  let cities = dbData.cities || [{ id: 1, stateId: 1, name: "Mumbai" }];
  let bloodGroups = dbData.bloodGroups || [{ id: 1, name: "A+" }, { id: 2, name: "B+" }, { id: 3, name: "O+" }, { id: 4, name: "AB+" }];
  let houses = dbData.houses || [{ id: 1, name: "RED", color: "#EF4444" }, { id: 2, name: "BLUE", color: "#3B82F6" }, { id: 3, name: "GREEN", color: "#10B981" }, { id: 4, name: "YELLOW", color: "#F59E0B" }];
  let admissionTypes = dbData.admissionTypes || [{ id: 1, name: "REGULAR" }, { id: 2, name: "RTE" }, { id: 3, name: "STAFF CHILD" }];
  let categories = dbData.categories || [{ id: 1, name: "General" }];
  let sessions = dbData.sessions || [{ id: 1, name: "Morning" }];
  let batches = dbData.batches || [{ id: 1, name: "Batch A" }];
  let shifts = dbData.shifts || [{ id: 1, name: "MORNING" }, { id: 2, name: "AFTERNOON" }];
  let subjects = dbData.subjects || [
    { id: 1, name: "Mathematics", schoolId: 1, academicYearId: 2, standardId: 1, StandardId: 1 },
    { id: 2, name: "Science", schoolId: 1, academicYearId: 2, standardId: 2, StandardId: 2 }
  ];
  let examTypes = dbData.examTypes || [{ id: 1, name: "Mid-Term" }, { id: 2, name: "Final" }];
  let designations = dbData.designations || [{ id: 1, name: "Principal" }, { id: 2, name: "Teacher" }];
  let occupations = dbData.occupations || [{ id: 1, name: "Service" }, { id: 2, name: "Business" }];
  let schoolSections = dbData.schoolSections || [{ id: 1, name: "Primary" }, { id: 2, name: "Secondary" }, { id: 3, name: "Higher Secondary" }];
  let staffInitials = dbData.staffInitials || [{ id: 1, name: "Mr." }, { id: 2, name: "Mrs." }, { id: 3, name: "Dr." }, { id: 4, name: "Ms." }];
  let roles = dbData.roles || [{ id: 1, name: "superadmin" }, { id: 2, name: "admin" }, { id: 3, name: "teacher" }];
  let weekdays = dbData.weekdays || [
    { id: 1, name: "Monday", isActive: true },
    { id: 2, name: "Tuesday", isActive: true },
    { id: 3, name: "Wednesday", isActive: true },
    { id: 4, name: "Thursday", isActive: true },
    { id: 5, name: "Friday", isActive: true },
    { id: 6, name: "Saturday", isActive: false },
    { id: 7, name: "Sunday", isActive: false }
  ];
  let holidays = dbData.holidays || [
    { id: 1, name: "Independence Day", fromDate: "2026-08-15", toDate: "2026-08-15", description: "National Holiday", schoolId: 1, academicYearId: 2, isActive: true },
    { id: 2, name: "Christmas", fromDate: "2026-12-25", toDate: "2026-12-25", description: "Winter Holiday", schoolId: 1, academicYearId: 2, isActive: true }
  ];

  let attendance = dbData.attendance || [
    { id: 1, studentId: 1, date: new Date().toISOString().split('T')[0], status: "Present" },
    { id: 2, studentId: 2, date: new Date().toISOString().split('T')[0], status: "Absent" }
  ];

  let notifications = dbData.notifications || [
    { id: 1, title: "System Update", message: "New academic module is live.", type: "info", isRead: false, createdAt: new Date().toISOString() },
    { id: 2, title: "Fee Reminder", message: "Late fee applies after 30th May.", type: "warning", isRead: true, createdAt: new Date().toISOString() }
  ];

  let messages = dbData.messages || [
    { id: 1, senderId: 1, receiverId: 2, subject: "Meeting Invitation", content: "Let's discuss the new curriculum.", isRead: false, type: "Direct", createdAt: new Date().toISOString() },
    { id: 2, senderId: 2, receiverId: 1, subject: "Re: Meeting Invitation", content: "Sure, let's meet tomorrow.", isRead: true, type: "Direct", createdAt: new Date().toISOString() }
  ];

  let navigationItems = dbData.navigationItems || [
    // IDs: SuperAdmin=1, Admin=2, Teacher=3, Student=4, Parent=5, All=0
    // Root level items
    { id: 1, title: "Dashboard", icon: "LayoutDashboard", path: "/", parentId: null, sortOrder: 1, roleIds: [1, 2, 3, 4, 5] },
    
    // Academic Operations Group (2)
    { id: 2, title: "Academic Operations", icon: "BookOpen", path: null, parentId: null, sortOrder: 2, roleIds: [1, 2, 3, 4, 5] },
    { id: 3, title: "Student Registry", icon: "GraduationCap", path: "/students", parentId: 2, sortOrder: 1, roleIds: [1, 2, 3, 5] },
    { id: 4, title: "Attendance Tracking", icon: "CalendarCheck", path: "/attendance", parentId: 2, sortOrder: 2, roleIds: [1, 2, 3, 4, 5] },
    { id: 5, title: "Examination & Marks", icon: "BarChart3", path: "/marks", parentId: 2, sortOrder: 3, roleIds: [1, 2, 3, 4, 5] },
    
    // Staff & HR Group (6)
    { id: 6, title: "Staff & HR", icon: "Users", path: null, parentId: null, sortOrder: 3, roleIds: [1, 2] },
    { id: 7, title: "Staff Directory", icon: "UserCheck", path: "/staff", parentId: 6, sortOrder: 1, roleIds: [1, 2] },
    { id: 24, title: "Manage Users", icon: "UserPlus", path: "/configuration/users", parentId: 6, sortOrder: 2, roleIds: [1, 2] },
    
    // Administrative Group (8)
    { id: 8, title: "Administrative", icon: "ShieldCheck", path: null, parentId: null, sortOrder: 4, roleIds: [1, 2, 3, 4, 5] },
    { id: 9, title: "Fee Management", icon: "CreditCard", path: "/fees", parentId: 8, sortOrder: 1, roleIds: [1, 2, 5] },
    { id: 10, title: "Communication Hub", icon: "MessageSquare", path: "/messages", parentId: 8, sortOrder: 2, roleIds: [1, 2, 3, 4, 5] },
    
    // Masters & Config Group (11)
    { id: 11, title: "Masters & Config", icon: "Database", path: "/configuration", parentId: null, sortOrder: 5, roleIds: [1, 2] },
    { id: 12, title: "Global Schools", icon: "School", path: "/configuration/schools", parentId: 11, sortOrder: 1, roleIds: [1, 2] },
    
    // RBAC Sub-group (13)
    { id: 13, title: "Access Control (RBAC)", icon: "Key", path: null, parentId: 11, sortOrder: 2, roleIds: [1, 2] },
    { id: 14, title: "Role Master", icon: "Shield", path: "/configuration/role-master", parentId: 13, sortOrder: 1, roleIds: [1, 2] },
    { id: 15, title: "User Accounts", icon: "UserCheck", path: "/configuration/role-assignment", parentId: 13, sortOrder: 2, roleIds: [1, 2] },
    
    // Menu Designer Sub-group (16)
    { id: 16, title: "Menu Designer", icon: "Layout", path: null, parentId: 11, sortOrder: 3, roleIds: [1, 2] },
    { id: 17, title: "Navigation Builder", icon: "LayoutGrid", path: "/configuration/navigation", parentId: 16, sortOrder: 1, roleIds: [1, 2] },
    
    // Academic Masters Sub-group (18)
    { id: 18, title: "Academic Masters", icon: "BookOpen", path: null, parentId: 11, sortOrder: 4, roleIds: [1, 2] },
    { id: 19, title: "Standards & Grades", icon: "Layers", path: "/configuration/standards", parentId: 18, sortOrder: 1, roleIds: [1, 2] },
    { id: 20, title: "Divisions/Sections", icon: "Hash", path: "/configuration/sections", parentId: 18, sortOrder: 2, roleIds: [1, 2] },
    { id: 21, title: "Academic Years", icon: "Calendar", path: "/configuration/academic-years", parentId: 18, sortOrder: 3, roleIds: [1, 2] },
    { id: 22, title: "Subject Registry", icon: "BookOpen", path: "/configuration/subjects", parentId: 18, sortOrder: 4, roleIds: [1, 2] },
    
    // General Masters Sub-group (25)
    { id: 25, title: "General Masters", icon: "Database", path: null, parentId: 11, sortOrder: 5, roleIds: [1, 2] },
    { id: 26, title: "Religion Master", icon: "Heart", path: "/configuration/religions", parentId: 25, sortOrder: 1, roleIds: [1, 2] },
    { id: 27, title: "Blood Group Master", icon: "Droplets", path: "/configuration/blood-groups", parentId: 25, sortOrder: 2, roleIds: [1, 2] },
    { id: 28, title: "Caste Category", icon: "Users", path: "/configuration/castes", parentId: 25, sortOrder: 3, roleIds: [1, 2] },
    { id: 29, title: "Sub-Caste Master", icon: "UserCircle", path: "/configuration/sub-castes", parentId: 25, sortOrder: 4, roleIds: [1, 2] },
    { id: 30, title: "School House", icon: "Home", path: "/configuration/houses", parentId: 25, sortOrder: 5, roleIds: [1, 2] },
    { id: 31, title: "Admission Types", icon: "UserCheck", path: "/configuration/admission-types", parentId: 25, sortOrder: 6, roleIds: [1, 2] },
    { id: 32, title: "States Master", icon: "Map", path: "/configuration/states", parentId: 25, sortOrder: 7, roleIds: [1, 2] },
    { id: 33, title: "Cities Master", icon: "MapPin", path: "/configuration/cities", parentId: 25, sortOrder: 8, roleIds: [1, 2] },
    { id: 34, title: "School Sections", icon: "Layers", path: "/configuration/school-sections", parentId: 25, sortOrder: 9, roleIds: [1, 2] },
    { id: 35, title: "Shift Timetable", icon: "Clock", path: "/configuration/shifts", parentId: 25, sortOrder: 10, roleIds: [1, 2] },
    { id: 43, title: "Weekday Master", icon: "Calendar", path: "/configuration/weekdays", parentId: 25, sortOrder: 18, roleIds: [1, 2] },
    { id: 44, title: "Holiday Master", icon: "CalendarCheck", path: "/configuration/holidays", parentId: 25, sortOrder: 19, roleIds: [1, 2] },
 
    // System Audit (23)
    { id: 23, title: "System Audit", icon: "Terminal", path: "/system-logs", parentId: null, sortOrder: 6, roleIds: [1] },
  ];

  const mastersMap: Record<string, any[]> = {
    "academic-years": academicYears,
    "castes": castes,
    "sub-castes": subCastes,
    "religions": religions,
    "states": states,
    "cities": cities,
    "blood-groups": bloodGroups,
    "houses": houses,
    "admission-types": admissionTypes,
    "categories": categories,
    "sessions": sessions,
    "batches": batches,
    "shifts": shifts,
    "weekdays": weekdays,
    "holidays": holidays,
    "subjects": subjects,
    "exam-types": examTypes,
    "designations": designations,
    "occupations": occupations,
    "school-sections": schoolSections,
    "schoolSections": schoolSections,
    "schoolsections": schoolSections,
    "staff-initials": staffInitials,
    "staffinitials": staffInitials,
    "staffInitials": staffInitials,
    "roles": roles,
    "standards": standards,
    "sections": sections,
    // Add variations for different frontend names
    "standardsMaster": standards,
    "sectionsMaster": sections,
    "schools": schools,
    "academicyears": academicYears,
    "bloodgroups": bloodGroups,
    "subcastes": subCastes,
    "admissiontypes": admissionTypes
  };

  // Users
  let users = dbData.users || [
    { id: 1, fullName: "Global Admin", username: "superadmin", email: "admin@scanid.com", role: "superadmin", status: "Active" },
    { id: 2, fullName: "Teacher One", username: "teacher01", email: "teacher01@scanid.com", role: "teacher", status: "Active" }
  ];

  const saveDb = () => {
    try {
      const data = {
        schools,
        teachers,
        students,
        users,
        navigationItems,
        attendance,
        notifications,
        messages,
        standards,
        sections,
        academicYears,
        castes,
        subCastes,
        religions,
        states,
        cities,
        bloodGroups,
        houses,
        admissionTypes,
        categories,
        sessions,
        batches,
        shifts,
        weekdays,
        holidays,
        subjects,
        examTypes,
        designations,
        occupations,
        schoolSections,
        staffInitials,
        roles
      };
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
      console.error("Error saving to db.json", e);
    }
  };

  const applySortingAndPagination = (data: any[], query: any) => {
    let result = [...data];
    const { sortBy, sortOrder, page, pageSize, search } = query;

    // Apply Search if applicable (generic search)
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(val => 
          val && val.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply Sorting
    if (sortBy) {
      result.sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        
        if (valA === valB) return 0;
        
        let comparison = 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else {
          comparison = valA < valB ? -1 : 1;
        }
        
        return sortOrder === 'desc' ? comparison * -1 : comparison;
      });
    }

    // Apply Pagination
    const totalCount = result.length;
    const pageNum = parseInt(page as string) || 1;
    const size = parseInt(pageSize as string) || 10;
    
    const startIndex = (pageNum - 1) * size;
    const paginatedData = result.slice(startIndex, startIndex + size);

    return {
      data: paginatedData,
      pagination: {
        totalCount,
        page: pageNum,
        pageSize: size,
        totalPages: Math.ceil(totalCount / size)
      }
    };
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "SCANiD Dev Server is running." });
  });

  // Audit Logs
  app.get("/api/auditlogs", (req, res) => {
    let filtered = [...auditLogs];
    const { schoolId, academicYearId } = req.query;
    if (schoolId && schoolId !== "all") {
      filtered = filtered.filter(item => !item.schoolId || item.schoolId.toString() === schoolId.toString());
    }
    if (academicYearId) {
      filtered = filtered.filter(item => !item.academicYearId || item.academicYearId.toString() === academicYearId.toString());
    }
    res.json(applySortingAndPagination(filtered, req.query));
  });

  // Error Logs
  app.get("/api/errorlogs", (req, res) => {
    let filtered = [...errorLogs];
    const { schoolId, academicYearId } = req.query;
    if (schoolId && schoolId !== "all") {
      filtered = filtered.filter(item => !item.schoolId || item.schoolId.toString() === schoolId.toString());
    }
    if (academicYearId) {
      filtered = filtered.filter(item => !item.academicYearId || item.academicYearId.toString() === academicYearId.toString());
    }
    res.json(applySortingAndPagination(filtered, req.query));
  });
  app.get("/api/errorlogs/filesystem", (req, res) => {
    let filtered = [...errorLogs];
    const { schoolId, academicYearId } = req.query;
    if (schoolId && schoolId !== "all") {
      filtered = filtered.filter(item => !item.schoolId || item.schoolId.toString() === schoolId.toString());
    }
    if (academicYearId) {
      filtered = filtered.filter(item => !item.academicYearId || item.academicYearId.toString() === academicYearId.toString());
    }
    res.json(applySortingAndPagination(filtered, req.query));
  });
  app.delete("/api/errorlogs/clear", (req, res) => {
    errorLogs = [];
    res.status(204).send();
  });

  // Common Logs
  app.get("/api/applogs", (req, res) => res.json({ data: { content: "Log stream started...\n[INFO] SCANiD System Initialized\n[INFO] Connected to In-Memory DB\n[DEBUG] Vite Middleware Mounted" } }));
  app.get("/api/database/schema", (req, res) => res.json({ data: { schema: "Mock In-Memory DB", tables: Object.keys(mastersMap) } }));
  app.get("/api/database/script", (req, res) => res.json({ data: { content: "-- Mock SQL Server Schema --\nCREATE TABLE Students (\n  Id INT PRIMARY KEY IDENTITY,\n  GRNO NVARCHAR(50),\n  FullName NVARCHAR(200)\n);" } }));
  app.get("/api/database/seed", (req, res) => res.json({ data: { content: "-- Mock Seed Script --\nINSERT INTO Schools (Name) VALUES ('SCANiD PRIMARY');\nINSERT INTO Roles (Name) VALUES ('SuperAdmin');" } }));

  // Auth
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if ((username === "superadmin" && password === "Password123") || 
        (username === "admin" && password === "admin123")) {
      res.json({
        id: "1",
        name: username === "superadmin" ? "Global Admin" : "School Administrator",
        email: username === "superadmin" ? "admin@scanid.com" : "admin@scanid.com",
        role: username === "superadmin" ? "superadmin" : "admin",
        roleId: username === "superadmin" ? 1 : 2,
        schoolName: "SCANiD PRIMARY SCHOOL",
        schoolId: "1"
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  // Schools
  app.get("/api/schools", (req, res) => {
    res.json(applySortingAndPagination(schools, req.query));
  });
  app.post("/api/schools", (req, res) => {
    const newItem = { id: schools.length > 0 ? Math.max(...schools.map((s: any) => s.id)) + 1 : 1, ...req.body };
    schools.push(newItem);
    saveDb();
    res.status(201).json({ data: newItem });
  });

  app.put("/api/schools/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = schools.findIndex((s: any) => s.id === id);
    if (index !== -1) {
      schools[index] = { ...schools[index], ...req.body };
      saveDb();
      res.json({ data: schools[index] });
    } else {
      res.status(404).json({ message: "School not found" });
    }
  });

  app.delete("/api/schools/:id", (req, res) => {
    const id = parseInt(req.params.id);
    schools = schools.filter((s: any) => s.id !== id);
    saveDb();
    res.status(204).send();
  });

  // Students
  app.get("/api/students", (req, res) => {
    const schoolId = req.query.schoolId ? parseInt(req.query.schoolId as string) : null;
    const academicYearId = req.query.academicYearId ? parseInt(req.query.academicYearId as string) : null;
    const standardId = req.query.standardId ? parseInt(req.query.standardId as string) : null;
    const sectionId = req.query.sectionId ? parseInt(req.query.sectionId as string) : null;
    
    let filtered = [...students];
    if (schoolId) {
      filtered = filtered.filter(s => s.schoolId === schoolId);
    }
    if (academicYearId) {
      filtered = filtered.filter(s => s.academicYearId === academicYearId || s.academicyear === academicYearId.toString());
    }
    if (standardId) {
      filtered = filtered.filter(s => s.standardId === standardId || s.StandardId === standardId);
    }
    if (sectionId) {
      filtered = filtered.filter(s => s.sectionId === sectionId || s.SectionId === sectionId);
    }
    
    res.json(applySortingAndPagination(filtered, req.query));
  });

  app.post("/api/students", (req, res) => {
    const body = req.body;
    const schoolId = body.schoolId ? parseInt(body.schoolId) : null;
    const academicYearId = body.academicYearId ? parseInt(body.academicYearId) : null;
    const grNo = (body.grNo || body.GRNO || body.grno || body.registrationNumber || "").toString().trim().toLowerCase();
    const rfid = (body.rfid || body.RFID || "").toString().trim().toLowerCase().replace(/\s/g, "");
    const aadharCard = (body.aadharCard || body.aadharcard || "").toString().trim().toLowerCase().replace(/\s/g, "");
    const uniformId = (body.uniformId || body.uniformid || "").toString().trim().toLowerCase();

    if (grNo) {
      const exists = students.some(s => 
        s.schoolId === schoolId && 
        s.academicYearId === academicYearId && 
        (s.grNo || s.registrationNumber || "").toString().trim().toLowerCase() === grNo
      );
      if (exists) {
        return res.status(400).json({ message: `Student already exists with Registration Number/GrNo '${body.grNo || body.registrationNumber}' for the selected School and Academic Year.` });
      }
    }
    if (rfid) {
      if (rfid.length !== 10 && rfid.length !== 24) {
        return res.status(400).json({ message: `RFID must be exactly 10 or 24 alphanumeric characters.` });
      }
      if (!/^[a-zA-Z0-9]+$/.test(rfid)) {
        return res.status(400).json({ message: `RFID must be alphanumeric.` });
      }
      const exists = students.some(s => 
        s.schoolId === schoolId && 
        (s.rfid || s.RFID || "").toString().trim().toLowerCase().replace(/\s/g, "") === rfid
      );
      if (exists) {
        return res.status(400).json({ message: `Student with RFID '${body.rfid}' already exists in this School Branch.` });
      }
    }
    if (aadharCard) {
      if (!/^\d{12}$/.test(aadharCard)) {
        return res.status(400).json({ message: `Aadhar Card must be exactly 12 numeric digits.` });
      }
      const exists = students.some(s => 
        s.schoolId === schoolId && 
        (s.aadharCard || s.aadharcard || "").toString().trim().toLowerCase().replace(/\s/g, "") === aadharCard
      );
      if (exists) {
        return res.status(400).json({ message: `Student with Aadhar Card '${body.aadharCard}' already exists in this School Branch.` });
      }
    }
    if (uniformId) {
      if (uniformId.length < 3 || uniformId.length > 50) {
        return res.status(400).json({ message: `UniformID must be between 3 and 50 characters.` });
      }
      const exists = students.some(s => 
        s.schoolId === schoolId && 
        (s.uniformId || s.uniformid || "").toString().trim().toLowerCase() === uniformId
      );
      if (exists) {
        return res.status(400).json({ message: `Student with UniformID '${body.uniformId}' already exists in this School Branch.` });
      }
    }

    const newStudent = {
      id: students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1,
      grNo: body.grNo || body.GRNO || body.grno || body.registrationNumber || `REG-${Date.now()}`,
      registrationNumber: body.registrationNumber || body.grNo || body.GRNO || body.grno || `REG-${Date.now()}`,
      fullName: body.fullName || `${body.firstName || body.FNAME || ""} ${body.lastName || body.LNAME || ""}`.trim(),
      firstName: body.firstName || body.FNAME || "",
      middleName: body.middleName || body.MNAME || "",
      lastName: body.lastName || body.LNAME || "",
      gender: body.gender || body.GENDER || "",
      dateOfBirth: body.dateOfBirth || body.dob || body.DOB || "",
      address: body.address || body.ADDRESS || "",
      motherName: body.motherName || body.MOTHERNAME || "",
      fatherContactNo: body.fatherContactNo || body.MOBILE || "",
      motherContactNo: body.motherContactNo || body.contact2 || "",
      sms: body.sms === 'true' || body.sms === true || body.Sms === true || false,
      isStateBoard: body.isStateBoard === 'true' || body.isStateBoard === true || body.IsStateBoard === true || false,
      digitalUniform: body.digitalUniform === 'true' || body.digitalUniform === true || body.DigitalUniform === true || false,
      digitalNotebook: body.digitalNotebook === 'true' || body.digitalNotebook === true || body.DigitalNotebook === true || false,
      schoolId: body.schoolId ? parseInt(body.schoolId) : null,
      standardId: body.standardId ? parseInt(body.standardId) : null,
      sectionId: body.sectionId ? parseInt(body.sectionId) : null,
      academicYearId: body.academicYearId ? parseInt(body.academicYearId) : null,
      rollNumber: body.rollNumber ? parseInt(body.rollNumber) : 0,
      rfid: body.rfid || body.RFID || "",
      aadharCard: body.aadharCard || body.aadharcard || "",
      uniformId: body.uniformId || body.uniformid || "",
    };
    students.push(newStudent);
    saveDb();
    res.status(201).json({ data: newStudent });
  });

  app.post("/api/students/bulk", (req, res) => {
    const incoming = req.body || [];
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return res.status(400).json({ message: "No student data provided." });
    }

    // Uniqueness tracking sets for current incoming batch
    const batchRegs = new Set<string>();
    const batchAadhars = new Set<string>();
    const batchRfids = new Set<string>();
    const batchUniforms = new Set<string>();

    // Sets of identifiers currently registered in simulated database (existing students, case-insensitive checks)
    const dbRegs = new Set<string>(students.map(s => (s.registrationNumber || s.GrNo || s.grNo || s.grno || s.GRNO || "").toString().trim().toLowerCase()).filter(Boolean));
    const dbAadhars = new Set<string>(students.map(s => (s.aadharCard || s.aadharcard || "").toString().trim().toLowerCase()).filter(Boolean));
    const dbRfids = new Set<string>(students.map(s => (s.rfid || s.RFID || "").toString().trim().toLowerCase()).filter(Boolean));
    const dbUniforms = new Set<string>(students.map(s => (s.uniformId || s.uniformid || "").toString().trim().toLowerCase()).filter(Boolean));

    for (let idx = 0; idx < incoming.length; idx++) {
      const s = incoming[idx];
      const index = idx + 1; // 1-based index representation for error display

      // a) RegistrationNumber / GRNO
      const reg = (s.registrationNumber || s.GrNo || s.grNo || s.grno || s.GRNO || "").toString().trim().toLowerCase();
      if (reg) {
        if (batchRegs.has(reg) || dbRegs.has(reg)) {
          return res.status(400).json({ message: `Row ${index}: Duplicate Registration Number/GRNO '${s.registrationNumber || s.GrNo || s.grNo || s.grno || s.GRNO}' detected.` });
        }
        batchRegs.add(reg);
      }

      // b) AadharCard
      const aadhar = (s.aadharCard || s.aadharcard || "").toString().trim().replace(/\s/g, "");
      if (aadhar) {
        if (!/^\d{12}$/.test(aadhar)) {
          return res.status(400).json({ message: `Row ${index}: Invalid Aadhar Card '${s.aadharCard || s.aadharcard}'. It must be exactly 12 numeric digits.` });
        }
        const aadharLower = aadhar.toLowerCase();
        if (batchAadhars.has(aadharLower) || dbAadhars.has(aadharLower)) {
          return res.status(400).json({ message: `Row ${index}: Duplicate Aadhar Card '${s.aadharCard || s.aadharcard}' detected.` });
        }
        batchAadhars.add(aadharLower);
      }

      // c) RFID
      const rfid = (s.rfid || s.RFID || "").toString().trim().replace(/\s/g, "");
      if (rfid) {
        if (rfid.length !== 10 && rfid.length !== 24) {
          return res.status(400).json({ message: `Row ${index}: Invalid RFID/CardID '${s.rfid || s.RFID}'. It must be exactly 10 or 24 characters.` });
        }
        if (!/^[a-zA-Z0-9]+$/.test(rfid)) {
          return res.status(400).json({ message: `Row ${index}: RFID/CardID must be alphanumeric.` });
        }
        const rfidLower = rfid.toLowerCase();
        if (batchRfids.has(rfidLower) || dbRfids.has(rfidLower)) {
          return res.status(400).json({ message: `Row ${index}: Duplicate RFID/CardID '${s.rfid || s.RFID}' detected.` });
        }
        batchRfids.add(rfidLower);
      }

      // d) UniformID
      const uniform = (s.uniformId || s.uniformid || "").toString().trim();
      if (uniform) {
        if (uniform.length < 3 || uniform.length > 50) {
          return res.status(400).json({ message: `Row ${index}: Invalid UniformID '${s.uniformId || s.uniformid}'. It must be between 3 and 50 characters.` });
        }
        const uniformLower = uniform.toLowerCase();
        if (batchUniforms.has(uniformLower) || dbUniforms.has(uniformLower)) {
          return res.status(400).json({ message: `Row ${index}: Duplicate UniformID '${s.uniformId || s.uniformid}' detected.` });
        }
        batchUniforms.add(uniformLower);
      }
    }

    const newItems = incoming.map((s: any, idx: number) => ({
      id: students.length > 0 ? Math.max(...students.map(item => item.id)) + idx + 1 : idx + 1,
      ...s
    }));

    students = [...students, ...newItems];
    saveDb();
    res.status(201).json({ success: true, count: newItems.length });
  });

  app.put("/api/students/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = students.findIndex(s => s.id === id);
    if (index !== -1) {
      const body = req.body;
      const schoolId = body.schoolId ? parseInt(body.schoolId) : (students[index].schoolId ? parseInt(students[index].schoolId) : null);
      const academicYearId = body.academicYearId ? parseInt(body.academicYearId) : (students[index].academicYearId ? parseInt(students[index].academicYearId) : null);
      const grNo = (body.grNo || body.GRNO || body.grno || body.registrationNumber || "").toString().trim().toLowerCase();
      const rfid = (body.rfid || body.RFID || "").toString().trim().toLowerCase().replace(/\s/g, "");
      const aadharCard = (body.aadharCard || body.aadharcard || "").toString().trim().toLowerCase().replace(/\s/g, "");
      const uniformId = (body.uniformId || body.uniformid || "").toString().trim().toLowerCase();

      if (grNo) {
        const exists = students.some(s => 
          s.id !== id &&
          s.schoolId === schoolId && 
          s.academicYearId === academicYearId && 
          (s.grNo || s.registrationNumber || "").toString().trim().toLowerCase() === grNo
        );
        if (exists) {
          return res.status(400).json({ message: `Another student already exists with Registration Number/GrNo '${body.grNo || body.registrationNumber}' for the selected School and Academic Year.` });
        }
      }
      if (rfid) {
        if (rfid.length !== 10 && rfid.length !== 24) {
          return res.status(400).json({ message: `RFID must be exactly 10 or 24 alphanumeric characters.` });
        }
        if (!/^[a-zA-Z0-9]+$/.test(rfid)) {
          return res.status(400).json({ message: `RFID must be alphanumeric.` });
        }
        const exists = students.some(s => 
          s.id !== id &&
          s.schoolId === schoolId && 
          (s.rfid || s.RFID || "").toString().trim().toLowerCase().replace(/\s/g, "") === rfid
        );
        if (exists) {
          return res.status(400).json({ message: `Another student with RFID '${body.rfid}' already exists in this School Branch.` });
        }
      }
      if (aadharCard) {
        if (!/^\d{12}$/.test(aadharCard)) {
          return res.status(400).json({ message: `Aadhar Card must be exactly 12 numeric digits.` });
        }
        const exists = students.some(s => 
          s.id !== id &&
          s.schoolId === schoolId && 
          (s.aadharCard || s.aadharcard || "").toString().trim().toLowerCase().replace(/\s/g, "") === aadharCard
        );
        if (exists) {
          return res.status(400).json({ message: `Another student with Aadhar Card '${body.aadharCard}' already exists in this School Branch.` });
        }
      }
      if (uniformId) {
        if (uniformId.length < 3 || uniformId.length > 50) {
          return res.status(400).json({ message: `UniformID must be between 3 and 50 characters.` });
        }
        const exists = students.some(s => 
          s.id !== id &&
          s.schoolId === schoolId && 
          (s.uniformId || s.uniformid || "").toString().trim().toLowerCase() === uniformId
        );
        if (exists) {
          return res.status(400).json({ message: `Another student with UniformID '${body.uniformId}' already exists in this School Branch.` });
        }
      }

      const updated = {
        ...students[index],
        firstName: body.firstName || body.FNAME || students[index].firstName,
        middleName: body.middleName || body.MNAME || students[index].middleName,
        lastName: body.lastName || body.LNAME || students[index].lastName,
        grNo: body.grNo || body.GRNO || body.grno || students[index].grNo,
        gender: body.gender || body.GENDER || students[index].gender,
        dateOfBirth: body.dateOfBirth || body.dob || body.DOB || students[index].dateOfBirth,
        address: body.address || body.ADDRESS || students[index].address,
        motherName: body.motherName || body.MOTHERNAME || students[index].motherName,
        fatherContactNo: body.fatherContactNo || body.MOBILE || students[index].fatherContactNo,
        motherContactNo: body.motherContactNo || body.contact2 || students[index].motherContactNo,
        sms: body.sms === 'true' || body.sms === true || body.Sms === true || students[index].sms,
        isStateBoard: body.isStateBoard === 'true' || body.isStateBoard === true || body.IsStateBoard === true || students[index].isStateBoard,
        digitalUniform: body.digitalUniform === 'true' || body.digitalUniform === true || body.DigitalUniform === true || students[index].digitalUniform || false,
        digitalNotebook: body.digitalNotebook === 'true' || body.digitalNotebook === true || body.DigitalNotebook === true || students[index].digitalNotebook || false,
        fullName: body.fullName || `${body.firstName || body.FNAME || students[index].firstName || ""} ${body.lastName || body.LNAME || students[index].lastName || ""}`.trim()
      };
      students[index] = updated;
      saveDb();
      res.json({ data: students[index] });
    } else {
      res.status(404).json({ message: "Student not found" });
    }
  });

  app.delete("/api/students/:id", (req, res) => {
    const id = parseInt(req.params.id);
    students = students.filter(s => s.id !== id);
    saveDb();
    res.json({ success: true });
  });

  app.post("/api/students/:id/photo", upload.single("file"), (req, res) => {
    const id = parseInt(req.params.id);
    const index = students.findIndex(s => s.id === id);
    if (req.file) {
      const webPath = `/uploads/${req.file.filename}`;
      if (index !== -1) {
        students[index].photo = webPath;
        students[index].profilePhotoPath = webPath;
        students[index].ProfilePhotoPath = webPath;
        saveDb();
      }
      res.json({ data: { path: webPath } });
    } else {
      res.status(400).json({ message: "No photo file provided" });
    }
  });

  app.post("/api/schools/:id/photo", upload.single("file"), (req, res) => {
    const id = parseInt(req.params.id);
    const index = schools.findIndex((s: any) => s.id === id);
    if (req.file) {
      const webPath = `/uploads/${req.file.filename}`;
      if (index !== -1) {
        schools[index].photo = webPath;
        schools[index].profilePhotoPath = webPath;
        schools[index].ProfilePhotoPath = webPath;
        schools[index].logo = webPath;
        saveDb();
      }
      res.json({ data: { path: webPath } });
    } else {
      res.status(400).json({ message: "No photo file provided" });
    }
  });

  app.post("/api/teachers/:id/photo", upload.single("file"), (req, res) => {
    const id = parseInt(req.params.id);
    const index = teachers.findIndex((t: any) => t.id === id);
    if (req.file) {
      const webPath = `/uploads/${req.file.filename}`;
      if (index !== -1) {
        teachers[index].photo = webPath;
        teachers[index].profilePhotoPath = webPath;
        teachers[index].ProfilePhotoPath = webPath;
        saveDb();
      }
      res.json({ data: { path: webPath } });
    } else {
      res.status(400).json({ message: "No photo file provided" });
    }
  });

  // Attendance
  app.get("/api/attendance", (req, res) => {
    const date = req.query.date as string;
    let filtered = attendance;
    if (date) {
      filtered = attendance.filter((a: any) => {
        if (!a.date) return false;
        // Robust check supporting both YYYY-MM-DD and complete ISO-8601 strings
        const aDateStr = a.date.includes('T') ? a.date.split('T')[0] : a.date;
        const qDateStr = date.includes('T') ? date.split('T')[0] : date;
        return aDateStr === qDateStr;
      });
    }
    res.json({ data: filtered });
  });

  app.post("/api/attendance", (req, res) => {
    const records = Array.isArray(req.body) ? req.body : [req.body];
    records.forEach(record => {
      const existingIdx = attendance.findIndex((a: any) => {
        if (!a.date || !record.date) return false;
        const aDateStr = a.date.includes('T') ? a.date.split('T')[0] : a.date;
        const rDateStr = record.date.includes('T') ? record.date.split('T')[0] : record.date;
        const dateMatches = aDateStr === rDateStr;
        
        if (!dateMatches) return false;

        if (record.studentId) {
          const rStudentId = a.studentId ?? a.StudentId;
          return Number(rStudentId) === Number(record.studentId);
        } else if (record.staffId) {
          const rStaffId = a.staffId ?? a.StaffId;
          return Number(rStaffId) === Number(record.staffId);
        }
        return false;
      });
      if (existingIdx !== -1) {
        attendance[existingIdx] = { ...attendance[existingIdx], ...record };
      } else {
        attendance.push({ id: attendance.length + 1, ...record });
      }
    });
    saveDb();
    res.json({ success: true });
  });

  app.post("/api/attendance/bulk", (req, res) => {
    const records = Array.isArray(req.body) ? req.body : [req.body];
    records.forEach(record => {
      const existingIdx = attendance.findIndex((a: any) => {
        if (!a.date || !record.date) return false;
        const aDateStr = a.date.includes('T') ? a.date.split('T')[0] : a.date;
        const rDateStr = record.date.includes('T') ? record.date.split('T')[0] : record.date;
        const dateMatches = aDateStr === rDateStr;
        
        if (!dateMatches) return false;

        if (record.studentId) {
          const rStudentId = a.studentId ?? a.StudentId;
          return Number(rStudentId) === Number(record.studentId);
        } else if (record.staffId) {
          const rStaffId = a.staffId ?? a.StaffId;
          return Number(rStaffId) === Number(record.staffId);
        }
        return false;
      });
      if (existingIdx !== -1) {
        attendance[existingIdx] = { ...attendance[existingIdx], ...record };
      } else {
        attendance.push({ id: attendance.length + 1, ...record });
      }
    });
    saveDb();
    res.json({ success: true });
  });

  // Stats
  app.get("/api/stats", (req, res) => {
    res.json({
      data: {
        totalStudents: students.length,
        totalSchools: schools.length,
        activeAttendance: "92%",
        averagePerformance: "88%",
        recentAnnouncements: [
          { id: 1, title: "Exam Schedule Released", date: "2024-05-15", category: "Exam" },
          { id: 2, title: "Annual Sports Day", date: "2024-06-01", category: "Sports" }
        ],
        upcomingEvents: [
          { id: 1, title: "Science Fair", date: "2024-05-20", type: "Exhibition" },
          { id: 2, title: "Teacher Training", date: "2024-05-25", type: "Workshop" }
        ],
        attendanceTrend: [
          { day: "Mon", attendance: 92 },
          { day: "Tue", attendance: 95 },
          { day: "Wed", attendance: 88 },
          { day: "Thu", attendance: 94 },
          { day: "Fri", attendance: 91 }
        ],
        performanceData: [
          { name: "Term 1", avg: 72, top: 94 },
          { name: "Term 2", avg: 78, top: 96 },
          { name: "Term 3", avg: 75, top: 93 },
          { name: "Term 4", avg: 82, top: 98 }
        ]
      }
    });
  });

  // Other Placeholders
  app.get("/api/marks", (req, res) => res.json({ data: [] }));
  app.get("/api/teachers", (req, res) => {
    const schoolId = req.query.schoolId ? parseInt(req.query.schoolId as string) : null;
    const academicYearId = req.query.academicYearId ? parseInt(req.query.academicYearId as string) : null;
    const status = req.query.status as string;
    const subject = req.query.subject as string;
    
    let filtered = [...teachers];
    if (schoolId) {
      filtered = filtered.filter(t => t.schoolId === schoolId);
    }
    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }
    if (subject) {
      filtered = filtered.filter(t => t.subject === subject || t.department === subject);
    }
    
    res.json(applySortingAndPagination(filtered, req.query));
  });

  app.post("/api/teachers", (req, res) => {
    const body = req.body;
    const schoolId = body.schoolId ? parseInt(body.schoolId) : null;
    const empId = body.employeeId ? body.employeeId.toString().trim().toLowerCase() : "";
    const email = (body.user?.email || body.email) ? (body.user?.email || body.email).toString().trim().toLowerCase() : "";
    const rfid = body.rfid ? body.rfid.toString().trim().toLowerCase().replace(/\s/g, "") : "";

    if (empId) {
      const exists = teachers.some((t: any) => 
        t.schoolId === schoolId && 
        (t.employeeId || "").toString().trim().toLowerCase() === empId
      );
      if (exists) {
        return res.status(400).json({ message: `Staff with Employee ID '${body.employeeId}' already exists in this School Branch.` });
      }
    }
    if (email) {
      const exists = teachers.some((t: any) => 
        ((t.user?.email || t.email) || "").toString().trim().toLowerCase() === email
      );
      if (exists) {
        return res.status(400).json({ message: `Staff/User with Email '${body.user?.email || body.email}' already exists.` });
      }
    }
    if (rfid) {
      if (rfid.length !== 10 && rfid.length !== 24) {
        return res.status(400).json({ message: `RFID Tag Number must be exactly 10 or 24 alphanumeric characters.` });
      }
      const exists = teachers.some((t: any) => 
        t.schoolId === schoolId && 
        (t.rfid || "").toString().trim().toLowerCase().replace(/\s/g, "") === rfid
      );
      if (exists) {
        return res.status(400).json({ message: `Staff with RFID Tag '${body.rfid}' already exists in this School Branch.` });
      }
    }

    const newItem = {
      id: teachers.length > 0 ? Math.max(...teachers.map((t: any) => t.id)) + 1 : 1,
      ...body
    };
    teachers.push(newItem);
    saveDb();
    res.status(201).json({ data: newItem });
  });

  app.put("/api/teachers/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = teachers.findIndex((t: any) => t.id === id);
    if (index !== -1) {
      const body = req.body;
      const schoolId = body.schoolId ? parseInt(body.schoolId) : (teachers[index].schoolId ? parseInt(teachers[index].schoolId) : null);
      const empId = body.employeeId ? body.employeeId.toString().trim().toLowerCase() : "";
      const email = (body.user?.email || body.email) ? (body.user?.email || body.email).toString().trim().toLowerCase() : "";
      const rfid = body.rfid ? body.rfid.toString().trim().toLowerCase().replace(/\s/g, "") : "";

      if (empId) {
        const exists = teachers.some((t: any) => 
          t.id !== id &&
          t.schoolId === schoolId && 
          (t.employeeId || "").toString().trim().toLowerCase() === empId
        );
        if (exists) {
          return res.status(400).json({ message: `Another staff with Employee ID '${body.employeeId}' already exists in this School Branch.` });
        }
      }
      if (email) {
        const exists = teachers.some((t: any) => 
          t.id !== id &&
          ((t.user?.email || t.email) || "").toString().trim().toLowerCase() === email
        );
        if (exists) {
          return res.status(400).json({ message: `Another staff/user with Email '${body.user?.email || body.email}' already exists.` });
        }
      }
      if (rfid) {
        if (rfid.length !== 10 && rfid.length !== 24) {
          return res.status(400).json({ message: `RFID Tag Number must be exactly 10 or 24 alphanumeric characters.` });
        }
        const exists = teachers.some((t: any) => 
          t.id !== id &&
          t.schoolId === schoolId && 
          (t.rfid || "").toString().trim().toLowerCase().replace(/\s/g, "") === rfid
        );
        if (exists) {
          return res.status(400).json({ message: `Another staff with RFID Tag '${body.rfid}' already exists in this School Branch.` });
        }
      }

      teachers[index] = { ...teachers[index], ...body };
      saveDb();
      res.json({ data: teachers[index] });
    } else {
      res.status(404).json({ message: "Teacher not found" });
    }
  });

  app.delete("/api/teachers/:id", (req, res) => {
    const id = parseInt(req.params.id);
    teachers = teachers.filter((t: any) => t.id !== id);
    saveDb();
    res.status(204).send();
  });
  app.get("/api/fees", (req, res) => res.json({ data: [] }));

  // Generic Master Routes
  Object.keys(mastersMap).forEach(resourceName => {
    const dataArray = mastersMap[resourceName];
    
    app.get(`/api/masters/${resourceName}`, (req, res) => {
      res.json(applySortingAndPagination(dataArray, req.query));
    });
    
    app.post(`/api/masters/${resourceName}`, (req, res) => {
      const name = req.body.name ? req.body.name.toString().trim().toLowerCase() : "";
      const schoolId = req.body.schoolId ? parseInt(req.body.schoolId) : null;
      const academicYearId = req.body.academicYearId ? parseInt(req.body.academicYearId) : null;

      if (name) {
        const exists = dataArray.some((item: any) => 
          (item.name ? item.name.toString().trim().toLowerCase() === name : false) &&
          (schoolId ? parseInt(item.schoolId) === schoolId : true) &&
          (academicYearId ? parseInt(item.academicYearId) === academicYearId : true)
        );
        if (exists) {
          const formattedResource = resourceName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          return res.status(400).json({ message: `${formattedResource} '${req.body.name}' already exists for the selected School Branch / Academic Year.` });
        }
      }
      const newItem = { id: dataArray.length > 0 ? Math.max(...dataArray.map(item => item.id)) + 1 : 1, ...req.body, isActive: true };
      dataArray.push(newItem);
      saveDb();
      res.status(201).json({ data: newItem });
    });

    app.put(`/api/masters/${resourceName}/:id`, (req, res) => {
      const id = parseInt(req.params.id);
      const index = dataArray.findIndex(item => item.id === id);
      if (index !== -1) {
        const name = req.body.name ? req.body.name.toString().trim().toLowerCase() : "";
        const schoolId = req.body.schoolId ? parseInt(req.body.schoolId) : (dataArray[index].schoolId ? parseInt(dataArray[index].schoolId) : null);
        const academicYearId = req.body.academicYearId ? parseInt(req.body.academicYearId) : (dataArray[index].academicYearId ? parseInt(dataArray[index].academicYearId) : null);

        if (name) {
          const exists = dataArray.some((item: any) => 
            item.id !== id &&
            (item.name ? item.name.toString().trim().toLowerCase() === name : false) &&
            (schoolId ? parseInt(item.schoolId) === schoolId : true) &&
            (academicYearId ? parseInt(item.academicYearId) === academicYearId : true)
          );
          if (exists) {
            const formattedResource = resourceName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return res.status(400).json({ message: `Another ${formattedResource} with name '${req.body.name}' already exists for the selected School Branch / Academic Year.` });
          }
        }
        dataArray[index] = { ...dataArray[index], ...req.body };
        saveDb();
        res.json({ data: dataArray[index] });
      } else {
        res.status(404).json({ message: "Not found" });
      }
    });

    app.delete(`/api/masters/${resourceName}/:id`, (req, res) => {
      const id = parseInt(req.params.id);
      const index = dataArray.findIndex(item => item.id === id);
      if (index !== -1) {
        dataArray.splice(index, 1);
        saveDb();
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Not found" });
      }
    });
  });

  // Users
  app.get("/api/users", (req, res) => {
    const roleId = req.query.roleId as string;
    let filtered = [...users];
    if (roleId) {
      filtered = filtered.filter((u: any) => u.role === roleId);
    }
    res.json(applySortingAndPagination(filtered, req.query));
  });
  app.post("/api/users", (req, res) => {
    const newItem = { id: users.length > 0 ? Math.max(...users.map((u: any) => u.id)) + 1 : 1, ...req.body, status: "Active" };
    users.push(newItem);
    saveDb();
    res.status(201).json({ data: newItem });
  });
  app.put("/api/users/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = users.findIndex((u: any) => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...req.body };
      saveDb();
      res.json({ data: users[index] });
    } else {
      res.status(404).json({ message: "Not found" });
    }
  });
  app.delete("/api/users/:id", (req, res) => {
    const id = parseInt(req.params.id);
    users = users.filter((u: any) => u.id !== id);
    saveDb();
    res.status(204).send();
  });
  app.put("/api/users/:id/role", (req, res) => {
    const id = parseInt(req.params.id);
    const index = users.findIndex((u: any) => u.id === id);
    if (index !== -1) {
      const roleStr = req.body.role || "";
      const userObj: any = users[index];
      userObj.role = roleStr;
      
      let roleId = 4; // default Student
      const rLower = roleStr.toLowerCase().replace(/\s+/g, '');
      if (rLower === "superadmin") roleId = 1;
      else if (rLower === "admin") roleId = 2;
      else if (rLower === "teacher") roleId = 3;
      else if (rLower === "student") roleId = 4;
      else if (rLower === "parent") roleId = 5;
      
      userObj.roleId = roleId;
      userObj.RoleId = roleId; // Support both cases
      
      saveDb();
      res.json({ success: true, data: userObj });
    } else {
      res.status(404).json({ message: "Not found" });
    }
  });

  // Notifications
  app.get("/api/notifications", (req, res) => res.json({ data: notifications }));
  app.get("/api/notifications/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const notif = notifications.find((n: any) => n.id === id);
    if (notif) res.json({ data: notif });
    else res.status(404).json({ message: "Notification not found" });
  });
  app.put("/api/notifications/:id/read", (req, res) => {
    const id = parseInt(req.params.id);
    const index = notifications.findIndex((n: any) => n.id === id);
    if (index !== -1) {
      notifications[index].isRead = true;
      res.json({ data: notifications[index] });
    } else {
      res.status(404).json({ message: "Notification not found" });
    }
  });
  app.delete("/api/notifications/:id", (req, res) => {
    const id = parseInt(req.params.id);
    notifications = notifications.filter((n: any) => n.id !== id);
    res.status(204).send();
  });

  // Messages (Communication Hub)
  app.get("/api/messages", (req, res) => res.json({ data: messages }));
  app.post("/api/messages", (req, res) => {
    const newMessage = {
      id: messages.length > 0 ? Math.max(...messages.map((m: any) => m.id)) + 1 : 1,
      senderId: req.body.senderId || 1,
      createdAt: new Date().toISOString(),
      isRead: false,
      ...req.body
    };
    messages.push(newMessage);
    res.status(201).json({ data: newMessage });
  });
  app.put("/api/messages/:id/read", (req, res) => {
    const id = parseInt(req.params.id);
    const index = messages.findIndex((m: any) => m.id === id);
    if (index !== -1) {
      messages[index].isRead = true;
      res.json({ data: messages[index] });
    } else {
      res.status(404).json({ message: "Message not found" });
    }
  });

  // Navigation Items
  app.get("/api/navigation", (req, res) => {
    const roleId = req.query.roleId ? parseInt(req.query.roleId as string) : null;
    let filtered = navigationItems;
    if (roleId !== null) {
      // IDs: SuperAdmin=1 bypasses filter or matched directly
      if (roleId !== 1) {
        filtered = navigationItems.filter((item: any) => 
          Array.isArray(item.roleIds) && (item.roleIds.includes(roleId) || item.roleIds.includes(0))
        );
      }
    }
    res.json({ data: filtered });
  });

  app.post("/api/navigation", (req, res) => {
    const rolesMap: Record<string, number> = { superadmin: 1, admin: 2, teacher: 3, student: 4, parent: 5 };
    const roles = Array.isArray(req.body.roles) ? req.body.roles : ["superadmin"];
    const roleIds = Array.isArray(req.body.roleIds) ? req.body.roleIds : roles.map(r => rolesMap[r]).filter(Boolean);

    const newItem = { 
      id: navigationItems.length > 0 ? Math.max(...navigationItems.map((n: any) => n.id)) + 1 : 1, 
      ...req.body,
      roles,
      roleIds: roleIds.length > 0 ? roleIds : [1]
    };
    navigationItems.push(newItem);
    saveDb();
    res.status(201).json({ data: newItem });
  });

  app.put("/api/navigation/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = navigationItems.findIndex((n: any) => n.id === id);
    if (index !== -1) {
      const rolesMap: Record<string, number> = { superadmin: 1, admin: 2, teacher: 3, student: 4, parent: 5 };
      const roles = Array.isArray(req.body.roles) ? req.body.roles : (navigationItems[index].roles || ["superadmin"]);
      const roleIds = Array.isArray(req.body.roleIds) ? req.body.roleIds : roles.map(r => rolesMap[r]).filter(Boolean);

      navigationItems[index] = { 
        ...navigationItems[index], 
        ...req.body,
        roles,
        roleIds: roleIds.length > 0 ? roleIds : [1]
      };
      saveDb();
      res.json({ data: navigationItems[index] });
    } else {
      res.status(404).json({ message: "Navigation item not found" });
    }
  });

  app.delete("/api/navigation/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = navigationItems.findIndex((n: any) => n.id === id);
    if (index !== -1) {
      navigationItems.splice(index, 1);
      saveDb();
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Navigation item not found" });
    }
  });

  // Base API Route
  app.get("/api", (req, res) => {
    res.json({
      status: "online",
      name: "SCANiD ERP API",
      endpoints: [
        "/api/health", 
        "/api/stats", 
        "/api/students", 
        "/api/schools", 
        "/api/teachers", 
        "/api/users",
        "/api/attendance",
        "/api/notifications",
        "/api/messages",
        "/api/masters/*"
      ]
    });
  });

  // API Fail-safe catch-all (Must be BEFORE static/vite)
  // But we first try to proxy to the real .NET backend if it's running
  const apiProxy = createProxyMiddleware({
    target: "http://127.0.0.1:5000",
    changeOrigin: true,
    secure: false,
    ws: true,
    pathRewrite: {
      "^/SCANiD_ERP_API": ""
    },
    // Filter logic to only forward if it hasn't been handled by previous routes
    pathFilter: (pathname, req) => {
      return (pathname.startsWith('/api') || pathname.startsWith('/uploads') || pathname.startsWith('/photos') || pathname.startsWith('/SCANiD_ERP_API'));
    },
    on: {
      error: (err, req, res) => {
        // Only log if it's not a missing endpoint (which we want to fall through to 404)
        if (!req.url?.includes('health')) {
          console.warn(`[Proxy] Backend unreachable at http://127.0.0.1:5000: ${err.message}`);
        }
        
        if ('writeHead' in res && !res.headersSent) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: "Backend Unavailable", 
            message: "The .NET backend is offline. Please start it for full functionality." 
          }));
        }
      },
      proxyReq: (proxyReq, req, res) => {
        // Fix for body consumption issue: Only re-stream if it's JSON
        // Multipart data (file uploads) should NOT be stringified
        const expressReq = req as any;
        const contentType = req.headers['content-type'] || '';
        if (expressReq.body && Object.keys(expressReq.body).length > 0 && contentType.includes('application/json')) {
          const bodyData = JSON.stringify(expressReq.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      }
    }
  });
  apiProxyInstance = apiProxy;

  // Proxy as a fallback for routes NOT handled by the mocks above
  app.use(['/api', '/uploads', '/photos', '/SCANiD_ERP_API'], apiProxy);

  // Safeguard: Serve static files from backend/ScanID.Api/wwwroot for uploads and photos if the proxy backend is unavailable
  app.use('/uploads', express.static(uploadsDir));
  app.use('/photos', express.static(photosDir));
  app.use('/SCANiD_ERP_API/uploads', express.static(uploadsDir));
  app.use('/SCANiD_ERP_API/photos', express.static(photosDir));

  app.all("/api/*", (req, res) => {
    console.warn(`[404] API Route Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: "API Endpoint Not Found", 
      message: `The route ${req.url} is not implemented in this mock server.`,
      availableEnpoints: "/api"
    });
  });

  // File serving and Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { server: httpServer }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log("\n" + "=".repeat(60));
    console.log(`🚀 SCANiD ERP SYSTEM DEPLOYED SUCCESSFULLY`);
    console.log(`🌐 Application URL: http://localhost:${PORT}`);
    console.log(`📡 Backend API:      http://localhost:${PORT}/api`);
    console.log("=".repeat(60) + "\n");
    console.log(`[INFO] Unified Server: Serving React Frontend and Express API`);
    console.log(`[HINT] Use http://localhost:${PORT} to access the application.`);
  }).on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ [FATAL] Port ${PORT} is already in use by another process.`);
      console.error(`Please stop the application already running on port ${PORT} and try again.`);
      console.error(`If you are a developer, ensure no other "npm run dev" or backend process is active on this port.\n`);
      process.exit(1);
    } else {
      console.error("Server start error:", err);
    }
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
