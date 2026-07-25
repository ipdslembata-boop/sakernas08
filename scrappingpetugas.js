(async function() {
    let semuaData = [];

    // 1. Paksa kembali ke halaman 1 terlebih dahulu
    console.log("Mengarahkan ke Halaman 1...");
    const halamanPertamaBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText.trim() === '1');
    if (halamanPertamaBtn) {
        halamanPertamaBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    let lanjutHalaman = true;
    let halamanAktif = 1;

    while (lanjutHalaman) {
        console.log(`Sedang memproses Halaman ${halamanAktif}...`);
        
        // Ambil elemen kartu petugas yang spesifik di halaman aktif
        const kartuPetugasList = Array.from(document.querySelectorAll('div')).filter(el => {
            return el.innerText && el.innerText.includes('@gmail.com') && el.innerText.includes('Total Assignment') && el.querySelectorAll('div').length < 15;
        });

        // Unikkan elemen kartu berdasarkan email
        const uniqueCards = [];
        const seenEmails = new Set();
        for (let card of kartuPetugasList) {
            let text = card.innerText;
            let emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
            if (emailMatch && !seenEmails.has(emailMatch[0])) {
                seenEmails.add(emailMatch[0]);
                uniqueCards.push(card);
            }
        }

        console.log(`Ditemukan ${uniqueCards.length} petugas di halaman ${halamanAktif}.`);

        // Loop klik setiap kartu petugas satu per satu secara terisolasi
        for (let i = 0; i < uniqueCards.length; i++) {
            let card = uniqueCards[i];
            let initialText = card.innerText;
            let emailMatch = initialText.match(/[\w.-]+@[\w.-]+\.\w+/);
            let email = emailMatch ? emailMatch[0] : `petugas_${i}`;

            // Ambil angka total assignment dari teks kartu (biasanya berada di dekat tulisan Total Assignment)
            let lines = initialText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            let totalAssign = "0";
            for (let j = 0; j < lines.length; j++) {
                if (lines[j].includes('Total Assignment') && lines[j+1]) {
                    totalAssign = lines[j+1];
                    break;
                }
            }

            // Klik kartu untuk membuka detail SLS
            card.click();
            await new Promise(resolve => setTimeout(resolve, 1200)); // Tunggu dropdown terbuka

            // Cari elemen pembungkus (wrapper) terdekat yang memuat rincian kartu ini saja
            let wrapper = card.closest('div.border, div[class*="rounded"], div.bg-white') || card.parentElement;
            let expandedText = wrapper ? wrapper.innerText : card.innerText;

            // Ekstraksi kode SLS khusus dari dalam wrapper kartu ini (pola angka 10 digit ke atas)
            let expandedLines = expandedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            let slsList = expandedLines.filter(l => /^\d{10,}$/.test(l));

            // Jika total assignment 0 atau tidak ada SLS yang valid di dalam wrapper, pastikan array kosong
            let finalSls = [];
            if (totalAssign !== "0" && slsList.length > 0) {
                finalSls = Array.from(new Set(slsList));
            }

            if (!semuaData.some(item => item.email === email)) {
                semuaData.push({
                    email: email,
                    total_assignment: totalAssign,
                    sls: finalSls
                });
            }

            console.log(`Petugas: ${email} | Assignment: ${totalAssign} | SLS: ${finalSls.length} ditemukan`);
        }

        // Cari tombol Next untuk pindah halaman
        let tombolNext = null;
        const semuaTombol = document.querySelectorAll('button, a, span, div');
        for (let el of semuaTombol) {
            let txt = el.innerText.trim();
            if (txt === 'Next >' || txt === 'Next' || txt === '›') {
                tombolNext = el;
                break;
            }
        }

        if (tombolNext && !tombolNext.classList.contains('disabled') && !tombolNext.hasAttribute('disabled') && window.getComputedStyle(tombolNext).pointerEvents !== 'none') {
            halamanAktif++;
            tombolNext.click();
            await new Promise(resolve => setTimeout(resolve, 2500));
        } else {
            console.log("Sudah mencapai halaman terakhir.");
            lanjutHalaman = false; 
        }
    }

    console.table(semuaData);
    console.log(`Proses selesai! Total seluruh petugas: ${semuaData.length}`);

    // Download otomatis file JSON yang sudah bersih
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(semuaData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "data_petugas_bersih.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    console.log("File data_petugas_bersih.json berhasil di-download!");
})();