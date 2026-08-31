
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
