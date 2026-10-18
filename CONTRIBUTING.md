# Contribuições

Agradecemos o seu interesse em contribuir com o projeto Gerador de Relatório IRRF via B3! Toda contribuição é bem-vinda, seja reportando um bug, sugerindo uma melhoria ou enviando um pull request.

## Como Contribuir

### Reportando Bugs

Se você encontrar um bug, por favor, abra uma [issue](https://github.com/JulioCesar82/gerar-IR-de-renda-variavel/issues) e forneça o máximo de detalhes possível, incluindo:

-   Uma descrição clara e concisa do bug.
-   Passos para reproduzir o comportamento.
-   O comportamento esperado.
-   O comportamento atual.
-   Screenshots, se aplicável.

### Sugerindo Melhorias

Se você tem uma ideia para uma nova funcionalidade ou uma melhoria, sinta-se à vontade para abrir uma [issue](https://github.com/JulioCesar82/gerar-IR-de-renda-variavel/issues) para discutir a sua sugestão.

### Enviando Pull Requests

Para contribuir com código, siga os seguintes passos:

1.  **Faça um Fork do Repositório:**
    Clique no botão "Fork" no canto superior direito da página do repositório.

2.  **Clone o seu Fork:**
    ```bash
    git clone https://github.com/SEU-USUARIO/gerar-IR-de-renda-variavel.git
    cd gerar-IR-de-renda-variavel
    ```

3.  **Crie uma Nova Branch:**
    ```bash
    git checkout -b minha-nova-feature
    ```

4.  **Configure o Ambiente de Desenvolvimento:**
    -   Certifique-se de ter o [Node.js](https://nodejs.org/) (versão 18 ou superior) e o `npm` instalados.
    -   Instale as dependências do projeto:
        ```bash
        npm install -f
        ```
    -   Crie um arquivo `.env` na raiz do projeto e adicione a variável de ambiente necessária:
        ```
        REACT_APP_BRAPI_TOKEN=SEU_TOKEN_DA_BRAPI_AQUI
        ```
        *Observação: O token da [Brapi](https://brapi.dev/) é utilizado para obter informações adicionais sobre os tickers.*

5.  **Faça as Suas Alterações:**
    Implemente a sua nova funcionalidade ou correção de bug. Siga os padrões de código existentes.

6.  **Execute os Testes:**
    Antes de enviar o seu pull request, certifique-se de que todos os testes estão passando:
    ```bash
    npm test
    ```
    O comando `npm test` também executa um script Python (`scripts/generate_asset_tests.py`) para gerar casos de teste. Certifique-se de ter o Python instalado se precisar modificar ou gerar novos testes de ativos.

7.  **Faça o Commit das Suas Alterações:**
    ```bash
    git commit -m "feat: Adiciona nova funcionalidade" -m "Descrição detalhada das alterações."
    ```
    *Utilize [Conventional Commits](https://www.conventionalcommits.org/) para as mensagens de commit.*

8.  **Envie as Suas Alterações para o seu Fork:**
    ```bash
    git push origin minha-nova-feature
    ```

9.  **Abra um Pull Request:**
    Vá para o repositório original e abra um pull request da sua branch para a branch `main`. Forneça uma descrição clara das suas alterações no pull request.

## Padrões de Código

-   Utilizamos [ESLint](https://eslint.org/) (configuração em `package.json`) para verificar a consistência do código. Execute `npm run lint` antes de fazer o commit.
-   O projeto define um estilo de formatação em `.prettierrc`, mas o [Prettier](https://prettier.io/) ainda não é uma dependência instalada nem possui script `npm run format`. Recomendamos formatar pela extensão do Prettier no seu editor (respeitando o `.prettierrc`) até que isso seja padronizado via npm script.

Agradecemos a sua contribuição!
