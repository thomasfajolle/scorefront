// À adapter avec VOTRE URL Render
const API_BASE_URL = "https://apiscore-vnay.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  initStandingsPage();
});

function showError(message) {
  const errorDiv = document.getElementById("error-message");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.add("error");
  } else {
    alert(message);
  }
}

async function initStandingsPage() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches`);
    if (!response.ok) throw new Error(`Erreur API (${response.status})`);
    const matches = await response.json();
    renderStandings(matches);
  } catch (err) {
    console.error(err);
    showError("Impossible de charger les données des matchs.");
  }
}

function renderStandings(matches) {
  const tbody = document.getElementById("standings-body");
  tbody.innerHTML = "";

  if (!matches || matches.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 8;
    td.textContent = "Aucun match trouvé dans la base.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  // Garder uniquement les matchs joués avec score renseigné
  const played = matches.filter(m => m.status === "played" && m.home_score != null && m.away_score != null);

  // Trier par date croissante pour construire la forme récent correctement
  played.sort((a,b) => new Date(a.match_date) - new Date(b.match_date));

  const teams = new Map();

  function ensureTeam(name) {
    if (!teams.has(name)) {
      teams.set(name, {
        name,
        played: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        recent: [] // sequence of 'W','D','L' in chronological order
      });
    }
    return teams.get(name);
  }

  // Points rules: win 4, draw 2, loss 1
  played.forEach(m => {
    const home = ensureTeam(m.home_team);
    const away = ensureTeam(m.away_team);

    const hScore = Number(m.home_score);
    const aScore = Number(m.away_score);

    home.played += 1;
    away.played += 1;

    home.goalsFor += hScore;
    home.goalsAgainst += aScore;

    away.goalsFor += aScore;
    away.goalsAgainst += hScore;

    if (hScore > aScore) {
      home.points += 4;
      away.points += 1;
      home.recent.push('W');
      away.recent.push('L');
    } else if (hScore < aScore) {
      away.points += 4;
      home.points += 1;
      away.recent.push('W');
      home.recent.push('L');
    } else {
      home.points += 2;
      away.points += 2;
      home.recent.push('D');
      away.recent.push('D');
    }
  });

  // Convert map to array and compute diff
  const table = Array.from(teams.values()).map(t => ({
    ...t,
    diff: t.goalsFor - t.goalsAgainst
  }));

  // Trier : points desc, diff desc, goalsFor desc, name asc
  table.sort((a,b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.diff !== a.diff) return b.diff - a.diff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.name.localeCompare(b.name);
  });

  // Rendu
  table.forEach((team, idx) => {
    const tr = document.createElement('tr');

    const rankTd = document.createElement('td');
    rankTd.textContent = (idx + 1).toString();

    const nameTd = document.createElement('td');
    nameTd.textContent = team.name;

    const playedTd = document.createElement('td');
    playedTd.textContent = team.played;

    const pointsTd = document.createElement('td');
    pointsTd.textContent = team.points;

    const gfTd = document.createElement('td');
    gfTd.textContent = team.goalsFor;

    const gaTd = document.createElement('td');
    gaTd.textContent = team.goalsAgainst;

    const diffTd = document.createElement('td');
    diffTd.textContent = team.diff;

    const formTd = document.createElement('td');
    const recent = team.recent.slice(-5); // keep last 5
    const formDiv = document.createElement('div');
    formDiv.className = 'form-recent';
    // show from most recent left-to-right (recent last -> show left-to-right oldest->newest)
    recent.forEach(r => {
      const span = document.createElement('span');
      span.className = 'form-chip ' + (r === 'W' ? 'form-w' : (r === 'D' ? 'form-d' : 'form-l'));
      span.textContent = r;
      formDiv.appendChild(span);
    });
    formTd.appendChild(formDiv);

    tr.appendChild(rankTd);
    tr.appendChild(nameTd);
    tr.appendChild(playedTd);
    tr.appendChild(pointsTd);
    tr.appendChild(gfTd);
    tr.appendChild(gaTd);
    tr.appendChild(diffTd);
    tr.appendChild(formTd);

    tbody.appendChild(tr);
  });
}
