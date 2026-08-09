# Notes de configuration Supabase OTP

Sources consultées le 9 août 2026 :

- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/reference/javascript/auth-signinwithotp

Supabase utilise la même méthode `signInWithOtp` pour le Magic Link et l’OTP. Le contenu du template e-mail détermine le résultat : `{{ .ConfirmationURL }}` envoie un lien, tandis que `{{ .Token }}` envoie un code numérique à 6 chiffres. La vérification côté serveur se fait avec `verifyOtp({ email, token, type: 'email' })`. Le tableau de bord indique que l’édition du template nécessite un SMTP personnalisé sur le projet actuel ; sans cette configuration, le modèle par défaut continue d’envoyer le lien.
