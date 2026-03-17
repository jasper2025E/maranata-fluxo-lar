
-- 1. Tabela de documentos legais versionados
CREATE TABLE public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1.0',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  content_hash TEXT NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slug, version, tenant_id)
);

-- 2. Tabela de aceites do usuário
CREATE TABLE public.user_legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.legal_documents(id),
  document_version TEXT NOT NULL,
  document_hash TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_cpf_cnpj TEXT,
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id UUID REFERENCES public.tenants(id),
  UNIQUE(user_id, document_id, document_version)
);

-- 3. RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_legal_acceptances ENABLE ROW LEVEL SECURITY;

-- legal_documents: leitura para authenticated (documentos ativos são globais ou por tenant)
CREATE POLICY "Users can read active legal documents"
  ON public.legal_documents FOR SELECT TO authenticated
  USING (is_active = true AND (tenant_id IS NULL OR tenant_id = public.get_user_tenant_id()));

-- user_legal_acceptances: usuário lê apenas seus aceites
CREATE POLICY "Users can read own acceptances"
  ON public.user_legal_acceptances FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- user_legal_acceptances: usuário insere apenas para si
CREATE POLICY "Users can insert own acceptances"
  ON public.user_legal_acceptances FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. Trigger para auto-set tenant_id
CREATE TRIGGER set_legal_acceptances_tenant
  BEFORE INSERT ON public.user_legal_acceptances
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

-- 5. RPC para aceitar documento com captura de IP
CREATE OR REPLACE FUNCTION public.accept_legal_document(
  p_document_id UUID,
  p_document_version TEXT,
  p_document_hash TEXT,
  p_user_name TEXT,
  p_user_email TEXT,
  p_user_cpf_cnpj TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
  v_ip TEXT;
  v_ua TEXT;
BEGIN
  -- Capturar IP e User-Agent dos headers
  BEGIN
    v_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
    v_ua := current_setting('request.headers', true)::json->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
    v_ua := NULL;
  END;

  INSERT INTO public.user_legal_acceptances (
    user_id, document_id, document_version, document_hash,
    user_name, user_email, user_cpf_cnpj, ip_address, user_agent,
    tenant_id
  ) VALUES (
    auth.uid(), p_document_id, p_document_version, p_document_hash,
    p_user_name, p_user_email, p_user_cpf_cnpj, v_ip, v_ua,
    get_user_tenant_id()
  )
  ON CONFLICT (user_id, document_id, document_version) DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 6. Seed dos 4 documentos legais (tenant_id = NULL = global)
INSERT INTO public.legal_documents (slug, title, content, version, effective_date, is_active, content_hash) VALUES
(
  'lgpd',
  'Termo de Consentimento LGPD',
  E'# Termo de Consentimento para Tratamento de Dados Pessoais\n\n**Versão 1.0 — Data de Vigência: 17/03/2026**\n\n## 1. Controlador dos Dados\nA instituição de ensino contratante do sistema ("Escola") atua como **Controlador** dos dados pessoais, nos termos da Lei nº 13.709/2018 (LGPD).\n\n## 2. Operador dos Dados\nA plataforma Maranata Fluxo atua como **Operador** dos dados, processando informações pessoais exclusivamente conforme instruções do Controlador.\n\n## 3. Finalidade do Tratamento\nOs dados pessoais são coletados e tratados para as seguintes finalidades:\n- Gestão acadêmica (matrículas, frequência, notas, histórico escolar)\n- Gestão financeira (emissão de faturas, cobranças, controle de inadimplência)\n- Comunicação institucional (avisos, boletins, comunicados aos responsáveis)\n- Gestão de recursos humanos (folha de pagamento, contratos, ponto eletrônico)\n- Cumprimento de obrigações legais e regulatórias\n\n## 4. Base Legal\nO tratamento de dados fundamenta-se nas seguintes bases legais (Art. 7º da LGPD):\n- **Execução de contrato** (Art. 7º, V): para prestação dos serviços educacionais\n- **Cumprimento de obrigação legal** (Art. 7º, II): para atendimento a normas do MEC e legislação trabalhista\n- **Consentimento** (Art. 7º, I): para finalidades específicas não cobertas pelas demais bases\n- **Interesse legítimo** (Art. 7º, IX): para melhoria dos serviços e segurança do sistema\n\n## 5. Dados Coletados\nPodem ser coletados os seguintes dados:\n- **Dados de identificação**: nome completo, CPF/CNPJ, RG, data de nascimento\n- **Dados de contato**: endereço, telefone, e-mail\n- **Dados acadêmicos**: matrícula, notas, frequência, histórico escolar\n- **Dados financeiros**: valores de mensalidade, histórico de pagamentos, dados bancários\n- **Dados de acesso**: endereço IP, logs de acesso, cookies de sessão\n- **Dados de menores**: mediante consentimento expresso do responsável legal\n\n## 6. Compartilhamento de Dados\nOs dados poderão ser compartilhados com:\n- Gateways de pagamento (Asaas, Stripe) para processamento financeiro\n- Órgãos governamentais quando exigido por lei\n- Prestadores de serviços essenciais (hospedagem, e-mail transacional)\n\nNão realizamos venda ou compartilhamento de dados para fins de marketing de terceiros.\n\n## 7. Retenção de Dados\n- **Dados acadêmicos**: mantidos por tempo indeterminado conforme legislação educacional\n- **Dados financeiros**: mantidos por 5 (cinco) anos após encerramento do contrato\n- **Logs de acesso**: mantidos por 6 (seis) meses, anonimizados após este período\n- **Dados de RH**: mantidos por 5 (cinco) anos após desligamento do funcionário\n\n## 8. Direitos do Titular\nO titular dos dados tem direito a:\n- **Confirmação** da existência de tratamento\n- **Acesso** aos dados tratados\n- **Correção** de dados incompletos ou desatualizados\n- **Anonimização, bloqueio ou eliminação** de dados desnecessários\n- **Portabilidade** dos dados a outro fornecedor\n- **Eliminação** dos dados tratados com consentimento\n- **Revogação** do consentimento\n\nPara exercer esses direitos, entre em contato com o Encarregado de Dados (DPO) da Escola.\n\n## 9. Segurança\nImplementamos medidas técnicas e organizacionais para proteger os dados pessoais, incluindo:\n- Criptografia em trânsito (TLS/SSL) e em repouso\n- Controle de acesso baseado em funções (RBAC)\n- Isolamento de dados multi-tenant via Row Level Security\n- Logs de auditoria imutáveis\n- Backups regulares com retenção controlada\n\n## 10. Consentimento\nAo marcar a caixa abaixo, você declara que:\n- Leu e compreendeu integralmente este termo\n- Consente com o tratamento de seus dados conforme descrito\n- Está ciente de seus direitos como titular de dados',
  'v1.0',
  '2026-03-17',
  true,
  encode(sha256(convert_to('lgpd-v1.0-seed', 'utf8')), 'hex')
),
(
  'politica-privacidade',
  'Política de Privacidade',
  E'# Política de Privacidade\n\n**Versão 1.0 — Data de Vigência: 17/03/2026**\n\n## 1. Introdução\nEsta Política de Privacidade descreve como a plataforma Maranata Fluxo coleta, usa, armazena e protege as informações pessoais dos usuários.\n\n## 2. Coleta de Informações\nColetamos informações de duas formas:\n- **Informações fornecidas diretamente**: dados cadastrais, documentos, informações financeiras\n- **Informações coletadas automaticamente**: endereço IP, tipo de navegador, páginas visitadas, horários de acesso, cookies de sessão\n\n## 3. Cookies e Tecnologias de Rastreamento\nUtilizamos cookies estritamente necessários para:\n- Manter sua sessão de autenticação ativa\n- Armazenar preferências de idioma e tema\n- Garantir a segurança da aplicação\n\nNão utilizamos cookies de marketing ou rastreamento de terceiros.\n\n## 4. Armazenamento e Segurança\n- Os dados são armazenados em servidores seguros com criptografia\n- Implementamos Row Level Security (RLS) para isolamento de dados\n- Realizamos backups diários com retenção de 30 dias\n- Monitoramos acessos e tentativas suspeitas em tempo real\n\n## 5. Direitos ARCO (Acesso, Retificação, Cancelamento, Oposição)\nVocê tem o direito de:\n- **Acessar** seus dados pessoais a qualquer momento\n- **Retificar** informações incorretas ou desatualizadas\n- **Cancelar/Eliminar** seus dados (respeitando obrigações legais de retenção)\n- **Opor-se** ao tratamento em determinadas circunstâncias\n\n## 6. Transferência Internacional de Dados\nOs dados podem ser processados em servidores localizados fora do Brasil para fins de:\n- Hospedagem em nuvem (infraestrutura global)\n- Processamento de pagamentos internacionais\n\nEm todos os casos, garantimos o mesmo nível de proteção exigido pela LGPD.\n\n## 7. Alterações nesta Política\nReservamos o direito de atualizar esta política. Notificaremos os usuários sobre alterações significativas e solicitaremos novo consentimento quando necessário.\n\n## 8. Contato\nPara dúvidas ou solicitações sobre privacidade, entre em contato com o Encarregado de Dados (DPO) da sua instituição de ensino.',
  'v1.0',
  '2026-03-17',
  true,
  encode(sha256(convert_to('politica-privacidade-v1.0-seed', 'utf8')), 'hex')
),
(
  'termos-uso',
  'Termos de Uso',
  E'# Termos de Uso do Sistema\n\n**Versão 1.0 — Data de Vigência: 17/03/2026**\n\n## 1. Aceitação dos Termos\nAo acessar e utilizar o sistema Maranata Fluxo, você concorda com estes Termos de Uso. Se não concordar, não utilize o sistema.\n\n## 2. Descrição do Serviço\nO Maranata Fluxo é uma plataforma de gestão escolar que oferece:\n- Gerenciamento de alunos e matrículas\n- Controle financeiro (faturas, cobranças, despesas)\n- Gestão de recursos humanos\n- Relatórios e dashboards analíticos\n- Comunicação com responsáveis\n\n## 3. Responsabilidades do Usuário\nO usuário se compromete a:\n- Manter suas credenciais de acesso em sigilo\n- Não compartilhar sua conta com terceiros\n- Utilizar o sistema apenas para fins legítimos\n- Manter os dados cadastrais atualizados\n- Reportar qualquer uso não autorizado ou suspeita de violação de segurança\n- Não tentar acessar dados de outros tenants/instituições\n\n## 4. Uso Aceitável\nÉ vedado:\n- Utilizar o sistema para fins ilegais\n- Tentar violar mecanismos de segurança\n- Realizar engenharia reversa do sistema\n- Extrair dados em massa sem autorização\n- Inserir conteúdo malicioso (scripts, vírus, etc.)\n\n## 5. Propriedade Intelectual\nO sistema, incluindo código, design, logotipos e funcionalidades, é propriedade da Maranata Fluxo. O acesso ao sistema não transfere qualquer direito de propriedade intelectual.\n\n## 6. Limitação de Responsabilidade\n- O sistema é fornecido "como está"\n- Não garantimos disponibilidade ininterrupta\n- Não nos responsabilizamos por decisões tomadas com base nos dados do sistema\n- Nossa responsabilidade é limitada ao valor pago pela assinatura nos últimos 12 meses\n\n## 7. Suspensão e Cancelamento\nReservamos o direito de suspender ou cancelar o acesso em caso de:\n- Violação destes termos\n- Inadimplência na assinatura\n- Uso abusivo ou fraudulento\n- Solicitação do próprio usuário\n\n## 8. Disponibilidade\n- Nos comprometemos com 99,5% de uptime mensal\n- Manutenções programadas serão comunicadas com 48h de antecedência\n- Incidentes críticos serão comunicados em até 4h\n\n## 9. Foro\nFica eleito o foro da comarca da sede da instituição contratante para dirimir quaisquer controvérsias.',
  'v1.0',
  '2026-03-17',
  true,
  encode(sha256(convert_to('termos-uso-v1.0-seed', 'utf8')), 'hex')
),
(
  'dpa',
  'Acordo de Processamento de Dados (DPA)',
  E'# Acordo de Processamento de Dados (DPA)\n\n**Versão 1.0 — Data de Vigência: 17/03/2026**\n\n## 1. Objeto\nEste Acordo de Processamento de Dados ("DPA") estabelece as obrigações e responsabilidades no tratamento de dados pessoais entre o Controlador (Escola) e o Operador (Maranata Fluxo).\n\n## 2. Definições\n- **Controlador**: A instituição de ensino que determina as finalidades e meios do tratamento\n- **Operador**: A Maranata Fluxo, que processa dados em nome do Controlador\n- **Sub-processador**: Terceiro contratado pelo Operador para auxiliar no processamento\n\n## 3. Obrigações do Operador\nA Maranata Fluxo se compromete a:\n- Processar dados pessoais exclusivamente conforme instruções do Controlador\n- Garantir que funcionários com acesso aos dados estejam sujeitos a obrigações de confidencialidade\n- Implementar medidas técnicas e organizacionais apropriadas de segurança\n- Auxiliar o Controlador no atendimento a solicitações de titulares\n- Não subcontratar sem autorização prévia do Controlador\n- Ao término do contrato, devolver ou eliminar dados conforme instrução do Controlador\n\n## 4. Sub-processadores\nOs seguintes sub-processadores são utilizados:\n\n| Sub-processador | Finalidade | Localização |\n|----------------|-----------|-------------|\n| Supabase | Hospedagem e banco de dados | EUA/Global |\n| Asaas | Processamento de pagamentos | Brasil |\n| Stripe | Processamento de pagamentos | EUA/Global |\n| Resend | Envio de e-mails transacionais | EUA |\n\nAlterações na lista de sub-processadores serão comunicadas com 30 dias de antecedência.\n\n## 5. Medidas de Segurança\nO Operador implementa as seguintes medidas:\n- **Criptografia**: TLS 1.2+ em trânsito, AES-256 em repouso\n- **Controle de Acesso**: RBAC, MFA, sessões com expiração automática\n- **Isolamento**: Multi-tenant com Row Level Security (RLS)\n- **Monitoramento**: Logs de auditoria imutáveis, alertas de segurança automatizados\n- **Backup**: Diário com retenção de 30 dias, teste de restauração mensal\n- **Desenvolvimento Seguro**: Code review, testes de segurança, princípio do menor privilégio\n\n## 6. Notificação de Incidentes\nEm caso de violação de dados pessoais:\n- O Operador notificará o Controlador em até **72 horas** após tomar conhecimento\n- A notificação incluirá: natureza da violação, dados afetados, medidas tomadas, recomendações\n- O Operador cooperará com o Controlador na comunicação à ANPD e aos titulares\n\n## 7. Transferência Internacional\n- Dados podem ser transferidos para sub-processadores em outros países\n- Todas as transferências são protegidas por cláusulas contratuais padrão\n- Garantimos nível de proteção equivalente ao exigido pela LGPD\n\n## 8. Auditoria\n- O Controlador pode solicitar evidências de conformidade\n- Relatórios de segurança são disponibilizados sob solicitação\n- Auditorias presenciais podem ser realizadas mediante agendamento prévio\n\n## 9. Vigência\nEste DPA permanece vigente durante toda a relação contratual e por 5 (cinco) anos após seu encerramento, no que diz respeito às obrigações de confidencialidade e proteção de dados.\n\n## 10. Responsabilidade\nCada parte será responsável por danos causados pelo descumprimento de suas obrigações neste DPA, nos limites da legislação aplicável.',
  'v1.0',
  '2026-03-17',
  true,
  encode(sha256(convert_to('dpa-v1.0-seed', 'utf8')), 'hex')
);
