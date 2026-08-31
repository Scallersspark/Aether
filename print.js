// ============================================================
//  AETHER PRINT ENGINE v2.0
//  Unified A4 document generation system
//  - Layer A: CSS pagination for browser printing
//  - Layer B: JS pagination + per-page capture for jsPDF
//  Namespace: .ap-*  |  Standard: A4 portrait 794x1123 @96dpi
// ============================================================

'use strict';

const PRINT_CONFIG = {
    pageWidth: 794,
    pageHeight: 1123,
    marginTop: 34,
    marginBottom: 12,
    marginLeft: 38,
    marginRight: 38,
    headerHeight: 26,
    footerHeight: 30
};

const A4 = { width: 794, height: 1123 };
const AP_PAGE_CONTENT_H = PRINT_CONFIG.pageHeight - PRINT_CONFIG.marginTop -
    PRINT_CONFIG.marginBottom - PRINT_CONFIG.headerHeight - PRINT_CONFIG.footerHeight;

const AP_EST = {
    ttl: 96, kpi: 64, qrSec: 158, sec: 40, cardPad: 30, cardHead: 24,
    th: 24, tr: 21, weekHead: 20, monthTotal: 26, yrBlock: 78, budgCard: 108
};
const AP_ROWS_PER_PAGE = Math.max(10, Math.floor((AP_PAGE_CONTENT_H - AP_EST.cardPad - AP_EST.cardHead - AP_EST.th) / AP_EST.tr) - 2);

function _apEsc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function _apMoney(n) {
    if (typeof fmtMoney === 'function') { try { return fmtMoney(Number(n) || 0); } catch (e) {} }
    return 'Rs. ' + (Number(n) || 0).toLocaleString('en-US');
}
function _apMoneyNC(n) {
    if (typeof fmtMoneyNC === 'function') { try { return fmtMoneyNC(Number(n) || 0); } catch (e) {} }
    return (Number(n) || 0).toLocaleString('en-US');
}
function _apDate(d) {
    try { return new Date(d || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch (e) { return ''; }
}
function _apDateTime(d) {
    try { return new Date(d || Date.now()).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return ''; }
}

var _apeWatermark = '';
var _apeWmLoaded = false;
function _apeLoadWatermark() {
    if (_apeWmLoaded) return Promise.resolve();
    _apeWmLoaded = true;
    return new Promise(function (resolve) {
        var done = false;
        var finish = function () { if (!done) { done = true; resolve(); } };
        setTimeout(finish, 2500);
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'watermark.png?v=4', true);
        xhr.responseType = 'blob';
        xhr.onload = function () {
            if ((xhr.status === 200 || xhr.status === 0) && xhr.response) {
                var reader = new FileReader();
                reader.onload = function () { _apeWatermark = String(reader.result || ''); finish(); };
                reader.onerror = finish;
                try { reader.readAsDataURL(xhr.response); } catch (e) { finish(); }
            } else finish();
        };
        xhr.onerror = finish;
        try { xhr.send(); } catch (e) { finish(); }
    });
}

function _apeWaitFonts() {
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
        return Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 2000); })]);
    }
    return Promise.resolve();
}
function _apeWaitImages(root) {
    var imgs = Array.prototype.slice.call((root || document).querySelectorAll('img'));
    var jobs = imgs.map(function (img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function (r) {
            img.addEventListener('load', r, { once: true });
            img.addEventListener('error', r, { once: true });
            setTimeout(r, 6000);
        });
    });
    return Promise.all(jobs);
}

// ============================================================
//  UNIVERSAL PRINT CSS — AetherPrintCSS()
// ============================================================
function AetherPrintCSS() {
    const C = PRINT_CONFIG;
    return '<style>' +
    '@page{size:A4 portrait;margin:0;}' +
    '.ap-doc *,.ap-doc *::before,.ap-doc *::after{box-sizing:border-box;margin:0;padding:0;}' +
    '.ap-doc{width:794px;margin:0 auto;font-family:"Segoe UI",-apple-system,"Helvetica Neue",Arial,sans-serif;color:#0f172a;background:#fff;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact;direction:ltr;text-align:left;}' +
    '.ap-pg{width:794px;height:' + PRINT_CONFIG.pageHeight + 'px;padding:' + C.marginTop + 'px ' + C.marginRight + 'px ' + C.marginBottom + 'px ' + C.marginLeft + 'px;position:relative;overflow:hidden;page-break-after:always;break-after:page;display:flex;flex-direction:column;}' +
    '.ap-pg:last-child{page-break-after:auto;break-after:auto;}' +
    '.ap-pb{flex:1 1 auto;min-height:0;overflow:hidden;}' +
    '.ap-ph{height:' + C.headerHeight + 'px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #0f172a;margin-bottom:14px;flex:0 0 auto;}' +
    '.ap-ph-b{font-size:13px;font-weight:800;letter-spacing:3px;color:#0f172a;}' +
    '.ap-ph-t{font-size:9px;font-weight:700;letter-spacing:1px;color:#334155;text-transform:uppercase;}' +
    '.ap-ph-d{font-size:8px;color:#64748b;}' +
    '.ap-pf{flex:0 0 auto;height:' + C.footerHeight + 'px;border-top:1.5px solid #cbd5e1;padding-top:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;}' +
    '.ap-pf-credit{font-size:7.5px;color:#475569;text-align:center;white-space:nowrap;}' +
    '.ap-pf-page{font-size:7.5px;font-weight:700;color:#0f172a;text-align:center;}' +
    '.ap-break-before{break-before:page;page-break-before:always;}' +
    '.ap-keep{break-inside:avoid;page-break-inside:avoid;}' +
    '.ap-ttl{text-align:center;margin:6px 0 16px;break-inside:avoid;page-break-inside:avoid;}' +
    '.ap-ttl h1{font-size:21px;font-weight:800;letter-spacing:2.5px;color:#0f172a;}' +
    '.ap-ttl .ap-st{font-size:11px;font-weight:700;color:#1d4ed8;letter-spacing:1px;margin-top:3px;}' +
    '.ap-ttl .ap-sb{font-size:9px;color:#64748b;margin-top:2px;}' +
    '.ap-kpi{display:flex;gap:8px;margin-bottom:14px;break-inside:avoid;page-break-inside:avoid;}' +
    '.ap-kc{flex:1;border:1.5px solid #cbd5e1;border-top:3px solid #1d4ed8;border-radius:6px;padding:8px 10px;text-align:center;background:#f8fafc;min-width:0;}' +
    '.ap-kc.ap-accent{border-color:#94a3b8;border-top-color:#0f172a;background:#eef2ff;}' +
    '.ap-kl{font-size:7px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;}' +
    '.ap-kv{font-size:15px;font-weight:800;color:#0f172a;margin-top:3px;word-break:break-word;}' +
    '.ap-ks{font-size:7px;color:#94a3b8;margin-top:1px;}' +
    '.ap-sc{margin:0 0 12px;break-inside:avoid;page-break-inside:avoid;}' +
    '.ap-sh{display:flex;align-items:baseline;gap:8px;margin-bottom:8px;padding-bottom:5px;border-bottom:2px solid #0f172a;break-after:avoid;page-break-after:avoid;}' +
    '.ap-si{font-size:8px;font-weight:700;color:#1d4ed8;letter-spacing:.5px;}' +
    '.ap-sl{font-size:11.5px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:.8px;}' +
    '.ap-sd{font-size:8px;color:#64748b;}' +
    '.ap-cd{border:1.5px solid #cbd5e1;border-radius:8px;padding:11px 13px;margin-bottom:10px;background:#fff;break-inside:avoid;page-break-inside:avoid;overflow:hidden;}' +
    '.ap-cd.ap-split{break-inside:auto;page-break-inside:auto;}' +
    '.ap-cd-t{font-size:11.5px;font-weight:800;color:#0f172a;margin-bottom:3px;}' +
    '.ap-cd-s{font-size:8px;color:#64748b;margin-bottom:5px;}' +
    '.ap-cd-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px;}' +
    '.ap-cd-h .ap-cd-t{margin-bottom:0;}' +
    '.ap-cd-a{display:flex;justify-content:flex-end;margin-top:7px;padding-top:6px;border-top:1.5px solid #e2e8f0;}' +
    '.ap-tbl{width:100%;border-collapse:collapse;table-layout:fixed;}' +
    '.ap-tbl thead{display:table-header-group;}' +
    '.ap-tbl tfoot{display:table-footer-group;}' +
    '.ap-tbl th{font-size:7.5px;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:.5px;padding:5px 7px;background:#f1f5f9;border-bottom:1.5px solid #94a3b8;text-align:left;}' +
    '.ap-tbl td{font-size:8.5px;color:#0f172a;padding:5px 7px;border-bottom:1px solid #e2e8f0;vertical-align:top;word-wrap:break-word;}' +
    '.ap-tbl tr{break-inside:avoid !important;page-break-inside:avoid !important;}' +
    '.ap-tbl tbody tr:last-child td{border-bottom:none;}' +
    '.ap-tbl .ar{text-align:right;}' +
    '.ap-tbl .ab{font-weight:700;}' +
    '.ap-tbl tfoot td{font-weight:800;border-top:1.5px solid #94a3b8;border-bottom:none;background:#f8fafc;}' +
    '.ap-stl{display:inline-flex;align-items:center;gap:4px;font-size:7.5px;font-weight:600;padding:2px 8px;border-radius:20px;border:1px solid transparent;}' +
    '.ap-stl .dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}' +
    '.ap-stl.s-a{background:#ecfdf5;color:#047857;border-color:#a7f3d0;}.ap-stl.s-a .dot{background:#10b981;}' +
    '.ap-stl.s-p{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe;}.ap-stl.s-p .dot{background:#3b82f6;}' +
    '.ap-stl.s-c{background:#f0fdf4;color:#15803d;border-color:#bbf7d0;}.ap-stl.s-c .dot{background:#22c55e;}' +
    '.ap-stl.s-n{background:#f3f4f6;color:#6b7280;border-color:#e5e7eb;}.ap-stl.s-n .dot{background:#9ca3af;}' +
    '.ap-pill{display:inline-block;font-size:7.5px;font-weight:700;padding:2px 8px;margin:0 4px 4px 0;border-radius:20px;border:1px solid #cbd5e1;background:#f8fafc;color:#0f172a;}' +
    '.ap-qr-sec{margin:0 0 14px;padding:12px 14px;border:1.5px solid #cbd5e1;border-radius:8px;break-inside:avoid;page-break-inside:avoid;background:#f8fafc;}' +
    '.ap-qr-sec-tt{font-size:11px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;text-align:center;}' +
    '.ap-qr-sec-body{display:flex;align-items:center;gap:14px;}' +
    '.ap-qr-sec-img{width:78px;height:78px;border-radius:4px;background:#fff;flex-shrink:0;}' +
    '.ap-qr-sec-info{flex:1;text-align:left;}' +
    '.ap-qr-sec-info div{font-size:8.5px;color:#475569;margin-bottom:3px;line-height:1.45;}' +
    '.ap-qr-sec-info div:first-child{font-size:9.5px;color:#0f172a;font-weight:700;margin-bottom:5px;}' +
    '.ap-qr-sec-info div:last-child{margin-bottom:0;}' +
    '.ap-qr-sec-scan{font-size:7.5px;color:#94a3b8;font-style:italic;margin-top:8px;padding-top:6px;border-top:1px solid #e2e8f0;text-align:center;}' +
    '.ap-budg-card{margin:0 0 12px;padding:10px 14px;border:1.5px solid #cbd5e1;border-radius:8px;break-inside:avoid;page-break-inside:avoid;background:#f8fafc;}' +
    '.ap-budg-t{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:#64748b;margin-bottom:4px;}' +
    '.ap-budg-big{font-size:20px;font-weight:800;color:#0f172a;line-height:1;margin-bottom:8px;}' +
    '.ap-budg-row{display:flex;justify-content:space-between;font-size:9px;color:#334155;padding:3px 0;border-top:1px dashed #cbd5e1;}' +
    '.ap-budg-row .ap-budg-v{font-weight:700;color:#0f172a;}' +
    '.ap-row5-t{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:#64748b;margin:0 0 6px;}' +
    '.ap-row5{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:0 0 14px;break-inside:avoid;page-break-inside:avoid;}' +
    '.ap-dc{display:flex;justify-content:space-between;align-items:baseline;border:1px solid #e2e8f0;border-radius:4px;padding:5px 7px;gap:4px;background:#fff;}' +
    '.ap-dcat{font-size:7px;text-transform:uppercase;letter-spacing:.3px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.ap-dval{font-size:10px;font-weight:700;color:#0f172a;white-space:nowrap;}' +
    '.ap-dc-empty{grid-column:1/-1;justify-content:center;color:#94a3b8;font-size:9px;}' +
    '.ap-yr{margin-top:12px;padding:10px 14px;border:1.5px solid #0f172a;border-radius:8px;break-inside:avoid;page-break-inside:avoid;background:#f8fafc;}' +
    '.ap-yr-r{display:flex;justify-content:space-between;font-size:9px;font-weight:700;margin-bottom:3px;}' +
    '.ap-yr-r:last-child{margin-bottom:0;}' +
    '.ap-week{margin-bottom:10px;}' +
    '.ap-week-h{display:flex;justify-content:space-between;font-size:8px;font-weight:700;color:#64748b;margin-bottom:4px;}' +
    '.ap-month-total{display:flex;justify-content:flex-end;margin:6px 0;padding-top:6px;border-top:1.5px solid #e2e8f0;font-size:9px;font-weight:800;color:#1d4ed8;}' +
    '.ap-emp{text-align:center;padding:24px;font-size:10px;color:#94a3b8;font-style:italic;}' +
    '.ap-mh{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 12px;border:1px solid #cbd5e1;border-left:4px solid #1d4ed8;border-radius:6px;margin-bottom:12px;font-size:8px;font-weight:700;color:#0f172a;background:#f8fafc;break-inside:avoid;page-break-inside:avoid;}' +
    '.ap-mh-b{font-weight:800;letter-spacing:2px;color:#1d4ed8;}' +
    '.ap-gcd .ap-cd-h{margin-bottom:4px;}' +
    '.ap-gcd .ap-tbl th{font-size:6.5px;padding:3px 5px;}' +
    '.ap-gcd .ap-tbl td{font-size:7.5px;padding:3px 5px;}' +
    '</style>';
}

// ============================================================
//  AP HELPER OBJECT
// ============================================================
function AP() {
    var _u = {};

    _u.icon = function () {
        return '<svg class="ap-hd-ic" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:22px;height:22px;"><circle cx="25" cy="25" r="24" fill="#1d4ed8"/><circle cx="25" cy="25" r="8" fill="#fff"/><circle cx="25" cy="25" r="4" fill="#1d4ed8"/><ellipse cx="25" cy="25" rx="20" ry="7" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.7"/><ellipse cx="25" cy="25" rx="20" ry="7" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.5" transform="rotate(-25 25 25)"/><ellipse cx="25" cy="25" rx="20" ry="7" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.5" transform="rotate(25 25 25)"/></svg>';
    };

    _u.qr = function (d, s) {
        var u = 'https://api.qrserver.com/v1/create-qr-code/?size=' + (s || 120) + 'x' + (s || 120) + '&data=' + encodeURIComponent(d || '');
        return '<img src="' + u + '" crossorigin="anonymous" alt="QR" class="ap-qr-sec-img">';
    };

    _u.hdr = function () { return ''; };

    _u.ttl = function (t, sb, st) {
        return '<div class="ap-ttl"><h1>' + _apEsc(t) + '</h1>' +
            (sb ? '<div class="ap-st">' + _apEsc(sb) + '</div>' : '') +
            (st ? '<div class="ap-sb">' + _apEsc(st) + '</div>' : '') + '</div>';
    };

    _u.md = function (a) {
        var h = '';
        (a || []).forEach(function (i) { h += '<span>' + _apEsc(i) + '</span>'; });
        return h;
    };

    _u.kpi = function (ks, ac) {
        var h = '';
        (ks || []).forEach(function (k) {
            h += '<div class="ap-kc' + (ac && k.accent ? ' ap-accent' : '') + '"><div class="ap-kl">' + _apEsc(k.label) +
                '</div><div class="ap-kv">' + k.value + '</div>' + (k.sub ? '<div class="ap-ks">' + k.sub + '</div>' : '') + '</div>';
        });
        return '<div class="ap-kpi">' + h + '</div>';
    };

    _u.sec = function (n, lb, sd) {
        var nStr = n < 10 ? '0' + n : '' + n;
        return '<div class="ap-sc"><div class="ap-sh"><span class="ap-si">' + nStr + '</span><span class="ap-sl">' + _apEsc(lb) + '</span>' +
            (sd ? '<span class="ap-sd">' + _apEsc(sd) + '</span>' : '') + '</div></div>';
    };

    _u.tbl = function (hd, rb, footRows) {
        hd = hd || []; rb = rb || [];
        var w = Math.max(1, Math.floor(100 / hd.length));
        var h = '<table class="ap-tbl"><thead><tr>';
        hd.forEach(function (c) { h += '<th' + (c.r ? ' class="ar"' : '') + '>' + c.t + '</th>'; });
        h += '</tr></thead><tbody>';
        if (!rb.length) {
            h += '<tr><td colspan="' + hd.length + '" style="text-align:center;color:#94a3b8;font-style:italic;">No records available for this report.</td></tr>';
        }
        rb.forEach(function (row) {
            h += '<tr>';
            row.forEach(function (c, i) {
                var cls = '';
                if (hd[i] && hd[i].r) cls += ' ar';
                if (c.b) cls += ' ab';
                if (c.c) cls += ' ' + c.c;
                h += '<td class="' + cls.trim() + '">' + (c.t === undefined || c.t === null ? '' : c.t) + '</td>';
            });
            h += '</tr>';
        });
        h += '</tbody>';
        if (footRows && footRows.length) {
            h += '<tfoot>';
            footRows.forEach(function (fr) {
                h += '<tr>';
                fr.forEach(function (c, i) {
                    h += '<td' + ((hd[i] && hd[i].r) ? ' class="ar"' : '') + '>' + (c.t === undefined ? '' : c.t) + '</td>';
                });
                h += '</tr>';
            });
            h += '</tfoot>';
        }
        h += '</table>';
        return h;
    };

    _u.cd = function (body, cls) { return '<div class="ap-cd' + (cls ? ' ' + cls : '') + '">' + body + '</div>'; };
    _u.cdT = function (t) { return '<div class="ap-cd-t">' + t + '</div>'; };
    _u.cdS = function (t) { return '<div class="ap-cd-s">' + t + '</div>'; };
    _u.cdH = function (title, status) {
        return '<div class="ap-cd-h"><div class="ap-cd-t">' + title + '</div><div>' + (status || '') + '</div></div>';
    };

    _u.st = function (st) {
        var m = { 'Active': 's-a', 'Present': 's-a', 'Completed': 's-c', 'Pending': 's-p', 'No Status': 's-n', 'Absent': 's-n', 'Leave': 's-n' };
        var v = st === undefined || st === null ? '' : String(st);
        var c = m[v] || 's-n';
        return '<span class="ap-stl ' + c + '"><span class="dot"></span>' + _apEsc(v) + '</span>';
    };

    _u.badge = function (label, count, color) {
        return '<span class="ap-pill"' + (color ? ' style="border-color:' + color + ';"' : '') + '>' + _apEsc(label) + ' ' + (count === undefined ? '' : count) + '</span>';
    };

    _u.qrSec = function (qrData, label, docType, qrSize, modCount, catCount) {
        var qrImg = _u.qr(qrData, qrSize || 120);
        var notes = [
            'Generated: ' + _apDateTime(),
            'Document Type: ' + _apEsc(docType || 'Report'),
            'Modules Covered: ' + (modCount === undefined ? 'N/A' : modCount),
            'Categories Used: ' + (catCount === undefined ? 'N/A' : catCount),
            'Status: Authentic — Signed by Aether'
        ];
        var noteHtml = notes.map(function (n) { return '<div>' + n + '</div>'; }).join('');
        return '<div class="ap-qr-sec"><div class="ap-qr-sec-tt">' + _apEsc(label || 'DOCUMENT VERIFICATION') +
            '</div><div class="ap-qr-sec-body"><div class="ap-qr-sec-info">' + noteHtml + '</div>' + qrImg +
            '</div><div class="ap-qr-sec-scan">Scan the QR code to verify this document&#39;s authenticity and origin.</div></div>';
    };

    _u.ftCredit = function () {
        return 'Generated on ' + _apDate() + ' | Designed and engineered by Tabeer Ahmad - Advanced Tracking Technologies | Copyright © ' +
            new Date().getFullYear() + ' AETHER.';
    };

    _u.ft = function () {
        return '<div class="ap-pf"><div class="ap-pf-credit">' + _u.ftCredit() + '</div><div class="ap-pf-page"></div></div>';
    };

    _u.gd = function (d) { return _apDate(d); };
    _u.gdt = function (d) { return _apDateTime(d); };
    _u.money = function (n) { return _apMoney(n); };
    _u.escape = function (s) { return _apEsc(s); };
    _u.date = function (d) { return _apDate(d); };

    _u.wrap = function (css, body) { return '<div class="ap-doc">' + css + body + '</div>'; };

    return _u;
}
var AP = AP();

// ============================================================
//  PAGE ASSEMBLY + PAGINATION ENGINE
// ============================================================
function _apPageShell(docTitle, bodyHtml, pageNum, totalPages) {
    var credit = AP.ftCredit() + (totalPages > 0 ? ' | Page ' + pageNum + ' of ' + totalPages : '');
    return '<div class="ap-pg">' +
        '<div class="ap-ph">' + AP.icon() +
        '<span class="ap-ph-b">AETHER</span>' +
        '<span class="ap-ph-t">' + _apEsc(docTitle) + '</span>' +
        '<span class="ap-ph-d">' + _apDate() + '</span></div>' +
        '<div class="ap-pb">' + bodyHtml + '</div>' +
        '<div class="ap-pf"><div class="ap-pf-credit">' + credit + '</div></div>' +
        '</div>';
}

function _apAssemble(docTitle, pagesBody) {
    var n = pagesBody.length;
    return '<div class="ap-doc">' + AetherPrintCSS() +
        pagesBody.map(function (b, i) { return _apPageShell(docTitle, b, i + 1, n); }).join('') +
        '</div>';
}

// blocks: [{h: html, e: estimatedPx}]
function _apPaginateBlocks(blocks, docTitle) {
    var pages = [];
    var cur = '';
    var curH = 0;
    blocks.forEach(function (b) {
        var eh = b.e || 0;
        if (curH > 0 && curH + eh > AP_PAGE_CONTENT_H) {
            pages.push(cur);
            cur = b.h;
            curH = eh;
        } else {
            cur += b.h;
            curH += eh;
        }
    });
    if (cur.length > 0 || pages.length === 0) pages.push(cur);
    return _apAssemble(docTitle, pages);
}

// split rows into per-page table cards with repeated headers
function _apTablePages(head, rows, opts) {
    opts = opts || {};
    var perPage = opts.rowsPerPage || AP_ROWS_PER_PAGE;
    var cardCls = opts.cardCls || 'ap-split';
    var titleHtml = opts.titleHtml || '';
    var footRows = opts.footRows || null;
    var pages = [];
    if (!rows.length) {
        var emptyEst = AP_EST.cardPad + AP_EST.th + 30 + (titleHtml ? AP_EST.cardHead : 0);
        pages.push({ h: AP.cd(titleHtml + AP.tbl(head, []), cardCls), e: emptyEst, forceOwn: false });
        return pages;
    }
    var start = 0, part = 1, totalParts = Math.ceil(rows.length / perPage);
    while (start < rows.length) {
        var chunk = rows.slice(start, start + perPage);
        var contNote = part > 1 ? '<div class="ap-cd-s">Continued — part ' + part + ' of ' + totalParts + '</div>' : '';
        var t = titleHtml + contNote + AP.tbl(head, chunk);
        pages.push({ h: AP.cd(t, cardCls), e: AP_EST.cardPad + AP_EST.th + chunk.length * AP_EST.tr + (titleHtml ? AP_EST.cardHead : 0) + 14 + (contNote ? 12 : 0), forceOwn: false });
        start += perPage;
        part++;
        if (footRows && start >= rows.length) { /* last page carries footer rows via tbl */ }
    }
    return pages;
}

// ============================================================
//  DELIVERY: browser print + PDF export
// ============================================================
function deliverPrint(content, filename, name, type, ref, mode, docId) {
    try { addPrintHistory(name, type, ref, docId); } catch (e) {}

    if (mode === 'print') {
        var win = window.open('', '_blank');
        if (!win) { if (typeof showToast === 'function') showToast('Popup blocked. Allow popups to print.', 'error'); return false; }
        var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + _apEsc(name || filename) + '</title></head><body>' +
            content + '</body></html>';
        win.document.open();
        win.document.write(html);
        win.document.close();
        var printWin = win;
        printWin.onload = function () {};
        setTimeout(function () {
            var doc = printWin.document;
            function go() {
                try { doc.fonts && doc.fonts.ready && doc.fonts.ready.then(function () { printWin.focus(); printWin.print(); }); } catch (e) { printWin.focus(); printWin.print(); }
            }
            var imgs = Array.prototype.slice.call(doc.querySelectorAll('img'));
            var pending = imgs.filter(function (im) { return !im.complete; }).length;
            function dec() { pending--; if (pending <= 0) go(); }
            if (pending <= 0) go();
            else imgs.forEach(function (im) { im.addEventListener('load', dec, { once: true }); im.addEventListener('error', dec, { once: true }); });
            setTimeout(function () { try { go(); } catch (e) {} }, 9000);
        }, 250);
        return true;
    }

    // ---- PDF export ----
    if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
        if (typeof showToast === 'function') showToast('PDF libraries not loaded yet. Try again in a moment.', 'error');
        return false;
    }

    _apeLoadWatermark();

    var container = document.createElement('div');
    container.id = 'aetherPrintRoot';
    container.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;z-index:-1;';
    container.innerHTML = content;
    document.body.appendChild(container);

    var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    var scale = mobile ? 1.5 : 2;

    return _apeWaitFonts()
        .then(function () { return _apeWaitImages(container); })
        .then(function () {
            var pageBlocks = Array.prototype.slice.call(container.querySelectorAll('.ap-pg'));
            if (!pageBlocks.length) pageBlocks = [container];
            var jobs = pageBlocks.map(function (pg) {
                return html2canvas(pg, {
                    scale: scale, useCORS: true, logging: false, allowTaint: true,
                    width: PRINT_CONFIG.pageWidth, windowWidth: PRINT_CONFIG.pageWidth,
                    backgroundColor: '#ffffff'
                });
            });
            return Promise.all(jobs).then(function (canvases) {
                var jsPDFCtor = window.jspdf.jsPDF;
                var pdf = new jsPDFCtor({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
                var pw = pdf.internal.pageSize.getWidth();
                var ph = pdf.internal.pageSize.getHeight();
                canvases.forEach(function (canvas, idx) {
                    if (idx > 0) pdf.addPage();
                    var imgData = canvas.toDataURL('image/jpeg', 0.95);
                    var imgW = pw - 12;
                    var imgH = (canvas.height * imgW) / canvas.width;
                    if (imgH > ph - 12) { imgH = ph - 12; imgW = (canvas.width * imgH) / canvas.height; }
                    pdf.addImage(imgData, 'JPEG', (pw - imgW) / 2, (ph - imgH) / 2, imgW, imgH, undefined, 'FAST');
                    canvas.width = 0; canvas.height = 0;
                });
                var total = pdf.internal.getNumberOfPages();
                for (var i = 1; i <= total; i++) {
                    pdf.setPage(i);
                    if (_apeWatermark) {
                        try {
                            pdf.setGState(new pdf.GState({ opacity: 0.08 }));
                            pdf.addImage(_apeWatermark, 'PNG', 0, 0, pw, ph, undefined, 'FAST');
                            pdf.setGState(new pdf.GState({ opacity: 1 }));
                        } catch (e) {}
                    }
                }
                pdf.save(filename);
                if (docId && typeof _storePdfBlob === 'function') {
                    try { _storePdfBlob(docId, pdf.output('blob'), filename); } catch (e) {}
                }
                if (container.parentNode) container.parentNode.removeChild(container);
                return true;
            });
        })
        .catch(function () {
            if (container.parentNode) container.parentNode.removeChild(container);
            if (typeof showToast === 'function') showToast('Could not generate the PDF.', 'error');
            return false;
        });
}

// ============================================================
//  DATA COLLECTORS (reuse existing Aether business logic)
// ============================================================
function _apeFinEntries(mod) {
    let entries = app.ledgers[mod.id] || [];
    const dObj = new Date(mod.start || currentRenderDateStr);
    if (!isNaN(dObj.getTime())) {
        entries = entries.filter(l => { const d = new Date(l.d); return d.getMonth() === dObj.getMonth() && d.getFullYear() === dObj.getFullYear(); });
    }
    return entries;
}

function _apeLedgerRows(entries, startIdx) {
    return entries.map((l, i) => ({
        row: [{ t: '' + (startIdx + i + 1) }, { t: _apEsc(l.i) }, { t: _apEsc(l.d) }, { t: _apEsc(l.c) }, { t: _apMoney(entryTotal(l)), r: true }],
        amt: entryTotal(l)
    }));
}

function _apeBudgetCard(totalBudget, totalExpense) {
    const remaining = totalBudget > 0 ? (totalBudget - totalExpense) : 0;
    const rows = [
        ['Total Expenditure', _apMoney(totalExpense)],
        ['Remaining', totalBudget > 0 ? _apMoney(remaining) : '—']
    ];
    const body = rows.map(r => '<div class="ap-budg-row"><span>' + r[0] + '</span><span class="ap-budg-v">' + r[1] + '</span></div>').join('');
    return '<div class="ap-budg-card"><div class="ap-budg-t">Total Budget</div><div class="ap-budg-big">' +
        (totalBudget > 0 ? _apMoney(totalBudget) : '—') + '</div>' + body + '</div>';
}

function _apeDistGrid(catSums, cats) {
    let cells = (cats || []).map(c => '<div class="ap-dc"><span class="ap-dcat">' + _apEsc(c) + '</span><span class="ap-dval">' + _apMoney(catSums[c] || 0) + '</span></div>').join('');
    if (!cells) cells = '<div class="ap-dc ap-dc-empty">No categories</div>';
    return '<div class="ap-row5-t">Category Distribution</div><div class="ap-row5">' + cells + '</div>';
}

function _apeGridCard(mod) {
    const stat = app.grids[mod.id + '_stat'] || 'No Status';
    const counts = {};
    mod.states.forEach(s => counts[s] = 0);
    const gridData = app.grids[mod.id] || [];
    for (let i = 0; i < 31; i++) { const st = gridData[i] || 'Pending'; counts[st] = (counts[st] || 0) + 1; }
    let gTotal = 0; mod.states.forEach(s => gTotal += (counts[s] || 0));
    const rows = mod.states.map(s => {
        const c = counts[s] || 0;
        const pct = gTotal > 0 ? Math.round((c / gTotal) * 100) : 0;
        return [{ t: _apEsc(s) }, { t: c + ' (' + pct + '%)', r: true }];
    });
    const head = AP.cdH(_apEsc(mod.title), AP.st(stat) + ' <span style="font-size:7px;color:#64748b;">Start: ' + _apEsc(mod.start || 'N/A') + '</span>');
    return AP.cd(head + AP.tbl([{ t: 'State' }, { t: 'Frequency', r: true }], rows), 'ap-gcd');
}

function _apeMonthName(mStr) {
    if (typeof getMonthNameFromKey === 'function' && mStr) { try { return getMonthNameFromKey(mStr); } catch (e) {} }
    return mStr || '';
}

// ============================================================
//  GLOBAL SYSTEM ARCHIVE — buildGlobalArchiveHTML
// ============================================================
function buildGlobalArchiveHTML(mStr, docId) {
    mStr = mStr || (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'));
    docId = docId || '';

    let tBudg = 0;
    app.budgetCats.forEach(b => { tBudg += parseCommaNum(app.budgets[b]); });
    Object.values(app.moduleBudgets || {}).forEach(v => { tBudg += Number(v) || 0; });
    tBudg = Math.min(tBudg, MAX_INPUT_VALUE);

    let tExp = 0;
    const finModules = [], gridModules = [];
    const catSumsAll = {}; app.cats.forEach(c => catSumsAll[c] = 0);

    app.modules.filter(m => m.active).forEach(mod => {
        if (mod.format === 'ledger') {
            let modTotal = 0;
            const stat = app.ledgers[mod.id + '_stat'] || 'No Status';
            let entries = _apeFinEntries(mod);
            entries.sort((a, b) => new Date(b.d) - new Date(a.d));
            entries.forEach(l => { modTotal += entryTotal(l); catSumsAll[l.c] += entryTotal(l); });
            tExp = Math.min(tExp + modTotal, MAX_INPUT_VALUE);
            finModules.push({ mod: mod, total: modTotal, stat: stat, entries: entries, monthLabel: getMonthShortFromDate(mod.start) || 'All' });
        } else if (mod.format === 'grid') {
            gridModules.push(mod);
        }
    });

    const monthName = _apeMonthName(mStr);
    const blocks = [];

    // Page 1 prelude: title, QR, KPIs, budget, distribution
    const kpis = AP.kpi([
        { label: 'Total Budget', value: _apMoney(tBudg), accent: true },
        { label: 'Total Expenditure', value: _apMoney(tExp), accent: true },
        { label: 'Remaining', value: _apMoney(Math.max(0, tBudg - tExp)) },
        { label: 'Utilization', value: (tBudg > 0 ? Math.min(100, Math.round((tExp / tBudg) * 100)) : 0) + '%' }
    ], true);
    const qrSec = AP.qrSec(_getDocUrl(docId, 'Global_System_Archive'), 'DOCUMENT VERIFICATION', 'Global Archive', undefined, finModules.length + gridModules.length, app.cats.length);
    const summaryBlock = '<div class="ap-yr"><div class="ap-yr-r"><span>Total Budget</span><span style="color:#1d4ed8;">' + _apMoney(tBudg) + '</span></div>' +
        '<div class="ap-yr-r"><span>Total Expenditure</span><span style="color:#dc2626;">' + _apMoney(tExp) + '</span></div>' +
        '<div class="ap-yr-r"><span>Net Balance</span><span style="color:#059669;">' + _apMoney(Math.max(0, tBudg - tExp)) + '</span></div></div>';

    blocks.push({ h: AP.ttl('GLOBAL ARCHIVE', monthName, 'Generated by Aether'), e: AP_EST.ttl });
    blocks.push({ h: qrSec, e: AP_EST.qrSec });
    blocks.push({ h: kpis, e: AP_EST.kpi });
    blocks.push({ h: _apeBudgetCard(tBudg, tExp), e: AP_EST.budgCard });
    blocks.push({ h: _apeDistGrid(catSumsAll, app.cats), e: 40 + app.cats.length * 22 });

    let secN = 1;

    // Finance sections
    finModules.forEach(fm => {
        blocks.push({ h: AP.sec(secN++, 'FINANCE — ' + fm.mod.title, fm.monthLabel + ' · ' + fm.entries.length + ' entries'), e: AP_EST.sec, keepNext: true });
        const allRows = _apeLedgerRows(fm.entries, 0);
        let runIdx = 0;
        while (runIdx < Math.max(allRows.length, 1) && allRows.length > 0) {
            const chunkRows = allRows.slice(runIdx, runIdx + AP_ROWS_PER_PAGE);
            const chunkSum = chunkRows.reduce((s, r) => s + r.amt, 0);
            const foot = [[{ t: 'Subtotal' }, { t: '' }, { t: '' }, { t: '' }, { t: _apMoney(chunkSum), r: true }]];
            blocks.push({ h: AP.cd(AP.tbl([{ t: '#' }, { t: 'Item' }, { t: 'Date' }, { t: 'Category' }, { t: 'Amount', r: true }], chunkRows.map(r => r.row), foot)), e: AP_EST.cardPad + chunkRows.length * AP_EST.tr + AP_EST.th + 30 });
            runIdx += AP_ROWS_PER_PAGE;
        }
        if (allRows.length === 0) blocks.push({ h: AP.cd(AP.tbl([{ t: '#' }, { t: 'Item' }, { t: 'Date' }, { t: 'Category' }, { t: 'Amount', r: true }], [])), e: 70 });
        blocks.push({ h: '<div class="ap-month-total">Module Total (' + _apEsc(fm.mod.title) + '): ' + _apMoney(fm.total) + '</div>', e: AP_EST.monthTotal });
    });

    // Grid sections
    if (gridModules.length > 0) {
        blocks.push({ h: AP.sec(secN++, 'GRIDS', gridModules.length + ' modules · tracking overview'), e: AP_EST.sec, keepNext: true });
        for (let i = 0; i < gridModules.length; i += 2) {
            const pair = _apeGridCard(gridModules[i]) + (gridModules[i + 1] ? _apeGridCard(gridModules[i + 1]) : '');
            blocks.push({ h: '<div class="ap-kpi" style="margin-bottom:10px;">' + pair + '</div>', e: 150 });
        }
    }

    if (blocks.length <= 5) blocks.push({ h: '<div class="ap-emp">No records available for this report.</div>', e: 60 });

    // paginate manually with first-page prelude kept together-ish
    const pages = [];
    let cur = '', curH = 0;
    blocks.forEach(function (b) {
        const eh = b.e || 0;
        if (curH > 0 && curH + eh > AP_PAGE_CONTENT_H) {
            pages.push(cur);
            cur = (b.keepNext ? b.h : b.h);
            curH = eh;
        } else {
            cur += b.h;
            curH += eh;
        }
    });
    pages.push(cur);

    // append grand summary on last page if space is tight it flows naturally
    pages[pages.length - 1] += summaryBlock;

    return _apAssemble('Global System Archive', pages);
}

// ============================================================
//  FINANCE ARCHIVE — execFinPrint builder (single + global)
// ============================================================
function buildFinanceArchiveHTML(modId, docId) {
    docId = docId || '';
    const isGlobal = (modId === 'all');
    const monthLabel = getMonthShortFromDate(isGlobal ? null : (app.modules.find(x => x.id === modId) || {}).start) || 'All';

    let totalBudget = 0, totalAll = 0;
    const catSumsAll = {}; app.cats.forEach(c => catSumsAll[c] = 0);
    const finModules = [];

    const ledgerMods = app.modules.filter(m => m.active && m.format === 'ledger' && (isGlobal || m.id === modId));
    ledgerMods.forEach(lm => {
        const sums = {}; app.cats.forEach(c => sums[c] = 0);
        let modTotal = 0;
        const entries = _apeFinEntries(lm);
        entries.forEach(l => { sums[l.c] += entryTotal(l); modTotal += entryTotal(l); });
        totalAll += modTotal;
        totalBudget += parseCommaNum((app.moduleBudgets && app.moduleBudgets[lm.id]) || 0);
        app.cats.forEach(c => catSumsAll[c] += sums[c]);
        finModules.push({ mod: lm, total: modTotal, stat: app.ledgers[lm.id + '_stat'] || 'No Status', entries: entries, monthLabel: getMonthShortFromDate(lm.start) || 'All' });
    });
    totalAll = Math.min(totalAll, MAX_INPUT_VALUE);

    const title = isGlobal ? 'GLOBAL FINANCE ARCHIVE' : 'FINANCE ARCHIVE';
    const docName = isGlobal ? 'Global Finance Archive' : ((ledgerMods[0] ? ledgerMods[0].title : 'Finance') + ' Archive');
    const blocks = [];

    const firstMod = ledgerMods[0];
    const kpis = AP.kpi([
        { label: 'Total Disbursed', value: _apMoney(totalAll), accent: true },
        { label: 'Transactions', value: '' + finModules.reduce((s, fm) => s + fm.entries.length, 0) },
        { label: 'Budget', value: totalBudget > 0 ? _apMoney(totalBudget) : '—' },
        { label: 'Utilization', value: totalBudget > 0 ? Math.min(100, Math.round((totalAll / totalBudget) * 100)) + '%' : '—' }
    ], true);
    blocks.push({ h: AP.ttl(title, monthLabel, isGlobal ? 'All finance modules' : undefined), e: AP_EST.ttl });
    blocks.push({ h: AP.qrSec(_getDocUrl(docId, docName.replace(/\s+/g, '_')), 'DOCUMENT VERIFICATION', title + (firstMod ? ' — ' + firstMod.title : ''), undefined, finModules.length, app.cats.length), e: AP_EST.qrSec });
    blocks.push({ h: kpis, e: AP_EST.kpi });
    if (totalBudget > 0) blocks.push({ h: _apeBudgetCard(totalBudget, totalAll), e: AP_EST.budgCard });
    blocks.push({ h: _apeDistGrid(catSumsAll, app.cats), e: 40 + app.cats.length * 22 });

    let secN = 1;
    finModules.forEach(fm => {
        blocks.push({ h: AP.sec(secN++, 'LEDGER — ' + fm.mod.title, fm.monthLabel + ' · ' + fm.entries.length + ' entries'), e: AP_EST.sec, keepNext: true });
        if (fm.entries.length === 0) {
            blocks.push({ h: AP.cd(AP.tbl([{ t: '#' }, { t: 'Item' }, { t: 'Date' }, { t: 'Category' }, { t: 'Amount', r: true }], [])), e: 70 });
            return;
        }
        const allRows = _apeLedgerRows(fm.entries, 0);
        let runIdx = 0;
        while (runIdx < allRows.length) {
            const chunkRows = allRows.slice(runIdx, runIdx + AP_ROWS_PER_PAGE);
            const chunkSum = chunkRows.reduce((s, r) => s + r.amt, 0);
            const foot = [[{ t: 'Subtotal' }, { t: '' }, { t: '' }, { t: '' }, { t: _apMoney(chunkSum), r: true }]];
            blocks.push({
                h: AP.cd(AP.tbl(
                    [{ t: '#' }, { t: 'Item' }, { t: 'Date' }, { t: 'Category' }, { t: 'Qty', r: true }, { t: 'Price', r: true }, { t: 'Amount', r: true }],
                    chunkRows.map(r => r.row),
                    foot
                )),
                e: AP_EST.cardPad + chunkRows.length * AP_EST.tr + AP_EST.th + 30
            });
            runIdx += AP_ROWS_PER_PAGE;
        }
        blocks.push({ h: '<div class="ap-month-total">Module Total (' + _apEsc(fm.mod.title) + '): ' + _apMoney(fm.total) + '</div>', e: AP_EST.monthTotal });
    });

    if (!finModules.length) blocks.push({ h: '<div class="ap-emp">No records available for this report.</div>', e: 60 });

    // assemble with per-module totals; grand total appended to last page
    const pages = [];
    let cur = '', curH = 0;
    blocks.forEach(function (b) {
        const eh = b.e || 0;
        if (curH > 0 && curH + eh > AP_PAGE_CONTENT_H) { pages.push(cur); cur = b.h; curH = eh; }
        else { cur += b.h; curH += eh; }
    });
    pages.push(cur);

    if (isGlobal) {
        pages[pages.length - 1] += '<div class="ap-yr"><div class="ap-yr-r"><span>Total Disbursed</span><span style="color:#dc2626;">' + _apMoney(totalAll) + '</span></div>' +
            '<div class="ap-yr-r"><span>Remaining Balance</span><span style="color:#059669;">' + _apMoney(Math.max(0, totalBudget - totalAll)) + '</span></div></div>';
    } else {
        pages[pages.length - 1] += '<div class="ap-yr"><div class="ap-yr-r"><span>Total Expenditure</span><span style="color:#dc2626;">' + _apMoney(totalAll) + '</span></div></div>';
    }

    return _apAssemble(docName, pages);
}

// ============================================================
//  GRIDS ARCHIVE — execGridPrint builder (single + global)
// ============================================================
function buildGridArchiveHTML(modId, docId) {
    docId = docId || '';
    const isGlobal = (modId === 'all');
    const mods = app.modules.filter(m => m.active && m.format === 'grid' && (isGlobal || m.id === modId));
    const firstMod = mods[0];
    const monthLabel = firstMod ? (getMonthShortFromDate(firstMod.start) || 'All') : 'All';
    const title = isGlobal ? 'GLOBAL GRIDS ARCHIVE' : 'GRID ARCHIVE';
    const docName = isGlobal ? 'Global Grids Archive' : ((firstMod ? firstMod.title : 'Grid') + ' Archive');

    const blocks = [];
    let totalFreq = 0;

    mods.forEach(gm => {
        const gridData = app.grids[gm.id] || [];
        const counts = {};
        gm.states.forEach(s => counts[s] = 0);
        for (let i = 0; i < 31; i++) { const st = gridData[i] || 'Pending'; counts[st] = (counts[st] || 0) + 1; }
        let mTotal = 0; gm.states.forEach(s => mTotal += (counts[s] || 0));
        totalFreq += mTotal;
    });

    blocks.push({ h: AP.ttl(title, monthLabel, isGlobal ? 'All grid modules' : undefined), e: AP_EST.ttl });
    blocks.push({ h: AP.qrSec(_getDocUrl(docId, docName.replace(/\s+/g, '_')), 'DOCUMENT VERIFICATION', title + (mods[0] ? ' — ' + mods[0].title : ''), undefined, mods.length, 0), e: AP_EST.qrSec });
    blocks.push({
        h: AP.kpi([
            { label: 'Grid Modules', value: '' + mods.length, accent: true },
            { label: 'Total Frequency', value: '' + totalFreq },
            { label: 'Tracked Days', value: '' + (mods.length * 31) }
        ], true),
        e: AP_EST.kpi
    });

    let secN = 1;
    for (let i = 0; i < mods.length; i += 2) {
        const pairHtml = '<div class="ap-kpi" style="margin-bottom:10px;">' + _apeGridCard(mods[i]) + (mods[i + 1] ? _apeGridCard(mods[i + 1]) : '') + '</div>';
        blocks.push({ h: pairHtml, e: 150 });
    }

    if (!mods.length) blocks.push({ h: '<div class="ap-emp">No records available for this report.</div>', e: 60 });

    const pages = [];
    let cur = '', curH = 0;
    blocks.forEach(function (b) {
        const eh = b.e || 0;
        if (curH > 0 && curH + eh > AP_PAGE_CONTENT_H) { pages.push(cur); cur = b.h; curH = eh; }
        else { cur += b.h; curH += eh; }
    });
    pages.push(cur);

    return _apAssemble(docName, pages);
}

// ============================================================
//  GRID RECORDS REPORT — buildGridRecordsPrintHTML
// ============================================================
function buildGridRecordsPrintHTML(docId, monthKey) {
    docId = docId || '';
    let records = Array.isArray(app.gridRecords) ? app.gridRecords : [];
    if (monthKey) records = records.filter(r => r.monthKey === monthKey);

    const headerName = monthKey ? ('Grid Records Report — ' + getMonthNameFromKey(monthKey)) : 'Grid Records Report';
    if (!records.length) {
        return _apAssemble(headerName, [AP.ttl('GRID RECORDS REPORT', monthKey ? getMonthNameFromKey(monthKey) : null) + '<div class="ap-emp">No records available for this report.</div>']);
    }

    const monthGroups = {};
    records.forEach(r => { const mk = r.monthKey || 'unknown'; if (!monthGroups[mk]) monthGroups[mk] = []; monthGroups[mk].push(r); });

    const blocks = [];
    blocks.push({ h: AP.ttl('GRID RECORDS REPORT', monthKey ? getMonthNameFromKey(monthKey) : null, null), e: AP_EST.ttl });
    blocks.push({
        h: AP.kpi([{ label: 'Total Records', value: '' + records.length, accent: true }, { label: 'Months', value: '' + Object.keys(monthGroups).length }], true),
        e: AP_EST.kpi
    });

    let secN = 1;
    Object.keys(monthGroups).sort((a, b) => b.localeCompare(a)).forEach(mk => {
        const mName = getMonthNameFromKey(mk);
        const items = monthGroups[mk];
        blocks.push({ h: AP.sec(secN++, mName.toUpperCase(), items.length + ' records'), e: AP_EST.sec, keepNext: true });

        // status pills across the month
        const totals = {};
        items.forEach(it => { Object.keys(it.stateCounts || {}).forEach(s => { totals[s] = (totals[s] || 0) + it.stateCounts[s]; }); });
        let pillsHtml = '<div style="margin-bottom:8px;">';
        Object.keys(totals).forEach(s => {
            let col = '#94a3b8';
            try { col = getStateColor(s) || col; } catch (e) {}
            pillsHtml += AP.badge(s, totals[s], col);
        });
        pillsHtml += '</div>';
        blocks.push({ h: pillsHtml, e: 26 });

        const rows = [];
        items.forEach(item => {
            const stateBadges = Object.keys(item.stateCounts || {}).map(s => {
                let col = '#94a3b8';
                try { col = getStateColor(s) || col; } catch (e) {}
                return '<span class="ap-pill" style="border-color:' + col + ';">' + _apEsc(s) + ' ' + item.stateCounts[s] + '</span>';
            }).join(' ');
            rows.push([{ t: '' + (rows.length + 1) }, { t: _apEsc(item.modName), b: true }, { t: _apEsc(item.date || item.monthKey || '') }, { t: stateBadges }]);
        });
        _apTablePages(
            [{ t: '#' }, { t: 'Module' }, { t: 'Date' }, { t: 'Status Summary' }],
            rows,
            { titleHtml: AP.cdT(_apEsc(mName)) + AP.cdS(items.length + ' modules recorded') }
        ).forEach(p => blocks.push(p));
    });

    return _apPaginateBlocks(blocks, headerName);
}

// ============================================================
//  TOTAL EXPENDITURE REPORT — buildTotalExpensePrintHTML
// ============================================================
function buildTotalExpensePrintHTML(docId, monthKey) {
    docId = docId || '';
    const headerName = monthKey ? ('Total Expenditure Report — ' + getMonthNameFromKey(monthKey)) : 'Total Expenditure Report';

    if (!app.totalExpense || !Object.keys(app.totalExpense).length) {
        return _apAssemble(headerName, [AP.ttl('TOTAL EXPENDITURE REPORT', monthKey ? getMonthNameFromKey(monthKey) : null) + '<div class="ap-emp">No records available for this report.</div>']);
    }

    const moduleNames = {};
    app.modules.forEach(m => { moduleNames[m.id] = m.title; });
    const allEntries = [];
    Object.keys(app.totalExpense).forEach(modId => {
        const weeks = app.totalExpense[modId];
        ['week1', 'week2', 'week3', 'week4'].forEach(wk => {
            (weeks[wk] || []).forEach(entry => {
                allEntries.push(Object.assign({}, entry, { modId: modId, weekKey: wk, dateObj: parseEntryDate(entry.d) }));
            });
        });
    });
    if (monthKey) {
        allEntries.filter(Boolean);
    }
    const filtered = allEntries.filter(e => {
        if (!monthKey) return true;
        if (!e.dateObj || isNaN(e.dateObj.getTime())) return false;
        return e.dateObj.getFullYear() + '-' + String(e.dateObj.getMonth() + 1).padStart(2, '0') === monthKey;
    });

    if (!filtered.length) {
        return _apAssemble(headerName, [AP.ttl('TOTAL EXPENDITURE REPORT', monthKey ? getMonthNameFromKey(monthKey) : null) + '<div class="ap-emp">No records available for this report.</div>']);
    }

    const weekKeys = ['week1', 'week2', 'week3', 'week4'];
    const weekLabels = ['Week 1 (1-7)', 'Week 2 (8-14)', 'Week 3 (15-21)', 'Week 4 (22-31)'];

    const monthGroups = {};
    filtered.forEach(e => {
        const mk = e.dateObj.getFullYear() + '-' + String(e.dateObj.getMonth() + 1).padStart(2, '0');
        if (!monthGroups[mk]) monthGroups[mk] = { week1: [], week2: [], week3: [], week4: [] };
        monthGroups[mk][e.weekKey].push(e);
    });

    let grandTotal = 0;
    const sortedMonths = Object.keys(monthGroups).sort((a, b) => b.localeCompare(a));

    const blocks = [];
    blocks.push({ h: AP.ttl('TOTAL EXPENDITURE REPORT', monthKey ? getMonthNameFromKey(monthKey) : null), e: AP_EST.ttl });
    blocks.push({
        h: AP.kpi([
            { label: 'Grand Total', value: _apMoneyNC(Math.min(filtered.reduce((s, e) => s + (Number(e.a) || 0), 0), MAX_INPUT_VALUE)), accent: true },
            { label: 'Total Entries', value: '' + filtered.length },
            { label: 'Months', value: '' + sortedMonths.length }
        ], true),
        e: AP_EST.kpi
    });

    let secN = 1;
    sortedMonths.forEach(mk => {
        const mName = getMonthNameFromKey(mk);
        const weeks = monthGroups[mk];
        let monthTotal = 0;
        const monthBlocks = [];

        weekKeys.forEach((wk, idx) => {
            const items = weeks[wk] || [];
            if (!items.length) return;
            let weekTotal = 0;
            const rows = items.map((item, sn) => {
                weekTotal += Number(item.a) || 0;
                monthTotal += Number(item.a) || 0;
                grandTotal += Number(item.a) || 0;
                return [{ t: '' + (sn + 1) }, { t: _apEsc(item.i) }, { t: _apEsc(item.d) }, { t: _apEsc(item.c) }, { t: _apMoneyNC(item.a), r: true }];
            });
            const head = '<div class="ap-week-h"><span>' + weekLabels[idx] + '</span><span>' + items.length + ' entries · ' + _apMoneyNC(weekTotal) + '</span></div>';
            monthBlocks.push.apply(monthBlocks, _apTablePages(
                [{ t: '#' }, { t: 'Item' }, { t: 'Date' }, { t: 'Category' }, { t: 'Amount', r: true }],
                rows,
                { titleHtml: head }
            ));
        });

        blocks.push({ h: AP.sec(secN++, mName.toUpperCase(), Math.round(monthTotal * 100) / 100 === 0 ? '' : ''), e: AP_EST.sec, keepNext: true });
        monthBlocks.forEach(mb => blocks.push(mb));
        blocks.push({ h: '<div class="ap-month-total">Month Total (' + _apEsc(mName) + '): ' + _apMoneyNC(monthTotal) + '</div>', e: AP_EST.monthTotal });
    });

    grandTotal = Math.min(grandTotal, MAX_INPUT_VALUE);
    const pages = [];
    let cur = '', curH = 0;
    blocks.forEach(function (b) {
        const eh = b.e || 0;
        if (curH > 0 && curH + eh > AP_PAGE_CONTENT_H) { pages.push(cur); cur = b.h; curH = eh; }
        else { cur += b.h; curH += eh; }
    });
    pages.push(cur);
    pages[pages.length - 1] += '<div class="ap-yr"><div class="ap-yr-r"><span>Grand Total</span><span style="color:#dc2626;font-size:11px;">' + _apMoneyNC(grandTotal) + '</span></div></div>';

    return _apAssemble(headerName, pages);
}
