import { companyName } from "../lib/globalType";

interface MessageTemplateProps {
  email: string;
  subject: string;
  message: string;
}

const sendMessageTemplate = ({
  email,
  subject,
  message,
}: MessageTemplateProps): string => {
  return `
    <div style="background-color: #F9FAFB; padding: 50px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <header style="padding: 30px; text-align: center; border-bottom: 1px solid #F3F4F6;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #7256F2;">${companyName}</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: #6B7280; font-weight: 500;">New Inquiry Received</p>
        </header>

        <!-- Content -->
        <section style="padding: 40px 30px;">
          <div style="margin-bottom: 25px; background: #F9FAFB; padding: 20px; border-radius: 12px;">
            <div style="margin-bottom: 12px;">
              <strong style="display: block; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">From:</strong>
              <span style="color: #111827; font-size: 16px; font-weight: 500;">${email}</span>
            </div>
            
            <div>
              <strong style="display: block; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Subject:</strong>
              <span style="color: #111827; font-size: 16px; font-weight: 500;">${subject}</span>
            </div>
          </div>

          <div style="margin-top: 30px;">
            <strong style="display: block; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Message:</strong>
            <div style="padding: 24px; background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
          </div>
        </section>

        <!-- Footer -->
        <footer style="padding: 30px; background-color: #F9FAFB; border-top: 1px solid #F3F4F6; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: #9CA3AF; line-height: 1.5;">
            This message was sent via the <strong>${companyName}</strong> contact form.<br/>
            &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
          </p>
        </footer>

      </div>
    </div>
  `;
};

export default sendMessageTemplate;
