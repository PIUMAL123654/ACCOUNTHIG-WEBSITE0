/**
 * ABC PVT.LTD - POS Terminal Controller
 */

const POSView = {
    cart: [],
    mode: 'retail', // 'retail' or 'wholesale'
    payMethod: 'cash',
    
    init() {
        this.setupEventListeners();
        this.render();
    },
    
    setupEventListeners() {
        // Search & Filter
        document.getElementById('pos-search').addEventListener('input', () => this.renderProductsGrid());
        document.getElementById('pos-filter-category').addEventListener('change', () => this.renderProductsGrid());
        
        // Mode Switchers
        const btnRetail = document.getElementById('btn-pos-retail');
        const btnWholesale = document.getElementById('btn-pos-wholesale');
        
        btnRetail.addEventListener('click', () => {
            this.mode = 'retail';
            btnRetail.className = "py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 bg-brand-600 text-white shadow-sm";
            btnWholesale.className = "py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 hover:bg-slate-800 text-slate-400 hover:text-white";
            this.updateCartPrices();
            this.renderCustomerSelect();
            this.calculateTotals();
        });
        
        btnWholesale.addEventListener('click', () => {
            this.mode = 'wholesale';
            btnWholesale.className = "py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 bg-brand-600 text-white shadow-sm";
            btnRetail.className = "py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 hover:bg-slate-800 text-slate-400 hover:text-white";
            this.updateCartPrices();
            this.renderCustomerSelect();
            this.calculateTotals();
        });
        
        // Quick Add Customer
        document.getElementById('btn-pos-add-customer').addEventListener('click', () => this.quickAddCustomer());
        
        // Payment methods
        const payBtns = document.querySelectorAll('.btn-pay-method');
        payBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                payBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.payMethod = btn.getAttribute('data-pay');
            });
        });
        
        // Inputs change
        document.getElementById('pos-discount').addEventListener('input', () => this.calculateTotals());
        document.getElementById('pos-tax').addEventListener('input', () => this.calculateTotals());
        
        // POS Actions
        document.getElementById('btn-pos-clear').addEventListener('click', () => this.clearCart());
        document.getElementById('btn-pos-checkout').addEventListener('click', () => this.processCheckout());
        
        // Modal Receipt Closing
        document.getElementById('btn-close-receipt').addEventListener('click', () => {
            document.getElementById('modal-receipt').classList.add('hidden');
        });
        
        document.getElementById('btn-print-receipt').addEventListener('click', () => {
            window.print();
        });
    },
    
    render() {
        this.renderCategoryFilter();
        this.renderProductsGrid();
        this.renderCustomerSelect();
        this.renderCart();
        this.generateInvoiceNo();
    },
    
    generateInvoiceNo() {
        const lastInvNo = AppStore.sales.length > 0 
            ? parseInt(AppStore.sales[AppStore.sales.length - 1].invoiceNo.split('-')[1]) 
            : 4920;
        document.getElementById('pos-invoice-no').innerText = `INV-${lastInvNo + 1}`;
    },
    
    renderCategoryFilter() {
        const select = document.getElementById('pos-filter-category');
        const categories = [...new Set(AppStore.products.map(p => p.category))];
        
        select.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => {
            select.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    },
    
    renderCustomerSelect() {
        const select = document.getElementById('pos-customer-select');
        select.innerHTML = '<option value="walkin">Walk-in Customer</option>';
        
        AppStore.customers.forEach(cust => {
            // For wholesale, we can select outstanding credit accounts
            select.innerHTML += `<option value="${cust.id}">${cust.name} (Bal: LKR ${cust.balance.toFixed(2)})</option>`;
        });
    },
    
    renderProductsGrid() {
        const grid = document.getElementById('pos-products-grid');
        const searchVal = document.getElementById('pos-search').value.toLowerCase();
        const catFilter = document.getElementById('pos-filter-category').value;
        
        let filtered = AppStore.products;
        
        if (searchVal) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchVal) || p.sku.toLowerCase().includes(searchVal));
        }
        
        if (catFilter) {
            filtered = filtered.filter(p => p.category === catFilter);
        }
        
        grid.innerHTML = '';
        
        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-10 text-slate-400">
                    <i data-lucide="package-search" class="w-8 h-8 mx-auto mb-2 text-slate-500"></i>
                    <p class="text-sm font-medium">No products found</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        filtered.forEach(p => {
            const price = this.mode === 'wholesale' ? p.wholesalePrice : p.retailPrice;
            const isLowStock = p.qty <= p.reorderLevel;
            const isOutOfStock = p.qty === 0;
            
            const card = document.createElement('div');
            card.className = `pos-product-card bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 cursor-pointer flex flex-col justify-between h-36 select-none ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`;
            
            card.innerHTML = `
                <div>
                    <div class="flex justify-between items-start gap-1">
                        <span class="text-[10px] text-slate-400 font-mono tracking-wider font-semibold">${p.sku}</span>
                        ${isLowStock ? `<span class="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">${isOutOfStock ? 'Sold Out' : 'Low'}</span>` : ''}
                    </div>
                    <h5 class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 line-clamp-2">${p.name}</h5>
                </div>
                <div class="flex justify-between items-end mt-2">
                    <div>
                        <div class="text-[9px] text-slate-400">Stock: <span class="font-bold">${p.qty}</span></div>
                        <div class="text-xs font-extrabold text-brand-600 dark:text-brand-400 font-mono">LKR ${price.toFixed(2)}</div>
                    </div>
                    <div class="bg-brand-600 hover:bg-brand-500 text-white p-1 rounded-lg">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => this.addToCart(p));
            grid.appendChild(card);
        });
        
        lucide.createIcons();
    },
    
    addToCart(product) {
        const existing = this.cart.find(item => item.sku === product.sku);
        const qtyInCart = existing ? existing.qty : 0;
        
        // Stock validation
        if (qtyInCart >= product.qty) {
            AppUI.notify('Stock Limit Reached', `Only ${product.qty} units available for ${product.name}`, 'warning');
            return;
        }
        
        if (existing) {
            existing.qty += 1;
        } else {
            const price = this.mode === 'wholesale' ? product.wholesalePrice : product.retailPrice;
            this.cart.push({
                sku: product.sku,
                name: product.name,
                price: price,
                costPrice: product.costPrice,
                qty: 1
            });
        }
        
        this.renderCart();
        this.calculateTotals();
        AppUI.notify('Added to Cart', `${product.name} added.`, 'success');
    },
    
    updateCartPrices() {
        this.cart.forEach(item => {
            const prod = AppStore.products.find(p => p.sku === item.sku);
            if (prod) {
                item.price = this.mode === 'wholesale' ? prod.wholesalePrice : prod.retailPrice;
            }
        });
        this.renderCart();
    },
    
    updateCartQty(sku, newQty) {
        const item = this.cart.find(i => i.sku === sku);
        if (!item) return;
        
        const prod = AppStore.products.find(p => p.sku === sku);
        if (newQty > prod.qty) {
            AppUI.notify('Stock Warning', `Only ${prod.qty} units available. Cap set.`, 'warning');
            item.qty = prod.qty;
        } else if (newQty <= 0) {
            this.removeFromCart(sku);
            return;
        } else {
            item.qty = parseInt(newQty);
        }
        
        this.renderCart();
        this.calculateTotals();
    },
    
    removeFromCart(sku) {
        this.cart = this.cart.filter(item => item.sku !== sku);
        this.renderCart();
        this.calculateTotals();
    },
    
    clearCart() {
        if (this.cart.length === 0) return;
        
        Swal.fire({
            title: 'Clear Cart?',
            text: 'Are you sure you want to empty the billing cart?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, clear it'
        }).then(res => {
            if (res.isConfirmed) {
                this.cart = [];
                this.renderCart();
                this.calculateTotals();
            }
        });
    },
    
    renderCart() {
        const container = document.getElementById('pos-cart-items');
        
        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                    <i data-lucide="shopping-bag" class="w-12 h-12 mb-3 text-slate-600"></i>
                    <span class="text-sm font-medium">Cart is empty</span>
                    <span class="text-xs text-slate-600 mt-1">Click items on the left to add</span>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        container.innerHTML = '';
        this.cart.forEach(item => {
            const div = document.createElement('div');
            div.className = "py-3 flex items-center justify-between text-xs gap-3";
            
            div.innerHTML = `
                <div class="flex-1 min-w-0">
                    <h6 class="font-semibold text-slate-100 truncate">${item.name}</h6>
                    <span class="text-[10px] text-slate-400 font-mono">LKR ${item.price.toFixed(2)} each</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <button onclick="POSView.updateCartQty('${item.sku}', ${item.qty - 1})" class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold">-</button>
                    <input type="number" value="${item.qty}" min="1" onchange="POSView.updateCartQty('${item.sku}', this.value)" class="w-10 bg-slate-800 border border-slate-700 rounded py-0.5 text-center font-semibold text-white font-mono">
                    <button onclick="POSView.updateCartQty('${item.sku}', ${item.qty + 1})" class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold">+</button>
                </div>
                <div class="text-right min-w-[70px]">
                    <div class="font-bold text-slate-200 font-mono">LKR ${(item.price * item.qty).toFixed(2)}</div>
                </div>
                <button onclick="POSView.removeFromCart('${item.sku}')" class="text-slate-500 hover:text-red-400 transition-colors">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            `;
            container.appendChild(div);
        });
        
        lucide.createIcons();
    },
    
    calculateTotals() {
        let subtotal = 0;
        this.cart.forEach(item => {
            subtotal += (item.price * item.qty);
        });
        
        // Parse discount
        const discInput = document.getElementById('pos-discount').value;
        let discount = 0;
        let isPerc = false;
        
        if (discInput) {
            if (discInput.endsWith('%')) {
                const percent = parseFloat(discInput.slice(0, -1));
                if (!isNaN(percent)) {
                    discount = parseFloat(((subtotal * percent) / 100).toFixed(2));
                    isPerc = true;
                    document.getElementById('pos-lbl-discount-perc').innerText = `${percent}%`;
                }
            } else {
                const amt = parseFloat(discInput);
                if (!isNaN(amt)) {
                    discount = amt;
                    document.getElementById('pos-lbl-discount-perc').innerText = `${((discount / subtotal) * 100).toFixed(0)}%`;
                }
            }
        } else {
            document.getElementById('pos-lbl-discount-perc').innerText = '0%';
        }
        
        // Limit discount
        discount = Math.min(subtotal, Math.max(0, discount));
        
        const taxPercent = parseFloat(document.getElementById('pos-tax').value) || 0;
        const subAfterDisc = subtotal - discount;
        const tax = parseFloat(((subAfterDisc * taxPercent) / 100).toFixed(2));
        const netTotal = subAfterDisc + tax;
        
        // Write to UI
        document.getElementById('pos-summary-subtotal').innerText = `LKR ${subtotal.toFixed(2)}`;
        document.getElementById('pos-summary-discount').innerText = `-LKR ${discount.toFixed(2)}`;
        document.getElementById('pos-summary-tax').innerText = `LKR ${tax.toFixed(2)}`;
        document.getElementById('pos-summary-total').innerText = `LKR ${netTotal.toFixed(2)}`;
    },
    
    quickAddCustomer() {
        Swal.fire({
            title: 'Add Wholesale Customer',
            html: `
                <input id="swal-cust-name" class="swal2-input" placeholder="Shop / Customer Name">
                <input id="swal-cust-contact" class="swal2-input" placeholder="Mobile / Tel No">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#64748b',
            preConfirm: () => {
                const name = document.getElementById('swal-cust-name').value.trim();
                const contact = document.getElementById('swal-cust-contact').value.trim();
                if (!name || !contact) {
                    Swal.showValidationMessage('Please fill all fields');
                    return false;
                }
                return { name, contact };
            }
        }).then(res => {
            if (res.isConfirmed) {
                const newId = 'c_' + Date.now();
                AppStore.customers.push({
                    id: newId,
                    name: res.value.name,
                    contact: res.value.contact,
                    balance: 0
                });
                AppStore.saveAll();
                
                // Refresh list & select newly created customer
                this.renderCustomerSelect();
                document.getElementById('pos-customer-select').value = newId;
                
                AppUI.notify('Customer Added', `${res.value.name} is now available in database.`);
            }
        });
    },
    
    processCheckout() {
        if (this.cart.length === 0) {
            AppUI.notify('Cart is empty', 'Add products before checkout', 'warning');
            return;
        }
        
        const customerId = document.getElementById('pos-customer-select').value;
        const invoiceNo = document.getElementById('pos-invoice-no').innerText;
        
        // Business Rule: Credit terms validation
        if (this.payMethod === 'credit' && customerId === 'walkin') {
            Swal.fire({
                title: 'Credit Denied',
                text: 'Outstanding credit invoices cannot be applied to a generic Walk-in customer. Please select or create a wholesale Customer Account.',
                icon: 'error',
                confirmButtonColor: '#4f46e5'
            });
            return;
        }
        
        const subtotal = parseFloat(document.getElementById('pos-summary-subtotal').innerText.replace('LKR ', ''));
        const discount = parseFloat(document.getElementById('pos-summary-discount').innerText.replace('-LKR ', ''));
        const tax = parseFloat(document.getElementById('pos-summary-tax').innerText.replace('LKR ', ''));
        const total = parseFloat(document.getElementById('pos-summary-total').innerText.replace('LKR ', ''));
        
        let customerName = 'Walk-in Customer';
        if (customerId !== 'walkin') {
            const c = AppStore.customers.find(cust => cust.id === customerId);
            if (c) customerName = c.name;
        }
        
        // Save sale record
        const saleRecord = {
            invoiceNo: invoiceNo,
            date: new Date().toISOString(),
            customerId: customerId,
            customerName: customerName,
            type: this.mode,
            items: [...this.cart],
            subtotal: subtotal,
            discount: discount,
            tax: tax,
            total: total,
            paymentMethod: this.payMethod
        };
        
        // Deduct inventory quantities & update stock values
        this.cart.forEach(item => {
            const p = AppStore.products.find(prod => prod.sku === item.sku);
            if (p) {
                p.qty = Math.max(0, p.qty - item.qty);
            }
        });
        
        // If payment method is credit, increment customer outstanding receivable balance
        if (this.payMethod === 'credit') {
            const c = AppStore.customers.find(cust => cust.id === customerId);
            if (c) {
                c.balance += total;
            }
        }
        
        // Save database
        AppStore.sales.push(saleRecord);
        AppStore.saveAll();
        
        // Show Invoice Receipt Modal
        this.renderReceiptModal(saleRecord);
        
        // ResetPOS State
        this.cart = [];
        this.renderCart();
        this.generateInvoiceNo();
        this.calculateTotals();
        
        // Refresh grids in background
        this.renderProductsGrid();
        
        AppUI.notify('Completed!', `Invoice ${invoiceNo} printed.`, 'success');
    },
    
    renderReceiptModal(sale) {
        document.getElementById('rec-date').innerText = new Date(sale.date).toLocaleString();
        document.getElementById('rec-invoice').innerText = sale.invoiceNo;
        document.getElementById('rec-customer').innerText = sale.customerName;
        document.getElementById('rec-mode').innerText = sale.type === 'wholesale' ? 'Wholesale Sale' : 'Retail Sale';
        document.getElementById('rec-pay').innerText = sale.paymentMethod.toUpperCase();
        
        const tbody = document.getElementById('rec-items-tbody');
        tbody.innerHTML = '';
        
        sale.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-1">${item.name}</td>
                <td class="py-1 text-center font-mono">${item.qty}</td>
                <td class="py-1 text-right font-mono">${item.price.toFixed(2)}</td>
                <td class="py-1 text-right font-mono">${(item.price * item.qty).toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
        
        document.getElementById('rec-subtotal').innerText = `LKR ${sale.subtotal.toFixed(2)}`;
        document.getElementById('rec-discount').innerText = `-LKR ${sale.discount.toFixed(2)}`;
        document.getElementById('rec-tax').innerText = `LKR ${sale.tax.toFixed(2)}`;
        document.getElementById('rec-total').innerText = `LKR ${sale.total.toFixed(2)}`;
        
        // Show Modal
        document.getElementById('modal-receipt').classList.remove('hidden');
    }
};
