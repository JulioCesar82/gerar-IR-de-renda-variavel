# Documentação do Projeto

Esta pasta contém a documentação detalhada do projeto Gerador de Relatório IRRF via B3. A documentação está organizada nas seguintes seções:

## 1. Visão do Produto (`/vision`)

Esta seção descreve a visão geral do produto, o público-alvo e os objetivos do projeto.

-   **[01-visao-produto.md](./vision/01-visao-produto.md):** Descreve a visão do produto, os problemas que ele resolve e para quem ele se destina.
-   **[02-user-stories.md](./vision/02-user-stories.md):** Contém as histórias de usuário que guiaram o desenvolvimento.
-   **[03-roadmap.md](./vision/03-roadmap.md):** Apresenta o roadmap do produto com as funcionalidades planejadas.

## 2. Arquitetura (`/architecture`)

Esta seção detalha a arquitetura de software da aplicação, baseada na Arquitetura Hexagonal (Ports and Adapters).

-   **[00-dominios.md](./architecture/00-dominios.md):** Mapeia os grandes domínios de negócio do sistema (atravessando as camadas descritas nos documentos abaixo) e observações de acoplamento entre eles.
-   **[01-visao-geral.md](./architecture/01-visao-geral.md):** Fornece uma visão geral da arquitetura, seus componentes e o fluxo de dados.
-   **[02-modelos-dominio.md](./architecture/02-modelos-dominio.md):** Descreve os modelos de domínio centrais da aplicação.
-   **[03-portas-interfaces.md](./architecture/03-portas-interfaces.md):** Define as portas (interfaces) que separam o domínio da infraestrutura.
-   **[04-adaptadores.md](./architecture/04-adaptadores.md):** Detalha os adaptadores que implementam as portas.
-   **[05-interface-usuario.md](./architecture/05-interface-usuario.md):** Descreve a arquitetura da interface de usuário.
-   **[06-estrategia-testes.md](./architecture/06-estrategia-testes.md):** Apresenta a estratégia de testes adotada no projeto.
-   **[07-seguranca.md](./architecture/07-seguranca.md):** Discute as considerações de segurança da aplicação.
-   **[08-implantacao-operacoes.md](./architecture/08-implantacao-operacoes.md):** Descreve o processo de implantação e operações.

## 3. Banco de Dados (`/database`)

Esta seção fornece detalhes sobre a persistência e o gerenciamento de dados na aplicação.

-   **[01-visao-geral-fluxo-dados.md](./database/01-visao-geral-fluxo-dados.md):** Descreve o fluxo de dados e como eles são armazenados.
-   **[02-transformacoes-dados.md](./database/02-transformacoes-dados.md):** Detalha as transformações aplicadas aos dados.
-   **[03-consideracoes-qualidade-dados.md](./database/03-consideracoes-qualidade-dados.md):** Discute as considerações sobre a qualidade dos dados.

Esta documentação serve como uma referência técnica para desenvolvedores e partes interessadas do projeto.
