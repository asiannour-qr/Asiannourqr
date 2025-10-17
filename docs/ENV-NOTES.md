# Notes sur les environnements

## Développement local
- Conserver la base SQLite fournie par défaut&nbsp;: `DATABASE_URL="file:./dev.db"`.
- Les identifiants admin peuvent être définis dans `.env` pour tester l'accès aux pages `/admin/*`.
- Pas de migration de schéma tant que l’état est stable.

## Production
- Utiliser une base de données managée (ex. PostgreSQL) et définir `DATABASE_URL` dans les variables d’environnement de la plateforme (Vercel, etc.).
- Renseigner `ADMIN_USER` et `ADMIN_PASSWORD` dans l’interface d’admin de la plateforme (ne jamais commiter de secrets).
- La migration vers PostgreSQL implique une phase de planification et de migration des données (hors du périmètre de ce setup).

## Rappels
- Les variables d’environnement doivent être définies avant le déploiement et avant l’exécution des scripts Prisma.
- Ne pas modifier le schéma Prisma sans procédure validée et migrations appropriées.
