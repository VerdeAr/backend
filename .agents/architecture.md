# Estado da Arquitetura do Projeto

## Fase Atual: Monolito / Código Unificado

- O código de backend e telas/frontend convive no mesmo repositório/pasta base.
- **Atenção:** Mantenha as regras de negócio isoladas das views/rotas enquanto a migração não ocorre. Não crie acoplamentos novos.

## Próxima Fase: Frontend e Backend Separados (Em migração)

- O projeto passará a ter pastas/módulos distintos para backend (APIs/serviços) e frontend (telas/componentes).
- _Instrução para a IA:_ Ao criar código novo, estruture pastas de forma limpa e desacoplada, facilitando a extração dos arquivos quando o colega concluir a segregação de pastas.
