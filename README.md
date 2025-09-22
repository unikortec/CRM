# README.md – Serra Nobre Pedidos

## 📂 Estrutura de Pastas
```
/portal/app/pedidos/
├── index.html
├── manifest.json
├── sw.js
├── css/
│   └── style.css
└── js/
    ├── firebase.js   # Configuração do Firebase (unikorapp)
    ├── utils.js      # Funções auxiliares (máscaras, normalização, etc.)
    ├── ui.js         # Controles de interface e eventos
    ├── clientes.js   # Cadastro e histórico de clientes
    ├── frete.js      # Cálculo de frete e integração API
    ├── itens.js      # Lógica de itens do pedido
    ├── pdf.js        # Geração do PDF (ajustado com nome e endereço)
    └── app.js        # Orquestra tudo (ponto de entrada)
```

## 🔑 Firebase
- Projeto configurado: **unikorapp**  
- Ver `js/firebase.js` para chaves e inicialização.

## 📄 PDF
- Nome do arquivo: `DoisPrimeirosNomes_DD_MM_AA_HH-MM.pdf`  
  Ex.: `VivariCasa_22_09_25_14-32.pdf`  
- Endereço: quebra automática de linha dentro da borda (nunca ultrapassa).

## ▶️ Como Rodar
1. Subir os arquivos em servidor estático (ex.: **Vercel**, **Netlify**) ou local:  
   ```bash
   npx serve portal/app/pedidos
   ```
2. Acessar em:  
   ```
   http://localhost:3000/portal/app/pedidos/
   ```
3. Para funcionar como **PWA**, precisa rodar em **HTTPS** (ex.: deploy na Vercel).
