import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Save, AlertCircle, CheckCircle2, ChevronRight, Calculator, Upload, Download as DownloadIcon, FileSpreadsheet, Edit3, ArrowUpDown, UserPlus, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn, parseSafeInt } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";

import { User as UserType } from "@/types";
import { apiService } from "@/lib/api";

// Dynamic subjects configuration based on standard
const SUBJECTS_BY_STANDARD: Record<string, string[]> = {
  "8th": ["Mathematics", "Science", "English", "Social Science", "Physical Education"],
  "9th": ["Advanced Mathematics", "Physics", "Chemistry", "Biology", "English Literature", "History"],
  "10th": ["Mathematics", "Science", "Social Science", "English", "Computer Applications", "Arts"],
  "11th": ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "Economics", "Accounts"],
  "12th": ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "Economics", "Accounts"],
};

const INITIAL_STUDENTS = [
  { id: "1", schoolId: "SCH001", grno: "GR001", name: "Alex James Johnson", roll: "101", marks: "" },
  { id: "2", schoolId: "SCH001", grno: "GR002", name: "Sarah Anne Williams", roll: "102", marks: "" },
  { id: "3", schoolId: "SCH002", grno: "GR003", name: "Michael Chen", roll: "103", marks: "" },
  { id: "4", schoolId: "SCH001", grno: "GR004", name: "Emily Davis", roll: "104", marks: "" },
  { id: "5", schoolId: "SCH001", grno: "GR005", name: "David Miller", roll: "105", marks: "" },
  { id: "6", schoolId: "SCH002", grno: "GR006", name: "Jessica Taylor", roll: "106", marks: "" },
];

export default function MarksEntry({ user, forcedSchoolId }: { user: UserType, forcedSchoolId?: number }) {
  const [standard, setStandard] = useState("");
  const [section, setSection] = useState("");
  const [standardsMaster, setStandardsMaster] = useState<any[]>([]);
  const [sectionsMaster, setSectionsMaster] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [exam, setExam] = useState("final");
  const [maxMarks, setMaxMarks] = useState("100");
  const [customSubjects, setCustomSubjects] = useState<Record<string, string[]>>({});
  
  const canManageSubjects = user.role === "superadmin" || user.role === "admin";
  const canManageStudents = user.role === "superadmin" || user.role === "admin";
  
  // Track marks per subject: { "Mathematics": { "1": "85", "2": "90" } }
  const [persistentMarks, setPersistentMarks] = useState<Record<string, Record<string, string>>>({});
  
  // State for subject list sorting
  const [subjectSortMode, setSubjectSortMode] = useState<'name' | 'entries'>('name');
  
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentRoll, setNewStudentRoll] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<any[]>([]);
  const marksFileInputRef = useRef<HTMLInputElement>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: 'roll',
    direction: 'asc',
  });

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [standardsRes, sectionsRes] = await Promise.all([
          apiService.getStandards(),
          apiService.getSections()
        ]);
        const normalize = (res: any) => Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const standards = normalize(standardsRes);
        const sections = normalize(sectionsRes);

        setStandardsMaster(standards);
        setSectionsMaster(sections);
        
        if (standards.length > 0 && !standard) {
          setStandard(standards[0].name);
        }
        if (sections.length > 0 && !section) {
          setSection(sections[0].name);
        }
      } catch (error) {
        console.error("Failed to fetch masters", error);
      }
    };
    fetchMasters();
  }, []);

  // Fetch existing database marks to pre-populate inputs dynamically
  useEffect(() => {
    const fetchExistingMarks = async () => {
      try {
        const schoolId = forcedSchoolId || parseSafeInt(user.schoolId);
        const academicYearId = parseSafeInt(user.academicYearId);
        const res = await apiService.getMarks(schoolId, academicYearId);
        const rawMarks = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        
        // Map saved marks in-memory: { [subjectName]: { [studentId]: marksObtained } }
        const newPersistentMarks: Record<string, Record<string, string>> = {};
        rawMarks.forEach((m: any) => {
          const subjectName = m.subject || m.Subject || "";
          const studentId = (m.studentId || m.StudentId || "").toString();
          const marksObtained = (m.marksObtained !== undefined ? m.marksObtained : 
                                 (m.MarksObtained !== undefined ? m.MarksObtained : 
                                 (m.obtMarks !== undefined ? m.obtMarks : ""))).toString();
          
          if (subjectName && studentId) {
            if (!newPersistentMarks[subjectName]) {
              newPersistentMarks[subjectName] = {};
            }
            newPersistentMarks[subjectName][studentId] = marksObtained;
          }
        });
        
        setPersistentMarks(newPersistentMarks);
      } catch (error) {
        console.error("Failed to load existing marks for school", error);
      }
    };
    fetchExistingMarks();
  }, [forcedSchoolId, user.schoolId, user.academicYearId]);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const schoolId = forcedSchoolId || parseSafeInt(user.schoolId);
        
        // Dynamic filters based on selections
        const standardObj = standardsMaster.find(s => s.name === standard);
        const sectionObj = sectionsMaster.find(s => s.name === section);
        const standardId = standardObj ? parseSafeInt(standardObj.id) : undefined;
        const sectionId = sectionObj ? parseSafeInt(sectionObj.id) : undefined;

        const res = await apiService.getStudents(schoolId, parseSafeInt(user.academicYearId), {
          standardId,
          sectionId,
          pageSize: 500
        });

        // Robust adapter supporting both direct arrays and enveloped JSON responses
        const rawList = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.data) ? res.data.data : []);
        
        // Retrieve standard-assigned marks
        const marks = subject ? (persistentMarks[subject] || {}) : {};

        setStudents(rawList.map((s: any) => ({
          id: s.id.toString(),
          schoolId: s.schoolId?.toString() || schoolId.toString(),
          grno: s.registrationNumber || s.grNo || `GR-${s.id}`,
          name: s.fullName || s.name || `${s.firstName || ""} ${s.lastName || ""}`.trim(),
          roll: s.rollNumber?.toString() || s.id.toString(),
          marks: marks[s.id.toString()] || ""
        })));
      } catch (error) {
        console.error("Failed to load students", error);
        toast.error("Failed to load students for marks entry");
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch students when masters are successfully populated
    if (standardsMaster.length > 0 && sectionsMaster.length > 0) {
      fetchStudents();
    }
  }, [forcedSchoolId, user.schoolId, user.academicYearId, standard, section, standardsMaster, sectionsMaster, subject, persistentMarks === undefined]);

  const sortedStudents = useMemo(() => {
    let sortableItems = [...students];
    if (sortConfig.key && sortConfig.direction) {
      sortableItems.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof typeof a];
        let bValue: any = b[sortConfig.key as keyof typeof b];

        // Handle numeric sorting for marks and roll
        if (sortConfig.key === 'marks' || sortConfig.key === 'roll') {
          aValue = aValue === "" ? -1 : Number(aValue);
          bValue = bValue === "" ? -1 : Number(bValue);
        } else {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [students, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get combined subjects (defaults + custom)
  const getSubjects = (std: string) => {
    const defaults = SUBJECTS_BY_STANDARD[std] || [];
    const custom = customSubjects[std] || [];
    return [...defaults, ...custom];
  };

  const sortedSubjects = useMemo(() => {
    const subjects = getSubjects(standard);
    const entryCounts: Record<string, number> = {};
    
    // Calculate entry counts for the current standard's subjects
    subjects.forEach(s => {
      const marks = persistentMarks[s] || {};
      entryCounts[s] = Object.values(marks).filter(m => m !== "").length;
    });

    return [...subjects].sort((a, b) => {
      if (subjectSortMode === 'entries') {
        const aCount = entryCounts[a] || 0;
        const bCount = entryCounts[b] || 0;
        if (bCount !== aCount) return bCount - aCount;
      }
      return a.localeCompare(b);
    });
  }, [standard, customSubjects, subjectSortMode, persistentMarks]);

  const subjectEntryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const subjects = getSubjects(standard);
    subjects.forEach(s => {
      const marks = persistentMarks[s] || {};
      counts[s] = Object.values(marks).filter(m => m !== "").length;
    });
    return counts;
  }, [persistentMarks, standard, customSubjects]);

  // Update subject list when standard changes
  useEffect(() => {
    const subjects = sortedSubjects;
    setSubject(subjects[0] || "");
  }, [standard]);

  // Load marks when subject or standard changes
  useEffect(() => {
    if (!subject) return;
    
    const marks = persistentMarks[subject] || {};
    setStudents(prev => prev.map(s => ({
      ...s,
      marks: marks[s.id] || ""
    })));
  }, [subject]);

  const handleMarkChange = (id: string, value: string) => {
    // Allow numeric input (including negative for validation demo)
    if (value !== "" && !/^-?\d*\.?\d*$/.test(value)) {
      return;
    }
    
    setStudents(prev => prev.map(s => s.id === id ? { ...s, marks: value } : s));
    
    // Real-time tracking: Update persistent marks
    if (subject) {
      setPersistentMarks(prev => ({
        ...prev,
        [subject]: {
          ...(prev[subject] || {}),
          [id]: value
        }
      }));
    }
  };

  const handleAddStudentManually = () => {
    if (!newStudentName.trim() || !newStudentRoll.trim()) {
      toast.error("Please fill in both name and roll number");
      return;
    }

    const rollExists = students.some(s => s.roll === newStudentRoll.trim());
    if (rollExists) {
      toast.error("A student with this roll number already exists");
      return;
    }

    const newStudent = {
      id: Date.now().toString(),
      name: newStudentName.trim(),
      roll: newStudentRoll.trim(),
      marks: ""
    };

    setStudents(prev => [...prev, newStudent]);
    setNewStudentName("");
    setNewStudentRoll("");
    toast.success(`Student ${newStudent.name} added successfully`);
  };

  const handleRemoveStudent = (id: string, name: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    toast.info(`Student ${name} removed from list`);
  };

  const handleAddSubject = () => {
    if (newSubject && newSubject.trim()) {
      const trimmedName = newSubject.trim();
      const existing = getSubjects(standard);
      
      if (existing.includes(trimmedName)) {
        toast.error("Subject already exists!");
        return;
      }

      setCustomSubjects(prev => ({
        ...prev,
        [standard]: [...(prev[standard] || []), trimmedName]
      }));
      setSubject(trimmedName);
      setNewSubject("");
      toast.success(`Subject "${trimmedName}" added to ${standard} standard`);
    } else {
      toast.error("Please enter a subject name");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  };

  const stats = useMemo(() => {
    const entered = students.filter(s => s.marks !== "");
    const maxMarksNum = Number(maxMarks) || 100;
    
    // Filter to only valid entries for stats to avoid skewed averages from typos
    const validEntries = entered.filter(s => {
      const val = Number(s.marks);
      return s.marks !== "" && val >= 0 && val <= (Number(maxMarks) || 1000);
    });

    if (validEntries.length === 0) return { avg: "0.0", pass: 0, high: 0, low: 0 };
    
    const percentages = validEntries.map(s => (Number(s.marks) / maxMarksNum * 100));
    const avg = (percentages.reduce((a, b) => a + b, 0) / validEntries.length).toFixed(1);
    const pass = percentages.filter(p => p >= 35).length;
    const high = Math.max(...validEntries.map(s => Number(s.marks)));
    const low = Math.min(...validEntries.map(s => Number(s.marks)));
    
    return { avg, pass, high, low };
  }, [students, maxMarks]);

  const downloadTemplate = () => {
    toast.info("Downloading Template...", {
      description: `Format: marks_entry_${standard}_${subject || 'all'}.csv`
    });
    // Simulated anchor click
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          toast.error("The uploaded file is empty.");
          setIsUploading(false);
          return;
        }

        // Map data to students
        // We look for columns like "roll", "roll_number", "marks", "score"
        const mappedData = students.map(s => {
          const row = data.find(item => {
            const rollKey = Object.keys(item).find(key => key.toLowerCase().includes("roll"));
            return rollKey && item[rollKey].toString().trim() === s.roll.trim();
          });

          if (row) {
            const marksKey = Object.keys(row).find(key => 
              key.toLowerCase().includes("marks") || 
              key.toLowerCase().includes("score") ||
              key.toLowerCase().includes(subject.toLowerCase())
            );
            return {
              ...s,
              marks: marksKey ? row[marksKey].toString() : ""
            };
          }
          return { ...s, marks: "" };
        });

        const foundCount = mappedData.filter(s => s.marks !== "").length;
        if (foundCount === 0) {
          toast.error("No matching roll numbers found in file.");
          setIsUploading(false);
          return;
        }

        setPendingUploadData(mappedData);
        setIsUploading(false);
        setShowUploadDialog(false);
        setShowPreviewDialog(true);
        toast.success(`Matched marks for ${foundCount} students.`);
      } catch (error) {
        console.error("Bulk marks error:", error);
        toast.error("Failed to parse file.");
        setIsUploading(false);
      } finally {
        if (marksFileInputRef.current) marksFileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      toast.error("Error reading file.");
      setIsUploading(false);
    };

    reader.readAsBinaryString(file);
  };

  const confirmBulkUpload = () => {
    setStudents(pendingUploadData);
    
    // Update persistent marks and entry counts
    if (subject) {
      const newMarks: Record<string, string> = {};
      pendingUploadData.forEach(s => {
        newMarks[s.id] = s.marks;
      });
      
      setPersistentMarks(prev => ({
        ...prev,
        [subject]: {
          ...(prev[subject] || {}),
          ...newMarks
        }
      }));
    }

    setShowPreviewDialog(false);
    setPendingUploadData([]);
    toast.success("Bulk import finalized!", {
      description: `${pendingUploadData.length} student records have been updated for ${subject}.`
    });
  };

  const handleCancelUpload = () => {
    setShowPreviewDialog(false);
    setPendingUploadData([]);
    toast.info("Import cancelled", {
      description: "No changes were made to the marks sheet."
    });
  };

  const handleSave = async () => {
    if (!subject) {
      toast.error("Please select a subject");
      return;
    }

    const maxMarksNum = Number(maxMarks);
    if (isNaN(maxMarksNum) || maxMarksNum <= 0) {
      toast.error("Please enter a valid Maximum Marks value greater than 0");
      return;
    }

    const invalidEntries = students.filter(s => 
      s.marks !== "" && (Number(s.marks) > maxMarksNum || Number(s.marks) < 0)
    );

    if (invalidEntries.length > 0) {
      toast.error(`Cannot save: ${invalidEntries.length} entries are out of range (0-${maxMarks}).`, {
        description: "Please fix the highlighted errors before saving."
      });
      return;
    }

    const emptyMarks = students.filter(s => s.marks === "").length;
    if (emptyMarks > 0) {
      toast.warning(`Warning: ${emptyMarks} students have no marks entered.`);
    }

    setIsSaving(true);
    
    try {
      const activeEntries = students.filter(s => s.marks !== "");
      if (activeEntries.length === 0) {
        toast.info("No mark entries to save.", {
          description: "Please enter marks for at least one student."
        });
        setIsSaving(false);
        return;
      }

      const examNames: Record<string, string> = {
        unit_1: "Unit Test 1",
        mid_term: "Mid-Term",
        unit_2: "Unit Test 2",
        final: "Final Terminal Examination"
      };
      const examNameStr = examNames[exam] || exam || "Periodic Test";

      // Save each record to backend in parallel
      const savePromises = activeEntries.map(s => {
        const payload = {
          studentId: parseInt(s.id),
          subject: subject,
          examName: examNameStr,
          term: "Academic Term 1",
          marksObtained: parseFloat(s.marks),
          totalMarks: maxMarksNum
        };
        return apiService.createMark(payload);
      });

      await Promise.all(savePromises);

      toast.success("Marks sheet updated successfully!", {
        description: `Persisted ${activeEntries.length} academic records to the database.`
      });
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save marks sheet entries to database.");
    } finally {
      setIsSaving(false);
    }
  };

  const autoFillMock = () => {
    setStudents(prev => prev.map(s => ({
      ...s,
      marks: Math.floor(Math.random() * (Number(maxMarks) - 30) + 30).toString()
    })));
    toast.info("Auto-filled students with random scores for testing.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Card className="dashboard-card overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <Calculator size={20} />
              </div>
              <div>
                <CardTitle>Marks Entry Sheet</CardTitle>
                <CardDescription>Enter academic scores for students dynamically.</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger
                  nativeButton={true}
                  render={
                    <Button variant="outline" size="sm" className="gap-2">
                      <Upload size={16} /> Bulk Upload
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Student Marks</DialogTitle>
                    <DialogDescription>
                      Upload a CSV or Excel file containing student roll numbers and marks.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="text-emerald-600" size={24} />
                        <div>
                          <p className="text-sm font-bold text-slate-900">Recommended Template</p>
                          <p className="text-xs text-slate-500">Standard {standard} - {subject || 'Select Subject'}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-2 text-blue-600">
                        <DownloadIcon size={14} /> Download
                      </Button>
                    </div>

                    <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-8 transition-colors hover:border-blue-400 hover:bg-blue-50/10">
                      <input 
                        type="file" 
                        ref={marksFileInputRef}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        accept=".csv,.xlsx,.xls"
                      />
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                          <Upload className="text-slate-400" size={24} />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {isUploading ? "Uploading..." : "Click or drag file to upload"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Maximum file size: 5MB</p>
                      </div>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-3 text-amber-800 text-[10px] space-y-1">
                      <p className="font-bold uppercase tracking-wider">Required Format:</p>
                      <p>CSV must have columns: <code className="bg-amber-100 px-1 rounded">roll_number</code>, <code className="bg-amber-100 px-1 rounded">marks</code></p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Bulk Upload Preview Confirmation Dialog */}
              <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Confirm Bulk Import</DialogTitle>
                    <DialogDescription>
                      Please review the summary of data extracted from your file for <strong>{subject}</strong>.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Records</p>
                        <p className="text-2xl font-black text-slate-900">{pendingUploadData.length}</p>
                      </div>
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                        <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Pass Ratio</p>
                        <p className="text-2xl font-black text-emerald-700">
                          {pendingUploadData.length > 0 ? Math.round((pendingUploadData.filter(s => (Number(s.marks)/Number(maxMarks)*100) >= 35).length / pendingUploadData.length) * 100) : 0}%
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
                        <p className="text-[10px] uppercase font-bold text-blue-600 mb-1">Avg. Marks</p>
                        <p className="text-2xl font-black text-blue-700">
                          {pendingUploadData.length > 0 ? (pendingUploadData.reduce((acc, curr) => acc + Number(curr.marks), 0) / pendingUploadData.length).toFixed(1) : 0}
                        </p>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg max-h-[300px] overflow-y-auto shadow-inner bg-white">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                          <TableRow>
                            <TableHead className="py-3 pl-4">GRNO</TableHead>
                            <TableHead className="py-3">Roll</TableHead>
                            <TableHead className="py-3">Name</TableHead>
                            <TableHead className="py-3 text-right">Marks</TableHead>
                            <TableHead className="py-3 text-right pr-4">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingUploadData.map((s) => {
                            const val = Number(s.marks);
                            const maxVal = Number(maxMarks);
                            const invalid = val < 0 || val > maxVal;
                            return (
                              <TableRow key={s.id} className={cn(invalid && "bg-red-50/50")}>
                                <TableCell className="py-2.5 pl-4 font-mono text-[10px] font-bold text-blue-600">{(s as any).grno || `GR-${s.id}`}</TableCell>
                                <TableCell className="py-2.5 font-mono text-xs text-slate-500">{s.roll}</TableCell>
                                <TableCell className="py-2.5 font-semibold text-slate-900">{s.name}</TableCell>
                                <TableCell className={cn("py-2.5 text-right font-black", invalid ? "text-red-600" : "text-blue-600")}>
                                  {s.marks}
                                </TableCell>
                                <TableCell className="py-2.5 text-right pr-4">
                                  {invalid ? (
                                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase">Invalid</span>
                                  ) : (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">Ready</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {pendingUploadData.some(s => Number(s.marks) < 0 || Number(s.marks) > Number(maxMarks)) && (
                      <div className="bg-red-50 rounded-lg p-3 border border-red-100 flex gap-3 animate-pulse">
                        <AlertCircle className="text-red-600 shrink-0" size={18} />
                        <p className="text-xs text-red-800 leading-relaxed font-bold">
                          The file contains marks that are outside the allowed range (0-{maxMarks}). These will be highlighted in red after matching.
                        </p>
                      </div>
                    )}

                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex gap-3">
                      <AlertCircle className="text-amber-600 shrink-0" size={18} />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Confirming will overwrite any marks currently entered in the sheet for these students. This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleCancelUpload}>Cancel Import</Button>
                    <Button onClick={confirmBulkUpload} className="bg-blue-600 hover:bg-blue-700 px-8">
                      Confirm & Import
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={autoFillMock}>Demo Fill</Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Save size={16} /> Save Marks
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-slate-100/50 rounded-xl mb-6 border border-slate-100">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Standard</Label>
              <Select value={standard} onValueChange={setStandard}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Select Academic Standard">
                    {standard || undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="font-semibold py-1.5 text-xs text-slate-400 italic">Select Academic Standard</SelectItem>
                  {standardsMaster.map(s => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Section</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="bg-white border-slate-200">
                  {/* Explicit mapping to maintain 'Section X' format in the trigger display */}
                  <SelectValue placeholder="Select Class Section">
                    {section ? `Section ${section}` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="font-semibold py-1.5 text-xs text-slate-400 italic">Select Class Section</SelectItem>
                  {sectionsMaster.map(s => (
                    <SelectItem key={s.id} value={s.name}>Section {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Exam Type</Label>
              <Select value={exam} onValueChange={setExam}>
                <SelectTrigger className="bg-white border-slate-200">
                  {/* Explicit mapping to show readable labels instead of logic keys like unit_1 */}
                  <SelectValue placeholder="Select Exam Type">
                    {exam ? (
                      exam === "unit_1" ? "Unit Test 1" : 
                      exam === "mid_term" ? "Mid-Term" : 
                      exam === "unit_2" ? "Unit Test 2" : 
                      exam === "final" ? "Final Examination" : exam
                    ) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="font-semibold py-1.5 text-xs text-slate-400 italic font-bold">Select Exam Type</SelectItem>
                  <SelectItem value="unit_1">Unit Test 1</SelectItem>
                  <SelectItem value="mid_term">Mid-Term</SelectItem>
                  <SelectItem value="unit_2">Unit Test 2</SelectItem>
                  <SelectItem value="final">Final Examination</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Manage Subjects</Label>
                <button 
                  onClick={() => setSubjectSortMode(prev => prev === 'name' ? 'entries' : 'name')}
                  className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                  title="Toggle sorting (Name / Total Entries)"
                >
                  <ArrowUpDown size={10} />
                  {subjectSortMode === 'name' ? 'Alpha' : 'Popular'}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="bg-white border-slate-200 flex-1">
                    <div className="flex items-center justify-between w-full pr-2">
                      {/* Standard SelectValue to handle dynamic subject labels and entry counts */}
                      <SelectValue placeholder="Select Examination Subject">
                        {subject || undefined}
                      </SelectValue>
                      {subject && subject !== "" && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-black ring-1 ring-blue-100">
                          {subjectEntryCounts[subject] || 0}
                        </span>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="" className="font-semibold py-1.5 text-xs text-slate-400 italic">Select Examination Subject</SelectItem>
                    {sortedSubjects.map(s => {
                      const count = subjectEntryCounts[s] || 0;
                      const isSelected = subject === s;
                      return (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center justify-between w-full gap-8 group/item">
                            <span className={cn("font-medium transition-colors", isSelected && "text-blue-600 font-bold")}>{s}</span>
                            <div className="flex items-center gap-1.5 opacity-70 group-hover/item:opacity-100 transition-all">
                              <div className={cn(
                                "text-[9px] font-mono px-1.5 py-0.5 rounded-full flex items-center gap-1 border transition-colors",
                                count > 0 
                                  ? "bg-blue-50 text-blue-700 border-blue-100 font-black shadow-sm" 
                                  : "bg-slate-50 text-slate-400 border-slate-100"
                              )}>
                                {count}
                                <span className="opacity-60 font-sans tracking-tight uppercase text-[8px]">Entries</span>
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                
                {canManageSubjects && (
                  <div className="flex flex-1 gap-1">
                    <div className="relative flex-1">
                      <Input 
                        placeholder="New Subject..." 
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                        className="bg-white border-slate-200 h-9 text-xs pr-8"
                      />
                      <Plus className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={12} />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddSubject}
                      className="h-9 px-3 bg-blue-600 text-white hover:bg-blue-700 border-none font-bold text-xs"
                      disabled={!newSubject.trim()}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Max Marks</Label>
              <Input 
                type="number" 
                min="1"
                value={maxMarks} 
                onChange={(e) => setMaxMarks(e.target.value)}
                className="bg-white border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
              <p className="text-[10px] uppercase font-bold text-slate-400">Class Average</p>
              <p className="text-xl font-black text-blue-600">{stats.avg}%</p>
            </div>
            <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
              <p className="text-[10px] uppercase font-bold text-slate-400">Pass Rate</p>
              <p className="text-xl font-black text-emerald-600">
                {stats.pass} / {students.filter(s => s.marks !== "").length}
              </p>
            </div>
            <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
              <p className="text-[10px] uppercase font-bold text-slate-400">High / Low</p>
              <p className="text-xl font-black text-slate-900">{stats.high} / {stats.low}</p>
            </div>
            <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
              <p className="text-[10px] uppercase font-bold text-slate-400">Remaining</p>
              <p className="text-xl font-black text-amber-600">
                {students.filter(s => s.marks === "").length}
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-24 px-4">GRNO</TableHead>
                  <TableHead className="w-20 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('roll')}>
                    <div className="flex items-center gap-2">
                      Roll No <ArrowUpDown size={12} className="text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('name')}>
                    <div className="flex items-center gap-2">
                      Student Name <ArrowUpDown size={12} className="text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="w-48 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('marks')}>
                    <div className="flex items-center gap-2">
                      Marks (Out of {maxMarks}) <ArrowUpDown size={12} className="text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="w-40 text-center">Percentage</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStudents.map((student, index) => {
                  const marksNum = Number(student.marks);
                  const maxMarksNum = Number(maxMarks) || 1;
                  const isInvalid = student.marks !== "" && (marksNum > maxMarksNum || marksNum < 0);
                  const percentage = student.marks && !isInvalid ? (marksNum / maxMarksNum * 100).toFixed(1) : "0.0";
                  const isPass = !isInvalid && Number(percentage) >= 35;
                  
                  return (
                    <TableRow key={student.id} className={cn("hover:bg-slate-50/50", isInvalid && "bg-red-50/30")}>
                      <TableCell className="font-mono text-[10px] font-bold text-blue-600 px-4">{(student as any).grno || `GR-${student.id}`}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-500">{student.roll}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{student.name}</TableCell>
                      <TableCell>
                        <div className="relative group">
                          <Input 
                            value={student.marks}
                            data-index={index}
                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            placeholder={`0-${maxMarks}`}
                            className={cn(
                              "font-bold text-center h-10 transition-all",
                              student.marks === "" ? "border-slate-200" : 
                              isInvalid ? "border-red-500 text-red-600 bg-red-50 focus-visible:ring-red-500 animate-pulse" :
                              isPass ? "border-emerald-200 text-emerald-700 bg-emerald-50/10 focus-visible:ring-emerald-500" : 
                              "border-red-200 text-red-700 bg-red-50/10 focus-visible:ring-red-500"
                            )}
                          />
                          {isInvalid && (
                            <div className="absolute -bottom-5 left-0 right-0 text-[9px] text-red-600 font-bold text-center animate-in fade-in slide-in-from-top-1">
                              Range: 0 to {maxMarks}
                            </div>
                          )}
                          {isInvalid && (
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 shadow-sm">
                              <AlertCircle size={10} />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-400 text-sm">
                        {student.marks && !isInvalid ? (
                          <div className="flex flex-col items-center">
                            <span className={cn(
                              "text-sm font-black tracking-tight",
                              isPass ? "text-emerald-600" : "text-red-600"
                            )}>
                              {percentage}%
                            </span>
                            <span className="text-[9px] uppercase font-bold text-slate-400">
                              {isPass ? 'Pass' : 'Fail'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-medium text-xs italic">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveStudent(student.id, student.name)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle className="text-amber-600" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900">Important Instructions</h4>
            <ul className="text-xs text-amber-800/80 mt-2 space-y-1 list-disc pl-4">
              <li>Ensure max marks represent the total score for this subject term.</li>
              <li>A minimum of 35% is required for a passing status.</li>
              <li>All entries are recorded with the teacher's timestamp for audit trail.</li>
            </ul>
          </div>
        </div>
        
        <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <Calculator className="text-blue-600" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900">Dynamic Calculation</h4>
            <p className="text-xs text-blue-800/80 mt-2">
              The system automatically calculates percentages and pass/fail thresholds in real-time as you type, ensuring data accuracy before submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
