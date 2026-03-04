/**
 * HTML email templates for Vercera 5.0.
 * Vercera-themed design; use table-based layout and inline styles for email client compatibility.
 * Registration email expects QR to be embedded via cid:vercera-qr (inline attachment).
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Registration email HTML. Use <img src="cid:vercera-qr" /> for the QR; attach image with cid: 'vercera-qr'. */
export function registrationEmailHtml(params: {
  fullName: string;
  verceraId: string;
}): string {
  const { fullName, verceraId } = params;
  return `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Vercera 5.0 Registration</title>
</head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0e7490; padding: 24px 28px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin:0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Vercera 5.0</h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9);">AMURoboclub</p>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 28px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.15);">
              <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0e7490;">Welcome, ${escapeHtml(fullName)}!</h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #64748b; line-height: 1.5;">Your registration is complete. Save this email — you'll need your Vercera ID and QR code at the event.</p>

              <!-- Vercera ID block -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdfa; border: 1px solid #99f6e4; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #0e7490; text-transform: uppercase; letter-spacing: 0.8px;">Your Vercera ID</p>
                    <p style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: 1px;">${escapeHtml(verceraId)}</p>
                  </td>
                </tr>
              </table>

              <!-- QR Code -->
              <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px;">QR Code — show at venue</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <img src="cid:vercera-qr" alt="QR code for ${escapeHtml(verceraId)}" width="200" height="200" style="display:block; border-radius: 6px;" />
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 24px 0; font-size: 13px; color: #64748b;">Present this QR code at the registration desk for quick check-in. A PNG copy is attached to this email.</p>

              <!-- Footer line -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top: 1px solid #e2e8f0; padding-top: 20px;"></td></tr></table>
              <p style="margin: 20px 0 0 0; font-size: 12px; color: #94a3b8;">Vercera 5.0 — AMURoboclub. If you did not register, please ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

// Shared styles for receipt (keep existing structure, can restyle later)
const STYLES = {
  wrapper:
    "font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a; line-height: 1.5;",
  card: "background: #ffffff; border-radius: 12px; padding: 28px 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);",
  heading:
    "font-size: 22px; font-weight: 700; color: #0e7490; margin: 0 0 8px 0;",
  subheading: "font-size: 14px; color: #64748b; margin: 0 0 20px 0;",
  label:
    "font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;",
  value:
    "font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px;",
  footer:
    "font-size: 12px; color: #94a3b8; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;",
  table: "width: 100%; border-collapse: collapse; margin: 16px 0;",
  th: "text-align: left; padding: 10px 12px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;",
  td: "padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9;",
  totalRow: "font-weight: 700; font-size: 16px; color: #0e7490;",
};

export function paymentReceiptEmailHtml(params: {
  fullName: string;
  orderId: string;
  date: string;
  items: { name: string; amount: number }[];
  totalAmount: number;
}): string {
  const { fullName, orderId, date, items, totalAmount } = params;
  const rows = items
    .map(
      (i) =>
        `<tr><td style="${STYLES.td}">${escapeHtml(i.name)}</td><td style="${STYLES.td}">₹${i.amount.toLocaleString("en-IN")}</td></tr>`,
    )
    .join("");
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding: 24px 16px; background: #f8fafc;">
  <div style="${STYLES.wrapper}">
    <div style="${STYLES.card}">
      <h1 style="${STYLES.heading}">Payment Receipt — Vercera 5.0</h1>
      <p style="${STYLES.subheading}">Thank you for your payment. This is your receipt.</p>
      <p style="${STYLES.label}">Participant</p>
      <p style="${STYLES.value}">${escapeHtml(fullName)}</p>
      <p style="${STYLES.label}">Order ID</p>
      <p style="${STYLES.value}">${escapeHtml(orderId)}</p>
      <p style="${STYLES.label}">Date</p>
      <p style="${STYLES.value}">${escapeHtml(date)}</p>
      <p style="${STYLES.label}">Items</p>
      <table style="${STYLES.table}">
        <thead><tr><th style="${STYLES.th}">Item</th><th style="${STYLES.th}">Amount</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td style="${STYLES.td} ${STYLES.totalRow}">Total paid</td><td style="${STYLES.td} ${STYLES.totalRow}">₹${totalAmount.toLocaleString("en-IN")}</td></tr>
        </tfoot>
      </table>
      <p style="${STYLES.footer}">Vercera 5.0 — AMURoboclub. Keep this receipt for your records.</p>
    </div>
  </div>
</body>
</html>
`.trim();
}
