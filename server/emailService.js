import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
config({ path: join(rootDir, '.env') });

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Create reusable transporter object using SMTP transport
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_SMTP_PORT || 587,
      secure: process.env.EMAIL_SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS,
      },
      // Additional options for better deliverability
      pool: true, // use pooled connection
      rateLimit: 5, // limit to 5 emails per second
      maxConnections: 3, // maximum concurrent connections
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email service configuration error:', error);
      } else {
        console.log('Email service is ready to send messages');
      }
    });
  }

  async sendEmail({ to, subject, html, text, from }) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: from || process.env.EMAIL_FROM || 'noreply@sknshop.com',
        to,
        subject,
        html,
        text,
        // Add tracking headers if needed
        headers: {
          'X-Mailer': 'SKN Shop Notification System',
          'List-Unsubscribe': `<${process.env.FRONTEND_URL}/unsubscribe>`,
        },
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  async sendTemplateEmail(template, variables, recipient) {
    try {
      // Replace variables in template
      let subject = template.subject;
      let htmlBody = template.html_body;
      let textBody = template.text_body;

      // Replace variables in subject and body
      if (template.variables && Array.isArray(template.variables)) {
        template.variables.forEach(variable => {
          const regex = new RegExp(`{{${variable}}}`, 'g');
          const value = variables[variable] || '';

          subject = subject.replace(regex, value);
          htmlBody = htmlBody.replace(regex, value);
          if (textBody) {
            textBody = textBody.replace(regex, value);
          }
        });
      }

      return await this.sendEmail({
        to: recipient,
        subject,
        html: htmlBody,
        text: textBody,
      });
    } catch (error) {
      console.error('Failed to send template email:', error);
      throw error;
    }
  }

  // Queue email for later sending (useful for bulk emails or rate limiting)
  async queueEmail(emailData, delay = 0) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const result = await this.sendEmail(emailData);
          resolve(result);
        } catch (error) {
          console.error('Queued email failed:', error);
          resolve({ success: false, error: error.message });
        }
      }, delay);
    });
  }

  // Send with retry logic
  async sendWithRetry(emailData, maxRetries = 3, retryDelay = 5000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.sendEmail(emailData);
      } catch (error) {
        lastError = error;
        console.log(`Email send attempt ${attempt} failed, retrying in ${retryDelay}ms...`);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          // Exponential backoff
          retryDelay *= 2;
        }
      }
    }

    throw new Error(`Failed to send email after ${maxRetries} attempts: ${lastError.message}`);
  }

  // Graceful shutdown
  async close() {
    if (this.transporter) {
      this.transporter.close();
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;