# safe-lifeSafe Life — Projeto 10/10
Aplicativo web para proteção animal, denúncia, resgate e acompanhamento de ocorrências.
Perfis padrão
Perfil	Nome	CPF	Observação
Cidadão	Vitor Chineque	`11111111111`	Envia denúncias/resgates e registra pets
Profissional	Zeca do Santos	`99999999999`	Empresa: Safe Life Matriz
Administrador	Gustavo Siri	`45317828791`	Acesso administrativo
Fluxo principal
O cidadão envia uma ocorrência marcando uma opção visual.
A ocorrência salva:
opção marcada
descrição
endereço
foto da ocorrência
foto/nome do cidadão
O profissional vê no painel.
O profissional pode:
aceitar chamado
marcar em atendimento
concluir atendimento
Ao concluir:
a ocorrência sai da fila do profissional
aparece no perfil do cidadão em `Ocorrências realizadas`
o cidadão recebe notificação no perfil
o admin acompanha no relatório e auditoria
Estrutura
```txt
safe-life/
  index.html
  style.css
  script.js
  server.js
  package.json
  README.md
  database/
    banco_safe_life.sql
  docs/
    FLUXO_DO_APP.md
```
Como rodar só o front-end
Abra o arquivo:
```txt
index.html
```
Antes de testar uma versão nova, limpe:
```txt
F12 > Application > Local Storage > apagar safeLife*
Ctrl + F5
```
Como rodar com Node.js
```bash
npm install
npm start
```
Depois acesse:
```txt
http://localhost:3000
```
Observação técnica
O front-end usa `localStorage` para prototipação e testes rápidos.  
O projeto também possui `server.js` e estrutura SQL PostgreSQL para evolução para banco real.
