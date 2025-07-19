// Configuration - Replace this with your Apps Script API URL
const API_URL = "https://script.google.com/macros/s/AKfycbx9P4v0rcmcNgdaInqtGSB-Mo0ldfWWDTpdR-x26ec7ept-YXivAaA7yuZkh6To6Do4/exec";

// DOM Elements
const matchTableBody = document.getElementById('matchData');
const groupAccordion = document.getElementById('groupAccordion');

// Format date to dd-mm-yy
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
}

// Render match data
function renderMatches(matches) {
    matchTableBody.innerHTML = '';
    
    matches.forEach(match => {
        const row = document.createElement('tr');
        row.className = 'match-row';
        
        row.innerHTML = `
            <td>${formatDate(match.Tanggal)}</td>
            <td>${match.Waktu || '-'}</td>
            <td>
                <span class="badge group-badge bg-primary">Group ${match.Group}</span>
            </td>
            <td class="team-name text-end">${match['Team 1'] || '-'}</td>
            <td class="score text-center">
                ${match['Skor 1'] || '-'} : ${match['Skor 2'] || '-'}
            </td>
            <td class="team-name">${match['Team 2'] || '-'}</td>
        `;
        
        matchTableBody.appendChild(row);
    });
}

// Render group standings
function renderStandings(standings) {
    groupAccordion.innerHTML = '';
    
    Object.keys(standings).forEach((group, index) => {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';
        
        const accordionHeader = document.createElement('h2');
        accordionHeader.className = 'accordion-header';
        accordionHeader.id = `heading${group}`;
        
        const accordionButton = document.createElement('button');
        accordionButton.className = `accordion-button ${index === 0 ? '' : 'collapsed'}`;
        accordionButton.type = 'button';
        accordionButton.setAttribute('data-bs-toggle', 'collapse');
        accordionButton.setAttribute('data-bs-target', `#collapse${group}`);
        accordionButton.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
        accordionButton.setAttribute('aria-controls', `collapse${group}`);
        accordionButton.textContent = `Group ${group}`;
        
        accordionHeader.appendChild(accordionButton);
        
        const accordionCollapse = document.createElement('div');
        accordionCollapse.className = `accordion-collapse collapse ${index === 0 ? 'show' : ''}`;
        accordionCollapse.id = `collapse${group}`;
        accordionCollapse.setAttribute('aria-labelledby', `heading${group}`);
        accordionCollapse.setAttribute('data-bs-parent', '#groupAccordion');
        
        const accordionBody = document.createElement('div');
        accordionBody.className = 'accordion-body p-0';
        
        const table = document.createElement('table');
        table.className = 'table standings-table';
        
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>GD</th>
                    <th>Pts</th>
                </tr>
            </thead>
            <tbody>
                ${standings[group].map(team => `
                    <tr>
                        <td>${team.team}</td>
                        <td>${team.played}</td>
                        <td>${team.won}</td>
                        <td>${team.drawn}</td>
                        <td>${team.lost}</td>
                        <td>${team.gf}</td>
                        <td>${team.ga}</td>
                        <td>${team.gd > 0 ? '+' : ''}${team.gd}</td>
                        <td><strong>${team.points}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        accordionBody.appendChild(table);
        accordionCollapse.appendChild(accordionBody);
        accordionItem.appendChild(accordionHeader);
        accordionItem.appendChild(accordionCollapse);
        groupAccordion.appendChild(accordionItem);
    });
}

// Fetch data from API
async function fetchData() {
    try {
        // Show loading state
        matchTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Loading data...</td></tr>';
        
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process your data here if needed
        const matches = Array.isArray(data) ? data : [];
        
        // Generate standings from match data (you might want to adjust this)
        const standings = {};
        matches.forEach(match => {
            if (!standings[match.Group]) {
                standings[match.Group] = [];
            }
        });
        
        // For demo purposes - in a real app, you would calculate standings from match results
        Object.keys(standings).forEach(group => {
            standings[group] = [
                { team: `RT ${Math.floor(Math.random() * 10) + 1}`, played: 2, won: 1, drawn: 1, lost: 0, gf: 4, ga: 2, gd: 2, points: 4 },
                { team: `RT ${Math.floor(Math.random() * 10) + 1}`, played: 2, won: 1, drawn: 0, lost: 1, gf: 3, ga: 3, gd: 0, points: 3 },
                { team: `RT ${Math.floor(Math.random() * 10) + 1}`, played: 2, won: 0, drawn: 2, lost: 0, gf: 2, ga: 2, gd: 0, points: 2 },
                { team: `RT ${Math.floor(Math.random() * 10) + 1}`, played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 3, gd: -2, points: 1 }
            ];
        });
        
        renderMatches(matches);
        renderStandings(standings);
    } catch (error) {
        console.error('Error fetching data:', error);
        matchTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Failed to load data. Please try again later.</td></tr>';
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    if (API_URL && API_URL !== "PASTE_YOUR_APPS_SCRIPT_API_URL_HERE") {
        fetchData();
    } else {
        matchTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Please set your API URL in script.js</td></tr>';
    }
});
