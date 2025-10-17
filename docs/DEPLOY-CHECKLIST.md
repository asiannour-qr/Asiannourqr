# Checklist de déploiement

## Préparation locale
1. `npm ci`
2. `npm run preflight` &nbsp;_(équivaut à `tsc --noEmit`, `prisma validate`, `next build`)_
3. `npm start` &nbsp;(`PORT` par défaut : 3000)
4. Vérifier manuellement les routes :
   - `/table/1`
   - `/kitchen`
   - `/admin/login` puis `/admin/menu`
   - `/api/health`

## Variables d’environnement (Vercel)
- `DATABASE_URL` (URL de la base managée en production)
- `ADMIN_USER`
- `ADMIN_PASSWORD`

## Build sur Vercel
- Install : `npm ci`
- Build : `npm run build`
- Start : géré automatiquement par Vercel

## Post-déploiement
- Tester les URLs :
  - Table : `/table/[id]` (ex. `/table/1`)
  - Cuisine : `/kitchen`
  - Admin login : `/admin/login`
  - Admin menu (carte) : `/admin/menu`
  - Admin menus groupés : `/admin/menus`
  - Admin QRs : `/admin/qrs` et `/admin/qrs/badges`
  - Health : `/api/health`
- Vérifier que l’admin permet d’ajouter/modifier/supprimer des plats sans redéploiement.

## Sauvegardes
- Activer (ou vérifier) les backups automatiques de la base de données managée.

## Notes
- Ne pas modifier le schéma Prisma tant qu’aucune procédure spécifique n’est planifiée.
- Pour une migration vers PostgreSQL, prévoir un plan dédié (dump/import + migrations Prisma).
