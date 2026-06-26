package wsssguardo.ai.client;

import java.time.Duration;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import wsssguardo.shared.exception.ApiException;

@Component
public class OllamaClient {

    private static final Pattern FIRST_NUMBER = Pattern.compile("\\d+");

    private final RestClient restClient;
    private final String model;

    public OllamaClient(
            @Value("${ollama.url}") String url,
            @Value("${ollama.model}") String model,
            RestClient.Builder builder) {
        this.model = model;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(15));
        factory.setReadTimeout(Duration.ofSeconds(180));
        this.restClient = builder.baseUrl(url).requestFactory(factory).build();
    }

    public String generate(String systemPrompt, String userPrompt, double temperature) {
        var payload = Map.of(
                "model", model,
                "system", systemPrompt,
                "prompt", userPrompt,
                "stream", false,
                "options", Map.of("temperature", temperature));

        try {
            OllamaResponse response = restClient.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(OllamaResponse.class);

            if (response == null || response.response() == null) {
                throw new ApiException("AI service returned empty response", HttpStatus.BAD_GATEWAY);
            }

            return response.response().trim();
        } catch (RestClientException e) {
            throw new ApiException("AI service unavailable: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public Integer generateScore(String systemPrompt, String userPrompt) {
        String raw = generate(systemPrompt, userPrompt, 0.0);
        var matcher = FIRST_NUMBER.matcher(raw);
        if (!matcher.find()) {
            throw new ApiException("AI returned non-numeric score: " + raw, HttpStatus.BAD_GATEWAY);
        }
        return Integer.parseInt(matcher.group());
    }

    record OllamaResponse(String response) {}
}
