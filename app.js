const express = require('express');
const { ethers } = require('ethers'); // Ubah dari 'hardhat'
const { getHargaKaretDunia } = require('./scripts/oracle');
require('dotenv').config();

const app = express();
app.use(express.json());

const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_PABRIK, provider);
const abi = require('./artifacts/contracts/KaretKontrak.sol/KaretKontrak.json').abi;
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

app.post('/api/transaksi', async (req, res) => {
  try {
    const { petani, berat, kualitas } = req.body;

    if (!ethers.isAddress(petani)) throw new Error("Alamat wallet invalid");

    const hargaTotalWei = await getHargaKaretDunia(kualitas);
    const tx = await contract.buatTransaksi(petani, berat, kualitas, { value: hargaTotalWei });
    await tx.wait();

    res.json({
      success: true,
      txHash: tx.hash,
      detail: `Berhasil transfer ${ethers.formatEther(hargaTotalWei)} ETH ke ${petani}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API berjalan di http://localhost:${PORT}`));
