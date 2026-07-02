# AI Backend (desc-elaborator)

Microserviço FastAPI que expõe um endpoint de completion sobre um modelo local rodando via [Ollama](https://ollama.com). É consumido pelo backend Spring Boot principal (módulo `wsssguardo.ai`) para gerar sugestões de score de risco e resumos de risco/relatório.

## Estrutura

```text
ai/
├── backend/
│   ├── main.py            # app FastAPI (endpoint /api/ai/complete)
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml      # ollama + backend + tunnel (perfis)
├── cloudflared-config.yml  # config de referência do túnel cloudflared
└── .env-exemple             # variáveis esperadas (copiar para .env)
```

## Requisitos

- Docker & Docker Compose
- ~4GB de RAM livre para o container do Ollama (limite configurado no compose)

## Subir localmente

1. Copie o `.env-exemple` para `.env` dentro de `ai/` e preencha:

   ```env
   CLOUDFLARE_TUNNEL_TOKEN=   # só necessário se for subir o perfil `tunnel`
   OLLAMA_MODEL=qwen2.5:3b     # opcional, esse é o default
   ```

2. Suba Ollama + backend:

   ```bash
   cd ai
   docker compose --profile docker-ollama up -d --build
   ```

   Isso sobe:
   - `desc-ollama` na porta `11434`
   - `desc-backend` (FastAPI) na porta `8000`

3. Baixe o modelo dentro do container do Ollama (primeira vez apenas):

   ```bash
   docker exec -it desc-ollama ollama pull qwen2.5:3b
   ```

4. Teste o serviço:

   ```bash
   curl -X POST http://localhost:8000/api/ai/complete \
     -H "Content-Type: application/json" \
     -d '{"system_prompt": "Você é um assistente.", "user_prompt": "Diga oi"}'
   ```

### Sem o perfil `docker-ollama` (Ollama rodando fora do Docker)

Se já tiver Ollama rodando na máquina host, suba só o backend e aponte `OLLAMA_URL` pra ele:

```bash
OLLAMA_URL=http://host.docker.internal:11434 docker compose up -d --build backend
```

## Endpoints

| Método | Rota                | Descrição                                                        |
| ------ | -------------------- | ------------------------------------------------------------------ |
| POST   | `/api/ai/complete`   | Recebe `system_prompt`, `user_prompt`, `temperature` (opcional, default `0.3`); retorna `{ "text": "..." }` |
| GET    | `/health`             | Health check simples                                               |

`user_prompt` vazio retorna `400`. Erro de comunicação com o Ollama retorna `502`.

## Variáveis de ambiente

| Variável                   | Onde é usada           | Default                  |
| --------------------------- | ------------------------ | ------------------------- |
| `OLLAMA_URL`                | backend (FastAPI)        | `http://ollama:11434`     |
| `OLLAMA_MODEL`               | backend (FastAPI)        | `qwen2.5:3b`               |
| `CLOUDFLARE_TUNNEL_TOKEN`   | serviço `tunnel`          | *(obrigatório se usar o perfil `tunnel`)* |

## Expor via Cloudflare Tunnel (perfil `tunnel`)

O serviço `tunnel` no `docker-compose.yml` usa o `cloudflared` autenticado por token (`CLOUDFLARE_TUNNEL_TOKEN`), então a rota/hostname é a configurada no dashboard do Cloudflare Zero Trust para esse túnel — não no `cloudflared-config.yml` deste repo.

O arquivo `cloudflared-config.yml` aqui é só referência local de como o túnel foi configurado originalmente (rodando `cloudflared` direto no host, não em container), apontando `desc-elaborator.alcaria.dev` -> `localhost:3030`. Se for reconfigurar do zero, ajuste o `service:` para a porta real do backend (`8000` no compose deste diretório).

Para subir com o túnel:

```bash
docker compose --profile docker-ollama --profile tunnel up -d --build
```

## Integração com o backend principal

O backend Spring Boot chama esse serviço via `wsssguardo.ai.client.OllamaClient`, configurável em `backend/src/main/resources/application.properties`. Aponte a URL base para onde este serviço estiver rodando (`http://localhost:8000` local, ou o hostname do túnel em produção).

## Notas

- Sem GPU configurada no compose — Ollama roda em CPU. Para produção/uso real, considerar passthrough de GPU ou usar um Ollama gerenciado.
- O container `backend` tem limite de memória de `128m` — suficiente pro FastAPI (só faz proxy pro Ollama), não roda o modelo.
