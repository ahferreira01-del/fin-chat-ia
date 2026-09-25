<div align="center">

# 🌿 FinanChat AI

**Organização financeira pessoal inteligente por conversação com IA.**  
Controle receitas, despesas e metas conversando em linguagem natural com o **Fin**, seu assistente financeiro pessoal.

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start_v1-FF4154?style=for-the-badge&logo=tanstack&logoColor=white)](https://tanstack.com/start)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Lovable Cloud](https://img.shields.io/badge/Lovable_Cloud-PostgreSQL-16A34A?style=for-the-badge)](https://lovable.dev/)
[![AI SDK](https://img.shields.io/badge/AI_SDK-OpenAI_via_Gateway-10A37F?style=for-the-badge&logo=openai&logoColor=white)](https://sdk.vercel.ai/)

[Demo no Lovable](https://fin-chat-ia.lovable.app) • [Reportar Bug](https://github.com/ahferreira01-del/fin-chat-ia/issues)

</div>

---

## 📸 Demonstração Visual

Para incluir suas capturas de tela no GitHub, arraste os prints diretamente para o README no editor do GitHub:

| 1. Boas-vindas | 2. Dashboard Geral | 3. Chat Inteligente (Fin) |
| :---: | :---: | :---: |
| <img width="457" height="898" alt="image" src="https://github.com/user-attachments/assets/d656a964-2c57-422f-8ce5-e18cd778abe6" />| <img width="497" height="919" alt="image" src="https://github.com/user-attachments/assets/a6c3f511-ef74-45a8-a3f1-374838de49b6" />| <img width="457" height="919" alt="image" src="https://github.com/user-attachments/assets/5eeda8ea-b41f-49c2-9c35-f96d7b33b910" />|

| 4. Metas Financeiras | 5. Relatórios & Gráficos | 6. Onboarding & Perfil |
| :---: | :---: | :---: |
| <img width="469" height="909" alt="image" src="https://github.com/user-attachments/assets/c1d8cb46-1a52-4b39-9e83-be9e9477222a" />| <img width="464" height="913" alt="image" src="https://github.com/user-attachments/assets/12e1eb0f-43b5-4b04-86be-44f6d9d05c75" />| <img width="472" height="918" alt="image" src="https://github.com/user-attachments/assets/247d1569-3a3e-4ea0-b58b-48909f438d19" />|

---

## 💡 O que é o FinanChat AI?

O **FinanChat AI** é um gerenciador financeiro moderno, intuitivo e com foco em dispositivos móveis (*mobile-first*). Em vez de preencher formulários cansativos com dezenas de campos, você simplesmente conversa com o **Fin**:

> 🗣️ *"Gastei R$ 45 no almoço hoje"*  
> 🗣️ *"Recebi R$ 1.200 de um freelance"*  
> 🗣️ *"Quanto já gastei com alimentação esse mês?"*  
> 🗣️ *"Quero guardar R$ 150 na meta Viagem"*

O Fin interpreta o valor, a categoria e a data, e exibe um **cartão de confirmação interativo** para você aprovar antes de qualquer dado ser salvo.

---

## ✨ Principais Funcionalidades

- 💬 **Assistente Fin com Regra de Ouro Anti-Alucinação**:
  - Responde com base estritamente nos dados cadastrados na sua conta.
  - Nunca inventa valores, saldos, despesas ou comparações.
  - Se não houver dados suficientes, avisa com clareza e transparência.
- 🛡️ **Segurança em Primeiro Lugar**:
  - Toda ação financeira passa por confirmação prévia (**Confirmar / Editar / Cancelar**).
  - Toast de notificação com botão **Desfazer** após cada lançamento.
- 📊 **Dashboard Dinâmico**:
  - Saldo atual calculado pela regra: `Saldo = Saldo Inicial + Receitas − Despesas`.
  - Economia do mês: `Receitas do mês − Despesas do mês`.
  - Gráfico Donut de distribuição dos gastos.
  - Acesso rápido às metas ativas e últimas movimentações.
- 🎯 **Gestão de Metas**:
  - Crie objetivos financeiros com barra de progresso em tempo real.
  - Faça aportes diretamente pela aba Metas ou solicitando ao Fin pelo Chat.
- 📈 **Relatórios Completos**:
  - Gráficos de gastos por categoria padronizada.
  - Comparativo mensal e linha de evolução do saldo acumulado.
- 👥 **Modo Pessoal ou Familiar**:
  - Alterne o contexto financeiro facilmente nas configurações de perfil.
- 🔒 **Privacidade Total**:
  - Autenticação com e-mail/senha ou Google.
  - Proteção de dados com Row-Level Security (RLS) no PostgreSQL.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: TanStack Start v1 (React 19 + SSR + Vite 7)
- **Roteamento**: TanStack Router com rotas autenticadas (`/_authenticated`)
- **Estilização**: Tailwind CSS v4 com paleta semântica em OKLCH
- **Componentes**: Radix UI + shadcn/ui + Lucide Icons
- **Gráficos**: Recharts
- **Inteligência Artificial**: Vercel AI SDK (`streamText`) integrado ao Lovable AI Gateway
- **Banco de Dados & Auth**: Lovable Cloud (PostgreSQL + Auth + RLS)

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 20 ou superior) ou [Bun](https://bun.sh/)
- Git instalado

### 1. Clonar o repositório
```bash
git clone https://github.com/ahferreira01-del/fin-chat-ia.git
cd fin-chat-ia
