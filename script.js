// ================================================================
//  KONFIGURASI API
// ================================================================
const API_URL =
    "https://script.google.com/macros/s/AKfycbx9P4v0rcmcNgdaInqtGSB-Mo0ldfWWDTpdR-x26ec7ept-YXivAaA7yuZkh6To6Do4/exec";
const TOP_SCORERS_API_URL =
    "https://script.google.com/macros/s/AKfycbyfRoUclJoA7lFVmkToxEdAE3F6n4zVpG1wwnvBpmhwHV9WR9SAUS2N2HDFS0Mq3gMtKw/exec";

// ================================================================
//  🔴 KONFIGURASI TIM PER TAHUN (HARDCODE)
//  ================================================================
//  Isi daftar tim untuk setiap group di setiap tahun.
//  Group 'A' dan 'B' untuk penyisihan.
//  Group '1' untuk semifinal & final (4 tim).
//  Jumlah tim per group fleksibel (bisa kurang dari 6).
// ================================================================
const TEAMS_BY_YEAR = {
    2025: {
        'A': ['RT 1', 'RT 7', 'RT 8', 'RT 9', 'RT 10', 'RT 11'],
        'B': ['RT 2', 'RT 3', 'RT 4', 'RT 5', 'RT 6', 'RT 12'],
        '1': ['RT 8', 'RT 5', 'RT 11', 'RT 6'] // 4 semifinalis
    },
    2026: {
        'A': [
            // 🔴 ISI DAFTAR TIM GROUP A 2026 DI SINI
            // contoh: 'RT 1', 'RT 2', 'RT 3', ...
        ],
        'B': [
            // 🔴 ISI DAFTAR TIM GROUP B 2026 DI SINI
        ],
        '1': [
            // 🔴 ISI 4 TIM SEMIFINALIS 2026 DI SINI
            // (bisa diisi setelah penyisihan selesai)
        ]
    }
};

// ================================================================
//  STATE
// ================================================================
let currentYear = 2026;
let allMatches = [];
let allScorers = [];
let isLoading = false;

// ================================================================
//  DOM REFS
// ================================================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const hamburgerBtn = $('#hamburgerBtn');
const sidebar = $('#sidebar');
const sidebarOverlay = $('#sidebarOverlay');
const sidebarClose = $('#sidebarClose');
const tahunBadge = $('#tahunBadge');
const tahunLinks = $$('.tahun-link');
const navLinks = $$('.sidebar-nav a:not(.tahun-link)');

const matchesContainer = $('#matchesContainer');
const standingsContainer = $('#standingsContainer');
const scorersContainer = $('#scorersContainer');

// ================================================================
//  SIDEBAR
// ================================================================
function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

hamburgerBtn.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// ================================================================
//  NAVIGASI SIDEBAR (scroll ke section)
// ================================================================
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        if (target && target.startsWith('#')) {
            const el = document.querySelector(target);
            if (el) {
                closeSidebar();
                setTimeout(() => {
                    const headerH = document.getElementById('header').offsetHeight + 12;
                    const top = el.getBoundingClientRect().top + window.pageYOffset - headerH;
                    window.scrollTo({ top, behavior: 'smooth' });
                }, 320);
            }
        }
    });
});

// ================================================================
//  FILTER TAHUN
// ================================================================
tahunLinks.forEach(link => {
    link.addEventListener('click', () => {
        const tahun = parseInt(link.dataset.tahun, 10);
        if (tahun === currentYear) {
            closeSidebar();
            return;
        }
        currentYear = tahun;
        tahunLinks.forEach(l => l.classList.remove('aktif'));
        link.classList.add('aktif');
        tahunBadge.textContent = tahun;
        closeSidebar();
        renderAll();
    });
});

// ================================================================
//  FORMAT TANGGAL
// ================================================================
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

function formatDateFull(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober',
        'November', 'Desember'
    ];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getYearFromDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.getFullYear();
}

function getTeamsForYear(year) {
    return TEAMS_BY_YEAR[year] || { 'A': [], 'B': [], '1': [] };
}

// ================================================================
//  RENDER: JADWAL (group by date)
// ================================================================
function renderMatches(matches) {
    if (!matches || matches.length === 0) {
        matchesContainer.innerHTML =
            `<div class="empty-state"><span>📭</span> Tidak ada jadwal untuk tahun ${currentYear}</div>`;
        return;
    }

    // Filter by year
    const filtered = matches.filter(m => {
        const year = getYearFromDate(m.Tanggal);
        return year === currentYear;
    });

    if (filtered.length === 0) {
        matchesContainer.innerHTML =
            `<div class="empty-state"><span>📭</span> Tidak ada jadwal untuk tahun ${currentYear}</div>`;
        return;
    }

    // Urutkan dari tanggal terlama ke terbaru
    filtered.sort((a, b) => new Date(a.Tanggal) - new Date(b.Tanggal));

    // Group by date
    const groups = {};
    filtered.forEach(m => {
        const key = m.Tanggal;
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
    });

    let html = '';
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(a) - new Date(b));

    sortedDates.forEach(date => {
        const items = groups[date];
        html += `<div class="match-day">`;
        html +=
            `<div class="match-day-header">📅 ${formatDateFull(date)} <span class="hari">(${items.length} pertandingan)</span></div>`;

        items.forEach(m => {
            const t1 = m['Team 1'] || '-';
            const t2 = m['Team 2'] || '-';
            const s1 = m['Skor 1'] !== undefined && m['Skor 1'] !== '' ? m['Skor 1'] : '0';
            const s2 = m['Skor 2'] !== undefined && m['Skor 2'] !== '' ? m['Skor 2'] : '0';
            const group = m.Group || '-';
            const waktu = m.Waktu || '-';

            html += `
                        <div class="match-item">
                            <span class="match-time">${waktu}</span>
                            <span class="match-group">Group ${group}</span>
                            <div class="match-teams">
                                <span class="team">${t1}</span>
                                <span class="score">${s1} : ${s2}</span>
                                <span class="team">${t2}</span>
                            </div>
                            <span class="match-status"></span>
                        </div>
                    `;
        });

        html += `</div>`;
    });

    matchesContainer.innerHTML = html;
}

// ================================================================
//  RENDER: KLASEMEN
// ================================================================
function calculateStandings(matches) {
    const teamsConfig = getTeamsForYear(currentYear);
    const standings = {};

    // Inisialisasi semua tim dari konfigurasi (termasuk yang belum main)
    Object.keys(teamsConfig).forEach(group => {
        standings[group] = {};
        teamsConfig[group].forEach(team => {
            standings[group][team] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0,
                points: 0 };
        });
    });

    // Filter match by year
    const filtered = matches.filter(m => {
        const year = getYearFromDate(m.Tanggal);
        return year === currentYear;
    });

    // Proses pertandingan
    filtered.forEach(m => {
        const group = m.Group;
        const team1 = m['Team 1'];
        const team2 = m['Team 2'];
        const s1 = parseInt(m['Skor 1']) || 0;
        const s2 = parseInt(m['Skor 2']) || 0;

        if (!group || !team1 || !team2 || m['Skor 1'] === "" || m['Skor 2'] === "") return;
        if (!standings[group] || !standings[group][team1] || !standings[group][team2]) return;

        const t1 = standings[group][team1];
        const t2 = standings[group][team2];

        t1.played++;
        t2.played++;
        t1.gf += s1;
        t1.ga += s2;
        t2.gf += s2;
        t2.ga += s1;

        if (s1 > s2) { t1.won++;
            t2.lost++;
            t1.points += 3; } else if (s1 < s2) { t2.won++;
            t1.lost++;
            t2.points += 3; } else { t1.drawn++;
            t2.drawn++;
            t1.points += 1;
            t2.points += 1; }

        t1.gd = t1.gf - t1.ga;
        t2.gd = t2.gf - t2.ga;
    });

    // Konversi ke array dan urutkan
    const result = {};
    Object.keys(standings).forEach(group => {
        result[group] = Object.keys(standings[group])
            .map(team => ({ team, ...standings[group][team] }))
            .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
    });

    return result;
}

function renderStandings(matches) {
    const standings = calculateStandings(matches);
    const groups = Object.keys(standings).filter(g => standings[g].length > 0);

    if (groups.length === 0) {
        standingsContainer.innerHTML =
            `<div class="empty-state"><span>📭</span> Tidak ada data klasemen untuk tahun ${currentYear}</div>`;
        return;
    }

    // Buat accordion untuk klasemen
    let html = `<div class="accordion" id="standingsAccordion">`;

    groups.forEach((group, index) => {
        const teams = standings[group];
        const isFirst = index === 0;

        html += `
            <div class="accordion-item">
                <button class="accordion-header ${isFirst ? 'open' : ''}" onclick="toggleAccordion(this)">
                    <span>🏆 Group ${group}</span>
                    <span class="arrow">▾</span>
                </button>
                <div class="accordion-body ${isFirst ? 'open' : ''}">
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th class="team-nama">Team</th>
                                    <th>P</th><th>W</th><th>D</th><th>L</th>
                                    <th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

        teams.forEach(t => {
            const gdClass = t.gd > 0 ? 'gd-positif' : (t.gd < 0 ? 'gd-negatif' : '');
            html += `
                            <tr>
                                <td class="team-nama">${t.team}</td>
                                <td>${t.played}</td>
                                <td>${t.won}</td>
                                <td>${t.drawn}</td>
                                <td>${t.lost}</td>
                                <td>${t.gf}</td>
                                <td>${t.ga}</td>
                                <td class="${gdClass}">${t.gd > 0 ? '+' : ''}${t.gd}</td>
                                <td class="poin">${t.points}</td>
                            </tr>
                        `;
        });

        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    standingsContainer.innerHTML = html;
}
// ================================================================
//  RENDER: TOP SCORERS
// ================================================================
function processScorers(scorers) {
    // Filter by year
    const filtered = scorers.filter(s => {
        const year = getYearFromDate(s.tanggal);
        return year === currentYear;
    });

    if (filtered.length === 0) return { summary: [], detail: [] };

    const playerStats = {};
    filtered.forEach(s => {
        const key = `${s.nama}|${s.team}`;
        if (!playerStats[key]) {
            playerStats[key] = { nama: s.nama, team: s.team, total: 0, goals: [] };
        }
        playerStats[key].total++;
        playerStats[key].goals.push(s);
    });

    const summary = Object.values(playerStats)
        .sort((a, b) => b.total - a.total || a.nama.localeCompare(b.nama));

    const detail = filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    return { summary, detail };
}

function renderScorers(scorers) {
    const processed = processScorers(scorers);

    if (processed.summary.length === 0) {
        scorersContainer.innerHTML =
            `<div class="empty-state"><span>⭐</span> Tidak ada data top scorers untuk tahun ${currentYear}</div>`;
        return;
    }

    let html = `<div class="accordion">`;

    // Summary
    html += `
            <div class="accordion-item">
                <button class="accordion-header open" onclick="toggleAccordion(this)">
                    <span>📊 Summary Top Scorers</span>
                    <span class="arrow">▾</span>
                </button>
                <div class="accordion-body open">
                    <div class="table-wrap">
                        <table>
                            <thead><tr><th>Nama</th><th>Team</th><th>Total Gol</th></tr></thead>
                            <tbody>
                                ${processed.summary.map(p => `
                                    <tr>
                                        <td><strong>${p.nama}</strong></td>
                                        <td>${p.team}</td>
                                        <td><span style="background:var(--kuning); padding:0.1rem 0.7rem; border-radius:30px; font-weight:700;">${p.total}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

    // Detail
    html += `
            <div class="accordion-item">
                <button class="accordion-header" onclick="toggleAccordion(this)">
                    <span>📋 Detail Gol</span>
                    <span class="arrow">▾</span>
                </button>
                <div class="accordion-body">
                    <div class="table-wrap">
                        <table>
                            <thead><tr><th>Tanggal</th><th>Team</th><th>Nama</th><th>Keterangan</th></tr></thead>
                            <tbody>
                                ${processed.detail.map(d => `
                                    <tr>
                                        <td>${formatDate(d.tanggal)}</td>
                                        <td>${d.team}</td>
                                        <td><strong>${d.nama}</strong></td>
                                        <td>${d.keterangan || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

    html += `</div>`;
    scorersContainer.innerHTML = html;
}

// ================================================================
//  ACCORDION TOGGLE (global)
// ================================================================
function toggleAccordion(btn) {
    const body = btn.nextElementSibling;
    const isOpen = body.classList.contains('open');

    // Tutup semua accordion di container yang sama
    const container = btn.closest('.accordion');
    if (container) {
        container.querySelectorAll('.accordion-body').forEach(b => b.classList.remove('open'));
        container.querySelectorAll('.accordion-header').forEach(h => h.classList.remove('open'));
    }

    if (!isOpen) {
        body.classList.add('open');
        btn.classList.add('open');
    }
}

// ================================================================
//  RENDER ALL
// ================================================================
function renderAll() {
    renderMatches(allMatches);
    renderStandings(allMatches);
    renderScorers(allScorers);
}

// ================================================================
//  FETCH DATA
// ================================================================
async function fetchData() {
    try {
        // Loading state
        matchesContainer.innerHTML = `<div class="empty-state"><span>⏳</span> Memuat data...</div>`;
        standingsContainer.innerHTML = `<div class="empty-state"><span>⏳</span> Memuat data...</div>`;
        scorersContainer.innerHTML = `<div class="empty-state"><span>⏳</span> Memuat data...</div>`;

        const [matchesResponse, scorersResponse] = await Promise.all([
            fetch(API_URL),
            fetch(TOP_SCORERS_API_URL)
        ]);

        if (!matchesResponse.ok) throw new Error(`HTTP Error: ${matchesResponse.status}`);
        const matchesData = await matchesResponse.json();
        if (!Array.isArray(matchesData)) throw new Error('Format data pertandingan tidak valid');

        if (!scorersResponse.ok) throw new Error(`HTTP Error Top Scorers: ${scorersResponse.status}`);
        const scorersData = await scorersResponse.json();

        allMatches = matchesData;
        allScorers = Array.isArray(scorersData) ? scorersData : [];

        renderAll();

    } catch (error) {
        console.error('Gagal memuat data:', error);
        matchesContainer.innerHTML =
            `<div class="empty-state"><span>❌</span> Gagal memuat data. ${error.message}</div>`;
        standingsContainer.innerHTML =
            `<div class="empty-state"><span>❌</span> Gagal memuat data.</div>`;
        scorersContainer.innerHTML =
            `<div class="empty-state"><span>❌</span> Gagal memuat data.</div>`;
    }
}

// ================================================================
//  DOWNLOAD PDF
// ================================================================
function downloadPDF() {
    const element = document.querySelector('main');
    const opt = {
        margin: 0.5,
        filename: `mini-soccer-u12-${currentYear}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}

document.getElementById('downloadBtn').addEventListener('click', downloadPDF);

// ================================================================
//  INIT
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Cek apakah ada tahun yang tersedia
    const availableYears = Object.keys(TEAMS_BY_YEAR).map(Number);
    if (availableYears.length === 0) {
        matchesContainer.innerHTML =
            `<div class="empty-state"><span>⚠️</span> Belum ada konfigurasi tim. Isi TEAMS_BY_YEAR di script.js</div>`;
        return;
    }

    // Set default ke tahun terbaru
    const latestYear = Math.max(...availableYears);
    currentYear = latestYear;
    tahunBadge.textContent = currentYear;

    // Aktifkan link tahun yang sesuai
    tahunLinks.forEach(link => {
        const tahun = parseInt(link.dataset.tahun, 10);
        if (tahun === currentYear) {
            link.classList.add('aktif');
        } else {
            link.classList.remove('aktif');
        }
    });

    fetchData();
});
