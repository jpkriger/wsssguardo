package wsssguardo.ai.client;

import java.time.Duration;
import java.util.Map;

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

    private final RestClient restClient;

    public OllamaClient(
            @Value("${ai.service.url}") String url,
            RestClient.Builder builder) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(15));
        factory.setReadTimeout(Duration.ofSeconds(180));
        this.restClient = builder.baseUrl(url).requestFactory(factory).build();
    }

    public String generate(String systemPrompt, String userPrompt, double temperature) {
        var payload = Map.of(
                "system_prompt", systemPrompt,
                "user_prompt", userPrompt,
                "temperature", temperature);

        try {
            AiResponse response = restClient.post()
                    .uri("/api/ai/complete")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(AiResponse.class);

            if (response == null || response.text() == null) {
                throw new ApiException("AI service returned empty response", HttpStatus.BAD_GATEWAY);
            }

            return response.text().trim();
        } catch (RestClientException e) {
            throw new ApiException("AI service unavailable: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    record AiResponse(String text) {}
}
