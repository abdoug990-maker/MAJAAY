// Ma Jaay - Service SMS OTP
// Utilise l'endpoint OTP dédié de Termii (channel: "otp")
// Template: "Your {{Company Name}} verification code is {{OTP}}. This code expires in 10 minutes. Do not share with anyone."

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
 * Envoie un OTP via Termii (endpoint dédié otp/send)
 * - channel: "otp" (moins cher, fiable, optimisé pour les codes)
 * - Le template est configuré côté Termii dashboard
 * - pin_type: "NUMERIC" pour générer côté Termii aussi (backup)
 */
export async function sendOtpTermii(phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  if (!TERMII_API_KEY) {
    return { ok: false, error: 'TERMII_API_KEY non configuré' };
  }

  try {
    const res = await fetch('https://api.termii.com/api/sms/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        to: phone,
        from: SMS_SENDER,
        pin_type: 'NUMERIC',
        pin_attempts: 3,
        pin_time_to_live: 5,       // 5 minutes
        pin_length: 6,
        pin_placeholder: '{{OTP}}',
        message_text: `Your Ma Jaay verification code is {{OTP}}. This code expires in 5 minutes. Do not share with anyone.`,
        channel: 'otp',
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
 * Envoie l'OTP au numéro donné
 * Si Termii est configuré → envoi SMS réel via channel otp
 * Sinon → mode démo, le code est retourné au frontend
 */
export async function sendOtpSms(phone: string, code: string): Promise<{ ok: boolean; code?: string; error?: string }> {
  if (isSmsConfigured) {
    const result = await sendOtpTermii(phone, code);
    if (result.ok) {
      return { ok: true };
    }
    console.error('SMS Termii failed:', result.error);
    // Fallback: renvoyer le code côté frontend en cas d'échec
    return { ok: true, code, error: result.error };
  }

  // Pas de provider → mode démo
  return { ok: true, code };
}

/**
 * Génère, stocke et envoie un OTP
 */
export async function createAndSendOtp(phone: string, purpose: string = 'auth') {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Invalider les anciens codes
  await db.otpCode.updateMany({
    where: { phone, verified: false },
    data: { verified: true },
  });

  // Stocker
  await db.otpCode.create({
    data: { phone, code, purpose, expiresAt },
  });

  // Envoyer
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
