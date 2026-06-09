import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Pzzle <noreply@pzzle.nl>'

// Instantieer per aanroep zodat het niet crasht tijdens build (module-level init)
function getResend() {
  const key = (process.env.RESEND_API_KEY ?? '').replace(/^﻿/, '').trim()
  return new Resend(key)
}

function isEnabled() {
  return !!(process.env.RESEND_API_KEY ?? '').replace(/^﻿/, '').trim()
}

// ── Bevestigingsmail voor speler na registratie ────────────────────────────
export async function sendRegistrationConfirmation(
  player: { email: string; first_name: string },
  campaign: { title: string; client?: { name: string } | null }
) {
  if (!isEnabled()) return
  const clientName = (campaign.client as { name: string } | null)?.name ?? campaign.title

  try {
    await getResend().emails.send({
      from: FROM,
      to: player.email,
      subject: `Je doet mee bij ${clientName}! 🎉`,
      html: `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">🎯</div>
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">Je doet mee!</h1>
          <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Pzzle — Zoek de Verschillen</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Hoi <strong>${player.first_name}</strong>! 👋</p>
          <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
            Je hebt succesvol meegedaan aan de campagne van <strong>${clientName}</strong>.
            Je naam staat nu in de trekking!
          </p>

          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="margin:0;font-size:13px;color:#0369a1;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Campagne</p>
            <p style="margin:4px 0 0;font-size:17px;color:#0c4a6e;font-weight:700;">${campaign.title}</p>
          </div>

          <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
            Als je gewonnen hebt, krijg je een e-mail van ons. Kom morgen terug om opnieuw te spelen — elke dag nieuwe campagnes bij jou in de buurt!
          </p>

          <div style="text-align:center;margin:0 0 8px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://pzzle.nl'}/speel"
               style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;">
              🎮 Speel morgen weer
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">
            Je ontvangt dit bericht omdat je hebt meegedaan aan Pzzle.<br>
            © Pzzle — Zoek de Verschillen Platform
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    })
  } catch (err) {
    console.error('[mailer] sendRegistrationConfirmation failed:', err)
  }
}

// ── Winnaarmelding ────────────────────────────────────────────────────────
export async function sendWinnerNotification(
  player: { email: string; first_name: string; last_name: string },
  campaignTitle: string,
  clientName: string,
  prizeTitle: string,
  contactInfo?: string
) {
  if (!isEnabled()) return

  try {
    await getResend().emails.send({
      from: FROM,
      to: player.email,
      subject: `🎉 Gefeliciteerd ${player.first_name}! Je hebt gewonnen bij ${clientName}!`,
      html: `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#d97706,#f59e0b);padding:32px;text-align:center;">
          <div style="font-size:48px;margin-bottom:8px;">🏆</div>
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;">Je hebt gewonnen!</h1>
          <p style="margin:8px 0 0;color:#fef3c7;font-size:14px;">Pzzle — Zoek de Verschillen</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Hoi <strong>${player.first_name}</strong>! 👋</p>
          <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
            Gefeliciteerd! Jij bent gekozen als winnaar van de campagne van <strong>${clientName}</strong>.
            Je mooie prijs staat klaar!
          </p>

          <!-- Prijs kaart -->
          <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fbbf24;border-radius:14px;padding:24px;margin:0 0 24px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Jouw prijs</p>
            <p style="margin:0;font-size:22px;color:#78350f;font-weight:800;">${prizeTitle}</p>
            <p style="margin:6px 0 0;font-size:12px;color:#92400e;">bij ${campaignTitle}</p>
          </div>

          ${contactInfo ? `
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="margin:0 0 4px;font-size:13px;color:#166534;font-weight:600;">Hoe claim je je prijs?</p>
            <p style="margin:0;font-size:14px;color:#15803d;line-height:1.5;">${contactInfo}</p>
          </div>
          ` : `
          <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
            Het bedrijf neemt binnenkort contact met je op via dit e-mailadres om je prijs te regelen.
          </p>
          `}

          <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;text-align:center;">
            Blijf spelen voor meer kansen op geweldige prijzen!
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">
            © Pzzle — Zoek de Verschillen Platform
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    })
  } catch (err) {
    console.error('[mailer] sendWinnerNotification failed:', err)
  }
}
