# testKit — API publique de paiement (Bruno)

Collection **Bruno** pour tester l'API publique de paiement Septeo en sandbox.
Versionnée dans git : chaque requête = un fichier `.bru` lisible et diffable en PR.

## Prérequis

- **Bruno** installé (https://usebruno.com — `winget install Bruno.Bruno`).
- La **clé privée sandbox** du client de test (demande-la à l'équipe, elle n'est **jamais** dans git).

## Démarrage (clé en main)

1. **Cloner** ce repo et l'ouvrir dans Bruno : *Open Collection* → ce dossier.
2. **Secrets** : copier `.env.example` en `.env`, y coller la clé privée sandbox dans `PRIVATE_KEY_PEM`.
   Le `.env` est gitignoré, il ne part jamais.
3. **Developer Mode** : dans Bruno, *Collection settings → Safe Mode → Developer Mode*.
   C'est nécessaire pour que le script du jeton puisse signer avec `crypto` de Node.
4. Choisir l'environnement **Sandbox-Marc-Spa** (menu en haut à droite).
5. Lancer **`0 · Authentification / Obtenir un jeton`** → le token est signé et stocké tout seul.
6. Lancer n'importe quelle requête : elle réutilise le token automatiquement.

## Comment marche le token

La requête « Obtenir un jeton » a un **script pré-request** qui :
- lit `client_id`, `kid`, `aud` dans l'environnement, et la clé privée dans `.env` ;
- signe une assertion `private_key_jwt` (RS256) avec le `crypto` natif de Node ;
- la pose dans `client_assertion`, que la requête échange contre un `access_token` (stocké en variable).

Aucune clé n'est envoyée en clair, aucune n'est committée.

## Variables

- **Environnement** (`environments/Sandbox-Marc-Spa.bru`, versionné) : `base_url`, `token_url`, `client_id`,
  `kid`, `publicStoreId`, `shopperReference`, `amount_value`, `currency`, `consentMode`…
- **Runtime** (posées par les scripts au fil des appels) : `access_token`, `client_assertion`,
  `paymentLinkId`, `clientSession`, `deviceId`, `serviceId`. `pspReference` se colle à la main
  (récupéré du webhook d'autorisation) pour les opérations sur un paiement carte.
- **`Idempotency-Key`** : générée automatiquement avant chaque requête (script de collection → `{{idemKey}}`).

## Outils

- `tools/dropin-test.html` + `tools/serve.js` : page de test du Drop-in. Lance `node tools/serve.js`,
  ouvre http://localhost:3000/dropin-test.html, colle le `clientSession` renvoyé par une requête *Session*.
- `tools/pem-to-jwk.js` : convertit une clé publique PEM en JWK (pour le provisioning d'un client).

## Versioning

C'est du git normal : `git pull` pour te mettre à jour, une **branche** + **commit** + **Pull Request**
pour proposer une modif. Les diffs `.bru` se relisent comme du code. Rien ne dépend d'un cloud tiers.

## Secrets — à ne jamais committer

`.env` (clé privée) et tout `*.pem` sont gitignorés. Ne les force jamais dans un commit.
