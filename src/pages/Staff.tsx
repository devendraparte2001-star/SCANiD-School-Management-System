import React, { useState, useEffect, useCallback, useRef } from "react";
import { apiService } from "@/lib/api";
import { SimpleTooltip } from "@/components/shared/SimpleTooltip";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  CheckCircle2,
  XCircle,
  Filter,
  UserPlus,
  Users,
  UserCircle,
  Camera,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Loader2,
  Check
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteConfirmation } from "@/components/shared/DeleteConfirmation";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn, parseSafeInt, resolvePhotoUrl } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface StaffMember {
  id: string;
  userId?: string;
  schoolId: string;
  employeeId: string;
  initials: string;
  name: string;
  email: string;
  phone: string;
  contact2: string;
  qualification: string;
  experience: string;
  subject: string;
  standardId?: string;
  sectionId?: string;
  standardName?: string;
  sectionName?: string;
  isClassTeacher: boolean;
  status: "Active" | "On Leave" | "Resigned";
  joiningDate?: string;
  photo?: string;

  gender?: string;
  dateOfBirth?: string;
  bloodGroupId?: string;
  bloodGroupName?: string;
  retirementDate?: string;
  religionId?: string;
  religionName?: string;
  casteId?: string;
  casteName?: string;
  subCasteId?: string;
  subCasteName?: string;
  categoryId?: string;
  categoryName?: string;
  address?: string;
  cityId?: string;
  cityName?: string;
  stateId?: string;
  stateName?: string;
  bioId?: string;
  rfid?: string;
  shiftId?: string;
  shiftName?: string;
}

export default function Staff({ user }: { user: any }) {
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const canManage = isAdmin;

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<{ id: string; name: string } | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [uploadingStaffId, setUploadingStaffId] = useState<string | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [localPhotoPreview, setLocalPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // Dynamic Master List states for legacy dropdowns
  const [schools, setSchools] = useState<any[]>([]);
  const [religions, setReligions] = useState<any[]>([]);
  const [bloodGroups, setBloodGroups] = useState<any[]>([]);
  const [castes, setCastes] = useState<any[]>([]);
  const [subCastes, setSubCastes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [standards, setStandards] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  const inputRefs = useRef<Record<string, any>>({});

  const [formData, setFormData] = useState<any>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    contact2: "",
    qualification: "",
    experience: "",
    subject: "",
    standardId: "",
    sectionId: "",
    isClassTeacher: false,
    status: "Active",
    schoolId: user.schoolId || "",
    initials: "",
    gender: "",
    dateOfBirth: "",
    bloodGroupId: "",
    retirementDate: "",
    religionId: "",
    casteId: "",
    subCasteId: "",
    categoryId: "",
    joiningDate: "",
    address: "",
    cityId: "",
    stateId: "",
    bioId: "",
    rfid: "",
    shiftId: "",
    photo: ""
  });

  // Load all system masters
  const fetchMasters = async () => {
    try {
      const [
        schRes, relRes, bgRes, casRes, subRes, catRes, stRes, ctRes, shRes, stdRes, secRes
      ] = await Promise.all([
        apiService.getSchools(),
        apiService.getReligions(),
        apiService.getBloodGroups(),
        apiService.getCastes(),
        apiService.getSubCastes(),
        apiService.getCategories(),
        apiService.getStates(),
        apiService.getCities(),
        apiService.getShifts(),
        apiService.getStandards(),
        apiService.getSections()
      ]);

      setSchools(schRes.data?.data || schRes.data || []);
      setReligions(relRes.data?.data || relRes.data || []);
      setBloodGroups(bgRes.data?.data || bgRes.data || []);
      setCastes(casRes.data?.data || casRes.data || []);
      setSubCastes(subRes.data?.data || subRes.data || []);
      setCategories(catRes.data?.data || catRes.data || []);
      setStates(stRes.data?.data || stRes.data || []);
      setCities(ctRes.data?.data || ctRes.data || []);
      setShifts(shRes.data?.data || shRes.data || []);
      setStandards(stdRes.data?.data || stdRes.data || []);
      setSections(secRes.data?.data || secRes.data || []);
    } catch (error) {
      console.error("Failed to load schema master listings", error);
    }
  };

  const fetchStaffData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getStaff(
        parseSafeInt(user?.schoolId),
        parseSafeInt(user?.academicYearId),
        {
          search: searchQuery,
          sortBy,
          sortOrder,
          page,
          pageSize,
          status: filterStatus === "all" ? undefined : filterStatus,
          subject: filterSubject === "all" ? undefined : filterSubject
        }
      );
      
      const resData = res.data;
      const rawStaffList = Array.isArray(resData) 
        ? resData 
        : (resData && Array.isArray(resData.data) ? resData.data : []);
      
      const formatted = rawStaffList.map((t: any) => {
        const getVal = (prop: string, fallback?: any) => {
          if (!t) return fallback;
          const userObj = t.user || {};
          const tKeys = Object.keys(t);
          const uKeys = Object.keys(userObj);
          
          const tMatch = tKeys.find(k => k.toLowerCase() === prop.toLowerCase());
          if (tMatch) return t[tMatch];
          
          const uMatch = uKeys.find(k => k.toLowerCase() === prop.toLowerCase());
          if (uMatch) return userObj[uMatch];
          
          return fallback;
        };

        return {
          id: t.id?.toString() || "",
          userId: t.userId?.toString() || t.user?.id?.toString() || "",
          schoolId: t.schoolId?.toString() || "",
          employeeId: t.employeeId || "N/A",
          initials: t.initials || "",
          name: getVal("name") || getVal("fullName") || "Unnamed Staff Member",
          email: getVal("email") || "N/A",
          phone: getVal("contactNumber") || getVal("phone") || "N/A",
          contact2: t.contact2 || "",
          qualification: t.qualification || "N/A",
          experience: t.experience || "N/A",
          subject: t.subject || t.department || "N/A",
          standardId: t.standardId?.toString() || "",
          sectionId: t.sectionId?.toString() || "",
          standardName: t.standardName || "",
          sectionName: t.sectionName || "",
          isClassTeacher: !!t.isClassTeacher,
          status: getVal("status") || "Active",
          photo: getVal("photo") || getVal("profilePhotoPath") || "",

          gender: t.gender || "",
          dateOfBirth: t.dateOfBirth ? t.dateOfBirth.split('T')[0] : "",
          bloodGroupId: t.bloodGroupId?.toString() || "",
          bloodGroupName: t.bloodGroupName || "",
          retirementDate: t.retirementDate ? t.retirementDate.split('T')[0] : "",
          religionId: t.religionId?.toString() || "",
          religionName: t.religionName || "",
          casteId: t.casteId?.toString() || "",
          casteName: t.casteName || "",
          subCasteId: t.subCasteId?.toString() || "",
          subCasteName: t.subCasteName || "",
          categoryId: t.categoryId?.toString() || "",
          categoryName: t.categoryName || "",
          address: t.address || "",
          cityId: t.cityId?.toString() || "",
          cityName: t.cityName || "",
          stateId: t.stateId?.toString() || "",
          stateName: t.stateName || "",
          bioId: t.bioId || "",
          rfid: t.rfid || "",
          shiftId: t.shiftId?.toString() || "",
          shiftName: t.shiftName || ""
        };
      });

      const isServerPaged = resData && !!resData.pagination;
      
      if (!isServerPaged) {
        let filtered = [...formatted];
        const searchLower = searchQuery.trim().toLowerCase();
        if (searchLower) {
          filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchLower) ||
            item.email.toLowerCase().includes(searchLower) ||
            item.phone.toLowerCase().includes(searchLower) ||
            item.employeeId.toLowerCase().includes(searchLower) ||
            item.qualification.toLowerCase().includes(searchLower) ||
            item.subject.toLowerCase().includes(searchLower)
          );
        }
        
        if (filterStatus !== "all") {
          filtered = filtered.filter(item => item.status === filterStatus);
        }
        
        if (sortBy) {
          filtered.sort((a: any, b: any) => {
            const valA = a[sortBy] || "";
            const valB = b[sortBy] || "";
            if (valA === valB) return 0;
            let comparison = 0;
            if (typeof valA === "string" && typeof valB === "string") {
              comparison = valA.localeCompare(valB);
            } else {
              comparison = valA < valB ? -1 : 1;
            }
            return sortOrder === "desc" ? comparison * -1 : comparison;
          });
        }
        
        const total = filtered.length;
        setTotalCount(total);
        setTotalPages(Math.ceil(total / pageSize));
        const startIndex = (page - 1) * pageSize;
        setStaffList(filtered.slice(startIndex, startIndex + pageSize));
      } else {
        setTotalCount(resData.pagination.totalCount);
        setTotalPages(resData.pagination.totalPages);
        setStaffList(formatted);
      }
    } catch (error) {
      toast.error("Could not connect to staff directory database.");
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId, user?.academicYearId, searchQuery, sortBy, sortOrder, page, pageSize, filterStatus, filterSubject]);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  useEffect(() => {
    if (isAddDialogOpen) {
      fetchMasters();
    } else {
      setSelectedPhotoFile(null);
      if (localPhotoPreview) {
        URL.revokeObjectURL(localPhotoPreview);
        setLocalPhotoPreview(null);
      }
    }
  }, [isAddDialogOpen]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleExport = () => {
    try {
      const exportData = staffList.map((t: any) => ({
        "Employee ID": t.employeeId || "",
        "Initials": t.initials || "",
        "Name": t.name || "",
        "Email": t.email || "",
        "Core Expertise": t.subject || "",
        "Credentials": t.qualification || "",
        "Status": t.status || "Active",
        "Phone": t.phone || "",
        "Alternative contact": t.contact2 || "",
        "Gender": t.gender || "",
        "Class Teacher": t.isClassTeacher ? "Yes" : "No",
        "State": t.stateName || "",
        "City": t.cityName || "",
        "RFID Tag": t.rfid || ""
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, "Staff Directory");

      XLSX.writeFile(wb, `Staff_Management_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Staff directory successfully exported to Excel!");
    } catch (e) {
      console.error("Staff export error:", e);
      toast.error("Failed to generate Excel export sheet.");
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phone: "",
      contact2: "",
      qualification: "",
      experience: "",
      subject: "",
      standardId: "",
      sectionId: "",
      isClassTeacher: false,
      status: "Active",
      schoolId: user.schoolId || "",
      initials: "",
      gender: "",
      dateOfBirth: "",
      bloodGroupId: "",
      retirementDate: "",
      religionId: "",
      casteId: "",
      subCasteId: "",
      categoryId: "",
      joiningDate: "",
      address: "",
      cityId: "",
      stateId: "",
      bioId: "",
      rfid: "",
      shiftId: "",
      photo: ""
    });
    setSelectedStaff(null);
    setIsEditing(false);
    setFormErrors({});
  };

  const handleCreateOrUpdate = async () => {
    const newErrors: Record<string, boolean> = {};
    let firstErrorField = "";

    const checkField = (field: string, condition: boolean) => {
      if (condition) {
        newErrors[field] = true;
        if (!firstErrorField) firstErrorField = field;
      }
    };

    checkField("firstName", !formData.firstName?.trim());
    checkField("lastName", !formData.lastName?.trim());
    checkField("email", !formData.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email));
    checkField("phone", !formData.phone?.trim() || !/^\d{10}$/.test(formData.phone.replace(/\D/g, "")));
    checkField("qualification", !formData.qualification?.trim());
    checkField("schoolId", !formData.schoolId);

    setFormErrors(newErrors);

    if (firstErrorField) {
      toast.error("Please enter correct and complete fields before submitting.");
      const element = inputRefs.current[firstErrorField];
      if (element) {
        element.focus();
        if (element.scrollIntoView) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    try {
      const payload: any = {
        schoolId: parseSafeInt(formData.schoolId) || 1,
        employeeId: isEditing ? selectedStaff?.employeeId : `EMP-${Date.now()}`,
        initials: formData.initials || "",
        department: formData.subject || "Faculty",
        qualification: formData.qualification || "",
        contactNumber: formData.phone || "",
        contact2: formData.contact2 || "",
        status: formData.status || "Active",
        profilePhotoPath: formData.photo || "",
        experience: formData.experience || "",
        subject: formData.subject || "",
        standardId: parseSafeInt(formData.standardId) || null,
        sectionId: parseSafeInt(formData.sectionId) || null,
        isClassTeacher: !!formData.isClassTeacher,

        gender: formData.gender || null,
        dateOfBirth: formData.dateOfBirth || null,
        bloodGroupId: parseSafeInt(formData.bloodGroupId) || null,
        retirementDate: formData.retirementDate || null,
        religionId: parseSafeInt(formData.religionId) || null,
        casteId: parseSafeInt(formData.casteId) || null,
        subCasteId: parseSafeInt(formData.subCasteId) || null,
        categoryId: parseSafeInt(formData.categoryId) || null,
        dateOfJoining: formData.joiningDate || null,
        address: formData.address || "",
        cityId: parseSafeInt(formData.cityId) || null,
        stateId: parseSafeInt(formData.stateId) || null,
        bioId: formData.bioId || "",
        rfid: formData.rfid || "",
        shiftId: parseSafeInt(formData.shiftId) || null,

        user: {
           username: formData.email.split('@')[0] + Date.now(),
           name: `${formData.firstName} ${formData.lastName}`.trim(),
           passwordHash: "DefaultPass123!",
           email: formData.email,
           role: "teacher",
           schoolId: parseSafeInt(formData.schoolId) || 1
        },
        CreatedBy: isEditing ? undefined : (user.name || user.email),
        ModifiedBy: user.name || user.email
      };

      if (isEditing && selectedStaff) {
        payload.id = parseSafeInt(selectedStaff.id) || 0;
        payload.userId = parseSafeInt(selectedStaff.userId) || 0;
        if (payload.user && selectedStaff.userId) {
          payload.user.id = parseSafeInt(selectedStaff.userId) || 0;
        }
      }

      if (isEditing && selectedStaff) {
        await apiService.updateStaff(parseSafeInt(selectedStaff.id) || 0, payload as any);
        toast.success("Staff profile updated successfully.");
      } else {
        const response = await apiService.createStaff(payload as any);
        const newStaff = response.data?.data || response.data;
        if (selectedPhotoFile && newStaff?.id) {
          try {
            await apiService.uploadStaffPhoto(Number(newStaff.id), selectedPhotoFile);
          } catch (uploadErr) {
            console.error("Delayed staff image upload failed", uploadErr);
          }
        }
        toast.success("Registered new staff credentials into the database.");
      }
      
      setIsAddDialogOpen(false);
      resetForm();
      fetchStaffData();
    } catch (error) {
      toast.error("Failed to commit staff configuration changes to database.");
    }
  };

  const handleDeleteStaff = (id: string, name: string) => {
    setDeleteInfo({ id, name });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteInfo) return;
    setLoading(true);
    try {
      await apiService.deleteStaff(parseSafeInt(deleteInfo.id) || 0);
      setStaffList(prev => prev.filter(t => t.id !== deleteInfo.id));
      toast.success(`${deleteInfo.name} permanently removed from system.`);
      setIsDeleteDialogOpen(false);
      setDeleteInfo(null);
    } catch (error) {
      toast.error("An error occurred trying to delete page record.");
    } finally {
      setLoading(false);
    }
  };

  const triggerPhotoUpload = (id: string | "new") => {
    setUploadingStaffId(id);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadingStaffId && e.target.files?.[0]) {
      const file = e.target.files[0];
      
      if (uploadingStaffId === "new") {
        setSelectedPhotoFile(file);
        setLocalPhotoPreview(URL.createObjectURL(file));
        toast.success("Profile photo preview loaded. It will upload upon saving.");
        setUploadingStaffId(null);
        e.target.value = '';
        return;
      }

      const staffId = uploadingStaffId;
      const loadingToast = toast.loading("Uploading high-resolution biometric image...");
      try {
        const response = await apiService.uploadStaffPhoto(Number(staffId), file);
        const newPath = response.data.data?.path || response.data.path;
        
        setStaffList(prev => prev.map(t => 
          t.id.toString() === staffId.toString() ? { ...t, photo: newPath } : t
        ));
        setFormData((prev: any) => ({ ...prev, photo: newPath }));
        if (selectedStaff && selectedStaff.id.toString() === staffId.toString()) {
          setSelectedStaff(prev => prev ? { ...prev, photo: newPath } : null);
        }
        
        toast.dismiss(loadingToast);
        toast.success("Staff profile photo is updated successfully.");
      } catch (error) {
        toast.dismiss(loadingToast);
        console.error("Upload failed", error);
        toast.error("Could not sync profile image upload.");
      } finally {
        setUploadingStaffId(null);
      }
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="bg-blue-600 p-4 rounded-[1.25rem] text-white shadow-2xl shadow-blue-200">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">Staff Management</h1>
            <p className="text-slate-400 font-bold mt-1 text-xs sm:text-sm uppercase tracking-widest leading-none">Administrative control for personnel & assignments</p>
          </div>
        </div>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if(!open) resetForm(); else fetchMasters(); }}>
            <DeleteConfirmation 
              isOpen={isDeleteDialogOpen}
              onClose={() => setIsDeleteDialogOpen(false)}
              onConfirm={confirmDelete}
              loading={loading && isDeleteDialogOpen}
              title="Decommission Staff Onboarding Record"
              description={`This will permanently delete ${deleteInfo?.name}'s record. Related active identity tags will be deactivated.`}
            />
            <DialogTrigger
              render={
                <div className="flex items-center justify-center gap-2 h-11 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 text-white border-none outline-none cursor-pointer font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5 active:scale-95">
                  <UserPlus size={18} className="stroke-[3]" /> Onboard Staff
                </div>
              }
            />
            <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] flex flex-col p-0 border-none shadow-3xl rounded-[2.5rem] overflow-hidden">
                <div className="bg-slate-900 px-10 py-8 text-white relative shrink-0">
                  <div className="relative z-10 flex items-center justify-between">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-blue-500 rounded-2xl shadow-2xl shadow-blue-500/20">
                          <UserPlus size={24} className="text-white" />
                        </div>
                        {isEditing ? "Modify Personnel Record" : "Onboard Staff Member"}
                      </DialogTitle>
                      <DialogDescription className="text-slate-400 text-sm mt-1 font-bold uppercase tracking-wider">
                        Configure institutional, personal, contact and professional specifications.
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  <div className="absolute right-[-5%] top-[-5%] w-72 h-72 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
                </div>
              
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-10 py-8 bg-white custom-scrollbar">
                  <div className="max-w-4xl mx-auto space-y-10">
                    
                    {/* SECTION 1: INSTITUTIONAL CONTEXT */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4 mb-4 pb-2 border-b border-slate-50">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Institutional Context</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-1", formErrors.schoolId ? "text-red-500" : "text-slate-400")}>Campus Branch {formErrors.schoolId && "*"}</Label>
                          <Select 
                            value={formData.schoolId.toString()} 
                            onValueChange={(v) => {
                              setFormData({...formData, schoolId: v});
                              if (formErrors.schoolId) setFormErrors(prev => ({ ...prev, schoolId: false }));
                            }}
                            disabled={user.role !== "superadmin" && !!user.schoolId}
                          >
                            <SelectTrigger 
                              ref={el => { inputRefs.current["schoolId"] = el; }}
                              className={cn(
                                "h-12 border-slate-100 bg-slate-50/50 font-black text-slate-800 rounded-2xl px-5 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all text-sm",
                                formErrors.schoolId && "border-red-500 ring-2 ring-red-500/10",
                                (user.role !== "superadmin" && !!user.schoolId) && "opacity-80 cursor-not-allowed bg-slate-100"
                              )}
                            >
                              <SelectValue placeholder="Select Campus">
                                {formData.schoolId ? schools.find(s => s.id.toString() === formData.schoolId.toString())?.name : undefined}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-80 rounded-[2rem] shadow-2xl border-slate-100 p-3">
                              {schools.map(s => (
                                <SelectItem key={s.id} value={s.id.toString()} className="font-black py-4 px-4 rounded-2xl focus:bg-blue-50 focus:text-blue-700 cursor-pointer">
                                  <span className="text-sm uppercase tracking-tight">{s.name}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Staff Initials</Label>
                          <Input value={formData.initials} onChange={e => setFormData({...formData, initials: e.target.value})} placeholder="Mr. / Ms. / Dr." className="h-12 border-slate-100 bg-slate-50/50 font-black rounded-2xl px-5 text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Shift Selection</Label>
                          <Select value={formData.shiftId} onValueChange={v => setFormData({...formData, shiftId: v})}>
                            <SelectTrigger className="h-12 border-slate-100 bg-slate-50/50 font-black text-slate-800 rounded-2xl px-5 text-sm">
                              <SelectValue placeholder="Select Shift" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-xl p-2 border-slate-100">
                              {shifts.map(sh => (
                                <SelectItem key={sh.id} value={sh.id.toString()} className="font-black py-3 px-4 rounded-xl text-xs uppercase tracking-widest">{sh.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">RFID Tag Number</Label>
                          <Input value={formData.rfid} onChange={e => setFormData({...formData, rfid: e.target.value})} placeholder="RFID Tag UID" className="h-12 border-slate-100 bg-slate-50/50 font-black rounded-2xl px-5 text-sm focus:bg-white" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Bio Station ID</Label>
                          <Input value={formData.bioId} onChange={e => setFormData({...formData, bioId: e.target.value})} placeholder="Biometric Machine ID" className="h-12 border-slate-100 bg-slate-50/50 font-black rounded-2xl px-5 text-sm focus:bg-white" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Status</Label>
                          <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                            <SelectTrigger className="h-12 border-slate-100 bg-slate-50/50 font-black text-slate-800 rounded-2xl px-5 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 p-2 shadow-xl">
                              <SelectItem value="Active" className="font-black text-xs uppercase tracking-widest">Active</SelectItem>
                              <SelectItem value="On Leave" className="font-black text-xs uppercase tracking-widest">On Leave</SelectItem>
                              <SelectItem value="Resigned" className="font-black text-xs uppercase tracking-widest">Resigned</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>

                    {/* SECTION 2: PRIMARY IDENTITY & BIOLOGY */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4 mb-4 pb-2 border-b border-slate-50">
                        <div className="w-1.5 h-6 bg-pink-500 rounded-full"></div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Primary Biographical Profile</h3>
                      </div>

                      <div className="flex flex-col md:flex-row gap-8">
                        {/* Avatar Picker Frame */}
                        <div className="flex flex-col items-center gap-4 shrink-0">
                          <div 
                            className="relative group cursor-pointer"
                            onClick={() => triggerPhotoUpload((isEditing && selectedStaff?.id) ? selectedStaff.id.toString() : "new")}
                          >
                            <div className="w-40 h-40 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-50 flex items-center justify-center transition-all group-hover:scale-[1.02]">
                               {(localPhotoPreview || formData.photo) ? (
                                 <img 
                                   src={localPhotoPreview || resolvePhotoUrl(formData.photo)} 
                                   alt="Personnel" 
                                   className="w-full h-full object-cover"
                                 />
                               ) : (
                                 <div className="flex flex-col items-center gap-2 text-slate-300">
                                   <UserCircle size={36} className="opacity-20" />
                                   <span className="text-[10px] font-black tracking-widest">NO IMAGE</span>
                                 </div>
                               )}
                               <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-[2px]">
                                 <Camera size={20} />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Update Photo</span>
                               </div>
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold text-center leading-relaxed max-w-[150px]">Click window to update high-res biometric portrait.</p>
                        </div>

                        {/* Name Grid Layout */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-1", formErrors.firstName ? "text-red-500" : "text-slate-400")}>First Name *</Label>
                            <Input 
                              ref={el => { inputRefs.current["firstName"] = el; }}
                              value={formData.firstName} 
                              onChange={e => {
                                setFormData({...formData, firstName: e.target.value});
                                if (formErrors.firstName) setFormErrors(prev => ({ ...prev, firstName: false }));
                              }} 
                              placeholder="Sophia" 
                              className={cn("h-12 border-slate-100 bg-slate-50/50 font-black rounded-2xl px-5 text-sm placeholder:text-slate-300", formErrors.firstName && "border-red-500 ring-2-red-500")}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Middle Name</Label>
                            <Input value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} placeholder="Optional" className="h-12 border-slate-100 bg-slate-50/50 font-black rounded-2xl px-5 text-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-1", formErrors.lastName ? "text-red-500" : "text-slate-400")}>Last Name *</Label>
                            <Input 
                              ref={el => { inputRefs.current["lastName"] = el; }}
                              value={formData.lastName} 
                              onChange={e => {
                                setFormData({...formData, lastName: e.target.value});
                                if (formErrors.lastName) setFormErrors(prev => ({ ...prev, lastName: false }));
                              }} 
                              placeholder="Williams" 
                              className="h-12 border-slate-100 bg-slate-50/50 font-black rounded-2xl px-5 text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Gender</Label>
                            <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                              <SelectTrigger className="h-12 border-slate-100 bg-slate-50/50 font-black text-slate-800 rounded-2xl px-5 text-sm">
                                <SelectValue placeholder="Gender" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                                <SelectItem value="Male" className="font-black text-xs uppercase tracking-widest">Male</SelectItem>
                                <SelectItem value="Female" className="font-black text-xs uppercase tracking-widest">Female</SelectItem>
                                <SelectItem value="Other" className="font-black text-xs uppercase tracking-widest">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Date of Birth</Label>
                            <Input type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="h-12 border-slate-100 bg-slate-50/50 font-black rounded-2xl px-5 text-sm text-slate-800" />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Blood Group</Label>
                            <Select value={formData.bloodGroupId} onValueChange={v => setFormData({...formData, bloodGroupId: v})}>
                              <SelectTrigger className="h-12 border-slate-100 bg-slate-50/50 font-black text-slate-800 rounded-2xl px-5 text-sm">
                                <SelectValue placeholder="Blood Group" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl shadow-xl p-2 border-slate-100">
                                {bloodGroups.map(bg => (
                                  <SelectItem key={bg.id} value={bg.id.toString()} className="font-black py-3 px-4 rounded-xl text-xs uppercase tracking-widest">{bg.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Religion</Label>
                          <Select value={formData.religionId} onValueChange={v => setFormData({...formData, religionId: v})}>
                            <SelectTrigger className="h-12 border-slate-100 bg-slate-50/50 font-black text-slate-800 rounded-2xl px-5 text-sm">
                              <SelectValue placeholder="Select Religion" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-xl p-2 border-slate-100 max-h-56">
                              {religions.map(rel => (
                                <SelectItem key={rel.id} value={rel.id.toString()} className="font-black text-xs uppercase tracking-widest">{rel.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Caste Category</Label>
                          <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v})}>
                            <SelectTrigger className="h-12 border-slate-100 bg-slate-50/50 font-black text-slate-800 rounded-2xl px-5 text-sm">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-xl p-2 border-slate-100 max-h-56">
                              {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id.toString()} className="font-black text-xs uppercase tracking-widest">{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Specific Caste</Label>
                          <Select value={formData.casteId} onValueChange={v => setFormData({...formData, casteId: v})}>
                            <SelectTrigger className="h-12 border-slate-100 bg-slate-50/50 font-black text-slate-800 rounded-2xl px-5 text-sm">
                              <SelectValue placeholder="Select Caste" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-xl p-2 border-slate-100 max-h-56">
                              {castes.map(cas => (
                                <SelectItem key={cas.id} value={cas.id.toString()} className="font-black text-xs uppercase tracking-widest">{cas.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sub Caste</Label>
                          <Select value={formData.subCasteId} onValueChange={v => setFormData({...formData, subCasteId: v})}>
                            <SelectTrigger className="h-12 border-slate-100 bg-slate-50/50 font-black text-slate-800 rounded-2xl px-5 text-sm">
                              <SelectValue placeholder="Select SubCaste" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-xl p-2 border-slate-100 max-h-56">
                              {subCastes.map(sc => (
                                <SelectItem key={sc.id} value={sc.id.toString()} className="font-black text-xs uppercase tracking-widest">{sc.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>

                    {/* SECTION 3: CONNECTIVITY & REGION */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4 mb-4 pb-2 border-b border-slate-50">
                        <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Connectability & Location</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2 col-span-1">
                          <Label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-1", formErrors.email ? "text-red-500" : "text-slate-400")}>Work Email Protcol *</Label>
                          <Input 
                            ref={el => { inputRefs.current["email"] = el; }}
                            type="email" 
                            value={formData.email} 
                            onChange={e => {
                              setFormData({...formData, email: e.target.value});
                              if (formErrors.email) setFormErrors(prev => ({ ...prev, email: false }));
                            }} 
                            placeholder="staff@campus.edu" 
                            className="h-12 border-slate-100 bg-slate-50/50 font-black rounded-2xl px-5 text-sm"
                          />
                        </div>

                        <div className="space-y-2 col-span-1">
                          <Label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-1", formErrors.phone ? "text-red-500" : "text-slate-400")}>Primary Phone Line *</Label>
                          <Input 
                            ref={el => { inputRefs.current["phone"] = el; }}
                            value={formData.phone} 
                            maxLength={10}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setFormData({...formData, phone: val});
                              if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: false }));
                            }} 
                            placeholder="Primary 10-digit mobil" 
                            className="h-12 border-slate-100 bg-slate-50/50 font-black rounded-2xl px-5 text-sm"
                          />
                        </div>

                        <div className="space-y-2 col-span-1">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Alternative Contact</Label>
                          <Input 
                            value={formData.contact2} 
                            maxLength={15}
                            onChange={e => setFormData({...formData, contact2: e.target.value.replace(/\D/g, "")})} 
                            placeholder="Secondary contact" 
                            className="h-12 border-slate-100 bg-slate-50/50 font-black rounded-2xl px-5 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="space-y-2 md:col-span-6">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Residential Address</Label>
                          <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Building, Street, Lane" className="h-12 border-slate-100 bg-slate-50/50 font-black rounded-2xl px-5 text-sm" />
                        </div>

                        <div className="space-y-2 md:col-span-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">State</Label>
                          <Select value={formData.stateId} onValueChange={v => setFormData({...formData, stateId: v})}>
                            <SelectTrigger className="h-12 border-slate-100 bg-slate-50/50 font-black text-slate-800 rounded-2xl px-5 text-sm">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-xl p-2 border-slate-100">
                              {states.map(st => (
                                <SelectItem key={st.id} value={st.id.toString()} className="font-black text-xs uppercase tracking-widest">{st.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">City</Label>
                          <Select value={formData.cityId} onValueChange={v => setFormData({...formData, cityId: v})}>
                            <SelectTrigger className="h-12 border-slate-100 bg-slate-50/50 font-black text-slate-800 rounded-2xl px-5 text-sm">
                              <SelectValue placeholder="Select City" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-xl p-2 border-slate-100">
                              {cities.map(ct => (
                                <SelectItem key={ct.id} value={ct.id.toString()} className="font-black text-xs uppercase tracking-widest">{ct.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>

                    {/* SECTION 4: PROFESSIONAL SPECS */}
                    <section className="bg-slate-50/80 p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                      <div className="flex items-center gap-4 mb-4 pt-1">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Rank, Credentials & Load</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-1", formErrors.qualification ? "text-red-500" : "text-slate-400")}>Educational Credentials *</Label>
                          <Input 
                            ref={el => { inputRefs.current["qualification"] = el; }}
                            value={formData.qualification} 
                            onChange={e => {
                              setFormData({...formData, qualification: e.target.value});
                              if (formErrors.qualification) setFormErrors(prev => ({ ...prev, qualification: false }));
                            }} 
                            placeholder="M.Sc, B.Ed, PhD" 
                            className="h-12 border-slate-100 bg-white font-black rounded-2xl px-5 text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Faculty Tenure (Years)</Label>
                          <Input value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder="7 Years" className="h-12 border-slate-100 bg-white font-black rounded-2xl px-5 text-sm" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Expertise/Primary Subject</Label>
                          <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="e.g. Physics / Mathematics" className="h-12 border-slate-100 bg-white font-black rounded-2xl px-5 text-sm" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Academic Grade/Standard</Label>
                          <Select value={formData.standardId} onValueChange={v => setFormData({...formData, standardId: v})}>
                            <SelectTrigger className="h-12 border-slate-100 bg-white font-black text-slate-800 rounded-2xl px-5 text-sm">
                              <SelectValue placeholder="Select Standard" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2 max-h-56">
                              {standards.map(st => (
                                <SelectItem key={st.id} value={st.id.toString()} className="font-black text-xs uppercase tracking-widest">{st.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Grade Division/Section</Label>
                          <Select value={formData.sectionId} onValueChange={v => setFormData({...formData, sectionId: v})}>
                            <SelectTrigger className="h-12 border-slate-100 bg-white font-black text-slate-800 rounded-2xl px-5 text-sm">
                              <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2 max-h-56">
                              {sections.map(sec => (
                                <SelectItem key={sec.id} value={sec.id.toString()} className="font-black text-xs uppercase tracking-widest">{sec.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Joining Date</Label>
                          <Input type="date" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} className="h-12 border-slate-100 bg-white font-black rounded-2xl px-5 text-sm text-slate-800" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Retirement Date</Label>
                          <Input type="date" value={formData.retirementDate} onChange={e => setFormData({...formData, retirementDate: e.target.value})} className="h-12 border-slate-100 bg-white font-black rounded-2xl px-5 text-sm text-slate-800" />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-3">
                        <input
                          type="checkbox"
                          id="isClassTeacher"
                          name="isClassTeacher"
                          checked={formData.isClassTeacher}
                          onChange={e => setFormData({...formData, isClassTeacher: e.target.checked})}
                          className="w-5 h-5 rounded-lg text-blue-600 bg-white border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/5 cursor-pointer accent-blue-600"
                        />
                        <Label htmlFor="isClassTeacher" className="text-xs font-black text-slate-800 uppercase tracking-widest cursor-pointer select-none">
                          Designate as Active CLASS TEACHER for selected grade
                        </Label>
                      </div>
                    </section>

                  </div>
                </div>

                <DialogFooter className="bg-slate-50 px-10 py-6 shrink-0 border-t border-slate-100 flex flex-row items-center justify-end gap-4">
                  <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="h-11 px-8 font-black text-slate-400 hover:text-slate-900 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateOrUpdate} 
                    className="h-12 px-10 bg-slate-900 hover:bg-blue-600 text-white font-black shadow-2xl shadow-slate-200/50 rounded-2xl transition-all active:scale-[0.98] text-[10px] uppercase tracking-[0.2em]"
                  >
                    {isEditing ? "Apply Updates" : "Commit Record"}
                  </Button>
                </DialogFooter>
              </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="dashboard-card border-none overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative group flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
              <Input 
                placeholder="Query staff directory..." 
                className="pl-12 h-12 bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-bold rounded-2xl"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleExport} variant="outline" size="sm" className="h-10 px-4 rounded-xl border-slate-100 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest">
                  <Download size={16} className="mr-2" /> Export Excel
                </Button>
                <div className="h-6 w-px bg-slate-100 mx-2" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Active Records: {totalCount}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-24 gap-4 animate-pulse">
               <div className="p-4 bg-slate-50 rounded-full">
                  <Loader2 size={32} className="animate-spin text-blue-600" />
               </div>
               <p className="font-black text-slate-300 uppercase tracking-widest text-[10px]">Syncing directory listings...</p>
             </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow className="h-16 border-slate-50">
                  <TableHead className="w-[140px] pl-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer group" onClick={() => handleSort('employeeId')}>
                    <div className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                      Index ID 
                      {sortBy === 'employeeId' ? (sortOrder === "asc" ? <ChevronUp size={14} className="opacity-100 text-blue-600" /> : <ChevronDown size={14} className="opacity-100 text-blue-600" />) : <ChevronDown size={14} className="transition-all opacity-0 group-hover:opacity-100" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer group" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                      Personnel Name 
                      {sortBy === 'name' ? (sortOrder === "asc" ? <ChevronUp size={14} className="opacity-100 text-blue-600" /> : <ChevronDown size={14} className="opacity-100 text-blue-600" />) : <ChevronDown size={14} className="transition-all opacity-0 group-hover:opacity-100" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer group" onClick={() => handleSort('subject')}>
                    <div className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                      Core Subject 
                      {sortBy === 'subject' ? (sortOrder === "asc" ? <ChevronUp size={14} className="opacity-100 text-blue-600" /> : <ChevronDown size={14} className="opacity-100 text-blue-600" />) : <ChevronDown size={14} className="transition-all opacity-0 group-hover:opacity-100" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer group" onClick={() => handleSort('qualification')}>
                    <div className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                      Credentials 
                      {sortBy === 'qualification' ? (sortOrder === "asc" ? <ChevronUp size={14} className="opacity-100 text-blue-600" /> : <ChevronDown size={14} className="opacity-100 text-blue-600" />) : <ChevronDown size={14} className="transition-all opacity-0 group-hover:opacity-100" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Status</TableHead>
                  <TableHead className="text-right pr-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!Array.isArray(staffList) || staffList.length === 0) ? (
                  <TableRow>
                     <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                           <div className="p-6 bg-slate-50 rounded-full text-slate-200">
                             <Users size={48} />
                           </div>
                           <p className="text-lg font-black text-slate-300 italic tracking-tight uppercase">No Matching Staff List Found</p>
                        </div>
                     </TableCell>
                  </TableRow>
                ) : (
                  staffList.map((staffObj) => (
                  <TableRow key={staffObj.id} className="hover:bg-slate-50/50 transition-all group border-b border-slate-50/80 h-20">
                    <TableCell className="pl-8">
                       <span className="font-mono text-[11px] font-black text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded-lg border border-blue-100/50 italic tracking-tighter">
                        {staffObj.employeeId || staffObj.id}
                       </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <Avatar className="h-11 w-11 ring-4 ring-white shadow-lg shadow-slate-200 transition-transform group-hover:scale-105">
                            <AvatarImage src={resolvePhotoUrl(staffObj.photo)} />
                            <AvatarFallback className="bg-indigo-600 text-white font-black uppercase text-sm">
                              {staffObj.initials || (staffObj.name || "S")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <SimpleTooltip content="Update Photo" side="top">
                            <button 
                              onClick={() => triggerPhotoUpload(staffObj.id)}
                              className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full border border-slate-100 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 cursor-pointer z-10"
                              aria-label="Change photo"
                            >
                              <Camera size={10} className="text-blue-600" />
                            </button>
                          </SimpleTooltip>
                        </div>
                        <div className="flex flex-col truncate max-w-[200px]">
                          <span className="font-black text-slate-900 leading-none text-sm tracking-tight mb-1 flex items-center gap-2">
                            {staffObj.name}
                            {staffObj.isClassTeacher && (
                              <Badge className="bg-yellow-500 text-white font-bold text-[8px] px-1 py-0 border-none">CT</Badge>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold italic truncate">{staffObj.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-3 py-1 bg-slate-100/80 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                        {staffObj.subject}
                      </span>
                    </TableCell>
                    <TableCell className="text-[11px] font-black text-slate-400 italic tracking-tight truncate max-w-[150px]">
                        {staffObj.qualification}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "font-black text-[9px] uppercase tracking-[0.1em] px-2.5 py-0.5 rounded-lg border-transparent",
                        staffObj.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                      )} variant="outline">
                        {staffObj.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <DropdownMenu>
                         <SimpleTooltip content="Administrative Controls" side="left">
                            <DropdownMenuTrigger
                              render={
                                <div className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all cursor-pointer outline-none active:scale-90">
                                  <MoreHorizontal size={18} />
                                </div>
                              }
                            />
                         </SimpleTooltip>
                        <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-2xl p-2 min-w-[220px]">
                          <DropdownMenuGroup>
                            <DropdownMenuItem className="gap-4 py-3 px-4 rounded-xl cursor-pointer focus:bg-indigo-50 group/item" onClick={() => {
                              setSelectedStaff(staffObj);
                              setIsEditing(true);
                              const names = (staffObj.name || "").split(' ');
                              
                              setFormData({
                                firstName: names[0] || "",
                                lastName: names.length > 1 ? names.slice(-1)[0] : "",
                                middleName: names.length > 2 ? names.slice(1, -1).join(' ') : "",
                                email: staffObj.email,
                                phone: staffObj.phone,
                                contact2: staffObj.contact2,
                                qualification: staffObj.qualification,
                                experience: staffObj.experience,
                                subject: staffObj.subject,
                                standardId: staffObj.standardId || "",
                                sectionId: staffObj.sectionId || "",
                                isClassTeacher: staffObj.isClassTeacher,
                                status: staffObj.status,
                                schoolId: staffObj.schoolId || user.schoolId || "",
                                initials: staffObj.initials,
                                gender: staffObj.gender,
                                dateOfBirth: staffObj.dateOfBirth,
                                bloodGroupId: staffObj.bloodGroupId,
                                retirementDate: staffObj.retirementDate,
                                religionId: staffObj.religionId,
                                casteId: staffObj.casteId,
                                subCasteId: staffObj.subCasteId,
                                categoryId: staffObj.categoryId,
                                joiningDate: staffObj.joiningDate ? staffObj.joiningDate.split('T')[0] : "",
                                address: staffObj.address,
                                cityId: staffObj.cityId,
                                stateId: staffObj.stateId,
                                bioId: staffObj.bioId,
                                rfid: staffObj.rfid,
                                shiftId: staffObj.shiftId,
                                photo: staffObj.photo || ""
                              });
                              setIsAddDialogOpen(true);
                            }}>
                              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover/item:bg-indigo-600 group-hover/item:text-white transition-colors">
                                <Edit size={16} />
                              </div>
                              <div className="flex flex-col">
                                 <span className="font-black text-slate-800 text-xs uppercase tracking-widest">Modify Onboarding</span>
                                 <span className="text-[9px] text-slate-400 font-bold uppercase italic">Update details</span>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-4 py-3 px-4 rounded-xl cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 group/del" onClick={() => handleDeleteStaff(staffObj.id, staffObj.name)}>
                              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl group-hover/del:bg-red-600 group-hover/del:text-white transition-colors">
                                <Trash2 size={16} />
                              </div>
                              <div className="flex flex-col">
                                 <span className="font-black text-red-600 text-xs uppercase tracking-widest">Decommission</span>
                                 <span className="text-[9px] text-red-400 font-bold uppercase italic">Remove permanently</span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination Footer */}
          {!loading && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 bg-slate-50/50 border-t border-slate-100 gap-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest text-[10px]">
                Showing <span className="text-slate-900 font-black">{staffList.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to <span className="text-slate-900 font-black">{Math.min(page * pageSize, totalCount)}</span> of <span className="text-slate-900 font-black">{totalCount}</span> entries
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows per page</span>
                  <Select value={pageSize.toString()} onValueChange={(v) => { if (v !== null) { setPageSize(parseInt(v)); setPage(1); } }}>
                    <SelectTrigger className="w-[70px] h-8 bg-white border-slate-200 rounded-lg text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      {[10, 25, 50, 100].map(size => (
                        <SelectItem key={size} value={size.toString()} className="text-xs font-bold">{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg border-slate-200 hover:bg-white hover:text-blue-600 disabled:opacity-30"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                  >
                    <ChevronsLeft size={14} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg border-slate-200 hover:bg-white hover:text-blue-600 disabled:opacity-30"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={14} />
                  </Button>

                  <div className="flex items-center px-3 h-8 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-900 mx-1">
                    Page {page} of {totalPages || 1}
                  </div>

                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg border-slate-200 hover:bg-white hover:text-blue-600 disabled:opacity-30"
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight size={14} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg border-slate-200 hover:bg-white hover:text-blue-600 disabled:opacity-30"
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                  >
                    <ChevronsRight size={14} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
