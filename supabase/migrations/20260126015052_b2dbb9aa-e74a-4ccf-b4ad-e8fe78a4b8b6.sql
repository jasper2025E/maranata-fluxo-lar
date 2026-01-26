-- Adicionar configurações de domínio do sistema na tabela platform_settings
INSERT INTO platform_settings (key, value, description)
VALUES 
  ('system_domain', '{"value": ""}', 'Domínio principal do sistema para subdomínios das escolas'),
  ('system_domain_verified', '{"value": false}', 'Status de verificação do domínio do sistema'),
  ('system_domain_ssl_status', '{"value": "pending"}', 'Status do certificado SSL wildcard')
ON CONFLICT (key) DO NOTHING;