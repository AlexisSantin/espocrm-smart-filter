# Smart Filter

Extension EspoCRM qui améliore la barre de recherche et de filtrage des vues liste.

## Fonctionnalités

Les captures d'écran ont été réalisées sur EspoCRM 10.0.3 avec la langue anglaise (en_US).

- **Icône de filtre** : le bouton « ⋮ » (trois points verticaux) situé à droite de la recherche, qui ouvre la liste « Ajouter un champ », affiche désormais une icône de filtre (`fa-filter`).

  ![Icône de filtre dans la barre de recherche](docs/screenshots/01-icone-filtre.png)

- **Compteur de filtres actifs** : le badge sur le bouton filtre indique le nombre de conditions de filtre actives. Chaque ligne de filtre renseignée, chaque filtre booléen coché et la recherche texte comptent pour 1. Le badge est masqué quand aucun filtre n'est actif. Survoler le bouton affiche la même explication.

  ![Badge de compteur (2 filtres actifs) à côté du bouton Save Filter et de Réinitialiser](docs/screenshots/02-compteur.png)

- **Menu ouvert pendant la sélection** : le menu « Ajouter un champ » reste ouvert après l'ajout d'un champ, ce qui permet d'en ajouter plusieurs à la suite. La touche Entrée ajoute le premier champ correspondant et conserve le texte saisi.

  ![Le menu reste ouvert après l'ajout de « Account Name » et « Email »](docs/screenshots/03-menu-ouvert.png)

- **Recherche de champs** : la zone de recherche du menu filtre les champs en ignorant la casse et les accents (« mail » trouve « Adresse e-mail »). Les champs déjà ajoutés sont exclus et un message « No Data » apparaît s'il n'y a aucun résultat.

  ![Recherche « mail » dans le menu filtre](docs/screenshots/04-recherche-champs.png)

- **Champs fréquents en premier** : les champs que vous utilisez le plus apparaissent en tête du menu. Ces statistiques sont stockées dans le navigateur (localStorage), par entité et par utilisateur.

  ![Les champs les plus utilisés (Phone, Status) apparaissent en tête du menu](docs/screenshots/05-champs-frequents.png)

- **Application automatique** : chaque modification d'un filtre (valeur, opérateur, ajout ou suppression d'une ligne, case à cocher) relance la recherche immédiatement. Il n'y a plus de bouton « Apply » à valider.

  ![Les filtres sont appliqués dès leur modification, sans bouton Apply](docs/screenshots/06-application-automatique.png)

- **Filtres vides ignorés** : une ligne de filtre sans valeur n'est pas enregistrée. Les préréglages et l'état de recherche enregistrés précédemment qui contiennent une telle ligne n'en recréent plus à l'ouverture, à la sélection d'un préréglage ou à l'ajout d'un nouveau filtre (par exemple, « Account Name » apparaissant sans raison).

  ![Liste de filtres ne contenant que des conditions renseignées](docs/screenshots/07-filtres-vides-ignores.png)

- **Bouton « Réinitialiser »** : libellé visible, affiché uniquement s'il y a quelque chose à réinitialiser (filtre, case cochée, tri modifié ou préréglage sélectionné). Il est masqué sinon. Il efface aussi les cases à cocher et ramène au filtre par défaut (« All »).

  ![Réinitialiser à droite, Save Filter à gauche (Réinitialiser masqué sans filtre, voir la capture 01)](docs/screenshots/08-reset-et-save.png)

- **Bouton « Save Filter »** : affiché à gauche de « Réinitialiser » dès qu'une condition est renseignée, y compris quand un préréglage est sélectionné, pour enregistrer le filtre courant sous un nouveau nom.

  ![Boîte de dialogue d'enregistrement d'un filtre](docs/screenshots/09-save-filter.png)

- **Résumé des préréglages** : lorsqu'un préréglage enregistré est sélectionné, ses conditions sont affichées sous forme lisible, avec leurs valeurs (par exemple « Created By: Is Admin », « Status: Any Of New », « Teams: Is Not Empty »). Les lignes vides sont masquées.

  ![Résumé des conditions du préréglage « Beta filter »](docs/screenshots/10-resume-preset.png)

- **Préréglages modifiables** : un préréglage sélectionné reste modifiable (ajout, suppression ou changement de valeur). Dès que le filtre ne correspond plus au préréglage, celui-ci est désélectionné et un avis « Modifié par rapport au filtre enregistré « X » » s'affiche au-dessus des filtres. Revenir à l'état d'origine (ou resélectionner le préréglage) restaure la sélection.

  ![Avis « Modifié par rapport au filtre enregistré « Beta filter » »](docs/screenshots/11-preset-modifiable.png)

## Fonctionnement technique

- Le module `SmartFilter` enregistre des handlers via `clientDefs/Global.json` → `viewSetupHandlers` → `record/search` :
  - `smart-filter:handlers/record/search-filter-icon` remplace la classe `fa-ellipsis-v` par `fa-filter`.
  - `smart-filter:handlers/record/search-filter-menu` gère le menu « Ajouter un champ » (ouverture, recherche, ordre, touche Entrée).
  - `smart-filter:handlers/record/search-filter-toolbar` gère le compteur, le bouton Réinitialiser, le bouton Save Filter et le résumé des préréglages.
  - `smart-filter:handlers/record/search-filter-state` applique les filtres dès qu'ils changent, retire les entrées vides de l'état de recherche (sauf les lignes encore affichées, pour qu'elles restent lisibles) et suit le préréglage d'origine pour détecter une modification.
- Les styles sont dans `css/smart-filter.css`, déclaré via `metadata/app/client.json` → `cssList`. La règle qui masque les champs filtrés (`li.search-hidden`) y est ajoutée, car certains thèmes (dont ModernTheme) ne la fournissent pas.
- Les libellés du compteur et de son infobulle sont dans `i18n/<langue>/SmartFilter.json` (catégorie `labels`).
- Aucun fichier du cœur d'EspoCRM n'est modifié : les vues sont étendues à l'exécution, ce qui reste compatible avec les mises à jour.

## Compatibilité

- EspoCRM `>= 10.0.3 < 10.1.0` (testé sur 10.0.3). L'extension s'appuie sur le fonctionnement interne des vues de liste de cette version : la plage est volontairement limitée. Vérifier la compatibilité avant de l'utiliser sur une autre version.
- PHP `>= 8.3`

## Installation

1. Générer le package : `npm run extension` (produit `build/smart-filter-1.0.0.zip`).
2. Installer le ZIP depuis Administration → Extensions dans EspoCRM.

## Développement

- Sources dans `src/files/`.
- `npm run sync` copie les fichiers dans l'instance `site`.
- `npm run clear-cache` vide le cache après un changement de métadonnées.

## Licence

GPL-3.0-or-later. Voir [LICENSE](src/LICENSE).
