package wsssguardo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class WssSguardoApplication {

	public static void main(String[] args) {
		SpringApplication.run(WssSguardoApplication.class, args);
	}

}
