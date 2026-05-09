package wsssguardo.find.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import wsssguardo.shared.domain.BaseEntity;

@Entity
@Table(name = "find_categories")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class FindCategory extends BaseEntity {
  
  @Column(nullable = false)
  private String name;

}
