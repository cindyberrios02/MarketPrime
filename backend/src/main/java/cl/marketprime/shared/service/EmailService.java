package cl.marketprime.shared.service;

import cl.marketprime.shared.notification.Notification;
import cl.marketprime.shared.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void sendHtmlEmail(String to, String subject, String body, String type) {
        log.info("\n" +
                "========================================================================\n" +
                "[🛜 EMAIL SIMULATOR] SIMULANDO ENVÍO DE CORREO ELECTRÓNICO\n" +
                "------------------------------------------------------------------------\n" +
                "PARA   : {}\n" +
                "ASUNTO : {}\n" +
                "TIPO   : {}\n" +
                "CUERPO : \n" +
                "{}\n" +
                "========================================================================\n",
                to, subject, type, body);

        Notification notification = Notification.builder()
                .recipientEmail(to)
                .subject(subject)
                .body(body)
                .type(type)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
    }
}
