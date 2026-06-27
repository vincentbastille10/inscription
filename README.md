# Landing inscriptions danse

Landing autonome pour la pré-inscription au Centre de Danse Delphine Letort.

## Fichiers

- `index.html` : structure de la page.
- `style.css` : design blanc / rose.
- `app.js` : bot scripté, choix d’âge, cours compatibles, total, places restantes.
- `google_apps_script_inscriptions_danse.gs` : script Google Sheet.

## Installation GitHub Pages

1. Pousser ces fichiers à la racine du dépôt.
2. Aller dans `Settings > Pages`.
3. Source : `Deploy from a branch`.
4. Branch : `main`, dossier `/root`.

## Google Sheet

1. Créer une Google Sheet.
2. `Extensions > Apps Script`.
3. Coller `google_apps_script_inscriptions_danse.gs`.
4. Lancer `setupDanceInscriptionSheet`.
5. Déployer en application web.
6. Coller l’URL dans `app.js`, constante `GOOGLE_APPS_SCRIPT_URL`.

## Mention importante

Le formulaire contient :

> Cette pré-inscription ne garantit pas votre adhésion à l'école de danse.
