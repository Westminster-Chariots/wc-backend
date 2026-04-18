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
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#c8a45e;font-size:22px;letter-spacing:3px;">WESTMINSTER CHARIOTS</h1>
      <p style="margin:6px 0 0;color:#999;font-size:10px;letter-spacing:2px;">Premium Chauffeur Services</p>
    </div>
    
    <div style="padding:36px 32px;">
      <p style="margin:0 0 4px;color:#999;font-size:13px;">Hello ${clientName},</p>
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:26px;font-weight:700;">Complete Your Booking</h2>
      <div style="width:50px;height:3px;background:#c8a45e;margin:0 0 24px;border-radius:2px;"></div>
      
      <p style="margin:0 0 12px;color:#333;font-size:15px;line-height:1.6;">
        Your reservation has been confirmed and is ready for payment. Please complete your payment to finalize your booking.
      </p>
      
      <div style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 12px;color:#666;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Reservation Details</p>
        <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Confirmation #:</strong> ${reservationNumber}</p>
        <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Date & Time:</strong> ${pickupDate} at ${pickupTime}</p>
        <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Pickup:</strong> ${pickupLocation}</p>
        <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Dropoff:</strong> ${dropoffLocation}</p>
        <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Vehicle:</strong> ${vehicleType.toUpperCase()}</p>
        <div style="border-top:1px solid #e0e0e0;margin:16px 0;padding-top:16px;">
          <p style="margin:0;color:#1a1a1a;font-size:20px;font-weight:700;">Total: <span style="color:#c8a45e;">$${finalPrice.toFixed(2)}</span></p>
          <p style="margin:4px 0 0;color:#999;font-size:12px;">Includes gratuity, fees, and tolls</p>
        </div>
      </div>
      
      <div style="text-align:center;margin:36px 0 16px;">
        <a href="${paymentLink}" style="display:inline-block;background:#c8a45e;color:#fff;padding:14px 44px;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;">
          Pay Now - $${finalPrice.toFixed(2)}
        </a>
      </div>
      
      <p style="margin:24px 0 0;color:#999;font-size:13px;">
        Once payment is received, you'll receive a confirmation email with your chauffeur assignment details.
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
