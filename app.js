// Polymarket Dashboard - Frontend Application
const API_BASE = "https://YOUR_API_URL_HERE"; // Update before deployment // Change to your deployed API URL

// DOM Elements
const marketsTbody = document.getElementById('marketsTbody');
const marketCount = document.getElementById('marketCount');
const topMarketsList = document.getElementById('topMarketsList');
const categoryFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loadingEl = document.getElementById('loading');
const marketsTable = document.getElementById('marketsTable');
const upgradeBtns = document.querySelectorAll('#upgradeBtn, #upgradeChartBtn, #premiumCta');
const stripeCheckoutBtn = document.getElementById('stripeCheckout');
const upgradeModal = new bootstrap.Modal(document.getElementById('upgradeModal'));

// Global state
let allMarkets = [];
let categories = new Set();

// Format currency
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '-';
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format percentage (for odds)
function formatPercent(price) {
    if (price === null || price === undefined) return '-';
    return (price * 100).toFixed(1) + '%';
}

// Parse outcomes JSON string
function parseOutcomes(outcomesStr) {
    if (!outcomesStr) return [];
    try {
        if (typeof outcomesStr === 'string') {
            return JSON.parse(outcomesStr);
        }
        return outcomesStr;
    } catch (e) {
        console.warn('Failed to parse outcomes:', outcomesStr);
        return [];
    }
}

// Update status footer with timestamps
function updateStatus(apiTimestamp, dataUpdated) {
    let statusHtml = '<small class="text-muted">';
    if (apiTimestamp) {
        const localTime = new Date(apiTimestamp).toLocaleTimeString();
        statusHtml += `Fetched: ${localTime} | `;
    }
    if (dataUpdated) {
        statusHtml += `Data updated: ${dataUpdated}`;
    }
    statusHtml += '</small>';
    
    // Create or update status element
    let statusEl = document.getElementById('dataStatus');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'dataStatus';
        statusEl.className = 'text-center mt-3 mb-2';
        document.querySelector('.container').appendChild(statusEl);
    }
    statusEl.innerHTML = statusHtml;
}

// Render a single market row
function renderMarketRow(market) {
    const outcomes = parseOutcomes(market.outcomes);
    const volume = market.volume24h !== null ? market.volume24h : (market.raw_data?.volumeNum || 0);
    const bestBid = market.bestBid !== null ? market.bestBid : 0;
    const bestAsk = market.bestAsk !== null ? market.bestAsk : 1;
    const isActive = market.active === 1;
    const isClosed = market.closed === 1;
    
    let statusBadge = '';
    if (isClosed) {
        statusBadge = '<span class="badge bg-secondary">Closed</span>';
    } else if (isActive) {
        statusBadge = '<span class="badge bg-success">Active</span>';
    } else {
        statusBadge = '<span class="badge bg-warning">Inactive</span>';
    }
    
    const row = document.createElement('tr');
    row.className = 'market-card';
    row.innerHTML = `
        <td>
            <strong>${market.question}</strong><br>
            <small class="text-muted">${market.id} • Ends: ${market.end_date || 'N/A'}</small>
        </td>
        <td><span class="category-badge">${market.category || 'Uncategorized'}</span></td>
        <td><span class="volume-badge bg-info text-white">${formatCurrency(volume)}</span></td>
        <td>
            <small>Bid: ${formatPercent(bestBid)}<br>Ask: ${formatPercent(bestAsk)}</small>
        </td>
        <td>${statusBadge}</td>
    `;
    return row;
}

// Render top markets list
function renderTopMarkets(markets) {
    const top = markets.slice(0, 5);
    topMarketsList.innerHTML = '';
    top.forEach(market => {
        const outcomes = parseOutcomes(market.outcomes);
        const volume = market.volume24h !== null ? market.volume24h : (market.raw_data?.volumeNum || 0);
        const div = document.createElement('div');
        div.className = 'd-flex justify-content-between align-items-center mb-2';
        div.innerHTML = `
            <div>
                <strong class="d-block">${market.question.substring(0, 40)}${market.question.length > 40 ? '...' : ''}</strong>
                <small class="text-muted">${market.category}</small>
            </div>
            <span class="badge bg-primary">${formatCurrency(volume)}</span>
        `;
        topMarketsList.appendChild(div);
    });
}

// Populate category filter dropdown
function populateCategoryFilter() {
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
        if (cat) {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        }
    });
}

// Filter markets based on selected category and search text
function filterMarkets() {
    const selectedCategory = categoryFilter.value;
    const searchText = searchInput.value.toLowerCase();
    
    let filtered = allMarkets;
    if (selectedCategory) {
        filtered = filtered.filter(m => m.category === selectedCategory);
    }
    if (searchText) {
        filtered = filtered.filter(m => 
            m.question.toLowerCase().includes(searchText) ||
            (m.category && m.category.toLowerCase().includes(searchText))
        );
    }
    
    // Update table
    marketsTbody.innerHTML = '';
    filtered.forEach(market => {
        marketsTbody.appendChild(renderMarketRow(market));
    });
    marketCount.textContent = `${filtered.length} market${filtered.length !== 1 ? 's' : ''}`;
}

// Load markets from API
async function loadMarkets() {
    try {
        const response = await fetch(`${API_BASE}/markets?limit=100&active_only=true`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        allMarkets = data.markets || [];
        categories = new Set(allMarkets.map(m => m.category).filter(Boolean));
        
        // Hide loading, show table
        loadingEl.style.display = 'none';
        marketsTable.style.display = 'block';
        
        // Initial render
        populateCategoryFilter();
        filterMarkets();
        renderTopMarkets(allMarkets);
        
        console.log(`Loaded ${allMarkets.length} markets`);
        
        // Update status with timestamp
        updateStatus(data.timestamp, data.data_updated);
    } catch (error) {
        console.error('Failed to load markets:', error);
        loadingEl.innerHTML = `
            <div class="text-center text-danger">
                <i class="bi bi-exclamation-triangle-fill" style="font-size: 3rem;"></i>
                <p class="mt-3">Failed to load market data.<br><small>${error.message}</small></p>
                <button class="btn btn-outline-primary mt-2" onclick="loadMarkets()">Retry</button>
            </div>
        `;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMarkets();
    
    // Event listeners
    categoryFilter.addEventListener('change', filterMarkets);
    searchBtn.addEventListener('click', filterMarkets);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') filterMarkets();
    });
    
    // Upgrade buttons
    upgradeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            upgradeModal.show();
        });
    });
    
    // Stripe checkout (live payment link)
    stripeCheckoutBtn.addEventListener('click', () => {
        window.open('https://buy.stripe.com/bJeeVeaaU8FGgkXfch5ZC0B', '_blank');
        upgradeModal.hide();
    });
});