/**
 * FinanceAI — Dashboard Core Logic
 * Cleaned up and refactored for better maintenance.
 */

// --- INITIAL STATE ---
let transactions = JSON.parse(localStorage.getItem('finance_tx')) || [];
let goals = JSON.parse(localStorage.getItem('finance_goals')) || [];
let currentMonth = 'Mar'; // Default view
const monthMap = { 'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5, 'Jul': 6 };
const API_KEY = typeof CONFIG !== 'undefined' ? CONFIG.HG_API_KEY : '';
const ALPHA_KEY = typeof CONFIG !== 'undefined' ? CONFIG.ALPHA_API_KEY : '';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    renderAll();
    fetchMarketData();
    updateSystemDate();
    
    // Auto-refresh market data every 60s
    setInterval(fetchMarketData, 60000);
    
    // Mock ticker fluctuation
    setInterval(mockTickerFluctuation, 5000);
});

// --- CORE FUNCTIONS ---

function saveData() {
    localStorage.setItem('finance_tx', JSON.stringify(transactions));
    localStorage.setItem('finance_goals', JSON.stringify(goals));
}

function renderAll() {
    renderTransactions();
    renderGoals();
}

/**
 * Main update loop for Transactions
 */
function renderTransactions() {
    const lists = {
        overview: document.getElementById('overview-tx-list'),
        full: document.getElementById('full-tx-list')
    };

    if (lists.overview) lists.overview.innerHTML = '';
    if (lists.full) lists.full.innerHTML = '';

    const targetMonthIndex = monthMap[currentMonth];
    const filteredTx = transactions.filter(tx => new Date(tx.date).getUTCMonth() === targetMonthIndex);

    if (filteredTx.length === 0) {
        const emptyState = `
            <div style="text-align:center; padding: 40px; color: var(--muted); font-size: 13px;">
                <span class="icon" style="font-size: 24px; display: block; margin-bottom: 10px;">📄</span>
                Nenhuma transação registrada em ${currentMonth}.
            </div>`;
        if (lists.overview) lists.overview.innerHTML = emptyState;
        if (lists.full) lists.full.innerHTML = emptyState;
        
        updateKPIs(0, 0);
        updateCharts([]);
        updateCategoryList([]);
        return;
    }

    const sorted = [...filteredTx].sort((a, b) => new Date(b.date) - new Date(a.date));
    let totalIncome = 0;
    let totalExpense = 0;

    sorted.forEach((tx, index) => {
        if (tx.type === 'income') totalIncome += tx.amount;
        else totalExpense += tx.amount;

        const icon = tx.category.split(' ')[0];
        const categoryName = tx.category.split(' ').slice(1).join(' ');
        
        const itemHtml = `
            <div class="tx-icon" style="background:rgba(${tx.type === 'income' ? '200,240,77' : '255,92,92'}, 0.1)">${icon}</div>
            <div class="tx-info">
                <div class="tx-name">${tx.name}</div>
                <div class="tx-cat">${categoryName}</div>
            </div>
            <div class="tx-date">${tx.date.split('-').reverse().slice(0, 2).join('/')}</div>
            <div class="tx-amount ${tx.type === 'income' ? 'pos' : 'neg'}">${tx.type === 'income' ? '+' : '-'}R$${tx.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
        `;

        const div = document.createElement('div');
        div.className = 'tx-item';
        div.innerHTML = itemHtml;
        div.onclick = () => openTxModal(tx.id);

        if (index < 5 && lists.overview) lists.overview.appendChild(div.cloneNode(true)).onclick = () => openTxModal(tx.id);
        if (lists.full) lists.full.appendChild(div);
    });

    updateKPIs(totalIncome, totalExpense);
    updateCharts(filteredTx);
    updateCategoryList(filteredTx);
}

function updateKPIs(income, expense) {
    const els = {
        balance: document.getElementById('kpi-balance'),
        income: document.getElementById('kpi-income'),
        expense: document.getElementById('kpi-expense'),
        savings: document.getElementById('kpi-savings'),
        savingsPct: document.getElementById('kpi-savings-pct'),
        labelInc: document.getElementById('label-income'),
        labelExp: document.getElementById('label-expense')
    };

    if (els.labelInc) els.labelInc.textContent = `Receitas (${currentMonth})`;
    if (els.labelExp) els.labelExp.textContent = `Despesas (${currentMonth})`;

    const balance = income - expense;
    const savingsPct = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;

    if (els.balance) els.balance.textContent = `R$ ${balance.toLocaleString('pt-BR')}`;
    if (els.income) els.income.textContent = `R$ ${income.toLocaleString('pt-BR')}`;
    if (els.expense) els.expense.textContent = `R$ ${expense.toLocaleString('pt-BR')}`;
    if (els.savings) els.savings.textContent = `R$ ${balance.toLocaleString('pt-BR')}`;
    if (els.savingsPct) {
        els.savingsPct.textContent = `${savingsPct}%`;
        els.savingsPct.className = `badge ${balance >= 0 ? 'up' : 'down'}`;
    }
}

function updateCharts(txs) {
    // Basic dynamic bars for SVG
    const idx = monthMap[currentMonth];
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const max = Math.max(income, expense, 5000);
    const hInc = (income / max) * 120;
    const hExp = (expense / max) * 120;

    const incBar = document.getElementById(`bar-inc-${idx}`);
    const expBar = document.getElementById(`bar-exp-${idx}`);

    if (incBar) {
        incBar.setAttribute('height', hInc);
        incBar.setAttribute('y', 140 - hInc);
    }
    if (expBar) {
        expBar.setAttribute('height', hExp);
        expBar.setAttribute('y', 140 - hExp);
    }
}

function updateCategoryList(txs) {
    const container = document.getElementById('category-list-container');
    if (!container) return;

    const expenses = txs.filter(t => t.type === 'expense');
    if (expenses.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--muted)">Sem despesas este mês.</div>';
        return;
    }

    const cats = {};
    expenses.forEach(t => cats[t.category] = (cats[t.category] || 0) + t.amount);
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...Object.values(cats));

    container.innerHTML = '';
    sorted.forEach(([name, val]) => {
        const pct = (val / max) * 100;
        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = `
            <div class="category-top">
                <span class="category-name">${name}</span>
                <span class="category-amount">R$ ${val.toLocaleString('pt-BR')}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${pct}%;background:var(--accent)"></div>
            </div>`;
        container.appendChild(item);
    });
}

/**
 * Goal Rendering
 */
function renderGoals() {
    const containers = document.querySelectorAll('#goals-container, #overview-goals-container');
    containers.forEach(c => c.innerHTML = '');

    if (goals.length === 0) {
        containers.forEach(c => {
            c.innerHTML = `
                <div class="chart-card" style="grid-column: span 3; padding: 40px; text-align: center; color: var(--muted); border: none;">
                    <span class="icon" style="font-size: 24px; display: block; margin-bottom: 10px;">🎯</span>
                    Sem metas ativas.
                </div>`;
        });
        return;
    }

    goals.forEach(goal => {
        const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
        
        containers.forEach(container => {
            const isOverview = container.id === 'overview-goals-container';
            const div = document.createElement('div');
            div.className = isOverview ? 'goal-item' : 'chart-card goal-card-anim';
            
            div.innerHTML = `
                <div class="goal-header">
                    <span class="goal-name">${goal.name}</span>
                    <span class="goal-pct">${pct}%</span>
                </div>
                <div class="goal-bar"><div class="goal-fill" style="width:${pct}%;background:var(--accent2)"></div></div>
                <div class="goal-sub">
                    <span>R$ ${goal.current.toLocaleString('pt-BR')} / R$ ${goal.target.toLocaleString('pt-BR')}</span>
                    <span>${goal.date || ''}</span>
                </div>
                ${!isOverview ? `
                <div class="modal-footer" style="padding:0; margin-top:10px; justify-content: flex-start;">
                    <button class="btn-primary" style="padding: 5px 12px; font-size: 11px;" data-fund="${goal.id}">+ Valor</button>
                    <button class="btn-danger" style="padding: 5px 12px; font-size: 11px;" data-del="${goal.id}">Apagar</button>
                </div>` : ''}
            `;

            // Funding & Delete buttons in the Goals view
            if (!isOverview) {
                div.querySelector('[data-fund]').onclick = () => openFundingModal(goal.id);
                div.querySelector('[data-del]').onclick = () => openDeleteGoalModal(goal.id);
            }
            
            container.appendChild(div);
        });
    });
}

// --- MODAL & FORM LOGIC ---

function openTxModal(id = null) {
    const overlay = document.getElementById('modalOverlay');
    const form = document.getElementById('txForm');
    const delBtn = document.getElementById('deleteBtn');
    
    form.reset();
    document.getElementById('txId').value = '';
    document.getElementById('selectedCategoryText').textContent = 'Selecione uma categoria';
    document.getElementById('selectedTypeText').textContent = 'Selecione o tipo';
    delBtn.style.display = 'none';

    if (id) {
        const tx = transactions.find(t => t.id === id);
        if (tx) {
            document.getElementById('modalTitle').textContent = 'Editar Transação';
            document.getElementById('txId').value = tx.id;
            document.getElementById('txName').value = tx.name;
            document.getElementById('txAmount').value = tx.amount;
            document.getElementById('txDate').value = tx.date;
            document.getElementById('txCategory').value = tx.category;
            document.getElementById('selectedCategoryText').textContent = tx.category;
            document.getElementById('txType').value = tx.type;
            document.getElementById('selectedTypeText').textContent = tx.type === 'income' ? 'Receita (+)' : 'Despesa (-)';
            delBtn.style.display = 'block';
        }
    } else {
        document.getElementById('modalTitle').textContent = 'Nova Transação';
    }

    overlay.classList.add('active');
}

function openFundingModal(goalId) {
    document.getElementById('fundingGoalId').value = goalId;
    document.getElementById('fundingAmount').value = '';
    document.getElementById('fundingModalOverlay').classList.add('active');
    setTimeout(() => document.getElementById('fundingAmount').focus(), 100);
}

function openDeleteGoalModal(goalId) {
    document.getElementById('deleteGoalId').value = goalId;
    document.getElementById('deleteGoalModalOverlay').classList.add('active');
}

function openDeleteTxModal() {
    const id = document.getElementById('txId').value;
    document.getElementById('deleteTxId').value = id;
    document.getElementById('deleteTxModalOverlay').classList.add('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.custom-options').forEach(o => o.classList.remove('show'));
}

// --- API & DATA FETCHING ---

async function fetchMarketData() {
    if (!API_KEY) return;
    try {
        const res = await fetch(`https://api.hgbrasil.com/finance?format=json-cors&key=${API_KEY}`);
        const data = await res.json();
        if (data.results) {
            updateTickerUI(data.results);
            updateMarketView(data.results);
        }
    } catch (e) { console.error("Market API Error:", e); }
}

function updateTickerUI(res) {
    const ticker = document.getElementById('stock-ticker');
    if (!ticker) return;

    const data = [
        { sym: 'USD', buy: res.currencies.USD.buy, var: res.currencies.USD.variation },
        { sym: 'EUR', buy: res.currencies.EUR.buy, var: res.currencies.EUR.variation },
        { sym: 'BTC', buy: res.currencies.bitcoin.coinbase.last, var: res.currencies.bitcoin.coinbase.variation },
        { sym: 'IBOV', buy: res.stocks.IBOVESPA.points, var: res.stocks.IBOVESPA.variation }
    ];

    ticker.innerHTML = '';
    // Double for infinite scroll effect
    [...data, ...data].forEach(item => {
        const div = document.createElement('div');
        div.className = 'ticker-item';
        const isUp = item.var >= 0;
        div.innerHTML = `
            <span class="ticker-symbol">${item.sym}</span>
            <span class="ticker-price">${item.buy.toLocaleString('pt-BR')}</span>
            <span class="ticker-change ${isUp ? 'up' : 'down'}">${isUp ? '+' : ''}${item.var}%</span>
        `;
        ticker.appendChild(div);
    });
}

function updateMarketView(res) {
    const container = document.getElementById('view-market');
    if (!container) return;

    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Mercado <em>Financeiro</em></h1>
        </div>
        <div class="grid-2 animate">
            <div class="chart-card">
                <h3>Moedas (Câmbio)</h3>
                <div style="margin-top:20px" class="tx-list">
                    ${Object.entries(res.currencies).filter(([k])=>['USD','EUR','GBP','BTC'].includes(k)).map(([k,v]) => `
                        <div class="tx-item">
                            <span>${k} - ${v.name}</span>
                            <strong>R$ ${v.buy.toLocaleString()}</strong>
                            <span style="color:var(${v.variation >= 0 ? '--accent' : '--red'})">${v.variation}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="chart-card">
                <h3>Bolsas</h3>
                <div style="margin-top:20px" class="tx-list">
                    ${Object.entries(res.stocks).map(([k,v]) => `
                        <div class="tx-item">
                            <span>${v.name}</span>
                            <strong>${v.points.toLocaleString()} pts</strong>
                            <span style="color:var(${v.variation >= 0 ? '--accent' : '--red'})">${v.variation}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// --- EVENT LISTENERS ---

function initEventListeners() {
    // Navigation
    document.querySelectorAll('#main-nav a').forEach(link => {
        link.onclick = (e) => {
            const page = e.currentTarget.dataset.page;
            document.querySelectorAll('#main-nav a').forEach(a => a.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            document.querySelectorAll('.page-view').forEach(v => v.style.display = 'none');
            const target = document.getElementById(`view-${page}`);
            if (target) {
                target.style.display = 'block';
                if (page === 'overview') renderTransactions();
                if (page === 'goals') renderGoals();
            }
        };
    });

    // Month Selector
    document.querySelectorAll('#month-selector .month-btn').forEach(btn => {
        btn.onclick = () => {
            currentMonth = btn.dataset.month;
            document.querySelectorAll('.month-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTransactions();
            showNotification("Calendário", `Visualizando dados de ${currentMonth}`);
        };
    });

    // Modals
    document.getElementById('new-tx-btn').onclick = () => openTxModal();
    document.getElementById('new-goal-btn').onclick = () => document.getElementById('goalModalOverlay').classList.add('active');
    document.querySelectorAll('[data-close]').forEach(b => {
        b.onclick = () => closeAllModals();
    });

    // Forms
    document.getElementById('txForm').onsubmit = handleTxSubmit;
    document.getElementById('goalForm').onsubmit = handleGoalSubmit;
    document.getElementById('fundingForm').onsubmit = handleFundingSubmit;

    // Delete Buttons
    document.getElementById('deleteBtn').onclick = openDeleteTxModal;
    document.getElementById('confirm-delete-tx-btn').onclick = executeDeleteTx;
    document.getElementById('confirm-delete-goal-btn').onclick = executeDeleteGoal;

    // Custom Selects
    document.getElementById('txCategoryDisplay').onclick = (e) => {
        e.stopPropagation();
        document.getElementById('categoryOptions').classList.toggle('show');
        document.getElementById('typeOptions').classList.remove('show');
    };
    document.getElementById('txTypeDisplay').onclick = (e) => {
        e.stopPropagation();
        document.getElementById('typeOptions').classList.toggle('show');
        document.getElementById('categoryOptions').classList.remove('show');
    };

    document.querySelectorAll('#categoryOptions .option').forEach(opt => {
        opt.onclick = () => {
            const val = opt.dataset.val;
            document.getElementById('txCategory').value = val;
            document.getElementById('selectedCategoryText').textContent = val;
            document.getElementById('categoryOptions').classList.remove('show');
        };
    });

    document.querySelectorAll('#typeOptions .option').forEach(opt => {
        opt.onclick = () => {
            const val = opt.dataset.val;
            const label = opt.dataset.label;
            document.getElementById('txType').value = val;
            document.getElementById('selectedTypeText').textContent = label;
            document.getElementById('typeOptions').classList.remove('show');
        };
    });

    // Close options on click outside
    window.onclick = () => {
        document.querySelectorAll('.custom-options').forEach(o => o.classList.remove('show'));
    };

    // AI Assistant
    document.getElementById('aiBtn').onclick = sendAI;
    document.getElementById('aiInput').onkeydown = (e) => { if(e.key === 'Enter') sendAI(); };
    document.querySelectorAll('.ai-chips .chip').forEach(chip => {
        chip.onclick = () => {
            document.getElementById('aiInput').value = chip.dataset.q;
            sendAI();
        };
    });

    // Investments Search
    document.getElementById('stock-search-btn').onclick = searchStock;
    
    // Quick link
    const seeAll = document.getElementById('see-all-tx');
    if (seeAll) seeAll.onclick = () => document.querySelector('[data-page="transactions"]').click();
}

// --- ACTION HANDLERS ---

function handleTxSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('txId').value;
    const data = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('txName').value,
        amount: parseFloat(document.getElementById('txAmount').value),
        date: document.getElementById('txDate').value,
        category: document.getElementById('txCategory').value,
        type: document.getElementById('txType').value
    };

    if (id) {
        const idx = transactions.findIndex(t => t.id == id);
        transactions[idx] = data;
    } else {
        transactions.push(data);
    }

    saveData();
    renderTransactions();
    closeAllModals();
    showNotification("Sucesso", "Transação salva com sucesso!");
}

function executeDeleteTx() {
    const id = document.getElementById('deleteTxId').value;
    transactions = transactions.filter(t => t.id != id);
    saveData();
    renderTransactions();
    closeAllModals();
    showNotification("Apagado", "Transação removida.");
}

function handleGoalSubmit(e) {
    e.preventDefault();
    goals.push({
        id: Date.now(),
        name: document.getElementById('goalName').value,
        target: parseFloat(document.getElementById('goalTarget').value),
        current: parseFloat(document.getElementById('goalCurrent').value),
        date: 'Meta Ativa'
    });
    saveData();
    renderGoals();
    closeAllModals();
    showNotification("Metas", "Meta criada!");
}

function handleFundingSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('fundingGoalId').value;
    const amount = parseFloat(document.getElementById('fundingAmount').value);
    
    if (amount > 0) {
        const goal = goals.find(g => g.id == id);
        if (goal) {
            goal.current += amount;
            if (goal.current >= goal.target) showNotification("🏆 Parabéns!", `Meta "${goal.name}" concluída!`);
            else showNotification("Meta Atualizada", `R$ ${amount} adicionados.`);
            saveData();
            renderGoals();
            closeAllModals();
        }
    }
}

function executeDeleteGoal() {
    const id = document.getElementById('deleteGoalId').value;
    goals = goals.filter(g => g.id != id);
    saveData();
    renderGoals();
    closeAllModals();
}

// --- UTILS ---

function showNotification(title, desc) {
    const toast = document.getElementById('notifToast');
    document.getElementById('notifTitle').textContent = title;
    document.getElementById('notifDesc').textContent = desc;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

function updateSystemDate() {
    const el = document.getElementById('currentDate');
    if (el) {
        const d = new Date();
        const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        el.textContent = d.toLocaleDateString('pt-BR', opts);
    }
}

function mockTickerFluctuation() {
    document.querySelectorAll('.ticker-price').forEach(el => {
        if (Math.random() > 0.7) {
            let p = parseFloat(el.textContent.replace('R$', '').replace('.','').replace(',','.'));
            if (!isNaN(p)) {
                p += (Math.random() * 0.2 - 0.1);
                el.textContent = `R$ ${p.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
            }
        }
    });
}

function sendAI() {
    const input = document.getElementById('aiInput');
    const response = document.getElementById('aiResponse');
    if (!input.value.trim()) return;

    const q = input.value.toLowerCase();
    input.value = '';
    response.innerHTML = '<span class="typing">🤖 Analisando seus dados...</span>';

    setTimeout(() => {
        const targetMonthIndex = monthMap[currentMonth];
        const monthlyTx = transactions.filter(tx => new Date(tx.date).getUTCMonth() === targetMonthIndex);
        const exp = monthlyTx.filter(t => t.type === 'expense');
        const totalExp = exp.reduce((s, t) => s + t.amount, 0);

        let reply = `Em **${currentMonth}**, você já registrou **${monthlyTx.length}** transações. `;
        
        if (q.includes('gastando') || q.includes('onde')) {
            if (exp.length > 0) {
                const cats = {};
                exp.forEach(e => cats[e.category] = (cats[e.category] || 0) + e.amount);
                const top = Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
                reply += `Seu maior gasto é em **${top[0]}** (R$ ${top[1].toLocaleString()}).`;
            } else reply += "Você não tem gastos registrados ainda.";
        } else if (q.includes('economizar') || q.includes('como')) {
            reply += "Uma boa dica é tentar reduzir gastos na sua maior categoria de despesas em pelo menos 10% este mês.";
        } else {
            reply += `Seu total de gastos atual é **R$ ${totalExp.toLocaleString()}**. Continue acompanhando suas metas para manter a saúde financeira!`;
        }
        
        response.innerHTML = `💡 ${reply}`;
    }, 1200);
}

// Alpha Vantage Stock Search
async function searchStock() {
    const symbol = document.getElementById('stockSearch').value.trim().toUpperCase();
    const resultDiv = document.getElementById('stockResult');
    const chartArea = document.getElementById('stockChartContainer');

    if (!symbol) return;
    if (!ALPHA_KEY) {
        resultDiv.innerHTML = `<div style="color:var(--red); text-align:center; padding:20px;">API Key não configurada.</div>`;
        return;
    }

    resultDiv.innerHTML = `<div style="text-align:center; padding:20px;">Buscando ${symbol}...</div>`;
    chartArea.style.display = 'none';

    try {
        const res = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_KEY}`);
        const data = await res.json();
        const ts = data['Time Series (Daily)'];
        
        if (ts) {
            const dates = Object.keys(ts);
            const latest = ts[dates[0]];
            const price = parseFloat(latest['4. close']);
            const prev = parseFloat(ts[dates[1]]['4. close']);
            const pct = (((price - prev) / prev) * 100).toFixed(2);
            
            resultDiv.innerHTML = `
                <div class="card" style="margin-top:20px; border: 1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:center">
                        <div><h2 style="margin:0">${symbol}</h2><small>${dates[0]}</small></div>
                        <div style="text-align:right">
                            <div style="font-size:28px; font-weight:600">R$ ${price.toLocaleString()}</div>
                            <div style="color:var(${pct >= 0 ? '--accent' : '--red'})">${pct}%</div>
                        </div>
                    </div>
                </div>`;
                
            // Simple trend chart
            const prices = dates.slice(0, 15).map(d => parseFloat(ts[d]['4. close'])).reverse();
            renderTrendChart(prices);
        } else {
            resultDiv.innerHTML = `<div style="color:var(--red); text-align:center; padding:20px;">Ticker não encontrado ou limite de API atingido.</div>`;
        }
    } catch (e) { resultDiv.innerHTML = `<div style="color:var(--red); text-align:center; padding:20px;">Erro de conexão.</div>`; }
}

function renderTrendChart(prices) {
    const container = document.getElementById('stockChartContainer');
    const canvas = document.getElementById('stockChart');
    if (!canvas) return;
    container.style.display = 'block';
    const ctx = canvas.getContext('2d');
    
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    const w = canvas.width;
    const h = canvas.height;
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = max - min;
    const step = w / (prices.length - 1);

    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    
    prices.forEach((p, i) => {
        const x = i * step;
        const y = h - ((p - min) / range * (h * 0.8)) - (h * 0.1);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
    grad.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fillStyle = grad;
    ctx.fill();
}
