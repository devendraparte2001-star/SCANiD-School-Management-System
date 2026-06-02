import React, { useState, useRef, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { apiService } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Download,
  Upload,
  MoreHorizontal,
  Edit2,
  Trash2,
  Filter,
  Camera,
  UserCircle,
  FileText,
  GraduationCap,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteConfirmation } from "@/components/shared/DeleteConfirmation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SimpleTooltip } from "@/components/shared/SimpleTooltip";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { User as UserType } from "@/types";
import { cn, parseSafeInt, resolvePhotoUrl } from "@/lib/utils";

export default function Students({ user }: { user: UserType }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [standardFilter, setStandardFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  // Pagination & Sorting State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("fullName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [schools, setSchools] = useState<any[]>([]);
  const [standardsMaster, setStandardsMaster] = useState<any[]>([]);
  const [sectionsMaster, setSectionsMaster] = useState<any[]>([]);
  const [bloodGroups, setBloodGroups] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [admissionTypes, setAdmissionTypes] = useState<any[]>([]);
  const [religions, setReligions] = useState<any[]>([]);
  const [castes, setCastes] = useState<any[]>([]);
  const [subCastes, setSubCastes] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [schoolSections, setSchoolSections] = useState<any[]>([]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

  const fetchMasters = useCallback(async () => {
    // Robust master data fetching: wrap each call to handle failure gracefully and prevent Promise.all crash
    const safeFetch = async (promise: Promise<any>, masterName: string) => {
      try {
        return await promise;
      } catch (err) {
        console.warn(`Failed to fetch master [${masterName}] from API:`, err);
        return { data: [] };
      }
    };

    try {
      const [
        standardsRes,
        sectionsRes,
        schoolsRes,
        bloodGroupsRes,
        housesRes,
        admissionTypesRes,
        religionsRes,
        castesRes,
        subCastesRes,
        academicYearsRes,
        shiftsRes,
        categoriesRes,
        statesRes,
        citiesRes,
        schoolSectionsRes
      ] = await Promise.all([
        safeFetch(apiService.getStandards(), "standards"),
        safeFetch(apiService.getSections(), "sections"),
        safeFetch(apiService.getSchools(), "schools"),
        safeFetch(apiService.getBloodGroups(), "bloodGroups"),
        safeFetch(apiService.getHouses(), "houses"),
        safeFetch(apiService.getAdmissionTypes(), "admissionTypes"),
        safeFetch(apiService.getReligions(), "religions"),
        safeFetch(apiService.getCastes(), "castes"),
        safeFetch(apiService.getSubCastes(), "subCastes"),
        safeFetch(apiService.getAcademicYears(), "academicYears"),
        safeFetch(apiService.getShifts(), "shifts"),
        safeFetch(apiService.getCategories(), "categories"),
        safeFetch(apiService.getStates(), "states"),
        safeFetch(apiService.getCities(), "cities"),
        safeFetch(apiService.getSchoolSections(), "schoolSections")
      ]);

      const normalize = (res: any) => Array.isArray(res.data) ? res.data : (res.data?.data || []);

      setStandardsMaster(normalize(standardsRes));
      setSectionsMaster(normalize(sectionsRes));
      setSchools(normalize(schoolsRes));
      setBloodGroups(normalize(bloodGroupsRes));
      setHouses(normalize(housesRes));
      setAdmissionTypes(normalize(admissionTypesRes));
      setReligions(normalize(religionsRes));
      setCastes(normalize(castesRes));
      setSubCastes(normalize(subCastesRes));
      setAcademicYears(normalize(academicYearsRes));
      setShifts(normalize(shiftsRes));
      setCategories(normalize(categoriesRes));
      setStates(normalize(statesRes));
      setCities(normalize(citiesRes));
      setSchoolSections(normalize(schoolSectionsRes));
    } catch (error) {
      console.error("Fetch masters error:", error);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getStudents(
        parseSafeInt(user.schoolId),
        parseSafeInt(user.academicYearId),
        {
          page,
          pageSize,
          sortBy,
          sortOrder,
          search,
          // @ts-ignore - adding filters to params
          standardId: standardFilter === "all" ? undefined : parseSafeInt(standardFilter),
          sectionId: sectionFilter === "all" ? undefined : parseSafeInt(sectionFilter)
        }
      );

      const responseData = response.data;

      // Support both { data: [...], pagination: {...} } envelope and raw array [...] formats
      const rawStudentsList = Array.isArray(responseData)
        ? responseData
        : (responseData && Array.isArray(responseData.data) ? responseData.data : []);

      const formatted = rawStudentsList.map((s: any) => {
        // Helper to fetch data by ensuring case-insensitive property access for specific schema fields
        const getVal = (prop: string, fallback?: any) => {
          if (!s) return fallback;
          const keys = Object.keys(s);
          const match = keys.find(k => k.toLowerCase() === prop.toLowerCase());
          return match ? s[match] : fallback;
        };

        // Robust helper to safely extract an ID from standard values, numbers or nested objects to avoid leaks
        const getSafeId = (val: any): string => {
          if (!val) return "";
          if (typeof val === "object") {
            return val.id?.toString() || val.id || "";
          }
          return val.toString();
        };

        return {
          id: s.id?.toString() || "",
          grno: getVal("GrNo") || getVal("GRNO") || s.grno || "",
          schoolId: (s.schoolId || s.SchoolId)?.toString() || "",
          firstName: getVal("FirstName") || getVal("FNAME") || s.firstName || (s.name || s.fullName)?.split(" ")[0] || "",
          lastName: getVal("LastName") || getVal("LNAME") || s.lastName || (s.name || s.fullName)?.split(" ").slice(-1)[0] || "",
          middleName: getVal("MiddleName") || getVal("MNAME") || s.middleName || ((s.name || s.fullName)?.split(" ").length > 2 ? (s.name || s.fullName)?.split(" ").slice(1, -1).join(" ") : ""),
          name: s.name || s.fullName || s.FullName || getVal("FullName") || getVal("Name") || "",
          standard: typeof getVal("STD") === "object" ? getVal("STD")?.name : (getVal("STD") || s.standard?.name || s.Standard?.name || s.standard || ""),
          section: typeof getVal("DIV") === "object" ? getVal("DIV")?.name : (getVal("DIV") || s.section?.name || s.Section?.name || s.section || ""),
          bloodGroupId: getSafeId(getVal("bloodGroupId") || getVal("BLOODGROUP") || s.bloodGroupId),
          houseId: getSafeId(getVal("houseId") || getVal("house") || s.houseId),
          SchoolSectionId: getSafeId(getVal("SchoolSectionId") || s.schoolSectionId),
          admissionTypeId: getSafeId(getVal("admissionTypeId") || getVal("admissiontype") || s.admissionTypeId),
          religionId: getSafeId(getVal("religionId") || getVal("RELIGION") || s.religionId),
          casteId: getSafeId(getVal("casteId") || getVal("CASTE") || s.casteId),
          subCasteId: getSafeId(getVal("subCasteId") || getVal("subcaste") || s.subCasteId),
          joiningAcademicYearId: getSafeId(getVal("academicYearId") || getVal("academicyear") || s.joiningAcademicYearId),
          roll: getVal("ROLLNO") || s.rollNumber?.toString() || s.roll?.toString() || "0",
          address: getVal("Address") || getVal("ADDRESS") || s.address || "N/A",
          birthDate: String(getVal("DateOfBirth") || getVal("DOB") || s.dateOfBirth || s.DateOfBirth || "").split("T")[0].split(" ")[0] || "",
          gender: getVal("Gender") || getVal("GENDER") || s.gender || "male",
          contactNumber: getVal("FatherContactNo") || getVal("MOBILE") || s.contactNumber || s.mobile || "",
          fatherContactNo: getVal("FatherContactNo") || getVal("MOBILE") || s.fatherContactNo || s.contactNumber || s.mobile || "",
          motherContactNo: getVal("MotherContactNo") || getVal("contact2") || s.motherContactNo || s.contact2 || "",
          motherName: getVal("MotherName") || getVal("MOTHERNAME") || s.motherName || "",
          aadharCard: getVal("AadharCard") || getVal("aadharcard") || s.aadharCard || "",
          profilePhotoPath: getVal("ProfilePhotoPath") || s.profilePhotoPath || "",
          photo: getVal("ProfilePhotoPath") || s.profilePhotoPath || s.photo || s.Photo || "",
          attendance: "100%",
          performance: "Excellent",

          // Clean camelCase DB and API columns
          schoolSection: getVal("SchoolSectionId") ? schoolSections.find((sec: any) => sec.id?.toString() === getSafeId(getVal("SchoolSectionId")))?.name : (getVal("schoolSection") || s.schoolSection || ""),
          academicYearId: getSafeId(getVal("academicYearId") || getVal("academicyear") || s.joiningAcademicYearId || s.academicYearId),
          categoryId: getSafeId(getVal("categoryId") || getVal("CATEGORY") || s.categoryId),
          admissionDate: String(getVal("AdmissionDate") || s.admissionDate || s.AdmissionDate || "").split("T")[0].split(" ")[0] || "",
          email: getVal("Email") || getVal("EMAIL") || s.email || "",
          cityId: getVal("CityId") || s.cityId?.toString() || "",
          stateId: getVal("StateId") || s.stateId?.toString() || "",
          shiftId: getSafeId(getVal("shiftId") || s.shiftId),
          shiftName: typeof getVal("shiftId") === "object" ? getVal("shiftId")?.name : (getVal("SHIFTNAME") || s.shiftName || shifts.find((sh: any) => sh.id?.toString() === getSafeId(getVal("shiftId") || s.shiftId))?.name || ""),
          uniformId: getVal("UniformId") || getVal("uniformid") || s.uniformid || s.uniformId || "",
          rfid: getVal("Rfid") || getVal("RFID") || s.rfid || s.CARDID || s.cardId || "",
          sms: getVal("Sms") || getVal("sms") || s.sms || false,
          isStateBoard: getVal("IsStateBoard") || getVal("isStateBoard") || s.isStateBoard || false,
          digitalUniform: getVal("DigitalUniform") || getVal("digitalUniform") || s.digitalUniform || false,
          digitalNotebook: getVal("DigitalNotebook") || getVal("digitalNotebook") || s.digitalNotebook || false,
          status: getVal("Status") || s.status || "Active",
          optedForBus: getVal("OptedForBus") || getVal("optedForBus") || s.optedForBus || false,
          createdBy: getVal("Createdby") || getVal("createdby") || s.createdby || "",
          createdOn: getVal("CreatedOn") || getVal("createdon") || s.createdon || "",
          modifiedBy: getVal("ModifiedBy") || getVal("modifiedBy") || s.modifiedBy || "",
          modifiedOn: getVal("ModifiedOn") || getVal("modifiedon") || s.modifiedon || ""
        };
      });

      const isServerPaged = responseData && !!responseData.pagination;

      if (!isServerPaged) {
        // Apply robust client-side filters, search, sorting and pagination
        let filtered = [...formatted];

        // Search
        const searchLower = search.trim().toLowerCase();
        if (searchLower) {
          filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(searchLower) ||
            item.grno.toLowerCase().includes(searchLower) ||
            item.roll.toLowerCase().includes(searchLower) ||
            item.standard.toLowerCase().includes(searchLower) ||
            item.section.toLowerCase().includes(searchLower)
          );
        }

        // Standard (Grade) Filter
        if (standardFilter !== "all") {
          filtered = filtered.filter(item => (item.standardId || item.StandardId || "").toString() === standardFilter);
        }

        // Section Filter
        if (sectionFilter !== "all") {
          filtered = filtered.filter(item => (item.sectionId || item.SectionId || "").toString() === sectionFilter);
        }

        // Sort
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

        // Paginate
        const total = filtered.length;
        setTotalCount(total);
        setTotalPages(Math.ceil(total / pageSize));

        const startIndex = (page - 1) * pageSize;
        setStudents(filtered.slice(startIndex, startIndex + pageSize));
      } else {
        // Server-side did paging and filtering
        setTotalCount(responseData.pagination.totalCount);
        setTotalPages(responseData.pagination.totalPages);
        setStudents(formatted);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Could not connect to database API.");
    } finally {
      setLoading(false);
    }
  }, [user.schoolId, user.academicYearId, page, pageSize, sortBy, sortOrder, search, standardFilter, sectionFilter, shifts.length]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1); // Reset to first page on sort
  };

  const canManage = user.role === "superadmin" || user.role === "admin";

  const [uploadingStudentId, setUploadingStudentId] = useState<string | number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [localPhotoPreview, setLocalPhotoPreview] = useState<string | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<{ id: string; name: string } | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const inputRefs = useRef<Record<string, any>>({});

  const initialFormState = {
    grno: "",
    schoolId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    fatherContactNo: "",
    motherName: "",
    address: "",
    aadharCard: "",
    dateOfBirth: "",
    rollNumber: "",
    standard: "",
    division: "",
    bloodGroupId: "",
    houseId: "",
    admissionTypeId: "",
    religionId: "",
    casteId: "",
    subCasteId: "",
    categoryId: "",
    academicYearId: "",
    status: "Active",
    rfid: "",
    shiftName: "",
    uniformId: "",
    motherContactNo: "",
    sms: true,
    isStateBoard: false,
    digitalUniform: false,
    digitalNotebook: false,
    profilePhotoPath: "",
    schoolSectionId: "",
    admissionDate: "",
    email: "",
    cityId: "",
    stateId: "",
    optedForBus: false
  };

  const [newStudentFormData, setNewStudentFormData] = useState(initialFormState);
  const [valMessage, setValMessage] = useState<Record<string, string>>({});

  const openAddDialog = () => {
    setIsEditMode(false);
    setCurrentStudentId(null);
    setNewStudentFormData({
      ...initialFormState,
      schoolId: "",
      academicYearId: ""
    });
    setFormErrors({});
    setValMessage({});
    setSelectedPhotoFile(null);
    setLocalPhotoPreview(null);
    setIsAddDialogOpen(true);
    fetchMasters();
  };

  const openEditDialog = (student: any) => {
    setIsEditMode(true);
    setCurrentStudentId(student.id);
    setFormErrors({});
    setValMessage({});
    setSelectedPhotoFile(null);
    setLocalPhotoPreview(null);
    setNewStudentFormData({
      grno: student.grno || "",
      schoolId: (student.schoolId || user.schoolId || "").toString(),
      firstName: student.firstName || "",
      middleName: student.middleName || "",
      lastName: student.lastName || "",
      gender: student.gender || "Male",
      fatherContactNo: student.fatherContactNo || student.contactNumber || "",
      motherName: student.motherName || "",
      address: student.address || "",
      aadharCard: student.aadharCard || "",
      dateOfBirth: student.birthDate || "",
      rollNumber: student.roll || "",
      standard: student.standard || "",
      division: student.section || "",
      bloodGroupId: student.bloodGroupId?.toString() || "",
      houseId: student.houseId?.toString() || "",
      admissionTypeId: student.admissionTypeId?.toString() || "",
      religionId: student.religionId?.toString() || "",
      casteId: student.casteId?.toString() || "",
      categoryId: student.categoryId?.toString() || "",
      subCasteId: student.subCasteId?.toString() || "",
      academicYearId: student.academicYearId?.toString() || student.joiningAcademicYearId?.toString() || "",
      status: student.status || "Active",
      rfid: student.rfid || "",
      shiftName: student.shiftName || "",
      uniformId: student.uniformId || "",
      motherContactNo: student.motherContactNo || "",
      sms: student.sms === "true" || student.sms === true,
      isStateBoard: student.isStateBoard === "true" || student.isStateBoard === true,
      digitalUniform: student.digitalUniform === "true" || student.digitalUniform === true,
      digitalNotebook: student.digitalNotebook === "true" || student.digitalNotebook === true,
      profilePhotoPath: student.profilePhotoPath || "",
      schoolSectionId: student.schoolSectionId?.toString() || student.SchoolSectionId?.toString() || "",
      admissionDate: student.admissionDate || "",
      email: student.email || "",
      cityId: student.cityId?.toString() || "",
      stateId: student.stateId?.toString() || "",
      optedForBus: student.optedForBus === "true" || student.optedForBus === true
    });

    setIsAddDialogOpen(true);
    fetchMasters();
  };

  const handleExport = async () => {
    try {
      // Prepare data for export including all important student fields
      const exportData = filteredStudents.map(s => ({
        "GR Number": s.grno,
        "Name": s.name || `${s.firstName || ""} ${s.middleName || ""} ${s.lastName || ""}`.trim(),
        "School": schools.find(sch => sch.id?.toString() === s.schoolId?.toString())?.name || s.schoolId || "",
        "Status": s.status || "Active",
        "Roll Number": s.roll || s.rollNumber,
        "First Name": s.firstName,
        "Middle Name": s.middleName,
        "Last Name": s.lastName,
        "Gender": s.gender,
        "DateOfBirth": s.birthDate,
        "Address": s.address,
        "Mother Name": s.motherName,
        "FatherContactNo": s.contactNumber || s.fatherContactNo,
        "MotherContactNo": s.motherContactNo,
        "Aadhar Card": s.aadharCard,
        "Uniform ID": s.uniformId,
        "RFID": s.rfid,
        "School Section": s.SchoolSectionId ? schoolSections.find(sec => sec.id?.toString() === s.SchoolSectionId?.toString())?.name : "",
        "Admission Date": s.admissionDate,
        "Email": s.email,
        "Standard": s.standard || (s.standardId ? standardsMaster.find(st => st.id?.toString() === s.standardId?.toString())?.name : ""),
        "Division": s.section || (s.sectionId ? sectionsMaster.find(sec => sec.id?.toString() === s.sectionId?.toString())?.name : ""),
        "Academic Year": s.joiningAcademicYearId ? academicYears.find(ay => ay.id?.toString() === s.joiningAcademicYearId?.toString())?.name : (s.academicYearId ? academicYears.find(ay => ay.id?.toString() === s.academicYearId?.toString())?.name : ""),
        "Caste": s.casteId ? (castes.find(c => c.id?.toString() === s.casteId?.toString())?.name || s.casteId) : "",
        "Sub-Caste": s.subCasteId ? (subCastes.find(sc => sc.id?.toString() === s.subCasteId?.toString())?.name || s.subCasteId) : "",
        "Religion": s.religionId ? (religions.find(r => r.id?.toString() === s.religionId?.toString())?.name || s.religionId) : "",
        "Blood Group": s.bloodGroupId ? (bloodGroups.find(bg => bg.id?.toString() === s.bloodGroupId?.toString())?.name || s.bloodGroupId) : "",
        "House": s.houseId ? (houses.find(h => h.id?.toString() === s.houseId?.toString())?.name || s.houseId) : "",
        "Admission Type": s.admissionTypeId ? (admissionTypes.find(at => at.id?.toString() === s.admissionTypeId?.toString())?.name || s.admissionTypeId) : "",
        "City": s.cityId ? (cities.find(c => c.id?.toString() === s.cityId?.toString())?.name || s.cityId) : "",
        "State": s.stateId ? (states.find(st => st.id?.toString() === s.stateId?.toString())?.name || s.stateId) : "",
        "Shift Name": s.shiftName || (s.shiftId ? (shifts.find(sh => sh.id?.toString() === s.shiftId?.toString())?.name || s.shiftId) : ""),
        "Category": s.categoryId ? (categories.find(c => c.id?.toString() === s.categoryId?.toString())?.name || s.categoryId) : "",
        "Secondary SMS": s.sms ? "Yes" : "No",
        "Is State Board": s.isStateBoard ? "Yes" : "No",
        "Profile Photo Path": s.profilePhotoPath,
        "Digital Uniform": s.digitalUniform ? "Yes" : "No",
        "Digital Notebook": s.digitalNotebook ? "Yes" : "No",
        "Opted for Bus": s.optedForBus ? "Yes" : "No",
        "Is Active": s.isActive !== false ? "Yes" : "No",
        "Is Deleted": s.isDeleted ? "Yes" : "No",
        "Created By": s.createdBy,
        "Created On": s.createdOn,
        "Modified By": s.modifiedBy,
        "Modified On": s.modifiedOn
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, "Students Registry");

      // Set column widths for better readability
      const wscols = [
        { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 10 }, { wch: 12 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
        { wch: 15 }, { wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
        { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
        { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }
      ];
      ws['!cols'] = wscols;

      // Generate download
      XLSX.writeFile(wb, `Students_Registry_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Students registry exported to Excel successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to generate Excel export.");
    }
  };

  const handleImport = () => {
    setIsBulkUploadOpen(true);
  };

  const triggerPhotoUpload = (id: string | number) => {
    setUploadingStudentId(id);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadingStudentId !== null && e.target.files?.[0]) {
      const file = e.target.files[0];

      if (uploadingStudentId === "new") {
        setSelectedPhotoFile(file);
        setLocalPhotoPreview(URL.createObjectURL(file));
        toast.success("Image selected. It will be uploaded when you enroll the student.");
        setUploadingStudentId(null);
        e.target.value = '';
        return;
      }

      const studentId = uploadingStudentId;
      const loadingToast = toast.loading("Storing identity image on server...");
      try {
        const response = await apiService.uploadStudentPhoto(Number(studentId), file);
        const newPath = response.data.data?.path || response.data.path;

        // Update both the list and the form data immediately to reflect the change
        setStudents(prev => prev.map(s =>
          s.id.toString() === studentId.toString() ? { ...s, photo: newPath, profilePhotoPath: newPath, ProfilePhotoPath: newPath } : s
        ));
        setNewStudentFormData(prev => ({
          ...prev,
          profilePhotoPath: newPath,
          ProfilePhotoPath: newPath
        }));

        toast.dismiss(loadingToast);
        toast.success("Profile picture stored and path updated successfully.");
      } catch (error) {
        toast.dismiss(loadingToast);
        console.error("Upload failed:", error);
        toast.error("Cloud storage failure. Could not save physical image file.");
      } finally {
        setUploadingStudentId(null);
      }
    }
    e.target.value = '';
  };

  const downloadSampleExcel = async () => {
    try {
      // Define standard headers based on all current student table fields in exact sequence
      // Using user-friendly names that the mapper will convert to IDs
      const headers = [
        "GrNo", "Name", "SchoolName", "Status", "RollNumber",
        "FirstName", "MiddleName", "LastName", "Gender",
        "DateOfBirth", "Address", "MotherName", "FatherContactNo", "MotherContactNo",
        "AadharCard", "UniformID", "RFID", "SchoolSectionName", "AdmissionDate",
        "Email", "Standard", "Division", "AcademicYear", "CasteName",
        "SubCasteName", "ReligionName", "BloodGroupName", "HouseName", "AdmissionType",
        "CityName", "StateName", "ShiftName", "CategoryName", "SecondarySMS",
        "IsStateBoard", "ProfilePhotoPath", "DigitalUniform", "DigitalNotebook", "OptedForBus"
      ];

      const sampleData = [
        {
          GrNo: "REG1001",
          Name: "John Doe Smith",
          SchoolName: schools.find(sch => sch.id?.toString() === user.schoolId?.toString())?.name || schools[0]?.name || "Main Campus",
          Status: "Active",
          RollNumber: "1",
          FirstName: "John",
          MiddleName: "Doe",
          LastName: "Smith",
          Gender: "Male",
          DateOfBirth: "2010-05-20",
          Address: "123 Education Lane, Sector 4",
          MotherName: "Jane Smith",
          FatherContactNo: "9876543210",
          MotherContactNo: "9876543211",
          AadharCard: "123456789012",
          UniformID: "UNIF-001",
          RFID: "RF99221",
          SchoolSectionName: schoolSections[0]?.name || "Primary",
          AdmissionDate: "2026-05-24",
          Email: "john.smith@example.com",
          Standard: standardsMaster[0]?.name || "10th",
          Division: sectionsMaster[0]?.name || "A",
          AcademicYear: academicYears.find(ay => ay.isCurrent)?.name || academicYears[0]?.name || "2024-25",
          CasteName: castes[0]?.name || "General",
          SubCasteName: subCastes[0]?.name || "None",
          ReligionName: religions[0]?.name || "Hindu",
          BloodGroupName: bloodGroups[0]?.name || "O+",
          HouseName: houses[0]?.name || "Blue House",
          AdmissionType: admissionTypes[0]?.name || "Regular",
          CityName: cities[0]?.name || "",
          StateName: states[0]?.name || "",
          ShiftName: shifts[0]?.name || "Morning",
          CategoryName: categories[0]?.name || "General",
          SecondarySMS: "Yes",
          IsStateBoard: "No",
          ProfilePhotoPath: "/photos/1/example.jpg",
          DigitalUniform: "No",
          DigitalNotebook: "No",
          OptedForBus: "No"
        }
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

      // Add a hidden sheet or comments with available master data values to help user
      XLSX.utils.book_append_sheet(wb, ws, "Students Template");

      XLSX.writeFile(wb, "Student_Import_Template.xlsx");
      toast.success("Student import template generated. Please fill actual names for masters.");
    } catch (error) {
      console.error("Template download error:", error);
      toast.error("Failed to generate sample template.");
    }
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error("Invalid file format. Please drop an Excel sheet (.xlsx or .xls).");
        return;
      }
      handleBulkUpload(file);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
    const file = e instanceof File ? e : e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadResults([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) {
          toast.error("The uploaded file is empty.");
          setIsProcessing(false);
          return;
        }

        // Initialize status tracking
        const initialResults = rawData.map((item: any, index: number) => ({
          id: index,
          name: `${item.FirstName || ""} ${item.LastName || ""}`.trim() || item.GrNo || `Row ${index + 1}`,
          status: 'pending',
          error: null
        }));
        setUploadResults(initialResults);

        const processedStudents = rawData.map((item: any, index: number) => {
          try {
            // Helper helper to dynamically lookup keys case-insensitively and trim spaces
            const getFieldCleanVal = (keysToSearch: string[]): string => {
              for (const key of keysToSearch) {
                const matchKey = Object.keys(item).find(k => k.toLowerCase() === key.toLowerCase());
                if (matchKey && item[matchKey] !== undefined && item[matchKey] !== null) {
                  return item[matchKey].toString().trim();
                }
              }
              return "";
            };

            // 1. School Name Resolution
            const schName = getFieldCleanVal(["SchoolName", "School", "school_name"]);
            const schMasterId = item.SchoolId || (schName ? schools.find((sch: any) =>
              sch.name.toLowerCase().trim() === schName.toLowerCase()
            )?.id : undefined);

            // 2. Class/Grade/Standard Resolution
            const stdName = getFieldCleanVal(["GradeName", "STD", "standard", "grade"]);
            const stdMasterId = item.StandardId || (stdName ? standardsMaster.find((s: any) =>
              s.name.toLowerCase().trim() === stdName.toLowerCase()
            )?.id : undefined);

            // 3. Section/Division Resolution
            const divName = getFieldCleanVal(["SectionName", "DIV", "section", "division"]);
            const divMasterId = item.SectionId || (divName ? sectionsMaster.find((s: any) =>
              s.name.toLowerCase().trim() === divName.toLowerCase()
            )?.id : undefined);

            // 4. Shift Resolution
            const shiftName = getFieldCleanVal(["ShiftName", "SHIFTNAME", "shift"]);
            const shiftMasterId = item.ShiftId || (shiftName ? shifts.find((s: any) =>
              s.name.toLowerCase().trim() === shiftName.toLowerCase()
            )?.id : undefined);

            // 5. Academic Year Resolution
            const ayName = getFieldCleanVal(["AcademicYear", "academicyear", "academic_year"]);
            const ayMasterId = item.AcademicYearId || (ayName ? academicYears.find((s: any) =>
              s.name.toLowerCase().trim() === ayName.toLowerCase()
            )?.id : undefined);

            // 6. Blood Group Resolution
            const bgName = getFieldCleanVal(["BloodGroupName", "BLOODGROUP", "blood_group"]);
            const bgMasterId = item.BloodGroupId || (bgName ? bloodGroups.find((bg: any) =>
              bg.name.toLowerCase().trim() === bgName.toLowerCase()
            )?.id : undefined);

            // 7. Religion Resolution
            const relName = getFieldCleanVal(["ReligionName", "RELIGION", "religion"]);
            const religionMasterId = item.ReligionId || (relName ? religions.find((r: any) =>
              r.name.toLowerCase().trim() === relName.toLowerCase()
            )?.id : undefined);

            // 8. House Resolution
            const houseName = getFieldCleanVal(["HouseName", "house"]);
            const houseMasterId = item.HouseId || (houseName ? houses.find((h: any) =>
              h.name.toLowerCase().trim() === houseName.toLowerCase()
            )?.id : undefined);

            // 9. Admission Type Resolution
            const atName = getFieldCleanVal(["AdmissionType", "admissiontype", "admission_type"]);
            const admissionTypeMasterId = item.AdmissionTypeId || (atName ? admissionTypes.find((at: any) =>
              at.name.toLowerCase().trim() === atName.toLowerCase()
            )?.id : undefined);

            // 10. Caste Resolution
            const cName = getFieldCleanVal(["CasteName", "CASTE", "caste"]);
            const casteMasterId = item.CasteId || (cName ? castes.find((c: any) =>
              c.name.toLowerCase().trim() === cName.toLowerCase()
            )?.id : undefined);

            // 11. Category Resolution
            const catName = getFieldCleanVal(["CategoryName", "CATEGORY", "category"]);
            const categoryMasterId = item.CategoryId || (catName ? categories.find((c: any) =>
              c.name.toLowerCase().trim() === catName.toLowerCase()
            )?.id : undefined);

            // 12. School Section Resolution
            const schoolSectionName = getFieldCleanVal(["SchoolSectionName", "SchoolSection", "school_section", "schoolsectionname"]);
            const schoolSectionId = item.SchoolSectionId || (schoolSectionName ? schoolSections.find((s: any) =>
              s.name.toLowerCase().trim() === schoolSectionName.toLowerCase()
            )?.id : undefined);

            // 13. Sub-Caste Resolution
            const subCasteName = getFieldCleanVal(["SubCasteName", "SubCaste", "sub_caste", "subcastename"]);
            const subCasteId = item.SubCasteId || (subCasteName ? subCastes.find((sc: any) =>
              sc.name.toLowerCase().trim() === subCasteName.toLowerCase()
            )?.id : undefined);

            // 14. City Resolution
            const cityName = getFieldCleanVal(["CityName", "City", "city", "cityname"]);
            const cityId = item.CityId || (cityName ? cities.find((c: any) =>
              c.name.toLowerCase().trim() === cityName.toLowerCase()
            )?.id : undefined);

            // 15. State Resolution
            const stateName = getFieldCleanVal(["StateName", "State", "state", "statename"]);
            const stateId = item.StateId || (stateName ? states.find((s: any) =>
              s.name.toLowerCase().trim() === stateName.toLowerCase()
            )?.id : undefined);

            // Robust Date Parsing Helper inside loop mapping
            const parseAndFormatDate = (val: any): string | null => {
              if (val === undefined || val === null) return null;
              let str = val.toString().trim();
              if (!str) return null;

              // Check if it's an Excel serial number
              const num = Number(str);
              if (!isNaN(num) && num > 10000 && num < 100000) {
                try {
                  const excelEpoch = new Date(1899, 11, 30);
                  const tempDate = new Date(excelEpoch.getTime() + num * 24 * 60 * 60 * 1000);
                  const y = tempDate.getFullYear();
                  const m = String(tempDate.getMonth() + 1).padStart(2, '0');
                  const d = String(tempDate.getDate()).padStart(2, '0');
                  return `${y}-${m}-${d}`;
                } catch {
                  // fallback
                }
              }

              // Handle DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
              const dmyMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
              if (dmyMatch) {
                const day = dmyMatch[1].padStart(2, '0');
                const month = dmyMatch[2].padStart(2, '0');
                const year = dmyMatch[3];
                return `${year}-${month}-${day}`;
              }

              // Handle YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
              const ymdMatch = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
              if (ymdMatch) {
                const year = ymdMatch[1];
                const month = ymdMatch[2].padStart(2, '0');
                const day = ymdMatch[3].padStart(2, '0');
                return `${year}-${month}-${day}`;
              }

              try {
                const parsed = new Date(str);
                if (!isNaN(parsed.getTime())) {
                  const y = parsed.getFullYear();
                  const m = String(parsed.getMonth() + 1).padStart(2, '0');
                  const d = String(parsed.getDate()).padStart(2, '0');
                  return `${y}-${m}-${d}`;
                }
              } catch {
                // fallback
              }

              return null;
            };

            // Map standard fields for DB persistence
            const grno = getFieldCleanVal(["GRNO", "GrNo"]);
            const fName = getFieldCleanVal(["FirstName", "FNAME", "first_name"]);
            const mName = getFieldCleanVal(["MiddleName", "MNAME", "middle_name"]);
            const lName = getFieldCleanVal(["LastName", "LNAME", "last_name"]);

            // Normalize Gender
            let genderVal = getFieldCleanVal(["Gender", "GENDER"]);
            if (genderVal.toLowerCase() === "m" || genderVal.toLowerCase() === "male") {
              genderVal = "Male";
            } else if (genderVal.toLowerCase() === "f" || genderVal.toLowerCase() === "female") {
              genderVal = "Female";
            } else {
              genderVal = "Male"; // Default fallback
            }

            const rawRoll = getFieldCleanVal(["RollNumber", "Roll", "ROLLNO", "roll_number", "roll"]);
            let rollNumberValue = parseInt(rawRoll) || 0;
            if (isNaN(rollNumberValue)) rollNumberValue = 0;

            let schoolIdVal = parseInt(schMasterId || item.SchoolId || user.schoolId || "1");
            if (isNaN(schoolIdVal)) schoolIdVal = 1;

            return {
              GrNo: grno,
              name: `${fName} ${mName} ${lName}`.trim() || item.Name || `Student ${index + 1}`,
              schoolId: schoolIdVal,
              rollNumber: rollNumberValue,
              firstName: fName,
              middleName: mName,
              lastName: lName,
              gender: genderVal,
              dateOfBirth: parseAndFormatDate(getFieldCleanVal(["DateOfBirth", "dob", "DOB", "birth_date"])),
              fatherContactNo: getFieldCleanVal(["FatherContactNo", "Mobile", "MOBILE", "contact_number", "Mobile no", "Mobile No", "MobileNo"]),
              motherContactNo: getFieldCleanVal(["MotherContactNo", "SecondaryMobile", "SecondaryContact", "SecondaryPhone", "contact2"]),
              email: getFieldCleanVal(["Email", "EMAIL"]),
              address: getFieldCleanVal(["Address", "ADDRESS"]),
              motherName: getFieldCleanVal(["MotherName", "MOTHERNAME"]),
              aadharCard: getFieldCleanVal(["AadharCard", "aadharcard", "aadhar_card"]),
              rfid: getFieldCleanVal(["RFID", "CARDID", "card_id", "rfid"]),
              shiftName: shiftName,

              standardId: stdMasterId,
              sectionId: divMasterId,
              shiftId: shiftMasterId,
              academicYearId: ayMasterId,
              bloodGroupId: bgMasterId,
              religionId: religionMasterId,
              houseId: houseMasterId,
              admissionTypeId: admissionTypeMasterId,
              casteId: casteMasterId,
              subCasteId: subCasteId,
              categoryId: categoryMasterId,
              cityId: cityId,
              stateId: stateId,
              schoolSectionId: schoolSectionId,
              admissionDate: parseAndFormatDate(getFieldCleanVal(["AdmissionDate", "admission_date"])),

              uniformId: getFieldCleanVal(["UniformID", "UniformId", "uniformid", "uniform_id"]),
              sms: getFieldCleanVal(["SecondarySMS", "sms"]) === "Yes" || getFieldCleanVal(["SecondarySMS", "sms"]).toLowerCase() === "true",
              digitalUniform: getFieldCleanVal(["DigitalUniform", "digital_uniform", "digitalUniform"]) === "Yes" || getFieldCleanVal(["DigitalUniform", "digital_uniform", "digitalUniform"]).toLowerCase() === "true",
              digitalNotebook: getFieldCleanVal(["DigitalNotebook", "digital_notebook", "digitalNotebook"]) === "Yes" || getFieldCleanVal(["DigitalNotebook", "digital_notebook", "digitalNotebook"]).toLowerCase() === "true",
              isStateBoard: getFieldCleanVal(["IsStateBoard", "isStateBoard"]) === "Yes" || getFieldCleanVal(["IsStateBoard", "isStateBoard"]).toLowerCase() === "true",
              profilePhotoPath: getFieldCleanVal(["ProfilePhotoPath", "profile_photo_path"]),
              status: getFieldCleanVal(["Status", "status"]) || "Active",
              optedForBus: getFieldCleanVal(["OptedForBus", "opted_for_bus", "optedForBus", "bus"]) === "Yes" || getFieldCleanVal(["OptedForBus", "opted_for_bus", "optedForBus", "bus"]).toLowerCase() === "true",
              createdBy: user.name || user.email,
              modifiedBy: user.name || user.email
            };
          } catch (e) {
            console.error(`Row ${index} mapping error:`, e);
            return null;
          }
        });

        // 1) Fetch existing students from the database for comprehensive pre-validation checks
        let existingStudentsDbList: any[] = [];
        try {
          const allRes = await apiService.getStudents(
            parseSafeInt(user.schoolId),
            parseSafeInt(user.academicYearId),
            { page: 1, pageSize: 100000 }
          );
          const allData = allRes.data;
          existingStudentsDbList = Array.isArray(allData)
            ? allData
            : (allData && Array.isArray(allData.data) ? allData.data : []);
        } catch (fetchErr) {
          console.error("Could not load existing records for pre-validation:", fetchErr);
        }

        // Build Sets of existing unique identifiers for fast O(1) lookup
        const existingGrnos = new Set<string>();
        const existingAadhars = new Set<string>();
        const existingRfids = new Set<string>();
        const existingUniforms = new Set<string>();
        const existingRollCombos = new Set<string>();

        existingStudentsDbList.forEach((s: any) => {
          const getVal = (prop: string, fallback?: any) => {
            if (!s) return fallback;
            const keys = Object.keys(s);
            const match = keys.find(k => k.toLowerCase() === prop.toLowerCase());
            return match ? s[match] : fallback;
          };
          const grno = (getVal("GRNO") || s.grno || "").toString().trim().toLowerCase();
          const aadhar = (getVal("aadharcard") || s.aadharCard || "").toString().trim().toLowerCase();
          const rfidVal = (getVal("RFID") || s.rfid || s.CARDID || s.cardId || "").toString().trim().toLowerCase();
          const uniformVal = (getVal("uniformid") || s.uniformid || "").toString().trim().toLowerCase();

          if (grno) existingGrnos.add(grno);
          if (aadhar) existingAadhars.add(aadhar);
          if (rfidVal) existingRfids.add(rfidVal);
          if (uniformVal) existingUniforms.add(uniformVal);

          const rVal = (s.rollNumber || s.roll || "").toString().trim().toLowerCase();
          const stdVal = (s.standardId || s.StandardId || "").toString().trim().toLowerCase();
          const secVal = (s.sectionId || s.SectionId || "").toString().trim().toLowerCase();
          const schVal = (s.schoolId || s.SchoolId || "").toString().trim().toLowerCase();
          if (rVal && stdVal && secVal && schVal) {
            existingRollCombos.add(`${schVal}_${stdVal}_${secVal}_${rVal}`);
          }
        });

        // Set up sets for in-batch duplicates check
        const batchRegs = new Set<string>();
        const batchAadhars = new Set<string>();
        const batchRfids = new Set<string>();
        const batchUniforms = new Set<string>();
        const batchRollCombos = new Set<string>();

        let totalValidationErrorsFound = 0;
        const validatedResults = initialResults.map((result: any, idx: number) => {
          const s = processedStudents[idx];
          if (!s) return { ...result, status: 'error', error: 'Invalid record format' };

          const grno = (s.GrNo || "").toString().trim().toLowerCase();
          const aadhar = (s.aadharCard || "").toString().trim().toLowerCase();
          const rfid = (s.rfid || "").toString().trim().toLowerCase();
          const uniform = (s.uniformId || "").toString().trim().toLowerCase();

          let rowError = "";

          // a) grno/GRNO
          if (grno) {
            if (batchRegs.has(grno)) {
              rowError = `Duplicate Registration Number/GRNO '${s.GrNo}' in uploaded file.`;
            } else if (existingGrnos.has(grno)) {
              rowError = `Registration Number/GRNO '${s.GrNo}' already exists in database.`;
            } else {
              batchRegs.add(grno);
            }
          }

          // b) AadharCard
          if (!rowError && aadhar) {
            if (batchAadhars.has(aadhar)) {
              rowError = `Duplicate Aadhar Card '${s.aadharCard}' in uploaded file.`;
            } else if (existingAadhars.has(aadhar)) {
              rowError = `Aadhar Card '${s.aadharCard}' already exists in database.`;
            } else {
              batchAadhars.add(aadhar);
            }
          }

          // c) RFID
          if (!rowError && rfid) {
            if (batchRfids.has(rfid)) {
              rowError = `Duplicate RFID '${s.rfid}' in uploaded file.`;
            } else if (existingRfids.has(rfid)) {
              rowError = `RFID '${s.rfid}' already exists in database.`;
            } else {
              batchRfids.add(rfid);
            }
          }
          else {
            batchRfids.add(rfid);
          }

          // d) UniformID
          if (!rowError && uniform) {
            if (batchUniforms.has(uniform)) {
              rowError = `Duplicate UniformID '${s.uniformId}' in uploaded file.`;
            } else if (existingUniforms.has(uniform)) {
              rowError = `UniformID '${s.uniformId}' already exists in database.`;
            } else {
              batchUniforms.add(uniform);
            }
          }
          else {
            batchUniforms.add(uniform);
          }

          // e) Roll Number combination uniqueness check
          const roll = (s.rollNumber || "").toString().trim().toLowerCase();
          const std = (s.standardId || "").toString().trim().toLowerCase();
          const sec = (s.sectionId || "").toString().trim().toLowerCase();
          const sch = (s.schoolId || "").toString().trim().toLowerCase();
          if (!rowError && roll && std && sec && sch) {
            const combo = `${sch}_${std}_${sec}_${roll}`;
            if (batchRollCombos.has(combo)) {
              rowError = `Duplicate Roll Number '${s.rollNumber}' for this School, Standard, and Division combination in the uploaded file.`;
            } else if (existingRollCombos.has(combo)) {
              rowError = `Roll Number '${s.rollNumber}' already exists for this School, Standard, and Division combination in the database.`;
            } else {
              batchRollCombos.add(combo);
            }
          }

          if (rowError) {
            totalValidationErrorsFound++;
            return {
              ...result,
              status: 'error',
              error: rowError
            };
          }
          return { ...result, status: 'pending' };
        });

        if (totalValidationErrorsFound > 0) {
          setUploadResults(validatedResults);
          setIsProcessing(false);
          toast.error(`Validation failed: ${totalValidationErrorsFound} unique field conflict(s) detected. Please correct the fields in your datasheet and try again.`);
          if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
          return;
        }

        // Dynamic upload process: Sequential or Chunked to update UI
        let successCount = 0;
        let failCount = 0;

        // Process in chunks of 5 for balance between speed and UI responsiveness
        const chunkSize = 5;
        for (let i = 0; i < processedStudents.length; i += chunkSize) {
          const chunk = processedStudents.slice(i, i + chunkSize);
          const chunkIndices = Array.from({ length: chunk.length }, (_, k) => i + k);

          // Filter out failed mapping rows
          const validRows = chunk.filter(s => s !== null);
          const validIndices = chunkIndices.filter(idx => processedStudents[idx] !== null);

          setUploadResults(prev => prev.map(res =>
            chunkIndices.includes(res.id) ? { ...res, status: 'processing' } : res
          ));

          try {
            await apiService.bulkCreateStudents(validRows);

            setUploadResults(prev => prev.map(res =>
              validIndices.includes(res.id) ? { ...res, status: 'success' } : res
            ));

            // Mark failed mapping rows
            const invalidIndices = chunkIndices.filter(idx => processedStudents[idx] === null);
            if (invalidIndices.length > 0) {
              setUploadResults(prev => prev.map(res =>
                invalidIndices.includes(res.id) ? { ...res, status: 'error', error: 'Invalid data format' } : res
              ));
              failCount += invalidIndices.length;
            }

            successCount += validRows.length;
          } catch (error: any) {
            console.error(`Chunk ${i} upload error:`, error);
            const errorMsg = typeof error.response?.data === 'string'
              ? error.response.data
              : (error.response?.data?.message || error.message || 'Server error');
            setUploadResults(prev => prev.map(res =>
              chunkIndices.includes(res.id) ? { ...res, status: 'error', error: errorMsg } : res
            ));
            failCount += chunk.length;
          }
        }

        if (failCount === 0) {
          toast.success(`Successfully imported all ${successCount} students.`);
          setTimeout(() => setIsBulkUploadOpen(false), 2000);
        } else {
          toast.warning(`Imported ${successCount} students, but ${failCount} failed.`);
        }

        fetchStudents();
      } catch (error) {
        console.error("Bulk upload reading error:", error);
        toast.error("Failed to read Excel file.");
      } finally {
        setIsProcessing(false);
        if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddStudent = async () => {
    const newErrors: Record<string, boolean> = {};
    let firstErrorField = "";

    const checkField = (field: string, condition: boolean) => {
      if (condition) {
        newErrors[field] = true;
        if (!firstErrorField) firstErrorField = field;
      }
    };

    checkField("schoolId", !newStudentFormData.schoolId);
    checkField("standard", !newStudentFormData.standard);
    checkField("division", !newStudentFormData.division);
    checkField("academicYearId", !newStudentFormData.academicYearId);
    checkField("shiftName", !newStudentFormData.shiftName);
    checkField("grno", !newStudentFormData.grno?.trim());
    checkField("rollNumber", !newStudentFormData.rollNumber?.trim());
    checkField("gender", !newStudentFormData.gender);

    // RFID is mandatory on creation (!isEditMode) or must match 10/24 length if entered. Skip entirely on Edit since it is disabled.
    const rfidTrimmed = newStudentFormData.rfid?.trim() || "";
    const isRfidRequired = !isEditMode && rfidTrimmed === "";
    const isRfidInvalidLength = !isEditMode && rfidTrimmed !== "" && (rfidTrimmed.length !== 10 && rfidTrimmed.length !== 24);
    checkField("rfid", isRfidRequired || isRfidInvalidLength);

    // Uniform ID is mandatory on creation (!isEditMode) as well
    const uniformTrimmed = newStudentFormData.uniformId?.trim() || "";
    const isUniformRequired = !isEditMode && uniformTrimmed === "";
    checkField("uniformId", isUniformRequired);

    checkField("schoolSectionId", !newStudentFormData.schoolSectionId);
    checkField("fatherContactNo", !newStudentFormData.fatherContactNo?.trim() || !/^\d{10}$/.test(newStudentFormData.fatherContactNo.replace(/\D/g, "")));

    // Non-mandatory but format-validated fields
    if (newStudentFormData.aadharCard && newStudentFormData.aadharCard.trim() !== "") {
      const isInvalidAadhar = !/^\d{12}$/.test(newStudentFormData.aadharCard.replace(/\s/g, ""));
      checkField("aadharCard", isInvalidAadhar);
      if (isInvalidAadhar) {
        toast.error("Aadhar Card ID must be a valid 12-digit number.");
        return;
      }
    }

    // Email format validation if entered
    if (newStudentFormData.email && newStudentFormData.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isInvalidEmail = !emailRegex.test(newStudentFormData.email.trim());
      checkField("email", isInvalidEmail);
      if (isInvalidEmail) {
        toast.error("Please enter a valid email address.");
        return;
      }
    }

    // Standard empty/presence checks for legal names
    checkField("firstName", !newStudentFormData.firstName?.trim());
    checkField("middleName", !newStudentFormData.middleName?.trim());
    checkField("lastName", !newStudentFormData.lastName?.trim());

    setFormErrors(newErrors);

    // Handle user-friendly sequentially focused toaster alerts
    if (firstErrorField) {
      if (firstErrorField === "rfid" && isRfidInvalidLength) {
        toast.error("RFID must be either 10 or 24 alphanumeric characters.");
      } else if (firstErrorField === "rfid" && isRfidRequired) {
        toast.error("RFID is mandatory on creation.");
      } else if (firstErrorField === "uniformId" && isUniformRequired) {
        toast.error("Uniform ID is mandatory on creation.");
      } else if (firstErrorField === "fatherContactNo") {
        toast.error("Please enter a valid 10-digit Father's Contact Number.");
      } else {
        toast.error("Please fill all required fields correctly.");
      }

      const element = inputRefs.current[firstErrorField];
      if (element) {
        element.focus();
        if (element.scrollIntoView) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        schoolId: parseSafeInt(newStudentFormData.schoolId) || 1,
        rollNumber: parseSafeInt(newStudentFormData.rollNumber) || 0,
        name: `${newStudentFormData.firstName} ${newStudentFormData.middleName} ${newStudentFormData.lastName}`.trim(),
        status: newStudentFormData.status || "Active",

        // Standard backend model properties
        FirstName: newStudentFormData.firstName,
        MiddleName: newStudentFormData.middleName,
        LastName: newStudentFormData.lastName,
        GrNo: newStudentFormData.grno,
        Gender: newStudentFormData.gender,
        DateOfBirth: newStudentFormData.dateOfBirth || null,
        FatherContactNo: newStudentFormData.fatherContactNo,
        MotherContactNo: newStudentFormData.motherContactNo || null,
        MotherName: newStudentFormData.motherName || null,
        Address: newStudentFormData.address || null,
        AadharCard: newStudentFormData.aadharCard || null,
        Rfid: newStudentFormData.rfid || null,
        UniformId: newStudentFormData.uniformId || null,
        Sms: !!newStudentFormData.sms,
        IsStateBoard: !!newStudentFormData.isStateBoard,
        DigitalUniform: !!newStudentFormData.digitalUniform,
        DigitalNotebook: !!newStudentFormData.digitalNotebook,
        ProfilePhotoPath: newStudentFormData.profilePhotoPath || null,
        SchoolSectionId: parseSafeInt(newStudentFormData.schoolSectionId) || null,
        AdmissionDate: newStudentFormData.admissionDate || null,
        Email: newStudentFormData.email || null,
        CityId: parseSafeInt(newStudentFormData.cityId) || null,
        StateId: parseSafeInt(newStudentFormData.stateId) || null,
        OptedForBus: !!newStudentFormData.optedForBus,

        // Map IDs from masters for manual data persistence
        StandardId: standardsMaster.find(s => s.name === newStudentFormData.standard)?.id,
        SectionId: sectionsMaster.find(s => s.name === newStudentFormData.division)?.id,
        AcademicYearId: parseSafeInt(newStudentFormData.academicYearId) || academicYears.find(ay => ay.name === newStudentFormData.academicYearId)?.id,
        ShiftId: shifts.find(s => s.name === newStudentFormData.shiftName)?.id,
        BloodGroupId: parseSafeInt(newStudentFormData.bloodGroupId) || null,
        HouseId: parseSafeInt(newStudentFormData.houseId) || null,
        AdmissionTypeId: parseSafeInt(newStudentFormData.admissionTypeId) || null,
        ReligionId: parseSafeInt(newStudentFormData.religionId) || null,
        CasteId: parseSafeInt(newStudentFormData.casteId) || null,
        SubCasteId: parseSafeInt(newStudentFormData.subCasteId) || null,
        CategoryId: parseSafeInt(newStudentFormData.categoryId) || null,

        // Audit fields: Ensure CreatedBy and ModifiedBy are captured for backend audit logging
        CreatedBy: isEditMode ? undefined : (user.name || user.email),
        ModifiedBy: user.name || user.email
      };

      if (isEditMode && currentStudentId) {
        const studentId = parseSafeInt(currentStudentId);
        if (studentId === undefined) {
          toast.error("Invalid student ID for update");
          return;
        }
        await apiService.updateStudent(studentId, { ...payload, id: studentId });
        toast.success("Student updated successfully!");
      } else {
        const response = await apiService.createStudent(payload);
        const createdStudent = response.data.data || response.data;
        const studentId = createdStudent?.id;

        if (selectedPhotoFile && studentId) {
          try {
            await apiService.uploadStudentPhoto(studentId, selectedPhotoFile);
          } catch (uploadErr) {
            console.error("Delayed student photo upload failed:", uploadErr);
          }
        }
        toast.success("Student registered successfully!");
      }

      setIsAddDialogOpen(false);
      setSelectedPhotoFile(null);
      setLocalPhotoPreview(null);
      fetchStudents();
    } catch (error: any) {
      console.error("Student persistence error:", error);
      const serverMessage = error.response?.data?.message || error.message || "";
      if (serverMessage && (serverMessage.toLowerCase().includes("already exists") || serverMessage.toLowerCase().includes("validation failed"))) {
        // Strip prefix to make the message human-friendly
        let cleanErr = serverMessage;
        if (cleanErr.startsWith("Student validation failed: ")) {
          cleanErr = cleanErr.replace("Student validation failed: ", "");
        }

        const errorsToSet: Record<string, boolean> = {};
        const messagesToSet: Record<string, string> = {};
        let focusedField = "";

        if (cleanErr.toLowerCase().includes("grno")) {
          errorsToSet["grno"] = true;
          messagesToSet["grno"] = cleanErr;
          focusedField = "grno";
        } else if (cleanErr.toLowerCase().includes("roll no") || cleanErr.toLowerCase().includes("rollnumber")) {
          errorsToSet["rollNumber"] = true;
          messagesToSet["rollNumber"] = cleanErr;
          focusedField = "rollNumber";
        } else if (cleanErr.toLowerCase().includes("rfid") || cleanErr.toLowerCase().includes("cardid") || cleanErr.toLowerCase().includes("card_id")) {
          errorsToSet["rfid"] = true;
          messagesToSet["rfid"] = cleanErr;
          focusedField = "rfid";
        } else {
          toast.error(cleanErr);
        }

        if (focusedField) {
          setFormErrors(prev => ({ ...prev, ...errorsToSet }));
          setValMessage(prev => ({ ...prev, ...messagesToSet }));
          toast.error(cleanErr);

          setTimeout(() => {
            const element = inputRefs.current[focusedField];
            if (element) {
              element.focus();
              try {
                if (element.scrollIntoView) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              } catch (e) {
                console.warn("Smooth scroll not fully supported", e);
              }
            }
          }, 100);
          return; // Remain on form so user can fix and re-submit
        }
      }
      toast.error(error.response?.data?.message || (isEditMode ? "Failed to update record" : "Failed to register student"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    setDeleteInfo({ id, name });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteInfo) return;

    setIsProcessing(true);
    try {
      const studentId = parseSafeInt(deleteInfo.id);
      if (studentId === undefined) {
        toast.error("Invalid student ID for deletion");
        return;
      }
      await apiService.deleteStudent(studentId);
      toast.success(`${deleteInfo.name} removed successfully`);
      setIsDeleteDialogOpen(false);
      setDeleteInfo(null);
      fetchStudents();
    } catch (error) {
      toast.error("Failed to delete record");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredStudents = students; // Server now handles filtering, sorting and pagination

  return (
    <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <div className="flex items-center gap-5">
          <div className="bg-blue-600 p-4 rounded-[1.25rem] text-white shadow-2xl shadow-blue-200 transition-transform hover:rotate-3">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">Student Management</h1>
            <p className="text-slate-400 font-bold mt-1 text-xs sm:text-sm uppercase tracking-widest leading-none">Manage and track student information across all standards.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canManage && (
            <Dialog open={isBulkUploadOpen} onOpenChange={(open) => {
              if (!isProcessing) {
                setIsBulkUploadOpen(open);
                if (!open) setUploadResults([]);
              }
            }}>
              <SimpleTooltip content="Import students from Excel" side="bottom">
                <DialogTrigger
                  render={
                    <div className="flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 outline-none cursor-pointer text-sm font-medium" aria-label="Bulk upload students">
                      <Upload size={16} /> Bulk Upload
                    </div>
                  }
                />
              </SimpleTooltip>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-3xl rounded-[2rem]">
                <div className="bg-slate-900 px-8 py-5 text-white shrink-0">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-xl">
                        <Upload size={20} className="text-white" />
                      </div>
                      Batch Student Onboarding
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs">
                      Synchronize your physical register with the digital campus database using our high-speed Excel importer.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white">
                  {uploadResults.length === 0 ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        "p-10 border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-6 transition-all group",
                        isDragging
                          ? "border-blue-500 bg-blue-50/20 scale-[1.01]"
                          : "border-slate-100 bg-slate-50/30 hover:bg-slate-55 hover:border-blue-100"
                      )}
                    >
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <FileText className="text-blue-500" size={32} />
                      </div>
                      <div className="text-center space-y-2">
                        <h4 className="text-lg font-black text-slate-900 tracking-tight">Drop your datasheet here</h4>
                        <p className="text-xs text-slate-400 font-bold max-w-xs leading-relaxed uppercase tracking-widest">
                          Strictly supports .XLSX and .XLS formats. Follow the system-defined schema for 100% precision.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                        <Button
                          className="flex-1 bg-slate-900 hover:bg-black text-white font-black rounded-2xl h-12 shadow-xl shadow-slate-200 active:scale-[0.98] transition-all cursor-pointer"
                          onClick={() => bulkFileInputRef.current?.click()}
                          disabled={isProcessing}
                        >
                          {isProcessing ? "Processing Streams..." : "Browse Local Files"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-slate-200 hover:bg-slate-50 font-black rounded-2xl h-12 transition-all gap-2 text-slate-600 cursor-pointer"
                          onClick={downloadSampleExcel}
                        >
                          <Download size={18} /> Sample Sheet
                        </Button>
                      </div>
                      <input
                        type="file"
                        ref={bulkFileInputRef}
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleBulkUpload}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Import Stream Activity</h4>
                        <div className="flex gap-2">
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 font-black px-2 py-0.5 rounded-lg text-[10px]">
                            {uploadResults.filter(r => r.status === 'success').length} SUCCESS
                          </Badge>
                          <Badge className="bg-rose-500 hover:bg-rose-600 font-black px-2 py-0.5 rounded-lg text-[10px]">
                            {uploadResults.filter(r => r.status === 'error').length} FAILED
                          </Badge>
                        </div>
                      </div>

                      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/50">
                          <Table>
                            <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                              <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-6">Row</TableHead>
                                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity Signature</TableHead>
                                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-6">Activity State</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {uploadResults.map((result) => (
                                <TableRow key={result.id} className="group border-slate-100 bg-white/50 hover:bg-slate-50 transition-colors">
                                  <TableCell className="pl-6 font-mono text-[10px] text-slate-400">{(result.id + 1).toString().padStart(3, '0')}</TableCell>
                                  <TableCell className="py-3 max-w-[340px]">
                                    <div className="flex flex-col space-y-1">
                                      <span className="text-xs font-bold text-slate-900">{result.name}</span>
                                      {result.error && (
                                        <span className="text-[10px] text-rose-600 font-bold leading-normal break-words whitespace-normal block bg-rose-50/60 p-2 rounded-xl border border-rose-100/60 mt-1">
                                          {result.error}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right pr-6">
                                    {result.status === 'pending' && <Badge variant="outline" className="text-[9px] font-black tracking-tight border-slate-300 text-slate-400 bg-transparent">QUEUED</Badge>}
                                    {result.status === 'processing' && (
                                      <div className="flex items-center justify-end gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                                        <span className="text-[9px] font-black text-blue-600 tracking-tight">SYNCING...</span>
                                      </div>
                                    )}
                                    {result.status === 'success' && (
                                      <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        <span className="text-[9px] font-black uppercase tracking-tight">VERIFIED</span>
                                      </div>
                                    )}
                                    {result.status === 'error' && (
                                      <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full border border-rose-100">
                                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce"></div>
                                        <span className="text-[9px] font-black uppercase tracking-tight">FAILED</span>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-2xl flex gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                      <Filter className="text-amber-500" size={18} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Master Data Integrity</p>
                      <p className="text-xs text-amber-700/80 leading-relaxed font-medium">
                        The importer automatically maps names (e.g., "10th Standard") to system IDs. Ensure spelling exactly matches the Master Configuration to avoid orphan records.
                      </p>
                    </div>
                  </div>
                </div>

                {uploadResults.length > 0 && !isProcessing && (
                  <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
                    <Button
                      className="w-full bg-slate-900 hover:bg-black font-black rounded-xl h-10 transition-all"
                      onClick={() => {
                        setIsBulkUploadOpen(false);
                        setUploadResults([]);
                      }}
                    >
                      Close Summary
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}

          <SimpleTooltip content="Download student list as Excel" side="bottom">
            <Button variant="outline" size="sm" className="gap-2 h-9" onClick={handleExport} aria-label="Export students to Excel">
              <Download size={16} /> <span className="hidden sm:inline">Export</span>
            </Button>
          </SimpleTooltip>

          {canManage && (
            <SimpleTooltip content="Add a new student manually" side="bottom">
              <Button
                size="sm"
                className="gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white border-none font-bold shadow-lg shadow-blue-600/20"
                onClick={openAddDialog}
                aria-label="Register new student"
              >
                <Plus size={16} /> <span className="hidden sm:inline">Add Student Record</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </SimpleTooltip>
          )}

          {canManage && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DeleteConfirmation
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                loading={isProcessing}
                title="Remove Student Record?"
                description={`This will permanently delete ${deleteInfo?.name}'s profile, enrollment details, and academic history. This action cannot be reversed.`}
              />
              <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] flex flex-col p-0 border-none shadow-3xl rounded-[2rem] overflow-hidden">
                <div className="bg-slate-900 px-8 py-5 text-white relative shrink-0">
                  <div className="relative z-10 flex items-center justify-between">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-xl shadow-xl shadow-blue-500/20">
                          <UserCircle size={22} className="text-white" />
                        </div>
                        {isEditMode ? "Modify Student Profile" : "Register Student"}
                      </DialogTitle>
                      <DialogDescription className="text-slate-400 text-[12px] mt-1 font-medium max-w-2xl leading-relaxed">
                        {isEditMode
                          ? "Update critical student records and academic history."
                          : "Create a new permanent digital record for the enrolled student."}
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  <div className="absolute right-[-10%] top-[-10%] w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-6 bg-white scrollbar-thin scrollbar-thumb-slate-200">
                  <div className="max-w-4xl mx-auto space-y-8">
                    <section>
                      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100">
                        <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Academic Placement</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Form Fields Column (8/12 width) */}
                        <div className="md:col-span-8">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                            <div className="md:col-span-12 space-y-1.5">
                              <Label htmlFor="school" className={cn("text-[10px] font-black uppercase tracking-widest ml-1", formErrors.schoolId ? "text-red-500" : "text-slate-500")}>Assigned School Branch {formErrors.schoolId && "*"}</Label>
                              <Select
                                value={newStudentFormData.schoolId}
                                onValueChange={(v) => {
                                  setNewStudentFormData({ ...newStudentFormData, schoolId: v || "" });
                                  if (formErrors.schoolId) setFormErrors(prev => ({ ...prev, schoolId: false }));
                                }}
                                disabled={user.role !== "superadmin" && !!user.schoolId}
                              >
                                <SelectTrigger
                                  ref={el => { inputRefs.current["schoolId"] = el; }}
                                  id="school"
                                  className={cn(
                                    "h-10 border-slate-200 bg-slate-50/50 font-bold text-slate-800 rounded-xl px-4 focus:ring-2 focus:ring-blue-500/5 transition-all text-sm",
                                    formErrors.schoolId && "border-red-500 ring-2 ring-red-500/10",
                                    (user.role !== "superadmin" && !!user.schoolId) && "opacity-80 cursor-not-allowed bg-slate-100"
                                  )}
                                >
                                  {/* Mapping logic to show only school name in trigger */}
                                  <SelectValue placeholder="Select School Branch">
                                    {newStudentFormData.schoolId && newStudentFormData.schoolId !== "all" ? schools.find(s => s.id.toString() === newStudentFormData.schoolId.toString())?.name : undefined}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="max-h-68 rounded-2xl shadow-2xl border-slate-200 p-2">
                                  <SelectItem value="" className="font-semibold py-2.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">
                                    Select School Branch
                                  </SelectItem>
                                  {Array.isArray(schools) && schools.length > 0 ? (
                                    schools.map(s => (
                                      <SelectItem key={s.id} value={s.id.toString()} className="font-semibold py-2.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">
                                        <div className="flex flex-col gap-0.5">
                                          <span className="text-sm font-bold">{s.name}</span>
                                          <span className="text-[10px] text-slate-400 font-medium tracking-tight">ID: SCH-{s.id} • {s.address?.split(',')[0]}</span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="p-4 text-sm text-slate-500 text-center italic flex flex-col items-center gap-2">
                                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
                                      Loading registered branches...
                                    </div>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>                             <div className="md:col-span-6 space-y-1.5">
                              <Label htmlFor="standard" className={cn("text-[10px] font-black uppercase tracking-widest ml-1", formErrors.standard ? "text-red-500" : "text-slate-500")}>Standard {formErrors.standard && "*"}</Label>
                              <Select
                                value={newStudentFormData.standard}
                                onValueChange={(v) => {
                                  setNewStudentFormData({ ...newStudentFormData, standard: v || "" });
                                  if (formErrors.standard) setFormErrors(prev => ({ ...prev, standard: false }));
                                }}
                              >
                                <SelectTrigger
                                  ref={el => { inputRefs.current["standard"] = el; }}
                                  id="standard"
                                  className={cn(
                                    "h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm",
                                    formErrors.standard && "border-red-500 ring-2 ring-red-500/10"
                                  )}
                                >
                                  <SelectValue placeholder="Select Standard">
                                    {newStudentFormData.standard || undefined}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                                  <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select Standard</SelectItem>
                                  {Array.isArray(standardsMaster) && standardsMaster.map(std => (
                                    <SelectItem key={std.id} value={std.name} className="font-semibold py-1.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">{std.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="md:col-span-6 space-y-1.5">
                              <Label htmlFor="division" className={cn("text-[10px] font-black uppercase tracking-widest ml-1", formErrors.division ? "text-red-500" : "text-slate-500")}>
                                Division {formErrors.division && "*"}
                              </Label>
                              <Select
                                value={newStudentFormData.division}
                                onValueChange={(v) => {
                                  setNewStudentFormData({ ...newStudentFormData, division: v || "" });
                                  if (formErrors.division) setFormErrors(prev => ({ ...prev, division: false }));
                                }}
                              >
                                <SelectTrigger
                                  ref={el => { inputRefs.current["division"] = el; }}
                                  id="division"
                                  className={cn(
                                    "h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm",
                                    formErrors.division && "border-red-500 ring-2 ring-red-500/10"
                                  )}
                                >
                                  <SelectValue placeholder="Select Section/Division">
                                    {newStudentFormData.division ? `Division ${newStudentFormData.division}` : undefined}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                                  <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select Section/Division</SelectItem>
                                  {Array.isArray(sectionsMaster) && sectionsMaster.map(sec => (
                                    <SelectItem key={sec.id} value={sec.name} className="font-semibold py-1.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">Section {sec.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="md:col-span-6 space-y-1.5">
                              <Label htmlFor="academicYearId" className={cn("text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1", formErrors.academicYearId ? "text-red-500" : "text-slate-500")}>
                                Academic Year {formErrors.academicYearId && "*"}
                              </Label>
                              <Select
                                value={newStudentFormData.academicYearId}
                                onValueChange={(v) => {
                                  setNewStudentFormData({ ...newStudentFormData, academicYearId: v || "" });
                                  if (formErrors.academicYearId) setFormErrors(prev => ({ ...prev, academicYearId: false }));
                                }}
                              >
                                <SelectTrigger ref={el => { inputRefs.current["academicYearId"] = el; }}
                                  id="academicYearId" className={cn("h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm", formErrors.academicYearId && "border-red-500 ring-2 ring-red-500/10")}>
                                  <SelectValue placeholder="Select Academic Year">
                                    {newStudentFormData.academicYearId ? academicYears.find(y => y.id.toString() === newStudentFormData.academicYearId)?.name : undefined}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                                  <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select Academic Year</SelectItem>
                                  {Array.isArray(academicYears) && academicYears.map(y => (
                                    <SelectItem key={y.id} value={y.id.toString()} className="font-semibold py-1.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">{y.name} {y.isCurrent ? "(Current)" : ""}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="md:col-span-6 space-y-1.5">
                              <Label htmlFor="shiftName" className={cn("text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1", formErrors.shiftName ? "text-red-500" : "text-slate-500")}>
                                Assigned Shift {formErrors.shiftName && "*"}
                              </Label>
                              <Select
                                value={newStudentFormData.shiftName}
                                onValueChange={(v) => {
                                  setNewStudentFormData({ ...newStudentFormData, shiftName: v || "" });
                                  if (formErrors.shiftName) setFormErrors(prev => ({ ...prev, shiftName: false }));
                                }}
                              >
                                <SelectTrigger ref={el => { inputRefs.current["shiftName"] = el; }}
                                  id="shiftName" className={cn("h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm", formErrors.shiftName && "border-red-500 ring-2 ring-red-500/10")}>
                                  <SelectValue placeholder="Select Shift">
                                    {newStudentFormData.shiftName || undefined}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                                  <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select Shift</SelectItem>
                                  {Array.isArray(shifts) && shifts.map(s => (
                                    <SelectItem key={s.id} value={s.name} className="font-semibold py-1.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Profile Image Display Section (4/12 width) - Available in Add & Edit Mode */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center border-l border-slate-100 pl-6">
                          <div className="text-center space-y-4">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile Identity Image</Label>

                            <div
                              className="relative group cursor-pointer"
                              onClick={() => triggerPhotoUpload(isEditMode ? currentStudentId! : "new")}
                            >
                              <div className="w-44 h-44 rounded-3xl overflow-hidden border-4 border-white shadow-2xl ring-1 ring-slate-200 bg-slate-50 flex items-center justify-center transition-all duration-300 group-hover:shadow-blue-200/50 group-hover:scale-[1.02]">
                                {(localPhotoPreview || newStudentFormData.profilePhotoPath) ? (
                                  <img
                                    src={localPhotoPreview || resolvePhotoUrl(newStudentFormData.profilePhotoPath)}
                                    alt="Student Identity"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const fallbackUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + newStudentFormData.firstName;
                                      const attemptedUrl = e.currentTarget.src;
                                      console.error(`[IMAGE_LOAD_FAIL] Failed to load student profile image from URL: "${attemptedUrl}". Falling back to avatar illustration template.`, { attemptedUrl, fallbackUrl });
                                      e.currentTarget.src = fallbackUrl;
                                    }}
                                  />
                                ) : (
                                  <div className="flex flex-col items-center gap-2 text-slate-300">
                                    <div className="p-4 bg-slate-100 rounded-2xl">
                                      <Edit2 size={32} className="opacity-20" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">No Image Found</span>
                                  </div>
                                )}

                                {/* Update Overlay */}
                                <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-[2px]">
                                  <div className="p-2 bg-white/20 rounded-full">
                                    <Edit2 size={24} />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest">Update Photo</span>
                                </div>
                              </div>

                              {(localPhotoPreview || newStudentFormData.profilePhotoPath) && (
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                                </div>
                              )}
                            </div>

                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[180px] mx-auto">
                              Click the identity frame to upload or change the physical photograph.
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <section>
                        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100">
                          <div className="w-1.5 h-5 bg-orange-500 rounded-full"></div>
                          <h3 className="text-sm font-black text-slate-900 tracking-tight">Identity Details</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="grno" className={cn("text-[10px] font-black uppercase tracking-widest ml-1", formErrors.grno ? "text-red-500" : "text-slate-500")}>Registration (GRNO) {formErrors.grno && "*"}</Label>
                            <Input
                              ref={el => { inputRefs.current["grno"] = el; }}
                              id="grno"
                              value={newStudentFormData.grno}
                              onChange={(e) => {
                                setNewStudentFormData({ ...newStudentFormData, grno: e.target.value });
                                if (formErrors.grno) setFormErrors(prev => ({ ...prev, grno: false }));
                                if (valMessage.grno) setValMessage(prev => ({ ...prev, grno: "" }));
                              }}
                              placeholder="e.g. REG-001"
                              className={cn(
                                "h-10 border-slate-200 bg-slate-50/30 font-mono font-black text-blue-600 rounded-xl px-4 text-sm",
                                formErrors.grno && "border-red-500 ring-2 ring-red-500/10"
                              )}
                            />
                            {formErrors.grno && valMessage.grno && (
                              <span className="text-[10px] text-red-500 font-bold block mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
                                {valMessage.grno}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="rollNumber" className={cn("text-[10px] font-black uppercase tracking-widest ml-1", formErrors.rollNumber ? "text-red-500" : "text-slate-500")}>Roll Number {formErrors.rollNumber && "*"}</Label>
                            <Input
                              ref={el => { inputRefs.current["rollNumber"] = el; }}
                              id="rollNumber"
                              value={newStudentFormData.rollNumber}
                              onChange={(e) => {
                                setNewStudentFormData({ ...newStudentFormData, rollNumber: e.target.value });
                                if (formErrors.rollNumber) setFormErrors(prev => ({ ...prev, rollNumber: false }));
                                if (valMessage.rollNumber) setValMessage(prev => ({ ...prev, rollNumber: "" }));
                              }}
                              placeholder="e.g. 24"
                              className={cn(
                                "h-10 border-slate-200 bg-slate-50/30 font-black text-slate-800 rounded-xl px-4 text-sm",
                                formErrors.rollNumber && "border-red-500 ring-2 ring-red-500/10"
                              )}
                            />
                            {formErrors.rollNumber && valMessage.rollNumber && (
                              <span className="text-[10px] text-red-500 font-bold block mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
                                {valMessage.rollNumber}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="gender" className={cn("text-[10px] font-black uppercase tracking-widest ml-1", formErrors.gender ? "text-red-500" : "text-slate-500")}>Gender {formErrors.gender && "*"}</Label>
                            <Select
                              value={newStudentFormData.gender}
                              onValueChange={(v) => {
                                setNewStudentFormData({ ...newStudentFormData, gender: v || "" });
                                setFormErrors(prev => ({ ...prev, gender: false }));
                              }}
                            >
                              <SelectTrigger
                                ref={el => { inputRefs.current["gender"] = el; }}
                                id="gender"
                                className={cn(
                                  "h-10 border-slate-200 bg-slate-50/30 font-bold rounded-xl px-4 text-sm",
                                  formErrors.gender && "border-red-500 ring-2 ring-red-500/10"
                                )}
                              >
                                <SelectValue placeholder="Select Student Gender">
                                  {newStudentFormData.gender || undefined}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-slate-200">
                                <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select Student Gender</SelectItem>
                                <SelectItem value="Male" className="font-semibold py-1.5 text-xs px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">Male</SelectItem>
                                <SelectItem value="Female" className="font-semibold py-1.5 text-xs px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">Female</SelectItem>
                                <SelectItem value="Other" className="font-semibold py-1.5 text-xs px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="aadharCard" className={cn("text-[10px] font-black uppercase tracking-widest ml-1", formErrors.aadharCard ? "text-red-500" : "text-slate-500")}>Aadhar ID {formErrors.aadharCard && " (Formatting Error)"}</Label>
                            <Input
                              ref={el => { inputRefs.current["aadharCard"] = el; }}
                              id="aadharCard"
                              value={newStudentFormData.aadharCard}
                              maxLength={12}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 12);
                                setNewStudentFormData({ ...newStudentFormData, aadharCard: val });
                                if (formErrors.aadharCard) setFormErrors(prev => ({ ...prev, aadharCard: false }));
                              }}
                              placeholder="12-digit number (Optional)"
                              className={cn(
                                "h-10 border-slate-200 bg-slate-50/30 tracking-widest font-mono font-bold rounded-xl px-4 text-sm",
                                formErrors.aadharCard && "border-red-500 ring-2 ring-red-500/10"
                              )}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="rfid" className={cn("text-[10px] font-black uppercase tracking-widest ml-1", formErrors.rfid ? "text-red-500" : "text-slate-500")}>
                              RFID {!isEditMode ? <span className="text-red-500"></span> : " (Disabled on Edit)"}
                            </Label>
                            <Input
                              ref={el => { inputRefs.current["rfid"] = el; }}
                              id="rfid"
                              value={newStudentFormData.rfid}
                              disabled={isEditMode}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                                if (val.length <= 24) {
                                  setNewStudentFormData({ ...newStudentFormData, rfid: val });
                                  if (formErrors.rfid) setFormErrors(prev => ({ ...prev, rfid: false }));
                                  if (valMessage.rfid) setValMessage(prev => ({ ...prev, rfid: "" }));
                                }
                              }}
                              placeholder={isEditMode ? "RFID cannot be edited" : "e.g. 10 or 24 alphanumeric digits"}
                              className={cn(
                                "h-10 border-slate-200 bg-slate-50/30 font-mono font-bold rounded-xl px-4 text-sm",
                                isEditMode && "bg-slate-100 cursor-not-allowed text-slate-400",
                                formErrors.rfid && "border-red-500 ring-2 ring-red-500/10"
                              )}
                            />
                            {formErrors.rfid && valMessage.rfid && (
                              <span className="text-[10px] text-red-500 font-bold block mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
                                {valMessage.rfid}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="uniformId" className={cn("text-[10px] font-black uppercase tracking-widest ml-1", formErrors.uniformId ? "text-red-500" : "text-slate-500")}>
                              Uniform ID {!isEditMode && <span className="text-red-500"></span>}
                            </Label>
                            <Input
                              ref={el => { inputRefs.current["uniformId"] = el; }}
                              id="uniformId"
                              value={newStudentFormData.uniformId || ""}
                              onChange={(e) => {
                                setNewStudentFormData({ ...newStudentFormData, uniformId: e.target.value });
                                if (formErrors.uniformId) setFormErrors(prev => ({ ...prev, uniformId: false }));
                              }}
                              placeholder={isEditMode ? "Uniform ID" : "e.g. UNIF-001"}
                              className={cn(
                                "h-10 border-slate-200 bg-slate-50/30 font-bold rounded-xl px-4 text-sm",
                                formErrors.uniformId && "border-red-500 ring-2 ring-red-500/10"
                              )}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="SchoolSection" className={cn("text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1", formErrors.schoolSectionId ? "text-red-500" : "text-slate-500")}>School Section {formErrors.schoolSectionId && "*"}</Label>
                            <Select
                              value={newStudentFormData.schoolSectionId}
                              onValueChange={(v) => {
                                setNewStudentFormData({ ...newStudentFormData, schoolSectionId: v || "" });
                                if (formErrors.schoolSectionId) setFormErrors(prev => ({ ...prev, schoolSectionId: false }));
                              }}
                            >
                              <SelectTrigger
                                ref={el => { inputRefs.current["schoolSectionId"] = el; }}
                                id="SchoolSection" className={cn("h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm", formErrors.standard && "border-red-500 ring-2 ring-red-500/10"
                                )}
                              >
                                <SelectValue placeholder="Select School Section">
                                  {schoolSections.find(s => s.id.toString() === newStudentFormData.schoolSectionId)?.name || undefined}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                                <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select School Section</SelectItem>
                                {Array.isArray(schoolSections) && schoolSections.map(sec => (
                                  <SelectItem key={sec.id} value={sec.id.toString()} className="font-semibold py-1.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">{sec.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="houseId" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">School House</Label>
                            <Select
                              value={newStudentFormData.houseId}
                              onValueChange={(v) => setNewStudentFormData({ ...newStudentFormData, houseId: v || "" })}
                            >
                              <SelectTrigger id="houseId" className="h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm">
                                <SelectValue placeholder="Select Student House Group">
                                  {newStudentFormData.houseId ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: houses.find(h => h.id.toString() === newStudentFormData.houseId)?.color }}></div>
                                      {houses.find(h => h.id.toString() === newStudentFormData.houseId)?.name}
                                    </div>
                                  ) : undefined}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                                <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select Student House Group</SelectItem>
                                {Array.isArray(houses) && houses.map(h => (
                                  <SelectItem key={h.id} value={h.id.toString()} className="font-semibold py-1.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }}></div>
                                      {h.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="admissionTypeId" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admission Type</Label>
                            <Select
                              value={newStudentFormData.admissionTypeId}
                              onValueChange={(v) => setNewStudentFormData({ ...newStudentFormData, admissionTypeId: v || "" })}
                            >
                              <SelectTrigger id="admissionTypeId" className="h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm">
                                <SelectValue placeholder="Select Student Admission Type">
                                  {newStudentFormData.admissionTypeId ? admissionTypes.find(at => at.id.toString() === newStudentFormData.admissionTypeId)?.name : undefined}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                                <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select Student Admission Type</SelectItem>
                                {Array.isArray(admissionTypes) && admissionTypes.map(at => (
                                  <SelectItem key={at.id} value={at.id.toString()} className="font-semibold py-1.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">{at.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </section>

                      <section>
                        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100">
                          <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                          <h3 className="text-sm font-black text-slate-900 tracking-tight">Legal Profile</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="firstName" className={cn("text-[10px] font-black uppercase tracking-widest ml-1", formErrors.firstName ? "text-red-500" : "text-slate-500")}>First Name {formErrors.firstName && "*"}</Label>
                            <Input
                              ref={el => { inputRefs.current["firstName"] = el; }}
                              id="firstName"
                              value={newStudentFormData.firstName}
                              onChange={(e) => {
                                const filtered = e.target.value.replace(/[0-9]/g, "");
                                setNewStudentFormData({ ...newStudentFormData, firstName: filtered });
                                if (formErrors.firstName) setFormErrors(prev => ({ ...prev, firstName: false }));
                              }}
                              placeholder="First name"
                              className={cn(
                                "h-10 border-slate-200 font-bold rounded-xl px-4 text-sm",
                                formErrors.firstName && "border-red-500 ring-2 ring-red-500/10"
                              )}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="middleName" className={cn("text-[10px] font-black uppercase tracking-widest ml-1", formErrors.middleName ? "text-red-500" : "text-slate-500")}>Middle Name {formErrors.middleName && "*"}</Label>
                            <Input
                              ref={el => { inputRefs.current["middleName"] = el; }}
                              id="middleName"
                              value={newStudentFormData.middleName}
                              onChange={(e) => {
                                const filtered = e.target.value.replace(/[0-9]/g, "");
                                setNewStudentFormData({ ...newStudentFormData, middleName: filtered });
                                if (formErrors.middleName) setFormErrors(prev => ({ ...prev, middleName: false }));
                              }}
                              placeholder="Middle name"
                              className={cn(
                                "h-10 border-slate-200 font-bold rounded-xl px-4 text-sm",
                                formErrors.middleName && "border-red-500 ring-2 ring-red-500/10"
                              )}
                            />
                          </div>
                          <div className="md:col-span-2 space-y-1.5">
                            <Label htmlFor="lastName" className={cn("text-[10px] font-black uppercase tracking-widest ml-1", formErrors.lastName ? "text-red-500" : "text-slate-500")}>Last Name {formErrors.lastName && "*"}</Label>
                            <Input
                              ref={el => { inputRefs.current["lastName"] = el; }}
                              id="lastName"
                              value={newStudentFormData.lastName}
                              onChange={(e) => {
                                const filtered = e.target.value.replace(/[0-9]/g, "");
                                setNewStudentFormData({ ...newStudentFormData, lastName: filtered });
                                if (formErrors.lastName) setFormErrors(prev => ({ ...prev, lastName: false }));
                              }}
                              placeholder="Last name"
                              className={cn(
                                "h-10 border-slate-200 font-bold rounded-xl px-4 text-sm",
                                formErrors.lastName && "border-red-500 ring-2 ring-red-500/10"
                              )}
                            />
                          </div>
                          <div className="md:col-span-2 space-y-1.5">
                            <Label htmlFor="dateOfBirth" className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Date of Birth (Optional)</Label>
                            <Input
                              ref={el => { inputRefs.current["dateOfBirth"] = el; }}
                              id="dateOfBirth"
                              type="date"
                              value={newStudentFormData.dateOfBirth}
                              onChange={(e) => {
                                setNewStudentFormData({ ...newStudentFormData, dateOfBirth: e.target.value });
                                if (formErrors.dateOfBirth) setFormErrors(prev => ({ ...prev, dateOfBirth: false }));
                              }}
                              className="h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="religionId" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Religion</Label>
                            <Select
                              value={newStudentFormData.religionId}
                              onValueChange={(v) => setNewStudentFormData({ ...newStudentFormData, religionId: v || "" })}
                            >
                              <SelectTrigger id="religionId" className="h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm">
                                <SelectValue placeholder="Select Student Religion">
                                  {newStudentFormData.religionId ? religions.find(r => r.id.toString() === newStudentFormData.religionId)?.name : undefined}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                                <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select Student Religion</SelectItem>
                                {Array.isArray(religions) && religions.map(r => (
                                  <SelectItem key={r.id} value={r.id.toString()} className="font-semibold py-1.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">{r.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="bloodGroupId" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blood Group</Label>
                            <Select
                              value={newStudentFormData.bloodGroupId}
                              onValueChange={(v) => setNewStudentFormData({ ...newStudentFormData, bloodGroupId: v || "" })}
                            >
                              <SelectTrigger id="bloodGroupId" className="h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm">
                                <SelectValue placeholder="Select Student Blood Group">
                                  {newStudentFormData.bloodGroupId ? bloodGroups.find(bg => bg.id.toString() === newStudentFormData.bloodGroupId)?.name : undefined}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                                <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select Student Blood Group</SelectItem>
                                {Array.isArray(bloodGroups) && bloodGroups.map(bg => (
                                  <SelectItem key={bg.id} value={bg.id.toString()} className="font-semibold py-1.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">{bg.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="casteId" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Caste</Label>
                            <Select
                              value={newStudentFormData.casteId}
                              onValueChange={(v) => setNewStudentFormData({ ...newStudentFormData, casteId: v || "" })}
                            >
                              <SelectTrigger id="casteId" className="h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm">
                                <SelectValue placeholder="Select Caste">
                                  {newStudentFormData.casteId ? castes.find(c => c.id.toString() === newStudentFormData.casteId)?.name : undefined}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                                <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select Caste</SelectItem>
                                {Array.isArray(castes) && castes.map(c => (
                                  <SelectItem key={c.id} value={c.id.toString()} className="font-semibold py-1.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="categoryId" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</Label>
                            <Select
                              value={newStudentFormData.categoryId}
                              onValueChange={(v) => setNewStudentFormData({ ...newStudentFormData, categoryId: v || "" })}
                            >
                              <SelectTrigger id="categoryId" className="h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm">
                                <SelectValue placeholder="Select Category">
                                  {newStudentFormData.categoryId ? categories.find(c => c.id.toString() === newStudentFormData.categoryId)?.name : undefined}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                                <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select Category</SelectItem>
                                {Array.isArray(categories) && categories.map(c => (
                                  <SelectItem key={c.id} value={c.id.toString()} className="font-semibold py-1.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="md:col-span-2 space-y-1.5">
                            <Label htmlFor="subCasteId" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sub-Caste</Label>
                            <Select
                              value={newStudentFormData.subCasteId}
                              onValueChange={(v) => setNewStudentFormData({ ...newStudentFormData, subCasteId: v || "" })}
                              disabled={!newStudentFormData.casteId}
                            >
                              <SelectTrigger id="subCasteId" className="h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm">
                                <SelectValue placeholder="Select Student Sub-Caste">
                                  {newStudentFormData.subCasteId ? subCastes.find(sc => sc.id.toString() === newStudentFormData.subCasteId)?.name : undefined}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                                <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select Student Sub-Caste</SelectItem>
                                {Array.isArray(subCastes) && subCastes
                                  .filter(sc => sc.casteId?.toString() === newStudentFormData.casteId)
                                  .map(sc => (
                                    <SelectItem key={sc.id} value={sc.id.toString()} className="font-semibold py-1.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">{sc.name}</SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </section>
                    </div>

                    <section>
                      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100">
                        <div className="w-1.5 h-5 bg-red-600 rounded-full"></div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Family & Contact</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label htmlFor="motherName" className={cn("text-[10px] font-black uppercase tracking-widest ml-1", formErrors.motherName ? "text-red-500" : "text-slate-500")}>Mother's Name {formErrors.motherName && " (Formatting Error)"}</Label>
                          <Input
                            ref={el => { inputRefs.current["motherName"] = el; }}
                            id="motherName"
                            value={newStudentFormData.motherName}
                            onChange={(e) => {
                              const filtered = e.target.value.replace(/[0-9]/g, "");
                              setNewStudentFormData({ ...newStudentFormData, motherName: filtered });
                              if (formErrors.motherName) setFormErrors(prev => ({ ...prev, motherName: false }));
                            }}
                            placeholder="e.g. Mary Wilson (Optional)"
                            className={cn(
                              "h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm",
                              formErrors.motherName && "border-red-500 ring-2 ring-red-500/10"
                            )}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="fatherContactNo" className={cn("text-[10px] font-black uppercase tracking-widest ml-1", formErrors.fatherContactNo ? "text-red-500" : "text-slate-500")}>Father's Contact No. {formErrors.fatherContactNo && "*"}</Label>
                          <Input
                            ref={el => { inputRefs.current["fatherContactNo"] = el; }}
                            id="fatherContactNo"
                            type="tel"
                            value={newStudentFormData.fatherContactNo}
                            maxLength={10}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setNewStudentFormData({ ...newStudentFormData, fatherContactNo: val });
                              if (formErrors.fatherContactNo) setFormErrors(prev => ({ ...prev, fatherContactNo: false }));
                            }}
                            placeholder="10-digit number"
                            className={cn(
                              "h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm",
                              formErrors.fatherContactNo && "border-red-500 ring-2 ring-red-500/10"
                            )}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="motherContactNo" className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Mother's Contact No.</Label>
                          <Input
                            id="motherContactNo"
                            type="tel"
                            value={newStudentFormData.motherContactNo}
                            maxLength={10}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setNewStudentFormData({ ...newStudentFormData, motherContactNo: val });
                            }}
                            placeholder="Optional 10-digit number"
                            className="h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm"
                          />
                        </div>

                        {/* Double Interactive Communication & Affiliation Preferences check-buttons */}
                        <div className="md:col-span-2 space-y-1.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Facility & Affiliation Preferences</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
                            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all select-none">
                              <input
                                type="checkbox"
                                checked={!!newStudentFormData.sms}
                                onChange={(e) => setNewStudentFormData({ ...newStudentFormData, sms: e.target.checked })}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 accent-blue-600 cursor-pointer"
                              />
                              <span className="text-xs font-bold text-slate-700">SMS Alerts</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all select-none hidden">
                              <input
                                type="checkbox"
                                checked={!!newStudentFormData.isStateBoard}
                                onChange={(e) => setNewStudentFormData({ ...newStudentFormData, isStateBoard: e.target.checked })}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 accent-blue-600 cursor-pointer"
                              />
                              <span className="text-xs font-bold text-slate-700">State Board</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all select-none">
                              <input
                                type="checkbox"
                                checked={!!newStudentFormData.digitalUniform}
                                onChange={(e) => setNewStudentFormData({ ...newStudentFormData, digitalUniform: e.target.checked })}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 accent-blue-600 cursor-pointer"
                              />
                              <span className="text-xs font-bold text-slate-700">Digital Uniform</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all select-none">
                              <input
                                type="checkbox"
                                checked={!!newStudentFormData.digitalNotebook}
                                onChange={(e) => setNewStudentFormData({ ...newStudentFormData, digitalNotebook: e.target.checked })}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 accent-blue-600 cursor-pointer"
                              />
                              <span className="text-xs font-bold text-slate-700">Digital Notebook</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all select-none">
                              <input
                                type="checkbox"
                                checked={!!newStudentFormData.optedForBus}
                                onChange={(e) => setNewStudentFormData({ ...newStudentFormData, optedForBus: e.target.checked })}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 accent-blue-600 cursor-pointer"
                              />
                              <span className="text-xs font-bold text-slate-700">Opted for Bus</span>
                            </label>
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                          <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Residential Address (Optional)</Label>
                          <Input
                            ref={el => { inputRefs.current["address"] = el; }}
                            id="address"
                            value={newStudentFormData.address}
                            onChange={(e) => {
                              setNewStudentFormData({ ...newStudentFormData, address: e.target.value });
                              if (formErrors.address) setFormErrors(prev => ({ ...prev, address: false }));
                            }}
                            placeholder="Enter complete residential address"
                            className="h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm"
                          />
                        </div>
                      </div>
                    </section>

                    <section className="mt-6">
                      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100">
                        <div className="w-1.5 h-5 bg-teal-600 rounded-full"></div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Additional & Geographic Information</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newStudentFormData.email}
                            onChange={(e) => setNewStudentFormData({ ...newStudentFormData, email: e.target.value })}
                            placeholder="e.g. email@domain.com"
                            className="h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="admissionDate" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admission Date</Label>
                          <Input
                            id="admissionDate"
                            type="date"
                            value={newStudentFormData.admissionDate}
                            onChange={(e) => setNewStudentFormData({ ...newStudentFormData, admissionDate: e.target.value })}
                            className="h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="stateId" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            State Name
                          </Label>
                          <Select
                            value={newStudentFormData.stateId}
                            onValueChange={(v) => {
                              setNewStudentFormData({ ...newStudentFormData, stateId: v || "", cityId: "" });
                              if (formErrors.stateId) setFormErrors(prev => ({ ...prev, stateId: false }));
                            }}
                          >
                            <SelectTrigger
                              ref={el => { inputRefs.current["stateId"] = el; }}
                              id="stateId"
                              className="h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm"
                            >
                              <SelectValue placeholder="Select State (Optional)">
                                {newStudentFormData.stateId ? states.find(st => st.id.toString() === newStudentFormData.stateId)?.name : undefined}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                              <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select State (Optional)</SelectItem>
                              {Array.isArray(states) && states.map(st => (
                                <SelectItem key={st.id} value={st.id.toString()} className="font-semibold py-1.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">
                                  {st.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="cityId" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            City Name
                          </Label>
                          <Select
                            value={newStudentFormData.cityId}
                            onValueChange={(v) => {
                              setNewStudentFormData({ ...newStudentFormData, cityId: v || "" });
                              if (formErrors.cityId) setFormErrors(prev => ({ ...prev, cityId: false }));
                            }}
                            disabled={!newStudentFormData.stateId}
                          >
                            <SelectTrigger
                              ref={el => { inputRefs.current["cityId"] = el; }}
                              id="cityId"
                              className={cn(
                                "h-10 border-slate-200 bg-slate-50/50 font-bold rounded-xl px-4 text-sm",
                                !newStudentFormData.stateId && "opacity-80 cursor-not-allowed bg-slate-100"
                              )}
                            >
                              <SelectValue placeholder="Select City (Optional)">
                                {newStudentFormData.cityId ? cities.find(c => c.id.toString() === newStudentFormData.cityId)?.name : undefined}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                              <SelectItem value="" className="font-semibold py-1.5 px-3 rounded-lg focus:bg-slate-50 text-slate-400 italic">Select City (Optional)</SelectItem>
                              {Array.isArray(cities) && cities
                                .filter(c => c.stateId?.toString() === newStudentFormData.stateId)
                                .map(c => (
                                  <SelectItem key={c.id} value={c.id.toString()} className="font-semibold py-1.5 px-3 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer">
                                    {c.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <DialogFooter className="bg-slate-50 px-10 py-5 shrink-0 border-t border-slate-100 flex flex-row items-center justify-end gap-3">
                  <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="h-9 px-5 font-bold text-slate-500 hover:text-slate-900 rounded-xl text-xs uppercase tracking-wider">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddStudent}
                    disabled={isProcessing}
                    className="h-10 px-8 bg-blue-600 hover:bg-blue-700 font-black shadow-lg shadow-blue-600/20 rounded-xl transition-all active:scale-[0.98] text-xs uppercase tracking-wider"
                  >
                    {isProcessing ? "Processing..." : isEditMode ? "Update Record" : "Enroll Student"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card className="dashboard-card border-none overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-50 bg-white/50 backdrop-blur-sm px-6 sm:px-8 pt-8">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative w-full max-w-sm group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <Input
                  placeholder="Filter by name, roll, or GR..."
                  className="pl-11 h-11 bg-slate-50/50 border-slate-200/60 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium rounded-2xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={standardFilter} onValueChange={(val) => setStandardFilter(val || "all")}>
                  <SelectTrigger className="w-[140px] h-11 bg-slate-50/50 border-slate-200/60 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-blue-500/5">
                    {/* Explicit mapping to show "Grade X" or "All Grades" in trigger */}
                    <SelectValue placeholder="Standard">
                      {standardFilter === "all" ? "All Standards" : (standardsMaster.find(std => std.id.toString() === standardFilter)?.name ? `Standard ${standardsMaster.find(std => std.id.toString() === standardFilter)?.name}` : undefined)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                    <SelectItem value="all" className="rounded-xl font-bold py-2.5">All Standards</SelectItem>
                    {Array.isArray(standardsMaster) && standardsMaster.map(std => (
                      <SelectItem key={std.id} value={std.id.toString()} className="rounded-xl font-bold py-2.5">Standard {std.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sectionFilter} onValueChange={(val) => setSectionFilter(val || "all")}>
                  <SelectTrigger className="w-[140px] h-11 bg-slate-50/50 border-slate-200/60 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-blue-500/5">
                    {/* Explicit mapping to show "Section X" or "All Sections" in trigger */}
                    <SelectValue placeholder="Section">
                      {sectionFilter === "all" ? "All Divisions" : (sectionsMaster.find(sec => sec.id.toString() === sectionFilter)?.name ? `Division ${sectionsMaster.find(sec => sec.id.toString() === sectionFilter)?.name}` : undefined)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                    <SelectItem value="all" className="rounded-xl font-bold py-2.5">All Divisions</SelectItem>
                    {Array.isArray(sectionsMaster) && sectionsMaster.map(sec => (
                      <SelectItem key={sec.id} value={sec.id.toString()} className="rounded-xl font-bold py-2.5">Division {sec.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50/80 px-5 py-2.5 rounded-2xl border border-slate-100">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-500">
                <span className="font-black text-slate-900">{Array.isArray(filteredStudents) ? filteredStudents.length : 0}</span> Active Registry Records
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/30 h-16 border-b border-slate-50">
                  <TableHead
                    className="w-[140px] pl-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort("grno")}
                  >
                    <div className="flex items-center gap-1">
                      Registry #
                      {sortBy === "grno" ? (sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[80px] hidden md:table-cell text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort("roll")}
                  >
                    <div className="flex items-center gap-1">
                      Roll
                      {sortBy === "roll" ? (sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort("fullName")}
                  >
                    <div className="flex items-center gap-1">
                      Profile Information
                      {sortBy === "fullName" ? (sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
                    </div>
                  </TableHead>
                  <TableHead
                    className="hidden lg:table-cell text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort("standard")}
                  >
                    <div className="flex items-center gap-1">
                      Placement
                      {sortBy === "standard" ? (sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
                    </div>
                  </TableHead>
                  <TableHead className="hidden xl:table-cell text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity Details</TableHead>
                  <TableHead className="hidden sm:table-cell text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Status</TableHead>
                  <TableHead className="text-right pr-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(filteredStudents) && filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors group border-b border-slate-50/50 h-20">
                      <TableCell className="pl-8">
                        <SimpleTooltip content="Official Registration Number" side="right">
                          <span className="font-mono text-xs font-black text-blue-600 bg-blue-50/50 px-2.5 py-1.5 rounded-lg border border-blue-100/50 cursor-help">
                            {(student as any).grno || student.id}
                          </span>
                        </SimpleTooltip>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-black text-slate-900 hidden md:table-cell">{student.roll.toString().padStart(2, '0')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            <Avatar className="h-11 w-11 border-2 border-white shadow-sm ring-1 ring-slate-100">
                              <AvatarImage
                                src={resolvePhotoUrl(student.profilePhotoPath || (student as any).ProfilePhotoPath || (student as any).photo)}
                                alt={student.name}
                                onError={(e) => {
                                  console.warn(`[IMAGE_LOAD_WARNING] List avatar photo failed to load for student "${student.name}" (ID: ${student.id}) from URL: "${e.currentTarget.src}". Fallback to text initials will be triggered.`);
                                }}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 text-xs font-black">
                                {student.name ? student.name.split(" ").map((n: string) => n[0]).join("") : "S"}
                              </AvatarFallback>
                            </Avatar>
                            <SimpleTooltip content="Update photo" side="top">
                              <button
                                onClick={() => triggerPhotoUpload(student.id)}
                                className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full border border-slate-100 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                                aria-label="Change student photo"
                              >
                                <Camera size={10} className="text-blue-600" />
                              </button>
                            </SimpleTooltip>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-black text-slate-900 truncate tracking-tight text-sm">{student.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                {student.gender}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-slate-200" />
                              <span className="text-[10px] text-slate-500 font-bold truncate">Mom: {student.motherName || 'Registry Blank'}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-800">{student.standard}</span>
                            <span className="text-slate-300 font-thin">|</span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">Section {student.section}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            {user.role === "superadmin" && (
                              <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">
                                {schools.find(sch => sch.id.toString() === student.schoolId)?.name || `ID: ${student.schoolId}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold">DOB: {student.birthDate || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-blue-600 bg-blue-50/50 px-1.5 rounded font-black tracking-tight tracking-widest">
                              {student.contactNumber || 'NO_CONTACT'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex flex-col gap-2">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: student.attendance }}></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Att: {student.attendance}</span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-1.5 h-4",
                                student.performance === "Excellent" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                  student.performance === "Good" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                    "bg-amber-50 text-amber-600 border border-amber-100"
                              )}
                            >
                              {student.performance}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <div className="flex items-center justify-center h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm border-none bg-transparent outline-none cursor-pointer transition-all">
                                <MoreHorizontal size={18} />
                              </div>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-100 shadow-2xl p-2">
                            <DropdownMenuGroup>
                              <DropdownMenuItem className="gap-3 py-3 px-4 rounded-xl font-bold text-slate-700 cursor-pointer focus:bg-blue-50 focus:text-blue-700" onClick={() => triggerPhotoUpload(student.id)}>
                                <Camera size={16} /> Update Identity Image
                              </DropdownMenuItem>
                              {canManage && (
                                <DropdownMenuItem className="gap-3 py-3 px-4 rounded-xl font-bold text-slate-700 cursor-pointer focus:bg-blue-50 focus:text-blue-700" onClick={() => openEditDialog(student)}>
                                  <Edit2 size={16} /> Edit Student Profile
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="gap-3 py-3 px-4 rounded-xl font-bold text-slate-700 cursor-pointer focus:bg-blue-50 focus:text-blue-700">
                                <FileText size={16} /> Academic Statistics
                              </DropdownMenuItem>
                              {canManage && (
                                <DropdownMenuItem className="gap-3 py-3 px-4 rounded-xl font-bold text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700" onClick={() => handleDeleteStudent(student.id, student.name)}>
                                  <Trash2 size={16} /> Remove from Registry
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 bg-slate-50 rounded-full">
                          <Search className="text-slate-300" size={32} />
                        </div>
                        <p className="text-lg font-bold text-slate-400 italic">No students found matching your search</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 bg-slate-50/50 border-t border-slate-100 gap-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Showing <span className="text-slate-900 font-black">{students.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to <span className="text-slate-900 font-black">{Math.min(page * pageSize, totalCount)}</span> of <span className="text-slate-900 font-black">{totalCount}</span> entries
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows per page</span>
                <Select value={pageSize.toString()} onValueChange={(v) => { if (v) { setPageSize(parseInt(v)); setPage(1); } }}>
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
        </CardContent>
      </Card>
    </div>
  );
}

// No need for local cn function anymore as we use the one from @/lib/utils
