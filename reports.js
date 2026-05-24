/**
 * ABC PVT.LTD - Reports, Expenses, and Profit & Loss Accounting
 */

const ReportsView = {
    activeSubTab: 'pl', // 'pl', 'sales', 'expenses'
    
    init() {
        this.setupEventListeners();
        this.render();
    },
    
    setupEventListeners() {
        // Sub-tabs navigation
        const tabBtns = document.querySelectorAll('.report-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const target = btn.getAttribute('data-report-tab');
                if (target === this.activeSubTab) return;
                
                tabBtns.forEach(b => {
                    b.classList.remove('active', 'border-brand-500', 'text-brand-600', 'dark:text-brand-400');
                    b.classList.add('border-transparent', 'text-slate-400');
                });
                
                btn.classList.remove('border-transparent', 'text-slate-400');
                btn.classList.add('active', 'border-brand-500', 'text-brand-600', 'dark:text-brand-400');
                
                document.getElementById(`report-sec-${this.activeSubTab}`).classList.add('hidden');
                document.getElementById(`report-sec-${target}`).classList.remove('hidden');
                
                this.activeSubTab = target;
                this.render();
            });
        });
        
        // P&L Filter
        document.getElementById('btn-pl-filter').addEventListener('click', () => {
            this.renderPLStatement();
        });
        
        // Print P&L Button
        document.getElementById('btn-print-pl').addEventListener('click', () => {
            document.body.classList.add('print-pl-active');
            window.print();
            setTimeout(() => {
                document.body.classList.remove('print-pl-active');
            }, 500);
        });
        
        // Expense form submission
        document.getElementById('expense-bill-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveExpense();
        });
    },
    
    render() {
        if (this.activeSubTab === 'pl') {
            this.renderPLStatement();
        } else if (this.activeSubTab === 'sales') {
            this.renderSalesLog();
        } else if (this.activeSubTab === 'expenses') {
            this.renderExpensesLog();
        }
    },
    
    renderPLStatement() {
        const fromDateStr = document.getElementById('pl-date-from').value;
        const toDateStr = document.getElementById('pl-date-to').value;
        
        let filteredSales = AppStore.sales;
        let filteredExpenses = AppStore.expenses;
        
        let periodText = "Reporting Period: Cumulative (All Time)";
        
        if (fromDateStr || toDateStr) {
            const fromDate = fromDateStr ? new Date(fromDateStr) : new Date(0);
            const toDate = toDateStr ? new Date(toDateStr) : new Date();
            // Set bounds
            if (fromDateStr) fromDate.setHours(0, 0, 0, 0);
            if (toDateStr) toDate.setHours(23, 59, 59, 999);
            
            filteredSales = AppStore.sales.filter(s => {
                const d = new Date(s.date);
                return d >= fromDate && d <= toDate;
            });
            
            filteredExpenses = AppStore.expenses.filter(e => {
                const d = new Date(e.date);
                return d >= fromDate && d <= toDate;
            });
            
            const startLabel = fromDateStr ? new Date(fromDateStr).toLocaleDateString() : 'Beginning';
            const endLabel = toDateStr ? new Date(toDateStr).toLocaleDateString() : 'Today';
            periodText = `Reporting Period: ${startLabel} to ${endLabel}`;
        }
        
        document.getElementById('pl-statement-period').innerText = periodText;
        
        // 1. Calculate Revenue
        const salesTotals = AppStore.getSalesTotals(filteredSales);
        document.getElementById('pl-val-sales-retail').innerText = salesTotals.retail.toFixed(2);
        document.getElementById('pl-val-sales-wholesale').innerText = salesTotals.wholesale.toFixed(2);
        document.getElementById('pl-val-revenue-total').innerText = salesTotals.total.toFixed(2);
        
        // 2. Calculate COGS
        const cogsTotal = AppStore.getCOGSTotal(filteredSales);
        document.getElementById('pl-val-cogs').innerText = cogsTotal.toFixed(2);
        document.getElementById('pl-val-cogs-total').innerText = `- ${cogsTotal.toFixed(2)}`;
        
        // 3. Calculate Gross Profit
        const grossProfit = salesTotals.total - cogsTotal;
        const grossProfitEl = document.getElementById('pl-val-gross-profit');
        grossProfitEl.innerText = grossProfit.toFixed(2);
        if (grossProfit >= 0) {
            grossProfitEl.className = "font-mono text-emerald-600 dark:text-emerald-400";
        } else {
            grossProfitEl.className = "font-mono text-rose-600 dark:text-rose-400";
        }
        
        // 4. Render Operational Expenses (OPEX) breakdown
        const expenseContainer = document.getElementById('pl-expenses-list');
        expenseContainer.innerHTML = '';
        
        // Group expenses by category
        const groupedExpenses = {};
        filteredExpenses.forEach(exp => {
            if (!groupedExpenses[exp.category]) {
                groupedExpenses[exp.category] = 0;
            }
            groupedExpenses[exp.category] += exp.amount;
        });
        
        const categories = ['Rent', 'Electricity', 'Water', 'Salaries', 'Marketing', 'Wastage', 'Other'];
        let expensesTotal = 0;
        
        categories.forEach(cat => {
            const amount = groupedExpenses[cat] || 0;
            expensesTotal += amount;
            
            const div = document.createElement('div');
            div.className = "flex justify-between pl-4 text-slate-600 dark:text-slate-300";
            div.innerHTML = `
                <span>${cat} Expenses</span>
                <span class="font-mono">${amount.toFixed(2)}</span>
            `;
            expenseContainer.appendChild(div);
        });
        
        document.getElementById('pl-val-expenses-total').innerText = `- ${expensesTotal.toFixed(2)}`;
        
        // 5. Calculate Net Profit
        const netProfit = grossProfit - expensesTotal;
        const netProfitEl = document.getElementById('pl-val-net-profit');
        netProfitEl.innerText = `${netProfit >= 0 ? '' : '-'}${Math.abs(netProfit).toFixed(2)}`;
        
        const netContainer = netProfitEl.parentElement;
        if (netProfit >= 0) {
            netProfitEl.className = "font-mono text-xl text-emerald-600 dark:text-emerald-400";
            netContainer.className = "flex justify-between font-outfit font-extrabold text-lg bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-2xl text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30 mt-6";
        } else {
            netProfitEl.className = "font-mono text-xl text-rose-600 dark:text-rose-500";
            netContainer.className = "flex justify-between font-outfit font-extrabold text-lg bg-rose-50 dark:bg-rose-950/20 p-5 rounded-2xl text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/30 mt-6";
        }
    },
    
    renderSalesLog() {
        const tbody = document.getElementById('sales-log-tbody');
        tbody.innerHTML = '';
        
        // Order by date desc
        const sorted = [...AppStore.sales].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sorted.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-10 text-slate-400">No sales recorded yet.</td>
                </tr>
            `;
            return;
        }
        
        sorted.forEach(s => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors";
            
            const isWholesale = s.type === 'wholesale';
            const modeClass = isWholesale 
                ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400' 
                : 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400';
            const modeText = isWholesale ? 'Wholesale' : 'Retail';
            
            const payClass = s.paymentMethod === 'credit'
                ? 'text-amber-600 dark:text-amber-500 font-bold'
                : 'text-slate-500 dark:text-slate-400';
            
            tr.innerHTML = `
                <td class="py-3 px-6 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">${s.invoiceNo}</td>
                <td class="py-3 px-6 text-xs text-slate-400 font-mono">${new Date(s.date).toLocaleString()}</td>
                <td class="py-3 px-6 font-semibold text-xs">${s.customerName}</td>
                <td class="py-3 px-6 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${modeClass}">${modeText}</span>
                </td>
                <td class="py-3 px-6 text-center">
                    <span class="text-[10px] font-bold uppercase ${payClass}">${s.paymentMethod}</span>
                </td>
                <td class="py-3 px-6 text-right font-mono text-xs">LKR ${s.subtotal.toFixed(2)}</td>
                <td class="py-3 px-6 text-right font-mono text-xs text-red-500">-LKR ${s.discount.toFixed(2)}</td>
                <td class="py-3 px-6 text-right font-mono text-xs">LKR ${s.tax.toFixed(2)}</td>
                <td class="py-3 px-6 text-right font-mono font-bold text-xs">LKR ${s.total.toFixed(2)}</td>
                <td class="py-3 px-6 text-center">
                    <button onclick="ReportsView.reprintReceipt('${s.invoiceNo}')" class="p-1 text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all" title="View/Reprint Invoice">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        lucide.createIcons();
    },
    
    reprintReceipt(invoiceNo) {
        const sale = AppStore.sales.find(s => s.invoiceNo === invoiceNo);
        if (sale) {
            POSView.renderReceiptModal(sale);
        }
    },
    
    saveExpense() {
        const category = document.getElementById('exp-category').value;
        const desc = document.getElementById('exp-desc').value.trim();
        const amount = parseFloat(document.getElementById('exp-amount').value);
        
        if (!desc || amount <= 0) {
            AppUI.notify('Validation Error', 'Fill description and valid amount.', 'error');
            return;
        }
        
        const newExpense = {
            id: 'e_' + Date.now(),
            date: new Date().toISOString(),
            category: category,
            amount: amount,
            desc: desc
        };
        
        AppStore.expenses.push(newExpense);
        AppStore.saveAll();
        
        document.getElementById('expense-bill-form').reset();
        this.renderExpensesLog();
        
        AppUI.notify('Expense Logged', `Recorded LKR ${amount.toFixed(2)} for ${category}.`);
    },
    
    renderExpensesLog() {
        const tbody = document.getElementById('expenses-log-tbody');
        tbody.innerHTML = '';
        
        // Sort descending date
        const sorted = [...AppStore.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sorted.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-6 text-slate-400">No operational expenses logged yet.</td>
                </tr>
            `;
            return;
        }
        
        sorted.forEach(e => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors";
            
            tr.innerHTML = `
                <td class="py-3 px-6 text-xs text-slate-400 font-mono">${new Date(e.date).toLocaleDateString()}</td>
                <td class="py-3 px-6 font-semibold text-xs text-brand-600 dark:text-brand-400">${e.category}</td>
                <td class="py-3 px-6 text-xs font-semibold">${e.desc}</td>
                <td class="py-3 px-6 text-right font-bold font-mono text-red-500">LKR ${e.amount.toFixed(2)}</td>
                <td class="py-3 px-6 text-center">
                    <button onclick="ReportsView.deleteExpense('${e.id}')" class="p-1 text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all" title="Delete record">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        lucide.createIcons();
    },
    
    deleteExpense(id) {
        const e = AppStore.expenses.find(exp => exp.id === id);
        if (!e) return;
        
        Swal.fire({
            title: 'Delete Expense?',
            text: `Are you sure you want to delete the expense of LKR ${e.amount.toFixed(2)} for ${e.category}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it'
        }).then(res => {
            if (res.isConfirmed) {
                AppStore.expenses = AppStore.expenses.filter(exp => exp.id !== id);
                AppStore.saveAll();
                this.renderExpensesLog();
                AppUI.notify('Deleted!', 'Expense record removed.');
            }
        });
    }
};
window.ReportsView = ReportsView; // Expose globally for reprints
