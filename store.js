/**
 * ABC PVT.LTD - Supermarket POS & Accounting Database Store
 */

const AppStore = {
    // Database Cache
    products: [],
    sales: [],
    purchases: [],
    customers: [],
    suppliers: [],
    expenses: [],
    
    // LocalStorage Keys
    KEYS: {
        PRODUCTS: 'abc_pos_products',
        SALES: 'abc_pos_sales',
        PURCHASES: 'abc_pos_purchases',
        CUSTOMERS: 'abc_pos_customers',
        SUPPLIERS: 'abc_pos_suppliers',
        EXPENSES: 'abc_pos_expenses'
    },
    
    init() {
        this.loadAll();
        // If the database is completely empty, initialize default empty lists or seed basics
        if (this.products.length === 0) {
            this.seedBasics();
        }
    },
    
    loadAll() {
        this.products = this.getItem(this.KEYS.PRODUCTS, []);
        this.sales = this.getItem(this.KEYS.SALES, []);
        this.purchases = this.getItem(this.KEYS.PURCHASES, []);
        this.customers = this.getItem(this.KEYS.CUSTOMERS, []);
        this.suppliers = this.getItem(this.KEYS.SUPPLIERS, []);
        this.expenses = this.getItem(this.KEYS.EXPENSES, []);
    },
    
    saveAll() {
        this.setItem(this.KEYS.PRODUCTS, this.products);
        this.setItem(this.KEYS.SALES, this.sales);
        this.setItem(this.KEYS.PURCHASES, this.purchases);
        this.setItem(this.KEYS.CUSTOMERS, this.customers);
        this.setItem(this.KEYS.SUPPLIERS, this.suppliers);
        this.setItem(this.KEYS.EXPENSES, this.expenses);
    },
    
    getItem(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`Error reading key ${key} from LocalStorage`, e);
            return defaultValue;
        }
    },
    
    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error writing key ${key} to LocalStorage`, e);
        }
    },
    
    seedBasics() {
        // Initial setup has clean blank templates for customer/suppliers
        this.customers = [
            { id: 'c1', name: 'Jayasinghe Stores (Gampaha)', contact: '0771234567', balance: 0 },
            { id: 'c2', name: 'Perera & Sons Retailers', contact: '0719876543', balance: 0 },
            { id: 'c3', name: 'Negombo Cooperative Society', contact: '0312233445', balance: 0 },
            { id: 'c4', name: 'Liyanage Supermart', contact: '0754433221', balance: 0 }
        ];
        
        this.suppliers = [
            { id: 's1', name: 'Keells Distributors (Negombo)', contact: '0317772211', balance: 0 },
            { id: 's2', name: 'Fonterra Brands Lanka', contact: '0112345600', balance: 0 },
            { id: 's3', name: 'Prima Ceylon Limited', contact: '0114778899', balance: 0 },
            { id: 's4', name: 'Unilever Sri Lanka', contact: '0112233990', balance: 0 }
        ];
        
        this.products = [
            { sku: 'KCS001', name: 'Keells Chicken Sausage 500g', category: 'Meat & Fish', costPrice: 900, retailPrice: 1100, wholesalePrice: 1000, qty: 50, reorderLevel: 10 },
            { sku: 'AMP002', name: 'Anchor Milk Powder 400g', category: 'Dairy', costPrice: 1100, retailPrice: 1350, wholesalePrice: 1250, qty: 40, reorderLevel: 15 },
            { sku: 'PSN003', name: 'Prima Stella Noodles 80g', category: 'Groceries', costPrice: 120, retailPrice: 160, wholesalePrice: 140, qty: 65, reorderLevel: 20 },
            { sku: 'STP004', name: 'Signal Toothpaste 120g', category: 'Personal Care', costPrice: 220, retailPrice: 290, wholesalePrice: 260, qty: 30, reorderLevel: 12 },
            { sku: 'DTB005', name: 'Dilmah Tea Bags 50s', category: 'Beverages', costPrice: 450, retailPrice: 580, wholesalePrice: 520, qty: 15, reorderLevel: 10 }
        ];
        
        this.saveAll();
    },
    
    // Financial Calculations
    getSalesTotals(filteredSales = null) {
        const list = filteredSales || this.sales;
        let retailTotal = 0;
        let wholesaleTotal = 0;
        
        list.forEach(sale => {
            if (sale.type === 'wholesale') {
                wholesaleTotal += sale.total;
            } else {
                retailTotal += sale.total;
            }
        });
        
        return {
            retail: retailTotal,
            wholesale: wholesaleTotal,
            total: retailTotal + wholesaleTotal
        };
    },
    
    getCOGSTotal(filteredSales = null) {
        const list = filteredSales || this.sales;
        let totalCOGS = 0;
        
        list.forEach(sale => {
            sale.items.forEach(item => {
                // Use purchase price at the time of sale, or fall back to current product costPrice
                const cost = item.costPrice || 0;
                totalCOGS += (cost * item.qty);
            });
        });
        
        return totalCOGS;
    },
    
    getExpensesTotal(filteredExpenses = null) {
        const list = filteredExpenses || this.expenses;
        return list.reduce((sum, exp) => sum + exp.amount, 0);
    },
    
    getOutstandingReceivable() {
        return this.customers.reduce((sum, c) => sum + (c.balance || 0), 0);
    },
    
    getOutstandingPayable() {
        return this.suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);
    },
    
    getInventoryValue() {
        return this.products.reduce((sum, p) => sum + (p.costPrice * p.qty), 0);
    },
    
    getLowStockCount() {
        return this.products.filter(p => p.qty <= p.reorderLevel).length;
    },
    
    // Generate Mock Sales and Purchases over 7 days
    generateMockData() {
        localStorage.clear();
        
        // 1. Seed Core entities
        this.seedBasics();
        
        // 2. Add extra products
        this.products.push(
            { sku: 'SCC006', name: 'Munchee Super Cream Crackers', category: 'Snacks', costPrice: 300, retailPrice: 380, wholesalePrice: 340, qty: 6, reorderLevel: 15 }, // Low stock!
            { sku: 'SBS007', name: 'Sunlight Lemon Soap 110g', category: 'Personal Care', costPrice: 90, retailPrice: 120, wholesalePrice: 110, qty: 4, reorderLevel: 12 }, // Low stock!
            { sku: 'WIP008', name: 'Watawala Tea Powder 400g', category: 'Beverages', costPrice: 620, retailPrice: 750, wholesalePrice: 700, qty: 45, reorderLevel: 8 },
            { sku: 'BRS009', name: 'Red Raw Rice 1kg', category: 'Groceries', costPrice: 200, retailPrice: 240, wholesalePrice: 220, qty: 150, reorderLevel: 30 }
        );
        
        // 3. Generate Historical Purchases
        const baseDate = new Date();
        this.purchases = [];
        
        const purchaseEvents = [
            { daysAgo: 6, supplierId: 's1', sku: 'KCS001', cost: 900, qty: 50, bill: 'BILL-1002', status: 'paid' },
            { daysAgo: 5, supplierId: 's2', sku: 'AMP002', cost: 1100, qty: 30, bill: 'BILL-1003', status: 'paid' },
            { daysAgo: 4, supplierId: 's3', sku: 'BRS009', cost: 200, qty: 200, bill: 'BILL-1004', status: 'credit' },
            { daysAgo: 3, supplierId: 's4', sku: 'STP004', cost: 220, qty: 50, bill: 'BILL-1005', status: 'paid' },
            { daysAgo: 2, supplierId: 's1', sku: 'DTB005', cost: 450, qty: 20, bill: 'BILL-1006', status: 'credit' },
            { daysAgo: 1, supplierId: 's3', sku: 'PSN003', cost: 120, qty: 100, bill: 'BILL-1007', status: 'paid' }
        ];
        
        purchaseEvents.forEach(pe => {
            const date = new Date();
            date.setDate(baseDate.getDate() - pe.daysAgo);
            
            const p = this.products.find(prod => prod.sku === pe.sku);
            const total = pe.cost * pe.qty;
            
            this.purchases.push({
                billNo: pe.bill,
                date: date.toISOString(),
                productSku: pe.sku,
                productName: p.name,
                costPrice: pe.cost,
                qty: pe.qty,
                total: total,
                supplierId: pe.supplierId,
                supplierName: this.suppliers.find(s => s.id === pe.supplierId).name,
                status: pe.status
            });
            
            // If credit, adjust supplier balance
            if (pe.status === 'credit') {
                const s = this.suppliers.find(sup => sup.id === pe.supplierId);
                if (s) s.balance += total;
            }
        });
        
        // 4. Generate Historical Sales Invoices
        this.sales = [];
        let invoiceCounter = 4920;
        
        const salesEvents = [
            // Days Ago 6
            { daysAgo: 6, type: 'retail', items: [{ sku: 'KCS001', qty: 2, price: 1100, cost: 900 }, { sku: 'AMP002', qty: 1, price: 1350, cost: 1100 }], pay: 'cash', customerId: 'walkin' },
            { daysAgo: 6, type: 'wholesale', items: [{ sku: 'PSN003', qty: 50, price: 140, cost: 120 }, { sku: 'STP004', qty: 10, price: 260, cost: 220 }], pay: 'credit', customerId: 'c1' },
            // Days Ago 5
            { daysAgo: 5, type: 'retail', items: [{ sku: 'BRS009', qty: 5, price: 240, cost: 200 }, { sku: 'SCC006', qty: 2, price: 380, cost: 300 }], pay: 'card', customerId: 'walkin' },
            { daysAgo: 5, type: 'wholesale', items: [{ sku: 'AMP002', qty: 20, price: 1250, cost: 1100 }], pay: 'credit', customerId: 'c2' },
            // Days Ago 4
            { daysAgo: 4, type: 'retail', items: [{ sku: 'DTB005', qty: 2, price: 580, cost: 450 }, { sku: 'STP004', qty: 1, price: 290, cost: 220 }], pay: 'cash', customerId: 'walkin' },
            { daysAgo: 4, type: 'wholesale', items: [{ sku: 'BRS009', qty: 100, price: 220, cost: 200 }, { sku: 'KCS001', qty: 15, price: 1000, cost: 900 }], pay: 'cash', customerId: 'c3' },
            // Days Ago 3
            { daysAgo: 3, type: 'retail', items: [{ sku: 'AMP002', qty: 2, price: 1350, cost: 1100 }, { sku: 'WIP008', qty: 1, price: 750, cost: 620 }], pay: 'cash', customerId: 'walkin' },
            { daysAgo: 3, type: 'wholesale', items: [{ sku: 'SCC006', qty: 30, price: 340, cost: 300 }], pay: 'credit', customerId: 'c4' },
            // Days Ago 2
            { daysAgo: 2, type: 'retail', items: [{ sku: 'BRS009', qty: 10, price: 240, cost: 200 }, { sku: 'PSN003', qty: 10, price: 160, cost: 120 }], pay: 'card', customerId: 'walkin' },
            { daysAgo: 2, type: 'wholesale', items: [{ sku: 'STP004', qty: 25, price: 260, cost: 220 }, { sku: 'WIP008', qty: 10, price: 700, cost: 620 }], pay: 'credit', customerId: 'c1' },
            // Days Ago 1
            { daysAgo: 1, type: 'retail', items: [{ sku: 'KCS001', qty: 3, price: 1100, cost: 900 }, { sku: 'SBS007', qty: 4, price: 120, cost: 90 }], pay: 'cash', customerId: 'walkin' },
            { daysAgo: 1, type: 'wholesale', items: [{ sku: 'AMP002', qty: 15, price: 1250, cost: 1100 }, { sku: 'BRS009', qty: 50, price: 220, cost: 200 }], pay: 'cash', customerId: 'c2' }
        ];
        
        salesEvents.forEach(se => {
            invoiceCounter++;
            const date = new Date();
            date.setDate(baseDate.getDate() - se.daysAgo);
            
            let subtotal = 0;
            const items = se.items.map(item => {
                const p = this.products.find(prod => prod.sku === item.sku);
                const lineTotal = item.price * item.qty;
                subtotal += lineTotal;
                
                // Deduct inventory stock quantity dynamically
                if (p) {
                    p.qty = Math.max(0, p.qty - item.qty);
                }
                
                return {
                    sku: item.sku,
                    name: p ? p.name : 'Unknown Item',
                    price: item.price,
                    costPrice: item.cost,
                    qty: item.qty,
                    total: lineTotal
                };
            });
            
            // Standard small discount (e.g. 2%) or flat discount
            const discount = parseFloat((subtotal * 0.02).toFixed(2));
            const tax = 0;
            const netTotal = subtotal - discount + tax;
            
            this.sales.push({
                invoiceNo: `INV-${invoiceCounter}`,
                date: date.toISOString(),
                customerId: se.customerId,
                customerName: se.customerId === 'walkin' ? 'Walk-in Customer' : this.customers.find(c => c.id === se.customerId).name,
                type: se.type,
                items: items,
                subtotal: subtotal,
                discount: discount,
                tax: tax,
                total: netTotal,
                paymentMethod: se.pay
            });
            
            // If credit, adjust customer credit balance
            if (se.pay === 'credit' && se.customerId !== 'walkin') {
                const c = this.customers.find(cust => cust.id === se.customerId);
                if (c) c.balance += netTotal;
            }
        });
        
        // 5. Generate Expenses
        this.expenses = [
            { id: 'e1', date: new Date(baseDate.getTime() - 5*24*60*60*1000).toISOString(), category: 'Rent', amount: 45000, desc: 'Negombo Shop Rent (May 2026)' },
            { id: 'e2', date: new Date(baseDate.getTime() - 3*24*60*60*1000).toISOString(), category: 'Electricity', amount: 22500, desc: 'Ceylon Electricity Board Bill' },
            { id: 'e3', date: new Date(baseDate.getTime() - 1*24*60*60*1000).toISOString(), category: 'Salaries', amount: 120000, desc: 'Staff Wages (2 Cashiers)' }
        ];
        
        this.saveAll();
    }
};
