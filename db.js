// ============================================================
//  AETHER DB LAYER — IndexedDB via Dexie.js
//  Local data stored unencrypted, per-user prefixed keys
// ============================================================

const APP_DB_VERSION = '5.1.0';

const db = new Dexie('AetherDB');
db.version(1).stores({
    meta:           'key',
    grids:          'key',
    finance:        'key',
    notes:          'key',
    pictures:       'key',
    settings:       'key',
    statusSets:     'key',
    printHistory:   'key',
    recycleBin:     'key',
    categories:     'key',
    modules:        'key',
    credentials:    'key',
    activityLedger: 'key',
    calcRecords:    'key',
    ageRecords:     'key'
});

// ---- User context ----
let _currentUserId = null;

function _uk(originalKey) {
    if (!_currentUserId) return originalKey;
    return _currentUserId + ':' + originalKey;
}

function setCurrentUser(userId) {
    _currentUserId = userId;
}

function getCurrentUserId() {
    return _currentUserId;
}

function clearCurrentUser() {
    _currentUserId = null;
}

function generateUserId(email) {
    const lower = (email || '').toLowerCase().trim();
    let hash = 0;
    for (let i = 0; i < lower.length; i++) {
        hash = ((hash << 5) - hash + lower.charCodeAt(i)) | 0;
    }
    return 'u_' + Math.abs(hash).toString(36);
}

// ---- Migration from localStorage ----
async function migrateFromLocalStorage() {
    const alreadyMigrated = await db.meta.get('dataVersion');
    if (alreadyMigrated && alreadyMigrated.value === APP_DB_VERSION) return;

    const raw = localStorage.getItem('DTrackV9');
    let appData = null;
    try { appData = raw ? JSON.parse(raw) : null; } catch (e) { appData = null; }

    if (appData) {
        const uid = 'u_legacy';
        await db.transaction('rw',
            db.grids, db.finance, db.notes, db.pictures, db.settings,
            db.statusSets, db.printHistory, db.recycleBin, db.categories,
            db.modules, db.credentials, db.activityLedger, db.calcRecords,
            db.ageRecords, db.meta, async () => {

            await db.grids.put({ key: uid + ':main', value: appData.grids || {} });
            await db.finance.put({
                key: uid + ':main',
                value: {
                    ledgers: appData.ledgers || {},
                    totalExpense: appData.totalExpense || {},
                    budgets: appData.budgets || {},
                    budgetCats: appData.budgetCats || [],
                    budgetEnabled: appData.budgetEnabled || {},
                    moduleBudgets: appData.moduleBudgets || {}
                }
            });
            await db.notes.put({ key: uid + ':list', value: appData.notes || [] });
            await db.pictures.put({ key: uid + ':main', value: appData.pictures || [] });
            await db.settings.put({
                key: uid + ':main',
                value: {
                    settings: appData.settings || {},
                    lang: appData.lang || 'en',
                    currency: appData.currency || 'PKR',
                    theme: appData.theme || 'light',
                    ghost: appData.ghost || false,
                    profilePhoto: appData.profilePhoto || null
                }
            });
            await db.statusSets.put({
                key: uid + ':main',
                value: {
                    customStatusSets: appData.customStatusSets || {},
                    customStatusSetColors: appData.customStatusSetColors || {},
                    statusSetEnabled: appData.statusSetEnabled || {}
                }
            });
            await db.printHistory.put({ key: uid + ':main', value: appData.printHistory || [] });
            await db.recycleBin.put({ key: uid + ':main', value: appData.bin || [] });
            await db.categories.put({
                key: uid + ':main',
                value: {
                    cats: appData.cats || [],
                    categoryColors: appData.categoryColors || {},
                    categoryEnabled: appData.categoryEnabled || {}
                }
            });
            await db.modules.put({ key: uid + ':main', value: appData.modules || [] });
            if (appData.credentials) {
                const cEmail = (appData.credentials.email || appData.credentials.user || '').toLowerCase();
                await db.credentials.put({ key: cEmail, value: { ...appData.credentials, userId: uid } });
            }
            if (appData.activityLedger) {
                const months = Object.keys(appData.activityLedger);
                for (const mk of months) {
                    await db.activityLedger.put({ key: uid + ':' + mk, value: appData.activityLedger[mk] || [] });
                }
            }
        });
    }

    const noteDraftRaw = localStorage.getItem('noteDraft');
    if (noteDraftRaw) {
        try { await db.notes.put({ key: uid + ':draft', value: JSON.parse(noteDraftRaw) }); }
        catch (e) { /* ignore */ }
    }

    const calcRecordsRaw = localStorage.getItem('calcRecords');
    if (calcRecordsRaw) {
        try {
            const records = JSON.parse(calcRecordsRaw) || [];
            const seq = Number(localStorage.getItem('calcRecordSeq') || '0') || 0;
            await db.calcRecords.put({ key: uid + ':list', value: records });
            await db.calcRecords.put({ key: uid + ':seq', value: seq });
        } catch (e) { /* ignore */ }
    }

    const ageRecordsRaw = localStorage.getItem('ageRecords');
    if (ageRecordsRaw) {
        try {
            const records = JSON.parse(ageRecordsRaw) || [];
            const seq = Number(localStorage.getItem('ageRecordSeq') || '0') || 0;
            await db.ageRecords.put({ key: uid + ':list', value: records });
            await db.ageRecords.put({ key: uid + ':seq', value: seq });
        } catch (e) { /* ignore */ }
    }

    const ver = localStorage.getItem('app_version');
    if (ver) await db.meta.put({ key: 'app_version', value: ver });
    const uuid = localStorage.getItem('device_uuid');
    if (uuid) await db.meta.put({ key: 'device_uuid', value: uuid });

    await db.meta.put({ key: 'dataVersion', value: APP_DB_VERSION });

    ['DTrackV9', 'app_version', 'device_uuid', 'noteDraft',
     'calcRecords', 'calcRecordSeq', 'ageRecords', 'ageRecordSeq'
    ].forEach(k => localStorage.removeItem(k));
}

// ---- Encrypt/Decrypt helpers (no-op — local storage is unencrypted) ----
async function _enc(val) {
    return val;
}

async function _dec(val) {
    return val;
}

// ---- Full initialization: load everything for current user ----
async function dbFullInit() {
    if (!_currentUserId) return { app: {}, calcRecords: [], calcRecordSeq: 0, ageRecords: [], ageRecordSeq: 0, noteDraft: { title: '', content: '' } };

    const uid = _currentUserId;
    const [gridsRow, financeRow, notesRow, picturesRow, settingsRow,
          statusSetsRow, printHistoryRow, recycleBinRow, categoriesRow,
          modulesRow, calcList, calcSeq,
          ageList, ageSeq, noteDraftRow
    ] = await Promise.all([
        db.grids.get(_uk('main')),
        db.finance.get(_uk('main')),
        db.notes.get(_uk('list')),
        db.pictures.get(_uk('main')),
        db.settings.get(_uk('main')),
        db.statusSets.get(_uk('main')),
        db.printHistory.get(_uk('main')),
        db.recycleBin.get(_uk('main')),
        db.categories.get(_uk('main')),
        db.modules.get(_uk('main')),
        db.calcRecords.get(_uk('list')),
        db.calcRecords.get(_uk('seq')),
        db.ageRecords.get(_uk('list')),
        db.ageRecords.get(_uk('seq')),
        db.notes.get(_uk('draft'))
    ]);

    const activityRows = await db.activityLedger.toArray();
    const userActivityRows = activityRows.filter(r => r.key && r.key.startsWith(uid + ':'));
    const decrypted = await Promise.all(userActivityRows.map(r => _dec(r.value)));
    const activityLedger = {};
    for (let i = 0; i < userActivityRows.length; i++) {
        const mk = userActivityRows[i].key.substring(uid.length + 1);
        activityLedger[mk] = decrypted[i];
    }

    const fRaw = financeRow ? await _dec(financeRow.value) : {};
    const cRaw = categoriesRow ? await _dec(categoriesRow.value) : {};
    const ssRaw = statusSetsRow ? await _dec(statusSetsRow.value) : {};
    const sRaw = settingsRow ? await _dec(settingsRow.value) : {};
    const rawModules = await _dec(modulesRow ? modulesRow.value : []);

    const appData = {
        modules: Array.isArray(rawModules) ? rawModules : [],
        grids: await _dec(gridsRow ? gridsRow.value : {}),
        ledgers: (fRaw && fRaw.ledgers) || {},
        totalExpense: (fRaw && fRaw.totalExpense) || {},
        budgets: (fRaw && fRaw.budgets) || {},
        budgetCats: (fRaw && fRaw.budgetCats) || [],
        budgetEnabled: (fRaw && fRaw.budgetEnabled) || {},
        moduleBudgets: (fRaw && fRaw.moduleBudgets) || {},
        notes: await _dec(notesRow ? notesRow.value : []),
        pictures: await _dec(picturesRow ? picturesRow.value : []),
        settings: (sRaw && sRaw.settings) || {},
        lang: (sRaw && sRaw.lang) || 'en',
        currency: (sRaw && sRaw.currency) || 'PKR',
        theme: (sRaw && sRaw.theme) || 'light',
        ghost: (sRaw && sRaw.ghost) || false,
        profilePhoto: (sRaw && sRaw.profilePhoto) || null,
        password: (sRaw && sRaw.password) || '',
        resetPin: (sRaw && sRaw.resetPin) || '',
        memberSince: (sRaw && sRaw.memberSince) || '',
        lastLogin: (sRaw && sRaw.lastLogin) || '',
        customStatusSets: (ssRaw && ssRaw.customStatusSets) || {},
        customStatusSetColors: (ssRaw && ssRaw.customStatusSetColors) || {},
        statusSetEnabled: (ssRaw && ssRaw.statusSetEnabled) || {},
        printHistory: await _dec(printHistoryRow ? printHistoryRow.value : []),
        bin: await _dec(recycleBinRow ? recycleBinRow.value : []),
        cats: (cRaw && cRaw.cats) || [],
        categoryColors: (cRaw && cRaw.categoryColors) || {},
        categoryEnabled: (cRaw && cRaw.categoryEnabled) || {},
        credentials: null,
        activityLedger: activityLedger
    };

    return {
        app: appData,
        calcRecords: await _dec(calcList ? calcList.value : []),
        calcRecordSeq: calcSeq ? calcSeq.value : 0,
        ageRecords: await _dec(ageList ? ageList.value : []),
        ageRecordSeq: ageSeq ? ageSeq.value : 0,
        noteDraft: await _dec(noteDraftRow ? noteDraftRow.value : { title: '', content: '' })
    };
}

// ---- Individual Save Functions ----

async function dbSaveGrids(grids) {
    if (!_currentUserId) return;
    await db.grids.put({ key: _uk('main'), value: await _enc(grids) });
}

async function dbSaveFinance(financeData) {
    if (!_currentUserId) return;
    await db.finance.put({ key: _uk('main'), value: await _enc(financeData) });
}

async function dbSaveNotes(notes) {
    if (!_currentUserId) return;
    await db.notes.put({ key: _uk('list'), value: await _enc(notes) });
}

async function dbSaveNoteDraft(draft) {
    if (!_currentUserId) return;
    await db.notes.put({ key: _uk('draft'), value: await _enc(draft) });
}

async function dbClearNoteDraft() {
    if (!_currentUserId) return;
    await db.notes.delete(_uk('draft'));
}

async function dbSavePictures(pictures) {
    if (!_currentUserId) return;
    await db.pictures.put({ key: _uk('main'), value: await _enc(pictures) });
}

async function dbSaveSettings(settingsData) {
    if (!_currentUserId) return;
    await db.settings.put({ key: _uk('main'), value: await _enc(settingsData) });

    if (settingsData) {
        await db.meta.put({ key: 'pubSettings_' + _currentUserId, value: {
            lang: settingsData.lang || 'en',
            currency: settingsData.currency || 'PKR',
            theme: settingsData.theme || 'light',
            ghost: settingsData.ghost || false
        }});
    }
}

async function dbSaveStatusSets(statusSetsData) {
    if (!_currentUserId) return;
    await db.statusSets.put({ key: _uk('main'), value: await _enc(statusSetsData) });
}

async function dbSavePrintHistory(printHistory) {
    if (!_currentUserId) return;
    await db.printHistory.put({ key: _uk('main'), value: await _enc(printHistory) });
}

async function dbSaveRecycleBin(bin) {
    if (!_currentUserId) return;
    await db.recycleBin.put({ key: _uk('main'), value: await _enc(bin) });
}

async function dbSaveCategories(categoriesData) {
    if (!_currentUserId) return;
    await db.categories.put({ key: _uk('main'), value: await _enc(categoriesData) });
}

async function dbSaveModules(modules) {
    if (!_currentUserId) return;
    await db.modules.put({ key: _uk('main'), value: await _enc(modules) });
}

async function dbSaveActivityLedger(monthKey, entries) {
    if (!_currentUserId) return;
    await db.activityLedger.put({ key: _uk(monthKey), value: await _enc(entries) });
}

async function dbSaveCalcRecords(records, seq) {
    if (!_currentUserId) return;
    await db.calcRecords.put({ key: _uk('list'), value: await _enc(records) });
    await db.calcRecords.put({ key: _uk('seq'), value: seq });
}

async function dbSaveAgeRecords(records, seq) {
    if (!_currentUserId) return;
    await db.ageRecords.put({ key: _uk('list'), value: await _enc(records) });
    await db.ageRecords.put({ key: _uk('seq'), value: seq });
}

async function dbSaveMeta(key, value) {
    await db.meta.put({ key: key, value: value });
}

// ---- Save entire app state ----
async function dbSaveApp(appData) {
    if (!_currentUserId) return;
    const uid = _currentUserId;

    await db.transaction('rw',
        db.grids, db.finance, db.notes, db.pictures, db.settings,
        db.statusSets, db.printHistory, db.recycleBin, db.categories,
        db.modules, db.activityLedger, async () => {

        await db.grids.put({ key: uid + ':main', value: await _enc(appData.grids || {}) });

        await db.finance.put({
            key: uid + ':main',
            value: await _enc({
                ledgers: appData.ledgers || {},
                totalExpense: appData.totalExpense || {},
                budgets: appData.budgets || {},
                budgetCats: appData.budgetCats || [],
                budgetEnabled: appData.budgetEnabled || {},
                moduleBudgets: appData.moduleBudgets || {}
            })
        });

        await db.notes.put({ key: uid + ':list', value: await _enc(appData.notes || []) });
        await db.pictures.put({ key: uid + ':main', value: await _enc(appData.pictures || []) });

        await db.settings.put({
            key: uid + ':main',
            value: await _enc({
                settings: appData.settings || {},
                lang: appData.lang || 'en',
                currency: appData.currency || 'PKR',
                theme: appData.theme || 'light',
                ghost: appData.ghost || false,
                profilePhoto: appData.profilePhoto || null,
                password: appData.password || '',
                resetPin: appData.resetPin || '',
                memberSince: appData.memberSince || '',
                lastLogin: appData.lastLogin || ''
            })
        });

        await db.statusSets.put({
            key: uid + ':main',
            value: await _enc({
                customStatusSets: appData.customStatusSets || {},
                customStatusSetColors: appData.customStatusSetColors || {},
                statusSetEnabled: appData.statusSetEnabled || {}
            })
        });

        await db.printHistory.put({ key: uid + ':main', value: await _enc(appData.printHistory || []) });
        await db.recycleBin.put({ key: uid + ':main', value: await _enc(appData.bin || []) });

        await db.categories.put({
            key: uid + ':main',
            value: await _enc({
                cats: appData.cats || [],
                categoryColors: appData.categoryColors || {},
                categoryEnabled: appData.categoryEnabled || {}
            })
        });

        await db.modules.put({ key: uid + ':main', value: await _enc(appData.modules || []) });

        if (appData.activityLedger) {
            const months = Object.keys(appData.activityLedger);
            for (const mk of months) {
                await db.activityLedger.put({ key: uid + ':' + mk, value: await _enc(appData.activityLedger[mk] || []) });
            }
        }
    });

    if (uid) {
        await db.meta.put({ key: 'pubSettings_' + uid, value: {
            lang: appData.lang || 'en',
            currency: appData.currency || 'PKR',
            theme: appData.theme || 'light',
            ghost: appData.ghost || false
        }});
    }
}

// ---- Delete all data for a specific user ----
async function dbDeleteUser(userId) {
    const uid = userId;
    const allKeys = [
        uid + ':main', uid + ':list', uid + ':draft', uid + ':seq'
    ];
    const allTables = [db.grids, db.finance, db.notes, db.pictures, db.settings,
        db.statusSets, db.printHistory, db.recycleBin, db.categories,
        db.modules, db.calcRecords, db.ageRecords];

    for (const table of allTables) {
        await Promise.all(allKeys.map(k => table.delete(k).catch(() => {})));
    }

    const allActivity = await db.activityLedger.toArray();
    const userActivityKeys = allActivity.filter(r => r.key && r.key.startsWith(uid + ':')).map(r => r.key);
    if (userActivityKeys.length) {
        await Promise.all(userActivityKeys.map(k => db.activityLedger.delete(k).catch(() => {})));
    }

    const allCreds = await db.credentials.toArray();
    const userCredKeys = allCreds.filter(r => r.value && r.value.userId === uid).map(r => r.key);
    if (userCredKeys.length) {
        await Promise.all(userCredKeys.map(k => db.credentials.delete(k).catch(() => {})));
    }

    try { await db.meta.delete('pubSettings_' + uid); } catch (e) { /* ok */ }
}

// ---- Wipe everything ----
async function dbClearAll() {
    await db.transaction('rw',
        db.meta, db.grids, db.finance, db.notes, db.pictures, db.settings,
        db.statusSets, db.printHistory, db.recycleBin, db.categories,
        db.modules, db.credentials, db.activityLedger, db.calcRecords,
        db.ageRecords, async () => {
        await Promise.all([
            db.meta.clear(), db.grids.clear(), db.finance.clear(),
            db.notes.clear(), db.pictures.clear(), db.settings.clear(),
            db.statusSets.clear(), db.printHistory.clear(), db.recycleBin.clear(),
            db.categories.clear(), db.modules.clear(), db.credentials.clear(),
            db.activityLedger.clear(), db.calcRecords.clear(), db.ageRecords.clear()
        ]);
    });
}
