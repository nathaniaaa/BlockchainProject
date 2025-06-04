const axios = require('axios');
const cheerio = require('cheerio');
const { ethers } = require('hardhat');

// Mengambil harga berdasarkan kualitas (dummy logic)
async function getHargaKaretDunia(kualitas) {
    try {
        const response = await axios.get("https://www.lgm.gov.my/");
        const $ = cheerio.load(response.data);

        // Dummy parsing
        let harga = 199; // misal 199 sen = RM1.99
        const hargaUSD = harga / 100 / 4.7;
        const hargaETH = hargaUSD / 3000;

        // Modifier multiplier tergantung kualitas
        const multiplier = {
            A: 1,
            B: 0.7,
            C: 0.5
        }[kualitas.toUpperCase()] || 1;

        return ethers.parseEther((hargaETH * multiplier).toFixed(8));
    } catch (error) {
        console.error("Gagal fetch harga:", error);
        return ethers.parseEther("0.01"); // fallback
    }
}

module.exports = { getHargaKaretDunia };
