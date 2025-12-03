But du site
-----------
Ce site permet de suivre les résultats de mon équipe ("Centrale Mediterranée") et son championnat. L'interface affiche : la page d'accueil (prochain match, dernier résultat et mini-classements buteurs/passeurs/bouchers), une page de résultats listant tous les matchs (joués et à venir), et une page de classement calculée à partir des matchs joués.

Pages et fichiers principaux
----------------------------
- Page d'accueil — index.html : charge main.js et affiche le prochain match, le dernier résultat et les mini-classements (fonction `initHomePage`, `renderMiniLeaderboards`).
- Page Résultats — resultats.html : charge main.js, affiche la table des matchs et propose un filtrage par équipe (fonctions `initResultsPage`, `renderMatchesTable`, `setupTeamFilter`).
- Page Classement — classement.html : charge classement.js et calcule le classement à partir des matchs joués (fonctions `initStandingsPage`, `renderStandings`).
- Styles — style.css.

Comment l'application appelle l'API
----------------------------------
Les appels réseau pointent vers une API externe configurée via la constante `API_BASE_URL` (utilisée aussi dans `assets/classement.js`). Le front-end récupère la liste complète des matchs et en dérive l'affichage et les calculs côté client.

Endpoints utilisés
------------------
- GET `${API_BASE_URL}/api/matches` — retourne la liste complète des matchs (utilisé partout : main.js, `assets/classement.js`).

Format attendu des objets "match"
--------------------------------
Le front-end s'attend aux champs suivants (extraits utilisés dans le code) :
- match_date (ISO ou chaîne date) — utilisé par `formatMatchDate` (`assets/main.js`)
- status — "played" / "scheduled" / ...
- home_team, away_team — noms des équipes
- home_score, away_score — scores (peuvent être null)
- champs optionnels pour buteurs/passeurs/cartons : scorers_home, scorers_away, assists_home, assists_away, cards_home, cards_away — peuvent être des tableaux JSON ou des chaînes JSON (le code utilise `parseJSONField` pour gérer les deux cas)
- nom/stade : le rendu supporte plusieurs clés possibles (stade, stadium, venue, location, lieu, arena, ground) — logique dans `renderMatchesTable`.

Règles de calculs spécifiques
----------------------------
- Classement : victoire = 4 pts, nul = 2 pts, défaite = 1 pt (implémenté dans `assets/classement.js`).
- Forme récente : les 5 derniers résultats sont affichés (W/D/L).
