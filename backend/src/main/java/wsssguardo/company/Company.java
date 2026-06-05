package wsssguardo.company;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import wsssguardo.shared.domain.BaseEntity;

@Entity
@Table(name = "companies")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@SQLDelete(sql = "UPDATE companies SET deleted_at = NOW() WHERE id = ?")
public class Company extends BaseEntity {

    @Column(nullable = false)
    private String name;

}
