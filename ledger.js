/**
 * ABC PVT.LTD - Accounts Ledger Controller (Receivable & Payable)
 */

const LedgerView = {
    init() {
        this.setupEventListeners();
        this.render();
    },
    
    setupEventListeners() {
        // Modal cancel
        document.getElementById('btn-close-ledger').addEventListener('click', () => {
            document.getElementById('modal-ledger').classList.add('hidden');
        });
        
        // Ledger Settle form submit
        document.getElementById('ledger-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettlement();
        });
    },
    
    render() {
        this.renderReceivables();
        this.renderPayables();
    },
    
    renderReceivables() {
        const tbody = document.getElementById('ledger-customers-tbody');
        const totalEl = document.getElementById('ledger-receivable-total');
        
        let totalReceivable = AppStore.getOutstandingReceivable();
        totalEl.innerText = `Total: LKR ${totalReceivable.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        
        tbody.innerHTML = '';
        
        if (AppStore.customers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-6 text-slate-400">No customer records in database.</td>
                </tr>
            `;
            return;
        }
        
        AppStore.customers.forEach(c => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors";
            
            const balClass = c.balance > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400';
            
            tr.innerHTML = `
                <td class="py-3 px-6 font-semibold">${c.name}</td>
                <td class="py-3 px-6 text-xs text-slate-500 font-mono">${c.contact}</td>
                <td class="py-3 px-6 text-right font-mono ${balClass}">LKR ${c.balance.toFixed(2)}</td>
                <td class="py-3 px-6 text-center">
                    <button onclick="LedgerView.openSettleModal('${c.id}', 'customer')" class="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800 rounded-lg text-xs font-bold transition-all ${c.balance <= 0 ? 'opacity-40 pointer-events-none' : ''}">
                        Settle Payment
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },
    
    renderPayables() {
        const tbody = document.getElementById('ledger-suppliers-tbody');
        const totalEl = document.getElementById('ledger-payable-total');
        
        let totalPayable = AppStore.getOutstandingPayable();
        totalEl.innerText = `Total: LKR ${totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        
        tbody.innerHTML = '';
        
        if (AppStore.suppliers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-6 text-slate-400">No supplier records in database.</td>
                </tr>
            `;
            return;
        }
        
        AppStore.suppliers.forEach(s => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors";
            
            const balClass = s.balance > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400';
            
            tr.innerHTML = `
                <td class="py-3 px-6 font-semibold">${s.name}</td>
                <td class="py-3 px-6 text-xs text-slate-500 font-mono">${s.contact}</td>
                <td class="py-3 px-6 text-right font-mono ${balClass}">LKR ${s.balance.toFixed(2)}</td>
                <td class="py-3 px-6 text-center">
                    <button onclick="LedgerView.openSettleModal('${s.id}', 'supplier')" class="px-3 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800 rounded-lg text-xs font-bold transition-all ${s.balance <= 0 ? 'opacity-40 pointer-events-none' : ''}">
                        Settle Debt
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },
    
    openSettleModal(id, type) {
        let entity = null;
        if (type === 'customer') {
            entity = AppStore.customers.find(c => c.id === id);
            document.getElementById('ledger-modal-title').innerText = 'Record Outstanding Collection';
        } else {
            entity = AppStore.suppliers.find(s => s.id === id);
            document.getElementById('ledger-modal-title').innerText = 'Record Supplier Outstanding Payment';
        }
        
        if (!entity) return;
        
        document.getElementById('led-contact-id').value = id;
        document.getElementById('led-contact-type').value = type;
        document.getElementById('led-contact-name').value = entity.name;
        document.getElementById('led-contact-balance').value = entity.balance.toFixed(2);
        
        document.getElementById('led-pay-amount').value = '';
        document.getElementById('led-pay-amount').max = entity.balance;
        document.getElementById('led-remarks').value = '';
        
        document.getElementById('modal-ledger').classList.remove('hidden');
    },
    
    saveSettlement() {
        const id = document.getElementById('led-contact-id').value;
        const type = document.getElementById('led-contact-type').value;
        const settleAmt = parseFloat(document.getElementById('led-pay-amount').value);
        const remarks = document.getElementById('led-remarks').value.trim();
        
        let entity = null;
        if (type === 'customer') {
            entity = AppStore.customers.find(c => c.id === id);
        } else {
            entity = AppStore.suppliers.find(s => s.id === id);
        }
        
        if (!entity) return;
        
        if (settleAmt <= 0 || settleAmt > entity.balance) {
            Swal.fire({
                title: 'Invalid Amount',
                text: `Payment amount must be greater than zero and less than or equal to the outstanding balance of LKR ${entity.balance.toFixed(2)}.`,
                icon: 'error',
                confirmButtonColor: '#4f46e5'
            });
            return;
        }
        
        // Deduct balance
        entity.balance -= settleAmt;
        
        // If we pay a supplier credit, it is a cash outflow but not a direct P&L expense (since COGS was booked or stock is recorded).
        // However, if we want to log the cash collection, we can just save it.
        AppStore.saveAll();
        
        document.getElementById('modal-ledger').classList.add('hidden');
        this.render();
        
        AppUI.notify('Outstanding Settled', `LKR ${settleAmt.toFixed(2)} updated for ${entity.name}. Remarks: ${remarks}`);
    }
};
