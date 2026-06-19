import React, { createContext, useContext, useState, useEffect } from "react";

export type LanguageCode = "en" | "hi" | "es" | "ar" | "fr";

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
    es: string;
    ar: string;
    fr: string;
  };
}

export const TRANSLATIONS: TranslationDictionary = {
  // Navigation / Sidebar Links
  dashboard: {
    en: "Dashboard",
    hi: "डैशबोर्ड",
    es: "Tablero",
    ar: "لوحة القيادة",
    fr: "Tableau de Bord"
  },
  studentRegistry: {
    en: "Student Registry",
    hi: "छात्र पंजीकरण",
    es: "Registro de Estudiantes",
    ar: "سجل الطلاب",
    fr: "Registre des Étudiants"
  },
  attendanceTracking: {
    en: "Attendance Tracking",
    hi: "उपस्थिति ट्रैकिंग",
    es: "Control de Asistencia",
    ar: "تتبع الحضور",
    fr: "Suivi de Présence"
  },
  examinationMarks: {
    en: "Examination & Marks",
    hi: "परीक्षा और अंक",
    es: "Exámenes y Calificaciones",
    ar: "الامتحانات والدرجات",
    fr: "Examens & Notes"
  },
  staffDirectory: {
    en: "Staff Directory",
    hi: "कर्मचारी निर्देशिका",
    es: "Directorio de Personal",
    ar: "دليل الموظفين",
    fr: "Annuaire du Personnel"
  },
  manageUsers: {
    en: "Manage Users",
    hi: "उपयोगकर्ता प्रबंधन",
    es: "Gestionar Usuarios",
    ar: "إدارة المستخدمين",
    fr: "Gérer les Utilisateurs"
  },
  feeManagement: {
    en: "Fee Management",
    hi: "शुल्क प्रबंधन",
    es: "Gestión de Tasas",
    ar: "إدارة الرسوم",
    fr: "Gestion des Frais"
  },
  communicationHub: {
    en: "Communication Hub",
    hi: "संचार केंद्र",
    es: "Centro de Comunicación",
    ar: "مركز الاتصالات",
    fr: "Centre de Communication"
  },
  mastersConfig: {
    en: "Masters & Config",
    hi: "मास्टर्स और कॉन्फ़िगरेशन",
    es: "Maestros y Configuración",
    ar: "الإعدادات الأساسية",
    fr: "Configurations Globales"
  },

  // Common UI Actions / User Controls
  language: {
    en: "Language",
    hi: "भाषा",
    es: "Idioma",
    ar: "اللغة",
    fr: "Langue"
  },
  selectLanguage: {
    en: "Select Language",
    hi: "भाषा चुनें",
    es: "Seleccionar Idioma",
    ar: "اختر اللغة",
    fr: "Choisir la Langue"
  },
  settings: {
    en: "Settings",
    hi: "सेटिंग्स",
    es: "Ajustes",
    ar: "الإعدادات",
    fr: "Paramètres"
  },
  myAccount: {
    en: "My Account",
    hi: "मेरा खाता",
    es: "Mi Cuenta",
    ar: "حسابي",
    fr: "Mon Compte"
  },
  logout: {
    en: "Logout",
    hi: "लॉगआउट",
    es: "Cerrar Sesión",
    ar: "تسجيل الخروج",
    fr: "Déconnexion"
  },
  searchPlaceholder: {
    en: "Search students, classes...",
    hi: "छात्रों, कक्षाओं की खोज करें...",
    es: "Buscar estudiantes, clases...",
    ar: "البحث عن الطلاب والفصول...",
    fr: "Rechercher des étudiants, classes..."
  },
  notifications: {
    en: "Notifications",
    hi: "सूचनाएं",
    es: "Notificaciones",
    ar: "الإشعارات",
    fr: "Notifications"
  },

  // Dashboard specifics
  welcomeBack: {
    en: "Welcome back",
    hi: "आपका स्वागत है",
    es: "Bienvenido de nuevo",
    ar: "مرحباً بك مجدداً",
    fr: "Bon retour"
  },
  overviewStats: {
    en: "Overview Stats",
    hi: "अवलोकन आंकड़े",
    es: "Estadísticas Generales",
    ar: "الاحصائيات العامة",
    fr: "Statistiques Globales"
  },
  totalStudents: {
    en: "Total Students",
    hi: "कुल छात्र",
    es: "Total Estudiantes",
    ar: "إجمالي الطلاب",
    fr: "Total Étudiants"
  },
  presentToday: {
    en: "Present Today",
    hi: "आज उपस्थित",
    es: "Presentes Hoy",
    ar: "الحاضرون اليوم",
    fr: "Présents Aujourd'hui"
  },
  activeEmployees: {
    en: "Active Employees",
    hi: "सक्रिय कर्मचारी",
    es: "Empleados Activos",
    ar: "الموظفون النشطون",
    fr: "Employés Actifs"
  },
  attendanceRate: {
    en: "Attendance Rate",
    hi: "उपस्थिति दर",
    es: "Tasa de Asistencia",
    ar: "نسبة الحضور",
    fr: "Taux de Présence"
  },
  viewDetails: {
    en: "View Details",
    hi: "विवरण देखें",
    es: "Ver Detalles",
    ar: "عرض التفاصيل",
    fr: "Voir les Détails"
  },
  schoolStatus: {
    en: "School Status",
    hi: "स्कूल की स्थिति",
    es: "Estado de la Escuela",
    ar: "حالة المدرسة",
    fr: "Statut de l'École"
  },
  activeSession: {
    en: "Active Session",
    hi: "सक्रिय सत्र",
    es: "Sesión Activa",
    ar: "الجلسة النشطة",
    fr: "Session Active"
  },
  quickActions: {
    en: "Quick Actions",
    hi: "त्वरित कार्रवाई",
    es: "Acciones Rápidas",
    ar: "إجراءات سريعة",
    fr: "Actions Rapides"
  },

  // Attendance Tabs
  rollCall: {
    en: "Roll Call",
    hi: "रोल कॉल",
    es: "Pase de Lista",
    ar: "سجل الحضور اليومي",
    fr: "Appel"
  },
  manualUpload: {
    en: "Manual Upload",
    hi: "मैन्युअल अपलोड",
    es: "Carga Manual",
    ar: "تحميل يدوي",
    fr: "Téléchargement Manuel"
  },
  leavesRegister: {
    en: "Leaves Register",
    hi: "छुट्टी रजिस्टर",
    es: "Registro de Permisos",
    ar: "سجل الإجازات",
    fr: "Registre des Congés"
  }
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem("system_preferred_language");
    return (saved as LanguageCode) || "en";
  });

  const setLanguage = (lang: LanguageCode) => {
    setLangState(lang);
    localStorage.setItem("system_preferred_language", lang);

    // Apply RTL / LTR dynamically depending on language choice (especially for Arabic 'ar')
    if (lang === "ar") {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    // Initial sync
    const saved = localStorage.getItem("system_preferred_language") as LanguageCode;
    if (saved) {
      setLanguage(saved);
    }
  }, []);

  const t = (key: string): string => {
    const translation = TRANSLATIONS[key];
    if (!translation) return key;
    return translation[language] || translation["en"] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider context");
  }
  return context;
};
