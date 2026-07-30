// Ma Jaay - Service SMS OTP
// Supporte Termii (Afrique) et fallback demo

import { db } from './db';

const TERMII_API_KEY = process.env.TERMII_API_KEY || '';
const SMS_SENDER = process.env.SMS_SENDER_ID || 'MaJaay';

export const isSmsConfigured = !!TERMII_API_KEY;

/**
 * Génère un code OTP de 6 chiffres
 */
export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Envoie un SMS via Termii (gateway africaine - Sénégal, Mali, Côte d'Ivoire...)
 * Inscription: https://termii.com — crédits gratuits pour tester
 */
export async function sendSmsTermii(phone: string, message: string): Promise<{ ok: boolean; error?: string }> {
  if (!TERMII_API_KEY) {
    return { ok: false, error: 'TERMII_API_KEY non configuré' };
  }

  try {
    const res = await fetch('https://api.termii.com/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TERMII_API_KEY}`,
      },
      body: JSON.stringify({
        to: phone,
        from: SMS_SENDER,
        sms: message,
        type: 'plain',
        channel: 'generic',
      }),
    });

    const data = await res.json();
    if (data.status === 'success' || res.ok) {
      return { ok: true };
    }
    return { ok: false, error: data.message || data.reason || 'Erreur Termii' };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Erreur réseau SMS' };
  }
}

/**
 * Envoie un SMS via le provider configuré
 * Si aucun provider n'est configuré, le code est retourné en mode dev
 */
export async function sendOtpSms(phone: string, code: string): Promise<{ ok: boolean; code?: string; error?: string }> {
  const message = `Votre code Ma Jaay est ${code}. Ne le partagez pas. Expire dans 5 min.`;

  if (isSmsConfigured) {
    const result = await sendSmsTermii(phone, message);
    if (result.ok) {
      return { ok: true };
    }
    console.error('SMS Termii failed:', result.error);
    return { ok: true, code, error: 'SMS non envoyé (fallback mode)' };
  }

  // Pas de provider → mode démo : le code est renvoyé au frontend
  return { ok: true, code };
}

/**
 * Génère, stocke et envoie un OTP
 */
export async function createAndSendOtp(phone: string, purpose: string = 'auth') {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Invalider les anciens codes pour ce numéro
  await db.otpCode.updateMany({
    where: { phone, verified: false },
    data: { verified: true },
  });

  // Stocker le nouveau code
  await db.otpCode.create({
    data: { phone, code, purpose, expiresAt },
  });

  // Envoyer le SMS
  const smsResult = await sendOtpSms(phone, code);

  return {
    sent: smsResult.ok,
    devCode: smsResult.code,
    error: smsResult.error,
  };
}

/**
 * Vérifie un code OTP
 */
export async function verifyOtp(phone: string, code: string, purpose: string = 'auth'): Promise<{ valid: boolean; error?: string }> {
  const record = await db.otpCode.findFirst({
    where: {
      phone,
      code,
      purpose,
      verified: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return { valid: false, error: 'Code invalide ou expiré' };
  }

  await db.otpCode.update({ where: { id: record.id }, data: { verified: true } });

  return { valid: true };
}
