import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

// Define the shape of our customized labels
export interface SystemLabels {
  student: string;
  students: string;
  staff: string;
  staffs: string;
  standard: string;
  section: string;
  grNo: string;
  rollNo: string;
  employeeId: string;
  academicYear: string;
}

// Default labels config list
const DEFAULT_LABELS: SystemLabels = {
  student: "Student",
  students: "Students",
  staff: "Staff/Faculty",
  staffs: "Staff & Faculty",
  standard: "Class/Standard",
  section: "Section/Division",
  grNo: "GR No",
  rollNo: "Roll No",
  employeeId: "Employee Code",
  academicYear: "Academic Year",
};

interface LabelContextType {
  labels: SystemLabels;
  loading: boolean;
  updateLabels: (newValues: Partial<SystemLabels>) => Promise<boolean>;
  resetLabels: () => Promise<boolean>;
}

const LabelContext = createContext<LabelContextType | undefined>(undefined);

export const LabelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [labels, setLabels] = useState<SystemLabels>(() => {
    // Immediate local cache lookup for zero-flicker loading
    const cached = localStorage.getItem("system_custom_labels");
    if (cached) {
      try {
        return { ...DEFAULT_LABELS, ...JSON.parse(cached) };
      } catch (e) {
        return DEFAULT_LABELS;
      }
    }
    return DEFAULT_LABELS;
  });
  const [loading, setLoading] = useState(true);

  // Synchronize with the Microsoft SQL Server database labels endpoint
  useEffect(() => {
    const fetchLabelsFromDb = async () => {
      try {
        // Fetch API URL safely from environment settings
        const baseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/systemlabels`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const fetched: Partial<SystemLabels> = {};
            data.forEach((item: any) => {
              if (item.key && item.customizedValue) {
                fetched[item.key as keyof SystemLabels] = item.customizedValue;
              }
            });

            const merged = { ...DEFAULT_LABELS, ...fetched } as SystemLabels;
            setLabels(merged);
            localStorage.setItem("system_custom_labels", JSON.stringify(merged));
          }
        }
      } catch (error) {
        console.warn("Retrying database custom labels fetch. Falling back to local offline cache configuration.", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLabelsFromDb();
  }, []);

  const updateLabels = async (newValues: Partial<SystemLabels>): Promise<boolean> => {
    const nextLabels = { ...labels, ...newValues };
    setLabels(nextLabels);
    localStorage.setItem("system_custom_labels", JSON.stringify(nextLabels));

    try {
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
      
      // Map to backend entity structure
      const payload = Object.entries(nextLabels).map(([key, val]) => ({
        key,
        defaultValue: DEFAULT_LABELS[key as keyof SystemLabels] || val,
        customizedValue: val,
        category: getCategoryForKey(key)
      }));

      const res = await fetch(`${baseUrl}/systemlabels/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("System taxonomy labels updated permanently in SQL Database");
        return true;
      } else {
        toast.error("Saved locally. Background sync to SQL Server returned status: " + res.status);
        return false;
      }
    } catch (err) {
      console.error("Failed to commit label updates to server", err);
      toast.warning("Labels updated locally, but background update to .NET database failed. Offline mode active.");
      return true;
    }
  };

  const resetLabels = async (): Promise<boolean> => {
    setLabels(DEFAULT_LABELS);
    localStorage.removeItem("system_custom_labels");

    try {
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/systemlabels/reset`, {
        method: "POST",
      });

      if (res.ok) {
        toast.info("Taxonomy labels reset back to industry default standards");
        return true;
      }
    } catch (err) {
      console.error("Restoring defaults failed", err);
    }
    toast.info("Database reset failed; local taxonomy restored");
    return true;
  };

  return (
    <LabelContext.Provider value={{ labels, loading, updateLabels, resetLabels }}>
      {children}
    </LabelContext.Provider>
  );
};

export const useSystemLabels = () => {
  const context = useContext(LabelContext);
  if (context === undefined) {
    throw new Error("useSystemLabels must be used within a LabelProvider context");
  }
  return context;
};

// Helper utility to group taxonomy values
function getCategoryForKey(key: string): string {
  switch (key) {
    case "student":
    case "students":
      return "Student Records";
    case "staff":
    case "staffs":
      return "Staff Records";
    case "standard":
    case "section":
    case "academicYear":
      return "Academic Structure";
    default:
      return "General Identifiers";
  }
}
