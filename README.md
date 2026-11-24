# Briefing Executivo — Jornal Digital (v1.1)

Jornal digital brasileiro, pensado para iPhone e iPad: quatro indicadores de mercado, destaques editoriais, editorias agrupadas, busca, favoritos, histórico de edições e links diretos às notícias originais. Estilo editorial Linen, Navy e Amber, com visual de jornal e navegação em cartões.

## Situação de implantação

- **Desenvolvido e validado localmente:** layout responsivo, filtros, busca, artigos expansíveis, favoritos, consulta de fonte, exportação JSON, PWA e indicadores com origem/data.
- **Integração contínua preparada:** arquivo `.github/workflows/jornal-diario.yml` consulta feeds RSS todos os dias às 07h30 (horário de Brasília, sujeito aos atrasos de fila do GitHub Actions), arquiva as edições e publica via GitHub Pages.
- **Publicado:** https://andersomaf-crypto.github.io/briefing-executivo-journal/.
- **Conteúdo:** RSS de fontes identificadas, com curadoria heurística. **Não é um briefing redigido, verificado e contextualizado manualmente por IA.** A seção "Por que importa" é uma frase de contexto automaticamente determinada por palavras-chave; as afirmações jornalísticas estão nos títulos/trechos dos veículos.

## Ativação no GitHub — procedimento único

1. Abra [github.com/new](https://github.com/new) e crie um repositório **público** chamado `briefing-executivo-journal` na conta conectada. Escolha **Add a README file** para inicializar a branch `main`. O código não contém dados pessoais, mas a visibilidade pública significa que arquivos e conteúdo publicados ficam acessíveis na internet.
2. Certifique-se de que o aplicativo ChatGPT tem acesso ao repositório recém-criado. Volte ao ChatGPT e envie a URL do repositório; isso permitirá gravar os arquivos pelo conector do GitHub.
3. Após o envio do código, vá a **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Em **Actions → Publicar Jornal Digital → Run workflow**, execute manualmente a primeira coleta/publicação, se necessário. Em **Settings → Actions → General → Workflow permissions**, habilite escrita para o `GITHUB_TOKEN` caso a ação de gravar o histórico falhe.
5. Confira a URL exibida na aba **Settings → Pages** ou no resumo da execução. Em repositório público com Pages ativado, tende a ter o formato `https://<usuario>.github.io/briefing-executivo-journal/`. **Não presuma a URL antes de o GitHub confirmar a publicação.**

## Arquitetura

- GitHub Actions: coleta RSS + indicador de mercado (Yahoo Finance para Ibovespa/USD-BRL, CoinGecko para BTC e Banco Central para Selic).
- `data/latest.json`: edição verificada mais recente; `data/markets.json`: cotação datada; `data/arquivo/YYYY-MM-DD.json`: arquivo de até 180 edições; `data/index.json`: índice.
- GitHub Pages: HTML/CSS/JS estático e PWA. Não precisa de Vercel, banco de dados nem chave de API.
- Armazenamento do navegador: favoritos e cópia de até 30 edições; não sincroniza automaticamente entre iPhone e iPad.

## Regras editoriais do coletor

- Títulos e trechos são os publicados nos feeds RSS, com **links diretos para os veículos**.
- Priorização heurística e limite de 10 notícias, distribuídas por tema conforme relevância/quantidade real disponível.
- Busca últimas 36 horas, ampliando para 48 horas quando há pouca cobertura; não inventa notícias para completar dez.
- Evita repetir notícias da edição do dia anterior (pela URL ou ID).
- Sem notícias recentes verificadas, **preserva a edição antiga com sua data real**, nunca apresenta uma edição antiga como se fosse nova.
- Cotações não confirmadas aparecem indisponíveis; quando usa cache, mostra a data original do dado.
- "O que acompanhar" fica vazio quando não há eventos com data e link oficial confirmados; não fabrica agenda futura.

## Rodar e testar localmente

Pré-requisito: Node.js 20 ou superior.

```bash
npm test
DEMO=1 npm run dev
# http://127.0.0.1:3210
```

Para a coleta real, `npm run build:edition` (requer acesso de rede do ambiente de execução). Para preparar o site estático, `npm run build:pages`, com saída `.site/`.

## Limites e transparência

- Nenhuma garantia de atualização **exatamente** às 07h30: o agendador do GitHub pode atrasar, e provedores externos podem ficar indisponíveis.
- Não é um serviço de notícias com licenciamento para republicação integral. Reproduz apenas metadados e pequenos trechos dos feeds, abrindo a matéria na origem.
- As fontes RSS podem mudar de endereço ou formato. Monitoramento, novas fontes, agenda verificada e resumos escritos por IA são evoluções separadas.
- O aplicativo não tem autenticação, sincronização entre aparelhos, push ou persistência em servidor própria.

## Tradução das notícias

Títulos e resumos de feeds originalmente em inglês (BBC Sport, CoinDesk, Cointelegraph) são traduzidos automaticamente para **português do Brasil** durante a coleta diária, antes de serem salvos. A URL, veículo, data e texto original são preservados em cada registro. O leitor vê um aviso quando a tradução é parcial ou indisponível.

A tradução utiliza [MyMemory](https://mymemory.translated.net/doc/spec.php) sem chave, limitada pelo provedor a 5.000 caracteres/dia para uso anônimo. Este projeto impõe limite de 4.400 bytes de texto novo por execução e mantém cache em `data/translations.json`. Caso o serviço externo falhe, o sistema não inventa tradução nem altera valores numéricos. Opcionalmente, a variável de ambiente `MYMEMORY_EMAIL` pode identificar contato para uma cota maior.

Tradução automática pode conter erros de contexto; consulte sempre a fonte original para informações financeiras ou decisões importantes.
## Atualização visual e Radar do Trabalho — v1.2

- Paleta aprovada: 60% Linen (#F3EFE8), 30% Navy (#15233D), 10% Amber (#FFB020), mantendo verde/vermelho para sinalização de variações.
- Manchetes de notícias em negrito, 19px no celular; resumos normais, 16px; explicações "Por que importa" em 15px.
- Radar do Trabalho: até quatro matérias adicionais do dia, somente quando critérios estritos apontarem ligação com qualidade comercial, reclamações, distribuição de investimentos, atendimento, regulação e IA financeira.
- Fontes adicionais: Folha Mercado (RSS) e feeds regulatórios públicos da CVM. Falhas nas fontes são registradas e não geram notícias inventadas.
- O repositório e o site são públicos. O radar utiliza apenas temas genéricos de mercado; não publica métricas, nomes de equipes nem informações internas de trabalho.

### Curadoria profissional — atualização complementar
O radar profissional usa uma janela explícita de até **sete dias** (com data visível), diferente do briefing geral de 36–48 horas. RSS oficial do Banco Central, CVM e cobertura econômica são consultados. Notícias sem relação direta não são usadas para preencher a seção artificialmente. A seleção geral limita notícias repetidas do mesmo veículo e do mesmo evento.

**Janela atual do radar regulatório:** até 14 dias, sempre com data visível, em separado do briefing diário de notícias recentes.

## Curadoria de notícias por relevância — V1.3

- A seleção principal passa a trazer **até 14 notícias recentes**, distribuídas entre economia, bancos, IA, Bitcoin, política, geopolítica e tênis (somente havendo matérias relevantes).
- O radar bancário usa exclusivamente critérios de interesse público: qualidade comercial, atendimento, reclamações, proteção ao investidor, distribuição, crédito, incentivos e governança da IA. Nenhum dado interno entra na seleção.
- Fontes adicionadas: Finsiders Brasil (fintechs/bancos), TenisBrasil (circuito e brasileiros), MIT Technology Review Brasil (IA), e notas oficiais do Banco Central.
- Títulos definem a editoria prioritária; menções genéricas na descrição não transformam uma notícia de PIB em notícia bancária.
- Peso temático e relevância prática superam frequência, popularidade e cobertura de celebridades. Há despriorização de sensacionalismo, repetição de evento, excesso de uma fonte e notícias antigas.
- A lista oferece um **máximo**, não uma meta preenchida artificialmente. Links, datas e fontes originais são preservados.
