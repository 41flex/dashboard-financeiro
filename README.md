```markdown
# Dashboard Financeiro — FinanceAI

Um dashboard financeiro pessoal e interativo desenvolvido para ajudar usuários a monitorar suas finanças, transações, metas e investimentos, além de acompanhar dados de mercado em tempo real. O FinanceAI integra dados de APIs financeiras para fornecer uma visão abrangente e atualizada do cenário financeiro, tudo em uma interface de usuário intuitiva.

## 🚀 Funcionalidades Principais

*   **Visão Geral Financeira**: Dashboard centralizado com um resumo das suas finanças.
*   **Monitoramento de Mercado**: Acompanhamento de cotações de ações e outros ativos financeiros em tempo real.
*   **Gestão de Transações**: Registro e visualização de entradas e saídas financeiras.
*   **Definição de Metas**: Criação e acompanhamento de metas financeiras.
*   **Carteira de Investimentos**: Gestão básica dos seus investimentos.
*   **Persistência de Dados**: Armazenamento local das suas transações e metas diretamente no navegador.

## 🛠️ Tecnologias Utilizadas

Este projeto é uma aplicação web puramente front-end, construída com tecnologias padrão da web:

*   **HTML5**: Para estruturar o conteúdo e a interface do dashboard de forma semântica.
*   **CSS3**: Para estilização e design responsivo, garantindo uma experiência de usuário agradável em diferentes dispositivos.
*   **JavaScript (Vanilla JS)**: A lógica principal da aplicação, responsável pela interatividade, manipulação de dados, chamadas de API, renderização dinâmica e gerenciamento do estado.
*   **APIs Externas**:
    *   **HG Brasil Finance**: Utilizada para obter dados financeiros e cotações de mercado em tempo real.
    *   **Alpha Vantage**: Integrada para acesso a informações detalhadas sobre ações e outros ativos financeiros.
*   **`localStorage`**: Usado para persistir dados do usuário (como transações e metas financeiras) diretamente no navegador, permitindo que as informações sejam mantidas entre as sessões.
*   **Google Fonts**: Para uma tipografia moderna e agradável, incluindo as famílias de fontes `DM Serif Display`, `DM Mono` e `Instrument Sans`.

## ⚙️ Como Instalar e Rodar o Projeto

Este projeto é uma aplicação cliente-side e não requer um servidor backend para sua execução.

### Pré-requisitos

Para que o dashboard possa exibir dados de mercado em tempo real, você precisará de chaves de API das seguintes plataformas:

*   **HG Brasil Finance**: Obtenha sua chave de API em [HG Brasil API](https://hgbrasil.com/fiance/).
*   **Alpha Vantage**: Obtenha sua chave de API em [Alpha Vantage API](https://www.alphavantage.co/).

### Instalação

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/seu-usuario/dashboard-financeiro.git
    cd dashboard-financeiro/dashboard
    ```

### Configuração das Chaves de API

1.  Abra o arquivo `dashboard/config.js` no seu editor de código.
2.  Substitua os valores `HG_API_KEY` e `ALPHA_API_KEY` pelas chaves que você obteve:

    ```javascript
    // ARQUIVO DE CONFIGURAÇÃO PÚBLICO (DO NAVEGADOR)
    // Guarde suas chaves aqui para o navegador carregar.

    const CONFIG = {
        HG_API_KEY: "SUA_CHAVE_HG_BRASIL", // Exemplo: "8c18e4b5"
        ALPHA_API_KEY: "SUA_CHAVE_ALPHA_VANTAGE" // Exemplo: "65KJ0QPPWLBM80SU"
    };
    ```
    *Observação: Este arquivo (`config.js`) é público e, portanto, suas chaves de API ficarão visíveis no navegador. Para ambientes de produção com requisitos de segurança mais rigorosos, é recomendável usar um backend para intermediar as chamadas de API e proteger suas chaves.*

### Execução

Após a configuração das chaves de API, você pode executar o dashboard abrindo o arquivo `index.html` em qualquer navegador web moderno:

1.  Navegue até o diretório `dashboard` no seu terminal.
2.  Execute um dos seguintes comandos, dependendo do seu sistema operacional:
    *   **macOS**: `open index.html`
    *   **Windows**: `start index.html`
    *   **Linux**: `xdg-open index.html`

Alternativamente, você pode simplesmente arrastar e soltar o arquivo `index.html` diretamente na janela do seu navegador.

A aplicação será carregada, exibindo o dashboard e buscando os dados de mercado configurados para fornecer uma experiência financeira personalizada.

## 📁 Estrutura do Projeto

```
dashboard-financeiro/
├── dashboard/
│   ├── .env            # (Arquivo para variáveis de ambiente, não usado diretamente neste front-end puro)
│   ├── config.js       # Armazena chaves de API e configurações globais (públicas)
│   ├── index.html      # O arquivo HTML principal que define a estrutura da interface
│   ├── script.js       # Contém toda a lógica JavaScript da aplicação
│   └── style.css       # Define os estilos e o layout visual do dashboard
└── README.md           # Este arquivo de documentação
```
```