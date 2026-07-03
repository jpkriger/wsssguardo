package wsssguardo.ai.client;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import com.sun.net.httpserver.HttpServer;

import wsssguardo.shared.exception.ApiException;

class OllamaClientTest {

    private HttpServer server;

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    private String startServer(int status, String body) throws IOException {
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/api/ai/complete", exchange -> {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });
        server.start();
        return "http://localhost:" + server.getAddress().getPort();
    }

    @Test
    void generateShouldReturnTrimmedText() throws IOException {
        String url = startServer(200, "{\"text\":\"  resposta da IA  \"}");
        OllamaClient client = new OllamaClient(url, RestClient.builder());

        String result = client.generate("system", "user", 0.5);

        assertEquals("resposta da IA", result);
    }

    @Test
    void generateShouldThrowWhenResponseTextIsNull() throws IOException {
        String url = startServer(200, "{\"text\":null}");
        OllamaClient client = new OllamaClient(url, RestClient.builder());

        ApiException ex = assertThrows(ApiException.class, () -> client.generate("s", "u", 0));

        assertEquals("AI service returned empty response", ex.getMessage());
    }

    @Test
    void generateShouldThrowWhenServerReturnsError() throws IOException {
        String url = startServer(500, "internal error");
        OllamaClient client = new OllamaClient(url, RestClient.builder());

        ApiException ex = assertThrows(ApiException.class, () -> client.generate("s", "u", 0));

        assertEquals(org.springframework.http.HttpStatus.BAD_GATEWAY, ex.getStatusCode());
    }

    @Test
    void generateShouldThrowWhenConnectionFails() {
        // porta fechada: ninguém escutando -> falha de conexão
        OllamaClient client = new OllamaClient("http://localhost:1", RestClient.builder());

        ApiException ex = assertThrows(ApiException.class, () -> client.generate("s", "u", 0));

        assertEquals(org.springframework.http.HttpStatus.BAD_GATEWAY, ex.getStatusCode());
    }
}
