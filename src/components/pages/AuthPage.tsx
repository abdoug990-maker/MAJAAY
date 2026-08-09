'use client';

import { useEffect, useState } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, User, CheckCircle2 } from 'lucide-react';
import { isSupabaseBrowserConfigured, supabaseBrowser } from '@/lib/supabase-browser';

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
  const [step, setStep] = useState<'email' | 'sent'>('email');
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
    const errorCode = hash.get('error_code');
    if (errorCode === 'otp_expired' || hash.get('error') === 'access_denied') {
      setIsLogin(true);
      setStep('email');
      setError('Ce lien e-mail a expiré. Demandez un nouveau lien de connexion.');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured || !supabaseBrowser) return;
    let cancelled = false;

    const syncSession = async (accessToken: string) => {
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync-session', accessToken }),
        });
        const data = await parseApiResponse(res);
        if (!cancelled && data.user) {
          setUser(data.user);
          navigate('home');
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof TypeError ? 'Connexion impossible. Vérifiez votre réseau.' : (err as Error).message);
      }
    };

    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) void syncSession(data.session.access_token);
    });
    const { data: listener } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) void syncSession(session.access_token);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [navigate, setUser]);

  const startResendTimer = () => setResendTimer(60);

  const sendMagicLink = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: isLogin ? undefined : name,
          mode: isLogin ? 'login' : 'register',
          action: 'send-email-otp',
        }),
      });
      await parseApiResponse(res);
      setStep('sent');
      startResendTimer();
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
        <Button variant="ghost" size="icon" className="mb-6" onClick={() => step === 'sent' ? setStep('email') : navigate('home')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="text-center mb-8">
          <img src="/logo.png" alt="Ma Jaay" className="w-14 h-14 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Bienvenue sur Ma Jaay</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === 'sent' ? 'Vérifiez votre boîte e-mail' : isLogin ? 'Connectez-vous' : 'Créez votre compte gratuitement'}
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            {step === 'email' ? (
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
                    <Input id="email" type="email" placeholder="vous@exemple.com" className="pl-10 h-11" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Un lien de connexion sécurisé sera envoyé à cette adresse.</p>
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button className="w-full h-11 bg-gradient-to-r from-terracotta via-fuchsia-500 to-sky-500 text-white font-semibold shadow-md shadow-fuchsia-500/20 hover:brightness-105" onClick={sendMagicLink} disabled={loading || !canSubmit}>
                  {loading ? 'Envoi en cours...' : 'Recevoir le lien par e-mail'}
                </Button>
                <div className="text-center">
                  <Button variant="link" className="text-sm" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                    {isLogin ? 'Pas encore de compte ? Inscrivez-vous' : 'Déjà un compte ? Connectez-vous'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <CheckCircle2 className="w-7 h-7 mx-auto mb-2 text-accent" />
                  <p className="text-sm text-muted-foreground">Lien de connexion envoyé à</p>
                  <p className="text-lg font-bold mt-1 break-all">{email}</p>
                </div>
                <p className="text-sm text-center text-muted-foreground">Ouvrez l’e-mail et cliquez sur le bouton de connexion. Vous serez connecté automatiquement à Ma Jaay.</p>
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
                <Button variant="outline" className="w-full h-11" onClick={sendMagicLink} disabled={loading || resendTimer > 0}>
                  {resendTimer > 0 ? `Renvoyer dans ${resendTimer}s` : 'Renvoyer le lien'}
                </Button>
                <Button variant="link" className="w-full text-sm" onClick={() => setStep('email')}>Modifier l’adresse e-mail</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-[11px] text-center text-muted-foreground mt-6 max-w-xs mx-auto">En vous inscrivant, vous acceptez les conditions d&apos;utilisation de Ma Jaay.</p>
      </div>
    </div>
  );
}
