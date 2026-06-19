import { useState, useEffect } from "react";
import { apiService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Printer, Download, Eye, FileText, ChevronRight, BarChart3, Settings2, Edit3, Loader2, Search, ArrowUpDown } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn, parseSafeInt } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import ReportBuilder from "@/components/reports/ReportBuilder";
import MarksEntry from "@/components/reports/MarksEntry";

import { User as UserType } from "@/types";
import { useSystemLabels } from "@/context/LabelContext";

export default function Marks({ user }: { user: UserType }) {
  const { labels } = useSystemLabels();
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(user.schoolId?.toString() || "");

  useEffect(() => {
    const fetchSchools = async () => {
      if (user.role === "superadmin") {
        try {
          const res = await apiService.getSchools();
          const schoolData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          setSchools(schoolData);
        } catch (error) {
          console.error("Failed to fetch schools", error);
        }
      }
    };
    fetchSchools();
  }, [user.role]);

  useEffect(() => {
    const fetchMarks = async () => {
      setLoading(true);
      try {
        const schoolIdToUse = user.role === "superadmin" ? parseSafeInt(selectedSchoolId) : parseSafeInt(user.schoolId);
        const academicYearIdToUse = parseSafeInt(user.academicYearId);
        const res = await apiService.getMarks(schoolIdToUse, academicYearIdToUse);
        const rawMarks = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        
        // Handle C# backend naming (marksObtained/MarksObtained -> obtMarks, TotalMarks -> totalMarks)
        const mappedMarks = rawMarks.map((m: any) => {
          const studentInfo = m.student || { name: m.StudentName || m.studentName || "Student" };
          const obtained = m.obtMarks !== undefined ? m.obtMarks : 
                           (m.marksObtained !== undefined ? m.marksObtained : 
                           (m.MarksObtained !== undefined ? m.MarksObtained : 0));
          const total = m.totalMarks !== undefined ? m.totalMarks : 
                        (m.TotalMarks !== undefined ? m.TotalMarks : 100);
          return {
            ...m,
            obtMarks: parseFloat(obtained),
            totalMarks: parseFloat(total),
            term: m.term || "Term 1",
            examName: m.examName || m.ExamName || "Periodic Test",
            student: studentInfo
          };
        });
        setMarks(mappedMarks);
      } catch (error) {
        console.error("Marks error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, [user.schoolId, user.academicYearId, user.role, selectedSchoolId]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredMarks = marks.filter(m => {
    const s = m.student || {};
    const studentName = s.name || s.fullName || s.FullName || (s.firstName ? `${s.firstName || ''} ${s.lastName || ''}`.trim() : "") || `${s.FNAME || ''} ${s.LNAME || ''}`.trim() || "";
    const regNo = s.registrationNumber || s.RegistrationNumber || s.GRNO || "";
    const rollNo = s.rollNumber?.toString() || s.RollNumber?.toString() || s.ROLLNO?.toString() || "";
    
    return studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
           rollNo.includes(searchQuery) ||
           m.examName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedMarks = [...filteredMarks].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aValue, bValue;
    
    if (key === 'studentName') {
      aValue = a.student?.name || a.student?.fullName || a.student?.FullName || (a.student?.firstName ? `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.trim() : "") || `${a.student?.FNAME || ''} ${a.student?.LNAME || ''}`.trim() || "";
      bValue = b.student?.name || b.student?.fullName || b.student?.FullName || (b.student?.firstName ? `${b.student?.firstName || ''} ${b.student?.lastName || ''}`.trim() : "") || `${b.student?.FNAME || ''} ${b.student?.LNAME || ''}`.trim() || "";
    } else if (key === 'performance') {
      aValue = a.obtMarks / a.totalMarks;
      bValue = b.obtMarks / b.totalMarks;
    } else {
      aValue = a[key] || "";
      bValue = b[key] || "";
    }

    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="animate-in slide-in-from-bottom-2 duration-700 min-w-0 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-indigo-600 p-4 rounded-[1.25rem] text-white shadow-2xl shadow-indigo-200 transition-transform hover:rotate-3">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">Examination & Marks</h1>
            <p className="text-slate-400 font-bold mt-1 text-xs sm:text-sm uppercase tracking-widest leading-none">Global performance indexing & examination registry</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="recent" className="w-full flex flex-col space-y-8">
        <div className="shrink-0 overflow-x-auto scrollbar-hide border-b border-slate-100 px-1">
          <TabsList className="bg-transparent w-full justify-start rounded-none h-14 p-0 gap-10 min-w-max" variant="line">
            <TabsTrigger 
              value="recent" 
              className="px-0 h-14 rounded-none border-b-[3px] border-transparent data-[active]:border-indigo-600 data-[active]:bg-transparent data-[active]:text-indigo-600 gap-3 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all flex-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none border-t-0 border-x-0 outline-none"
            >
              <BarChart3 size={16} className="stroke-[3]" /> Recent Results
            </TabsTrigger>
            <TabsTrigger 
              value="entry" 
              className="px-0 h-14 rounded-none border-b-[3px] border-transparent data-[active]:border-indigo-600 data-[active]:bg-transparent data-[active]:text-indigo-600 gap-3 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all flex-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none border-t-0 border-x-0 outline-none"
            >
              <Edit3 size={16} className="stroke-[3]" /> Marks Entry
            </TabsTrigger>
            {(user.role === "superadmin" || user.role === "admin") && (
              <TabsTrigger 
                value="builder" 
                className="px-0 h-14 rounded-none border-b-[3px] border-transparent data-[active]:border-indigo-600 data-[active]:bg-transparent data-[active]:text-indigo-600 gap-3 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all flex-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none border-t-0 border-x-0 outline-none"
              >
                <Settings2 size={16} className="stroke-[3]" /> Report Builder
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="recent" className="space-y-8 focus-visible:outline-none">
          {user.role === "superadmin" && (
            <Card className="border-none shadow-3xl shadow-indigo-100/40 bg-white rounded-[2rem] overflow-hidden mb-2 transition-all hover:shadow-indigo-200/50 group">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                    <Settings2 size={22} className="stroke-[2.5]" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">Global Session Control</p>
                    <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none group-hover:translate-x-1 transition-transform">Campus Branch Intelligence</h4>
                  </div>
                </div>
                <div className="w-full max-w-sm">
                  <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                    <SelectTrigger className="h-12 border-slate-100 bg-slate-50/50 rounded-2xl font-black text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm px-5">
                      {/* Explicitly show school name to avoid layout/ID issues in trigger */}
                      <SelectValue placeholder="Select Academic Branch">
                        {selectedSchoolId ? schools.find(s => s.id.toString() === selectedSchoolId)?.name : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-[2rem] border-slate-100 shadow-3xl p-3 max-h-80">
                      <SelectItem value="" className="font-bold py-3 px-4 rounded-xl text-slate-400 italic">Select Academic Branch</SelectItem>
                      {Array.isArray(schools) && schools.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()} className="font-black py-4 px-4 rounded-2xl focus:bg-indigo-50 focus:text-indigo-700 cursor-pointer">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm uppercase tracking-tight">{s.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold tracking-[0.1em]">CODE: SCH-{s.id} • {s.address?.split(',')[0]}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 dashboard-card border-none overflow-hidden min-w-0">
              <CardHeader className="p-8 border-b border-slate-50 bg-white/50 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Academic Ledger</CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Registry for current examination terms</CardDescription>
                </div>
                <div className="relative group w-full max-w-xs">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <Input 
                    placeholder="Query index or name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-11 border-slate-100 bg-slate-50/50 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                   <div className="p-24 flex flex-col items-center justify-center gap-4 animate-pulse">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                      </div>
                      <p className="font-black text-slate-300 uppercase tracking-widest text-[10px]">Compiling analytics...</p>
                   </div>
                ) : (
                  <div className="min-w-full overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/30">
                        <TableRow className="h-16 border-slate-50">
                          <TableHead 
                            className="w-[300px] pl-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer group"
                            onClick={() => requestSort('studentName')}
                          >
                            <div className="flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                              Entity <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer group"
                            onClick={() => requestSort('performance')}
                          >
                            <div className="flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                              Vector <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer group"
                            onClick={() => requestSort('term')}
                          >
                            <div className="flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                              Session <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer group"
                            onClick={() => requestSort('examName')}
                          >
                            <div className="flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                              Module <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100" />
                            </div>
                          </TableHead>
                          <TableHead className="text-right pr-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(sortedMarks) && sortedMarks.map((result) => (
                          <TableRow key={result.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50/80 h-20">
                            <TableCell className="pl-8">
                              <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight text-sm mb-1">
                                {result.student?.name || result.student?.fullName || result.student?.FullName || 
                                 (result.student?.firstName ? `${result.student.firstName} ${result.student.lastName || ''}`.trim() : "") || 
                                 (result.student?.FNAME ? `${result.student.FNAME} ${result.student.LNAME || ''}`.trim() : "Student")}
                              </div>
                              <div className="font-mono text-[9px] font-black text-slate-400 bg-slate-100/50 px-2 py-0.5 rounded border border-slate-200/50 inline-block italic tracking-tighter uppercase">
                                ROLL: {result.student?.rollNumber || result.student?.RollNumber || result.student?.ROLLNO || "0"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "inline-flex items-center justify-center w-10 h-10 rounded-xl text-xs font-black shadow-lg transition-transform group-hover:scale-110 duration-500",
                                  (result.obtMarks / result.totalMarks) >= 0.8 ? "bg-emerald-500 text-white shadow-emerald-200" :
                                  (result.obtMarks / result.totalMarks) >= 0.4 ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-rose-500 text-white shadow-rose-200"
                                )}>
                                  {Math.round((result.obtMarks / result.totalMarks) * 100)}%
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-black text-slate-900 text-xs tracking-tight">{result.obtMarks}</span>
                                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">Limit: {result.totalMarks}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="px-3 py-1 bg-slate-100/80 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                                {result.term}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs font-black text-slate-400 italic tracking-tight uppercase">{result.examName}</TableCell>
                            <TableCell className="text-right pr-8">
                              <Dialog>
                                <DialogTrigger
                                  nativeButton={true}
                                  render={
                                    <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95" onClick={() => setSelectedStudent(result)}>
                                      <Eye size={14} className="stroke-[3]" /> Certificate
                                    </Button>
                                  }
                                />
                                <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden border-none shadow-3xl rounded-[2.5rem] bg-white">
                                  <div className="max-h-[90vh] overflow-y-auto">
                                    <MarksheetView student={selectedStudent} />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-8 min-w-0">
              <Card className="dashboard-card border-none pt-2 shadow-indigo-100/50">
                <CardHeader className="px-8 pt-8 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                    <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Export Interface</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-6">
                  <div className="grid grid-cols-1 gap-3">
                    <Button variant="outline" className="group h-auto py-5 px-6 rounded-2xl border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm">
                      <div className="flex items-center justify-between w-full">
                        <div className="text-left flex items-center gap-4">
                          <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <FileText size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900 tracking-tight leading-none mb-1">Standard Ledger</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">PDF • PRINT READY</div>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
                      </div>
                    </Button>

                    <Button variant="outline" className="group h-auto py-5 px-6 rounded-2xl border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm">
                      <div className="flex items-center justify-between w-full">
                        <div className="text-left flex items-center gap-4">
                          <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Download size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900 tracking-tight leading-none mb-1">Data Analytics</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">EXCEL • CSV • SQL</div>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
                      </div>
                    </Button>
                  </div>

                  <Button className="w-full h-14 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-200/50 text-xs uppercase tracking-[0.2em] transition-all group active:scale-[0.98]">
                    <Download size={18} className="mr-3 stroke-[3] group-hover:animate-bounce" /> Bulk Registry Download
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900 text-white rounded-[2.5rem] border-none shadow-3xl shadow-slate-900/20 overflow-hidden group p-1 transition-all hover:scale-[1.02]">
                <div className="bg-slate-900 px-8 pt-10 pb-8 relative rounded-[2.2rem]">
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500 rounded-xl shadow-2xl shadow-indigo-500/20">
                        <BarChart3 size={20} className="text-white" />
                      </div>
                      <CardTitle className="text-white text-xl font-black tracking-tight leading-none">Performance Vector</CardTitle>
                    </div>
                    
                    <p className="text-xs text-indigo-200/70 font-bold uppercase tracking-widest leading-relaxed">
                      Aggregate operational efficiency is up <span className="text-indigo-400">+4.2%</span> relative to historic baseline.
                    </p>

                    <div className="space-y-6 pt-2">
                       <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                          <span className="text-slate-400">Survival Rate</span>
                          <span className="text-indigo-400">98.5%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-[2px]">
                          <div className="h-full bg-indigo-500 w-[98.5%] rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Peak Rank Count</span>
                          <span className="text-2xl font-black text-white leading-none">124 <span className="text-xs text-indigo-400 ml-1 font-black">A+</span></span>
                        </div>
                        <div className="p-3 bg-slate-900 rounded-xl text-indigo-400 border border-slate-700">
                          <Printer size={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute right-[-20%] bottom-[-20%] w-60 h-60 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-600/30 transition-all duration-700"></div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="builder" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ReportBuilder />
        </TabsContent>

        <TabsContent value="entry" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <MarksEntry user={user} forcedSchoolId={user.role === "superadmin" ? parseSafeInt(selectedSchoolId) : undefined} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MarksheetView({ student }: { student: any }) {
  if (!student) return null;

  const subjects = [
    { name: "Mathematics", marks: student.obtMarks, total: student.totalMarks, grade: "A+" },
    { name: "Science", marks: Math.floor(student.obtMarks * 0.9), total: student.totalMarks, grade: "A" },
    { name: "English", marks: Math.floor(student.obtMarks * 0.85), total: student.totalMarks, grade: "A" },
    { name: "Social Science", marks: Math.floor(student.obtMarks * 0.92), total: student.totalMarks, grade: "A+" }
  ];

  const totalObt = subjects.reduce((sum, s) => sum + s.marks, 0);
  const totalMax = subjects.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="p-10 bg-white space-y-8 border-8 border-slate-50 relative overflow-hidden">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-slate-200 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-slate-200 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-slate-200 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-slate-200 pointer-events-none"></div>

      <div className="flex flex-col items-center text-center space-y-4 border-b-2 border-slate-900 pb-8">
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-2xl tracking-tighter">
          SID
        </div>
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">ScanID International School</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Certified Academic Achievement Record</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="outline" className="border-slate-300 font-bold px-4">EST. 1998</Badge>
            <Badge className="bg-slate-900 text-white px-4">OFFICIAL DOCUMENT</Badge>
            <Badge variant="outline" className="border-slate-300 font-bold px-4">CBSE AFFILIATED</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm pt-4">
        <div className="space-y-1 col-span-2">
          <p className="text-[10px] uppercase font-bold text-slate-400">Student Name</p>
          <p className="font-extrabold text-xl text-slate-900">
            {student.student?.name || student.student?.fullName || student.student?.FullName || 
             (student.student?.firstName ? `${student.student?.firstName} ${student.student?.lastName || ''}`.trim() : "") || 
             (student.student?.FNAME ? `${student.student.FNAME} ${student.student.LNAME || ''}`.trim() : "")}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Roll Number</p>
          <p className="font-bold text-slate-900">{student.student?.rollNumber || student.student?.RollNumber || student.student?.ROLLNO || "0"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Session</p>
          <p className="font-bold text-slate-900">2023-2024</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
        <Table>
          <TableHeader className="bg-slate-100/50">
            <TableRow>
              <TableHead className="font-bold text-slate-900 pl-6 h-12">SUBJECT DESCRIPTION</TableHead>
              <TableHead className="font-bold text-slate-900">MAX</TableHead>
              <TableHead className="font-bold text-slate-900">OBTAINED</TableHead>
              <TableHead className="font-bold text-slate-900 text-right pr-6">GRADE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((sub) => (
              <TableRow key={sub.name} className="hover:bg-transparent border-slate-100">
                <TableCell className="font-bold text-slate-700 pl-6 py-4">{sub.name}</TableCell>
                <TableCell className="font-medium text-slate-500">{sub.total}</TableCell>
                <TableCell className="font-black text-slate-900">{sub.marks}</TableCell>
                <TableCell className="text-right pr-6">
                  <span className={cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs",
                    sub.grade === "A+" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  )}>{sub.grade}</span>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-slate-900 text-white hover:bg-slate-900">
              <TableCell className="font-bold pl-6 text-lg">TOTAL AGGREGATE</TableCell>
              <TableCell className="font-bold opacity-70">{totalMax}</TableCell>
              <TableCell className="font-black text-2xl">{totalObt}</TableCell>
              <TableCell className="text-right pr-6 font-black text-2xl">{(totalObt / totalMax * 100).toFixed(1)}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="pt-8 grid grid-cols-3 gap-12">
        <div className="space-y-4 text-center">
            <div className="h-12 border-b border-slate-300"></div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Class Teacher</p>
        </div>
        <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 border-4 border-slate-100 rounded-full flex items-center justify-center italic text-[8px] text-slate-300 font-bold uppercase text-center rotate-12">
                ScanID<br/>Official Seal
            </div>
        </div>
        <div className="space-y-4 text-center">
            <div className="h-12 border-b border-slate-300"></div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Principal Signature</p>
        </div>
      </div>

      <div className="flex gap-3 pt-10 justify-end no-print">
        <Button variant="outline" className="gap-2 h-11 px-6 font-bold border-slate-300"><Printer size={18} /> Print Certificate</Button>
        <Button className="bg-slate-900 hover:bg-slate-800 gap-2 h-11 px-6 font-bold shadow-xl shadow-slate-900/20"><Download size={18} /> Download PDF</Button>
      </div>
    </div>
  );
}
