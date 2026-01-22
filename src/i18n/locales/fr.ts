const fr = {
  translation: {
    // Common
    common: {
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      add: "Ajouter",
      search: "Rechercher",
      filter: "Filtrer",
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      confirm: "Confirmer",
      back: "Retour",
      next: "Suivant",
      previous: "Précédent",
      close: "Fermer",
      yes: "Oui",
      no: "Non",
      all: "Tous",
      none: "Aucun",
      actions: "Actions",
      status: "Statut",
      date: "Date",
      value: "Valeur",
      total: "Total",
      details: "Détails",
      export: "Exporter",
      import: "Importer",
      refresh: "Actualiser",
      copy: "Copier",
      copied: "Copié !",
    },

    // Navigation
    nav: {
      dashboard: "Tableau de bord",
      students: "Élèves",
      guardians: "Responsables",
      courses: "Cours",
      classes: "Classes",
      invoices: "Factures",
      payments: "Paiements",
      expenses: "Dépenses",
      reports: "Rapports",
      settings: "Paramètres",
      hr: "RH",
      school: "École",
      logout: "Déconnexion",
    },

    // Auth
    auth: {
      login: "Connexion",
      logout: "Déconnexion",
      email: "E-mail",
      password: "Mot de passe",
      forgotPassword: "Mot de passe oublié ?",
      register: "S'inscrire",
      noAccount: "Pas de compte ?",
      hasAccount: "Vous avez déjà un compte ?",
      invalidCredentials: "Identifiants invalides",
      sessionExpired: "Session expirée",
    },

    // Dashboard
    dashboard: {
      title: "Tableau de bord",
      welcome: "Bienvenue",
      totalStudents: "Total des Élèves",
      activeStudents: "Élèves Actifs",
      monthlyRevenue: "Revenus Mensuels",
      pendingInvoices: "Factures en Attente",
      overdueInvoices: "Factures en Retard",
      recentPayments: "Paiements Récents",
      financialSummary: "Résumé Financier",
    },

    // Students
    students: {
      title: "Élèves",
      addStudent: "Ajouter un Élève",
      editStudent: "Modifier l'Élève",
      studentName: "Nom de l'Élève",
      birthDate: "Date de Naissance",
      enrollmentDate: "Date d'Inscription",
      enrollmentStatus: "Statut d'Inscription",
      active: "Actif",
      inactive: "Inactif",
      suspended: "Suspendu",
      transferred: "Transféré",
      graduated: "Diplômé",
    },

    // Guardians
    guardians: {
      title: "Responsables",
      addGuardian: "Ajouter un Responsable",
      editGuardian: "Modifier le Responsable",
      guardianName: "Nom du Responsable",
      cpf: "N° Fiscal",
      phone: "Téléphone",
      email: "E-mail",
      address: "Adresse",
      relationship: "Lien de Parenté",
    },

    // Invoices
    invoices: {
      title: "Factures",
      addInvoice: "Nouvelle Facture",
      invoiceNumber: "Numéro de Facture",
      dueDate: "Date d'Échéance",
      issueDate: "Date d'Émission",
      amount: "Montant",
      discount: "Remise",
      interest: "Intérêts",
      fine: "Pénalité",
      status: {
        open: "Ouverte",
        paid: "Payée",
        overdue: "En Retard",
        cancelled: "Annulée",
        partial: "Partielle",
      },
      generatePayment: "Générer le Paiement",
      sendReminder: "Envoyer un Rappel",
    },

    // Payments
    payments: {
      title: "Paiements",
      paymentDate: "Date de Paiement",
      paymentMethod: "Mode de Paiement",
      methods: {
        pix: "PIX",
        boleto: "Prélèvement",
        creditCard: "Carte de Crédit",
        debitCard: "Carte de Débit",
        cash: "Espèces",
        transfer: "Virement",
      },
      receipt: "Reçu",
      sendReceipt: "Envoyer le Reçu",
    },

    // Settings
    settings: {
      title: "Paramètres",
      profile: "Profil",
      security: "Sécurité",
      preferences: "Préférences",
      billing: "Facturation",
      users: "Utilisateurs",
      integrations: "Intégrations",
      system: "Système",
      language: "Langue",
      theme: "Thème",
      darkMode: "Mode Sombre",
      lightMode: "Mode Clair",
      systemTheme: "Défaut du Système",
      notifications: "Notifications",
      emailNotifications: "Notifications par E-mail",
      browserNotifications: "Notifications du Navigateur",
      weeklyReport: "Rapport Hebdomadaire",
    },

    // Languages
    languages: {
      pt: "Português",
      en: "English",
      es: "Español",
      fr: "Français",
      de: "Deutsch",
    },

    // Errors
    errors: {
      generic: "Une erreur s'est produite. Veuillez réessayer.",
      notFound: "Page non trouvée",
      unauthorized: "Accès non autorisé",
      networkError: "Erreur de connexion",
      validationError: "Erreur de validation",
    },

    // Success messages
    success: {
      saved: "Enregistré avec succès !",
      deleted: "Supprimé avec succès !",
      updated: "Mis à jour avec succès !",
      created: "Créé avec succès !",
      copied: "Copié dans le presse-papiers !",
    },
  },
};

export default fr;
