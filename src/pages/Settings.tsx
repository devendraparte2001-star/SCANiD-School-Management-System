import { useState, useEffect } from "react";
import { User as UserType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  Settings as SettingsIcon, 
  Monitor, 
  ShieldCheck, 
  Languages, 
  Mail,
  Smartphone,
  Globe,
  Database,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Trash
} from "lucide-react";
import { toast } from "sonner";
import { useSystemLabels, SystemLabels } from "@/context/LabelContext";
import { useLanguage } from "@/context/LanguageContext";

interface SettingsProps {
  user: UserType;
}

export default function Settings({ user }: SettingsProps) {
  const { labels, updateLabels, resetLabels } = useSystemLabels();
  const { language, setLanguage, t } = useLanguage();
  const [localLabels, setLocalLabels] = useState<SystemLabels>({ ...labels });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalLabels({ ...labels });
  }, [labels]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 150 * 1024) {
        toast.error("Please select a smaller logo image (under 150KB) for optimal performance.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalLabels((prev) => ({
          ...prev,
          logoImage: reader.result as string,
        }));
        toast.success("New brand logo image selected and loaded successfully.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearLogoImage = () => {
    setLocalLabels((prev) => ({
      ...prev,
      logoImage: "",
    }));
    toast.info("Base64 visual logo cleared. Reverted back to custom premium styled text logo.");
  };

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weeklyReport: false,
    studentActivity: true,
  });

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  const handleSaveTaxonomy = async () => {
    setIsSaving(true);
    try {
      const success = await updateLabels(localLabels);
      if (success) {
        toast.success("System taxonomy & branding configurations updated successfully");
      }
    } catch (err) {
      toast.error("Failed to post configuration to backend API context");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetTaxonomy = async () => {
    if (window.confirm("Are you sure you want to reset all label overrides back to standard default names?")) {
      const success = await resetLabels();
      if (success) {
        toast.info("System labels reset to default values");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-slate-900 p-4 rounded-[1.25rem] text-white shadow-2xl shadow-slate-200 transition-transform hover:rotate-3">
             <SettingsIcon size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">System Settings</h1>
            <p className="text-slate-400 font-bold mt-1 text-xs sm:text-sm uppercase tracking-widest leading-none">Manage your system configurations and personal preferences.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full flex flex-col md:flex-row gap-8">
        <TabsList className="flex md:flex-col items-start justify-start bg-transparent h-auto p-0 gap-1 md:w-64 shrink-0 overflow-x-auto pb-2 md:pb-0">
          <TabsTrigger 
            value="general" 
            className="w-full justify-start gap-3 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-slate-100 transition-all text-sm font-medium"
          >
            <SettingsIcon size={18} /> General
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="w-full justify-start gap-3 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-slate-100 transition-all text-sm font-medium"
          >
            <Bell size={18} /> Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="appearance" 
            className="w-full justify-start gap-3 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-slate-100 transition-all text-sm font-medium"
          >
            <Monitor size={18} /> Appearance
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="w-full justify-start gap-3 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-slate-100 transition-all text-sm font-medium"
          >
            <ShieldCheck size={18} /> Data & Privacy
          </TabsTrigger>
          <TabsTrigger 
            value="taxonomy" 
            className="w-full justify-start gap-3 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-slate-100 transition-all text-sm font-medium"
          >
            <Sliders size={18} /> System Taxonomies
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
          <TabsContent value="general" className="space-y-6 m-0 animate-in fade-in duration-300">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">{t("language")}</CardTitle>
              <CardDescription>Customize how the platform appears for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <Languages size={16} className="text-blue-500" />
                    {t("language")}
                  </div>
                  <p className="text-xs text-slate-500">{t("selectLanguage")}</p>
                </div>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 cursor-pointer shadow-sm transition-all"
                >
                  <option value="en">English (US)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="ar">العربية (Arabic)</option>
                  <option value="fr">Français (French)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-medium">
                    <Globe size={16} className="text-slate-400" />
                    Timezone
                  </div>
                  <p className="text-xs text-slate-500">Standard timezone for all scheduling</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1 text-sm font-medium">UTC+05:30 (IST)</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-850">
                <Sliders className="text-blue-600" size={20} />
                Portal Branding & Customization
              </CardTitle>
              <CardDescription>
                Customize dynamic company texts, login headers, sub-badges, and visual brand logo images globally.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Brand Identity Texts */}
                <div className="space-y-4 border border-slate-100 p-4 rounded-xl bg-white shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Brand Identity Labels</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Logo Primary Text</Label>
                      <Input 
                        value={localLabels.logoTextPrimary || ""}
                        onChange={(e) => setLocalLabels({ ...localLabels, logoTextPrimary: e.target.value })}
                        placeholder="e.g. SCAN"
                        className="h-10 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Logo Accent Suffix</Label>
                      <Input 
                        value={localLabels.logoTextSecondary || ""}
                        onChange={(e) => setLocalLabels({ ...localLabels, logoTextSecondary: e.target.value })}
                        placeholder="e.g. iD"
                        className="h-10 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Corporate Subtitle Badge</Label>
                    <Input 
                      value={localLabels.logoSubtitle || ""}
                      onChange={(e) => setLocalLabels({ ...localLabels, logoSubtitle: e.target.value })}
                      placeholder="e.g. SCANID SYSTEMS PVT. LTD."
                      className="h-10 text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Login Page Customizer */}
                <div className="space-y-4 border border-slate-100 p-4 rounded-xl bg-white shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Login Card Overrides</h3>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Login Greeting Header</Label>
                    <Input 
                      value={localLabels.loginHeading || ""}
                      onChange={(e) => setLocalLabels({ ...localLabels, loginHeading: e.target.value })}
                      placeholder="e.g. Member Login"
                      className="h-10 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Portal Subheading / Description</Label>
                    <Input 
                      value={localLabels.loginSubtext || ""}
                      onChange={(e) => setLocalLabels({ ...localLabels, loginSubtext: e.target.value })}
                      placeholder="e.g. Institutional Multi-Branch Control Portal"
                      className="h-10 text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Corporate Visual Image Logo */}
                <div className="space-y-4 border border-slate-100 p-4 rounded-xl md:col-span-2 bg-white shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Corporate Visual Image Logo</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Upload a high-quality visual PNG, JPG, or SVG image logo to replace the default typographic "SCANiD" styled text logo globally in both Left Sidebar Header and Login card panels.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-xl">
                    {/* Preview box */}
                    <div className="w-24 h-24 bg-slate-900 border border-slate-850 rounded-2xl flex items-center justify-center p-2.5 relative shrink-0 shadow-inner">
                      {localLabels.logoImage ? (
                        <img 
                          src={localLabels.logoImage} 
                          alt="Custom logo preview" 
                          className="max-h-full max-w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-center">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Standard</p>
                          <p className="text-xs font-extrabold text-blue-500">{localLabels.logoTextPrimary || "SCAN"}{localLabels.logoTextSecondary || "iD"}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-9 font-semibold bg-white border-slate-200 shadow-sm"
                          onClick={() => document.getElementById("branding-logo-file")?.click()}
                        >
                          Select Image Logo
                        </Button>
                        {localLabels.logoImage && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-9 font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={handleClearLogoImage}
                          >
                            Reset to Default Text
                          </Button>
                        )}
                      </div>
                      <input 
                        type="file" 
                        id="branding-logo-file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        * Supports PNG, SVG, or JPEG files. Recommended height: 48px to 100px. Standard fallback text will be utilized otherwise.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button 
                  onClick={handleSaveTaxonomy} 
                  className="bg-blue-600 hover:bg-blue-700 text-xs gap-1.5 shadow-sm font-semibold rounded-lg h-9 px-4"
                  disabled={isSaving}
                >
                  {isSaving && <RefreshCw size={14} className="animate-spin" />}
                  <CheckCircle2 size={14} /> Deploy Branding & Image Config
                </Button>
              </div>

            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">System Access</CardTitle>
              <CardDescription>Managed by {user.schoolName || "System Admin"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-4 items-start">
                <ShieldCheck className="text-blue-600 shrink-0" size={20} />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-blue-900">Your role provides specific dashboard permissions</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Some settings are locked by the school administrator. Please contact IT support if you need to change restricted configurations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 m-0">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Notification Channels</CardTitle>
              <CardDescription>Choose how you want to be alerted about updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1 space-y-1">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Mail size={16} className="text-slate-400" /> Email Notifications
                  </Label>
                  <p className="text-sm text-slate-500 leading-relaxed">Receive updates about system maintenance and weekly summaries.</p>
                </div>
                <Switch 
                  checked={notifications.email} 
                  onCheckedChange={(v) => setNotifications({...notifications, email: v})} 
                />
              </div>
              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1 space-y-1">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Smartphone size={16} className="text-slate-400" /> Mobile App Push
                  </Label>
                  <p className="text-sm text-slate-500 leading-relaxed">Get real-time alerts on your mobile device for student attendance.</p>
                </div>
                <Switch 
                  checked={notifications.push} 
                  onCheckedChange={(v) => setNotifications({...notifications, push: v})} 
                />
              </div>
              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1 space-y-1">
                  <Label className="flex items-center gap-2 font-semibold text-blue-600">
                    <Database size={16} /> Automated Backups
                  </Label>
                  <p className="text-sm text-slate-500 leading-relaxed">System-wide data backup completion alerts.</p>
                </div>
                <Switch checked={true} disabled />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 m-0">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Visual Preferences</CardTitle>
              <CardDescription>Customize the interface to your comfortable working environment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex flex-col gap-3 p-4 border-2 border-blue-500 bg-blue-50 rounded-xl text-left">
                  <div className="w-full aspect-video bg-white border border-slate-200 rounded-lg p-2 flex flex-col gap-1">
                    <div className="h-2 w-1/2 bg-slate-200 rounded"></div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="h-4 bg-slate-100 rounded"></div>
                      <div className="h-4 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-blue-900">Light Mode</p>
                    <p className="text-xs text-blue-600">Default bright theme</p>
                  </div>
                </button>
                <button className="flex flex-col gap-3 p-4 border border-slate-200 bg-white rounded-xl text-left hover:border-slate-300 transition-colors">
                  <div className="w-full aspect-video bg-slate-900 rounded-lg p-2 flex flex-col gap-1">
                    <div className="h-2 w-1/2 bg-slate-700 rounded"></div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="h-4 bg-slate-800 rounded"></div>
                      <div className="h-4 bg-slate-800 rounded"></div>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">Dark Mode</p>
                    <p className="text-xs text-slate-500">Coming soon</p>
                  </div>
                </button>
                <button className="flex flex-col gap-3 p-4 border border-slate-200 bg-white rounded-xl text-left hover:border-slate-300 transition-colors">
                  <div className="w-full aspect-video bg-gradient-to-br from-slate-100 to-slate-900 rounded-lg p-2 flex flex-col gap-1">
                    <div className="h-2 w-1/2 bg-slate-400 rounded"></div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="h-4 bg-slate-500 rounded opacity-50"></div>
                      <div className="h-4 bg-slate-500 rounded opacity-50"></div>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">System</p>
                    <p className="text-xs text-slate-500">Sync with OS</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 m-0 animate-in fade-in duration-300">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Data & Privacy</CardTitle>
              <CardDescription>Manage how your data is handled and stored</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-semibold">Activity Logs</h4>
                    <p className="text-xs text-slate-500">Store history of all your system interactions</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-semibold">Public Profile Visibility</h4>
                    <p className="text-xs text-slate-500">Allow other school administrators to find your profile</p>
                  </div>
                  <Switch checked={false} />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 italic text-xs text-slate-400">
                Last data export was performed on May 1st, 2024.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxonomy" className="space-y-6 m-0 animate-in fade-in duration-300">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sliders className="text-blue-600" size={20} />
                White-Label System Taxonomies & Custom Naming
              </CardTitle>
              <CardDescription>
                Configure standard terms (e.g. Class, Section, Student, Employee) to align with your organization's system guidelines.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl mb-4">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">💡 Professional Superadmin Guidance</h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Modify the customized labels below. These overrides will propagate globally to update the main sidebar, filters, list headings, reports labels, and registration registers across the school workspace.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Academic Structure Category */}
                <div className="space-y-4 border border-slate-100 p-4 rounded-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Structure</h3>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Class / Standard (Singular)</Label>
                    <Input 
                      value={localLabels.standard}
                      onChange={(e) => setLocalLabels({ ...localLabels, standard: e.target.value })}
                      placeholder="e.g. Class, Grade, Standard"
                      className="h-10 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Section / Division (Singular)</Label>
                    <Input 
                      value={localLabels.section}
                      onChange={(e) => setLocalLabels({ ...localLabels, section: e.target.value })}
                      placeholder="e.g. Section, Division, Batch"
                      className="h-10 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Academic Year Label</Label>
                    <Input 
                      value={localLabels.academicYear}
                      onChange={(e) => setLocalLabels({ ...localLabels, academicYear: e.target.value })}
                      placeholder="e.g. Academic Year, Session"
                      className="h-10 text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Target Demographics */}
                <div className="space-y-4 border border-slate-100 p-4 rounded-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Roles & Roster Naming</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Student (Singular)</Label>
                      <Input 
                        value={localLabels.student}
                        onChange={(e) => setLocalLabels({ ...localLabels, student: e.target.value })}
                        placeholder="e.g. Student, Pupil, Learner"
                        className="h-10 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Students (Plural)</Label>
                      <Input 
                        value={localLabels.students}
                        onChange={(e) => setLocalLabels({ ...localLabels, students: e.target.value })}
                        placeholder="e.g. Students, Pupils, Learners"
                        className="h-10 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Staff / Faculty (Singular)</Label>
                      <Input 
                        value={localLabels.staff}
                        onChange={(e) => setLocalLabels({ ...localLabels, staff: e.target.value })}
                        placeholder="e.g. Staff, Teacher, Instructor"
                        className="h-10 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Staff & Faculty (Plural)</Label>
                      <Input 
                        value={localLabels.staffs}
                        onChange={(e) => setLocalLabels({ ...localLabels, staffs: e.target.value })}
                        placeholder="e.g. Staff & Faculty, Employees"
                        className="h-10 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Identifiers */}
                <div className="space-y-4 border border-slate-100 p-4 rounded-xl md:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Unique Identifiers</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">GR No / Admission ID Label</Label>
                      <Input 
                        value={localLabels.grNo}
                        onChange={(e) => setLocalLabels({ ...localLabels, grNo: e.target.value })}
                        placeholder="e.g. GR No, Admission ID, Reg No"
                        className="h-10 text-xs bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Roll No / Seat ID Label</Label>
                      <Input 
                        value={localLabels.rollNo}
                        onChange={(e) => setLocalLabels({ ...localLabels, rollNo: e.target.value })}
                        placeholder="e.g. Roll No, Seat No, Index"
                        className="h-10 text-xs bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Employee ID / Staff Code Label</Label>
                      <Input 
                        value={localLabels.employeeId}
                        onChange={(e) => setLocalLabels({ ...localLabels, employeeId: e.target.value })}
                        placeholder="e.g. Employee ID, Staff Code, Biometric ID"
                        className="h-10 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-3">
                <Button 
                  onClick={handleResetTaxonomy} 
                  variant="outline" 
                  className="text-xs text-rose-600 hover:text-rose-700 border-rose-100 hover:bg-rose-50 hover:border-rose-200 gap-1.5 shrink-0"
                >
                  <Trash size={14} /> Restore Default Settings
                </Button>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveTaxonomy} 
                    className="bg-blue-600 hover:bg-blue-700 text-xs gap-1.5 shadow-sm font-semibold rounded-lg h-9 px-4"
                    disabled={isSaving}
                  >
                    {isSaving && <RefreshCw size={14} className="animate-spin" />}
                    <CheckCircle2 size={14} /> Deploy System-Wide Naming Config
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </Tabs>
    </div>
  );
}
