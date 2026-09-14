        // ============================================================
        //  AETHER V9.0.6 - COMPLETE JAVASCRIPT ENGINE
        // ============================================================

        // ============================================================
        //  UTILITY FUNCTIONS
        // ============================================================
        function escapeHtml(text) {
            if (!text) return '';
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#0A84FF;',
                '/': '&#x2F;',
                '`': '&#x60;',
                '=': '&#x3D;'
            };
            return String(text).replace(/[&<>"'`=/]/g, function(s) { return map[s]; });
        }

        function escapeJsString(str) {
            if (!str) return '';
            return String(str)
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/"/g, '\\"')
                .replace(/`/g, '\\`')
                .replace(/\$/g, '\\$');
        }

        function safeEvaluate(expr) {
            const sanitized = expr.replace(/\s/g, '');
            if (!/^[\d+\-*/.()]+$/.test(sanitized)) {
                throw new Error('Invalid expression');
            }
            try {
                const result = new Function(`"use strict"; return (${sanitized})`)();
                if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                    return result;
                }
                throw new Error('Invalid result');
            } catch (e) {
                throw new Error('Calculation error');
            }
        }

        function clampMax(val, max) {
            if (max === undefined) max = 999999999;
            const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
            if (isNaN(num)) return 0;
            return Math.min(num, max);
        }

        // Auto-capitalize first letter
        function autoCapitalize(el) {
            if (!el || !el.value) return;
            const val = el.value;
            if (val.length > 0) {
                const first = val.charAt(0);
                if (first !== first.toUpperCase()) {
                    el.value = first.toUpperCase() + val.slice(1);
                }
            }
        }

        function autoCapitalizeEditor(el) {
            if (!el || !el.textContent) return;
            const first = el.textContent.charAt(0);
            if (first === first.toUpperCase()) return;
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            let node;
            let offset = 0;
            while (node = walker.nextNode()) {
                const len = node.textContent.length;
                if (offset + len > 0) {
                    if (offset === 0) {
                        node.textContent = first.toUpperCase() + node.textContent.slice(1);
                    }
                    break;
                }
                offset += len;
            }
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }

        // Toast system
        function showToast(message, type) {
            type = type || 'info';
            if (typeof t === 'function') message = t(message) || message;
            const container = document.getElementById('toastContainer');
            if (!container) return;
            const toast = document.createElement('div');
            toast.className = 'toast ' + type;
            toast.textContent = message;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'toastOut 0.3s ease forwards';
                setTimeout(() => { if (toast.parentNode) toast.remove(); }, 350);
            }, 3000);
        }

        // ============================================================
        //  CONSTANTS & DATA
        // ============================================================
        let APP_VERSION_CODE = "9.1.0";
        const MAX_INPUT_VALUE = Number.MAX_SAFE_INTEGER;

        async function syncVersionFromCache() {
            try {
                if (!('caches' in window)) return;
                const keys = await caches.keys();
                const cacheKey = keys.find(k => k.indexOf('aether-v') === 0);
                if (!cacheKey) return;
                const v = cacheKey.slice('aether-v'.length);
                if (!v || v === APP_VERSION_CODE) return;
                APP_VERSION_CODE = v;
                if (typeof LANG_STRINGS !== 'undefined' && LANG_STRINGS) {
                    if (LANG_STRINGS.en) LANG_STRINGS.en['app.version'] = 'Version ' + v;
                    if (LANG_STRINGS.ur) LANG_STRINGS.ur['app.version'] = '\u0648\u0631\u0698\u0646 ' + v;
                    if (LANG_STRINGS.ar) LANG_STRINGS.ar['app.version'] = '\u0627\u0644\u0625\u0635\u062f\u0627\u0631 ' + v;
                }
                document.querySelectorAll('.about-brand-version, .app-version-tag').forEach(el => {
                    if (el.classList.contains('app-version-tag')) el.textContent = 'v' + v;
                    else el.textContent = (typeof t === 'function') ? t('app.version') : ('Version ' + v);
                });
                if (typeof translateUI === 'function') translateUI();
            } catch (e) { /* ignore */ }
        }
        syncVersionFromCache();
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => setTimeout(syncVersionFromCache, 500));
        }

        // Version & device UUID managed by IndexedDB migration (db.js)

        const STANDARD_STATE_SETS = {
            "Attendance": { states: ["Present", "Absent", "Leave"], colors: ["#34C759", "#FF453A", "#FF9F0A"] },
            "Task Status": { states: ["In Progress", "Completed"], colors: ["#0A84FF", "#30D158"] },
            "Payment": { states: ["Paid", "Unpaid", "Partial"], colors: ["#30D158", "#FF3B30", "#FF9500"] },
            "Approval": { states: ["Approved", "Rejected"], colors: ["#34C759", "#FF453A"] },
            "Availability": { states: ["Available", "Busy", "Away"], colors: ["#30B0C7", "#FF375F", "#AF52DE"] },
            "Work Progress": { states: ["Started", "On Hold", "Finished"], colors: ["#64D2FF", "#FFD60A", "#34C759"] },
            "Order": { states: ["Ordered", "Shipped", "Delivered"], colors: ["#5856D6", "#64D2FF", "#40CBE0"] },
            "Delivery": { states: ["Out for Delivery", "Delivered"], colors: ["#FFD60A", "#30B0C7"] },
            "Account": { states: ["Active", "Inactive", "Suspended"], colors: ["#30D158", "#FF3B30", "#FF9500"] },
            "Priority": { states: ["Low", "Medium", "High"], colors: ["#BF5AF2", "#FFD60A", "#FF2D55"] },
            "Issue": { states: ["Open", "In Progress", "Closed"], colors: ["#64D2FF", "#0A84FF", "#8E8E93"] },
            "Booking": { states: ["Booked", "Confirmed", "Cancelled"], colors: ["#AF52DE", "#30D158", "#FF453A"] },
            "Finance": { states: ["Due", "Paid", "Overdue"], colors: ["#FF9500", "#30B0C7", "#FF453A"] },
            "Application": { states: ["Draft", "Submitted", "Approved"], colors: ["#AEAEB2", "#007AFF", "#34C759"] },
            "Verification": { states: ["Unverified", "Verified", "Rejected"], colors: ["#FF2D55", "#30B0C7", "#FF453A"] },
            "Binary": { states: ["Yes", "No"], colors: ["#34C759", "#FF453A"] },
            "Access": { states: ["Enabled", "Disabled"], colors: ["#64D2FF", "#FF453A"] },
            "Logic": { states: ["True", "False"], colors: ["#34C759", "#FF453A"] },
            "Visibility": { states: ["Public", "Private"], colors: ["#64D2FF", "#8E8E93"] },
            "Selection": { states: ["Selected", "Not Selected"], colors: ["#AF52DE", "#FF2D55"] },
            "Status": { states: ["New", "Active", "Closed"], colors: ["#5856D6", "#64D2FF", "#8E8E93"] }
        };

        const STANDARD_COLOR_MAP = {};
        Object.keys(STANDARD_STATE_SETS).forEach(key => {
            const set = STANDARD_STATE_SETS[key];
            set.states.forEach((state, idx) => {
                STANDARD_COLOR_MAP[state] = set.colors[idx] || "#8E8E93";
            });
        });

        const STATE_COLOR_MAP = {
            'Present': '#34C759', 'Absent': '#FF453A', 'Leave': '#FF9F0A',
            'In Progress': '#0A84FF', 'Completed': '#30D158',
            'Paid': '#30D158', 'Unpaid': '#FF3B30', 'Partial': '#FF9500',
            'Approved': '#34C759', 'Rejected': '#FF453A',
            'Available': '#30B0C7', 'Busy': '#FF375F', 'Away': '#AF52DE',
            'Started': '#64D2FF', 'On Hold': '#FFD60A', 'Finished': '#34C759',
            'Ordered': '#5856D6', 'Shipped': '#64D2FF', 'Delivered': '#40CBE0',
            'Out for Delivery': '#FFD60A', 'Active': '#30D158',
            'Inactive': '#FF3B30', 'Suspended': '#FF9500',
            'Low': '#BF5AF2', 'Medium': '#FFD60A', 'High': '#FF2D55',
            'Open': '#64D2FF', 'Closed': '#8E8E93', 'Resolved': '#34C759',
            'Booked': '#AF52DE', 'Confirmed': '#30D158', 'Cancelled': '#FF453A',
            'Due': '#FF9500', 'Overdue': '#FF453A',
            'Draft': '#AEAEB2', 'Submitted': '#007AFF',
            'Verified': '#30B0C7', 'Unverified': '#FF2D55',
            'Enabled': '#64D2FF', 'Disabled': '#FF453A',
            'True': '#34C759', 'False': '#FF453A',
            'Public': '#64D2FF', 'Private': '#8E8E93',
            'Selected': '#AF52DE', 'Not Selected': '#FF2D55',
            'New': '#5856D6', 'Archived': '#8E8E93',
            'Accept': '#34C759', 'Decline': '#FF3B30',
            'Assigned': '#0A84FF', 'Final': '#34C759',
            'Simple Status': '#0A84FF',
            'Yes': '#34C759', 'No': '#FF453A',
            'Default': '#8E8E93', 'Pending': '#8E8E93'
        };

        function getStateColor(state) {
            const merged = getMergedStatusColors();
            if (merged[state]) return merged[state];
            if (STANDARD_COLOR_MAP[state]) return STANDARD_COLOR_MAP[state];
            if (STATE_COLOR_MAP[state]) return STATE_COLOR_MAP[state];
            return '#8E8E93';
        }

        // Colors for a status set's own states (saved custom colors first, else standard).
        function getSetStateColors(setName) {
            const custom = (app.customStatusSetColors && app.customStatusSetColors[setName]);
            if (custom && custom.length) return custom;
            const std = STANDARD_STATE_SETS[setName];
            if (std && std.colors) return std.colors;
            return null;
        }

        // ---- Category colour service ----
        // Reserved colours for the three default finance categories (never change).
        const BASE_CAT_COLORS = { regular: '#34C759', personal: '#007AFF', extra: '#FF3B30' };
        // Generator source: dynamic categories draw from this palette.
        const CATEGORY_PALETTE = ['#FF453A', '#FF9F0A', '#0A84FF', '#AF52DE', '#FF375F', '#30B0C7',
            '#64D2FF', '#FFD60A', '#5856D6', '#40CBE0', '#FF9500', '#FF2D55', '#30D158'
        ];

        // Assign the next palette colour not yet used by any other category.
        function assignNextCategoryColor(key) {
            const used = Object.values(app.categoryColors || {}).concat(Object.values(BASE_CAT_COLORS));
            const fresh = CATEGORY_PALETTE.find(c => !used.includes(c));
            app.categoryColors[key] = fresh || ('#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(
                6, '0'));
        }

        // Reserved categories keep their hardcoded colour; every other distinct
        // key gets a generated colour tracked in app.categoryColors (persisted),
        // so different keys never collide and new categories stay unique.
        function getCategoryColor(cat) {
            const key = String(cat || '');
            const lk = key.toLowerCase();
            if (BASE_CAT_COLORS[lk]) return BASE_CAT_COLORS[lk];
            if (!app.categoryColors || typeof app.categoryColors !== 'object') app.categoryColors = {};
            if (!app.categoryColors[key]) assignNextCategoryColor(key);
            return app.categoryColors[key];
        }

        // Migration: on mount, drop any stale stored colour for every non-reserved
        // category and reassign fresh unique palette colours in app.cats order,
        // breaking previous duplicate appearances (e.g. HOME, XXX, NEW EXPENSE all
        // showing the same red). The reserved REGULAR/PERSONAL/EXTRA are untouched.
        function migrateCategoryColors() {
            if (!app.categoryColors || typeof app.categoryColors !== 'object') app.categoryColors = {};
            const dynamic = (app.cats || []).filter(c => {
                const lk = String(c || '').toLowerCase();
                return !BASE_CAT_COLORS[lk];
            });
            dynamic.forEach(c => { delete app.categoryColors[c]; });
            dynamic.forEach(c => { getCategoryColor(c); });
        }

        function tintStateSelect(el) {
            if (!el) return;
            const col = getStateColor(el.value);
            el.style.borderColor = col;
            el.style.color = col;
            el.dataset.tinted = '1';
            if (typeof cdSyncBtn === 'function') cdSyncBtn(el);
        }

        // Net Cash title + value share a colour: blue when positive, red when negative
        function colorNetCash(positive) {
            const col = positive ? 'var(--green)' : 'var(--red)';
            const netEl = D.getElementById('dashNet');
            if (netEl) netEl.style.color = col;
            const lbl = D.getElementById('dashNetLbl');
            if (lbl) lbl.style.color = col;
        }

        const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const MONTH_NAMES_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
            'October', 'November', 'December'
        ];

        const UNITS = ['kg', 'g', 'mg', 'L', 'ml', 'oz', 'lb', 'pcs', 'box', 'bag', 'dozen', 'pair'];

        function buildUnitOpts(selected) {
            return UNITS.map(u =>
                `<option value="${u}" ${u === selected ? 'selected' : ''}>${u}</option>`
            ).join('');
        }

        const STATUS_COLOR_PALETTE = [
            '#34C759', '#FF453A', '#FF9F0A', '#0A84FF', '#30D158',
            '#30D158', '#FF3B30', '#FF9500', '#34C759', '#FF453A',
            '#30B0C7', '#FF375F', '#AF52DE', '#64D2FF', '#FFD60A',
            '#34C759', '#5856D6', '#64D2FF', '#40CBE0', '#30D158',
            '#FF3B30', '#FF9500', '#BF5AF2', '#FFD60A', '#FF2D55',
            '#64D2FF', '#0A84FF', '#8E8E93', '#AF52DE', '#30D158',
            '#FF453A', '#FF9500', '#30B0C7', '#FF453A', '#AEAEB2',
            '#007AFF', '#34C759', '#FF2D55', '#30B0C7', '#FF453A',
            '#34C759', '#FF453A', '#64D2FF', '#FF453A', '#34C759',
            '#FF453A', '#64D2FF', '#8E8E93', '#AF52DE', '#FF2D55',
            '#5856D6', '#64D2FF', '#8E8E93'
        ];

        // ---- App State ----
        let app = null;
        const DEFAULT_APP = {
            budgetCats: ['Regular', 'Extra', 'Personal'],
            budgets: { Regular: '', Extra: '', Personal: '' },
            ghost: false,
            theme: 'light',
            cats: ['Regular', 'Extra', 'Personal'],
            lang: 'en',
            currency: 'PKR',
            settings: { salaryEnabled: false, notificationsEnabled: false, userProfile: { name: 'User',
                    username: 'username', email: '', bio: '', created: new Date().toISOString() } },
            pictures: [],
            notes: [],
            customStatusSets: {},
            customStatusSetColors: {},
            modules: [
                { id: 'perm_expenditure', title: 'Expenditure', format: 'ledger', active: true,
                    start: localDateStr(), notifEnabled: true },
                { id: 'perm_academics', title: 'Academics', format: 'grid', active: true,
                    states: ['Pending', 'Present', 'Absent', 'Leave'], hasRate: false, rate: 0,
                    start: localDateStr(), notifEnabled: true }
            ],
            credentials: null,
            grids: {},
            ledgers: {},
            bin: [],
            archives: {},
            activityLedger: {},
            moduleBudgets: {},
            totalExpense: {},
            gridRecords: [],
            gridMonths: {},
            budgetEnabled: {},
            categoryEnabled: {},
            categoryColors: {},
            statusSetEnabled: {},
            printHistory: [],
            profilePhoto: null,
            isGuest: false,
            password: '',
            resetPin: '',
            memberSince: '',
            lastLogin: ''
        };
        app = JSON.parse(JSON.stringify(DEFAULT_APP));
        if (!app.budgets) app.budgets = { Regular: '', Extra: '', Personal: '' };
        if (!app.budgetCats || app.budgetCats.length === 0) app.budgetCats = ['Regular', 'Extra', 'Personal'];
        if (!app.budgetEnabled) app.budgetEnabled = {};
        ['Regular', 'Extra', 'Personal'].forEach(b => {
            if (!app.budgetCats.includes(b)) app.budgetCats.push(b);
            if (app.budgets[b] === undefined) app.budgets[b] = '';
            if (app.budgetEnabled[b] === undefined) app.budgetEnabled[b] = true;
        });
        app.budgetCats.forEach(c => { if (app.budgetEnabled[c] === undefined) app.budgetEnabled[c] = true; });
        app.cats.forEach(c => { if (app.categoryEnabled[c] === undefined) app.categoryEnabled[c] = true; });
        // Keep the default finance categories in the order Regular, Personal, Extra
        const _baseCatOrder = ['Regular', 'Personal', 'Extra'];
        app.cats = _baseCatOrder.filter(c => app.cats.includes(c)).concat(app.cats.filter(c => !_baseCatOrder.includes(c)));
        app.budgetCats = _baseCatOrder.filter(c => app.budgetCats.includes(c)).concat(app.budgetCats.filter(c => !_baseCatOrder.includes(c)));
        Object.keys(app.customStatusSets).forEach(k => { if (app.statusSetEnabled[k] === undefined) app.statusSetEnabled[
                k] = true; });

        // On mount: reassign unique colours to dynamic categories (HOME, XXX,
        // NEW EXPENSE, ...) while leaving the reserved 3 untouched.
        migrateCategoryColors();

        if (!app.modules.find(m => m.id === 'perm_expenditure')) {
            app.modules.unshift({ id: 'perm_expenditure', title: 'Expenditure', format: 'ledger', active: true,
                start: localDateStr() });
        }
        if (!app.modules.find(m => m.id === 'perm_academics')) {
            app.modules.unshift({ id: 'perm_academics', title: 'Academics', format: 'grid', active: true,
                states: ['Pending', 'Present', 'Absent', 'Leave'], hasRate: false, rate: 0,
                start: localDateStr() });
        }

        function localDateStr(d) {
            const d2 = d || new Date();
            return d2.getFullYear() + '-' + String(d2.getMonth() + 1).padStart(2, '0') + '-' + String(d2.getDate())
                .padStart(2, '0');
        }

        const now = new Date();
        let currentRenderDateStr = localDateStr(now);
        app.modules.forEach(m => {
            if (!m.start) { m.start = currentRenderDateStr; } else {
                const d = new Date(m.start);
                if (isNaN(d.getTime())) m.start = currentRenderDateStr;
            }
        });

        app.modules.filter(m => m.format === 'grid').forEach(mod => {
            if (mod.notifEnabled === undefined) mod.notifEnabled = true;
            if (!app.grids[mod.id]) { app.grids[mod.id] = Array(31).fill('Pending'); } else {
                if (app.grids[mod.id].length !== 31) {
                    const old = app.grids[mod.id];
                    app.grids[mod.id] = Array(31).fill('Pending');
                    for (let i = 0; i < Math.min(old.length, 31); i++) app.grids[mod.id][i] = old[i] || 'Pending';
                }
                for (let i = 0; i < 31; i++) {
                    if (!app.grids[mod.id][i] || !mod.states.includes(app.grids[mod.id][i])) {
                        app.grids[mod.id][i] = 'Pending';
                    }
                }
            }
            if (app.grids[mod.id + '_showSalary'] === undefined) app.grids[mod.id + '_showSalary'] = false;
            if (app.grids[mod.id + '_showRate'] === undefined) app.grids[mod.id + '_showRate'] = false;
        });

        app.modules.filter(m => m.format === 'ledger').forEach(mod => {
            if (app.ledgers[mod.id + '_showBudget'] === undefined) app.ledgers[mod.id + '_showBudget'] = true;
        });

        let activeGridTabId = null;
        let activeFinTabId = null;
        let pendingListForNotification = [];
        let editingNoteId = null;
        let editingLedgerEntry = null;
                let inlineEditEntry = null;
        let inlineExpenseEdit = null;
        let selectedRecordMonthTab = null;
        let clockIntervalId = null;
        let _renderPending = false;
        let noteAutoSaveTimer = null;

        const D = document;

        // ---- HiDPI canvas helper: crisp on retina, DPR-change and resize aware ----
        function setupHiDPICanvas(canvas, logicalWidth, logicalHeight) {
            const dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 3);
            canvas.style.width = logicalWidth + 'px';
            canvas.style.height = logicalHeight + 'px';
            canvas.width = Math.round(logicalWidth * dpr);
            canvas.height = Math.round(logicalHeight * dpr);
            const ctx = canvas.getContext('2d');
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            return ctx;
        }

        function setToggleChecked(id, checked) {
            const input = D.getElementById(id);
            if (input && input.type === 'checkbox') { input.checked = checked;
                input.dispatchEvent(new Event('change', { bubbles: true })); }
        }

        function getToggleChecked(id) {
            const input = D.getElementById(id);
            return input ? input.checked : false;
        }

        function fmt(num) { if (!num && num !== 0) return '0'; return Number(num).toLocaleString('en-US'); }

        function fmtNoComma(num) {
            if (!num && num !== 0) return '0';
            const n = Number(num);
            if (Number.isInteger(n)) return n.toString();
            return n.toFixed(Math.min(2, (String(n).split('.')[1] || '').length));
        }

        const CURRENCY_META = {
            PKR: '\u20A8', USD: '$', EUR: '\u20AC', GBP: '\u00A3', INR: '\u20B9', AED: 'AED', SAR: 'SAR'
        };
        function getCurrencySymbol() {
            return CURRENCY_META[app.currency] || 'PKR';
        }
        function fmtMoney(num) {
            return getCurrencySymbol() + ' ' + fmt(num);
        }
        function fmtMoneyNC(num) {
            return getCurrencySymbol() + ' ' + fmtNoComma(num);
        }

        // ============================================================
        //  i18n - LANGUAGE DICTIONARY (en / ur / ar)
        // ============================================================
        const LANG_STRINGS = {
            en: {
                'app.name': 'AETHER', 'app.version': 'Version ' + APP_VERSION_CODE, 'credit': 'Advanced Tracking Technologies',
                'search.ph': 'Search...', 'common.ok': 'OK', 'common.yes': 'Yes', 'common.no': 'No',
                'common.cancel': 'Cancel', 'common.save': 'Save',
                'lock.welcome': 'WELCOME', 'lock.password': 'Password', 'lock.unlock': 'Unlock',
                'lock.designed': 'Designed and Engineered By',
                'lock.secureWorkspace': 'Secure Workspace', 'lock.welcomeBack': 'Welcome back',
                'lock.enterPassword': 'Enter your password to continue', 'lock.unlockAether': 'Unlock Aether',
                'lock.unlocking': 'Unlocking', 'lock.incorrectPassword': 'Incorrect password',
                'lock.protectedLocal': 'Protected local workspace',
                'login.title': 'Welcome back', 'login.subtitle': 'Log in to your account',
                'login.username': 'Username', 'login.usernamePh': 'Enter your username',
                'login.password': 'Password', 'login.passwordPh': 'Enter your password',
                'login.remember': 'Remember me', 'login.forgot': 'Forgot password?',
                'login.submit': 'Log In', 'login.loggingIn': 'Logging in...',
                'login.signup': 'Sign up', 'login.noAccount': "Don't have an account?",
                'login.error.required': 'Email is required.', 'login.error.email': 'Please enter a valid email address.',
                'login.error.passReq': 'Password is required.', 'login.error.passMin': 'Password must be at least 8 characters.',
                'login.error.invalid': 'Invalid username or password.',
                'login.error.rateLimit': 'Too many attempts. Try again later.',
                'login.error.generic': 'Something went wrong. Please try again.',
                'login.capslock': 'Caps Lock is on',
                'login.success': 'Login successful',
                'notify.title': 'Pending', 'notify.empty': 'No new tasks.', 'notify.allCaughtUp': 'No pending tasks. All caught up! ',
                'alert.title': 'Notice', 'confirm.title': 'Confirm',
                'cam.rotate': 'Rotate', 'cam.crop': 'Crop', 'cam.save': 'Save',
                'archive.title': 'Archive', 'archive.download': 'Download PDF',
                'rename.title': 'Rename', 'rename.ph': 'Enter new title', 'rename.btn': 'Rename', 'rename.new': 'New title',
                'ledgerEdit.title': 'Edit Expense', 'ledgerEdit.item': 'Item Name', 'ledgerEdit.amount': 'Amount',
                'ledgerEdit.qty': 'Quantity', 'ledgerEdit.cat': 'Category', 'ledgerEdit.save': 'Save Changes',
                'drawer.title': 'DRAWER', 'drawer.gridTotal': 'Total Grids:', 'drawer.ledgerTotal': 'Total Ledgers:',
                'menu.home': 'Home', 'menu.grids': 'Grids', 'menu.finance': 'Finance', 'menu.notes': 'Notes',
                'menu.console': 'Console Engine', 'menu.budget': 'Budget', 'menu.category': 'Category', 'menu.status': 'Status',
                'menu.analytics': 'Analytics', 'menu.recycle': 'Recycle Bin', 'menu.storage': 'Storage',
                'menu.archives': 'Archives', 'menu.pictures': 'Pictures', 'menu.print': 'Print', 'menu.profile': 'Profile',
                'menu.theme': 'Theme', 'menu.notifications': 'Notifications', 'menu.settings': 'Settings',
                'menu.calculator': 'Calculator', 'menu.calcSimple': 'Simple', 'menu.age': 'Age', 'menu.about': 'About', 'menu.reset': 'Factory Reset',
                'age.title': 'Age Calculator', 'age.dob': 'Date of Birth', 'age.calc': 'Calculate', 'age.years': 'Years', 'age.months': 'Months', 'age.days': 'Days', 'age.hours': 'Hours', 'age.minutes': 'Minutes', 'age.seconds': 'Seconds', 'age.enter': 'Enter your date of birth.', 'age.invalid': 'Please enter a valid past date.',
                'prof.myProfile': 'My Profile', 'prof.changePass': 'Change Password', 'prof.logout': 'Logout',
                'home.welcome': 'WELCOME', 'home.goodMorning': 'GOOD MORNING', 'home.goodAfternoon': 'GOOD AFTERNOON',
                'home.goodEvening': 'GOOD EVENING', 'home.goodNight': 'GOOD NIGHT',
                'home.finStatus': 'Financial Status', 'home.instantAnalysis': 'Instant Analysis', 'home.budget': 'Budget',
                'home.expense': 'Expense', 'home.remaining': 'Remaining', 'home.breakdown': 'BREAKDOWN',
                'home.finance': 'FINANCE', 'home.grid': 'GRID', 'home.noGridAnalytics': 'No grid analytics.',
                'home.progress': 'Progress Tracking',
                'settings.title': 'Settings', 'settings.password': 'Password', 'settings.deactivated': 'Deactivated',
                'settings.activated': 'Activated', 'settings.manage': 'Manage your app login credentials.',
                'settings.username': 'Username', 'settings.passMin': 'Password (Min 8)', 'settings.remove': 'Remove',
                'settings.secure': 'Credentials secure your local data.', 'settings.updatePass': 'Update Password',
                'settings.updateHint': 'Enter your current password, then set a new one (min 8).',
                'settings.currentPass': 'Current Password', 'settings.newPassMin': 'New Password (Min 8)',
                'settings.confirmNew': 'Confirm New Password', 'settings.preferences': 'Preferences',
                'settings.language': 'Language', 'settings.currency': 'Currency', 'settings.dangerZone': 'Danger Zone',
                'settings.dangerText': 'Deleting your account permanently removes all grids, ledgers, notes, pictures and settings. This action cannot be undone.',
                'settings.deleteAccount': 'Delete Account', 'settings.lang.en': 'English', 'settings.lang.ur': 'Urdu',
                'settings.lang.ar': 'Arabic', 'settings.noModules': 'No active modules detected. Initialize a new module from the Console Engine to begin tracking.',
                'settings.permanent': 'Permanent', 'settings.restore': 'RESTORE', 'settings.see': 'See',
                'settings.edit': 'Edit', 'settings.delete': 'Delete', 'storage.noEomArchives': 'No end-of-month archives generated.',
                'console.createGrid': 'Create Grid Console', 'console.name': 'Name', 'console.namePh': 'Console Name',
                'console.type': 'Type', 'console.state': 'State', 'console.genGrid': 'GENERATE GRID',
                'console.gridInfo': 'Grid consoles track daily status (attendance, tasks, etc.) with visual calendar view.',
                'console.gridModules': 'Grid Modules', 'console.createFinance': 'Create Finance Ledger',
                'console.genLedger': 'GENERATE LEDGER', 'console.finInfo': 'Finance ledgers track expenses, income, and budgets with detailed entries.',
                'console.finModules': 'Finance Modules', 'console.createBudget': 'Create New Budget',
                'console.budgetPh': 'Budget Name', 'console.gen': 'GENERATE', 'console.budgetInfo': 'Budgets help you allocate funds across different categories.',
                'console.budgetCats': 'Budget Categories', 'console.createCat': 'Add New Category',
                'console.catPh': 'Category Name', 'console.addCat': 'Add Category', 'console.catInfo': 'Categories organize your ledger entries for better tracking and reporting.',
                'console.ledgerCats': 'Ledger Categories', 'console.insertName': 'Insert Name', 'console.insert': 'Insert',
                'console.genColors': 'GENERATE', 'console.add': 'ADD', 'console.noStates': 'No states defined yet',
                'console.statusInfo': 'Custom status sets extend Grid consoles with your own state definitions and colors.',
                'console.statusSets': 'Custom Status Sets', 'console.colorHint': 'Click to change color',
                'recycle.title': 'RECYCLE BIN', 'recycle.search': 'Search...', 'recycle.all': 'All Types',
                'recycle.module': 'Modules', 'recycle.ledger': 'Ledger Entries', 'recycle.note': 'Notes',
                'recycle.picture': 'Pictures', 'recycle.budget': 'Budgets', 'recycle.category': 'Categories',
                'recycle.status': 'Status Sets', 'recycle.gridRecord': 'Grid Records', 'recycle.archive': 'Archives',
                'recycle.expense': 'Expenses', 'recycle.calcRecord': 'Calculator Records',
                'recycle.ageRecord': 'Age Records', 'recycle.printDoc': 'Print Documents',
                'recycle.newest': 'Newest', 'recycle.oldest': 'Oldest',
                'recycle.name': 'Name', 'recycle.type': 'Type', 'recycle.total': 'Total Items:',
                'recycle.emptyTitle': 'Recycle Bin is Empty', 'recycle.emptySub': 'Deleted items will appear here when you remove them.',
                'storage.title': 'EOM ARCHIVES', 'storage.eom': 'End of Month Archives', 'storage.notes': 'Notes',
                'storage.total': 'Total:',
                'print.title': 'PRINT', 'print.docs': 'Documents', 'print.pdfs': 'PDFs', 'print.reports': 'Reports',
                'print.mode': 'PDF / Print', 'print.options': 'Print Options', 'print.export': 'Export PDF', 'print.direct': 'Direct Print',
                'print.gen': 'Generate', 'print.reportsTitle': 'Reports', 'print.gridRecords': 'Grid Records',
                'print.financeRecords': 'Finance Records', 'print.genReport': 'Generate Report', 'print.history': 'Print History',
                'print.total': 'Total:',
                'profile.title': 'Profile', 'profile.changePhoto': 'Change Photo', 'profile.accountInfo': 'Account Information',
                'profile.fullName': 'Full Name', 'profile.username': 'Username', 'profile.email': 'Email',
                'profile.phone': 'Phone', 'profile.dob': 'Date of Birth', 'profile.gender': 'Gender',
                'profile.gender.na': 'Prefer not to say', 'profile.gender.male': 'Male', 'profile.gender.female': 'Female',
                'profile.gender.na': 'Prefer not to say', 'profile.gender.male': 'Male', 'profile.gender.female': 'Female',
                'profile.gender.other': 'Other', 'profile.status': 'Status', 'profile.memberSince': 'Member Since',
                'profile.myData': 'My App Data', 'profile.totalGrids': 'Total Grids', 'profile.activeGrids': 'Active Grids',
                'profile.totalLedgers': 'Total Ledgers', 'profile.activeLedgers': 'Active Ledgers',
                'profile.totalNotes': 'Total Notes', 'profile.storageUsed': 'Storage Used', 'profile.preferences': 'Preferences',
                'profile.weeklyReports': 'Weekly Reports', 'profile.sessionInfo': 'Session Information',
                'profile.lastLogin': 'Last Login', 'profile.ip': 'IP Address', 'profile.device': 'Device',
                'profile.save': 'Save Changes', 'profile.insert': 'insert',
                'theme.title': 'Theme', 'theme.dark': 'Dark Theme', 'theme.desc': 'Toggle between light and dark mode.',
                'notif.title': 'Notifications', 'notif.enable': 'Enable Reminders',
                'notif.desc': 'Receive browser notifications for pending tasks.', 'notif.current': 'Current Pending Tasks',
                'notif.empty': 'No pending tasks.',
                'about.designedBy': 'Designed By', 'about.engine': 'Engine', 'about.platform': 'Platform',
                'about.platformVal': 'Web - PWA Ready', 'about.security': 'Security', 'about.securityVal': 'IndexedDB (Dexie.js) - Encrypted',
                'about.telegram': 'Telegram', 'about.whatsapp': 'WhatsApp', 'about.github': 'GitHub',
                'about.copyright': 'Copyright \u00A9 2026 AETHER. All rights reserved.',
                'about.description': 'AETHER is an all-in-one personal tracking and productivity PWA designed to manage grids, finance, notes, and analytics \u2014 fully offline with local encrypted storage. Built for speed, privacy, and simplicity.',
                'about.language': 'Language', 'about.offline': 'Offline Support', 'about.offlineVal': 'Full PWA - Works Offline',
                'about.privacy': 'Privacy', 'about.privacyVal': 'No Server - Data Stays Local',
                'about.features': 'Key Features',
                'about.featGrids': 'Grid Tracking', 'about.featFinance': 'Finance Management',
                'about.featNotes': 'Notes & Docs', 'about.featAnalytics': 'Analytics',
                'about.featPrint': 'Print & Export', 'about.featStorage': 'IndexedDB Storage',
                'social.followUs': 'Follow Us',
                'calc.title': 'Calculator', 'calc.record': 'Record', 'calc.totalItems': 'Total Items',
                'reset.wipe': 'Wipe All Data?', 'reset.desc': 'This will permanently erase all your data including grids, finance entries, notes, pictures, and settings. This action cannot be undone.',
                'reset.yes': 'Yes, Reset Everything',
                'reset.dataTitle': 'This will permanently remove:',
                'reset.itemModules': 'Grid Modules and records',
                'reset.itemLedgers': 'Ledger and finance entries',
                'reset.itemNotes': 'Notes and scheduled items',
                'reset.itemPictures': 'Pictures',
                'reset.itemBudgets': 'Budgets, categories and status sets',
                'reset.itemArchives': 'Archives, print history and activity log',
                'reset.itemSettings': 'Personalized settings and preferences',
                'reset.iUnderstand': 'I understand this action is permanent and cannot be undone.',
                'reset.typeReset': 'Type RESET to confirm',
                'reset.typeRequired': 'Please type RESET and tick the confirmation box to proceed.',
                'reset.confirmWipe': 'ARE YOU SURE? This will permanently delete ALL data.',
                'analytics.title': 'ANALYTICS', 'analytics.today': 'Today', 'analytics.yesterday': 'Yesterday',
                'analytics.week': 'This Week', 'analytics.month': 'This Month', 'analytics.last3': '3 Months',
                'analytics.last6': '6 Months', 'analytics.year': 'Year', 'analytics.all': 'All Time',
                'analytics.overview': 'Overview', 'analytics.grids': 'Grids', 'analytics.finance': 'Finance',
                'analytics.notes': 'Notes', 'analytics.recycle': 'Recycle',
                'nav.home': 'Home', 'nav.grids': 'Grids', 'nav.finance': 'Finance', 'nav.notes': 'Notes',
                'social.follow': 'Follow Us',
                'notes.noteTitle': 'Note Title', 'notes.placeholder': 'What\'s on your mind?',
                'notes.chars': 'characters', 'notes.words': 'words', 'notes.autosaved': 'Autosaved',
                'notes.savedJust': 'Saved just now', 'notes.savedStorage': 'Saved to storage',
                'drawer.emptyGrids': 'No grid modules found.', 'drawer.emptyLedgers': 'No ledger modules found.',
                'ce.noCats': 'No categories defined.', 'ce.noCustomSets': 'No custom sets defined.',
                'ce.noSetsHint': 'No custom sets defined. Create one above!',
                'empty.entriesMonth': 'No entries recorded for this month.', 'empty.noRecordsYet': 'No records yet. Use "ADD TO RECORD" in a ledger module or "ADD TO RECORDS" in a grid module to populate.',
                'empty.noEntriesWeek': 'No entries this week.', 'empty.noGridRecords': 'No grid records yet. Use "ADD TO RECORDS" in any grid module to populate.',
                'empty.noEntries': 'No entries recorded.', 'ce.noGrids': 'No grid modules created yet.',
                'ce.noFinance': 'No finance modules created yet.', 'empty.noArchives': 'No archives.',
                'empty.noNotes': 'No notes.', 'empty.noPictures': 'No pictures.', 'bin.empty': 'Bin is empty.',
                'storage.noNotesArchived': 'No notes archived.', 'storage.noPictures': 'No pictures captured.',
                'print.noHistory': 'No print history yet.', 'chart.noData': 'No data',
                'search.noResults': 'No results found for "{q}"', 'search.more': '+ {n} more results',
                // ---- Dynamic phrases (toasts / alerts / confirms) ----
                'Profile saved': 'Profile saved', 'Changes discarded': 'Changes discarded',
                'Language preference saved': 'Language preference saved', 'Currency preference saved': 'Currency preference saved',
                'Profile photo updated': 'Profile photo updated', 'Profile photo removed': 'Profile photo removed',
                'Username is required': 'Username is required', 'Full name is required': 'Full name is required',
                'Credentials saved': 'Credentials saved', 'Credentials removed': 'Credentials removed',
                'Password changed successfully': 'Password changed successfully', 'Current password is incorrect': 'Current password is incorrect',
                'Please fill all fields': 'Please fill all fields', 'Please enter a name': 'Please enter a name',
                'Please enter item and amount': 'Please enter item and amount', 'Amount must be greater than 0': 'Amount must be greater than 0',
                'Please enter a title to save': 'Please enter a title to save', 'Note saved successfully': 'Note saved successfully',
                'Note draft saved': 'Note draft saved', 'Note loaded': 'Note loaded', 'Note deleted': 'Note deleted',
                'Note renamed': 'Note renamed', 'Nothing to save': 'Nothing to save', 'Draft deleted': 'Draft deleted',
                'Added to expense successfully': 'Added to expense successfully', 'Added to records': 'Added to records',
                'All entries already in record': 'All entries already in record', 'No entries to add to record': 'No entries to add to record',
                'Entry added successfully': 'Entry added successfully', 'Entry updated': 'Entry updated',
                'Entry deleted': 'Entry deleted', 'Entry not found': 'Entry not found', 'Duplicate entry': 'Duplicate entry',
                'No data to add': 'No data to add', 'Expense entry updated': 'Expense entry updated',
                'Expense entry deleted': 'Expense entry deleted', 'Grid record updated': 'Grid record updated',
                'Grid record deleted': 'Grid record deleted', 'Module deleted': 'Module deleted',
                'Category deleted': 'Category deleted', 'Category is in use by a ledger': 'Category is in use by a ledger',
                'Status updated': 'Status updated', 'Status set created': 'Status set created',
                'Status set deleted': 'Status set deleted', 'Status set is in use by a grid': 'Status set is in use by a grid',
                'Status removed': 'Status removed', 'Add at least 2 state names': 'Add at least 2 state names',
                'Item restored': 'Item restored', 'Item permanently deleted': 'Item permanently deleted',
                'Recycle Bin emptied': 'Recycle Bin emptied', 'Archive deleted': 'Archive deleted',
                'Archive downloaded': 'Archive downloaded', 'Archive renamed': 'Archive renamed',
                'Document removed from history': 'Document removed from history', 'Select a print option': 'Select a print option',
                'Logged out successfully': 'Logged out successfully', 'Could not read image': 'Could not read image',
                'Could not save photo': 'Could not save photo', 'Please choose an image file': 'Please choose an image file',
                'Picture deleted': 'Picture deleted', 'Picture renamed': 'Picture renamed',
                'Opening {name}': 'Opening {name}', 'Budget "{name}" saved': 'Budget "{name}" saved',
                'Budget "{name}" updated': 'Budget "{name}" updated', 'Grid "{name}" deleted': 'Grid "{name}" deleted',
                'Ledger "{name}" deleted': 'Ledger "{name}" deleted', 'Category "{name}" deleted': 'Category "{name}" deleted',
                'Status set "{name}" deleted': 'Status set "{name}" deleted',
                'Grid "{name}" created': 'Grid "{name}" created', 'Ledger "{name}" created': 'Ledger "{name}" created',
                'Budget "{name}" created': 'Budget "{name}" created', 'Category "{name}" added': 'Category "{name}" added',
                'Status set "{name}" created': 'Status set "{name}" created',
                '{count} item(s) restored': '{count} item(s) restored', '{count} item(s) permanently deleted': '{count} item(s) permanently deleted',
                '{count} entry(s) added to record': '{count} entry(s) added to record',
                'Notification on for {name}': 'Notification on for {name}', 'Notification off for {name}': 'Notification off for {name}',
                'Module "{name}" enabled': 'Module "{name}" enabled', 'Module "{name}" disabled': 'Module "{name}" disabled',
                'Picture updated': 'Picture updated', 'Picture saved': 'Picture saved',
                'Downloaded': 'Downloaded', 'Sharing not supported on this device': 'Sharing not supported on this device',
                'Delete account? This permanently removes ALL grids, ledgers, notes, pictures, settings and credentials. This cannot be undone.': 'Delete account? This permanently removes ALL grids, ledgers, notes, pictures, settings and credentials. This cannot be undone.',
                'Are you sure you want to log out? Your data will remain safe.': 'Are you sure you want to log out? Your data will remain safe.',
                '?? ARE YOU SURE? This will permanently delete ALL data.': '?? ARE YOU SURE? This will permanently delete ALL data.',
                'Are you sure you want to permanently delete all items in the Recycle Bin?': 'Are you sure you want to permanently delete all items in the Recycle Bin?',
                'Permanently delete {count} selected item(s)?': 'Permanently delete {count} selected item(s)?',
                'Permanently delete ALL {count} items in Recycle Bin?': 'Permanently delete ALL {count} items in Recycle Bin?',
                'Erase {name} archive?': 'Erase {name} archive?', 'Delete custom set "{name}"?': 'Delete custom set "{name}"?',
                'Delete module "{name}"?': 'Delete module "{name}"?',
                'Active User': 'Active User', 'Guest': 'Guest', 'Active': 'Active',
                'Weekly reports enabled': 'Weekly reports enabled', 'Weekly reports disabled': 'Weekly reports disabled'
            },

            ur: {
                'app.name': 'AETHER', 'app.version': 'ورژن ' + APP_VERSION_CODE, 'credit': 'ایڈوانسڈ ٹریکنگ ٹیکنالوجیز',
                'search.ph': 'تلاش کریں...', 'common.ok': 'ٹھیک ہے', 'common.yes': 'ہاں', 'common.no': 'نہیں',
                'common.cancel': 'منسوخ کریں', 'common.save': 'محفوظ کریں',
                'lock.welcome': 'خوش آمدید', 'lock.password': 'پاس ورڈ', 'lock.unlock': 'کھولیں',
                'lock.designed': 'ڈیزائن اور انجینئرنگ',
                'lock.secureWorkspace': 'محفوظ ورک اسپیس', 'lock.welcomeBack': 'خوش آمدید',
                'lock.enterPassword': 'جاری رکھنے کے لیے پاس ورڈ درج کریں', 'lock.unlockAether': 'ایتھر کھولیں',
                'lock.unlocking': 'کھل رہا ہے', 'lock.incorrectPassword': 'غلط پاس ورڈ',
                'lock.protectedLocal': 'محفوظ مقامی ورک اسپیس',
                'login.title': 'خوش آمدید', 'login.subtitle': 'اپنے اکاؤنٹ میں لاگ ان کریں',
                'login.username': 'صارف نام', 'login.usernamePh': 'اپنا صارف نام درج کریں',
                'login.password': 'پاس ورڈ', 'login.passwordPh': 'اپنا پاس ورڈ درج کریں',
                'login.remember': 'مجھے یاد رکھیں', 'login.forgot': 'پاس ورڈ بھول گئے؟',
                'login.submit': 'لاگ ان', 'login.loggingIn': 'لاگ ان ہو رہا ہے...',
                'login.signup': 'سائن اپ', 'login.noAccount': 'اکاؤنٹ نہیں ہے؟',
                'login.error.required': 'ای میل ضروری ہے۔', 'login.error.email': 'براہ کرم درست ای میل درج کریں۔',
                'login.error.passReq': 'پاس ورڈ ضروری ہے۔', 'login.error.passMin': 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔',
                'login.error.invalid': 'غلط صارف نام یا پاس ورڈ۔',
                'login.error.rateLimit': 'بہت زیادہ کوششیں۔ بعد میں دوبارہ کوشش کریں۔',
                'login.error.generic': 'کچھ غلط ہوا۔ براہ کرم دوبارہ کوشش کریں۔',
                'login.capslock': 'کیپس لاک آن ہے',
                'login.success': 'لاگ ان کامیاب',
                'notify.title': 'زیر التواء', 'notify.empty': 'کوئی نیا کام نہیں۔', 'notify.allCaughtUp': 'کوئی زیر التواء کام نہیں۔ سب مکمل! ',
                'alert.title': 'نوٹس', 'confirm.title': 'تصدیق کریں',
                'cam.rotate': 'گھمائیں', 'cam.crop': 'کاٹیں', 'cam.save': 'محفوظ کریں',
                'archive.title': 'محفوظ شدہ', 'archive.download': 'PDF ڈاؤن لوڈ کریں',
                'rename.title': 'نام تبدیل کریں', 'rename.ph': 'نیا عنوان درج کریں', 'rename.btn': 'نام تبدیل کریں', 'rename.new': 'نیا عنوان',
                'ledgerEdit.title': 'خرچ میں ترمیم', 'ledgerEdit.item': 'آئٹم کا نام', 'ledgerEdit.amount': 'رقم',
                'ledgerEdit.qty': 'مقدار', 'ledgerEdit.cat': 'زمرہ', 'ledgerEdit.save': 'تبدیلیاں محفوظ کریں',
                'drawer.title': 'ڈراور', 'drawer.gridTotal': 'کل گرِڈز:', 'drawer.ledgerTotal': 'کل لیجرز:',
                'menu.home': 'ہوم', 'menu.grids': 'گرِڈز', 'menu.finance': 'مالیات', 'menu.notes': 'نوٹس',
                'menu.console': 'کنسول انجن', 'menu.budget': 'بجٹ', 'menu.category': 'زمرہ', 'menu.status': 'اسٹیٹس',
                'menu.analytics': 'تجزیات', 'menu.recycle': 'ری سائیکل بن', 'menu.storage': 'اسٹوریج',
                'menu.archives': 'محفوظ شدہ', 'menu.pictures': 'تصاویر', 'menu.print': 'پرنٹ', 'menu.profile': 'پروفائل',
                'menu.theme': 'تھیم', 'menu.notifications': 'اطلاعات', 'menu.settings': 'ترتیبات',
                'menu.calculator': 'کیلکولیٹر', 'menu.calcSimple': 'بنیادی', 'menu.age': 'عمر', 'menu.about': 'تعارف', 'menu.reset': 'فیکٹری ری سیٹ',
                'age.title': 'عمر کیلکولیٹر', 'age.dob': 'تاریخ پیدائش', 'age.calc': 'حساب لگائیں', 'age.years': 'سال', 'age.months': 'مہینے', 'age.days': 'دن', 'age.hours': 'گھنٹے', 'age.minutes': 'منٹ', 'age.seconds': 'سیکنڈ', 'age.enter': 'اپنی تاریخ پیدائش درج کریں۔', 'age.invalid': 'براہ کرم درست ماضی کی تاریخ درج کریں۔',
                'prof.myProfile': 'میری پروفائل', 'prof.changePass': 'پاس ورڈ تبدیل کریں', 'prof.logout': 'لاگ آؤٹ',
                'home.welcome': 'خوش آمدید', 'home.goodMorning': 'صبح بخیر', 'home.goodAfternoon': 'دوپہر بخیر',
                'home.goodEvening': 'شام بخیر', 'home.goodNight': 'شب بخیر',
                'home.finStatus': 'مالی حیثیت', 'home.instantAnalysis': 'فوری تجزیہ', 'home.budget': 'بجٹ',
                'home.expense': 'خرچ', 'home.remaining': 'باقی', 'home.breakdown': 'تقسیم',
                'home.finance': 'مالیات', 'home.grid': 'گرِڈ', 'home.noGridAnalytics': 'کوئی گرِڈ تجزیات نہیں۔',
                'home.progress': 'پیش رفت',
                'settings.title': 'ترتیبات', 'settings.password': 'پاس ورڈ', 'settings.deactivated': 'غیر فعال',
                'settings.activated': 'فعال', 'settings.manage': 'اپنی ایپ لاگ ان اسناد کا انتظام کریں۔',
                'settings.username': 'صارف نام', 'settings.passMin': 'پاس ورڈ (کم از کم 8)', 'settings.remove': 'ہٹائیں',
                'settings.secure': 'اسناد آپ کے مقامی ڈیٹا کو محفوظ رکھتی ہیں۔', 'settings.updatePass': 'پاس ورڈ اپ ڈیٹ کریں',
                'settings.updateHint': 'اپنا موجودہ پاس ورڈ درج کریں، پھر نیا پاس ورڈ مرتب کریں (کم از کم 8)۔',
                'settings.currentPass': 'موجودہ پاس ورڈ', 'settings.newPassMin': 'نیا پاس ورڈ (کم از کم 8)',
                'settings.confirmNew': 'نئے پاس ورڈ کی تصدیق کریں', 'settings.preferences': 'ترجیحات',
                'settings.language': 'زبان', 'settings.currency': 'کرنسی', 'settings.dangerZone': 'خطرناک زون',
                'settings.dangerText': 'اکاؤنٹ حذف کرنے سے تمام گرِڈز، لیجرز، نوٹس، تصاویر اور ترتیبات مستقل طور پر ختم ہو جائیں گی۔ اس عمل کو واپس نہیں کیا جا سکتا۔',
                'settings.deleteAccount': 'اکاؤنٹ حذف کریں', 'settings.lang.en': 'انگریزی', 'settings.lang.ur': 'اردو',
                'settings.lang.ar': 'عربی', 'settings.noModules': 'کوئی فعال ماڈیول نہیں ملا۔ ٹریکنگ شروع کرنے کے لیے کنسول انجن سے ایک نیا ماڈیول بنائیں۔',
                'settings.permanent': 'مستقل', 'settings.restore': 'بحال کریں', 'settings.see': 'دیکھیں',
                'settings.edit': 'ترمیم', 'settings.delete': 'حذف', 'storage.noEomArchives': 'کوئی ماہ کے آخر کی محفوظات نہیں بنائی گئیں۔',
                'console.createGrid': 'گرِڈ کنسول بنائیں', 'console.name': 'نام', 'console.namePh': 'کنسول کا نام',
                'console.type': 'قسم', 'console.state': 'اسٹیٹ', 'console.genGrid': 'گرِڈ بنائیں',
                'console.gridInfo': 'گرِڈ کنسولز روزانہ کی حیثیت (حاضری، کام وغیرہ) بصری کیلنڈر کے ساتھ ریکارڈ کرتے ہیں۔',
                'console.gridModules': 'گرِڈ ماڈیولز', 'console.createFinance': 'مالی لیجر بنائیں',
                'console.genLedger': 'لیجر بنائیں', 'console.finInfo': 'مالی لیجرز اخراجات، آمدنی اور بجٹ تفصیل سے ریکارڈ کرتے ہیں۔',
                'console.finModules': 'مالی ماڈیولز', 'console.createBudget': 'نیا بجٹ بنائیں',
                'console.budgetPh': 'بجٹ کا نام', 'console.gen': 'بنائیں', 'console.budgetInfo': 'بجٹ آپ کو مختلف زمروں میں فنڈز مختص کرنے میں مدد دیتے ہیں۔',
                'console.budgetCats': 'بجٹ زمرے', 'console.createCat': 'نیا زمرہ شامل کریں',
                'console.catPh': 'زمرے کا نام', 'console.addCat': 'زمرہ شامل کریں', 'console.catInfo': 'زمرے بہتر ٹریکنگ اور رپورٹنگ کے لیے آپ کے لیجر اندراجات کو منظم کرتے ہیں۔',
                'console.ledgerCats': 'لیجر زمرے', 'console.insertName': 'نام درج کریں', 'console.insert': 'درج کریں',
                'console.genColors': 'بنائیں', 'console.add': 'شامل کریں', 'console.noStates': 'ابھی کوئی اسٹیٹس متعین نہیں',
                'console.statusInfo': 'کسٹم اسٹیٹس سیٹس آپ کی اپنی اسٹیٹس تعریفوں اور رنگوں کے ساتھ گرِڈ کنسولز کو بڑھاتے ہیں۔',
                'console.statusSets': 'کسٹم اسٹیٹس سیٹس', 'console.colorHint': 'رنگ تبدیل کرنے کے لیے کلک کریں',
                'recycle.title': 'ری سائیکل بن', 'recycle.search': 'تلاش کریں...', 'recycle.all': 'تمام اقسام',
                'recycle.module': 'ماڈیولز', 'recycle.ledger': 'لیجر اندراجات', 'recycle.note': 'نوٹس',
                'recycle.picture': 'تصاویر', 'recycle.budget': 'بجٹ', 'recycle.category': 'زمرے',
                'recycle.status': 'اسٹیٹس سیٹس', 'recycle.gridRecord': 'گرِڈ ریکارڈز', 'recycle.archive': 'محفوظ شدہ',
                'recycle.expense': 'اخراجات', 'recycle.calcRecord': 'کیلکولیٹر ریکارڈز',
                'recycle.ageRecord': 'عمر ریکارڈز', 'recycle.printDoc': 'پرنٹ دستاویزات',
                'recycle.newest': 'تازہ ترین', 'recycle.oldest': 'قدیم ترین',
                'recycle.name': 'نام', 'recycle.type': 'قسم', 'recycle.total': 'کل اشیاء:',
                'recycle.emptyTitle': 'ری سائیکل بن خالی ہے', 'recycle.emptySub': 'حذف شدہ اشیاء یہاں ظاہر ہوں گی جب آپ انہیں ہٹائیں گے۔',
                'storage.title': 'مہینہ ختم محفوظات', 'storage.eom': 'مہینے کے آخر کی محفوظات', 'storage.notes': 'نوٹس',
                'storage.total': 'کل:',
                'print.title': 'پرنٹ', 'print.docs': 'دستاویزات', 'print.pdfs': 'PDFs', 'print.reports': 'رپورٹس',
                'print.mode': 'PDF / پرنٹ', 'print.options': 'پرنٹ کے اختیارات', 'print.export': 'PDF ایکسپورٹ کریں', 'print.direct': 'براہِ راست پرنٹ',
                'print.gen': 'بنائیں', 'print.reportsTitle': 'رپورٹس', 'print.gridRecords': 'گرِڈ ریکارڈز',
                'print.financeRecords': 'مالی ریکارڈز', 'print.genReport': 'رپورٹ بنائیں', 'print.history': 'پرنٹ ہسٹری',
                'print.total': 'کل:',
                'profile.title': 'پروفائل', 'profile.changePhoto': 'تصویر تبدیل کریں', 'profile.accountInfo': 'اکاؤنٹ کی معلومات',
                'profile.fullName': 'مکمل نام', 'profile.username': 'صارف نام', 'profile.email': 'ای میل',
                'profile.phone': 'فون', 'profile.dob': 'تاریخ پیدائش', 'profile.gender': 'جنس',
                'profile.gender.na': 'کوئی رائے نہیں', 'profile.gender.male': 'مرد', 'profile.gender.female': 'خاتون',
                'profile.gender.na': 'کہنا نہیں چاہتا', 'profile.gender.male': 'مرد', 'profile.gender.female': 'خاتون',
                'profile.gender.other': 'دیگر', 'profile.status': 'اسٹیٹس', 'profile.memberSince': 'رکن از',
                'profile.myData': 'میرا ایپ ڈیٹا', 'profile.totalGrids': 'کل گرِڈز', 'profile.activeGrids': 'فعال گرِڈز',
                'profile.totalLedgers': 'کل لیجرز', 'profile.activeLedgers': 'فعال لیجرز',
                'profile.totalNotes': 'کل نوٹس', 'profile.storageUsed': 'استعمال شدہ اسٹوریج', 'profile.preferences': 'ترجیحات',
                'profile.weeklyReports': 'ہفتہ وار رپورٹس', 'profile.sessionInfo': 'سیشن کی معلومات',
                'profile.lastLogin': 'آخری لاگ ان', 'profile.ip': 'IP ایڈریس', 'profile.device': 'ڈیوائس',
                'profile.save': 'تبدیلیاں محفوظ کریں', 'profile.insert': 'درج کریں',
                'theme.title': 'تھیم', 'theme.dark': 'ڈارک تھیم', 'theme.desc': 'لائٹ اور ڈارک موڈ کے درمیان سوئچ کریں۔',
                'notif.title': 'اطلاعات', 'notif.enable': 'یاد دہانیاں فعال کریں',
                'notif.desc': 'زیر التواء کاموں کے لیے براؤزر اطلاعات حاصل کریں۔', 'notif.current': 'موجودہ زیر التواء کام',
                'notif.empty': 'کوئی زیر التواء کام نہیں۔',
                'about.designedBy': 'ڈیزائن کردہ', 'about.engine': 'انجن', 'about.platform': 'پلیٹ فارم',
                'about.platformVal': 'ویب - PWA تیار', 'about.security': 'سیکیورٹی', 'about.securityVal': 'انڈیکس ڈی بی (Dexie.js) - انکرپٹڈ',
                'about.telegram': 'ٹیلیگرام', 'about.whatsapp': 'واٹس ایپ', 'about.github': 'گٹ ہب',
                'about.copyright': 'کاپی رائٹ \u00A9 2026 AETHER - جملہ حقوق محفوظ ہیں',
                'about.description': 'AETHER ایک آل ان ون ذاتی ٹریکنگ اور پروداکٹیوٹی PWA ہے جو گرِڈز، مالیات، نوٹس اور تجزیات کو سنبھالنے کے لیے ڈیزائن کیا گیا ہے - مکمل طور پر آف لائن مقامی خفیہ اسٹوریج کے ساتھ۔',
                'about.language': 'زبان', 'about.offline': 'آف لائن سپورٹ', 'about.offlineVal': 'مکمل PWA - آف لائن کام کرتا ہے',
                'about.privacy': 'رازداری', 'about.privacyVal': 'کوئی سرور نہیں - ڈیٹا مقامی رہتا ہے',
                'about.features': 'اہم خصوصیات',
                'about.featGrids': 'گرِڈ ٹریکنگ', 'about.featFinance': 'مالیاتی انتظام',
                'about.featNotes': 'نوٹس اور دستاویزات', 'about.featAnalytics': 'تجزیات',
                'about.featPrint': 'پرنٹ اور ایکسپورٹ', 'about.featStorage': 'انڈیکس ڈی بی اسٹوریج',
                'social.followUs': 'ہمیں فالو کریں',
                'calc.title': 'کیلکولیٹر', 'calc.record': 'ریکارڈ', 'calc.totalItems': 'کل آئٹمز',
                'reset.wipe': 'تمام ڈیٹا مٹائیں؟', 'reset.desc': 'یہ آپ کا تمام ڈیٹا بشمول گرِڈز، مالی اندراجات، نوٹس، تصاویر اور ترتیبات مستقل طور پر ختم کر دے گا۔ اس عمل کو واپس نہیں کیا جا سکتا۔',
                'reset.yes': 'ہاں، سب کچھ ری سیٹ کریں',
                'reset.dataTitle': 'یہ مستقل طور پر ہٹا دے گا:',
                'reset.itemModules': 'گرِڈ ماڈیولز اور ریکارڈز',
                'reset.itemLedgers': 'لیجر اور مالی اندراجات',
                'reset.itemNotes': 'نوٹس اور طے شدہ اشیاء',
                'reset.itemPictures': 'تصاویر',
                'reset.itemBudgets': 'بجٹ، زمرے اور اسٹیٹس سیٹس',
                'reset.itemArchives': 'محفوظات، پرنٹ ہسٹری اور سرگرمی لاگ',
                'reset.itemSettings': 'ذاتی ترتیبات اور ترجیحات',
                'reset.iUnderstand': 'میں سمجھتا ہوں کہ یہ عمل مستقل ہے اور اسے واپس نہیں کیا جا سکتا۔',
                'reset.typeReset': 'تصدیق کے لیے RESET لکھیں',
                'reset.typeRequired': 'براہ کرم RESET لکھیں اور آگے بڑھنے کے لیے تصدیقی خانے کو نشان زد کریں۔',
                'reset.confirmWipe': 'کیا آپ واقعی یقینی ہیں؟ یہ تمام ڈیٹا مستقل طور پر حذف کر دے گا۔',
                'analytics.title': 'تجزیات', 'analytics.today': 'آج', 'analytics.yesterday': 'کل',
                'analytics.week': 'اس ہفتے', 'analytics.month': 'اس مہینے', 'analytics.last3': '3 ماہ',
                'analytics.last6': '6 ماہ', 'analytics.year': 'سال', 'analytics.all': 'تمام وقت',
                'analytics.overview': 'جائزہ', 'analytics.grids': 'گرِڈز', 'analytics.finance': 'مالیات',
                'analytics.notes': 'نوٹس', 'analytics.recycle': 'ری سائیکل',
                'nav.home': 'ہوم', 'nav.grids': 'گرِڈز', 'nav.finance': 'مالیات', 'nav.notes': 'نوٹس',
                'social.follow': 'ہمیں فالو کریں',
                'notes.noteTitle': 'نوٹ کا عنوان', 'notes.placeholder': 'آپ کے ذہن میں کیا ہے؟',
                'notes.chars': 'حروف', 'notes.words': 'الفاظ', 'notes.autosaved': 'خودکار محفوظ',
                'notes.savedJust': 'ابھی محفوظ ہوا', 'notes.savedStorage': 'اسٹوریج میں محفوظ',
                'drawer.emptyGrids': 'کوئی گرِڈ ماڈیول نہیں ملا۔', 'drawer.emptyLedgers': 'کوئی لیجر ماڈیول نہیں ملا۔',
                'ce.noCats': 'کوئی زمرہ متعین نہیں۔', 'ce.noCustomSets': 'کوئی کسٹم سیٹ متعین نہیں۔',
                'ce.noSetsHint': 'کوئی کسٹم سیٹ متعین نہیں۔ اوپر ایک بنائیں!',
                'empty.entriesMonth': 'اس مہینے کوئی اندراج ریکارڈ نہیں ہوا۔', 'empty.noRecordsYet': 'ابھی کوئی ریکارڈ نہیں۔ بھرنے کے لیے لیجر ماڈیول میں "ریکارڈ میں شامل کریں" یا گرِڈ ماڈیول میں "ریکارڈز میں شامل کریں" استعمال کریں۔',
                'empty.noEntriesWeek': 'اس ہفتے کوئی اندراج نہیں۔', 'empty.noGridRecords': 'ابھی کوئی گرِڈ ریکارڈ نہیں۔ کسی بھی گرِڈ ماڈیول میں "ریکارڈز میں شامل کریں" استعمال کریں۔',
                'empty.noEntries': 'کوئی اندراج ریکارڈ نہیں۔', 'ce.noGrids': 'ابھی کوئی گرِڈ ماڈیول نہیں بنایا گیا۔',
                'ce.noFinance': 'ابھی کوئی مالی ماڈیول نہیں بنایا گیا۔', 'empty.noArchives': 'کوئی محفوظات نہیں۔',
                'empty.noNotes': 'کوئی نوٹس نہیں۔', 'empty.noPictures': 'کوئی تصاویر نہیں۔', 'bin.empty': 'بن خالی ہے۔',
                'storage.noNotesArchived': 'کوئی نوٹ محفوظ نہیں۔', 'storage.noPictures': 'کوئی تصویر نہیں لی گئی۔',
                'print.noHistory': 'ابھی کوئی پرنٹ ہسٹری نہیں۔', 'chart.noData': 'کوئی ڈیٹا نہیں',
                'search.noResults': '"{q}" کے لیے کوئی نتیجہ نہیں ملا', 'search.more': '+ {n} مزید نتائج',
                'Profile saved': 'پروفائل محفوظ ہو گئی', 'Changes discarded': 'تبدیلیاں مسترد',
                'Language preference saved': 'زبان کی ترجیح محفوظ ہو گئی', 'Currency preference saved': 'کرنسی کی ترجیح محفوظ ہو گئی',
                'Profile photo updated': 'پروفائل تصویر اپ ڈیٹ ہو گئی', 'Profile photo removed': 'پروفائل تصویر ہٹا دی گئی',
                'Username is required': 'صارف نام ضروری ہے', 'Full name is required': 'مکمل نام ضروری ہے',
                'Credentials saved': 'اسناد محفوظ ہو گئیں', 'Credentials removed': 'اسناد ہٹا دی گئیں',
                'Password changed successfully': 'پاس ورڈ کامیابی سے تبدیل ہو گیا', 'Current password is incorrect': 'موجودہ پاس ورڈ غلط ہے',
                'Please fill all fields': 'براہ کرم تمام خانے بھریں', 'Please enter a name': 'براہ کرم ایک نام درج کریں',
                'Please enter item and amount': 'براہ کرم آئٹم اور رقم درج کریں', 'Amount must be greater than 0': 'رقم 0 سے زیادہ ہونی چاہیے',
                'Please enter a title to save': 'محفوظ کرنے کے لیے براہ کرم ایک عنوان درج کریں', 'Note saved successfully': 'نوٹ کامیابی سے محفوظ ہو گیا',
                'Note draft saved': 'نوٹ کا مسودہ محفوظ ہو گیا', 'Note loaded': 'نوٹ لوڈ ہو گیا', 'Note deleted': 'نوٹ حذف ہو گیا',
                'Note renamed': 'نوٹ کا نام تبدیل ہو گیا', 'Nothing to save': 'محفوظ کرنے کے لیے کچھ نہیں', 'Draft deleted': 'مسودہ حذف ہو گیا',
                'Added to expense successfully': 'اخراجات میں کامیابی سے شامل ہو گیا', 'Added to records': 'ریکارڈز میں شامل ہو گیا',
                'All entries already in record': 'تمام اندراجات پہلے سے ریکارڈ میں ہیں', 'No entries to add to record': 'ریکارڈ میں شامل کرنے کے لیے کوئی اندراج نہیں',
                'Entry added successfully': 'اندراج کامیابی سے شامل ہوا', 'Entry updated': 'اندراج اپ ڈیٹ ہو گیا',
                'Entry deleted': 'اندراج حذف ہو گیا', 'Entry not found': 'اندراج نہیں ملا', 'Duplicate entry': 'نقل اندراج',
                'No data to add': 'شامل کرنے کے لیے کوئی ڈیٹا نہیں', 'Expense entry updated': 'اخراج اندراج اپ ڈیٹ ہو گیا',
                'Expense entry deleted': 'اخراج اندراج حذف ہو گیا', 'Grid record updated': 'گرِڈ ریکارڈ اپ ڈیٹ ہو گیا',
                'Grid record deleted': 'گرِڈ ریکارڈ حذف ہو گیا', 'Module deleted': 'ماڈیول حذف ہو گیا',
                'Category deleted': 'زمرہ حذف ہو گیا', 'Category is in use by a ledger': 'زمرہ کسی لیجر میں استعمال ہو رہا ہے',
                'Status updated': 'اسٹیٹس اپ ڈیٹ ہو گیا', 'Status set created': 'اسٹیٹس سیٹ بن گیا',
                'Status set deleted': 'اسٹیٹس سیٹ حذف ہو گیا', 'Status set is in use by a grid': 'اسٹیٹس سیٹ کسی گرِڈ میں استعمال ہو رہا ہے',
                'Status removed': 'اسٹیٹس ہٹا دیا گیا', 'Add at least 2 state names': 'کم از کم 2 اسٹیٹس نام شامل کریں',
                'Item restored': 'آئٹم بحال ہو گیا', 'Item permanently deleted': 'آئٹم مستقل طور پر حذف ہو گیا',
                'Recycle Bin emptied': 'ری سائیکل بن خالی کر دیا گیا', 'Archive deleted': 'محفوظہ حذف ہو گیا',
                'Archive downloaded': 'محفوظہ ڈاؤن لوڈ ہو گیا', 'Archive renamed': 'محفوظہ کا نام تبدیل ہو گیا',
                'Document removed from history': 'دستاویز ہسٹری سے ہٹا دی گئی', 'Select a print option': 'پرنٹ کا اختیار منتخب کریں',
                'Logged out successfully': 'کامیابی سے لاگ آؤٹ ہو گیا', 'Could not read image': 'تصویر نہیں پڑھی جا سکی',
                'Could not save photo': 'تصویر محفوظ نہیں ہو سکی', 'Please choose an image file': 'براہ کرم ایک تصویری فائل منتخب کریں',
                'Picture deleted': 'تصویر حذف ہو گئی', 'Picture renamed': 'تصویر کا نام تبدیل ہو گیا',
                'Opening {name}': '{name} کھولا جا رہا ہے', 'Budget "{name}" saved': 'بجٹ "{name}" محفوظ ہو گیا',
                'Budget "{name}" updated': 'بجٹ "{name}" اپ ڈیٹ ہو گیا', 'Grid "{name}" deleted': 'گرِڈ "{name}" حذف ہو گیا',
                'Ledger "{name}" deleted': 'لیجر "{name}" حذف ہو گیا', 'Category "{name}" deleted': 'زمرہ "{name}" حذف ہو گیا',
                'Status set "{name}" deleted': 'اسٹیٹس سیٹ "{name}" حذف ہو گیا',
                'Grid "{name}" created': 'گرِڈ "{name}" بن گیا', 'Ledger "{name}" created': 'لیجر "{name}" بن گیا',
                'Budget "{name}" created': 'بجٹ "{name}" بن گیا', 'Category "{name}" added': 'زمرہ "{name}" شامل ہو گیا',
                'Status set "{name}" created': 'اسٹیٹس سیٹ "{name}" بن گیا',
                '{count} item(s) restored': '{count} اشیاء بحال ہو گئیں', '{count} item(s) permanently deleted': '{count} اشیاء مستقل طور پر حذف ہو گئیں',
                '{count} entry(s) added to record': '{count} اندراجات ریکارڈ میں شامل ہو گئے',
                'Notification on for {name}': '{name} کے لیے اطلاع آن', 'Notification off for {name}': '{name} کے لیے اطلاع بند',
                'Module "{name}" enabled': 'ماڈیول "{name}" فعال ہو گیا', 'Module "{name}" disabled': 'ماڈیول "{name}" غیر فعال ہو گیا',
                'Picture updated': 'تصویر اپ ڈیٹ ہو گئی', 'Picture saved': 'تصویر محفوظ ہو گئی',
                'Downloaded': 'ڈاؤنلوڈ ہو گیا', 'Sharing not supported on this device': 'اس ڈیوائس پر شیئرنگ دستیاب نہیں',
                'Delete account? This permanently removes ALL grids, ledgers, notes, pictures, settings and credentials. This cannot be undone.': 'اکاؤنٹ حذف کریں؟ یہ تمام گرِڈز، لیجرز، نوٹس، تصاویر، ترتیبات اور اسناد مستقل طور پر ختم کر دے گا۔ اسے واپس نہیں کیا جا سکتا۔',
                'Are you sure you want to log out? Your data will remain safe.': 'کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟ آپ کا ڈیٹا محفوظ رہے گا۔',
                '?? ARE YOU SURE? This will permanently delete ALL data.': '?? کیا آپ واقعی یقین رکھتے ہیں؟ یہ تمام ڈیٹا مستقل طور پر حذف کر دے گا۔',
                'Are you sure you want to permanently delete all items in the Recycle Bin?': 'کیا آپ واقعی ری سائیکل بن کی تمام اشیاء مستقل طور پر حذف کرنا چاہتے ہیں؟',
                'Permanently delete {count} selected item(s)?': '{count} منتخب اشیاء مستقل طور پر حذف کریں؟',
                'Permanently delete ALL {count} items in Recycle Bin?': 'ری سائیکل بن کی تمام {count} اشیاء مستقل طور پر حذف کریں؟',
                'Erase {name} archive?': '{name} محفوظہ مٹائیں؟', 'Delete custom set "{name}"?': 'کسٹم سیٹ "{name}" حذف کریں؟',
                'Delete module "{name}"?': 'ماڈیول "{name}" حذف کریں؟',
                'Active User': 'فعال صارف', 'Guest': 'مہمان', 'Active': 'فعال',
                'Weekly reports enabled': 'ہفتہ وار رپورٹس فعال ہیں', 'Weekly reports disabled': 'ہفتہ وار رپورٹس غیر فعال ہیں'
            },

            ar: {
                'app.name': 'AETHER', 'app.version': 'الإصدار ' + APP_VERSION_CODE, 'credit': 'تقنيات التتبع المتقدمة',
                'search.ph': 'بحث...', 'common.ok': 'موافق', 'common.yes': 'نعم', 'common.no': 'لا',
                'common.cancel': 'إلغاء', 'common.save': 'حفظ',
                'lock.welcome': 'مرحباً', 'lock.password': 'كلمة المرور', 'lock.unlock': 'فتح',
                'lock.designed': 'تصميم وهندسة',
                'lock.secureWorkspace': 'مساحة عمل آمنة', 'lock.welcomeBack': 'مرحباً بعودتك',
                'lock.enterPassword': 'أدخل كلمة المرور للمتابعة', 'lock.unlockAether': 'فتح Aether',
                'lock.unlocking': 'جاري الفتح', 'lock.incorrectPassword': 'كلمة المرور غير صحيحة',
                'lock.protectedLocal': 'مساحة عمل محلية محمية',
                'login.title': 'مرحباً بعودتك', 'login.subtitle': 'سجل الدخول إلى حسابك',
                'login.username': 'اسم المستخدم', 'login.usernamePh': 'أدخل اسم المستخدم',
                'login.password': 'كلمة المرور', 'login.passwordPh': 'أدخل كلمة المرور',
                'login.remember': 'تذكرني', 'login.forgot': 'نسيت كلمة المرور؟',
                'login.submit': 'تسجيل الدخول', 'login.loggingIn': 'جاري تسجيل الدخول...',
                'login.signup': 'إنشاء حساب', 'login.noAccount': 'ليس لديك حساب؟',
                'login.error.required': 'البريد الإلكتروني مطلوب.', 'login.error.email': 'يرجى إدخال بريد إلكتروني صالح.',
                'login.error.passReq': 'كلمة المرور مطلوبة.', 'login.error.passMin': 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.',
                'login.error.invalid': 'اسم مستخدم أو كلمة مرور غير صحيحة.',
                'login.error.rateLimit': 'محاولات كثيرة جداً. حاول مرة أخرى لاحقاً.',
                'login.error.generic': 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
                'login.capslock': 'مفتاح Caps Lock مفعّل',
                'login.success': 'تم تسجيل الدخول بنجاح',
                'notify.title': 'قيد الانتظار', 'notify.empty': 'لا توجد مهام جديدة.', 'notify.allCaughtUp': 'لا توجد مهام معلقة. كل شيء مكتمل! ',
                'alert.title': 'تنبيه', 'confirm.title': 'تأكيد',
                'cam.rotate': 'تدوير', 'cam.crop': 'قص', 'cam.save': 'حفظ',
                'archive.title': 'الأرشيف', 'archive.download': 'تنزيل PDF',
                'rename.title': 'إعادة تسمية', 'rename.ph': 'أدخل عنواناً جديداً', 'rename.btn': 'إعادة تسمية', 'rename.new': 'عنوان جديد',
                'ledgerEdit.title': 'تعديل المصروف', 'ledgerEdit.item': 'اسم الصنف', 'ledgerEdit.amount': 'المبلغ',
                'ledgerEdit.qty': 'الكمية', 'ledgerEdit.cat': 'الفئة', 'ledgerEdit.save': 'حفظ التغييرات',
                'drawer.title': 'الدرج', 'drawer.gridTotal': 'إجمالي الشبكات:', 'drawer.ledgerTotal': 'إجمالي الدفاتر:',
                'menu.home': 'الرئيسية', 'menu.grids': 'الشبكات', 'menu.finance': 'المالية', 'menu.notes': 'الملاحظات',
                'menu.console': 'محرك الكونسول', 'menu.budget': 'الميزانية', 'menu.category': 'الفئة', 'menu.status': 'الحالة',
                'menu.analytics': 'التحليلات', 'menu.recycle': 'سلة المحذوفات', 'menu.storage': 'التخزين',
                'menu.archives': 'الأرشيف', 'menu.pictures': 'الصور', 'menu.print': 'الطباعة', 'menu.profile': 'الملف الشخصي',
                'menu.theme': 'المظهر', 'menu.notifications': 'الإشعارات', 'menu.settings': 'الإعدادات',
                'menu.calculator': 'الآلة الحاسبة', 'menu.calcSimple': 'بسيطة', 'menu.age': 'العمر', 'menu.about': 'حول', 'menu.reset': 'إعادة ضبط المصنع',
                'age.title': 'حاسبة العمر', 'age.dob': 'تاريخ الميلاد', 'age.calc': 'احسب', 'age.years': 'سنوات', 'age.months': 'أشهر', 'age.days': 'أيام', 'age.hours': 'ساعات', 'age.minutes': 'دقائق', 'age.seconds': 'ثواني', 'age.enter': 'أدخل تاريخ ميلادك.', 'age.invalid': 'يرجى إدخال تاريخ سابق صحيح.',
                'prof.myProfile': 'ملفي الشخصي', 'prof.changePass': 'تغيير كلمة المرور', 'prof.logout': 'تسجيل الخروج',
                'home.welcome': 'مرحباً', 'home.goodMorning': 'صباح الخير', 'home.goodAfternoon': 'مساء الخير',
                'home.goodEvening': 'مساء الخير', 'home.goodNight': 'طاب مساؤك',
                'home.finStatus': 'الوضع المالي', 'home.instantAnalysis': 'تحليل فوري', 'home.budget': 'الميزانية',
                'home.expense': 'المصروف', 'home.remaining': 'المتبقي', 'home.breakdown': 'التفصيل',
                'home.finance': 'المالية', 'home.grid': 'الشبكة', 'home.noGridAnalytics': 'لا توجد تحليلات للشبكات.',
                'home.progress': 'تتبع التقدم',
                'settings.title': 'الإعدادات', 'settings.password': 'كلمة المرور', 'settings.deactivated': 'معطل',
                'settings.activated': 'مفعل', 'settings.manage': 'إدارة بيانات دخول التطبيق.',
                'settings.username': 'اسم المستخدم', 'settings.passMin': 'كلمة المرور (8 أحرف على الأقل)', 'settings.remove': 'إزالة',
                'settings.secure': 'البيانات تحفظ بياناتك المحلية بأمان.', 'settings.updatePass': 'تحديث كلمة المرور',
                'settings.updateHint': 'أدخل كلمة المرور الحالية ثم عيّن كلمة جديدة (8 أحرف على الأقل).',
                'settings.currentPass': 'كلمة المرور الحالية', 'settings.newPassMin': 'كلمة المرور الجديدة (8 أحرف على الأقل)',
                'settings.confirmNew': 'تأكيد كلمة المرور الجديدة', 'settings.preferences': 'التفضيلات',
                'settings.language': 'اللغة', 'settings.currency': 'العملة', 'settings.dangerZone': 'منطقة الخطر',
                'settings.dangerText': 'حذف حسابك يزيل نهائياً جميع الشبكات والدفاتر والملاحظات والصور والإعدادات. لا يمكن التراجع عن هذا الإجراء.',
                'settings.deleteAccount': 'حذف الحساب', 'settings.lang.en': 'الإنجليزية', 'settings.lang.ur': 'الأردية',
                'settings.lang.ar': 'العربية', 'settings.noModules': 'لم يتم اكتشاف وحدات نشطة. أنشئ وحدة جديدة من محرك الكونسول لبدء التتبع.',
                'settings.permanent': 'دائمة', 'settings.restore': 'استعادة', 'settings.see': 'عرض',
                'settings.edit': 'تعديل', 'settings.delete': 'حذف', 'storage.noEomArchives': 'لم يتم إنشاء أرشيف نهاية الشهر.',
                'console.createGrid': 'إنشاء كونسول الشبكة', 'console.name': 'الاسم', 'console.namePh': 'اسم الكونسول',
                'console.type': 'النوع', 'console.state': 'الحالة', 'console.genGrid': 'إنشاء الشبكة',
                'console.gridInfo': 'كونسولات الشبكة تتبع الحالة اليومية (الحضور، المهام، إلخ) مع عرض تقويم مرئي.',
                'console.gridModules': 'وحدات الشبكة', 'console.createFinance': 'إنشاء دفتر مالي',
                'console.genLedger': 'إنشاء الدفتر', 'console.finInfo': 'الدفاتر المالية تتبع المصروفات والدخل والميزانيات مع إدخالات مفصلة.',
                'console.finModules': 'الوحدات المالية', 'console.createBudget': 'إنشاء ميزانية جديدة',
                'console.budgetPh': 'اسم الميزانية', 'console.gen': 'إنشاء', 'console.budgetInfo': 'الميزانيات تساعدك على تخصيص الأموال عبر الفئات المختلفة.',
                'console.budgetCats': 'فئات الميزانية', 'console.createCat': 'إضافة فئة جديدة',
                'console.catPh': 'اسم الفئة', 'console.addCat': 'إضافة فئة', 'console.catInfo': 'الفئات تنظم إدخالات دفترك لتتبع وإعداد تقارير أفضل.',
                'console.ledgerCats': 'فئات الدفتر', 'console.insertName': 'إدراج الاسم', 'console.insert': 'إدراج',
                'console.genColors': 'إنشاء', 'console.add': 'إضافة', 'console.noStates': 'لم يتم تحديد حالات بعد',
                'console.statusInfo': 'مجموعات الحالات المخصصة توسع كونسولات الشبكة بتعريفات الحالات والألوان الخاصة بك.',
                'console.statusSets': 'مجموعات الحالات المخصصة', 'console.colorHint': 'انقر لتغيير اللون',
                'recycle.title': 'سلة المحذوفات', 'recycle.search': 'بحث...', 'recycle.all': 'جميع الأنواع',
                'recycle.module': 'الوحدات', 'recycle.ledger': 'إدخالات الدفتر', 'recycle.note': 'الملاحظات',
                'recycle.picture': 'الصور', 'recycle.budget': 'الميزانيات', 'recycle.category': 'الفئات',
                'recycle.status': 'مجموعات الحالات', 'recycle.gridRecord': 'سجلات الشبكات', 'recycle.archive': 'الأرشيف',
                'recycle.expense': 'المصروفات', 'recycle.calcRecord': 'سجلات الحاسبة',
                'recycle.ageRecord': 'سجلات العمر', 'recycle.printDoc': 'مستندات الطباعة',
                'recycle.newest': 'الأحدث', 'recycle.oldest': 'الأقدم',
                'recycle.name': 'الاسم', 'recycle.type': 'النوع', 'recycle.total': 'إجمالي العناصر:',
                'recycle.emptyTitle': 'سلة المحذوفات فارغة', 'recycle.emptySub': 'ستظهر العناصر المحذوفة هنا عند إزالتها.',
                'storage.title': 'أرشيف نهاية الشهر', 'storage.eom': 'أرشيف نهاية الشهر', 'storage.notes': 'الملاحظات',
                'storage.total': 'الإجمالي:',
                'print.title': 'الطباعة', 'print.docs': 'المستندات', 'print.pdfs': 'ملفات PDF', 'print.reports': 'التقارير',
                'print.mode': 'PDF / طباعة', 'print.options': 'خيارات الطباعة', 'print.export': 'تصدير PDF', 'print.direct': 'طباعة مباشرة',
                'print.gen': 'إنشاء', 'print.reportsTitle': 'التقارير', 'print.gridRecords': 'سجلات الشبكات',
                'print.financeRecords': 'السجلات المالية', 'print.genReport': 'إنشاء تقرير', 'print.history': 'سجل الطباعة',
                'print.total': 'الإجمالي:',
                'profile.title': 'الملف الشخصي', 'profile.changePhoto': 'تغيير الصورة', 'profile.accountInfo': 'معلومات الحساب',
                'profile.fullName': 'الاسم الكامل', 'profile.username': 'اسم المستخدم', 'profile.email': 'البريد الإلكتروني',
                'profile.phone': 'الهاتف', 'profile.dob': 'تاريخ الميلاد', 'profile.gender': 'الجنس',
                'profile.gender.na': 'أفضل عدم الإجابة', 'profile.gender.male': 'ذكر', 'profile.gender.female': 'أنثى',
                'profile.gender.na': 'أفضل عدم الإفصاح', 'profile.gender.male': 'ذكر', 'profile.gender.female': 'أنثى',
                'profile.gender.other': 'أخرى', 'profile.status': 'الحالة', 'profile.memberSince': 'عضو منذ',
                'profile.myData': 'بياناتي في التطبيق', 'profile.totalGrids': 'إجمالي الشبكات', 'profile.activeGrids': 'الشبكات النشطة',
                'profile.totalLedgers': 'إجمالي الدفاتر', 'profile.activeLedgers': 'الدفاتر النشطة',
                'profile.totalNotes': 'إجمالي الملاحظات', 'profile.storageUsed': 'التخزين المستخدم', 'profile.preferences': 'التفضيلات',
                'profile.weeklyReports': 'التقارير الأسبوعية', 'profile.sessionInfo': 'معلومات الجلسة',
                'profile.lastLogin': 'آخر تسجيل دخول', 'profile.ip': 'عنوان IP', 'profile.device': 'الجهاز',
                'profile.save': 'حفظ التغييرات', 'profile.insert': 'إدراج',
                'theme.title': 'المظهر', 'theme.dark': 'المظهر الداكن', 'theme.desc': 'بدّل بين الوضعين الفاتح والداكن.',
                'notif.title': 'الإشعارات', 'notif.enable': 'تفعيل التذكيرات',
                'notif.desc': 'استقبل إشعارات المتصفح للمهام المعلقة.', 'notif.current': 'المهام المعلقة الحالية',
                'notif.empty': 'لا توجد مهام معلقة.',
                'about.designedBy': 'صممه', 'about.engine': 'المحرك', 'about.platform': 'المنصة',
                'about.platformVal': 'ويب - جاهز لـ PWA', 'about.security': 'الأمان', 'about.securityVal': 'IndexedDB (Dexie.js) - مشفر',
                'about.telegram': 'تيليجرام', 'about.whatsapp': 'واتساب', 'about.github': 'جيت هاب',
                'about.copyright': 'حقوق الطبع والنشر \u00A9 2026 AETHER - جميع الحقوق محفوظة',
                'about.description': 'AETHER تطبيق ويب متكامل للتتبع الشخصي والإنتاجية مصمم لإدارة الشبكات والماليات والملاحظات والتحليلات - يعمل دون اتصال مع تخزين محلي مشفر.',
                'about.language': 'اللغة', 'about.offline': 'الدعم دون اتصال', 'about.offlineVal': 'تطبيق ويب كامل - يعمل بدون إنترنت',
                'about.privacy': 'الخصوصية', 'about.privacyVal': 'لا خادم - البيانات تبقى محلية',
                'about.features': 'الميزات الرئيسية',
                'about.featGrids': 'تتبع الشبكات', 'about.featFinance': 'إدارة المالية',
                'about.featNotes': 'الملاحظات والمستندات', 'about.featAnalytics': 'التحليلات',
                'about.featPrint': 'الطباعة والتصدير', 'about.featStorage': 'تخزين IndexedDB',
                'social.followUs': 'تابعنا',
                'calc.title': 'الآلة الحاسبة', 'calc.record': 'السجل', 'calc.totalItems': 'إجمالي العناصر',
                'reset.wipe': 'مسح كل البيانات؟', 'reset.desc': 'سيؤدي هذا إلى مسح جميع بياناتك نهائياً بما في ذلك الشبكات والإدخالات المالية والملاحظات والصور والإعدادات. لا يمكن التراجع عن هذا الإجراء.',
                'reset.yes': 'نعم، إعادة تعيين كل شيء',
                'reset.dataTitle': 'سيؤدي هذا إلى الإزالة الدائمة:',
                'reset.itemModules': 'وحدات الشبكات والسجلات',
                'reset.itemLedgers': 'إدخالات الدفتر والمالية',
                'reset.itemNotes': 'الملاحظات والعناصر المجدولة',
                'reset.itemPictures': 'الصور',
                'reset.itemBudgets': 'الميزانيات والفئات ومجموعات الحالات',
                'reset.itemArchives': 'الأرشيف وسجل الطباعة وسجل النشاط',
                'reset.itemSettings': 'الإعدادات والتفضيلات الشخصية',
                'reset.iUnderstand': 'أفهم أن هذا الإجراء دائم ولا يمكن التراجع عنه.',
                'reset.typeReset': 'اكتب RESET للتأكيد',
                'reset.typeRequired': 'يرجى كتابة RESET وتحديد مربع التأكيد للمتابعة.',
                'reset.confirmWipe': 'هل أنت متأكد؟ سيؤدي هذا إلى حذف جميع البيانات نهائياً.',
                'analytics.title': 'التحليلات', 'analytics.today': 'اليوم', 'analytics.yesterday': 'أمس',
                'analytics.week': 'هذا الأسبوع', 'analytics.month': 'هذا الشهر', 'analytics.last3': '3 أشهر',
                'analytics.last6': '6 أشهر', 'analytics.year': 'السنة', 'analytics.all': 'كل الوقت',
                'analytics.overview': 'نظرة عامة', 'analytics.grids': 'الشبكات', 'analytics.finance': 'المالية',
                'analytics.notes': 'الملاحظات', 'analytics.recycle': 'سلة المحذوفات',
                'nav.home': 'الرئيسية', 'nav.grids': 'الشبكات', 'nav.finance': 'المالية', 'nav.notes': 'الملاحظات',
                'social.follow': 'تابعنا',
                'notes.noteTitle': 'عنوان الملاحظة', 'notes.placeholder': 'ماذا يدور في ذهنك؟',
                'notes.chars': 'حرفاً', 'notes.words': 'كلمة', 'notes.autosaved': 'حفظ تلقائي',
                'notes.savedJust': 'تم الحفظ الآن', 'notes.savedStorage': 'تم الحفظ في التخزين',
                'drawer.emptyGrids': 'لم يتم العثور على وحدات شبكة.', 'drawer.emptyLedgers': 'لم يتم العثور على وحدات دفاتر.',
                'ce.noCats': 'لم يتم تحديد فئات.', 'ce.noCustomSets': 'لم يتم تحديد مجموعات مخصصة.',
                'ce.noSetsHint': 'لم يتم تحديد مجموعات مخصصة. أنشئ واحدة أعلاه!',
                'empty.entriesMonth': 'لا توجد إدخالات مسجلة لهذا الشهر.', 'empty.noRecordsYet': 'لا توجد سجلات بعد. استخدم "إضافة إلى السجل" في وحدة دفتر أو "إضافة إلى السجلات" في وحدة شبكة.',
                'empty.noEntriesWeek': 'لا توجد إدخالات هذا الأسبوع.', 'empty.noGridRecords': 'لا توجد سجلات شبكة بعد. استخدم "إضافة إلى السجلات" في أي وحدة شبكة.',
                'empty.noEntries': 'لا توجد إدخالات مسجلة.', 'ce.noGrids': 'لم يتم إنشاء وحدات شبكة بعد.',
                'ce.noFinance': 'لم يتم إنشاء وحدات مالية بعد.', 'empty.noArchives': 'لا يوجد أرشيف.',
                'empty.noNotes': 'لا توجد ملاحظات.', 'empty.noPictures': 'لا توجد صور.', 'bin.empty': 'السلة فارغة.',
                'storage.noNotesArchived': 'لا توجد ملاحظات مؤرشفة.', 'storage.noPictures': 'لم يتم التقاط صور.',
                'print.noHistory': 'لا يوجد سجل طباعة بعد.', 'chart.noData': 'لا توجد بيانات',
                'search.noResults': 'لا توجد نتائج لـ "{q}"', 'search.more': '+ {n} نتيجة أخرى',
                'Profile saved': 'تم حفظ الملف الشخصي', 'Changes discarded': 'تم تجاهل التغييرات',
                'Language preference saved': 'تم حفظ تفضيل اللغة', 'Currency preference saved': 'تم حفظ تفضيل العملة',
                'Profile photo updated': 'تم تحديث صورة الملف الشخصي', 'Profile photo removed': 'تمت إزالة صورة الملف الشخصي',
                'Username is required': 'اسم المستخدم مطلوب', 'Full name is required': 'الاسم الكامل مطلوب',
                'Credentials saved': 'تم حفظ بيانات الدخول', 'Credentials removed': 'تمت إزالة بيانات الدخول',
                'Password changed successfully': 'تم تغيير كلمة المرور بنجاح', 'Current password is incorrect': 'كلمة المرور الحالية غير صحيحة',
                'Please fill all fields': 'يرجى ملء جميع الحقول', 'Please enter a name': 'يرجى إدخال اسم',
                'Please enter item and amount': 'يرجى إدخال الصنف والمبلغ', 'Amount must be greater than 0': 'يجب أن يكون المبلغ أكبر من 0',
                'Please enter a title to save': 'يرجى إدخال عنوان للحفظ', 'Note saved successfully': 'تم حفظ الملاحظة بنجاح',
                'Note draft saved': 'تم حفظ مسودة الملاحظة', 'Note loaded': 'تم تحميل الملاحظة', 'Note deleted': 'تم حذف الملاحظة',
                'Note renamed': 'تمت إعادة تسمية الملاحظة', 'Nothing to save': 'لا يوجد شيء للحفظ', 'Draft deleted': 'تم حذف المسودة',
                'Added to expense successfully': 'تمت الإضافة إلى المصروفات بنجاح', 'Added to records': 'تمت الإضافة إلى السجلات',
                'All entries already in record': 'جميع الإدخالات موجودة بالفعل في السجل', 'No entries to add to record': 'لا توجد إدخالات لإضافتها إلى السجل',
                'Entry added successfully': 'تمت إضافة الإدخال بنجاح', 'Entry updated': 'تم تحديث الإدخال',
                'Entry deleted': 'تم حذف الإدخال', 'Entry not found': 'الإدخال غير موجود', 'Duplicate entry': 'إدخال مكرر',
                'No data to add': 'لا توجد بيانات لإضافتها', 'Expense entry updated': 'تم تحديث إدخال المصروف',
                'Expense entry deleted': 'تم حذف إدخال المصروف', 'Grid record updated': 'تم تحديث سجل الشبكة',
                'Grid record deleted': 'تم حذف سجل الشبكة', 'Module deleted': 'تم حذف الوحدة',
                'Category deleted': 'تم حذف الفئة', 'Category is in use by a ledger': 'الفئة مستخدمة في دفتر',
                'Status updated': 'تم تحديث الحالة', 'Status set created': 'تم إنشاء مجموعة الحالات',
                'Status set deleted': 'تم حذف مجموعة الحالات', 'Status set is in use by a grid': 'مجموعة الحالات مستخدمة في شبكة',
                'Status removed': 'تمت إزالة الحالة', 'Add at least 2 state names': 'أضف اسمين للحالة على الأقل',
                'Item restored': 'تمت استعادة العنصر', 'Item permanently deleted': 'تم حذف العنصر نهائياً',
                'Recycle Bin emptied': 'تم إفراغ سلة المحذوفات', 'Archive deleted': 'تم حذف الأرشيف',
                'Archive downloaded': 'تم تنزيل الأرشيف', 'Archive renamed': 'تمت إعادة تسمية الأرشيف',
                'Document removed from history': 'تمت إزالة المستند من السجل', 'Select a print option': 'حدد خيار الطباعة',
                'Logged out successfully': 'تم تسجيل الخروج بنجاح', 'Could not read image': 'تعذر قراءة الصورة',
                'Could not save photo': 'تعذر حفظ الصورة', 'Please choose an image file': 'يرجى اختيار ملف صورة',
                'Picture deleted': 'تم حذف الصورة', 'Picture renamed': 'تمت إعادة تسمية الصورة',
                'Opening {name}': 'فتح {name}', 'Budget "{name}" saved': 'تم حفظ الميزانية "{name}"',
                'Budget "{name}" updated': 'تم تحديث الميزانية "{name}"', 'Grid "{name}" deleted': 'تم حذف الشبكة "{name}"',
                'Ledger "{name}" deleted': 'تم حذف الدفتر "{name}"', 'Category "{name}" deleted': 'تم حذف الفئة "{name}"',
                'Status set "{name}" deleted': 'تم حذف مجموعة الحالات "{name}"',
                'Grid "{name}" created': 'تم إنشاء الشبكة "{name}"', 'Ledger "{name}" created': 'تم إنشاء الدفتر "{name}"',
                'Budget "{name}" created': 'تم إنشاء الميزانية "{name}"', 'Category "{name}" added': 'تمت إضافة الفئة "{name}"',
                'Status set "{name}" created': 'تم إنشاء مجموعة الحالات "{name}"',
                '{count} item(s) restored': 'تمت استعادة {count} عنصر', '{count} item(s) permanently deleted': 'تم حذف {count} عنصر نهائياً',
                '{count} entry(s) added to record': 'تمت إضافة {count} إدخال إلى السجل',
                'Notification on for {name}': 'إشعارات مفعلة لـ {name}', 'Notification off for {name}': 'إشعارات معطلة لـ {name}',
                'Module "{name}" enabled': 'تم تفعيل الوحدة "{name}"', 'Module "{name}" disabled': 'تم تعطيل الوحدة "{name}"',
                'Picture updated': 'تم تحديث الصورة', 'Picture saved': 'تم حفظ الصورة',
                'Downloaded': 'تم التنزيل', 'Sharing not supported on this device': 'المشاركة غير مدعومة على هذا الجهاز',
                'Delete account? This permanently removes ALL grids, ledgers, notes, pictures, settings and credentials. This cannot be undone.': 'حذف الحساب؟ هذا يزيل نهائياً جميع الشبكات والدفاتر والملاحظات والصور والإعدادات وبيانات الدخول. لا يمكن التراجع عن هذا.',
                'Are you sure you want to log out? Your data will remain safe.': 'هل أنت متأكد أنك تريد تسجيل الخروج؟ ستبقى بياناتك آمنة.',
                '?? ARE YOU SURE? This will permanently delete ALL data.': '?? هل أنت متأكد؟ سيؤدي هذا إلى حذف جميع البيانات نهائياً.',
                'Are you sure you want to permanently delete all items in the Recycle Bin?': 'هل أنت متأكد أنك تريد حذف جميع العناصر في سلة المحذوفات نهائياً؟',
                'Permanently delete {count} selected item(s)?': 'حذف {count} عنصراً محدداً نهائياً؟',
                'Permanently delete ALL {count} items in Recycle Bin?': 'حذف جميع {count} عنصراً في سلة المحذوفات نهائياً؟',
                'Erase {name} archive?': 'مسح أرشيف {name}؟', 'Delete custom set "{name}"?': 'حذف المجموعة المخصصة "{name}"؟',
                'Delete module "{name}"?': 'حذف الوحدة "{name}"؟',
                'Active User': 'مستخدم نشط', 'Guest': 'ضيف', 'Active': 'نشط',
                'Weekly reports enabled': 'تم تفعيل التقارير الأسبوعية', 'Weekly reports disabled': 'تم تعطيل التقارير الأسبوعية'
            }
        };

        function t(key) {
            const lang = (app.lang === 'ur' || app.lang === 'ar') ? app.lang : 'en';
            const dict = LANG_STRINGS[lang] || {};
            if (key && dict[key] !== undefined) return dict[key];
            if (key && LANG_STRINGS.en[key] !== undefined) return LANG_STRINGS.en[key];
            return key || '';
        }

        function trf(key, subs) {
            let s = t(key);
            if (subs) {
                Object.keys(subs).forEach(k => {
                    s = s.split('{' + k + '}').join(String(subs[k]));
                });
            }
            return s;
        }

        function setLangAttrs() {
            const lang = (app.lang === 'ur' || app.lang === 'ar') ? app.lang : 'en';
            document.documentElement.lang = lang;
            document.documentElement.dir = (lang === 'ar' || lang === 'ur') ? 'rtl' : 'ltr';
        }

        function translateUI() {
            setLangAttrs();
            D.querySelectorAll('[data-i18n]').forEach(el => {
                const val = t(el.getAttribute('data-i18n'));
                if (val) el.textContent = val;
            });
            D.querySelectorAll('[data-i18n-ph]').forEach(el => {
                const val = t(el.getAttribute('data-i18n-ph'));
                if (val) el.setAttribute('placeholder', val);
            });
            D.querySelectorAll('[data-i18n-aria]').forEach(el => {
                const val = t(el.getAttribute('data-i18n-aria'));
                if (val) el.setAttribute('aria-label', val);
            });
            D.querySelectorAll('[data-i18n-title]').forEach(el => {
                const val = t(el.getAttribute('data-i18n-title'));
                if (val) el.setAttribute('title', val);
            });
            D.querySelectorAll('[data-i18n-dp]').forEach(el => {
                const val = t(el.getAttribute('data-i18n-dp'));
                if (val) el.setAttribute('data-placeholder', val);
            });
        }

        function refreshUI() {
            if (typeof renderApp === 'function') renderApp();
            translateUI();
            if (typeof updateProfileUI === 'function') updateProfileUI();
            if (typeof populateSettings === 'function') populateSettings();
            if (typeof populateNotificationsFull === 'function') populateNotificationsFull();
            if (typeof renderRecycleBin === 'function') renderRecycleBin();
            if (typeof populateStorageFull === 'function') populateStorageFull();
            if (typeof renderPrintHistory === 'function') renderPrintHistory();
            if (typeof renderAnalytics === 'function') renderAnalytics();
            if (typeof updateNoteWordCount === 'function') updateNoteWordCount();
        }

        function parseCommaNum(val) {
            if (!val) return 0;
            const cleaned = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
        }

        function formatCommaInput(el) {
            let val = el.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
            if (val) {
                if (val.endsWith('.')) {
                    const intPart = val.slice(0, -1);
                    const num = parseFloat(intPart);
                    if (!isNaN(num) && num > MAX_INPUT_VALUE) { el.value = MAX_INPUT_VALUE.toLocaleString('en-US') + '.'; return; }
                    el.value = val;
                    return;
                }
                const num = parseFloat(val);
                if (!isNaN(num)) {
                    if (num > MAX_INPUT_VALUE) { el.value = MAX_INPUT_VALUE.toLocaleString('en-US'); return; }
                    const decMatch = val.match(/\.(\d*?)0*$/);
                    const maxFrac = decMatch ? Math.min(2, Math.max(1, decMatch[1].length)) : 0;
                    el.value = num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: maxFrac });
                    return;
                }
            }
            el.value = '';
        }

        function clampInputValue(el) {
            const raw = el.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
            if (raw) {
                const num = parseFloat(raw);
                if (!isNaN(num) && num > MAX_INPUT_VALUE) el.value = MAX_INPUT_VALUE.toLocaleString('en-US');
            }
        }

        const saveData = () => {
            dbSaveApp(app).catch(e => console.error('Save error:', e));
        };

        // Migrate legacy grid records: ensure app.gridRecords is an array (new format)
        if (!Array.isArray(app.gridRecords)) {
            // Old format was { [modId]: { weekKey: [{ id, i, a, c, d, g, dates, days }] } }
            // Convert to flat array of { id, modId, modName, stateCounts, totalDays, d, monthKey }
            const oldGrid = app.gridRecords || {};
            const newGrid = [];
            const moduleNames = {};
            (app.modules || []).forEach(m => { moduleNames[m.id] = m.title; });
            Object.keys(oldGrid).forEach(modId => {
                const weeks = oldGrid[modId];
                ['week1', 'week2', 'week3', 'week4'].forEach(wk => {
                    (weeks[wk] || []).forEach(entry => {
                        const dObj = new Date(entry.d);
                        if (isNaN(dObj.getTime())) return;
                        const monthKey = dObj.getFullYear() + '-' + String(dObj.getMonth() + 1).padStart(2, '0');
                        const existing = newGrid.find(r => r.modId === modId && r.monthKey === monthKey);
                        if (existing) {
                            existing.totalDays += (entry.days || 1);
                        } else {
                            newGrid.push({
                                id: entry.id || generateId(),
                                modId: modId,
                                modName: moduleNames[modId] || modId,
                                stateCounts: entry.g ? { [entry.c]: entry.a } : {},
                                totalDays: entry.days || 1,
                                d: entry.d,
                                monthKey: monthKey
                            });
                        }
                    });
                });
            });
            app.gridRecords = newGrid;
        }
        if (!Array.isArray(app.gridRecords)) app.gridRecords = [];

        // Also migrate legacy g-flagged entries out of totalExpense
        let migratedFromTotal = false;
        Object.keys(app.totalExpense || {}).forEach(modId => {
            const weeks = app.totalExpense[modId];
            ['week1', 'week2', 'week3', 'week4'].forEach(wk => {
                const keep = [];
                (weeks[wk] || []).forEach(entry => {
                    if (entry.g) {
                        migratedFromTotal = true;
                    } else {
                        keep.push(entry);
                    }
                });
                weeks[wk] = keep;
                if (weeks[wk].length === 0) delete weeks[wk];
            });
            if (Object.keys(weeks).length === 0) delete app.totalExpense[modId];
        });
        if (migratedFromTotal) saveData();

        function logActivity(actionStr) {
            try {
                let now2 = new Date();
                let mStr = now2.getFullYear() + '-' + (now2.getMonth() + 1).toString().padStart(2, '0');
                if (!app.activityLedger) app.activityLedger = {};
                if (!app.activityLedger[mStr]) app.activityLedger[mStr] = [];
                if (app.activityLedger[mStr].length >= 500) app.activityLedger[mStr].shift();
                app.activityLedger[mStr].push({ id: generateId(), timestamp: now2.toISOString(), action: actionStr });
            } catch (e) { /* ignore */ }
        }

        function generateId() {
            if (crypto.randomUUID) return crypto.randomUUID();
            if (!generateId._counter) generateId._counter = 0;
            generateId._counter++;
            return 'id-' + Date.now() + '-' + generateId._counter + '-' + Math.random().toString(36).slice(2, 6);
        }

        let alertCallback = null;

        function customAlert(msg, cb) {
            const alertEl = D.getElementById('customAlertModal');
            if (!alertEl) return;
            D.getElementById('alertMsg').textContent = (typeof t === 'function') ? (t(msg) || msg) : msg;
            alertCallback = cb || null;
            openModal('customAlertModal');
            setTimeout(() => { const okBtn = alertEl.querySelector('.modal-content .b-green:last-child'); if (okBtn) okBtn
                    .focus(); }, 50);
        }

        function closeAlert() {
            closeModal('customAlertModal');
            if (alertCallback) { alertCallback();
                alertCallback = null; }
        }

        function customConfirm(msg, callback) {
            D.getElementById('confirmMsg').textContent = (typeof t === 'function') ? (t(msg) || msg) : msg;
            D.getElementById('confirmYes').onclick = () => { closeModal('confirmModal');
                callback(); };
            openModal('confirmModal');
            setTimeout(() => D.getElementById('confirmYes').focus(), 50);
        }

        function toggleDrop(id) {
            const el = D.getElementById(id);
            if (!el) return;
            const isOpen = el.classList.contains('open');
            D.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
            if (!isOpen) { el.classList.add('open');
                el.setAttribute('aria-expanded', 'true'); } else { el.setAttribute('aria-expanded', 'false'); }
            D.getElementById('profileDrop').classList.remove('open');
        }

        function closeModal(id) {
            const el = D.getElementById(id);
            if (el) { el.classList.remove('open');
                el.setAttribute('aria-hidden', 'true'); }
            if (id === 'renameModal') renameTarget = null;
            if (id === 'editLedgerModal') editingLedgerEntry = null;
            if (id === 'picViewModal') picViewImgData = null;
        }

        function openModal(id) {
            D.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
            D.getElementById('profileDrop').classList.remove('open');
            const el = D.getElementById(id);
            if (el) {
                el.classList.add('open');
                el.setAttribute('aria-hidden', 'false');
                setTimeout(() => { const firstInput = el.querySelector(
                    'input:not([type="hidden"]), select, textarea') || el.querySelector('button'); if (firstInput) firstInput.focus(); },
                100);
            }
        }

        function toggleSlideMenu() {
            const menu = D.getElementById('slideMenu');
            const overlay = D.getElementById('slideOverlay');
            const isOpen = menu.classList.toggle('open');
            overlay.classList.toggle('open');
            menu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            if (isOpen) setTimeout(() => menu.querySelector('a, button')?.focus(), 50);
            D.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
            D.getElementById('profileDrop').classList.remove('open');
        }

        function closeSlideMenu() {
            const menu = D.getElementById('slideMenu');
            const overlay = D.getElementById('slideOverlay');
            if (menu) { menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); }
            if (overlay) { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); }
        }

        function toggleCeDropdown() {
            const items = D.getElementById('ceDropdownItems');
            const arrow = D.getElementById('ceArrow');
            if (items) { items.classList.toggle('open'); if (arrow) arrow.classList.toggle('open'); }
        }

        function toggleStorageDropdown() {
            const items = D.getElementById('stDropdownItems');
            const arrow = D.getElementById('stArrow');
            if (items) { items.classList.toggle('open'); if (arrow) arrow.classList.toggle('open'); }
        }

        function toggleCalcDropdown() {
            const items = D.getElementById('calDropdownItems');
            const arrow = D.getElementById('calArrow');
            if (items) { items.classList.toggle('open'); if (arrow) arrow.classList.toggle('open'); }
        }

        // ===== DRAWER FUNCTIONS =====
        function openGridDrawer() {
            const panel = D.getElementById('gridDrawerPanel');
            const overlay = D.getElementById('drawerOverlay');
            if (!panel) return;
            panel.classList.add('open');
            overlay.classList.add('open');
            populateGridDrawer();
        }

        function openLedgerDrawer() {
            const panel = D.getElementById('ledgerDrawerPanel');
            const overlay = D.getElementById('drawerOverlay');
            if (!panel) return;
            panel.classList.add('open');
            overlay.classList.add('open');
            populateLedgerDrawer();
        }

        function closeDrawer() {
            D.getElementById('gridDrawerPanel')?.classList.remove('open');
            D.getElementById('ledgerDrawerPanel')?.classList.remove('open');
            D.getElementById('drawerOverlay')?.classList.remove('open');
        }

        function populateGridDrawer() {
            const container = D.getElementById('gridDrawerList');
            const totalEl = D.getElementById('gridDrawerTotal');
            if (!container) return;
            const gridModules = app.modules.filter(m => m.format === 'grid');
            if (totalEl) totalEl.textContent = gridModules.length;
            if (gridModules.length === 0) { container.innerHTML = '<div class="drawer-empty">' + t('drawer.emptyGrids') + '</div>'; return; }
            container.innerHTML = gridModules.map((m, idx) => `
                        <div class="drawer-item ${m.id === activeGridTabId ? 'drawer-item-active' : ''}" onclick="closeDrawer(); navRoute('grids'); setTimeout(function(){ switchSubTab('gridContainers','${m.id}','grid-tab-btn','grid-cont'); }, 100);">
                            <span class="drawer-sn">${String(idx+1).padStart(2,'0')}</span>
                            <span class="drawer-name">${escapeHtml(m.title)}</span>
                        </div>
                    `).join('');
        }

        function populateLedgerDrawer() {
            const container = D.getElementById('ledgerDrawerList');
            const totalEl = D.getElementById('ledgerDrawerTotal');
            if (!container) return;
            const ledgerModules = app.modules.filter(m => m.format === 'ledger');
            if (totalEl) totalEl.textContent = ledgerModules.length;
            if (ledgerModules.length === 0) { container.innerHTML =
                '<div class="drawer-empty">' + t('drawer.emptyLedgers') + '</div>'; return; }
            container.innerHTML = ledgerModules.map((m, idx) => `
                        <div class="drawer-item ${m.id === activeFinTabId ? 'drawer-item-active' : ''}" onclick="closeDrawer(); navRoute('finance'); setTimeout(function(){ switchSubTab('financeContainers','${m.id}','fin-tab-btn','fin-cont'); }, 100);">
                            <span class="drawer-sn">${String(idx+1).padStart(2,'0')}</span>
                            <span class="drawer-name">${escapeHtml(m.title)}</span>
                        </div>
                    `).join('');
        }


        function toggleProfileDrop() {
            const pd = D.getElementById('profileDrop');
            const isOpen = pd.classList.toggle('open');
            pd.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            if (isOpen) setTimeout(() => pd.querySelector('.profile-item')?.focus(), 50);
            D.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
            updateProfileUI();
        }

        function closeProfileDrop() {
            D.getElementById('profileDrop').classList.remove('open');
            D.getElementById('profileDrop').setAttribute('aria-hidden', 'true');
        }

        function updateProfileUI() {
            const initialEl = D.getElementById('profileInitial');
            const nameEl = D.getElementById('profileUserName');
            const avatarBtn = D.getElementById('profileAvatarBtn');
            const avatarBig = D.getElementById('profileAvatarBig');
            const avatarText = D.getElementById('profileAvatarText');
            const nameBig = D.getElementById('profileNameBig');
            const usernameBig = D.getElementById('profileUsernameBig');
            const statusBadge = D.getElementById('profileStatusBadge');

            const user = app.settings.userProfile || { name: 'User', username: 'username' };
            const photo = app.profilePhoto || null;

            if (photo) {
                if (avatarBtn) { avatarBtn.innerHTML = ''; const img = document.createElement('img');
                    img.src = photo;
                    img.alt = 'Profile'; avatarBtn.appendChild(img); }
                if (avatarBig) { avatarBig.innerHTML = ''; const img = document.createElement('img');
                    img.src = photo;
                    img.alt = 'Profile'; avatarBig.appendChild(img); }
            } else {
                const initial = (user.name || 'U').charAt(0).toUpperCase();
                if (avatarBtn) { avatarBtn.innerHTML = ''; const span = document.createElement('span');
                    span.id = 'profileInitial';
                    span.textContent = initial; avatarBtn.appendChild(span); }
                if (avatarBig) { avatarBig.innerHTML = ''; const span = document.createElement('span');
                    span.id = 'profileAvatarText';
                    span.textContent = initial; avatarBig.appendChild(span); }
                if (avatarText) avatarText.textContent = initial;
            }

            if (initialEl) initialEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
            if (nameEl) nameEl.textContent = user.name || 'User';
            if (nameBig) nameBig.textContent = user.name || 'User';
            if (usernameBig) usernameBig.textContent = '@' + (user.username || 'username');
            if (statusBadge) {
                statusBadge.textContent = t('Active User');
                statusBadge.style.background = 'var(--accent-light)';
                statusBadge.style.color = 'var(--accent)';
            }

            const emailBig = D.getElementById('profileEmailBig');
            if (emailBig) emailBig.textContent = user.email || '-';
            const memberSinceBig = D.getElementById('profileMemberSinceBig');
            if (memberSinceBig) memberSinceBig.textContent = app.memberSince ? new Date(app.memberSince).toLocaleDateString() : '-';
            const lastLoginBig = D.getElementById('profileLastLoginBig');
            if (lastLoginBig) lastLoginBig.textContent = app.lastLogin ? new Date(app.lastLogin).toLocaleString() : '-';
            const storageBig = D.getElementById('profileStorageBig');
            if (storageBig) {
                let usedBytes = 0;
                try { usedBytes = new Blob([JSON.stringify(app)]).size; } catch (e) { /* ignore */ }
                const kb = Math.max(1, Math.round(usedBytes / 1024));
                storageBig.textContent = (usedBytes >= 1073741824 ? (usedBytes / 1073741824).toFixed(2) + ' GB' :
                    usedBytes >= 1048576 ? (usedBytes / 1048576).toFixed(2) + ' MB' : kb + ' KB') + ' / 10 GB';
            }

            // Update profile page fields
            const statusEl = D.getElementById('profStatus');
            const memberSinceEl = D.getElementById('profMemberSince');
            if (statusEl) statusEl.textContent = t('Active');
            if (memberSinceEl) memberSinceEl.textContent = app.memberSince ? new Date(app.memberSince).toLocaleDateString() :
                '-';

            // Editable account info fields (skip inputs the user is currently typing in)
            const activeEl = D.activeElement;
            const isFocused = (el) => el && activeEl === el;
            const nameInput = D.getElementById('profInputName');
            const usernameInput = D.getElementById('profInputUsername');
            const emailInput = D.getElementById('profInputEmail');
            const phoneInput = D.getElementById('profInputPhone');
            const dobInput = D.getElementById('profInputDob');
            const genderInput = D.getElementById('profInputGender');
            if (nameInput && !isFocused(nameInput)) nameInput.value = (user.name && user.name !== 'User') ? user.name :
                '';
            if (usernameInput && !isFocused(usernameInput)) usernameInput.value = (user.username && user.username !==
                'username') ? user.username : '';
            if (emailInput && !isFocused(emailInput)) emailInput.value = user.email || '';
            if (phoneInput && !isFocused(phoneInput)) phoneInput.value = user.phone || '';
            if (dobInput && !isFocused(dobInput)) dobInput.value = user.dob || '';
            if (genderInput && !isFocused(genderInput)) genderInput.value = user.gender || '';

            // Data counters
            const gEl = D.getElementById('profGrids');
            const agEl = D.getElementById('profActiveGrids');
            const lEl = D.getElementById('profLedgers');
            const alEl = D.getElementById('profActiveLedgers');
            const nEl = D.getElementById('profNotes');
            if (gEl) gEl.textContent = app.modules.filter(m => m.format === 'grid').length;
            if (agEl) agEl.textContent = app.modules.filter(m => m.format === 'grid' && m.active).length;
            if (lEl) lEl.textContent = app.modules.filter(m => m.format === 'ledger').length;
            if (alEl) alEl.textContent = app.modules.filter(m => m.format === 'ledger' && m.active).length;
            if (nEl) nEl.textContent = app.notes.length;

            // Avatar remove button visibility
            const avatarWrap = D.getElementById('profileAvatarWrap');
            if (avatarWrap) avatarWrap.classList.toggle('has-photo', !!photo);

            // Preferences
            const langSel = D.getElementById('settingsLanguage') || D.getElementById('profLanguage');
            if (langSel && !isFocused(langSel)) langSel.value = app.lang || 'en';
            const curSel = D.getElementById('settingsCurrency');
            if (curSel && !isFocused(curSel)) curSel.value = app.currency || 'PKR';
            const tglWeekly = D.getElementById('weeklyTglProfile');
            if (tglWeekly) tglWeekly.checked = app.settings.weeklyReports !== false;

            // Session information
            const lastLoginEl = D.getElementById('profLastLogin');
            if (lastLoginEl) {
                lastLoginEl.textContent = app.lastLogin ? new Date(app.lastLogin).toLocaleString() : '-';
            }
            const ipEl = D.getElementById('profIp');
            if (ipEl) ipEl.textContent = user.ip || '-';
            const devEl = D.getElementById('profDevice');
            if (devEl) devEl.textContent = detectDevice();

            // Storage usage bar (10 GB budget)
            const storageTextEl = D.getElementById('profStorageText');
            const storageFillEl = D.getElementById('profStorageFill');
            const STORAGE_LIMIT = 10 * 1024 * 1024 * 1024;
            let usedBytes = 0;
            try { usedBytes = new Blob([JSON.stringify(app)]).size; } catch (e) { /* ignore */ }
            if (storageTextEl) {
                const kb = Math.max(1, Math.round(usedBytes / 1024));
                storageTextEl.textContent = (usedBytes >= 1073741824 ? (usedBytes / 1073741824).toFixed(2) + ' GB' :
                    usedBytes >= 1048576 ? (usedBytes / 1048576).toFixed(2) + ' MB' : kb +
                    ' KB') + ' / 10 GB';
            }
            if (storageFillEl) storageFillEl.style.width = Math.min(100, (usedBytes / STORAGE_LIMIT) * 100).toFixed(2) +
                '%';

            loadSessionIp();
        }

        function detectDevice() {
            const ua = navigator.userAgent || '';
            let os = 'Unknown OS';
            if (/Windows NT/.test(ua)) os = 'Windows';
            else if (/Android/.test(ua)) os = 'Android';
            else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
            else if (/Mac OS X/.test(ua)) os = 'macOS';
            else if (/Linux/.test(ua)) os = 'Linux';
            let browser = 'Browser';
            if (/Edg\//.test(ua)) browser = 'Edge';
            else if (/Chrome\//.test(ua)) browser = 'Chrome';
            else if (/Firefox\//.test(ua)) browser = 'Firefox';
            else if (/Safari\//.test(ua)) browser = 'Safari';
            return os + ' - ' + browser;
        }

        let _ipFetched = false;

        function loadSessionIp() {
            if (_ipFetched) return;
            _ipFetched = true;
            if (typeof fetch !== 'function') return;
            fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => {
                if (d && d.ip) {
                    app.settings.userProfile = app.settings.userProfile || {};
                    app.settings.userProfile.ip = d.ip;
                    saveData();
                    const ipEl = D.getElementById('profIp');
                    if (ipEl) ipEl.textContent = d.ip;
                }
            }).catch(() => { /* offline */ });
        }

        function handleProfilePhotoUpload(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            if (!file.type || file.type.indexOf('image/') !== 0) { showToast('Please choose an image file', 'error'); return; }
            const reader = new FileReader();
            reader.onload = function(ev) {
                const img = new Image();
                img.onload = function() {
                    const maxDim = 256;
                    let w = img.width,
                        h = img.height;
                    if (Math.max(w, h) > maxDim) {
                        const scale = maxDim / Math.max(w, h);
                        w = Math.round(w * scale);
                        h = Math.round(h * scale);
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    try {
                        app.profilePhoto = canvas.toDataURL('image/jpeg', 0.85);
                        saveData();
                        updateProfileUI();
                        showToast('Profile photo updated', 'success');
                    } catch (err) { showToast('Could not save photo', 'error'); }
                };
                img.onerror = function() { showToast('Could not read image', 'error'); };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }

        function removeProfilePhoto() {
            app.profilePhoto = null;
            saveData();
            updateProfileUI();
            showToast('Profile photo removed', 'info');
        }

        function saveProfileChanges() {
            const user = app.settings.userProfile = app.settings.userProfile || {};
            const name = (D.getElementById('profInputName').value || '').trim();
            const username = (D.getElementById('profInputUsername').value || '').trim();
            const email = (D.getElementById('profInputEmail').value || '').trim();
            const phone = (D.getElementById('profInputPhone').value || '').trim();
            const dob = D.getElementById('profInputDob').value;
            const gender = D.getElementById('profInputGender').value;

            if (!name) { showToast('Full name is required', 'error'); return; }
            if (!username) { showToast('Username is required', 'error'); return; }

            user.name = name;
            user.username = username;
            user.email = email;
            user.phone = phone;
            user.dob = dob;
            user.gender = gender;
            if (!user.created) user.created = new Date().toISOString();

            saveData();
            updateProfileUI();
            logActivity('Profile updated');
            showToast('Profile saved', 'success');
        }

        function cancelProfileChanges() {
            updateProfileUI();
            showToast('Changes discarded', 'info');
        }

        function setProfileLanguage(val) {
            app.lang = val || 'en';
            saveData();
            refreshUI();
            showToast('Language preference saved', 'success');
        }

        function setCurrency(val) {
            app.currency = val || 'PKR';
            saveData();
            refreshUI();
            showToast('Currency preference saved', 'success');
        }

        function settingsSetPassword() {
            const np = D.getElementById('settingsNewPass');
            const cp = D.getElementById('settingsConfirmPass');
            if (!np || !cp) return;
            const newPass = np.value.trim();
            const confirmPass = cp.value.trim();
            if (!newPass || !confirmPass) { showToast('Fill in both fields', 'error'); return; }
            if (newPass.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
            if (newPass !== confirmPass) { showToast('Passwords do not match', 'error'); return; }
            app.password = newPass;
            if (!app.resetPin) {
                app.resetPin = _generateResetPin();
            }
            saveData();
            np.value = '';
            cp.value = '';
            showToast('Password activated', 'success');
            initPasswordToggle();
            showResetPin();
        }

        function settingsRemovePassword() {
            if (!app.password) { showToast('No password set', 'info'); return; }
            app.password = '';
            app.resetPin = '';
            saveData();
            showToast('Password removed', 'info');
            initPasswordToggle();
            hideResetPin();
        }

        function _generateResetPin() {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let pin = '';
            for (let i = 0; i < 8; i++) {
                if (i === 4) pin += '-';
                pin += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return pin;
        }

        function showResetPin() {
            const el = D.getElementById('resetPinDisplay');
            const pinEl = D.getElementById('resetPinValue');
            if (el && pinEl && app.resetPin) {
                pinEl.textContent = app.resetPin;
                el.style.display = 'flex';
            }
        }

        function hideResetPin() {
            const el = D.getElementById('resetPinDisplay');
            if (el) el.style.display = 'none';
        }

        function copyResetPin() {
            if (app.resetPin) {
                navigator.clipboard.writeText(app.resetPin).then(() => {
                    showToast('Reset PIN copied', 'success');
                }).catch(() => {
                    showToast('Failed to copy', 'error');
                });
            }
        }

        function initPasswordToggle() {
            const badge = D.getElementById('passStatusBadge');
            const fields = D.getElementById('passwordFields');
            const actions = D.getElementById('passActions');
            if (!badge) return;
            if (app.password) {
                badge.textContent = 'ACTIVE';
                badge.style.background = 'var(--green)';
                if (fields) fields.style.display = 'none';
                if (actions) actions.style.display = 'flex';
                showResetPin();
            } else {
                badge.textContent = 'INACTIVE';
                badge.style.background = 'var(--red)';
                if (fields) fields.style.display = 'flex';
                if (actions) actions.style.display = 'none';
                hideResetPin();
            }
        }

        function showChangePassFields() {
            const fields = D.getElementById('passwordFields');
            const actions = D.getElementById('passActions');
            if (fields) fields.style.display = 'flex';
            if (actions) actions.style.display = 'none';
        }

        function hidePasswordFields() {
            const fields = D.getElementById('passwordFields');
            const actions = D.getElementById('passActions');
            if (app.password) {
                if (fields) fields.style.display = 'none';
                if (actions) actions.style.display = 'flex';
            } else {
                if (fields) fields.style.display = 'flex';
                if (actions) actions.style.display = 'none';
            }
            const np = D.getElementById('settingsNewPass');
            const cp = D.getElementById('settingsConfirmPass');
            if (np) np.value = '';
            if (cp) cp.value = '';
        }

        function checkAppLock() {
            if (!app.password) return;
            if (sessionStorage.getItem('aether-unlocked') === '1') return;
            window.location.href = 'login.html';
        }

        function toggleLockPassword() {
            const inp = D.getElementById('lockScreenPass');
            const eyeOff = D.getElementById('lockEyeOff');
            const eyeOn = D.getElementById('lockEyeOn');
            if (!inp) return;
            if (inp.type === 'password') {
                inp.type = 'text';
                if (eyeOff) eyeOff.style.display = 'none';
                if (eyeOn) eyeOn.style.display = 'block';
            } else {
                inp.type = 'password';
                if (eyeOff) eyeOff.style.display = 'block';
                if (eyeOn) eyeOn.style.display = 'none';
            }
        }

        function toggleSettingsPass(inputId, eyeOffId, eyeOnId) {
            const inp = D.getElementById(inputId);
            const eyeOff = D.getElementById(eyeOffId);
            const eyeOn = D.getElementById(eyeOnId);
            if (!inp) return;
            if (inp.type === 'password') {
                inp.type = 'text';
                if (eyeOff) eyeOff.style.display = 'none';
                if (eyeOn) eyeOn.style.display = 'block';
            } else {
                inp.type = 'password';
                if (eyeOff) eyeOff.style.display = 'block';
                if (eyeOn) eyeOn.style.display = 'none';
            }
        }

        function showForgotPinView() {
            const pass = D.getElementById('lockViewPass');
            const forgot = D.getElementById('lockViewForgot');
            const newPass = D.getElementById('lockViewNewPass');
            if (pass) pass.style.display = 'none';
            if (forgot) forgot.style.display = 'flex';
            if (newPass) newPass.style.display = 'none';
            const pinInput = D.getElementById('lockResetPinInput');
            if (pinInput) { pinInput.value = ''; pinInput.focus(); }
            const err = D.getElementById('lockPinError');
            if (err) err.style.opacity = '0';
        }

        function showPasswordView() {
            const pass = D.getElementById('lockViewPass');
            const forgot = D.getElementById('lockViewForgot');
            const newPass = D.getElementById('lockViewNewPass');
            if (pass) pass.style.display = 'block';
            if (forgot) forgot.style.display = 'none';
            if (newPass) newPass.style.display = 'none';
            const inp = D.getElementById('lockScreenPass');
            if (inp) { inp.value = ''; inp.focus(); }
            const err = D.getElementById('lockScreenError');
            if (err) err.style.opacity = '0';
        }

        function showNewPassView() {
            const pass = D.getElementById('lockViewPass');
            const forgot = D.getElementById('lockViewForgot');
            const newPass = D.getElementById('lockViewNewPass');
            if (pass) pass.style.display = 'none';
            if (forgot) forgot.style.display = 'none';
            if (newPass) newPass.style.display = 'flex';
            const np = D.getElementById('lockNewPassInput');
            if (np) { np.value = ''; np.focus(); }
            const cp = D.getElementById('lockConfirmPassInput');
            if (cp) cp.value = '';
            const err = D.getElementById('lockNewPassError');
            if (err) err.style.opacity = '0';
        }

        function resetPasswordWithPin() {
            const inp = D.getElementById('lockResetPinInput');
            const err = D.getElementById('lockPinError');
            const wrap = D.getElementById('lockPinWrap');
            if (!inp) return;
            const val = inp.value.replace(/\s/g, '').toUpperCase();
            if (val === (app.resetPin || '').replace(/\s/g, '').toUpperCase()) {
                showNewPassView();
            } else {
                if (err) err.style.opacity = '1';
                if (wrap) { wrap.style.borderColor = 'var(--red)'; setTimeout(() => { wrap.style.borderColor = ''; }, 1500); }
                inp.value = '';
                inp.focus();
            }
        }

        function setNewPasswordFromReset() {
            const np = D.getElementById('lockNewPassInput');
            const cp = D.getElementById('lockConfirmPassInput');
            const err = D.getElementById('lockNewPassError');
            if (!np || !cp) return;
            const newPass = np.value.trim();
            const confirmPass = cp.value.trim();
            if (!newPass || !confirmPass) { if (err) { err.textContent = 'Fill in both fields'; err.style.opacity = '1'; } return; }
            if (newPass.length < 8) { if (err) { err.textContent = 'Password must be at least 8 characters'; err.style.opacity = '1'; } return; }
            if (newPass !== confirmPass) { if (err) { err.textContent = 'Passwords do not match'; err.style.opacity = '1'; } return; }
            app.password = newPass;
            saveData();
            showToast('Password reset successful', 'success');
            const lock = D.getElementById('appLockScreen');
            if (lock) lock.style.display = 'none';
            np.value = '';
            cp.value = '';
            if (err) err.style.opacity = '0';
        }

        function unlockApp() {
            const inp = D.getElementById('lockScreenPass');
            const err = D.getElementById('lockScreenError');
            const wrap = D.getElementById('lockPassWrap');
            if (!inp) return;
            const val = inp.value.trim();
            if (val === app.password) {
                const lock = D.getElementById('appLockScreen');
                if (lock) lock.style.display = 'none';
                inp.value = '';
                inp.type = 'password';
                const eyeOff = D.getElementById('lockEyeOff');
                const eyeOn = D.getElementById('lockEyeOn');
                if (eyeOff) eyeOff.style.display = 'block';
                if (eyeOn) eyeOn.style.display = 'none';
                if (err) err.style.opacity = '0';
            } else {
                if (err) err.style.opacity = '1';
                if (wrap) { wrap.style.borderColor = 'var(--red)'; setTimeout(() => { wrap.style.borderColor = ''; }, 1500); }
                inp.value = '';
                inp.focus();
            }
        }

        function toggleWeeklyReports() {
            app.settings.weeklyReports = !(app.settings.weeklyReports !== false);
            saveData();
            const tgl = D.getElementById('weeklyTglProfile');
            if (tgl) tgl.checked = app.settings.weeklyReports;
            showToast(app.settings.weeklyReports ? 'Weekly reports enabled' : 'Weekly reports disabled', 'info');
        }

        function deleteAccount() {
            customConfirm('Delete all app data? This permanently removes ALL grids, ledgers, notes, pictures and settings. This cannot be undone.', async () => {
                await dbClearAll();
                clearAppState();
                location.reload();
            });
        }

        D.addEventListener('click', e => {
            const target = e.target;
            if (!target.closest('#profileDrop') && !target.closest('.profile-btn')) closeProfileDrop();
            if (!target.closest('.dropdown') && !target.closest('.icon-btn') && !target.closest('[data-dropdown]')) {
                D.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
            }
            if (target.classList.contains('modal-overlay') && target.id !== 'picViewModal' && target.id !==
                'cameraModal') {
                if (target.id === 'editLedgerModal') { closeModal('editLedgerModal'); return; }
                if (target.id === 'renameModal') { closeModal('renameModal'); return; }
                target.classList.remove('open');
            }
            if (!target.closest('.inline-drop-btn-sm') && !target.closest('.inline-drop-grp')) {
                D.querySelectorAll('.inline-drop-grp').forEach(d => d.style.display = 'none');
            }
            if (!target.closest('.top-nav-search')) closeSearchResults();
            if (target.id === 'drawerOverlay') closeDrawer();
            if (target.id === 'slideOverlay') closeSlideMenu();
        });

        function updateDatePickersToCurrent() {
            const today = localDateStr();
            D.querySelectorAll('input[type="date"]').forEach(inp => {
                if (!inp.id || inp.id.indexOf('hdr-date-') !== 0) return;
                const modId = inp.id.replace('hdr-date-', '');
                const mod = app.modules.find(m => m.id === modId);
                if (mod && mod.start) {
                    const d = new Date(mod.start);
                    if (!isNaN(d.getTime())) { inp.value = localDateStr(d); } else { inp.value =
                            today; }
                } else { if (!inp.value || new Date(inp.value) > new Date(today)) inp.value = today; }
                inp.setAttribute('max', today);
            });
        }

        function updateGreeting() {
            const greetEl = D.getElementById('homeGreeting');
            if (!greetEl) return;
            const hour = new Date().getHours();
            let period = 'Night';
            if (hour >= 5 && hour < 12) period = 'Morning';
            else if (hour >= 12 && hour < 17) period = 'Afternoon';
            else if (hour >= 17 && hour < 21) period = 'Evening';
            const user = app.settings.userProfile || {};
            const uname = user.name || user.username || 'User';
            const html = `<span style="color:var(--purple);">${escapeHtml(uname.toUpperCase())}</span><br>${t('home.good' + period)}`;
            if (greetEl.innerHTML !== html) greetEl.innerHTML = html;
        }

        let _rtLastDateStr = '';
        function updateRTClock() {
            const now2 = new Date();
            const timeStr = now2.toLocaleTimeString('en-US', { hour12: true });
            const clockEl = D.getElementById('rtClock');
            if (clockEl && clockEl.textContent !== timeStr) clockEl.textContent = timeStr;
            const todayStr = localDateStr(now2);
            if (todayStr === _rtLastDateStr) return;
            _rtLastDateStr = todayStr;
            const dateEl = D.getElementById('rtDate');
            if (dateEl) dateEl.textContent = now2.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric',
                month: 'long', day: 'numeric' });
            updateDatePickersToCurrent();
            updateGreeting();
        }
        clockIntervalId = setInterval(updateRTClock, 1000);

        let midnightTimerId = null;
        function scheduleMidnightRefresh() {
            if (midnightTimerId !== null) { clearTimeout(midnightTimerId); midnightTimerId = null; }
            const now2 = new Date();
            const midnight = new Date(now2.getFullYear(), now2.getMonth(), now2.getDate() + 1, 0, 0, 0);
            const msUntilMidnight = midnight.getTime() - now2.getTime();
            midnightTimerId = setTimeout(() => {
                midnightTimerId = null;
                handleDateRollover();
                scheduleMidnightRefresh();
            }, msUntilMidnight);
        }

        function handleDateRollover() {
            const todayStr = localDateStr();
            if (todayStr === currentRenderDateStr) return;

            const prevDate = currentRenderDateStr ? new Date(currentRenderDateStr) : null;
            const newDate = new Date(todayStr);
            const monthChanged = prevDate && (prevDate.getFullYear() !== newDate.getFullYear() || prevDate.getMonth() !== newDate.getMonth());

            if (monthChanged && prevDate) {
                const oldMonthKey = prevDate.getFullYear() + '-' + String(prevDate.getMonth() + 1).padStart(2, '0');
                app.gridMonths = app.gridMonths || {};
                app.gridMonths[oldMonthKey] = {};
                app.modules.filter(m => m.format === 'grid').forEach(m => {
                    if (app.grids[m.id]) {
                        app.gridMonths[oldMonthKey][m.id] = {
                            data: app.grids[m.id].slice(),
                            stat: app.grids[m.id + '_stat'] || 'No Status'
                        };
                        app.grids[m.id] = Array(31).fill('Pending');
                        delete app.grids[m.id + '_stat'];
                    }
                });
            }

            currentRenderDateStr = todayStr;
            const today = currentRenderDateStr;
            app.modules.filter(m => m.format === 'ledger').forEach(m => { m.start = today; });
            selectedRecordMonthTab = null;
            saveData();
            updateRTClock();
            calcAnalytics();
            updateDatePickersToCurrent();
            renderApp();
            scheduleMidnightRefresh();
        }
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') handleDateRollover();
        });
        window.addEventListener('focus', handleDateRollover);

        // ---- Debounced resize: redraw HiDPI charts once per gesture (handles DPR/zoom changes too) ----
        let _apeResizeTimer = null;
        window.addEventListener('resize', function () {
            if (_apeResizeTimer) clearTimeout(_apeResizeTimer);
            _apeResizeTimer = setTimeout(function () {
                [['overviewBudgetChart', drawOverviewBudgetChart],
                 ['overviewModuleChart', drawOverviewModuleChart],
                 ['notesMonthlyChart', drawNotesMonthlyChart],
                 ['recycleTypeChart', drawRecycleTypeChart]].forEach(function (pair) {
                    const cv = D.getElementById(pair[0]);
                    if (cv && cv._apeArgs && typeof pair[1] === 'function') {
                        try { pair[1].apply(null, cv._apeArgs); } catch (e) { /* ignore */ }
                    }
                });
                if (window.expChart) { try { window.expChart.render(); } catch (e) { /* ignore */ } }
            }, 180);
        }, { passive: true });

        function showBottomNav() {
            const bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav) bottomNav.style.display = 'flex';
        }

        function navRoute(id) {
            closeSlideMenu();
            closeDrawer();
            const fullPageViews = ['recycle', 'storage', 'print', 'profile', 'theme', 'notifications', 'about', 'calculator',
                'age', 'reset', 'analytics', 'convertor'
            ];
            if (fullPageViews.includes(id)) {
                D.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
                D.querySelectorAll('.view-section').forEach(e => e.classList.remove('active'));
                D.querySelectorAll('.fullpage-view').forEach(e => e.classList.remove('active'));
                const section = D.getElementById('route-' + id);
                if (section) section.classList.add('active');
                if (history && history.replaceState) history.replaceState(null, '', '#' + id);
                clearSearch();
                if (id === 'recycle') renderRecycleBin();
                if (id === 'storage') populateStorageFull();
                if (id === 'profile') updateProfileUI();
                if (id === 'theme') { const t = D.getElementById('themeTglFull'); if (t) t.checked = (app.theme ===
                        'dark'); }
                if (id === 'notifications') { const n = D.getElementById('notifTglFull'); if (n) n.checked = app.settings
                        .notificationsEnabled;
                    populateNotificationsFull(); }
                if (id === 'calculator') clearCalcFull();
                if (id === 'age') { const r = D.getElementById('ageResult'); if (r) r.textContent = ''; }
                if (id === 'convertor') initConvertor();
                if (id === 'analytics') renderAnalytics();
                if (id === 'print') { populatePrintOptions(); renderPrintHistory(); setTimeout(scrollPrintHistoryToBottom, 100); }
                if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
                translateUI();
                return;
            }

            if (id === 'console') {
                D.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
                D.querySelectorAll('.view-section').forEach(e => e.classList.remove('active'));
                D.querySelectorAll('.fullpage-view').forEach(e => e.classList.remove('active'));
                const section = D.getElementById('route-console');
                if (section) section.classList.add('active');
                if (history && history.replaceState) history.replaceState(null, '', '#' + id);
                clearSearch();
                setTimeout(function() { ceInitConsoleEngine(); }, 50);
                translateUI();
                return;
            }
            if (id === 'settings') { populateSettings();
                D.querySelectorAll('.fullpage-view').forEach(e => e.classList.remove('active')); }
            if (id === 'notes') {
                D.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
                const nav = D.getElementById('nav-notes');
                if (nav) nav.classList.add('active');
                D.querySelectorAll('.view-section').forEach(e => e.classList.remove('active'));
                D.querySelectorAll('.fullpage-view').forEach(e => e.classList.remove('active'));
                const section = D.getElementById('route-notes');
                if (section) section.classList.add('active');
                closeSlideMenu();
                if (history && history.replaceState) history.replaceState(null, '', '#' + id);
                clearSearch();
                translateUI();
                return;
            }
            D.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
            D.querySelectorAll('.fullpage-view').forEach(e => e.classList.remove('active'));
            const nav = D.getElementById('nav-' + id);
            if (nav) nav.classList.add('active');
            D.querySelectorAll('.view-section').forEach(e => e.classList.remove('active'));
            const section = D.getElementById('route-' + id);
            if (section) section.classList.add('active');
            closeSlideMenu();
            if (history && history.replaceState) history.replaceState(null, '', '#' + id);
            clearSearch();
            closeSearchResults();
            translateUI();
        }

        function closeSettingsMenu() {
            D.querySelectorAll('[data-clear-on-close]').forEach(i => i.value = '');
            navRoute('home');
        }

        let _tabSwitchPending = false;

        function switchSubTab(containerId, activeId, btnClass, contentClass) {
            if (_tabSwitchPending) return;
            _tabSwitchPending = true;

            if (containerId === 'gridContainers') { activeGridTabId = activeId; renderGridNav(); }
            if (containerId === 'financeContainers') { activeFinTabId = activeId; renderFinanceNav(); }

            D.querySelectorAll('.' + btnClass).forEach(e => e.classList.remove('active'));
            const btn = D.getElementById('tabbtn-' + activeId);
            if (btn) btn.classList.add('active');

            const panels = D.querySelectorAll('.' + contentClass);
            panels.forEach(e => { e.classList.remove('active');
                e.style.display = 'none'; });

            const cont = D.getElementById('tabcont-' + activeId);
            if (cont) { cont.classList.add('active');
                cont.style.display = 'flex'; }

            if (containerId === 'financeContainers' && activeId === 'total_expense_tab') {
                const recCont = D.getElementById('tabcont-total_expense_tab');
                if (recCont) recCont.innerHTML = buildRecordsScreenHTML();
            }

            requestAnimationFrame(() => {
                if (containerId === 'gridContainers') updateGridStats(activeId);
                if (containerId === 'financeContainers') updateFinanceStats(activeId);
                if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
                _tabSwitchPending = false;
            });
        }

        function updateGridStats(modId) {
            const statsEl = D.getElementById('stats-' + modId);
            if (!statsEl) return;
            const mod = app.modules.find(m => m.id === modId);
            if (!mod) return;
            let counts = {};
            mod.states.forEach(s => counts[s] = 0);
            const gridData = app.grids[mod.id] || Array(31).fill('Pending');
            for (let i = 0; i < 31; i++) {
                let st = gridData[i] || 'Pending';
                counts[st] = (counts[st] || 0) + 1;
            }
            let statHtml = `<div class="grid-status-stats">`;
            mod.states.forEach(s => {
                let col = getStateColor(s);
                let count = counts[s] || 0;
                statHtml += `
                            <div class="stat-item">
                                <span class="stat-title" style="color:${col}; font-weight:900;">${escapeHtml(s)}</span>
                                <span class="stat-value blur-target" style="color:${col};">${count}</span>
                            </div>`;
            });
            statHtml += `</div>`;
            if (mod.hasRate) {
                let calcState = mod.states[1] || mod.states[0];
                let modTotal = (counts[calcState] || 0) * (mod.rate || 0);
                modTotal = Math.min(modTotal, MAX_INPUT_VALUE);
                statHtml +=
                    `<div class="flex-row" style="border-top:1.5px solid var(--border-light); padding-top:3px; margin-top:2px;"><span class="sub-lbl">Total Cost</span><b class="blur-target">${fmtMoney(modTotal)}</b></div>`;
            }
            statsEl.innerHTML = statHtml;
        }

        // ---- Entry total: uses the amount as-is.
        //      Quantity is informational only and must not multiply the price. ----
        function entryTotal(l) {
            return parseCommaNum(l.a);
        }

        function updateFinanceStats(modId) {
            const sumEl = D.getElementById('sum-' + modId);
            if (!sumEl) return;
            const mod = app.modules.find(m => m.id === modId);
            if (!mod) return;
            let sums = {};
            app.cats.forEach(c => sums[c] = 0);
            let modTotal = 0;
            let entries = app.ledgers[mod.id] || [];
            let dObj = new Date(mod.start || currentRenderDateStr);
            if (!isNaN(dObj.getTime())) {
                entries = entries.filter(l => { let d = new Date(l.d); return d.getMonth() === dObj.getMonth() && d
                        .getFullYear() === dObj.getFullYear(); });
            }
            entries.forEach(l => { sums[l.c] += entryTotal(l);
                modTotal += entryTotal(l); });
            modTotal = Math.min(modTotal, MAX_INPUT_VALUE);
            let modBudget = app.moduleBudgets[mod.id] || 0;
            modBudget = Math.min(modBudget, MAX_INPUT_VALUE);
            let modRemaining = modBudget - modTotal;
            let catKeys = app.cats.filter(c => sums[c] > 0 || true);
            let catDistributionHtml = `<div class="fin-status-grid">`;
            catKeys.forEach(c => {
                const cCol = getCategoryColor(c);
                catDistributionHtml += `
                            <div class="budget-item" style="border:none; background:transparent; padding:0.1rem 0.2rem;">
                                <span class="sub-lbl" style="font-size:0.45rem; color:${cCol};">${escapeHtml(c)}</span>
                                <span class="blur-target" style="font-weight:900; font-size:0.75rem; color:${cCol};">${fmtMoney(sums[c])}</span>
                            </div>`;
            });
            catDistributionHtml += `</div>`;
            let totalsHtml = `
                        <div class="fin-totals" style="border-top:1.5px solid var(--border-light); padding-top:0.2rem; margin-top:0.1rem;">
                            <div class="total-item">
                                <span class="sub-lbl" style="font-size:0.45rem; color:var(--accent);">Budget</span>
                                <span class="total-val blur-target" style="font-size:0.75rem; color:var(--accent);">${fmtMoney(modBudget)}</span>
                            </div>
<div class="total-item">
                                <span class="sub-lbl" style="font-size:0.45rem; color:var(--red);">Spent</span>
                                <span class="total-val red blur-target" style="font-size:0.75rem;">${fmtMoney(modTotal)}</span>
                            </div>
                            <div class="total-item">
                                <span class="sub-lbl" style="font-size:0.45rem; color:${modRemaining >= 0 ? 'var(--green)' : 'var(--red)'};">Remaining</span>
                                <span class="total-val blur-target" style="font-size:0.75rem; color:${modRemaining >= 0 ? 'var(--green)' : 'var(--red)'};">${fmtMoney(modRemaining)}</span>
                            </div>
                        </div>`;
            sumEl.innerHTML = catDistributionHtml + totalsHtml;
        }

        function navToTask(modId) {
            if (modId === 'sys_archive') {
                let mStr = new Date().getFullYear() + '-' + (new Date().getMonth() + 1).toString().padStart(2, '0');
                app.archives[mStr] = buildGlobalArchiveHTML(mStr);
                logActivity(`Generated Global Archive Log for ${mStr}`);
                saveData();
                renderApp();
                closeModal('notifyDrop');
                return;
            }
            let mod = app.modules.find(m => m.id === modId);
            if (mod) {
                if (mod.format === 'grid') {
                    navRoute('grids');
                    setTimeout(() => {
                        switchSubTab('gridContainers', modId, 'grid-tab-btn', 'grid-cont');
                        scrollToPendingDay(modId);
                    }, 50);
                } else {
                    navRoute('finance');
                    setTimeout(() => { switchSubTab('financeContainers', modId, 'fin-tab-btn', 'fin-cont'); },
                    50);
                }
            }
            closeModal('notifyDrop');
        }

        function scrollToPendingDay(modId) {
            setTimeout(() => {
                const container = D.getElementById('tabcont-' + modId);
                if (!container) return;
                const pendingCells = container.querySelectorAll('.day-cell.pending-today');
                if (pendingCells.length > 0) pendingCells[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }

        function toggleGhost() {
            app.ghost = !app.ghost;
            saveData();
            D.getElementById('app-frame').classList.toggle('ghost-active', app.ghost);
            const eyeIcon = D.getElementById('icon-eye');
            if (app.ghost) {
                eyeIcon.innerHTML =
                    '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><line x1="3" y1="3" x2="21" y2="21"/><circle cx="12" cy="12" r="3"/>';
                D.getElementById('btnGhost').classList.add('b-red');
            } else {
                eyeIcon.innerHTML =
                    '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
                D.getElementById('btnGhost').classList.remove('b-red');
            }
        }

        function toggleTheme() {
            app.theme = app.theme === 'light' ? 'dark' : 'light';
            saveData();
            D.body.className = app.theme + '-theme';
            const themeMeta = D.querySelector('meta[name="theme-color"]');
            if (themeMeta) themeMeta.content = app.theme === 'dark' ? '#000000' : '#F5F5F7';
            const tgl = D.getElementById('themeTgl');
            if (tgl) tgl.checked = (app.theme === 'dark');
            const tglFull = D.getElementById('themeTglFull');
            if (tglFull) tglFull.checked = (app.theme === 'dark');
            calcAnalytics();
        }

        function toggleNotifications() {
            app.settings.notificationsEnabled = !app.settings.notificationsEnabled;
            saveData();
            const tgl = D.getElementById('notifTgl');
            if (tgl) tgl.checked = app.settings.notificationsEnabled;
            const tglFull = D.getElementById('notifTglFull');
            if (tglFull) tglFull.checked = app.settings.notificationsEnabled;
            if (app.settings.notificationsEnabled) requestNotificationPermission();
            populateNotificationsFull();
        }

        function getMonthNameFromDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            return MONTH_NAMES_FULL[d.getMonth()] + ' ' + d.getFullYear();
        }

        function getMonthShortFromDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            return MONTH_NAMES_SHORT[d.getMonth()] + ' ' + d.getFullYear();
        }

        function updateModStart(id, val) {
            let m = app.modules.find(x => x.id === id);
            if (m && val) {
                let d = new Date(val);
                if (!isNaN(d.getTime())) { m.start = val;
                    saveData();
                    renderApp();
                    showBottomNav();
                    setTimeout(() => updateDatePickersToCurrent(), 50); }
            }
        }

        function updateLiveBudget(cat, val) {
            let strVal = val.toString().replace(/,/g, '').trim();
            if (strVal === '') app.budgets[cat] = '';
            else {
                const num = parseFloat(strVal);
                const clamped = Math.min(num, MAX_INPUT_VALUE);
                app.budgets[cat] = isNaN(num) ? '' : clamped;
            }
            saveData();
            calcAnalytics();
            const displayEl = D.getElementById('budgetTotalDisplay');
            if (displayEl) {
                let total = 0;
                app.budgetCats.forEach(b => { const v = app.budgets[b];
                    total += parseCommaNum(v); });
                const clampedTotal = Math.min(total, MAX_INPUT_VALUE);
                displayEl.textContent = fmtMoney(clampedTotal);
            }
            const gmVert = D.getElementById('globalMetricsVertical');
            if (gmVert) {
                gmVert.querySelectorAll('.budget-item').forEach(item => {
                    const lbl = item.querySelector('.sub-lbl');
                    const inp = item.querySelector('input');
                    if (lbl) lbl.style.color = 'var(--color-black)';
                    if (inp) inp.style.color = 'var(--color-black)';
                });
            }
            let gross = 0;
            app.budgetCats.forEach(b => { const v = app.budgets[b];
                gross += parseCommaNum(v); });
            Object.values(app.moduleBudgets || {}).forEach(v => { gross += Number(v) || 0; });
            gross = Math.min(gross, MAX_INPUT_VALUE);
            let grossEl = D.getElementById('dashGross');
                if (grossEl) { grossEl.textContent = fmtMoney(gross);
                grossEl.style.color = 'var(--blue)'; }
            const grossLbl = D.getElementById('dashGrossLbl');
            if (grossLbl) grossLbl.style.color = 'var(--blue)';
            let outEl = D.getElementById('dashOutput');
            if (outEl) outEl.style.color = 'var(--red)';
            const outLbl = D.getElementById('dashOutputLbl');
            if (outLbl) outLbl.style.color = 'var(--red)';
            let output = parseCommaNum(outEl ? outEl.textContent : '');
            let netVal = gross - output;
            netVal = Math.min(netVal, MAX_INPUT_VALUE);
            colorNetCash(netVal >= 0);
            let netEl = D.getElementById('dashNet');
            if (netEl) netEl.textContent = fmtMoney(netVal);
        }

        function updateModuleBudget(modId, val) {
            let strVal = val.toString().replace(/,/g, '').trim();
            if (strVal === '') app.moduleBudgets[modId] = '';
            else {
                const num = parseFloat(strVal);
                const clamped = Math.min(num, MAX_INPUT_VALUE);
                app.moduleBudgets[modId] = isNaN(num) ? '' : clamped;
            }
            saveData();
            calcAnalytics();
        }

        function genBudget() {
            let n = D.getElementById('ceBudgetName').value.trim();
            if (!n) return;
            if (n.length > 30) return;
            if (!app.budgetCats.includes(n)) {
                app.budgetCats.push(n);
                app.budgets[n] = '';
                app.budgetEnabled[n] = true;
                D.getElementById('ceBudgetName').value = '';
                logActivity(`Generated new budget category: ${n}`);
                saveData();
                renderApp();
                populateSettings();
                renderBudgetList();
            }
        }

        function deleteBudget(cat) {
            let inUse = false;
            app.modules.filter(m => m.format === 'ledger').forEach(mod => {
                const entries = app.ledgers[mod.id] || [];
                if (entries.some(e => e.c === cat)) inUse = true;
            });
            if (inUse) { showToast('Budget is in use by a ledger', 'error'); return; }
            const idx = app.budgetCats.indexOf(cat);
            if (idx > -1) {
                binAdd('budget', cat, 'Budget: ' + cat);
                app.budgetCats.splice(idx, 1);
                delete app.budgets[cat];
                delete app.budgetEnabled[cat];
                logActivity(`Deleted budget: ${cat}`);
                saveData();
                renderApp();
                populateSettings();
                renderBudgetList();
            }
        }

        function toggleBudgetEnabled(cat, checked) {
            app.budgetEnabled[cat] = checked;
            saveData();
            renderApp();
        }

        function toggleCategoryEnabled(cat, checked) {
            app.categoryEnabled[cat] = checked;
            saveData();
            renderApp();
        }

        function toggleStatusSetEnabled(name, checked) {
            app.statusSetEnabled[name] = checked;
            saveData();
            renderApp();
        }

        function renderBudgetList() {
            const container = D.getElementById('ceBudgetList');
            if (!container) return;
            if (app.budgetCats.length === 0) {
                container.innerHTML =
                    '<span style="font-size:0.55rem; color:var(--text-muted); font-family:var(--font-family);">No budgets created yet.</span>';
                return;
            }
            container.innerHTML = app.budgetCats.map((cat, idx) => {
                const isEnabled = app.budgetEnabled[cat] !== false;
                const activeClass = isEnabled ? '' : 'ce-inactive-item';
                return `<div class="ce-list-item ${activeClass}">
                            <div class="ce-item-left">
                                <span class="ce-item-sn">${String(idx+1).padStart(2,'0')}</span>
                                <span class="ce-item-label">${escapeHtml(cat)}</span>
                            </div>
                            <div class="ce-item-actions">
                                <div class="cl-toggle-switch"><label class="cl-switch"><input type="checkbox" name="budget-toggle" ${isEnabled ? 'checked' : ''} onchange="toggleBudgetEnabled('${escapeJsString(cat)}', this.checked)"><span></span></label></div>
                                <button class="ce-btn-del-sm" onclick="deleteBudget('${escapeJsString(cat)}')"><svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                            </div>
                        </div>`;
            }).join('');
        }

        function renderCategoryList() {
            const container = D.getElementById('ceCategoryList');
            if (!container) return;
            if (app.cats.length === 0) { container.innerHTML = '<div class="ce-empty-state">' + t('ce.noCats') + '</div>'; return; }
            container.innerHTML = app.cats.map((cat, idx) => {
                const isEnabled = app.categoryEnabled[cat] !== false;
                const activeClass = isEnabled ? '' : 'ce-inactive-item';
                return `<div class="ce-list-item ${activeClass}">
                            <div class="ce-item-left">
                                <span class="ce-item-sn">${String(idx+1).padStart(2,'0')}</span>
                                <span class="ce-item-label">${escapeHtml(cat)}</span>
                            </div>
                            <div class="ce-item-actions">
                                <div class="cl-toggle-switch"><label class="cl-switch"><input type="checkbox" name="category-toggle" ${isEnabled ? 'checked' : ''} onchange="toggleCategoryEnabled('${escapeJsString(cat)}', this.checked)"><span></span></label></div>
                                <button class="ce-btn-del-sm" onclick="ceDelCatC('${escapeJsString(cat)}')"><svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                            </div>
                        </div>`;
            }).join('');
        }

        function renderCustomStatusSetsList() {
            const container = D.getElementById('ceStatusSetList');
            if (!container) return;
            const keys = Object.keys(app.customStatusSets || {});
            if (keys.length === 0) { container.innerHTML =
                '<div class="ce-empty-state">' + t('ce.noCustomSets') + '</div>'; return; }
            container.innerHTML = keys.map((name, idx) => {
                const isEnabled = app.statusSetEnabled[name] !== false;
                const activeClass = isEnabled ? '' : 'ce-inactive-item';
                const states = app.customStatusSets[name] || [];
                const setColors = (app.customStatusSetColors && app.customStatusSetColors[name]) || [];
                const stateStr = states.map((s, si) => ({ s, si }))
                    .filter(x => setColors[x.si])
                    .map(x => `<span class="ce-state-chip" style="background:${setColors[x.si]};">${escapeHtml(x.s)}</span>`)
                    .join(' ');
                return `<div class="ce-list-item ${activeClass}">
                            <div class="ce-item-left">
                                <span class="ce-item-sn">${String(idx+1).padStart(2,'0')}</span>
                                <span class="ce-item-label">${escapeHtml(name)} <span class="ce-item-sub">${stateStr}</span></span>
                            </div>
                            <div class="ce-item-actions">
                                <div class="cl-toggle-switch"><label class="cl-switch"><input type="checkbox" name="statusset-toggle" ${isEnabled ? 'checked' : ''} onchange="toggleStatusSetEnabled('${escapeJsString(name)}', this.checked)"><span></span></label></div>
                                <button class="ce-btn-del-sm" onclick="ceDeleteCustomStatusSetS('${escapeJsString(name)}')"><svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                            </div>
                        </div>`;
            }).join('');
        }

        function renderBudgetListB() { renderBudgetList(); const countEl = D.getElementById('ceBudgetCount'); if (countEl)
                countEl.textContent = String(app.budgetCats.length).padStart(2, '0'); }

        function renderCategoryListC() { renderCategoryList(); const countEl = D.getElementById('ceCategoryCount'); if (
                countEl) countEl.textContent = String(app.cats.length).padStart(2, '0'); }

        function renderCustomStatusSetsS() { renderCustomStatusSetsList(); const countEl = D.getElementById(
                'ceStatusCount'); if (countEl) countEl.textContent = String(Object.keys(app.customStatusSets || {}).length).padStart(2, '0'); }

        function ceUpdateStatusPreview() {
            const preview = D.getElementById('ceLivePreview');
            if (!preview) return;
            const rows = document.querySelectorAll('.ce-state-row');
            let chips = [];
            rows.forEach((row) => {
                const nameInput = row.querySelector('.ce-state-name');
                const colorSelect = row.querySelector('.ce-color-select');
                const name = nameInput.value.trim();
                const color = colorSelect.value;
                if (name) chips.push({ name, color });
            });
            if (chips.length === 0) { preview.innerHTML = '<span class="ce-preview-empty">No states defined yet</span>'; return; }
            preview.innerHTML = chips.map(c => `<span class="ce-preview-chip" style="color:${c.color};">${escapeHtml(c.name)}</span>`)
                .join('');
        }

        function ceApplyStateColor(row, color) {
            var sel = row.querySelector('.ce-color-select');
            var preview = row.querySelector('.ce-color-preview');
            var inp = row.querySelector('.ce-state-name');
            if (sel) sel.value = color;
            if (preview) preview.style.background = color;
            if (inp) {
                inp.style.color = color;
                inp.style.borderColor = color;
                inp.style.caretColor = color;
            }
        }

        function ceShuffleUniquePalette() {
            var seen = {};
            var unique = [];
            for (var i = 0; i < STATUS_COLOR_PALETTE.length; i++) {
                var c = STATUS_COLOR_PALETTE[i];
                if (!seen[c]) { seen[c] = true; unique.push(c); }
            }
            for (var i = unique.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var t = unique[i]; unique[i] = unique[j]; unique[j] = t;
            }
            return unique;
        }

        function ceGenerateStatusColors() {
            var unique = ceShuffleUniquePalette();
            var rows = document.querySelectorAll('.ce-state-row');
            var filled = [];
            rows.forEach(function(row) {
                var inp = row.querySelector('.ce-state-name');
                if (inp && inp.value.trim()) filled.push(row);
            });
            filled.forEach(function(row, idx) {
                var color = unique[idx % unique.length];
                ceApplyStateColor(row, color);
            });
            ceUpdateStatusPreview();
        }

        var ceStatusEditorInited = false;

        function initStatusEditor() {
            const rows = document.querySelectorAll('.ce-state-row');
            rows.forEach((row, idx) => {
                const select = row.querySelector('.ce-color-select');
                const preview = row.querySelector('.ce-color-preview');
                if (select) {
                    const prevSel = select.value;
                    select.innerHTML = STATUS_COLOR_PALETTE.map(c =>
                        `<option value="${c}" style="background:${c};color:#fff;">${c}</option>`
                    ).join('');
                    if (prevSel) {
                        select.value = prevSel;
                    } else if (!ceStatusEditorInited) {
                        select.value = '';
                        if (preview) preview.style.background = 'transparent';
                    }
                    if (preview && !preview.dataset.init) {
                        preview.dataset.init = '1';
                        preview.addEventListener('click', function() {
                            const i = STATUS_COLOR_PALETTE.indexOf(select.value);
                            select.value = STATUS_COLOR_PALETTE[(i + 1) % STATUS_COLOR_PALETTE.length] || '';
                            ceApplyStateColor(row, select.value);
                            ceUpdateStatusPreview();
                        });
                    }
                    if (!select.dataset.init) {
                        select.dataset.init = '1';
                        select.addEventListener('change', function() {
                            ceApplyStateColor(row, this.value);
                            ceUpdateStatusPreview();
                        });
                    }
                }
                const nameInput = row.querySelector('.ce-state-name');
                if (nameInput) {
                    if (!nameInput.dataset.init) {
                        nameInput.dataset.init = '1';
                        nameInput.addEventListener('input', function() {
                            if (this.value.length > 0) { this.value = this.value.charAt(0).toUpperCase() + this
                                    .value.slice(1); }
                            ceUpdateStatusPreview();
                        });
                    }
                    nameInput.placeholder = 'Insert';
                }
            });
            ceStatusEditorInited = true;
            ceUpdateStatusPreview();
            enhanceSelects();
        }

        function ceAddCustomStatusSetS() {
            const name = D.getElementById('ceSetNameS').value.trim();
            if (!name) return;
            if (name.length > 30) return;

            const rows = document.querySelectorAll('.ce-state-row');
            let states = [],
                colors = [];
            rows.forEach(row => {
                const nameInput = row.querySelector('.ce-state-name');
                const colorSelect = row.querySelector('.ce-color-select');
                const n = nameInput.value.trim();
                const c = (colorSelect.value || '').trim();
                if (!n) return;
                if (states.includes(n)) return;
                states.push(n);
                colors.push(c || '');
            });

            if (states.length < 2) {
                showToast('Add at least 2 state names', 'error');
                return;
            }

            const pool = ceShuffleUniquePalette();
            const used = colors.filter(Boolean);
            colors = colors.map(c => {
                if (c) return c;
                const pick = pool.find(p => !used.includes(p)) || pool[0];
                used.push(pick);
                return pick;
            });

            const merged = getMergedStatusSets();
            if (merged[name] && app.customStatusSets[name] === undefined) return;

            if (!app.customStatusSets) app.customStatusSets = {};
            app.customStatusSets[name] = states;
            app.statusSetEnabled[name] = true;
            if (!app.customStatusSetColors) app.customStatusSetColors = {};
            app.customStatusSetColors[name] = colors;

            D.getElementById('ceSetNameS').value = '';
            rows.forEach(row => {
                const inp = row.querySelector('.ce-state-name');
                if (inp) inp.value = '';
                const inp2 = row.querySelector('.ce-state-name');
                if (inp2) {
                    inp2.style.color = '';
                    inp2.style.borderColor = '';
                    inp2.style.caretColor = '';
                }
                const sel = row.querySelector('.ce-color-select');
                if (sel) sel.value = '';
                const preview = row.querySelector('.ce-color-preview');
                if (preview) preview.style.background = 'transparent';
            });
            ceUpdateStatusPreview();

            logActivity(`Created custom status set: ${name}`);
            saveData();
            renderCustomStatusSetsS();
            cePopulateGridTypes();
            ceUpdateCounts();
            renderApp();
                showToast(trf('Status set "{name}" created', { name: name }), 'success');
        }

        function ceDeleteCustomStatusSetS(name) {
            if (!app.customStatusSets || !app.customStatusSets[name]) return;
            let inUse = false;
            app.modules.filter(m => m.format === 'grid').forEach(mod => {
                if (mod.states && mod.states.length > 0) {
                    const cs = app.customStatusSets[name];
                    if (cs && mod.states.length === cs.length && mod.states.every((v, i) => v === cs[i])) inUse =
                        true;
                }
            });
            if (inUse) { showToast('Status set is in use by a grid', 'error'); return; }
            binAdd('status', { name: name, states: app.customStatusSets[name], colors: app.customStatusSetColors?.[name] }, 'Status Set: ' + name);
            delete app.customStatusSets[name];
            delete app.customStatusSetColors?.[name];
            delete app.statusSetEnabled[name];
            logActivity(`Deleted custom status set: ${name}`);
            saveData();
            renderCustomStatusSetsS();
            cePopulateGridTypes();
            ceUpdateCounts();
            renderApp();
            showToast('Status set deleted', 'info');
        }

        function getCustomStatusSetColors(name) {
            if (app.customStatusSetColors && app.customStatusSetColors[name]) return app.customStatusSetColors[name];
            const states = app.customStatusSets[name] || [];
            return states.map(s => getStateColor(s));
        }

        function getMergedStatusSets() {
            let merged = {};
            Object.keys(STANDARD_STATE_SETS).forEach(key => { merged[key] = STANDARD_STATE_SETS[key].states; });
            if (app.customStatusSets) {
                Object.keys(app.customStatusSets).forEach(key => {
                    if (app.statusSetEnabled[key] !== false) merged[key] = app.customStatusSets[key];
                });
            }
            return merged;
        }

        function getMergedStatusColors() {
            let colors = {};
            Object.keys(STANDARD_STATE_SETS).forEach(key => {
                const set = STANDARD_STATE_SETS[key];
                set.states.forEach((state, idx) => { colors[state] = set.colors[idx] || '#8E8E93'; });
            });
            if (app.customStatusSetColors) {
                Object.keys(app.customStatusSetColors).forEach(key => {
                    const states = app.customStatusSets[key] || [];
                    const cols = app.customStatusSetColors[key] || [];
                    states.forEach((state, idx) => { if (cols[idx]) colors[state] = cols[idx]; });
                });
            }
            return colors;
        }

        // ============================================================
        //  CORE RENDER ENGINE
        // ============================================================
        function renderApp() {
            if (_renderPending) return;
            _renderPending = true;
            requestAnimationFrame(() => {
                try {
                    D.body.className = app.theme + '-theme';
                    const themeMeta = D.querySelector('meta[name="theme-color"]');
                    if (themeMeta) themeMeta.content = app.theme === 'dark' ? '#000000' : '#F5F5F7';
                    const themeTgl = D.getElementById('themeTgl');
                    if (themeTgl) themeTgl.checked = (app.theme === 'dark');
                    const themeTglFull = D.getElementById('themeTglFull');
                    if (themeTglFull) themeTglFull.checked = (app.theme === 'dark');
                    const notifTgl = D.getElementById('notifTgl');
                    if (notifTgl) notifTgl.checked = app.settings.notificationsEnabled;
                    const notifTglFull = D.getElementById('notifTglFull');
                    if (notifTglFull) notifTglFull.checked = app.settings.notificationsEnabled;
                    D.getElementById('app-frame').classList.toggle('ghost-active', app.ghost);

                    updateProfileUI();
                    buildDOM();
                    calcAnalytics();
                    renderBudgetListB();
                    renderCustomStatusSetsS();
                    updateDatePickersToCurrent();

                    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
                    const searchInput = D.getElementById('topSearchInput');
                    if (searchInput && searchInput.value.trim().length > 0) handleSearchInput(searchInput.value);
                    populateNotificationsFull();

                    app.modules.filter(m => m.format === 'ledger').forEach(mod => {
                        if (app.ledgers[mod.id + '_showBudget'] === undefined) app.ledgers[mod.id +
                            '_showBudget'] = true;
                    });

                    const gTotal = D.getElementById('gridDrawerTotal');
                    if (gTotal) gTotal.textContent = app.modules.filter(m => m.format === 'grid').length;
                    const lTotal = D.getElementById('ledgerDrawerTotal');
                    if (lTotal) lTotal.textContent = app.modules.filter(m => m.format === 'ledger').length;

                    if (D.getElementById('route-recycle').classList.contains('active')) renderRecycleBin();
                    if (D.getElementById('route-analytics').classList.contains('active')) renderAnalytics();

                    // Storage sync
                    populateStorageFull();

                    // Print history
                    renderPrintHistory();

                    // Update note editor if visible
                    if (D.getElementById('route-notes').classList.contains('active')) {
                        // Ensure editor is ready
                    }
                } catch (e) { console.error('Render error:', e); }
                _renderPending = false;
            });
        }

        // ---- renderGridNav: RECORDS pinned at left + single active grid tab ----
        let lastGridTabId = null;
        function renderGridNav() {
            const gNav = D.getElementById('gridNav');
            if (!gNav) return;
            const gridModules = app.modules.filter(m => m.format === 'grid');
            const recordsTabId = 'grid_records_tab';
            let active = gridModules.find(m => m.id === activeGridTabId) || null;
            if (active) lastGridTabId = active.id;
            if (!active && activeGridTabId !== recordsTabId) {
                active = gridModules.find(m => m.id === lastGridTabId) || gridModules[0] || null;
                if (active) { activeGridTabId = active.id; lastGridTabId = active.id; }
            }
            const shown = active || gridModules.find(m => m.id === lastGridTabId) || gridModules[0] || null;
            let html = `<button class="tab-btn grid-tab-btn ${activeGridTabId === recordsTabId ? 'active' : ''}" id="tabbtn-${recordsTabId}" onclick="switchSubTab('gridContainers', '${recordsTabId}', 'grid-tab-btn', 'grid-cont')">RECORDS</button>`;
            if (shown) {
                const ttl = escapeHtml(shown.title);
                html += `<button class="tab-btn grid-tab-btn ${shown.id === activeGridTabId ? 'active' : ''}" id="tabbtn-${shown.id}" onclick="switchSubTab('gridContainers', '${shown.id}', 'grid-tab-btn', 'grid-cont')"><span class="tab-btn-scroll"><span>${ttl}</span></span></button>`;
            }
            gNav.innerHTML = html;
            checkTabScroll(gNav);
        }

        // ---- renderFinanceNav: RECORDS pinned at left + ledger tab always visible ----
        let lastLedgerTabId = null;
        function renderFinanceNav() {
            const fNav = D.getElementById('financeNav');
            if (!fNav) return;
            const ledgerModules = app.modules.filter(m => m.format === 'ledger');
            const recordsTabId = 'total_expense_tab';
            let active = ledgerModules.find(m => m.id === activeFinTabId) || null;
            if (active) lastLedgerTabId = active.id;
            const shown = active || ledgerModules.find(m => m.id === lastLedgerTabId) || ledgerModules[0] || null;
            let html = `<button class="tab-btn fin-tab-btn ${activeFinTabId === recordsTabId ? 'active' : ''}" id="tabbtn-${recordsTabId}" onclick="switchSubTab('financeContainers', '${recordsTabId}', 'fin-tab-btn', 'fin-cont')">RECORDS</button>`;
            if (shown) {
                const ttl = escapeHtml(shown.title);
                html += `<button class="tab-btn fin-tab-btn ${shown.id === activeFinTabId ? 'active' : ''}" id="tabbtn-${shown.id}" onclick="switchSubTab('financeContainers', '${shown.id}', 'fin-tab-btn', 'fin-cont')"><span class="tab-btn-scroll"><span>${ttl}</span></span></button>`;
            }
            fNav.innerHTML = html;
            checkTabScroll(fNav);
        }

        function checkTabScroll(container) {
            requestAnimationFrame(function() {
                var scrolls = container.querySelectorAll('.tab-btn-scroll');
                for (var i = 0; i < scrolls.length; i++) {
                    var wrap = scrolls[i];
                    var inner = wrap.querySelector('span');
                    if (!inner) continue;
                    if (inner.scrollWidth > wrap.offsetWidth + 2) {
                        inner.classList.add('scroll-active');
                    }
                }
            });
        }

        // ---- buildDOM ----
        function buildDOM() {
            const gmVert = D.getElementById('globalMetricsVertical');
            const gNav = D.getElementById('gridNav');
            const gCont = D.getElementById('gridContainers');
            const fNav = D.getElementById('financeNav');
            const fCont = D.getElementById('financeContainers');

            if (gmVert) {
                const activeBudgets = app.budgetCats.filter(c => app.budgetEnabled[c] !== false);
                let budgetInputsHtml = '';
                let tBudg = 0;

                let totalExpAll = 0;
                app.modules.filter(m => m.active && m.format === 'ledger').forEach(mod => {
                    let dObj = new Date(mod.start || currentRenderDateStr);
                    if (!isNaN(dObj.getTime())) {
                        let entries = app.ledgers[mod.id] || [];
                        entries = entries.filter(l => {
                            let d = new Date(l.d);
                            return d.getMonth() === dObj.getMonth() && d.getFullYear() === dObj.getFullYear();
                        });
                        entries.forEach(l => { totalExpAll += entryTotal(l); });
                    }
                });
                totalExpAll = Math.min(totalExpAll, MAX_INPUT_VALUE);

                if (activeBudgets.length > 0) {
                    budgetInputsHtml = `<div class="fin-status-grid" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:0.4rem; margin-bottom:0.4rem;">`;
                    activeBudgets.forEach(cat => {
                        tBudg += parseCommaNum(app.budgets[cat]);
                    });
                    tBudg = Math.min(tBudg, MAX_INPUT_VALUE);
                    activeBudgets.forEach(cat => {
                        const val = app.budgets[cat];
                        budgetInputsHtml += `
                            <div class="budget-item" style="background:var(--surface); border:1.5px solid var(--border-light); border-radius:var(--radius-md); padding:0.4rem 0.5rem; display:flex; flex-direction:column; gap:0.2rem; box-shadow:var(--shadow-sm);">
                                <span class="sub-lbl" style="font-size:0.6rem; font-weight:var(--font-weight-black); color:var(--color-black); text-transform:uppercase;">${escapeHtml(cat)}</span>
                                <input type="text" name="amount" autocomplete="off" inputmode="decimal" class="blur-target" value="${val !== undefined && val !== null && val !== '' ? fmt(val) : ''}" placeholder="0" oninput="formatCommaInput(this); clampInputValue(this); updateLiveBudget('${escapeJsString(cat)}', this.value)" aria-label="${escapeHtml(cat)} Budget" style="width:100%; font-size:0.75rem; font-weight:var(--font-weight-bold); padding:0.2rem 0.4rem; border-radius:var(--radius-sm); border:1.5px solid var(--border-light); background:var(--app-bg); color:var(--color-black);">
                            </div>`;
                    });
                    budgetInputsHtml += `</div>`;
                } else {
                    budgetInputsHtml = `<div style="font-size:0.65rem; color:var(--text-muted); text-align:center; padding:0.4rem;">No active budget categories. Enable or add budgets in Console Engine.</div>`;
                }

                gmVert.innerHTML = budgetInputsHtml;
            }

            gNav.innerHTML = '';
            gCont.innerHTML = '';
            fNav.innerHTML = '';
            fCont.innerHTML = '';

            // Grid tabs: RECORDS pinned at left + single active module
            const gridModules = app.modules.filter(m => m.format === 'grid');
            if (activeGridTabId === null && gridModules.length) activeGridTabId = gridModules[0].id;
            const gridRecordsTabId = 'grid_records_tab';
            if (!activeGridTabId) activeGridTabId = gridRecordsTabId;
            const isGridRecActive = (activeGridTabId === gridRecordsTabId);
            gCont.innerHTML = `<div class="grid-cont sub-view-section ${isGridRecActive ? 'active' : ''}" id="tabcont-${gridRecordsTabId}" style="${isGridRecActive ? 'display:flex;' : 'display:none;'} flex-direction:column;">${buildGridRecordsScreenHTML()}</div>`;
            let gridHtml = '';
            gridModules.forEach(mod => {
                gridHtml += buildGridModuleHTML(mod, mod.id === activeGridTabId);
            });
            gCont.innerHTML += gridHtml;
            renderGridNav();

            // Ledger containers: RECORDS pinned at left + all modules
            const ledgerModules = app.modules.filter(m => m.format === 'ledger');
            if (activeFinTabId === null && ledgerModules.length) activeFinTabId = ledgerModules[0].id;
            const finRecordsTabId = 'total_expense_tab';
            if (!activeFinTabId) activeFinTabId = finRecordsTabId;
            const isFinRecActive = (activeFinTabId === finRecordsTabId);
            fCont.innerHTML = `<div class="fin-cont sub-view-section ${isFinRecActive ? 'active' : ''}" id="tabcont-${finRecordsTabId}" style="${isFinRecActive ? 'display:flex;' : 'display:none;'} flex-direction:column;">${buildRecordsScreenHTML()}</div>`;
            let ledgerHtml = '';
            ledgerModules.forEach(mod => {
                ledgerHtml += buildLedgerModuleHTML(mod, mod.id === activeFinTabId);
            });
            fCont.innerHTML += ledgerHtml;
            renderFinanceNav();
            if (activeFinTabId && activeFinTabId !== 'total_expense_tab' && app.modules.find(m => m.id === activeFinTabId)) {
                updateFinanceStats(activeFinTabId);
            }
            gCont.querySelectorAll('select[id^="s-state-"]').forEach(tintStateSelect);
            fCont.querySelectorAll('select[id^="s-state-"]').forEach(tintStateSelect);
            enhanceSelects();

            document.querySelectorAll('input[type="date"]').forEach(inp => {
                inp.setAttribute('max', currentRenderDateStr);
                inp.addEventListener('change', function() { showBottomNav(); });
            });

            if (D.getElementById('route-notes').classList.contains('active')) {
                // Notes editor is always ready
            }

            app.modules.filter(m => m.format === 'ledger').forEach(mod => {
                if (app.ledgers[mod.id + '_showBudget'] === undefined) app.ledgers[mod.id + '_showBudget'] = true;
            });

            populateGridDrawer();
            populateLedgerDrawer();

            if (D.getElementById('route-console').classList.contains('active')) {
                const ceStatusView = D.getElementById('ce-view-status');
                if (ceStatusView && ceStatusView.classList.contains('ce-active')) initStatusEditor();
            }
        }

        // ---- Build Grid Module HTML ----
        function statusColor(stat) {
            return (!stat || stat === 'No Status') ? 'rgb(255, 59, 48)' : 'rgb(52, 199, 89)';
        }
        
        function buildGridModuleHTML(mod, isActive) {
            if (!app.grids[mod.id]) app.grids[mod.id] = Array(31).fill('Pending');
            if (app.grids[mod.id + '_showSalary'] === undefined) app.grids[mod.id + '_showSalary'] = false;
            if (app.grids[mod.id + '_showRate'] === undefined) app.grids[mod.id + '_showRate'] = false;

            let currentStat = app.grids[mod.id + '_stat'] || 'No Status';
            let showSalary = app.grids[mod.id + '_showSalary'] || false;
            let showRate = app.grids[mod.id + '_showRate'] || false;

            let ds = mod.start || currentRenderDateStr;
            let dObj = new Date(ds);
            dObj.setHours(0, 0, 0, 0);
            let monthLabel = MONTH_NAMES_FULL[dObj.getMonth()];

            let endDate = new Date(dObj);
            endDate.setDate(endDate.getDate() + 29);
            let dateRangeStr =
                `${dObj.getDate()} ${MONTH_NAMES_SHORT[dObj.getMonth()].toUpperCase()} - ${endDate.getDate()} ${MONTH_NAMES_SHORT[endDate.getMonth()].toUpperCase()} ${endDate.getFullYear()}`;

            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            let todayObj = new Date();
            todayObj.setHours(0, 0, 0, 0);

            let gridHtml = '';
            for (let i = 0; i < 31; i++) {
                let loopDate = new Date(dObj);
                loopDate.setDate(dObj.getDate() + i);
                let dayOfWeek = loopDate.getDay();
                let st = app.grids[mod.id][i] || 'Pending';
                let col = getStateColor(st);
                let isToday = (loopDate.getTime() === todayObj.getTime());
                let isFuture = loopDate > todayObj;
                let clickAttr = isFuture ? '' : `onclick="cycleState('${mod.id}', ${i}, this)"`;
                let lockClass = isFuture ? 'future' : '';
                let todayClass = isToday ? 'today' : '';
                let pendingTodayClass = (isToday && st === 'Pending') ? 'pending-today' : '';

                gridHtml += `<div class="day-cell ${lockClass} ${todayClass} ${pendingTodayClass}" style="background: ${col};" ${clickAttr}>
                                    <span class="day-number blur-target">${loopDate.getDate()}</span>
                                    <span class="day-lbl">${dayNames[dayOfWeek]}</span>
                                </div>`;
            }

            let displayRate = (mod.rate !== undefined && mod.rate !== null && mod.rate !== '') ? fmt(mod.rate) : '';
            let salaryVal = app.grids[mod.id + '_salary'] || '';

            let headerHtml = `
                        <div class="grid-header-with-drawer" style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:0.3rem;">
                            <div class="hdr-left" style="flex:1; display:flex; justify-content:center;">
                                <span class="month-label-display" style="font-size:0.7rem; background:transparent; color:var(--accent); border:none; padding:0.2rem 0.4rem; font-weight:var(--font-weight-black);">${escapeHtml(monthLabel.toUpperCase())}</span>
                            </div>
                            <div class="hdr-right" style="flex:0 0 auto; display:flex; align-items:center; gap:0.2rem;">
                                <div class="date-picker-wrap" style="flex:1; max-width:180px;">
                                    <span class="sub-lbl label-bold-high">Date</span>
                                    <input type="date" id="hdr-date-${mod.id}" value="${escapeHtml(ds)}" max="${currentRenderDateStr}" onchange="updateModStart('${escapeJsString(mod.id)}', this.value)" aria-label="Start date for ${escapeHtml(mod.title)}" style="font-size:0.75rem; min-width:80px; background:var(--app-bg); border:none; padding:0.3rem 0.5rem; border-radius:var(--radius-sm); font-weight:var(--font-weight-black);">
                                </div>
                            </div>
                        </div>`;

            let statusItemHtml = `<div class="gr2-item" style="flex:1; display:flex; align-items:center; justify-content:space-between; gap:0.4rem; background:transparent; border:none; border-radius:var(--radius-full); padding:0.4rem 0.8rem; min-height:46px;">
                                    <span class="gr2-label label-bold-high" style="font-size:0.6rem; color:var(--text-main);">Status</span>
                                    <span class="gr2-status" id="statusDisplay-${mod.id}" style="font-size:0.8rem; font-weight:var(--font-weight-black); color:${statusColor(currentStat)};">${escapeHtml(currentStat)}</span>
                                </div>`;

            let row2Html = `<div class="grid-row-2">`;

            let activeCount = (showSalary ? 1 : 0) + (showRate ? 1 : 0);

            if (activeCount === 0) {
                row2Html += statusItemHtml;
            } else if (activeCount === 1) {
                if (showSalary) {
                    row2Html += `
                                <div class="gr2-item-inline" style="flex:1; background:transparent; border:none; border-radius:var(--radius-full); padding:0.3rem 0.6rem; box-shadow:none; justify-content:flex-start;">
                                    <span class="gr2-label-inline" style="font-size:0.65rem; font-weight:var(--font-weight-black); color:var(--text-main); text-transform:uppercase;">SALARY</span>
                                    <input type="text" name="amount" autocomplete="off" inputmode="decimal" class="gr2-input blur-target" value="${salaryVal ? fmt(salaryVal) : ''}" oninput="formatCommaInput(this); clampInputValue(this); updateGridSalary('${escapeJsString(mod.id)}', this.value)" placeholder="0" aria-label="Salary for ${escapeHtml(mod.title)}" style="width:110px; padding:0.05rem 0.2rem; font-size:0.55rem; border-radius:var(--radius-sm); border:1.5px solid var(--border-med); background:var(--app-bg); color:var(--text-main); font-weight:var(--font-weight-bold); text-align:center; height:26px; flex:0 1 auto;">
                                </div>
                                ${statusItemHtml}`;
                } else if (showRate) {
                    row2Html += `
                                <div class="gr2-item-inline" style="flex:1; background:transparent; border:none; border-radius:var(--radius-full); padding:0.3rem 0.6rem; box-shadow:none; justify-content:flex-start;">
                                    <span class="gr2-label-inline" style="font-size:0.65rem; font-weight:var(--font-weight-black); color:var(--text-main); text-transform:uppercase;">RATE</span>
                                    <input type="text" name="amount" autocomplete="off" inputmode="decimal" class="gr2-input blur-target" value="${displayRate}" oninput="formatCommaInput(this); clampInputValue(this)" onchange="updateModRate('${escapeJsString(mod.id)}', this.value)" placeholder="0" aria-label="Rate per day for ${escapeHtml(mod.title)}" style="width:110px; padding:0.05rem 0.2rem; font-size:0.55rem; border-radius:var(--radius-sm); border:1.5px solid var(--border-med); background:var(--app-bg); color:var(--text-main); font-weight:var(--font-weight-bold); text-align:center; height:26px; flex:0 1 auto;">
                                </div>
                                ${statusItemHtml}`;
                }
            } else if (activeCount === 2) {
                row2Html += `
                            <div class="gr2-item-inline" style="flex:1; background:transparent; border:none; border-radius:var(--radius-full); padding:0.3rem 0.6rem; box-shadow:none; justify-content:flex-start;">
                                <span class="gr2-label-inline" style="font-size:0.65rem; font-weight:var(--font-weight-black); color:var(--text-main); text-transform:uppercase;">RATE</span>
                                <input type="text" name="amount" autocomplete="off" inputmode="decimal" class="gr2-input blur-target" value="${displayRate}" oninput="formatCommaInput(this); clampInputValue(this)" onchange="updateModRate('${escapeJsString(mod.id)}', this.value)" placeholder="0" aria-label="Rate per day for ${escapeHtml(mod.title)}" style="width:110px; padding:0.05rem 0.2rem; font-size:0.55rem; border-radius:var(--radius-sm); border:1.5px solid var(--border-med); background:var(--app-bg); color:var(--text-main); font-weight:var(--font-weight-bold); text-align:center; height:26px; flex:0 1 auto;">
                            </div>
                            <div class="gr2-item-inline" style="flex:1; background:transparent; border:none; border-radius:var(--radius-full); padding:0.3rem 0.6rem; box-shadow:none; justify-content:flex-start;">
                                <span class="gr2-label-inline" style="font-size:0.65rem; font-weight:var(--font-weight-black); color:var(--text-main); text-transform:uppercase;">SALARY</span>
                                <input type="text" name="amount" autocomplete="off" inputmode="decimal" class="gr2-input blur-target" value="${salaryVal ? fmt(salaryVal) : ''}" oninput="formatCommaInput(this); clampInputValue(this); updateGridSalary('${escapeJsString(mod.id)}', this.value)" placeholder="0" aria-label="Salary for ${escapeHtml(mod.title)}" style="width:110px; padding:0.05rem 0.2rem; font-size:0.55rem; border-radius:var(--radius-sm); border:1.5px solid var(--border-med); background:var(--app-bg); color:var(--text-main); font-weight:var(--font-weight-bold); text-align:center; height:26px; flex:0 1 auto;">
                            </div>`;
                row2Html += `</div><div class="grid-row-2">${statusItemHtml}`;
            }
            row2Html += `</div>`;

            let actionButtons = `
                        <div class="flex-row" style="width:100%; gap:0.3rem; margin-top:0.1rem;">
                            <div class="inline-drop-btn-sm status-btn" id="statusBtn-${mod.id}" onclick="toggleStatusOpt('${escapeJsString(mod.id)}')" style="flex:1; padding:0.2rem 0.3rem; background:var(--surface); border-radius:var(--radius-full); border:1.5px solid var(--border-med); color:var(--text-main); cursor:pointer; text-align:center; font-size:0.5rem; font-weight:900; min-height:32px; display:flex; align-items:center; justify-content:center;">STATUS</div>
                            <div class="inline-drop-btn-sm" id="printBtn-${mod.id}" onclick="togglePrintOpt('${escapeJsString(mod.id)}')" style="flex:1; padding:0.2rem 0.3rem; background:var(--surface); border-radius:var(--radius-full); border:1.5px solid var(--border-med); cursor:pointer; text-align:center; font-size:0.5rem; font-weight:900; min-height:32px; display:flex; align-items:center; justify-content:center;">PRINT</div>
                        </div>`;

            const mergedGrid = getMergedStatusSets();
            let catOptionsGrid = Object.keys(mergedGrid).map(k =>
                `<option value="${k}">${escapeHtml(k)}</option>`).join('');
            let defaultCatGrid = Object.keys(mergedGrid)[0] || '';
            let stateOptsGrid = mergedGrid[defaultCatGrid] || [];
            if (!stateOptsGrid.includes('Pending')) stateOptsGrid = ['Pending', ...stateOptsGrid];
            let stateOptionsHtml = stateOptsGrid.map(k =>
                `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');

            let statusDropdownHtml = `
                        <div id="statusGrp-${mod.id}" class="inline-drop-grp status-grp status-dropdown-wrapper" style="display:none; flex-direction:column; gap:0.4rem; width:100%; margin-top:4px; padding:8px; border:1px solid var(--border-light); border-radius:var(--radius-md); background:var(--app-bg);">
                            <div class="status-toggle-row" style="display:flex; flex-wrap:nowrap; gap:0; align-items:center; padding:0.2rem 0.1rem 0.3rem 0.1rem; border-bottom:1px solid var(--border-light); margin-bottom:0.3rem;">
                                <div class="toggle-item" style="flex:0 0 50%; max-width:50%; display:flex; align-items:center; justify-content:space-between; gap:0.4rem; padding:0 0.5rem; white-space:nowrap; font-size:0.7rem; font-weight:var(--font-weight-black); color:var(--text-main);">
                                    <span>Salary</span>
                                    <div class="cl-toggle-switch">
                                        <label class="cl-switch">
                                            <input type="checkbox" id="salaryToggle-${mod.id}" ${showSalary ? 'checked' : ''} onchange="toggleGridSalaryVisibility('${escapeJsString(mod.id)}', this.checked)">
                                            <span></span>
                                        </label>
                                    </div>
                                </div>
                                <div class="toggle-item" style="flex:0 0 50%; max-width:50%; display:flex; align-items:center; justify-content:space-between; gap:0.4rem; padding:0 0.5rem; white-space:nowrap; font-size:0.7rem; font-weight:var(--font-weight-black); color:var(--text-main);">
                                    <span>Rate</span>
                                    <div class="cl-toggle-switch">
                                        <label class="cl-switch">
                                            <input type="checkbox" id="rateToggle-${mod.id}" ${showRate ? 'checked' : ''} onchange="toggleGridRateVisibility('${escapeJsString(mod.id)}', this.checked)">
                                            <span></span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="status-dropdown-row" style="display:flex; flex-wrap:nowrap; gap:1rem; align-items:center; width:100%;">
                                <div class="status-cat-wrap" style="flex:1; display:flex; align-items:center; gap:0.3rem; min-width:0;">
                                    <span class="sub-lbl" style="font-size:0.45rem; white-space:nowrap; flex-shrink:0;">Cat</span>
                                    <select id="s-type-${mod.id}" onchange="populateLedgerStates('${escapeJsString(mod.id)}')" style="flex:1; min-width:0; border-radius:var(--radius-full); font-size:0.45rem; padding:0.15rem 0.2rem; height:24px; background:var(--app-bg); border:1.5px solid var(--border-med); color:var(--text-main); outline:none;">${catOptionsGrid}</select>
                                </div>
                                <div class="status-state-wrap" style="flex:1; display:flex; align-items:center; gap:0.3rem; min-width:0;">
                                    <span class="sub-lbl" style="font-size:0.45rem; white-space:nowrap; flex-shrink:0;">State</span>
                                    <select id="s-state-${mod.id}" onchange="tintStateSelect(this)" style="flex:1; min-width:0; border-radius:var(--radius-full); font-size:0.45rem; padding:0.15rem 0.2rem; height:24px; background:var(--app-bg); border:1.5px solid var(--border-med); color:var(--text-main); outline:none;">${stateOptionsHtml}</select>
                                </div>
                            </div>
                            <div class="status-dropdown-actions" style="display:flex; align-items:center; gap:0.4rem; width:100%; margin-top:0.25rem;">
                                <button class="b-red" onclick="clearGridStatus('${escapeJsString(mod.id)}')" style="flex:1; border-radius:var(--radius-full); font-size:0.5rem; padding:0.2rem 0.2rem; height:32px; font-family:var(--font-family); text-transform:none; font-weight:var(--font-weight-black); border:1.5px solid var(--border-med) !important; box-shadow:none !important; cursor:pointer; color:var(--border-red) !important; background:transparent;">Remove</button>
                                <button class="b-blue" onclick="applyGridModuleStatus('${escapeJsString(mod.id)}')" style="flex:1; border-radius:var(--radius-full); font-size:0.5rem; padding:0.2rem 0.2rem; height:32px; font-family:var(--font-family); text-transform:none; font-weight:var(--font-weight-black); border:1.5px solid var(--border-med) !important; box-shadow:none !important; cursor:pointer; color:var(--border-blue) !important; background:transparent;">Update</button>
                            </div>
                        </div>`;

            let printDropdownHtml = `
                        <div id="prtGrp-${mod.id}" class="inline-drop-grp" style="display:none; width:100%; margin-top:3px;">
                            <div class="print-dropdown-inner" style="display:flex; flex-direction:row; align-items:center; gap:0.4rem; width:100%;">
                                <div class="prof-field-wrap" style="display:flex; align-items:center; background:var(--surface-2); border:1.5px solid var(--border-med); border-radius:var(--radius-md); padding:0 0.5rem; flex:1;">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; color:var(--text-muted); flex-shrink:0;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    <select id="gridPrtMode-${mod.id}" style="flex:1; border:none; background:transparent; font-size:0.6rem; padding:0.5rem 0.3rem; color:var(--text-main); outline:none; text-align:center; font-weight:var(--font-weight-bold); font-family:var(--font-family);">
                                        <option value="export">Export PDF</option>
                                        <option value="print">Print</option>
                                    </select>
                                </div>
                                <button onclick="execGridPrint('${escapeJsString(mod.id)}')" class="prof-field-wrap" style="flex:1; min-width:0; border-radius:var(--radius-md); font-size:0.6rem; font-weight:var(--font-weight-black); padding:0.5rem 0.4rem; display:flex; align-items:center; justify-content:center; white-space:nowrap; cursor:pointer; background:var(--surface-2); border:1.5px solid var(--border-med); color:var(--accent); font-family:var(--font-family); box-shadow:none;">Generate</button>
                            </div>
                        </div>`;

            let dateRangeDisplay = `<div class="grid-date-range">${escapeHtml(dateRangeStr)}</div>`;

            return `<div class="grid-cont sub-view-section ${isActive?'active':''}" id="tabcont-${mod.id}" style="${isActive?'display:flex;':'display:none;'} flex-direction:column;">
                        <div class="themed-box b-gray flex-col" style="padding:0.3rem; gap:0.15rem; background:var(--surface); border-radius:var(--radius-lg); box-shadow:var(--shadow-sm);">
                            ${headerHtml}
                            ${row2Html}
                            ${actionButtons}
                            ${statusDropdownHtml}
                            ${printDropdownHtml}
                        </div>
                        <div class="themed-box-sm b-gray flex-col" id="stats-${mod.id}" style="margin-bottom:0.3rem; background:var(--app-bg); padding:0.4rem;"></div>
                        <div class="themed-box b-gray flex-col" style="padding:0.3rem; margin-bottom:0.3rem;">
                            ${dateRangeDisplay}
                            <div class="calendar-grid">${gridHtml}</div>
                        </div>
                        <button class="btn-add-to-records" onclick="addGridToRecords('${escapeJsString(mod.id)}')">ADD TO RECORDS</button>
                    </div>`;
        }

        // ---- Build Ledger Module HTML ----
        function buildLedgerModuleHTML(mod, isActive) {
            if (!app.ledgers[mod.id]) app.ledgers[mod.id] = [];
            if (app.ledgers[mod.id + '_showBudget'] === undefined) app.ledgers[mod.id + '_showBudget'] = true;
            if (app.ledgers[mod.id + '_budgetPreActive'] === undefined) {
                app.ledgers[mod.id + '_showBudget'] = true;
                app.ledgers[mod.id + '_budgetPreActive'] = true;
                saveData();
            }

            let currentStat = app.ledgers[mod.id + '_stat'] || 'No Status';
            let showBudget = app.ledgers[mod.id + '_showBudget'] !== undefined ? app.ledgers[mod.id + '_showBudget'] :
            true;

            let ds = mod.start || currentRenderDateStr;
            let dObj2 = new Date(ds);
            dObj2.setHours(0, 0, 0, 0);
            let monthLabel2 = MONTH_NAMES_FULL[dObj2.getMonth()];

            let opts = app.cats.filter(c => app.categoryEnabled[c] !== false).map(c =>
                `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

            let filteredEntries = app.ledgers[mod.id].filter(l => {
                let d = new Date(l.d);
                return d.getMonth() === dObj2.getMonth() && d.getFullYear() === dObj2.getFullYear();
            });

            filteredEntries.sort((a, b) => new Date(a.d) - new Date(b.d));

            let listHtml = '';
            const addRecordBtn = `<button class="btn-add-to-record" onclick="addMonthToRecord('${escapeJsString(mod.id)}')">ADD TO RECORD</button>`;
            if (filteredEntries.length === 0) {
                listHtml =
                    '<div class="empty-state" style="padding:0.3rem 0;font-size:0.65rem;">' + t('empty.entriesMonth') + '</div>' + addRecordBtn;
            } else {
                const rows = filteredEntries.map((l, idx) => `
                        <tr>
                            <td class="td-num blur-target">${String(idx+1).padStart(2,'0')}</td>
                            <td class="blur-target">${escapeHtml(l.i)}</td>
                            <td class="td-date">${escapeHtml(l.d)}</td>
                            <td>${escapeHtml(l.c)}</td>
                            <td>${fmtNoComma(l.q !== undefined && l.q !== null && l.q !== '' ? l.q : 1)}${l.u ? ' ' + escapeHtml(l.u) : ''}</td>
                            <td>${fmtMoney(l.a)}</td>
                            <td>
                                <button class="btn-edit-sm" onclick="editLedger('${escapeJsString(mod.id)}', '${l.id}')" aria-label="Edit entry"><svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                                <button class="btn-del-sm" onclick="delLedger('${escapeJsString(mod.id)}', '${l.id}')" aria-label="Delete entry"><svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                            </td>
                        </tr>`).join('');
                listHtml = `
                    <div class="ledger-table-wrap">
                        <table class="ledger-table">
                            <thead><tr><th>#</th><th>ITEM</th><th>DATE</th><th>CAT</th><th>QTY</th><th>PRICE</th><th>EDIT</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>` + addRecordBtn;
            }

            let currentModBudget = app.moduleBudgets[mod.id] !== undefined ? app.moduleBudgets[mod.id] : '';
            let displayModBudget = currentModBudget !== '' ? fmt(currentModBudget) : '';

            let finHeaderHtml = `
                        <div class="fin-header-with-drawer" style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:0.3rem;">
                            <div class="hdr-left" style="flex:1; display:flex; justify-content:center;">
                                <span class="month-label-display" style="font-size:0.7rem; background:transparent; color:var(--accent); border:none; padding:0.2rem 0.4rem; font-weight:var(--font-weight-black);">${escapeHtml(monthLabel2.toUpperCase())}</span>
                            </div>
                            <div class="hdr-right" style="flex:0 0 auto; display:flex; align-items:center; gap:0.2rem;">
                                <div class="date-picker-wrap" style="flex:1; max-width:180px;">
                                    <span class="sub-lbl label-bold-high">Date</span>
                                    <input type="date" id="hdr-date-${mod.id}" value="${escapeHtml(ds)}" max="${currentRenderDateStr}" onchange="updateModStart('${escapeJsString(mod.id)}', this.value)" aria-label="Start date for ${escapeHtml(mod.title)}" style="font-size:0.75rem; min-width:80px; background:var(--app-bg); border:none; padding:0.3rem 0.5rem; border-radius:var(--radius-sm); font-weight:var(--font-weight-black);">
                                </div>
                            </div>
                        </div>`;

            let budgetHidden = showBudget ? '' : 'hidden-item';

            let finRow2Html = `<div class="fin-row-2">`;
            finRow2Html += `
                        <div class="fr2-item-inline ${budgetHidden}" id="budgetItem-${mod.id}" style="flex:1; align-items:center; justify-content:flex-start; gap:0.4rem; background:transparent; border:none; border-radius:var(--radius-full); padding:0.3rem 0.6rem; box-shadow:none; min-height:38px;">
                            <span class="fr2-label-inline" style="font-size:0.55rem; font-weight:var(--font-weight-black); color:var(--text-main); text-transform:uppercase;">BUDGET</span>
                            <input type="text" name="amount" autocomplete="off" inputmode="decimal" class="fr2-input blur-target" value="${displayModBudget}" oninput="formatCommaInput(this); clampInputValue(this); updateFinanceBudget('${escapeJsString(mod.id)}', this.value)" placeholder="0" aria-label="Budget for ${escapeHtml(mod.title)}" style="width:110px; padding:0.05rem 0.2rem; font-size:0.55rem; border-radius:var(--radius-sm); border:1.5px solid var(--border-med); background:var(--app-bg); color:var(--text-main); font-weight:var(--font-weight-bold); text-align:center; height:26px; flex:0 0 auto;">
                        </div>`;
            finRow2Html += `
                        <div class="fr2-item" style="flex:1; display:flex; align-items:center; justify-content:space-between; gap:0.3rem; background:transparent; border:none; border-radius:var(--radius-full); padding:0.3rem 0.6rem; min-height:38px;">
                            <span class="fr2-label label-bold-high" style="font-size:0.5rem; color:var(--text-muted);">Status</span>
                            <span class="fr2-status" id="statusDisplay-${mod.id}" style="font-size:0.7rem; font-weight:var(--font-weight-black); color:${statusColor(currentStat)};">${escapeHtml(currentStat)}</span>
                        </div>`;
            finRow2Html += `</div>`;

            let entryCounterHtml = `
                        <div class="finance-entry-counter">
                            Total Entries: <span class="counter-num">${String(filteredEntries.length).padStart(2, '0')}</span>
                        </div>`;

            let finActionButtons = `
                        <div class="flex-row" style="width:100%; gap:0.3rem; margin-top:0.1rem;">
                            <div class="inline-drop-btn-sm status-btn" id="statusBtn-${mod.id}" onclick="toggleStatusOpt('${escapeJsString(mod.id)}')" style="flex:1; padding:0.2rem 0.3rem; background:var(--surface); border-radius:var(--radius-full); border:1.5px solid var(--border-med); color:var(--text-main); cursor:pointer; text-align:center; font-size:0.5rem; font-weight:900; min-height:32px; display:flex; align-items:center; justify-content:center;">STATUS</div>
                            <div class="inline-drop-btn-sm" id="printBtn-${mod.id}" onclick="togglePrintOpt('${escapeJsString(mod.id)}')" style="flex:1; padding:0.2rem 0.3rem; background:var(--surface); border-radius:var(--radius-full); border:1.5px solid var(--border-med); cursor:pointer; text-align:center; font-size:0.5rem; font-weight:900; min-height:32px; display:flex; align-items:center; justify-content:center;">PRINT</div>
                        </div>`;

            const mergedFin = getMergedStatusSets();
            let catOptionsFin = Object.keys(mergedFin).map(k =>
                `<option value="${k}">${escapeHtml(k)}</option>`).join('');
            let defaultCatFin = Object.keys(mergedFin)[0] || '';
            let stateOptsFin = mergedFin[defaultCatFin] || [];
            if (!stateOptsFin.includes('Pending')) stateOptsFin = ['Pending', ...stateOptsFin];
            let stateOptionsHtmlFin = stateOptsFin.map(k =>
                `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');

            let finStatusDropdownHtml = `
                        <div id="statusGrp-${mod.id}" class="inline-drop-grp status-grp status-dropdown-wrapper" style="display:none; flex-direction:column; gap:0.4rem; width:100%; margin-top:4px; padding:8px; border:1px solid var(--border-light); border-radius:var(--radius-md); background:var(--app-bg);">
                            <div class="status-toggle-row" style="display:flex; flex-wrap:nowrap; gap:0; align-items:center; padding:0.2rem 0.1rem 0.3rem 0.1rem; border-bottom:1px solid var(--border-light); margin-bottom:0.3rem;">
                                <div class="toggle-item" style="flex:1; display:flex; align-items:center; justify-content:space-between; gap:0.4rem; padding:0 0.5rem; white-space:nowrap; font-size:0.7rem; font-weight:var(--font-weight-black); color:var(--text-main);">
                                    <span>Budget</span>
                                    <div class="cl-toggle-switch">
                                        <label class="cl-switch">
                                            <input type="checkbox" id="budgetToggle-${mod.id}" ${showBudget ? 'checked' : ''} onchange="toggleFinanceBudgetVisibility('${escapeJsString(mod.id)}', this.checked)">
                                            <span></span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="status-dropdown-row" style="display:flex; flex-wrap:nowrap; gap:1rem; align-items:center; width:100%;">
                                <div class="status-cat-wrap" style="flex:1; display:flex; align-items:center; gap:0.3rem; min-width:0;">
                                    <span class="sub-lbl" style="font-size:0.45rem; white-space:nowrap; flex-shrink:0;">Cat</span>
                                    <select id="s-type-${mod.id}" onchange="populateLedgerStates('${escapeJsString(mod.id)}')" style="flex:1; min-width:0; border-radius:var(--radius-full); font-size:0.45rem; padding:0.15rem 0.2rem; height:24px; background:var(--app-bg); border:1.5px solid var(--border-med); color:var(--text-main); outline:none;">${catOptionsFin}</select>
                                </div>
                                <div class="status-state-wrap" style="flex:1; display:flex; align-items:center; gap:0.3rem; min-width:0;">
                                    <span class="sub-lbl" style="font-size:0.45rem; white-space:nowrap; flex-shrink:0;">State</span>
                                    <select id="s-state-${mod.id}" onchange="tintStateSelect(this)" style="flex:1; min-width:0; border-radius:var(--radius-full); font-size:0.45rem; padding:0.15rem 0.2rem; height:24px; background:var(--app-bg); border:1.5px solid var(--border-med); color:var(--text-main); outline:none;">${stateOptionsHtmlFin}</select>
                                </div>
                            </div>
                            <div class="fin-status-dropdown-actions" style="display:flex; align-items:center; gap:0.4rem; width:100%; margin-top:0.25rem;">
                                <button class="b-red" onclick="clearLedgerStatus('${escapeJsString(mod.id)}')" style="flex:1; border-radius:var(--radius-full); font-size:0.5rem; padding:0.2rem 0.2rem; height:32px; font-family:var(--font-family); text-transform:none; font-weight:var(--font-weight-black); border:1.5px solid var(--border-med) !important; box-shadow:none !important; cursor:pointer; color:var(--border-red) !important; background:transparent;">Remove</button>
                                <button class="b-blue" onclick="applyLedgerModuleStatus('${escapeJsString(mod.id)}')" style="flex:1; border-radius:var(--radius-full); font-size:0.5rem; padding:0.2rem 0.2rem; height:32px; font-family:var(--font-family); text-transform:none; font-weight:var(--font-weight-black); border:1.5px solid var(--border-med) !important; box-shadow:none !important; cursor:pointer; color:var(--border-blue) !important; background:transparent;">Update</button>
                            </div>
                        </div>`;

            let finPrintDropdownHtml = `
                        <div id="prtGrp-${mod.id}" class="inline-drop-grp" style="display:none; width:100%; margin-top:3px;">
                            <div class="print-dropdown-inner" style="display:flex; flex-direction:row; align-items:center; gap:0.4rem; width:100%;">
                                <div class="prof-field-wrap" style="display:flex; align-items:center; background:var(--surface-2); border:1.5px solid var(--border-med); border-radius:var(--radius-md); padding:0 0.5rem; flex:1;">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; color:var(--text-muted); flex-shrink:0;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    <select id="finPrtMode-${mod.id}" style="flex:1; border:none; background:transparent; font-size:0.6rem; padding:0.5rem 0.3rem; color:var(--text-main); outline:none; text-align:center; font-weight:var(--font-weight-bold); font-family:var(--font-family);">
                                        <option value="export">Export PDF</option>
                                        <option value="print">Print</option>
                                    </select>
                                </div>
                                <button onclick="execFinPrint('${escapeJsString(mod.id)}')" class="prof-field-wrap" style="flex:1; min-width:0; border-radius:var(--radius-md); font-size:0.6rem; font-weight:var(--font-weight-black); padding:0.5rem 0.4rem; display:flex; align-items:center; justify-content:center; white-space:nowrap; cursor:pointer; background:var(--surface-2); border:1.5px solid var(--border-med); color:var(--accent); font-family:var(--font-family); box-shadow:none;">Generate</button>
                            </div>
                        </div>`;

            const editingEntry = (inlineEditEntry && inlineEditEntry.modId === mod.id)
                ? (app.ledgers[mod.id] || []).find(e => e.id === inlineEditEntry.itemId) : null;
            if (editingEntry) {
                opts = app.cats.filter(c => app.categoryEnabled[c] !== false).map(c =>
                    `<option value="${escapeHtml(c)}" ${c === editingEntry.c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
            }
            const editQtyVal = editingEntry ? fmtNoComma(editingEntry.q !== undefined && editingEntry.q !== null && editingEntry.q !== '' ? editingEntry.q : 1) : '';
            const editUnitVal = editingEntry ? (editingEntry.u || 'kg') : 'kg';
            const formActionsHtml = editingEntry ? `
                            <div class="flex-row" style="gap:0.2rem; align-items:stretch;">
                                <button class="btn-update-ledger" style="flex:1;" onclick="updateInlineLedger('${escapeJsString(mod.id)}')">UPDATE</button>
                                <button class="btn-cancel-ledger" onclick="cancelInlineLedger()">CANCEL</button>
                            </div>` : `
                            <button class="btn-add" style="width:100%; border-radius:var(--radius-full); padding:0.35rem 0.5rem; font-size:0.8rem;" onclick="addLedger('${escapeJsString(mod.id)}')">ADD</button>`;

            let expenseFormHtml = `
                        <div class="themed-box b-gray flex-col" style="padding:0.4rem;">
                            <div class="flex-row" style="gap:0.2rem;">
                                <input type="text" id="l-i-${mod.id}" placeholder="Insert" value="${editingEntry ? escapeHtml(editingEntry.i) : ''}" style="border-radius:var(--radius-full); flex:1; padding:0.3rem 0.5rem; font-size:0.7rem;" aria-label="Item name" data-clear-on-close oninput="autoCapitalize(this)">
                                <input type="text" inputmode="decimal" id="l-a-${mod.id}" placeholder="Amount" class="blur-target" oninput="formatCommaInput(this); clampInputValue(this)" value="${editingEntry ? fmt(editingEntry.a) : ''}" style="border-radius:var(--radius-full); flex:1; padding:0.3rem 0.5rem; font-size:0.7rem;" aria-label="Amount" data-clear-on-close>
                            </div>
                            <div class="flex-row" style="gap:0.2rem;">
                                <div style="flex:0 0 50%; display:flex; align-items:center; gap:0.3rem; border-radius:var(--radius-full); padding:0.1rem 0.4rem; background:var(--surface); border:1px solid var(--border-light);">
                                    <span style="font-size:0.7rem; font-weight:var(--font-weight-black); color:var(--text-main);">CAT</span>
                                    <select id="l-c-${mod.id}" aria-label="Category" style="flex:1; min-width:0; border-radius:var(--radius-sm); padding:0.25rem 0.4rem; font-size:0.65rem; background:var(--app-bg); border:1px solid var(--border-med); color:var(--color-black);">${opts}</select>
                                </div>
                                <input type="text" inputmode="decimal" id="l-q-${mod.id}" placeholder="Qty" class="blur-target" oninput="formatCommaInput(this); clampInputValue(this)" value="${editQtyVal}" style="border-radius:var(--radius-full); flex:0 0 30%; padding:0.3rem 0.5rem; font-size:0.7rem;" aria-label="Quantity" data-clear-on-close>
                                <select id="l-u-${mod.id}" aria-label="Unit" style="border-radius:var(--radius-full); flex:0 0 12%; padding:0.25rem 0.1rem; font-size:0.6rem; background:var(--app-bg); border:1px solid var(--border-med); color:var(--color-black);">${buildUnitOpts(editUnitVal)}</select>
                            </div>
                            ${formActionsHtml}
                        </div>`;

            return `<div class="fin-cont sub-view-section ${isActive?'active':''}" id="tabcont-${mod.id}" style="${isActive?'display:flex;':'display:none;'} flex-direction:column;">
                        <div class="themed-box b-gray flex-col" style="padding:0.3rem; gap:0.15rem; background:var(--surface); border-radius:var(--radius-lg); box-shadow:var(--shadow-sm);">
                            ${finHeaderHtml}
                            ${finRow2Html}
                            ${finActionButtons}
                            ${finStatusDropdownHtml}
                            ${finPrintDropdownHtml}
                        </div>
                        <div class="themed-box b-gray flex-col" id="sum-${mod.id}" style="margin-bottom:0.3rem; background:var(--app-bg); padding:0.4rem;"></div>
                        ${expenseFormHtml}
                        ${entryCounterHtml}
                        <div class="flex-col" style="margin-bottom:0.3rem;">${listHtml}</div>
                    </div>`;
        }

        // ---- Records screen (Total Expenditure view shared by Grids & Finance) ----
        function parseEntryDate(dateStr) {
            if (!dateStr) return null;
            if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
                const parts = dateStr.split('T')[0].split('-');
                const y = parseInt(parts[0], 10);
                const mo = parseInt(parts[1], 10) - 1;
                const d = parseInt(parts[2], 10);
                if (!isNaN(y) && !isNaN(mo) && !isNaN(d)) return new Date(y, mo, d);
            }
            const dt = new Date(dateStr);
            return isNaN(dt.getTime()) ? null : dt;
        }

        function getRecordExpenseEntries() {
            let allEntries = [];
            Object.keys(app.totalExpense || {}).forEach(modId => {
                const weeks = app.totalExpense[modId];
                ['week1', 'week2', 'week3', 'week4'].forEach(wk => {
                    (weeks[wk] || []).forEach(entry => {
                        allEntries.push({ ...entry, dateObj: parseEntryDate(entry.d) });
                    });
                });
            });
            return allEntries;
        }

        function getRecordExpenseEntriesForMonth(monthKey) {
            if (!monthKey) return [];
            return getRecordExpenseEntries().filter(e => {
                if (!isNaN(e.dateObj.getTime())) {
                    const mk = e.dateObj.getFullYear() + '-' + String(e.dateObj.getMonth() + 1).padStart(2, '0');
                    return mk === monthKey;
                }
                return false;
            });
        }

        function currentExpenseMonthKey() {
            const d = new Date(currentRenderDateStr);
            if (isNaN(d.getTime())) return null;
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        }

        function getRecordSelectedMonth() {
            if (selectedRecordMonthTab) return selectedRecordMonthTab;
            return currentExpenseMonthKey();
        }

        function getMonthShortFromKey(key) {
            let parts = key.split('-');
            if (parts.length === 2) {
                let monthIdx = parseInt(parts[1], 10) - 1;
                if (monthIdx >= 0 && monthIdx < 12) return MONTH_NAMES_SHORT[monthIdx] + ' ' + parts[0];
            }
            return key;
        }

        function getRecordMonths() {
            const set = {};
            const cmk = currentExpenseMonthKey();
            if (cmk) set[cmk] = true;
            getRecordExpenseEntries().forEach(e => {
                if (!isNaN(e.dateObj.getTime())) {
                    const mk = e.dateObj.getFullYear() + '-' + String(e.dateObj.getMonth() + 1).padStart(2, '0');
                    set[mk] = true;
                }
            });
            return Object.keys(set).sort((a, b) => b.localeCompare(a));
        }

        function buildRecordMonthSelect() {
            const months = getRecordMonths();
            if (months.length === 0) return '';
            const selMonth = getRecordSelectedMonth();
            let opts = '';
            months.forEach(m => {
                opts += `<option value="${m}" ${selMonth === m ? 'selected' : ''}>${escapeHtml(getMonthNameFromKey(m))}</option>`;
            });
            return `
                <div style="display:flex; align-items:center; margin:0.2rem 0 0.15rem; width:100%;">
                    <select id="recordMonthSel" onchange="recordMonthChanged(this.value)" aria-label="Select month" style="flex:1; min-width:0; border-radius:var(--radius-full); font-size:0.55rem; padding:0.2rem 0.4rem; height:28px; background:var(--app-bg); border:1.5px solid var(--border-med); color:var(--text-main); outline:none; text-align:center; font-weight:var(--font-weight-bold);">${opts}</select>
                </div>`;
        }

        function recordMonthChanged(value) {
            selectedRecordMonthTab = value || null;
            const recCont = D.getElementById('tabcont-total_expense_tab');
            if (recCont) recCont.innerHTML = buildRecordsScreenHTML();
        }

        function getTotalExpenseTopTotals() {
            let monthTotal = 0;
            const targetMonth = getRecordSelectedMonth();
            getRecordExpenseEntriesForMonth(targetMonth).forEach(e => {
                monthTotal += e.a;
            });
            monthTotal = Math.min(monthTotal, MAX_INPUT_VALUE);
            let totalBudget = 0;
            (app.modules || []).forEach(m => {
                if (m.format === 'ledger') {
                    const b = app.moduleBudgets && app.moduleBudgets[m.id] ? app.moduleBudgets[m.id] : 0;
                    totalBudget += Number(b) || 0;
                }
            });
            totalBudget = Math.min(totalBudget, MAX_INPUT_VALUE);
            return { totalBudget, monthTotal };
        }

        function buildTotalExpenseDistribution() {
            let catTotals = {};
            let catCounts = {};
            getRecordExpenseEntriesForMonth(getRecordSelectedMonth()).forEach(entry => {
                const c = entry.c || 'Uncategorized';
                if (!catTotals[c]) catTotals[c] = 0;
                catTotals[c] += entry.a;
                catCounts[c] = (catCounts[c] || 0) + 1;
            });
            const cats = Object.keys(catTotals);
            if (cats.length === 0) return '';
            const grand = cats.reduce((s, c) => s + catTotals[c], 0);
            cats.sort((a, b) => catTotals[b] - catTotals[a]);
            let totalEntries = 0;
            const rows = cats.map((c, idx) => {
                const col = getCategoryColor(c);
                const pct = grand > 0 ? Math.round((catTotals[c] / grand) * 100) : 0;
                totalEntries += catCounts[c];
                return `
                            <tr>
                                <td style="text-align:center; font-size:0.55rem; font-weight:var(--font-weight-bold); color:var(--text-muted); padding:0.2rem;">${String(idx+1).padStart(2, '0')}</td>
                                <td style="text-align:center; font-size:0.6rem; font-weight:var(--font-weight-bold); color:${col}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding:0.2rem;">${escapeHtml(c)}</td>
                                <td style="text-align:center; font-size:0.6rem; font-weight:var(--font-weight-bold); color:var(--text-main); padding:0.2rem;">${catCounts[c]}</td>
                                <td style="text-align:center; font-size:0.6rem; font-weight:var(--font-weight-bold); color:${col}; padding:0.2rem;">${pct}%</td>
                                <td style="text-align:center; font-size:0.65rem; font-weight:var(--font-weight-black); color:${col}; padding:0.2rem;">${fmtMoney(catTotals[c])}</td>
                            </tr>`;
            }).join('');
            return `
                <div class="themed-box b-gray flex-col" style="padding:0.4rem; margin:0.5rem 0 0.5rem;">
                    <h3 class="sub-lbl" style="font-size:0.6rem; color:var(--accent); text-align:center; margin-bottom:0.25rem; text-transform:uppercase; letter-spacing:0.05em;">Distribution</h3>
                    <div style="text-align:center; font-size:0.55rem; color:var(--text-muted); margin-bottom:0.15rem; font-weight:var(--font-weight-bold);">Total Categories: <span style="color:var(--accent); font-weight:var(--font-weight-black);">${String(cats.length).padStart(2, '0')}</span></div>
                    <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
                        <thead>
                            <tr style="border-bottom:1.5px solid var(--accent);">
                                <th style="width:20%; text-align:center; font-size:0.55rem; font-weight:var(--font-weight-black); color:var(--accent); text-transform:uppercase; padding:0.2rem;">#</th>
                                <th style="width:20%; text-align:center; font-size:0.55rem; font-weight:var(--font-weight-black); color:var(--accent); text-transform:uppercase; padding:0.2rem;">Cat</th>
                                <th style="width:20%; text-align:center; font-size:0.55rem; font-weight:var(--font-weight-black); color:var(--accent); text-transform:uppercase; padding:0.2rem;">Entries</th>
                                <th style="width:20%; text-align:center; font-size:0.55rem; font-weight:var(--font-weight-black); color:var(--accent); text-transform:uppercase; padding:0.2rem;">%</th>
                                <th style="width:20%; text-align:center; font-size:0.55rem; font-weight:var(--font-weight-black); color:var(--accent); text-transform:uppercase; padding:0.2rem;">Total</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                        <tfoot>
                            <tr style="border-top:1.5px solid var(--accent);">
                                <td style="text-align:center; font-size:0.6rem; font-weight:var(--font-weight-black); color:var(--accent); padding:0.2rem;">Total</td>
                                <td style="font-size:0.6rem; padding:0.2rem;"></td>
                                <td style="text-align:center; font-size:0.6rem; font-weight:var(--font-weight-black); color:var(--accent); padding:0.2rem;">${totalEntries}</td>
                                <td style="text-align:center; font-size:0.6rem; font-weight:var(--font-weight-black); color:var(--accent); padding:0.2rem;">100%</td>
                                <td style="text-align:center; font-size:0.65rem; font-weight:var(--font-weight-black); color:var(--accent); padding:0.2rem;">${fmtMoney(grand)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>`;
        }

        function buildRecordsScreenHTML() {
            const top = getTotalExpenseTopTotals();
            const monthColor = (top.totalBudget - top.monthTotal) >= 0 ? 'var(--green)' : 'var(--red)';
            return `
                <div class="themed-box b-main flex-col total-expense-page" style="padding:0.4rem;">
                    <h2 style="font-size:0.9rem; color:var(--accent); margin:0; text-align:center; width:100%;">Finance Record</h2>
                    ${buildRecordMonthSelect()}
                    <div class="fin-totals" style="border:none; padding-top:0.15rem; margin-top:0; grid-template-columns:repeat(2, 1fr);">
                        <div class="total-item">
                            <span class="sub-lbl" style="color:var(--accent);">Total Budget</span>
                            <span class="total-val blur-target" style="color:var(--accent);">${fmtMoney(top.totalBudget)}</span>
                        </div>
                        <div class="total-item">
                            <span class="sub-lbl" style="color:${monthColor};">Month Total</span>
                            <span class="total-val blur-target" style="color:${monthColor};">${fmtMoney(top.monthTotal)}</span>
                        </div>
                    </div>
                    ${buildTotalExpenseDistribution()}
                    ${buildInlineExpenseEditForm()}
                    <p style="font-size:0.55rem; color:var(--text-muted); text-align:center; margin-bottom:0.2rem;">Aggregated expense entries from all modules, grouped by month and week.</p>
                    ${buildTotalExpenseHTML()}
                    ${buildDeleteRecordMonthButton()}
                </div>`;
        }

        function buildDeleteRecordMonthButton() {
            const monthKey = getRecordSelectedMonth();
            if (!monthKey) return '';
            const monthName = getMonthNameFromKey(monthKey);
            return `
                <div style="margin-top:0.4rem;" class="delete-month-wrap">
                    <button class="btn-del-month" onclick="deleteRecordMonth('${monthKey}')" aria-label="Delete ${escapeHtml(monthName)} records">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Delete ${escapeHtml(monthName)} Record
                    </button>
                </div>`;
        }

        function deleteRecordMonth(monthKey) {
            const monthName = getMonthNameFromKey(monthKey);
            let count = 0;
            getRecordExpenseEntriesForMonth(monthKey).forEach(() => { count++; });
            if (count === 0) {
                showToast(monthName + ' has no records to delete', 'error');
                return;
            }
            customConfirm('Delete ' + count + ' record(s) for ' + monthName + '? The whole ' + monthName + ' record file will be moved to the recycle bin.', () => {
                const bundle = { monthKey: monthKey, count: count, entries: [] };
                Object.keys(app.totalExpense || {}).forEach(modId => {
                    const weeks = app.totalExpense[modId];
                    ['week1', 'week2', 'week3', 'week4'].forEach(wk => {
                        const arr = weeks[wk] || [];
                        const keep = [];
                        arr.forEach(en => {
                            const d = parseEntryDate(en.d);
                            if (!d) { keep.push(en); return; }
                            const mk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                            if (mk === monthKey) {
                                bundle.entries.push({ ...en, modId: modId, weekKey: wk });
                            } else {
                                keep.push(en);
                            }
                        });
                        weeks[wk] = keep;
                    });
                    ['week1', 'week2', 'week3', 'week4'].forEach(wk => {
                        if ((weeks[wk] || []).length === 0) delete weeks[wk];
                    });
                    if (Object.keys(weeks).length === 0) delete app.totalExpense[modId];
                });
                binAdd('expenseMonth', bundle, monthName + ' Record', { monthKey: monthKey, count: count });
                selectedRecordMonthTab = null;
                saveData();
                renderApp();
                showToast(monthName + ' record file moved to recycle bin', 'success');
            });
        }

        // ---- Add to Total Expense ----
        let addToTotalExpenseLock = {};

        function addToTotalExpense(modId) {
            if (addToTotalExpenseLock[modId]) return;
            addToTotalExpenseLock[modId] = true;

            try {
                const itemInput = document.getElementById(`l-i-${modId}`);
                const amountInput = document.getElementById(`l-a-${modId}`);
                const catSelect = document.getElementById(`l-c-${modId}`);
                const dateInput = document.getElementById(`hdr-date-${modId}`);

                const item = itemInput.value.trim();
                const amount = parseCommaNum(amountInput.value);
                const category = catSelect.value;
                const date = dateInput.value;
                const qtyInput = document.getElementById(`l-q-${modId}`);
                let q = qtyInput && qtyInput.value.trim() ? parseCommaNum(qtyInput.value) : 1;
                if (!q || q <= 0) q = 1;
                const unitInput = document.getElementById(`l-u-${modId}`);
                const u = unitInput ? unitInput.value : '';
                const total = Math.min(amount, MAX_INPUT_VALUE);

                if (!item || !amount) { showToast('Please enter item and amount', 'error'); return; }
                if (amount <= 0) { showToast('Amount must be greater than 0', 'error'); return; }

                // Determine week
                const d = new Date(date);
                const day = d.getDate();
                let weekKey = 'week1';
                if (day >= 8 && day <= 14) weekKey = 'week2';
                else if (day >= 15 && day <= 21) weekKey = 'week3';
                else if (day >= 22) weekKey = 'week4';

                if (!app.totalExpense[modId]) app.totalExpense[modId] = {};
                if (!app.totalExpense[modId][weekKey]) app.totalExpense[modId][weekKey] = [];

                // Check duplicate
                const existing = app.totalExpense[modId][weekKey];
                const isDuplicate = existing.some(e => e.i === item && e.a === total && e.c === category && e.d === date);
                if (isDuplicate) { showToast('Duplicate entry', 'info'); return; }

                const entry = { id: generateId(), i: item, a: total, c: category, d: date, q, u };
                app.totalExpense[modId][weekKey].push(entry);

                // Also add to regular ledger
                if (app.ledgers[modId]) {
                    const isDup = app.ledgers[modId].some(e => e.i === item && e.a === amount && e.c === category && e.d === date && (e.q || 1) === q && (e.u || '') === u);
                    if (!isDup) {
                        app.ledgers[modId].push({ id: generateId(), i: item, a: Math.min(amount, MAX_INPUT_VALUE), c: category, d: date, q, u });
                    }
                }

                logActivity(`Added to total expense: ${item} at ${getCurrencySymbol()}${amount}`);
                saveData();
                renderApp();
                itemInput.value = '';
                amountInput.value = '';
                if (qtyInput) qtyInput.value = '';
                if (unitInput) unitInput.value = '';
                showToast('Added to expense successfully', 'success');
            } finally { setTimeout(() => { addToTotalExpenseLock[modId] = false; }, 300); }
        }

        // ---- Add current month's entries to the record (Total Expenditure) ----
        function addMonthToRecord(modId) {
            const mod = app.modules.find(m => m.id === modId);
            if (!mod) return;
            const dObj = new Date(mod.start);
            const entries = (app.ledgers[modId] || []).filter(l => {
                const d = new Date(l.d);
                return d.getMonth() === dObj.getMonth() && d.getFullYear() === dObj.getFullYear();
            });
            if (!entries.length) { showToast('No entries to add to record', 'error'); return; }
            if (!app.totalExpense[modId]) app.totalExpense[modId] = {};
            let added = 0;
            entries.forEach(l => {
                const total = Math.min(entryTotal(l), MAX_INPUT_VALUE);
                const day = new Date(l.d).getDate();
                let weekKey = 'week1';
                if (day >= 8 && day <= 14) weekKey = 'week2';
                else if (day >= 15 && day <= 21) weekKey = 'week3';
                else if (day >= 22) weekKey = 'week4';
                if (!app.totalExpense[modId][weekKey]) app.totalExpense[modId][weekKey] = [];
                const dup = app.totalExpense[modId][weekKey].some(e => e.i === l.i && e.a === total && e.c === l.c && e.d === l.d && (e.q || 1) === (l.q || 1) && (e.u || '') === (l.u || ''));
                if (dup) return;
                const te = { id: generateId(), i: l.i, a: total, c: l.c, d: l.d };
                if (l.q !== undefined && l.q !== null) te.q = l.q;
                if (l.u) te.u = l.u;
                app.totalExpense[modId][weekKey].push(te);
                added++;
            });
            if (!added) { showToast('All entries already in record', 'info'); return; }
            logActivity(`Added ${added} entries to record for ${mod.title}`);
            saveData();
            renderApp();
            showToast(trf('{count} entry(s) added to record', { count: added }), 'success');
        }

        // ---- Add grid snapshot to records (aggregated state counts) ----
        function addGridToRecords(modId) {
            
            const mod = app.modules.find(m => m.id === modId);
            if (!mod) return;
            const gridData = app.grids[mod.id] || [];
            const stateCounts = {};
            mod.states.forEach(s => { stateCounts[s] = 0; });
            gridData.forEach(st => { if (stateCounts[st] !== undefined) stateCounts[st]++; });
            const totalDays = Object.values(stateCounts).reduce((a, b) => a + b, 0);
            if (totalDays === 0) { showToast('No data to add', 'error'); return; }
            const date = currentRenderDateStr;
            const dObj = new Date(date);
            const monthKey = dObj.getFullYear() + '-' + String(dObj.getMonth() + 1).padStart(2, '0');
            if (!Array.isArray(app.gridRecords)) app.gridRecords = [];
            const existing = app.gridRecords.find(r => r.modId === modId && r.monthKey === monthKey);
            if (existing) {
                existing.stateCounts = stateCounts;
                existing.totalDays = totalDays;
                existing.d = date;
                existing.modName = mod.title;
                logActivity(`Updated grid record: ${mod.title}`);
                saveData();
                renderApp();
                showToast('Grid record updated', 'success');
                return;
            }
            app.gridRecords.push({
                id: generateId(),
                modId: modId,
                modName: mod.title,
                stateCounts: stateCounts,
                totalDays: totalDays,
                d: date,
                monthKey: monthKey
            });
            logActivity(`Added grid record: ${mod.title}`);
            saveData();
            renderApp();
            showToast('Added to records', 'success');
        }

        // ---- Build Total Expense HTML (no commas) ----
        function buildTotalExpenseHTML() {
            if (!app.totalExpense || Object.keys(app.totalExpense).length === 0) {
                return '<div class="empty-state">' + t('empty.noRecordsYet') + '</div>';
            }
            let allEntries = [];
            let moduleNames = {};
            app.modules.forEach(m => { moduleNames[m.id] = m.title; });

            Object.keys(app.totalExpense).forEach(modId => {
                const weeks = app.totalExpense[modId];
                ['week1', 'week2', 'week3', 'week4'].forEach(wk => {
                    (weeks[wk] || []).forEach(entry => {
                        allEntries.push({ ...entry, modId, modName: moduleNames[modId] || modId,
weekKey: wk, dateObj: parseEntryDate(entry.d) });
                    });
                });
            });

            if (allEntries.length === 0) {
                return '<div class="empty-state">' + t('empty.noRecordsYet') + '</div>';
            }

            allEntries.sort((a, b) => a.dateObj - b.dateObj);

            const weekLabels = ['Week 1 (1-7)', 'Week 2 (8-14)', 'Week 3 (15-21)', 'Week 4 (22-31)'];
            const weekKeys = ['week1', 'week2', 'week3', 'week4'];

            let html = '';

            // ---- Detailed expenditure format (finance ledger records) ----
            let monthGroups = {};
            allEntries.forEach(e => {
                if (isNaN(e.dateObj.getTime())) return;
                const monthKey = e.dateObj.getFullYear() + '-' + String(e.dateObj.getMonth() + 1).padStart(2,
                '0');
                if (!monthGroups[monthKey]) monthGroups[monthKey] = { week1: [], week2: [], week3: [],
                    week4: [] };
                monthGroups[monthKey][e.weekKey].push(e);
            });
            const cmk = currentExpenseMonthKey();
            if (cmk && !monthGroups[cmk]) monthGroups[cmk] = { week1: [], week2: [], week3: [],
                week4: [] };
            const sortedMonths = Object.keys(monthGroups).sort((a, b) => b.localeCompare(a));
            const filteredMonths = sortedMonths.filter(m => m === getRecordSelectedMonth());
            if (filteredMonths.length === 0) {
                return '<div class="empty-state">' + t('empty.noRecordsYet') + '</div>';
            }

            filteredMonths.forEach(monthKey => {
                const monthName = getMonthNameFromKey(monthKey);
                const monthShort = getMonthShortFromKey(monthKey);
                const weeks = monthGroups[monthKey];
                html += `<div class="te-month-group">`;
                html += `<div class="te-month-title">${escapeHtml(monthName)}</div>`;

                weekKeys.forEach((wk, idx) => {
                    const items = weeks[wk] || [];
                    if (items.length === 0) {
                        html += `
                                    <div class="te-week-group">
                                        <div class="te-week-title">${weekLabels[idx]} <span style="font-weight:400;font-size:0.45rem;color:var(--text-muted);">· ${escapeHtml(monthShort)}</span> <span style="font-weight:400;font-size:0.45rem;color:var(--text-muted);">(0 entries)</span></div>
                                        <div class="empty-state" style="padding:0.15rem 0; font-size:0.55rem;">${t('empty.noEntriesWeek')}</div>
                                    </div>`;
                        return;
                    }
                    let rows = items.map((item, sn) => {
                        return `
                                    <tr>
                                        <td class="td-num blur-target">${String(sn+1).padStart(2,'0')}</td>
                                        <td class="blur-target">${escapeHtml(String(item.i).replace(/,/g, ' '))}</td>
                                        <td class="td-date">${escapeHtml(item.d)}</td>
                                        <td>${escapeHtml(item.c)}</td>
                                        <td>${fmtNoComma(item.q !== undefined && item.q !== null && item.q !== '' ? item.q : 1)}${item.u ? ' ' + escapeHtml(item.u) : ''}</td>
                                        <td>${fmtMoney(item.a)}</td>
                                        <td>
                                            <button class="btn-edit-sm" onclick="editTotalExpenseEntry('${escapeJsString(item.modId)}','${item.weekKey}','${item.id}')" aria-label="Edit entry"><svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                                            <button class="btn-del-sm" onclick="deleteTotalExpenseEntry('${escapeJsString(item.modId)}','${item.weekKey}','${item.id}')" aria-label="Delete entry"><svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                                        </td>
                                    </tr>`;
                    });
                    html += `
                                <div class="te-week-group" style="margin-bottom:0.15rem;">
                                    <div class="te-week-title">${weekLabels[idx]} <span style="font-weight:400;font-size:0.45rem;color:var(--text-muted);">(${items.length} entries)</span></div>
                                    <div class="ledger-table-wrap">
                                        <table class="ledger-table">
                                            <thead><tr><th>#</th><th>ITEM</th><th>DATE</th><th>CAT</th><th>QTY</th><th>PRICE</th><th>EDIT</th></tr></thead>
                                            <tbody>${rows}</tbody>
                                        </table>
                                    </div>
                                </div>`;
                });

                html += `</div>`;
            });

            return html;
        }

        // ---- Aggregated GRID RECORDS screen (grid add-to-record) ----
        function buildGridRecordsScreenHTML() {
            return `
                <div class="themed-box b-main flex-col total-expense-page" style="padding:0.4rem;">
                    <h2 style="font-size:0.9rem; color:var(--accent); margin:0; text-align:center; width:100%;">Grid Record</h2>
                    <p style="font-size:0.55rem; color:var(--text-muted); text-align:center; margin-bottom:0.2rem;">Saved analytics snapshots from all grid modules, grouped by month.</p>
                    ${buildGridRecordsHTML()}
                </div>`;
        }

        function buildGridRecordsHTML() {
            const records = Array.isArray(app.gridRecords) ? app.gridRecords : [];
            if (records.length === 0) {
                return '<div class="empty-state" style="font-size:0.6rem;">' + t('empty.noGridRecords') + '</div>';
            }
            let monthGroups = {};
            records.forEach(r => {
                const mk = r.monthKey || 'unknown';
                if (!monthGroups[mk]) monthGroups[mk] = [];
                monthGroups[mk].push(r);
            });
            let html = '';
            const sortedMonths = Object.keys(monthGroups).sort((a, b) => b.localeCompare(a));
            let sn = 0;
            sortedMonths.forEach(monthKey => {
                const monthName = getMonthNameFromKey(monthKey);
                const items = monthGroups[monthKey];
                html += `
                    <div style="border:1.5px solid var(--border-light); border-radius:var(--radius-md); background:var(--app-bg); padding:0.5rem; margin-bottom:0.3rem;">
                        <div style="text-align:center; font-size:0.75rem; font-weight:var(--font-weight-black); letter-spacing:1.5px; color:var(--accent); border-bottom:1.5px solid var(--accent); padding-bottom:0.25rem; margin-bottom:0.3rem;">${escapeHtml(monthName)}</div>`;
                items.forEach(item => {
                    sn++;
                    const stateBadges = Object.keys(item.stateCounts || {}).map(state => {
                        const col = getStateColor(state);
                        return `<span style="display:inline-block; font-size:0.4rem; font-weight:var(--font-weight-black); padding:0.05rem 0.2rem; border-radius:var(--radius-full); background:var(--surface); border:1px solid ${col}; color:${col}; white-space:nowrap;">${escapeHtml(state)} ${item.stateCounts[state]}</span>`;
                    }).join('');
                    html += `
                        <div style="display:flex; align-items:center; gap:0.2rem; border:1px solid var(--border-light); border-radius:var(--radius-md); padding:0.2rem 0.25rem; background:var(--surface); margin-bottom:0.2rem;">
                            <div style="font-size:0.5rem; font-weight:var(--font-weight-black); color:var(--text-main); white-space:nowrap; flex-shrink:0;">${String(sn).padStart(2, '0')}. ${escapeHtml(item.modName)}</div>
                            <div style="display:flex; flex-wrap:nowrap; gap:0.08rem; min-width:0; flex:1; overflow:hidden;">${stateBadges}</div>
                            <button onclick="deleteGridRecord('${escapeJsString(item.id)}')" style="border:none; background:transparent; cursor:pointer; padding:0.1rem; color:var(--red); flex-shrink:0; min-width:18px; min-height:18px; display:flex; align-items:center; justify-content:center;" aria-label="Delete record"><svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                        </div>`;
                });
                html += `</div>`;
            });
            return html;
        }

        function deleteGridRecord(itemId) {
            if (!Array.isArray(app.gridRecords)) return;
            const idx = app.gridRecords.findIndex(r => r.id === itemId);
            if (idx === -1) return;
            const record = app.gridRecords[idx];
            binAdd('gridRecord', record, 'Grid Record: ' + record.modName + ' (' + getMonthNameFromKey(record.monthKey) + ')');
            app.gridRecords.splice(idx, 1);
            saveData();
            renderApp();
            showToast('Grid record deleted', 'info');
        }

        function getMonthNameFromKey(key) {
            let parts = key.split('-');
            if (parts.length === 2) {
                let monthIdx = parseInt(parts[1], 10) - 1;
                if (monthIdx >= 0 && monthIdx < 12) return MONTH_NAMES_FULL[monthIdx] + ' ' + parts[0];
            }
            return key;
        }

        function getArchiveDisplayName(key) {
            if (app.archiveNames && app.archiveNames[key]) return app.archiveNames[key];
            return getMonthNameFromKey(key);
        }

        function rebuildFinanceTabs() {
            const financeSection = D.getElementById('route-finance');
            if (financeSection && financeSection.classList.contains('active')) {
                renderApp();
                if (activeFinTabId) setTimeout(() => { const btn = D.getElementById('tabbtn-' + activeFinTabId); if (btn)
                        btn.click(); }, 50);
            }
        }

        function updateModRate(id, v) {
            let m = app.modules.find(x => x.id === id);
            if (m) {
                let val = parseCommaNum(v);
                val = Math.min(val, MAX_INPUT_VALUE);
                m.rate = val;
                saveData();
                renderApp();
            }
        }

        function cycleState(modId, dayIdx, el) {
            let m = app.modules.find(x => x.id === modId);
            if (!m) return;
            let stArr = m.states;
            if (!stArr.includes('Pending')) { stArr = ['Pending', ...stArr];
                m.states = stArr; }
            let cur = app.grids[modId][dayIdx] || 'Pending';
            let curIdx = stArr.indexOf(cur);
            if (curIdx === -1) curIdx = 0;
            let nxt = stArr[(curIdx + 1) % stArr.length];
            app.grids[modId][dayIdx] = nxt;
            logActivity(`Cycled grid state in ${m.title} day ${dayIdx+1} to ${nxt}`);
            saveData();
            let col = getStateColor(nxt);
            el.style.background = col;
            calcAnalytics();
            updateGridStats(modId);
            updateNotificationBell();
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        }

        let addLedgerLock = {};

        function addLedger(modId) {
            
            if (addLedgerLock[modId]) return;
            addLedgerLock[modId] = true;

            try {
                let i = D.getElementById(`l-i-${modId}`).value.trim();
                let rawA = D.getElementById(`l-a-${modId}`).value.trim();
                let a = parseCommaNum(rawA);
                a = Math.min(a, MAX_INPUT_VALUE);
                let c = D.getElementById(`l-c-${modId}`).value.trim();
                let d = D.getElementById(`hdr-date-${modId}`).value;
                const qEl = D.getElementById(`l-q-${modId}`);
                let q = qEl && qEl.value.trim() ? parseCommaNum(qEl.value) : 1;
                if (!q || q <= 0) q = 1;
                q = Math.min(q, MAX_INPUT_VALUE);
                const uEl = D.getElementById(`l-u-${modId}`);
                const u = uEl ? uEl.value : '';

                if (!i) return;
                if (!rawA || a === 0) return;

                const existing = app.ledgers[modId] || [];
                const isDuplicate = existing.some(entry => entry.i === i && entry.a === a && entry.c === c && entry
                    .d === d && (entry.q || 1) === q && (entry.u || '') === u);
                if (isDuplicate) return;

                app.ledgers[modId].push({ id: generateId(), i, a, c, d, q, u });
                logActivity(`Appended ledger entry: ${i} at ${getCurrencySymbol()}${a}`);
                saveData();
                renderApp();
                D.getElementById(`l-i-${modId}`).value = '';
                D.getElementById(`l-a-${modId}`).value = '';
                if (qEl) qEl.value = '';
                if (uEl) uEl.value = '';
                showToast('Entry added successfully', 'success');
            } finally { setTimeout(() => { addLedgerLock[modId] = false; }, 300); }
        }

        function binAdd(type, data, title, extra) {
            if (!Array.isArray(app.bin)) app.bin = [];
            const entry = { id: generateId(), type: type, data: data, title: title, deletedAt: Date.now() };
            if (extra) Object.assign(entry, extra);
            app.bin.push(entry);
            if (app.bin.length > 100) app.bin.shift();
            return entry;
        }

        function binCleanup() {
            if (!Array.isArray(app.bin)) app.bin = [];
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            const now = Date.now();
            const before = app.bin.length;
            app.bin = app.bin.filter(b => (now - (b.deletedAt || 0)) < thirtyDays);
            if (app.bin.length < before) saveData();
        }

        function delLedger(modId, itemId) {
            if (inlineEditEntry && inlineEditEntry.modId === modId && inlineEditEntry.itemId === itemId) inlineEditEntry = null;
            let idx = app.ledgers[modId].findIndex(x => x.id === itemId);
            if (idx > -1) {
                let item = app.ledgers[modId][idx];
                binAdd('ledger', item, 'Ledger: ' + item.i, { modId: modId });
                app.ledgers[modId].splice(idx, 1);
                logActivity(`Deleted ledger entry: ${item.i}`);
                saveData();
                renderApp();
                showToast('Entry deleted', 'info');
            }
        }

        function delModule(modId) {
            let idx = app.modules.findIndex(m => m.id === modId);
            if (idx > -1) {
                let m = app.modules[idx];
                if (m.format === 'grid' && app.grids) {
                    delete app.grids[m.id];
                    delete app.grids[m.id + '_stat'];
                    delete app.grids[m.id + '_salary'];
                    delete app.grids[m.id + '_showSalary'];
                    delete app.grids[m.id + '_showRate'];
                    if (Array.isArray(app.gridRecords)) app.gridRecords = app.gridRecords.filter(r => r.modId !== m.id);
                }
                if (m.format === 'ledger' && app.ledgers) {
                    delete app.ledgers[m.id];
                    delete app.ledgers[m.id + '_stat'];
                    delete app.ledgers[m.id + '_showBudget'];
                    delete app.moduleBudgets[m.id];
                    if (app.totalExpense) delete app.totalExpense[m.id];
                }
                binAdd('module', m, 'Console: ' + m.title);
                app.modules.splice(idx, 1);
                logActivity(`Deleted module: ${m.title}`);
                saveData();
                renderApp();
                populateSettings();
                showToast('Module deleted', 'info');
            }
        }

        function restoreBin(binId) {
            let idx = app.bin.findIndex(x => x.id === binId);
            if (idx > -1) {
                let b = app.bin[idx];
                if (b.type === 'module') {
                    if (app.modules.some(m => m.id === b.data.id)) return;
                    app.modules.push(b.data);
                } else if (b.type === 'ledger') {
                    if (!app.ledgers[b.modId]) app.ledgers[b.modId] = [];
                    if (!app.ledgers[b.modId].some(e => e.id === b.data.id)) app.ledgers[b.modId].push(b.data);
                    else { b.data.id = generateId();
                        app.ledgers[b.modId].push(b.data); }
                } else if (b.type === 'picture') {
                    if (!app.pictures) app.pictures = [];
                    if (!app.pictures.some(p => p.id === b.data.id)) app.pictures.push(b.data);
                    else { b.data.id = generateId();
                        app.pictures.push(b.data); }
                } else if (b.type === 'note') {
                    if (!app.notes) app.notes = [];
                    if (!app.notes.some(n => n.id === b.data.id)) app.notes.push(b.data);
                    else { b.data.id = generateId();
                        app.notes.push(b.data); }
                } else if (b.type === 'budget' || b.type === 'category' || b.type === 'status') {
                    // Handle console item restoration
                    if (b.type === 'budget' && b.data && !app.budgetCats.includes(b.data)) {
                        app.budgetCats.push(b.data);
                        app.budgets[b.data] = '';
                        app.budgetEnabled[b.data] = true;
                    } else if (b.type === 'category' && b.data && !app.cats.includes(b.data)) {
                        app.cats.push(b.data);
                        app.categoryEnabled[b.data] = true;
                    } else if (b.type === 'status' && b.data && b.data.name && !app.customStatusSets[b.data.name]) {
                        app.customStatusSets[b.data.name] = b.data.states || [];
                        app.customStatusSetColors[b.data.name] = b.data.colors || [];
                        app.statusSetEnabled[b.data.name] = true;
                    }
                } else if (b.type === 'gridRecord') {
                    if (!Array.isArray(app.gridRecords)) app.gridRecords = [];
                    if (!app.gridRecords.some(r => r.id === b.data.id)) app.gridRecords.push(b.data);
                    else { b.data.id = generateId();
                        app.gridRecords.push(b.data); }
                } else if (b.type === 'archive') {
                    const key = b.data && b.data.key;
                    if (key && app.archives[key] === undefined) app.archives[key] = b.data.html || '';
                    populateStorageFull();
                } else if (b.type === 'expense') {
                    if (!app.totalExpense) app.totalExpense = {};
                    if (!app.totalExpense[b.modId]) app.totalExpense[b.modId] = {};
                    if (!app.totalExpense[b.modId][b.weekKey]) app.totalExpense[b.modId][b.weekKey] = [];
                    if (!app.totalExpense[b.modId][b.weekKey].some(e => e.id === b.data.id)) {
                        app.totalExpense[b.modId][b.weekKey].push(b.data);
                    } else { b.data.id = generateId();
                        app.totalExpense[b.modId][b.weekKey].push(b.data); }
                } else if (b.type === 'expenseMonth') {
                    if (!app.totalExpense) app.totalExpense = {};
                    const bundle = b.data;
                    if (bundle && Array.isArray(bundle.entries)) {
                        let restored = 0;
                        bundle.entries.forEach(en => {
                            const modId = en.modId, wk = en.weekKey;
                            if (!modId || !wk) return;
                            if (!app.totalExpense[modId]) app.totalExpense[modId] = {};
                            if (!app.totalExpense[modId][wk]) app.totalExpense[modId][wk] = [];
                            const clean = { id: en.id, i: en.i, a: en.a, c: en.c, d: en.d };
                            if (en.q !== undefined && en.q !== null) clean.q = en.q;
                            if (en.u) clean.u = en.u;
                            if (app.totalExpense[modId][wk].some(e => e.id === clean.id)) clean.id = generateId();
                            app.totalExpense[modId][wk].push(clean);
                            restored++;
                        });
                        if (restored > 0) showToast(restored + ' record(s) restored', 'success');
                    }
                } else if (b.type === 'calcRecord') {
                    if (!Array.isArray(calcRecords)) calcRecords = [];
                    calcRecords.push(b.data);
                    if (calcRecords.length > 30) calcRecords.shift();
                    calcRecords = calcRecords.map((r, i) => ({ d: r.d, n: String(i + 1).padStart(2, '0'), expr: r.expr, res: r.res }));
                    calcRecordSeq = calcRecords.length;
                    dbSaveCalcRecords(calcRecords, calcRecordSeq).catch(() => {});
                    renderCalcRecord();
                } else if (b.type === 'ageRecord') {
                    if (!Array.isArray(ageRecords)) ageRecords = [];
                    ageRecords.push(b.data);
                    if (ageRecords.length > 30) ageRecords.shift();
                    ageRecords = ageRecords.map((r, i) => ({ d: r.d, n: String(i + 1).padStart(2, '0'), expr: r.expr, res: r.res }));
                    ageRecordSeq = ageRecords.length;
                    dbSaveAgeRecords(ageRecords, ageRecordSeq).catch(() => {});
                    saveData();
                    renderAgeRecord();
                } else if (b.type === 'printDoc') {
                    if (!Array.isArray(app.printHistory)) app.printHistory = [];
                    app.printHistory.push(b.data);
                    renderPrintHistory();
                }
                app.bin.splice(idx, 1);
                logActivity(`Restored bin item: ${b.title}`);
                saveData();
                renderApp();
                populateSettings();
                renderRecycleBin();
                showToast('Item restored', 'success');
            }
        }

        function delBin(binId) {
            app.bin = app.bin.filter(x => x.id !== binId);
            saveData();
            renderApp();
            populateSettings();
            renderRecycleBin();
            showToast('Item permanently deleted', 'info');
        }

        // ---- Recycle Bin (redesigned) ----
        let recycleSelected = new Set();
        let recycleSelectMode = false;

        function renderRecycleBin() {
            binCleanup();
            const container = D.getElementById('recycleList');
            const totalEl = D.getElementById('recycleTotalCount');
            if (!container) return;

            const search = D.getElementById('recycleSearchInput')?.value?.toLowerCase() || '';
            const filterType = D.getElementById('recycleFilterType')?.value || 'all';
            const sortBy = D.getElementById('recycleSortBy')?.value || 'newest';

            let items = app.bin || [];

            if (filterType !== 'all') items = items.filter(b => b.type === filterType);
            if (search) items = items.filter(b => (b.title || '').toLowerCase().includes(search));

            items.sort((a, b) => {
                switch (sortBy) {
                    case 'newest':
                        return (a.deletedAt || 0) - (b.deletedAt || 0);
                    case 'oldest':
                        return (b.deletedAt || 0) - (a.deletedAt || 0);
                    case 'name':
                        return (a.title || '').localeCompare(b.title || '');
                    case 'type':
                        return (a.type || '').localeCompare(b.type || '');
                    default:
                        return 0;
                }
            });

            if (totalEl) totalEl.textContent = String(items.length).padStart(2, '0');

            if (items.length === 0) {
                container.innerHTML = `
                            <div class="recycle-empty-state">
                                <span class="re-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/><path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/><path d="m13.378 9.633 4.096 1.098 1.097-4.096"/></svg></span>
                                <div class="re-title">${t('recycle.emptyTitle')}</div>
                                <div class="re-sub">${t('recycle.emptySub')}</div>
                            </div>`;
                return;
            }

            const visibleIds = items.map(b => b.id);
            recycleSelected.forEach(id => { if (!visibleIds.includes(id)) recycleSelected.delete(id); });

            const svgAttrs = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
            const typeIcons = {
                'module': `<svg ${svgAttrs}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
                'ledger': `<svg ${svgAttrs}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
                'note': `<svg ${svgAttrs}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
                'picture': `<svg ${svgAttrs}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`,
                'budget': `<svg ${svgAttrs}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
                'category': `<svg ${svgAttrs}><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42z"/><circle cx="7" cy="7" r="1.5"/></svg>`,
                'status': `<svg ${svgAttrs}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
                'gridRecord': `<svg ${svgAttrs}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
'archive': `<svg ${svgAttrs}><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>`,
                'expense': `<svg ${svgAttrs}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/></svg>`,
                'calcRecord': `<svg ${svgAttrs}><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="12" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg>`,
                'ageRecord': `<svg ${svgAttrs}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
                'printDoc': `<svg ${svgAttrs}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
                'expenseMonth': `<svg ${svgAttrs}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>`
            };
            const typeLabels = { 'module': 'Module', 'ledger': 'Ledger', 'note': 'Note', 'picture': 'Picture',
                'budget': 'Budget', 'category': 'Category', 'status': 'Status Set', 'gridRecord': 'Grid Record',
                'archive': 'Archive', 'expense': 'Expense', 'calcRecord': 'Calculator Record',
                'ageRecord': 'Age Record', 'printDoc': 'Print Document', 'expenseMonth': 'Month Record' };

            container.innerHTML = items.map((b, idx) => {
                const isSelected = recycleSelected.has(b.id);
                const typeLabel = typeLabels[b.type] || b.type || 'Item';
                const icon = typeIcons[b.type] || `<svg ${svgAttrs}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
                const deletedDate = b.deletedAt ? new Date(b.deletedAt).toLocaleString() : 'Unknown';

                return `<div class="rc-card">
                            <span class="rc-num">${String(idx+1).padStart(2,'0')}</span>
                            ${recycleSelectMode ? `<div class="rc-check"><input type="checkbox" name="recycle-check" ${isSelected ? 'checked' : ''} onchange="toggleRecycleSelect('${b.id}')" aria-label="Select item"></div>` : ''}
                            <div class="rc-icon">${icon}</div>
                            <div class="rc-info">
                                <div class="rc-name">${escapeHtml(b.title || 'Unnamed Item')}</div>
                                <div class="rc-meta">
                                    <span class="rc-type">${escapeHtml(typeLabel)}</span>
                                    <span>${escapeHtml(deletedDate)}</span>
                                </div>
                            </div>
                            <div class="rc-actions">
                                <button class="rc-btn rc-restore" onclick="restoreBin('${b.id}')" aria-label="Restore ${escapeHtml(b.title || 'item')}" title="Restore"><svg ${svgAttrs}><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg></button>
                                <button class="rc-btn rc-delete" onclick="delBin('${b.id}')" aria-label="Delete ${escapeHtml(b.title || 'item')}" title="Delete"><svg ${svgAttrs}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                            </div>
                        </div>`;
            }).join('');

            const allVisible = items.every(b => recycleSelected.has(b.id));
            const selectAllCheckbox = document.querySelector('#recycleHeader input[type="checkbox"]');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = recycleSelectMode && allVisible && items.length > 0;
                selectAllCheckbox.indeterminate = recycleSelectMode && !allVisible && items.some(b => recycleSelected.has(b.id)) && items.length > 0;
            }
        }

        function toggleRecycleSelect(id) {
            if (recycleSelected.has(id)) recycleSelected.delete(id);
            else recycleSelected.add(id);
            renderRecycleBin();
        }

        function toggleRecycleSelectAll() {
            recycleSelectMode = !recycleSelectMode;
            if (recycleSelectMode) {
                const items = app.bin || [];
                items.forEach(b => recycleSelected.add(b.id));
            } else {
                recycleSelected.clear();
            }
            renderRecycleBin();
        }

        function restoreSelectedRecycle() {
            const ids = Array.from(recycleSelected);
            if (ids.length === 0) return;
            ids.forEach(id => { const idx = app.bin.findIndex(b => b.id === id); if (idx > -1) restoreBin(id); });
            recycleSelected.clear();
            recycleSelectMode = false;
            renderRecycleBin();
            showToast(trf('{count} item(s) restored', { count: ids.length }), 'success');
        }

        function deleteSelectedRecycle() {
            const ids = Array.from(recycleSelected);
            if (ids.length === 0) return;
            customConfirm(trf('Permanently delete {count} selected item(s)?', { count: ids.length }), () => {
                ids.forEach(id => { app.bin = app.bin.filter(b => b.id !== id); });
                recycleSelected.clear();
                recycleSelectMode = false;
                saveData();
                renderApp();
                populateSettings();
                renderRecycleBin();
                showToast(trf('{count} item(s) permanently deleted', { count: ids.length }), 'info');
            });
        }

        function emptyRecycleBin() {
            if (app.bin.length === 0) return;
            customConfirm(trf('Permanently delete ALL {count} items in Recycle Bin?', { count: app.bin.length }), () => {
                app.bin = [];
                recycleSelected.clear();
                recycleSelectMode = false;
                saveData();
                renderApp();
                populateSettings();
                renderRecycleBin();
                showToast('Recycle Bin emptied', 'info');
            });
        }

        // ---- AETHER PRINT ENGINE v2.0 (engine lives in print.js) ----
        var _pdfRegistry = {};

        function _genDocId() {
            return 'aether_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
        }

        function _getDocUrl(docId, name) {
            return window.location.origin + window.location.pathname + '?download=' + docId + '&name=' + encodeURIComponent(name || 'Aether_Document');
        }

        function _storePdfBlob(docId, blob, filename) {
            _pdfRegistry[docId] = { blob: blob, filename: filename, ts: Date.now() };
            try {
                var req = indexedDB.open('AetherPDFs', 1);
                req.onupgradeneeded = function(e) { e.target.result.createObjectStore('pdfs'); };
                req.onsuccess = function(e) {
                    var dbx = e.target.result;
                    var tx = dbx.transaction('pdfs', 'readwrite');
                    tx.objectStore('pdfs').put({ blob: blob, filename: filename, ts: Date.now() }, docId);
                };
            } catch(e) {}
        }

        function _checkDocDownload() {
            var params = new URLSearchParams(window.location.search);
            var docId = params.get('download');
            var fname = params.get('name') || 'Aether_Document';
            if (!docId) return;
            function serve(blob, realName) {
                var url = URL.createObjectURL(blob);
                var a = D.createElement('a');
                a.href = url; a.download = realName || (fname + '.pdf');
                D.body.appendChild(a); a.click(); D.body.removeChild(a);
                setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
            if (_pdfRegistry[docId]) { serve(_pdfRegistry[docId].blob, _pdfRegistry[docId].filename); return; }
            try {
                var req2 = indexedDB.open('AetherPDFs', 1);
                req2.onsuccess = function(e) {
                    var dbx = e.target.result;
                    if (!dbx.objectStoreNames.contains('pdfs')) return;
                    var tx = dbx.transaction('pdfs', 'readonly');
                    var get = tx.objectStore('pdfs').get(docId);
                    get.onsuccess = function() {
                        if (get.result) { serve(get.result.blob, get.result.filename); }
                    };
                };
            } catch(e) {}
        }

        function _getPrintMode() {
            const modeSel = D.getElementById('printPageMode');
            return modeSel ? modeSel.value : 'export';
        }

        function populatePrintOptions() {
            const singleSel = D.getElementById('printSingleOption');
            if (!singleSel) return;
            let opts = '';
            let count = 0;
            (app.modules || []).forEach(m => {
                if (m.active && m.format === 'grid') {
                    opts += `<option value="grid:${m.id}">${escapeHtml(m.title)} - Grid Archive</option>`;
                    count++;
                } else if (m.active && m.format === 'ledger') {
                    opts += `<option value="fin:${m.id}">${escapeHtml(m.title)} - Finance Archive</option>`;
                    count++;
                }
            });
            singleSel.innerHTML = count ? opts : '<option value="">No modules found - create one in Console Engine</option>';
        }

        function execSinglePrint() {
            const sel = D.getElementById('printSingleOption');
            if (!sel || !sel.value || sel.value.indexOf(':') === -1) { showToast('Select a print option', 'error'); return; }
            _execPrintValue(sel.value, _getPrintMode());
        }

        function execGlobalSelectedPrint() {
            const sel = D.getElementById('printGlobalOption');
            if (!sel || !sel.value) { showToast('Select a print option', 'error'); return; }
            _execPrintValue(sel.value, _getPrintMode());
        }

        function execExpensePrint() {
            const srcSel = D.getElementById('printExpenseOption');
            const src = srcSel ? srcSel.value : 'finance';
            const mode = _getPrintMode();
            if (src === 'grid') execGridRecordsPrint(mode);
            else execTotalExpensePrint(mode);
        }

        function _execPrintValue(opt, mode) {
            if (!opt) { showToast('Select a print option', 'error'); return; }
            if (opt === 'global') execGlobalPrint(mode);
            else if (opt === 'global_grids') execGridPrint('all', mode);
            else if (opt === 'global_finance') execFinPrint('all', mode);
            else if (opt.startsWith('grid:')) execGridPrint(opt.slice(5), mode);
            else if (opt.startsWith('fin:')) execFinPrint(opt.slice(4), mode);
        }

        function execGlobalPrint(modeOverride) {
            const el = D.getElementById('sysPrtMode');
            const mode = modeOverride !== undefined ? modeOverride : (el ? el.value : 'export');
            const mStr = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');
            const docId = _genDocId();
            const content = buildGlobalArchiveHTML(mStr, docId);
            deliverPrint(content, 'Global_System_Archive_' + mStr + '.pdf', 'Global Archive', 'PDF', mStr, mode, docId);
        }

        function execGridPrint(modId, modeOverride) {
            let mode = modeOverride !== undefined ? modeOverride :
                (D.getElementById('gridPrtMode-' + modId) ? D.getElementById('gridPrtMode-' + modId).value : 'export');
            if (!mode) mode = 'export';
            if (mode === 'print_all') { mode = 'print'; modId = 'all'; }
            if (modId === 'all') mode = (mode === 'print') ? 'print' : 'print';
            const docId = _genDocId();
            const isAll = (modId === 'all');
            const mod = isAll ? null : app.modules.find(x => x.id === modId);
            const fname = (!isAll && mod) ? (mod.title + '_Archive.pdf') : 'Global_Grids_Archive.pdf';
            const rname = (!isAll && mod) ? (mod.title + ' Archive') : 'Global Grids Archive';
            const content = buildGridArchiveHTML(isAll ? 'all' : modId, docId);
            deliverPrint(content, fname, rname, 'PDF', isAll ? 'all_grids' : modId, mode === 'print_all' ? 'print' : mode, docId);
        }

        function execFinPrint(modId, modeOverride) {
            let mode = modeOverride !== undefined ? modeOverride :
                (D.getElementById('finPrtMode-' + modId) ? D.getElementById('finPrtMode-' + modId).value : 'export');
            if (!mode) mode = 'export';
            if (mode === 'total_expense') { execTotalExpensePrint(mode); return; }
            if (mode === 'print_all') { mode = 'print'; modId = 'all'; }
            const docId = _genDocId();
            const isAll = (modId === 'all');
            const mod = isAll ? null : app.modules.find(x => x.id === modId);
            const fname = (!isAll && mod) ? (mod.title + '_Archive.pdf') : 'Global_Finance_Archive.pdf';
            const rname = (!isAll && mod) ? (mod.title + ' Archive') : 'Global Finance Archive';
            const content = buildFinanceArchiveHTML(isAll ? 'all' : modId, docId);
            deliverPrint(content, fname, rname, 'PDF', isAll ? 'all_finance' : modId, mode, docId);
        }

        function execTotalExpensePrint(modeOverride, monthKey) {
            const mode = modeOverride !== undefined ? modeOverride : 'export';
            const docId = _genDocId();
            const content = buildTotalExpensePrintHTML(docId, monthKey);
            const monthName = monthKey ? getMonthNameFromKey(monthKey) : '';
            const fname = monthKey ? 'Total_Expenditure_' + monthName.replace(/\s+/g, '_').toUpperCase() + '.pdf' : 'Total_Expenditure_Report.pdf';
            const rname = monthKey ? 'Total Expenditure Report - ' + monthName : 'Total Expenditure Report';
            const ref = monthKey ? ('total_expense:' + monthKey) : 'total_expense';
            deliverPrint(content, fname, rname, 'Report', ref, mode, docId);
        }

        function execGridRecordsPrint(modeOverride, monthKey) {
            const mode = modeOverride !== undefined ? modeOverride : 'export';
            const docId = _genDocId();
            const content = buildGridRecordsPrintHTML(docId, monthKey);
            const monthName = monthKey ? getMonthNameFromKey(monthKey) : '';
            const fname = monthKey ? 'Grid_Records_' + monthName.replace(/\s+/g, '_').toUpperCase() + '.pdf' : 'Grid_Records_Report.pdf';
            const rname = monthKey ? 'Grid Records Report - ' + monthName : 'Grid Records Report';
            const ref = monthKey ? ('grid_records:' + monthKey) : 'grid_records';
            deliverPrint(content, fname, rname, 'Report', ref, mode, docId);
        }

        function addPrintHistory(name, type, ref, docId) {
            if (!app.printHistory) app.printHistory = [];
            app.printHistory.push({ id: generateId(), name: name, type: type, ref: ref, docId: docId || '', date: new Date().toISOString() });
            saveData();
            renderPrintHistory();
            scrollPrintHistoryToBottom();
        }

        function scrollPrintHistoryToBottom() {
            const section = D.getElementById('route-print');
            if (!section || !section.classList.contains('active')) return;
            const main = D.querySelector('main');
            if (main) {
                try { main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' }); }
                catch (e) { main.scrollTop = main.scrollHeight; }
            }
        }

        function openPrintHistoryDoc(id) {
            const h = (app.printHistory || []).find(x => x.id === id);
            if (!h) return;
            if (h.docId && _pdfRegistry[h.docId]) {
                try {
                    var url = URL.createObjectURL(_pdfRegistry[h.docId].blob);
                    window.open(url, '_blank');
                    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
                    return;
                } catch (e) {}
            }
            showToast(trf('Opening {name}', { name: h.name }), 'info');
        }

        function deletePrintHistory(id) {
            const entry = (app.printHistory || []).find(h => h.id === id);
            if (entry) binAdd('printDoc', entry, 'Print: ' + entry.name);
            app.printHistory = (app.printHistory || []).filter(h => h.id !== id);
            saveData();
            renderPrintHistory();
            showToast('Document removed from history', 'info');
        }

        function renderPrintHistory() {
            const container = D.getElementById('printHistoryList');
            if (!container) return;
            const history = app.printHistory || [];
            const countEl = D.getElementById('printDocCount');
            if (countEl) countEl.textContent = history.length;
            const pdfCount = history.filter(h => h.type === 'PDF').length;
            const pdfCountEl = D.getElementById('printPdfCount');
            if (pdfCountEl) pdfCountEl.textContent = pdfCount;
            const reportCount = history.filter(h => h.type === 'Report' || h.name.includes('Expense')).length;
            const reportCountEl = D.getElementById('printReportCount');
            if (reportCountEl) reportCountEl.textContent = reportCount;
            const histTotalEl = D.getElementById('printHistoryTotal');
            if (histTotalEl) histTotalEl.textContent = history.length;

            if (history.length === 0) {
                container.innerHTML = '<div class="empty-state" style="font-size:0.55rem;">' + t('print.noHistory') + '</div>';
                return;
            }
            container.innerHTML = history.map((h, idx) => `
                        <div class="print-doc-card">
                            <span class="ph-sn">${String(idx + 1).padStart(2, '0')}</span>
                            <div class="doc-info">
                                <div class="doc-name">${escapeHtml(h.name)}</div>
                                <div class="doc-meta">${escapeHtml(h.type)} - ${new Date(h.date).toLocaleString()}</div>
                            </div>
                            <div class="doc-actions">
                                <button class="doc-icon-btn doc-open" onclick="openPrintHistoryDoc('${h.id}')" aria-label="Open" title="Open">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                </button>
                                <button class="doc-icon-btn doc-delete" onclick="deletePrintHistory('${h.id}')" aria-label="Delete" title="Delete">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                </button>
                            </div>
                        </div>
                    `).join('');
        }

        // ---- Analytics ----
        function calcAnalytics() {
            let totExp = 0;
            let gross = Object.values(app.budgets).reduce((sum, val) => sum + (Number(val) || 0), 0) + Object.values(app.moduleBudgets || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
            gross = Math.min(gross, MAX_INPUT_VALUE);
            let pendingList = [];
            let progressHtml = '';

            app.modules.filter(m => m.active).forEach(mod => {
                let modTotal = 0;
                if (mod.format === 'grid') {
                    let counts = {};
                    mod.states.forEach(s => counts[s] = 0);
                    let dObj = new Date(mod.start || currentRenderDateStr);
                    dObj.setHours(0, 0, 0, 0);
                    let todayObj = new Date();
                    todayObj.setHours(0, 0, 0, 0);
                    const gridData = app.grids[mod.id] || Array(31).fill('Pending');
                    for (let i = 0; i < 31; i++) {
                        let st = gridData[i] || 'Pending';
                        counts[st] = (counts[st] || 0) + 1;
                    }
                    let statHtml = `<div class="grid-status-stats">`;
                    mod.states.forEach(s => {
                        let col = getStateColor(s);
                        let count = counts[s] || 0;
                        statHtml += `
                                    <div class="stat-item">
                                        <span class="stat-title" style="color:${col}; font-weight:900;">${escapeHtml(s)}</span>
                                        <span class="stat-value blur-target" style="color:${col};">${count}</span>
                                    </div>`;
                    });
                    statHtml += `</div>`;

                    if (mod.hasRate) {
                        let calcState = mod.states[1] || mod.states[0];
                        modTotal = (counts[calcState] || 0) * (mod.rate || 0);
                        modTotal = Math.min(modTotal, MAX_INPUT_VALUE);
                        statHtml +=
                    `<div class="flex-row" style="border-top:1.5px solid var(--border-light); padding-top:3px; margin-top:2px;"><span class="sub-lbl">Total Cost</span><b class="blur-target">${fmtMoney(modTotal)}</b></div>`;
                    }
                    let statEl = D.getElementById('stats-' + mod.id);
                    if (statEl) statEl.innerHTML = statHtml;

                    let diffTime = todayObj.getTime() - dObj.getTime();
                    let diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
                    if (diffDays >= 0 && diffDays < 31) {
                        let todayState = gridData[diffDays] || 'Pending';
                        if (todayState === 'Pending' && mod.notifEnabled !== false) pendingList.push({ id: mod.id,
                                title: mod.title });
                    }

                    let completedStates = ['Completed', 'Present', 'Approved', 'Verified', 'Paid', 'Delivered', 'Finished',
                        'Resolved', 'Confirmed', 'Closed', 'Active', 'Final', 'Available'
                    ];
                    let done = 0;
                    for (let i = 0; i < 31; i++) {
                        let st = gridData[i] || 'Pending';
                        if (completedStates.includes(st)) done++;
                    }
                    let pct = Math.round((done / 31) * 100);
                    let color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
                    progressHtml += `
                                <div class="progress-card">
                                    <div class="p-title">${escapeHtml(mod.title)}</div>
                                    <div class="p-value blur-target">${pct}%</div>
                                    <div class="p-bar-track"><div class="p-bar-fill" style="width:${pct}%; background:${color};"></div></div>
                                    <div class="p-sub">${done}/31 days</div>
                                </div>`;

                } else if (mod.format === 'ledger') {
                    let sums = {};
                    app.cats.forEach(c => sums[c] = 0);
                    let entries = app.ledgers[mod.id];
                    let dObj = new Date(mod.start || currentRenderDateStr);
                    if (!isNaN(dObj.getTime())) {
                        entries = entries.filter(l => { let d = new Date(l.d); return d.getMonth() === dObj
                                .getMonth() && d.getFullYear() === dObj.getFullYear(); });
                    }
                    entries.forEach(l => { sums[l.c] += entryTotal(l);
                        modTotal += entryTotal(l); });
                    modTotal = Math.min(modTotal, MAX_INPUT_VALUE);
                    let modBudget = app.moduleBudgets[mod.id] || 0;
                    modBudget = Math.min(modBudget, MAX_INPUT_VALUE);
                    let modRemaining = modBudget - modTotal;
                    let sumEl = D.getElementById('sum-' + mod.id);
                    if (sumEl) {
                        let catKeys = app.cats.filter(c => sums[c] > 0 || true);
                        let catDistributionHtml = `<div class="fin-status-grid">`;
                        catKeys.forEach(c => {
                            const cCol = getCategoryColor(c);
                            catDistributionHtml += `
                                        <div class="budget-item" style="border:none; background:transparent; padding:0.1rem 0.2rem;">
                                            <span class="sub-lbl" style="font-size:0.45rem; color:${cCol};">${escapeHtml(c)}</span>
                                <span class="blur-target" style="font-weight:900; font-size:0.75rem; color:${cCol};">${fmtMoney(sums[c])}</span>
                                        </div>`;
                        });
                        catDistributionHtml += `</div>`;

                        let totalsHtml = `
                                    <div class="fin-totals" style="border-top:1.5px solid var(--border-light); padding-top:0.2rem; margin-top:0.1rem;">
                                        <div class="total-item">
                                            <span class="sub-lbl" style="font-size:0.45rem; color:var(--accent);">Budget</span>
                                            <span class="total-val blur-target" style="font-size:0.75rem; color:var(--accent);">${fmtMoney(modBudget)}</span>
                                        </div>
                                        <div class="total-item">
                                            <span class="sub-lbl" style="font-size:0.45rem; color:var(--red);">Expense</span>
                                            <span class="total-val red blur-target" style="font-size:0.75rem;">${fmtMoney(modTotal)}</span>
                                        </div>
                                        <div class="total-item">
                                            <span class="sub-lbl" style="font-size:0.45rem; color:${modRemaining >= 0 ? 'var(--green)' : 'var(--red)'};">Remaining</span>
                                            <span class="total-val blur-target" style="font-size:0.75rem; color:${modRemaining >= 0 ? 'var(--green)' : 'var(--red)'};">${fmtMoney(modRemaining)}</span>
                                        </div>
                                    </div>`;

                        sumEl.innerHTML = catDistributionHtml + totalsHtml;
                    }

                    let pct = modBudget > 0 ? Math.round((modTotal / modBudget) * 100) : 0;
                    pct = Math.min(pct, 100);
                    let color = pct <= 80 ? 'var(--green)' : pct <= 95 ? 'var(--amber)' : 'var(--red)';
                    progressHtml += `
                                <div class="progress-card">
                                    <div class="p-title">${escapeHtml(mod.title)}</div>
                                    <div class="p-value blur-target">${pct}%</div>
                                    <div class="p-bar-track"><div class="p-bar-fill" style="width:${pct}%; background:${color};"></div></div>
                                    <div class="p-sub">${fmtMoney(modTotal)} / ${fmtMoney(modBudget)}</div>
                                </div>`;
                }
                totExp += modTotal;
                totExp = Math.min(totExp, MAX_INPUT_VALUE);
            });

            const globalTotalExpDisplay = D.getElementById('globalTotalExpDisplay');
            if (globalTotalExpDisplay) globalTotalExpDisplay.textContent = fmtMoney(totExp);

            const gmVert2 = D.getElementById('globalMetricsVertical');
            if (gmVert2) {
                gmVert2.querySelectorAll('.budget-item').forEach(item => {
                    const lbl = item.querySelector('.sub-lbl');
                    const inp = item.querySelector('input');
                    if (lbl) lbl.style.color = 'var(--color-black)';
                    if (inp) inp.style.color = 'var(--color-black)';
                });
            }

            let tDay = new Date();
            let isEoM = tDay.getDate() === new Date(tDay.getFullYear(), tDay.getMonth() + 1, 0).getDate();
            let mStr = tDay.getFullYear() + '-' + (tDay.getMonth() + 1).toString().padStart(2, '0');
            if (isEoM && (!app.archives || !app.archives[mStr])) {
                pendingList.push({ id: 'sys_archive', title: `Archive & Print ${mStr} Reports` });
            }

            const progEl = D.getElementById('progressContainer');
            if (progEl) {
                if (progressHtml.trim() === '') {
                    progEl.innerHTML =
                        '<span class="sub-lbl" style="text-align:center; font-size:0.55rem;">No active modules to track progress.</span>';
                } else {
                    progEl.innerHTML = `<div class="progress-grid">${progressHtml}</div>`;
                }
            }

            let grossEl2 = D.getElementById('dashGross');
            if (grossEl2) { grossEl2.textContent = fmtMoney(gross);
                grossEl2.style.color = 'var(--blue)'; }
            const grossLbl2 = D.getElementById('dashGrossLbl');
            if (grossLbl2) grossLbl2.style.color = 'var(--blue)';
            let outEl2 = D.getElementById('dashOutput');
            if (outEl2) { outEl2.textContent = fmtMoney(totExp);
                outEl2.style.color = 'var(--red)'; }
            const outLbl2 = D.getElementById('dashOutputLbl');
            if (outLbl2) outLbl2.style.color = 'var(--red)';
            let netVal = gross - totExp;
            netVal = Math.min(netVal, MAX_INPUT_VALUE);
            colorNetCash(netVal >= 0);
            let netEl = D.getElementById('dashNet');
            if (netEl) netEl.textContent = fmtMoney(netVal);

            // ---- CanvasJS pie chart (Expenditure Breakdown) ----
            let pieData = [];
            let totalEntriesCount = 0;
            let catTotals = {};
            app.modules.filter(m => m.active && m.format === 'ledger').forEach(mod => {
                let entries = app.ledgers[mod.id];
                let dObj = new Date(mod.start || currentRenderDateStr);
                if (!isNaN(dObj.getTime())) {
                    entries = entries.filter(l => { let d = new Date(l.d); return d.getMonth() === dObj
                            .getMonth() && d.getFullYear() === dObj.getFullYear(); });
                }
                entries.forEach(l => { catTotals[l.c] = (catTotals[l.c] || 0) + entryTotal(l);
                    totalEntriesCount++; });
            });
            Object.keys(catTotals).forEach((k, i) => {
                if (catTotals[k] > 0) {
                    pieData.push({ l: k, v: catTotals[k], col: stateColors[i % stateColors
                            .length] });
                }
            });

            const expFooter = D.getElementById('expChartFooter');

            if (typeof CanvasJS !== 'undefined') {
                const cs = getComputedStyle(D.body);
                const chartBg = (cs.getPropertyValue('--app-bg').trim() || '#FFFFFF');
                const chartText = (cs.getPropertyValue('--text-main').trim() || '#111111');

                if (!window.expChart) {
                    const chartSize = window.innerWidth <= 767 ? Math.min(160, window.innerWidth * 0.5) : 220;
                    window.expChart = new CanvasJS.Chart('expDoughnutCanvas', {
                        width: chartSize,
                        height: chartSize,
                        animationEnabled: false,
                        backgroundColor: chartBg,
                        title: { text: '', fontSize: 12 },
                        legend: { enabled: false },
                        data: [{
                            type: 'pie',
                            startAngle: 90,
                            radius: '80%',
                            innerRadius: 0,
                            showInLegend: false,
                            indexLabelFontColor: chartText,
                            indexLabel: '',
                            indexLabelFontSize: 9,
                            toolTipContent: '{name}: <strong>{y}</strong>',
                            dataPoints: []
                        }]
                    });
                    window.expChart.render();
                } else {
                    const chartSize = window.innerWidth <= 767 ? Math.min(160, window.innerWidth * 0.5) : 220;
                    window.expChart.options.width = chartSize;
                    window.expChart.options.height = chartSize;
                    window.expChart.options.backgroundColor = chartBg;
                    window.expChart.options.data[0].indexLabelFontColor = chartText;
                }

                const series = window.expChart.options.data[0];
                if (pieData.length === 0 || totExp === 0) {
                    series.indexLabel = '';
                    series.toolTipContent = '{name}: <strong>{y}</strong>';
                    series.dataPoints = [{ y: 1, name: t('chart.noData'), color: '#949BA8' }];
                } else {
                    let sorted = pieData.sort((a, b) => b.v - a.v);
                    series.indexLabel = '{percent}%';
                    series.indexLabelFontSize = 9;
                    series.toolTipContent = '{name}: <strong>' + getCurrencySymbol() + '{y}</strong> ({percent}%)';
                    series.dataPoints = sorted.map(d => ({ y: d.v, name: d.l.substring(0, 8), color: d.col, percent: Math.round((d.v / totExp) * 100) }));
                }
                window.expChart.render();
                let cred = D.getElementById('expDoughnutCanvas_canvasjs_credit') || D.querySelector('#expDoughnutCanvas .canvasjs-chart-credit, #expDoughnutCanvas [id*="canvasjs_credit"]');
                if (cred) cred.remove();
            }
            if (expFooter) {
                expFooter.innerHTML = `<span class="exp-footer-item">Entries: ${String(totalEntriesCount).padStart(2, '0')}</span><span class="exp-footer-item">Total: ${fmtMoney(totExp)}</span><span class="exp-footer-item">Total: 100%</span>`;
            }
            const expCatTotals = D.getElementById('expCatTotals');
            if (expCatTotals) {
                if (pieData.length === 0 || totExp === 0) {
                    expCatTotals.innerHTML = '';
                } else {
                    let sorted = pieData.slice().sort((a, b) => b.v - a.v);
                    expCatTotals.innerHTML = sorted.map(d =>
                        `<div class="exp-cat-item"><span class="exp-cat-swatch" style="background:${d.col};"></span><span class="exp-cat-name">${escapeHtml(d.l)}</span><span class="exp-cat-pct blur-target">${Math.round((d.v / totExp) * 100)}%</span><span class="exp-cat-val blur-target">${fmtMoney(d.v)}</span></div>`
                    ).join('');
                }
            }

            updateNotificationBell();
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
            populateNotificationsFull();
            renderAnalytics();
            updateGridAnalytics();
        }

        // ---- GridAnalytics: per-state metrics for grid modules ----
        // Mirrors the finance breakdown schema (category name, %, total value).
        function updateGridAnalytics() {
            const container = D.getElementById('gridAnalyticsContainer');
            if (!container) return;
            const gridMods = app.modules.filter(m => m.active && m.format === 'grid');
            if (gridMods.length === 0) {
                container.innerHTML =
                    '<span class="sub-lbl" style="text-align:center; font-size:0.55rem;">No grid modules active.</span>';
                return;
            }

            let html = `<div style="display:flex; flex-direction:column; gap:0.5rem;">`;
            gridMods.forEach(mod => {
                let counts = {};
                mod.states.forEach(s => counts[s] = 0);
                const gridData = app.grids[mod.id] || Array(31).fill('Pending');
                gridData.forEach(st => { counts[st] = (counts[st] || 0) + 1; });
                const totalDays = 31;
                let modTotal = 0;
                if (mod.hasRate) {
                    const calcState = mod.states[1] || mod.states[0];
                    modTotal = (counts[calcState] || 0) * (mod.rate || 0);
                    modTotal = Math.min(modTotal, MAX_INPUT_VALUE);
                }

                html += `<div style="border:1px solid var(--border-light); border-radius:var(--radius-md); background:var(--surface); padding:0.35rem 0.5rem;">
                            <div class="p-title" style="font-size:0.6rem; font-weight:var(--font-weight-black); color:var(--accent); text-align:center; margin-bottom:0.25rem;">${escapeHtml(mod.title)}</div>
                            <div style="display:flex; flex-direction:column; gap:0.15rem;">`;

                mod.states.forEach(s => {
                    const col = getStateColor(s);
                    const count = counts[s] || 0;
                    const pct = totalDays > 0 ? Math.round((count / totalDays) * 100) : 0;
                    html += `
                                <div class="budget-item" style="border:none; background:transparent; padding:0.1rem 0.2rem; display:flex; flex-direction:row; justify-content:space-between; align-items:center;">
                                    <span class="sub-lbl" style="font-size:0.55rem; color:${col};">${escapeHtml(s)}</span>
                                    <span class="blur-target" style="font-weight:900; font-size:0.75rem; color:${col};">${count} (${pct}%)</span>
                                </div>`;
                });

                html += `</div>
                            <div style="display:flex; flex-direction:column; gap:0.15rem; border-top:1.5px solid var(--border-light); padding-top:0.2rem; margin-top:0.1rem;">
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:0.1rem 0.2rem;">
                                    <span class="sub-lbl" style="font-size:0.55rem; color:var(--accent);">Total Days</span>
                                    <span class="total-val blur-target" style="font-size:0.75rem; color:var(--accent);">${totalDays}</span>
                                </div>`;

                if (mod.hasRate) {
                    html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:0.1rem 0.2rem;">
                                    <span class="sub-lbl" style="font-size:0.55rem; color:var(--blue);">Total Value</span>
                                    <span class="total-val blur-target" style="font-size:0.75rem; color:var(--blue);">${fmtMoney(modTotal)}</span>
                                </div>`;
                }

                html += `</div>
                        </div>`;
            });
            html += `</div>`;

            container.innerHTML = html;
        }

        // ---- CanvasJS explode-on-legend-click ----
        function explodePie(e) {
            if (typeof (e.dataSeries.dataPoints[e.dataPointIndex].exploded) === 'undefined' || !e.dataSeries.dataPoints[e.dataPointIndex].exploded) {
                e.dataSeries.dataPoints[e.dataPointIndex].exploded = true;
            } else {
                e.dataSeries.dataPoints[e.dataPointIndex].exploded = false;
            }
            e.chart.render();
        }

        // ---- Notification Bell ----
        function updateNotificationBell() {
            let pendingList = [];
            const todayObj = new Date();
            todayObj.setHours(0, 0, 0, 0);
            app.modules.filter(m => m.active && m.format === 'grid').forEach(mod => {
                if (mod.notifEnabled === undefined) mod.notifEnabled = true;
                const dObj = new Date(mod.start || currentRenderDateStr);
                dObj.setHours(0, 0, 0, 0);
                let diffTime = todayObj.getTime() - dObj.getTime();
                let diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
                if (diffDays >= 0 && diffDays < 31) {
                    let todayState = app.grids[mod.id] && app.grids[mod.id][diffDays] || 'Pending';
                    if (todayState === 'Pending' && mod.notifEnabled !== false) pendingList.push({ id: mod.id,
                            title: mod.title });
                }
            });

            let badge = D.getElementById('notifBadge');
            let nList = D.getElementById('notifList');
            if (!badge || !nList) return;
            if (pendingList && pendingList.length > 0) {
                badge.style.display = 'flex';
                badge.textContent = pendingList.length;
                nList.innerHTML = pendingList.map((p, i) =>
                    `<div style="padding:0.4rem 0.5rem; border-bottom:1px solid var(--border-light); cursor:pointer; font-size:0.65rem; font-family:var(--font-family); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; transition:background 0.15s; display:flex; align-items:center; gap:0.4rem; text-align:left;" onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background='transparent'" onclick="navToTask('${p.id}')"><span style="color:var(--text-muted); font-weight:var(--font-weight-black); min-width:1.2em; text-align:right;">${String(i + 1).padStart(2, '0')}</span><span style="color:var(--accent); font-weight:var(--font-weight-bold); overflow:hidden; text-overflow:ellipsis;">${escapeHtml(p.title)}</span></div>`
                ).join('');
                const currentIds = pendingList.map(p => p.id).sort().join('|');
                const prevIds = pendingListForNotification.map(p => p.id).sort().join('|');
                if (currentIds !== prevIds) {
                    pendingListForNotification = pendingList;
                    if (app.settings.notificationsEnabled && "Notification" in window && Notification
                        .permission === "granted") {
                        try { new Notification("AETHER", { body: `You have ${pendingList.length} pending tasks to complete!` }); } catch (
                        e) { /* ignore */ }
                    }
                }
            } else {
                badge.style.display = 'none';
                nList.innerHTML = '<div style="padding:0.3rem 0.5rem; font-size:0.6rem; color:var(--text-muted); font-family:var(--font-family); text-align:left;">No new tasks.</div>';
                pendingListForNotification = [];
            }
            populateNotificationsFull();
        }

        // ---- Populate Notifications Full ----
        function populateNotificationsFull() {
            const container = D.getElementById('notifFullContent');
            if (!container) return;
            const todayObj = new Date();
            todayObj.setHours(0, 0, 0, 0);
            let pending = [];
            app.modules.filter(m => m.active && m.format === 'grid').forEach(mod => {
                const dObj = new Date(mod.start || currentRenderDateStr);
                dObj.setHours(0, 0, 0, 0);
                let diffTime = todayObj.getTime() - dObj.getTime();
                let diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
                if (diffDays >= 0 && diffDays < 31) {
                    let todayState = app.grids[mod.id] && app.grids[mod.id][diffDays] || 'Pending';
                    if (todayState === 'Pending') pending.push(mod);
                }
            });
            const enabledCount = pending.filter(m => m.notifEnabled !== false).length;
            const countEl = D.getElementById('notifPendingCount');
            if (countEl) countEl.textContent = String(enabledCount).padStart(2, '0');
            if (pending.length === 0) {
                container.innerHTML =
                    '<div style="font-size:0.65rem; color:var(--text-muted); text-align:center; font-family:var(--font-family);">' + t('notify.allCaughtUp') + '</div>';
            } else {
                container.innerHTML = pending.map((mod, i) => {
                    const on = mod.notifEnabled !== false;
                    return `<div style="display:flex; gap:0.4rem; align-items:center; padding:0.2rem 0; font-size:0.65rem; color:var(--text-main); font-family:var(--font-family); ${on ? '' : 'opacity:0.45;'}">
                        <span style="min-width:1.4rem; font-weight:var(--font-weight-black); color:var(--text-main);">${String(i + 1).padStart(2, '0')}</span>
                        <span style="flex:1;">${escapeHtml(mod.title)}</span>
                        <div class="cl-toggle-switch" style="transform:scale(0.75); margin:0; line-height:0;">
                            <label class="cl-switch">
                                <input type="checkbox" name="task-notif" ${on ? 'checked' : ''} onchange="toggleTaskNotif('${escapeJsString(mod.id)}', this)" />
                                <span></span>
                            </label>
                        </div>
                    </div>`;
                }).join('');
            }
        }

        function toggleTaskNotif(modId, chk) {
            const mod = app.modules.find(m => m.id === modId);
            if (!mod) return;
            mod.notifEnabled = !!chk.checked;
            saveData();
            updateNotificationBell();
            populateNotificationsFull();
            showToast(trf(mod.notifEnabled ? 'Notification on for {name}' : 'Notification off for {name}', { name: mod.title }), 'info');
        }

        let currentArchiveKey = null;

        function viewArchive(key) {
            if (!app.archives[key]) return;
            currentArchiveKey = key;
            const titleEl = D.getElementById('archiveViewTitle');
            if (titleEl) titleEl.textContent = getArchiveDisplayName(key) + ' Archive';
            const contentEl = D.getElementById('archiveViewContent');
            if (contentEl) contentEl.innerHTML = app.archives[key];
            openModal('archiveViewModal');
        }

        function downloadArchive(key) {
            if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') return;
            if (!app.archives[key]) return;
            let displayName = getArchiveDisplayName(key);
            let docId = _genDocId();
            deliverPrint(app.archives[key], `Archive_${displayName.replace(/\s/g,'_')}.pdf`, displayName + ' Archive', 'PDF', key, 'export', docId);
            showToast('Archive downloaded', 'success');
        }

        function deleteArchive(key) {
            let displayName = getArchiveDisplayName(key);
            customConfirm(trf('Erase {name} archive?', { name: displayName }), () => {
                binAdd('archive', { key: key, html: app.archives[key] }, 'Archive: ' + displayName);
                delete app.archives[key];
                logActivity(`Erased archive ${key}`);
                saveData();
                renderApp();
                populateStorageFull();
                showToast('Archive deleted', 'info');
            });
        }

        function downloadArchiveTxt(key) {
            if (!app.archives[key]) return;
            let displayName = getArchiveDisplayName(key);
            let tmp = document.createElement('div');
            tmp.innerHTML = app.archives[key];
            let text = tmp.textContent || tmp.innerText || '';
            text = text.replace(/\n\s*\n/g, '\n\n').trim();
            let blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            let url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = 'Archive_' + displayName.replace(/\s/g, '_') + '.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Archive downloaded as text', 'success');
        }

        function getMergedStatusSets() {
            let merged = {};
            Object.keys(STANDARD_STATE_SETS).forEach(key => { merged[key] = STANDARD_STATE_SETS[key].states; });
            if (app.customStatusSets) {
                Object.keys(app.customStatusSets).forEach(key => {
                    if (app.statusSetEnabled[key] !== false) merged[key] = app.customStatusSets[key];
                });
            }
            return merged;
        }

        function addCustomStatusSet() {
            let name = D.getElementById('ceSetName').value.trim();
            let statesRaw = D.getElementById('ceSetStates').value.trim();
            if (!name || !statesRaw) return;
            if (name.length > 30) return;
            let states = statesRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
            if (states.length < 2) return;
            if (!app.customStatusSets) app.customStatusSets = {};
            const merged = getMergedStatusSets();
            if (merged[name] && app.customStatusSets[name] === undefined) return;
            app.customStatusSets[name] = states;
            app.statusSetEnabled[name] = true;
            logActivity(`Created custom status set: ${name}`);
            saveData();
            renderCustomStatusSetsS();
            const ceType = D.getElementById('ceConsoleType');
            if (ceType) {
                const merged2 = getMergedStatusSets();
                ceType.innerHTML = Object.keys(merged2).map(k =>
                    `<option value="${k}">${escapeHtml(k)}</option>`).join('');
                ceType.value = name;
                updateGridStates();
            }
            const allStatusGrps = D.querySelectorAll('[id^="s-type-"]');
            allStatusGrps.forEach(sel => {
                const modId = sel.id.replace('s-type-', '');
                const merged3 = getMergedStatusSets();
                sel.innerHTML = Object.keys(merged3).map(k =>
                    `<option value="${k}">${escapeHtml(k)}</option>`).join('');
                populateLedgerStates(modId);
            });
            D.getElementById('ceSetName').value = '';
            D.getElementById('ceSetStates').value = '';
            renderApp();
            showToast('Status set created', 'success');
        }

        function deleteCustomStatusSet(name) {
            if (!app.customStatusSets || !app.customStatusSets[name]) return;
            let inUse = false;
            app.modules.filter(m => m.format === 'grid').forEach(mod => {
                if (mod.states && mod.states.length > 0) {
                    const currentSet = app.customStatusSets[name];
                    if (currentSet && mod.states.length === currentSet.length &&
                        mod.states.every((v, i) => v === currentSet[i])) inUse = true;
                }
            });
            if (inUse) { showToast('Status set is in use by a grid', 'error'); return; }
            customConfirm(trf('Delete custom set "{name}"?', { name: name }), () => {
                binAdd('status', { name: name, states: app.customStatusSets[name], colors: app.customStatusSetColors?.[name] }, 'Status Set: ' + name);
                delete app.customStatusSets[name];
                delete app.customStatusSetColors?.[name];
                delete app.statusSetEnabled[name];
                logActivity(`Deleted custom status set: ${name}`);
                saveData();
                renderCustomStatusSetsS();
                const ceType = D.getElementById('ceConsoleType');
                if (ceType) {
                    const merged = getMergedStatusSets();
                    ceType.innerHTML = Object.keys(merged).map(k =>
                        `<option value="${k}">${escapeHtml(k)}</option>`).join('');
                    updateGridStates();
                }
                const allStatusGrps = D.querySelectorAll('[id^="s-type-"]');
                allStatusGrps.forEach(sel => {
                    const modId = sel.id.replace('s-type-', '');
                    const merged = getMergedStatusSets();
                    sel.innerHTML = Object.keys(merged).map(k =>
                        `<option value="${k}">${escapeHtml(k)}</option>`).join('');
                    populateLedgerStates(modId);
                });
                renderApp();
                showToast('Status set deleted', 'info');
            });
        }

        function renderCustomStatusSetsUI() {
            const container = D.getElementById('customStatusSetsList');
            if (!container) return;
            const sets = app.customStatusSets || {};
            const keys = Object.keys(sets);
            if (keys.length === 0) {
                container.innerHTML =
                    '<span style="font-size:0.55rem; color:var(--text-muted); font-family:var(--font-family);">' + t('ce.noSetsHint') + '</span>';
                return;
            }
            container.innerHTML = keys.map(name => {
                const isEnabled = app.statusSetEnabled[name] !== false;
                const states = sets[name] || [];
                const setColors = (app.customStatusSetColors && app.customStatusSetColors[name]) || [];
                const stateChips = states.map((s, si) => ({ s, si }))
                    .filter(x => setColors[x.si])
                    .map(x => `<span class="ce-state-chip" style="background:${setColors[x.si]};">${escapeHtml(x.s)}</span>`)
                    .join(' ');
                return `<span class="budget-chip" style="background:var(--app-bg); border-color:${isEnabled ? 'var(--accent)' : 'var(--border-gray)'}; opacity:${isEnabled ? 1 : 0.5};">
                            <b style="font-size:0.55rem;">${escapeHtml(name)}</b>
                            <span style="font-size:0.45rem; color:var(--text-muted);">${stateChips}</span>
                            <button class="budget-del-btn" onclick="deleteCustomStatusSet('${escapeJsString(name)}')" style="color:var(--red);" aria-label="Delete set"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                        </span>`;
            }).join('');
        }

        // ============================================================
        //  CONSOLE ENGINE (Full-page tabbed implementation)
        // ============================================================
        var ceCurrentView = 'grid';

        function ceInitConsoleEngine() {
            cePopulateGridTypes();
            ceRenderGridModules();
            ceRenderFinanceModules();
            ceRenderBudgetListB();
            ceRenderCategoryListC();
            ceRenderCustomStatusSetsS();
            var target = document.getElementById('ce-view-' + ceCurrentView);
            if (target) {
                document.querySelectorAll('#route-console .ce-view-section').forEach(function(v) { v.classList.remove(
                        'ce-active'); });
                target.classList.add('ce-active');
            }
            const titleMap = { 'grid': t('menu.grids'), 'finance': t('menu.finance'), 'budget': t('menu.budget'),
                'category': t('menu.category'), 'status': t('menu.status') };
            const titleEl = D.getElementById('cePageTitle');
            if (titleEl) titleEl.textContent = (titleMap[ceCurrentView] || t('menu.console')).toUpperCase();
            ceUpdateCounts();
            if (ceCurrentView === 'status') setTimeout(initStatusEditor, 100);
            enhanceSelects();
        }

        function ceNavigate(view) {
            ceCurrentView = view;
            document.querySelectorAll('#route-console .ce-view-section').forEach(function(v) { v.classList.remove(
                    'ce-active'); });
            var target = document.getElementById('ce-view-' + view);
            if (target) target.classList.add('ce-active');
            const titleMap = { 'grid': t('menu.grids'), 'finance': t('menu.finance'), 'budget': t('menu.budget'),
                'category': t('menu.category'), 'status': t('menu.status') };
            const titleEl = D.getElementById('cePageTitle');
            if (titleEl) titleEl.textContent = (titleMap[view] || t('menu.console')).toUpperCase();
            if (view === 'grid') { cePopulateGridTypes();
                ceRenderGridModules(); }
            if (view === 'finance') ceRenderFinanceModules();
            if (view === 'budget') ceRenderBudgetListB();
            if (view === 'category') ceRenderCategoryListC();
            if (view === 'status') { ceRenderCustomStatusSetsS();
                setTimeout(initStatusEditor, 100); }
            ceUpdateCounts();
            enhanceSelects();
        }

        // ---- CE: Grid ----
        function cePopulateGridTypes() {
            var ts = document.getElementById('ceConsoleTypeGrid');
            if (!ts) return;
            var merged = getMergedStatusSets();
            var cur = ts.value;
            ts.innerHTML = Object.keys(merged).map(function(k) {
                return '<option value="' + escapeHtml(k) + '">' + escapeHtml(k) + '</option>';
            }).join('');
            if (cur && merged[cur]) ts.value = cur;
            ceUpdateGridStatesGrid();
        }

        function ceUpdateGridStatesGrid() {
            var merged = getMergedStatusSets();
            var type = document.getElementById('ceConsoleTypeGrid').value;
            var opts = merged[type] || [];
            if (!opts.includes('Pending')) opts = ['Pending', ...opts];
            var disp = document.getElementById('ceStateSetDisplayGrid');
            if (disp) {
                if (opts.length === 0) { disp.innerHTML =
                    '<span style="font-size:0.5rem;color:var(--text-muted);">Select a type above</span>'; return; }
                var colorMap = {};
                var setColors = getSetStateColors(type);
                if (setColors) (merged[type] || []).forEach(function(s, i) { colorMap[s] = setColors[i] || getStateColor(s); });
                disp.innerHTML = opts.map(function(s) {
                    var col = colorMap[s] || getStateColor(s);
                    return '<span class="ce-state-chip" style="color:' + col + ';">' + escapeHtml(
                        s) + '</span>';
                }).join('');
            }
        }

        function ceGenConsoleGrid() {
            
            var n = document.getElementById('ceNameGrid').value.trim();
            if (!n) return;
            if (n.length > 30) return;
            n = n.charAt(0).toUpperCase() + n.slice(1);
            var id = n.toLowerCase().replace(/[^a-z]/g, '') + Date.now();
            var type = document.getElementById('ceConsoleTypeGrid').value;
            var merged = getMergedStatusSets();
            var st = merged[type] || ['Pending', 'Active', 'Closed'];
            if (!st.includes('Pending')) st = ['Pending', ...st];
            var m = {
                id: id,
                title: n,
                format: 'grid',
                active: true,
                start: localDateStr(),
                states: st,
                hasRate: false,
                rate: 0,
                notifEnabled: true
            };
            app.modules.push(m);
            app.grids[id] = Array(31).fill('Pending');
            app.grids[id + '_showSalary'] = false;
            app.grids[id + '_showRate'] = false;
            document.getElementById('ceNameGrid').value = '';
            saveData();
            ceRenderGridModules();
            ceUpdateCounts();
            renderApp();
            showToast(trf('Grid "{name}" created', { name: n }), 'success');
        }

        function ceRenderGridModules() {
            var container = document.getElementById('ceGridModuleList');
            if (!container) return;
            var gridModules = app.modules.filter(function(m) { return m.format === 'grid'; });
            var countEl = document.getElementById('ceGridCount');
            if (countEl) countEl.textContent = String(gridModules.length).padStart(2, '0');

            if (gridModules.length === 0) {
                container.innerHTML = '<div class="ce-empty-state">' + t('ce.noGrids') + '</div>';
                return;
            }

            container.innerHTML = gridModules.map(function(m, index) {
                var isPerm = (m.id === 'perm_academics');
                var activeClass = m.active ? '' : 'ce-inactive-item';
                var toggleHtml = isPerm ?
'<div class="cl-toggle-switch"><label class="cl-switch"><input type="checkbox" name="module-toggle" checked disabled><span></span></label></div>' :
                        '<div class="cl-toggle-switch"><label class="cl-switch"><input type="checkbox" name="module-toggle" ' + (m.active ? 'checked' : '') +
                    ' onchange="ceToggleGridModule(\'' + escapeJsString(m.id) + '\')"><span></span></label></div>';
                var delHtml = isPerm ? '' :
                    '<button class="ce-btn-del-sm" onclick="ceDelModule(\'' + escapeJsString(m.id) +
                    '\')"><svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>';
                var stateInfo = (m.states && m.states.length) ? ' - ' + m.states.join(', ') : '';
                var displayName = m.title || 'Unnamed Module';
                return '<div class="ce-list-item ' + activeClass + '">' +
                    '<div class="ce-item-left">' +
                    '<span class="ce-item-sn">' + String(index + 1).padStart(2, '0') + '</span>' +
                    '<span class="ce-item-label">' + escapeHtml(displayName) + '<span class="ce-item-sub">' +
                    stateInfo + '</span></span>' +
                    '</div>' +
                    '<div class="ce-item-actions">' +
                    toggleHtml +
                    delHtml +
                    '</div>' +
                    '</div>';
            }).join('');
        }

        function ceToggleGridModule(modId) {
            var mod = app.modules.find(function(m) { return m.id === modId; });
            if (!mod) return;
            if (mod.id === 'perm_academics') return;
            mod.active = !mod.active;
            saveData();
            ceRenderGridModules();
            ceUpdateCounts();
            renderApp();
            showToast(trf(mod.active ? 'Module "{name}" enabled' : 'Module "{name}" disabled', { name: mod.title }), 'info');
        }

        // ---- CE: Finance ----
        function ceGenConsoleFinance() {
            
            var n = document.getElementById('ceNameFinance').value.trim();
            if (!n) return;
            if (n.length > 30) return;
            n = n.charAt(0).toUpperCase() + n.slice(1);
            var id = n.toLowerCase().replace(/[^a-z]/g, '') + Date.now();
            var m = {
                id: id,
                title: n,
                format: 'ledger',
                active: true,
                start: localDateStr()
            };
            app.modules.push(m);
            app.ledgers[id] = [];
            app.ledgers[id + '_showBudget'] = true;
            document.getElementById('ceNameFinance').value = '';
            saveData();
            ceRenderFinanceModules();
            ceUpdateCounts();
            renderApp();
            showToast(trf('Ledger "{name}" created', { name: n }), 'success');
        }

        function ceRenderFinanceModules() {
            var container = document.getElementById('ceFinanceModuleList');
            if (!container) return;
            var finModules = app.modules.filter(function(m) { return m.format === 'ledger'; });
            var countEl = document.getElementById('ceFinanceCount');
            if (countEl) countEl.textContent = String(finModules.length).padStart(2, '0');

            if (finModules.length === 0) {
                container.innerHTML = '<div class="ce-empty-state">' + t('ce.noFinance') + '</div>';
                return;
            }

            container.innerHTML = finModules.map(function(m, index) {
                var isPerm = (m.id === 'perm_expenditure');
                var activeClass = m.active ? '' : 'ce-inactive-item';
                var toggleHtml = isPerm ?
'<div class="cl-toggle-switch"><label class="cl-switch"><input type="checkbox" name="module-toggle" checked disabled><span></span></label></div>' :
                        '<div class="cl-toggle-switch"><label class="cl-switch"><input type="checkbox" name="module-toggle" ' + (m.active ? 'checked' : '') +
                    ' onchange="ceToggleFinanceModule(\'' + escapeJsString(m.id) + '\')"><span></span></label></div>';
                var delHtml = isPerm ? '' :
                    '<button class="ce-btn-del-sm" onclick="ceDelModule(\'' + escapeJsString(m.id) +
                    '\')"><svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>';
                var displayName = m.title || 'Unnamed Module';
                return '<div class="ce-list-item ' + activeClass + '">' +
                    '<div class="ce-item-left">' +
                    '<span class="ce-item-sn">' + String(index + 1).padStart(2, '0') + '</span>' +
                    '<span class="ce-item-label">' + escapeHtml(displayName) +
                    '</span>' +
                    '</div>' +
                    '<div class="ce-item-actions">' +
                    toggleHtml +
                    delHtml +
                    '</div>' +
                    '</div>';
            }).join('');
        }

        function ceToggleFinanceModule(modId) {
            var mod = app.modules.find(function(m) { return m.id === modId; });
            if (!mod) return;
            if (mod.id === 'perm_expenditure') return;
            mod.active = !mod.active;
            saveData();
            ceRenderFinanceModules();
            ceUpdateCounts();
            renderApp();
            showToast(trf(mod.active ? 'Module "{name}" enabled' : 'Module "{name}" disabled', { name: mod.title }), 'info');
        }

        function ceDelModule(modId) {
            var idx = app.modules.findIndex(function(m) { return m.id === modId; });
            if (idx === -1) return;
            var m = app.modules[idx];
            if (m.id === 'perm_expenditure' || m.id === 'perm_academics') return;
            customConfirm(trf('Delete module "{name}"?', { name: m.title }), function() {
                if (m.format === 'grid' && app.grids) {
                    delete app.grids[m.id];
                    delete app.grids[m.id + '_stat'];
                    delete app.grids[m.id + '_salary'];
                    delete app.grids[m.id + '_showSalary'];
                    delete app.grids[m.id + '_showRate'];
                    if (Array.isArray(app.gridRecords)) app.gridRecords = app.gridRecords.filter(r => r.modId !== m.id);
                }
                if (m.format === 'ledger' && app.ledgers) {
                    delete app.ledgers[m.id];
                    delete app.ledgers[m.id + '_stat'];
                    delete app.ledgers[m.id + '_showBudget'];
                    delete app.moduleBudgets[m.id];
                }
                binAdd('module', m, 'Console: ' + m.title);
                app.modules.splice(idx, 1);
                saveData();
                ceRenderGridModules();
                ceRenderFinanceModules();
                ceUpdateCounts();
                renderApp();
                showToast('Module deleted', 'info');
            });
        }

        // ---- CE: Budget ----
        function ceGenBudgetB() {
            var n = document.getElementById('ceBudgetNameB').value.trim();
            if (!n) return;
            if (n.length > 30) return;
            n = n.charAt(0).toUpperCase() + n.slice(1);
            if (!app.budgetCats.includes(n)) {
                app.budgetCats.push(n);
                app.budgets[n] = '';
                app.budgetEnabled[n] = true;
                document.getElementById('ceBudgetNameB').value = '';
                saveData();
                ceRenderBudgetListB();
                ceUpdateCounts();
                renderApp();
                showToast(trf('Budget "{name}" created', { name: n }), 'success');
            }
        }

        function ceRenderBudgetListB() {
            renderBudgetList();
            var countEl = document.getElementById('ceBudgetCount');
            if (countEl) countEl.textContent = String(app.budgetCats.length).padStart(2, '0');
        }

        // ---- CE: Category ----
        function ceAddCatC() {
            var v = document.getElementById('ceCatInpC').value.trim();
            if (v) {
                v = v.charAt(0).toUpperCase() + v.slice(1);
                if (!app.cats.includes(v)) {
                    app.cats.push(v);
                    app.categoryEnabled[v] = true;
                    document.getElementById('ceCatInpC').value = '';
                    saveData();
                    ceRenderCategoryListC();
                    ceUpdateCounts();
                    renderApp();
                    showToast(trf('Category "{name}" added', { name: v }), 'success');
                }
            }
        }

        function ceRenderCategoryListC() {
            renderCategoryList();
            var countEl = document.getElementById('ceCategoryCount');
            if (countEl) countEl.textContent = String(app.cats.length).padStart(2, '0');
        }

        function ceDelCatC(cat) {
            var idx = app.cats.indexOf(cat);
            if (idx === -1) return;
            var inUse = false;
            app.modules.filter(function(m) { return m.format === 'ledger'; }).forEach(function(mod) {
                var entries = app.ledgers[mod.id] || [];
                if (entries.some(function(e) { return e.c === cat; })) inUse = true;
            });
            if (inUse) { showToast('Category is in use by a ledger', 'error'); return; }
            binAdd('category', cat, 'Category: ' + cat);
            app.cats.splice(idx, 1);
            delete app.categoryEnabled[cat];
            if (app.categoryColors) delete app.categoryColors[cat];
            saveData();
            ceRenderCategoryListC();
            ceUpdateCounts();
            renderApp();
            showToast('Category deleted', 'info');
        }

        function ceAddCustomStatusSetS() {
            const name = D.getElementById('ceSetNameS').value.trim();
            if (!name) return;
            if (name.length > 30) return;

            const rows = document.querySelectorAll('.ce-state-row');
            let states = [],
                colors = [];
            rows.forEach(row => {
                const nameInput = row.querySelector('.ce-state-name');
                const colorSelect = row.querySelector('.ce-color-select');
                const n = nameInput.value.trim();
                const c = (colorSelect.value || '').trim();
                if (!n) return;
                if (states.includes(n)) return;
                states.push(n);
                colors.push(c || '');
            });

            if (states.length < 2) {
                showToast('Add at least 2 state names', 'error');
                return;
            }

            const pool = ceShuffleUniquePalette();
            const used = colors.filter(Boolean);
            colors = colors.map(c => {
                if (c) return c;
                const pick = pool.find(p => !used.includes(p)) || pool[0];
                used.push(pick);
                return pick;
            });

            const merged = getMergedStatusSets();
            if (merged[name] && app.customStatusSets[name] === undefined) return;

            if (!app.customStatusSets) app.customStatusSets = {};
            app.customStatusSets[name] = states;
            app.statusSetEnabled[name] = true;
            if (!app.customStatusSetColors) app.customStatusSetColors = {};
            app.customStatusSetColors[name] = colors;

            D.getElementById('ceSetNameS').value = '';
            rows.forEach(row => {
                const inp = row.querySelector('.ce-state-name');
                if (inp) inp.value = '';
                const inp2 = row.querySelector('.ce-state-name');
                if (inp2) {
                    inp2.style.color = '';
                    inp2.style.borderColor = '';
                    inp2.style.caretColor = '';
                }
                const sel = row.querySelector('.ce-color-select');
                if (sel) sel.value = '';
                const preview = row.querySelector('.ce-color-preview');
                if (preview) preview.style.background = 'transparent';
            });
            ceUpdateStatusPreview();

            logActivity(`Created custom status set: ${name}`);
            saveData();
            renderCustomStatusSetsS();
            cePopulateGridTypes();
            ceUpdateCounts();
            renderApp();
                showToast(trf('Status set "{name}" created', { name: name }), 'success');
        }

        function ceDeleteCustomStatusSetS(name) {
            if (!app.customStatusSets || !app.customStatusSets[name]) return;
            let inUse = false;
            app.modules.filter(m => m.format === 'grid').forEach(mod => {
                if (mod.states && mod.states.length > 0) {
                    const cs = app.customStatusSets[name];
                    if (cs && mod.states.length === cs.length && mod.states.every((v, i) => v === cs[i])) inUse =
                        true;
                }
            });
            if (inUse) { showToast('Status set is in use by a grid', 'error'); return; }
            binAdd('status', { name: name, states: app.customStatusSets[name], colors: app.customStatusSetColors?.[name] }, 'Status Set: ' + name);
            delete app.customStatusSets[name];
            delete app.customStatusSetColors?.[name];
            delete app.statusSetEnabled[name];
            logActivity(`Deleted custom status set: ${name}`);
            saveData();
            renderCustomStatusSetsS();
            cePopulateGridTypes();
            ceUpdateCounts();
            renderApp();
            showToast('Status set deleted', 'info');
        }

        function ceUpdateCounts() {
            var gridCount = app.modules.filter(function(m) { return m.format === 'grid'; }).length;
            var finCount = app.modules.filter(function(m) { return m.format === 'ledger'; }).length;
            var budgetCount = (app.budgetCats || []).length;
            var catCount = (app.cats || []).length;
            var statusCount = Object.keys(app.customStatusSets || {}).length;

            var gEl = document.getElementById('ceGridCount');
            var fEl = document.getElementById('ceFinanceCount');
            var bEl = document.getElementById('ceBudgetCount');
            var cEl = document.getElementById('ceCategoryCount');
            var sEl = document.getElementById('ceStatusCount');

            if (gEl) gEl.textContent = String(gridCount).padStart(2, '0');
            if (fEl) fEl.textContent = String(finCount).padStart(2, '0');
            if (bEl) bEl.textContent = String(budgetCount).padStart(2, '0');
            if (cEl) cEl.textContent = String(catCount).padStart(2, '0');
            if (sEl) sEl.textContent = String(statusCount).padStart(2, '0');
        }

        // ---- Status functions ----
        function toggleStatusOpt(id) {
            let el = D.getElementById('statusGrp-' + id);
            if (!el) return;
            let currentDisplay = el.style.display;
            D.querySelectorAll('.inline-drop-grp').forEach(d => d.style.display = 'none');
            D.querySelectorAll('.inline-drop-btn-sm.drop-active').forEach(b => b.classList.remove('drop-active'));
            if (currentDisplay === 'none' || currentDisplay === '') {
                el.style.display = 'flex';
                const trigBtn = D.getElementById('statusBtn-' + id);
                if (trigBtn) trigBtn.classList.add('drop-active');
                let typeSelect = D.getElementById('s-type-' + id);
                if (typeSelect && typeSelect.options.length === 0) {
                    const merged = getMergedStatusSets();
                    typeSelect.innerHTML = Object.keys(merged).map(k =>
                        `<option value="${k}">${escapeHtml(k)}</option>`).join('');
                    populateLedgerStates(id);
                }
            }
        }

        function togglePrintOpt(id) {
            let el = D.getElementById('prtGrp-' + id);
            if (!el) return;
            let currentDisplay = el.style.display;
            D.querySelectorAll('.inline-drop-grp').forEach(d => d.style.display = 'none');
            D.querySelectorAll('.inline-drop-btn-sm.drop-active').forEach(b => b.classList.remove('drop-active'));
            if (currentDisplay === 'none' || currentDisplay === '') {
                el.style.display = 'flex';
                const trigBtn = D.getElementById('printBtn-' + id);
                if (trigBtn) trigBtn.classList.add('drop-active');
            }
        }

        function populateLedgerStates(modId) {
            let type = D.getElementById('s-type-' + modId).value;
            let stateSelect = D.getElementById('s-state-' + modId);
            const merged = getMergedStatusSets();
            let options = merged[type] || [];
            if (!options.includes('Pending')) options = ['Pending', ...options];
            stateSelect.innerHTML = options.map(opt =>
                `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`
            ).join('');
            tintStateSelect(stateSelect);
        }

        function applyGridModuleStatus(modId) {
            let el = D.getElementById('s-state-' + modId);
            if (el && el.value) {
                if (app.grids && app.grids[modId] !== undefined) {
                    app.grids[modId + '_stat'] = el.value;
                    logActivity(`Updated grid status for ${modId} to ${el.value}`);
                    saveData();
                    renderApp();
                    const statusDisplay = D.querySelector(`#tabcont-${modId} .gr2-status`);
                    if (statusDisplay) { statusDisplay.textContent = el.value; statusDisplay.style.color = statusColor(el.value); }
                    showToast('Status updated', 'success');
                }
            }
            const statusGrp = D.getElementById('statusGrp-' + modId);
            if (statusGrp) statusGrp.style.display = 'none';
            const stBtn = D.getElementById('statusBtn-' + modId);
            if (stBtn) stBtn.classList.remove('drop-active');
        }

        function applyLedgerModuleStatus(modId) {
            let el = D.getElementById('s-state-' + modId);
            if (el && el.value) {
                if (app.ledgers && app.ledgers[modId] !== undefined) {
                    app.ledgers[modId + '_stat'] = el.value;
                    logActivity(`Updated ledger status for ${modId} to ${el.value}`);
                    saveData();
                    renderApp();
                    const statusDisplay = D.querySelector(`#tabcont-${modId} .fr2-status`);
                    if (statusDisplay) { statusDisplay.textContent = el.value; statusDisplay.style.color = statusColor(el.value); }
                    showToast('Status updated', 'success');
                }
            }
            const statusGrp = D.getElementById('statusGrp-' + modId);
            if (statusGrp) statusGrp.style.display = 'none';
            const stBtn = D.getElementById('statusBtn-' + modId);
            if (stBtn) stBtn.classList.remove('drop-active');
        }

        function clearGridStatus(modId) {
            if (app.grids && app.grids[modId + '_stat'] !== undefined) {
                app.grids[modId + '_stat'] = '';
                logActivity(`Cleared status for grid console module: ${modId}`);
                saveData();
                renderApp();
                const statusDisplay = D.querySelector(`#tabcont-${modId} .gr2-status`);
                if (statusDisplay) { statusDisplay.textContent = 'No Status'; statusDisplay.style.color = statusColor(''); }
                showToast('Status removed', 'info');
            }
            const statusGrp = D.getElementById('statusGrp-' + modId);
            if (statusGrp) statusGrp.style.display = 'none';
            const stBtn = D.getElementById('statusBtn-' + modId);
            if (stBtn) stBtn.classList.remove('drop-active');
        }

        function clearLedgerStatus(modId) {
            if (app.ledgers && app.ledgers[modId + '_stat'] !== undefined) {
                app.ledgers[modId + '_stat'] = '';
                logActivity(`Cleared status for finance ledger module: ${modId}`);
                saveData();
                renderApp();
                const statusDisplay = D.querySelector(`#tabcont-${modId} .fr2-status`);
                if (statusDisplay) { statusDisplay.textContent = 'No Status'; statusDisplay.style.color = statusColor(''); }
                showToast('Status removed', 'info');
            }
            const statusGrp = D.getElementById('statusGrp-' + modId);
            if (statusGrp) statusGrp.style.display = 'none';
            const stBtn = D.getElementById('statusBtn-' + modId);
            if (stBtn) stBtn.classList.remove('drop-active');
        }

        function toggleGridSalaryVisibility(modId, checked) {
            if (!app.grids) app.grids = {};
            app.grids[modId + '_showSalary'] = checked;
            logActivity(`${checked ? 'Showed' : 'Hidden'} salary for grid module: ${modId}`);
            saveData();
            renderApp();
        }

        function toggleGridRateVisibility(modId, checked) {
            if (!app.grids) app.grids = {};
            app.grids[modId + '_showRate'] = checked;
            logActivity(`${checked ? 'Showed' : 'Hidden'} rate for grid module: ${modId}`);
            saveData();
            renderApp();
        }

        function updateGridSalary(modId, val) {
            let strVal = val.toString().replace(/,/g, '').trim();
            if (strVal === '') app.grids[modId + '_salary'] = '';
            else {
                const num = parseFloat(strVal);
                const clamped = Math.min(num, MAX_INPUT_VALUE);
                app.grids[modId + '_salary'] = isNaN(num) ? '' : clamped;
            }
            saveData();
            calcAnalytics();
        }

        function toggleFinanceBudgetVisibility(modId, checked) {
            if (!app.ledgers) app.ledgers = {};
            app.ledgers[modId + '_showBudget'] = checked;
            logActivity(`${checked ? 'Showed' : 'Hidden'} budget for finance module: ${modId}`);
            saveData();
            renderApp();
        }

        function updateFinanceBudget(modId, val) {
            let strVal = val.toString().replace(/,/g, '').trim();
            if (strVal === '') app.moduleBudgets[modId] = '';
            else {
                const num = parseFloat(strVal);
                const clamped = Math.min(num, MAX_INPUT_VALUE);
                app.moduleBudgets[modId] = isNaN(num) ? '' : clamped;
            }
            saveData();
            calcAnalytics();
        }

        // ============================================================
        //  ANALYTICS SECTION
        // ============================================================
        let analyticsFilter = 'today';
        let analyticsTab = 'overview';

        function setAnalyticsFilter(filter) {
            analyticsFilter = filter;
            const timeSel = document.getElementById('analyticsTimeSelect');
            if (timeSel) timeSel.value = filter;
            renderAnalytics();
        }

        function setAnalyticsTab(tab) {
            analyticsTab = tab;
            const modSel = document.getElementById('analyticsModuleSelect');
            if (modSel) modSel.value = tab;
            document.querySelectorAll('.analytics-tab-content').forEach(el => {
                el.style.display = el.id === 'analyticsTab-' + tab ? 'flex' : 'none';
            });
            renderAnalytics();
        }

        function getDateRangeFromFilter(filter) {
            const now = new Date();
            let start = new Date(now);
            let end = new Date(now);
            switch (filter) {
                case 'today':
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'yesterday':
                    start.setDate(start.getDate() - 1);
                    start.setHours(0, 0, 0, 0);
                    end.setDate(end.getDate() - 1);
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'week':
                    start.setDate(start.getDate() - start.getDay());
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'month':
                    start.setDate(1);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'last3':
                    start.setMonth(start.getMonth() - 3);
                    start.setDate(1);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'last6':
                    start.setMonth(start.getMonth() - 6);
                    start.setDate(1);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'year':
                    start.setMonth(0, 1);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'all':
                default:
                    start = new Date(2000, 0, 1);
                    end.setHours(23, 59, 59, 999);
                    break;
            }
            return { start, end };
        }

        function isInDateRange(dateStr, start, end) {
            const d = new Date(dateStr);
            return d >= start && d <= end;
        }

        function inPeriod(dateVal, start, end) {
            return dateVal ? isInDateRange(new Date(dateVal), start, end) : analyticsFilter === 'all';
        }

        function renderAnalytics() {
            const { start, end } = getDateRangeFromFilter(analyticsFilter);
            renderAnalyticsOverview(start, end);
            renderAnalyticsGrids(start, end);
            renderAnalyticsFinance(start, end);
            renderAnalyticsNotes(start, end);
            renderAnalyticsRecycle(start, end);
        }

        function renderAnalyticsOverview(start, end) {
            const cardsContainer = D.getElementById('analyticsOverviewCards');
            const chartsContainer = D.getElementById('analyticsOverviewCharts');
            if (!cardsContainer) return;

            const totalGrids = app.modules.filter(m => m.format === 'grid').length;
            const activeGrids = app.modules.filter(m => m.format === 'grid' && m.active).length;
            const totalLedgers = app.modules.filter(m => m.format === 'ledger').length;
            const activeLedgers = app.modules.filter(m => m.format === 'ledger' && m.active).length;
            let totalIncome = 0,
                totalExpense = 0;
            let totalBudget = 0;
            app.budgetCats.forEach(c => { totalBudget += parseCommaNum(app.budgets[c]); });
            totalBudget = Math.min(totalBudget, MAX_INPUT_VALUE);

            app.modules.filter(m => m.format === 'ledger' && m.active).forEach(mod => {
                let entries = app.ledgers[mod.id] || [];
                entries = entries.filter(l => isInDateRange(l.d, start, end));
                entries.forEach(l => { totalExpense += entryTotal(l); });
            });
            totalExpense = Math.min(totalExpense, MAX_INPUT_VALUE);
            totalIncome = totalBudget;

            const remaining = totalBudget - totalExpense;
            const notesCount = app.notes.filter(n => inPeriod(n.date || n.dateObj, start, end)).length;
            const deletedItems = (app.bin || []).filter(b => inPeriod(b.deletedAt, start, end)).length;
            const storageUsed = (app.pictures || []).length + (app.notes || []).length + Object.keys(app.archives || [])
                .length;

            cardsContainer.innerHTML = `
                        <div class="analytics-card ac-green"><div class="ac-value">${totalGrids}</div><div class="ac-label">Total Grids</div></div>
                        <div class="analytics-card ac-blue"><div class="ac-value">${activeGrids}</div><div class="ac-label">Active Grids</div></div>
                        <div class="analytics-card ac-purple"><div class="ac-value">${totalLedgers}</div><div class="ac-label">Total Ledgers</div></div>
                        <div class="analytics-card ac-blue"><div class="ac-value">${activeLedgers}</div><div class="ac-label">Active Ledgers</div></div>
                        <div class="analytics-card ac-green"><div class="ac-value">${fmtMoney(totalBudget)}</div><div class="ac-label">Total Budget</div></div>
                        <div class="analytics-card ac-red"><div class="ac-value">${fmtMoney(totalExpense)}</div><div class="ac-label">Total Expense</div></div>
                        <div class="analytics-card ${remaining >= 0 ? 'ac-green' : 'ac-red'}"><div class="ac-value">${fmtMoney(remaining)}</div><div class="ac-label">Remaining</div></div>
                        <div class="analytics-card ac-amber"><div class="ac-value">${notesCount}</div><div class="ac-label">Notes</div></div>
                        <div class="analytics-card ac-red"><div class="ac-value">${deletedItems}</div><div class="ac-label">Deleted Items</div></div>
                        <div class="analytics-card ac-purple"><div class="ac-value">${storageUsed}</div><div class="ac-label">Storage Items</div></div>
                        <div class="analytics-card ac-blue" style="grid-column:span 2;"><div class="ac-value">${Object.keys(app.activityLedger || {}).reduce((sum, k) => sum + (app.activityLedger[k] || []).length, 0)}</div><div class="ac-label">Total Activities</div></div>
                    `;

            chartsContainer.innerHTML = `
                        <div class="chart-box">
                            <div class="chart-title">Budget vs Expense</div>
                            <canvas id="overviewBudgetChart" height="80"></canvas>
                        </div>
                        <div class="chart-box">
                            <div class="chart-title">Module Distribution</div>
                            <canvas id="overviewModuleChart" height="80"></canvas>
                        </div>
                    `;

            setTimeout(() => {
                drawOverviewBudgetChart(totalBudget, totalExpense);
                drawOverviewModuleChart(totalGrids, activeGrids, totalLedgers, activeLedgers);
            }, 100);
        }

        function drawOverviewBudgetChart(budget, expense) {
            const canvas = D.getElementById('overviewBudgetChart');
            if (!canvas) return;
            canvas._apeArgs = [budget, expense];
            const w = canvas.parentElement.clientWidth || 300;
            const ctx = setupHiDPICanvas(canvas, w, 80);
            const maxVal = Math.max(budget, expense, 1);
            const barWidth = w * 0.35;
            const gap = w * 0.1;
            const x1 = w * 0.1;
            const x2 = w * 0.55;
            const h1 = (budget / maxVal) * 60;
            const h2 = (expense / maxVal) * 60;

            ctx.clearRect(0, 0, w, 80);
            ctx.fillStyle = '#34C759';
            ctx.fillRect(x1, 80 - h1 - 10, barWidth, h1);
            ctx.fillStyle = '#fff';
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Budget', x1 + barWidth / 2, 75);
            ctx.fillText(fmtMoney(budget), x1 + barWidth / 2, 80 - h1 - 12);
            ctx.fillStyle = '#FF453A';
            ctx.fillRect(x2, 80 - h2 - 10, barWidth, h2);
            ctx.fillStyle = '#fff';
            ctx.fillText('Expense', x2 + barWidth / 2, 75);
            ctx.fillText(fmtMoney(expense), x2 + barWidth / 2, 80 - h2 - 12);
        }

        function drawOverviewModuleChart(grids, activeGrids, ledgers, activeLedgers) {
            const canvas = D.getElementById('overviewModuleChart');
            if (!canvas) return;
            canvas._apeArgs = [grids, activeGrids, ledgers, activeLedgers];
            const w = canvas.parentElement.clientWidth || 300;
            const ctx = setupHiDPICanvas(canvas, w, 80);
            const values = [grids, activeGrids, ledgers, activeLedgers];
            const labels = ['Grids', 'Active', 'Ledgers', 'Active'];
            const colors = ['#34C759', '#30D158', '#0A84FF', '#64D2FF'];
            const maxVal = Math.max(...values, 1);
            const barWidth = Math.min((w - 40) / 4, 40);

            ctx.clearRect(0, 0, w, 80);
            values.forEach((v, i) => {
                const x = 10 + i * (barWidth + 4);
                const h = (v / maxVal) * 50;
                ctx.fillStyle = colors[i % colors.length];
                ctx.fillRect(x, 80 - h - 12, barWidth, h);
                ctx.fillStyle = '#fff';
                ctx.font = '7px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(labels[i], x + barWidth / 2, 75);
                ctx.fillText(v, x + barWidth / 2, 80 - h - 14);
            });
        }

        function renderAnalyticsGrids(start, end) {
            const cardsContainer = D.getElementById('analyticsGridCards');
            const chartsContainer = D.getElementById('analyticsGridCharts');
            if (!cardsContainer) return;

            const gridModules = app.modules.filter(m => m.format === 'grid' && inPeriod(m.start, start, end));
            let totalDays = 0,
                completedDays = 0;
            let bestGrid = '',
                bestPct = 0;
            let leastGrid = '',
                leastPct = 100;

            const completedStates = ['Completed', 'Present', 'Approved', 'Verified', 'Paid', 'Delivered', 'Finished',
                'Resolved', 'Confirmed', 'Closed', 'Active', 'Final', 'Available'
            ];

            gridModules.forEach(mod => {
                const gridData = app.grids[mod.id] || Array(31).fill('Pending');
                let done = 0;
                for (let i = 0; i < 31; i++) {
                    if (completedStates.includes(gridData[i] || 'Pending')) done++;
                }
                const pct = Math.round((done / 31) * 100);
                totalDays += 31;
                completedDays += done;
                if (pct > bestPct) { bestPct = pct;
                    bestGrid = mod.title; }
                if (pct < leastPct) { leastPct = pct;
                    leastGrid = mod.title; }
            });

            const completionRate = gridModules.length > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

            cardsContainer.innerHTML = `
                        <div class="analytics-card ac-green"><div class="ac-value">${gridModules.length}</div><div class="ac-label">Grids</div></div>
                        <div class="analytics-card ac-blue"><div class="ac-value">${completionRate}%</div><div class="ac-label">Completion Rate</div></div>
                        <div class="analytics-card ac-green"><div class="ac-value">${escapeHtml(bestGrid || 'N/A')}</div><div class="ac-label">Best Grid</div></div>
                        <div class="analytics-card ac-red"><div class="ac-value">${escapeHtml(leastGrid || 'N/A')}</div><div class="ac-label">Least Active</div></div>
                    `;

            chartsContainer.innerHTML = `
                        <div class="chart-box">
                            <div class="chart-title">Status Distribution</div>
                            <div id="gridStatusChartJS" class="ce-canvasjs-container"></div>
                        </div>
                        <div class="chart-box">
                            <div class="chart-title">Monthly Activity</div>
                            <div id="gridMonthlyChartJS" class="ce-canvasjs-container"></div>
                        </div>
                    `;

            setTimeout(() => { drawGridStatusChart(gridModules);
                drawGridMonthlyChart(gridModules); }, 100);
        }

        function drawGridStatusChart(gridModules) {
            if (typeof CanvasJS === 'undefined') return;
            if (window.gridStatusChart) { try { window.gridStatusChart.destroy(); } catch (e) { /* ignore */ } window.gridStatusChart = null; }
            const c = getChartThemeColors();

            const stateCounts = {};
            (gridModules || []).forEach(mod => {
                const data = app.grids[mod.id] || Array(31).fill('Pending');
                data.forEach(st => { stateCounts[st] = (stateCounts[st] || 0) + 1; });
            });

            const labels = Object.keys(stateCounts);
            const dataPoints = labels.map(l => ({ label: l, y: stateCounts[l], color: getStateColor(l) || '#8E8E93' }));

            window.gridStatusChart = new CanvasJS.Chart('gridStatusChartJS', {
                animationEnabled: true,
                backgroundColor: c.surface,
                title: { text: '', fontSize: 12, fontColor: c.text },
                axisY: {
                    title: 'Days',
                    titleFontColor: '#0A84FF',
                    lineColor: '#0A84FF',
                    labelFontColor: '#0A84FF',
                    tickColor: '#0A84FF',
                    titleFontSize: 10,
                    labelFontSize: 9
                },
                toolTip: { shared: true, fontColor: '#111111' },
                legend: { cursor: 'pointer', itemclick: toggleChartDataSeries, fontColor: c.text, fontSize: 10 },
                data: [{
                    type: 'column',
                    name: 'Days',
                    legendText: 'Days',
                    showInLegend: true,
                    dataPoints: dataPoints
                }]
            });
            window.gridStatusChart.render();
        }

        function drawGridMonthlyChart(gridModules) {
            if (typeof CanvasJS === 'undefined') return;
            if (window.gridMonthlyChart) { try { window.gridMonthlyChart.destroy(); } catch (e) { /* ignore */ } window.gridMonthlyChart = null; }
            const c = getChartThemeColors();
            const isDark = D.body.classList.contains('dark-theme');

            const months = [];
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push({ key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), label: String(d.getMonth() + 1).padStart(2, '0') });
            }

            const completedStates = ['Completed', 'Present', 'Approved', 'Verified', 'Paid', 'Delivered', 'Finished',
                'Resolved', 'Confirmed', 'Closed', 'Active', 'Final', 'Available'
            ];
            const values = months.map(monthObj => {
                let total = 0,
                    done = 0;
                (gridModules || []).forEach(mod => {
                    const dObj = new Date(mod.start || currentRenderDateStr);
                    const mKey = dObj.getFullYear() + '-' + String(dObj.getMonth() + 1).padStart(2,
                        '0');
                    if (mKey === monthObj.key) {
                        const gridData = app.grids[mod.id] || Array(31).fill('Pending');
                        gridData.forEach(st => { total++; if (completedStates.includes(st)) done++; });
                    }
                });
                return total > 0 ? Math.round((done / total) * 100) : 0;
            });

            const dataPoints = months.map((m, i) => ({ label: m.label, y: values[i] }));
            let hi = 0,
                lo = 0;
            values.forEach((v, i) => { if (v > values[hi]) hi = i; if (v < values[lo]) lo = i; });
            if (hi === lo) {
                dataPoints[hi].indexLabel = '\u2191 highest';
                dataPoints[hi].markerColor = 'red';
                dataPoints[hi].markerType = 'triangle';
            } else {
                dataPoints[hi].indexLabel = '\u2191 highest';
                dataPoints[hi].markerColor = 'red';
                dataPoints[hi].markerType = 'triangle';
                dataPoints[lo].indexLabel = '\u2193 lowest';
                dataPoints[lo].markerColor = 'DarkSlateGrey';
                dataPoints[lo].markerType = 'cross';
            }

            window.gridMonthlyChart = new CanvasJS.Chart('gridMonthlyChartJS', {
                animationEnabled: true,
                theme: isDark ? 'dark1' : 'light2',
                backgroundColor: c.surface,
                title: { text: '', fontSize: 12, fontColor: c.text },
                axisY: {
                    title: 'Completion %',
                    titleFontColor: '#34C759',
                    lineColor: '#34C759',
                    labelFontColor: '#34C759',
                    tickColor: '#34C759',
                    titleFontSize: 10,
                    labelFontSize: 9,
                    suffix: '%'
                },
                toolTip: { shared: true, fontColor: '#111111' },
                legend: { cursor: 'pointer', itemclick: toggleChartDataSeries, fontColor: c.text, fontSize: 10 },
                data: [{
                    type: 'line',
                    name: 'Completion',
                    legendText: 'Completion',
                    indexLabelFontSize: 9,
                    showInLegend: true,
                    dataPoints: dataPoints
                }]
            });
            window.gridMonthlyChart.render();
        }

        function renderAnalyticsFinance(start, end) {
            const cardsContainer = D.getElementById('analyticsFinanceCards');
            const chartsContainer = D.getElementById('analyticsFinanceCharts');
            if (!cardsContainer) return;

            let totalExpense = 0,
                highestExp = 0,
                lowestExp = Infinity;
            let highestItem = '',
                lowestItem = '';
            let categorySpending = {};

            app.modules.filter(m => m.format === 'ledger' && m.active).forEach(mod => {
                let entries = app.ledgers[mod.id] || [];
                entries = entries.filter(l => isInDateRange(l.d, start, end));
                entries.forEach(l => {
                    totalExpense += entryTotal(l);
                    if (l.a > highestExp) { highestExp = l.a;
                        highestItem = l.i; }
                    if (l.a < lowestExp) { lowestExp = l.a;
                        lowestItem = l.i; }
                    categorySpending[l.c] = (categorySpending[l.c] || 0) + l.a;
                });
            });
            totalExpense = Math.min(totalExpense, MAX_INPUT_VALUE);
            if (lowestExp === Infinity) { lowestExp = 0;
                lowestItem = 'N/A'; }

            let totalBudget = 0;
            app.budgetCats.forEach(c => { totalBudget += parseCommaNum(app.budgets[c]); });
            totalBudget = Math.min(totalBudget, MAX_INPUT_VALUE);
            const remaining = totalBudget - totalExpense;

            cardsContainer.innerHTML = `
                        <div class="analytics-card ac-red"><div class="ac-value">${fmtMoney(totalExpense)}</div><div class="ac-label">Total Expense</div></div>
                        <div class="analytics-card ac-green"><div class="ac-value">${fmtMoney(totalBudget)}</div><div class="ac-label">Total Budget</div></div>
                        <div class="analytics-card ${remaining >= 0 ? 'ac-green' : 'ac-red'}"><div class="ac-value">${fmtMoney(remaining)}</div><div class="ac-label">Remaining</div></div>
                        <div class="analytics-card ac-amber"><div class="ac-value">${escapeHtml(highestItem || 'N/A')}</div><div class="ac-label">Highest Expense</div></div>
                        <div class="analytics-card ac-green"><div class="ac-value">${escapeHtml(lowestItem || 'N/A')}</div><div class="ac-label">Lowest Expense</div></div>
                        <div class="analytics-card ac-blue"><div class="ac-value">${Object.keys(categorySpending).length}</div><div class="ac-label">Categories Used</div></div>
                    `;

            chartsContainer.innerHTML = `
                        <div class="chart-box">
                            <div class="chart-title">Category Spending</div>
                            <div id="financeCategoryChartJS" class="ce-canvasjs-container"></div>
                        </div>
                        <div class="chart-box">
                            <div class="chart-title">Budget Usage</div>
                            <div id="financeBudgetChartJS" class="ce-canvasjs-container"></div>
                        </div>
                    `;

            setTimeout(() => { drawFinanceCategoryChart(categorySpending);
                drawFinanceBudgetChart(totalBudget, totalExpense); }, 100);
        }

        function getChartThemeColors() {
            const cs = getComputedStyle(D.body);
            return {
                bg: (cs.getPropertyValue('--app-bg').trim() || '#FFFFFF'),
                surface: (cs.getPropertyValue('--surface').trim() || '#FFFFFF'),
                text: (cs.getPropertyValue('--text-main').trim() || '#111111')
            };
        }

        function toggleChartDataSeries(e) {
            if (typeof (e.dataSeries.visible) === 'undefined' || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            e.chart.render();
        }

        function drawFinanceCategoryChart(categorySpending) {
            if (typeof CanvasJS === 'undefined') return;
            if (window.financeCategoryChart) { try { window.financeCategoryChart.destroy(); } catch (e) { /* ignore */ } window.financeCategoryChart = null; }
            const c = getChartThemeColors();
            const colors = ['#34C759', '#0A84FF', '#FF9F0A', '#FF453A', '#AF52DE', '#FF2D55', '#32ADE6', '#FF9500'];
            const labels = Object.keys(categorySpending);
            const dataPoints = labels.map((l, i) => ({ label: l, y: categorySpending[l], color: colors[i % colors.length] }));

            window.financeCategoryChart = new CanvasJS.Chart('financeCategoryChartJS', {
                animationEnabled: true,
                backgroundColor: c.surface,
                title: { text: '', fontSize: 12, fontColor: c.text },
                axisY: {
                    title: 'Amount',
                    titleFontColor: '#AF52DE',
                    lineColor: '#AF52DE',
                    labelFontColor: '#AF52DE',
                    tickColor: '#AF52DE',
                    titleFontSize: 10,
                    labelFontSize: 9
                },
                toolTip: { shared: true, fontColor: '#111111' },
                legend: { cursor: 'pointer', itemclick: toggleChartDataSeries, fontColor: c.text, fontSize: 10 },
                data: [{
                    type: 'column',
                    name: 'Spending',
                    legendText: 'Spending',
                    showInLegend: true,
                    dataPoints: dataPoints
                }]
            });
            window.financeCategoryChart.render();
        }

        function drawFinanceBudgetChart(budget, expense) {
            if (typeof CanvasJS === 'undefined') return;
            if (window.financeBudgetChart) { try { window.financeBudgetChart.destroy(); } catch (e) { /* ignore */ } window.financeBudgetChart = null; }
            const c = getChartThemeColors();

            window.financeBudgetChart = new CanvasJS.Chart('financeBudgetChartJS', {
                animationEnabled: true,
                backgroundColor: c.surface,
                title: { text: '', fontSize: 12, fontColor: c.text },
                axisY: {
                    title: 'Budget',
                    titleFontColor: '#34C759',
                    lineColor: '#34C759',
                    labelFontColor: '#34C759',
                    tickColor: '#34C759',
                    titleFontSize: 10,
                    labelFontSize: 9
                },
                axisY2: {
                    title: 'Expense',
                    titleFontColor: '#FF453A',
                    lineColor: '#FF453A',
                    labelFontColor: '#FF453A',
                    tickColor: '#FF453A',
                    titleFontSize: 10,
                    labelFontSize: 9
                },
                toolTip: { shared: true, fontColor: '#111111' },
                legend: { cursor: 'pointer', itemclick: toggleChartDataSeries, fontColor: c.text, fontSize: 10 },
                data: [
                    { type: 'column', name: 'Budget', legendText: 'Budget', showInLegend: true, color: '#34C759', dataPoints: [{ label: 'Budget', y: budget }] },
                    { type: 'column', name: 'Expense', legendText: 'Expense', axisYType: 'secondary', showInLegend: true, color: '#FF453A', dataPoints: [{ label: 'Expense', y: expense }] }
                ]
            });
            window.financeBudgetChart.render();
        }

        function renderAnalyticsNotes(start, end) {
            const cardsContainer = D.getElementById('analyticsNotesCards');
            const chartsContainer = D.getElementById('analyticsNotesCharts');
            if (!cardsContainer) return;

            const periodNotes = app.notes.filter(n => inPeriod(n.date || n.dateObj, start, end));
            const totalNotes = periodNotes.length;
            let notesByDate = {};
            periodNotes.forEach(n => {
                const d = new Date(n.date || n.dateObj || Date.now());
                const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                notesByDate[key] = (notesByDate[key] || 0) + 1;
            });

            cardsContainer.innerHTML = `
                        <div class="analytics-card ac-green"><div class="ac-value">${totalNotes}</div><div class="ac-label">Total Notes</div></div>
                        <div class="analytics-card ac-blue"><div class="ac-value">${Object.keys(notesByDate).length}</div><div class="ac-label">Active Months</div></div>
                        <div class="analytics-card ac-purple"><div class="ac-value">${totalNotes > 0 ? Math.round(Object.values(notesByDate).reduce((a,b) => a+b, 0) / Math.max(Object.keys(notesByDate).length, 1)) : 0}</div><div class="ac-label">Avg Notes/Month</div></div>
                    `;

            chartsContainer.innerHTML = `
                        <div class="chart-box" style="grid-column:span 2;">
                            <div class="chart-title">Notes by Month</div>
                            <canvas id="notesMonthlyChart" height="80"></canvas>
                        </div>
                    `;

            setTimeout(() => { drawNotesMonthlyChart(notesByDate); }, 100);
        }

        function drawNotesMonthlyChart(notesByDate) {
            const canvas = D.getElementById('notesMonthlyChart');
            if (!canvas) return;
            canvas._apeArgs = [notesByDate];
            const w = canvas.parentElement.clientWidth || 300;
            const ctx = setupHiDPICanvas(canvas, w, 80);

            const labels = Object.keys(notesByDate).sort();
            const values = labels.map(k => notesByDate[k]);
            const maxVal = Math.max(...values, 1);
            const barWidth = Math.min((w - 20) / labels.length, 30);

            ctx.clearRect(0, 0, w, 80);
            labels.forEach((l, i) => {
                const x = 10 + i * (barWidth + 2);
                const h = (values[i] / maxVal) * 50;
                ctx.fillStyle = '#AF52DE';
                ctx.fillRect(x, 80 - h - 12, barWidth, h);
                ctx.fillStyle = '#fff';
                ctx.font = '6px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(l.substring(5), x + barWidth / 2, 75);
                ctx.fillText(values[i], x + barWidth / 2, 80 - h - 14);
            });
        }

        function renderAnalyticsRecycle(start, end) {
            const cardsContainer = D.getElementById('analyticsRecycleCards');
            const chartsContainer = D.getElementById('analyticsRecycleCharts');
            if (!cardsContainer) return;

            const binItems = (app.bin || []).filter(b => inPeriod(b.deletedAt, start, end));
            const typeCounts = {};
            binItems.forEach(b => { typeCounts[b.type] = (typeCounts[b.type] || 0) + 1; });
            const totalDeleted = binItems.length;

            cardsContainer.innerHTML = `
                        <div class="analytics-card ac-red"><div class="ac-value">${totalDeleted}</div><div class="ac-label">Total Deleted</div></div>
                        <div class="analytics-card ac-amber"><div class="ac-value">${Object.keys(typeCounts).length}</div><div class="ac-label">Item Types</div></div>
                        <div class="analytics-card ac-blue"><div class="ac-value">${typeCounts['module'] || 0}</div><div class="ac-label">Deleted Modules</div></div>
                        <div class="analytics-card ac-red"><div class="ac-value">${typeCounts['ledger'] || 0}</div><div class="ac-label">Deleted Ledgers</div></div>
                        <div class="analytics-card ac-purple"><div class="ac-value">${typeCounts['note'] || 0}</div><div class="ac-label">Deleted Notes</div></div>
                        <div class="analytics-card ac-green"><div class="ac-value">${typeCounts['picture'] || 0}</div><div class="ac-label">Deleted Pictures</div></div>
                    `;

            chartsContainer.innerHTML = `
                        <div class="chart-box" style="grid-column:span 2;">
                            <div class="chart-title">Deleted Items by Type</div>
                            <canvas id="recycleTypeChart" height="80"></canvas>
                        </div>
                    `;

            setTimeout(() => { drawRecycleTypeChart(typeCounts); }, 100);
        }

        function drawRecycleTypeChart(typeCounts) {
            const canvas = D.getElementById('recycleTypeChart');
            if (!canvas) return;
            canvas._apeArgs = [typeCounts];
            const w = canvas.parentElement.clientWidth || 300;
            const ctx = setupHiDPICanvas(canvas, w, 80);

            const labels = Object.keys(typeCounts);
            const values = Object.values(typeCounts);
            const colors = ['#FF453A', '#FF9F0A', '#AF52DE', '#0A84FF', '#34C759'];
            const maxVal = Math.max(...values, 1);
            const barWidth = Math.min((w - 20) / labels.length, 30);

            ctx.clearRect(0, 0, w, 80);
            labels.forEach((l, i) => {
                const x = 10 + i * (barWidth + 2);
                const h = (values[i] / maxVal) * 50;
                ctx.fillStyle = colors[i % colors.length];
                ctx.fillRect(x, 80 - h - 12, barWidth, h);
                ctx.fillStyle = '#fff';
                ctx.font = '6px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(l.substring(0, 8), x + barWidth / 2, 75);
                ctx.fillText(values[i], x + barWidth / 2, 80 - h - 14);
            });
        }

        // ============================================================
        //  POPULATE SETTINGS
        // ============================================================
        function populateSettings() {
            let cList = D.getElementById('ceCatList');
            if (cList) {
                cList.innerHTML = app.cats.map((c, i) =>
                    `<span style="background:var(--app-bg); border:1px solid var(--border-light); padding:3px 10px; border-radius:var(--radius-full); font-size:0.7rem; font-weight:var(--font-weight-bold); font-family:var(--font-family);">${escapeHtml(c)} <button style="cursor:pointer; color:var(--red); margin-left:3px; background:transparent; border:none; padding:0; font-size:0.7rem; font-family:var(--font-family);" onclick="delCat(${i})" aria-label="Delete category ${escapeHtml(c)}"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></span>`
                ).join('');
            }

            let mList = D.getElementById('moduleManagerList');
            if (mList) {
                if (app.modules.length === 0) {
                    mList.innerHTML =
                        `<span class="sub-lbl" style="text-align:center; display:block; padding: 0.7rem 0; font-size:0.65rem; font-family:var(--font-family);">${t('settings.noModules')}</span>`;
                } else {
                    mList.innerHTML = app.modules.map((m, i) => {
                        let isPerm = (m.id === 'perm_expenditure' || m.id === 'perm_academics');
                        let btns = isPerm ?
                            `<span class="sub-lbl" style="color:var(--green); font-size:0.5rem; font-family:var(--font-family);">${t('settings.permanent')}</span>` :
                            `<button class="tgl-btn" onclick="app.modules[${i}].active=!app.modules[${i}].active; saveData(); populateSettings(); buildDOM(); calcAnalytics();" style="transform:scale(0.7); margin:0 2px;" aria-label="Toggle module ${escapeHtml(m.title)}"></button><button class="btn-del" style="border-radius:50%; padding:0.15rem 0.3rem; font-size:0.5rem; font-family:var(--font-family);" onclick="delModule('${escapeJsString(m.id)}')" aria-label="Delete module ${escapeHtml(m.title)}"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
                        let contextLabel = m.format === 'ledger' ? t('menu.finance') : t('menu.grids');
                        return `
                            <div class="list-box" style="flex-direction:column; align-items:stretch; gap:3px; padding:0.3rem;">
                                <div class="flex-row">
                                    <span style="flex:1; font-weight:900; font-size:0.7rem; font-family:var(--font-family);">${escapeHtml(m.title)}</span>
                                    ${btns}
                                </div>
                                <div class="sub-lbl" style="font-size:0.5rem; color:var(--accent); text-align:left; font-weight:bold; font-family:var(--font-family);">${contextLabel}</div>
                            </div>`;
                    }).join('');
                }
            }

            let binL = D.getElementById('binList');
            if (binL) {
                binL.innerHTML = app.bin.length ? app.bin.slice(0, 10).map(b => `
                        <div class="list-box" style="border-color:var(--red); padding:0.2rem 0.4rem;">
                            <span style="font-size:0.55rem; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:var(--font-family);">${escapeHtml(b.title)}</span>
                            <div class="flex-row" style="gap:0.15rem;">
                                <button class="b-blue" style="padding:0.1rem 0.4rem; border-radius:var(--radius-full); font-size:0.5rem; font-family:var(--font-family);" onclick="restoreBin('${b.id}')" aria-label="Restore ${escapeHtml(b.title)}">${t('settings.restore')}</button>
                                <button class="b-red" style="padding:0.1rem 0.3rem; border-radius:var(--radius-full); font-size:0.5rem; font-family:var(--font-family);" onclick="delBin('${b.id}')" aria-label="Delete ${escapeHtml(b.title)}"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                            </div>
                        </div>
                    `).join('') : '<span class="sub-lbl" style="font-size:0.55rem; font-family:var(--font-family);">' + t('bin.empty') + '</span>';
            }

            let archL = D.getElementById('archiveList');
            if (archL) {
                let archKeys = Object.keys(app.archives || {});
                archL.innerHTML = archKeys.length ? archKeys.map(k => {
                    let displayName = getArchiveDisplayName(k);
                    return `
                        <div class="list-box" style="padding:0.2rem 0.4rem;">
                            <span style="font-size:0.6rem; font-family:var(--font-family);">${escapeHtml(displayName)} Archive</span>
                            <div class="flex-row" style="gap:0.15rem;">
                                <button class="b-blue" style="padding:0.1rem 0.4rem; border-radius:var(--radius-full); font-size:0.5rem; font-family:var(--font-family);" onclick="downloadArchive('${escapeJsString(k)}')" aria-label="Download archive ${escapeHtml(displayName)}"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
                                <button class="b-red" style="padding:0.1rem 0.3rem; border-radius:var(--radius-full); font-size:0.5rem; font-family:var(--font-family);" onclick="deleteArchive('${escapeJsString(k)}')" aria-label="Delete archive ${escapeHtml(displayName)}"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                            </div>
                        </div>`;
                }).join('') : '<span class="sub-lbl" style="font-size:0.55rem; font-family:var(--font-family);">' + t('storage.noEomArchives') + '</span>';
            }

            let noteL = D.getElementById('notesStorageList');
            if (noteL) {
                noteL.innerHTML = app.notes.length ? app.notes.slice(0, 10).map(n => `
                        <div class="list-box" style="padding:0.2rem 0.4rem;">
                            <span style="font-size:0.6rem; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:3px; font-family:var(--font-family);">${escapeHtml(n.title)}</span>
                            <div class="flex-row" style="gap:2px;">
                                <button class="b-blue" style="padding:0.1rem 0.3rem; border-radius:var(--radius-full); font-size:0.5rem; font-family:var(--font-family);" onclick="viewNote('${n.id}')" aria-label="View note ${escapeHtml(n.title)}">${t('settings.see')}</button>
                                <button class="b-blue" style="padding:0.1rem 0.3rem; border-radius:var(--radius-full); font-size:0.5rem; font-family:var(--font-family);" onclick="editNoteInline('${n.id}')" aria-label="Edit note ${escapeHtml(n.title)}">${t('settings.edit')}</button>
                                <button class="b-red" style="padding:0.1rem 0.3rem; border-radius:var(--radius-full); font-size:0.5rem; font-family:var(--font-family);" onclick="delNote('${n.id}')" aria-label="Delete note ${escapeHtml(n.title)}">${t('settings.delete')}</button>
                            </div>
                        </div>
                    `).join('') : '<span class="sub-lbl" style="font-size:0.55rem; font-family:var(--font-family);">' + t('storage.noNotesArchived') + '</span>';
            }

            let picL = D.getElementById('picList');
            if (picL) {
                if (!app.pictures || app.pictures.length === 0) {
                    picL.innerHTML = '<span class="sub-lbl" style="font-size:0.55rem; font-family:var(--font-family);">' + t('storage.noPictures') + '</span>';
                } else {
                    picL.innerHTML = app.pictures.slice(0, 10).map(p => `
                            <div class="list-box flex-row" style="padding:0.3rem; min-width: 100px; display:inline-flex; flex-direction:column; align-items:center;">
                                <img src="${p.data}" style="width: 36px; height: 36px; object-fit: cover; border-radius: var(--radius-sm); margin-bottom: 3px;" alt="Captured picture">
                                <div class="flex-row" style="width: 100%; justify-content: center; gap: 2px;">
                                    <button class="b-blue" style="padding:0.1rem 0.3rem; border-radius:var(--radius-full); font-size:0.5rem; font-family:var(--font-family);" onclick="viewPic('${p.id}')" aria-label="View picture">See</button>
                                    <button class="b-red" style="padding:0.1rem 0.25rem; border-radius:var(--radius-full); font-size:0.5rem; font-family:var(--font-family);" onclick="delPic('${p.id}')" aria-label="Delete picture"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                </div>
                            </div>
                        `).join('');
                }
            }

            renderBudgetListB();
            renderCustomStatusSetsS();
            renderCategoryListC();
            renderPrintHistory();
            initPasswordToggle();
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        }

        function populateStorageFull() {
            // EOM Archives
            const archContainer = D.getElementById('archiveListFull');
            if (archContainer) {
                let archKeys = Object.keys(app.archives || {});
                const totalEl = D.getElementById('eomTotal');
                if (totalEl) totalEl.textContent = String(archKeys.length).padStart(2, '0');
                archContainer.innerHTML = archKeys.length ? archKeys.map((k, i) => {
                    let displayName = getArchiveDisplayName(k);
                    return `
                        <div class="list-box" style="padding:0.35rem 0.5rem;">
                            <span class="arc-sn">${String(i + 1).padStart(2, '0')}</span>
                            <span style="font-size:0.75rem; font-family:var(--font-family); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(displayName)} Archive</span>
                            <div class="flex-row" style="gap:0.15rem;">
                                <button class="arc-btn arc-view" onclick="viewArchive('${escapeJsString(k)}')" aria-label="View archive ${escapeHtml(displayName)}" title="View archive">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                                </button>
                                <button class="arc-btn arc-view" onclick="downloadArchiveTxt('${escapeJsString(k)}')" aria-label="Download text ${escapeHtml(displayName)}" title="Download text">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                </button>
                                <button class="arc-btn arc-rename" onclick="renameArchive('${escapeJsString(k)}')" aria-label="Rename archive ${escapeHtml(displayName)}" title="Rename archive">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>
                                </button>
                                <button class="arc-btn arc-del" onclick="deleteArchive('${escapeJsString(k)}')" aria-label="Delete archive ${escapeHtml(displayName)}" title="Delete archive">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        </div>`;
                }).join('') : '<span class="empty-state" style="font-size:0.55rem;">' + t('empty.noArchives') + '</span>';
            }

            // Notes Storage
            const noteContainer = D.getElementById('notesStorageListFull');
            if (noteContainer) {
                const totalEl = D.getElementById('notesStorageTotal');
                if (totalEl) totalEl.textContent = String(app.notes.length).padStart(2, '0');
                noteContainer.innerHTML = app.notes.length ? app.notes.map((n, i) => `
                            <div class="list-box" style="padding:0.2rem 0.4rem;">
                                <span class="arc-sn">${String(i + 1).padStart(2, '0')}</span>
                                <span style="font-size:0.6rem; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:3px; font-family:var(--font-family);">${escapeHtml(n.title || 'Untitled Note')}</span>
                                <div class="flex-row" style="gap:0.15rem;">
                                    <button class="arc-btn arc-ghost arc-view" onclick="viewNote('${n.id}')" aria-label="View note ${escapeHtml(n.title || 'Untitled Note')}" title="View note">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                                    </button>
                                    <button class="arc-btn arc-ghost arc-edit" onclick="editNoteInline('${n.id}')" aria-label="Edit note ${escapeHtml(n.title || 'Untitled Note')}" title="Edit note">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button class="arc-btn arc-ghost arc-del" onclick="delNote('${n.id}')" aria-label="Delete note ${escapeHtml(n.title || 'Untitled Note')}" title="Delete note">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<span class="empty-state" style="font-size:0.55rem;">No notes.</span>';
            }

            // Pictures
            const picContainer = D.getElementById('picListFull');
            if (picContainer) {
                const totalEl = D.getElementById('picturesTotal');
                if (totalEl) totalEl.textContent = String((app.pictures || []).length).padStart(2, '0');
                if (!app.pictures || app.pictures.length === 0) {
                    picContainer.innerHTML = '<span class="empty-state" style="font-size:0.55rem;">' + t('empty.noPictures') + '</span>';
                } else {
                    picContainer.innerHTML = app.pictures.map((p, i) => `
                                <div class="list-box" style="padding:0.2rem 0.4rem;">
                                    <img class="pic-thumb" src="${p.data}" alt="Picture" loading="lazy">
                                    <span class="arc-sn">${String(i + 1).padStart(2, '0')}</span>
                                    <span style="font-size:0.6rem; color:var(--text-muted); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:3px; font-family:var(--font-family);">${escapeHtml(p.name || p.date || '')}</span>
                                    <div class="flex-row" style="gap:0.15rem; flex-shrink:0;">
                                        <button class="arc-btn arc-ghost arc-view" onclick="viewPic('${p.id}')" aria-label="View picture" title="View picture">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                                        </button>
                                        <button class="arc-btn arc-ghost arc-rename" onclick="renamePic('${p.id}')" aria-label="Rename picture" title="Rename picture">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>
                                        </button>
                                        <button class="arc-btn arc-ghost arc-edit" onclick="editPic('${p.id}')" aria-label="Edit picture" title="Edit picture">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </button>
                                        <button class="arc-btn arc-ghost arc-del" onclick="delPic('${p.id}')" aria-label="Delete picture" title="Delete picture">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                        </button>
                                    </div>
                                </div>
                            `).join('');
                }
            }
        }

        function delPic(id) {
            let idx = app.pictures.findIndex(p => p.id === id);
            if (idx > -1) {
                let pic = app.pictures[idx];
                binAdd('picture', pic, 'Picture: ' + pic.date);
                app.pictures.splice(idx, 1);
                logActivity(`Moved picture to Recycle Bin`);
                saveData();
                renderApp();
                populateSettings();
                populateStorageFull();
                showToast('Picture deleted', 'info');
            }
        }

        function delCat(i) {
            const cat = app.cats[i];
            let inUse = false;
            app.modules.filter(m => m.format === 'ledger').forEach(mod => {
                const entries = app.ledgers[mod.id] || [];
                if (entries.some(e => e.c === cat)) inUse = true;
            });
            if (inUse) { showToast('Category is in use by a ledger', 'error'); return; }
            binAdd('category', cat, 'Category: ' + cat);
            logActivity(`Deleted Category: ${cat}`);
            app.cats.splice(i, 1);
            delete app.categoryEnabled[cat];
            if (app.categoryColors) delete app.categoryColors[cat];
            populateSettings();
            saveData();
            renderApp();
            showToast('Category deleted', 'info');
        }

        function emptyBin() {
            customConfirm("Are you sure you want to permanently delete all items in the Recycle Bin?", () => {
                app.bin = [];
                recycleSelected.clear();
                populateSettings();
                renderRecycleBin();
                logActivity(`Emptied Recycle Bin`);
                saveData();
                renderApp();
                showToast('Recycle Bin emptied', 'info');
            });
        }

        function requestNotificationPermission() {
            if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !==
                "denied") Notification.requestPermission();
        }

        // ---- Calculator Full Page ----
        let calcExpr = '';
        let calcCur = '';
        let calcRecordSeq = 0;
        let calcRecords = [];
        // calcRecords & calcRecordSeq loaded from IndexedDB in initApp()

        function renderCalcRecord() {
            const el = D.getElementById('calcRecordCount');
            if (el) el.textContent = String(calcRecordSeq).padStart(2, '0');
            const listEl = D.getElementById('calcRecordList');
            if (listEl) {
                listEl.innerHTML = calcRecords.map((r, i) =>
                    '<div class="calc-record-entry"><span class="calc-record-num">' + r.n +
                    '</span><span class="calc-record-expr">' + r.expr + ' = ' + r.res +
                    '</span><span class="calc-record-date">' + (r.d || '-') +
                    '</span><button type="button" class="calc-record-del" onclick="deleteCalcRecord(' + i + ')" aria-label="Delete record"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div>'
                ).join('');
            }
        }

        function deleteCalcRecord(idx) {
            if (idx < 0 || idx >= calcRecords.length) return;
            binAdd('calcRecord', calcRecords[idx], 'Calculator: ' + calcRecords[idx].expr);
            calcRecords.splice(idx, 1);
            calcRecords = calcRecords.map((r, i) => ({ d: r.d, n: String(i + 1).padStart(2, '0'), expr: r.expr, res: r.res }));
            calcRecordSeq = calcRecords.length;
            try {
                dbSaveCalcRecords(calcRecords, calcRecordSeq);
            } catch (e) { /* ignore */ }
            saveData();
            renderCalcRecord();
        }
        renderCalcRecord();

        function renderCalcFull() {
            const opEl = D.getElementById('calcOperationFull');
            const tyEl = D.getElementById('calcTypedFull');
            if (!opEl || !tyEl) return;
            opEl.textContent = calcExpr.replace(/\*/g, ' x ').replace(/\//g, ' / ').replace(/-/g, ' - ').replace(/\+/g, ' + ').trim();
            tyEl.textContent = calcCur || '0';
        }

        function appendCalcFull(val) {
            if (/^[\d.]$/.test(val)) {
                if (val === '.') {
                    if (!calcCur.includes('.')) calcCur = calcCur === '' ? '0.' : calcCur + '.';
                } else {
                    calcCur = calcCur === '0' ? val : calcCur + val;
                }
            } else {
                const last = calcExpr.slice(-1);
                if (calcCur === '' || calcCur === '-') {
                    if (calcExpr === '' && val === '-') { calcCur = '-'; }
                    else if (calcExpr !== '' && '+-*/'.includes(last)) { calcExpr = calcExpr.slice(0, -1) + val; }
                } else {
                    calcExpr += calcCur + val;
                    calcCur = '';
                }
            }
            renderCalcFull();
        }

        function clearCalcFull() { calcExpr = ''; calcCur = ''; renderCalcFull(); }

        function backCalcFull() {
            if (calcCur !== '') calcCur = calcCur.slice(0, -1);
            else if (calcExpr !== '') calcExpr = calcExpr.slice(0, -1);
            renderCalcFull();
        }

        function signCalcFull() {
            if (calcCur !== '' && calcCur !== '-') {
                calcCur = calcCur.startsWith('-') ? calcCur.slice(1) : '-' + calcCur;
            }
            renderCalcFull();
        }

        function percentCalcFull() {
            if (calcCur === '' || calcCur === '-') {
                if (calcExpr !== '') {
                    try { const r = safeEvaluate(calcExpr); calcCur = String(r / 100); calcExpr = ''; }
                    catch (e) { calcCur = 'Error'; calcExpr = ''; }
                }
            } else {
                const v = parseFloat(calcCur);
                if (!isNaN(v)) calcCur = String(v / 100);
            }
            renderCalcFull();
        }

        function evalCalcFull() {
            let expr = (calcExpr + calcCur).replace(/[+\-*/]+$/, '');
            if (!expr) return;
            try {
                const result = safeEvaluate(expr);
                calcExpr = '';
                calcCur = String(result);
                calcRecordSeq += 1;
                calcRecords.push({
                    d: localDateStr(),
                    n: String(calcRecordSeq).padStart(2, '0'),
                    expr: expr.replace(/\*/g, ' x ').replace(/\//g, ' / ').replace(/-/g, ' - ').replace(/\+/g, ' + ').trim(),
                    res: calcCur
                });
                if (calcRecords.length > 30) calcRecords.pop();
                try {
                    dbSaveCalcRecords(calcRecords, calcRecordSeq);
                } catch (e) { /* ignore */ }
                renderCalcRecord();
            } catch (e) {
                calcExpr = '';
                calcCur = 'Error';
            }
            renderCalcFull();
        }

        function parseAgeDate(str) {
            const s = String(str || '').trim();
            if (!s) return null;
            let m;
            if ((m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/))) return new Date(+m[1], +m[2] - 1, +m[3]);
            if ((m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/))) return new Date(+m[3], +m[2] - 1, +m[1]);
            const d = new Date(s);
            return isNaN(d.getTime()) ? null : d;
        }

        function formatDMY(d) {
            return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
        }

        function formatAgeInput() {
            const inp = D.getElementById('ageDobInput');
            if (!inp) return;
            const digits = inp.value.replace(/\D/g, '').slice(0, 8);
            let out = '';
            if (digits.length > 0) out = digits.slice(0, 2);
            if (digits.length > 2) out += '/' + digits.slice(2, 4);
            if (digits.length > 4) out += '/' + digits.slice(4, 8);
            if (inp.value !== out) inp.value = out;
        }

        function agePickDate() {
            const picker = D.getElementById('ageDobPicker');
            const inp = D.getElementById('ageDobInput');
            if (!picker) return;
            if (inp && inp.value) {
                const d = parseAgeDate(inp.value);
                if (d) picker.value = localDateStr(d);
            }
            if (typeof picker.showPicker === 'function') { try { picker.showPicker(); return; } catch (e) { /* fall through */ } }
            try { picker.click(); } catch (e) { /* ignore */ }
        }

        function ageSyncFromPicker() {
            const picker = D.getElementById('ageDobPicker');
            const inp = D.getElementById('ageDobInput');
            if (picker && inp && picker.value) {
                const d = new Date(picker.value + 'T00:00:00');
                if (!isNaN(d.getTime())) inp.value = formatDMY(d);
            }
        }

        function buildAgeGrid(v) {
            const t1 = [t('age.years'), t('age.months'), t('age.days')];
            const t2 = [t('age.hours'), t('age.minutes'), t('age.seconds')];
            return '<div class="age-grid-row age-grid-titles"><span>' + t1[0] + '</span><span>' + t1[1] + '</span><span>' + t1[2] + '</span></div>' +
                '<div class="age-grid-row age-grid-values"><span>' + String(v[0]).padStart(2, '0') + '</span><span>' + String(v[1]).padStart(2, '0') + '</span><span>' + String(v[2]).padStart(2, '0') + '</span></div>' +
                '<div class="age-grid-row age-grid-titles"><span>' + t2[0] + '</span><span>' + t2[1] + '</span><span>' + t2[2] + '</span></div>' +
                '<div class="age-grid-row age-grid-values"><span>' + String(v[3]).padStart(2, '0') + '</span><span>' + String(v[4]).padStart(2, '0') + '</span><span>' + String(v[5]).padStart(2, '0') + '</span></div>';
        }

        function calcAge() {
            const input = D.getElementById('ageDobInput');
            const out = D.getElementById('ageResult');
            if (!input || !out) return;
            const val = input.value;
            if (!val) { out.textContent = t('age.enter'); return; }
            const dob = parseAgeDate(val);
            if (!dob) { out.textContent = t('age.invalid'); return; }
            const now = new Date();
            if (dob > now) { out.textContent = t('age.invalid'); return; }
            let years = now.getFullYear() - dob.getFullYear();
            let months = now.getMonth() - dob.getMonth();
            let days = now.getDate() - dob.getDate();
            if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
            if (months < 0) { years--; months += 12; }
            const base = new Date(dob);
            base.setFullYear(dob.getFullYear() + years);
            base.setMonth(dob.getMonth() + months);
            base.setDate(dob.getDate() + days);
            let diffMs = now.getTime() - base.getTime();
            if (diffMs < 0) diffMs = 0;
            let hours = Math.floor(diffMs / 3600000);
            let minutes = Math.floor((diffMs % 3600000) / 60000);
            let seconds = Math.floor((diffMs % 60000) / 1000);
            out.innerHTML = '<div class="age-grid">' + buildAgeGrid([years, months, days, hours, minutes, seconds]) + '</div>';
            ageRecordSeq += 1;
            ageRecords.push({
                d: localDateStr(),
                n: String(ageRecordSeq).padStart(2, '0'),
                expr: formatDMY(dob),
                res: [years, months, days, hours, minutes, seconds]
            });
            if (ageRecords.length > 30) ageRecords.shift();
            dbSaveAgeRecords(ageRecords, ageRecordSeq).catch(() => {});
            renderAgeRecord();
        }

        // ---- Age Record ----
        let ageRecordSeq = 0;
        let ageRecords = [];
        // ageRecords & ageRecordSeq loaded from IndexedDB in initApp()

        function renderAgeRecord() {
            const el = D.getElementById('ageRecordCount');
            if (el) el.textContent = String(ageRecordSeq).padStart(2, '0');
            const listEl = D.getElementById('ageRecordList');
            if (listEl) {
                listEl.innerHTML = ageRecords.map((r, i) => {
                    let bodyHtml;
                    if (Array.isArray(r.res)) {
                        bodyHtml = '<div class="age-grid">' + buildAgeGrid(r.res) + '</div>';
                    } else {
                        bodyHtml = '<span class="calc-record-expr">' + r.expr + ' = ' + r.res + '</span>';
                    }
                    return '<div class="calc-record-entry age-record-entry">' +
                        '<div class="age-record-top"><span class="calc-record-num">' + r.n + '</span>' +
                        '<span class="calc-record-expr">' + r.expr + '</span>' +
                        '<span class="calc-record-date">' + (r.d || '-') + '</span>' +
                        '<button type="button" class="calc-record-del" onclick="deleteAgeRecord(' + i + ')" aria-label="Delete record"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div>' +
                        bodyHtml +
                        '</div>';
                }).join('');
            }
        }

        function deleteAgeRecord(idx) {
            if (idx < 0 || idx >= ageRecords.length) return;
            binAdd('ageRecord', ageRecords[idx], 'Age: ' + ageRecords[idx].expr);
            ageRecords.splice(idx, 1);
            ageRecords = ageRecords.map((r, i) => ({ d: r.d, n: String(i + 1).padStart(2, '0'), expr: r.expr, res: r.res }));
            ageRecordSeq = ageRecords.length;
            dbSaveAgeRecords(ageRecords, ageRecordSeq).catch(() => {});
            renderAgeRecord();
        }
        renderAgeRecord();

        // ============================================================
        //  CONVERTOR - UNIT CONVERSION
        // ============================================================
        const convUnits = {
            length: {
                label: 'Length',
                units: [
                    { id: 'mm', label: 'Millimeter (mm)', factor: 0.001 },
                    { id: 'cm', label: 'Centimeter (cm)', factor: 0.01 },
                    { id: 'm', label: 'Meter (m)', factor: 1 },
                    { id: 'km', label: 'Kilometer (km)', factor: 1000 },
                    { id: 'in', label: 'Inch (in)', factor: 0.0254 },
                    { id: 'ft', label: 'Foot (ft)', factor: 0.3048 },
                    { id: 'yd', label: 'Yard (yd)', factor: 0.9144 },
                    { id: 'mi', label: 'Mile (mi)', factor: 1609.344 },
                    { id: 'nm', label: 'Nautical Mile', factor: 1852 },
                    { id: 'um', label: 'Micrometer (μm)', factor: 0.000001 }
                ]
            },
            weight: {
                label: 'Weight',
                units: [
                    { id: 'mg', label: 'Milligram (mg)', factor: 0.000001 },
                    { id: 'g', label: 'Gram (g)', factor: 0.001 },
                    { id: 'kg', label: 'Kilogram (kg)', factor: 1 },
                    { id: 't', label: 'Metric Ton (t)', factor: 1000 },
                    { id: 'oz', label: 'Ounce (oz)', factor: 0.0283495 },
                    { id: 'lb', label: 'Pound (lb)', factor: 0.453592 },
                    { id: 'st', label: 'Stone (st)', factor: 6.35029 },
                    { id: 'gr', label: 'Grain (gr)', factor: 0.0000648 }
                ]
            },
            volume: {
                label: 'Volume',
                units: [
                    { id: 'ml', label: 'Milliliter (mL)', factor: 0.001 },
                    { id: 'l', label: 'Liter (L)', factor: 1 },
                    { id: 'gal_us', label: 'Gallon (US)', factor: 3.78541 },
                    { id: 'gal_uk', label: 'Gallon (UK)', factor: 4.54609 },
                    { id: 'qt_us', label: 'Quart (US)', factor: 0.946353 },
                    { id: 'pt_us', label: 'Pint (US)', factor: 0.473176 },
                    { id: 'cup_us', label: 'Cup (US)', factor: 0.236588 },
                    { id: 'fl_oz', label: 'Fluid Ounce (US)', factor: 0.0295735 },
                    { id: 'tbsp', label: 'Tablespoon', factor: 0.0147868 },
                    { id: 'tsp', label: 'Teaspoon', factor: 0.00492892 },
                    { id: 'cm3', label: 'Cubic Centimeter', factor: 0.001 },
                    { id: 'm3', label: 'Cubic Meter', factor: 1000 }
                ]
            },
            temperature: {
                label: 'Temperature',
                units: [
                    { id: 'c', label: 'Celsius (°C)' },
                    { id: 'f', label: 'Fahrenheit (°F)' },
                    { id: 'k', label: 'Kelvin (K)' }
                ],
                custom: true
            },
            speed: {
                label: 'Speed',
                units: [
                    { id: 'ms', label: 'Meter/second (m/s)', factor: 1 },
                    { id: 'kmh', label: 'Kilometer/hour (km/h)', factor: 0.277778 },
                    { id: 'mph', label: 'Mile/hour (mph)', factor: 0.44704 },
                    { id: 'kn', label: 'Knot (kn)', factor: 0.514444 },
                    { id: 'fts', label: 'Foot/second (ft/s)', factor: 0.3048 },
                    { id: 'mach', label: 'Mach', factor: 340.29 }
                ]
            },
            area: {
                label: 'Area',
                units: [
                    { id: 'mm2', label: 'Square Millimeter', factor: 0.000001 },
                    { id: 'cm2', label: 'Square Centimeter', factor: 0.0001 },
                    { id: 'm2', label: 'Square Meter (m²)', factor: 1 },
                    { id: 'km2', label: 'Square Kilometer', factor: 1000000 },
                    { id: 'ha', label: 'Hectare (ha)', factor: 10000 },
                    { id: 'in2', label: 'Square Inch', factor: 0.00064516 },
                    { id: 'ft2', label: 'Square Foot', factor: 0.092903 },
                    { id: 'yd2', label: 'Square Yard', factor: 0.836127 },
                    { id: 'ac', label: 'Acre (ac)', factor: 4046.86 },
                    { id: 'mi2', label: 'Square Mile', factor: 2589988 }
                ]
            },
            time: {
                label: 'Time',
                units: [
                    { id: 'ns', label: 'Nanosecond (ns)', factor: 0.000000001 },
                    { id: 'us', label: 'Microsecond (μs)', factor: 0.000001 },
                    { id: 'ms_t', label: 'Millisecond (ms)', factor: 0.001 },
                    { id: 's', label: 'Second (s)', factor: 1 },
                    { id: 'min', label: 'Minute (min)', factor: 60 },
                    { id: 'hr', label: 'Hour (hr)', factor: 3600 },
                    { id: 'day', label: 'Day', factor: 86400 },
                    { id: 'wk', label: 'Week', factor: 604800 },
                    { id: 'mo', label: 'Month (30d)', factor: 2592000 },
                    { id: 'yr', label: 'Year (365d)', factor: 31536000 }
                ]
            },
            data: {
                label: 'Data',
                units: [
                    { id: 'bit', label: 'Bit', factor: 1 },
                    { id: 'byte', label: 'Byte (B)', factor: 8 },
                    { id: 'kb', label: 'Kilobyte (KB)', factor: 8192 },
                    { id: 'mb', label: 'Megabyte (MB)', factor: 8388608 },
                    { id: 'gb', label: 'Gigabyte (GB)', factor: 8589934592 },
                    { id: 'tb', label: 'Terabyte (TB)', factor: 8796093022208 },
                    { id: 'kbit', label: 'Kilobit (Kbit)', factor: 1024 },
                    { id: 'mbit', label: 'Megabit (Mbit)', factor: 1048576 },
                    { id: 'gbit', label: 'Gigabit (Gbit)', factor: 1073741824 }
                ]
            }
        };

        let convCategory = 'length';

        function setConvCategory(cat, btnEl) {
            convCategory = cat;
            document.querySelectorAll('.conv-tab').forEach(b => b.classList.remove('active'));
            if (btnEl) btnEl.classList.add('active');
            populateConvSelects();
            document.getElementById('convInputFrom').value = '';
            document.getElementById('convInputTo').value = '';
        }

        function populateConvSelects() {
            const selFrom = document.getElementById('convSelectFrom');
            const selTo = document.getElementById('convSelectTo');
            if (!selFrom || !selTo) return;
            const cat = convUnits[convCategory];
            if (!cat) return;
            const opts = cat.units.map((u, i) => '<option value="' + u.id + '">' + u.label + '</option>').join('');
            selFrom.innerHTML = opts;
            selTo.innerHTML = opts;
            if (cat.units.length > 1) selTo.selectedIndex = 1;
        }

        function convertTemperature(val, from, to) {
            let celsius;
            if (from === 'c') celsius = val;
            else if (from === 'f') celsius = (val - 32) * 5 / 9;
            else celsius = val - 273.15;
            if (to === 'c') return celsius;
            if (to === 'f') return celsius * 9 / 5 + 32;
            return celsius + 273.15;
        }

        function convertUnit() {
            const inputEl = document.getElementById('convInputFrom');
            const resultEl = document.getElementById('convInputTo');
            const selFrom = document.getElementById('convSelectFrom');
            const selTo = document.getElementById('convSelectTo');
            if (!inputEl || !resultEl || !selFrom || !selTo) return;
            const val = parseFloat(inputEl.value);
            if (isNaN(val) || inputEl.value.trim() === '') { resultEl.value = ''; return; }
            const fromId = selFrom.value;
            const toId = selTo.value;
            const cat = convUnits[convCategory];
            if (!cat) return;
            let result;
            if (cat.custom && convCategory === 'temperature') {
                result = convertTemperature(val, fromId, toId);
            } else {
                const fromUnit = cat.units.find(u => u.id === fromId);
                const toUnit = cat.units.find(u => u.id === toId);
                if (!fromUnit || !toUnit) return;
                const baseVal = val * fromUnit.factor;
                result = baseVal / toUnit.factor;
            }
            const absResult = Math.abs(result);
            let display;
            if (absResult === 0) display = '0';
            else if (absResult >= 1000000 || absResult < 0.001) display = result.toExponential(6);
            else if (Number.isInteger(result)) display = result.toString();
            else display = parseFloat(result.toPrecision(10)).toString();
            resultEl.value = display;
        }

        function swapConvUnits() {
            const selFrom = document.getElementById('convSelectFrom');
            const selTo = document.getElementById('convSelectTo');
            const inputEl = document.getElementById('convInputFrom');
            const resultEl = document.getElementById('convInputTo');
            if (!selFrom || !selTo) return;
            const tmp = selFrom.value;
            selFrom.value = selTo.value;
            selTo.value = tmp;
            if (resultEl.value) {
                inputEl.value = resultEl.value;
                convertUnit();
            }
        }

        function initConvertor() {
            populateConvSelects();
            document.getElementById('convInputFrom').value = '';
            document.getElementById('convInputTo').value = '';
        }

        // ============================================================
        //  NOTES 2.0 - MODERN EDITOR
        // ============================================================
        let currentNoteId = null;
        let noteDraft = { title: '', content: '' };
        let noteHistory = [];
        let noteHistoryIndex = -1;
        noteAutoSaveTimer = null;

        function initNoteEditor() {
            const editor = D.getElementById('noteContentEditor');
            if (!editor) return;
            // Load draft from IndexedDB (already loaded in initApp into noteDraft)
            try {
                if (noteDraft && (noteDraft.title || noteDraft.content)) {
                    D.getElementById('noteTitleInput').value = noteDraft.title || '';
                    editor.innerHTML = noteDraft.content || '';
                    updateNoteWordCount();
                }
            } catch (e) { /* ignore */ }
            // Focus on editor with cursor at the very start (placeholder position)
            setTimeout(() => {
                editor.focus();
                const range = document.createRange();
                range.setStart(editor, 0);
                range.collapse(true);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }, 100);
            // Save history
            saveNoteHistory();

            // Keep focus + selection inside the editor when any toolbar button is
            // pressed, so execCommands (incl. removeFormat) target the selection.
            document.querySelectorAll('.editor-toolbar-tab .toolbar-tab-btn').forEach(btn => {
                btn.addEventListener('mousedown', e => e.preventDefault());
            });
        }

        function execNoteCmd(cmd, value) {
            const editor = D.getElementById('noteContentEditor');
            if (!editor) return;
            editor.focus();
            try {
                if (cmd === 'undo') { document.execCommand('undo'); return; }
                if (cmd === 'redo') { document.execCommand('redo'); return; }
                if (cmd === 'fontName' || cmd === 'fontSize' || cmd === 'foreColor') {
                    document.execCommand(cmd, false, value);
                    return;
                }
                document.execCommand(cmd, false, null);
            } catch (e) { /* ignore */ }
            // Save history
            saveNoteHistory();
        }

        function setActiveTab(btn) {
            if (!btn || !btn.parentElement) return;
            btn.parentElement.querySelectorAll('.toolbar-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }

        function updateNoteWordCount() {
            const editor = D.getElementById('noteContentEditor');
            const wordEl = D.getElementById('noteWordCount');
            const charEl = D.getElementById('noteCharCount');
            if (!editor) return;
            const text = editor.textContent || '';
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            const chars = text.length;
            if (wordEl) wordEl.textContent = words + ' ' + t('notes.words');
            if (charEl) charEl.textContent = chars + ' ' + t('notes.chars');
        }

        function noteAutoSave() {
            if (noteAutoSaveTimer) clearTimeout(noteAutoSaveTimer);
            noteAutoSaveTimer = setTimeout(() => {
                const title = D.getElementById('noteTitleInput').value;
                const content = D.getElementById('noteContentEditor').innerHTML;
                noteDraft = { title, content };
                dbSaveNoteDraft(noteDraft).catch(() => {});
                const statusEl = D.getElementById('noteSaveStatus');
                if (statusEl) statusEl.textContent = t('notes.savedJust');
                saveNoteHistory();
                updateNoteWordCount();
                // Auto-save to notes storage if there's content
                if (content.trim() || title.trim()) {
                    autoSaveNoteToStorage(title, content);
                }
            }, 800);
        }

        function autoSaveNoteToStorage(title, content) {
            if (!title) return;
            if (!currentNoteId) currentNoteId = generateId();
            let existing = app.notes.find(n => n.id === currentNoteId);
            if (!existing) {
                existing = { id: currentNoteId, title: 'Untitled Note', content: '', date: new Date().toISOString(),
                    updated: new Date().toISOString() };
                app.notes.unshift(existing);
            }
            const plainText = content.replace(/<[^>]*>/g, '');
            if (title) existing.title = title;
            if (content) existing.content = content;
            existing.plainText = plainText || title || '';
            existing.updated = new Date().toISOString();
            if (!existing.date) existing.date = existing.updated;
            saveData();
        }

        function saveNoteFromEditor() {
            const title = D.getElementById('noteTitleInput').value.trim();
            if (!title) { showToast('Please enter a title to save', 'error'); return; }
            const content = D.getElementById('noteContentEditor').innerHTML;
            const plainText = content.replace(/<[^>]*>/g, '');
            if (!plainText) { showToast('Nothing to save', 'info'); return; }

            if (!currentNoteId) currentNoteId = generateId();
            let existing = app.notes.find(n => n.id === currentNoteId);
            if (existing) {
                existing.title = title;
                existing.content = content;
                existing.plainText = plainText || title;
                existing.updated = new Date().toISOString();
            } else {
                app.notes.unshift({ id: currentNoteId, title: title, content: content, plainText: plainText || title,
                    date: new Date().toISOString(), updated: new Date().toISOString() });
            }
            saveData();
            currentNoteId = null;
            showToast('Note saved successfully', 'success');
            const titleInput = D.getElementById('noteTitleInput');
            const contentEditor = D.getElementById('noteContentEditor');
            if (titleInput) titleInput.value = '';
            if (contentEditor) contentEditor.innerHTML = '';
            updateNoteWordCount();
            const statusEl = D.getElementById('noteSaveStatus');
            if (statusEl) statusEl.textContent = t('notes.savedStorage');
            dbClearNoteDraft().catch(() => {});
            renderApp();
            populateStorageFull();
        }

        function saveNoteHistory() {
            const editor = D.getElementById('noteContentEditor');
            if (!editor) return;
            const content = editor.innerHTML;
            const title = D.getElementById('noteTitleInput').value;
            const snapshot = { title, content, date: new Date().toISOString() };
            // Avoid duplicates
            if (noteHistory.length > 0 && noteHistory[noteHistoryIndex]?.content === content) return;
            if (noteHistoryIndex < noteHistory.length - 1) {
                noteHistory = noteHistory.slice(0, noteHistoryIndex + 1);
            }
            noteHistory.push(snapshot);
            if (noteHistory.length > 50) noteHistory.shift();
            noteHistoryIndex = noteHistory.length - 1;
        }

        function closeNoteEditor() {
            // Save draft before closing
            noteAutoSave();
            showToast('Note draft saved', 'info');
        }

        function viewNote(id) {
            const note = app.notes.find(n => n.id === id);
            if (!note) return;
            // Load into editor
            D.getElementById('noteTitleInput').value = note.title || '';
            D.getElementById('noteContentEditor').innerHTML = note.content || '';
            currentNoteId = id;
            updateNoteWordCount();
            navRoute('notes');
            showToast('Note loaded', 'info');
        }

        function editNoteInline(id) {
            viewNote(id);
        }

        function delNote(id) {
            if (id === 'draft_note') {
                app.notes = app.notes.filter(n => n.id !== 'draft_note');
                dbClearNoteDraft().catch(() => {});
                saveData();
                renderApp();
                populateStorageFull();
                showToast('Draft deleted', 'info');
                return;
            }
            const note = app.notes.find(n => n.id === id);
            if (!note) return;
            binAdd('note', note, 'Note: ' + note.title);
            app.notes = app.notes.filter(n => n.id !== id);
            logActivity(`Deleted note: ${note.title}`);
            saveData();
            renderApp();
            populateStorageFull();
            showToast('Note deleted', 'info');
        }

        // ---- Storage Navigation ----
        let currentStoragePage = 'eom';

        function storageNavigate(page) {
            currentStoragePage = page;
            const pages = ['eom', 'notes', 'pictures'];
            pages.forEach(p => {
                const el = D.getElementById('storage-' + p);
                if (el) el.classList.toggle('active', p === page);
            });
            const titles = { 'eom': t('storage.title'), 'notes': t('storage.notes'), 'pictures': t('menu.pictures') };
            const titleEl = D.getElementById('storagePageTitle');
            if (titleEl) titleEl.textContent = (titles[page] || 'STORAGE').toUpperCase();
            populateStorageFull();
        }

        // ---- Full Reset ----
        function updateResetState() {
            const chk = D.getElementById('resetUnderstandChk');
            const inp = D.getElementById('resetConfirmInput');
            const btn = D.getElementById('resetExecuteBtn');
            if (!btn) return;
            const matched = chk && chk.checked && inp && inp.value.trim().toLowerCase() === 'reset';
            btn.disabled = !matched;
            if (matched) {
                btn.style.background = 'var(--red)';
            } else {
                btn.style.background = '#007AFF';
            }
        }

        function execFullReset() {
            const chk = D.getElementById('resetUnderstandChk');
            const inp = D.getElementById('resetConfirmInput');
            if (!chk || !chk.checked || !inp || inp.value.trim().toLowerCase() !== 'reset') {
                showToast(t('reset.typeRequired'), 'info');
                return;
            }
            customConfirm(t('reset.confirmWipe'), async () => {
                await dbClearAll();
                location.reload();
            });
        }

        // ============================================================
        //  GLOBAL SEARCH ENGINE
        // ============================================================
        let _globalSearchActive = false;
        let _globalSearchQuery = '';

        function handleSearchInput(query) {
            const searchInput = D.getElementById('topSearchInput');
            const clearBtn = D.getElementById('searchClearBtn');
            _globalSearchQuery = query.trim();
            if (clearBtn) clearBtn.classList.toggle('visible', _globalSearchQuery.length > 0);
            if (!_globalSearchQuery) { clearSearch();
                closeSearchResults(); return; }
            _globalSearchActive = true;
            performGlobalSearch(_globalSearchQuery);
        }

        function performGlobalSearch(query) {
            const resultsContainer = D.getElementById('globalSearchResults');
            if (!resultsContainer) return;
            const q = query.toLowerCase().trim();
            if (!q) { closeSearchResults(); return; }
            const results = [];

            app.modules.forEach(mod => {
                if (mod.title.toLowerCase().includes(q) || mod.id.toLowerCase().includes(q)) {
                    const label = mod.format === 'grid' ? 'Grid' : 'Ledger';
                    results.push({ type: 'module', label, text: mod.title, modId: mod.id, format: mod.format,
                        match: mod.title });
                }
                if (mod.format === 'grid' && mod.states) {
                    mod.states.forEach(st => {
                        if (st.toLowerCase().includes(q)) {
                            results.push({ type: 'grid-state', label: 'Grid State',
                                text: `${mod.title} - ${st}`, modId: mod.id, format: 'grid',
                            match: st });
                        }
                    });
                    const gridData = app.grids[mod.id] || [];
                    gridData.forEach((st, idx) => {
                        if (st && st.toLowerCase().includes(q)) {
                            results.push({ type: 'grid-entry', label: 'Grid Entry',
                                text: `${mod.title} - Day ${idx+1} - ${st}`, modId: mod.id,
                                format: 'grid', match: st, day: idx + 1 });
                        }
                    });
                }
                if (mod.format === 'ledger') {
                    const entries = app.ledgers[mod.id] || [];
                    entries.forEach(entry => {
                        if (entry.i && entry.i.toLowerCase().includes(q)) {
                            results.push({ type: 'ledger-item', label: 'Expense Item',
                                text: `${mod.title} - ${entry.i} (${entry.c}) ${fmtMoney(entry.a)}`,
                                modId: mod.id, format: 'ledger', match: entry.i });
                        }
                        if (entry.c && entry.c.toLowerCase().includes(q)) {
                            results.push({ type: 'ledger-category', label: 'Category',
                                text: `${mod.title} - ${entry.i} - ${entry.c}`, modId: mod.id,
                                format: 'ledger', match: entry.c });
                        }
                    });
                }
                const statKey = mod.format === 'grid' ? app.grids[mod.id + '_stat'] : app.ledgers[mod.id + '_stat'];
                if (statKey && statKey.toLowerCase().includes(q)) {
                    results.push({ type: 'status', label: 'Status', text: `${mod.title} - Status: ${statKey}`,
                        modId: mod.id, format: mod.format, match: statKey });
                }
            });

            app.budgetCats.forEach(cat => {
                if (cat.toLowerCase().includes(q)) {
                    const val = app.budgets[cat] || '0';
                    results.push({ type: 'budget', label: 'Budget', text: `${cat}: ${fmtMoney(parseCommaNum(val))}`,
                        match: cat, isBudget: true });
                }
            });

            app.notes.forEach(note => {
                if (note.title.toLowerCase().includes(q)) {
                    results.push({ type: 'note', label: 'Note', text: note.title, match: note.title,
                        noteId: note.id });
                }
                if (note.content && note.content.toLowerCase().includes(q)) {
                    results.push({ type: 'note-content', label: 'Note Content',
                        text: `${note.title}: ${note.content.substring(0, 50)}...`,
                        match: note.content.substring(0, 50), noteId: note.id });
                }
            });

            if (results.length === 0) {
                resultsContainer.innerHTML =
                    `<div class="sr-empty">${t('search.noResults').replace('{q}', escapeHtml(q))}</div>`;
                resultsContainer.classList.add('open');
                return;
            }

            const displayResults = results.slice(0, 25);
            let html = '';
            displayResults.forEach(r => {
                const escapedText = escapeHtml(r.text);
                const highlightedText = escapedText.replace(
                    new RegExp(escapeHtml(q), 'gi'),
                    match => `<mark>${match}</mark>`
                );
                html += `
                            <div class="sr-item" onclick="navigateSearchResult('${escapeJsString(r.type)}', '${escapeJsString(r.modId || '')}', '${escapeJsString(r.noteId || '')}', '${escapeJsString(r.format || '')}')">
                                <span class="sr-badge">${escapeHtml(r.label)}</span>
                                <span class="sr-text">${highlightedText}</span>
                            </div>`;
            });

            if (results.length > 25) {
                html += `<div class="sr-empty" style="font-size:0.55rem;">${t('search.more').replace('{n}', results.length - 25)}</div>`;
            }

            resultsContainer.innerHTML = html;
            resultsContainer.classList.add('open');
        }

        function navigateSearchResult(type, modId, noteId, format) {
            closeSearchResults();
            if (type === 'note' || type === 'note-content') {
                if (noteId) {
                    navRoute('notes');
                    setTimeout(() => { viewNote(noteId); }, 300);
                }
                return;
            }
            if (type === 'budget') {
                navRoute('home');
                setTimeout(() => {
                    const budgetInput = document.querySelector('#globalMetricsVertical input[type="text"]');
                    if (budgetInput) { budgetInput.focus();
                        budgetInput.select(); }
                }, 300);
                return;
            }
            if (modId) {
                const mod = app.modules.find(m => m.id === modId);
                if (!mod) return;
                if (mod.format === 'grid') {
                    navRoute('grids');
                    setTimeout(() => {
                        switchSubTab('gridContainers', modId, 'grid-tab-btn', 'grid-cont');
                        const searchQuery = _globalSearchQuery;
                        if (searchQuery) {
                            const cells = document.querySelectorAll(`#tabcont-${modId} .day-cell`);
                            cells.forEach(cell => {
                                const txt = cell.textContent.toLowerCase();
                                if (txt.includes(searchQuery.toLowerCase())) {
                                    cell.style.setProperty('border', '2px solid var(--accent)');
                                    cell.style.setProperty('box-shadow', '0 0 16px var(--accent-light)');
                                    setTimeout(() => { cell.style.removeProperty('border');
                                        cell.style.removeProperty('box-shadow'); }, 3000);
                                }
                            });
                        }
                    }, 300);
                } else {
                    navRoute('finance');
                    setTimeout(() => { switchSubTab('financeContainers', modId, 'fin-tab-btn', 'fin-cont'); },
                    300);
                }
            }
            clearSearch();
        }

        function closeSearchResults() {
            const container = D.getElementById('globalSearchResults');
            if (container) { container.classList.remove('open');
                container.innerHTML = ''; }
        }

        function clearSearch() {
            const searchInput = D.getElementById('topSearchInput');
            const clearBtn = D.getElementById('searchClearBtn');
            if (searchInput) searchInput.value = '';
            if (clearBtn) clearBtn.classList.remove('visible');
            closeSearchResults();
            _globalSearchActive = false;
            _globalSearchQuery = '';
            const mainSpace = D.getElementById('mainSpace');
            if (mainSpace) clearSearchHighlights(mainSpace);
        }

        function clearSearchHighlights(container) {
            const matches = container.querySelectorAll('.search-match');
            matches.forEach(match => {
                const parent = match.parentNode;
                if (parent) {
                    const text = match.textContent;
                    parent.replaceChild(document.createTextNode(text), match);
                    parent.normalize();
                }
            });
            const noResults = container.querySelector('.search-no-results');
            if (noResults) noResults.remove();
        }

        // ---- Viewport sync ----
        function initViewportSync() {
            const bottomNav = document.querySelector('.bottom-nav');
            if (!window.visualViewport || !bottomNav) return;
            var baselineHeight = window.visualViewport.height;
            var isHidden = false;
            var handler = function() {
                var h = window.visualViewport.height;
                if (h >= baselineHeight - 30) {
                    if (isHidden) { bottomNav.style.display = 'flex'; isHidden = false; }
                    if (h > baselineHeight) baselineHeight = h;
                } else if (h < baselineHeight * 0.5) {
                    bottomNav.style.display = 'none'; isHidden = true;
                }
            };
            window.visualViewport.addEventListener('resize', handler, { passive: true });
            window.visualViewport.addEventListener('scroll', handler, { passive: true });
            handler();
        }

        // ============================================================
        //  CUSTOM SELECT DROPDOWNS
        //  Every native <select> is wrapped in a .cd-wrap. The native
        //  control is hidden but keeps its id/value/onchange and all
        //  existing repopulation logic. A .cd-btn overlays it showing
        //  the current value, and a single shared fixed .cd-panel lists
        //  the options. Dynamic re-renders are picked up by a
        //  MutationObserver plus explicit enhanceSelects() calls.
        // ============================================================
        let cdPanel = null;
        let cdActiveSel = null;
        let cdGlobalsAttached = false;
        let cdObserver = null;
        let cdReady = false;

        function cdIsColorSelect(sel) {
            return !!(sel && ((sel.classList && sel.classList.contains('ce-color-select')) || sel.hasAttribute(
                'data-cd-color')));
        }

        function cdGetWrap(sel) {
            if (!sel) return null;
            const p = sel.parentElement;
            return p && p.classList && p.classList.contains('cd-wrap') ? p : null;
        }

        function cdGetBtn(sel) {
            const w = cdGetWrap(sel);
            return w ? w.querySelector('.cd-btn') : null;
        }

        // Refresh the overlay button's look from the select's current
        // computed styles. Runs on every sync so appearance changes (e.g.
        // theme switches, repopulation, restyling) propagate even if the
        // button was declared earlier (possibly inside a hidden container).
        function cdSyncAppearance(sel, btn) {
            let cs = null;
            try { cs = getComputedStyle ? getComputedStyle(sel) : null; } catch (e) { cs = null; }
            if (!cs) return;
            const bg = sel.style.backgroundColor || cs.backgroundColor;
            if (bg && bg !== 'auto') btn.style.backgroundColor = bg;
            ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'].forEach(function(p) {
                const v = sel.style[p] || cs[p];
                if (v && v !== 'auto') btn.style[p] = v;
            });
        }

        // Push the current option text + colour from the hidden select
        // onto its overlay button. Also called by tintStateSelect.
        function cdSyncBtn(sel) {
            if (!sel) return;
            const btn = cdGetBtn(sel);
            if (!btn) return;
            cdSyncAppearance(sel, btn);
            const label = btn.querySelector('.cd-btn-label');
            const opt = sel.options && sel.options[sel.selectedIndex];
            const text = opt ? (opt.text !== undefined ? opt.text : sel.value) : (sel.value || '');
            if (label) label.textContent = text;
            btn.classList.toggle('cd-disabled', !!sel.disabled);
            let col = '';
            if (sel.dataset.tinted === '1') {
                col = sel.style.borderColor || sel.style.color || '';
            } else if (sel.style.color) {
                col = sel.style.color;
            } else if (sel.id && sel.id.indexOf('s-state-') === 0) {
                col = getStateColor(sel.value);
            }
            if (col) btn.style.color = col;
            if (sel.dataset.tinted === '1' && col) btn.style.borderColor = col;
        }

        // Copy the select's appearance + layout onto the overlay button /
        // wrapper so it looks and behaves exactly like the original.
        function cdCopyStyles(sel, wrap, btn, cs) {
            if (!cs) return;
            const look = {
                fontSize: 'fontSize',
                fontFamily: 'fontFamily',
                fontWeight: 'fontWeight',
                color: 'color',
                backgroundColor: 'backgroundColor',
                paddingTop: 'paddingTop',
                paddingRight: 'paddingRight',
                paddingBottom: 'paddingBottom',
                paddingLeft: 'paddingLeft',
                borderRadius: 'borderRadius',
                borderTop: 'borderTop',
                borderRight: 'borderRight',
                borderBottom: 'borderBottom',
                borderLeft: 'borderLeft',
                textAlign: 'textAlign',
                lineHeight: 'lineHeight'
            };
            for (const cssProp in look) {
                const jsProp = look[cssProp];
                const v = sel.style[jsProp] || cs[cssProp];
                if (v && v !== 'auto') btn.style[jsProp] = v;
            }
            ['flex', 'minWidth', 'maxWidth'].forEach(function(p) {
                const v = cs[p];
                if (v && v !== 'auto') wrap.style[p] = v;
            });
            ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].forEach(function(p) {
                const v = cs[p];
                if (v && v !== '0px') wrap.style[p] = v;
            });
        }

        // Wrap one select: hide it, overlay the button, wire the panel.
        function declareSelect(sel) {
            if (!sel || sel.tagName !== 'SELECT') return;
            if (sel.hasAttribute('data-cd-skip')) return;
            if (cdGetWrap(sel)) return;

            let cs = null;
            try { cs = getComputedStyle ? getComputedStyle(sel) : null; } catch (e) { cs = null; }

            const wrap = document.createElement('div');
            wrap.className = 'cd-wrap';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'cd-btn';
            btn.setAttribute('aria-haspopup', 'listbox');
            btn.setAttribute('aria-expanded', 'false');
            const label = document.createElement('span');
            label.className = 'cd-btn-label';
            const chev = document.createElement('span');
            chev.className = 'cd-chev';
            btn.appendChild(label);
            btn.appendChild(chev);

            sel.parentNode.insertBefore(wrap, sel);
            wrap.appendChild(sel);
            sel.setAttribute('tabindex', '-1');

            cdCopyStyles(sel, wrap, btn, cs);
            wrap.appendChild(btn);

            btn.addEventListener('click', function(ev) {
                ev.preventDefault();
                ev.stopPropagation();
                if (sel.disabled) return;
                if (cdActiveSel === sel && cdPanel && cdPanel.classList.contains('open')) {
                    closeCdPanel();
                } else {
                    openCdPanel(sel);
                }
            });

            btn.addEventListener('keydown', function(ev) {
                if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp' || ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    openCdPanel(sel);
                } else if (ev.key === 'Escape') {
                    closeCdPanel();
                }
            });

            sel.addEventListener('change', function() { cdSyncBtn(sel); });
            sel.addEventListener('focus', function() {
                const b = cdGetBtn(sel);
                if (b && document.activeElement !== b) b.focus();
            });

            sel.dataset.cd = '1';
            cdSyncBtn(sel);
        }

        function ensureCdPanel() {
            if (cdPanel) return cdPanel;
            cdPanel = document.createElement('div');
            cdPanel.className = 'cd-panel';
            cdPanel.setAttribute('role', 'listbox');

            cdPanel.addEventListener('click', function(ev) {
                const opt = ev.target && ev.target.closest ? ev.target.closest('.cd-opt') : null;
                if (!opt) return;
                ev.preventDefault();
                ev.stopPropagation();
                if (cdActiveSel) {
                    cdActiveSel.value = opt.getAttribute('data-value');
                    cdSyncBtn(cdActiveSel);
                    cdActiveSel.dispatchEvent(new Event('change', { bubbles: true }));
                }
                closeCdPanel();
            });

            cdPanel.addEventListener('keydown', function(ev) {
                if (!cdActiveSel) return;
                if (ev.key === 'Escape') {
                    ev.preventDefault();
                    const b = cdGetBtn(cdActiveSel);
                    closeCdPanel();
                    if (b) b.focus();
                    return;
                }
                if (ev.key === 'Enter') {
                    ev.preventDefault();
                    const focused = document.activeElement;
                    if (focused && focused.classList && focused.classList.contains('cd-opt') && cdActiveSel) {
                        cdActiveSel.value = focused.getAttribute('data-value');
                        cdSyncBtn(cdActiveSel);
                        cdActiveSel.dispatchEvent(new Event('change', { bubbles: true }));
                        closeCdPanel();
                    }
                    return;
                }
                if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return;
                ev.preventDefault();
                const opts = Array.prototype.slice.call(cdPanel.querySelectorAll('.cd-opt'));
                if (!opts.length) return;
                let idx = opts.indexOf(document.activeElement);
                if (idx < 0) idx = opts.findIndex(function(o) { return o.classList.contains('selected'); });
                if (idx < 0) idx = -1;
                idx = (idx + (ev.key === 'ArrowDown' ? 1 : opts.length - 1)) % opts.length;
                opts[idx].focus();
                cdActiveSel.value = opts[idx].getAttribute('data-value');
                cdSyncBtn(cdActiveSel);
            });

            document.body.appendChild(cdPanel);
            return cdPanel;
        }

        function buildPanelForState(sel) {
            const panel = ensureCdPanel();
            const isColor = cdIsColorSelect(sel);
            const tinted = sel.dataset.tinted === '1' || (sel.id && sel.id.indexOf('s-state-') === 0);
            const cur = sel.value;
            const frag = document.createDocumentFragment();
            for (let i = 0; i < sel.options.length; i++) {
                const opt = sel.options[i];
                const val = opt.value;
                const text = (opt.text !== undefined ? opt.text : val) || '';
                const div = document.createElement('div');
                div.className = 'cd-opt';
                div.setAttribute('role', 'option');
                div.setAttribute('tabindex', '-1');
                div.setAttribute('data-value', val);
                const isCur = (val === cur);
                if (isCur) div.classList.add('selected');
                let color = '';
                if (isColor) {
                    color = (opt.style && opt.style.background) ? opt.style.background : (val || '');
                    if (color) {
                        const sw = document.createElement('span');
                        sw.className = 'cd-opt-swatch';
                        sw.style.background = color;
                        div.appendChild(sw);
                    }
                } else if (tinted) {
                    color = getStateColor(val);
                }
                if (color && !isCur) div.style.color = color;
                div.appendChild(document.createTextNode(text));
                frag.appendChild(div);
            }
            panel.innerHTML = '';
            panel.appendChild(frag);
        }

        function positionCdPanel(btn, panel) {
            const rect = btn.getBoundingClientRect();
            const vw = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0);
            const vh = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
            const panelW = Math.max(rect.width, 150);
            let left = rect.left;
            if (left + panelW > vw - 8) left = Math.max(8, vw - panelW - 8);
            const gap = 4;
            const estH = Math.min(220, panel.scrollHeight || 0);
            let top = rect.bottom + gap;
            if (top + estH > vh - 8 && (rect.top - gap) > estH) {
                top = rect.top - gap - estH;
            } else if (top + estH > vh - 8) {
                top = Math.max(8, vh - estH - 8);
            }
            panel.style.left = left + 'px';
            panel.style.top = top + 'px';
            panel.style.width = panelW + 'px';
            panel.style.maxHeight = '220px';
        }

        function openCdPanel(sel) {
            const btn = cdGetBtn(sel);
            if (!btn || sel.disabled) return;
            if (cdActiveSel && cdActiveSel !== sel) closeCdPanel();
            const panel = ensureCdPanel();
            buildPanelForState(sel);
            panel.classList.add('open');
            positionCdPanel(btn, panel);
            cdActiveSel = sel;
            if (btn) btn.setAttribute('aria-expanded', 'true');
        }

        function closeCdPanel() {
            if (cdActiveSel) {
                const b = cdGetBtn(cdActiveSel);
                if (b) b.setAttribute('aria-expanded', 'false');
            }
            if (cdPanel) cdPanel.classList.remove('open');
            cdActiveSel = null;
        }

        // Declare/sync every select currently in the DOM (idempotent).
        function enhanceSelects() {
            if (!cdReady) return;
            const all = document.querySelectorAll('select');
            for (let i = 0; i < all.length; i++) {
                const s = all[i];
                if (s.hasAttribute('data-cd-skip')) continue;
                if (cdGetWrap(s)) {
                    try { cdSyncBtn(s); } catch (e) { }
                } else {
                    try { declareSelect(s); } catch (e) { }
                }
            }
        }

        function cdAttachGlobals() {
            if (cdGlobalsAttached) return;
            cdGlobalsAttached = true;
            document.addEventListener('pointerdown', function(ev) {
                if (!cdPanel || !cdPanel.classList.contains('open')) return;
                const t = ev.target;
                if (t && t.closest && t.closest('.cd-panel')) return;
                if (cdActiveSel && t && t.closest && t.closest('.cd-wrap')) {
                    const w = cdActiveSel.parentElement;
                    if (w && w.contains(t)) return;
                }
                closeCdPanel();
            }, true);
            document.addEventListener('scroll', function(ev) {
                if (!cdPanel || !cdPanel.classList.contains('open')) return;
                const t = ev.target;
                if (t && t === cdPanel) return;
                if (t && cdPanel.contains(t)) return;
                closeCdPanel();
            }, { capture: true, passive: true });
            window.addEventListener('resize', function() { closeCdPanel(); }, { passive: true });
            window.addEventListener('blur', function() { closeCdPanel(); });
        }

        // Catch newly rendered selects and option repopulation automatically.
        function cdAttachObserver() {
            if (cdObserver) return;
            cdObserver = new MutationObserver(function(muts) {
                if (!cdReady) return;
                let needScan = false;
                for (let i = 0; i < muts.length; i++) {
                    const m = muts[i];
                    if (m.addedNodes && m.addedNodes.length) needScan = true;
                    if (m.target && m.target.tagName === 'SELECT' && m.target.hasAttribute('data-cd')) {
                        try { cdSyncBtn(m.target); } catch (e) { }
                    }
                }
                if (needScan) {
                    const fresh = document.querySelectorAll('select:not([data-cd])');
                    for (let i = 0; i < fresh.length; i++) {
                        const s = fresh[i];
                        if (s.hasAttribute('data-cd-skip')) continue;
                        try { declareSelect(s); } catch (e) { }
                    }
                }
            });
            cdObserver.observe(document.body, { childList: true, subtree: true });
        }

        cdReady = true;
        cdAttachGlobals();
        cdAttachObserver();
        enhanceSelects();

        // ---- Init ----
        // initApp() is defined as async at the bottom of this file after all functions

        const stateColors = ['#34C759', '#FF453A', '#FF9F0A', '#0A84FF', '#30D158', '#30D158', '#FF3B30', '#FF9500',
            '#34C759', '#FF453A', '#30B0C7', '#FF375F', '#AF52DE', '#64D2FF', '#FFD60A', '#34C759', '#5856D6',
            '#64D2FF', '#40CBE0', '#30D158', '#FF3B30', '#FF9500', '#BF5AF2', '#FFD60A', '#FF2D55', '#64D2FF',
            '#0A84FF', '#8E8E93', '#AF52DE', '#30D158', '#FF453A', '#FF9500', '#30B0C7', '#FF453A', '#AEAEB2',
            '#007AFF', '#34C759', '#FF2D55', '#30B0C7', '#FF453A', '#34C759', '#FF453A', '#64D2FF', '#FF453A',
            '#34C759', '#FF453A', '#64D2FF', '#8E8E93', '#AF52DE', '#FF2D55', '#5856D6', '#64D2FF', '#8E8E93'
        ];

        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();

        // ---- Camera functions (placeholder) ----
        let editPicId = null;
        let camHistory = [];
        let camHistoryIdx = -1;
        const CAM_HISTORY_MAX = 30;

        function camPushHistory() {
            const canvas = document.getElementById('camCanvas');
            const ctx = canvas.getContext('2d');
            const filter = canvas.style.filter || 'none';
            if (filter !== 'none') {
                const tmp = document.createElement('canvas');
                tmp.width = canvas.width;
                tmp.height = canvas.height;
                const tctx = tmp.getContext('2d');
                tctx.filter = filter;
                tctx.drawImage(canvas, 0, 0);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(tmp, 0, 0);
                canvas.style.filter = 'none';
            }
            const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
            camHistory = camHistory.slice(0, camHistoryIdx + 1);
            camHistory.push({ w: canvas.width, h: canvas.height, data: snap });
            if (camHistory.length > CAM_HISTORY_MAX) camHistory.shift();
            camHistoryIdx = camHistory.length - 1;
            camUpdateUndoRedo();
        }

        function camUndo() {
            if (camHistoryIdx <= 0) return;
            camHistoryIdx--;
            camRestoreHistory();
        }

        function camRedo() {
            if (camHistoryIdx >= camHistory.length - 1) return;
            camHistoryIdx++;
            camRestoreHistory();
        }

        function camRestoreHistory() {
            const canvas = document.getElementById('camCanvas');
            const ctx = canvas.getContext('2d');
            const snap = camHistory[camHistoryIdx];
            canvas.width = snap.w;
            canvas.height = snap.h;
            ctx.putImageData(snap.data, 0, 0);
            canvas.style.filter = 'none';
            canvas.style.transform = 'none';
            camCurrentFilter = 'none';
            const br = document.getElementById('camBrightness');
            const co = document.getElementById('camContrast');
            const sa = document.getElementById('camSaturation');
            if (br) { br.value = 100; document.getElementById('camBrightnessVal').textContent = '100'; }
            if (co) { co.value = 100; document.getElementById('camContrastVal').textContent = '100'; }
            if (sa) { sa.value = 100; document.getElementById('camSaturationVal').textContent = '100'; }
            document.querySelectorAll('.cam-filter-opt').forEach(function(b) { b.classList.remove('active'); });
            camAdjustPushed = false;
            camUpdateUndoRedo();
        }

        function camUpdateUndoRedo() {
            const enabled = camHistoryIdx > 0;
            const canRedo = camHistoryIdx < camHistory.length - 1;
            ['camUndoBtn'].forEach(function(id) {
                const el = document.getElementById(id);
                if (el) {
                    el.style.opacity = enabled ? '1' : '0.3';
                    el.style.pointerEvents = enabled ? 'auto' : 'none';
                }
            });
            ['camRedoBtn'].forEach(function(id) {
                const el = document.getElementById(id);
                if (el) {
                    el.style.opacity = canRedo ? '1' : '0.3';
                    el.style.pointerEvents = canRedo ? 'auto' : 'none';
                }
            });
        }

        function camResetHistory() {
            camHistory = [];
            camHistoryIdx = -1;
            camUpdateUndoRedo();
        }

        function handleCamInput(e) {
            editPicId = null;
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(ev) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.getElementById('camCanvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    canvas.style.filter = 'none';
                    canvas.style.transform = 'none';
                    camCurrentFilter = 'none';
                    document.getElementById('camCropPanel').style.display = 'none';
                    document.getElementById('camFilterPanel').style.display = 'none';
                    document.getElementById('camAdjustPanel').style.display = 'none';
                    document.querySelectorAll('.cam-filter-opt').forEach(function(b) { b.classList.remove('active'); });
                    document.getElementById('camBrightness').value = 100;
                    document.getElementById('camContrast').value = 100;
                    document.getElementById('camSaturation').value = 100;
                    document.getElementById('camBrightnessVal').textContent = '100';
                    document.getElementById('camContrastVal').textContent = '100';
                    document.getElementById('camSaturationVal').textContent = '100';
                    openModal('cameraModal');
                    camResetHistory();
                    camPushHistory();
                    document.getElementById('camMetadata').textContent = file.name + ' - ' + (file.size / 1024)
                        .toFixed(1) + 'KB';
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }

        function handleImportInput(e) {
            handleCamInput(e);
        }

        function manipulateCam(action) {
            const canvas = document.getElementById('camCanvas');
            const ctx = canvas.getContext('2d');
            const w = canvas.width,
                h = canvas.height;
            if (action === 'rotate') {
                const newCanvas = document.createElement('canvas');
                newCanvas.width = h;
                newCanvas.height = w;
                const nctx = newCanvas.getContext('2d');
                nctx.translate(h, 0);
                nctx.rotate(Math.PI / 2);
                nctx.drawImage(canvas, 0, 0);
                canvas.width = h;
                canvas.height = w;
                ctx.drawImage(newCanvas, 0, 0);
                camPushHistory();
            } else if (action === 'crop') {
                const ratioVal = document.getElementById('camCropRatio').value;
                if (ratioVal === 'free') {
                    canvas.style.filter = 'none';
                    canvas.style.transform = 'none';
                    camPushHistory();
                    return;
                }
                const ratio = parseFloat(ratioVal);
                let newW = w,
                    newH = h;
                if (w / h > ratio) { newW = h * ratio; } else { newH = w / ratio; }
                const sx = (w - newW) / 2,
                    sy = (h - newH) / 2;
                const imgData = ctx.getImageData(sx, sy, newW, newH);
                canvas.width = newW;
                canvas.height = newH;
                ctx.putImageData(imgData, 0, 0);
                camPushHistory();
            }
        }

        function saveCam() {
            const canvas = document.getElementById('camCanvas');
            let exportCanvas = canvas;
            const filter = canvas.style.filter || 'none';
            const transform = canvas.style.transform || 'none';
            if (filter !== 'none' || transform !== 'none') {
                const tmp = document.createElement('canvas');
                tmp.width = canvas.width;
                tmp.height = canvas.height;
                const tctx = tmp.getContext('2d');
                tctx.filter = filter;
                tctx.drawImage(canvas, 0, 0);
                exportCanvas = tmp;
            }
            const dataUrl = exportCanvas.toDataURL('image/png');
            const replacing = !!editPicId;
            if (replacing) {
                const idx = app.pictures.findIndex(p => p.id === editPicId);
                if (idx > -1) {
                    app.pictures[idx].data = dataUrl;
                    app.pictures[idx].date = new Date().toISOString();
                }
                editPicId = null;
            } else {
                const pic = { id: generateId(), data: dataUrl, date: new Date().toISOString() };
                if (!app.pictures) app.pictures = [];
                app.pictures.push(pic);
            }
            saveData();
            closeModal('cameraModal');
            renderApp();
            populateSettings();
            populateStorageFull();
            showToast(replacing ? t('Picture updated') : t('Picture saved'), 'success');
        }

        /* Camera Modal - Panel Toggles */
        function camShowCropPanel() {
            const p = document.getElementById('camCropPanel');
            const f = document.getElementById('camFilterPanel');
            const a = document.getElementById('camAdjustPanel');
            if (f) f.style.display = 'none';
            if (a) a.style.display = 'none';
            p.style.display = p.style.display === 'none' ? 'flex' : 'none';
        }
        function camShowFilterPanel() {
            const p = document.getElementById('camCropPanel');
            const f = document.getElementById('camFilterPanel');
            const a = document.getElementById('camAdjustPanel');
            if (p) p.style.display = 'none';
            if (a) a.style.display = 'none';
            f.style.display = f.style.display === 'none' ? 'flex' : 'none';
        }
        function camShowAdjustPanel() {
            const p = document.getElementById('camCropPanel');
            const f = document.getElementById('camFilterPanel');
            const a = document.getElementById('camAdjustPanel');
            if (p) p.style.display = 'none';
            if (f) f.style.display = 'none';
            camAdjustPushed = false;
            a.style.display = a.style.display === 'none' ? 'flex' : 'none';
        }

        /* Camera Modal - Filter */
        let camCurrentFilter = 'none';
        function camApplyFilter(type, el) {
            if (camCurrentFilter !== type) {
                camPushHistory();
            }
            camCurrentFilter = type;
            const canvas = document.getElementById('camCanvas');
            const filters = {
                none: 'none',
                grayscale: 'grayscale(100%)',
                sepia: 'sepia(100%)',
                invert: 'invert(100%)',
                blur: 'blur(4px)'
            };
            canvas.style.filter = filters[type] || 'none';
            document.querySelectorAll('.cam-filter-opt').forEach(function(b) { b.classList.remove('active'); });
            if (type !== 'none' && el) {
                el.classList.add('active');
            }
        }

        /* Camera Modal - Adjust */
        let camAdjustPushed = false;
        function camApplyAdjust() {
            if (!camAdjustPushed) {
                camPushHistory();
                camAdjustPushed = true;
            }
            const br = document.getElementById('camBrightness').value;
            const co = document.getElementById('camContrast').value;
            const sa = document.getElementById('camSaturation').value;
            document.getElementById('camBrightnessVal').textContent = br;
            document.getElementById('camContrastVal').textContent = co;
            document.getElementById('camSaturationVal').textContent = sa;
            const canvas = document.getElementById('camCanvas');
            canvas.style.filter = 'brightness(' + (br / 100) + ') contrast(' + (co / 100) + ') saturate(' + (sa / 100) + ')';
            camCurrentFilter = 'adjust';
        }

        /* Camera Modal - Zoom */
        function camZoom(factor) {
            const canvas = document.getElementById('camCanvas');
            const current = parseFloat(canvas.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1');
            const next = Math.max(0.5, Math.min(3, current + factor));
            canvas.style.transform = 'scale(' + next + ')';
            canvas.style.transition = 'transform 0.2s ease';
        }

        /* Camera Modal - Share */
        function camShare() {
            const canvas = document.getElementById('camCanvas');
            canvas.toBlob(function(blob) {
                if (navigator.share && navigator.canShare) {
                    const file = new File([blob], 'picture.png', { type: 'image/png' });
                    if (navigator.canShare({ files: [file] })) {
                        navigator.share({ files: [file], title: 'Picture' }).catch(function() {});
                        return;
                    }
                }
                showToast(t('Sharing not supported on this device'), 'info');
            }, 'image/png');
        }

        /* Camera Modal - Download */
        function camDownload() {
            const canvas = document.getElementById('camCanvas');
            const link = document.createElement('a');
            link.download = 'picture_' + Date.now() + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast(t('Downloaded'), 'success');
        }

        /* Camera Modal - Delete */
        function camDelete() {
            if (!editPicId) {
                closeModal('cameraModal');
                return;
            }
            const id = editPicId;
            editPicId = null;
            delPic(id);
            closeModal('cameraModal');
        }

        let picViewMode = 'full';
        let picViewOrient = 'auto';
        let picViewImgData = null;

        function viewPic(id) {
            const pic = app.pictures.find(p => p.id === id);
            if (!pic) return;
            const img = new Image();
            img.onload = function() {
                picViewImgData = img;
                picViewApply();
                openModal('picViewModal');
            };
            img.src = pic.data;
        }

        function picViewApply() {
            if (!picViewImgData) return;
            var img = picViewImgData;
            var canvas = document.getElementById('picViewCanvas');
            var ctx = canvas.getContext('2d');
            var w = img.width, h = img.height;

            if (picViewOrient === 'portrait' && w > h) {
                var tmp = document.createElement('canvas');
                tmp.width = h; tmp.height = w;
                var tctx = tmp.getContext('2d');
                tctx.translate(h, 0); tctx.rotate(Math.PI / 2);
                tctx.drawImage(img, 0, 0);
                w = h; h = img.width;
                img = tmp;
            } else if (picViewOrient === 'landscape' && h > w) {
                var tmp = document.createElement('canvas');
                tmp.width = h; tmp.height = w;
                var tctx = tmp.getContext('2d');
                tctx.translate(h, 0); tctx.rotate(Math.PI / 2);
                tctx.drawImage(img, 0, 0);
                w = h; h = img.width;
                img = tmp;
            }

            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0);

            var modal = document.getElementById('picViewModal');
            var vw = window.innerWidth, vh = window.innerHeight;
            var maxW, maxH;

            if (picViewMode === 'full') {
                maxW = vw * 0.95; maxH = vh * 0.95;
            } else if (picViewMode === 'half') {
                maxW = vw * 0.55; maxH = vh * 0.55;
            } else {
                maxW = vw * 0.35; maxH = vh * 0.35;
            }

            var scale = Math.min(maxW / w, maxH / h, 1);
            canvas.style.width = (w * scale) + 'px';
            canvas.style.height = (h * scale) + 'px';
        }

        function picViewSetMode(mode) {
            picViewMode = mode;
            document.querySelectorAll('.pic-view-opt').forEach(function(b) {
                b.classList.toggle('active', b.getAttribute('data-mode') === mode);
            });
            picViewApply();
        }

        function picViewSetOrient(orient) {
            picViewOrient = orient;
            document.querySelectorAll('.pic-view-orient').forEach(function(b) {
                b.classList.toggle('active', b.getAttribute('data-orient') === orient);
            });
            picViewApply();
        }

        function editPic(id) {
            const pic = app.pictures.find(p => p.id === id);
            if (!pic) return;
            const canvas = document.getElementById('camCanvas');
            const img = new Image();
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                canvas.style.filter = 'none';
                canvas.style.transform = 'none';
                camCurrentFilter = 'none';
                document.getElementById('camCropPanel').style.display = 'none';
                document.getElementById('camFilterPanel').style.display = 'none';
                document.getElementById('camAdjustPanel').style.display = 'none';
                document.querySelectorAll('.cam-filter-opt').forEach(function(b) { b.classList.remove('active'); });
                document.getElementById('camBrightness').value = 100;
                document.getElementById('camContrast').value = 100;
                document.getElementById('camSaturation').value = 100;
                document.getElementById('camBrightnessVal').textContent = '100';
                document.getElementById('camContrastVal').textContent = '100';
                document.getElementById('camSaturationVal').textContent = '100';
                editPicId = id;
                const meta = document.getElementById('camMetadata');
                if (meta) meta.textContent = 'Editing picture';
                openModal('cameraModal');
                camResetHistory();
                camPushHistory();
            };
            img.src = pic.data;
        }

        // ---- Ledger edit (inline in the entry form) ----
        function editLedger(modId, itemId) {
            const entries = app.ledgers[modId] || [];
            const entry = entries.find(e => e.id === itemId);
            if (!entry) return;
            inlineEditEntry = { modId, itemId };
            renderApp();
            setTimeout(() => {
                const f = document.getElementById('l-i-' + modId);
                if (f) { f.scrollIntoView({ block: 'center', behavior: 'smooth' }); f.focus(); f.select(); }
            }, 120);
        }

        function updateInlineLedger(modId) {
            if (!inlineEditEntry || inlineEditEntry.modId !== modId) return;
            const entries = app.ledgers[modId] || [];
            const idx = entries.findIndex(e => e.id === inlineEditEntry.itemId);
            if (idx === -1) { inlineEditEntry = null; renderApp(); return; }
            const item = document.getElementById('l-i-' + modId).value.trim();
            const amount = parseCommaNum(document.getElementById('l-a-' + modId).value);
            let category = document.getElementById('l-c-' + modId).value.trim();
            const qty = parseCommaNum(document.getElementById('l-q-' + modId).value);
            const unitEl = document.getElementById('l-u-' + modId);
            const unit = unitEl ? unitEl.value : '';
            if (!item || !amount) { showToast('Please fill all fields', 'error'); return; }
            entries[idx].i = item;
            entries[idx].a = Math.min(amount, MAX_INPUT_VALUE);
            entries[idx].c = category;
            entries[idx].q = (qty && qty > 0) ? Math.min(qty, MAX_INPUT_VALUE) : 1;
            entries[idx].u = unit;
            inlineEditEntry = null;
            saveData();
            renderApp();
            showToast('Entry updated', 'success');
        }

        function cancelInlineLedger() {
            inlineEditEntry = null;
            renderApp();
        }

        function saveEditedLedger() {
            if (!editingLedgerEntry) return;
            const { modId, itemId, entry } = editingLedgerEntry;
            const item = document.getElementById('editLedgerItem').value.trim();
            const amount = parseCommaNum(document.getElementById('editLedgerAmount').value);
            const qty = parseCommaNum(document.getElementById('editLedgerQuantity').value);
            const category = document.getElementById('editLedgerCategory').value;
            const unitEl = document.getElementById('editLedgerUnit');
            const unit = unitEl ? unitEl.value : '';
            if (!item || !amount) { showToast('Please fill all fields', 'error'); return; }
            const entries = app.ledgers[modId] || [];
            const idx = entries.findIndex(e => e.id === itemId);
            if (idx === -1) { showToast('Entry not found', 'error'); return; }
            entries[idx].i = item;
            entries[idx].a = Math.min(amount, MAX_INPUT_VALUE);
            entries[idx].c = category;
            entries[idx].q = (qty && qty > 0) ? Math.min(qty, MAX_INPUT_VALUE) : 1;
            entries[idx].u = unit;
            saveData();
            closeModal('editLedgerModal');
            editingLedgerEntry = null;
            renderApp();
            showToast('Entry updated', 'success');
        }

        // ---- Total Expense edit/delete (inline in the record section) ----
        function editTotalExpenseEntry(modId, weekKey, itemId) {
            if (!app.totalExpense[modId] || !app.totalExpense[modId][weekKey]) return;
            const entries = app.totalExpense[modId][weekKey];
            const idx = entries.findIndex(e => e.id === itemId);
            if (idx === -1) return;
            inlineExpenseEdit = { modId, weekKey, itemId };
            renderApp();
            setTimeout(() => {
                const f = document.getElementById('rt-exp-i');
                if (f) { f.scrollIntoView({ block: 'center', behavior: 'smooth' }); f.focus(); f.select(); }
            }, 120);
        }

        function updateTotalExpenseEntry() {
            if (!inlineExpenseEdit) return;
            const { modId, weekKey, itemId } = inlineExpenseEdit;
            const entries = (app.totalExpense[modId] && app.totalExpense[modId][weekKey]) ? app.totalExpense[modId][weekKey] : [];
            const idx = entries.findIndex(e => e.id === itemId);
            if (idx === -1) { inlineExpenseEdit = null; renderApp(); return; }
            const item = document.getElementById('rt-exp-i').value.trim();
            const amount = parseCommaNum(document.getElementById('rt-exp-a').value);
            let category = document.getElementById('rt-exp-c').value.trim();
            const qty = parseCommaNum(document.getElementById('rt-exp-q').value);
            const unitEl2 = document.getElementById('rt-exp-u');
            const unit2 = unitEl2 ? unitEl2.value : '';
            if (!item || !amount) { showToast('Please fill all fields', 'error'); return; }
            entries[idx].i = item;
            entries[idx].a = Math.min(amount, MAX_INPUT_VALUE);
            entries[idx].c = category;
            entries[idx].q = (qty && qty > 0) ? Math.min(qty, MAX_INPUT_VALUE) : 1;
            entries[idx].u = unit2;
            inlineExpenseEdit = null;
            saveData();
            renderApp();
            showToast('Expense entry updated', 'success');
        }

        function cancelInlineExpenseEdit() {
            inlineExpenseEdit = null;
            renderApp();
        }

        function buildInlineExpenseEditForm() {
            if (!inlineExpenseEdit) return '';
            const entries = (app.totalExpense[inlineExpenseEdit.modId] && app.totalExpense[inlineExpenseEdit.modId][inlineExpenseEdit.weekKey]) ? app.totalExpense[inlineExpenseEdit.modId][inlineExpenseEdit.weekKey] : [];
            const entry = entries.find(e => e.id === inlineExpenseEdit.itemId);
            if (!entry) return '';
            const opts = app.cats.filter(c => app.categoryEnabled[c] !== false).map(c =>
                `<option value="${escapeHtml(c)}" ${c === entry.c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
            return `
                <div class="themed-box b-gray flex-col" style="padding:0.4rem; margin:0.5rem 0; border:1.5px solid var(--accent);">
                    <div class="flex-row" style="gap:0.2rem;">
                        <input type="text" id="rt-exp-i" placeholder="Item" value="${escapeHtml(entry.i || '')}" style="border-radius:var(--radius-full); flex:1; padding:0.3rem 0.5rem; font-size:0.7rem;" aria-label="Item" oninput="autoCapitalize(this)">
                        <input type="text" inputmode="decimal" id="rt-exp-a" placeholder="Amount" class="blur-target" oninput="formatCommaInput(this); clampInputValue(this)" value="${fmt(entry.a || 0)}" style="border-radius:var(--radius-full); flex:1; padding:0.3rem 0.5rem; font-size:0.7rem;" aria-label="Amount">
                    </div>
                    <div class="flex-row" style="gap:0.2rem;">
                        <div style="flex:1; display:flex; align-items:center; gap:0.3rem; border-radius:var(--radius-full); padding:0.1rem 0.4rem; background:var(--surface); border:1px solid var(--border-light);">
                            <span style="font-size:0.7rem; font-weight:var(--font-weight-black); color:var(--text-main);">CAT</span>
                            <select id="rt-exp-c" aria-label="Category" style="flex:1; min-width:0; border-radius:var(--radius-sm); padding:0.25rem 0.4rem; font-size:0.65rem; background:var(--app-bg); border:1px solid var(--border-med); color:var(--color-black);">${opts}</select>
                        </div>
                        <input type="text" inputmode="decimal" id="rt-exp-q" placeholder="Qty" class="blur-target" oninput="formatCommaInput(this); clampInputValue(this)" value="${fmt(entry.q !== undefined && entry.q !== null && entry.q !== '' ? entry.q : 1)}" style="border-radius:var(--radius-full); flex:1; padding:0.3rem 0.5rem; font-size:0.7rem;" aria-label="Quantity">
                        <select id="rt-exp-u" aria-label="Unit" style="border-radius:var(--radius-full); flex:0 0 auto; padding:0.25rem 0.3rem; font-size:0.65rem; background:var(--app-bg); border:1px solid var(--border-med); color:var(--color-black); max-width:60px;">${buildUnitOpts(entry.u || 'kg')}</select>
                    </div>
                    <div class="flex-row" style="gap:0.2rem; align-items:stretch;">
                        <button class="btn-update-ledger" style="flex:1;" onclick="updateTotalExpenseEntry()">UPDATE</button>
                        <button class="btn-cancel-ledger" onclick="cancelInlineExpenseEdit()">CANCEL</button>
                    </div>
                </div>`;
        }

        function deleteTotalExpenseEntry(modId, weekKey, itemId) {
            if (!app.totalExpense[modId] || !app.totalExpense[modId][weekKey]) return;
            const entries = app.totalExpense[modId][weekKey];
            const idx = entries.findIndex(e => e.id === itemId);
            if (idx === -1) return;
            const entry = entries[idx];
            binAdd('expense', entry, 'Expense: ' + entry.i, { modId: modId, weekKey: weekKey });
            entries.splice(idx, 1);
            if (entries.length === 0) {
                delete app.totalExpense[modId][weekKey];
                if (Object.keys(app.totalExpense[modId]).length === 0) delete app.totalExpense[modId];
            }
            saveData();
            renderApp();
            showToast('Expense entry deleted', 'info');
        }

        // ---- Open rename modal ----
        let renameTarget = null;

        function openRenameModal(type, id, currentName) {
            renameTarget = { type: type, id: id };
            const titleEl = D.getElementById('renameModalTitle');
            const labels = { note: 'Rename Note', picture: 'Rename Picture', archive: 'Rename Archive' };
            if (titleEl) titleEl.textContent = labels[type] || 'Rename';
            const input = D.getElementById('renameInput');
            if (input) {
                input.value = currentName || '';
                setTimeout(function() { input.focus(); input.select(); }, 60);
            }
            openModal('renameModal');
        }

        function renameNote(id) {
            const note = app.notes.find(n => n.id === id);
            if (!note) return;
            openRenameModal('note', id, note.title || '');
        }

        let picRenameTargetId = null;

        function renamePic(id) {
            const pic = app.pictures.find(p => p.id === id);
            if (!pic) return;
            picRenameTargetId = id;
            const sn = String((app.pictures.indexOf(pic) + 1)).padStart(2, '0');
            const card = document.getElementById('picRenameCard');
            const input = document.getElementById('picRenameInput');
            if (card) card.style.display = 'block';
            if (input) {
                input.value = pic.name || 'Picture ' + sn;
                setTimeout(function() { input.focus(); input.select(); }, 60);
            }
        }

        function confirmPicRename() {
            const input = document.getElementById('picRenameInput');
            const val = input ? input.value.trim() : '';
            if (!val) { showToast('Please enter a name', 'error'); return; }
            if (!picRenameTargetId) { cancelPicRename(); return; }
            const pic = app.pictures.find(p => p.id === picRenameTargetId);
            if (pic) { pic.name = val; saveData(); showToast('Picture renamed', 'success'); }
            picRenameTargetId = null;
            cancelPicRename();
            populateStorageFull();
        }

        function cancelPicRename() {
            picRenameTargetId = null;
            const card = document.getElementById('picRenameCard');
            if (card) card.style.display = 'none';
        }

        function renameArchive(key) {
            openRenameModal('archive', key, getArchiveDisplayName(key));
        }

        function confirmRename() {
            const input = D.getElementById('renameInput');
            const val = input ? input.value.trim() : '';
            if (!val) { showToast('Please enter a name', 'error'); return; }
            const t = renameTarget;
            renameTarget = null;
            if (!t) { closeModal('renameModal'); return; }
            if (t.type === 'note') {
                const note = app.notes.find(n => n.id === t.id);
                if (note) { note.title = val; saveData(); showToast('Note renamed', 'success'); }
            } else if (t.type === 'picture') {
                const pic = app.pictures.find(p => p.id === t.id);
                if (pic) { pic.name = val; saveData(); showToast('Picture renamed', 'success'); }
            } else if (t.type === 'archive') {
                if (!app.archiveNames) app.archiveNames = {};
                app.archiveNames[t.id] = val;
                saveData();
                showToast('Archive renamed', 'success');
            }
            closeModal('renameModal');
            renderApp();
            populateStorageFull();
        }

        // ---- Exec note PDF download ----
        function execNotePdfDownload() {
            // placeholder
        }

        // ---- Open inline note editor ----
        function openInlineNoteEditor() {
            // placeholder for backward compat
        }

        function closeInlineNoteEditor() {
            // placeholder
        }

        function saveInlineNote() {
            // placeholder
        }

        // ---- Render notes full screen ----
        function renderNotesFullScreen() {
            // handled by the modern editor
        }

        // ---- Init app ----
        document.addEventListener('input', function(e) {
            const el = e.target;
            if (!el || el.tagName !== 'INPUT') return;
            if (el.type === 'password' || el.type === 'number' || el.type === 'date' || el.type === 'checkbox' ||
                el.type === 'radio') return;
            if (el.inputMode === 'decimal' || el.inputMode === 'numeric' || el.id === 'topSearchInput') return;
            if (el.id && (el.id.startsWith('l-a-') || el.id.startsWith('l-q-') || el.id.startsWith('gr2-') ||
                    el.id.startsWith('fr2-'))) return;
            autoCapitalize(el);
        }, true);

        function _applyTheme() {
            D.body.className = (app.theme || 'light') + '-theme';
            const themeMeta = D.querySelector('meta[name="theme-color"]');
            if (themeMeta) themeMeta.content = app.theme === 'dark' ? '#000000' : '#F5F5F7';
        }

        async function initApp() {
            try {
                await db.open();
                setCurrentUser('u_legacy');
                await migrateFromLocalStorage();
            } catch (e) { /* IndexedDB init error */ }

            try {
                const loaded = await dbFullInit();
                if (loaded && loaded.app) {
                    Object.keys(loaded.app).forEach(k => {
                        const v = loaded.app[k];
                        if (v === undefined || v === null) return;
                        if (Array.isArray(v) && v.length === 0 && Array.isArray(app[k]) && app[k].length > 0) return;
                        if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0 && typeof app[k] === 'object' && app[k] !== null && !Array.isArray(app[k]) && Object.keys(app[k]).length > 0) return;
                        app[k] = v;
                    });
                }
                if (loaded && loaded.calcRecords) calcRecords = loaded.calcRecords;
                if (loaded && loaded.calcRecordSeq) calcRecordSeq = loaded.calcRecordSeq;
                if (loaded && loaded.ageRecords) ageRecords = loaded.ageRecords;
                if (loaded && loaded.ageRecordSeq) ageRecordSeq = loaded.ageRecordSeq;
                if (loaded && loaded.noteDraft) noteDraft = loaded.noteDraft;
            } catch (e) { /* DB load error */ }

            if (!app.memberSince) {
                app.memberSince = new Date().toISOString();
            }
            app.lastLogin = new Date().toISOString();
            saveData();

            try {
                _applyTheme();
                D.documentElement.dir = (app.lang === 'ar' || app.lang === 'ur') ? 'rtl' : 'ltr';
                D.documentElement.lang = app.lang;
            } catch (e) { /* ignore */ }

            _hideAllRoutes();

            try {
                await loadLocalData();
            } catch (e) { /* ignore load errors */ }

            checkAppLock();
            document.body.classList.remove('pre-auth');

            _finishStartup();
        }

        function clearAppState() {
            const snapshot = JSON.parse(JSON.stringify(DEFAULT_APP));
            Object.keys(snapshot).forEach(k => { app[k] = snapshot[k]; });
        }

        function _hideAllRoutes() {
            D.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            const nav = D.getElementById('slideMenu');
            if (nav) nav.classList.remove('open');
        }

        function _finishStartup() {
            const splash = D.getElementById('splashScreen');
            if (splash) {
                splash.style.opacity = '0';
                setTimeout(() => splash.remove(), 350);
            }
        }
        async function loadLocalData() {
            _checkDocDownload();
            binCleanup();
            const route = window.location.hash ? window.location.hash.replace('#', '') : 'home';
            const validRoutes = ['home', 'grids', 'finance', 'settings', 'notes', 'console', 'recycle', 'storage',
                'print', 'profile', 'theme', 'notifications', 'about', 'calculator', 'age', 'reset', 'analytics', 'convertor'
            ];
            setTimeout(() => navRoute(validRoutes.includes(route) ? route : 'home'), 10);

            const now3 = new Date();
            const currentDateStr = localDateStr(now3);
            app.modules.forEach(m => {
                if (!m.start) m.start = currentDateStr;
                else { const d = new Date(m.start); if (isNaN(d.getTime())) m.start = currentDateStr; }
                if (m.format === 'ledger') {
                    m.start = currentDateStr;
                }
                if (m.format === 'grid') {
                    if (!m.states || m.states.length === 0) m.states = ['Pending', 'Present', 'Absent', 'Leave'];
                    if (!m.states.includes('Pending')) m.states = ['Pending', ...m.states];
                    if (!app.grids[m.id]) app.grids[m.id] = Array(31).fill('Pending');
                    else {
                        if (app.grids[m.id].length !== 31) {
                            const old = app.grids[m.id];
                            app.grids[m.id] = Array(31).fill('Pending');
                            for (let i = 0; i < Math.min(old.length, 31); i++) app.grids[m.id][i] = old[i] || 'Pending';
                        }
                        for (let i = 0; i < 31; i++) {
                            if (!app.grids[m.id][i] || !m.states.includes(app.grids[m.id][i])) app.grids[m.id][i] = 'Pending';
                        }
                    }
                    if (app.grids[m.id + '_showSalary'] === undefined) app.grids[m.id + '_showSalary'] = false;
                    if (app.grids[m.id + '_showRate'] === undefined) app.grids[m.id + '_showRate'] = false;
                }
                if (m.format === 'ledger') {
                    if (!app.ledgers[m.id]) app.ledgers[m.id] = [];
                    if (app.ledgers[m.id + '_showBudget'] === undefined) app.ledgers[m.id + '_showBudget'] = true;
                }
            });

            const defaultGrid = app.modules.find(m => m.format === 'grid' && m.id === 'perm_academics');
            if (defaultGrid) activeGridTabId = 'perm_academics';
            const defaultLedger = app.modules.find(m => m.format === 'ledger' && m.id === 'perm_expenditure');
            if (defaultLedger) activeFinTabId = 'perm_expenditure';

            updateRTClock();
            scheduleMidnightRefresh();
            renderApp();
            showBottomNav();
            populateSettings();
            translateUI();
            initViewportSync();
            const frame = D.getElementById('app-frame');
            if (frame) frame.classList.remove('no-transitions');
            document.addEventListener('click', () => { if (app.settings.notificationsEnabled)
                requestNotificationPermission(); }, { once: true });

            clearSearch();

            document.addEventListener('click', function(e) {
                if (!e.target.closest('#slideMenu')) {
                    const items = document.getElementById('ceDropdownItems');
                    const arrow = document.getElementById('ceArrow');
                    if (items) items.classList.remove('open');
                    if (arrow) arrow.classList.remove('open');
                    const stItems = document.getElementById('stDropdownItems');
                    const stArrow = document.getElementById('stArrow');
                    if (stItems) stItems.classList.remove('open');
                    if (stArrow) stArrow.classList.remove('open');
                    const calItems = document.getElementById('calDropdownItems');
                    const calArrow = document.getElementById('calArrow');
                    if (calItems) calItems.classList.remove('open');
                    if (calArrow) calArrow.classList.remove('open');
                }
            });

            populateGridDrawer();
            populateLedgerDrawer();

            if (D.getElementById('route-console').classList.contains('active')) {
                const ceStatusView = D.getElementById('ce-view-status');
                if (ceStatusView && ceStatusView.classList.contains('ce-active')) setTimeout(initStatusEditor, 200);
            }

            if (D.getElementById('route-analytics').classList.contains('active')) renderAnalytics();

            setTimeout(initNoteEditor, 200);
            storageNavigate('eom');

            ['mousedown', 'keydown', 'touchstart'].forEach(evt => {
            });

            const drawerOvl = D.getElementById('drawerOverlay');
            const slideOvl = D.getElementById('slideOverlay');
            if (drawerOvl) {
                drawerOvl.addEventListener('touchend', function(e) { closeDrawer(); });
                drawerOvl.addEventListener('click', function(e) { closeDrawer(); });
            }
            if (slideOvl) {
                slideOvl.addEventListener('touchend', function(e) { closeSlideMenu(); });
                slideOvl.addEventListener('click', function(e) { closeSlideMenu(); });
            }

            return true;
        }

        initApp();
