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
