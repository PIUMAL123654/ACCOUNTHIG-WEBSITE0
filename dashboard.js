/**
 * ABC PVT.LTD - Dashboard Analytics & Metrics View
 */

const DashboardView = {
    performanceChartInstance: null,
    salesSplitChartInstance: null,
    
    init() {
        this.render();
    },
    
    render() {
        this.renderStats();
        this.renderCharts();
        this.renderLowStockTable();
    },
    
    renderStats() {
        const salesTotal = AppStore.getSalesTotals();
        const cogsTotal = AppStore.getCOGSTotal();
        const expensesTotal = AppStore.getExpensesTotal();
        const netProfit = salesTotal.total - cogsTotal - expensesTotal;
        const lowStockCount = AppStore.getLowStockCount();
        
        // Populate stats with currency formatting
        document.getElementById('stat-sales').innerText = `LKR ${salesTotal.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('stat-cogs').innerText = `LKR ${cogsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('stat-expenses').innerText = `LKR ${expensesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        const profitEl = document.getElementById('stat-profit');
        profitEl.innerText = `LKR ${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (netProfit >= 0) {
            profitEl.className = "text-2xl font-bold font-outfit text-emerald-600 dark:text-emerald-400 mt-2";
        } else {
            profitEl.className = "text-2xl font-bold font-outfit text-rose-600 dark:text-rose-400 mt-2";
        }
        
        const lowStockEl = document.getElementById('stat-low-stock');
        lowStockEl.innerText = `${lowStockCount} Item${lowStockCount !== 1 ? 's' : ''}`;
        if (lowStockCount > 0) {
            lowStockEl.className = "text-2xl font-bold font-outfit text-rose-600 dark:text-rose-500 mt-2";
        } else {
            lowStockEl.className = "text-2xl font-bold font-outfit text-emerald-600 dark:text-emerald-400 mt-2";
        }
    },
    
    renderCharts() {
        this.renderPerformanceTrendChart();
        this.renderSalesSplitChart();
    },
    
    renderPerformanceTrendChart() {
        const ctx = document.getElementById('chart-performance-trend').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.performanceChartInstance) {
            this.performanceChartInstance.destroy();
        }
        
        // Calculate data points for the last 7 days
        const labels = [];
        const salesData = [];
        const purchaseData = [];
        
        const isDark = document.documentElement.classList.contains('dark');
        const gridColor = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Format labels like 'May 24'
            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            labels.push(label);
            
            // Filter transactions for this day
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));
            
            // Daily Sales
            const dailySales = AppStore.sales.filter(s => {
                const sDate = new Date(s.date);
                return sDate >= startOfDay && sDate <= endOfDay;
            }).reduce((sum, s) => sum + s.total, 0);
            
            // Daily Purchases
            const dailyPurchases = AppStore.purchases.filter(p => {
                const pDate = new Date(p.date);
                return pDate >= startOfDay && pDate <= endOfDay;
            }).reduce((sum, p) => sum + p.total, 0);
            
            salesData.push(dailySales);
            purchaseData.push(dailyPurchases);
        }
        
        // Create gradients
        const salesGradient = ctx.createLinearGradient(0, 0, 0, 300);
        salesGradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
        salesGradient.addColorStop(1, 'rgba(99, 102, 241, 0.00)');
        
        this.performanceChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Sales Revenue',
                        data: salesData,
                        borderColor: '#6366f1',
                        borderWidth: 3.5,
                        backgroundColor: salesGradient,
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#6366f1',
                        pointBorderColor: isDark ? '#0f172a' : '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Stock Purchase Costs',
                        data: purchaseData,
                        borderColor: '#f59e0b',
                        borderWidth: 2.5,
                        backgroundColor: 'transparent',
                        fill: false,
                        tension: 0.35,
                        borderDash: [5, 5],
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: isDark ? '#0f172a' : '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor,
                            font: { family: 'Inter', size: 11, weight: '500' }
                        }
                    },
                    tooltip: {
                        padding: 12,
                        titleFont: { family: 'Outfit', size: 12, weight: 'bold' },
                        bodyFont: { family: 'Inter', size: 12 },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += 'LKR ' + context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2 });
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            font: { family: 'Inter', size: 10 },
                            callback: function(value) {
                                return 'LKR ' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    },
    
    renderSalesSplitChart() {
        const ctx = document.getElementById('chart-sales-split').getContext('2d');
        
        if (this.salesSplitChartInstance) {
            this.salesSplitChartInstance.destroy();
        }
        
        const salesTotals = AppStore.getSalesTotals();
        
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#94a3b8' : '#64748b';
        
        // Handle empty database case
        const retailVal = salesTotals.retail;
        const wholesaleVal = salesTotals.wholesale;
        
        const isEmpty = retailVal === 0 && wholesaleVal === 0;
        const chartData = isEmpty ? [50, 50] : [retailVal, wholesaleVal];
        const chartColors = isEmpty 
            ? ['rgba(148, 163, 184, 0.2)', 'rgba(148, 163, 184, 0.1)']
            : ['#4f46e5', '#a78bfa'];
            
        this.salesSplitChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: isEmpty ? ['No Sales Data', ''] : ['Retail Sales', 'Wholesale Sales'],
                datasets: [{
                    data: chartData,
                    backgroundColor: chartColors,
                    borderWidth: isDark ? 3 : 2,
                    borderColor: isDark ? '#1e293b' : '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            font: { family: 'Inter', size: 11, weight: '500' },
                            padding: 16
                        }
                    },
                    tooltip: {
                        enabled: !isEmpty,
                        callbacks: {
                            label: function(context) {
                                const val = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((val / total) * 100).toFixed(1);
                                return ` LKR ${val.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    renderLowStockTable() {
        const tbody = document.getElementById('dashboard-lowstock-tbody');
        const alertBadge = document.getElementById('lbl-lowstock-badge');
        
        const lowStockItems = AppStore.products.filter(p => p.qty <= p.reorderLevel);
        
        alertBadge.innerText = `${lowStockItems.length} Warning${lowStockItems.length !== 1 ? 's' : ''}`;
        if (lowStockItems.length > 0) {
            alertBadge.className = "px-2.5 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-full animate-bounce";
        } else {
            alertBadge.className = "px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full";
        }
        
        if (lowStockItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-slate-400 dark:text-slate-500">
                        <i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2 text-emerald-500"></i>
                        <span>All products are well stocked. Excellent!</span>
                    </td>
                </tr>
            `;
            // Redraw icons
            lucide.createIcons();
            return;
        }
        
        tbody.innerHTML = '';
        lowStockItems.forEach(p => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors";
            
            const isOutOfStock = p.qty === 0;
            const statusClass = isOutOfStock 
                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' 
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400';
            const statusText = isOutOfStock ? 'Out of Stock' : 'Low Stock';
            
            tr.innerHTML = `
                <td class="py-3 px-6 font-mono text-xs font-semibold">${p.sku}</td>
                <td class="py-3 px-6 font-semibold">${p.name}</td>
                <td class="py-3 px-6 text-xs">${p.category}</td>
                <td class="py-3 px-6 text-right font-mono">LKR ${p.costPrice.toFixed(2)}</td>
                <td class="py-3 px-6 text-center font-bold font-mono">${p.reorderLevel}</td>
                <td class="py-3 px-6 text-center font-bold font-mono text-rose-600 dark:text-rose-400">${p.qty}</td>
                <td class="py-3 px-6 text-center">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}">${statusText}</span>
                </td>
                <td class="py-3 px-6 text-center">
                    <button onclick="DashboardView.triggerRestock('${p.sku}')" class="flex items-center gap-1.5 mx-auto px-3 py-1 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200/50 dark:border-brand-800 rounded-lg text-xs font-bold transition-all">
                        <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                        <span>Order Stock</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        lucide.createIcons();
    },
    
    triggerRestock(sku) {
        // Find purchases link in nav
        const purchaseNavItem = document.querySelector('[data-tab="purchases"]');
        if (purchaseNavItem) {
            purchaseNavItem.click();
            
            // Set product selector in restock form
            setTimeout(() => {
                const selectEl = document.getElementById('purch-product');
                if (selectEl) {
                    selectEl.value = sku;
                    // Trigger change event to load cost
                    selectEl.dispatchEvent(new Event('change'));
                }
            }, 100);
        }
    }
};
