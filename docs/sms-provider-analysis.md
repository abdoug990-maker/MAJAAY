# Analyse OTP SMS MaJaay

## Conclusion

L’ID d’expéditeur `MaJaay` vérifié au Sénégal correspond au fonctionnement d’un fournisseur SMS comme Brevo : il autorise l’identification de la marque, mais ne constitue pas à lui seul une intégration API. Il faut encore un compte fournisseur avec un solde/crédits SMS et une clé API.

Supabase Auth Phone Login accepte nativement les fournisseurs MessageBird, Twilio et Vonage, ainsi que TextLocal en support communautaire. Brevo n’est pas un fournisseur natif de Supabase Auth.

Deux architectures sont possibles :

1. Utiliser un fournisseur natif Supabase et renseigner ses identifiants dans Authentication > Sign In / Providers > Phone.
2. Utiliser un Send SMS Hook Supabase avec une fonction Edge qui reçoit l’OTP généré par Supabase puis appelle l’API SMS du fournisseur régional. Le hook reçoit `user.phone` et `sms.otp`, et doit répondre HTTP 200 après envoi.

Le second scénario est compatible avec l’ID d’expéditeur MaJaay, mais nécessite une clé API du fournisseur SMS et des crédits. Une clé API ne doit pas être placée dans le frontend ni communiquée dans le chat.

## Sources

- https://supabase.com/docs/guides/auth/phone-login
- https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook
- https://help.brevo.com/hc/en-us/articles/28255350696466-Register-a-Sender-ID-to-send-SMS-messages
