# ZAP - WhatsApp Chat Parser

Um parser de conversas do WhatsApp com interface web moderna e funcional.

## 🚀 Deploy no Vercel

### Pré-requisitos
- Conta no [GitHub](https://github.com)
- Conta no [Vercel](https://vercel.com)

### Passos para Deploy

#### 1. Fazer Upload para o GitHub
1. Baixe esta pasta completa
2. Acesse [GitHub](https://github.com) e faça login
3. Clique em "New repository" (Novo repositório)
4. Nomeie o repositório (ex: `zap`)
5. Marque como "Public" ou "Private"
6. Clique em "Create repository"
7. Faça upload dos arquivos desta pasta para o repositório

#### 2. Conectar com Vercel
1. Acesse [Vercel](https://vercel.com) e faça login
2. Clique em "New Project"
3. Conecte sua conta do GitHub
4. Selecione o repositório `zap`
5. Configure as seguintes opções:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. Clique em "Deploy"

#### 3. Configurações Automáticas
O Vercel detectará automaticamente:
- Node.js como runtime
- Vite como framework
- Configurações de build do `package.json`

### 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm start

# Build para produção
npm run build
```

### 📁 Estrutura do Projeto

```
zap/
├── src/                 # Código fonte React
├── public/             # Arquivos públicos
├── package.json        # Dependências e scripts
├── vite.config.ts      # Configuração do Vite
└── tsconfig.json       # Configuração TypeScript
```

### 🔧 Scripts Disponíveis

- `npm start` - Inicia servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run lint` - Executa linter
- `npm run format` - Formata código

### 📝 Funcionalidades

- ✅ Parser de conversas do WhatsApp
- ✅ Interface moderna e responsiva
- ✅ Exportação de conversas
- ✅ Suporte a mídias (áudios, imagens)
- ✅ Modo escuro/claro

### 🌐 URL de Produção

Após o deploy, sua aplicação estará disponível em:
`https://seu-projeto.vercel.app`

### 📞 Suporte

Se encontrar problemas durante o deploy:
1. Verifique os logs no painel do Vercel
2. Confirme se todos os arquivos foram enviados para o GitHub
3. Verifique se as configurações de build estão corretas

---

**Desenvolvido com ❤️ usando React + Vite + TypeScript**
