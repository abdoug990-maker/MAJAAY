'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, LockKeyhole, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouterStore } from '@/stores/use-router-store';

export function AdminLoginPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [setupMode, setSetupMode] = useState(false);
  const [setupToken, setSetupToken] = useState('');
  const [username, setUsername] = useState('abdoug660@gmail.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin-auth').then((r) => r.json()).then((data) => {
      setConfigured(Boolean(data.configured));
      setSetupMode(!data.configured);
    }).catch(() => toast.error('Impossible de charger la configuration admin.'));
  }, []);

  const submit = async () => {
    if (setupMode && password !== confirmPassword) { toast.error('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 10) { toast.error('Le mot de passe doit contenir au moins 10 caractères.'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/admin-auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupMode
          ? { action: 'setup', setupToken, username, password }
          : { action: 'login', username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur');
      if (setupMode) {
        toast.success('Mot de passe admin créé. Connectez-vous.');
        setConfigured(true); setSetupMode(false); setPassword(''); setConfirmPassword(''); setSetupToken('');
      } else {
        toast.success('Connexion admin réussie.');
        navigate('admin');
      }
    } catch (error: any) { toast.error(error.message || 'Erreur'); }
    finally { setLoading(false); }
  };

  if (configured === null) return <div className="min-h-screen grid place-items-center"><div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl">
        <button onClick={() => navigate('home')} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Retour à Ma Jaay</button>
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-terracotta/10 text-terracotta"><ShieldCheck className="h-6 w-6" /></div>
          <div><h1 className="text-xl font-bold">Administration Ma Jaay</h1><p className="text-xs text-muted-foreground">Accès sécurisé indépendant de l’e-mail</p></div>
        </div>
        <div className="space-y-4">
          {setupMode && <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Première configuration : utilisez le secret temporaire configuré pour le déploiement, puis créez votre mot de passe admin.</div>}
          {setupMode && <Input placeholder="Secret temporaire de configuration" value={setupToken} onChange={(e) => setSetupToken(e.target.value)} type="password" />}
          <Input placeholder="Identifiant admin" value={username} onChange={(e) => setUsername(e.target.value)} type="email" autoComplete="username" />
          <div className="relative"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete={setupMode ? 'new-password' : 'current-password'} /></div>
          {setupMode && <Input placeholder="Confirmer le mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" autoComplete="new-password" />}
          <Button className="h-11 w-full gradient-majaay text-white" onClick={submit} disabled={loading}>{loading ? 'Traitement...' : setupMode ? 'Créer le mot de passe admin' : 'Se connecter'}</Button>
          {!setupMode && <button className="w-full text-center text-xs text-muted-foreground hover:text-foreground" onClick={() => setSetupMode(true)}>Première configuration</button>}
        </div>
      </div>
    </div>
  );
}
