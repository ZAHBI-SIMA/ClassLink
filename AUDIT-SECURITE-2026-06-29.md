# Rapport d'audit de sécurité — ClasseLink
**Date :** 2026-06-29  
**Périmètre :** `classelink/` — Next.js 16, React 19, TypeScript, Prisma 7, next-auth v5, JWT mobile, multi-tenant PostgreSQL  
**Auditeur :** Claude (audit automatisé planifié)  
**Données sensibles :** élèves mineurs, notes, paiements, rôles multiples

---

## Top 10 des risques prioritaires

| # | Titre | Niveau | Fichier |
|---|-------|--------|---------|
| 1 | Secret JWT mobile codé en dur | **Critique** | `lib/auth/mobile-jwt.ts` |
| 2 | Injection SQL dans l'endpoint FCM | **Critique** | `app/api/mobile/fcm/register/route.ts` |
| 3 | Contournement 2FA dans le middleware (HMAC non vérifié) | **Critique** | `proxy.ts` |
| 4 | Access token et refresh token interchangeables | **Élevé** | `lib/auth/mobile-jwt.ts`, `/api/mobile/auth/refresh` |
| 5 | Absence de rate limiting sur l'API mobile | **Élevé** | `app/api/mobile/auth/login/route.ts` |
| 6 | Google OAuth sans vérification de tenant | **Élevé** | `lib/auth/config.ts` |
| 7 | IDOR : bulletin d'un autre élève accessible par STUDENT | **Moyen** | `actions/bulletin.ts` |
| 8 | `updateSubscriptionStatus` sans validation d'état | **Moyen** | `actions/cafeteria.ts` |
| 9 | Clés de paiement production dans `.env.local` | **Moyen** | `.env.local` |
| 10 | `AUTH_SECRET` placeholder / secret 2FA codé en dur | **Moyen** | `.env.local`, `lib/auth/two-fa-cookie.ts` |

---

## Failles détaillées

---

### F-01 — Secret JWT mobile codé en dur
**Niveau :** 🔴 Critique  
**Fichier :** `lib/auth/mobile-jwt.ts` lignes 3-5

**Code vulnérable :**
```typescript
const SECRET = new TextEncoder().encode(
  process.env.MOBILE_JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'classlink-mobile-secret'
)
```

**Scénario d'exploitation :**  
Si `MOBILE_JWT_SECRET` et `NEXTAUTH_SECRET` ne sont pas définis dans l'environnement, le secret utilisé pour signer et vérifier les JWT mobiles est la chaîne publiquement connue `'classlink-mobile-secret'`. Un attaquant peut alors :
1. Forger un JWT valide avec `role: 'ADMIN'` ou `role: 'STUDENT'` et n'importe quel `schoolId`
2. Appeler toutes les routes mobiles protégées (`/api/mobile/grades`, `/api/mobile/payments`, `/api/mobile/bulletins`, etc.)
3. Accéder aux données de tous les élèves, parents, notes et paiements d'un tenant

**Impact métier :** Divulgation de données personnelles de mineurs, violation RGPD, accès aux informations de paiement.

**Correction :**
```typescript
// lib/auth/mobile-jwt.ts
function getSecret(): Uint8Array {
  const s = process.env.MOBILE_JWT_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('MOBILE_JWT_SECRET ou NEXTAUTH_SECRET doit être défini.')
  return new TextEncoder().encode(s)
}
// Remplacer `.sign(SECRET)` → `.sign(getSecret())`
// Remplacer `jwtVerify(token, SECRET)` → `jwtVerify(token, getSecret())`
```
✅ **Correction appliquée** (voir section « Corrections appliquées »)

---

### F-02 — Injection SQL dans l'endpoint FCM
**Niveau :** 🔴 Critique  
**Fichier :** `app/api/mobile/fcm/register/route.ts` lignes 21-30

**Code vulnérable :**
```typescript
const safeToken    = (token as string).replace(/'/g, "''")
const safePlatform = ((platform as string) ?? 'android').replace(/'/g, "''")

await tenantDb.$executeRawUnsafe(`
  INSERT INTO device_tokens (user_id, token, platform, updated_at)
  VALUES ('${safeUserId}', '${safeToken}', '${safePlatform}', NOW())
  ...
`)
```

**Scénario d'exploitation :**  
La sanitisation par simple remplacement de `'` par `''` est insuffisante. Si PostgreSQL est configuré avec `standard_conforming_strings = off` (comportement hérité ou mal configuré), un backslash `\` avant `'` peut annuler l'échappement :  
- Payload `token`: `\'; DROP TABLE device_tokens; --`  
- Après replace : `\'; DROP TABLE device_tokens; --` (aucun changement — pas de `'` à remplacer)  
- Résultat SQL : `'...\'; DROP TABLE device_tokens; --'` → la cote est considérée comme terminant la chaîne, et `DROP TABLE` s'exécute.

Même sans ce vecteur, l'utilisation de `$executeRawUnsafe` avec interpolation de chaîne est une pratique explicitement dangereuse dans la documentation Prisma.

**Impact métier :** Destruction de données, lecture de données sensibles, escalade vers d'autres tables du schéma.

**Correction :**
```typescript
// Utiliser la requête paramétrée native de Prisma ($executeRaw tagged template)
await tenantDb.$executeRaw`
  INSERT INTO device_tokens (user_id, token, platform, updated_at)
  VALUES (${user.userId}, ${token as string}, ${(platform as string) ?? 'android'}, NOW())
  ON CONFLICT (user_id, token) DO UPDATE
    SET platform = EXCLUDED.platform, updated_at = NOW()
`
```
✅ **Correction appliquée** (voir section « Corrections appliquées »)

---

### F-03 — Contournement 2FA dans le middleware (HMAC non vérifié)
**Niveau :** 🔴 Critique  
**Fichier :** `proxy.ts` lignes 78-99

**Code vulnérable :**
```typescript
const is2FAValid = twoFaVerified
  ? (() => {
      try {
        const lastDot = twoFaVerified.lastIndexOf('.')
        if (lastDot === -1) return false
        const payload = twoFaVerified.slice(0, lastDot)
        const [uid, expiresAtStr] = payload.split(':')
        if (uid !== session.user.id) return false
        const expiresAt = parseInt(expiresAtStr, 10)
        if (isNaN(expiresAt) || Date.now() > expiresAt) return false
        return true  // ← HMAC non vérifié !
      } catch { return false }
    })()
  : false
```

**Scénario d'exploitation :**  
Le middleware vérifie uniquement la **structure** et la **date d'expiration** du cookie 2FA, mais **pas la signature HMAC**. Un attaquant connaissant un `userId` valide peut forger un cookie :
```
${userId}:${Date.now() + 999999}.n_importe_quelle_signature
```
Ce cookie sera accepté par le middleware, permettant d'accéder à toutes les routes protégées sans avoir complété la 2FA.

**Impact métier :** Contournement complet de la 2FA pour tous les comptes qui l'ont activée, permettant un accès non autorisé même si le mot de passe est compromis.

**Correction :**  
Utiliser `crypto.subtle` (Web Crypto API, disponible en Edge Runtime) pour vérifier le HMAC dans le middleware.
✅ **Correction appliquée** (voir section « Corrections appliquées »)

---

### F-04 — Access token et refresh token interchangeables
**Niveau :** 🟠 Élevé  
**Fichiers :** `lib/auth/mobile-jwt.ts`, `app/api/mobile/auth/refresh/route.ts`

**Description :**  
- `signMobileToken` (access, 7j) et `signMobileRefreshToken` (refresh, 30j) utilisent **la même clé** et le **même algorithme** HS256.
- L'endpoint `/api/mobile/auth/refresh` utilise `verifyMobileToken` pour valider le refresh token — la même fonction que pour les access tokens.
- Un **access token** peut être utilisé comme refresh token pour régénérer de nouveaux access tokens indéfiniment.
- Les refresh tokens ne sont **pas stockés** côté serveur, rendant toute révocation impossible.

**Scénario :** Un attaquant vole un access token de 7 jours → l'utilise en boucle au refresh endpoint → génère des tokens valides indéfiniment.

**Correction (recommandée, non appliquée) :**
1. Utiliser un claim `type: 'access'` / `type: 'refresh'` dans le payload JWT et le vérifier à chaque endpoint
2. Stocker les refresh tokens côté serveur (table `refresh_tokens`) pour permettre la révocation
3. Implémenter la rotation des refresh tokens (invalider à chaque usage)

---

### F-05 — Absence de rate limiting sur l'API mobile
**Niveau :** 🟠 Élevé  
**Fichier :** `app/api/mobile/auth/login/route.ts`

**Description :**  
L'endpoint de connexion mobile (`POST /api/mobile/auth/login`) n'implémente aucune protection contre les attaques par force brute. Contrairement au login web (`actions/auth.ts` ligne 49) qui limite à 10 tentatives par email sur 15 minutes, l'API mobile accepte un nombre illimité de requêtes.

**Scénario :** Un attaquant peut tester des milliers de mots de passe sur un compte élève ou parent sans limitation.

**Correction (recommandée, non appliquée) :**
```typescript
// Importer rateLimit et l'appliquer
const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
const allowed = await rateLimit(`mobile-login:${ip}:${email}`, 10, 15 * 60 * 1000)
if (!allowed) return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 15 min.' }, { status: 429 })
```

---

### F-06 — Google OAuth sans vérification de tenant
**Niveau :** 🟠 Élevé  
**Fichier :** `lib/auth/config.ts` lignes 144-148

**Description :**  
La configuration Google OAuth ne comprend pas de callback `signIn` pour vérifier que l'email authentifié par Google correspond à un utilisateur dans un tenant existant. Lors d'une connexion Google, le callback `jwt` stocke `user.role` et `user.schemaName`, mais pour Google OAuth, ces champs proviennent du provider et seront `undefined`.

Un compte Google associé à un email inconnu des tenants obtiendra une session valide avec `role: undefined` et `schemaName: undefined`. Cela permet potentiellement d'accéder aux pages qui ne vérifient que `requireAuth()` (sans contrôle de rôle), causant des comportements imprévisibles et potentiellement des erreurs exposant des informations système.

**Correction (recommandée, non appliquée) :**
```typescript
// Ajouter dans NextAuth({... callbacks: { async signIn({ user, account }) { ... }
async signIn({ user, account }) {
  if (account?.provider === 'google') {
    // Vérifier que l'email existe dans un tenant
    const exists = await checkUserExistsInAnyTenant(user.email!)
    if (!exists) return false // Refuse la connexion
  }
  return true
}
```

---

### F-07 — IDOR : bulletin d'un autre élève accessible par STUDENT
**Niveau :** 🟡 Moyen  
**Fichier :** `actions/bulletin.ts` fonction `fetchBulletinData` ligne 38

**Description :**  
La fonction `getBulletinData(studentId, termId)` vérifie la parenté pour le rôle PARENT, mais **ne vérifie pas** que le STUDENT connecté est bien le propriétaire du bulletin demandé. Un élève peut appeler cette fonction avec le `studentId` d'un autre élève et accéder à ses notes, classement, absences et décisions du conseil de classe.

```typescript
// Seul le PARENT est filtré :
if (session.user.role === 'PARENT') {
  // vérification parenté ...
}
// Mais STUDENT n'est pas vérifié → n'importe quel étudiant peut passer un studentId arbitraire
```

**Impact métier :** Violation de la vie privée de mineurs, accès aux notes et bulletins d'autres élèves.

**Correction (recommandée, non appliquée) :**
```typescript
if (session.user.role === 'STUDENT') {
  const check: any[] = await db.$queryRaw`
    SELECT id FROM students WHERE id = ${studentId} AND user_id = ${session.user.id} LIMIT 1
  `
  if (!check[0]) return { success: false, error: 'Accès non autorisé.' }
}
```

---

### F-08 — `updateSubscriptionStatus` sans validation d'état
**Niveau :** 🟡 Moyen  
**Fichier :** `actions/cafeteria.ts` ligne 152

**Description :**  
La fonction `updateSubscriptionStatus(subId, status)` accepte n'importe quelle valeur string pour `status` sans validation contre une liste blanche. Bien que les requêtes Prisma paramétrées protègent contre l'injection SQL, un administrateur malveillant (ou un bug côté client) peut écrire une valeur d'état arbitraire en base de données.

**Correction :**
```typescript
const VALID_STATUSES = ['ACTIVE', 'SUSPENDED', 'CANCELLED'] as const
if (!VALID_STATUSES.includes(status as any)) {
  return { success: false, error: 'Statut invalide.' }
}
```
✅ **Correction appliquée** (voir section « Corrections appliquées »)

---

### F-09 — Clés de paiement de production dans `.env.local`
**Niveau :** 🟡 Moyen  
**Fichier :** `.env.local`

**Description :**  
Le fichier `.env.local` (correctement listé dans `.gitignore` — non commis) contient des clés GeniusPay de **production** :
- `GENIUSPAY_API_KEY="pk_live_••••••••••••••••••••••••••••••••••••"`
- `GENIUSPAY_API_SECRET="sk_live_••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"`
- `GENIUSPAY_WEBHOOK_SECRET="whsec_••••••••••••••••••••••••••••••••••••••••••"`

*(Les valeurs réelles sont rédactées dans ce rapport. Elles ont été détectées localement lors de l'audit mais ne sont pas exposées dans ce fichier.)*

**Risque :** Exposition accidentelle via un commit `git add .`, copie de l'environnement, ou accès physique à la machine. Les clés `sk_live_*` permettent d'initier des transferts d'argent réels.

**Correction :**
- Utiliser des clés sandbox pour le développement local
- Utiliser un gestionnaire de secrets (Vault, AWS Secrets Manager) en production
- Révoquer et régénérer les clés si elles ont été exposées

---

### F-10 — `AUTH_SECRET` placeholder et secrets de repli codés en dur
**Niveau :** 🟡 Moyen  
**Fichiers :** `.env.local`, `lib/auth/two-fa-cookie.ts` ligne 16

**Description :**  
1. **`.env.local`** : `AUTH_SECRET="changez-moi-en-production-avec-openssl-rand-base64-32"` — un secret placeholder. Si ce fichier sert de base pour la production, tous les JWT web seront signés avec ce secret prévisible.
2. **`two-fa-cookie.ts` ligne 16** : `const secret = process.env.AUTH_SECRET ?? 'fallback-secret'` — le cookie de vérification 2FA utilise un secret codé en dur si `AUTH_SECRET` n'est pas défini.

**Correction :**
- Générer un vrai secret : `openssl rand -base64 32`
- Supprimer le fallback `'fallback-secret'` et lever une erreur si `AUTH_SECRET` est absent

---

### F-11 — Rate limiting par email (non par IP)
**Niveau :** 🟢 Faible  
**Fichier :** `actions/auth.ts` ligne 49

**Description :**  
Le rate limiting web est appliqué par email (`login:${email}`), pas par adresse IP. Un attaquant peut cibler plusieurs comptes simultanément (credential stuffing). De plus, le fallback in-process (`Map`) ne fonctionne pas dans une architecture multi-processus/multi-instance.

**Correction :** Combiner la clé IP + email : `login:${ip}:${email}`, avec `x-forwarded-for` ou le header approprié derrière un proxy.

---

### F-12 — `$executeRawUnsafe` pour les noms de schéma tenant
**Niveau :** 🟢 Faible  
**Fichier :** `lib/db/tenant.ts` lignes 58, 69, et `actions/super-admin.ts` ligne 673

**Description :**  
`createTenantSchema` et `dropTenantSchema` utilisent `$executeRawUnsafe` avec le `schemaName` entre guillemets doubles. Actuellement, `schemaName` est généré par `nanoid(8).toLowerCase()` (ex: `school_abc12345`), donc safe. Mais si la logique change, ce pattern est une bombe à retardement. Un `schemaName` contenant `"` suivi de SQL pourrait s'exécuter.

**Correction :** Valider le format du schéma avec une regex `^school_[a-z0-9]+$` avant tout usage dans `$executeRawUnsafe`.

---

## Plan de sécurisation — 7 jours

### Jours 1-2 (Critique — bloquant)
- [x] F-01 : Supprimer le secret JWT mobile codé en dur → lever une erreur
- [x] F-02 : Corriger l'injection SQL dans le registre FCM → `$executeRaw` paramétré
- [x] F-03 : Ajouter la vérification HMAC du cookie 2FA dans le middleware
- [x] F-08 : Valider la liste blanche des statuts cantine

### Jours 3-4 (Élevé)
- [ ] F-04 : Ajouter le claim `type` aux JWT mobiles et le valider
- [ ] F-05 : Implémenter le rate limiting sur `/api/mobile/auth/login`
- [ ] F-06 : Ajouter un callback `signIn` Google pour vérifier l'existence du tenant

### Jours 5-6 (Moyen)
- [ ] F-07 : Ajouter la vérification propriétaire pour STUDENT dans `getBulletinData`
- [ ] F-09 : Révoquer les clés GeniusPay exposées et utiliser les clés sandbox en dev
- [ ] F-10 : Générer un vrai `AUTH_SECRET`, supprimer le fallback `two-fa-cookie.ts`
- [ ] F-12 : Valider le format du `schemaName` avant `$executeRawUnsafe`

### Jour 7 (Faible + durcissement)
- [ ] F-11 : Rate limiting IP + email sur le login web
- [ ] Ajouter les headers de sécurité HTTP (`Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`) dans `next.config.ts`
- [ ] Mettre en place la rotation des refresh tokens mobiles (table `refresh_tokens`)

---

## Corrections appliquées

### Fichiers modifiés
1. **`classelink/lib/auth/mobile-jwt.ts`** — Secret JWT : suppression du fallback `'classlink-mobile-secret'`, levée d'erreur si aucun secret n'est défini
2. **`classelink/proxy.ts`** — 2FA middleware : ajout de la vérification HMAC via Web Crypto (compatible Edge Runtime)
3. **`classelink/app/api/mobile/fcm/register/route.ts`** — Injection SQL : remplacement de `$executeRawUnsafe` + interpolation par `$executeRaw` paramétré
4. **`classelink/actions/cafeteria.ts`** — Validation de l'état de souscription cantine : liste blanche `ACTIVE`, `SUSPENDED`, `CANCELLED`

### Corrections différées (justification)
- **F-04 (tokens interchangeables)** : Nécessite une refonte de l'architecture JWT mobile (nouveau claim `type`, table de refresh tokens, rotation). Impact important sur l'application mobile — à planifier avec l'équipe.
- **F-05 (rate limiting mobile)** : Requiert de tester l'impact sur l'application mobile existante et de définir les seuils appropriés.
- **F-06 (Google OAuth + tenant)** : Nécessite de comprendre les cas d'usage prévus pour Google OAuth (utilisé en production ?) et de concevoir la logique d'association tenant.
- **F-07 (IDOR bulletins STUDENT)** : Nécessite une décision métier sur le modèle d'accès attendu pour les enseignants (ils n'ont pas de vérification non plus).
- **F-09 (clés production)** : Action manuelle (révocation + régénération des clés GeniusPay).
- **F-10 (AUTH_SECRET)** : Action opérationnelle (génération d'un vrai secret en production).
- **F-11, F-12** : Faible priorité, corrections futures.

### Vérification TypeScript et ESLint
*(voir section suivante — résultats après corrections)*

### Pull Request
*(lien ajouté après push)*
