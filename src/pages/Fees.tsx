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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  IndianRupee, 
  CreditCard, 
  Download, 
  Plus,
  ArrowUpRight,
  History,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  X,
  Award,
  Landmark,
  ShieldCheck,
  Check
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { cn, parseSafeInt } from "@/lib/utils";

// School presets definition representing all types of schools in India and globally
const CURRICULUM_PRESETS = [
  {
    id: "govt",
    name: "Government / Municipal Subsidized",
    description: "Nominal, highly regulated fees with full RTE (Right to Education) subsidy allocations & waivers.",
    icon: Landmark,
    accentColor: "from-amber-500 to-orange-600",
    tuitionFee: 400,
    examFee: 150,
    activityFee: 100,
    hasRteGrant: true,
    scheme: "Sarva Shiksha Abhiyan / RTE Subvention"
  },
  {
    id: "stateboard",
    name: "Stateboard Local High School",
    description: "Standard medium-cost tuition, standard quarterly terms, unified uniform & digital notebook fees.",
    icon: Landmark,
    accentColor: "from-teal-500 to-emerald-600",
    tuitionFee: 3200,
    examFee: 800,
    activityFee: 500,
    hasRteGrant: false,
    scheme: "State Secondary Education Council Model"
  },
  {
    id: "cbse_icse",
    name: "CBSE / ICSE Central Board",
    description: "Private school board structure with split term options, science lab charges, and central sport fees.",
    icon: ShieldCheck,
    accentColor: "from-blue-600 to-indigo-700",
    tuitionFee: 12500,
    examFee: 2200,
    activityFee: 1800,
    hasRteGrant: false,
    scheme: "All India CBSE Private School Curriculum"
  },
  {
    id: "international",
    name: "International Council (IB / IGCSE)",
    description: "Premium global tier, quarterly bills, dedicated smart ICT labs, sports complex & high-end transport setup.",
    icon: Award,
    accentColor: "from-purple-600 to-pink-700",
    tuitionFee: 45000,
    examFee: 7500,
    activityFee: 9000,
    hasRteGrant: false,
    scheme: "International Baccalaureate (IB) World Standard"
  }
];

export default function Fees({ user }: { user: any }) {
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshQueue, setRefreshQueue] = useState(0);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(user.schoolId?.toString() || "");

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Presets State
  const [applyingPreset, setApplyingPreset] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string>("cbse_icse");

  // Collect Fee Modal states
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedFeeId, setSelectedFeeId] = useState<string>("custom_new");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI - GPay/PhonePe");
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [customFeeType, setCustomFeeType] = useState<string>("Tuition Fee");
  const [customFeeTerm, setCustomFeeTerm] = useState<string>("Quarter 1 Term");

  // Charge / Demand Modal states
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [demandTarget, setDemandTarget] = useState<string>("all"); // all, bus_only, single
  const [demandStudentId, setDemandStudentId] = useState<string>("");
  const [demandType, setDemandType] = useState<string>("Tuition Fee");
  const [demandAmount, setDemandAmount] = useState<string>("");
  const [demandTerm, setDemandTerm] = useState<string>("Quarter 1 Term");
  const [demandDueDate, setDemandDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Print Receipt View State
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  const isManagement = user.role === "superadmin" || user.role === "admin";
  const isParent = user.role === "parent";

  // Fetch initial metadata, schools, and students
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

  // Fetch Students to list options in forms
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const schoolIdToUse = user.role === "superadmin" ? parseSafeInt(selectedSchoolId) : parseSafeInt(user.schoolId);
        const academicYearIdToUse = parseSafeInt(user.academicYearId);
        const res = await apiService.getStudents(schoolIdToUse, academicYearIdToUse, { pageSize: 100 });
        const studentList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setStudents(studentList);
      } catch (error) {
        console.error("Failed to load students", error);
      }
    };
    fetchStudents();
  }, [selectedSchoolId, user.schoolId, user.academicYearId, user.role]);

  // Fetch Fee Ledger entries
  useEffect(() => {
    const fetchFees = async () => {
      setLoading(true);
      try {
        const schoolIdToUse = user.role === "superadmin" ? parseSafeInt(selectedSchoolId) : parseSafeInt(user.schoolId);
        const academicYearIdToUse = parseSafeInt(user.academicYearId);
        // Fallback or local backend route
        const res = await apiService.getFees(schoolIdToUse, academicYearIdToUse);
        const feeData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setFees(feeData);
      } catch (error) {
        console.error("Fees loading error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
  }, [user.schoolId, user.academicYearId, isManagement, selectedSchoolId, user.role, refreshQueue]);

  if (!isManagement && !isParent) {
    return <Navigate to="/" replace />;
  }

  // Handle Preset Re-generation for schools
  const applyPresetStructure = async (presetId: string) => {
    const preset = CURRICULUM_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setApplyingPreset(presetId);
    try {
      const targetSchoolId = user.role === "superadmin" ? parseSafeInt(selectedSchoolId) || 1 : parseSafeInt(user.schoolId) || 1;
      const targetAcademicYearId = parseSafeInt(user.academicYearId) || 2;

      // 1. Delete existing fee bills for this branch to avoid duplicates
      const schoolFees = fees.filter(f => f.schoolId === targetSchoolId);
      for (const feeItem of schoolFees) {
        try {
          await apiService.deleteFee(feeItem.id);
        } catch (e) {
          // Continue
        }
      }

      // 2. Determine target students to seed invoices
      // If none exist in local register, fallback to hardcoded targets
      const activeStudents = students.length > 0 ? students : [ { id: 1 }, { id: 2 } ];

      // 3. Generate structured CBSE/Stateboard/International bills for each student
      for (const std of activeStudents) {
        const studentId = std.id;

        // Tuition Dues (Term 1)
        await apiService.createFee({
          studentId,
          invoiceNumber: `INV-${preset.id.toUpperCase()}-${studentId}-01`,
          type: "Tuition Fee",
          amount: preset.tuitionFee,
          totalAmount: preset.tuitionFee,
          dueDate: "2026-06-30",
          status: "Pending",
          term: "Term 1 Tuition",
          schoolId: targetSchoolId,
          academicYearId: targetAcademicYearId
        });

        // Exam Fee
        await apiService.createFee({
          studentId,
          invoiceNumber: `INV-${preset.id.toUpperCase()}-${studentId}-02`,
          type: "Exam Fee",
          amount: preset.examFee,
          totalAmount: preset.examFee,
          dueDate: "2026-07-25",
          status: "Pending",
          term: "Term 1 Exams",
          schoolId: targetSchoolId,
          academicYearId: targetAcademicYearId
        });

        // Activity Fee
        await apiService.createFee({
          studentId,
          invoiceNumber: `INV-${preset.id.toUpperCase()}-${studentId}-03`,
          type: "Activity Fee",
          amount: preset.activityFee,
          totalAmount: preset.activityFee,
          dueDate: "2026-08-15",
          status: "Pending",
          term: "Term 1 Activity & Sports",
          schoolId: targetSchoolId,
          academicYearId: targetAcademicYearId
        });

        // Subsidized Welfare Grants (if State Government Scheme applies)
        if (preset.hasRteGrant) {
          await apiService.createFee({
            studentId,
            invoiceNumber: `INV-${preset.id.toUpperCase()}-${studentId}-RTE`,
            type: "RTE Scheme Grant",
            amount: -(preset.tuitionFee + preset.examFee), // Grants are negative / wave off
            totalAmount: -(preset.tuitionFee + preset.examFee),
            dueDate: "2026-06-30",
            status: "Paid",
            paidDate: new Date().toISOString().split('T')[0],
            paymentMethod: "RTE Gov Voucher",
            term: "Right to Education Welfare",
            schoolId: targetSchoolId,
            academicYearId: targetAcademicYearId
          });
        }

        // Dedicated Bus charge if student opted for bus transit
        if (std.optedForBus) {
          await apiService.createFee({
            studentId,
            invoiceNumber: `INV-${preset.id.toUpperCase()}-${studentId}-BUS`,
            type: "Transportation Fee",
            amount: preset.id === "international" ? 12000 : 3500,
            totalAmount: preset.id === "international" ? 12000 : 3500,
            dueDate: "2026-06-30",
            status: "Pending",
            term: "Bus Transit (Term 1)",
            schoolId: targetSchoolId,
            academicYearId: targetAcademicYearId
          });
        }
      }

      setActivePresetId(presetId);
      setRefreshQueue(prev => prev + 1);
    } catch (error) {
      console.error("Error setting custom curriculum pricing presets:", error);
    } finally {
      setApplyingPreset(null);
    }
  };

  // Submit collected fee transaction
  const handleCollectFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    try {
      const amountParsed = parseFloat(paymentAmount);
      if (isNaN(amountParsed) || amountParsed <= 0) {
        alert("Please specify a valid payment collection amount.");
        return;
      }

      const schoolIdToUse = user.role === "superadmin" ? parseSafeInt(selectedSchoolId) || 1 : parseSafeInt(user.schoolId) || 1;
      const academicYearIdToUse = parseSafeInt(user.academicYearId) || 2;

      if (selectedFeeId === "custom_new") {
        // Collect & create instantly paid new invoice
        await apiService.createFee({
          studentId: parseSafeInt(selectedStudentId),
          invoiceNumber: `INV-REC-${Date.now().toString().slice(-6)}`,
          type: customFeeType,
          amount: amountParsed,
          totalAmount: amountParsed,
          paidAmount: amountParsed,
          dueDate: new Date().toISOString().split('T')[0],
          paidDate: new Date().toISOString().split('T')[0],
          status: "Paid",
          paymentMethod,
          term: customFeeTerm,
          notes: paymentNotes,
          schoolId: schoolIdToUse,
          academicYearId: academicYearIdToUse
        });
      } else {
        // Find existing invoice to settle
        const feeId = parseSafeInt(selectedFeeId);
        const existingFee = fees.find(f => f.id === feeId);
        if (existingFee) {
          const updatedPaid = (existingFee.paidAmount || 0) + amountParsed;
          const isFullyPaid = updatedPaid >= existingFee.totalAmount;

          await apiService.updateFee(feeId, {
            paidAmount: updatedPaid,
            paidDate: new Date().toISOString().split('T')[0],
            paymentMethod,
            status: isFullyPaid ? "Paid" : "Pending",
            notes: paymentNotes
          });
        }
      }

      setShowCollectModal(false);
      // Reset inputs
      setSelectedStudentId("");
      setPaymentAmount("");
      setPaymentRef("");
      setPaymentNotes("");
      setRefreshQueue(prev => prev + 1);
    } catch (error) {
      console.error("Failed to record fee collection:", error);
    }
  };

  // Build / Batch Demands
  const handleDemandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedAmount = parseFloat(demandAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert("Please specify a valid billing amount.");
        return;
      }

      const schoolIdToUse = user.role === "superadmin" ? parseSafeInt(selectedSchoolId) || 1 : parseSafeInt(user.schoolId) || 1;
      const academicYearIdToUse = parseSafeInt(user.academicYearId) || 2;

      let targets: any[] = [];
      if (demandTarget === "all") {
        targets = students;
      } else if (demandTarget === "bus_only") {
        targets = students.filter(s => s.optedForBus);
      } else if (demandTarget === "single" && demandStudentId) {
        const matched = students.find(s => s.id.toString() === demandStudentId);
        if (matched) targets = [matched];
      }

      if (targets.length === 0) {
        alert("No target students matched for this demand execution.");
        return;
      }

      for (const target of targets) {
        await apiService.createFee({
          studentId: target.id,
          invoiceNumber: `INV-DEM-${Date.now().toString().slice(-4)}-${target.id}`,
          type: demandType,
          amount: parsedAmount,
          totalAmount: parsedAmount,
          dueDate: demandDueDate,
          status: "Pending",
          term: demandTerm,
          schoolId: schoolIdToUse,
          academicYearId: academicYearIdToUse
        });
      }

      setShowDemandModal(false);
      setDemandAmount("");
      setRefreshQueue(prev => prev + 1);
    } catch (error) {
      console.error("Demand build error:", error);
    }
  };

  // Filter Ledger Entries
  const filteredFees = fees.filter(fee => {
    const studentName = (fee.student?.fullName || "Student").toLowerCase();
    const grNo = (fee.student?.grNo || "").toLowerCase();
    const type = (fee.type || "").toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = studentName.includes(query) || grNo.includes(query) || type.includes(query);
    const matchesStatus = selectedStatus === "all" || fee.status === selectedStatus;
    const matchesType = selectedType === "all" || fee.type === selectedType;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate stats based on fetched fee logs
  const totalCollected = fees
    .filter(f => f.status === "Paid")
    .reduce((sum, f) => sum + (f.paidAmount || f.totalAmount || f.amount || 0), 0);

  const totalPending = fees
    .filter(f => f.status !== "Paid")
    .reduce((sum, f) => sum + ((f.totalAmount || f.amount || 0) - (f.paidAmount || 0)), 0);

  const activeWaiverSum = Math.abs(
    fees
      .filter(f => (f.totalAmount || f.amount || 0) < 0)
      .reduce((sum, f) => sum + (f.totalAmount || f.amount || 0), 0)
  );

  // Dynamic filter lists
  const availableFeeCategories = Array.from(new Set(fees.map(f => f.type))).filter(Boolean);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 pb-16">
      
      {/* Header and Branch Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-slate-900 p-4 rounded-3xl text-white shadow-xl transition-all duration-300 hover:rotate-3">
             <IndianRupee size={28} className="text-amber-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fee Management Dashboard</h1>
            <p className="text-slate-400 font-semibold mt-1 text-xs uppercase tracking-widest">
              Unified Financial Registry for State, Central, & Global Curriculums
            </p>
          </div>
        </div>

        {/* Brand/Branch Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {user.role === "superadmin" && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch:</span>
              <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                <SelectTrigger className="h-9 w-[190px] border-none bg-slate-50 font-bold text-xs rounded-xl focus:ring-0">
                  <SelectValue placeholder="Branch Selection">
                    {selectedSchoolId ? schools.find(s => s.id.toString() === selectedSchoolId)?.name : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl p-2">
                  <SelectItem value="" className="font-semibold py-2 px-3 rounded-lg text-slate-400 italic">Global System All</SelectItem>
                  {Array.isArray(schools) && schools.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()} className="font-semibold py-2 px-3 rounded-lg">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quick Actions */}
          {isManagement && (
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowDemandModal(true)} 
                variant="outline" 
                className="gap-2 rounded-xl text-slate-700 bg-white border-slate-200 font-bold hover:bg-slate-50"
              >
                <RefreshCw size={15} className="text-slate-500" />
                Build Demand Invoice
              </Button>
              <Button 
                onClick={() => setShowCollectModal(true)} 
                className="bg-slate-900 hover:bg-slate-800 gap-2 text-white font-extrabold rounded-xl shadow-lg shadow-slate-900/10"
              >
                <Plus size={16} /> Collect Fees Payment
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 text-white shadow-2xl border-none rounded-[2rem] overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-slate-800/40 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-xs uppercase tracking-widest font-black">Consolidated Receipts Collection</CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-slate-400 font-bold text-xs">Term Actual Received</span>
                <h2 className="text-4xl font-extrabold tracking-tight mt-1 text-emerald-400">₹{totalCollected.toLocaleString()}</h2>
              </div>
              <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white text-slate-900 shadow-xl border border-slate-100 rounded-[2rem] overflow-hidden relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-xs uppercase tracking-widest font-black">Deferred Invoices Dues</CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-slate-400 font-bold text-xs">Total Outstanding Balance</span>
                <h2 className="text-4xl font-extrabold tracking-tight mt-1 text-red-600">₹{totalPending.toLocaleString()}</h2>
              </div>
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
                <AlertCircle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 text-slate-900 shadow-md border-none rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-indigo-400 text-xs uppercase tracking-widest font-black">Welfare Aid, RTE & Subsidies</CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-slate-500 font-bold text-xs">Assisted Free-ships & Grants</span>
                <h2 className="text-4xl font-extrabold tracking-tight mt-1 text-indigo-700">₹{activeWaiverSum.toLocaleString()}</h2>
              </div>
              <div className="p-4 bg-indigo-100/60 text-indigo-700 rounded-2xl">
                <Award size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive System Presets Control Area */}
      <Card className="border border-slate-100 shadow-xl rounded-[2.25rem] bg-slate-50/50 p-6">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-black text-slate-800 text-lg">Curriculum Pricing Presets</h3>
            <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">Setup Presets</span>
          </div>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Toggle templates to instantly align active invoices, scholarships, and billing rates with typical Indian CBSE, State, Municipal, or Global schools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {CURRICULUM_PRESETS.map((preset) => {
            const PresetIcon = preset.icon;
            const isActive = activePresetId === preset.id;
            return (
              <div 
                key={preset.id} 
                className={cn(
                  "bg-white border rounded-2xl p-5 shadow-sm transition-all duration-300 relative overflow-hidden flex flex-col justify-between hover:shadow-md",
                  isActive ? "border-slate-800 ring-2 ring-slate-800" : "border-slate-100"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("p-2 rounded-xl text-white bg-gradient-to-br", preset.accentColor)}>
                      <PresetIcon size={18} />
                    </div>
                    {isActive && (
                      <span className="bg-slate-800 text-white p-1 rounded-full">
                        <Check size={10} strokeWidth={4} />
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{preset.name}</h4>
                  <p className="text-slate-400 font-medium text-[11px] leading-tight mt-1.5">{preset.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-50">
                  <div className="flex justify-between items-center text-[11px] mb-3">
                    <span className="font-bold text-slate-400">Est. Tuition Fee</span>
                    <span className="font-extrabold text-slate-800">₹{preset.tuitionFee.toLocaleString()}</span>
                  </div>
                  <Button
                    onClick={() => applyPresetStructure(preset.id)}
                    disabled={applyingPreset !== null}
                    size="sm"
                    className={cn(
                      "w-full text-[10px] font-black uppercase tracking-wider rounded-xl h-8",
                      isActive 
                        ? "bg-slate-100 text-slate-800 hover:bg-slate-200" 
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    )}
                  >
                    {applyingPreset === preset.id ? (
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                    ) : (
                      isActive ? "Current Template active" : "Load Preset"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Main Ledger Table with filters */}
      <Card className="shadow-2xl shadow-slate-200/50 border border-slate-100 rounded-[2rem] overflow-hidden bg-white">
        
        {/* Table Filters Header */}
        <div className="p-6 md:p-8 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-extrabold text-slate-900">Active Billing Ledger</CardTitle>
            <CardDescription className="text-slate-400 font-semibold tracking-tight text-xs uppercase tracking-widest mt-0.5">
              Current Session Student Fee Records
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Student, Invoice..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 border border-slate-200 rounded-xl">
              <Filter size={12} className="text-slate-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Dues</option>
                {availableFeeCategories.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 border border-slate-200 rounded-xl">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Standing</option>
                <option value="Paid">Settle Paid</option>
                <option value="Pending">Unpaid Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Grid */}
        <CardContent className="p-0">
          {loading ? (
             <div className="p-20 flex flex-col items-center justify-center gap-3">
               <Loader2 className="animate-spin text-slate-400" size={32} />
               <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Analyzing Ledger Journals...</p>
             </div>
          ) : filteredFees.length === 0 ? (
            <div className="p-16 text-center">
              <AlertCircle size={36} className="text-slate-300 mx-auto mb-3" />
              <h3 className="font-black text-slate-800">No matching ledger records</h3>
              <p className="text-slate-400 font-semibold text-xs mt-1">Adjust filters or choose standard curriculum pricing templates above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 h-14 border-b border-slate-100">
                  <TableHead className="pl-8 text-xs font-black text-slate-500 uppercase tracking-wider">GR No.</TableHead>
                  <TableHead className="text-xs font-black text-slate-500 uppercase tracking-wider">Student Profile</TableHead>
                  <TableHead className="text-xs font-black text-slate-500 uppercase tracking-wider">Billing Type</TableHead>
                  <TableHead className="text-xs font-black text-slate-500 uppercase tracking-wider">Term / Allocation</TableHead>
                  <TableHead className="text-xs font-black text-slate-500 uppercase tracking-wider text-right">Invoice Sum</TableHead>
                  <TableHead className="text-xs font-black text-slate-500 uppercase tracking-wider text-right">Settled Sum</TableHead>
                  <TableHead className="text-xs font-black text-slate-500 uppercase tracking-wider pl-8">Standing Status</TableHead>
                  <TableHead className="text-right pr-8 text-xs font-black text-slate-500 uppercase tracking-wider">Audit Print</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFees.map((fee) => {
                  const isNegativeWaiver = (fee.totalAmount || fee.amount || 0) < 0;
                  return (
                    <TableRow key={fee.id} className="hover:bg-slate-50/40 transition-colors group border-b border-slate-100">
                      <TableCell className="pl-8 font-mono text-xs font-black text-slate-400">
                        {fee.student?.grNo || `GR-${fee.studentId}`}
                      </TableCell>
                      <TableCell className="font-extrabold text-slate-800 group-hover:text-blue-700 transition-colors">
                        <div>
                          <span>{fee.student?.fullName || "Student Detail"}</span>
                          <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                            {fee.student?.standard || "1st"} - Div {fee.student?.section || "A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700 font-bold text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            isNegativeWaiver ? "bg-indigo-500" : "bg-slate-500"
                          )}></span>
                          {fee.type}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400 font-bold text-xs tracking-tight">
                        {fee.term}
                      </TableCell>
                      <TableCell className={cn("text-right font-black font-mono", isNegativeWaiver ? "text-indigo-600" : "text-slate-900")}>
                        {isNegativeWaiver ? "-" : ""}₹{Math.abs(fee.totalAmount || fee.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-black font-mono text-emerald-600">
                        ₹{(fee.paidAmount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="pl-8">
                        <Badge 
                          variant="secondary"
                          className={cn(
                            "font-extrabold text-[10px] uppercase tracking-wider px-3",
                            fee.status === 'Paid' 
                              ? "bg-emerald-100 text-emerald-700" 
                              : isNegativeWaiver 
                                ? "bg-indigo-50 text-indigo-700" 
                                : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {isNegativeWaiver ? "Granted Aid" : fee.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button 
                          onClick={() => setActiveReceipt(fee)}
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-800 font-extrabold hover:bg-slate-100 text-xs rounded-lg"
                        >
                          Print Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: Collect / Settle Fees Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-300">
          <Card className="w-full max-w-lg bg-white shadow-2xl p-6 border-none rounded-3xl mx-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Record Payment Collection</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Accounting Settle Invoice</p>
              </div>
              <Button onClick={() => setShowCollectModal(false)} variant="ghost" size="icon" className="rounded-full">
                <X size={18} />
              </Button>
            </div>

            <form onSubmit={handleCollectFeeSubmit} className="space-y-4 pt-4 text-xs font-bold text-slate-700">
              
              {/* Select Student */}
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold text-[11px] uppercase block">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setSelectedFeeId("custom_new");
                  }}
                  required
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">- Choose Active Student -</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id.toString()}>
                      {s.fullName || `${s.firstName || ""} ${s.lastName || ""}`.trim() || `ID ${s.id}`} (GR-{s.grNo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Match Invoices or Record Random custom */}
              {selectedStudentId && (
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold text-[11px] uppercase block">Matched Dues Invoices</label>
                  <select
                    value={selectedFeeId}
                    onChange={(e) => {
                      setSelectedFeeId(e.target.value);
                      if (e.target.value !== "custom_new") {
                        const matched = fees.find(f => f.id.toString() === e.target.value);
                        if (matched) {
                          setPaymentAmount(((matched.totalAmount || matched.amount) - (matched.paidAmount || 0)).toString());
                        }
                      } else {
                        setPaymentAmount("");
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="custom_new">Unlisted Invoice / Direct Cash Payment Receipt</option>
                    {fees
                      .filter(f => f.studentId.toString() === selectedStudentId && f.status !== "Paid" && (f.totalAmount || f.amount) > 0)
                      .map(f => (
                        <option key={f.id} value={f.id.toString()}>
                          {f.type} - {f.term} (Outstanding: ₹{(f.totalAmount || f.amount) - (f.paidAmount || 0)})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Custom types inputs if custom receipt selected */}
              {selectedFeeId === "custom_new" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold text-[11px] uppercase block">Invoice Head Group</label>
                    <select
                      value={customFeeType}
                      onChange={(e) => setCustomFeeType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-semibold text-xs outline-none focus:ring-1"
                    >
                      <option value="Tuition Fee">Tuition Fee</option>
                      <option value="Admission Fee">Admission Fee</option>
                      <option value="Exam Fee">Exam Fee</option>
                      <option value="Activity Fee">Activity Fee</option>
                      <option value="Technology Fee">Technology Fee</option>
                      <option value="Laboratory Dues">Laboratory Fee</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold text-[11px] uppercase block">Billing Allocation</label>
                    <input
                      type="text"
                      value={customFeeTerm}
                      onChange={(e) => setCustomFeeTerm(e.target.value)}
                      placeholder="Term 1 / Q1"
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-semibold hover:border-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* Amount and Mode split */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold text-[11px] uppercase block">Receive Amount (INR)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter collected sum"
                    required
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-semibold outline-none focus:ring-1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold text-[11px] uppercase block">Collection Channel</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-semibold outline-none focus:ring-1"
                  >
                    <option value="UPI - GPay/PhonePe">UPI / Paytm QR Scan</option>
                    <option value="Cash Handheld">Cash Settle</option>
                    <option value="Credit/Debit Card POS">POS Card Terminal</option>
                    <option value="Bank NEFT Transfer">Bank Wire NEFT</option>
                    <option value="RTE Voucher Grant">RTE Gov Voucher</option>
                    <option value="Subsidy Waiver Allowance">Scholarship Allocation</option>
                  </select>
                </div>
              </div>

              {/* Reference number & Memorandum */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold text-[11px] uppercase block">Transacation Ref ID</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. TXN991002"
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold text-[11px] uppercase block">Memorandum Notes</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Auditing memo logs"
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <Button type="button" variant="ghost" onClick={() => setShowCollectModal(false)} className="rounded-xl font-bold">
                  Abort
                </Button>
                <Button type="submit" className="bg-slate-900 border-none hover:bg-slate-800 text-white font-extrabold rounded-xl px-5 h-9">
                  Confirm Settle Receipt
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: Build Demand / Invoice Modal */}
      {showDemandModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-300">
          <Card className="w-full max-w-lg bg-white shadow-2xl p-6 border-none rounded-3xl mx-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Build / Charge Invoices</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Generate Billing Demand</p>
              </div>
              <Button onClick={() => setShowDemandModal(false)} variant="ghost" size="icon" className="rounded-full">
                <X size={18} />
              </Button>
            </div>

            <form onSubmit={handleDemandSubmit} className="space-y-4 pt-4 text-xs font-bold text-slate-700">
              
              {/* Billing target scope */}
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold text-[11px] uppercase block">Target Audience</label>
                <select
                  value={demandTarget}
                  onChange={(e) => setDemandTarget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                >
                  <option value="all">Deliver Invoice to All Students (General Dues)</option>
                  <option value="bus_only">Charge ONLY Students who Opted for School Bus</option>
                  <option value="single">Deliver to Specific Selective Student</option>
                </select>
              </div>

              {/* Target Single student selector */}
              {demandTarget === "single" && (
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold text-[11px] uppercase block">Select Target Student</label>
                  <select
                    value={demandStudentId}
                    onChange={(e) => setDemandStudentId(e.target.value)}
                    required
                    className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl"
                  >
                    <option value="">- Match Register profile -</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id.toString()}>
                        {s.fullName || `Student ${s.id}`} (GR-{s.grNo})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category, billing title, amount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold text-[11px] uppercase block">Billing Ledger Head</label>
                  <select
                    value={demandType}
                    onChange={(e) => setDemandType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                  >
                    <option value="Tuition Fee">Tuition Fee</option>
                    <option value="Admission Fee">Admission Fee</option>
                    <option value="Exam Fee">Exam Fee</option>
                    <option value="Activity Fee">Activity Fee</option>
                    <option value="Technology Fee">Technology Fee</option>
                    <option value="Transportation Fee">Transportation Fee</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold text-[11px] uppercase block">Billing Amount (INR)</label>
                  <input
                    type="number"
                    value={demandAmount}
                    onChange={(e) => setDemandAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    required
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                  />
                </div>
              </div>

              {/* Term Allocation & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold text-[11px] uppercase block">Billing Term Label</label>
                  <input
                    type="text"
                    value={demandTerm}
                    onChange={(e) => setDemandTerm(e.target.value)}
                    placeholder="Term 1 (CBSE Level)"
                    required
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold hover:border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold text-[11px] uppercase block">Dead-line Due Date</label>
                  <input
                    type="date"
                    value={demandDueDate}
                    onChange={(e) => setDemandDueDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold focus:ring-1"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <Button type="button" variant="ghost" onClick={() => setShowDemandModal(false)} className="rounded-xl font-bold">
                  Abort
                </Button>
                <Button type="submit" className="bg-slate-900 border-none hover:bg-slate-800 text-white font-extrabold rounded-xl px-5 h-9">
                  Deliver Dues Demands
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: Print Receipt Sheet View Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-300 no-print">
          <Card id="printable-receipt-card" className="print-container w-full max-w-xl bg-white shadow-3xl p-8 border-none rounded-3xl mx-4 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900"></div>

            <div className="flex justify-between items-start pb-6 border-b border-dashed border-slate-200">
              <div>
                <h4 className="font-black text-slate-800 text-base uppercase tracking-wider">SCANiD EDUCATION INFRASTRUCTURE</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-non mt-0.5">National Settle & Audit Ledger Clearance Voucher</p>
                <span className="text-[9px] font-mono font-bold block text-slate-400 mt-2">UUID: {activeReceipt.invoiceNumber}</span>
              </div>
              <Button onClick={() => setActiveReceipt(null)} variant="ghost" size="icon" className="rounded-full select-none no-print">
                <X size={16} />
              </Button>
            </div>

            <div className="py-6 space-y-6">
              
              {/* Receipt metadata columns */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold text-[10px] block uppercase tracking-wider">Settle Date</span>
                  <span className="font-extrabold text-slate-800 mt-0.5 block">{activeReceipt.paidDate || activeReceipt.dueDate || "Not Settled"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold text-[10px] block uppercase tracking-wider">Payment Mode</span>
                  <span className="font-extrabold text-emerald-600 mt-0.5 block">{activeReceipt.paymentMethod || "Deferred/Pending"}</span>
                </div>
              </div>

              {/* Student breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between text-xs border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Student Core profile</span>
                  <p className="font-extrabold text-slate-800 text-sm mt-0.5">{activeReceipt.student?.fullName || "Shivansh Sanjay Khopkar"}</p>
                  <p className="text-slate-400 font-bold text-[10px] mt-0.5">
                    Std {activeReceipt.student?.standard || "1st"} ({activeReceipt.student?.section || "A"}) | GR {activeReceipt.student?.grNo || "REG1001"}
                  </p>
                </div>
                {activeReceipt.student?.optedForBus && (
                  <span className="font-black text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full tracking-wider uppercase">
                    Bus Transport active
                  </span>
                )}
              </div>

              {/* split amount values calculations */}
              <div className="space-y-3">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block">Settle Ledger splits</span>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-3 bg-slate-50/50 p-3 text-[10px] font-black text-slate-500 uppercase border-b border-slate-100">
                    <span>Particular Head</span>
                    <span className="text-center">Allocation</span>
                    <span className="text-right">Sum (INR)</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 text-xs font-bold text-slate-700">
                    <span>{activeReceipt.type}</span>
                    <span className="text-center hover:underline">{activeReceipt.term}</span>
                    <span className="text-right font-mono font-black text-slate-900">₹{Math.abs(activeReceipt.totalAmount || activeReceipt.amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Settle summary details */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wide block text-[10px]">Settled standing</span>
                  <Badge 
                    className={cn(
                      "font-black text-[9px] uppercase mt-1 px-3 py-0.5",
                      activeReceipt.status === 'Paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {activeReceipt.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold uppercase tracking-wide block text-[10px]">Net Balance Received</span>
                  <p className="text-2xl font-black text-slate-900 font-mono">₹{(activeReceipt.paidAmount || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Print and Save controllers */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-2 text-xs no-print">
              <Button onClick={() => setActiveReceipt(null)} variant="ghost" className="rounded-xl font-bold">
                Close
              </Button>
              <Button 
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl px-5 h-9 flex items-center gap-2"
              >
                <Download size={15} />
                Print Statement Ledger
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
