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
  academicOperations: {
    en: "Academic Operations",
    hi: "अकादमिक संचालन",
    es: "Operaciones Académicas",
    ar: "العمليات الأكاديمية",
    fr: "Opérations Académiques",
    mr: "शैक्षणिक प्रक्रिया"
  },
  staffHR: {
    en: "Staff & HR",
    hi: "कर्मचारी और एचआर",
    es: "Personal y Recursos Humanos",
    ar: "الموظفين والموارد البشرية",
    fr: "Personnel & RH",
    mr: "कर्मचारी आणि मनुष्यबळ"
  },
  administrative: {
    en: "Administrative",
    hi: "प्रशासकीय",
    es: "Administrativo",
    ar: "إداري",
    fr: "Administratif",
    mr: "प्रशासकीय"
  },
  superadmin: {
    en: "Super Admin",
    hi: "सुपर एडमिन",
    es: "Súper Administrador",
    ar: "المسؤول الأعلى",
    fr: "Super Administrateur",
    mr: "मुख्य प्रशासक"
  },
  admin: {
    en: "Admin",
    hi: "एडमिन",
    es: "Administrador",
    ar: "مسؤول",
    fr: "Administrateur",
    mr: "प्रशासक"
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

  const queue = useRef<{ text: string; lang: string; cacheKey: string }[]>([]);
  const batchTimeout = useRef<any>(null);
  const translateTimeout = useRef<any>(null);

  const processTranslationBatch = async () => {
    if (queue.current.length === 0) return;

    const currentQueue = [...queue.current];
    queue.current = [];

    const langGroups: Record<string, typeof currentQueue> = {};
    currentQueue.forEach(item => {
      if (!langGroups[item.lang]) {
        langGroups[item.lang] = [];
      }
      if (!langGroups[item.lang].some(x => x.text === item.text)) {
        langGroups[item.lang].push(item);
      }
    });

    for (const [targetLang, items] of Object.entries(langGroups)) {
      if (items.length === 0) continue;

      const chunkSize = 30;
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const texts = chunk.map(item => item.text);

        try {
          const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts, targetLang }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.translations && Array.isArray(data.translations)) {
              const updates: Record<string, string> = {};
              chunk.forEach((item, index) => {
                const translated = data.translations[index] || item.text;
                localStorage.setItem(item.cacheKey, translated);
                updates[item.cacheKey] = translated;
              });

              setDynamicTranslations(prev => ({
                ...prev,
                ...updates
              }));
            }
          }
        } catch (err) {
          console.error("Failed to translate dynamically via batch:", err);
        } finally {
          chunk.forEach(item => {
            activeFetches.current.delete(item.cacheKey);
          });
        }
      }
    }
  };

  const fetchTranslation = (text: string, lang: string) => {
    const cacheKey = `t_${lang}_${text}`;
    if (activeFetches.current.has(cacheKey)) return;
    activeFetches.current.add(cacheKey);

    queue.current.push({ text, lang, cacheKey });

    if (batchTimeout.current) {
      clearTimeout(batchTimeout.current);
    }
    batchTimeout.current = setTimeout(() => {
      processTranslationBatch();
    }, 150);
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
      dynamicTranslations[cacheKey] = cachedVal;
      return cachedVal;
    }

    // 4. Fallback to server-side translation using Gemini in background
    fetchTranslation(textToTranslate, language);

    return textToTranslate;
  };

  // Automated System-Wide localization engine
  useEffect(() => {
    let isTranslating = false;

    const translateDOM = () => {
      if (isTranslating) return;
      isTranslating = true;
      observer.disconnect();

      try {
        if (language === "en") {
          // Restore all translated text nodes to their original English values
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const tag = parent.tagName;
                if (["SCRIPT", "STYLE", "SVG", "PATH", "CODE", "TEXTAREA"].includes(tag)) {
                  return NodeFilter.FILTER_REJECT;
                }
                if ((node as any).__originalText) {
                  return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
              }
            }
          );

          let node;
          while ((node = walker.nextNode())) {
            const textNode = node as any;
            if (textNode.__originalText && textNode.nodeValue !== textNode.__originalText) {
              textNode.nodeValue = textNode.__originalText;
              delete textNode.__lastTranslatedText;
            }
          }

          // Restore input placeholders
          const inputs = document.querySelectorAll("input[placeholder], textarea[placeholder]");
          inputs.forEach((input: any) => {
            if (input.__originalPlaceholder && input.placeholder !== input.__originalPlaceholder) {
              input.placeholder = input.__originalPlaceholder;
            }
          });
          return;
        }

        // Translate all text nodes
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              const tag = parent.tagName;
              if (["SCRIPT", "STYLE", "SVG", "PATH", "CODE", "TEXTAREA"].includes(tag)) {
                return NodeFilter.FILTER_REJECT;
              }
              const val = node.nodeValue?.trim();
              if (!val || val.length < 2 || /^[0-9\s\-_.:,;+*&%#@!%()\[\]{}]*$/.test(val)) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        let node;
        while ((node = walker.nextNode())) {
          const textNode = node as any;
          const currentVal = textNode.nodeValue;
          if (!currentVal || !currentVal.trim()) continue;

          // If the text value changed outside our translator (e.g., React updating DOM or page transition), 
          // we treat the new value as the new original text.
          if (textNode.__lastTranslatedText && currentVal !== textNode.__lastTranslatedText) {
            textNode.__originalText = currentVal;
          }

          if (!textNode.__originalText) {
            textNode.__originalText = currentVal;
          }

          const origText = textNode.__originalText.trim();
          const translated = t(origText);

          if (translated && translated !== origText && textNode.nodeValue !== translated) {
            const leadingWhitespace = textNode.__originalText.match(/^\s*/)?.[0] || "";
            const trailingWhitespace = textNode.__originalText.match(/\s*$/)?.[0] || "";
            textNode.nodeValue = leadingWhitespace + translated + trailingWhitespace;
            textNode.__lastTranslatedText = textNode.nodeValue;
          }
        }

        // Translate input & textarea placeholders automatically
        const inputs = document.querySelectorAll("input[placeholder], textarea[placeholder]");
        inputs.forEach((input: any) => {
          const currentPlaceholder = input.placeholder?.trim();
          if (!currentPlaceholder) return;

          if (!input.__originalPlaceholder) {
            input.__originalPlaceholder = input.placeholder;
          }

          const origPlaceholder = input.__originalPlaceholder.trim();
          const translated = t(origPlaceholder);
          if (translated && translated !== origPlaceholder && input.placeholder !== translated) {
            input.placeholder = translated;
          }
        });
      } catch (err) {
        console.error("DOM translation error:", err);
      } finally {
        isTranslating = false;
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
    };

    // Trigger translateDOM of mutations with clean debouncing
    const observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          shouldTranslate = true;
          break;
        }
        if (mutation.type === "characterData") {
          const textNode = mutation.target as any;
          const val = textNode.nodeValue?.trim();
          if (val && val !== textNode.__lastTranslatedText) {
            shouldTranslate = true;
            break;
          }
        }
      }

      if (shouldTranslate) {
        if (translateTimeout.current) {
          clearTimeout(translateTimeout.current);
        }
        translateTimeout.current = setTimeout(translateDOM, 100);
      }
    });

    // Run initial translation
    translateDOM();

    return () => {
      observer.disconnect();
      if (translateTimeout.current) {
        clearTimeout(translateTimeout.current);
      }
    };
  }, [language, dynamicTranslations]);

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
