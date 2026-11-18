# Briefing Executivo — Jornal Digital (v1.1)

Jornal digital brasileiro, pensado para iPhone e iPad: quatro indicadores de mercado, destaques editoriais, editorias agrupadas, busca, favoritos, histórico de edições e links diretos às notícias originais. Estilo branco e verde, com visual de jornal e navegação em cartões.

## Situação de implantação

- **Desenvolvido e validado localmente:** layout responsivo, filtros, busca, artigos expansíveis, favoritos, consulta de fonte, exportação JSON, PWA e indicadores com origem/data.
- **Integração contínua preparada:** arquivo `.github/workflows/jornal-diario.yml` consulta feeds RSS todos os dias às 07h30 (horário de Brasília, sujeito aos atrasos de fila do GitHub Actions), arquiva as edições e publica via GitHub Pages.
- **Publicação em preparação:** código enviado para o repositório. O repositório está privado; no GitHub Free, para publicar via Pages, altere a visibilidade para público, ou utilize um plano com Pages para repositórios privados. Configure Pages como GitHub Actions.
- **Conteúdo:** RSS de fontes identificadas, com curadoria heurística. **Não é um briefing redigido, verificado e contextualizado manualmente por IA.** A seção "Por que importa" é uma frase de contexto automaticamente determinada por palavras-chave; as afirmações jornalísticas estão nos títulos/trechos dos veículos.

## Ativação no GitHub — procedimento único

1. Abra **Settings → General → Danger Zone → Change repository visibility** e altere para público se quiser publicar via GitHub Pages gratuito. Isso tornará o código e os arquivos públicos; não realize a mudança se deseja manter o repositório privado. Consulte a disponibilidade do Pages para o seu plano.
2. O conector do ChatGPT já foi instalado e autorizado para o repositório.
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