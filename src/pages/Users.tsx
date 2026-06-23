import { useState, useEffect, useCallback } from "react";
import { 
  Users as UsersIcon, 
  UserPlus, 
  Search, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Shield, 
  Mail, 
  Phone, 
  MoreHorizontal,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown
} from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { apiService } from "@/lib/api";
import { User, RoleDescriptor } from "@/types";
import { toast } from "sonner";
import { cn, parseSafeInt } from "@/lib/utils";
import { SimpleTooltip } from "@/components/shared/SimpleTooltip";

export default function Users({ user }: { user: any }) {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleDescriptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [schools, setSchools] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    role: "student",
    isActive: true,
    password: "",
    confirmPassword: "",
    schoolId: "",
    academicYearId: ""
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Map selected string-based role (e.g., 'superadmin') to numeric ID for backend API integration
      let apiRoleId: any = undefined;
      if (selectedRole !== "all") {
        const isNumeric = /^\d+$/.test(selectedRole);
        if (isNumeric) {
          apiRoleId = parseInt(selectedRole);
        } else {
          // Hardcoded role ID mapping for robust fallback
          if (selectedRole === "superadmin") apiRoleId = 1;
          else if (selectedRole === "admin") apiRoleId = 2;
          else if (selectedRole === "teacher") apiRoleId = 3;
          else if (selectedRole === "student") apiRoleId = 4;
          else if (selectedRole === "parent") apiRoleId = 5;
        }
      }

      const [usersRes, rolesRes] = await Promise.all([
        apiService.getUsers({
          page,
          pageSize,
          sortBy,
          sortOrder,
          search: searchQuery,
          roleId: apiRoleId
        }),
        apiService.getRoles()
      ]);
      
      const resData = usersRes.data;
      const rawUsersList = Array.isArray(resData) 
        ? resData 
        : (resData && Array.isArray(resData.data) ? resData.data : []);
      
      const isServerPaged = resData && !!resData.pagination;
      
      if (!isServerPaged) {
        // Robust client-side filters, search, sorting and pagination
        let filtered = [...rawUsersList];
        
        // Search Filter
        const searchLower = searchQuery.trim().toLowerCase();
        if (searchLower) {
          filtered = filtered.filter(item => 
            (item.fullName || "").toLowerCase().includes(searchLower) ||
            (item.username || "").toLowerCase().includes(searchLower) ||
            (item.email || "").toLowerCase().includes(searchLower) ||
            (item.role || "").toLowerCase().includes(searchLower)
          );
        }
        
        // Selected Role Filter
        if (selectedRole !== "all") {
          filtered = filtered.filter(item => {
            const roleIdVal = item.roleId?.toString() || "";
            const roleNameVal = item.role?.toString().toLowerCase().replace(/\s+/g, "") || "";
            
            // Map selectedRole string to its numeric ID for matching if the item uses numeric role ID
            let targetRoleId = "";
            if (selectedRole === "superadmin") targetRoleId = "1";
            else if (selectedRole === "admin") targetRoleId = "2";
            else if (selectedRole === "teacher") targetRoleId = "3";
            else if (selectedRole === "student") targetRoleId = "4";
            else if (selectedRole === "parent") targetRoleId = "5";

            return roleIdVal === selectedRole || roleNameVal === selectedRole || (targetRoleId && roleIdVal === targetRoleId);
          });
        }
        
        // Sorting
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
        
        // Pagination
        const total = filtered.length;
        setTotalCount(total);
        setTotalPages(Math.ceil(total / pageSize));
        
        const startIndex = (page - 1) * pageSize;
        setUsers(filtered.slice(startIndex, startIndex + pageSize));
      } else {
        // Server-side loaded correctly
        setTotalCount(resData.pagination.totalCount);
        setTotalPages(resData.pagination.totalPages);
        setUsers(rawUsersList);
      }
      
      setRoles(rolesRes.data.data || rolesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load registry data");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, searchQuery, selectedRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    apiService.getSchools()
      .then(res => {
        const schoolData = res.data && Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.data) ? res.data.data : []);
        setSchools(schoolData);
      })
      .catch(err => console.error("Error fetching schools in Users page:", err));

    apiService.getAcademicYears()
      .then(res => {
        const ayData = res.data && Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.data) ? res.data.data : []);
        setAcademicYears(ayData);
      })
      .catch(err => console.error("Error fetching academic years in Users page:", err));
  }, []);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleOpenDialog = (userItem: User | null = null) => {
    setEditingUser(userItem);
    setFormErrors({});
    if (userItem) {
      // Normalize role string to lowercase with spaces stripped to match Select dropdown item option values
      const normalizedRole = userItem.role ? userItem.role.toLowerCase().replace(/\s+/g, '') : "";
      setFormData({
        name: userItem.name || "",
        email: userItem.email || "",
        username: userItem.username || "",
        role: normalizedRole,
        isActive: userItem.isActive !== false,
        password: "",
        confirmPassword: "",
        schoolId: (userItem.schoolId && userItem.schoolId !== "0") ? userItem.schoolId.toString() : "",
        academicYearId: userItem.academicYearId ? userItem.academicYearId.toString() : ""
      });
    } else {
      setFormData({
        name: "",
        email: "",
        username: "",
        role: "",
        isActive: true,
        password: "",
        confirmPassword: "",
        schoolId: "",
        academicYearId: ""
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const newErrors: Record<string, boolean> = {};
    let firstErrorField = "";

    const checkField = (field: string, condition: boolean) => {
      if (condition) {
        newErrors[field] = true;
        if (!firstErrorField) firstErrorField = field;
      }
    };

    const nameTrimmed = formData.name?.trim() || "";
    checkField("name", !nameTrimmed);

    const usernameTrimmed = formData.username?.trim() || "";
    const isInvalidUsername = !usernameTrimmed || usernameTrimmed.length < 3 || /\s/.test(usernameTrimmed);
    checkField("username", isInvalidUsername);

    checkField("role", !formData.role);
    checkField("schoolId", !formData.schoolId);
    checkField("academicYearId", !formData.academicYearId);

    // Email format validation if entered
    const emailTrimmed = formData.email?.trim() || "";
    let isInvalidEmail = false;
    if (emailTrimmed !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isInvalidEmail = !emailRegex.test(emailTrimmed);
      checkField("email", isInvalidEmail);
    }

    // Passwords required check for NEW users
    const isNewUser = !editingUser;
    const passwordTrimmed = formData.password || "";
    const confirmPasswordTrimmed = formData.confirmPassword || "";
    if (isNewUser) {
      checkField("password", !passwordTrimmed);
      checkField("confirmPassword", !confirmPasswordTrimmed);
    }

    // Password and confirm password mismatch
    const isMismatch = (formData.password !== "" || formData.confirmPassword !== "") && formData.password !== formData.confirmPassword;
    
    if (isMismatch) {
      checkField("password", true);
      checkField("confirmPassword", true);
    }

    setFormErrors(newErrors);

    if (firstErrorField) {
      if (firstErrorField === "name") {
        toast.error("Please enter a valid display name.");
      } else if (firstErrorField === "username" && !usernameTrimmed) {
        toast.error("Username is mandatory.");
      } else if (firstErrorField === "username" && usernameTrimmed.length < 3) {
        toast.error("Username must be at least 3 characters long.");
      } else if (firstErrorField === "username" && /\s/.test(usernameTrimmed)) {
        toast.error("Username cannot contain spaces.");
      } else if (firstErrorField === "role") {
        toast.error("Please select a System Role.");
      } else if (firstErrorField === "schoolId") {
        toast.error("Please select an Assigned School Branch.");
      } else if (firstErrorField === "academicYearId") {
        toast.error("Please select an Academic Year.");
      } else if (firstErrorField === "email" && isInvalidEmail) {
        toast.error("Please enter a valid email address.");
      } else if (firstErrorField === "password" && isNewUser && !passwordTrimmed) {
        toast.error("Password is required for new users.");
      } else if (firstErrorField === "confirmPassword" && isNewUser && !confirmPasswordTrimmed) {
        toast.error("Please confirm your password.");
      } else if (isMismatch) {
        toast.error("Passwords do not match.");
      } else {
        toast.error("Please fill all required fields correctly.");
      }
      return;
    }

    if (isMismatch) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      // Find matching role descriptor dynamically from database roles or fall back gracefully
      let matchedRole = Array.isArray(roles) ? roles.find(r => r.name.toLowerCase().replace(/\s+/g, '') === formData.role.toLowerCase().replace(/\s+/g, '')) : null;
      let roleId = matchedRole ? parseInt(matchedRole.id?.toString()) : undefined;
      let roleName = matchedRole ? matchedRole.name : formData.role;

      // Robust fallback role credentials matching
      if (!roleId) {
        if (formData.role === "superadmin") { roleId = 1; roleName = "SuperAdmin"; }
        else if (formData.role === "admin") { roleId = 2; roleName = "Admin"; }
        else if (formData.role === "teacher") { roleId = 3; roleName = "Teacher"; }
        else if (formData.role === "student") { roleId = 4; roleName = "Student"; }
        else if (formData.role === "parent") { roleId = 5; roleName = "Parent"; }
      }

      // Prepare standard data payload matching C# model properties
      const payload = {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        role: roleName,
        roleId: roleId,
        isActive: formData.isActive,
        passwordHash: formData.password || undefined,
        PasswordHash: formData.password || undefined, // Support both casings
        schoolId: formData.schoolId ? parseInt(formData.schoolId) : null,
        academicYearId: formData.academicYearId ? parseInt(formData.academicYearId) : null,
        // Audit fields: Ensure CreatedBy and ModifiedBy are captured for backend audit logging
        CreatedBy: editingUser ? undefined : (user.name || user.email),
        ModifiedBy: user.name || user.email
      };

      if (editingUser) {
        const userId = parseSafeInt(editingUser.id);
        if (userId === undefined) {
          toast.error("Invalid user ID for update");
          return;
        }
        await apiService.updateUser(userId, { ...payload, id: userId });
        toast.success("User updated successfully");
      } else {
        await apiService.createUser(payload);
        toast.success("User created successfully");
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to save user");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const userId = parseSafeInt(id);
      if (userId === undefined) {
        toast.error("Invalid user ID for deletion");
        return;
      }
      await apiService.deleteUser(userId);
      toast.success("User deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const filteredUsers = users;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin': return <Badge className="bg-purple-600">Super Admin</Badge>;
      case 'admin': return <Badge className="bg-blue-600">Admin</Badge>;
      case 'teacher': return <Badge className="bg-emerald-600">Teacher</Badge>;
      default: return <Badge variant="outline" className="capitalize">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="text-blue-600" size={28} /> User Access Management
          </h1>
          <p className="text-slate-500 font-medium">Control system access and assign roles</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <Button 
                variant={viewMode === "table" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("table")}
                className="rounded-lg h-8 px-3"
            >
                <List size={16} />
            </Button>
            <Button 
                variant={viewMode === "grid" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("grid")}
                className="rounded-lg h-8 px-3"
            >
                <LayoutGrid size={16} />
            </Button>
          </div>
          <Button 
            onClick={() => handleOpenDialog()}
            className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 h-10 shadow-lg shadow-blue-200"
          >
            <UserPlus size={18} className="mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input 
                        placeholder="Search users..." 
                        className="pl-11 h-11 bg-white rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="h-11 w-full sm:w-40 rounded-2xl bg-white border-slate-200 font-bold text-slate-600">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-xl border-slate-100">
                            <SelectItem value="all">All Roles</SelectItem>
                            {Array.isArray(roles) && roles.map(role => (
                                <SelectItem key={role.id} value={role.name.toLowerCase().replace(' ', '')}>{role.name}</SelectItem>
                            ))}
                            {(!Array.isArray(roles) || roles.length === 0) && (
                                <>
                                    <SelectItem value="superadmin">Super Admin</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                </>
                            )}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchData} className="h-11 w-11 rounded-2xl border-slate-200">
                        <RefreshCw size={18} className={cn(loading && "animate-spin")} />
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            {viewMode === "table" ? (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-slate-100 h-14 bg-slate-50/30">
                                <TableHead className="pl-6 w-12"></TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">
                                        User Identity
                                        {sortBy === 'name' ? (sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
                                    </div>
                                </TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('username')}>
                                    <div className="flex items-center gap-1">
                                        Username
                                        {sortBy === 'username' ? (sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
                                    </div>
                                </TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('role')}>
                                    <div className="flex items-center gap-1">
                                        System Role
                                        {sortBy === 'role' ? (sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
                                    </div>
                                </TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned School</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                                <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-slate-50 h-20">
                                        <TableCell colSpan={7} className="px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-slate-100 rounded-full" />
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 bg-slate-100 rounded" />
                                                    <div className="h-3 w-24 bg-slate-50 rounded" />
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (!Array.isArray(filteredUsers) || filteredUsers.length === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <UsersIcon size={48} className="text-slate-200" />
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No users found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                Array.isArray(filteredUsers) && filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-blue-50/10 border-slate-50 h-20 group">
                                        <TableCell className="pl-6">
                                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || user.username || "User"}`} />
                                                <AvatarFallback className="bg-slate-900 text-white text-[10px] font-bold">
                                                    {(user.name || user.username || "U").split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{user.name || user.username || "Unnamed User"}</p>
                                                <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs font-bold text-slate-600">{user.username}</TableCell>
                                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                                        <TableCell>
                                            <span className="text-xs font-bold text-slate-600 bg-slate-100/50 px-2.5 py-1.5 rounded-xl border border-slate-200/50">
                                                {schools.find(s => s.id?.toString() === user.schoolId?.toString())?.name || "Global / Unassigned"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive !== false ? "outline" : "secondary"} className={cn("rounded-lg text-[9px] font-black uppercase tracking-widest", user.isActive !== false ? "text-emerald-600 border-emerald-100 bg-emerald-50" : "text-slate-400")}>
                                                {user.isActive !== false ? "Active" : "Disabled"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600">
                                                        <MoreHorizontal size={18} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-2xl shadow-xl border-slate-100 p-2">
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(user)} className="rounded-xl py-2.5 font-bold text-xs uppercase tracking-widest cursor-pointer">
                                                        <Edit3 size={14} className="mr-3" /> Edit Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(user.id)} className="rounded-xl py-2.5 font-bold text-xs uppercase tracking-widest text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                                                        <Trash2 size={14} className="mr-3" /> Remove User
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
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                    {loading ? (
                        [...Array(8)].map((_, i) => (
                            <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-3xl" />
                        ))
                    ) : (
                        Array.isArray(filteredUsers) && filteredUsers.map(user => (
                            <Card key={user.id} className="border-none shadow-sm rounded-3xl bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group overflow-hidden border-2 border-transparent hover:border-blue-100">
                                <CardContent className="p-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative mb-4">
                                            <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || user.username || "User"}`} />
                                                <AvatarFallback className="bg-slate-900 text-white text-lg font-black">
                                                    {(user.name || user.username || "U").split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                <div className={cn("h-3 w-3 rounded-full", user.isActive !== false ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                                            </div>
                                        </div>
                                        <h3 className="font-black text-slate-900 truncate w-full px-2">{user.name || user.username || "Unnamed User"}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{user.role}</p>
                                        
                                        <div className="space-y-2 w-full mb-6">
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white/50 p-2 rounded-xl border border-slate-100/50">
                                                <Mail size={14} className="text-slate-400" />
                                                <span className="truncate">{user.email || "No email"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white/50 p-2 rounded-xl border border-slate-100/50">
                                                <UsersIcon size={14} className="text-slate-400" />
                                                <span className="truncate">@{user.username}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white/50 p-2 rounded-xl border border-slate-100/50 animate-in fade-in">
                                                <Shield size={14} className="text-slate-400" />
                                                <span className="truncate">{schools.find(s => s.id?.toString() === user.schoolId?.toString())?.name || "Global / Unassigned"}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 w-full">
                                            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(user)} className="flex-1 rounded-xl h-9 font-bold text-xs uppercase tracking-widest text-slate-600 bg-white">
                                                Edit
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} className="rounded-xl h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50">
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Pagination Footer */}
            {!loading && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 bg-slate-50/50 border-t border-slate-100 gap-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Showing <span className="text-slate-900 font-black">{users.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to <span className="text-slate-900 font-black">{Math.min(page * pageSize, totalCount)}</span> of <span className="text-slate-900 font-black">{totalCount}</span> entries
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows per page</span>
                    <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setPage(1); }}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden max-w-md">
            <div className="bg-slate-900 p-8 text-white">
                <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                    {editingUser ? <Edit3 size={24} /> : <UserPlus size={24} />}
                    {editingUser ? "Edit User Account" : "Register New User"}
                </DialogTitle>
                <DialogDescription className="text-slate-400 font-medium pt-1">
                    Manage system access credentials and role assignment.
                </DialogDescription>
            </div>

            <div className="p-8 space-y-5">
                <div className="space-y-2">
                    <Label className={cn("text-[10px] font-black uppercase tracking-widest", formErrors.name ? "text-red-500" : "text-slate-400")}>
                        Full Display Name <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input 
                        placeholder="e.g. John Doe"
                        className={cn(
                            "h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all font-bold",
                            formErrors.name && "border-red-500 ring-2 ring-red-500/10"
                        )}
                        value={formData.name}
                        onChange={(e) => {
                            setFormData({...formData, name: e.target.value});
                            if (formErrors.name) setFormErrors(prev => ({ ...prev, name: false }));
                        }}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className={cn("text-[10px] font-black uppercase tracking-widest", formErrors.username ? "text-red-500" : "text-slate-400")}>
                            Username <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Input 
                            placeholder="jdoe"
                            className={cn(
                                "h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all font-bold",
                                formErrors.username && "border-red-500 ring-2 ring-red-500/10"
                            )}
                            value={formData.username}
                            onChange={(e) => {
                                setFormData({...formData, username: e.target.value});
                                if (formErrors.username) setFormErrors(prev => ({ ...prev, username: false }));
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-1", formErrors.role ? "text-red-500" : "text-slate-400")}>
                            System Role <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Select value={formData.role} onValueChange={(v) => {
                            setFormData({...formData, role: v});
                            if (formErrors.role) setFormErrors(prev => ({ ...prev, role: false }));
                        }}>
                            <SelectTrigger className={cn("h-12 rounded-xl bg-slate-50 border-slate-100 font-bold", formErrors.role && "border-red-500 ring-2 ring-red-500/10")}>
                                <SelectValue placeholder="Select System Role">
                                    {formData.role ? (
                                        formData.role === "superadmin" ? "Super Admin" :
                                        formData.role === "admin" ? "Admin" :
                                        formData.role === "teacher" ? "Teacher" :
                                        formData.role === "student" ? "Student" :
                                        formData.role === "parent" ? "Parent" :
                                        formData.role
                                    ) : undefined}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl">
                                <SelectItem value="" className="italic text-slate-400">Select System Role</SelectItem>
                                <SelectItem value="superadmin">Super Admin</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label className={cn("text-[10px] font-black uppercase tracking-widest", formErrors.email ? "text-red-500" : "text-slate-400")}>Email Contact</Label>
                    <Input 
                        placeholder="john@example.com"
                        className={cn(
                            "h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all font-bold",
                            formErrors.email && "border-red-500 ring-2 ring-red-500/10"
                        )}
                        value={formData.email}
                        onChange={(e) => {
                            setFormData({...formData, email: e.target.value});
                            if (formErrors.email) setFormErrors(prev => ({ ...prev, email: false }));
                        }}
                    />
                </div>
                
                {/* School dropdown */}
                <div className="space-y-2">
                    <Label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-1", formErrors.schoolId ? "text-red-500" : "text-slate-400")}>
                        Assigned School Branch <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select value={formData.schoolId} onValueChange={(v) => {
                        setFormData({...formData, schoolId: v});
                        if (formErrors.schoolId) setFormErrors(prev => ({ ...prev, schoolId: false }));
                    }}>
                        <SelectTrigger className={cn("h-12 rounded-xl bg-slate-50 border-slate-100 font-bold", formErrors.schoolId && "border-red-500 ring-2 ring-red-500/10")}>
                            <SelectValue placeholder="Select School Branch">
                                {formData.schoolId ? (schools.find(s => s.id.toString() === formData.schoolId)?.name || formData.schoolId) : undefined}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl max-h-60">
                            <SelectItem value="" className="italic text-slate-400">Select School Branch</SelectItem>
                            {Array.isArray(schools) && schools.map((s) => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
 
                {/* Academic Year dropdown */}
                <div className="space-y-2">
                    <Label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-1", formErrors.academicYearId ? "text-red-500" : "text-slate-400")}>
                        Academic Year <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select value={formData.academicYearId} onValueChange={(v) => {
                        setFormData({...formData, academicYearId: v});
                        if (formErrors.academicYearId) setFormErrors(prev => ({ ...prev, academicYearId: false }));
                    }}>
                        <SelectTrigger className={cn("h-12 rounded-xl bg-slate-50 border-slate-100 font-bold", formErrors.academicYearId && "border-red-500 ring-2 ring-red-500/10")}>
                            <SelectValue placeholder="Select Academic Year">
                                {formData.academicYearId ? (academicYears.find(ay => ay.id.toString() === formData.academicYearId)?.name || formData.academicYearId) : undefined}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl max-h-60">
                            <SelectItem value="" className="italic text-slate-400">Select Academic Year</SelectItem>
                            {Array.isArray(academicYears) && academicYears.map((ay) => (
                                <SelectItem key={ay.id} value={ay.id.toString()}>
                                    {ay.name} {ay.isCurrent && " (Current)"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
 
                {/* Password and Confirm Password fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-1", formErrors.password ? "text-red-500" : "text-slate-400")}>
                            Password {!editingUser && <span className="text-red-500 font-bold">*</span>} {editingUser && "(Optional)"}
                        </Label>
                        <Input 
                            type="password"
                            placeholder={editingUser ? "Leave blank" : "••••••••"}
                            className={cn(
                                "h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all font-bold",
                                formErrors.password && "border-red-500 ring-2 ring-red-500/10"
                            )}
                            value={formData.password}
                            onChange={(e) => {
                                setFormData({...formData, password: e.target.value});
                                if (formErrors.password) setFormErrors(prev => ({ ...prev, password: false, confirmPassword: false }));
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-1", formErrors.confirmPassword ? "text-red-500" : "text-slate-400")}>
                            Confirm Password {!editingUser && <span className="text-red-500 font-bold">*</span>} {editingUser && "(Optional)"}
                        </Label>
                        <Input 
                            type="password"
                            placeholder={editingUser ? "Leave blank" : "••••••••"}
                            className={cn(
                                "h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all font-bold",
                                formErrors.confirmPassword && "border-red-500 ring-2 ring-red-500/10"
                            )}
                            value={formData.confirmPassword}
                            onChange={(e) => {
                                setFormData({...formData, confirmPassword: e.target.value});
                                if (formErrors.confirmPassword) setFormErrors(prev => ({ ...prev, password: false, confirmPassword: false }));
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <input 
                        type="checkbox" 
                        id="userIsActive"
                        className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    />
                    <Label htmlFor="userIsActive" className="font-bold text-slate-700 cursor-pointer select-none">Account Active Status</Label>
                </div>
            </div>

            <DialogFooter className="p-8 pt-0 flex gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 rounded-xl h-12 font-bold border-slate-200">
                    Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1 rounded-xl h-12 font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200">
                    {editingUser ? "Save Changes" : "Create Account"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
