'use client';

import { useState, useEffect } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, User, CheckCircle2 } from 'lucide-react';

async function parseApiResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : {};
  if (!response.ok) {
    throw new Error(payload.error || 'Le serveur est temporairement indisponible. Réessayez dans un instant.');
  }
  return payload;
}

export function AuthPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const { setUser } = useAuthStore();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (hash.get('error_code') === 'otp_expired' || hash.get('error') === 'access_denied') {
      setIsLogin(true);
      setStep('phone');
      setError('Le lien e-mail a expiré. Demandez un nouveau code à 6 chiffres.');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  const startResendTimer = () => setResendTimer(60);

  const handleSubmitPhone = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: isLogin ? undefined : name, mode: isLogin ? 'login' : 'register', action: 'send-email-otp' }),
      });
      await parseApiResponse(res);
      setStep('otp');
      setOtp('');
      startResendTimer();
    } catch (err: any) {
      setError(err instanceof TypeError ? 'Connexion impossible. Vérifiez votre réseau puis réessayez.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mode: isLogin ? 'login' : 'register', action: 'send-email-otp' }),
      });
      await parseApiResponse(res);
      startResendTimer();
    } catch (err: any) {
      setError(err instanceof TypeError ? 'Connexion impossible. Vérifiez votre réseau puis réessayez.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, name: name || undefined, action: 'verify-email-otp' }),
      });
      const data = await parseApiResponse(res);
      setUser(data.user);
      navigate('home');
    } catch (err: any) {
      setError(err instanceof TypeError ? 'Connexion impossible. Vérifiez votre réseau puis réessayez.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = isLogin ? emailValid : emailValid && name.trim().length >= 2;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-20 bg-background pattern-african">
      <div className="w-full max-w-sm">
        <Button variant="ghost" size="icon" className="mb-6" onClick={() => step === 'otp' ? setStep('phone') : navigate('home')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="text-center mb-8">
          <img src="/logo.png" alt="Ma Jaay" className="w-14 h-14 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Bienvenue sur Ma Jaay</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === 'otp'
              ? 'Vérifiez votre e-mail'
              : isLogin
                ? 'Connectez-vous'
                : 'Créez votre compte gratuitement'}
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            {step === 'phone' ? (
              <div className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="name" placeholder="Votre nom" className="pl-10 h-11" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@exemple.com"
                      className="pl-10 h-11"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Un code à 6 chiffres sera envoyé à cette adresse.</p>
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                <Button
                  className="w-full h-11 bg-gradient-to-r from-terracotta via-fuchsia-500 to-sky-500 text-white font-semibold shadow-md shadow-fuchsia-500/20 hover:brightness-105"
                  onClick={handleSubmitPhone}
                  disabled={loading || !canSubmit}
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le code OTP'}
                </Button>

                <div className="text-center">
                  <Button variant="link" className="text-sm" onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? 'Pas encore de compte ? Inscrivez-vous' : 'Déjà un compte ? Connectez-vous'}
                  </Button>
                </div>

              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-accent" />
                  <p className="text-sm text-muted-foreground">
                    Code envoyé par e-mail à
                  </p>
                  <p className="text-lg font-bold mt-1 break-all">{email}</p>
                </div>

                <div className="space-y-2">
                  <Label>Code OTP à 6 chiffres</Label>
                  <Input
                    placeholder="Entrez le code à 6 chiffres"
                    className="h-14 text-center text-2xl tracking-[0.3em] font-mono"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground text-center">
                    Saisissez le code reçu dans votre boîte e-mail. Aucun lien n’est nécessaire.
                  </p>
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                <Button
                  className="w-full h-11 bg-gradient-to-r from-terracotta via-fuchsia-500 to-sky-500 text-white font-semibold shadow-md shadow-fuchsia-500/20 hover:brightness-105"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length < 6}
                >
                  {loading ? 'Vérification...' : 'Vérifier et continuer'}
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    className="w-full text-sm"
                    onClick={handleResend}
                    disabled={resendTimer > 0}
                  >
                    {resendTimer > 0
                      ? `Renvoyer dans ${resendTimer}s`
                      : 'Renvoyer le code'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-[11px] text-center text-muted-foreground mt-6 max-w-xs mx-auto">
          En vous inscrivant, vous acceptez les conditions d&apos;utilisation de Ma Jaay.
        </p>
      </div>
    </div>
  );
}
