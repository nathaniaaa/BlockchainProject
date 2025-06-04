const hre = require("hardhat");
const fs = require('fs');

async function main() {
  const KaretKontrak = await hre.ethers.getContractFactory("KaretKontrak");
  const kontrak = await KaretKontrak.deploy();
  await kontrak.waitForDeployment();

  const address = await kontrak.getAddress();
  console.log("Kontrak berhasil dideploy ke:", address);

  // Simpan ke .env
  fs.appendFileSync('.env', `\nCONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
