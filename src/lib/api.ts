import axios from "axios";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "/api");

console.log(`[API] Initialized with Base URL: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  // Use default axios behavior which handles Content-Type automatically based on data type
});

// Fallback data for preview mode
const mockFallbacks: Record<string, any> = {
  "/stats": {
    totalStudents: 1248,
    totalTeachers: 84,
    feeCollection: "₹45,200",
    attendanceRate: "92%",
    performanceTrend: "+2.4%",
  },
  "/students": [
    {
      id: 1,
      registrationNumber: "REG001",
      fullName: "Demo Student (Local Server Offline)",
      standard: "10th",
      section: "A",
      rollNumber: 1,
      address: "Localhost",
    },
  ],
  "/attendance": [
    { id: 1, studentId: 1, date: new Date().toISOString().split('T')[0], status: "Present" },
    { id: 2, studentId: 2, date: new Date().toISOString().split('T')[0], status: "Absent" }
  ],
  "/schools": [
    {
      id: 1,
      name: "Preview School (Demo)",
      status: "Active",
      address: "Cloud Preview",
    },
  ],
  "/masters/academic-years": [
    { id: 1, name: "2023-24", isCurrent: false, isActive: true },
    { id: 2, name: "2024-25", isCurrent: true, isActive: true },
  ],
  "/masters/standards": [
    { id: 1, name: "10th Standard", isActive: true },
  ],
  "/masters/sections": [
    { id: 1, name: "A", isActive: true },
  ],
  "/masters/religions": [
    { id: 1, name: "Hindu", isActive: true },
    { id: 2, name: "Muslim", isActive: true },
  ],
  "/masters/blood-groups": [
    { id: 1, name: "A+", isActive: true },
    { id: 2, name: "B+", isActive: true },
  ],
  "/masters/houses": [
    { id: 1, name: "Red House", color: "#ef4444", isActive: true },
  ],
  "/masters/admission-types": [
    { id: 1, name: "Regular", isActive: true },
  ],
  "/masters/castes": [
    { id: 1, name: "General", isActive: true },
  ],
  "/masters/sub-castes": [
    { id: 1, casteId: 1, name: "Sub-Caste 1", isActive: true },
  ],
  "/masters/states": [
    { id: 1, name: "Maharashtra", isActive: true },
  ],
  "/masters/cities": [
    { id: 1, stateId: 1, name: "Mumbai", isActive: true },
  ],
  "/masters/weekdays": [
    { id: 1, name: "Monday", isActive: true },
    { id: 2, name: "Tuesday", isActive: true },
    { id: 3, name: "Wednesday", isActive: true },
    { id: 4, name: "Thursday", isActive: true },
    { id: 5, name: "Friday", isActive: true },
    { id: 6, name: "Saturday", isActive: false },
    { id: 7, name: "Sunday", isActive: false }
  ],
  "/masters/holidays": [
    { id: 1, name: "Independence Day", fromDate: "2026-08-15T00:00:00Z", toDate: "2026-08-15T00:00:00Z", description: "National Holiday", isActive: true },
    { id: 2, name: "Christmas", fromDate: "2026-12-25T00:00:00Z", toDate: "2026-12-25T00:00:00Z", description: "Winter Holiday", isActive: true }
  ],
  "/masters/shifts": [
    { id: 1, name: "MORNING", isActive: true },
    { id: 2, name: "AFTERNOON", isActive: true },
  ],
  "/masters/subjects": [
    { id: 1, name: "Mathematics", isActive: true },
    { id: 2, name: "Science", isActive: true },
  ],
  "/masters/exam-types": [
    { id: 1, name: "Unit Test 1", isActive: true },
  ],
  "/masters/designations": [
    { id: 1, name: "Principal", isActive: true },
  ],
  "/masters/occupations": [
    { id: 1, name: "Service", isActive: true },
  ],
  "/masters/sessions": [
    { id: 1, name: "Session A", isActive: true },
  ],
  "/masters/batches": [
    { id: 1, name: "Batch 2024", isActive: true },
  ],
  "/masters/categories": [
    { id: 1, name: "General", isActive: true },
  ],
  "/masters/school-sections": [
    { id: 1, name: "Primary", isActive: true },
    { id: 2, name: "Secondary", isActive: true },
    { id: 3, name: "Higher Secondary", isActive: true }
  ],
  "/navigation": [
    { id: 1, title: "Dashboard", icon: "LayoutDashboard", path: "/", parentId: null, sortOrder: 1, roleIds: [1, 2, 3, 4, 5] },
    { id: 2, title: "Academic Operations", icon: "BookOpen", path: null, parentId: null, sortOrder: 2, roleIds: [1, 2, 3, 4, 5] },
    { id: 3, title: "Student Registry", icon: "GraduationCap", path: "/students", parentId: 2, sortOrder: 1, roleIds: [1, 2, 3, 5] },
    { id: 4, title: "Attendance Tracking", icon: "CalendarCheck", path: "/attendance", parentId: 2, sortOrder: 2, roleIds: [1, 2, 3, 4, 5] },
    { id: 5, title: "Examination & Marks", icon: "BarChart3", path: "/marks", parentId: 2, sortOrder: 3, roleIds: [1, 2, 3, 4, 5] },
       { id: 6, title: "Staff & HR", icon: "Users", path: null, parentId: null, sortOrder: 3, roleIds: [1, 2] },
    { id: 7, title: "Staff Directory", icon: "UserCheck", path: "/staff", parentId: 6, sortOrder: 1, roleIds: [1, 2] },
    { id: 24, title: "Manage Users", icon: "UserPlus", path: "/configuration/users", parentId: 6, sortOrder: 2, roleIds: [1, 2] },
    
    { id: 8, title: "Administrative", icon: "ShieldCheck", path: null, parentId: null, sortOrder: 4, roleIds: [1, 2, 3, 4, 5] },
    { id: 9, title: "Fee Management", icon: "CreditCard", path: "/fees", parentId: 8, sortOrder: 1, roleIds: [1, 2, 5] },
    { id: 10, title: "Communication Hub", icon: "MessageSquare", path: "/messages", parentId: 8, sortOrder: 2, roleIds: [1, 2, 3, 4, 5] },
    
    { id: 11, title: "Masters & Config", icon: "Database", path: "/configuration", parentId: null, sortOrder: 5, roleIds: [1, 2] },
    { id: 12, title: "Global Schools", icon: "School", path: "/configuration/schools", parentId: 11, sortOrder: 1, roleIds: [1, 2] },
    { id: 13, title: "Access Control (RBAC)", icon: "ShieldCheck", path: null, parentId: 11, sortOrder: 2, roleIds: [1, 2] },
    { id: 14, title: "Role Master", icon: "Shield", path: "/configuration/role-master", parentId: 13, sortOrder: 1, roleIds: [1, 2] },
    { id: 15, title: "User Accounts", icon: "UserCheck", path: "/configuration/role-assignment", parentId: 13, sortOrder: 2, roleIds: [1, 2] },
    
    { id: 16, title: "Menu Designer", icon: "Layout", path: null, parentId: 11, sortOrder: 3, roleIds: [1, 2] },
    { id: 17, title: "Navigation Builder", icon: "LayoutGrid", path: "/configuration/navigation", parentId: 16, sortOrder: 1, roleIds: [1, 2] },
    
    { id: 18, title: "Academic Masters", icon: "BookOpen", path: null, parentId: 11, sortOrder: 4, roleIds: [1, 2] },
    { id: 19, title: "Standards & Grades", icon: "Layers", path: "/configuration/standards", parentId: 18, sortOrder: 1, roleIds: [1, 2] },
    { id: 20, title: "Divisions/Sections", icon: "Hash", path: "/configuration/sections", parentId: 18, sortOrder: 2, roleIds: [1, 2] },
    { id: 21, title: "Academic Years", icon: "Calendar", path: "/configuration/academic-years", parentId: 18, sortOrder: 3, roleIds: [1, 2] },
    { id: 22, title: "Subject Registry", icon: "BookOpen", path: "/configuration/subjects", parentId: 18, sortOrder: 4, roleIds: [1, 2] },
 
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
    
    { id: 23, title: "System Audit", icon: "Terminal", path: "/system-logs", parentId: null, sortOrder: 6, roleIds: [1] },
  ],
  "/notifications": [
    { id: 1, title: "System Update", message: "New academic module is live.", type: "info", isRead: false, createdAt: new Date().toISOString() },
    { id: 2, title: "Fee Reminder", message: "Late fee applies after 30th May.", type: "warning", isRead: true, createdAt: new Date().toISOString() }
  ],
  "/messages": [
    { id: 1, senderId: 1, receiverId: 2, subject: "Meeting Invitation", content: "Let's discuss the new curriculum.", isRead: false, type: "Direct", createdAt: new Date().toISOString() },
    { id: 2, senderId: 2, receiverId: 1, subject: "Re: Meeting Invitation", content: "Sure, let's meet tomorrow.", isRead: true, type: "Direct", createdAt: new Date().toISOString() }
  ],
  "/auditlogs": [
    { id: 1, userId: "1", type: "Update", tableName: "Students", dateTime: new Date().toISOString(), primaryKey: "1" },
  ],
  "/errorlogs": [
    { id: 1, message: "Demo Error Log", level: "Error", timestamp: new Date().toISOString(), exception: null, properties: "" },
  ],
  "/masters/roles": [
    { id: 1, name: "Super Admin", description: "Full system access", isActive: true },
    { id: 2, name: "Admin", description: "School-level administrative access", isActive: true },
    { id: 3, name: "Teacher", description: "Academic and attendance access", isActive: true },
    { id: 4, name: "Student", description: "Student-level access", isActive: true },
    { id: 5, name: "Parent", description: "Parent-level access", isActive: true },
  ],
  "/staff": [
    { id: 1, userId: 2, schoolId: 1, name: "John Doe", employeeId: "EMP001", initials: "Mr.", status: "Active", contactNumber: "9876543210" }
  ],
  "/users": [
    { id: 1, fullName: "Super Admin", username: "admin", role: "superadmin" },
    { id: 2, fullName: "John Doe", username: "teacher1", role: "teacher" },
  ],
  "/auth/login": {
    token: "demo-token",
    user: {
      id: 1,
      fullName: "Super Admin",
      username: "admin",
      role: "superadmin",
      schoolId: null,
      academicYearId: 2
    }
  }
};

// Add request interceptor to automatically inject Authorization header
api.interceptors.request.use(
  (config) => {
    try {
      const savedUserStr = localStorage.getItem("user");
      let token = localStorage.getItem("token");
      
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser && savedUser.token) {
          token = savedUser.token;
        }
      }
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Error setting Authorization header:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for 401 Unauthorized - Session expired or invalid token
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or unauthorized (401). Redirecting to login...");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login?expired=true";
      }
      return Promise.reject(error);
    }

    const isNetworkError = error.message?.includes("Network Error") || 
                           error.code === "ECONNABORTED" || 
                           error.message?.includes("ERR_CONNECTION_REFUSED");
    const isServerError = error.response && error.response.status >= 500;
    const isNotFound = error.response && error.response.status === 404;

    if ((isNetworkError || isNotFound || isServerError) && error.config?.method?.toLowerCase() === 'get') {
      const configUrl = error.config?.url || "";
      const urlWithPrefix = configUrl.split("?")[0];
      
      // Better URL parsing to extract the relative path
      let url = urlWithPrefix;
      
      // If the URL starts with the base URL, strip it
      if (API_BASE_URL && url.startsWith(API_BASE_URL)) {
        url = url.substring(API_BASE_URL.length);
      } 
      // Fallback for cases where baseURL might not be exactly matching due to protocol differences etc
      else if (url.includes("/api/")) {
        url = url.substring(url.indexOf("/api/") + 4);
      } else if (url.startsWith("/api")) {
        url = url.substring(4);
      }
      
      // Clean up leading/trailing slashes for matching
      const cleanUrl = "/" + url.replace(/^\/+/, "").replace(/\/+$/, "");
      
      console.warn(
        `Backend connection issue at [${configUrl}]. Using demo fallback data for path: ${cleanUrl}`
      );

      // Try exact match in fallbacks
      let mockKey = Object.keys(mockFallbacks).find(key => 
        cleanUrl === key || cleanUrl === key + "/" || "/" + cleanUrl === key
      );
      
      if (!mockKey) {
        mockKey = Object.keys(mockFallbacks).find(key => cleanUrl.startsWith(key));
      }

      if (mockKey) {
        const mockData = mockFallbacks[mockKey];
        // Wrap in { data: [...] } for specific paths
        const needsDataWrap = cleanUrl.includes("/masters/") || 
                            ["/schools", "/users", "/navigation", "/teachers", "/staff", "/students", "/attendance", "/notifications", "/messages", "/auditlogs", "/errorlogs"].some(p => cleanUrl.startsWith(p));
        
        const finalResponseData = needsDataWrap ? { data: mockData } : mockData;
          
        return Promise.resolve({ data: finalResponseData });
      }
    }
    return Promise.reject(error);
  },
);

// Generic Paginated Params
export interface PaginatedParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  [key: string]: unknown;
}

type ApiObject = Record<string, unknown>;

export interface LoginRequest {
  username: string;
  password: string;
  role?: string;
  schoolId?: number;
}

export interface StudentWriteRequest extends ApiObject {}
export interface SchoolWriteRequest extends ApiObject {}
export interface TeacherWriteRequest extends ApiObject {}
export interface MasterWriteRequest extends ApiObject {}
export interface NavigationWriteRequest extends ApiObject {}
export interface MessageWriteRequest extends ApiObject {}
export interface UserWriteRequest extends ApiObject {}
export type AttendanceWriteRequest = ApiObject | ApiObject[];

// Generic CRUD operations
export const apiService = {
  // Auth
  login: (credentials: LoginRequest) => api.post("/auth/login", credentials),
  forgotPassword: (username: string) =>
    api.post("/auth/forgot-password", { username }),

  // Students
  getStudents: (schoolId?: number, academicYearId?: number, params?: PaginatedParams) =>
    api.get("/students", { params: { schoolId, academicYearId, ...params } }),
  getStudentById: (id: number) => api.get(`/students/${id}`),
  createStudent: (data: StudentWriteRequest) => api.post("/students", data),
  bulkCreateStudents: (data: StudentWriteRequest[]) => api.post("/students/bulk", data),
  updateStudent: (id: number, data: StudentWriteRequest) => api.put(`/students/${id}`, data),
  deleteStudent: (id: number) => api.delete(`/students/${id}`),
  exportStudents: (schoolId?: number) => api.get("/students/export", { params: { schoolId }, responseType: 'blob' }),
  getStudentSampleTemplate: () => api.get("/students/sample-template", { responseType: 'blob' }),
  uploadStudentPhoto: (id: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    // Explicitly set headers to null/undefined to let browser/axios set boundary for multipart
    return api.post(`/students/${id}/photo`, formData, {
      headers: {
        "Content-Type": undefined, 
      },
    });
  },

  // Marks
  getMarks: (schoolId?: number, academicYearId?: number, params?: PaginatedParams) => api.get("/marks", { params: { schoolId, academicYearId, ...params } }),

  // Schools
  getSchools: (params?: PaginatedParams) => api.get("/schools", { params }),
  getSchoolById: (id: number) => api.get(`/schools/${id}`),
  createSchool: (data: SchoolWriteRequest) => api.post("/schools", data),
  updateSchool: (id: number, data: SchoolWriteRequest) => api.put(`/schools/${id}`, data),
  deleteSchool: (id: number) => api.delete(`/schools/${id}`),
  uploadSchoolPhoto: (id: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/schools/${id}/photo`, formData, {
      headers: {
        "Content-Type": undefined,
      },
    });
  },

  // Staff Management
  getStaff: (schoolId?: number, academicYearId?: number, params?: PaginatedParams) =>
    api.get("/staff", { params: { schoolId, academicYearId, ...params } }),
  createStaff: (data: ApiObject) => api.post("/staff", data),
  updateStaff: (id: number, data: ApiObject) => api.put(`/staff/${id}`, data),
  deleteStaff: (id: number) => api.delete(`/staff/${id}`),
  bulkUploadStaff: (data: any[], schoolId: number, academicYearId: number, createdBy?: string) =>
    api.post("/staff/bulk-upload", data, { params: { schoolId, academicYearId, createdBy } }),
  uploadStaffPhoto: (id: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/staff/${id}/photo`, formData, {
      headers: {
        "Content-Type": undefined,
      },
    });
  },

  // Teachers (backward compatibility aliases)
  getTeachers: (schoolId?: number, academicYearId?: number, params?: PaginatedParams) =>
    api.get("/staff", { params: { schoolId, academicYearId, ...params } }),
  createTeacher: (data: TeacherWriteRequest) => api.post("/staff", data),
  updateTeacher: (id: number, data: TeacherWriteRequest) => api.put(`/staff/${id}`, data),
  deleteTeacher: (id: number) => api.delete(`/staff/${id}`),
  uploadTeacherPhoto: (id: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/staff/${id}/photo`, formData, {
      headers: {
        "Content-Type": undefined,
      },
    });
  },

  // Stats
  getStats: (schoolId?: number, academicYearId?: number) => api.get("/stats", { params: { schoolId, academicYearId } }),

  // Attendance
  getAttendance: (date: string, schoolId?: number, academicYearId?: number, params?: PaginatedParams) =>
    api.get("/attendance", { params: { date, schoolId, academicYearId, ...params } }),
  markAttendance: (data: AttendanceWriteRequest) => {
    if (Array.isArray(data)) {
      return api.post("/attendance/bulk", data);
    }
    return api.post("/attendance", data);
  },
  getIodataRecords: (date?: string, page?: number, pageSize?: number, paged?: boolean) => api.get("/attendance/iodata", { params: { date, page, pageSize, paged } }),
  // Increased timeout config specifically to 10 minutes (600000ms) due to large volume of files and synchronous file/database processing
  processIodataRange: (fromDate: string, toDate: string) => api.post("/attendance/iodata/process-range", null, { params: { fromDate, toDate }, timeout: 600000 }),
  enqueueIodataLines: (lines: string[]) => api.post("/attendance/iodata/enqueue", lines),
  reprocessIodata: (id: number) => api.post(`/attendance/iodata/reprocess/${id}`),
  processSingleIodataLine: (line: string) => api.post("/attendance/iodata/process-single", line),
  processImmediateLines: (date: string, lines: string[], wipeTargetDate?: boolean) => api.post("/attendance/iodata/process-immediate-lines", { date, lines, wipeTargetDate }),
  readServerFile: (date: string) => api.get("/attendance/iodata/read-server-file", { params: { date } }),

  // Fees
  getFees: (schoolId?: number, academicYearId?: number, params?: PaginatedParams) => api.get("/fees", { params: { schoolId, academicYearId, ...params } }),

  // System Logs
  getAuditLogs: (params?: PaginatedParams) => api.get("/auditlogs", { params }),
  getErrorLogs: (params?: PaginatedParams) => api.get("/errorlogs", { params }),
  clearErrorLogs: () => api.delete("/errorlogs/clear"),
  getFileSystemLogs: (params?: PaginatedParams) => api.get("/errorlogs/filesystem", { params }),
  getDbScript: () => api.get("/database/script"),
  getSeedScript: () => api.get("/database/seed"),

  // Master Data (Configuration)
  getStandards: (params?: PaginatedParams) => api.get("/masters/standards", { params }),
  createStandard: (data: MasterWriteRequest) => api.post("/masters/standards", data),
  updateStandard: (id: number, data: MasterWriteRequest) => api.put(`/masters/standards/${id}`, data),
  deleteStandard: (id: number) => api.delete(`/masters/standards/${id}`),

  getSections: (params?: PaginatedParams) => api.get("/masters/sections", { params }),
  createSection: (data: MasterWriteRequest) => api.post("/masters/sections", data),
  updateSection: (id: number, data: MasterWriteRequest) => api.put(`/masters/sections/${id}`, data),
  deleteSection: (id: number) => api.delete(`/masters/sections/${id}`),

  getAcademicYears: (params?: PaginatedParams) => api.get("/masters/academic-years", { params }),
  createAcademicYear: (data: MasterWriteRequest) => api.post("/masters/academic-years", data),
  updateAcademicYear: (id: number, data: MasterWriteRequest) => api.put(`/masters/academic-years/${id}`, data),
  deleteAcademicYear: (id: number) => api.delete(`/masters/academic-years/${id}`),

  getCastes: (params?: PaginatedParams) => api.get("/masters/castes", { params }),
  createCaste: (data: MasterWriteRequest) => api.post("/masters/castes", data),
  updateCaste: (id: number, data: MasterWriteRequest) => api.put(`/masters/castes/${id}`, data),
  deleteCaste: (id: number) => api.delete(`/masters/castes/${id}`),

  getSubCastes: (params?: PaginatedParams) => api.get("/masters/sub-castes", { params }),
  createSubCaste: (data: MasterWriteRequest) => api.post("/masters/sub-castes", data),
  updateSubCaste: (id: number, data: MasterWriteRequest) => api.put(`/masters/sub-castes/${id}`, data),
  deleteSubCaste: (id: number) => api.delete(`/masters/sub-castes/${id}`),

  getReligions: (params?: PaginatedParams) => api.get("/masters/religions", { params }),
  createReligion: (data: MasterWriteRequest) => api.post("/masters/religions", data),
  updateReligion: (id: number, data: MasterWriteRequest) => api.put(`/masters/religions/${id}`, data),
  deleteReligion: (id: number) => api.delete(`/masters/religions/${id}`),

  getSchoolSections: (params?: PaginatedParams) => api.get("/masters/school-sections", { params }),
  createSchoolSection: (data: MasterWriteRequest) => api.post("/masters/school-sections", data),
  updateSchoolSection: (id: number, data: MasterWriteRequest) => api.put(`/masters/school-sections/${id}`, data),
  deleteSchoolSection: (id: number) => api.delete(`/masters/school-sections/${id}`),

  getStaffInitials: (params?: PaginatedParams) => api.get("/masters/staff-initials", { params }),
  createStaffInitial: (data: MasterWriteRequest) => api.post("/masters/staff-initials", data),
  updateStaffInitial: (id: number, data: MasterWriteRequest) => api.put(`/masters/staff-initials/${id}`, data),
  deleteStaffInitial: (id: number) => api.delete(`/masters/staff-initials/${id}`),

  getStates: (params?: PaginatedParams) => api.get("/masters/states", { params }),
  createState: (data: MasterWriteRequest) => api.post("/masters/states", data),
  updateState: (id: number, data: MasterWriteRequest) => api.put(`/masters/states/${id}`, data),
  deleteState: (id: number) => api.delete(`/masters/states/${id}`),

  getCities: (params?: PaginatedParams) => api.get("/masters/cities", { params }),
  createCity: (data: MasterWriteRequest) => api.post("/masters/cities", data),
  updateCity: (id: number, data: MasterWriteRequest) => api.put(`/masters/cities/${id}`, data),
  deleteCity: (id: number) => api.delete(`/masters/cities/${id}`),

  getBloodGroups: (params?: PaginatedParams) => api.get("/masters/blood-groups", { params }),
  createBloodGroup: (data: MasterWriteRequest) => api.post("/masters/blood-groups", data),
  updateBloodGroup: (id: number, data: MasterWriteRequest) => api.put(`/masters/blood-groups/${id}`, data),
  deleteBloodGroup: (id: number) => api.delete(`/masters/blood-groups/${id}`),

  getHouses: (params?: PaginatedParams) => api.get("/masters/houses", { params }),
  createHouse: (data: MasterWriteRequest) => api.post("/masters/houses", data),
  updateHouse: (id: number, data: MasterWriteRequest) => api.put(`/masters/houses/${id}`, data),
  deleteHouse: (id: number) => api.delete(`/masters/houses/${id}`),

  getAdmissionTypes: (params?: PaginatedParams) => api.get("/masters/admission-types", { params }),
  createAdmissionType: (data: MasterWriteRequest) => api.post("/masters/admission-types", data),
  updateAdmissionType: (id: number, data: MasterWriteRequest) => api.put(`/masters/admission-types/${id}`, data),
  deleteAdmissionType: (id: number) => api.delete(`/masters/admission-types/${id}`),

  getCategories: (params?: PaginatedParams) => api.get("/masters/categories", { params }),
  createCategory: (data: MasterWriteRequest) => api.post("/masters/categories", data),
  updateCategory: (id: number, data: MasterWriteRequest) => api.put(`/masters/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/masters/categories/${id}`),

  getSessions: (params?: PaginatedParams) => api.get("/masters/sessions", { params }),
  createSession: (data: MasterWriteRequest) => api.post("/masters/sessions", data),
  updateSession: (id: number, data: MasterWriteRequest) => api.put(`/masters/sessions/${id}`, data),
  deleteSession: (id: number) => api.delete(`/masters/sessions/${id}`),

  getBatches: (params?: PaginatedParams) => api.get("/masters/batches", { params }),
  createBatch: (data: MasterWriteRequest) => api.post("/masters/batches", data),
  updateBatch: (id: number, data: MasterWriteRequest) => api.put(`/masters/batches/${id}`, data),
  deleteBatch: (id: number) => api.delete(`/masters/batches/${id}`),

  getShifts: (params?: PaginatedParams) => api.get("/masters/shifts", { params }),
  createShift: (data: MasterWriteRequest) => api.post("/masters/shifts", data),
  updateShift: (id: number, data: MasterWriteRequest) => api.put(`/masters/shifts/${id}`, data),
  deleteShift: (id: number) => api.delete(`/masters/shifts/${id}`),

  getWeekdays: (params?: PaginatedParams) => api.get("/masters/weekdays", { params }),
  createWeekday: (data: MasterWriteRequest) => api.post("/masters/weekdays", data),
  updateWeekday: (id: number, data: MasterWriteRequest) => api.put(`/masters/weekdays/${id}`, data),
  deleteWeekday: (id: number) => api.delete(`/masters/weekdays/${id}`),

  getHolidays: (params?: PaginatedParams) => api.get("/masters/holidays", { params }),
  createHoliday: (data: MasterWriteRequest) => api.post("/masters/holidays", data),
  updateHoliday: (id: number, data: MasterWriteRequest) => api.put(`/masters/holidays/${id}`, data),
  deleteHoliday: (id: number) => api.delete(`/masters/holidays/${id}`),

  getSubjects: (params?: PaginatedParams) => api.get("/masters/subjects", { params }),
  createSubject: (data: MasterWriteRequest) => api.post("/masters/subjects", data),
  updateSubject: (id: number, data: MasterWriteRequest) => api.put(`/masters/subjects/${id}`, data),
  deleteSubject: (id: number) => api.delete(`/masters/subjects/${id}`),

  getExamTypes: (params?: PaginatedParams) => api.get("/masters/exam-types", { params }),
  createExamType: (data: MasterWriteRequest) => api.post("/masters/exam-types", data),
  updateExamType: (id: number, data: MasterWriteRequest) => api.put(`/masters/exam-types/${id}`, data),
  deleteExamType: (id: number) => api.delete(`/masters/exam-types/${id}`),

  getDesignations: (params?: PaginatedParams) => api.get("/masters/designations", { params }),
  createDesignation: (data: MasterWriteRequest) => api.post("/masters/designations", data),
  updateDesignation: (id: number, data: MasterWriteRequest) => api.put(`/masters/designations/${id}`, data),
  deleteDesignation: (id: number) => api.delete(`/masters/designations/${id}`),

  getOccupations: (params?: PaginatedParams) => api.get("/masters/occupations", { params }),
  createOccupation: (data: MasterWriteRequest) => api.post("/masters/occupations", data),
  updateOccupation: (id: number, data: MasterWriteRequest) => api.put(`/masters/occupations/${id}`, data),
  deleteOccupation: (id: number) => api.delete(`/masters/occupations/${id}`),

  // Roles
  getRoles: (params?: PaginatedParams) => api.get("/masters/roles", { params }),
  createRole: (data: MasterWriteRequest) => api.post("/masters/roles", data),
  updateRole: (id: number, data: MasterWriteRequest) => api.put(`/masters/roles/${id}`, data),
  deleteRole: (id: number) => api.delete(`/masters/roles/${id}`),

  // Navigation (Sidebar)
  getNavigations: (roleId?: number, params?: PaginatedParams) => api.get("/navigation", { params: { roleId, ...params } }),
  createNavigation: (data: NavigationWriteRequest) => api.post("/navigation", data),
  updateNavigation: (id: number, data: NavigationWriteRequest) => api.put(`/navigation/${id}`, data),
  deleteNavigation: (id: number) => api.delete(`/navigation/${id}`),

  // Notifications
  getNotifications: (params?: { userId?: number; role?: string; schoolId?: number } & PaginatedParams) => api.get("/notifications", { params }),
  createNotification: (data: any) => api.post("/notifications", data),
  markNotificationRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllNotificationsRead: (params?: { userId?: number; roleId?: number; schoolId?: number }) => api.put("/notifications/read-all", null, { params }),
  deleteNotification: (id: number) => api.delete(`/notifications/${id}`),

  // Communications
  getMessages: (params?: { userId?: number; type?: string } & PaginatedParams) => api.get("/messages", { params }),
  getMessageById: (id: number) => api.get(`/messages/${id}`),
  sendMessage: (data: MessageWriteRequest) => api.post("/messages", data),
  deleteMessage: (id: number) => api.delete(`/messages/${id}`),
  markMessageRead: (id: number) => api.put(`/messages/${id}/read`),

  // Users (for Role Assignment & Management)
  getUsers: (params?: PaginatedParams) => api.get("/users", { params }),
  createUser: (data: UserWriteRequest) => api.post("/users", data),
  updateUser: (id: number, data: UserWriteRequest) => api.put(`/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/users/${id}`),
  updateUserRole: (userId: number, role: string) => api.put(`/users/${userId}/role`, { role }),
};

export default api;

