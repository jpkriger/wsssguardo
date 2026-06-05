# Contrato da API de relatório

Contrato documentado antes da implementação do endpoint de geração de relatório.

## Endpoint

`POST /api/reports/generate`

Headers:

- `Content-Type: application/json`
- autenticação: segue o padrão vigente da API quando o backend estiver integrado ao fluxo final

Resposta de sucesso:

- `201 Created`
- `Location: /api/reports/{reportId}`

## Request body

```json
{
  "projectId": "018f2f32-ff0a-7c30-9dfa-a9f765432101",
  "selectedSections": [
    "cover",
    "projectOverview",
    "findings",
    "risks",
    "assets",
    "recommendations",
    "appendix"
  ],
  "detailLevel": "standard",
  "editableFields": {
    "title": "Relatório de segurança",
    "subtitle": "Projeto Mobile App",
    "introduction": "Resumo inicial editável pelo usuário",
    "executiveSummary": "Texto editável do resumo executivo",
    "conclusion": "Texto final editável",
    "footerNote": "Confidencial"
  }
}
```

### Campos

- `projectId`:
  UUID do projeto que será usado como fonte do relatório.
- `selectedSections`:
  lista obrigatória com as seções que entram no relatório.
  Valores aceitos na v1:
  - `cover`
  - `projectOverview`
  - `findings`
  - `risks`
  - `assets`
  - `recommendations`
  - `appendix`
- `detailLevel`:
  nível de detalhamento do conteúdo.
  Valores aceitos:
  - `summary`
  - `standard`
  - `detailed`
- `editableFields`:
  objeto opcional com campos editáveis do layout/conteúdo.
  Campos aceitos na v1:
  - `title`
  - `subtitle`
  - `introduction`
  - `executiveSummary`
  - `conclusion`
  - `footerNote`

### Regras de validação

- `projectId` é obrigatório.
- `selectedSections` deve ter pelo menos uma seção.
- `detailLevel` é obrigatório e deve ser um dos valores suportados.
- `editableFields`, quando informado, não aceita campos fora da lista acima.
- valores duplicados em `selectedSections` devem ser tratados como erro de validação.

## Response

O endpoint não embute os binários do PDF/HTML no JSON. A resposta retorna URLs para download/preview, o que mantém o payload pequeno e facilita o mock no frontend.

```json
{
  "reportId": "018f2f32-ff0a-7c30-9dfa-a9f765432199",
  "projectId": "018f2f32-ff0a-7c30-9dfa-a9f765432101",
  "status": "READY",
  "generatedAt": "2026-05-24T15:30:00-03:00",
  "selectedSections": [
    "cover",
    "projectOverview",
    "findings",
    "risks",
    "assets",
    "recommendations",
    "appendix"
  ],
  "detailLevel": "standard",
  "artifacts": {
    "pdf": {
      "url": "/api/reports/018f2f32-ff0a-7c30-9dfa-a9f765432199/pdf",
      "contentType": "application/pdf",
      "fileName": "relatorio-projeto-mobile-app.pdf"
    },
    "html": {
      "url": "/api/reports/018f2f32-ff0a-7c30-9dfa-a9f765432199/html",
      "contentType": "text/html; charset=utf-8",
      "fileName": "relatorio-projeto-mobile-app.html"
    }
  }
}
```

## Erros esperados

Os erros seguem o formato padrão do `GlobalExceptionHandler`:

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Project not found",
  "timestamp": "2026-05-24T15:30:00Z",
  "path": "/api/reports/generate"
}
```

Erros esperados para o endpoint:

- `400 Bad Request`:
  body ausente, `projectId` inválido, `selectedSections` vazio, `detailLevel` inválido ou `editableFields` com chave desconhecida.
- `404 Not Found`:
  projeto informado por `projectId` não existe.
- `422 Unprocessable Entity`:
  projeto existe, mas faltam dados para gerar alguma das seções solicitadas.
- `500 Internal Server Error`:
  falha na geração do PDF/HTML, renderização, serialização ou escrita do arquivo.

## Contrato para o frontend

Para mock, o frontend pode assumir:

- request sempre em JSON;
- response sempre com `reportId`, `projectId`, `status`, `generatedAt` e `artifacts`;
- `artifacts.pdf.url` e `artifacts.html.url` são suficientes para download e preview;
- o payload não contém blob inline nesta versão.
