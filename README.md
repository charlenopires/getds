# getds — Design System Extractor

**getds** é uma extensão para Google Chrome desenvolvida para extrair automaticamente tokens de design, componentes e padrões de interface de qualquer página web. 

Com o **getds**, designers e desenvolvedores podem inspecionar rapidamente as decisões de design (como paletas de cores, tipografia, escalas de espaçamento e uso de componentes) adotadas em sites de referência, ajudando na criação e manutenção de Design Systems.

## 🚀 Funcionalidades

O **getds** roda diretamente no navegador e varre a página atual para identificar:

- **Tokens Primitivos e Semânticos:** Cores (Background, Texto, Bordas), Famílias Tipográficas, Tamanhos de Fonte (Escala Tipográfica), Sombras (Elevação) e Espaçamentos.
- **Detecção de Componentes:** Identificação estrutural de elementos complexos como Botões, Cards, Modais, Navegação, Tabelas e Inputs de Formulário.
- **Animações e Movimento:** Extração de *keyframes*, transições CSS e animações web.
- **Variantes de Componentes:** Mapeamento de mudanças de estado (`:hover`, `:focus`, `:active`, `:disabled`).

## 📁 Estrutura do Projeto

A arquitetura da extensão está dividida nas seguintes pastas principais dentro de `src/`:

- `src/content/`: Scripts injetados nas páginas para ler e extrair os tokens e componentes do DOM e CSSOM. Possui diversos detectores e mapas focados em partes específicas do design (cores, tipografia, espaçamento, animações, etc).
- `src/popup/`: Interface visual da extensão que o usuário visualiza ao clicar no ícone do Chrome (HTML, CSS e scripts responsáveis pela comunicação do painel de captura).
- `src/background/`: *Service Workers* responsáveis por orquestrar a comunicação entre o `popup` e os `content scripts`, além de gerenciar eventos de ciclo de vida da extensão.

## 🛠 Tecnologias Utilizadas

- **JavaScript (Vanilla):** Lógica da extensão de ponta a ponta.
- **Bun:** Utilizado principalmente para execução de testes unitários ultrarrápidos.
- **Happy DOM:** Para simular o ambiente do navegador (DOM) durante os testes (Node/Bun). 

## 📦 Como Instalar (Ambiente de Desenvolvimento)

1. Clone o repositório em sua máquina local:
   ```bash
   git clone https://github.com/charlenopires/getds.git
   cd getds
   ```
2. Instale as dependências (necessário para rodar os testes localmente):
   ```bash
   bun install
   ```
3. Abra o Google Chrome e acesse a página de Gerenciamento de Extensões:
   - Digite `chrome://extensions/` na barra de endereço.
4. Ative o **"Modo do desenvolvedor"** (Developer mode) no canto superior direito.
5. Clique no botão **"Carregar sem compactação"** (Load unpacked) e selecione a pasta raiz deste repositório (`getds`).
6. A extensão será carregada e o ícone do **getds** ficará disponível na sua barra de extensões do Chrome.

## 🧪 Como Rodar os Testes

O projeto conta com uma suíte de testes unitários rica, cobrindo todos os extratores de interface dentro de `src/content` e `src/popup`.

Para executar todos os testes usando o **Bun**:

```bash
# Executar todos os testes uma única vez
bun run test

# Executar os testes em modo "watch" (observação contínua de arquivos)
bun run test:watch
```

## 🤝 Como Contribuir

Contribuições são muito bem-vindas! Sinta-se à vontade para enviar *Pull Requests* ou abrir *Issues* relatando problemas ou sugerindo novas funcionalidades.

1. Faça o *fork* deste repositório.
2. Crie uma branch para a sua *feature* ou correção: `git checkout -b minha-feature`
3. Commite as suas alterações: `git commit -m 'feat: minha nova feature'`
4. Envie ("push") a branch: `git push origin minha-feature`
5. Abra um *Pull Request* detalhando o que foi feito.

## 📄 Licença

Desenvolvido para auxiliar a comunidade. Por favor verifique aos termos da licença (MIT / Outra) padrão se constado no repositório final.
