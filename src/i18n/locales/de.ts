const de = {
  translation: {
    // Common
    common: {
      save: "Speichern",
      cancel: "Abbrechen",
      delete: "Löschen",
      edit: "Bearbeiten",
      add: "Hinzufügen",
      search: "Suchen",
      filter: "Filtern",
      loading: "Laden...",
      error: "Fehler",
      success: "Erfolg",
      confirm: "Bestätigen",
      back: "Zurück",
      next: "Weiter",
      previous: "Zurück",
      close: "Schließen",
      yes: "Ja",
      no: "Nein",
      all: "Alle",
      none: "Keine",
      actions: "Aktionen",
      status: "Status",
      date: "Datum",
      value: "Wert",
      total: "Gesamt",
      details: "Details",
      export: "Exportieren",
      import: "Importieren",
      refresh: "Aktualisieren",
      copy: "Kopieren",
      copied: "Kopiert!",
    },

    // Navigation
    nav: {
      dashboard: "Dashboard",
      students: "Schüler",
      guardians: "Erziehungsberechtigte",
      courses: "Kurse",
      classes: "Klassen",
      invoices: "Rechnungen",
      payments: "Zahlungen",
      expenses: "Ausgaben",
      reports: "Berichte",
      settings: "Einstellungen",
      hr: "Personal",
      school: "Schule",
      logout: "Abmelden",
    },

    // Auth
    auth: {
      login: "Anmelden",
      logout: "Abmelden",
      email: "E-Mail",
      password: "Passwort",
      forgotPassword: "Passwort vergessen?",
      register: "Registrieren",
      noAccount: "Kein Konto?",
      hasAccount: "Bereits ein Konto?",
      invalidCredentials: "Ungültige Anmeldedaten",
      sessionExpired: "Sitzung abgelaufen",
    },

    // Dashboard
    dashboard: {
      title: "Dashboard",
      welcome: "Willkommen",
      totalStudents: "Gesamtschüler",
      activeStudents: "Aktive Schüler",
      monthlyRevenue: "Monatliche Einnahmen",
      pendingInvoices: "Ausstehende Rechnungen",
      overdueInvoices: "Überfällige Rechnungen",
      recentPayments: "Letzte Zahlungen",
      financialSummary: "Finanzübersicht",
    },

    // Students
    students: {
      title: "Schüler",
      addStudent: "Schüler hinzufügen",
      editStudent: "Schüler bearbeiten",
      studentName: "Schülername",
      birthDate: "Geburtsdatum",
      enrollmentDate: "Einschreibungsdatum",
      enrollmentStatus: "Einschreibungsstatus",
      active: "Aktiv",
      inactive: "Inaktiv",
      suspended: "Suspendiert",
      transferred: "Versetzt",
      graduated: "Abgeschlossen",
    },

    // Guardians
    guardians: {
      title: "Erziehungsberechtigte",
      addGuardian: "Erziehungsberechtigten hinzufügen",
      editGuardian: "Erziehungsberechtigten bearbeiten",
      guardianName: "Name des Erziehungsberechtigten",
      cpf: "Steuer-ID",
      phone: "Telefon",
      email: "E-Mail",
      address: "Adresse",
      relationship: "Verwandtschaft",
    },

    // Invoices
    invoices: {
      title: "Rechnungen",
      addInvoice: "Neue Rechnung",
      invoiceNumber: "Rechnungsnummer",
      dueDate: "Fälligkeitsdatum",
      issueDate: "Ausstellungsdatum",
      amount: "Betrag",
      discount: "Rabatt",
      interest: "Zinsen",
      fine: "Strafe",
      status: {
        open: "Offen",
        paid: "Bezahlt",
        overdue: "Überfällig",
        cancelled: "Storniert",
        partial: "Teilweise",
      },
      generatePayment: "Zahlung generieren",
      sendReminder: "Erinnerung senden",
    },

    // Payments
    payments: {
      title: "Zahlungen",
      paymentDate: "Zahlungsdatum",
      paymentMethod: "Zahlungsmethode",
      methods: {
        pix: "PIX",
        boleto: "Banküberweisung",
        creditCard: "Kreditkarte",
        debitCard: "Debitkarte",
        cash: "Bargeld",
        transfer: "Überweisung",
      },
      receipt: "Quittung",
      sendReceipt: "Quittung senden",
    },

    // Settings
    settings: {
      title: "Einstellungen",
      profile: "Profil",
      security: "Sicherheit",
      preferences: "Einstellungen",
      billing: "Abrechnung",
      users: "Benutzer",
      integrations: "Integrationen",
      system: "System",
      language: "Sprache",
      theme: "Design",
      darkMode: "Dunkelmodus",
      lightMode: "Hellmodus",
      systemTheme: "Systemstandard",
      notifications: "Benachrichtigungen",
      emailNotifications: "E-Mail-Benachrichtigungen",
      browserNotifications: "Browser-Benachrichtigungen",
      weeklyReport: "Wöchentlicher Bericht",
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
      generic: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
      notFound: "Seite nicht gefunden",
      unauthorized: "Unbefugter Zugriff",
      networkError: "Verbindungsfehler",
      validationError: "Validierungsfehler",
    },

    // Success messages
    success: {
      saved: "Erfolgreich gespeichert!",
      deleted: "Erfolgreich gelöscht!",
      updated: "Erfolgreich aktualisiert!",
      created: "Erfolgreich erstellt!",
      copied: "In die Zwischenablage kopiert!",
    },
  },
};

export default de;
