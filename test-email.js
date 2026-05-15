// Test script to verify Resend email configuration
// Run with: node test-email.js

import { Resend } from 'resend';
import { config } from 'dotenv';

config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('🧪 Testing Westminster Chariots Email Configuration...\n');

  // Check if API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env file');
    console.log('   Add your Resend API key to .env:');
    console.log('   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx\n');
    process.exit(1);
  }

  console.log('✅ RESEND_API_KEY found');
  console.log(`   Key: ${process.env.RESEND_API_KEY.substring(0, 10)}...\n`);

  // Test email send
  try {
    console.log('📧 Sending test email...');
    
    const result = await resend.emails.send({
      from: 'Westminster Chariots <book@mail.westminsterchariots.com>',
      to: 'admin@westminsterchariots.com',
      subject: 'Test Email - Westminster Chariots Email System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif;">
          <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
            <div style="background:#1a1a1a;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#c8a45e;font-size:20px;letter-spacing:2px;">WESTMINSTER CHARIOTS</h1>
              <p style="margin:4px 0 0;color:#999;font-size:11px;letter-spacing:1px;">EMAIL SYSTEM TEST</p>
            </div>
            <div style="padding:24px 32px;">
              <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:18px;">✅ Email System Working!</h2>
              <p style="color:#333;font-size:14px;margin:0 0 12px;">
                Your Resend email configuration is working correctly. The Westminster Chariots email system is ready to send:
              </p>
              <ul style="color:#333;font-size:14px;line-height:1.8;">
                <li>Customer booking confirmations</li>
                <li>Admin booking notifications</li>
                <li>Driver trip manifests</li>
                <li>Payment links</li>
                <li>Cancellation notices</li>
              </ul>
              <div style="margin:20px 0;padding:16px;background:#f8f8f8;border-left:3px solid #c8a45e;border-radius:4px;">
                <p style="margin:0;color:#666;font-size:12px;font-weight:600;">Test Details</p>
                <p style="margin:4px 0 0;color:#333;font-size:13px;">
                  Sent: ${new Date().toLocaleString()}<br>
                  From: book@mail.westminsterchariots.com<br>
                  API Key: ${process.env.RESEND_API_KEY.substring(0, 10)}...
                </p>
              </div>
            </div>
            <div style="padding:20px 32px;background:#1a1a1a;text-align:center;">
              <p style="margin:0;color:#c8a45e;font-size:11px;">Westminster Chariots — Premium Chauffeur Services</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Email ID: ${result.data?.id}`);
    console.log(`   To: admin@westminsterchariots.com`);
    console.log(`   From: book@mail.westminsterchariots.com\n`);
    
    console.log('📊 Next Steps:');
    console.log('   1. Check admin@westminsterchariots.com inbox');
    console.log('   2. Check spam/junk folder if not in inbox');
    console.log('   3. View email in Resend dashboard: https://resend.com/emails');
    console.log('   4. Verify domain is verified in Resend\n');
    
    console.log('🎉 Email system is ready for production!\n');
    
  } catch (error) {
    console.error('❌ Failed to send test email');
    console.error(`   Error: ${error.message}\n`);
    
    if (error.message.includes('API key')) {
      console.log('💡 Troubleshooting:');
      console.log('   - Verify your Resend API key is correct');
      console.log('   - Get API key from: https://resend.com/api-keys');
      console.log('   - Add to .env: RESEND_API_KEY=re_xxxxxxxxxxxx\n');
    } else if (error.message.includes('domain')) {
      console.log('💡 Troubleshooting:');
      console.log('   - Verify mail.westminsterchariots.com is added in Resend');
      console.log('   - Check DNS records are configured');
      console.log('   - Wait up to 48 hours for DNS propagation');
      console.log('   - Verify domain at: https://resend.com/domains\n');
    } else {
      console.log('💡 Troubleshooting:');
      console.log('   - Check Resend dashboard: https://resend.com');
      console.log('   - View error logs in Resend');
      console.log('   - Contact Resend support if issue persists\n');
    }
    
    process.exit(1);
  }
}

testEmail();
