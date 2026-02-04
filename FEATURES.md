# ⚙️ Documentação Funcional e Mecânicas

Este documento detalha o funcionamento interno das mecânicas do **iMoney Bank** para fins de desenvolvimento e entendimento avançado.

## 1. Sistema Econômico

### Score de Crédito
Cada jogador possui um Score (0 a 1000).
- **Base:** 500 pontos.
- **Impacto:** Define a taxa de juros de novos empréstimos.
  - Score >= 900: 1% a.r.
  - Score >= 700: 3% a.r.
  - Score >= 500: 5% a.r.
  - Score >= 300: 7% a.r.
  - Score < 300: 10% a.r.

### Empréstimos (Sistema Price)
- **Limite:** 80% do Patrimônio Líquido (Assets).
- **Cálculo:** Utiliza a fórmula da Tabela Price para calcular parcelas fixas.
- **Débito:** Automático na virada do mês (a cada 5 rodadas globais).
- **Amortização:** O jogador pode antecipar o pagamento total com desconto proporcional aos juros não incorridos.

## 2. Propriedades e Aluguéis

### Cálculo de Aluguel
O valor do aluguel é dinâmico e calculado em tempo real (`getRent`):
`Aluguel Base` * `Multiplicador de Casas` * `Bônus de Vizinhança` * `Clima`

- **Casas:** 1 a 4 casas e Hotel (5 casas). Valores definidos em `PropertiesDB`.
- **Bônus de Vizinhança:** Se o jogador possuir imóveis do mesmo grupo com construções, ganha bônus (ex: +20% ou +50%).
- **Clima:**
  - `Sol`: Multiplicador 1.2x
  - `Chuva`: Multiplicador 0.8x

### Companhias (Utilities)
- Imóveis do tipo `company` não têm casas.
- O aluguel é baseado em um multiplicador (ex: 50.000x) vezes o resultado de um sorteio de dados (2 a 12).

## 3. Eventos e Sorte

### Cartas (`CardsDB.js`)
- **Tipos:** `luck` (Ganho), `setback` (Perda), `item` (Inventário).
- **Ações:** `pay_bank`, `receive_bank`, `pay_all` (paga a todos), `receive_all` (recebe de todos), `go_to_jail`, `freeze_player`.

### Itens de Inventário
- **Free Buy (Compra Livre):** Permite forçar a compra de um imóvel já ocupado pelo valor de tabela.
- **Steal Prop (Usucapião):** Transfere a propriedade de outro jogador para você sem custo (exceto se o grupo tiver construções).
- **Black Card:** Zera a dívida bancária (`debt`).

## 4. Sistema de Leilão

- Qualquer jogador pode iniciar um leilão de uma propriedade sua.
- **Estado:** O leilão é global na sala (`roomData.auction`).
- **Lances:** Jogadores dão lances em tempo real. O sistema valida se há saldo.
- **Encerramento:** Apenas o vendedor pode "Bater o Martelo". A transferência de posse e dinheiro é atômica.

## 5. Administração (Banco Central)

O usuário `ADMIN` tem poderes especiais acessíveis via `AuthScreen` ou Modal de Configurações.

- **Logs:** Auditoria completa de todas as transações.
- **Intervenção:**
  - `admin_add_money` / `admin_remove_money`: Injeção de liquidez.
  - `admin_seize_prop`: Penhora forçada (remove imóvel do jogador e devolve ao banco).
  - `admin_jail` / `admin_unjail`: Controle carcerário.
  - `global_earthquake`: Evento destrutivo que remove 1 casa de cada jogador aleatoriamente.

## 6. Arquitetura de Dados (`rooms.json`)

Estrutura básica de uma sala:
```json
{
  "MESA1": {
    "players": {
      "user_id": {
        "balance": 3000000,
        "properties": ["av_paulista"],
        "houses": { "av_paulista": 2 },
        "debt": 0,
        "creditScore": 500,
        "inventory": ["habeas_corpus"]
      }
    },
    "gameDate": { "day": 1, "month": 1, "year": 1 },
    "weather": "Sol",
    "bankReserve": 50000000,
    "transactions": [],
    "offers": [],
    "auction": null
  }
}
```