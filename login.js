/* ============================================
   AETHER LOGIN — login.js
   ============================================ */

(function () {
    'use strict';

    // ---- Elements ----
    const $ = (id) => document.getElementById(id);
    const loginForm = $('loginForm');
    const usernameInput = $('loginUsername');
    const passwordInput = $('loginPassword');
    const togglePassBtn = $('togglePassword');
    const rememberMe = $('rememberMe');
    const loginBtn = $('loginBtn');
    const statusMessage = $('statusMessage');
    const forgotPasswordBtn = $('forgotPasswordBtn');
    const forgotModal = $('forgotModal');
    const closeForgotModal = $('closeForgotModal');
    const forgotForm = $('forgotForm');
    const resetPinInput = $('resetPinInput');
    const verifyPinBtn = $('verifyPinBtn');
    const newPassModal = $('newPassModal');
    const closeNewPassModal = $('closeNewPassModal');
    const newPassForm = $('newPassForm');
    const newPassInput = $('newPassInput');
    const confirmPassInput = $('confirmPassInput');
    const savePassBtn = $('savePassBtn');

    // ---- DB Reference ----
    let appPassword = '';
    let appResetPin = '';
    let userName = '';
    let dbReady = false;

    // ---- Theme ----
    function initTheme() {
        const stored = localStorage.getItem('aether-login-theme');
        if (stored) {
            document.documentElement.setAttribute('data-theme', stored);
            return;
        }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    // ---- Greeting ----
    function updateGreeting() {
        const greetEl = $('loginGreeting');
        if (!greetEl) return;
        const hour = new Date().getHours();
        let period = 'Night';
        if (hour >= 5 && hour < 12) period = 'Morning';
        else if (hour >= 12 && hour < 17) period = 'Afternoon';
        else if (hour >= 17 && hour < 21) period = 'Evening';
        const name = userName || 'User';
        greetEl.textContent = 'Good ' + period + ', ' + name;
    }

    // ---- DB Init ----
    async function loadCredentials() {
        try {
            if (typeof Dexie === 'undefined') {
                dbReady = false;
                return;
            }
            const loginDb = new Dexie('AetherDB');
            loginDb.version(1).stores({
                settings: 'key',
                meta: 'key'
            });

            let userId = 'u_legacy';
            try {
                const metaRow = await loginDb.meta.get('currentUser');
                if (metaRow && metaRow.value) userId = metaRow.value;
            } catch (e) { /* ignore */ }

            const prefixedKey = userId + ':main';
            const plainKey = 'main';

            let settingsRow = await loginDb.settings.get(prefixedKey);
            if (!settingsRow) settingsRow = await loginDb.settings.get(plainKey);

            if (settingsRow) {
                const sv = settingsRow.value || {};
                appPassword = sv.password || '';
                appResetPin = sv.resetPin || '';
                const s = sv.settings || {};
                const profile = s.userProfile || {};
                userName = profile.name || profile.username || '';
            }

            dbReady = true;
        } catch (e) {
            dbReady = false;
        }
    }

    // ---- Validation ----
    function validateUsername(value) {
        if (!value || !value.trim()) {
            return 'Please enter your username or email.';
        }
        return '';
    }

    function validatePassword(value) {
        if (!value || !value.trim()) {
            return 'Please enter your password.';
        }
        return '';
    }

    function showFieldError(wrapId, errorId, message) {
        const wrap = $(wrapId);
        const error = $(errorId);
        if (wrap) wrap.classList.add('has-error');
        if (error) {
            error.textContent = message;
            error.classList.add('visible');
        }
    }

    function clearFieldError(wrapId, errorId) {
        const wrap = $(wrapId);
        const error = $(errorId);
        if (wrap) wrap.classList.remove('has-error');
        if (error) {
            error.textContent = '';
            error.classList.remove('visible');
        }
    }

    function clearAllErrors() {
        clearFieldError('usernameWrap', 'usernameError');
        clearFieldError('passwordWrap', 'passwordError');
        hideStatus();
    }

    // ---- Status ----
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-msg visible ' + type;
    }

    function hideStatus() {
        statusMessage.className = 'status-msg';
        statusMessage.textContent = '';
    }

    // ---- Button State ----
    function setButtonState(btn, state) {
        if (!btn) return;
        btn.classList.remove('loading', 'success');
        btn.disabled = false;
        if (state === 'loading') {
            btn.classList.add('loading');
            btn.disabled = true;
        } else if (state === 'success') {
            btn.classList.add('success');
            btn.disabled = true;
        }
    }

    // ---- Password Toggle ----
    function togglePasswordVisibility() {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePassBtn.classList.toggle('active', isPassword);
        togglePassBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    }

    // ---- Login ----
    async function handleLogin(e) {
        e.preventDefault();
        clearAllErrors();

        const username = usernameInput.value;
        const password = passwordInput.value;

        const usernameError = validateUsername(username);
        if (usernameError) {
            showFieldError('usernameWrap', 'usernameError', usernameError);
            usernameInput.focus();
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            showFieldError('passwordWrap', 'passwordError', passwordError);
            passwordInput.focus();
            return;
        }

        setButtonState(loginBtn, 'loading');

        // Simulate auth delay for UX
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (!dbReady) {
            // If DB not available, allow login (no password set)
            if (!appPassword) {
                setButtonState(loginBtn, 'success');
                await new Promise((r) => setTimeout(r, 600));
                redirectAfterLogin();
                return;
            }
        }

        if (appPassword && password !== appPassword) {
            setButtonState(loginBtn, '');
            showStatus('Invalid username or password.', 'error');
            passwordInput.value = '';
            passwordInput.focus();
            const wrap = $('passwordWrap');
            if (wrap) {
                wrap.classList.add('has-error');
                setTimeout(() => wrap.classList.remove('has-error'), 1500);
            }
            return;
        }

        // Success
        setButtonState(loginBtn, 'success');

        if (rememberMe.checked) {
            localStorage.setItem('aether-remember', '1');
        } else {
            localStorage.removeItem('aether-remember');
        }

        await new Promise((r) => setTimeout(r, 600));
        redirectAfterLogin();
    }

    function redirectAfterLogin() {
        sessionStorage.setItem('aether-unlocked', '1');
        window.location.href = 'index.html#home';
    }

    // ---- Forgot Password ----
    function openForgotModal() {
        forgotModal.classList.add('open');
        forgotModal.setAttribute('aria-hidden', 'false');
        resetPinInput.value = '';
        clearFieldError('pinWrap', 'pinError');
        setTimeout(() => resetPinInput.focus(), 100);
    }

    function closeForgotModalFn() {
        forgotModal.classList.remove('open');
        forgotModal.setAttribute('aria-hidden', 'true');
    }

    async function handleVerifyPin(e) {
        e.preventDefault();
        clearFieldError('pinWrap', 'pinError');

        const pin = (resetPinInput.value || '').replace(/\s/g, '').toUpperCase();
        if (!pin) {
            showFieldError('pinWrap', 'pinError', 'Please enter your reset PIN.');
            return;
        }

        setButtonState(verifyPinBtn, 'loading');
        await new Promise((r) => setTimeout(r, 600));

        if (pin !== (appResetPin || '').replace(/\s/g, '').toUpperCase()) {
            setButtonState(verifyPinBtn, '');
            showFieldError('pinWrap', 'pinError', 'Invalid reset PIN. Please try again.');
            resetPinInput.value = '';
            resetPinInput.focus();
            return;
        }

        setButtonState(verifyPinBtn, 'success');
        await new Promise((r) => setTimeout(r, 600));

        forgotModal.classList.remove('open');
        forgotModal.setAttribute('aria-hidden', 'true');
        openNewPassModal();
    }

    // ---- New Password ----
    function openNewPassModal() {
        newPassModal.classList.add('open');
        newPassModal.setAttribute('aria-hidden', 'false');
        newPassInput.value = '';
        confirmPassInput.value = '';
        clearFieldError('newPassWrap', 'newPassError');
        clearFieldError('confirmPassWrap', 'newPassError');
        setTimeout(() => newPassInput.focus(), 100);
    }

    function closeNewPassModalFn() {
        newPassModal.classList.remove('open');
        newPassModal.setAttribute('aria-hidden', 'true');
    }

    async function handleSavePassword(e) {
        e.preventDefault();
        clearFieldError('newPassWrap', 'newPassError');
        clearFieldError('confirmPassWrap', 'newPassError');

        const newPass = newPassInput.value.trim();
        const confirmPass = confirmPassInput.value.trim();

        if (!newPass || !confirmPass) {
            showFieldError('newPassWrap', 'newPassError', 'Fill in both fields.');
            return;
        }

        if (newPass.length < 8) {
            showFieldError('newPassWrap', 'newPassError', 'Password must be at least 8 characters.');
            return;
        }

        if (newPass !== confirmPass) {
            showFieldError('confirmPassWrap', 'newPassError', 'Passwords do not match.');
            confirmPassInput.value = '';
            confirmPassInput.focus();
            return;
        }

        setButtonState(savePassBtn, 'loading');
        await new Promise((r) => setTimeout(r, 600));

        // Save to DB
        try {
            if (typeof Dexie !== 'undefined') {
                const saveDb = new Dexie('AetherDB');
                saveDb.version(1).stores({ settings: 'key', meta: 'key' });

                let userId = 'u_legacy';
                try {
                    const metaRow = await saveDb.meta.get('currentUser');
                    if (metaRow && metaRow.value) userId = metaRow.value;
                } catch (e) { /* ignore */ }

                const prefixedKey = userId + ':main';
                const plainKey = 'main';
                let existing = await saveDb.settings.get(prefixedKey);
                if (!existing) existing = await saveDb.settings.get(plainKey);
                const useKey = existing && existing.key === prefixedKey ? prefixedKey : plainKey;

                const sv = (existing && existing.value) || {};
                sv.password = newPass;
                await saveDb.settings.put({ key: useKey, value: sv });
                appPassword = newPass;
            }
        } catch (e) { /* ignore */ }

        setButtonState(savePassBtn, 'success');
        await new Promise((r) => setTimeout(r, 800));

        newPassModal.classList.remove('open');
        newPassModal.setAttribute('aria-hidden', 'true');

        showStatus('Password reset successful. You can now sign in.', 'success');
        passwordInput.focus();
    }

    // ---- Clear errors on input ----
    usernameInput.addEventListener('input', () => clearFieldError('usernameWrap', 'usernameError'));
    passwordInput.addEventListener('input', () => clearFieldError('passwordWrap', 'passwordError'));
    resetPinInput.addEventListener('input', () => clearFieldError('pinWrap', 'pinError'));
    newPassInput.addEventListener('input', () => clearFieldError('newPassWrap', 'newPassError'));
    confirmPassInput.addEventListener('input', () => clearFieldError('confirmPassWrap', 'newPassError'));

    // ---- Event Listeners ----
    loginForm.addEventListener('submit', handleLogin);
    togglePassBtn.addEventListener('click', togglePasswordVisibility);
    forgotPasswordBtn.addEventListener('click', openForgotModal);
    closeForgotModal.addEventListener('click', closeForgotModalFn);
    forgotForm.addEventListener('submit', handleVerifyPin);
    closeNewPassModal.addEventListener('click', closeNewPassModalFn);
    newPassForm.addEventListener('submit', handleSavePassword);

    // Close modals on overlay click
    [forgotModal, newPassModal].forEach((modal) => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('open');
                modal.setAttribute('aria-hidden', 'true');
            }
        });
    });

    // Close modals on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (newPassModal.classList.contains('open')) {
                closeNewPassModalFn();
            } else if (forgotModal.classList.contains('open')) {
                closeForgotModalFn();
            }
        }
    });

    // ---- Init ----
    async function init() {
        initTheme();
        await loadCredentials();
        updateGreeting();

        // Check if password is set
        if (!appPassword) {
            // No password set — go straight to app
            redirectAfterLogin();
            return;
        }

        // Check remember me
        if (localStorage.getItem('aether-remember') === '1') {
            redirectAfterLogin();
            return;
        }

        usernameInput.focus();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
