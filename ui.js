/**
 * ABC PVT.LTD - UI Orchestrator & View Switcher
 */

const AppUI = {
    activeTab: 'dashboard',
    
    init() {
        this.setupTabNavigation();
        this.setupSidebarToggle();
        this.setupThemeToggle();
        this.setupClock();
        this.setupMockDataButton();
        this.loadThemePreference();
    },
    
    setupTabNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetTab = item.getAttribute('data-tab');
                if (targetTab === this.activeTab) return;
                
                // Remove active classes
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active to current
                item.classList.add('active');
                
                // Hide current view, show target view
                document.getElementById(`view-${this.activeTab}`).classList.add('hidden');
                document.getElementById(`view-${targetTab}`).classList.remove('hidden');
                
                this.activeTab = targetTab;
                
                // Set Title
                const viewTitleText = item.querySelector('span').innerText;
                document.getElementById('view-title').innerText = viewTitleText;
                
                // Refresh content of the specific view
                this.refreshActiveView();
                
                // If mobile view, close sidebar automatically on click
                if (window.innerWidth < 768) {
                    document.getElementById('sidebar').classList.add('-translate-x-full');
                }
            });
        });
    },
    
    setupSidebarToggle() {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        
        // Initial setup for responsiveness
        const handleResize = () => {
            if (window.innerWidth < 768) {
                sidebar.classList.add('-translate-x-full');
                sidebar.style.position = 'fixed';
                sidebar.style.height = '100%';
            } else {
                sidebar.classList.remove('-translate-x-full');
                sidebar.style.position = 'relative';
            }
        };
        
        window.addEventListener('resize', handleResize);
        handleResize(); // trigger once
        
        toggleBtn.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                if (sidebar.classList.contains('-translate-x-full')) {
                    sidebar.classList.remove('-translate-x-full');
                } else {
                    sidebar.classList.add('-translate-x-full');
                }
            } else {
                // Large screen toggle: toggle width
                if (sidebar.classList.contains('w-64')) {
                    sidebar.classList.remove('w-64');
                    sidebar.classList.add('w-20');
                    // Hide logo texts, labels
                    sidebar.querySelector('h1').classList.add('hidden');
                    sidebar.querySelector('span').classList.add('hidden');
                    sidebar.querySelectorAll('.nav-item span').forEach(s => s.classList.add('hidden'));
                } else {
                    sidebar.classList.remove('w-20');
                    sidebar.classList.add('w-64');
                    sidebar.querySelector('h1').classList.remove('hidden');
                    sidebar.querySelector('span').classList.remove('hidden');
                    sidebar.querySelectorAll('.nav-item span').forEach(s => s.classList.remove('hidden'));
                }
            }
        });
    },
    
    setupThemeToggle() {
        const themeBtn = document.getElementById('theme-toggle');
        
        themeBtn.addEventListener('click', () => {
            const html = document.documentElement;
            if (html.classList.contains('dark')) {
                html.classList.remove('dark');
                localStorage.setItem('abc_theme', 'light');
            } else {
                html.classList.add('dark');
                localStorage.setItem('abc_theme', 'dark');
            }
        });
    },
    
    loadThemePreference() {
        const theme = localStorage.getItem('abc_theme') || 'dark';
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },
    
    setupClock() {
        const timeEl = document.getElementById('live-time');
        const dateEl = document.getElementById('live-date');
        
        const updateTime = () => {
            const now = new Date();
            
            // Format Time (12 hour)
            timeEl.innerText = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
            
            // Format Date
            dateEl.innerText = now.toLocaleDateString('en-US', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        };
        
        updateTime();
        setInterval(updateTime, 1000);
    },
    
    setupMockDataButton() {
        const btn = document.getElementById('btn-generate-mock');
        
        btn.addEventListener('click', () => {
            Swal.fire({
                title: 'Generate Demo Data?',
                text: "This will overwrite your current inventory and transactions with 7 days of realistic supermarket data! Great for checking reports and P&L charts.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#4f46e5',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, generate it!'
            }).then((result) => {
                if (result.isConfirmed) {
                    AppStore.generateMockData();
                    AppStore.loadAll();
                    
                    Swal.fire({
                        title: 'Success!',
                        text: 'Demo data generated successfully.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    
                    // Refresh everything
                    this.refreshAllViews();
                }
            });
        });
    },
    
    refreshActiveView() {
        switch (this.activeTab) {
            case 'dashboard':
                DashboardView.render();
                break;
            case 'pos':
                POSView.render();
                break;
            case 'inventory':
                InventoryView.render();
                break;
            case 'purchases':
                PurchasesView.render();
                break;
            case 'ledger':
                LedgerView.render();
                break;
            case 'reports':
                ReportsView.render();
                break;
        }
    },
    
    refreshAllViews() {
        DashboardView.render();
        POSView.render();
        InventoryView.render();
        PurchasesView.render();
        LedgerView.render();
        ReportsView.render();
        
        // Re-render icons
        lucide.createIcons();
    },
    
    notify(title, text, icon = 'success') {
        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false,
            timerProgressBar: true
        });
    }
};
