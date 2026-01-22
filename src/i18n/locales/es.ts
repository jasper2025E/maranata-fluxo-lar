const es = {
  translation: {
    // Common
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      add: "Añadir",
      search: "Buscar",
      filter: "Filtrar",
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      confirm: "Confirmar",
      back: "Volver",
      next: "Siguiente",
      previous: "Anterior",
      close: "Cerrar",
      yes: "Sí",
      no: "No",
      all: "Todos",
      none: "Ninguno",
      actions: "Acciones",
      status: "Estado",
      date: "Fecha",
      value: "Valor",
      total: "Total",
      details: "Detalles",
      export: "Exportar",
      import: "Importar",
      refresh: "Actualizar",
      copy: "Copiar",
      copied: "¡Copiado!",
    },

    // Navigation
    nav: {
      dashboard: "Panel",
      students: "Alumnos",
      guardians: "Responsables",
      courses: "Cursos",
      classes: "Clases",
      invoices: "Facturas",
      payments: "Pagos",
      expenses: "Gastos",
      reports: "Informes",
      settings: "Configuración",
      hr: "RRHH",
      school: "Escuela",
      logout: "Salir",
    },

    // Auth
    auth: {
      login: "Iniciar sesión",
      logout: "Cerrar sesión",
      email: "Correo electrónico",
      password: "Contraseña",
      forgotPassword: "¿Olvidó su contraseña?",
      register: "Registrarse",
      noAccount: "¿No tiene una cuenta?",
      hasAccount: "¿Ya tiene una cuenta?",
      invalidCredentials: "Credenciales inválidas",
      sessionExpired: "Sesión expirada",
    },

    // Dashboard
    dashboard: {
      title: "Panel",
      welcome: "Bienvenido",
      totalStudents: "Total de Alumnos",
      activeStudents: "Alumnos Activos",
      monthlyRevenue: "Ingresos Mensuales",
      pendingInvoices: "Facturas Pendientes",
      overdueInvoices: "Facturas Vencidas",
      recentPayments: "Pagos Recientes",
      financialSummary: "Resumen Financiero",
    },

    // Students
    students: {
      title: "Alumnos",
      addStudent: "Añadir Alumno",
      editStudent: "Editar Alumno",
      studentName: "Nombre del Alumno",
      birthDate: "Fecha de Nacimiento",
      enrollmentDate: "Fecha de Matrícula",
      enrollmentStatus: "Estado de Matrícula",
      active: "Activo",
      inactive: "Inactivo",
      suspended: "Suspendido",
      transferred: "Transferido",
      graduated: "Graduado",
    },

    // Guardians
    guardians: {
      title: "Responsables",
      addGuardian: "Añadir Responsable",
      editGuardian: "Editar Responsable",
      guardianName: "Nombre del Responsable",
      cpf: "DNI/NIE",
      phone: "Teléfono",
      email: "Correo electrónico",
      address: "Dirección",
      relationship: "Parentesco",
    },

    // Invoices
    invoices: {
      title: "Facturas",
      addInvoice: "Nueva Factura",
      invoiceNumber: "Número de Factura",
      dueDate: "Fecha de Vencimiento",
      issueDate: "Fecha de Emisión",
      amount: "Importe",
      discount: "Descuento",
      interest: "Intereses",
      fine: "Multa",
      status: {
        open: "Abierta",
        paid: "Pagada",
        overdue: "Vencida",
        cancelled: "Cancelada",
        partial: "Parcial",
      },
      generatePayment: "Generar Cobro",
      sendReminder: "Enviar Recordatorio",
    },

    // Payments
    payments: {
      title: "Pagos",
      paymentDate: "Fecha de Pago",
      paymentMethod: "Método de Pago",
      methods: {
        pix: "PIX",
        boleto: "Recibo Bancario",
        creditCard: "Tarjeta de Crédito",
        debitCard: "Tarjeta de Débito",
        cash: "Efectivo",
        transfer: "Transferencia",
      },
      receipt: "Recibo",
      sendReceipt: "Enviar Recibo",
    },

    // Settings
    settings: {
      title: "Configuración",
      profile: "Perfil",
      security: "Seguridad",
      preferences: "Preferencias",
      billing: "Facturación",
      users: "Usuarios",
      integrations: "Integraciones",
      system: "Sistema",
      language: "Idioma",
      theme: "Tema",
      darkMode: "Modo Oscuro",
      lightMode: "Modo Claro",
      systemTheme: "Predeterminado del Sistema",
      notifications: "Notificaciones",
      emailNotifications: "Notificaciones por Correo",
      browserNotifications: "Notificaciones del Navegador",
      weeklyReport: "Informe Semanal",
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
      generic: "Ocurrió un error. Inténtelo de nuevo.",
      notFound: "Página no encontrada",
      unauthorized: "Acceso no autorizado",
      networkError: "Error de conexión",
      validationError: "Error de validación",
    },

    // Success messages
    success: {
      saved: "¡Guardado con éxito!",
      deleted: "¡Eliminado con éxito!",
      updated: "¡Actualizado con éxito!",
      created: "¡Creado con éxito!",
      copied: "¡Copiado al portapapeles!",
    },
  },
};

export default es;
