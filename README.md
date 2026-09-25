# FinanChat AI: Your Finance Companion

Criar o aplicativo completo FinanChat AI, uma solução de organização financeira pessoal mobile-first baseada em conversação com Inteligência Artificial (o assistente Fin).

# 1. Identidade e Branding
- Nome: FinanChat AI
- Slogan: "Suas finanças, agora em forma de conversa."
- Logo / Símbolo: Balão de conversa integrado com gráfico de crescimento ascendente.
- Estilo: Mobile-first, limpo, fluido, minimalista e acolhedor (referências de UX: WhatsApp para chat, Notion para organização, Duolingo para didática).
- Paleta de Cores:
  * Verde Principal: #16A34A (ações de destaque, botões principais, crescimento)
  * Verde Claro / Suave: #D1FAE5 (destaques, badges)
  * Fundo da aplicação: #F8FAFC (cinza muito claro)
  * Cards e superfícies: #FFFFFF (branco puro com cantos arredondados e sombra suave)
  * Texto principal: #0F172A
  * Indicadores semânticos: Verde para receitas, Vermelho suave (#EF4444) para despesas, Azul suave (#3B82F6) para metas, Laranja (#F59E0B) para alertas.
- Tipografia: Inter, com alta legibilidade em valores numéricos e cartões.

# 2. Arquitetura de Telas e Navegação
Navegação inferior fixa (Bottom Navigation Bar) com 5 abas acessíveis a qualquer momento:
1. Dashboard (Tela inicial pós-login)
2. Chat (com o assistente Fin)
3. Metas
4. Relatórios
5. Perfil

Fluxo completo de telas:
- Tela de Boas-Vindas: Apresentação com o slogan, destaques de valor e botões "Começar" e "Entrar".
- Cadastro e Login: Simples e direto.
- Onboarding:
  * Pergunta de renda mensal estimada;
  * Pergunta opcional de saldo inicial disponível em conta (se omitido, padrão R$ 0,00);
  * Tipo de controle: "Controle Pessoal" ou "Controle Familiar" (no MVP adapta apenas o tom de voz e personalização da linguagem do Fin, mantendo a conta individual);
  * Criação opcional da primeira meta financeira.
- Tela Inicial (Dashboard pós-login):
  * Saudação personalizada (ex: "Olá, André 👋 Vamos ver como estão suas finanças hoje.");
  * CTA de destaque principal: "Conversar com o Fin" que leva direto para a aba de Chat;
  * Card Principal de destaque: Saldo Atual;
  * Cards Secundários: Receitas do Mês, Despesas do Mês, Economia Acumulada;
  * Gráfico simples Donut de gastos por categoria;
  * Cards horizontais das Metas ativas com barra de progresso percentual;
  * Lista de últimas movimentações com opções de visualizar, editar e excluir cada transação;
  * Empty states amigáveis caso não haja dados ainda ("Você ainda não registrou movimentações." com botão "Conversar com o Fin").
- Aba de Chat (O coração do produto):
  * Interface moderna estilo mensageiro com mensagens do usuário alinhadas à direita e do Fin à esquerda;
  * Pílulas de sugestões rápidas no topo ou rodapé: "+ Gastei dinheiro", "+ Recebi dinheiro", "+ Criar meta", "+ Como estão meus gastos?";
  * Card interativo de confirmação pré-registro: Sempre que o Fin detectar uma transação na fala do usuário, exibe antes de salvar um card com Tipo, Valor, Descrição, Categoria e Data, com botões [Confirmar], [Editar] e [Cancelar];
  * Feedback pós-registro com Toast / mensagem de sucesso ("✅ Despesa/Receita registrada com sucesso") acompanhado de ação rápida [Desfazer];
  * Suporte a inputs de texto e respostas contextuais instantâneas do Fin.
- Aba de Metas:
  * Listagem de metas ativas e concluídas com barras de progresso;
  * Detalhe de cada meta (Valor Atual / Valor Objetivo e % Concluído);
  * Registro de novos aportes via botão ou via chat ("Guardei R$ 200 para a viagem");
  * Empty state amigável ("Você ainda não possui metas cadastradas." com botão "Criar Meta").
- Aba de Relatórios:
  * Gráfico de gastos por categoria;
  * Comparação mensal e evolução no tempo (mês civil padrão: dia 1 ao último dia do mês);
  * Empty state amigável ("Registre movimentações para visualizar relatórios.").
- Aba de Perfil:
  * Dados do usuário, renda mensal cadastrada, saldo inicial, alternância entre tom pessoal/familiar e preferências.

# 3. Regras de Negócio e Matemática Financeira
- Saldo Atual = Saldo Inicial + Total de Receitas - Total de Despesas.
- Economia Acumulada = Total de Receitas do Mês - Total de Despesas do Mês (métrica simples e direta).
- Categorias Fixas de Despesa: Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Outros.
- Categorias Fixas de Receita: Salário, Freelance, Venda, Outros.
- Sem categorias personalizadas no MVP. Se houver dúvida ou ambiguidade, classificar em "Outros" ou pedir confirmação.
- Datas: Quando não especificado pelo usuário, utilizar a data/hora atual da mensagem enviada. Tratar termos relativos como "ontem", "anteontem", "dia 15". Fechamento de relatórios sempre pelo mês civil padrão.
- Metas: Não possuem data limite obrigatória no MVP; o progresso avança estritamente com aportes registrados.
- Edição e Exclusão: Qualquer transação editada ou excluída atualiza instantaneamente o Saldo, o Dashboard, as Metas e os Relatórios.

# 4. Comportamento e Regras de Ouro do Fin
- Nome: Fin.
- Tom de voz: Amigável, educado, didático, motivador, positivo e objetivo.
- Regra de Ouro Anti-Alucinação: O Fin JAMAIS inventa valores, datas, saldos, receitas, despesas, metas ou comparações históricas. Utiliza estritamente os dados reais do sistema. Se faltar informação, faz perguntas objetivas antes de concluir o registro. Se não houver dados, responde com honestidade: "Ainda não possuo informações suficientes para responder essa pergunta."

# 5. Microinterações e Polimento
- Transições suaves e fade entre abas e mensagens;
- Microinterações rápidas ao confirmar registro, aportar em metas e atingir 100% de uma meta;
- Interface totalmente responsiva e polida mobile-first.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fin-chat-ia.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2c642cc9-4c96-4f61-8c20-791014bf565c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
