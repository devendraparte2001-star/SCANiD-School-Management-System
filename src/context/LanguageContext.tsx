import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type LanguageCode = "en" | "hi" | "es" | "ar" | "fr" | "mr";

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
    es: string;
    ar: string;
    fr: string;
    mr: string;
  };
}

export const TRANSLATIONS: TranslationDictionary = {
  // Navigation / Sidebar Links
  dashboard: {
    en: "Dashboard",
    hi: "डैशबोर्ड",
    es: "Tablero",
    ar: "لوحة القيادة",
    fr: "Tableau de Bord",
    mr: "डॅशबोर्ड"
  },
  studentRegistry: {
    en: "Student Registry",
    hi: "छात्र पंजीकरण",
    es: "Registro de Estudiantes",
    ar: "سجل الطلاب",
    fr: "Registre des Étudiants",
    mr: "विद्यार्थी नोंदणी"
  },
  attendanceTracking: {
    en: "Attendance Tracking",
    hi: "उपस्थिति ट्रैकिंग",
    es: "Control de Asistencia",
    ar: "تتبع الحضور",
    fr: "Suivi de Présence",
    mr: "हजेरी मागोवा"
  },
  examinationMarks: {
    en: "Examination & Marks",
    hi: "परीक्षा और अंक",
    es: "Exámenes y Calificaciones",
    ar: "الامتحانات والدرجات",
    fr: "Examens & Notes",
    mr: "परीक्षा आणि गुण"
  },
  staffDirectory: {
    en: "Staff Directory",
    hi: "कर्मचारी निर्देशिका",
    es: "Directorio de Personal",
    ar: "دليل الموظفين",
    fr: "Annuaire du Personnel",
    mr: "कर्मचारी निर्देशिका"
  },
  manageUsers: {
    en: "Manage Users",
    hi: "उपयोगकर्ता प्रबंधन",
    es: "Gestionar Usuarios",
    ar: "إدارة المستخدمين",
    fr: "Gérer les Utilisateurs",
    mr: "वापरकर्ता व्यवस्थापन"
  },
  feeManagement: {
    en: "Fee Management",
    hi: "शुल्क प्रबंधन",
    es: "Gestión de Tasas",
    ar: "إدارة الرسوم",
    fr: "Gestion des Frais",
    mr: "शुल्क व्यवस्थापन"
  },
  communicationHub: {
    en: "Communication Hub",
    hi: "संचार केंद्र",
    es: "Centro de Comunicación",
    ar: "مركز الاتصالات",
    fr: "Centre de Communication",
    mr: "संवाद केंद्र"
  },
  mastersConfig: {
    en: "Masters & Config",
    hi: "मास्टर्स और कॉन्फ़िगरेशन",
    es: "Maestros y Configuración",
    ar: "الإعدادات الأساسية",
    fr: "Configurations Globales",
    mr: "मास्टर्स आणि कॉन्फिगरेशन"
  },

  // Common UI Actions / User Controls
  language: {
    en: "Language",
    hi: "भाषा",
    es: "Idioma",
    ar: "اللغة",
    fr: "Langue",
    mr: "भाषा"
  },
  selectLanguage: {
    en: "Select Language",
    hi: "भाषा चुनें",
    es: "Seleccionar Idioma",
    ar: "اختر اللغة",
    fr: "Choisir la Langue",
    mr: "भाषा निवडा"
  },
  settings: {
    en: "Settings",
    hi: "सेटिंग्स",
    es: "Ajustes",
    ar: "الإعدادات",
    fr: "Paramètres",
    mr: "सेटिंग्ज"
  },
  myAccount: {
    en: "My Account",
    hi: "मेरा खाता",
    es: "Mi Cuenta",
    ar: "حسابي",
    fr: "Mon Compte",
    mr: "माझे खाते"
  },
  logout: {
    en: "Logout",
    hi: "लॉगआउट",
    es: "Cerrar Sesión",
    ar: "تسجيل الخروج",
    fr: "Déconnexion",
    mr: "लॉगआउट"
  },
  searchPlaceholder: {
    en: "Search students, classes...",
    hi: "छात्रों, कक्षाओं की खोज करें...",
    es: "Buscar estudiantes, clases...",
    ar: "البحث عن الطلاب والفصول...",
    fr: "Rechercher des étudiants, classes...",
    mr: "विद्यार्थी, वर्ग शोधा..."
  },
  notifications: {
    en: "Notifications",
    hi: "सूचनाएं",
    es: "Notificaciones",
    ar: "الإشعارات",
    fr: "Notifications",
    mr: "सूचना"
  },

  // Dashboard specifics
  welcomeBack: {
    en: "Welcome back",
    hi: "आपका स्वागत है",
    es: "Bienvenido de nuevo",
    ar: "मرحباً بك مجدداً",
    fr: "Bon retour",
    mr: "पुन्हा आपले स्वागत आहे"
  },
  overviewStats: {
    en: "Overview Stats",
    hi: "अवलोकन आंकड़े",
    es: "Estadísticas Generales",
    ar: "الاحصائيات العامة",
    fr: "Statistiques Globales",
    mr: "आकडेवारीचे विहंगावलोकन"
  },
  totalStudents: {
    en: "Total Students",
    hi: "कुल छात्र",
    es: "Total Estudiantes",
    ar: "إجمالي الطلاب",
    fr: "Total Étudiants",
    mr: "एकूण विद्यार्थी"
  },
  presentToday: {
    en: "Present Today",
    hi: "आज उपस्थित",
    es: "Presentes Hoy",
    ar: "الحاضرون اليوم",
    fr: "Présents Aujourd'hui",
    mr: "आज उपस्थित"
  },
  activeEmployees: {
    en: "Active Employees",
    hi: "सक्रिय कर्मचारी",
    es: "Empleados Activos",
    ar: "الموظفون النشطون",
    fr: "Employés Actifs",
    mr: "सक्रिय कर्मचारी"
  },
  attendanceRate: {
    en: "Attendance Rate",
    hi: "उपस्थिति दर",
    es: "Tasa de Asistencia",
    ar: "نسبة الحضور",
    fr: "Taux de Présence",
    mr: "हजेरीचे प्रमाण"
  },
  viewDetails: {
    en: "View Details",
    hi: "विवरण देखें",
    es: "Ver Detalles",
    ar: "عرض التفاصيل",
    fr: "Voir les Détails",
    mr: "तपशील पहा"
  },
  schoolStatus: {
    en: "School Status",
    hi: "स्कूल की स्थिति",
    es: "Estado de la Escuela",
    ar: "حالة المدرسة",
    fr: "Statut de l'École",
    mr: "शाळेची स्थिती"
  },
  activeSession: {
    en: "Active Session",
    hi: "सक्रिय सत्र",
    es: "Sesión Activa",
    ar: "الجلسة النشطة",
    fr: "Session Active",
    mr: "सक्रिय सत्र"
  },
  quickActions: {
    en: "Quick Actions",
    hi: "त्वरित कार्रवाई",
    es: "Acciones Rápidas",
    ar: "إجراءات سريعة",
    fr: "Actions Rapides",
    mr: "त्वरित कृती"
  },

  // Attendance Tabs
  rollCall: {
    en: "Roll Call",
    hi: "रोल कॉल",
    es: "Pase de Lista",
    ar: "سجل الحضور اليومي",
    fr: "Appel",
    mr: "रोल कॉल"
  },
  manualUpload: {
    en: "Manual Upload",
    hi: "मैन्युअल अपलोड",
    es: "Carga Manual",
    ar: "تحميل يدوي",
    fr: "Téléchargement Manuel",
    mr: "मॅन्युअल अपलोड"
  },
  leavesRegister: {
    en: "Leaves Register",
    hi: "छुट्टी रजिस्टर",
    es: "Registro de Permisos",
    ar: "سجل الإجازات",
    fr: "Registre des Congés",
    mr: "रजा नोंदणी"
  }
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem("system_preferred_language");
    return (saved as LanguageCode) || "en";
  });

  const [dynamicTranslations, setDynamicTranslations] = useState<Record<string, string>>({});
  const activeFetches = useRef<Set<string>>(new Set());

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

  const fetchTranslation = async (text: string, lang: string) => {
    const cacheKey = `t_${lang}_${text}`;
    if (activeFetches.current.has(cacheKey)) return;
    activeFetches.current.add(cacheKey);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang: lang }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.translation) {
          localStorage.setItem(cacheKey, data.translation);
          setDynamicTranslations(prev => ({
            ...prev,
            [cacheKey]: data.translation
          }));
        }
      }
    } catch (err) {
      console.error("Failed to translate dynamically:", err);
    } finally {
      activeFetches.current.delete(cacheKey);
    }
  };

  const t = (key: string, defaultText?: string): string => {
    const textToTranslate = defaultText || key;
    if (!textToTranslate) return "";

    // 1. Check static TRANSLATIONS dictionary
    const staticEntry = TRANSLATIONS[key];
    if (staticEntry && staticEntry[language]) {
      return staticEntry[language];
    }

    // If English, return immediately
    if (language === "en") {
      return textToTranslate;
    }

    // 2. Check in-memory/state dynamic cache
    const cacheKey = `t_${language}_${textToTranslate}`;
    if (dynamicTranslations[cacheKey]) {
      return dynamicTranslations[cacheKey];
    }

    // 3. Check localStorage persistent cache
    const cachedVal = localStorage.getItem(cacheKey);
    if (cachedVal) {
      // cache in-memory to prevent future lookup slowdown
      dynamicTranslations[cacheKey] = cachedVal;
      return cachedVal;
    }

    // 4. Fallback to server-side translation using Gemini in background
    fetchTranslation(textToTranslate, language);

    return textToTranslate;
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
