/**
 * ABC PVT.LTD - Purchases & Restocking Controller
 */

const PurchasesView = {
    paymentStatus: 'paid', // 'paid' or 'credit'
    
    init() {
        this.setupEventListeners();
        this.render();
    },
    
    setupEventListeners() {
        // Toggle Payment status
        const btnPaid = document.getElementById('btn-purch-paid');
        const btnCredit = document.getElementById('btn-purch-credit');
        
        btnPaid.addEventListener('click', () => {
            this.paymentStatus = 'paid';
            btnPaid.className = "py-2 text-xs font-bold rounded-lg transition-all bg-emerald-600 text-white shadow-sm flex items-center justify-center gap-1";
            btnCredit.className = "py-2 text-xs font-bold rounded-lg transition-all hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1";
        });
        
        btnCredit.addEventListener('click', () => {
            this.paymentStatus = 'credit';
            btnCredit.className = "py-2 text-xs font-bold rounded-lg transition-all bg-amber-600 text-white shadow-sm flex items-center justify-center gap-1";
            btnPaid.className = "py-2 text-xs font-bold rounded-lg transition-all hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1";
        });
        
        // Add Supplier Button
        document.getElementById('btn-add-supplier').addEventListener('click', () => this.quickAddSupplier());
        
        // Product Selection Change -> Prepopulate Prices
        document.getElementById('purch-product').addEventListener('change', (e) => {
            const sku = e.target.value;
            const p = AppStore.products.find(prod => prod.sku === sku);
            if (p) {
                document.getElementById('purch-cost').value = p.costPrice;
                document.getElementById('purch-retail-price').value = p.retailPrice;
                document.getElementById('purch-wholesale-price').value = p.wholesalePrice;
            } else {
                document.getElementById('purch-cost').value = '';
                document.getElementById('purch-retail-price').value = '';
                document.getElementById('purch-wholesale-price').value = '';
            }
        });
        
        // Form Submit
        document.getElementById('purchase-bill-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePurchase();
        });
    },
    
    render() {
        this.renderSupplierSelect();
        this.renderProductSelect();
        this.renderPurchaseHistory();
    },
    
    renderSupplierSelect() {
        const select = document.getElementById('purch-supplier');
        select.innerHTML = '<option value="">Select Supplier</option>';
        
        AppStore.suppliers.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.name} (Bal: LKR ${s.balance.toFixed(2)})</option>`;
        });
    },
    
    renderProductSelect() {
        const select = document.getElementById('purch-product');
        select.innerHTML = '<option value="">-- Choose Item --</option>';
        
        AppStore.products.forEach(p => {
            select.innerHTML += `<option value="${p.sku}">${p.name} (${p.sku})</option>`;
        });
    },
    
    quickAddSupplier() {
        Swal.fire({
            title: 'Add New Supplier',
            html: `
                <input id="swal-sup-name" class="swal2-input" placeholder="Supplier / Company Name">
                <input id="swal-sup-contact" class="swal2-input" placeholder="Contact Mobile">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#64748b',
            preConfirm: () => {
                const name = document.getElementById('swal-sup-name').value.trim();
                const contact = document.getElementById('swal-sup-contact').value.trim();
                if (!name || !contact) {
                    Swal.showValidationMessage('Please fill all fields');
                    return false;
                }
                return { name, contact };
            }
        }).then(res => {
            if (res.isConfirmed) {
                const newId = 's_' + Date.now();
                AppStore.suppliers.push({
                    id: newId,
                    name: res.value.name,
                    contact: res.value.contact,
                    balance: 0
                });
                AppStore.saveAll();
                
                this.renderSupplierSelect();
                document.getElementById('purch-supplier').value = newId;
                
                AppUI.notify('Supplier Added', `${res.value.name} is now available in database.`);
            }
        });
    },
    
    savePurchase() {
        const billNo = document.getElementById('purch-bill-no').value.trim();
        const supplierId = document.getElementById('purch-supplier').value;
        const sku = document.getElementById('purch-product').value;
        const costPrice = parseFloat(document.getElementById('purch-cost').value);
        const qty = parseInt(document.getElementById('purch-qty').value);
        const newRetail = parseFloat(document.getElementById('purch-retail-price').value);
        const newWholesale = parseFloat(document.getElementById('purch-wholesale-price').value);
        
        const p = AppStore.products.find(prod => prod.sku === sku);
        const s = AppStore.suppliers.find(sup => sup.id === supplierId);
        
        if (!p || !s) {
            AppUI.notify('Validation Error', 'Invalid product or supplier choice.', 'error');
            return;
        }
        
        const total = costPrice * qty;
        
        // 1. Record purchase entry
        const purchaseRecord = {
            billNo: billNo,
            date: new Date().toISOString(),
            productSku: sku,
            productName: p.name,
            costPrice: costPrice,
            qty: qty,
            total: total,
            supplierId: supplierId,
            supplierName: s.name,
            status: this.paymentStatus
        };
        
        // 2. Adjust Product Quantity & Update Price Levels
        p.qty += qty;
        p.costPrice = costPrice;
        p.retailPrice = newRetail;
        p.wholesalePrice = newWholesale;
        
        // 3. Adjust Supplier Accounts Payable Balance if bought on Credit
        if (this.paymentStatus === 'credit') {
            s.balance += total;
        }
        
        // Save database
        AppStore.purchases.push(purchaseRecord);
        AppStore.saveAll();
        
        // Reset Form
        document.getElementById('purchase-bill-form').reset();
        this.paymentStatus = 'paid';
        document.getElementById('btn-purch-paid').click();
        
        // Refresh grids
        this.render();
        
        AppUI.notify('Purchase Logged', `Stock updated for ${p.name}. Total: LKR ${total.toFixed(2)}`);
    },
    
    renderPurchaseHistory() {
        const tbody = document.getElementById('purchases-tbody');
        tbody.innerHTML = '';
        
        // Order purchases by date descending
        const sorted = [...AppStore.purchases].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sorted.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-10 text-slate-400">No purchase invoices recorded yet.</td>
                </tr>
            `;
            return;
        }
        
        sorted.forEach(p => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors";
            
            const isCredit = p.status === 'credit';
            const statusClass = isCredit 
                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' 
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400';
            const statusText = isCredit ? 'Outstanding Credit' : 'Paid in Full';
            
            tr.innerHTML = `
                <td class="py-3 px-6 text-xs text-slate-400">${new Date(p.date).toLocaleDateString()}</td>
                <td class="py-3 px-6 font-mono text-xs font-semibold">${p.billNo}</td>
                <td class="py-3 px-6">
                    <span class="font-semibold block text-xs">${p.productName}</span>
                    <span class="text-[9px] font-mono text-slate-400">${p.productSku}</span>
                </td>
                <td class="py-3 px-6 text-right font-mono">LKR ${p.costPrice.toFixed(2)}</td>
                <td class="py-3 px-6 text-center font-semibold font-mono">${p.qty}</td>
                <td class="py-3 px-6 text-right font-bold font-mono">LKR ${p.total.toFixed(2)}</td>
                <td class="py-3 px-6 text-xs font-semibold">${p.supplierName}</td>
                <td class="py-3 px-6 text-center">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">${statusText}</span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
};
