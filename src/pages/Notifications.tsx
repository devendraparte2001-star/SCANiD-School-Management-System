import { useState, useEffect } from "react";
import { 
  Bell, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  X,
  RefreshCw,
  Search,
  Filter,
  Plus
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiService } from "@/lib/api";
import { Notification } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface NotificationsProps {
  user?: any;
}

export default function Notifications({ user: propUser }: NotificationsProps = {}) {
  const [currentUser, setCurrentUser] = useState<any>(propUser || null);

  useEffect(() => {
    if (!currentUser) {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Error parsing user from localStorage in Notifications:", e);
        }
      }
    }
  }, [currentUser, propUser]);

  const userRole = currentUser?.role?.toLowerCase() || "";
  const isAdmin = userRole === "superadmin" || userRole === "admin";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  
  // States for creating a notification
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState<"info" | "success" | "warning" | "error">("info");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("all");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await apiService.getUsers();
      const rawUsers = response.data?.data || response.data || [];
      setUsers(Array.isArray(rawUsers) ? rawUsers : []);
    } catch (error) {
      console.error("Error fetching users in Notifications center:", error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      // If NOT an admin/superadmin, apply strict filtering to current user's scopes
      if (!isAdmin && currentUser) {
        if (currentUser.id) params.userId = parseInt(currentUser.id) || undefined;
        if (currentUser.roleId) params.roleId = currentUser.roleId;
        if (currentUser.schoolId && currentUser.schoolId !== "all") params.schoolId = parseInt(currentUser.schoolId) || undefined;
      }
      
      const response = await apiService.getNotifications(params);
      setNotifications(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await apiService.getSchools();
      setSchools(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching schools in Notification Center:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchSchools();
    fetchUsers();
  }, [currentUser]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error("Failed to update notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const params: any = {};
      if (!isAdmin && currentUser) {
        if (currentUser.id) params.userId = parseInt(currentUser.id) || undefined;
        if (currentUser.roleId) params.roleId = currentUser.roleId;
        if (currentUser.schoolId && currentUser.schoolId !== "all") params.schoolId = parseInt(currentUser.schoolId) || undefined;
      }
      await apiService.markAllNotificationsRead(params);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to update all notifications");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setCreating(true);
    try {
      const creatorName = currentUser?.name || currentUser?.username || currentUser?.email || "System";
      const academicYearValue = currentUser?.academicYearId ? parseInt(currentUser.academicYearId) : null;
      
      const payload = {
        title: newTitle.trim(),
        message: newMessage.trim(),
        type: newType,
        roleId: selectedRoleId === "all" ? null : parseInt(selectedRoleId),
        RoleId: selectedRoleId === "all" ? null : parseInt(selectedRoleId),
        schoolId: selectedSchoolId === "all" ? null : parseInt(selectedSchoolId),
        SchoolId: selectedSchoolId === "all" ? null : parseInt(selectedSchoolId),
        userId: selectedUserId === "all" ? null : parseInt(selectedUserId),
        UserId: selectedUserId === "all" ? null : parseInt(selectedUserId),
        isRead: false,
        IsRead: false,
        createdAt: new Date().toISOString(),
        CreatedAt: new Date().toISOString(),
        createdBy: creatorName,
        CreatedBy: creatorName,
        modifiedBy: creatorName,
        ModifiedBy: creatorName,
        academicYearId: academicYearValue,
        AcademicYearId: academicYearValue,
        isActive: true,
        IsActive: true,
        isDeleted: false,
        IsDeleted: false
      };

      await apiService.createNotification(payload);
      toast.success("Notification sent successfully!");
      setIsCreateModalOpen(false);
      
      // Reset form
      setNewTitle("");
      setNewMessage("");
      setNewType("info");
      setSelectedRoleId("all");
      setSelectedSchoolId("all");
      setSelectedUserId("all");
      
      // Refresh list
      fetchNotifications();
    } catch (error) {
      console.error("Failed to create notification:", error);
      toast.error("Failed to create notification.");
    } finally {
      setCreating(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={18} />;
      case 'error': return <X className="text-red-500" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || !n.isRead;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notification Center</h1>
          <p className="text-slate-500 font-medium">Manage your system alerts and messages</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              size="sm"
            >
              <Plus size={16} className="mr-1.5" />
              Add Notification
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchNotifications}
            className="rounded-xl font-bold border-slate-200"
          >
            <RefreshCw size={16} className={cn("mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAllAsRead}
            className="rounded-xl font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            disabled={!notifications.some(n => !n.isRead)}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-4">
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Filter size={16} /> Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button 
                variant={filter === "all" ? "default" : "ghost"} 
                className={cn("w-full justify-start rounded-xl font-bold", filter === "all" ? "bg-slate-900" : "text-slate-600")}
                onClick={() => setFilter("all")}
              >
                All Notifications
                <Badge className="ml-auto bg-slate-200 text-slate-700">{Array.isArray(notifications) ? notifications.length : 0}</Badge>
              </Button>
              <Button 
                variant={filter === "unread" ? "default" : "ghost"} 
                className={cn("w-full justify-start rounded-xl font-bold", filter === "unread" ? "bg-slate-900" : "text-slate-600")}
                onClick={() => setFilter("unread")}
              >
                Unread
                <Badge className="ml-auto bg-blue-100 text-blue-700">
                  {Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0}
                </Badge>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <Input 
              placeholder="Search notifications..." 
              className="pl-12 h-12 bg-white border-slate-200/60 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium rounded-2xl shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl" />
              ))
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Bell size={32} className="text-slate-300" />
                </div>
                <p className="text-lg font-bold text-slate-900">No notifications found</p>
                <p className="text-sm text-slate-500">You're all caught up or try adjusting your filters.</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={cn(
                    "border-none shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md",
                    !notification.isRead && "ring-1 ring-blue-100 bg-blue-50/10"
                  )}
                >
                  <CardContent className="p-5 flex gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center shadow-sm",
                      notification.type === 'warning' ? "bg-amber-100" :
                      notification.type === 'success' ? "bg-emerald-100" :
                      notification.type === 'error' ? "bg-red-100" : "bg-blue-100"
                    )}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className={cn("text-sm font-bold text-slate-900", !notification.isRead && "text-blue-900")}>
                            {notification.title}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            {format(new Date(notification.createdAt || Date.now()), 'MMM dd, yyyy • hh:mm a')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {!notification.isRead && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-50"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <CheckCircle2 size={16} />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                              onClick={() => handleDelete(notification.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Notification Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Add New Notification</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNotification} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Title *
                </label>
                <Input 
                  required
                  placeholder="e.g. Scheduled System Maintenance"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Alert Type
                  </label>
                  <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="success">Success (Green)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="error">Error (Red)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    School Scope
                  </label>
                  <select 
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                  >
                    <option value="all">All Schools (Global)</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name || s.Name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Recipient Role Scope
                  </label>
                  <select 
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="1">Super Admin</option>
                    <option value="2">Admin</option>
                    <option value="3">Teacher</option>
                    <option value="4">Student</option>
                    <option value="5">Parent</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Recipient User Scope
                  </label>
                  <select 
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                  >
                    <option value="all">All Users (Broadcast)</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.Name || u.username || u.Username} ({u.role || u.Role || "User"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Message Content *
                </label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Type the notification details here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full p-3 text-sm font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl font-bold border-slate-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={creating}
                  className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
                >
                  {creating ? "Sending..." : "Send Announcement"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
