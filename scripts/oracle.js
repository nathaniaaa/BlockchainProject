const { ethers } = require('ethers');
const axios = require('axios');
const cheerio = require('cheerio');

// Harga default (dalam ETH per kg)
const DEFAULT_PRICES = {
  A: ethers.parseEther("0.01"),  // 0.01 ETH/kg
  B: ethers.parseEther("0.007"), // 0.007 ETH/kg
  C: ethers.parseEther("0.005")  // 0.005 ETH/kg
};

// Format harga dari berbagai sumber
const PRICE_SOURCES = {
  SICOM: {
    url: "https://www.sicom.com.my/rubber-prices",
    selector: ".price-table tr:contains('RSS') td:nth-child(2)",
    qualityMap: {
      A: 1.0,
      B: 0.9,
      C: 0.8
    }
  },
  RUBBER_WORLD: {
    url: "https://www.rubberworld.com/prices",
    selector: "tr:contains('RSS') td:nth-child(2)",
    qualityMap: {
      A: 1.0,
      B: 0.85,
      C: 0.75
    }
  }
};

// Fungsi untuk membantu fetch dari sumber tertentu
async function fetchFromSource(source, kualitas) {
  const config = PRICE_SOURCES[source];
  if (!config) throw new Error('Sumber tidak valid');

  const response = await axios.get(config.url, {
    timeout: 5000,
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });

  const $ = cheerio.load(response.data);
  const priceText = $(config.selector).first().text();
  const priceMatch = priceText.match(/(\d+\.\d+)/);

  if (!priceMatch) throw new Error('Format harga tidak dikenali');

  const basePrice = parseFloat(priceMatch[1]);
  const qualityFactor = config.qualityMap[kualitas.toUpperCase()];

  if (!qualityFactor) throw new Error('Kualitas tidak valid');

  return basePrice * qualityFactor;
}

// Fungsi untuk mendapatkan harga ETH dalam USD
async function getETHPriceInUSD() {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { timeout: 3000 }
    );
    return response.data.ethereum.usd;
  } catch (error) {
    console.warn('Gagal fetch harga ETH, menggunakan default $2500:', error.message);
    return 2500;
  }
}

// Fungsi utama untuk mendapatkan harga karet dalam ETH dan sumbernya
async function getHargaKaretDuniaWithSource(kualitas) {
  let hargaUSD;
  let source = 'DEFAULT';

  try {
    try {
      hargaUSD = await fetchFromSource('SICOM', kualitas);
      source = 'SICOM';
    } catch (e) {
      console.warn('Gagal dari SICOM:', e.message);
      try {
        hargaUSD = await fetchFromSource('RUBBER_WORLD', kualitas);
        source = 'RUBBER_WORLD';
      } catch (e) {
        console.warn('Gagal dari RubberWorld:', e.message);
        throw new Error('Tidak bisa fetch dari semua sumber eksternal');
      }
    }

    const ethPriceUSD = await getETHPriceInUSD();
    const hargaETH = hargaUSD / ethPriceUSD;

    return {
      hargaPerKg: ethers.parseEther(hargaETH.toString()),
      source
    };

  } catch (error) {
    console.warn(`Menggunakan harga default: ${error.message}`);
    return {
      hargaPerKg: DEFAULT_PRICES[kualitas.toUpperCase()] || DEFAULT_PRICES.A,
      source: 'DEFAULT'
    };
  }
}

module.exports = { getHargaKaretDuniaWithSource };
