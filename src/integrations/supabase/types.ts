export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alunos: {
        Row: {
          created_at: string | null
          curso_id: string
          data_matricula: string
          data_nascimento: string | null
          desconto_percentual: number | null
          email_responsavel: string | null
          endereco: string | null
          id: string
          nome_completo: string
          observacoes: string | null
          responsavel_id: string | null
          status_matricula: Database["public"]["Enums"]["aluno_status"] | null
          telefone_responsavel: string | null
          turma_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          curso_id: string
          data_matricula?: string
          data_nascimento?: string | null
          desconto_percentual?: number | null
          email_responsavel?: string | null
          endereco?: string | null
          id?: string
          nome_completo: string
          observacoes?: string | null
          responsavel_id?: string | null
          status_matricula?: Database["public"]["Enums"]["aluno_status"] | null
          telefone_responsavel?: string | null
          turma_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          curso_id?: string
          data_matricula?: string
          data_nascimento?: string | null
          desconto_percentual?: number | null
          email_responsavel?: string | null
          endereco?: string | null
          id?: string
          nome_completo?: string
          observacoes?: string | null
          responsavel_id?: string | null
          status_matricula?: Database["public"]["Enums"]["aluno_status"] | null
          telefone_responsavel?: string | null
          turma_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      api_request_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          endpoint: string
          error_message: string | null
          id: string
          ip_address: string | null
          method: string
          request_body: Json | null
          response_body: Json | null
          status_code: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method: string
          request_body?: Json | null
          response_body?: Json | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          request_body?: Json | null
          response_body?: Json | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          acao: string
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          registro_id: string | null
          tabela: string
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          registro_id?: string | null
          tabela: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          registro_id?: string | null
          tabela?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cargos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          salario_base: number
          setor_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          salario_base?: number
          setor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          salario_base?: number
          setor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cargos_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          ativo: boolean | null
          carga_horaria: number | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          documento_url: string | null
          funcionario_id: string
          id: string
          observacoes: string | null
          salario: number
          tipo: Database["public"]["Enums"]["contrato_tipo"]
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          carga_horaria?: number | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          documento_url?: string | null
          funcionario_id: string
          id?: string
          observacoes?: string | null
          salario: number
          tipo?: Database["public"]["Enums"]["contrato_tipo"]
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          carga_horaria?: number | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          documento_url?: string | null
          funcionario_id?: string
          id?: string
          observacoes?: string | null
          salario?: number
          tipo?: Database["public"]["Enums"]["contrato_tipo"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          duracao_meses: number
          id: string
          mensalidade: number
          nivel: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          duracao_meses?: number
          id?: string
          mensalidade: number
          nivel: string
          nome: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          duracao_meses?: number
          id?: string
          mensalidade?: number
          nivel?: string
          nome?: string
        }
        Relationships: []
      }
      despesas: {
        Row: {
          categoria: string
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          id: string
          observacoes: string | null
          paga: boolean | null
          recorrente: boolean | null
          titulo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          observacoes?: string | null
          paga?: boolean | null
          recorrente?: boolean | null
          titulo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          observacoes?: string | null
          paga?: boolean | null
          recorrente?: boolean | null
          titulo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      escola: {
        Row: {
          ano_letivo: number
          cnpj: string | null
          created_at: string | null
          desconto_pontualidade_percentual: number | null
          dias_carencia_juros: number | null
          dias_desconto_pontualidade: number | null
          email: string | null
          endereco: string | null
          id: string
          juros_percentual_diario_padrao: number | null
          juros_percentual_mensal_padrao: number | null
          logo_url: string | null
          multa_fixa_padrao: number | null
          multa_percentual_padrao: number | null
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ano_letivo?: number
          cnpj?: string | null
          created_at?: string | null
          desconto_pontualidade_percentual?: number | null
          dias_carencia_juros?: number | null
          dias_desconto_pontualidade?: number | null
          email?: string | null
          endereco?: string | null
          id?: string
          juros_percentual_diario_padrao?: number | null
          juros_percentual_mensal_padrao?: number | null
          logo_url?: string | null
          multa_fixa_padrao?: number | null
          multa_percentual_padrao?: number | null
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ano_letivo?: number
          cnpj?: string | null
          created_at?: string | null
          desconto_pontualidade_percentual?: number | null
          dias_carencia_juros?: number | null
          dias_desconto_pontualidade?: number | null
          email?: string | null
          endereco?: string | null
          id?: string
          juros_percentual_diario_padrao?: number | null
          juros_percentual_mensal_padrao?: number | null
          logo_url?: string | null
          multa_fixa_padrao?: number | null
          multa_percentual_padrao?: number | null
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fatura_descontos: {
        Row: {
          condicao: string | null
          created_at: string | null
          created_by: string | null
          descricao: string
          fatura_id: string
          id: string
          percentual: number | null
          tipo: string
          valor: number | null
          valor_aplicado: number
        }
        Insert: {
          condicao?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao: string
          fatura_id: string
          id?: string
          percentual?: number | null
          tipo: string
          valor?: number | null
          valor_aplicado: number
        }
        Update: {
          condicao?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string
          fatura_id?: string
          id?: string
          percentual?: number | null
          tipo?: string
          valor?: number | null
          valor_aplicado?: number
        }
        Relationships: [
          {
            foreignKeyName: "fatura_descontos_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
        ]
      }
      fatura_documentos: {
        Row: {
          created_at: string | null
          created_by: string | null
          fatura_id: string
          id: string
          nome: string
          tipo: string
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          fatura_id: string
          id?: string
          nome: string
          tipo: string
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          fatura_id?: string
          id?: string
          nome?: string
          tipo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fatura_documentos_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
        ]
      }
      fatura_historico: {
        Row: {
          acao: string
          created_at: string | null
          created_by: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          fatura_id: string
          id: string
          ip_address: string | null
          motivo: string | null
          user_agent: string | null
          versao: number
        }
        Insert: {
          acao: string
          created_at?: string | null
          created_by?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          fatura_id: string
          id?: string
          ip_address?: string | null
          motivo?: string | null
          user_agent?: string | null
          versao: number
        }
        Update: {
          acao?: string
          created_at?: string | null
          created_by?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          fatura_id?: string
          id?: string
          ip_address?: string | null
          motivo?: string | null
          user_agent?: string | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "fatura_historico_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
        ]
      }
      fatura_itens: {
        Row: {
          centro_custo: string | null
          created_at: string | null
          created_by: string | null
          desconto_aplicado: number | null
          desconto_percentual: number | null
          desconto_valor: number | null
          descricao: string
          fatura_id: string
          id: string
          ordem: number | null
          quantidade: number
          subtotal: number
          valor_final: number
          valor_unitario: number
        }
        Insert: {
          centro_custo?: string | null
          created_at?: string | null
          created_by?: string | null
          desconto_aplicado?: number | null
          desconto_percentual?: number | null
          desconto_valor?: number | null
          descricao: string
          fatura_id: string
          id?: string
          ordem?: number | null
          quantidade?: number
          subtotal: number
          valor_final: number
          valor_unitario: number
        }
        Update: {
          centro_custo?: string | null
          created_at?: string | null
          created_by?: string | null
          desconto_aplicado?: number | null
          desconto_percentual?: number | null
          desconto_valor?: number | null
          descricao?: string
          fatura_id?: string
          id?: string
          ordem?: number | null
          quantidade?: number
          subtotal?: number
          valor_final?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "fatura_itens_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
        ]
      }
      faturas: {
        Row: {
          aluno_id: string
          ano_referencia: number
          asaas_billing_type: string | null
          asaas_boleto_barcode: string | null
          asaas_boleto_url: string | null
          asaas_due_date: string | null
          asaas_invoice_url: string | null
          asaas_payment_id: string | null
          asaas_pix_payload: string | null
          asaas_pix_qrcode: string | null
          asaas_status: string | null
          bloqueada: boolean | null
          cancelada_em: string | null
          cancelada_por: string | null
          codigo_sequencial: string | null
          created_at: string | null
          created_by: string | null
          curso_id: string
          data_emissao: string
          data_vencimento: string
          desconto_motivo: string | null
          desconto_percentual: number | null
          desconto_valor: number | null
          dias_atraso: number | null
          id: string
          juros: number | null
          juros_percentual_diario: number | null
          juros_percentual_mensal: number | null
          mes_referencia: number
          motivo_cancelamento: string | null
          multa: number | null
          payment_url: string | null
          responsavel_id: string | null
          saldo_restante: number | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
          updated_by: string | null
          valor: number
          valor_bruto: number | null
          valor_desconto_aplicado: number | null
          valor_juros_aplicado: number | null
          valor_liquido: number | null
          valor_multa_aplicado: number | null
          valor_original: number | null
          valor_total: number | null
          versao: number | null
        }
        Insert: {
          aluno_id: string
          ano_referencia: number
          asaas_billing_type?: string | null
          asaas_boleto_barcode?: string | null
          asaas_boleto_url?: string | null
          asaas_due_date?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_pix_payload?: string | null
          asaas_pix_qrcode?: string | null
          asaas_status?: string | null
          bloqueada?: boolean | null
          cancelada_em?: string | null
          cancelada_por?: string | null
          codigo_sequencial?: string | null
          created_at?: string | null
          created_by?: string | null
          curso_id: string
          data_emissao?: string
          data_vencimento: string
          desconto_motivo?: string | null
          desconto_percentual?: number | null
          desconto_valor?: number | null
          dias_atraso?: number | null
          id?: string
          juros?: number | null
          juros_percentual_diario?: number | null
          juros_percentual_mensal?: number | null
          mes_referencia: number
          motivo_cancelamento?: string | null
          multa?: number | null
          payment_url?: string | null
          responsavel_id?: string | null
          saldo_restante?: number | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor: number
          valor_bruto?: number | null
          valor_desconto_aplicado?: number | null
          valor_juros_aplicado?: number | null
          valor_liquido?: number | null
          valor_multa_aplicado?: number | null
          valor_original?: number | null
          valor_total?: number | null
          versao?: number | null
        }
        Update: {
          aluno_id?: string
          ano_referencia?: number
          asaas_billing_type?: string | null
          asaas_boleto_barcode?: string | null
          asaas_boleto_url?: string | null
          asaas_due_date?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_pix_payload?: string | null
          asaas_pix_qrcode?: string | null
          asaas_status?: string | null
          bloqueada?: boolean | null
          cancelada_em?: string | null
          cancelada_por?: string | null
          codigo_sequencial?: string | null
          created_at?: string | null
          created_by?: string | null
          curso_id?: string
          data_emissao?: string
          data_vencimento?: string
          desconto_motivo?: string | null
          desconto_percentual?: number | null
          desconto_valor?: number | null
          dias_atraso?: number | null
          id?: string
          juros?: number | null
          juros_percentual_diario?: number | null
          juros_percentual_mensal?: number | null
          mes_referencia?: number
          motivo_cancelamento?: string | null
          multa?: number | null
          payment_url?: string | null
          responsavel_id?: string | null
          saldo_restante?: number | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor?: number
          valor_bruto?: number | null
          valor_desconto_aplicado?: number | null
          valor_juros_aplicado?: number | null
          valor_liquido?: number | null
          valor_multa_aplicado?: number | null
          valor_original?: number | null
          valor_total?: number | null
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "faturas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faturas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faturas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      folha_pagamento: {
        Row: {
          adicional_noturno: number | null
          adicional_periculosidade: number | null
          ano_referencia: number
          bonificacoes: number | null
          created_at: string | null
          data_pagamento: string | null
          descontos: number | null
          despesa_id: string | null
          faltas_atrasos: number | null
          fgts: number | null
          funcionario_id: string
          horas_extras_valor: number | null
          id: string
          inss: number | null
          irrf: number | null
          mes_referencia: number
          observacoes: string | null
          outros_adicionais: number | null
          pago: boolean | null
          salario_base: number
          total_bruto: number
          total_liquido: number
          updated_at: string | null
        }
        Insert: {
          adicional_noturno?: number | null
          adicional_periculosidade?: number | null
          ano_referencia: number
          bonificacoes?: number | null
          created_at?: string | null
          data_pagamento?: string | null
          descontos?: number | null
          despesa_id?: string | null
          faltas_atrasos?: number | null
          fgts?: number | null
          funcionario_id: string
          horas_extras_valor?: number | null
          id?: string
          inss?: number | null
          irrf?: number | null
          mes_referencia: number
          observacoes?: string | null
          outros_adicionais?: number | null
          pago?: boolean | null
          salario_base: number
          total_bruto: number
          total_liquido: number
          updated_at?: string | null
        }
        Update: {
          adicional_noturno?: number | null
          adicional_periculosidade?: number | null
          ano_referencia?: number
          bonificacoes?: number | null
          created_at?: string | null
          data_pagamento?: string | null
          descontos?: number | null
          despesa_id?: string | null
          faltas_atrasos?: number | null
          fgts?: number | null
          funcionario_id?: string
          horas_extras_valor?: number | null
          id?: string
          inss?: number | null
          irrf?: number | null
          mes_referencia?: number
          observacoes?: string | null
          outros_adicionais?: number | null
          pago?: boolean | null
          salario_base?: number
          total_bruto?: number
          total_liquido?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folha_pagamento_despesa_id_fkey"
            columns: ["despesa_id"]
            isOneToOne: false
            referencedRelation: "despesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folha_pagamento_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionario_documentos: {
        Row: {
          created_at: string | null
          funcionario_id: string
          id: string
          nome: string
          tipo: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          funcionario_id: string
          id?: string
          nome: string
          tipo?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          funcionario_id?: string
          id?: string
          nome?: string
          tipo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionario_documentos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionario_turmas: {
        Row: {
          created_at: string | null
          funcionario_id: string
          id: string
          materia: string | null
          turma_id: string
        }
        Insert: {
          created_at?: string | null
          funcionario_id: string
          id?: string
          materia?: string | null
          turma_id: string
        }
        Update: {
          created_at?: string | null
          funcionario_id?: string
          id?: string
          materia?: string | null
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionario_turmas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionario_turmas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          cargo_id: string | null
          cpf: string | null
          created_at: string | null
          data_admissao: string
          data_demissao: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          foto_url: string | null
          id: string
          nome_completo: string
          observacoes: string | null
          ponto_token: string | null
          ponto_token_expires_at: string | null
          rg: string | null
          salario_base: number
          status: Database["public"]["Enums"]["funcionario_status"]
          telefone: string | null
          tipo: Database["public"]["Enums"]["funcionario_tipo"]
          updated_at: string | null
        }
        Insert: {
          cargo_id?: string | null
          cpf?: string | null
          created_at?: string | null
          data_admissao?: string
          data_demissao?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          foto_url?: string | null
          id?: string
          nome_completo: string
          observacoes?: string | null
          ponto_token?: string | null
          ponto_token_expires_at?: string | null
          rg?: string | null
          salario_base?: number
          status?: Database["public"]["Enums"]["funcionario_status"]
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["funcionario_tipo"]
          updated_at?: string | null
        }
        Update: {
          cargo_id?: string | null
          cpf?: string | null
          created_at?: string | null
          data_admissao?: string
          data_demissao?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          foto_url?: string | null
          id?: string
          nome_completo?: string
          observacoes?: string | null
          ponto_token?: string | null
          ponto_token_expires_at?: string | null
          rg?: string | null
          salario_base?: number
          status?: Database["public"]["Enums"]["funcionario_status"]
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["funcionario_tipo"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          comprovante_url: string | null
          created_at: string | null
          data_pagamento: string
          desconto_aplicado: number | null
          estorno_de: string | null
          fatura_id: string
          gateway: string | null
          gateway_id: string | null
          gateway_status: string | null
          id: string
          juros_aplicado: number | null
          metodo: string
          motivo_estorno: string | null
          multa_aplicada: number | null
          referencia: string | null
          tipo: string | null
          valor: number
          valor_original: number | null
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string | null
          data_pagamento?: string
          desconto_aplicado?: number | null
          estorno_de?: string | null
          fatura_id: string
          gateway?: string | null
          gateway_id?: string | null
          gateway_status?: string | null
          id?: string
          juros_aplicado?: number | null
          metodo: string
          motivo_estorno?: string | null
          multa_aplicada?: number | null
          referencia?: string | null
          tipo?: string | null
          valor: number
          valor_original?: number | null
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string | null
          data_pagamento?: string
          desconto_aplicado?: number | null
          estorno_de?: string | null
          fatura_id?: string
          gateway?: string | null
          gateway_id?: string | null
          gateway_status?: string | null
          id?: string
          juros_aplicado?: number | null
          metodo?: string
          motivo_estorno?: string | null
          multa_aplicada?: number | null
          referencia?: string | null
          tipo?: string | null
          valor?: number
          valor_original?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
        ]
      }
      ponto_registros: {
        Row: {
          accuracy: number | null
          created_at: string | null
          data: string
          editado_por: string | null
          entrada: string | null
          funcionario_id: string
          horas_extras: unknown
          horas_trabalhadas: unknown
          id: string
          ip_address: string | null
          latitude: number | null
          localizacao_valida: boolean | null
          longitude: number | null
          observacoes: string | null
          retorno_almoco: string | null
          saida: string | null
          saida_almoco: string | null
          tipo_registro: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          accuracy?: number | null
          created_at?: string | null
          data?: string
          editado_por?: string | null
          entrada?: string | null
          funcionario_id: string
          horas_extras?: unknown
          horas_trabalhadas?: unknown
          id?: string
          ip_address?: string | null
          latitude?: number | null
          localizacao_valida?: boolean | null
          longitude?: number | null
          observacoes?: string | null
          retorno_almoco?: string | null
          saida?: string | null
          saida_almoco?: string | null
          tipo_registro?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          accuracy?: number | null
          created_at?: string | null
          data?: string
          editado_por?: string | null
          entrada?: string | null
          funcionario_id?: string
          horas_extras?: unknown
          horas_trabalhadas?: unknown
          id?: string
          ip_address?: string | null
          latitude?: number | null
          localizacao_valida?: boolean | null
          longitude?: number | null
          observacoes?: string | null
          retorno_almoco?: string | null
          saida?: string | null
          saida_almoco?: string | null
          tipo_registro?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ponto_registros_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pontos_autorizados: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          latitude: number
          longitude: number
          nome: string
          raio_metros: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          nome: string
          raio_metros?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          nome?: string
          raio_metros?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          nome: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          nome: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      responsaveis: {
        Row: {
          asaas_customer_id: string | null
          ativo: boolean | null
          cpf: string | null
          created_at: string | null
          email: string | null
          fatura_consolidada: boolean | null
          id: string
          nome: string
          observacoes: string | null
          stripe_customer_id: string | null
          telefone: string
          updated_at: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          ativo?: boolean | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          fatura_consolidada?: boolean | null
          id?: string
          nome: string
          observacoes?: string | null
          stripe_customer_id?: string | null
          telefone: string
          updated_at?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          ativo?: boolean | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          fatura_consolidada?: boolean | null
          id?: string
          nome?: string
          observacoes?: string | null
          stripe_customer_id?: string | null
          telefone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      setores: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      turmas: {
        Row: {
          ano_letivo: number
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          serie: string
          turno: string
        }
        Insert: {
          ano_letivo?: number
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          serie: string
          turno?: string
        }
        Update: {
          ano_letivo?: number
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          serie?: string
          turno?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          browser_notifications: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          theme: string | null
          updated_at: string | null
          user_id: string
          weekly_report: boolean | null
        }
        Insert: {
          browser_notifications?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          theme?: string | null
          updated_at?: string | null
          user_id: string
          weekly_report?: boolean | null
        }
        Update: {
          browser_notifications?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          theme?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_report?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          ip_address: string | null
          payload: Json
          processing_time_ms: number | null
          source: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          payload: Json
          processing_time_ms?: number | null
          source: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          payload?: Json
          processing_time_ms?: number | null
          source?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atualizar_status_faturas: { Args: never; Returns: undefined }
      generate_ponto_token: {
        Args: { p_funcionario_id: string }
        Returns: string
      }
      gerar_faturas_aluno: {
        Args: {
          p_aluno_id: string
          p_curso_id: string
          p_data_inicio: string
          p_valor: number
        }
        Returns: undefined
      }
      get_escola_public_info: {
        Args: never
        Returns: {
          logo_url: string
          nome: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalcular_fatura: { Args: { p_fatura_id: string }; Returns: undefined }
      registrar_ponto_externo: {
        Args: {
          p_accuracy?: number
          p_ip?: string
          p_latitude?: number
          p_longitude?: number
          p_tipo: string
          p_token: string
          p_user_agent?: string
        }
        Returns: Json
      }
      validar_localizacao: {
        Args: { p_latitude: number; p_longitude: number }
        Returns: {
          distancia_metros: number
          ponto_nome: string
          valido: boolean
        }[]
      }
      validate_ponto_token: {
        Args: { p_token: string }
        Returns: {
          cargo_nome: string
          foto_url: string
          funcionario_id: string
          nome_completo: string
          ultimo_registro: Json
        }[]
      }
    }
    Enums: {
      aluno_status: "ativo" | "trancado" | "cancelado" | "transferido"
      app_role: "admin" | "staff" | "financeiro" | "secretaria"
      contrato_tipo: "clt" | "pj" | "temporario" | "estagio"
      funcionario_status: "ativo" | "inativo" | "afastado" | "ferias"
      funcionario_tipo: "professor" | "administrativo" | "outro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      aluno_status: ["ativo", "trancado", "cancelado", "transferido"],
      app_role: ["admin", "staff", "financeiro", "secretaria"],
      contrato_tipo: ["clt", "pj", "temporario", "estagio"],
      funcionario_status: ["ativo", "inativo", "afastado", "ferias"],
      funcionario_tipo: ["professor", "administrativo", "outro"],
    },
  },
} as const
