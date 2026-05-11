import { companyName } from "../lib/globalType";

const verificationCodeTemplate = (code: string, name: string) => `
  <div style="background-color: #F9FAFB; padding: 50px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.05);">
      
      <!-- Gradient Header -->
      <div style="background: linear-gradient(135deg, #7256F2 0%, #49D1C0 100%); padding: 50px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Verify your email</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0; font-size: 18px; font-weight: 500;">Welcome to ${companyName}</p>
      </div>

      <!-- Main Content -->
      <div style="padding: 45px 35px;">
        <p style="margin: 0 0 20px; font-size: 17px; line-height: 1.6; color: #374151;">Hi ${name},</p>
        <p style="margin: 0 0 35px; font-size: 17px; line-height: 1.6; color: #374151;">
          You requested to verify your account on <strong style="color: #7256F2;">${companyName}</strong>. Enter the secure code below to proceed:
        </p>
        
        <!-- Verification Code Box -->
        <div style="text-align: center; margin: 45px 0;">
          <div style="display: inline-block; background: #F3F4F6; padding: 25px 45px; border-radius: 16px; border: 2px dashed #D1D5DB;">
            <span style="font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #7256F2; font-family: 'Courier New', Courier, monospace;">${code}</span>
          </div>
          <p style="margin: 20px 0 0; font-size: 15px; color: #6B7280; font-weight: 500;">
            This code is valid for <span style="color: #EF4444;">10 minutes</span>.
          </p>
        </div>
        
        <p style="margin: 40px 0 0; font-size: 14px; color: #9CA3AF; text-align: center; line-height: 1.5;">
          Didn’t request this? Please ignore this email. Your account is safe.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #F3F4F6;">
        <p style="margin: 0; font-size: 14px; color: #9CA3AF; font-weight: 500;">
          &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
        </p>
      </div>

    </div>
  </div>
`;

export default verificationCodeTemplate;
