require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

// Hardhat configuration file
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.ALCHEMY_URL,
      accounts: [process.env.PRIVATE_KEY_PABRIK]
    }
  }
};
