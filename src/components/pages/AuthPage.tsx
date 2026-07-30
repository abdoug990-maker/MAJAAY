'client';

import { useState } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Phone, User, ShieldCheck } from 'lucide-react';

export function AuthPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const { setUser } = useAuthStore();
  const [isLogin, setIsLogin] = useState(false);
  const [phone, setPhone] = useState('+221');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitPhone = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: isLogin ? undefined : name, action: isLogin ? 'login' : 'register' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
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
        body: JSON.stringify({ phone, otp, name: name || undefined, action: 'verify-otp' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
      navigate('home');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-20 bg-background pattern-african">
      <div className="w-full max-w-sm">
        {/* Back */}
        <Button variant="ghost" size="icon" className="mb-6" onClick={() => step === 'otp' ? setStep('phone') : navigate('home')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-majaay flex items-center justify-center">
            <span className="text-white text-2xl font-bold">MJ</span>
          </div>
          <h1 className="text-2xl font-bold">Bienvenue sur Ma Jaay</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === 'otp' ? 'Vérifiez votre numéro' : isLogin ? 'Connectez-vous' : 'Créez votre compte gratuitement'}
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
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+221 77 000 00 00"
                      className="pl-10 h-11"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Format : +221 suivi de 9 chiffres</p>
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                <Button
                  className="w-full h-11 gradient-majaay text-white font-semibold"
                  onClick={handleSubmitPhone}
                  disabled={loading || (isLogin ? !phone.match(/^\+221[0-9]{9}$/) : !phone.match(/^\+221[0-9]{9}$/) || !name.trim())}
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le code OTP'}
                </Button>

                <div className="text-center">
                  <Button variant="link" className="text-sm" onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? 'Pas encore de compte ? Inscrivez-vous' : 'Déjà un compte ? Connectez-vous'}
                  </Button>
                </div>

                {/* Demo accounts */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Comptes démo (OTP : 1234) :</p>
                  <div className="space-y-1.5">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7 font-normal" onClick={() => { setPhone('+221770000001'); setName('Aminata Diallo'); setIsLogin(true); }}>
                      <ShieldCheck className="w-3 h-3 mr-2 text-accent" /> Aminata - Vendeuse Premium
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7 font-normal" onClick={() => { setPhone('+221770000002'); setName('Moussa Ndiaye'); setIsLogin(true); }}>
                      <ShieldCheck className="w-3 h-3 mr-2 text-accent" /> Moussa - Vendeur Standard
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7 font-normal" onClick={() => { setPhone('+221770000000'); setName('Admin Ma Jaay'); setIsLogin(true); }}>
                      <ShieldCheck className="w-3 h-3 mr-2 text-amber-500" /> Admin - Super Admin
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Code envoyé au</p>
                  <p className="text-lg font-bold mt-1">{phone}</p>
                </div>
                <div className="space-y-2">
                  <Label>Code OTP</Label>
                  <Input
                    placeholder="Entrez le code à 4 chiffres"
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground text-center">En démo, utilisez le code : 1234</p>
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                <Button
                  className="w-full h-11 gradient-majaay text-white font-semibold"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 4}
                >
                  {loading ? 'Vérification...' : 'Vérifier et continuer'}
                </Button>

                <Button variant="link" className="w-full text-sm" onClick={() => setStep('phone')}>
                  Renvoyer le code
                </Button>
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
