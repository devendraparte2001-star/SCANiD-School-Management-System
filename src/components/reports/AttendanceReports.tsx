import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FileText, Users, Download, Printer, Search, CheckCircle, 
  XCircle, Clock, AlertTriangle, Activity, Filter, Loader2, BarChart2,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";

interface AttendanceReportsProps {
  students: any[];
  staffList: any[];
  standards?: any[];
  sections?: any[];
  schools?: any[];
  selectedSchoolId?: string;
  user: any;
}

type ReportCategory = "student" | "staff";

type StudentReportType = 
  | "daily_attendance" 
  | "monthly_attendance" 
  | "class_student_wise" 
  | "defaulter_list";

type StaffReportType = 
  | "daily_monthly" 
  | "late_arrival" 
  | "early_goer" 
  | "missing_punch" 
  | "department_summary";

export default function AttendanceReports({
  students = [],
  staffList = [],
  standards = [],
  sections = [],
  schools = [],
  selectedSchoolId = "1",
  user
}: AttendanceReportsProps) {
  // Navigation & Category States
  const [activeCategory, setActiveCategory] = useState<ReportCategory>("student");
  const [studentReport, setStudentReport] = useState<StudentReportType>("daily_attendance");
  const [staffReport, setStaffReport] = useState<StaffReportType>("daily_monthly");

  // Filters state
  const [selectedStandard, setSelectedStandard] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");
  const [reportDate, setReportDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [reportMonth, setReportMonth] = useState<string>(format(new Date(), "MM"));
  const [reportYear, setReportYear] = useState<string>(format(new Date(), "yyyy"));
  const [defaulterThreshold, setDefaulterThreshold] = useState<number>(75);
  
  // Server-side Pagination, Sorting and Filtering States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [hasQueried, setHasQueried] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Default selection synchronization to clear state when filters shift
  useEffect(() => {
    setReportData([]);
    setHasQueried(false);
    setPage(1);
    setSortBy("");
    setSortOrder("asc");
  }, [activeCategory, studentReport, staffReport, selectedStandard, selectedSection, reportDate, reportMonth, reportYear, selectedStudentId, selectedStaffId, defaulterThreshold]);

  // Generate and fetch reports dynamically via the backend Reports API
  const handleGenerateReport = async (targetPage = 1) => {
    setIsGenerating(true);
    try {
      const response = await axios.get("/api/reports", {
        params: {
          category: activeCategory,
          reportType: activeCategory === "student" ? studentReport : staffReport,
          standard: selectedStandard,
          section: selectedSection,
          studentId: selectedStudentId,
          staffId: selectedStaffId,
          date: reportDate,
          month: reportMonth,
          year: reportYear,
          threshold: defaulterThreshold,
          search: searchQuery,
          sortBy: sortBy,
          sortOrder: sortOrder,
          page: targetPage,
          pageSize: pageSize
        }
      });

      if (response.data) {
        setReportData(response.data.data || []);
        setTotalCount(response.data.totalCount || 0);
        setTotalPages(response.data.totalPages || 1);
        setPage(response.data.page || 1);
        setHasQueried(true);
        toast.success("Security Report logs updated and synthesized successfully!");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to query records: " + (e?.response?.data?.error || e.message));
    } finally {
      setIsGenerating(false);
    }
  };

  // Re-fetch automatically when sorting, page, or search query is confirmed
  useEffect(() => {
    if (hasQueried) {
      handleGenerateReport(page);
    }
  }, [sortBy, sortOrder, page, pageSize]);

  const handleSort = (field: string) => {
    const order = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setPage(1);
      handleGenerateReport(1);
    }
  };

  // CSV Exporter Simulation
  const handleExportCSV = () => {
    if (reportData.length === 0) {
      toast.error("Generate a report first before attempting data exports.");
      return;
    }

    const headers = Object.keys(reportData[0]).join(",");
    const rows = reportData.map(obj => 
      Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeCategory}_attendance_${studentReport || staffReport}_${format(new Date(), "yyyy_MM_dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file exported successfully!");
  };

  const handlePrint = () => {
    if (reportData.length === 0) {
      toast.error("Please generate the report before printing.");
      return;
    }
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
      
      {/* Sidebar Report Selectors */}
      <Card className="lg:col-span-1 border-none shadow-sm bg-white rounded-[2rem] overflow-hidden p-6 gap-6 flex flex-col h-fit">
        
        {/* Category Switch - Flex col to sm:flex-row handles scaling elegantly without overlapping */}
        <div className="flex flex-col sm:flex-row gap-1 bg-slate-100 p-1.5 rounded-2xl w-full border border-slate-200">
          <button
            onClick={() => { setActiveCategory("student"); setReportData([]); }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all tracking-wider text-center ${
              activeCategory === "student" 
                ? "bg-white text-slate-800 shadow-sm border border-slate-100" 
                : "text-slate-400 hover:text-slate-800"
            }`}
          >
            Students
          </button>
          <button
            onClick={() => { setActiveCategory("staff"); setReportData([]); }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all tracking-wider text-center ${
              activeCategory === "staff" 
                ? "bg-white text-slate-800 shadow-sm border border-slate-100" 
                : "text-slate-400 hover:text-slate-800"
            }`}
          >
            Staff / Faculty
          </button>
        </div>

        {/* Report List */}
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block px-1 mb-2">Available Reports</span>
          {activeCategory === "student" ? (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setStudentReport("daily_attendance")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                  studentReport === "daily_attendance" 
                    ? "bg-emerald-50 text-emerald-850 hover:bg-emerald-50 font-black" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${studentReport === "daily_attendance" ? "bg-emerald-250 text-emerald-800" : "bg-slate-100 text-slate-500"}`}><FileText size={12} /></div>
                Daily Attendance
              </button>
              <button
                onClick={() => setStudentReport("monthly_attendance")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                  studentReport === "monthly_attendance" 
                    ? "bg-emerald-50 text-emerald-850 hover:bg-emerald-50 font-black" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${studentReport === "monthly_attendance" ? "bg-emerald-250 text-emerald-800" : "bg-slate-100 text-slate-500"}`}><BarChart2 size={12} /></div>
                Monthly Attendance
              </button>
              <button
                onClick={() => setStudentReport("class_student_wise")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                  studentReport === "class_student_wise" 
                    ? "bg-emerald-50 text-emerald-850 hover:bg-emerald-50 font-black" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${studentReport === "class_student_wise" ? "bg-emerald-250 text-emerald-800" : "bg-slate-100 text-slate-500"}`}><Users size={12} /></div>
                Class / Student Wise
              </button>
              <button
                onClick={() => setStudentReport("defaulter_list")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                  studentReport === "defaulter_list" 
                    ? "bg-emerald-50 text-emerald-850 hover:bg-emerald-50 font-black" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${studentReport === "defaulter_list" ? "bg-emerald-250 text-emerald-800" : "bg-slate-100 text-slate-500"}`}><AlertTriangle size={12} /></div>
                Defaulters List (&lt;75%)
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setStaffReport("daily_monthly")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                  staffReport === "daily_monthly" 
                    ? "bg-blue-50 text-blue-800 hover:bg-blue-50 font-black" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${staffReport === "daily_monthly" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}><FileText size={12} /></div>
                Daily/Monthly Presence
              </button>
              <button
                onClick={() => setStaffReport("late_arrival")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                  staffReport === "late_arrival" 
                    ? "bg-blue-50 text-blue-800 hover:bg-blue-50 font-black" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${staffReport === "late_arrival" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}><Clock size={12} /></div>
                Late Arrival Records
              </button>
              <button
                onClick={() => setStaffReport("early_goer")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                  staffReport === "early_goer" 
                    ? "bg-blue-50 text-blue-800 hover:bg-blue-50 font-black" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${staffReport === "early_goer" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}><AlertTriangle size={12} /></div>
                Early Goers Report
              </button>
              <button
                onClick={() => setStaffReport("missing_punch")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                  staffReport === "missing_punch" 
                    ? "bg-blue-50 text-blue-800 hover:bg-blue-50 font-black" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${staffReport === "missing_punch" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}><XCircle size={12} /></div>
                Missing Punch Report
              </button>
              <button
                onClick={() => setStaffReport("department_summary")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                  staffReport === "department_summary" 
                    ? "bg-blue-50 text-blue-800 hover:bg-blue-50 font-black" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${staffReport === "department_summary" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}><Activity size={12} /></div>
                Department Summary (New)
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Report filter & result board - Spans 3 columns of the outer container */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Dynamic Filters Card */}
        <Card className="border-none shadow-sm bg-white rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
            <Filter size={14} className="text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Filter Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
            
            {/* SCHOOL & CLASS FILTERS (STUDENTS) */}
            {activeCategory === "student" && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class / Standard</label>
                  <Select value={selectedStandard} onValueChange={setSelectedStandard}>
                    <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200">
                      <SelectValue placeholder="All Classes">
                        {selectedStandard === "all" ? "All Classes" : selectedStandard}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {standards.map(st => (
                        <SelectItem key={st.id} value={st.name}>{st.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Section / division</label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200">
                      <SelectValue placeholder="All Sections">
                        {selectedSection === "all" ? "All Sections" : `Section ${selectedSection}`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map(sc => (
                        <SelectItem key={sc.id} value={sc.name}>Section {sc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* STUDENT SPECIFIC LOOKUP */}
            {activeCategory === "student" && studentReport === "class_student_wise" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose Student</label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Student">
                      {selectedStudentId === "all" 
                        ? "Select Primary Student" 
                        : (students.find(s => s.id.toString() === selectedStudentId)?.name || "Select Student")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Primary Student</SelectItem>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name || s.fullName} ({s.grNo})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* DEFAULTER MARGIN SPECIFIC */}
            {activeCategory === "student" && studentReport === "defaulter_list" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absence Threshold (%)</label>
                <Input 
                  type="number" 
                  className="h-10 text-xs rounded-xl border-slate-200 font-extrabold" 
                  value={defaulterThreshold} 
                  onChange={e => setDefaulterThreshold(Math.max(1, Math.min(100, parseInt(e.target.value) || 75)))} 
                />
              </div>
            )}

            {/* STAFF DIRECTORY SPECIFIC */}
            {activeCategory === "staff" && staffReport !== "department_summary" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff Roster</label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200">
                    <SelectValue placeholder="Wipe & View All Staff">
                      {selectedStaffId === "all" 
                        ? "Wipe & View All Staff" 
                        : (staffList.find(s => s.id?.toString() === selectedStaffId)?.name || staffList.find(s => s.id?.toString() === selectedStaffId)?.user?.name || "Select Staff")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wipe & View All Staff</SelectItem>
                    {staffList.map(s => (
                      <SelectItem key={s.id} value={s.id?.toString()}>{s.name || s.user?.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* DATE SELECTORS BASED ON DYNAMIC CHOICES */}
            {(studentReport === "daily_attendance" || staffReport === "late_arrival" || staffReport === "early_goer" || staffReport === "missing_punch") && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Date</label>
                <Input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="h-10 text-xs rounded-xl border-slate-200" />
              </div>
            )}

            {/* MONTH SELECTOR FOR AGGREGATES */}
            {(studentReport === "monthly_attendance" || studentReport === "class_student_wise" || staffReport === "daily_monthly" || staffReport === "department_summary") && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Schedule Month</label>
                  <Select value={reportMonth} onValueChange={setReportMonth}>
                    <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200">
                      <SelectValue>
                        {(() => {
                          const parsed = parseInt(reportMonth);
                          if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
                            return format(new Date(2026, parsed - 1), "MMMM");
                          }
                          return "June";
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((val, idx) => (
                        <SelectItem key={val} value={val}>{format(new Date(2026, idx), "MMMM")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Schedule Year</label>
                  <Select value={reportYear} onValueChange={setReportYear}>
                    <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200">
                      <SelectValue>
                        {reportYear}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Action Trigger Button - Explicitly styled to avoid overlapping */}
            <div className="sm:col-span-1 min-w-[140px]">
              <Button 
                onClick={() => handleGenerateReport(1)} 
                disabled={isGenerating} 
                className="w-full h-10 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Search size={14} />}
                {isGenerating ? "Synthesizing..." : "Query Registry"}
              </Button>
            </div>

          </div>
        </Card>

        {/* Dynamic Preview Card */}
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden min-h-[400px]">
          <CardHeader className="border-b border-slate-50 flex flex-col md:flex-row md:items-center md:justify-between px-8 py-6 gap-4">
            <div>
              <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                {activeCategory === "student" 
                  ? `${studentReport.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Report`
                  : `${staffReport.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Report`
                }
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Live digital output registry for security records</CardDescription>
            </div>

            {/* Search Input bar & Export buttons block */}
            <div className="flex flex-wrap items-center gap-2">
              {hasQueried && (
                <div className="relative mr-2">
                  <Input 
                    type="text" 
                    placeholder="Search query..." 
                    className="h-8 text-xs rounded-xl border-slate-200 font-semibold w-44 pl-8"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                  />
                  <Search size={12} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrint} 
                disabled={reportData.length === 0} 
                className="h-8 text-xs font-bold rounded-lg hover:bg-slate-50 border-slate-200"
              >
                <Printer size={12} className="mr-1.5" /> Print
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportCSV} 
                disabled={reportData.length === 0} 
                className="h-8 text-xs font-bold rounded-lg hover:bg-slate-50 border-slate-200"
              >
                <Download size={12} className="mr-1.5" /> CSV Export
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 animate-pulse">
                <Loader2 size={32} className="animate-spin text-emerald-600" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Compiling biometric archives against registries...</span>
              </div>
            ) : reportData.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 border-none">
                        {Object.keys(reportData[0]).map((key) => (
                          <TableHead 
                            key={key} 
                            onClick={() => handleSort(key)}
                            className="text-[10px] font-black uppercase tracking-wider text-slate-400 p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-all select-none"
                          >
                            <div className="flex items-center gap-1.5">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                              {sortBy === key ? (
                                sortOrder === "asc" ? <ArrowUp size={11} className="text-blue-600 font-bold" /> : <ArrowDown size={11} className="text-blue-600 font-bold" />
                              ) : (
                                <ArrowUpDown size={10} className="text-slate-300 opacity-40 hover:opacity-100" />
                              )}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((row, rIdx) => (
                        <TableRow key={rIdx} className="hover:bg-slate-50/50 border-b border-slate-100">
                          {Object.entries(row).map(([key, val]: any, cIdx) => (
                            <TableCell key={cIdx} className="p-4 text-xs font-semibold text-slate-600">
                              {key === "status" || key === "type" ? (
                                <Badge 
                                  variant="outline"
                                  className={cn(
                                    "font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5",
                                    val === "Present" || val === "P" 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                      : val === "Late" || val === "Very Late" || val === "Half-Day / Early"
                                      ? "bg-amber-50 text-amber-700 border-amber-200" 
                                      : "bg-red-50 text-red-700 border-red-200"
                                  )}
                                >
                                  {val}
                                </Badge>
                              ) : (
                                val
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Server-side Pagination Control Bar */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Showing page {page} of {totalPages} ({totalCount} total entries)
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => {
                          setPage(1);
                          handleGenerateReport(1);
                        }}
                        className="h-8 text-xs font-bold rounded-lg border-slate-200"
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => {
                          const prevPage = Math.max(1, page - 1);
                          setPage(prevPage);
                          handleGenerateReport(prevPage);
                        }}
                        className="h-8 text-xs font-bold rounded-lg border-slate-200"
                      >
                        Prev
                      </Button>
                      <span className="px-3 py-1 bg-white text-xs font-extrabold border border-slate-200 rounded-lg text-slate-800">
                        {page}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => {
                          const nextPage = Math.min(totalPages, page + 1);
                          setPage(nextPage);
                          handleGenerateReport(nextPage);
                        }}
                        className="h-8 text-xs font-bold rounded-lg border-slate-200"
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => {
                          const nextPage = totalPages;
                          setPage(nextPage);
                          handleGenerateReport(nextPage);
                        }}
                        className="h-8 text-xs font-bold rounded-lg border-slate-200"
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="bg-slate-100 p-4 rounded-full text-slate-450"><BarChart2 size={32} /></div>
                <div>
                  <h3 className="font-extrabold text-slate-700">No active generated logs</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-1">Select filters above and click 'Query Registry' to fetch report timeline.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
