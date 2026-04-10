# 📋 Briefing de Obra — JD Engenharia

Formulário de briefing com geração de PDF e envio por e-mail automático.

---

## 🚀 Como fazer o deploy (passo a passo)

### 1. Criar conta no Resend (gratuito)
1. Acesse https://resend.com e crie uma conta gratuita
2. Vá em **API Keys** → **Create API Key**
3. Copie a chave (começa com `re_...`)
4. Vá em **Domains** → adicione seu domínio OU use o domínio de teste `onboarding@resend.dev`
   > ⚠️ No modo de teste, o `from` deve ser `onboarding@resend.dev` e só envia para o e-mail da sua conta

### 2. Deploy no Netlify
1. Acesse https://netlify.com e faça login
2. Clique em **Add new site** → **Deploy manually**
3. Arraste a pasta `briefing-projeto` inteira
4. Aguarde o deploy

### 3. Configurar variável de ambiente
1. No painel do site no Netlify, vá em:
   **Site settings → Environment variables → Add variable**
2. Adicione:
   - **Key:** `RESEND_API_KEY`
   - **Value:** `re_sua_chave_aqui`
3. Clique em **Save**
4. Vá em **Deploys → Trigger deploy → Deploy site** para aplicar

### 4. (Opcional) Domínio próprio
- No Resend, adicione e verifique seu domínio
- Mude o `from` na função para `briefing@seudominio.com.br`

---

## 📁 Estrutura do projeto

```
briefing-projeto/
├── public/
│   └── index.html          ← Formulário (não mexer)
├── netlify/
│   └── functions/
│       └── briefing.js     ← Gera PDF + envia e-mail
├── package.json
├── netlify.toml
└── README.md
```

---

## ✅ O que acontece ao enviar o formulário

1. Cliente preenche e clica em **"Enviar Briefing pelo WhatsApp"**
2. **WhatsApp abre** com o resumo em texto (como antes)
3. **Netlify Function** é chamada em paralelo:
   - Gera o PDF completo com todos os dados
   - Envia para **jherllymarlon@gmail.com** com o PDF anexado
4. Tela de sucesso é exibida

---

## 🔧 Suporte

- Resend docs: https://resend.com/docs
- Netlify Functions: https://docs.netlify.com/functions/overview/
