// À adapter avec VOTRE URL Render

const API_BASE_URL = "https://apiscore-vnay.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

  const page = document.body.dataset.page;

  if (page === "home") {

    initHomePage();

  } else if (page === "results") {

    initResultsPage();

  }

});

// Affiche une erreur dans un élément <div id="error-message">

function showError(message) {

  const errorDiv = document.getElementById("error-message");

  if (errorDiv) {

    errorDiv.textContent = message;

    errorDiv.classList.add("error");

  } else {

    alert(message);

  }

}

// Utilitaire : parse JSON safely (accepte déjà-objet ou string)
function parseJSONField(field) {
  if (!field) return [];
  if (typeof field === 'object') return field;
  try {
    return JSON.parse(field);
  } catch (e) {
    console.warn('JSON parse error', e);
    return [];
  }
}

// Rend trois mini-classements : buteurs, passeurs, cartons
// Filtre les matchs pour `team` (ex: 'Centrale Marseille') et affiche tous les joueurs
function renderMiniLeaderboards(matches, team) {
  try {
    if (!matches || matches.length === 0) return;

    // filtrer les matchs pour l'équipe demandée
    const teamMatches = matches.filter(m => m.home_team === team || m.away_team === team);

    const goals = new Map();
    const assists = new Map();
    const cards = new Map(); // player -> { yellow: n, red: n }

    teamMatches.forEach(m => {
      // scorers
      const sh = parseJSONField(m.scorers_home);
      const sa = parseJSONField(m.scorers_away);
      sh.forEach(s => {
        if (!s || !s.player) return;
        const name = s.player;
        goals.set(name, (goals.get(name) || 0) + 1);
      });
      sa.forEach(s => {
        if (!s || !s.player) return;
        const name = s.player;
        goals.set(name, (goals.get(name) || 0) + 1);
      });

      // assists
      const ah = parseJSONField(m.assists_home);
      const aa = parseJSONField(m.assists_away);
      ah.forEach(a => {
        if (!a || !a.player) return;
        const name = a.player;
        assists.set(name, (assists.get(name) || 0) + 1);
      });
      aa.forEach(a => {
        if (!a || !a.player) return;
        const name = a.player;
        assists.set(name, (assists.get(name) || 0) + 1);
      });

      // cards
      const ch = parseJSONField(m.cards_home);
      const ca = parseJSONField(m.cards_away);
      const processCard = (c) => {
        if (!c || !c.player) return;
        const name = c.player;
        const cur = cards.get(name) || { yellow: 0, red: 0 };
        if (c.type === 'red') cur.red += 1;
        else cur.yellow += 1;
        cards.set(name, cur);
      };
      ch.forEach(processCard);
      ca.forEach(processCard);
    });

    // Helper to render list (all players)
    function renderListFromMap(map, containerId, label) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';
      const arr = Array.from(map.entries()).map(([player, count]) => ({ player, count }));
      if (arr.length === 0) {
        const li = document.createElement('li');
        li.textContent = '—';
        container.appendChild(li);
        return;
      }
      arr.sort((a, b) => b.count - a.count || a.player.localeCompare(b.player));
      arr.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.player} — ${item.count} ${label}`;
        container.appendChild(li);
      });
    }

    // Render goals and assists
    renderListFromMap(goals, 'top-scorers', 'buts');
    renderListFromMap(assists, 'top-assists', 'passes');

    // Render cards (show yellow/red/total)
    const cardsContainer = document.getElementById('top-cards');
    if (cardsContainer) {
      cardsContainer.innerHTML = '';
      const arr = Array.from(cards.entries()).map(([player, obj]) => ({
        player,
        yellow: obj.yellow || 0,
        red: obj.red || 0,
        total: (obj.yellow || 0) + (obj.red || 0)
      }));
      if (arr.length === 0) {
        const li = document.createElement('li');
        li.textContent = '—';
        cardsContainer.appendChild(li);
      } else {
        arr.sort((a, b) => b.total - a.total || b.red - a.red || a.player.localeCompare(b.player));
        arr.forEach(it => {
          const li = document.createElement('li');
          li.textContent = `${it.player} — ${it.yellow} jaunes, ${it.red} rouges (${it.total})`;
          cardsContainer.appendChild(li);
        });
      }
    }
  } catch (e) {
    console.error('Erreur rendering leaderboards', e);
  }
}
async function initHomePage() {

  try {

    const response = await fetch(`${API_BASE_URL}/api/matches`);

    if (!response.ok) {

      throw new Error(`Erreur API (${response.status})`);

    }

    const matches = await response.json();

    const now = new Date();

    // Séparation des matchs joués et à venir

    const played = matches.filter((m) =>

      m.status === "played" && new Date(m.match_date) <= now

    );

    const scheduled = matches.filter((m) =>

      m.status === "scheduled" && new Date(m.match_date) >= now

    );

    // Dernier match joué = le plus récent dans le passé

    let lastMatch = null;

    if (played.length > 0) {

      played.sort(

        (a, b) => new Date(a.match_date) - new Date(b.match_date)

      );

      lastMatch = played[played.length - 1];

    }

    // Prochain match = le plus proche dans le futur

    let nextMatch = null;

    if (scheduled.length > 0) {

      scheduled.sort(

        (a, b) => new Date(a.match_date) - new Date(b.match_date)

      );

      nextMatch = scheduled[0];

    }

    updateHomePage(nextMatch, lastMatch);
    // render small leaderboards on homepage (filter for Centrale Marseille)
    if (typeof renderMiniLeaderboards === 'function') {
      renderMiniLeaderboards(matches, 'Centrale Marseille');
    }

  } catch (error) {

    console.error(error);

    showError("Impossible de charger les données (API ou réseau indisponible).");

  }

}

function formatMatchDate(dateString) {

  const date = new Date(dateString);

  // Affichage simple : JJ/MM/AAAA HH:MM

  const day = String(date.getDate()).padStart(2, "0");

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");

  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}h${minutes}`;

}

function updateHomePage(nextMatch, lastMatch) {

  const nextDiv = document.getElementById("next-match");

  const lastDiv = document.getElementById("last-match");

  // Prochain match

  if (nextMatch) {

    nextDiv.innerHTML = `

      <p><strong>${nextMatch.home_team}</strong> vs <strong>${nextMatch.away_team}</strong></p>

      <p>Date : ${formatMatchDate(nextMatch.match_date)}</p>
      <p>Statut : <span class="status-${nextMatch.status}">${nextMatch.status}</span></p>
    `;

  } else {
    nextDiv.innerHTML = "<p>Aucun match à venir trouvé.</p>";
  }

  // Dernier match

  if (lastMatch) {

    let score = "Score non renseigné";
    if (lastMatch.home_score != null && lastMatch.away_score != null) {
      score = `${lastMatch.home_score} - ${lastMatch.away_score}`;
    }

    lastDiv.innerHTML = `
      <p><strong>${lastMatch.home_team}</strong> vs <strong>${lastMatch.away_team}</strong></p>

      <p>Date : ${formatMatchDate(lastMatch.match_date)}</p>
      <p>Score : ${score}</p>
      <p>Statut : <span class="status-${lastMatch.status}">${lastMatch.status}</span></p>
    `;

  } else {
    lastDiv.innerHTML = "<p>Aucun match joué trouvé.</p>";
  }
}
async function initResultsPage() {

  try {
    const response = await fetch(`${API_BASE_URL}/api/matches`);

    if (!response.ok) {
      throw new Error(`Erreur API (${response.status})`);
    }

    const matches = await response.json();
    // render all initially
    renderMatchesTable(matches);
    // setup team filter UI (live filter)
    setupTeamFilter(matches);

  } catch (error) {

    console.error(error);
    showError("Impossible de charger la liste des matchs.");
  }
}

function renderMatchesTable(matches) {

  const tbody = document.getElementById("matches-body");
  tbody.innerHTML = ""; // on vide d'abord

  if (!matches || matches.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "Aucun match trouvé dans la base.";
    tr.appendChild(td);
    tbody.appendChild(tr);

    return;
  }

  // Option : trier par date croissante
  matches.sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

  matches.forEach((match) => {
    const tr = document.createElement("tr");

    const dateTd = document.createElement("td");
    dateTd.textContent = formatMatchDate(match.match_date);

    const homeTd = document.createElement("td");
    homeTd.textContent = match.home_team;

    const awayTd = document.createElement("td");
    awayTd.textContent = match.away_team;

    const scoreTd = document.createElement("td");

    if (match.home_score != null && match.away_score != null) {
      scoreTd.textContent = `${match.home_score} - ${match.away_score}`;
      
      // Color team names based on result
      if (match.home_score > match.away_score) {
        homeTd.style.color = '#10b981'; // green for winner
        homeTd.style.fontWeight = '700';
        awayTd.style.color = '#ef4444'; // red for loser
      } else if (match.home_score < match.away_score) {
        awayTd.style.color = '#10b981'; // green for winner
        awayTd.style.fontWeight = '700';
        homeTd.style.color = '#ef4444'; // red for loser
      }
    } else {
      scoreTd.textContent = "—";
    }

    const statusTd = document.createElement("td");

    statusTd.textContent = match.status;
    statusTd.classList.add(`status-${match.status}`);
    tr.appendChild(dateTd);
    tr.appendChild(homeTd);
    tr.appendChild(awayTd);
    tr.appendChild(scoreTd);
    tr.appendChild(statusTd);
    tbody.appendChild(tr);

  });

}

// Filtre les matchs par nom d'équipe (recherche insensible à la casse)
function filterMatchesByTeam(matches, query) {
  if (!query || query.trim() === '') return matches;
  const q = query.trim().toLowerCase();
  return matches.filter(m => {
    const home = (m.home_team || '').toString().toLowerCase();
    const away = (m.away_team || '').toString().toLowerCase();
    return home.includes(q) || away.includes(q);
  });
}

// Initialise les listeners pour la barre de recherche sur la page résultats
function setupTeamFilter(matches) {
  const input = document.getElementById('team-search');
  const clearBtn = document.getElementById('team-clear');
  if (!input) return;

  let timeout = null;
  const doFilter = () => {
    const q = input.value || '';
    const filtered = filterMatchesByTeam(matches, q);
    renderMatchesTable(filtered);
  };

  input.addEventListener('input', () => {
    // debounce 200ms
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(doFilter, 200);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      renderMatchesTable(matches);
      input.focus();
    });
  }
}

