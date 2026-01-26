
# Plano: Versículos Bíblicos Aleatórios no Sistema

## Visão Geral

Implementar uma funcionalidade que exibe um versículo bíblico aleatório toda vez que uma pessoa acessa o sistema. O versículo será mostrado no local onde atualmente aparece "É bom ter você de volta!" na página do Gestor (e opcionalmente no Dashboard das escolas).

## Estrutura Proposta

### 1. Criar Arquivo de Versículos

Criar um arquivo `src/lib/biblicalVerses.ts` contendo uma coleção de versículos bíblicos inspiradores em português:

```text
src/lib/
└── biblicalVerses.ts    # Array com ~30-50 versículos + função para selecionar aleatório
```

**Exemplo de versículos incluídos:**
- "Porque eu sei os planos que tenho para vocês, diz o Senhor..." (Jeremias 29:11)
- "Tudo posso naquele que me fortalece." (Filipenses 4:13)
- "O Senhor é o meu pastor, nada me faltará." (Salmo 23:1)
- "Confia no Senhor de todo o teu coração..." (Provérbios 3:5-6)
- E mais ~40 versículos edificantes

### 2. Atualizar PlatformDashboard (Gestor)

Modificar `src/pages/platform/PlatformDashboard.tsx`:

- Importar a função `getRandomVerse()` do novo arquivo
- Usar `useState` com `useMemo` para selecionar um versículo ao carregar a página
- Substituir o texto "É bom ter você de volta!" pelo versículo selecionado
- Adicionar a referência bíblica (livro, capítulo:versículo) abaixo

**Layout visual proposto:**
```text
┌─────────────────────────────────────────────────┐
│ ✨ Painel do Gestor                             │
│                                                 │
│ "Porque eu sei os planos que tenho para vocês,  │
│  diz o Senhor, planos de paz e não de mal..."   │
│                                                 │
│ — Jeremias 29:11                                │
│                                                 │
│ Gerencie todas as escolas da plataforma...      │
└─────────────────────────────────────────────────┘
```

### 3. Atualizar Dashboard das Escolas (Opcional)

Se desejar, também podemos adicionar o versículo no Dashboard principal (`src/pages/Dashboard.tsx`) com um banner similar ao do Gestor.

## Arquivos a Modificar/Criar

| Arquivo | Ação |
|---------|------|
| `src/lib/biblicalVerses.ts` | **CRIAR** - Lista de versículos e função de seleção |
| `src/pages/platform/PlatformDashboard.tsx` | **EDITAR** - Integrar versículo no banner |
| `src/pages/Dashboard.tsx` | **EDITAR (opcional)** - Adicionar banner com versículo |

## Detalhes Técnicos

### Interface do Versículo
```typescript
interface BibleVerse {
  text: string;      // Texto do versículo
  reference: string; // Referência (ex: "João 3:16")
}
```

### Função de Seleção
```typescript
export function getRandomVerse(): BibleVerse {
  const randomIndex = Math.floor(Math.random() * verses.length);
  return verses[randomIndex];
}
```

### Uso no Componente
```typescript
const [verse] = useState(() => getRandomVerse());

// No JSX:
<h1>{verse.text}</h1>
<span>— {verse.reference}</span>
```

## Comportamento

- **Novo versículo a cada acesso**: O versículo muda toda vez que a página é carregada/recarregada
- **Estilo elegante**: O versículo aparece em itálico com a referência em fonte menor
- **Não afeta navegação**: Navegar entre páginas e voltar ao dashboard mantém o mesmo versículo (até recarregar)

## Categorias de Versículos Sugeridos

1. **Liderança e Gestão** - Para inspirar gestores
2. **Fé e Confiança** - Versículos de encorajamento
3. **Sabedoria** - Provérbios e ensinamentos
4. **Educação** - Versículos sobre ensino e conhecimento
5. **Gratidão** - Versículos de agradecimento
