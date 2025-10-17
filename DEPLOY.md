# Déploiement

## Préparer la base de données Postgres (Neon)

1. Créez un projet Neon et générez une chaîne de connexion Postgres (format `postgresql://...`).
2. Activez le `sslmode=require` (Neon l'ajoute par défaut) pour les déploiements Vercel.
3. Ajoutez dans les variables d'environnement (localement `.env.production` ou sur Vercel) :

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
   ```

4. Dans `prisma/schema.prisma`, remplacez la ligne `provider = "sqlite"` par `provider = "postgresql"`.
5. Exécutez les migrations sur la base distante :

   ```bash
   npm install
   npm run prisma:deploy
   ```

## Configuration Vercel

- **Build Command** : `npm run prisma:deploy && npm run build`
- **Environment Variables** :
  - `DATABASE_URL` (chaîne de connexion Postgres Neon)
  - `ADMIN_USER` / `ADMIN_PASSWORD` (identifiants du basic-auth `/admin`)
  - `KITCHEN_AGENT_TOKEN`
  - `NEXT_PUBLIC_BASE_URL`

Pensez à dupliquer ces variables dans les environnements Preview et Production.

## Vérifications après déploiement

1. Déployez sur Vercel (`vercel --prod` ou via l'interface).
2. Lancez depuis votre machine :

   ```bash
   PORT=3003
   for path in / /table/1 /kitchen /admin/menu /api/orders /api/menu; do
     echo "=> GET https://<votre-domaine>$path"
     curl -I "https://<votre-domaine>$path" || true
     echo ""
   done
   ```

3. Vérifiez que `/admin/*` demande désormais un login/mot de passe.

## Notes pour le développement local

- Laissez `DATABASE_URL="file:./dev.db"` et `provider = "sqlite"` dans `prisma/schema.prisma`.
- Les migrations continuent de fonctionner en local avec SQLite.
- Pour tester Postgres en local, adaptez temporairement `provider = "postgresql"` et pointez `DATABASE_URL` vers votre base Postgres, puis relancez `npm run prisma:deploy`.
