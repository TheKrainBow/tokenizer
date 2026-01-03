require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC,
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY2 && process.env.PRIVATE_KEY3) ? ["0x" + process.env.PRIVATE_KEY, "0x" + process.env.PRIVATE_KEY2, "0x" + process.env.PRIVATE_KEY3] : [],
      chainId: 11155111,
    },
  },
};
