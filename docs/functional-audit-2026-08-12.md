# Audit fonctionnel Majaay — 12 août 2026

## Constats techniques

- Le composant `ImageUpload` appelait `/api/upload`, mais aucune route n’existait. Une route réelle `src/app/api/upload/route.ts` a été ajoutée pour Supabase Storage, avec contrôle de session, formats autorisés et limite de 5 Mo.
- La sélection multiple d’images utilisait une fermeture d’état obsolète et pouvait ne conserver que la dernière image. Le composant a été corrigé pour accumuler les URLs et supprimer les fichiers côté stockage.
- La messagerie dépendait de Socket.IO avec `io('/?XTransformPort=3003')`, alors qu’aucune route de messages REST n’existait. Une route `src/app/api/messages/route.ts` et une version REST avec polling de `ChatPage.tsx` ont été ajoutées.
- Les boutons « Appeler » et « Partager » de `ListingDetailPage` affichaient une notification de démonstration. Ils utilisent maintenant le numéro vendeur réel quand il existe, et l’API Web Share ou le presse-papiers.
- `ProfilePage.tsx` contient encore des statistiques codées en dur (`3`, `48`, `12`) et plusieurs menus « Bientôt disponible !` : Statistiques, Paramètres, Vérification vendeur, Moyens de paiement. Ils doivent être remplacés par des données et actions réelles.

## Données de production

Audit Supabase du projet `qmbaqueqfxnqehhhvgpa` : les annonces visibles incluent des enregistrements créés le 7 août 2026 avec des titres génériques comme « Machine à coudre Singer Tradition », « Terrain 150m² à Diamniadio », « Samsung Galaxy S23 Ultra », « Toyota Corolla 2019 - Excellent état », etc. Elles ont `images = []` et correspondent aux données de démonstration ressenties par l’utilisateur. Ne pas supprimer sans confirmation explicite si elles peuvent être considérées comme des données utilisateur ; proposer un nettoyage ciblé des comptes/annonces de démonstration.

## Déploiement

Le code fonctionnel est dans le dépôt local `/home/ubuntu/MAJAAY`. Le build Next.js passe avec les routes `/api/upload` et `/api/messages`.
