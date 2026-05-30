// ─── Step 1: Booking Request Confirmation ──────────────────────────────────

export function buildClientBookingRequestEmail(
  clientName: string,
  reservationNumber: string,
  pickupDate: string,
  pickupTime: string,
  pickupLocation: string,
  dropoffLocation: string,
  vehicleType: string,
  bookingUrl: string
) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px 20px !important; }
      .header { padding: 32px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div class="container" style="max-width:600px;margin:0 auto;background:#fff;">
    <!-- Header -->
    <div class="header" style="background:linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);padding:40px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Westminster Chariots</h1>
      <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;font-weight:500;">Premium Chauffeur Services</p>
    </div>
    
    <!-- Content -->
    <div class="content" style="padding:40px 32px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-block;background:#dbeafe;border-radius:50%;width:64px;height:64px;line-height:64px;margin-bottom:16px;">
          <span style="font-size:32px;">✓</span>
        </div>
        <h2 style="margin:0 0 8px;color:#1e293b;font-size:24px;font-weight:700;">Booking Request Received</h2>
        <p style="margin:0;color:#64748b;font-size:15px;">Confirmation #: <strong style="color:#1e40af;">${reservationNumber}</strong></p>
      </div>
      
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
        Hello <strong>${clientName}</strong>,
      </p>
      
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
        Thank you for choosing Westminster Chariots. We've received your booking request and our dispatch team is reviewing it now.
      </p>
      
      <!-- Trip Details Card -->
      <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:24px;margin:24px 0;">
        <h3 style="margin:0 0 16px;color:#1e293b;font-size:16px;font-weight:600;">Trip Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;">Date & Time</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${pickupDate} at ${pickupTime}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">Pickup</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;">${pickupLocation}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">Dropoff</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;">${dropoffLocation}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">Vehicle</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;text-transform:uppercase;">${vehicleType}</td>
          </tr>
        </table>
      </div>
      
      <!-- What Happens Next -->
      <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:20px;margin:24px 0;border-radius:8px;">
        <h3 style="margin:0 0 16px;color:#1e40af;font-size:16px;font-weight:600;">What Happens Next</h3>
        <div style="margin-bottom:12px;">
          <div style="display:inline-block;background:#3b82f6;color:#fff;border-radius:50%;width:24px;height:24px;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:8px;vertical-align:middle;">1</div>
          <span style="color:#475569;font-size:14px;vertical-align:middle;"><strong>Availability Review</strong> — Our dispatch team confirms chauffeur availability</span>
        </div>
        <div style="margin-bottom:12px;">
          <div style="display:inline-block;background:#3b82f6;color:#fff;border-radius:50%;width:24px;height:24px;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:8px;vertical-align:middle;">2</div>
          <span style="color:#475569;font-size:14px;vertical-align:middle;"><strong>Payment Link</strong> — You'll receive a secure payment link via email</span>
        </div>
        <div style="margin-bottom:12px;">
          <div style="display:inline-block;background:#3b82f6;color:#fff;border-radius:50%;width:24px;height:24px;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:8px;vertical-align:middle;">3</div>
          <span style="color:#475569;font-size:14px;vertical-align:middle;"><strong>Chauffeur Assignment</strong> — A professional chauffeur is assigned with their details</span>
        </div>
        <div>
          <div style="display:inline-block;background:#3b82f6;color:#fff;border-radius:50%;width:24px;height:24px;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:8px;vertical-align:middle;">4</div>
          <span style="color:#475569;font-size:14px;vertical-align:middle;"><strong>Ride Day</strong> — Your chauffeur arrives 15 minutes early for a seamless experience</span>
        </div>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${bookingUrl}" style="display:inline-block;background:#3b82f6;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 4px 6px rgba(59,130,246,0.2);">
          View Booking Details
        </a>
      </div>
      
      <!-- Support Info -->
      <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:24px 0;">
        <h3 style="margin:0 0 12px;color:#1e293b;font-size:14px;font-weight:600;">Need Assistance?</h3>
        <p style="margin:0 0 8px;color:#475569;font-size:14px;">
          📞 <strong>Phone:</strong> <a href="tel:+15714266338" style="color:#3b82f6;text-decoration:none;">+1 (571) 426-6338</a>
        </p>
        <p style="margin:0 0 8px;color:#475569;font-size:14px;">
          ✉️ <strong>Email:</strong> <a href="mailto:book@westminsterchariots.com" style="color:#3b82f6;text-decoration:none;">book@westminsterchariots.com</a>
        </p>
        <p style="margin:0;color:#475569;font-size:14px;">
          🕐 <strong>Hours:</strong> 24/7 Customer Support
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0 0 8px;color:#64748b;font-size:12px;">Westminster Chariots · Triangle, VA · Washington DC Metro</p>
      <p style="margin:0;color:#64748b;font-size:12px;">Premium Chauffeur Services Since 2020</p>
    </div>
  </div>
</body>
</html>`;
}

export function buildAdminBookingNotificationEmail(
  reservationNumber: string,
  clientName: string,
  pickupDate: string,
  pickupTime: string,
  pickupLocation: string,
  dropoffLocation: string,
  vehicleType: string,
  gatekeeperStatus: string,
  bookingId: string,
  adminDashboardUrl: string
) {
  const urgencyColor = 
    gatekeeperStatus === "emergency" ? "#dc2626" :
    gatekeeperStatus === "urgent" ? "#f59e0b" : "#3b82f6";
  
  const urgencyBg = 
    gatekeeperStatus === "emergency" ? "#fee2e2" :
    gatekeeperStatus === "urgent" ? "#fef3c7" : "#dbeafe";
  
  const urgencyLabel = 
    gatekeeperStatus === "emergency" ? "🚨 EMERGENCY" :
    gatekeeperStatus === "urgent" ? "⚡ URGENT" : "📋 STANDARD";

  const urgencyMessage = 
    gatekeeperStatus === "emergency" ? "Pickup in less than 4 hours - Immediate action required!" :
    gatekeeperStatus === "urgent" ? "Pickup in less than 12 hours - Prompt action needed." : 
    "Standard booking - Review at your earliest convenience.";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px 20px !important; }
      .header { padding: 28px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div class="container" style="max-width:600px;margin:0 auto;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div class="header" style="background:linear-gradient(135deg, #1e293b 0%, #334155 100%);padding:32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">🔔 New Booking Request</h1>
      <p style="margin:8px 0 0;color:#cbd5e1;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Admin Notification</p>
    </div>
    
    <!-- Urgency Badge -->
    <div style="background:${urgencyBg};padding:16px 32px;text-align:center;border-bottom:3px solid ${urgencyColor};">
      <div style="color:${urgencyColor};font-size:16px;font-weight:700;margin-bottom:4px;">${urgencyLabel}</div>
      <div style="color:${urgencyColor};font-size:12px;font-weight:500;">${urgencyMessage}</div>
    </div>
    
    <!-- Content -->
    <div class="content" style="padding:32px;">
      <div style="margin-bottom:24px;">
        <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:700;">Booking Request Details</h2>
        <p style="margin:0;color:#64748b;font-size:14px;">Confirmation #: <strong style="color:#3b82f6;font-size:15px;">${reservationNumber}</strong></p>
      </div>
      
      <!-- Booking Info Card -->
      <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:24px;margin:24px 0;">
        <h3 style="margin:0 0 16px;color:#1e293b;font-size:15px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Trip Information</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;color:#64748b;font-size:14px;width:140px;border-bottom:1px solid #e2e8f0;vertical-align:top;">Client</td>
            <td style="padding:10px 0;color:#1e293b;font-size:14px;font-weight:600;border-bottom:1px solid #e2e8f0;">${clientName}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;font-size:14px;border-bottom:1px solid #e2e8f0;vertical-align:top;">Date & Time</td>
            <td style="padding:10px 0;color:#1e293b;font-size:14px;font-weight:600;border-bottom:1px solid #e2e8f0;">${pickupDate} at ${pickupTime}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;font-size:14px;border-bottom:1px solid #e2e8f0;vertical-align:top;">Pickup</td>
            <td style="padding:10px 0;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0;">${pickupLocation}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;font-size:14px;border-bottom:1px solid #e2e8f0;vertical-align:top;">Dropoff</td>
            <td style="padding:10px 0;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0;">${dropoffLocation}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;font-size:14px;vertical-align:top;">Vehicle</td>
            <td style="padding:10px 0;color:#1e293b;font-size:14px;font-weight:600;text-transform:uppercase;">${vehicleType}</td>
          </tr>
        </table>
      </div>
      
      <!-- Action Required -->
      <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:20px;margin:24px 0;border-radius:8px;">
        <h3 style="margin:0 0 8px;color:#1e40af;font-size:14px;font-weight:600;">⚡ Action Required</h3>
        <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
          Review this booking request, confirm chauffeur availability, and send the payment link to the client.
        </p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${adminDashboardUrl}/admin/bookings/${bookingId}" style="display:inline-block;background:#3b82f6;color:#fff;padding:16px 40px;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 4px 6px rgba(59,130,246,0.25);transition:all 0.2s;">
          View in Admin Dashboard →
        </a>
      </div>
      
      <!-- Quick Actions Checklist -->
      <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #e2e8f0;">
        <h3 style="margin:0 0 16px;color:#1e293b;font-size:14px;font-weight:600;">📋 Quick Actions Checklist</h3>
        <div style="margin-bottom:10px;padding-left:4px;">
          <span style="color:#3b82f6;font-size:16px;margin-right:8px;">☐</span>
          <span style="color:#475569;font-size:13px;line-height:1.6;">Confirm chauffeur availability</span>
        </div>
        <div style="margin-bottom:10px;padding-left:4px;">
          <span style="color:#3b82f6;font-size:16px;margin-right:8px;">☐</span>
          <span style="color:#475569;font-size:13px;line-height:1.6;">Review trip details and special requests</span>
        </div>
        <div style="margin-bottom:10px;padding-left:4px;">
          <span style="color:#3b82f6;font-size:16px;margin-right:8px;">☐</span>
          <span style="color:#475569;font-size:13px;line-height:1.6;">Send payment link to client</span>
        </div>
        <div style="padding-left:4px;">
          <span style="color:#3b82f6;font-size:16px;margin-right:8px;">☐</span>
          <span style="color:#475569;font-size:13px;line-height:1.6;">Assign chauffeur once payment is received</span>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background:#1e293b;padding:24px 32px;text-align:center;border-top:1px solid #0f172a;">
      <p style="margin:0 0 8px;color:#cbd5e1;font-size:12px;font-weight:500;">Westminster Chariots Admin Dashboard</p>
      <p style="margin:0;color:#64748b;font-size:11px;">This is an automated notification for administrators only</p>
    </div>
  </div>
</body>
</html>`;
}

export function buildDriverAccountEmail(driverName: string, email: string, tempPassword: string, loginUrl: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#c8a45e;font-size:22px;letter-spacing:3px;">WESTMINSTER CHARIOTS</h1>
      <p style="margin:6px 0 0;color:#999;font-size:10px;letter-spacing:2px;">Premium Chauffeur Services</p>
    </div>
    
    <div style="padding:36px 32px;">
      <p style="margin:0 0 4px;color:#999;font-size:13px;">Hello ${driverName},</p>
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:26px;font-weight:700;">Welcome to the Team</h2>
      <div style="width:50px;height:3px;background:#c8a45e;margin:0 0 24px;border-radius:2px;"></div>
      
      <p style="margin:0 0 12px;color:#333;font-size:15px;line-height:1.6;">
        Your driver account has been created. You can now access the Westminster Chariots driver portal to view your assignments and manage your schedule.
      </p>
      
      <div style="background:#f8f8f8;border-left:3px solid #c8a45e;padding:16px 20px;margin:24px 0;">
        <p style="margin:0 0 8px;color:#666;font-size:13px;font-weight:600;">Login Credentials</p>
        <p style="margin:0 0 4px;color:#333;font-size:14px;"><strong>Email:</strong> ${email}</p>
        <p style="margin:0;color:#333;font-size:14px;"><strong>Temporary Password:</strong> <code style="background:#fff;padding:4px 8px;border-radius:4px;font-family:monospace;color:#c8a45e;">${tempPassword}</code></p>
      </div>
      
      <p style="margin:24px 0 12px;color:#333;font-size:15px;line-height:1.6;">
        Please log in and change your password immediately for security.
      </p>
      
      <div style="text-align:center;margin:36px 0 16px;">
        <a href="${loginUrl}" style="display:inline-block;background:#c8a45e;color:#fff;padding:14px 44px;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;">
          Access Driver Portal
        </a>
      </div>
      
      <p style="margin:24px 0 0;color:#999;font-size:13px;">
        If you have any questions, please contact dispatch at (571) 435-1832.
      </p>
    </div>
    
    <div style="background:#fafafa;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0;color:#999;font-size:11px;">Westminster Chariots · Triangle, VA · Washington DC Metro</p>
      <p style="margin:8px 0 0;color:#999;font-size:11px;">+1 (571) 426-6338 · book@westminsterchariots.com</p>
    </div>
  </div>
</body>
</html>`;
}

export function buildPaymentLinkEmail(
  clientName: string,
  reservationNumber: string,
  pickupDate: string,
  pickupTime: string,
  pickupLocation: string,
  dropoffLocation: string,
  vehicleType: string,
  finalPrice: number,
  paymentLink: string
) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px 20px !important; }
      .header { padding: 32px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div class="container" style="max-width:600px;margin:0 auto;background:#fff;">
    <!-- Header -->
    <div class="header" style="background:linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);padding:40px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Westminster Chariots</h1>
      <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;font-weight:500;">Premium Chauffeur Services</p>
    </div>
    
    <!-- Content -->
    <div class="content" style="padding:40px 32px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-block;background:#dbeafe;border-radius:50%;width:64px;height:64px;line-height:64px;margin-bottom:16px;">
          <span style="font-size:32px;">💳</span>
        </div>
        <h2 style="margin:0 0 8px;color:#1e293b;font-size:24px;font-weight:700;">Complete Your Booking</h2>
        <p style="margin:0;color:#64748b;font-size:15px;">Confirmation #: <strong style="color:#1e40af;">${reservationNumber}</strong></p>
      </div>
      
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
        Hello <strong>${clientName}</strong>,
      </p>
      
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
        Great news! Your chauffeur is available and ready to serve you. Please complete your payment to finalize your booking.
      </p>
      
      <!-- Trip Details Card -->
      <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:24px;margin:24px 0;">
        <h3 style="margin:0 0 16px;color:#1e293b;font-size:16px;font-weight:600;">Trip Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;">Date & Time</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${pickupDate} at ${pickupTime}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">Pickup</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;">${pickupLocation}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">Dropoff</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;">${dropoffLocation}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">Vehicle</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;text-transform:uppercase;">${vehicleType}</td>
          </tr>
        </table>
      </div>
      
      <!-- Price Card -->
      <div style="background:linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);border:2px solid #3b82f6;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 8px;color:#64748b;font-size:14px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Total Amount</p>
        <p style="margin:0 0 4px;color:#1e40af;font-size:36px;font-weight:700;line-height:1;">$${finalPrice.toFixed(2)}</p>
        <p style="margin:0;color:#64748b;font-size:12px;">Includes gratuity, fees, and tolls</p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${paymentLink}" style="display:inline-block;background:#3b82f6;color:#fff;padding:16px 48px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 6px rgba(59,130,246,0.3);">
          Pay Now - $${finalPrice.toFixed(2)}
        </a>
      </div>
      
      <p style="margin:24px 0;color:#64748b;font-size:13px;text-align:center;line-height:1.6;">
        Secure payment powered by Clover. Your payment information is encrypted and protected.
      </p>
      
      <!-- What Happens After Payment -->
      <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:20px;margin:24px 0;border-radius:8px;">
        <h3 style="margin:0 0 12px;color:#1e40af;font-size:14px;font-weight:600;">What Happens After Payment</h3>
        <p style="margin:0 0 8px;color:#475569;font-size:13px;line-height:1.6;">
          ✓ You'll receive an instant confirmation email
        </p>
        <p style="margin:0 0 8px;color:#475569;font-size:13px;line-height:1.6;">
          ✓ Your chauffeur will be assigned and you'll receive their details
        </p>
        <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">
          ✓ On ride day, your chauffeur will arrive 15 minutes early
        </p>
      </div>
      
      <!-- Support Info -->
      <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:24px 0;">
        <h3 style="margin:0 0 12px;color:#1e293b;font-size:14px;font-weight:600;">Need Assistance?</h3>
        <p style="margin:0 0 8px;color:#475569;font-size:14px;">
          📞 <strong>Phone:</strong> <a href="tel:+15714266338" style="color:#3b82f6;text-decoration:none;">+1 (571) 426-6338</a>
        </p>
        <p style="margin:0 0 8px;color:#475569;font-size:14px;">
          ✉️ <strong>Email:</strong> <a href="mailto:book@westminsterchariots.com" style="color:#3b82f6;text-decoration:none;">book@westminsterchariots.com</a>
        </p>
        <p style="margin:0;color:#475569;font-size:14px;">
          🕐 <strong>Hours:</strong> 24/7 Customer Support
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0 0 8px;color:#64748b;font-size:12px;">Westminster Chariots · Triangle, VA · Washington DC Metro</p>
      <p style="margin:0;color:#64748b;font-size:12px;">Premium Chauffeur Services Since 2020</p>
    </div>
  </div>
</body>
</html>`;
}

export function buildCancellationEmail(
  driverName: string,
  reservationNumber: string,
  clientName: string,
  pickupDate: string,
  pickupTime: string,
  pickupLocation: string,
  dropoffLocation: string
) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#c8a45e;font-size:22px;letter-spacing:3px;">WESTMINSTER CHARIOTS</h1>
      <p style="margin:6px 0 0;color:#999;font-size:10px;letter-spacing:2px;">Trip Cancellation</p>
    </div>
    
    <div style="padding:36px 32px;">
      <p style="margin:0 0 4px;color:#999;font-size:13px;">Hello ${driverName},</p>
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:26px;font-weight:700;">Trip Cancelled</h2>
      <div style="width:50px;height:3px;background:#c8a45e;margin:0 0 24px;border-radius:2px;"></div>
      
      <p style="margin:0 0 12px;color:#333;font-size:15px;line-height:1.6;">
        The following trip assignment has been cancelled. You are no longer required for this booking.
      </p>
      
      <div style="background:#fff5f5;border-left:3px solid #ef4444;padding:20px;margin:24px 0;">
        <p style="margin:0 0 12px;color:#666;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Cancelled Trip</p>
        <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Confirmation #:</strong> ${reservationNumber}</p>
        <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Client:</strong> ${clientName}</p>
        <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Date & Time:</strong> ${pickupDate} at ${pickupTime}</p>
        <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Pickup:</strong> ${pickupLocation}</p>
        <p style="margin:0;color:#333;font-size:14px;"><strong>Dropoff:</strong> ${dropoffLocation}</p>
      </div>
      
      <p style="margin:24px 0 0;color:#999;font-size:13px;">
        If you have any questions, please contact dispatch at (571) 426-6338.
      </p>
    </div>
    
    <div style="background:#fafafa;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0;color:#999;font-size:11px;">Westminster Chariots Dispatch</p>
      <p style="margin:8px 0 0;color:#999;font-size:11px;">+1 (571) 426-6338 · dispatch@westminsterchariots.com</p>
    </div>
  </div>
</body>
</html>`;
}

export function buildManifestEmail(
  driverName: string,
  reservationNumber: string,
  clientName: string,
  clientPhone: string,
  pickupDate: string,
  pickupTime: string,
  pickupLocation: string,
  dropoffLocation: string,
  vehicleType: string,
  specialRequests: string | null
) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#c8a45e;font-size:22px;letter-spacing:3px;">WESTMINSTER CHARIOTS</h1>
      <p style="margin:6px 0 0;color:#999;font-size:10px;letter-spacing:2px;">Trip Manifest</p>
    </div>
    
    <div style="padding:36px 32px;">
      <p style="margin:0 0 4px;color:#999;font-size:13px;">Hello ${driverName},</p>
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:26px;font-weight:700;">New Assignment</h2>
      <div style="width:50px;height:3px;background:#c8a45e;margin:0 0 24px;border-radius:2px;"></div>
      
      <p style="margin:0 0 12px;color:#333;font-size:15px;line-height:1.6;">
        You have been assigned to the following trip. Please review the details carefully.
      </p>
      
      <div style="background:#f8f8f8;border-left:3px solid #c8a45e;padding:20px;margin:24px 0;">
        <p style="margin:0 0 12px;color:#666;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Trip Details</p>
        <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Confirmation #:</strong> ${reservationNumber}</p>
        <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Client:</strong> ${clientName}</p>
        <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Phone:</strong> ${clientPhone}</p>
        <p style="margin:0 0 16px;color:#333;font-size:14px;"><strong>Vehicle:</strong> ${vehicleType.toUpperCase()}</p>
        
        <div style="border-top:1px solid #ddd;padding-top:16px;margin-top:16px;">
          <p style="margin:0 0 8px;color:#c8a45e;font-size:13px;font-weight:600;">📅 ${pickupDate} at ${pickupTime}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Pickup:</strong> ${pickupLocation}</p>
          <p style="margin:0;color:#333;font-size:14px;"><strong>Dropoff:</strong> ${dropoffLocation}</p>
        </div>
        
        ${specialRequests ? `
        <div style="border-top:1px solid #ddd;padding-top:16px;margin-top:16px;">
          <p style="margin:0 0 8px;color:#666;font-size:12px;font-weight:600;">Special Requests:</p>
          <p style="margin:0;color:#333;font-size:14px;font-style:italic;">${specialRequests}</p>
        </div>
        ` : ''}
      </div>
      
      <p style="margin:24px 0 0;color:#999;font-size:13px;">
        Please confirm receipt and contact dispatch if you have any questions.
      </p>
    </div>
    
    <div style="background:#fafafa;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0;color:#999;font-size:11px;">Westminster Chariots Dispatch</p>
      <p style="margin:8px 0 0;color:#999;font-size:11px;">+1 (571) 426-6338 · dispatch@westminsterchariots.com</p>
    </div>
  </div>
</body>
</html>`;
}
