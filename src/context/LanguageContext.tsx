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
  "bulk upload": {
    en: "Bulk Upload",
    hi: "थोक अपलोड",
    es: "Carga Masiva",
    ar: "تحميل جماعي",
    fr: "Téléchargement en Masse",
    mr: "एकत्रित अपलोड"
  },
  "export": {
    en: "Export",
    hi: "निर्यात करें",
    es: "Exportar",
    ar: "تصدير",
    fr: "Exporter",
    mr: "निर्यात करा"
  },
  "add student record": {
    en: "Add Student Record",
    hi: "छात्र रिकॉर्ड जोड़ें",
    es: "Agregar Registro de Estudiante",
    ar: "إضافة سجل طالب",
    fr: "Ajouter un Dossier d'Étudiant",
    mr: "विद्यार्थी माहिती जोडा"
  },
  "add staff member": {
    en: "Add Staff Member",
    hi: "कर्मचारी सदस्य जोड़ें",
    es: "Agregar Miembro del Personal",
    ar: "إضافة عضو موظف",
    fr: "Ajouter un Membre du Personnel",
    mr: "नवीन कर्मचारी जोडा"
  },
  "filter by name, roll, or gr...": {
    en: "Filter by name, roll, or GR...",
    hi: "नाम, रोल या जीआर द्वारा फ़िल्टर करें...",
    es: "Filtrar por nombre, rol o GR...",
    ar: "البحث بالاسم أو رقم القيد...",
    fr: "Filtrer par nom, rôle ou GR...",
    mr: "नाव, रोल किंवा GR ने फिल्टर करा..."
  },
  "all standards": {
    en: "All Standards",
    hi: "सभी कक्षाएं",
    es: "Todos los Grados",
    ar: "جميع المستويات",
    fr: "Tous les Niveaux",
    mr: "सर्व इयत्ता"
  },
  "all divisions": {
    en: "All Divisions",
    hi: "सभी सेक्शन",
    es: "Todas las Divisiones",
    ar: "جميع الأقسام",
    fr: "Toutes les Divisions",
    mr: "सर्व तुकड्या"
  },
  "active registry records": {
    en: "Active Registry Records",
    hi: "सक्रिय रजिस्ट्री रिकॉर्ड",
    es: "Registros Activos",
    ar: "سجلات النشطة",
    fr: "Dossiers Actifs",
    mr: "सक्रिय नोंदणीकृत माहिती"
  },
  "registry #": {
    en: "Registry #",
    hi: "रजिस्ट्री संख्या",
    es: "Nº de Registro",
    ar: "رقم السجل",
    fr: "N° de Registre",
    mr: "नोंदणी क्र."
  },
  "roll": {
    en: "Roll",
    hi: "अनुक्रमांक",
    es: "Rol",
    ar: "رقم الحضور",
    fr: "Numéro",
    mr: "हजेरी क्र."
  },
  "profile information": {
    en: "Profile Information",
    hi: "प्रोफ़ाइल जानकारी",
    es: "Información de Perfil",
    ar: "معلومات الملف الشخصي",
    fr: "Informations de Profil",
    mr: "प्रोफाइल माहिती"
  },
  "placement": {
    en: "Placement",
    hi: "कक्षा/नियुक्ति",
    es: "Colocación",
    ar: "التسكين",
    fr: "Placement",
    mr: "इयत्ता/तुकडी"
  },
  "identity details": {
    en: "Identity Details",
    hi: "पहचान विवरण",
    es: "Detalles de Identidad",
    ar: "تفاصيل الهوية",
    fr: "Détails d'Identité",
    mr: "ओळख तपशील"
  },
  "academic status": {
    en: "Academic Status",
    hi: "शैक्षणिक स्थिति",
    es: "Estado Académico",
    ar: "الحالة الأكاديمية",
    fr: "Statut Académique",
    mr: "शैक्षणिक स्थिती"
  },
  "management": {
    en: "Management",
    hi: "प्रबंधन",
    es: "Gestión",
    ar: "الإدارة",
    fr: "Gestion",
    mr: "व्यवस्थापन"
  },
  "showing": {
    en: "Showing",
    hi: "दिखा रहा है",
    es: "Mostrando",
    ar: "عرض",
    fr: "Affichage",
    mr: "दर्शवित आहे"
  },
  "to": {
    en: "to",
    hi: "से",
    es: "a",
    ar: "إلى",
    fr: "à",
    mr: "ते"
  },
  "of": {
    en: "of",
    hi: "का/कुल",
    es: "de",
    ar: "من",
    fr: "sur",
    mr: "पैकी"
  },
  "entries": {
    en: "entries",
    hi: "प्रविष्टियाँ",
    es: "entradas",
    ar: "مدخلات",
    fr: "entrées",
    mr: "नोंदी"
  },
  "rows per page": {
    en: "Rows per page",
    hi: "प्रति पृष्ठ पंक्तियाँ",
    es: "Filas por página",
    ar: "عدد الصفوف",
    fr: "Lignes par page",
    mr: "प्रति पृष्ठ ओळी"
  },
  "page": {
    en: "Page",
    hi: "पृष्ठ",
    es: "Página",
    ar: "صفحة",
    fr: "Page",
    mr: "पृष्ठ"
  },
  "remove from registry": {
    en: "Remove from Registry",
    hi: "रजिस्ट्री से हटाएं",
    es: "Eliminar del Registro",
    ar: "إزالة من السجل",
    fr: "Retirer du Registre",
    mr: "नोंदणीतून काढा"
  },
  "active": {
    en: "Active",
    hi: "सक्रिय",
    es: "Activo",
    ar: "نشط",
    fr: "Actif",
    mr: "सक्रिय"
  },
  "on leave": {
    en: "On Leave",
    hi: "छुट्टी पर",
    es: "Licencia de ausencia",
    ar: "في إجازة",
    fr: "En Congé",
    mr: "रजेवर"
  },
  "resigned": {
    en: "Resigned",
    hi: "इस्तीफा दिया",
    es: "Resignado",
    ar: "مستقيل",
    fr: "Démissionnaire",
    mr: "राजीनामा दिला"
  },
  "home": {
    en: "Home",
    hi: "होम",
    es: "Inicio",
    ar: "الرئيسية",
    fr: "Accueil",
    mr: "मुख्यपृष्ठ"
  },
  "excel template": {
    en: "Excel Template",
    hi: "एक्सेल टेम्पलेट",
    es: "Plantilla Excel",
    ar: "نموذج إكسل",
    fr: "Modèle Excel",
    mr: "एक्सेल टेम्पलेट"
  },
  "upload progress": {
    en: "Upload Progress",
    hi: "अपलोड प्रगति",
    es: "Progreso de carga",
    ar: "تقدم التحميل",
    fr: "Progression du Téléchargement",
    mr: "अपलोड प्रगती"
  },
  "click to upload or drag and drop": {
    en: "Click to upload or drag and drop",
    hi: "अपलोड करने के लिए क्लिक करें या ड्रैग करें",
    es: "Haga clic para cargar o arrastrar y soltar",
    ar: "انقر للتحميل أو السحب والإفلات",
    fr: "Cliquez pour télécharger ou glisser-déposer",
    mr: "अपलोड करण्यासाठी क्लिक करा किंवा ड्रॅग करा"
  },
  "cancel": {
    en: "Cancel",
    hi: "रद्द करें",
    es: "Cancelar",
    ar: "إلغاء",
    fr: "Annuler",
    mr: "रद्द करा"
  },
  "submit": {
    en: "Submit",
    hi: "जमा करें",
    es: "Enviar",
    ar: "إرسال",
    fr: "Soumettre",
    mr: "सादर करा"
  },
  "save": {
    en: "Save",
    hi: "सहेजें",
    es: "Guardar",
    ar: "حفظ",
    fr: "Enregistrer",
    mr: "जतन करा"
  },
  "update": {
    en: "Update",
    hi: "अद्यतन करें",
    es: "Actualizar",
    ar: "تحديث",
    fr: "Mettre à jour",
    mr: "अद्यतनित करा"
  },
  "delete": {
    en: "Delete",
    hi: "हटाएं",
    es: "Eliminar",
    ar: "حذف",
    fr: "Supprimer",
    mr: "काढून टाका"
  },
  "actions": {
    en: "Actions",
    hi: "कार्रवाई",
    es: "Acciones",
    ar: "إجراءات",
    fr: "Actions",
    mr: "कृती"
  },
  "search": {
    en: "Search",
    hi: "खोजें",
    es: "Buscar",
    ar: "بحث",
    fr: "Rechercher",
    mr: "शोधा"
  },
  "details": {
    en: "Details",
    hi: "विवरण",
    es: "Detalles",
    ar: "تفاصيل",
    fr: "Détails",
    mr: "तपशील"
  },
  "status": {
    en: "Status",
    hi: "स्थिति",
    es: "Estado",
    ar: "الحالة",
    fr: "Statut",
    mr: "स्थिती"
  },
  "category": {
    en: "Category",
    hi: "श्रेणी",
    es: "Categoría",
    ar: "الفئة",
    fr: "Catégorie",
    mr: "वर्गवारी"
  },
  "date": {
    en: "Date",
    hi: "तारीख",
    es: "Fecha",
    ar: "التاريخ",
    fr: "Date",
    mr: "दिनांक"
  },
  "class": {
    en: "Class",
    hi: "कक्षा",
    es: "Clase",
    ar: "الفصل الدراسي",
    fr: "Classe",
    mr: "वर्ग"
  },
  "division": {
    en: "Division",
    hi: "प्रभाग",
    es: "División",
    ar: "الشعبة",
    fr: "Division",
    mr: "तुकडी"
  },
  "gender": {
    en: "Gender",
    hi: "लिंग",
    es: "Género",
    ar: "الجنس",
    fr: "Genre",
    mr: "लिंग"
  },
  "birth date": {
    en: "Birth Date",
    hi: "जन्म तिथि",
    es: "Fecha de Nacimiento",
    ar: "تاريخ الميلاد",
    fr: "Date de Naissance",
    mr: "जन्म तारीख"
  },
  "blood group": {
    en: "Blood Group",
    hi: "रक्त समूह",
    es: "Grupo Sanguíneo",
    ar: "فصيلة الدم",
    fr: "Groupe Sanguin",
    mr: "रक्तगट"
  },
  "admission date": {
    en: "Admission Date",
    hi: "प्रवेश तिथि",
    es: "Fecha de Admisión",
    ar: "تاريخ القبول",
    fr: "Date d'Admission",
    mr: "प्रवेश तारीख"
  },
  "roll number": {
    en: "Roll Number",
    hi: "अनुक्रमांक",
    es: "Número de Lista",
    ar: "رقم الحضور",
    fr: "Numéro d'Appel",
    mr: "हजेरी क्रमांक"
  },
  "parent name": {
    en: "Parent Name",
    hi: "अभिभावक का नाम",
    es: "Nombre del Padre/Madre",
    ar: "اسم ولي الأمر",
    fr: "Nom du Parent",
    mr: "पालकांचे नाव"
  },
  "mobile number": {
    en: "Mobile Number",
    hi: "मोबाइल नंबर",
    es: "Número de Móvil",
    ar: "رقم الجوال",
    fr: "Numéro de Mobile",
    mr: "मोबाईल क्रमांक"
  },
  "academic performance": {
    en: "Academic Performance",
    hi: "शैक्षणिक प्रदर्शन",
    es: "Rendimiento Académico",
    ar: "الأداء الأكاديمي",
    fr: "Rendement Académique",
    mr: "शैक्षणिक कामगिरी"
  },
  "weekly attendance": {
    en: "Weekly Attendance",
    hi: "साप्ताहिक उपस्थिति",
    es: "Asistencia Semanal",
    ar: "الحضور الأسبوعي",
    fr: "Présence Hebdomadaire",
    mr: "साप्ताहिक उपस्थिती"
  },
  "fee collection": {
    en: "Fee Collection",
    hi: "शुल्क संग्रह",
    es: "Recaudación de Tasas",
    ar: "جمع الرسوم",
    fr: "Collecte des Frais",
    mr: "शुल्क संकलन"
  },
  "recent announcements": {
    en: "Recent Announcements",
    hi: "हालिया घोषणाएं",
    es: "Anuncios Recientes",
    ar: "الإعلانات الأخيرة",
    fr: "Annonces Récentes",
    mr: "अलीकडील घोषणा"
  },
  "upcoming events": {
    en: "Upcoming Events",
    hi: "आगामी कार्यक्रम",
    es: "Próximos Eventos",
    ar: "الفعاليات القادمة",
    fr: "Événements À Venir",
    mr: "आगामी कार्यक्रम"
  },
  "independence day": {
    en: "Independence Day",
    hi: "स्वतंत्रता दिवस",
    es: "Día de la Independencia",
    ar: "عيد الاستقلال",
    fr: "Fête de l'Indépendance",
    mr: "स्वातंत्र्य दिन"
  },
  "christmas": {
    en: "Christmas",
    hi: "क्रिसमस",
    es: "Navidad",
    ar: "عيد الميلاد",
    fr: "Noël",
    mr: "नाताळ"
  },
  "system update": {
    en: "System Update",
    hi: "सिस्टम अपडेट",
    es: "Actualización del Sistema",
    ar: "تحديث النظام",
    fr: "Mise à jour du Système",
    mr: "प्रणाली अद्यतन"
  },
  "fee reminder": {
    en: "Fee Reminder",
    hi: "शुल्क अनुस्मारक",
    es: "Recordatorio de Pago",
    ar: "تذكير بالرسوم",
    fr: "Rappel de Frais",
    mr: "शुल्क स्मरणपत्र"
  },
  "annual sports day 2024": {
    en: "Annual Sports Day 2024",
    hi: "वार्षिक खेल दिवस 2024",
    es: "Día Anual de Deportes 2024",
    ar: "اليوم الرياضي السنوي 2024",
    fr: "Journée Annuelle des Sports 2024",
    mr: "वार्षिक क्रीडा दिन २०२४"
  },
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
    console.log("LanguageContext: Setting language to", lang);
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
    console.log("LanguageContext: Initial sync, retrieved language:", saved);
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

    // 1. Check static TRANSLATIONS dictionary exactly
    const staticEntry = TRANSLATIONS[key];
    if (staticEntry && staticEntry[language]) {
      return staticEntry[language];
    }

    // 1b. Robust static normalization:
    // Check if there is an exact case-insensitive match for the English string in TRANSLATIONS dictionary
    const normalizedText = textToTranslate.trim().toLowerCase();
    for (const entry of Object.values(TRANSLATIONS)) {
      if (entry && entry.en && entry.en.trim().toLowerCase() === normalizedText) {
        if (entry[language]) {
          return entry[language];
        }
      }
    }

    // Check key matches case-insensitively
    for (const [k, entry] of Object.entries(TRANSLATIONS)) {
      if (k.toLowerCase() === normalizedText) {
        if (entry[language]) {
          return entry[language];
        }
      }
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
                if (parent.closest("[data-no-translate]") || parent.closest(".no-translate")) {
                  return NodeFilter.FILTER_REJECT;
                }
                const textNode = node as any;
                if (textNode.__wasDOMTranslated || textNode.__originalText) {
                  return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
              }
            }
          );

          let node;
          while ((node = walker.nextNode())) {
            const textNode = node as any;
            if (textNode.__wasDOMTranslated && textNode.__originalText) {
              if (textNode.nodeValue !== textNode.__originalText) {
                textNode.nodeValue = textNode.__originalText;
              }
            }
            delete textNode.__wasDOMTranslated;
            delete textNode.__originalText;
            delete textNode.__lastTranslatedText;
          }

          // Restore input placeholders
          const inputs = document.querySelectorAll("input[placeholder], textarea[placeholder]");
          inputs.forEach((input: any) => {
            if (input.__wasDOMPlaceholderTranslated && input.__originalPlaceholder) {
              if (input.placeholder !== input.__originalPlaceholder) {
                input.placeholder = input.__originalPlaceholder;
              }
            }
            delete input.__wasDOMPlaceholderTranslated;
            delete input.__originalPlaceholder;
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
              if (parent.closest("[data-no-translate]") || parent.closest(".no-translate")) {
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
            delete textNode.__wasDOMTranslated;
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
            textNode.__wasDOMTranslated = true;
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
            input.__wasDOMPlaceholderTranslated = true;
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
