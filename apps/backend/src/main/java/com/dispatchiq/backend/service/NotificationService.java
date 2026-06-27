package com.dispatchiq.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationService {

    private final MailSender mailSender;

    public NotificationService(MailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends a real email notification to the approved dispatcher
     */
    public void sendEmail(String toEmail, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("your-email@gmail.com"); // Matches your application.properties username
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            
            mailSender.send(message);
            log.info("Real email notification successfully sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Dispatches an SMS alert.
     * Replace the console log below with your chosen local SMS gateway provider API call
     */
    public void sendSMS(Long phoneNumber, String messageText) {
        if (phoneNumber == null) {
            log.warn("Cannot send SMS: Phone number is missing.");
            return;
        }

        // Standardize the target string formatting (e.g., adding Ethiopia's +251 country code)
        String fullPhoneNumber = phoneNumber.toString().startsWith("251") 
                ? "+" + phoneNumber 
                : "+251" + phoneNumber;

        try {
            log.info("GATEWAY DISPATCH -> Sending live SMS to {}: \"{}\"", fullPhoneNumber, messageText);
            
            // TODO: Hook up your local gateway provider API call here when ready:
            // Example: HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
            
        } catch (Exception e) {
            log.error("Failed to dispatch SMS to {}: {}", fullPhoneNumber, e.getMessage());
        }
    }
}