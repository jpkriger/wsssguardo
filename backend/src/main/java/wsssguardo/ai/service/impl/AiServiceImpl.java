package wsssguardo.ai.service.impl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import wsssguardo.ai.client.OllamaClient;
import wsssguardo.ai.service.AiService;
import wsssguardo.asset.Asset;
import wsssguardo.find.Find;
import wsssguardo.project.Project;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.risk.Risk;
import wsssguardo.risk.repository.RiskRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private static final Pattern FLOAT_PATTERN = Pattern.compile("\\d+(?:[.,]\\d+)?");

    private static final String SCORE_SYSTEM_PROMPT = """
            Você é um engenheiro especialista em análise e quantificação de riscos de segurança da informação.
            Sua tarefa é avaliar um cenário de risco documentado, analisando sua relação com um achado de segurança e o ativo afetado, para determinar uma nota de risco geral.

            Você receberá os dados do Ativo, do Achado e do Risco.

            INSTRUÇÃO CRÍTICA DE SAÍDA:
            A sua resposta deve conter ABSOLUTAMENTE NADA ALÉM DO NÚMERO quantitativo final em escala de 0 a 10 (ex: 7.5). Não inclua justificativas, textos introdutórios, formatação markdown, pontos finais ou quebras de linha. Avalie silenciosamente e imprima apenas o número decimal.
            """;

    private static final String SUMMARY_SYSTEM_PROMPT = """
            Você é um especialista em comunicação corporativa e segurança da informação.
            Sua tarefa é sintetizar os dados de um risco de segurança em um resumo executivo direcionado ao nível tático e diretivo da empresa.

            Você receberá os dados do Ativo, do Achado e do Risco. Baseando-se nessas informações, crie a descrição.

            INSTRUÇÕES DE FORMATAÇÃO E CONTEÚDO (CRÍTICAS):
            1. O resumo deve conter exatamente UM PARÁGRAFO.
            2. O texto deve ser conciso e ocupar NO MÁXIMO 5 LINHAS.
            3. É ESTRITAMENTE PROIBIDO incluir informações quantitativas, números, porcentagens ou notas numéricas de probabilidade. Use apenas texto plano.
            4. É ESTRITAMENTE PROIBIDO mencionar nomes de marcas ou produtos comerciais específicos.
            5. Minimize jargões técnicos profundos. Foque nos detalhes funcionais: qual é a vulnerabilidade/ameaça, o que ela afeta no negócio e quem sofre o dano (operação, usuários ou terceiros).

            Exemplo de tom e estrutura desejados: "Vulnerabilidade detectada no ambiente, podendo gerar vazamentos de dados corporativos por meio de ataques de injeção ou interceptação de rede, causando danos severos à reputação perante terceiros e impacto direto na privacidade dos usuários do departamento afetado."
            """;

    private static final String REPORT_SYSTEM_PROMPT = """
            Você é um executivo sênior de Segurança da Informação elaborando um reporte para o conselho diretor.
            Sua tarefa é redigir a introdução de um relatório de riscos, sintetizando de forma coesa uma lista de resumos de ameaças detectadas na infraestrutura da empresa.

            INSTRUÇÕES DE FORMATAÇÃO E CONTEÚDO (CRÍTICAS):
            1. O texto deve conter NO MÁXIMO DOIS PARÁGRAFOS.
            2. O texto deve ser conciso e ocupar NO MÁXIMO 10 LINHAS.
            3. A linguagem deve ser puramente voltada para negócios. Foque no panorama geral de exposição, no impacto sistêmico e no risco ao valor para os stakeholders. Não foque em detalhes operacionais de cada falha.
            4. É ESTRITAMENTE PROIBIDO mencionar nomes de marcas, soluções ou produtos comerciais específicos.
            5. Não liste os riscos em formato de tópicos; crie uma narrativa fluida que represente a atual postura de risco da organização com base na síntese dos dados.
            """;

    private static final String REPORT_TECHNICAL_SYSTEM_PROMPT = """
            Você é um especialista técnico sênior em Segurança da Informação elaborando a introdução de um relatório técnico de riscos.
            Sua tarefa é redigir uma síntese técnica coesa das ameaças detectadas, direcionada a equipes de TI, arquitetos de segurança e gestores técnicos.

            INSTRUÇÕES DE FORMATAÇÃO E CONTEÚDO (CRÍTICAS):
            1. O texto deve conter NO MÁXIMO DOIS PARÁGRAFOS.
            2. O texto deve ser conciso e ocupar NO MÁXIMO 10 LINHAS.
            3. Use linguagem técnica precisa: mencione vetores de ataque, classes de vulnerabilidade (ex: injeção, escalonamento de privilégios, exposição de credenciais), superfície de ataque e impacto técnico.
            4. É ESTRITAMENTE PROIBIDO mencionar nomes de marcas, soluções ou produtos comerciais específicos.
            5. Não liste os riscos em formato de tópicos; crie uma narrativa técnica fluida que caracterize a postura de segurança atual da infraestrutura.
            """;

    private final RiskRepository riskRepository;
    private final ProjectRepository projectRepository;
    private final OllamaClient ollamaClient;

    @Override
    @Transactional
    public Float suggestScore(UUID projectId, UUID riskId) {
        Risk risk = fetchRisk(projectId, riskId);
        String userPrompt = buildRiskDataPrompt(risk);
        String raw = ollamaClient.generate(SCORE_SYSTEM_PROMPT, userPrompt, 0);
        Float score = parseFloat(raw);
        float clamped = Math.max(0f, Math.min(10f, score));

        risk.setGeneralRisk(clamped);
        riskRepository.save(risk);

        return clamped;
    }

    @Override
    @Transactional
    public String summarizeRisk(UUID projectId, UUID riskId) {
        Risk risk = fetchRisk(projectId, riskId);
        String userPrompt = buildRiskDataPrompt(risk);
        String summary = ollamaClient.generate(SUMMARY_SYSTEM_PROMPT, userPrompt, 0.3);

        risk.setAiSummary(summary);
        riskRepository.save(risk);

        return summary;
    }

    @Override
    @Transactional
    public String summarizeReport(UUID projectId, List<String> summaries, String reportType) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        String systemPrompt = "tecnico".equalsIgnoreCase(reportType)
                ? REPORT_TECHNICAL_SYSTEM_PROMPT
                : REPORT_SYSTEM_PROMPT;

        StringBuilder sb = new StringBuilder("DADOS PARA SÍNTESE (RESUMOS INDIVIDUAIS):\n");
        for (int i = 0; i < summaries.size(); i++) {
            sb.append(i + 1).append(". ").append(summaries.get(i)).append("\n");
        }
        String reportIntro = ollamaClient.generate(systemPrompt, sb.toString(), 0.3);

        project.setAiReportIntro(reportIntro);
        projectRepository.save(project);

        return reportIntro;
    }

    private Risk fetchRisk(UUID projectId, UUID riskId) {
        return riskRepository.findByIdAndProjectId(riskId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Risk", riskId));
    }

    private Float parseFloat(String raw) {
        if (raw == null) return 5f;
        Matcher m = FLOAT_PATTERN.matcher(raw.trim());
        if (!m.find()) return 5f;
        try {
            return Float.parseFloat(m.group().replace(',', '.'));
        } catch (NumberFormatException e) {
            return 5f;
        }
    }

    private String buildRiskDataPrompt(Risk risk) {
        StringBuilder sb = new StringBuilder();

        List<Find> finds = risk.getFinds();

        Map<UUID, Asset> assetById = new LinkedHashMap<>();
        finds.forEach(f -> f.getAssets().forEach(a -> assetById.putIfAbsent(a.getId(), a)));
        List<Asset> uniqueAssets = new ArrayList<>(assetById.values());

        for (int i = 0; i < uniqueAssets.size(); i++) {
            Asset a = uniqueAssets.get(i);
            sb.append("### DADOS DO ATIVO ").append(i + 1).append("\n");
            sb.append("- Nome: ").append(safe(a.getName())).append("\n");
            sb.append("- Descrição: ").append(safe(a.getDescription())).append("\n");
            sb.append("- Conteúdo: ").append(safe(a.getContent())).append("\n\n");
        }

        for (int i = 0; i < finds.size(); i++) {
            Find f = finds.get(i);
            sb.append("### DADOS DO ACHADO ").append(i + 1).append("\n");
            sb.append("- Evento de Ameaça: ").append(safe(f.getThreatEvent())).append("\n");
            sb.append("- Departamento Afetado: ").append(safe(f.getSector())).append("\n");
            sb.append("- Descrição: ").append(safe(f.getDescription())).append("\n\n");
        }

        sb.append("### DADOS DO RISCO\n");
        sb.append("- Nome: ").append(safe(risk.getName())).append("\n");
        sb.append("- Descrição: ").append(safe(risk.getDescription())).append("\n");
        sb.append("- Consequências: ").append(safe(risk.getConsequences())).append("\n");
        sb.append("- Probabilidade de Ocorrência: ").append(risk.getOccurrenceProbability()).append("\n");
        sb.append("- Probabilidade de Impacto: ").append(risk.getImpactProbability()).append("\n");
        sb.append("- Dano à Operação (0-10): ").append(risk.getDamageOperations()).append("\n");
        sb.append("- Dano aos Usuários (0-10): ").append(risk.getDamageIndividuals()).append("\n");
        sb.append("- Dano a Terceiros (0-10): ").append(risk.getDamageOtherOrgs()).append("\n");
        sb.append("- Dano a Ativos (0-10): ").append(risk.getDamageAssets()).append("\n");
        sb.append("- Recomendação de Segurança: ").append(safe(risk.getRecommendation())).append("\n");

        return sb.toString();
    }

    private String safe(String s) {
        return s != null ? s : "";
    }
}
