// address/Address.java
package cl.marketprime.address;

import cl.marketprime.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "addresses", indexes = {
        @Index(name = "idx_address_user", columnList = "user_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Etiqueta amigable: "Casa", "Trabajo", etc. */
    @Column(nullable = false, length = 60)
    private String alias;

    @Column(name = "recipient_name", nullable = false, length = 120)
    private String recipientName;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false, length = 200)
    private String street;

    @Column(length = 10)
    private String number;

    @Column(length = 30)
    private String apartment;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String region;

    @Column(name = "zip_code", length = 10)
    private String zipCode;

    @Column(nullable = false, length = 60)
    @Builder.Default
    private String country = "Chile";

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean isDefault = false;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
