import { useState, useEffect, useRef } from "react";
import * as LucideIcons from "lucide-react";
import {
  Database,
  Layers,
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  Edit3,
  Hash,
  Calendar,
  Users,
  UserPlus,
  MapPin,
  Map,
  Droplet,
  Home,
  FileText,
  Milestone,
  School,
  Shield,
  ShieldCheck,
  UserCheck,
  LayoutGrid,
  Clock,
  BookOpen,
  Award,
  Briefcase,
  UserRound,
  Hammer,
  Camera,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { apiService } from "@/lib/api";
import { Navigate } from "react-router-dom";
import { User } from "@/types";
import { motion } from "motion/react";
import { cn, parseSafeInt, resolvePhotoUrl } from "@/lib/utils";
import { SimpleTooltip } from "@/components/shared/SimpleTooltip";

interface ConfigurationProps {
  user: User;
  defaultTab?: string;
}

/**
 * GLOBAL MASTER CONFIGURATION MAP
 * Defines metadata for each master type including its UI label, icon,
 * description for headers, and the API prefix used for dynamic method calling.
 */
const MASTER_TYPES: Record<
  string,
  {
    label: string;
    icon: any;
    description: string;
    apiPrefix: string;
    getMethod?: string;
  }
> = {
  schools: {
    label: "Schools",
    icon: School,
    description: "Manage institutional branches",
    apiPrefix: "School",
  },
  "role-master": {
    label: "Role Master",
    icon: Shield,
    description: "Manage system access roles",
    apiPrefix: "Role",
  },
  "role-assignment": {
    label: "User Accounts",
    icon: UserCheck,
    description: "Manage system user accounts and credentials",
    apiPrefix: "User",
  },
  standards: {
    label: "Standards",
    icon: Layers,
    description: "Manage academic standards/grades",
    apiPrefix: "Standard",
  },
  sections: {
    label: "Divisions/Sections",
    icon: Hash,
    description: "Manage class subdivisions",
    apiPrefix: "Section",
  },
  "academic-years": {
    label: "Academic Years",
    icon: Calendar,
    description: "Manage educational sessions",
    apiPrefix: "AcademicYear",
  },
  castes: {
    label: "Castes",
    icon: Users,
    description: "Manage student caste categories",
    apiPrefix: "Caste",
  },
  "sub-castes": {
    label: "Sub-Castes",
    icon: Users,
    description: "Manage specific sub-caste groups",
    apiPrefix: "SubCaste",
  },
  religions: {
    label: "Religions",
    icon: Milestone,
    description: "Manage religious affiliations",
    apiPrefix: "Religion",
  },
  states: {
    label: "States",
    icon: Map,
    description: "List of administrative states",
    apiPrefix: "State",
  },
  cities: {
    label: "Cities",
    icon: MapPin,
    description: "List of cities/towns",
    apiPrefix: "City",
    getMethod: "getCities",
  },
  "school-sections": {
    label: "School Sections",
    icon: Layers,
    description: "Manage school sections",
    apiPrefix: "SchoolSection",
  },
  "blood-groups": {
    label: "Blood Groups",
    icon: Droplet,
    description: "Manage emergency blood types",
    apiPrefix: "BloodGroup",
  },
  houses: {
    label: "Houses",
    icon: Home,
    description: "Manage school house systems",
    apiPrefix: "House",
  },
  "admission-types": {
    label: "Admission Types",
    icon: FileText,
    description: "Manage enrollment categories",
    apiPrefix: "AdmissionType",
  },
  categories: {
    label: "Categories",
    icon: LayoutGrid,
    description: "Manage social categories",
    apiPrefix: "Category",
    getMethod: "getCategories",
  },
  sessions: {
    label: "Sessions",
    icon: Clock,
    description: "Manage school sessions",
    apiPrefix: "Session",
  },
  batches: {
    label: "Batches",
    icon: Users,
    description: "Manage student batches",
    apiPrefix: "Batch",
  },
  shifts: {
    label: "Shifts",
    icon: Clock,
    description: "Manage staff/student shifts",
    apiPrefix: "Shift",
  },
  subjects: {
    label: "Subjects",
    icon: BookOpen,
    description: "Manage academic subjects",
    apiPrefix: "Subject",
  },
  "exam-types": {
    label: "Exam Types",
    icon: Award,
    description: "Manage examination categories",
    apiPrefix: "ExamType",
  },
  designations: {
    label: "Designations",
    icon: Briefcase,
    description: "Manage staff designations",
    apiPrefix: "Designation",
  },
  occupations: {
    label: "Occupations",
    icon: Hammer,
    description: "Manage parent occupations",
    apiPrefix: "Occupation",
  },
  navigation: {
    label: "Navigation Master",
    icon: LayoutGrid,
    description: "Manage hierarchical sidebar menu",
    apiPrefix: "Navigation",
  },
};

export default function Configuration({
  user,
  defaultTab = "schools",
}: ConfigurationProps) {
  // INTERNAL RBAC CHECK: Secondary layer of protection for superadmin and admin roles
  if (user.role !== "superadmin" && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [masterData, setMasterData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Master dependencies for related lookups (like Sub-Castes needing Castes)
  const [dependencies, setDependencies] = useState<Record<string, any[]>>({});

  // Sync active tab with prop
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [localPhotoPreview, setLocalPhotoPreview] = useState<string | null>(
    null,
  );

  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const inputRefs = useRef<Record<string, any>>({});

  // Form states
  const [formData, setFormData] = useState<any>({
    name: "",
    description: "",
    isCurrent: false,
    isActive: true,
    color: "",
    casteId: "",
    stateId: "",
    address: "",
    phone: "",
    email: "",
    profilePhotoPath: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingSchoolId, setUploadingSchoolId] = useState<number | null>(
    null,
  );

  const triggerPhotoUpload = (id: number) => {
    setUploadingSchoolId(id);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadingSchoolId !== null) {
      // Direct list row interaction
      const loadingToast = toast.loading("Uploading institutional logo...");
      try {
        const response = await apiService.uploadSchoolPhoto(
          uploadingSchoolId,
          file,
        );
        const _newPath = response.data.data?.path || response.data.path;
        toast.dismiss(loadingToast);
        toast.success("Institutional identity updated physically.");
        fetchData(); // Refresh to see the new logo
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error(
          "Failed to update logo physically. Check server permissions.",
        );
        console.error(error);
      } finally {
        setUploadingSchoolId(null);
      }
    } else {
      // Dialog interaction
      if (!editingItem) {
        // Adding a new school: keep in local state preview
        setSelectedPhotoFile(file);
        setLocalPhotoPreview(URL.createObjectURL(file));
        toast.success(
          "School branding photo selected. Click Create Master to save.",
        );
      } else {
        // Editing an existing school in the dialog: upload immediately
        const loadingToast = toast.loading("Uploading institutional logo...");
        try {
          const response = await apiService.uploadSchoolPhoto(
            editingItem.id,
            file,
          );
          const newPath = response.data.data?.path || response.data.path;
          setFormData((prev: any) => ({ ...prev, profilePhotoPath: newPath }));
          toast.dismiss(loadingToast);
          toast.success("Institutional photo updated successfully");
          fetchData(); // Refresh to reflect in the grid
        } catch (error) {
          toast.dismiss(loadingToast);
          toast.error("Failed to upload photo. Please try again.");
          console.error(error);
        }
      }
    }

    if (e.target) e.target.value = "";
  };

  /**
   * FETCH MASTER DATA
   * Dynamically fetches data from the API based on the currently active tab.
   * Also handles dependency loading for related master types (e.g. Sub-Caste needs Caste list).
   */
  const fetchData = async () => {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const typeConfig = MASTER_TYPES[activeTab];

      if (activeTab === "role-assignment") {
        const [usersRes, rolesRes, schoolsRes] = await Promise.all([
          apiService.getUsers(),
          apiService.getRoles(),
          apiService.getSchools(),
        ]);
        const usersData = usersRes.data?.data || usersRes.data || [];
        const rolesData = rolesRes.data?.data || rolesRes.data || [];
        const schoolsData = schoolsRes.data?.data || schoolsRes.data || [];
        setMasterData(Array.isArray(usersData) ? usersData : []);
        setDependencies((prev) => ({
          ...prev,
          roles: Array.isArray(rolesData) ? rolesData : [],
          schools: Array.isArray(schoolsData) ? schoolsData : [],
        }));
      } else {
        const getMethodName =
          typeConfig.getMethod || `get${typeConfig.apiPrefix}s`;
        // @ts-ignore
        const response = await apiService[getMethodName]();
        // Handle potential { data: [...] } wrapper from interceptor or raw array
        const extractedData = response.data?.data || response.data || [];
        setMasterData(Array.isArray(extractedData) ? extractedData : []);

        // Fetch dependencies if needed
        if (activeTab === "sub-castes") {
          const castesRes = await apiService.getCastes();
          const castesData = castesRes.data?.data || castesRes.data || [];
          setDependencies((prev) => ({
            ...prev,
            castes: Array.isArray(castesData) ? castesData : [],
          }));
        }
        if (activeTab === "cities" || activeTab === "schools") {
          const statesRes = await apiService.getStates();
          const statesData = statesRes.data?.data || statesRes.data || [];
          setDependencies((prev) => ({
            ...prev,
            states: Array.isArray(statesData) ? statesData : [],
          }));
        }
        if (activeTab === "schools") {
          const citiesRes = await apiService.getCities();
          const citiesData = citiesRes.data?.data || citiesRes.data || [];
          setDependencies((prev) => ({
            ...prev,
            cities: Array.isArray(citiesData) ? citiesData : [],
          }));
        }
        if (activeTab === "navigation") {
          const rolesRes = await apiService.getRoles();
          const navsRes = await apiService.getNavigations();
          const rolesData = rolesRes.data?.data || rolesRes.data || [];
          const navsData = navsRes.data?.data || navsRes.data || [];
          setDependencies((prev) => ({
            ...prev,
            roles: Array.isArray(rolesData) ? rolesData : [],
            parentNavs: (Array.isArray(navsData) ? navsData : []).filter(
              (n: any) => !n.parentId,
            ),
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error(`Failed to load ${MASTER_TYPES[activeTab].label}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (!isDialogOpen) {
      setSelectedPhotoFile(null);
      if (localPhotoPreview) {
        URL.revokeObjectURL(localPhotoPreview);
        setLocalPhotoPreview(null);
      }
    }
  }, [isDialogOpen]);

  const handleOpenDialog = (item: any = null) => {
    setEditingItem(item);
    setFormErrors({});
    setSelectedPhotoFile(null);
    if (localPhotoPreview) {
      URL.revokeObjectURL(localPhotoPreview);
      setLocalPhotoPreview(null);
    }
    setFormData({
      name: item?.name || item?.fullName || "",
      description: item?.description || "",
      isCurrent: item?.isCurrent || false,
      isActive: item?.isActive !== false, // Default to true if undefined
      color: item?.color || "#3b82f6",
      casteId: item?.casteId?.toString() || "",
      stateId: item?.stateId?.toString() || "",
      address: item?.address || "",
      phone: item?.phone || "",
      email: item?.email || "",
      title: item?.title || "",
      path: item?.path || "",
      icon: item?.icon || "",
      parentId: item?.parentId?.toString() || "",
      sortOrder: item?.sortOrder || 0,
      roles: item?.roles || ["superadmin"],
      profilePhotoPath: item?.profilePhotoPath || item?.ProfilePhotoPath || "",
      username: item?.username || "",
      password: "",
      confirmPassword: "",
      role: item?.role
        ? item.role.toLowerCase().replace(/\s+/g, "")
        : "student",
      schoolId: item?.schoolId ? item.schoolId.toString() : "",
      // Extended school parameters for comprehensive UI form support
      shortName: item?.shortName || "",
      cityId: item?.cityId?.toString() || "",
      pincode: item?.pincode || "",
      smsLimit: item?.smsLimit?.toString() || "",
      totalSMSSent: item?.totalSMSSent || 0,
      smsBalance: item?.smsBalance || 0,
      enableSMS: item?.enableSMS || false,
      enablePresenteeSMS: item?.enablePresenteeSMS || false,
      automaticBirthdaySMS: item?.automaticBirthdaySMS || false,
      enableWhatsapp: item?.enableWhatsapp || false,
      websiteUrl: item?.websiteUrl || "",
      smsSenderID: item?.smsSenderID || "",
      busNumbers: item?.busNumbers || "",
      scanIDContact: item?.scanIDContact || "",
      scanIDEmail: item?.scanIDEmail || "",
      inChargeContact: item?.inChargeContact || "",
      status: item?.status || "Active",
      startTime: item?.startTime || "",
      endTime: item?.endTime || "",
      graceInTime: item?.graceInTime || "",
      spanInTime: item?.spanInTime || "",
      lunchStart: item?.lunchStart || "",
      lunchEnd: item?.lunchEnd || "",
    });
    setIsDialogOpen(true);
  };

  /**
   * PERSIST MASTER RECORD
   * Handles both creation of new records and updates to existing ones.
   * Dynamically constructs the payload based on the active master type.
   */
  const handleSave = async () => {
    const newErrors: Record<string, boolean> = {};
    if (activeTab === "navigation") {
      if (!formData.title?.trim()) newErrors.title = true;
      // Path is only required for leaf nodes (items without children in common use,
      // but here we allow empty path for parent items which act as containers)
    } else {
      if (!formData.name?.trim()) newErrors.name = true;
    }

    if (activeTab === "sub-castes" && !formData.casteId)
      newErrors.casteId = true;
    if (activeTab === "cities" && !formData.stateId) newErrors.stateId = true;
    if (activeTab === "schools") {
      if (!formData.address) newErrors.address = true;
      if (
        formData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      ) {
        newErrors.email = true;
      }
      if (
        formData.scanIDEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.scanIDEmail)
      ) {
        newErrors.scanIDEmail = true;
      }
    }
    if (activeTab === "role-assignment") {
      if (!formData.username?.trim()) newErrors.username = true;
      if (!formData.email?.trim()) {
        newErrors.email = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = true;
      }
      if (!editingItem && !formData.password?.trim()) newErrors.password = true;
      if (formData.password && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = true;
      }
    }

    setFormErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields.");
      const firstError = Object.keys(newErrors)[0];
      const element = inputRefs.current[firstError];
      if (element) {
        element.focus?.();
        element.scrollIntoView?.({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      const typeConfig = MASTER_TYPES[activeTab];
      const prefix = typeConfig.apiPrefix;
      const createMethod = `create${prefix}`;
      const updateMethod = `update${prefix}`;

      // Prepare payload based on the active master type to avoid sending irrelevant data
      let payload: any = {
        isActive: formData.isActive,
      };

      if (activeTab === "navigation") {
        payload = {
          ...payload,
          title: formData.title,
          path: formData.path,
          icon: formData.icon,
          parentId: formData.parentId ? parseSafeInt(formData.parentId) : null,
          sortOrder: parseSafeInt(formData.sortOrder) || 0,
          roles: formData.roles,
        };
      } else {
        payload.name = formData.name;
        payload.description = formData.description;
      }

      // Add type-specific fields with proper type conversion
      if (activeTab === "shifts") {
        payload.startTime = formData.startTime;
        payload.endTime = formData.endTime;
        payload.graceInTime = formData.graceInTime;
        payload.spanInTime = formData.spanInTime;
        payload.lunchStart = formData.lunchStart;
        payload.lunchEnd = formData.lunchEnd;
      } else if (activeTab === "academic-years") {
        payload.isCurrent = formData.isCurrent;
      } else if (activeTab === "houses") {
        payload.color = formData.color;
      } else if (activeTab === "sub-castes") {
        payload.casteId = parseSafeInt(formData.casteId);
      } else if (activeTab === "cities") {
        payload.stateId = parseSafeInt(formData.stateId);
      } else if (activeTab === "schools") {
        payload.address = formData.address;
        payload.phone = formData.phone;
        payload.email = formData.email;
        payload.profilePhotoPath = formData.profilePhotoPath;
        payload.shortName = formData.shortName;
        payload.cityId = formData.cityId ? parseSafeInt(formData.cityId) : null;
        payload.stateId = formData.stateId
          ? parseSafeInt(formData.stateId)
          : null;
        payload.pincode = formData.pincode;
        payload.smsLimit = formData.smsLimit
          ? parseSafeInt(formData.smsLimit)
          : null;
        payload.totalSMSSent = formData.totalSMSSent
          ? parseSafeInt(formData.totalSMSSent)
          : 0;
        payload.smsBalance = formData.smsBalance
          ? parseSafeInt(formData.smsBalance)
          : 0;
        payload.enableSMS = !!formData.enableSMS;
        payload.enablePresenteeSMS = !!formData.enablePresenteeSMS;
        payload.automaticBirthdaySMS = !!formData.automaticBirthdaySMS;
        payload.enableWhatsapp = !!formData.enableWhatsapp;
        payload.websiteUrl = formData.websiteUrl;
        payload.smsSenderID = formData.smsSenderID;
        payload.busNumbers = formData.busNumbers;
        payload.scanIDContact = formData.scanIDContact;
        payload.scanIDEmail = formData.scanIDEmail;
        payload.inChargeContact = formData.inChargeContact;
        payload.status = formData.status || "Active";
      } else if (activeTab === "role-assignment") {
        let matchedRole = Array.isArray(dependencies.roles)
          ? dependencies.roles.find(
              (r: any) =>
                r.name.toLowerCase().replace(/\s+/g, "") ===
                formData.role?.toLowerCase().replace(/\s+/g, ""),
            )
          : null;
        let roleId = matchedRole
          ? parseInt(matchedRole.id?.toString())
          : undefined;
        let roleName = matchedRole ? matchedRole.name : formData.role;

        // Robust fallback role credentials matching
        if (!roleId) {
          if (formData.role === "superadmin") {
            roleId = 1;
            roleName = "SuperAdmin";
          } else if (formData.role === "admin") {
            roleId = 2;
            roleName = "Admin";
          } else if (formData.role === "teacher") {
            roleId = 3;
            roleName = "Teacher";
          } else if (formData.role === "student") {
            roleId = 4;
            roleName = "Student";
          } else if (formData.role === "parent") {
            roleId = 5;
            roleName = "Parent";
          }
        }

        payload = {
          ...payload,
          name: formData.name,
          fullName: formData.name, // Keep both for backwards compatibility
          email: formData.email,
          username: formData.username,
          role: roleName,
          roleId: roleId,
          passwordHash: formData.password || undefined,
          PasswordHash: formData.password || undefined, // Support both casings
          schoolId: formData.schoolId ? parseInt(formData.schoolId) : null,
        };
      }

      if (editingItem) {
        payload.id = parseSafeInt(editingItem.id);
        // @ts-ignore
        await apiService[updateMethod](editingItem.id, payload);
        toast.success(`${typeConfig.label} updated successfully`);
      } else {
        // @ts-ignore
        const response = await apiService[createMethod](payload);
        toast.success(`${typeConfig.label} created successfully`);

        // Handle delayed photo upload for schools if selectedPhotoFile is present
        const createdSchool = response.data.data || response.data;
        if (activeTab === "schools" && selectedPhotoFile && createdSchool?.id) {
          try {
            await apiService.uploadSchoolPhoto(
              createdSchool.id,
              selectedPhotoFile,
            );
          } catch (uploadErr) {
            console.error("Delayed school photo upload failed:", uploadErr);
          }
        }
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save changes");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const typeConfig = MASTER_TYPES[activeTab];
      const deleteMethod = `delete${typeConfig.apiPrefix}`;
      // @ts-ignore
      await apiService[deleteMethod](id);
      toast.success("Item deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const filteredData = masterData.filter(
    (item) =>
      (item.name || item.title || item.fullName)
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (item.description || item.path)
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const activeConfig = MASTER_TYPES[activeTab];
  const Icon = activeConfig.icon;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-indigo-600 p-4 rounded-[1.25rem] text-white shadow-2xl shadow-indigo-200 transition-transform hover:rotate-3">
            <Icon size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {activeConfig.label}
            </h1>
            <p className="text-slate-400 font-bold mt-1 text-xs sm:text-sm uppercase tracking-widest leading-none">
              {activeConfig.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SimpleTooltip content="Reload data from server" side="bottom">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isRefreshing}
              className="rounded-xl font-bold border-slate-200 h-10 px-5 text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
            >
              <RefreshCw
                size={16}
                className={cn("mr-2", isRefreshing && "animate-spin")}
              />
              Sync Data
            </Button>
          </SimpleTooltip>
        </div>
      </div>

      <Card className="dashboard-card border-none overflow-hidden">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <div className="w-full">
          <div className="px-6 sm:px-8 py-8 border-b border-slate-50 bg-white/50 backdrop-blur-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                System Master Registry
              </h3>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">
                Foundational data management for {activeConfig.label}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative group w-full sm:w-72">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                  size={18}
                />
                <Input
                  placeholder="Filter masters..."
                  className="pl-11 h-11 bg-slate-50/50 border-slate-200/60 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium rounded-2xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-blue-600 hover:bg-blue-700 text-white border-none rounded-2xl h-11 px-8 shadow-xl shadow-blue-500/20 font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
              >
                <Plus size={18} className="mr-2 stroke-[3]" /> Add New
              </Button>
            </div>
          </div>

          <div className="p-0">
            <div className="border-0 overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow className="hover:bg-transparent border-slate-50 h-16">
                    <TableHead className="w-24 pl-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Index
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {activeTab === "role-assignment"
                        ? "User Profile"
                        : "Primary Label"}
                    </TableHead>
                    {activeTab === "role-assignment" && (
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Username
                      </TableHead>
                    )}
                    {activeTab === "role-assignment" && (
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        System Role
                      </TableHead>
                    )}
                    {activeTab === "academic-years" && (
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Current Session
                      </TableHead>
                    )}
                    {activeTab === "houses" && (
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Hex Code
                      </TableHead>
                    )}
                    {activeTab === "sub-castes" && (
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Parent Category
                      </TableHead>
                    )}
                    {activeTab === "cities" && (
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Administrative State
                      </TableHead>
                    )}
                    {activeTab === "schools" && (
                      <>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Location
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Contact
                        </TableHead>
                      </>
                    )}
                    {activeTab === "navigation" && (
                      <>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Path
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Parent
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Roles
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Order
                        </TableHead>
                      </>
                    )}
                    {activeTab !== "role-assignment" &&
                      activeTab !== "navigation" && (
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          {activeTab === "shifts" ? "Shift Details / Timings" : "Description"}
                        </TableHead>
                      )}
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Status
                    </TableHead>
                    <TableHead className="w-20 pr-8 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Manage
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow
                        key={i}
                        className="animate-pulse border-slate-50 h-20"
                      >
                        <TableCell colSpan={10} className="px-8">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-slate-100 rounded-xl" />
                            <div className="h-4 w-32 bg-slate-100 rounded-lg" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : Array.isArray(filteredData) &&
                    filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="p-4 bg-slate-50 rounded-full">
                            <Database className="text-slate-300" size={32} />
                          </div>
                          <p className="text-lg font-black text-slate-300 italic tracking-tight">
                            Empty Database Records
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.isArray(filteredData) &&
                    filteredData.map((item) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-slate-50/50 transition-colors border-slate-50/50 h-20 group"
                      >
                        <TableCell className="pl-8">
                          <span className="font-mono text-[11px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            #{item.id}
                          </span>
                        </TableCell>
                        <TableCell className="font-black text-slate-900 text-sm tracking-tight truncate max-w-[200px]">
                          <div className="flex items-center gap-3">
                            {activeTab === "schools" && (
                              <div className="relative group shrink-0">
                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:ring-blue-400 group-hover:scale-105 transition-all">
                                  <AvatarImage
                                    src={resolvePhotoUrl(
                                      item.profilePhotoPath ||
                                        item.ProfilePhotoPath,
                                    )}
                                    alt={item.name}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="bg-slate-100 text-slate-400 text-[10px] font-black uppercase">
                                    {(item.name || "S")
                                      .split(" ")
                                      .map((n: any) => n[0])
                                      .join("")
                                      .substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <button
                                  onClick={() => triggerPhotoUpload(item.id)}
                                  className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md border border-slate-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white"
                                >
                                  <Camera size={8} />
                                </button>
                              </div>
                            )}
                            {activeTab === "navigation" && item.icon && (
                              <span className="mr-2 inline-flex items-center">
                                {(() => {
                                  const IconComp = (LucideIcons as any)[
                                    item.icon
                                  ];
                                  return IconComp ? (
                                    <IconComp
                                      size={16}
                                      className="text-blue-500"
                                    />
                                  ) : null;
                                })()}
                              </span>
                            )}
                            <span className="truncate">
                              {item.name || item.title || item.fullName}
                            </span>
                          </div>
                        </TableCell>

                        {activeTab === "role-assignment" && (
                          <>
                            <TableCell className="text-xs font-bold text-slate-500 font-mono italic">
                              {item.username}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.role ? item.role.toLowerCase().replace(/\s+/g, "") : ""}
                                onValueChange={async (newRole) => {
                                  try {
                                    await apiService.updateUserRole(
                                      item.id,
                                      newRole,
                                    );
                                    toast.success("Role updated successfully");
                                    fetchData();
                                  } catch (error) {
                                    toast.error("Failed to update role");
                                  }
                                }}
                              >
                                <SelectTrigger className="h-9 w-36 rounded-xl bg-blue-50/50 border-blue-100 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:bg-blue-100/50 transition-colors">
                                  {/* Explicit label mapping to ensure proper display names for roles */}
                                  <SelectValue placeholder="Role">
                                    {item.role
                                      ? dependencies.roles?.find(
                                          (r: any) =>
                                            r.name
                                              .toLowerCase()
                                              .replace(/\s+/g, "") ===
                                            item.role
                                              .toLowerCase()
                                              .replace(/\s+/g, ""),
                                        )?.name ||
                                        (item.role
                                          .toLowerCase()
                                          .replace(/\s+/g, "") === "superadmin"
                                          ? "Super Admin"
                                          : item.role
                                                .toLowerCase()
                                                .replace(/\s+/g, "") === "admin"
                                            ? "Admin"
                                            : item.role
                                                  .toLowerCase()
                                                  .replace(/\s+/g, "") ===
                                                "teacher"
                                              ? "Teacher"
                                              : item.role
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "") ===
                                                  "student"
                                                ? "Student"
                                                : item.role
                                                      .toLowerCase()
                                                      .replace(/\s+/g, "") ===
                                                    "parent"
                                                  ? "Parent"
                                                  : item.role)
                                      : undefined}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                                  {Array.isArray(dependencies.roles) &&
                                    dependencies.roles.map((role: any) => (
                                      <SelectItem
                                        key={role.id}
                                        value={role.name
                                          .toLowerCase()
                                          .replace(" ", "")}
                                        className="text-[10px] font-black py-2.5 rounded-xl uppercase tracking-widest"
                                      >
                                        {role.name}
                                      </SelectItem>
                                    ))}
                                  {(!dependencies.roles ||
                                    dependencies.roles.length === 0) && (
                                    <>
                                      <SelectItem
                                        value="superadmin"
                                        className="text-[10px] font-black py-2.5 rounded-xl uppercase tracking-widest"
                                      >
                                        Super Admin
                                      </SelectItem>
                                      <SelectItem
                                        value="admin"
                                        className="text-[10px] font-black py-2.5 rounded-xl uppercase tracking-widest"
                                      >
                                        Admin
                                      </SelectItem>
                                      <SelectItem
                                        value="teacher"
                                        className="text-[10px] font-black py-2.5 rounded-xl uppercase tracking-widest"
                                      >
                                        Teacher
                                      </SelectItem>
                                      <SelectItem
                                        value="parent"
                                        className="text-[10px] font-black py-2.5 rounded-xl uppercase tracking-widest"
                                      >
                                        Parent
                                      </SelectItem>
                                      <SelectItem
                                        value="student"
                                        className="text-[10px] font-black py-2.5 rounded-xl uppercase tracking-widest"
                                      >
                                        Student
                                      </SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </>
                        )}

                        {activeTab === "academic-years" && (
                          <TableCell>
                            {item.isCurrent ? (
                              <Badge className="bg-blue-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest px-2.5 py-1">
                                Current
                              </Badge>
                            ) : (
                              <span className="text-slate-300 text-[10px] font-bold">
                                —
                              </span>
                            )}
                          </TableCell>
                        )}

                        {activeTab === "houses" && (
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="w-6 h-6 rounded-lg border-2 border-white shadow-sm ring-1 ring-slate-100"
                                style={{ backgroundColor: item.color }}
                              ></div>
                              <span className="text-[10px] font-black font-mono uppercase text-slate-500 tracking-widest px-2 py-1 bg-slate-50 rounded-md">
                                {item.color}
                              </span>
                            </div>
                          </TableCell>
                        )}

                        {activeTab === "sub-castes" && (
                          <TableCell className="text-xs font-bold text-slate-600">
                            <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                              {dependencies.castes?.find(
                                (c) => c.id === item.casteId,
                              )?.name || "SYSTEM_ORPHAN"}
                            </span>
                          </TableCell>
                        )}

                        {activeTab === "cities" && (
                          <TableCell className="text-xs font-bold text-slate-600">
                            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                              {dependencies.states?.find(
                                (s) => s.id === item.stateId,
                              )?.name || "LOC_UNSET"}
                            </span>
                          </TableCell>
                        )}

                        {activeTab === "schools" && (
                          <>
                            <TableCell className="text-xs font-bold text-slate-500 max-w-[150px] truncate leading-relaxed">
                              {item.address || "-"}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-slate-500 italic">
                              {item.email || "-"}
                            </TableCell>
                          </>
                        )}

                        {activeTab === "navigation" && (
                          <>
                            <TableCell className="text-xs font-mono font-bold text-slate-500">
                              {item.path}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-slate-600">
                              {item.parentId ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-black uppercase text-slate-400"
                                >
                                  {masterData.find(
                                    (m) => m.id === parseSafeInt(item.parentId),
                                  )?.title || "Parent Hidden"}
                                </Badge>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {Array.isArray(item.roles) &&
                                  item.roles.map((r: string) => (
                                    <Badge
                                      key={r}
                                      className="bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase px-1.5 py-0.5"
                                    >
                                      {r}
                                    </Badge>
                                  ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-black text-slate-400">
                              {item.sortOrder}
                            </TableCell>
                          </>
                        )}

                        {activeTab !== "role-assignment" &&
                          activeTab !== "navigation" && (
                            <TableCell className="text-xs text-slate-500 max-w-[300px]">
                              {activeTab === "shifts" ? (
                                <div className="flex flex-col gap-1 text-[11px] font-medium">
                                  <div className="flex items-center gap-1 text-slate-700 font-bold">
                                    <Clock size={12} className="text-blue-500 shrink-0" />
                                    <span>Time: {item.startTime || "N/A"} - {item.endTime || "N/A"}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-black flex items-center gap-3">
                                    <span>Grace Limit: {item.graceInTime || "N/A"}</span>
                                    <span>•</span>
                                    <span>Late Limit: {item.spanInTime || "N/A"}</span>
                                  </div>
                                  {(item.lunchStart || item.lunchEnd) && (
                                    <div className="text-[10px] text-slate-400 italic">
                                      Recess: {item.lunchStart || "N/A"} to {item.lunchEnd || "N/A"}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="font-bold text-slate-400 italic truncate block max-w-[200px]">
                                  {item.description || "No metadata found"}
                                </span>
                              )}
                            </TableCell>
                          )}

                        <TableCell>
                          <Badge
                            className={cn(
                              "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest border border-transparent",
                              item.isActive !== false
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {item.isActive !== false
                              ? "Verified Active"
                              : "Disabled State"}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <DropdownMenu>
                            <SimpleTooltip
                              content="Administrative Actions"
                              side="left"
                            >
                              <DropdownMenuTrigger
                                render={
                                  <div
                                    className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm cursor-pointer text-slate-400 hover:text-blue-600 transition-all active:scale-95 border-none outline-none focus:ring-0"
                                    aria-label="Open actions menu"
                                  >
                                    <MoreHorizontal size={18} />
                                  </div>
                                }
                              />
                            </SimpleTooltip>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 rounded-2xl border-slate-100 shadow-2xl p-2 animate-in slide-in-from-top-2 duration-300"
                            >
                              <DropdownMenuItem
                                onClick={() => handleOpenDialog(item)}
                                className="rounded-xl py-3 px-4 font-black transition-all text-xs uppercase tracking-widest text-slate-600 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"
                              >
                                <Edit3 size={14} className="mr-3" /> Update
                                Record
                              </DropdownMenuItem>
                              {activeTab === "schools" && (
                                <DropdownMenuItem
                                  onClick={() => triggerPhotoUpload(item.id)}
                                  className="rounded-xl py-3 px-4 font-black transition-all text-xs uppercase tracking-widest text-slate-600 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"
                                >
                                  <Camera size={14} className="mr-3" /> Update
                                  Logo
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(item.id)}
                                className="rounded-xl py-3 px-4 font-black transition-all text-xs uppercase tracking-widest text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                              >
                                <Trash2 size={14} className="mr-3" />{" "}
                                {activeTab === "role-assignment"
                                  ? "Deactivate User"
                                  : "Purge Entry"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className={cn(
            "rounded-3xl border-none shadow-2xl p-0 overflow-hidden transition-all duration-300",
            activeTab === "navigation" ? "max-w-2xl" : "max-w-md",
          )}
        >
          <div className="bg-blue-600 p-8 text-white">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              {editingItem ? <Edit3 size={24} /> : <Plus size={24} />}
              {editingItem ? "Edit" : "Add New"}{" "}
              {activeTab === "role-assignment"
                ? "User Account"
                : activeConfig.label.replace("Manage ", "").slice(0, -1)}
            </DialogTitle>
            <DialogDescription className="text-blue-100 font-medium">
              {activeTab === "role-assignment"
                ? "Manage system access credentials and role assignment."
                : `Update the details for this ${activeConfig.label.toLowerCase()} record.`}
            </DialogDescription>
          </div>

          <div className="p-8 space-y-5 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className={cn(
                  "text-xs font-black uppercase tracking-wider",
                  formErrors.name || formErrors.title
                    ? "text-red-500"
                    : "text-slate-400",
                )}
              >
                {activeTab === "schools"
                  ? "School Name"
                  : activeTab === "role-assignment"
                    ? "Full Name"
                    : activeTab === "navigation"
                      ? "Navigation Title"
                      : "Name / Label"}{" "}
                {(formErrors.name || formErrors.title) && "*"}
              </Label>
              <Input
                ref={(el) => {
                  inputRefs.current[
                    activeTab === "navigation" ? "title" : "name"
                  ] = el;
                }}
                id="name"
                placeholder={`Enter ${activeTab === "schools" ? "school name" : activeTab === "role-assignment" ? "user's full name" : activeTab === "navigation" ? "menu title" : "name"}...`}
                className={cn(
                  "h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold",
                  (formErrors.name || formErrors.title) &&
                    "border-red-500 ring-2 ring-red-500/10",
                )}
                value={
                  activeTab === "navigation" ? formData.title : formData.name
                }
                onChange={(e) => {
                  if (activeTab === "navigation") {
                    setFormData({ ...formData, title: e.target.value });
                    if (formErrors.title)
                      setFormErrors((prev) => ({ ...prev, title: false }));
                  } else {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name)
                      setFormErrors((prev) => ({ ...prev, name: false }));
                  }
                }}
              />
            </div>

            {activeTab === "shifts" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Shift Start Time
                    </Label>
                    <Input
                      id="startTime"
                      type="time" 
                      className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Shift End Time
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="graceInTime" className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Late Arrival Grace Time
                    </Label>
                    <Input
                      id="graceInTime"
                      type="time"
                      className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                      value={formData.graceInTime}
                      onChange={(e) => setFormData({ ...formData, graceInTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spanInTime" className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Late (Very Late) Limit
                    </Label>
                    <Input
                      id="spanInTime"
                      type="time"
                      className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                      value={formData.spanInTime}
                      onChange={(e) => setFormData({ ...formData, spanInTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lunchStart" className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Recess/Lunch Start
                    </Label>
                    <Input
                      id="lunchStart"
                      type="time"
                      className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                      value={formData.lunchStart}
                      onChange={(e) => setFormData({ ...formData, lunchStart: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lunchEnd" className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Recess/Lunch End
                    </Label>
                    <Input
                      id="lunchEnd"
                      type="time"
                      className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                      value={formData.lunchEnd}
                      onChange={(e) => setFormData({ ...formData, lunchEnd: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "navigation" && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="path"
                    className={cn(
                      "text-xs font-black uppercase tracking-wider",
                      formErrors.path ? "text-red-500" : "text-slate-400",
                    )}
                  >
                    Navigation Path {formErrors.path && "*"}
                  </Label>
                  <Input
                    id="path"
                    placeholder="e.g. /students or /configuration/schools"
                    className={cn(
                      "h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold",
                      formErrors.path &&
                        "border-red-500 ring-2 ring-red-500/10",
                    )}
                    value={formData.path}
                    onChange={(e) => {
                      setFormData({ ...formData, path: e.target.value });
                      if (formErrors.path)
                        setFormErrors((prev) => ({ ...prev, path: false }));
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Lucide Icon
                    </Label>
                    <Select
                      value={formData.icon}
                      onValueChange={(v) =>
                        setFormData({ ...formData, icon: v })
                      }
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold px-4">
                        <SelectValue placeholder="No Icon" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-60">
                        <SelectItem value="" className="font-semibold py-2">
                          None
                        </SelectItem>
                        {[
                          "LayoutDashboard",
                          "Users",
                          "GraduationCap",
                          "CalendarCheck",
                          "CreditCard",
                          "MessageSquare",
                          "UserCheck",
                          "Terminal",
                          "Database",
                          "School",
                          "Bell",
                          "Settings",
                          "Award",
                          "Briefcase",
                          "BookOpen",
                          "Hammer",
                        ].map((icon) => (
                          <SelectItem
                            key={icon}
                            value={icon}
                            className="font-semibold py-2 flex items-center gap-2"
                          >
                            <div className="flex items-center gap-2">
                              {(() => {
                                const IconComp = (LucideIcons as any)[icon];
                                return IconComp ? (
                                  <IconComp
                                    size={14}
                                    className="text-slate-400"
                                  />
                                ) : null;
                              })()}
                              {icon}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Parent Menu
                    </Label>
                    <Select
                      value={formData.parentId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, parentId: v })
                      }
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold px-4">
                        <SelectValue placeholder="Root" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-60">
                        <SelectItem value="" className="font-semibold py-2">
                          None (Root)
                        </SelectItem>
                        {Array.isArray(dependencies.parentNavs) &&
                          dependencies.parentNavs
                            .filter((n: any) => n.id !== editingItem?.id)
                            .map((n) => (
                              <SelectItem
                                key={n.id}
                                value={n.id.toString()}
                                className="font-semibold py-2"
                              >
                                {n.title}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="sortOrder"
                    className="text-xs font-black uppercase tracking-wider text-slate-400"
                  >
                    Sort Order
                  </Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Visible for Roles
                  </Label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {[
                      "superadmin",
                      "admin",
                      "teacher",
                      "parent",
                      "student",
                    ].map((role) => (
                      <div key={role} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`role-${role}`}
                          checked={formData.roles?.includes(role)}
                          onChange={(e) => {
                            const newRoles = e.target.checked
                              ? [...(formData.roles || []), role]
                              : (formData.roles || []).filter(
                                  (r: string) => r !== role,
                                );
                            setFormData({ ...formData, roles: newRoles });
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600"
                        />
                        <label
                          htmlFor={`role-${role}`}
                          className="text-xs font-bold text-slate-600 capitalize"
                        >
                          {role}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "role-assignment" && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className={cn(
                      "text-xs font-black uppercase tracking-wider",
                      formErrors.username ? "text-red-500" : "text-slate-400",
                    )}
                  >
                    Username {formErrors.username && "*"}
                  </Label>
                  <Input
                    id="username"
                    placeholder="Enter unique username..."
                    className={cn(
                      "h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold",
                      formErrors.username &&
                        "border-red-500 ring-2 ring-red-500/10",
                    )}
                    value={formData.username || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      if (formErrors.username)
                        setFormErrors((prev) => ({ ...prev, username: false }));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className={cn(
                      "text-xs font-black uppercase tracking-wider",
                      formErrors.email ? "text-red-500" : "text-slate-400",
                    )}
                  >
                    Email Address {formErrors.email && "*"}
                  </Label>
                  <Input
                    id="email"
                    placeholder="Enter email address..."
                    className={cn(
                      "h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold",
                      formErrors.email &&
                        "border-red-500 ring-2 ring-red-500/10",
                    )}
                    value={formData.email || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email)
                        setFormErrors((prev) => ({ ...prev, email: false }));
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      System Role
                    </Label>
                    <Select
                      value={formData.role ? formData.role.toLowerCase().replace(/\s+/g, "") : "student"}
                      onValueChange={(v) => {
                        setFormData({ ...formData, role: v });
                      }}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold px-4">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-60 overflow-y-auto">
                        {Array.isArray(dependencies.roles) &&
                        dependencies.roles.length > 0 ? (
                          dependencies.roles.map((r: any) => {
                            const normalizedVal = r.name
                              .toLowerCase()
                              .replace(/\s+/g, "");
                            return (
                              <SelectItem
                                key={r.id}
                                value={normalizedVal}
                                className="font-semibold py-2"
                              >
                                {r.name}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <>
                            <SelectItem
                              value="superadmin"
                              className="font-semibold py-2"
                            >
                              SuperAdmin
                            </SelectItem>
                            <SelectItem
                              value="admin"
                              className="font-semibold py-2"
                            >
                              Admin
                            </SelectItem>
                            <SelectItem
                              value="teacher"
                              className="font-semibold py-2"
                            >
                              Teacher
                            </SelectItem>
                            <SelectItem
                              value="student"
                              className="font-semibold py-2"
                            >
                              Student
                            </SelectItem>
                            <SelectItem
                              value="parent"
                              className="font-semibold py-2"
                            >
                              Parent
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Assigned School
                    </Label>
                    <Select
                      value={formData.schoolId || ""}
                      onValueChange={(v) =>
                        setFormData({ ...formData, schoolId: v })
                      }
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold px-4">
                        <SelectValue placeholder="Global / Unassigned" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-60 overflow-y-auto">
                        <SelectItem
                          value=""
                          className="font-semibold py-2 text-slate-400 italic"
                        >
                          Global / Unassigned
                        </SelectItem>
                        {Array.isArray(dependencies.schools) &&
                          dependencies.schools.map((s: any) => (
                            <SelectItem
                              key={s.id}
                              value={s.id.toString()}
                              className="font-semibold py-2"
                            >
                              {s.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className={cn(
                        "text-xs font-black uppercase tracking-wider",
                        formErrors.password ? "text-red-500" : "text-slate-400",
                      )}
                    >
                      Password {formErrors.password && "*"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={editingItem ? "Leave blank" : "••••••••"}
                      className={cn(
                        "h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold",
                        formErrors.password &&
                          "border-red-500 ring-2 ring-red-500/10",
                      )}
                      value={formData.password || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (formErrors.password)
                          setFormErrors((prev) => ({
                            ...prev,
                            password: false,
                          }));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className={cn(
                        "text-xs font-black uppercase tracking-wider",
                        formErrors.confirmPassword
                          ? "text-red-500"
                          : "text-slate-400",
                      )}
                    >
                      Confirm Password {formErrors.confirmPassword && "*"}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={editingItem ? "Leave blank" : "••••••••"}
                      className={cn(
                        "h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold",
                        formErrors.confirmPassword &&
                          "border-red-500 ring-2 ring-red-500/10",
                      )}
                      value={formData.confirmPassword || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        });
                        if (formErrors.confirmPassword)
                          setFormErrors((prev) => ({
                            ...prev,
                            confirmPassword: false,
                          }));
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "schools" && (
              <>
                <div className="flex flex-col items-center gap-2 pb-4 border-b border-slate-50">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    School Logo / Branding
                  </Label>
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md ring-1 ring-slate-100 bg-slate-50 flex items-center justify-center transition-all group-hover:scale-[1.03]">
                      {localPhotoPreview || formData.profilePhotoPath ? (
                        <img
                          src={
                            localPhotoPreview ||
                            resolvePhotoUrl(formData.profilePhotoPath)
                          }
                          alt="Logo Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${formData.name}`;
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-300">
                          <School size={24} className="opacity-40" />
                          <span className="text-[9px] font-black tracking-wider uppercase text-slate-400">
                            NO LOGO
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-[1px]">
                        <Camera size={16} />
                        <span className="text-[8px] font-black uppercase tracking-widest">
                          Upload
                        </span>
                      </div>
                    </div>

                    {(localPhotoPreview || formData.profilePhotoPath) && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="shortName"
                      className="text-xs font-black uppercase tracking-wider text-slate-400"
                    >
                      Short Name / Code
                    </Label>
                    <Input
                      id="shortName"
                      placeholder="e.g. SXIB-01"
                      className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                      value={formData.shortName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, shortName: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="pincode"
                      className="text-xs font-black uppercase tracking-wider text-slate-400"
                    >
                      Pincode
                    </Label>
                    <Input
                      id="pincode"
                      placeholder="e.g. 400001"
                      className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                      value={formData.pincode || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pincode: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      State
                    </Label>
                    <Select
                      value={formData.stateId || ""}
                      onValueChange={(v) => {
                        const stateIdNum = parseInt(v);
                        const currentCity =
                          Array.isArray(dependencies.cities) &&
                          dependencies.cities.find(
                            (c) => c.id === parseInt(formData.cityId),
                          );
                        const cityBelongsToState =
                          currentCity && currentCity.stateId === stateIdNum;
                        setFormData({
                          ...formData,
                          stateId: v,
                          cityId: cityBelongsToState ? formData.cityId : "",
                        });
                      }}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold px-4">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-48 overflow-y-auto">
                        <SelectItem
                          value=""
                          className="font-semibold py-2 text-slate-400 italic"
                        >
                          Select State
                        </SelectItem>
                        {Array.isArray(dependencies.states) &&
                          dependencies.states.map((s: any) => (
                            <SelectItem
                              key={s.id}
                              value={s.id.toString()}
                              className="font-semibold py-2"
                            >
                              {s.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      City
                    </Label>
                    <Select
                      value={formData.cityId || ""}
                      onValueChange={(v) =>
                        setFormData({ ...formData, cityId: v })
                      }
                      disabled={!formData.stateId}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold px-4 disabled:opacity-50">
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-48 overflow-y-auto">
                        <SelectItem
                          value=""
                          className="font-semibold py-2 text-slate-400 italic"
                        >
                          Select City
                        </SelectItem>
                        {Array.isArray(dependencies.cities) &&
                          dependencies.cities
                            .filter(
                              (c: any) =>
                                c.stateId === parseInt(formData.stateId),
                            )
                            .map((ct: any) => (
                              <SelectItem
                                key={ct.id}
                                value={ct.id.toString()}
                                className="font-semibold py-2"
                              >
                                {ct.name}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="address"
                    className={cn(
                      "text-xs font-black uppercase tracking-wider",
                      formErrors.address ? "text-red-500" : "text-slate-400",
                    )}
                  >
                    Institutional Address {formErrors.address && "*"}
                  </Label>
                  <Input
                    id="address"
                    placeholder="Enter full address..."
                    className={cn(
                      "h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold",
                      formErrors.address &&
                        "border-red-500 ring-2 ring-red-500/10",
                    )}
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (formErrors.address)
                        setFormErrors((prev) => ({ ...prev, address: false }));
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-xs font-black uppercase tracking-wider text-slate-400"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="Office Phone"
                      className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-xs font-black uppercase tracking-wider text-slate-400"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      placeholder="office@school.com"
                      className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="websiteUrl"
                    className="text-xs font-black uppercase tracking-wider text-slate-400"
                  >
                    Website URL
                  </Label>
                  <Input
                    id="websiteUrl"
                    placeholder="https://www.school.com"
                    className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                    value={formData.websiteUrl || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, websiteUrl: e.target.value })
                    }
                  />
                </div>

                {/* SMS & WhatsApp Support configurations */}
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-[11px] font-black text-slate-900 tracking-wider uppercase border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <div className="w-1.5 h-3 bg-blue-500 rounded-full"></div>
                    SMS & WhatsApp Gateway Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="smsLimit"
                        className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                      >
                        SMS Limit
                      </Label>
                      <Input
                        id="smsLimit"
                        type="number"
                        placeholder="e.g. 5000"
                        className="h-10 bg-white rounded-xl border-slate-200 font-bold"
                        value={formData.smsLimit || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, smsLimit: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="smsSenderID"
                        className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                      >
                        SMS Sender ID
                      </Label>
                      <Input
                        id="smsSenderID"
                        placeholder="e.g. SCNID"
                        className="h-10 bg-white rounded-xl border-slate-200 font-bold"
                        value={formData.smsSenderID || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            smsSenderID: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enableSMS"
                        checked={!!formData.enableSMS}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enableSMS: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="enableSMS"
                        className="text-slate-600 cursor-pointer"
                      >
                        Enable Core SMS
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enablePresenteeSMS"
                        checked={!!formData.enablePresenteeSMS}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enablePresenteeSMS: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="enablePresenteeSMS"
                        className="text-slate-600 cursor-pointer"
                      >
                        Attendance SMS
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="automaticBirthdaySMS"
                        checked={!!formData.automaticBirthdaySMS}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            automaticBirthdaySMS: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="automaticBirthdaySMS"
                        className="text-slate-600 cursor-pointer"
                      >
                        Birthday Greetings
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enableWhatsapp"
                        checked={!!formData.enableWhatsapp}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enableWhatsapp: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="enableWhatsapp"
                        className="text-slate-600 cursor-pointer"
                      >
                        WhatsApp API
                      </label>
                    </div>
                  </div>
                </div>

                {/* Transit & Helpline support */}
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-[11px] font-black text-slate-900 tracking-wider uppercase border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <div className="w-1.5 h-3 bg-indigo-500 rounded-full"></div>
                    Transit & Administrative Helpdesks
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="scanIDContact"
                        className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                      >
                        SCANiD Helpline
                      </Label>
                      <Input
                        id="scanIDContact"
                        placeholder="Helpline Contact"
                        className="h-10 bg-white rounded-xl border-slate-200 font-bold"
                        value={formData.scanIDContact || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            scanIDContact: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 12),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="scanIDEmail"
                        className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                      >
                        SCANiD Email
                      </Label>
                      <Input
                        id="scanIDEmail"
                        placeholder="Support Email"
                        className="h-10 bg-white rounded-xl border-slate-200 font-bold"
                        value={formData.scanIDEmail || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            scanIDEmail: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <Label
                        htmlFor="inChargeContact"
                        className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                      >
                        School In-Charge Contact
                      </Label>
                      <Input
                        id="inChargeContact"
                        placeholder="School Administrator/In-Charge Contact"
                        className="h-10 bg-white rounded-xl border-slate-200 font-bold"
                        value={formData.inChargeContact || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            inChargeContact: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 12),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="busNumbers"
                      className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                    >
                      Institutional Bus Fleet Numbers
                    </Label>
                    <textarea
                      id="busNumbers"
                      placeholder="e.g. Bus 1: MH-12-DT-2541, Bus 2: MH-12-AP-6512"
                      className="w-full text-xs font-bold rounded-xl border border-slate-200 p-3 min-h-[60px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={formData.busNumbers || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, busNumbers: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* status / license configuration */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    System Status
                  </Label>
                  <Select
                    value={formData.status || "Active"}
                    onValueChange={(v) =>
                      setFormData({ ...formData, status: v })
                    }
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold px-4">
                      <SelectValue placeholder="System Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                      <SelectItem value="Active" className="font-semibold py-2">
                        Active
                      </SelectItem>
                      <SelectItem
                        value="Suspended"
                        className="font-semibold py-2 text-red-500"
                      >
                        Suspended
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {activeTab === "academic-years" && (
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <input
                  type="checkbox"
                  id="isCurrent"
                  className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.isCurrent}
                  onChange={(e) =>
                    setFormData({ ...formData, isCurrent: e.target.checked })
                  }
                />
                <Label
                  htmlFor="isCurrent"
                  className="font-bold text-slate-700 cursor-pointer select-none"
                >
                  Set as Current Academic Year
                </Label>
              </div>
            )}

            {activeTab === "houses" && (
              <div className="space-y-2">
                <Label
                  htmlFor="color"
                  className="text-xs font-black uppercase tracking-wider text-slate-400"
                >
                  House Color
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="color"
                    type="color"
                    className="h-12 w-16 p-1 rounded-xl cursor-pointer"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                  />
                  <Input
                    placeholder="#HEX Code"
                    className="h-12 flex-1 rounded-xl font-mono uppercase font-bold"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {activeTab === "sub-castes" && (
              <div className="space-y-2">
                <Label
                  className={cn(
                    "text-xs font-black uppercase tracking-wider",
                    formErrors.casteId ? "text-red-500" : "text-slate-400",
                  )}
                >
                  Parent Caste {formErrors.casteId && "*"}
                </Label>
                <Select
                  value={formData.casteId}
                  onValueChange={(v) => {
                    setFormData({ ...formData, casteId: v });
                    if (formErrors.casteId)
                      setFormErrors((prev) => ({ ...prev, casteId: false }));
                  }}
                >
                  <SelectTrigger
                    ref={(el) => {
                      inputRefs.current["casteId"] = el;
                    }}
                    className={cn(
                      "h-12 rounded-xl border-slate-200 bg-white font-bold px-4",
                      formErrors.casteId &&
                        "border-red-500 ring-2 ring-red-500/10",
                    )}
                  >
                    <SelectValue placeholder="Select Parent Caste" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem
                      value=""
                      className="font-semibold py-2 text-slate-400 italic"
                    >
                      Select Parent Caste
                    </SelectItem>
                    {Array.isArray(dependencies.castes) &&
                      dependencies.castes.map((c) => (
                        <SelectItem
                          key={c.id}
                          value={c.id.toString()}
                          className="font-semibold py-2"
                        >
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeTab === "cities" && (
              <div className="space-y-2">
                <Label
                  className={cn(
                    "text-xs font-black uppercase tracking-wider",
                    formErrors.stateId ? "text-red-500" : "text-slate-400",
                  )}
                >
                  State {formErrors.stateId && "*"}
                </Label>
                <Select
                  value={formData.stateId}
                  onValueChange={(v) => {
                    setFormData({ ...formData, stateId: v });
                    if (formErrors.stateId)
                      setFormErrors((prev) => ({ ...prev, stateId: false }));
                  }}
                >
                  <SelectTrigger
                    ref={(el) => {
                      inputRefs.current["stateId"] = el;
                    }}
                    className={cn(
                      "h-12 rounded-xl border-slate-200 bg-white font-bold px-4",
                      formErrors.stateId &&
                        "border-red-500 ring-2 ring-red-500/10",
                    )}
                  >
                    <SelectValue placeholder="Select State Name" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem
                      value=""
                      className="font-semibold py-2 text-slate-400 italic"
                    >
                      Select State Name
                    </SelectItem>
                    {Array.isArray(dependencies.states) &&
                      dependencies.states.map((s) => (
                        <SelectItem
                          key={s.id}
                          value={s.id.toString()}
                          className="font-semibold py-2"
                        >
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-xs font-black uppercase tracking-wider text-slate-400"
              >
                Additional Description
              </Label>
              <Input
                id="description"
                placeholder="Optional details"
                className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <input
                type="checkbox"
                id="isActive"
                className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
              />
              <Label
                htmlFor="isActive"
                className="font-bold text-slate-700 cursor-pointer select-none"
              >
                Active Status
              </Label>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 bg-slate-50/50 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 rounded-xl h-12 font-bold border-slate-200 hover:bg-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 rounded-xl h-12 font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
            >
              {editingItem ? "Update Master" : "Create Master"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
