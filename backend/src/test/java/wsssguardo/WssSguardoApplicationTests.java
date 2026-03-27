package wsssguardo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("dev")
@TestPropertySource(properties = "security.auth.disabled=true")
class WssSguardoApplicationTests {

	@Test
	void contextLoads() {
	}

}
