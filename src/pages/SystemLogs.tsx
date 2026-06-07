import { useState, useEffect } from "react";
import { User, AuditLog, ErrorLog } from "@/types";
import { apiService } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, Trash2, Database, AlertCircle, History, Copy, Check, ChevronRight, Home, Terminal, ChevronLeft, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { Link, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SystemLogsProps {
  user: User;
}

export default function SystemLogs({ user }: SystemLogsProps) {
  // INTERNAL RBAC CHECK: Secondary layer of protection for superadmin-only page
  if (user.role !== "superadmin") {
    return <Navigate to="/" replace />;
  }

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);
  const [auditSortBy, setAuditSortBy] = useState("timestamp");
  const [auditSortOrder, setAuditSortOrder] = useState<"asc" | "desc">("desc");
  const [auditTotalCount, setAuditTotalCount] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(0);

  const [errorPage, setErrorPage] = useState(1);
  const [errorPageSize, setErrorPageSize] = useState(10);
  const [errorSortBy, setErrorSortBy] = useState("timestamp");
  const [errorSortOrder, setErrorSortOrder] = useState<"asc" | "desc">("desc");
  const [errorTotalCount, setErrorTotalCount] = useState(0);
  const [errorTotalPages, setErrorTotalPages] = useState(0);

  const [appLogs, setAppLogs] = useState<string>("");
  const [dbScript, setDbScript] = useState<string>("");
  const [seedScript, setSeedScript] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [seedCopied, setSeedCopied] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Use Promise.allSettled to ensure one failing endpoint doesn't block the whole page
      const results = await Promise.allSettled([
        apiService.getAuditLogs({
          page: auditPage,
          pageSize: auditPageSize,
          sortBy: auditSortBy,
          sortOrder: auditSortOrder,
          schoolId: user.schoolId,
          academicYearId: user.academicYearId
        }),
        apiService.getErrorLogs({
          page: errorPage,
          pageSize: errorPageSize,
          sortBy: errorSortBy,
          sortOrder: errorSortOrder,
          schoolId: user.schoolId,
          academicYearId: user.academicYearId
        }),
        apiService.getDbScript(),
        apiService.getFileSystemLogs(),
        apiService.getSeedScript()
      ]);

      // Helper to extract data from settled promise
      const getResBody = (result: any) => {
        if (result.status === 'fulfilled') {
          return result.value.data;
        }
        return null;
      };

      const auditRes = getResBody(results[0]);
      const errorRes = getResBody(results[1]);
      const scriptData = getResBody(results[2]);
      const appLogsData = getResBody(results[3]);
      const seedData = getResBody(results[4]);

      // Normalize data (handle array in property or PascalCase)
      const normalizeData = (res: any) => {
        if (!res) return { items: [], total: 0, pages: 0 };
        const data = res.data || res;
        const items = Array.isArray(data) ? data : (data.items || data.$values || []);
        const total = res.pagination?.totalCount || items.length;
        const pages = res.pagination?.totalPages || Math.ceil(total / 10);
        return { items, total, pages };
      };

      const normAudit = normalizeData(auditRes);
      const normError = normalizeData(errorRes);

      setAuditLogs(normAudit.items);
      setAuditTotalCount(normAudit.total);
      setAuditTotalPages(normAudit.pages);

      setErrorLogs(normError.items);
      setErrorTotalCount(normError.total);
      setErrorTotalPages(normError.pages);

      setDbScript(scriptData?.content || "");
      setAppLogs(appLogsData?.content || "");
      setSeedScript(seedData?.content || "");

      if (results.some(r => r.status === 'rejected')) {
        console.warn("Some data sources failed to load:", results.filter(r => r.status === 'rejected'));
      }
    } catch (error) {
      console.error("Error fetching system data:", error);
      toast.error("Failed to load system logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    auditPage,
    auditPageSize,
    auditSortBy,
    auditSortOrder,
    errorPage,
    errorPageSize,
    errorSortBy,
    errorSortOrder,
    user.schoolId,
    user.academicYearId
  ]);

  const handleAuditSort = (key: string) => {
    if (auditSortBy === key) {
      setAuditSortOrder(auditSortOrder === "asc" ? "desc" : "asc");
    } else {
      setAuditSortBy(key);
      setAuditSortOrder("asc");
    }
    setAuditPage(1);
  };

  const handleErrorSort = (key: string) => {
    if (errorSortBy === key) {
      setErrorSortOrder(errorSortOrder === "asc" ? "desc" : "asc");
    } else {
      setErrorSortBy(key);
      setErrorSortOrder("asc");
    }
    setErrorPage(1);
  };

  const clearErrorLogs = async () => {
    if (!confirm("Are you sure you want to clear all error logs?")) return;
    try {
      await apiService.clearErrorLogs();
      setErrorLogs([]);
      toast.success("Error logs cleared");
    } catch (error) {
      toast.error("Failed to clear logs");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(dbScript);
    setCopied(true);
    toast.success("Script copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-blue-600 p-4 rounded-[1.25rem] text-white shadow-2xl shadow-blue-200 transition-transform hover:rotate-3">
             <Terminal size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">System Infrastructure</h1>
            <p className="text-slate-400 font-bold mt-1 text-xs sm:text-sm uppercase tracking-widest leading-none">Monitor system activities, exceptions, and institutional data health.</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchData} 
          disabled={refreshing}
          className="rounded-xl border-slate-200 font-bold bg-white shadow-sm hover:bg-slate-50 h-11 px-6 text-xs uppercase tracking-widest"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Sync System Data
        </Button>
      </div>

      <Tabs defaultValue="audit" orientation="horizontal" className="w-full">
        <TabsList className="bg-slate-100/80 p-1.5 rounded-2xl h-auto overflow-x-auto max-w-full flex justify-start sm:justify-center no-scrollbar">
          <TabsTrigger value="audit" className="px-4 sm:px-6 rounded-xl data-active:shadow-lg data-active:shadow-slate-200/50 text-xs sm:text-sm whitespace-nowrap">
            <History className="mr-2 h-4 w-4" />
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="errors" className="px-4 sm:px-6 rounded-xl data-active:shadow-lg data-active:shadow-slate-200/50 text-xs sm:text-sm whitespace-nowrap">
            <AlertCircle className="mr-2 h-4 w-4" />
            Database Errors
          </TabsTrigger>
          <TabsTrigger value="applogs" className="px-4 sm:px-6 rounded-xl data-active:shadow-lg data-active:shadow-slate-200/50 text-xs sm:text-sm whitespace-nowrap">
            <Terminal className="mr-2 h-4 w-4" />
            Application Logs
          </TabsTrigger>
          <TabsTrigger value="database" className="px-4 sm:px-6 rounded-xl data-active:shadow-lg data-active:shadow-slate-200/50 text-xs sm:text-sm whitespace-nowrap">
            <Database className="mr-2 h-4 w-4" />
            DB Schema
          </TabsTrigger>
          <TabsTrigger value="seed" className="px-4 sm:px-6 rounded-xl data-active:shadow-lg data-active:shadow-slate-200/50 text-xs sm:text-sm whitespace-nowrap">
            <RefreshCw className="mr-2 h-4 w-4" />
            Dummy Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="mt-8">
          <Card className="shadow-2xl shadow-slate-200/60 border-none rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white px-8 pt-8 pb-4">
              <CardTitle className="text-2xl font-black text-slate-900">Audit Trail</CardTitle>
              <CardDescription className="font-medium text-slate-400">Chronological record of data transactions and modifications.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 border-y border-slate-100 h-14">
                      <TableHead className="pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleAuditSort('timestamp')}>
                        <div className="flex items-center gap-1">
                          Timestamp
                          {auditSortBy === 'timestamp' ? (auditSortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
                        </div>
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleAuditSort('type')}>
                        <div className="flex items-center gap-1">
                          Event Type
                          {auditSortBy === 'type' ? (auditSortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
                        </div>
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleAuditSort('tableName')}>
                        <div className="flex items-center gap-1">
                          Entity Affected
                          {auditSortBy === 'tableName' ? (auditSortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
                        </div>
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">UID</TableHead>
                      <TableHead className="pr-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Operation Context</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!Array.isArray(auditLogs) || auditLogs.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                              <History size={32} />
                            </div>
                            <p className="text-slate-400 font-bold text-sm tracking-tight">No audit logs found.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log: any) => (
                        <TableRow key={log.id || log.Id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                          <TableCell className="pl-8 font-mono text-[10px] text-slate-500 font-bold italic">
                            {new Date(log.dateTime || log.DateTime || log.Timestamp || log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "font-black text-[9px] uppercase tracking-wider px-2",
                              (log.type || log.Type) === "Create" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : 
                              (log.type || log.Type) === "Delete" ? "bg-red-100 text-red-700 hover:bg-red-100" : 
                              "bg-blue-100 text-blue-700 hover:bg-blue-100"
                            )}>
                              {log.type || log.Type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-black text-slate-700 tracking-tight text-sm uppercase">{log.tableName || log.TableName}</TableCell>
                          <TableCell className="text-[10px] font-mono text-slate-400">ID:{log.primaryKey || log.PrimaryKey}</TableCell>
                          <TableCell className="pr-8">
                            <div className="max-w-md truncate text-[11px] font-bold text-slate-400" title={log.newValues || log.NewValues || ""}>
                              {(log.affectedColumns || log.AffectedColumns) ? `Changes in: ${log.affectedColumns || log.AffectedColumns}` : "Full entity record interaction"}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Audit Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 bg-slate-50/50 border-t border-slate-100 gap-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest text-[10px]">
                  Showing <span className="text-slate-900 font-black">{auditLogs.length > 0 ? (auditPage - 1) * auditPageSize + 1 : 0}</span> to <span className="text-slate-900 font-black">{Math.min(auditPage * auditPageSize, auditTotalCount)}</span> of <span className="text-slate-900 font-black">{auditTotalCount}</span> entries
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows</span>
                    <Select value={auditPageSize.toString()} onValueChange={(v) => { setAuditPageSize(parseInt(v)); setAuditPage(1); }}>
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
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setAuditPage(1)} disabled={auditPage === 1}>
                      <ChevronsLeft size={14} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setAuditPage(prev => Math.max(1, prev - 1))} disabled={auditPage === 1}>
                      <ChevronLeft size={14} />
                    </Button>
                    <div className="flex items-center px-3 h-8 bg-white border border-slate-200 rounded-lg text-xs font-black mx-1">
                      {auditPage} / {auditTotalPages || 1}
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setAuditPage(prev => Math.min(auditTotalPages, prev + 1))} disabled={auditPage >= auditTotalPages}>
                      <ChevronRight size={14} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setAuditPage(auditTotalPages)} disabled={auditPage >= auditTotalPages}>
                      <ChevronsRight size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="mt-8">
          <Card className="shadow-2xl shadow-slate-200/60 border-none rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-white px-4 sm:px-8 pt-6 sm:pt-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-black text-slate-900">Database Errors</CardTitle>
            <CardDescription className="font-medium text-slate-400">Exceptions recorded during database operations.</CardDescription>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={clearErrorLogs} 
            disabled={errorLogs.length === 0}
            className="rounded-xl font-black px-5 h-9 text-[10px] uppercase tracking-widest shadow-lg shadow-red-100 w-full sm:w-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Flush Logs
          </Button>
        </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 border-y border-slate-100 h-14">
                      <TableHead className="pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleErrorSort('timestamp')}>
                        <div className="flex items-center gap-1">
                          Event Time
                          {errorSortBy === 'timestamp' ? (errorSortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
                        </div>
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleErrorSort('level')}>
                        <div className="flex items-center gap-1">
                          Severity
                          {errorSortBy === 'level' ? (errorSortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
                        </div>
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Error Origin</TableHead>
                      <TableHead className="pr-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Message Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!Array.isArray(errorLogs) || errorLogs.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                              <AlertCircle size={32} />
                            </div>
                            <p className="text-slate-400 font-bold text-sm tracking-tight">Systems are healthy. No errors found.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      errorLogs.map((log: any) => (
                        <TableRow key={log.id || log.Id} className="hover:bg-red-50/30 transition-colors border-b border-slate-50">
                          <TableCell className="pl-8 font-mono text-[10px] text-slate-500 font-bold italic whitespace-nowrap">
                            {new Date(log.timestamp || log.Timestamp || log.dateTime || log.DateTime).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-red-500 text-white font-black text-[9px] uppercase tracking-wider px-2 hover:bg-red-600">
                              {log.level || log.Level || "Error"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-black text-slate-700 tracking-tight text-xs uppercase">{log.properties || log.Properties || "System"}</TableCell>
                          <TableCell className="pr-8">
                            <p className="text-[11px] font-bold text-slate-500 max-w-xl">{log.message || log.Message}</p>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Error Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 bg-slate-50/50 border-t border-slate-100 gap-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest text-[10px]">
                  Showing <span className="text-slate-900 font-black">{errorLogs.length > 0 ? (errorPage - 1) * errorPageSize + 1 : 0}</span> to <span className="text-slate-900 font-black">{Math.min(errorPage * errorPageSize, errorTotalCount)}</span> of <span className="text-slate-900 font-black">{errorTotalCount}</span> entries
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows</span>
                    <Select value={errorPageSize.toString()} onValueChange={(v) => { setErrorPageSize(parseInt(v)); setErrorPage(1); }}>
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
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setErrorPage(1)} disabled={errorPage === 1}>
                      <ChevronsLeft size={14} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setErrorPage(prev => Math.max(1, prev - 1))} disabled={errorPage === 1}>
                      <ChevronLeft size={14} />
                    </Button>
                    <div className="flex items-center px-3 h-8 bg-white border border-slate-200 rounded-lg text-xs font-black mx-1">
                      {errorPage} / {errorTotalPages || 1}
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setErrorPage(prev => Math.min(errorTotalPages, prev + 1))} disabled={errorPage >= errorTotalPages}>
                      <ChevronRight size={14} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setErrorPage(errorTotalPages)} disabled={errorPage >= errorTotalPages}>
                      <ChevronsRight size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applogs" className="mt-8">
          <Card className="shadow-2xl shadow-slate-200/60 border-none rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white px-8 pt-8 pb-4">
              <CardTitle className="text-2xl font-black text-slate-900">Application Runtime Logs</CardTitle>
              <CardDescription className="font-medium text-slate-400">Real-time logs captured on the server filesystem.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pb-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <ScrollArea className="h-[600px] w-full rounded-[1.5rem] border-4 border-slate-900 bg-slate-950 p-6 shadow-2xl relative z-10">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800/50">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-mono text-slate-600 ml-2 uppercase font-black tracking-widest underline decoration-blue-500/50 decoration-2">server_log_active</span>
                  </div>
                  <pre className="font-mono text-xs leading-relaxed text-blue-200/80 whitespace-pre-wrap selection:bg-blue-500/30">
                    {appLogs || "-- No recent application activity logged yet."}
                  </pre>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="mt-8">
          <Card className="shadow-2xl shadow-slate-200/60 border-none rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white px-8 pt-8 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">Database Schema</CardTitle>
                <CardDescription className="font-medium text-slate-400">Current institutional database structure for environment provisioning.</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyToClipboard}
                className="rounded-xl font-black px-6 h-9 border-slate-200 text-[10px] uppercase tracking-widest bg-white shadow-sm hover:bg-slate-50"
              >
                {copied ? <Check className="mr-2 h-4 w-4 text-emerald-500" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Script Saved" : "Copy Schema SQL"}
              </Button>
            </CardHeader>
            <CardContent className="p-8 pb-10">
              <ScrollArea className="h-[600px] w-full rounded-[1.5rem] bg-slate-50 border border-slate-200 p-8 font-mono text-[13px] text-slate-700 leading-relaxed shadow-inner">
                <pre className="whitespace-pre-wrap selection:bg-blue-100">
                  {dbScript || "-- The database script could not be loaded at this time."}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seed" className="mt-8">
          <Card className="shadow-2xl shadow-slate-200/60 border-none rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white px-8 pt-8 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">Dummy Data Insert Script</CardTitle>
                <CardDescription className="font-medium text-slate-400">SQL script to populate all tables with dummy data for testing.</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  navigator.clipboard.writeText(seedScript);
                  setSeedCopied(true);
                  toast.success("Seed script copied");
                  setTimeout(() => setSeedCopied(false), 2000);
                }}
                className="rounded-xl font-black px-6 h-9 border-slate-200 text-[10px] uppercase tracking-widest bg-white shadow-sm hover:bg-slate-50"
              >
                {seedCopied ? <Check className="mr-2 h-4 w-4 text-emerald-500" /> : <Copy className="mr-2 h-4 w-4" />}
                {seedCopied ? "Data Script Saved" : "Copy Data SQL"}
              </Button>
            </CardHeader>
            <CardContent className="p-8 pb-10">
              <ScrollArea className="h-[600px] w-full rounded-[1.5rem] bg-slate-100 border border-slate-200 p-8 font-mono text-[13px] text-slate-700 leading-relaxed shadow-inner">
                <pre className="whitespace-pre-wrap selection:bg-blue-100">
                  {seedScript || "-- The seed data script could not be loaded at this time."}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
