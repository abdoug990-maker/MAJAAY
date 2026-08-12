import { useState } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, LockKeyhole, Mail, User, Eye, EyeOff } from 'lucide-react';

async function parseApiResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Le serveur est temporairement indisponible.');
  return payload;
}

export function AuthPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const setUser = useAuthStore((s) => s.setUser);
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isLogin ? 'login' : 'register', email, name, password }),
      });
      const data = await parseApiResponse(response);
      setUser(data.user);
      if (rememberMe) localStorage.setItem('majaay-remember-me', 'true');
      navigate('home');
    } catch (err: any) {
      setError(err instanceof TypeError ? 'Connexion impossible. Vérifiez votre réseau.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = emailValid && password.length >= 8 && (isLogin || name.trim().length >= 2);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-20 bg-background pattern-african">
      <div className="w-full max-w-md">
        <Button variant="ghost" size="icon" className="mb-6" onClick={() => navigate('home')}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="text-center mb-7">
          <img src="/logo.png" alt="Ma Jaay" className="w-24 h-24 object-contain mx-auto mb-3 rounded-2xl" />
          <h1 className="text-2xl font-bold">{isLogin ? 'Bon retour sur Ma Jaay' : 'Créer votre compte Ma Jaay'}</h1>
          <p className="text-muted-foreground text-sm mt-1">{isLogin ? 'Connectez-vous avec votre e-mail et votre mot de passe.' : 'Inscription immédiate, sans confirmation e-mail.'}</p>
        </div>
        <Card className="marketplace-card shadow-lg">
          <CardContent className="p-6 space-y-4">
            {!isLogin && <div className="space-y-2"><Label htmlFor="name">Nom complet</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="name" placeholder="Votre nom" className="pl-10 h-11" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div></div>}
            <div className="space-y-2"><Label htmlFor="email">Adresse e-mail</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="email" type="email" placeholder="vous@exemple.com" className="pl-10 h-11" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div></div>
            <div className="space-y-2"><Label htmlFor="password">Mot de passe</Label><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="password" type={showPassword ? 'text' : 'password'} placeholder="8 caractères minimum" className="pl-10 pr-10 h-11" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isLogin ? 'current-password' : 'new-password'} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded accent-gold" />Rester connecté sur cet appareil</label>
            <Button className="w-full h-11 bg-[#00853F] hover:bg-[#006b32] text-white font-semibold shadow-md" onClick={submit} disabled={loading || !canSubmit}>{loading ? 'Veuillez patienter...' : isLogin ? 'Se connecter' : 'Créer mon compte'}</Button>
            <div className="text-center"><Button variant="link" className="text-sm text-[#006233]" onClick={() => { setIsLogin((value) => !value); setError(''); }}>{isLogin ? 'Pas encore de compte ? Inscrivez-vous' : 'Déjà un compte ? Connectez-vous'}</Button></div>
          </CardContent>
        </Card>
        <p className="text-[11px] text-center text-muted-foreground mt-6 max-w-xs mx-auto">Vos identifiants sont enregistrés de manière sécurisée. Aucun e-mail de confirmation n’est nécessaire.</p>
      </div>
    </div>
  );
}
