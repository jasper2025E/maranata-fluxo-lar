const en = {
  translation: {
    // Common
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      search: "Search",
      filter: "Filter",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      confirm: "Confirm",
      back: "Back",
      next: "Next",
      previous: "Previous",
      close: "Close",
      yes: "Yes",
      no: "No",
      all: "All",
      none: "None",
      actions: "Actions",
      status: "Status",
      date: "Date",
      value: "Value",
      total: "Total",
      details: "Details",
      export: "Export",
      import: "Import",
      refresh: "Refresh",
      copy: "Copy",
      copied: "Copied!",
    },

    // Navigation
    nav: {
      dashboard: "Dashboard",
      students: "Students",
      guardians: "Guardians",
      courses: "Courses",
      classes: "Classes",
      invoices: "Invoices",
      payments: "Payments",
      expenses: "Expenses",
      reports: "Reports",
      settings: "Settings",
      hr: "HR",
      school: "School",
      logout: "Logout",
    },

    // Auth
    auth: {
      login: "Login",
      logout: "Logout",
      email: "Email",
      password: "Password",
      forgotPassword: "Forgot password?",
      register: "Register",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      invalidCredentials: "Invalid credentials",
      sessionExpired: "Session expired",
    },

    // Dashboard
    dashboard: {
      title: "Dashboard",
      welcome: "Welcome",
      totalStudents: "Total Students",
      activeStudents: "Active Students",
      monthlyRevenue: "Monthly Revenue",
      pendingInvoices: "Pending Invoices",
      overdueInvoices: "Overdue Invoices",
      recentPayments: "Recent Payments",
      financialSummary: "Financial Summary",
    },

    // Students
    students: {
      title: "Students",
      addStudent: "Add Student",
      editStudent: "Edit Student",
      studentName: "Student Name",
      birthDate: "Birth Date",
      enrollmentDate: "Enrollment Date",
      enrollmentStatus: "Enrollment Status",
      active: "Active",
      inactive: "Inactive",
      suspended: "Suspended",
      transferred: "Transferred",
      graduated: "Graduated",
    },

    // Guardians
    guardians: {
      title: "Guardians",
      addGuardian: "Add Guardian",
      editGuardian: "Edit Guardian",
      guardianName: "Guardian Name",
      cpf: "Tax ID",
      phone: "Phone",
      email: "Email",
      address: "Address",
      relationship: "Relationship",
    },

    // Invoices
    invoices: {
      title: "Invoices",
      addInvoice: "New Invoice",
      invoiceNumber: "Invoice Number",
      dueDate: "Due Date",
      issueDate: "Issue Date",
      amount: "Amount",
      discount: "Discount",
      interest: "Interest",
      fine: "Fine",
      status: {
        open: "Open",
        paid: "Paid",
        overdue: "Overdue",
        cancelled: "Cancelled",
        partial: "Partial",
      },
      generatePayment: "Generate Payment",
      sendReminder: "Send Reminder",
    },

    // Payments
    payments: {
      title: "Payments",
      paymentDate: "Payment Date",
      paymentMethod: "Payment Method",
      methods: {
        pix: "PIX",
        boleto: "Bank Slip",
        creditCard: "Credit Card",
        debitCard: "Debit Card",
        cash: "Cash",
        transfer: "Transfer",
      },
      receipt: "Receipt",
      sendReceipt: "Send Receipt",
    },

    // Settings
    settings: {
      title: "Settings",
      profile: "Profile",
      security: "Security",
      preferences: "Preferences",
      billing: "Billing",
      users: "Users",
      integrations: "Integrations",
      system: "System",
      language: "Language",
      theme: "Theme",
      darkMode: "Dark Mode",
      lightMode: "Light Mode",
      systemTheme: "System Default",
      notifications: "Notifications",
      emailNotifications: "Email Notifications",
      browserNotifications: "Browser Notifications",
      weeklyReport: "Weekly Report",
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
      generic: "An error occurred. Please try again.",
      notFound: "Page not found",
      unauthorized: "Unauthorized access",
      networkError: "Connection error",
      validationError: "Validation error",
    },

    // Success messages
    success: {
      saved: "Saved successfully!",
      deleted: "Deleted successfully!",
      updated: "Updated successfully!",
      created: "Created successfully!",
      copied: "Copied to clipboard!",
    },
  },
};

export default en;
