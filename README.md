# testKit — API publique de paiement (Bruno)

Collection **Bruno** pour tester l'API publique de paiement Septeo en sandbox.
Versionnée dans git : chaque requête = un fichier `.bru` lisible et diffable en PR.

## Prérequis

- **Bruno** installé (https://usebruno.com — `winget install Bruno.Bruno`).
- La **clé privée sandbox** du client de test (demande-la à l'équipe, elle n'est **jamais** dans git).

## Démarrage (clé en main)

1. **Cloner** ce repo et l'ouvrir dans Bruno : *Open Collection* → ce dossier.
2. **Secret — la clé privée** : à la racine du repo, copie **`.env.example`** en **`.env`** (gitignoré, il ne part jamais)
   et mets-y la clé privée sandbox dans la variable `PRIVATE_KEY_PEM` :
   ```
   PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\n…colle la clé ici…\n-----END PRIVATE KEY-----\n"
   ```
   PEM en une ligne avec des `\n` littéraux, **ou** en multiligne entre guillemets — le script gère les deux.
   La clé de test se demande à l'équipe (voir « La clé » plus bas).
2bis. **Secret — le client SSO legacy** (seulement pour le dossier `7 · Réconciliation & Google Pay`) :
   dans le même `.env`, ajoute `SSO_CLIENT_SECRET`. Il se lit dans le back-office, onglet
   **API Key public** d'un store, champ *SSO Application secret*. Le `client_id` associé est le
   champ *SSO Application Id* juste au-dessus, déjà renseigné dans l'environnement sous
   `sso_client_id`. Sans ce secret, seuls les endpoints v2 (Hydra) sont jouables.
3. **Developer Mode** : dans Bruno, *Collection settings → Safe Mode → Developer Mode*.
   C'est nécessaire pour que le script du jeton puisse signer avec `crypto` de Node.
4. Choisir l'environnement **Sandbox-Marc-Spa** (ou **Test-Marc-Spa**) dans le menu en haut à droite.
5. Lancer **`0 · Authentification / Obtenir un jeton`** → le token est signé et stocké tout seul.
6. Lancer n'importe quelle requête : elle réutilise le token automatiquement.

## Comment marche le token

La requête « Obtenir un jeton » a un **script pré-request** qui :
- lit `client_id`, `kid`, `aud` dans l'environnement, et la clé privée dans `.env` ;
- signe une assertion `private_key_jwt` (RS256) avec le `crypto` natif de Node ;
- la pose dans `client_assertion`, que la requête échange contre un `access_token` (stocké en variable).

Aucune clé n'est envoyée en clair, aucune n'est committée.

### Deux valeurs changent selon l'environnement (#2965)

La **même clé privée** sert sur tous les environnements. Ce qui change, c'est ce qu'on demande avec :

| Environnement | `aud` de l'assertion (= `token_url`)                               | `token_audience` (paramètre `audience`)      |
|---------------|--------------------------------------------------------------------|----------------------------------------------|
| sandbox       | `https://septeo-payments-public-api-sandbox.septeo.fr/oauth2/token` | `septeo-payments-sandbox-public-api`         |
| qualification | `https://septeo-payments-public-api-qualification.septeo.fr/oauth2/token` | `septeo-payments-qualification-public-api` |
| test (pprod)  | `https://septeo-payments-public-api-pprod.septeo.fr/oauth2/token`   | `septeo-payments-testing-public-api`         |
| production    | `https://septeo-payments-public-api.septeo.fr/oauth2/token`         | `septeo-payments-public-api`                 |

- `aud` doit valoir exactement le point de jeton de l'environnement : Hydra refuse l'assertion sinon.
- `audience` est obligatoire : sans lui le jeton n'a pas de claim `aud` et l'API le refuse (401).
  Un jeton obtenu pour un environnement n'est jamais accepté par un autre.
- Tant que #2965 n'est **pas déployé** sur un environnement, celui-ci attend encore les anciennes valeurs
  (`aud` = `https://oauth.api.septeo-payments.fr/oauth2/token`, `audience` = `septeo-payments-public-api`).
  C'est le cas de l'environnement **Test** au 2026-09-28 : son fichier garde les anciennes valeurs, à
  basculer sur la ligne « test » du tableau le jour du déploiement.

## Variables

- **Environnement** (`environments/Sandbox-Marc-Spa.bru` et `environments/Test-Marc-Spa.bru`, versionnés) :
  `base_url`, `token_url`, `aud`, `token_audience`, `client_id`, `kid`, `publicStoreId`, `shopperReference`,
  `amount_value`, `currency`, `consentMode`… Le client de test **Marc Resort Group 2** existe sur les deux
  environnements avec la même clé (bases copiées depuis la sandbox) ; `base_url` de Test à confirmer.
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

## La clé : calibrée sur un main-customer

Le trio **clé privée + `client_id` + `kid`** (le `client_id` et le `kid` sont dans l'environnement) identifie **un** main-customer — ici le client de test **Marc Resort Group 2**. Cette clé autorise **tout le périmètre de ce main-customer** :

- ✅ tu peux changer `publicStoreId` (dans l'environnement `Sandbox-Marc-Spa.bru`) pour **n'importe quelle boutique de CE main-customer** → ça marche.
- ❌ elle **ne marche pas** pour une boutique d'un **autre** main-customer → refus (cloisonnement fail-closed, 403/404). Il faudrait la clé (client_id/kid + clé privée) **de cet autre main-customer**.

Autrement dit : une clé = un main-customer, tous ses stores ; jamais les stores d'un autre.

## Secrets — à ne jamais committer

`.env` (clé privée) et tout `*.pem` sont gitignorés. Ne les force jamais dans un commit. La clé de test se distribue par un **canal sûr** (jamais dans git, ni par mail public).
