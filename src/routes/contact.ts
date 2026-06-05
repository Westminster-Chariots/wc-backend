import { Hono } from "hono";
import { Resend } from "resend";
import { env } from "../lib/env";
import { z } from "zod";

const contact = new Hono();
const resend = new Resend(env.RESEND_API_KEY);

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

contact.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validated = contactSchema.parse(body);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#c8a45e;font-size:22px;letter-spacing:3px;">WESTMINSTER CHARIOTS</h1>
      <p style="margin:6px 0 0;color:#999;font-size:10px;letter-spacing:2px;">New Contact Form Submission</p>
    </div>
    
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:26px;font-weight:700;">New Message from Website</h2>
      <div style="width:50px;height:3px;background:#c8a45e;margin:0 0 24px;border-radius:2px;"></div>
      
      <div style="background:#f8f8f8;border-left:3px solid #c8a45e;padding:20px;margin:24px 0;">
        <p style="margin:0 0 12px;color:#666;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Contact Details</p>
        <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Name:</strong> ${validated.firstName} ${validated.lastName}</p>
        <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Email:</strong> <a href="mailto:${validated.email}" style="color:#c8a45e;">${validated.email}</a></p>
        <p style="margin:0;color:#333;font-size:14px;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 12px;color:#666;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Message</p>
        <p style="margin:0;color:#333;font-size:14px;line-height:1.6;white-space:pre-wrap;">${validated.message}</p>
      </div>
      
      <p style="margin:24px 0 0;color:#999;font-size:13px;">
        Reply to this inquiry at: <a href="mailto:${validated.email}" style="color:#c8a45e;">${validated.email}</a>
      </p>
    </div>
    
    <div style="background:#fafafa;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0;color:#999;font-size:11px;">Westminster Chariots · Washington DC Metro</p>
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from: "Westminster Chariots <book@mail.westminsterchariots.com>",
      to: ["admin@westminsterchariots.com", "westminsterchariots@gmail.com"],
      replyTo: validated.email,
      subject: `New Contact Form: ${validated.firstName} ${validated.lastName}`,
      html,
    });

    return c.json({ success: true, message: "Message sent successfully" });
  } catch (error: any) {
    console.error("Contact form error:", error);
    if (error.name === "ZodError") {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: "Failed to send message" }, 500);
  }
});

export default contact;
