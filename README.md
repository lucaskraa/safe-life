# safe-lifeSafe Life
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
