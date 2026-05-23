package cl.marketprime.shared.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    Page<Notification> findAllByRecipientEmailOrderByCreatedAtDesc(String recipientEmail, Pageable pageable);
    long countByRecipientEmailAndIsRead(String recipientEmail, boolean isRead);
}
