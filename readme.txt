Projeto para a cadeira de Visualização para Big Data

Link para o Dataset: https://mega.nz/file/KMcT0AYB#wNcolIsfa7-ur5VAMBniq1bhZvqWDZiPYmIl_cyEqr8

Instruções:
1) Fazer clone do repositório
2) Download dataset https://mega.nz/file/KMcT0AYB#wNcolIsfa7-ur5VAMBniq1bhZvqWDZiPYmIl_cyEqr8
3) Meter os .csv na pasta "ProjetoDeTransportes\datasource\problemaDeTransporte"
4) Começar o docker
5) Verificiar se o docker está a correr com o comando: docker --version
6) Ir para a directoria "/VBD_DockerProject/ProjetoDeTransportes/" utilizando o comando cd no cmd
7) Começar uma instancia de docker com o comando: docker-compose up --build
7.1) If this error comes up: "/usr/bin/env: ‘bash\r’: No such file or directory" do: Go to "/VBD_DockerProject/ProjetoDeTransportes/webapp" and open the file "start.sh" and paste the code inside of it to the website "https://www.shellcheck.net/#", and then delete the "start.sh" file and create a new one with the same name. After that open that file with just visual code and copy the code from the website and paste it there and save. Try again!
8) Verificar o <container ID> com o comando: docker ps
9) Fazer o comando "cd .." para voltar uma pasta atraz, para se estar na raiz do projeto
10) User os comandos seguintes para passar os ficheiros da base de dados para o docker:
10.1) docker cp ProjetoDeTransportes/datasource/problemaDeTransporte/mta_1706.csv <container ID>:/home/bdvapp/webapp/datasource/mta_1706.csv
10.2) docker cp ProjetoDeTransportes/datasource/problemaDeTransporte/mta_1708.csv <container ID>:/home/bdvapp/webapp/datasource/mta_1708.csv
10.3) docker cp ProjetoDeTransportes/datasource/problemaDeTransporte/mta_1710.csv <container ID>:/home/bdvapp/webapp/datasource/mta_1710.csv
10.4) docker cp ProjetoDeTransportes/datasource/problemaDeTransporte/mta_1712.csv <container ID>:/home/bdvapp/webapp/datasource/mta_1712.csv
11) Abrir a pagina web a partir do IP do docker ou localmente caso não se esteja a correr no docker:
11.1) Correr localmente: 0.0.0.0:5000
11.2) Correr a partir do docker: <docker_ip>:5000

Páginas existentes:
/ - Main page


Comandos Extra:
docker images - para ver as imagens activas ou que não possuem tags, boa prática apagar as imagens que já não têm tag pelo menos. Comando para remover todas as imagens sem tag no linux "docker rmi -f $(docker images | grep "<none>" | awk "{print \$3}")" (https://stackoverflow.com/questions/48668660/docker-no-space-left-on-device-macos)
Um comando parecido talvez seja possivel ser utilizado no windows "docker rmi -f $(docker images | findstr "<none>" | awk "{print $3}")" (tem de se instalar o gawk no windows para usar este)
Podem ser removidas as imagens uma a uma com o comando "docker rmi -f IMAGE_ID"

Para aceder ao bash do Docker:
<Container_ID> obtido com "docker ps"
docker exec -ti <Container_ID> bash
