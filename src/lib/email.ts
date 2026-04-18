export function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

export function buildPromoHtml(heading: string, body: string, ctaText: string, ctaUrl: string, name = "Valued Client") {
  const paragraphs = body
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => `<p style="margin:0 0 12px;color:#333;font-size:15px;line-height:1.6;">${l}</p>`)
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
    <h1 style="margin:0;color:#c8a45e;font-size:22px;letter-spacing:3px;">WESTMINSTER CHARIOTS</h1>
    <p style="margin:6px 0 0;color:#999;font-size:10px;letter-spacing:2px;">Travel in Luxury · Arrive in Style</p>
  </div>
  <div style="padding:36px 32px;">
    <p style="margin:0 0 4px;color:#999;font-size:13px;">Hello ${name},</p>
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:26px;font-weight:700;">${heading}</h2>
    <div style="width:50px;height:3px;background:#c8a45e;margin:0 0 24px;border-radius:2px;"></div>
    ${paragraphs}
    <div style="text-align:center;margin:36px 0 16px;">
      <a href="${ctaUrl}" style="display:inline-block;background:#c8a45e;color:#fff;padding:14px 44px;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;">${ctaText}</a>
    </div>
  </div>
  <div style="background:#fafafa;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
    <p style="margin:0;color:#999;font-size:11px;">Westminster Chariots · Washington, DC</p>
  </div>
</div></body></html>`;
}

export function buildBookingEmailHtml(booking: any, phase: string, driverName?: string, paymentUrl?: string) {
  const time = formatTime(booking.pickupTime);

  const rows = [
    ["Reservation #", booking.reservationNumber],
    ...(phase === "confirmed" && driverName ? [["Chauffeur", driverName]] : []),
    ["Date", booking.pickupDate],
    ["Time", time],
    ["Pickup", booking.pickupLocation],
    ["Dropoff", booking.dropoffLocation],
    ["Vehicle", (booking.vehicleType || "sedan").toUpperCase()],
    ...(booking.flightNumber ? [["Flight / Tail #", booking.flightNumber]] : []),
    ...(booking.specialRequests ? [["Special Requests", booking.specialRequests]] : []),
  ]
    .map(([l, v]) => `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#888;width:140px;">${l}</td><td style="padding:10px 0;color:#333;">${v || "—"}</td></tr>`)
    .join("");

  const payBtn = paymentUrl
    ? `<div style="text-align:center;margin:24px 0;"><a href="${paymentUrl}" style="display:inline-block;background:#c8a45e;color:#111;padding:14px 24px;font-weight:700;text-decoration:none;border-radius:8px;">Complete Payment</a></div>`
    : "";

  const statusLine =
    phase === "pending" ? "BOOKING RECEIVED" :
    phase === "payment_requested" ? "PAYMENT LINK" :
    phase === "confirmed" ? "✓ BOOKING CONFIRMED" : "UPDATE";

  const intro =
    phase === "pending" ? "Thank you for your reservation. Our dispatch team is assigning a chauffeur." :
    phase === "payment_requested" ? "Your ride is available. Please complete the secure payment to confirm your booking." :
    phase === "confirmed" ? "Great news! Your chauffeur has been assigned and your trip is confirmed." : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
  <div style="background:#1a1a1a;padding:24px 32px;text-align:center;">
    <h1 style="margin:0;color:#c8a45e;font-size:20px;letter-spacing:2px;">WESTMINSTER CHARIOTS</h1>
    <p style="margin:4px 0 0;color:#999;font-size:11px;letter-spacing:1px;">${statusLine}</p>
  </div>
  <div style="padding:24px 32px;">
    <p style="color:#333;font-size:14px;margin:0 0 16px;">Dear <strong>${booking.clientName || "Valued Client"}</strong>,<br/>${intro}</p>
    ${payBtn}
    <table style="width:100%;border-collapse:collapse;font-size:13px;">${rows}</table>
    <div style="margin:20px 0;padding:16px;background:#fdf8ed;border-radius:6px;border:1px solid #e8dbb8;">
      <p style="margin:0;color:#8b6914;font-size:12px;font-weight:600;">⏱ Wait Time Policy</p>
      <p style="margin:4px 0 0;color:#8b6914;font-size:11px;">Complimentary wait: 15 minutes. After that, $95/hour applies.</p>
    </div>
  </div>
  <div style="padding:20px 32px;background:#1a1a1a;text-align:center;">
    <p style="margin:0;color:#c8a45e;font-size:11px;letter-spacing:1px;">Westminster Chariots — Premium Chauffeur Services</p>
  </div>
</div></body></html>`;
}

export function buildReminderHtml(booking: any, type: "24h" | "1h") {
  const time = formatTime(booking.pickupTime);
  const heading = type === "24h" ? "Your ride is tomorrow" : "Your ride is arriving soon";
  const urgency = type === "1h" ? `<p style="margin:0 0 20px;color:#c8a45e;font-size:16px;font-weight:600;">Your chauffeur will arrive in approximately 1 hour.</p>` : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
    <h1 style="margin:0;color:#c8a45e;font-size:22px;letter-spacing:3px;">WESTMINSTER CHARIOTS</h1>
  </div>
  <div style="padding:36px 32px;">
    <p style="margin:0 0 4px;color:#999;font-size:13px;">Hello ${booking.clientName || "Valued Client"},</p>
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:26px;font-weight:700;">${heading}</h2>
    <div style="width:50px;height:3px;background:#c8a45e;margin:0 0 24px;border-radius:2px;"></div>
    ${urgency}
    <div style="background:#f9f9f9;border-radius:8px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#666;font-size:13px;width:100px;">Reservation</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600;">${booking.reservationNumber}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px;">Date</td><td style="padding:8px 0;color:#1a1a1a;">${booking.pickupDate}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px;">Time</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600;">${time}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px;">Pickup</td><td style="padding:8px 0;color:#1a1a1a;">${booking.pickupLocation}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px;">Dropoff</td><td style="padding:8px 0;color:#1a1a1a;">${booking.dropoffLocation}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px;">Vehicle</td><td style="padding:8px 0;color:#1a1a1a;text-transform:uppercase;">${booking.vehicleType}</td></tr>
      </table>
    </div>
    <p style="margin:0;color:#333;font-size:15px;line-height:1.6;">Please be ready at the pickup location a few minutes before the scheduled time.</p>
  </div>
  <div style="background:#fafafa;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
    <p style="margin:0;color:#999;font-size:11px;">Westminster Chariots · Washington, DC</p>
  </div>
</div></body></html>`;
}

export function buildManifestHtml(booking: any, driverName: string) {
  const time = formatTime(booking.pickupTime);
  const s = (v: string) => (v || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  const optRows = [
    booking.flightNumber ? `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#888;width:140px;">Flight / Tail #</td><td style="padding:10px 0;color:#333;">${s(booking.flightNumber)}</td></tr>` : "",
    booking.specialRequests ? `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#888;">Special Requests</td><td style="padding:10px 0;color:#333;">${s(booking.specialRequests)}</td></tr>` : "",
    booking.dispatcherNotes ? `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#888;">Dispatcher Notes</td><td style="padding:10px 0;color:#333;">${s(booking.dispatcherNotes)}</td></tr>` : "",
  ].join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
  <div style="background:#1a1a1a;padding:24px 32px;text-align:center;">
    <h1 style="margin:0;color:#c8a45e;font-size:20px;letter-spacing:2px;">WESTMINSTER CHARIOTS</h1>
    <p style="margin:4px 0 0;color:#999;font-size:11px;letter-spacing:1px;">TRIP MANIFEST</p>
  </div>
  <div style="padding:24px 32px;">
    <p style="color:#333;font-size:14px;margin:0 0 16px;">Hello <strong>${s(driverName)}</strong>, you have been assigned the following trip.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#888;width:140px;">Reservation #</td><td style="padding:10px 0;color:#333;font-weight:600;">${s(booking.reservationNumber)}</td></tr>
      <tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#888;">Client</td><td style="padding:10px 0;color:#333;">${s(booking.clientName || "—")}</td></tr>
      <tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#888;">Date</td><td style="padding:10px 0;color:#333;font-weight:600;">${s(booking.pickupDate)}</td></tr>
      <tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#888;">Time</td><td style="padding:10px 0;color:#333;font-weight:600;">${time}</td></tr>
      <tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#888;">Spot Time</td><td style="padding:10px 0;color:#333;">15 mins prior</td></tr>
      <tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#888;">Pickup</td><td style="padding:10px 0;color:#333;">${s(booking.pickupLocation)}</td></tr>
      <tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#888;">Dropoff</td><td style="padding:10px 0;color:#333;">${s(booking.dropoffLocation)}</td></tr>
      <tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#888;">Vehicle</td><td style="padding:10px 0;color:#333;text-transform:uppercase;">${s(booking.vehicleType)}</td></tr>
      ${optRows}
    </table>
    <div style="margin:20px 0;padding:16px;background:#fdf8ed;border-radius:6px;border:1px solid #e8dbb8;">
      <p style="margin:0;color:#8b6914;font-size:12px;font-weight:600;">Wait Time Policy</p>
      <p style="margin:4px 0 0;color:#8b6914;font-size:11px;">Complimentary wait: 15 minutes. After that, $95/hour applies.</p>
    </div>
  </div>
  <div style="padding:20px 32px;background:#1a1a1a;text-align:center;">
    <p style="margin:0;color:#c8a45e;font-size:11px;">Westminster Chariots — dispatch@westminsterchariots.com</p>
  </div>
</div></body></html>`;
}

export function buildPasswordResetHtml(name: string, resetUrl: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
    <h1 style="margin:0;color:#c8a45e;font-size:22px;letter-spacing:3px;">WESTMINSTER CHARIOTS</h1>
    <p style="margin:6px 0 0;color:#999;font-size:10px;letter-spacing:2px;">Travel in Luxury · Arrive in Style</p>
  </div>
  <div style="padding:36px 32px;">
    <p style="margin:0 0 4px;color:#999;font-size:13px;">Hello ${name},</p>
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:26px;font-weight:700;">Reset Your Password</h2>
    <div style="width:50px;height:3px;background:#c8a45e;margin:0 0 24px;border-radius:2px;"></div>
    <p style="margin:0 0 12px;color:#333;font-size:15px;line-height:1.6;">We received a request to reset your password. Click the button below to create a new password. This link expires in 15 minutes.</p>
    <p style="margin:0 0 24px;color:#333;font-size:15px;line-height:1.6;">If you didn't request this, you can safely ignore this email. Your password won't change unless you click the link.</p>
    <div style="text-align:center;margin:36px 0 24px;">
      <a href="${resetUrl}" style="display:inline-block;background:#c8a45e;color:#fff;padding:14px 44px;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;">Reset Password</a>
    </div>
    <div style="background:#f9f9f9;padding:16px;border-radius:6px;border:1px solid #e0e0e0;margin:20px 0;">
      <p style="margin:0;color:#999;font-size:12px;">This link is secure and can only be used once. If it expires, you can request a new password reset from the login page.</p>
    </div>
  </div>
  <div style="background:#fafafa;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
    <p style="margin:0;color:#999;font-size:11px;">Westminster Chariots · Washington, DC</p>
  </div>
</div></body></html>`;
}
