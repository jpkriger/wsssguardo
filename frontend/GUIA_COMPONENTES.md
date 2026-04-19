# Guia de Desenvolvimento de Componentes — WSS Sguardo

## Stack

- **React 19** + **TypeScript**
- **Tailwind CSS v4** (via Vite plugin)
- **shadcn/ui** (Base library, preset Vega)
- **Lucide React** (ícones)
- **class-variance-authority (CVA)** para variantes
- **`cn()`** helper em `src/lib/utils.ts` para merge de classes

---

## 1. Adicionando componentes shadcn

Os componentes do shadcn são copiados para o projeto (não são dependência npm). Para adicionar um novo:

```bash
# dentro da pasta frontend/
bunx shadcn@latest add <nome-do-componente>

# exemplos:
bunx shadcn@latest add card
bunx shadcn@latest add dialog
bunx shadcn@latest add input
bunx shadcn@latest add avatar
```

> Se não tiver `bun` instalado, use `npx shadcn@latest add <componente>`.

Os arquivos são gerados em `src/components/ui/`. **Esses arquivos não devem ser editados** crie componentes customizados na pasta src/components conforme a necessidade do projeto.

Para ver todos os componentes disponíveis: https://ui.shadcn.com/docs/components

---

## 2. Tokens de cor do tema

O tema WSS Sguardo define tokens em `src/index.css` que funcionam automaticamente com light/dark mode. Use sempre os tokens semânticos ao invés de cores hardcoded:

### Cores principais

| Token Tailwind              | Uso                                      |
| --------------------------- | ---------------------------------------- |
| `bg-background`             | Fundo da página                          |
| `text-foreground`           | Texto principal                          |
| `bg-card` / `text-card-foreground` | Cards e containers              |
| `bg-primary` / `text-primary` | Cor de destaque (Gold/Bronze)          |
| `text-primary-foreground`   | Texto sobre fundo primary               |
| `bg-secondary`              | Botões e elementos secundários           |
| `bg-muted` / `text-muted-foreground` | Texto e fundos com menor destaque |
| `bg-accent`                 | Hover, destaques sutis                   |
| `bg-destructive`            | Erros, ações destrutivas (vermelho)      |
| `bg-success`                | Sucesso (verde)                          |
| `bg-warning`                | Alertas (âmbar)                          |
| `border-border`             | Bordas padrão                            |
| `ring-ring`                 | Focus ring                               |

### Exemplos de uso

```tsx
// ✅ Correto — usa tokens semânticos
<div className="bg-card text-card-foreground border border-border rounded-lg p-4">
  <h2 className="text-primary">Título</h2>
  <p className="text-muted-foreground">Descrição</p>
</div>

// ❌ Errado — cor hardcoded, não respeita dark mode
<div className="bg-white text-gray-900 border-gray-200">
```

### Opacidade nos tokens

Tokens suportam modificadores de opacidade:

```tsx
<div className="bg-primary/10 text-primary">
  Badge com fundo sutil
</div>
```

---

## 3. Tipografia

A fonte do projeto é **Lato** (importada via Google Fonts). Os estilos de `h1`, `h2`, `h3`, `p` e `small` já estão definidos globalmente no CSS. Para textos genéricos, use as classes do Tailwind:

```tsx
<span className="text-sm font-semibold text-foreground">Label</span>
<span className="text-xs text-muted-foreground">Detalhe</span>
```

---

## 4. Radius (bordas arredondadas)

O tema define uma escala de radius baseada em `--radius: 0.625rem`:

| Classe Tailwind  | Valor                  |
| ---------------- | ---------------------- |
| `rounded-sm`     | `--radius * 0.6`       |
| `rounded-md`     | `--radius * 0.8`       |
| `rounded-lg`     | `--radius` (padrão)    |
| `rounded-xl`     | `--radius * 1.4`       |

---

## 5. Dark mode

O tema usa a classe `.dark` no `<html>`. O toggle é feito pelo `ThemeProvider`:

```tsx
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "@/components/theme-provider"

// No root do app:
<ThemeProvider>
  <App />
</ThemeProvider>

// Botão de toggle:
<ThemeToggle />

// Acessar o tema atual no código:
const { theme, toggleTheme } = useTheme()
```

Para estilos condicionais por tema, use o variant `dark:`:

```tsx
<div className="bg-card dark:bg-card/80">
```

> Na maioria dos casos os tokens já cuidam disso — só use `dark:` quando precisar de ajuste fino.

---

## 6. Criando um componente customizado

### Componente simples

```tsx
// src/components/status-badge.tsx
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "success" | "warning" | "error"
  children: React.ReactNode
  className?: string
}

const statusStyles = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-destructive/15 text-destructive",
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
      statusStyles[status],
      className
    )}>
      {children}
    </span>
  )
}
```

### Componente com variantes (CVA)

Para componentes com múltiplas variantes, use `class-variance-authority`:

```tsx
// src/components/ui/badge.tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/15 text-destructive",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
```

---

## 7. Utilitário `cn()`

Sempre use `cn()` (de `@/lib/utils`) para combinar classes. Ele faz merge inteligente de classes Tailwind, resolvendo conflitos:

```tsx
import { cn } from "@/lib/utils"

// merge correto: a última bg- vence
cn("bg-primary px-4", "bg-secondary") // → "bg-secondary px-4"

// aceita condicionais
cn("text-sm", isActive && "font-bold", className)
```

---

## 8. Animações disponíveis

O tema inclui uma animação de entrada pronta:

```tsx
<div className="animate-fade-in-up">Conteúdo com fade in</div>

{/* Com delay escalonado para listas */}
<div className="animate-fade-in-up delay-1">Item 1</div>
<div className="animate-fade-in-up delay-2">Item 2</div>
<div className="animate-fade-in-up delay-3">Item 3</div>
```

---

## 9. Ícones

Usamos **Lucide React**. Importe individualmente:

```tsx
import { Search, Plus, ChevronRight } from "lucide-react"

<Search className="h-4 w-4 text-muted-foreground" />
```

Catálogo completo: https://lucide.dev/icons

---

## 10. Estrutura de pastas

```
src/
├── components/
│   ├── ui/              ← componentes shadcn (button, card, input...)
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   └── MeuComponente/   ← componentes custom do projeto
│       ├── MeuComponente.tsx
│       └── MeuComponente.module.css  (se precisar de CSS isolado)
├── lib/
│   └── utils.ts          ← cn() helper
└── index.css             ← tokens do tema
```

---

## Checklist rápido para novos componentes

- [ ] Usar tokens semânticos de cor (`bg-primary`, `text-muted-foreground`, etc.)
- [ ] Aceitar `className` como prop e usar `cn()` para merge
- [ ] Nunca usar cores hardcoded (`bg-white`, `text-gray-500`, `#A48661`)
- [ ] Testar em light e dark mode
- [ ] Colocar em `src/components/ui/` se for genérico, ou em pasta própria se for específico
