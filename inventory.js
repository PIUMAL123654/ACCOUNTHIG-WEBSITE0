/**
 * ABC PVT.LTD - Inventory Management Controller
 */

const InventoryView = {
    init() {
        this.setupEventListeners();
        this.render();
    },
    
    setupEventListeners() {
        // Search & Filter
        document.getElementById('inventory-search').addEventListener('input', () => this.renderTable());
        document.getElementById('inventory-filter-category').addEventListener('change', () => this.renderTable());
        
        // Modal toggling
        const modal = document.getElementById('modal-product');
        
        document.getElementById('btn-add-product').addEventListener('click', () => {
            document.getElementById('product-form').reset();
            document.getElementById('prod-index').value = '';
            document.getElementById('product-modal-title').innerText = 'Add New Product';
            document.getElementById('prod-sku').readOnly = false;
            document.getElementById('prod-sku').classList.remove('cursor-not-allowed', 'bg-slate-100', 'dark:bg-slate-950/40');
            modal.classList.remove('hidden');
        });
        
        document.getElementById('btn-close-product').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        // Form submit
        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });
    },
    
    render() {
        this.renderCategoryFilters();
        this.renderTable();
    },
    
    renderCategoryFilters() {
        const select = document.getElementById('inventory-filter-category');
        const categories = [...new Set(AppStore.products.map(p => p.category))];
        
        select.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => {
            select.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    },
    
    renderTable() {
        const tbody = document.getElementById('inventory-tbody');
        const searchVal = document.getElementById('inventory-search').value.toLowerCase();
        const catFilter = document.getElementById('inventory-filter-category').value;
        
        let filtered = AppStore.products;
        
        if (searchVal) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchVal) || p.sku.toLowerCase().includes(searchVal));
        }
        
        if (catFilter) {
            filtered = filtered.filter(p => p.category === catFilter);
        }
        
        tbody.innerHTML = '';
        
        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-10 text-slate-400">
                        <i data-lucide="package-x" class="w-10 h-10 mx-auto mb-2 text-slate-500"></i>
                        <span>No products match the search.</span>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }
        
        filtered.forEach((p, idx) => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors";
            
            // Stock levels class
            let statusClass = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400';
            let statusText = 'In Stock';
            
            if (p.qty === 0) {
                statusClass = 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400';
                statusText = 'Out of Stock';
            } else if (p.qty <= p.reorderLevel) {
                statusClass = 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400';
                statusText = 'Low Stock';
            }
            
            tr.innerHTML = `
                <td class="py-3.5 px-6 font-mono text-xs font-semibold">${p.sku}</td>
                <td class="py-3.5 px-6 font-bold">${p.name}</td>
                <td class="py-3.5 px-6 text-xs text-slate-500">${p.category}</td>
                <td class="py-3.5 px-6 text-right font-mono">LKR ${p.costPrice.toFixed(2)}</td>
                <td class="py-3.5 px-6 text-right font-mono font-semibold text-brand-600 dark:text-brand-400">LKR ${p.retailPrice.toFixed(2)}</td>
                <td class="py-3.5 px-6 text-right font-mono font-semibold text-violet-600 dark:text-violet-400">LKR ${p.wholesalePrice.toFixed(2)}</td>
                <td class="py-3.5 px-6 text-center font-bold font-mono">${p.qty}</td>
                <td class="py-3.5 px-6 text-center font-mono text-slate-400">${p.reorderLevel}</td>
                <td class="py-3.5 px-6 text-center">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}">${statusText}</span>
                </td>
                <td class="py-3.5 px-6 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="InventoryView.editProduct('${p.sku}')" class="p-1 text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all" title="Edit Prices/Details">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="InventoryView.deleteProduct('${p.sku}')" class="p-1 text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all" title="Delete Product">
                            <i data-lucide="trash" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        lucide.createIcons();
    },
    
    editProduct(sku) {
        const p = AppStore.products.find(prod => prod.sku === sku);
        if (!p) return;
        
        // Open Modal
        document.getElementById('prod-index').value = sku; // use sku as index flag
        document.getElementById('product-modal-title').innerText = `Edit Product: ${p.sku}`;
        
        const skuInput = document.getElementById('prod-sku');
        skuInput.value = p.sku;
        skuInput.readOnly = true;
        skuInput.classList.add('cursor-not-allowed', 'bg-slate-100', 'dark:bg-slate-950/40');
        
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-category').value = p.category;
        document.getElementById('prod-cost').value = p.costPrice;
        document.getElementById('prod-retail').value = p.retailPrice;
        document.getElementById('prod-wholesale').value = p.wholesalePrice;
        document.getElementById('prod-qty').value = p.qty;
        document.getElementById('prod-reorder').value = p.reorderLevel;
        
        document.getElementById('modal-product').classList.remove('hidden');
    },
    
    saveProduct() {
        const skuEditKey = document.getElementById('prod-index').value;
        const sku = document.getElementById('prod-sku').value.trim();
        const name = document.getElementById('prod-name').value.trim();
        const category = document.getElementById('prod-category').value.trim();
        const costPrice = parseFloat(document.getElementById('prod-cost').value);
        const retailPrice = parseFloat(document.getElementById('prod-retail').value);
        const wholesalePrice = parseFloat(document.getElementById('prod-wholesale').value);
        const qty = parseInt(document.getElementById('prod-qty').value);
        const reorderLevel = parseInt(document.getElementById('prod-reorder').value);
        
        if (skuEditKey) {
            // Edit existing product
            const p = AppStore.products.find(prod => prod.sku === skuEditKey);
            if (p) {
                p.name = name;
                p.category = category;
                p.costPrice = costPrice;
                p.retailPrice = retailPrice;
                p.wholesalePrice = wholesalePrice;
                p.qty = qty;
                p.reorderLevel = reorderLevel;
                
                AppUI.notify('Product Updated', `${name} successfully updated.`);
            }
        } else {
            // Check for duplicate SKU
            const duplicate = AppStore.products.some(p => p.sku.toLowerCase() === sku.toLowerCase());
            if (duplicate) {
                Swal.fire({
                    title: 'Duplicate SKU',
                    text: `A product with SKU '${sku}' already exists in your supermarket inventory.`,
                    icon: 'error',
                    confirmButtonColor: '#4f46e5'
                });
                return;
            }
            
            // Add new product
            AppStore.products.push({
                sku,
                name,
                category,
                costPrice,
                retailPrice,
                wholesalePrice,
                qty,
                reorderLevel
            });
            
            AppUI.notify('Product Created', `${name} added to catalog.`);
        }
        
        AppStore.saveAll();
        document.getElementById('modal-product').classList.add('hidden');
        this.render();
    },
    
    deleteProduct(sku) {
        const p = AppStore.products.find(prod => prod.sku === sku);
        if (!p) return;
        
        Swal.fire({
            title: 'Delete Product?',
            text: `Are you sure you want to remove '${p.name}' from your supermarket inventory? This cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it'
        }).then(res => {
            if (res.isConfirmed) {
                AppStore.products = AppStore.products.filter(prod => prod.sku !== sku);
                AppStore.saveAll();
                this.render();
                AppUI.notify('Deleted!', 'Product removed from database.');
            }
        });
    }
};
