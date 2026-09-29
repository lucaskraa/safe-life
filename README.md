# Safe Life

Plataforma web do TCC para proteção animal, denúncia, resgate e acompanhamento de ocorrências.

## Perfis públicos de demonstração

As três contas abaixo são deliberadamente públicas porque fazem parte da demonstração do TCC. Todas usam a senha `123456`.

| Perfil | Nome | CPF | Uso |
| --- | --- | --- | --- |
| Cidadão | Antonio Cidadão | `11111111111` | Abre ocorrências, acompanha chamados e cadastra pets |
| Funcionário | Antonio Funcionário | `22222222222` | Atende ocorrências, acompanha a fila e conclui atendimentos |
| Administrador | Antonio Administrador | `33333333333` | Administração, relatórios, auditoria, usuários e empresas |

## Fluxo principal

1. O cidadão entra com a conta de demonstração e abre uma ocorrência com descrição, localização e evidência.
2. O sistema registra a ocorrência como pendente e cria uma notificação para o cidadão informando que o caso será resolvido em até **5 dias úteis**.
3. O funcionário visualiza a fila, assume o chamado, informa a previsão e conclui o atendimento.
4. O cidadão recebe novas notificações conforme o status muda.
5. O administrador acompanha usuários, empresas, ocorrências, auditoria e indicadores.

## Stack

- Node.js 18+
- Express
- PostgreSQL / Supabase
- HTML, CSS e JavaScript
- SSE + PostgreSQL LISTEN/NOTIFY para atualizações em tempo real

## Segurança implementada

O projeto usa senhas com `scrypt`, tokens de sessão assinados com HMAC, revogação por `session_version`, autorização por perfil, validação de proprietário, consultas SQL parametrizadas, limitação de tentativas de login, transações e cabeçalhos de segurança.

As credenciais públicas acima são apenas contas de demonstração. Chaves reais de infraestrutura, `DATABASE_URL`, `APP_SECRET` e tokens administrativos não devem ser colocados no repositório.

## Execução local

```bash
npm install
npm start
```

Variáveis mais importantes:

```text
DATABASE_URL=postgresql://...
DB_SSL=false
APP_SECRET=troque-esta-chave
ADMIN_CPF=33333333333
ADMIN_PASSWORD=123456
```

Em produção, use um `APP_SECRET` forte. Para o TCC, a senha pública do administrador pode continuar sendo `123456`, desde que a conta seja usada apenas como demonstração.

## Testes

```bash
npm run check
```

O repositório também possui um teste de integração que cobre o fluxo principal de cidadão, funcionário e administrador usando um PostgreSQL isolado no CI.

## Banco

`database.sql` cria/atualiza a estrutura do PostgreSQL de forma idempotente. O prazo inicial das ocorrências usa cinco dias úteis, considerando segunda a sexta-feira.

`demo_reset.sql` limpa ocorrências e notificações ligadas a ocorrências para restaurar o ambiente de demonstração sem apagar pets, empresas ou usuários.
