const express = require('express');
const { ethers } = require('ethers');
const { getHargaKaretDuniaWithSource } = require('./scripts/oracle'); // path ke fungsi oracle
require('dotenv').config();

const app = express();
app.use(express.json());

// Inisialisasi provider dan wallet
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL, "sepolia");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_PABRIK, provider);

// Load kontrak
const contractArtifact = require('./artifacts/contracts/KaretKontrak.sol/KaretKontrak.json');
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractArtifact.abi,
  wallet
);

// Endpoint POST untuk transaksi
app.post('/api/transaksi', async (req, res) => {
  try {
    const { petani, berat, kualitas } = req.body;

    // Validasi input
    if (!ethers.isAddress(petani)) {
      return res.status(400).json({ success: false, error: "Alamat petani tidak valid" });
    }

    const beratKg = parseFloat(berat);
    if (isNaN(beratKg)) {
      return res.status(400).json({ success: false, error: "Berat harus berupa angka" });
    }

    let hargaPerKg, hargaTotal, source;

    try {
      // Mengambil harga dari oracle dan sumber eksternal
      const result = await getHargaKaretDuniaWithSource(kualitas);
      hargaPerKg = result.hargaPerKg; // BigInt dalam wei
      source = result.source;

      hargaTotal = (ethers.parseUnits(beratKg.toString(), 18) * hargaPerKg) / ethers.WeiPerEther;
      hargaTotal = BigInt(hargaTotal);
    } catch (oracleError) {
      console.warn("Oracle gagal, fallback ke harga default.");
      hargaPerKg = ethers.parseUnits("0.0001", "ether");
      hargaTotal = (ethers.parseUnits(beratKg.toString(), 18) * hargaPerKg) / ethers.WeiPerEther;
      hargaTotal = BigInt(hargaTotal);
      source = 'DEFAULT';
    }

    // Mengecek saldo wallet pabrik
    const balance = await provider.getBalance(wallet.address);
    if (balance < hargaTotal) {
      return res.status(400).json({
        success: false,
        error: "Saldo tidak cukup.",
        detail: `Dibutuhkan: ${ethers.formatEther(hargaTotal)} ETH, Saldo: ${ethers.formatEther(balance)} ETH`
      });
    }

    // Mengirim transaksi
    const tx = await contract.buatTransaksi(
      petani,
      ethers.parseUnits(beratKg.toString(), 18),
      kualitas,
      { value: hargaTotal }
    );

    const receipt = await tx.wait();

    res.json({
      success: true,
      txHash: receipt.hash,
      detail: `Berhasil transfer ${ethers.formatEther(hargaTotal)} ETH ke ${petani}`,
      info: source === 'DEFAULT'
        ? "Menggunakan harga default karena gagal fetch harga eksternal"
        : `Harga menggunakan ${source}`,
      hargaPerKg: ethers.formatEther(hargaPerKg),
      sumberHarga: source
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.reason || "Internal server error",
      info: "Menggunakan harga default karena gagal fetch harga eksternal"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
