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
          data_inicio_cobranca: string | null
          data_matricula: string
          data_nascimento: string | null
          desconto_percentual: number | null
          dia_vencimento: number | null
          email_responsavel: string | null
          endereco: string | null
          id: string
          nome_completo: string
          observacoes: string | null
          quantidade_parcelas: number | null
          responsavel_id: string | null
          status_matricula: Database["public"]["Enums"]["aluno_status"] | null
          telefone_responsavel: string | null
          tenant_id: string | null
          turma_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          curso_id: string
          data_inicio_cobranca?: string | null
          data_matricula?: string
          data_nascimento?: string | null
          desconto_percentual?: number | null
          dia_vencimento?: number | null
          email_responsavel?: string | null
          endereco?: string | null
          id?: string
          nome_completo: string
          observacoes?: string | null
          quantidade_parcelas?: number | null
          responsavel_id?: string | null
          status_matricula?: Database["public"]["Enums"]["aluno_status"] | null
          telefone_responsavel?: string | null
          tenant_id?: string | null
          turma_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          curso_id?: string
          data_inicio_cobranca?: string | null
          data_matricula?: string
          data_nascimento?: string | null
          desconto_percentual?: number | null
          dia_vencimento?: number | null
          email_responsavel?: string | null
          endereco?: string | null
          id?: string
          nome_completo?: string
          observacoes?: string | null
          quantidade_parcelas?: number | null
          responsavel_id?: string | null
          status_matricula?: Database["public"]["Enums"]["aluno_status"] | null
          telefone_responsavel?: string | null
          tenant_id?: string | null
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
            foreignKeyName: "alunos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      announcement_reads: {
        Row: {
          announcement_id: string | null
          id: string
          read_at: string | null
          read_by: string | null
          tenant_id: string | null
        }
        Insert: {
          announcement_id?: string | null
          id?: string
          read_at?: string | null
          read_by?: string | null
          tenant_id?: string | null
        }
        Update: {
          announcement_id?: string | null
          id?: string
          read_at?: string | null
          read_by?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "platform_announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      atividades_extracurriculares: {
        Row: {
          aluno_id: string
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          nome: string
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          aluno_id: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atividades_extracurriculares_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_extracurriculares_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_contabil: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: string | null
          registro_id: string
          tabela: string
          tenant_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          registro_id: string
          tabela: string
          tenant_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          registro_id?: string
          tabela?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_contabil_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_logs: {
        Row: {
          action: string
          created_at: string | null
          domain: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          domain: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          domain?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      avaliacoes_desempenho: {
        Row: {
          aluno_id: string
          avaliador_nome: string
          created_at: string | null
          id: string
          nota_geral: number | null
          observacoes: string | null
          periodo: string
          pontos_fortes: string | null
          pontos_melhoria: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          aluno_id: string
          avaliador_nome: string
          created_at?: string | null
          id?: string
          nota_geral?: number | null
          observacoes?: string | null
          periodo: string
          pontos_fortes?: string | null
          pontos_melhoria?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string
          avaliador_nome?: string
          created_at?: string | null
          id?: string
          nota_geral?: number | null
          observacoes?: string | null
          periodo?: string
          pontos_fortes?: string | null
          pontos_melhoria?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_desempenho_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_desempenho_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bens_patrimoniais: {
        Row: {
          categoria: string
          codigo: string
          created_at: string | null
          created_by: string
          data_aquisicao: string
          data_baixa: string | null
          depreciacao_acumulada: number | null
          descricao: string
          fornecedor: string | null
          id: string
          localizacao: string | null
          motivo_baixa: string | null
          nota_fiscal: string | null
          numero_serie: string | null
          responsavel: string | null
          status: string
          taxa_depreciacao_anual: number
          tenant_id: string
          updated_at: string | null
          valor_aquisicao: number
          valor_contabil_atual: number | null
          valor_residual: number | null
          vida_util_meses: number
        }
        Insert: {
          categoria: string
          codigo: string
          created_at?: string | null
          created_by: string
          data_aquisicao: string
          data_baixa?: string | null
          depreciacao_acumulada?: number | null
          descricao: string
          fornecedor?: string | null
          id?: string
          localizacao?: string | null
          motivo_baixa?: string | null
          nota_fiscal?: string | null
          numero_serie?: string | null
          responsavel?: string | null
          status?: string
          taxa_depreciacao_anual?: number
          tenant_id: string
          updated_at?: string | null
          valor_aquisicao: number
          valor_contabil_atual?: number | null
          valor_residual?: number | null
          vida_util_meses?: number
        }
        Update: {
          categoria?: string
          codigo?: string
          created_at?: string | null
          created_by?: string
          data_aquisicao?: string
          data_baixa?: string | null
          depreciacao_acumulada?: number | null
          descricao?: string
          fornecedor?: string | null
          id?: string
          localizacao?: string | null
          motivo_baixa?: string | null
          nota_fiscal?: string | null
          numero_serie?: string | null
          responsavel?: string | null
          status?: string
          taxa_depreciacao_anual?: number
          tenant_id?: string
          updated_at?: string | null
          valor_aquisicao?: number
          valor_contabil_atual?: number | null
          valor_residual?: number | null
          vida_util_meses?: number
        }
        Relationships: [
          {
            foreignKeyName: "bens_patrimoniais_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
          {
            foreignKeyName: "cargos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_contabeis: {
        Row: {
          ativo: boolean
          categoria_pai_id: string | null
          codigo: string
          created_at: string | null
          id: string
          natureza: string
          nivel: number
          nome: string
          tenant_id: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          categoria_pai_id?: string | null
          codigo: string
          created_at?: string | null
          id?: string
          natureza: string
          nivel?: number
          nome: string
          tenant_id?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          categoria_pai_id?: string | null
          codigo?: string
          created_at?: string | null
          id?: string
          natureza?: string
          nivel?: number
          nome?: string
          tenant_id?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_contabeis_categoria_pai_id_fkey"
            columns: ["categoria_pai_id"]
            isOneToOne: false
            referencedRelation: "categorias_contabeis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorias_contabeis_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      centros_custo: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "centros_custo_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
          {
            foreignKeyName: "contratos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          duracao_meses?: number
          id?: string
          mensalidade: number
          nivel: string
          nome: string
          tenant_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          duracao_meses?: number
          id?: string
          mensalidade?: number
          nivel?: string
          nome?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cursos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_config: {
        Row: {
          anonymization_enabled: boolean | null
          created_at: string | null
          fields_to_anonymize: string[] | null
          id: string
          last_cleanup_at: string | null
          retention_days: number
          table_name: string
          updated_at: string | null
        }
        Insert: {
          anonymization_enabled?: boolean | null
          created_at?: string | null
          fields_to_anonymize?: string[] | null
          id?: string
          last_cleanup_at?: string | null
          retention_days?: number
          table_name: string
          updated_at?: string | null
        }
        Update: {
          anonymization_enabled?: boolean | null
          created_at?: string | null
          fields_to_anonymize?: string[] | null
          id?: string
          last_cleanup_at?: string | null
          retention_days?: number
          table_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      depreciacao_mensal: {
        Row: {
          ano_referencia: number
          bem_id: string
          created_at: string | null
          depreciacao_acumulada: number
          id: string
          lancamento_id: string | null
          mes_referencia: number
          tenant_id: string
          valor_contabil: number
          valor_depreciacao: number
        }
        Insert: {
          ano_referencia: number
          bem_id: string
          created_at?: string | null
          depreciacao_acumulada: number
          id?: string
          lancamento_id?: string | null
          mes_referencia: number
          tenant_id: string
          valor_contabil: number
          valor_depreciacao: number
        }
        Update: {
          ano_referencia?: number
          bem_id?: string
          created_at?: string | null
          depreciacao_acumulada?: number
          id?: string
          lancamento_id?: string | null
          mes_referencia?: number
          tenant_id?: string
          valor_contabil?: number
          valor_depreciacao?: number
        }
        Relationships: [
          {
            foreignKeyName: "depreciacao_mensal_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "bens_patrimoniais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depreciacao_mensal_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_contabeis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depreciacao_mensal_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          categoria: string
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          despesa_origem_id: string | null
          dia_vencimento: number | null
          id: string
          observacoes: string | null
          paga: boolean | null
          recorrencia_ate: string | null
          recorrente: boolean | null
          tenant_id: string | null
          titulo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          despesa_origem_id?: string | null
          dia_vencimento?: number | null
          id?: string
          observacoes?: string | null
          paga?: boolean | null
          recorrencia_ate?: string | null
          recorrente?: boolean | null
          tenant_id?: string | null
          titulo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          despesa_origem_id?: string | null
          dia_vencimento?: number | null
          id?: string
          observacoes?: string | null
          paga?: boolean | null
          recorrencia_ate?: string | null
          recorrente?: boolean | null
          tenant_id?: string | null
          titulo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_despesa_origem_id_fkey"
            columns: ["despesa_origem_id"]
            isOneToOne: false
            referencedRelation: "despesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinas: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          curso_id: string
          descricao: string | null
          id: string
          nome: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          curso_id: string
          descricao?: string | null
          id?: string
          nome: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          curso_id?: string
          descricao?: string | null
          id?: string
          nome?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disciplinas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escola_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fatura_alunos: {
        Row: {
          aluno_id: string
          created_at: string | null
          curso_id: string
          desconto_percentual: number | null
          desconto_valor: number | null
          descricao: string | null
          fatura_id: string
          id: string
          tenant_id: string | null
          valor_final: number
          valor_unitario: number
        }
        Insert: {
          aluno_id: string
          created_at?: string | null
          curso_id: string
          desconto_percentual?: number | null
          desconto_valor?: number | null
          descricao?: string | null
          fatura_id: string
          id?: string
          tenant_id?: string | null
          valor_final?: number
          valor_unitario?: number
        }
        Update: {
          aluno_id?: string
          created_at?: string | null
          curso_id?: string
          desconto_percentual?: number | null
          desconto_valor?: number | null
          descricao?: string | null
          fatura_id?: string
          id?: string
          tenant_id?: string | null
          valor_final?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "fatura_alunos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fatura_alunos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fatura_alunos_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fatura_alunos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
          {
            foreignKeyName: "fatura_descontos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
          tipo: string
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          fatura_id: string
          id?: string
          nome: string
          tenant_id?: string | null
          tipo: string
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          fatura_id?: string
          id?: string
          nome?: string
          tenant_id?: string | null
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
          {
            foreignKeyName: "fatura_documentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
          {
            foreignKeyName: "fatura_historico_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
          {
            foreignKeyName: "fatura_itens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      faturas: {
        Row: {
          aluno_id: string
          ano_referencia: number
          asaas_billing_type: string | null
          asaas_boleto_bar_code: string | null
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
          consolidada: boolean | null
          created_at: string | null
          created_by: string | null
          curso_id: string
          data_emissao: string
          data_vencimento: string
          desconto_motivo: string | null
          desconto_percentual: number | null
          desconto_valor: number | null
          dias_atraso: number | null
          fatura_origem_id: string | null
          gateway_config_id: string | null
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
          tenant_id: string | null
          tipo_origem: string | null
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
          asaas_boleto_bar_code?: string | null
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
          consolidada?: boolean | null
          created_at?: string | null
          created_by?: string | null
          curso_id: string
          data_emissao?: string
          data_vencimento: string
          desconto_motivo?: string | null
          desconto_percentual?: number | null
          desconto_valor?: number | null
          dias_atraso?: number | null
          fatura_origem_id?: string | null
          gateway_config_id?: string | null
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
          tenant_id?: string | null
          tipo_origem?: string | null
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
          asaas_boleto_bar_code?: string | null
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
          consolidada?: boolean | null
          created_at?: string | null
          created_by?: string | null
          curso_id?: string
          data_emissao?: string
          data_vencimento?: string
          desconto_motivo?: string | null
          desconto_percentual?: number | null
          desconto_valor?: number | null
          dias_atraso?: number | null
          fatura_origem_id?: string | null
          gateway_config_id?: string | null
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
          tenant_id?: string | null
          tipo_origem?: string | null
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
            foreignKeyName: "faturas_fatura_origem_id_fkey"
            columns: ["fatura_origem_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faturas_gateway_config_id_fkey"
            columns: ["gateway_config_id"]
            isOneToOne: false
            referencedRelation: "tenant_gateway_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faturas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faturas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_professores: {
        Row: {
          aluno_id: string
          comentario: string
          created_at: string | null
          data_feedback: string
          disciplina_id: string | null
          id: string
          professor_nome: string
          tenant_id: string | null
          tipo: string | null
        }
        Insert: {
          aluno_id: string
          comentario: string
          created_at?: string | null
          data_feedback?: string
          disciplina_id?: string | null
          id?: string
          professor_nome: string
          tenant_id?: string | null
          tipo?: string | null
        }
        Update: {
          aluno_id?: string
          comentario?: string
          created_at?: string | null
          data_feedback?: string
          disciplina_id?: string | null
          id?: string
          professor_nome?: string
          tenant_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_professores_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_professores_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_professores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
          {
            foreignKeyName: "folha_pagamento_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      frequencia: {
        Row: {
          aluno_id: string
          created_at: string | null
          data: string
          disciplina_id: string | null
          id: string
          justificativa: string | null
          presente: boolean
          tenant_id: string | null
        }
        Insert: {
          aluno_id: string
          created_at?: string | null
          data?: string
          disciplina_id?: string | null
          id?: string
          justificativa?: string | null
          presente?: boolean
          tenant_id?: string | null
        }
        Update: {
          aluno_id?: string
          created_at?: string | null
          data?: string
          disciplina_id?: string | null
          id?: string
          justificativa?: string | null
          presente?: boolean
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "frequencia_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencia_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencia_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
          tipo: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          funcionario_id: string
          id?: string
          nome: string
          tenant_id?: string | null
          tipo?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          funcionario_id?: string
          id?: string
          nome?: string
          tenant_id?: string | null
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
          {
            foreignKeyName: "funcionario_documentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
          turma_id: string
        }
        Insert: {
          created_at?: string | null
          funcionario_id: string
          id?: string
          materia?: string | null
          tenant_id?: string | null
          turma_id: string
        }
        Update: {
          created_at?: string | null
          funcionario_id?: string
          id?: string
          materia?: string | null
          tenant_id?: string | null
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
            foreignKeyName: "funcionario_turmas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
          {
            foreignKeyName: "funcionarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gateway_transaction_logs: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          external_reference: string | null
          fatura_id: string | null
          gateway_config_id: string | null
          gateway_type: Database["public"]["Enums"]["payment_gateway_type"]
          id: string
          ip_address: string | null
          operation: string
          pagamento_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          status: string
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          external_reference?: string | null
          fatura_id?: string | null
          gateway_config_id?: string | null
          gateway_type: Database["public"]["Enums"]["payment_gateway_type"]
          id?: string
          ip_address?: string | null
          operation: string
          pagamento_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          external_reference?: string | null
          fatura_id?: string | null
          gateway_config_id?: string | null
          gateway_type?: Database["public"]["Enums"]["payment_gateway_type"]
          id?: string
          ip_address?: string | null
          operation?: string
          pagamento_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gateway_transaction_logs_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gateway_transaction_logs_gateway_config_id_fkey"
            columns: ["gateway_config_id"]
            isOneToOne: false
            referencedRelation: "tenant_gateway_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gateway_transaction_logs_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gateway_transaction_logs_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gateway_transaction_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      immutable_security_logs: {
        Row: {
          action: string
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          resource_id: string | null
          resource_type: string | null
          severity: string
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          severity?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          severity?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      impostos_estimados: {
        Row: {
          aliquota: number
          ano_referencia: number
          base_calculo: number
          created_at: string | null
          data_vencimento: string | null
          id: string
          mes_referencia: number
          observacoes: string | null
          status: string
          tenant_id: string
          tipo_imposto: string
          updated_at: string | null
          valor_estimado: number
          valor_pago: number | null
        }
        Insert: {
          aliquota: number
          ano_referencia: number
          base_calculo: number
          created_at?: string | null
          data_vencimento?: string | null
          id?: string
          mes_referencia: number
          observacoes?: string | null
          status?: string
          tenant_id: string
          tipo_imposto: string
          updated_at?: string | null
          valor_estimado: number
          valor_pago?: number | null
        }
        Update: {
          aliquota?: number
          ano_referencia?: number
          base_calculo?: number
          created_at?: string | null
          data_vencimento?: string | null
          id?: string
          mes_referencia?: number
          observacoes?: string | null
          status?: string
          tenant_id?: string
          tipo_imposto?: string
          updated_at?: string | null
          valor_estimado?: number
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "impostos_estimados_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_contabeis: {
        Row: {
          categoria_id: string
          centro_custo_id: string | null
          created_at: string
          created_by: string
          data_competencia: string
          data_lancamento: string
          despesa_id: string | null
          documento_referencia: string | null
          estornado: boolean
          estornado_em: string | null
          estornado_por: string | null
          estorno_de: string | null
          fatura_id: string | null
          historico: string
          id: string
          natureza: string
          numero_lancamento: string
          pagamento_id: string | null
          tenant_id: string
          tipo: string
          valor: number
        }
        Insert: {
          categoria_id: string
          centro_custo_id?: string | null
          created_at?: string
          created_by: string
          data_competencia: string
          data_lancamento?: string
          despesa_id?: string | null
          documento_referencia?: string | null
          estornado?: boolean
          estornado_em?: string | null
          estornado_por?: string | null
          estorno_de?: string | null
          fatura_id?: string | null
          historico: string
          id?: string
          natureza: string
          numero_lancamento: string
          pagamento_id?: string | null
          tenant_id: string
          tipo: string
          valor: number
        }
        Update: {
          categoria_id?: string
          centro_custo_id?: string | null
          created_at?: string
          created_by?: string
          data_competencia?: string
          data_lancamento?: string
          despesa_id?: string | null
          documento_referencia?: string | null
          estornado?: boolean
          estornado_em?: string | null
          estornado_por?: string | null
          estorno_de?: string | null
          fatura_id?: string | null
          historico?: string
          id?: string
          natureza?: string
          numero_lancamento?: string
          pagamento_id?: string | null
          tenant_id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_contabeis_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_contabeis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_contabeis_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_contabeis_despesa_id_fkey"
            columns: ["despesa_id"]
            isOneToOne: false
            referencedRelation: "despesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_contabeis_estorno_de_fkey"
            columns: ["estorno_de"]
            isOneToOne: false
            referencedRelation: "lancamentos_contabeis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_contabeis_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_contabeis_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_contabeis_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_contabeis_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lgpd_deletion_requests: {
        Row: {
          affected_tables: string[] | null
          created_at: string | null
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          request_type: string
          requester_cpf: string | null
          requester_email: string
          status: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          affected_tables?: string[] | null
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_type: string
          requester_cpf?: string | null
          requester_email: string
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          affected_tables?: string[] | null
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_type?: string
          requester_cpf?: string | null
          requester_email?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lgpd_deletion_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notas: {
        Row: {
          aluno_id: string
          bimestre: number | null
          created_at: string | null
          data_avaliacao: string
          descricao: string | null
          disciplina_id: string
          id: string
          nota: number
          peso: number | null
          tenant_id: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          aluno_id: string
          bimestre?: number | null
          created_at?: string | null
          data_avaliacao?: string
          descricao?: string | null
          disciplina_id: string
          id?: string
          nota: number
          peso?: number | null
          tenant_id?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string
          bimestre?: number | null
          created_at?: string | null
          data_avaliacao?: string
          descricao?: string | null
          disciplina_id?: string
          id?: string
          nota?: number
          peso?: number | null
          tenant_id?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          gateway_config_id: string | null
          gateway_id: string | null
          gateway_status: string | null
          id: string
          juros_aplicado: number | null
          metodo: string
          motivo_estorno: string | null
          multa_aplicada: number | null
          referencia: string | null
          tenant_id: string | null
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
          gateway_config_id?: string | null
          gateway_id?: string | null
          gateway_status?: string | null
          id?: string
          juros_aplicado?: number | null
          metodo: string
          motivo_estorno?: string | null
          multa_aplicada?: number | null
          referencia?: string | null
          tenant_id?: string | null
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
          gateway_config_id?: string | null
          gateway_id?: string | null
          gateway_status?: string | null
          id?: string
          juros_aplicado?: number | null
          metodo?: string
          motivo_estorno?: string | null
          multa_aplicada?: number | null
          referencia?: string | null
          tenant_id?: string | null
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
          {
            foreignKeyName: "pagamentos_gateway_config_id_fkey"
            columns: ["gateway_config_id"]
            isOneToOne: false
            referencedRelation: "tenant_gateway_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_announcements: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          link_text: string | null
          link_url: string | null
          message: string
          show_banner: boolean | null
          show_on_landing: boolean
          show_on_login: boolean
          starts_at: string
          target_plans: string[] | null
          target_status: string[] | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          link_text?: string | null
          link_url?: string | null
          message: string
          show_banner?: boolean | null
          show_on_landing?: boolean
          show_on_login?: boolean
          starts_at?: string
          target_plans?: string[] | null
          target_status?: string[] | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          link_text?: string | null
          link_url?: string | null
          message?: string
          show_banner?: boolean | null
          show_on_landing?: boolean
          show_on_login?: boolean
          starts_at?: string
          target_plans?: string[] | null
          target_status?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          manager_id: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          manager_id?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          manager_id?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_audit_logs_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "system_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_audit_logs_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "system_managers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_backups: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          expires_at: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          requested_by: string | null
          started_at: string | null
          status: string
          tables_included: string[] | null
          tenant_id: string | null
        }
        Insert: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          requested_by?: string | null
          started_at?: string | null
          status?: string
          tables_included?: string[] | null
          tenant_id?: string | null
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          requested_by?: string | null
          started_at?: string | null
          status?: string
          tables_included?: string[] | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_backups_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "system_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_backups_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "system_managers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_backups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_changelog: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_major: boolean | null
          published_at: string | null
          title: string
          type: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_major?: boolean | null
          published_at?: string | null
          title: string
          type?: string
          version: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_major?: boolean | null
          published_at?: string | null
          title?: string
          type?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_changelog_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "system_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_changelog_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "system_managers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_roadmap: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_release: string | null
          id: string
          is_public: boolean | null
          priority: string | null
          release_notes: string | null
          released_at: string | null
          status: string
          title: string
          updated_at: string | null
          votes_count: number | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_release?: string | null
          id?: string
          is_public?: boolean | null
          priority?: string | null
          release_notes?: string | null
          released_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
          votes_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_release?: string | null
          id?: string
          is_public?: boolean | null
          priority?: string | null
          release_notes?: string | null
          released_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          votes_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_roadmap_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "system_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_roadmap_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "system_managers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      ponto_registros: {
        Row: {
          accuracy: number | null
          created_at: string | null
          data: string
          editado_por: string | null
          entrada: string | null
          funcionario_id: string
          horas_extras: string | null
          horas_trabalhadas: string | null
          id: string
          ip_address: string | null
          latitude: number | null
          localizacao_valida: boolean | null
          longitude: number | null
          observacoes: string | null
          retorno_almoco: string | null
          saida: string | null
          saida_almoco: string | null
          tenant_id: string | null
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
          horas_extras?: string | null
          horas_trabalhadas?: string | null
          id?: string
          ip_address?: string | null
          latitude?: number | null
          localizacao_valida?: boolean | null
          longitude?: number | null
          observacoes?: string | null
          retorno_almoco?: string | null
          saida?: string | null
          saida_almoco?: string | null
          tenant_id?: string | null
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
          horas_extras?: string | null
          horas_trabalhadas?: string | null
          id?: string
          ip_address?: string | null
          latitude?: number | null
          localizacao_valida?: boolean | null
          longitude?: number | null
          observacoes?: string | null
          retorno_almoco?: string | null
          saida?: string | null
          saida_almoco?: string | null
          tenant_id?: string | null
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
          {
            foreignKeyName: "ponto_registros_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          nome: string
          raio_metros?: number
          tenant_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          nome?: string
          raio_metros?: number
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pontos_autorizados_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      prematricula_leads: {
        Row: {
          created_at: string
          curso_interesse: string | null
          data_nascimento: string | null
          email: string
          id: string
          ip_address: string | null
          mensagem: string | null
          nome_aluno: string
          nome_responsavel: string
          origem: string | null
          status: string | null
          telefone: string | null
          tenant_id: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          curso_interesse?: string | null
          data_nascimento?: string | null
          email: string
          id?: string
          ip_address?: string | null
          mensagem?: string | null
          nome_aluno: string
          nome_responsavel: string
          origem?: string | null
          status?: string | null
          telefone?: string | null
          tenant_id: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          curso_interesse?: string | null
          data_nascimento?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          mensagem?: string | null
          nome_aluno?: string
          nome_responsavel?: string
          origem?: string | null
          status?: string | null
          telefone?: string | null
          tenant_id?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prematricula_leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          nome: string
          tenant_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          nome: string
          tenant_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas: {
        Row: {
          categoria: string
          created_at: string | null
          data_confirmacao: string | null
          data_recebimento: string
          id: string
          observacoes: string | null
          origem: string | null
          recebida: boolean | null
          recorrente: boolean | null
          tenant_id: string | null
          titulo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string | null
          data_confirmacao?: string | null
          data_recebimento: string
          id?: string
          observacoes?: string | null
          origem?: string | null
          recebida?: boolean | null
          recorrente?: boolean | null
          tenant_id?: string | null
          titulo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string | null
          data_confirmacao?: string | null
          data_recebimento?: string
          id?: string
          observacoes?: string | null
          origem?: string | null
          recebida?: boolean | null
          recorrente?: boolean | null
          tenant_id?: string | null
          titulo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "receitas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responsaveis_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_votes: {
        Row: {
          created_at: string | null
          id: string
          roadmap_id: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          roadmap_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          roadmap_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_votes_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "platform_roadmap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_votes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      school_users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          nome: string
          phone: string | null
          role: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          nome: string
          phone?: string | null
          role: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          nome?: string
          phone?: string | null
          role?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      school_website_blocks: {
        Row: {
          block_order: number
          block_type: string
          content: Json | null
          created_at: string | null
          id: string
          is_visible: boolean | null
          page_id: string
          settings: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          block_order?: number
          block_type: string
          content?: Json | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          page_id: string
          settings?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          block_order?: number
          block_type?: string
          content?: Json | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          page_id?: string
          settings?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_website_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "school_website_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_website_blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      school_website_config: {
        Row: {
          about_description: string | null
          about_features: Json | null
          about_title: string | null
          accent_color: string | null
          contact_subtitle: string | null
          contact_title: string | null
          created_at: string
          custom_domain: string | null
          custom_domain_ssl_status: string | null
          custom_domain_verified: boolean | null
          differentials: Json | null
          enabled: boolean
          facebook_pixel_id: string | null
          font_family: string | null
          footer_text: string | null
          gallery_images: Json | null
          google_analytics_id: string | null
          google_tag_manager_id: string | null
          hero_background_url: string | null
          hero_badge_text: string | null
          hero_cta_primary: string | null
          hero_cta_secondary: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          map_embed_url: string | null
          og_image_url: string | null
          prematricula_enabled: boolean | null
          prematricula_fields: Json | null
          prematricula_subtitle: string | null
          prematricula_title: string | null
          primary_color: string | null
          secondary_color: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          show_map: boolean | null
          show_powered_by: boolean | null
          slug: string | null
          social_links: Json | null
          steps: Json | null
          tenant_id: string
          testimonials: Json | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          about_description?: string | null
          about_features?: Json | null
          about_title?: string | null
          accent_color?: string | null
          contact_subtitle?: string | null
          contact_title?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_domain_ssl_status?: string | null
          custom_domain_verified?: boolean | null
          differentials?: Json | null
          enabled?: boolean
          facebook_pixel_id?: string | null
          font_family?: string | null
          footer_text?: string | null
          gallery_images?: Json | null
          google_analytics_id?: string | null
          google_tag_manager_id?: string | null
          hero_background_url?: string | null
          hero_badge_text?: string | null
          hero_cta_primary?: string | null
          hero_cta_secondary?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          map_embed_url?: string | null
          og_image_url?: string | null
          prematricula_enabled?: boolean | null
          prematricula_fields?: Json | null
          prematricula_subtitle?: string | null
          prematricula_title?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          show_map?: boolean | null
          show_powered_by?: boolean | null
          slug?: string | null
          social_links?: Json | null
          steps?: Json | null
          tenant_id: string
          testimonials?: Json | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          about_description?: string | null
          about_features?: Json | null
          about_title?: string | null
          accent_color?: string | null
          contact_subtitle?: string | null
          contact_title?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_domain_ssl_status?: string | null
          custom_domain_verified?: boolean | null
          differentials?: Json | null
          enabled?: boolean
          facebook_pixel_id?: string | null
          font_family?: string | null
          footer_text?: string | null
          gallery_images?: Json | null
          google_analytics_id?: string | null
          google_tag_manager_id?: string | null
          hero_background_url?: string | null
          hero_badge_text?: string | null
          hero_cta_primary?: string | null
          hero_cta_secondary?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          map_embed_url?: string | null
          og_image_url?: string | null
          prematricula_enabled?: boolean | null
          prematricula_fields?: Json | null
          prematricula_subtitle?: string | null
          prematricula_title?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          show_map?: boolean | null
          show_powered_by?: boolean | null
          slug?: string | null
          social_links?: Json | null
          steps?: Json | null
          tenant_id?: string
          testimonials?: Json | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_website_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      school_website_pages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_homepage: boolean | null
          is_published: boolean | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          tenant_id: string
          title: string
          updated_at: string | null
          website_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_homepage?: boolean | null
          is_published?: boolean | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          tenant_id: string
          title: string
          updated_at?: string | null
          website_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_homepage?: boolean | null
          is_published?: boolean | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_website_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_website_pages_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "school_website_config"
            referencedColumns: ["id"]
          },
        ]
      }
      security_access_logs: {
        Row: {
          action: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          is_cross_tenant_attempt: boolean | null
          is_platform_admin: boolean | null
          metadata: Json | null
          operation: string
          request_path: string | null
          resource_id: string | null
          resource_type: string
          status: string
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_tenant_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          is_cross_tenant_attempt?: boolean | null
          is_platform_admin?: boolean | null
          metadata?: Json | null
          operation: string
          request_path?: string | null
          resource_id?: string | null
          resource_type: string
          status: string
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_tenant_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          is_cross_tenant_attempt?: boolean | null
          is_platform_admin?: boolean | null
          metadata?: Json | null
          operation?: string
          request_path?: string | null
          resource_id?: string | null
          resource_type?: string
          status?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_tenant_id?: string | null
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          tenant_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          tenant_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          tenant_id?: string | null
          title?: string
          user_id?: string | null
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
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "setores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          amount: number | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          new_status: Database["public"]["Enums"]["subscription_status"] | null
          old_status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_event_id: string | null
          tenant_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["subscription_status"] | null
          old_status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_event_id?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["subscription_status"] | null
          old_status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_event_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string | null
          display_order: number | null
          features: string[]
          icon: string | null
          id: string
          limite_alunos: number | null
          limite_usuarios: number | null
          name: string
          popular: boolean | null
          price: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          features?: string[]
          icon?: string | null
          id: string
          limite_alunos?: number | null
          limite_usuarios?: number | null
          name: string
          popular?: boolean | null
          price: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          features?: string[]
          icon?: string | null
          id?: string
          limite_alunos?: number | null
          limite_usuarios?: number | null
          name?: string
          popular?: boolean | null
          price?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_managers: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          nome: string
          permissions: Json | null
          phone: string | null
          platform_role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          nome: string
          permissions?: Json | null
          phone?: string | null
          platform_role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          nome?: string
          permissions?: Json | null
          phone?: string | null
          platform_role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tenant_gateway_configs: {
        Row: {
          allowed_methods: Database["public"]["Enums"]["payment_method_type"][]
          connection_error: string | null
          connection_status: string | null
          created_at: string
          created_by: string | null
          currency: string
          display_name: string
          environment: Database["public"]["Enums"]["gateway_environment"]
          gateway_type: Database["public"]["Enums"]["payment_gateway_type"]
          id: string
          is_active: boolean
          is_default: boolean
          last_connection_test: string | null
          settings: Json | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
          webhook_token: string | null
          webhook_url: string | null
        }
        Insert: {
          allowed_methods?: Database["public"]["Enums"]["payment_method_type"][]
          connection_error?: string | null
          connection_status?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          display_name: string
          environment?: Database["public"]["Enums"]["gateway_environment"]
          gateway_type: Database["public"]["Enums"]["payment_gateway_type"]
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_connection_test?: string | null
          settings?: Json | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          webhook_token?: string | null
          webhook_url?: string | null
        }
        Update: {
          allowed_methods?: Database["public"]["Enums"]["payment_method_type"][]
          connection_error?: string | null
          connection_status?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          display_name?: string
          environment?: Database["public"]["Enums"]["gateway_environment"]
          gateway_type?: Database["public"]["Enums"]["payment_gateway_type"]
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_connection_test?: string | null
          settings?: Json | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          webhook_token?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_gateway_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_gateway_secrets: {
        Row: {
          created_at: string
          encrypted_value: string
          gateway_config_id: string
          id: string
          key_name: string
          key_prefix: string | null
          last_rotated: string | null
        }
        Insert: {
          created_at?: string
          encrypted_value: string
          gateway_config_id: string
          id?: string
          key_name: string
          key_prefix?: string | null
          last_rotated?: string | null
        }
        Update: {
          created_at?: string
          encrypted_value?: string
          gateway_config_id?: string
          id?: string
          key_name?: string
          key_prefix?: string | null
          last_rotated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_gateway_secrets_gateway_config_id_fkey"
            columns: ["gateway_config_id"]
            isOneToOne: false
            referencedRelation: "tenant_gateway_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_payment_methods: {
        Row: {
          card_brand: string
          card_exp_month: number
          card_exp_year: number
          card_last_four: string
          created_at: string | null
          id: string
          is_default: boolean
          stripe_payment_method_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          card_brand: string
          card_exp_month: number
          card_exp_year: number
          card_last_four: string
          created_at?: string | null
          id?: string
          is_default?: boolean
          stripe_payment_method_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          card_brand?: string
          card_exp_month?: number
          card_exp_year?: number
          card_last_four?: string
          created_at?: string | null
          id?: string
          is_default?: boolean
          stripe_payment_method_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_payment_methods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          auto_billing_enabled: boolean | null
          billing_day: number | null
          blocked_at: string | null
          blocked_reason: string | null
          cnpj: string | null
          created_at: string | null
          custom_domain: string | null
          data_contrato: string | null
          domain_verified: boolean | null
          domain_verified_at: string | null
          email: string | null
          endereco: string | null
          grace_period_ends_at: string | null
          id: string
          last_billing_date: string | null
          limite_alunos: number | null
          limite_usuarios: number | null
          logo_url: string | null
          monthly_price: number | null
          next_billing_date: string | null
          nome: string
          plano: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string | null
          status: string | null
          storage_limit_bytes: number | null
          storage_used_bytes: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_ends_at: string | null
          subscription_started_at: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          telefone: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          auto_billing_enabled?: boolean | null
          billing_day?: number | null
          blocked_at?: string | null
          blocked_reason?: string | null
          cnpj?: string | null
          created_at?: string | null
          custom_domain?: string | null
          data_contrato?: string | null
          domain_verified?: boolean | null
          domain_verified_at?: string | null
          email?: string | null
          endereco?: string | null
          grace_period_ends_at?: string | null
          id?: string
          last_billing_date?: string | null
          limite_alunos?: number | null
          limite_usuarios?: number | null
          logo_url?: string | null
          monthly_price?: number | null
          next_billing_date?: string | null
          nome: string
          plano?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          status?: string | null
          storage_limit_bytes?: number | null
          storage_used_bytes?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          telefone?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_billing_enabled?: boolean | null
          billing_day?: number | null
          blocked_at?: string | null
          blocked_reason?: string | null
          cnpj?: string | null
          created_at?: string | null
          custom_domain?: string | null
          data_contrato?: string | null
          domain_verified?: boolean | null
          domain_verified_at?: string | null
          email?: string | null
          endereco?: string | null
          grace_period_ends_at?: string | null
          id?: string
          last_billing_date?: string | null
          limite_alunos?: number | null
          limite_usuarios?: number | null
          logo_url?: string | null
          monthly_price?: number | null
          next_billing_date?: string | null
          nome?: string
          plano?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          status?: string | null
          storage_limit_bytes?: number | null
          storage_used_bytes?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          telefone?: string | null
          trial_ends_at?: string | null
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
          tenant_id: string | null
          turno: string
        }
        Insert: {
          ano_letivo?: number
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          serie: string
          tenant_id?: string | null
          turno?: string
        }
        Update: {
          ano_letivo?: number
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          serie?: string
          tenant_id?: string | null
          turno?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          browser_notifications: boolean | null
          created_at: string | null
          custom_colors: Json | null
          email_notifications: boolean | null
          id: string
          language: string | null
          theme: string | null
          updated_at: string | null
          user_id: string
          weekly_report: boolean | null
        }
        Insert: {
          browser_notifications?: boolean | null
          created_at?: string | null
          custom_colors?: Json | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
          weekly_report?: boolean | null
        }
        Update: {
          browser_notifications?: boolean | null
          created_at?: string | null
          custom_colors?: Json | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
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
      data_retention_status: {
        Row: {
          anonymization_enabled: boolean | null
          fields_to_anonymize: string[] | null
          last_cleanup_at: string | null
          retention_days: number | null
          status: string | null
          table_name: string | null
        }
        Insert: {
          anonymization_enabled?: boolean | null
          fields_to_anonymize?: string[] | null
          last_cleanup_at?: string | null
          retention_days?: number | null
          status?: never
          table_name?: string | null
        }
        Update: {
          anonymization_enabled?: boolean | null
          fields_to_anonymize?: string[] | null
          last_cleanup_at?: string | null
          retention_days?: number | null
          status?: never
          table_name?: string | null
        }
        Relationships: []
      }
      escola_public_branding: {
        Row: {
          logo_url: string | null
          nome: string | null
        }
        Relationships: []
      }
      pagamentos_summary: {
        Row: {
          created_at: string | null
          data_pagamento: string | null
          fatura_id: string | null
          id: string | null
          metodo: string | null
          tenant_id: string | null
          tipo: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data_pagamento?: string | null
          fatura_id?: string | null
          id?: string | null
          metodo?: string | null
          tenant_id?: string | null
          tipo?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data_pagamento?: string | null
          fatura_id?: string | null
          id?: string | null
          metodo?: string | null
          tenant_id?: string | null
          tipo?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_branding_public: {
        Row: {
          key: string | null
          value: Json | null
        }
        Insert: {
          key?: string | null
          value?: Json | null
        }
        Update: {
          key?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      school_website_public_minimal: {
        Row: {
          about_description: string | null
          about_features: Json | null
          about_title: string | null
          accent_color: string | null
          differentials: Json | null
          enabled: boolean | null
          font_family: string | null
          footer_text: string | null
          gallery_images: Json | null
          hero_background_url: string | null
          hero_badge_text: string | null
          hero_cta_primary: string | null
          hero_cta_secondary: string | null
          hero_subtitle: string | null
          hero_title: string | null
          og_image_url: string | null
          prematricula_enabled: boolean | null
          prematricula_subtitle: string | null
          prematricula_title: string | null
          primary_color: string | null
          secondary_color: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          show_powered_by: boolean | null
          slug: string | null
          social_links: Json | null
          steps: Json | null
          testimonials: Json | null
        }
        Insert: {
          about_description?: string | null
          about_features?: Json | null
          about_title?: string | null
          accent_color?: string | null
          differentials?: Json | null
          enabled?: boolean | null
          font_family?: string | null
          footer_text?: string | null
          gallery_images?: Json | null
          hero_background_url?: string | null
          hero_badge_text?: string | null
          hero_cta_primary?: string | null
          hero_cta_secondary?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          og_image_url?: string | null
          prematricula_enabled?: boolean | null
          prematricula_subtitle?: string | null
          prematricula_title?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          show_powered_by?: boolean | null
          slug?: string | null
          social_links?: Json | null
          steps?: Json | null
          testimonials?: Json | null
        }
        Update: {
          about_description?: string | null
          about_features?: Json | null
          about_title?: string | null
          accent_color?: string | null
          differentials?: Json | null
          enabled?: boolean | null
          font_family?: string | null
          footer_text?: string | null
          gallery_images?: Json | null
          hero_background_url?: string | null
          hero_badge_text?: string | null
          hero_cta_primary?: string | null
          hero_cta_secondary?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          og_image_url?: string | null
          prematricula_enabled?: boolean | null
          prematricula_subtitle?: string | null
          prematricula_title?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          show_powered_by?: boolean | null
          slug?: string | null
          social_links?: Json | null
          steps?: Json | null
          testimonials?: Json | null
        }
        Relationships: []
      }
      school_website_public_safe: {
        Row: {
          about_description: string | null
          about_features: Json | null
          about_title: string | null
          accent_color: string | null
          contact_subtitle: string | null
          contact_title: string | null
          differentials: Json | null
          enabled: boolean | null
          facebook_pixel_id: string | null
          font_family: string | null
          footer_text: string | null
          gallery_images: Json | null
          google_analytics_id: string | null
          google_tag_manager_id: string | null
          hero_background_url: string | null
          hero_badge_text: string | null
          hero_cta_primary: string | null
          hero_cta_secondary: string | null
          hero_subtitle: string | null
          hero_title: string | null
          map_embed_url: string | null
          og_image_url: string | null
          prematricula_enabled: boolean | null
          prematricula_fields: Json | null
          prematricula_subtitle: string | null
          prematricula_title: string | null
          primary_color: string | null
          secondary_color: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          show_map: boolean | null
          show_powered_by: boolean | null
          slug: string | null
          social_links: Json | null
          steps: Json | null
          tenant_id: string | null
          testimonials: Json | null
        }
        Insert: {
          about_description?: string | null
          about_features?: Json | null
          about_title?: string | null
          accent_color?: string | null
          contact_subtitle?: string | null
          contact_title?: string | null
          differentials?: Json | null
          enabled?: boolean | null
          facebook_pixel_id?: string | null
          font_family?: string | null
          footer_text?: string | null
          gallery_images?: Json | null
          google_analytics_id?: string | null
          google_tag_manager_id?: string | null
          hero_background_url?: string | null
          hero_badge_text?: string | null
          hero_cta_primary?: string | null
          hero_cta_secondary?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          map_embed_url?: string | null
          og_image_url?: string | null
          prematricula_enabled?: boolean | null
          prematricula_fields?: Json | null
          prematricula_subtitle?: string | null
          prematricula_title?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          show_map?: boolean | null
          show_powered_by?: boolean | null
          slug?: string | null
          social_links?: Json | null
          steps?: Json | null
          tenant_id?: string | null
          testimonials?: Json | null
        }
        Update: {
          about_description?: string | null
          about_features?: Json | null
          about_title?: string | null
          accent_color?: string | null
          contact_subtitle?: string | null
          contact_title?: string | null
          differentials?: Json | null
          enabled?: boolean | null
          facebook_pixel_id?: string | null
          font_family?: string | null
          footer_text?: string | null
          gallery_images?: Json | null
          google_analytics_id?: string | null
          google_tag_manager_id?: string | null
          hero_background_url?: string | null
          hero_badge_text?: string | null
          hero_cta_primary?: string | null
          hero_cta_secondary?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          map_embed_url?: string | null
          og_image_url?: string | null
          prematricula_enabled?: boolean | null
          prematricula_fields?: Json | null
          prematricula_subtitle?: string | null
          prematricula_title?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          show_map?: boolean | null
          show_powered_by?: boolean | null
          slug?: string | null
          social_links?: Json | null
          steps?: Json | null
          tenant_id?: string | null
          testimonials?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "school_website_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      security_summary: {
        Row: {
          allowed_requests: number | null
          cross_tenant_attempts: number | null
          denied_requests: number | null
          suspicious_requests: number | null
          total_requests: number | null
          unique_tenants: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      subscription_plans_public: {
        Row: {
          active: boolean | null
          color: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          limite_alunos: number | null
          limite_usuarios: number | null
          name: string | null
          popular: boolean | null
          price: number | null
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          limite_alunos?: number | null
          limite_usuarios?: number | null
          name?: string | null
          popular?: boolean | null
          price?: number | null
        }
        Update: {
          active?: boolean | null
          color?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          limite_alunos?: number | null
          limite_usuarios?: number | null
          name?: string | null
          popular?: boolean | null
          price?: number | null
        }
        Relationships: []
      }
      system_managers_safe: {
        Row: {
          created_at: string | null
          email_masked: string | null
          id: string | null
          is_active: boolean | null
          nome: string | null
          phone_masked: string | null
          platform_role: string | null
        }
        Insert: {
          created_at?: string | null
          email_masked?: never
          id?: string | null
          is_active?: boolean | null
          nome?: string | null
          phone_masked?: never
          platform_role?: string | null
        }
        Update: {
          created_at?: string | null
          email_masked?: never
          id?: string | null
          is_active?: boolean | null
          nome?: string | null
          phone_masked?: never
          platform_role?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      anonymize_old_logs: { Args: never; Returns: Json }
      atualizar_status_faturas: { Args: never; Returns: undefined }
      can_view_security_summary: { Args: never; Returns: boolean }
      criar_notificacao: {
        Args: {
          p_link?: string
          p_message: string
          p_tenant_id: string
          p_title: string
          p_type?: string
        }
        Returns: string
      }
      detect_suspicious_patterns: {
        Args: { p_minutes?: number; p_user_id: string }
        Returns: {
          cross_tenant_attempts: number
          denied_requests: number
          is_suspicious: boolean
          total_requests: number
          unique_tenants_accessed: number
        }[]
      }
      fix_asaas_status_inconsistencies: {
        Args: never
        Returns: {
          asaas_status: string
          fatura_id: string
          new_status: string
          old_status: string
        }[]
      }
      generate_ponto_token: {
        Args: { p_funcionario_id: string }
        Returns: string
      }
      gerar_despesas_recorrentes: { Args: never; Returns: number }
      gerar_faturas_aluno:
        | {
            Args: {
              p_aluno_id: string
              p_curso_id: string
              p_data_inicio: string
              p_valor: number
            }
            Returns: undefined
          }
        | {
            Args: {
              p_aluno_id: string
              p_curso_id: string
              p_data_inicio: string
              p_quantidade_meses?: number
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
      get_escola_public_info_by_tenant: {
        Args: { p_tenant_id: string }
        Returns: {
          logo_url: string
          nome: string
          primary_color: string
          secondary_color: string
        }[]
      }
      get_overdue_invoices_summary: {
        Args: never
        Returns: {
          aging_ate30: number
          aging_de31a60: number
          aging_mais60: number
          total_faturas_vencidas: number
          total_responsaveis_inadimplentes: number
          total_valor_vencido: number
        }[]
      }
      get_public_website_by_slug: {
        Args: { p_slug: string }
        Returns: {
          about_description: string
          about_features: Json
          about_title: string
          accent_color: string
          differentials: Json
          enabled: boolean
          font_family: string
          footer_text: string
          gallery_images: Json
          hero_background_url: string
          hero_badge_text: string
          hero_cta_primary: string
          hero_cta_secondary: string
          hero_subtitle: string
          hero_title: string
          prematricula_enabled: boolean
          prematricula_subtitle: string
          prematricula_title: string
          primary_color: string
          secondary_color: string
          seo_description: string
          seo_title: string
          show_powered_by: boolean
          slug: string
          testimonials: Json
        }[]
      }
      get_public_website_contact: {
        Args: { p_slug: string }
        Returns: {
          map_url: string
          show_map: boolean
          social_links: Json
          whatsapp_formatted: string
        }[]
      }
      get_public_website_safe: {
        Args: { p_slug: string }
        Returns: {
          about_description: string
          about_features: Json
          about_title: string
          accent_color: string
          contact_subtitle: string
          contact_title: string
          differentials: Json
          enabled: boolean
          facebook_pixel_id: string
          font_family: string
          footer_text: string
          gallery_images: Json
          google_analytics_id: string
          google_tag_manager_id: string
          hero_background_url: string
          hero_badge_text: string
          hero_cta_primary: string
          hero_cta_secondary: string
          hero_subtitle: string
          hero_title: string
          map_embed_url: string
          og_image_url: string
          prematricula_enabled: boolean
          prematricula_fields: Json
          prematricula_subtitle: string
          prematricula_title: string
          primary_color: string
          secondary_color: string
          seo_description: string
          seo_keywords: string
          seo_title: string
          show_map: boolean
          show_powered_by: boolean
          slug: string
          social_links: Json
          steps: Json
          tenant_id: string
          testimonials: Json
        }[]
      }
      get_school_user_role: { Args: { _user_id: string }; Returns: string }
      get_school_user_tenant_id: { Args: never; Returns: string }
      get_security_summary: {
        Args: never
        Returns: {
          allowed_requests: number
          cross_tenant_attempts: number
          denied_requests: number
          suspicious_requests: number
          total_requests: number
          unique_tenants: number
          unique_users: number
        }[]
      }
      get_tenant_by_domain: {
        Args: { p_domain: string }
        Returns: {
          blocked_at: string
          id: string
          logo_url: string
          nome: string
          primary_color: string
          secondary_color: string
          slug: string
          status: string
        }[]
      }
      get_tenant_by_identifier: {
        Args: { p_identifier: string; p_type?: string }
        Returns: {
          blocked_at: string
          id: string
          logo_url: string
          nome: string
          primary_color: string
          secondary_color: string
          slug: string
          status: string
        }[]
      }
      get_tenant_by_slug: {
        Args: { p_slug: string }
        Returns: {
          blocked_at: string
          email: string
          endereco: string
          id: string
          logo_url: string
          nome: string
          primary_color: string
          secondary_color: string
          slug: string
          status: string
          telefone: string
        }[]
      }
      get_user_tenant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_in_grace_period: { Args: { p_tenant_id: string }; Returns: boolean }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      is_school_user: { Args: { _user_id: string }; Returns: boolean }
      is_system_manager: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_blocked: { Args: { p_tenant_id: string }; Returns: boolean }
      log_lead_export: {
        Args: {
          p_export_format?: string
          p_lead_ids: string[]
          p_metadata?: Json
        }
        Returns: string
      }
      log_manager_action: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: string
      }
      log_security_access: {
        Args: {
          p_action: string
          p_error_message?: string
          p_metadata?: Json
          p_operation?: string
          p_resource_id?: string
          p_resource_type: string
          p_status?: string
          p_target_tenant_id?: string
        }
        Returns: string
      }
      log_security_event: {
        Args: { p_details?: Json; p_event_type: string }
        Returns: undefined
      }
      log_security_event_v2: {
        Args: {
          p_action: string
          p_event_type: string
          p_metadata?: Json
          p_new_value?: Json
          p_old_value?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_severity?: string
        }
        Returns: string
      }
      manager_has_permission: {
        Args: { p_manager_id: string; p_permission: string }
        Returns: boolean
      }
      mark_overdue_faturas: { Args: never; Returns: number }
      recalcular_fatura: { Args: { p_fatura_id: string }; Returns: undefined }
      recalculate_overdue_interest: { Args: never; Returns: number }
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
      validate_school_user_for_tenant: {
        Args: { p_tenant_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      aluno_status: "ativo" | "trancado" | "cancelado" | "transferido"
      app_role:
        | "admin"
        | "staff"
        | "financeiro"
        | "secretaria"
        | "platform_admin"
      contrato_tipo: "clt" | "pj" | "temporario" | "estagio"
      funcionario_status: "ativo" | "inativo" | "afastado" | "ferias"
      funcionario_tipo: "professor" | "administrativo" | "outro"
      gateway_environment: "sandbox" | "production"
      payment_gateway_type:
        | "asaas"
        | "mercado_pago"
        | "stripe"
        | "pagarme"
        | "gerencianet"
        | "pix_banco"
        | "custom_api"
      payment_method_type:
        | "pix"
        | "boleto"
        | "credit_card"
        | "debit_card"
        | "bank_transfer"
      platform_role:
        | "super_admin"
        | "admin_financeiro"
        | "suporte"
        | "read_only"
      subscription_status:
        | "trial"
        | "active"
        | "past_due"
        | "cancelled"
        | "suspended"
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
      app_role: [
        "admin",
        "staff",
        "financeiro",
        "secretaria",
        "platform_admin",
      ],
      contrato_tipo: ["clt", "pj", "temporario", "estagio"],
      funcionario_status: ["ativo", "inativo", "afastado", "ferias"],
      funcionario_tipo: ["professor", "administrativo", "outro"],
      gateway_environment: ["sandbox", "production"],
      payment_gateway_type: [
        "asaas",
        "mercado_pago",
        "stripe",
        "pagarme",
        "gerencianet",
        "pix_banco",
        "custom_api",
      ],
      payment_method_type: [
        "pix",
        "boleto",
        "credit_card",
        "debit_card",
        "bank_transfer",
      ],
      platform_role: [
        "super_admin",
        "admin_financeiro",
        "suporte",
        "read_only",
      ],
      subscription_status: [
        "trial",
        "active",
        "past_due",
        "cancelled",
        "suspended",
      ],
    },
  },
} as const
