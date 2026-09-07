/**
 * QR Code Generator - Minimal offline implementation
 * Supports byte mode, error correction level M, versions 1-40
 * Generates SVG or Canvas output
 */
var QRCode = (function () {
    'use strict';

    var EC_LEVEL = { L: 0, M: 1, Q: 2, H: 3 };

    var EC_CODEWORDS_PER_BLOCK = [
        [7,10,15,20],[10,16,26,18],[15,26,18,26],[20,18,26,30],
        [26,24,18,22],[18,16,24,28],[20,18,18,26],[24,22,22,26],
        [30,22,20,24],[18,26,24,28],[20,30,28,24],[24,22,26,28],
        [26,22,24,30],[30,24,20,24],[22,24,30,28],[24,28,28,30],
        [28,28,28,28],[30,26,28,30],[28,26,28,30],[28,26,28,30],
        [28,26,30,28],[28,28,30,30],[30,28,30,30],[30,28,30,30]
    ];

    var NUM_ERROR_CORRECTION_BLOCKS = [
        [1,1,1,1],[1,1,1,1],[1,1,2,2],[1,1,2,2],[1,1,2,4],[1,2,2,4],
        [1,2,4,4],[2,2,2,4],[2,2,3,4],[2,2,4,4],[2,3,4,6],[2,4,4,6],
        [2,4,6,6],[2,4,6,8],[2,5,8,8],[2,5,8,10],[2,5,8,10],[2,6,10,12],
        [2,6,10,12],[2,6,10,14],[2,7,12,14],[2,8,12,14],[2,8,12,16],
        [2,9,14,16],[2,9,14,18],[2,10,14,18],[2,12,14,18],[2,12,14,20]
    ];

    var ALIGNMENT_PATTERNS = [
        [],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],
        [6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],
        [6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],
        [6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],
        [6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118]
    ];

    var VERSION_INFO = [
        0,0x07C94,0x085BC,0x09A9B,0x0A4D3,0x0BBF6,0x0C762,0x0D847,0x0E6DD,
        0x0F7D1,0x1085B,0x11370,0x12A2E,0x13533,0x149A7,0x1568C,0x16F32,
        0x17B13,0x18DC4,0x19149,0x1AABD,0x1B088,0x1C131,0x1D219,0x1E39C,
        0x1F439,0x209EC,0x21BCF,0x22E93,0x23675,0x24A26,0x25793,0x26A10,
        0x274CB,0x2825D,0x29763,0x2AE7F,0x2B90E,0x2C5D8,0x2D50E,0x2E454,
        0x2F7A0,0x30B09,0x31D9A,0x327F3,0x33651,0x34C3E,0x356B0,0x36C9E,
        0x37AB5,0x385DD,0x39225,0x3A039,0x3B3F0,0x3CA87,0x3D4D3,0x3E70C,
        0x3F23F,0x409CC,0x41C43,0x42FBA,0x43A6D,0x44908,0x45D91,0x46453,
        0x47892,0x483C4,0x49176,0x4A2CB,0x4B57A,0x4C2D5,0x4D5CE,0x4EAB5,
        0x4F123,0x50748,0x51A8E,0x52BF4,0x53579,0x5493C,0x55793,0x56A3A,
        0x5771F,0x58DC4,0x59940,0x5A4D9,0x5B276,0x5C132,0x5D244,0x5E28D,
        0x5F37E,0x60AB4,0x616D1,0x62E76,0x63782,0x645C4,0x658C5,0x66436,
        0x675E1,0x68C49,0x69D2A,0x6A501,0x6B42D,0x6C6EE,0x6D209,0x6E078,
        0x6F65F,0x70B3A,0x71255,0x725D1,0x7318E,0x7491A,0x7560E,0x76A0B,
        0x77682,0x78439,0x7921F,0x7A4C7,0x7B1B2,0x7C4E9,0x7D210,0x7E229,
        0x7F067,0x80EC6,0x81C07,0x82991,0x835EE,0x84A19,0x8577B,0x862D1,
        0x87960,0x886F8,0x895C3,0x8A9D4,0x8B09B,0x8C7F8,0x8D26F,0x8E3B0,
        0x8F4AE,0x907E7,0x91E43,0x92B4E,0x93D50,0x9479B,0x95DDE,0x965C5,
        0x9735A,0x9827E,0x99A15,0x9A722,0x9B309,0x9C46F,0x9D498,0x9E231,
        0x9F63F,0xA0A2C,0xA131F,0xA2399,0xA3049,0xA440C,0xA5612,0xA6A15,
        0xA72B5,0xA8223,0xA91AA,0xAAE13,0xAB5C5,0xAC2F4,0xAD4B7,0xAE656,
        0xAF2DA,0xB0321,0xB1147,0xB26E9,0xB3A73,0xB4A1A,0xB548E,0xB65F3,
        0xB7784,0xB82D4,0xB960B,0xBA520,0xBBA54,0xBC523,0xBD4E5,0xBE910,
        0xBFB25,0xC0711,0xC1A90,0xC2203,0xC365D,0xC42C0,0xC5093,0xC660F,
        0xC70E8,0xC836E,0xC9012,0xCA836,0xCB94A,0xCC229,0xCDD06,0xCE082,
        0xCF4F9,0xD02E1,0xD13CF,0xD26E5,0xD3057,0xD489F,0xD5630,0xD6184,
        0xD70F2,0xD84F7,0xD9157,0xDA7BA,0xDB30B,0xDC891,0xDD08A,0xDE84C,
        0xDF1C0,0xE0073,0xE15CD,0xE2482,0xE32D4,0xE46E7,0xE55F3,0xE6B15,
        0xE7169,0xE88F3,0xE91E0,0xEA107,0xEB641,0xEC960,0xED524,0xEE233,
        0xEF045,0xF05F3,0xF13AF,0xF22F2,0xF3413,0xF43D5,0xF5114,0xF66E8,
        0xF7789,0xF8A53,0xF9296,0xFA091,0xFB55E,0xFC214,0xFD2E3,0xFE180
    ];

    var FORMAT_INFO = [
        0x5412,0x5125,0x5E7C,0x5B4B,0x45F9,0x40CE,0x4F97,0x4AA0,
        0x77C4,0x72F3,0x7DAA,0x789D,0x662F,0x6318,0x6C41,0x6976,
        0x1689,0x13BE,0x1CE7,0x19D0,0x0762,0x0255,0x0D0C,0x083B,
        0x355F,0x3068,0x3F31,0x3A06,0x24B4,0x2183,0x2EDA,0x2BED
    ];

    var GF_EXP = new Array(256);
    var GF_LOG = new Array(256);
    (function initGF() {
        var x = 1;
        for (var i = 0; i < 255; i++) {
            GF_EXP[i] = x;
            GF_LOG[x] = i;
            x = (x << 1) ^ (x & 0x80 ? 0x11D : 0);
        }
        for (var j = 255; j < 512; j++) GF_EXP[j] = GF_EXP[j - 255];
    })();

    function gfMul(a, b) {
        if (a === 0 || b === 0) return 0;
        return GF_EXP[GF_LOG[a] + GF_LOG[b]];
    }

    function rsGenPoly(nsym) {
        var g = [1];
        for (var i = 0; i < nsym; i++) {
            var ng = new Array(g.length + 1).fill(0);
            for (var j = 0; j < g.length; j++) {
                ng[j] ^= g[j];
                ng[j + 1] ^= gfMul(g[j], GF_EXP[i]);
            }
            g = ng;
        }
        return g;
    }

    function rsEncode(data, nsym) {
        var gen = rsGenPoly(nsym);
        var res = new Array(data.length + nsym).fill(0);
        for (var i = 0; i < data.length; i++) res[i] = data[i];
        for (var i = 0; i < data.length; i++) {
            var coef = res[i];
            if (coef !== 0) {
                for (var j = 0; j < gen.length; j++) {
                    res[i + j] ^= gfMul(gen[j], coef);
                }
            }
        }
        return res.slice(data.length);
    }

    function getNumRawDataModules(ver) {
        var n = ver * 4 + 17;
        var res = n * n;
        res -= 31;
        if (ver >= 2) {
            var nb = Math.floor(ver / 7) + 2;
            res -= (nb - 2) * 10;
        }
        res -= (ver < 7 ? 0 : 36);
        return res;
    }

    function getNumDataCodewords(ver, ecl) {
        var total = getNumRawDataModules(ver) / 8;
        var ecPerBlock = EC_CODEWORDS_PER_BLOCK[ecl][Math.min(ver - 1, 23)];
        var numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl][Math.min(ver - 1, 23)];
        return total - ecPerBlock * numBlocks;
    }

    function getMinVersion(dataLen, ecl) {
        for (var v = 1; v <= 40; v++) {
            var cap = getNumDataCodewords(v, ecl);
            var overhead = 2;
            if (cap >= 256) overhead = 3;
            if (cap >= dataLen + overhead) return v;
        }
        return -1;
    }

    function encodeData(text, ecl) {
        var dataBytes = [];
        for (var i = 0; i < text.length; i++) {
            var c = text.charCodeAt(i);
            if (c < 0x80) dataBytes.push(c);
            else if (c < 0x800) {
                dataBytes.push(0xC0 | (c >> 6));
                dataBytes.push(0x80 | (c & 0x3F));
            } else {
                dataBytes.push(0xE0 | (c >> 12));
                dataBytes.push(0x80 | ((c >> 6) & 0x3F));
                dataBytes.push(0x80 | (c & 0x3F));
            }
        }
        var version = getMinVersion(dataBytes.length, ecl);
        if (version < 0) {
            version = 40;
            dataBytes = dataBytes.slice(0, getNumDataCodewords(40, ecl) - 3);
        }
        var dataCap = getNumDataCodewords(version, ecl);
        var bits = [];
        bits.push(0, 1, 0, 0);
        var lenBits = dataBytes.length <= 252 ? 8 : 16;
        var len = dataBytes.length;
        for (var b = lenBits - 1; b >= 0; b--) bits.push((len >> b) & 1);
        for (var i = 0; i < dataBytes.length; i++) {
            for (var b = 7; b >= 0; b--) bits.push((dataBytes[i] >> b) & 1);
        }
        var padBytes = dataCap - dataBytes.length;
        var padBitsTotal = padBytes * 8;
        var terminator = Math.min(4, padBitsTotal);
        for (var i = 0; i < terminator; i++) bits.push(0);
        var remaining = (dataCap * 8) - bits.length;
        for (var i = 0; i < remaining; i++) bits.push(0);

        var dataCodewords = [];
        for (var i = 0; i < bits.length; i += 8) {
            var byte = 0;
            for (var j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] || 0);
            dataCodewords.push(byte);
        }
        while (dataCodewords.length < dataCap) dataCodewords.push(0);

        var ecPerBlock = EC_CODEWORDS_PER_BLOCK[ecl][Math.min(version - 1, 23)];
        var numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl][Math.min(version - 1, 23)];
        var totalCodewords = getNumRawDataModules(version) / 8;
        var blockSize = Math.floor(totalCodewords / numBlocks);
        var shortBlocks = numBlocks - (totalCodewords % numBlocks);

        var allBlocks = [];
        var ecBlocks = [];
        var offset = 0;
        for (var i = 0; i < numBlocks; i++) {
            var sz = blockSize - (i >= numBlocks - shortBlocks ? 0 : 1);
            var block = dataCodewords.slice(offset, offset + sz);
            offset += sz;
            allBlocks.push(block);
            ecBlocks.push(rsEncode(block, ecPerBlock));
        }

        var codewords = [];
        var maxDataLen = blockSize;
        for (var i = 0; i < maxDataLen; i++) {
            for (var j = 0; j < numBlocks; j++) {
                if (i < allBlocks[j].length) codewords.push(allBlocks[j][i]);
            }
        }
        for (var i = 0; i < ecPerBlock; i++) {
            for (var j = 0; j < numBlocks; j++) {
                codewords.push(ecBlocks[j][i]);
            }
        }

        return { version: version, codewords: codewords, ecl: ecl };
    }

    function createMatrix(version) {
        var size = version * 4 + 17;
        var matrix = [];
        var reserved = [];
        for (var r = 0; r < size; r++) {
            matrix[r] = new Array(size).fill(0);
            reserved[r] = new Array(size).fill(false);
        }
        return { matrix: matrix, reserved: reserved, size: size };
    }

    function placeFinderPattern(m, row, col) {
        var s = m.size;
        for (var dr = -1; dr <= 7; dr++) {
            for (var dc = -1; dc <= 7; dc++) {
                var r = row + dr, c = col + dc;
                if (r < 0 || r >= s || c < 0 || c >= s) continue;
                var inFinder = (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
                               (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
                               (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
                if (inFinder) {
                    m.matrix[r][c] = 1;
                } else {
                    m.matrix[r][c] = 0;
                }
                m.reserved[r][c] = true;
            }
        }
    }

    function placeAlignmentPattern(m, row, col) {
        for (var dr = -2; dr <= 2; dr++) {
            for (var dc = -2; dc <= 2; dc++) {
                var r = row + dr, c = col + dc;
                if (m.reserved[r][c]) continue;
                var inOuter = Math.abs(dr) === 2 || Math.abs(dc) === 2;
                m.matrix[r][c] = inOuter ? 1 : 0;
                m.reserved[r][c] = true;
            }
        }
    }

    function placeTimingPatterns(m) {
        for (var i = 8; i < m.size - 8; i++) {
            if (!m.reserved[6][i]) {
                m.matrix[6][i] = (i % 2 === 0) ? 1 : 0;
                m.reserved[6][i] = true;
            }
            if (!m.reserved[i][6]) {
                m.matrix[i][6] = (i % 2 === 0) ? 1 : 0;
                m.reserved[i][6] = true;
            }
        }
    }

    function reserveFormatAreas(m) {
        for (var i = 0; i <= 8; i++) {
            if (!m.reserved[8][i]) { m.reserved[8][i] = true; }
            if (!m.reserved[i][8]) { m.reserved[i][8] = true; }
            if (i > 0) {
                if (!m.reserved[m.size - i][8]) { m.reserved[m.size - i][8] = true; }
                if (!m.reserved[8][m.size - i]) { m.reserved[8][m.size - i] = true; }
            }
        }
        for (var r = m.size - 8; r < m.size; r++) {
            for (var c = 0; c <= 7; c++) {
                if (!m.reserved[r][c]) m.reserved[r][c] = true;
            }
        }
        for (var c = m.size - 8; c < m.size; c++) {
            for (var r = 0; r <= 7; r++) {
                if (!m.reserved[r][c]) m.reserved[r][c] = true;
            }
        }
        if (m.size > 14) {
            for (var r = m.size - 11; r < m.size - 7; r++) {
                for (var c = m.size - 11; c < m.size - 7; c++) {
                    if (!m.reserved[r][c]) m.reserved[r][c] = true;
                }
            }
        }
    }

    function reserveVersionArea(m, version) {
        if (version < 7) return;
        for (var i = 0; i < 6; i++) {
            for (var j = 0; j < 3; j++) {
                m.reserved[i][m.size - 11 + j] = true;
                m.reserved[m.size - 11 + j][i] = true;
            }
        }
    }

    function placeDataBits(m, codewords) {
        var size = m.size;
        var bitIdx = 0;
        var totalBits = codewords.length * 8;
        var right = size - 1;
        var upward = true;

        while (right >= 0) {
            if (right === 6) right--;
            for (var vert = 0; vert < size; vert++) {
                var row = upward ? (size - 1 - vert) : vert;
                for (var dx = 0; dx <= 1; dx++) {
                    var col = right - dx;
                    if (col < 0) continue;
                    if (m.reserved[row][col]) continue;
                    if (bitIdx < totalBits) {
                        var byteIdx = Math.floor(bitIdx / 8);
                        var bitPos = 7 - (bitIdx % 8);
                        m.matrix[row][col] = (codewords[byteIdx] >> bitPos) & 1;
                        bitIdx++;
                    }
                }
            }
            upward = !upward;
            right -= 2;
        }
    }

    function applyMask(m, maskNum) {
        var size = m.size;
        var maskFn;
        switch (maskNum) {
            case 0: maskFn = function(r, c) { return (r + c) % 2 === 0; }; break;
            case 1: maskFn = function(r, c) { return r % 2 === 0; }; break;
            case 2: maskFn = function(r, c) { return c % 3 === 0; }; break;
            case 3: maskFn = function(r, c) { return (r + c) % 3 === 0; }; break;
            case 4: maskFn = function(r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; }; break;
            case 5: maskFn = function(r, c) { return (r * c) % 2 + (r * c) % 3 === 0; }; break;
            case 6: maskFn = function(r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; }; break;
            case 7: maskFn = function(r, c) { return ((r + c) % 2 + (r * c) % 3) % 2 === 0; }; break;
        }
        for (var r = 0; r < size; r++) {
            for (var c = 0; c < size; c++) {
                if (!m.reserved[r][c] && maskFn(r, c)) {
                    m.matrix[r][c] ^= 1;
                }
            }
        }
    }

    function placeFormatBits(m, ecl, maskNum) {
        var eclMap = [1, 0, 3, 2];
        var fmtIdx = eclMap[ecl] * 8 + maskNum;
        var fmt = FORMAT_INFO[fmtIdx];
        for (var i = 0; i < 6; i++) {
            m.matrix[8][i] = (fmt >> (14 - i)) & 1;
        }
        m.matrix[8][7] = (fmt >> 8) & 1;
        m.matrix[8][8] = (fmt >> 7) & 1;
        m.matrix[7][8] = (fmt >> 6) & 1;
        for (var i = 0; i < 6; i++) {
            m.matrix[5 - i][8] = (fmt >> (i)) & 1;
        }
        m.matrix[8][m.size - 1] = (fmt >> 15) & 1;
        m.matrix[8][m.size - 2] = (fmt >> 14) & 1;
        m.matrix[8][m.size - 3] = (fmt >> 13) & 1;
        m.matrix[8][m.size - 4] = (fmt >> 12) & 1;
        m.matrix[8][m.size - 5] = (fmt >> 11) & 1;
        m.matrix[8][m.size - 6] = (fmt >> 10) & 1;
        m.matrix[m.size - 1][8] = (fmt >> 9) & 1;
        m.matrix[m.size - 2][8] = (fmt >> 8) & 1;
        m.matrix[m.size - 3][8] = (fmt >> 7) & 1;
        m.matrix[m.size - 4][8] = (fmt >> 6) & 1;
        m.matrix[m.size - 5][8] = (fmt >> 5) & 1;
        m.matrix[m.size - 6][8] = (fmt >> 4) & 1;
        m.matrix[m.size - 7][8] = (fmt >> 3) & 1;
        for (var i = 0; i < 7; i++) {
            m.matrix[m.size - 8 + (i >= 6 ? i + 1 : i)][8] = (fmt >> (2 - i + (i >= 6 ? 1 : 0))) & 1;
        }
    }

    function placeVersionBits(m, version) {
        if (version < 7) return;
        var vi = VERSION_INFO[version];
        for (var i = 0; i < 18; i++) {
            var bit = (vi >> i) & 1;
            var row = Math.floor(i / 3);
            var col = i % 3;
            m.matrix[row][m.size - 11 + col] = bit;
            m.matrix[m.size - 11 + col][row] = bit;
        }
    }

    function calcPenalty(m) {
        var size = m.size;
        var penalty = 0;
        for (var r = 0; r < size; r++) {
            var run = 1;
            for (var c = 1; c < size; c++) {
                if (m.matrix[r][c] === m.matrix[r][c - 1]) { run++; }
                else {
                    if (run >= 5) penalty += run - 2;
                    run = 1;
                }
            }
            if (run >= 5) penalty += run - 2;
        }
        for (var c = 0; c < size; c++) {
            var run = 1;
            for (var r = 1; r < size; r++) {
                if (m.matrix[r][c] === m.matrix[r - 1][c]) { run++; }
                else {
                    if (run >= 5) penalty += run - 2;
                    run = 1;
                }
            }
            if (run >= 5) penalty += run - 2;
        }
        for (var r = 0; r < size - 1; r++) {
            for (var c = 0; c < size - 1; c++) {
                var v = m.matrix[r][c];
                if (v === m.matrix[r][c + 1] && v === m.matrix[r + 1][c] && v === m.matrix[r + 1][c + 1]) {
                    penalty += 3;
                }
            }
        }
        return penalty;
    }

    function generate(text, ecl) {
        ecl = ecl || EC_LEVEL.M;
        var encoded = encodeData(text, ecl);
        var m = createMatrix(encoded.version);

        placeFinderPattern(m, 0, 0);
        placeFinderPattern(m, 0, m.size - 7);
        placeFinderPattern(m, m.size - 7, 0);
        placeTimingPatterns(m);

        var alnPats = ALIGNMENT_PATTERNS[Math.min(encoded.version - 1, 26)] || [];
        for (var i = 0; i < alnPats.length; i++) {
            for (var j = 0; j < alnPats.length; j++) {
                var r = alnPats[i], c = alnPats[j];
                if (m.reserved[r][c]) continue;
                placeAlignmentPattern(m, r, c);
            }
        }

        reserveFormatAreas(m);
        reserveVersionArea(m, encoded.version);

        m.matrix[m.size - 8][8] = 1;

        placeDataBits(m, encoded.codewords);

        var bestMask = 0, bestPenalty = Infinity;
        for (var mask = 0; mask < 8; mask++) {
            var test = createMatrix(encoded.version);
            test.matrix = m.matrix.map(function (row) { return row.slice(); });
            test.reserved = m.reserved.map(function (row) { return row.slice(); });

            applyMask(test, mask);
            placeFormatBits(test, ecl, mask);
            placeVersionBits(test, encoded.version);

            var p = calcPenalty(test);
            if (p < bestPenalty) {
                bestPenalty = p;
                bestMask = mask;
            }
        }

        applyMask(m, bestMask);
        placeFormatBits(m, ecl, bestMask);
        placeVersionBits(m, encoded.version);

        return { matrix: m.matrix, size: m.size, version: encoded.version };
    }

    function toSVG(qr, moduleSize, margin) {
        moduleSize = moduleSize || 4;
        margin = margin || 4;
        var size = qr.size * moduleSize + margin * 2;
        var parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">'];
        parts.push('<rect width="' + size + '" height="' + size + '" fill="#fff"/>');
        for (var r = 0; r < qr.size; r++) {
            for (var c = 0; c < qr.size; c++) {
                if (qr.matrix[r][c]) {
                    parts.push('<rect x="' + (c * moduleSize + margin) + '" y="' + (r * moduleSize + margin) + '" width="' + moduleSize + '" height="' + moduleSize + '" fill="#000"/>');
                }
            }
        }
        parts.push('</svg>');
        return parts.join('');
    }

    function toCanvas(qr, canvas, moduleSize, margin) {
        moduleSize = moduleSize || 4;
        margin = margin || 4;
        var size = qr.size * moduleSize + margin * 2;
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#000';
        for (var r = 0; r < qr.size; r++) {
            for (var c = 0; c < qr.size; c++) {
                if (qr.matrix[r][c]) {
                    ctx.fillRect(c * moduleSize + margin, r * moduleSize + margin, moduleSize, moduleSize);
                }
            }
        }
        return canvas;
    }

    return {
        generate: generate,
        toSVG: toSVG,
        toCanvas: toCanvas,
        EC_LEVEL: EC_LEVEL
    };
})();
