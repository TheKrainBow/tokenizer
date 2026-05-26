const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { privateKeyFromEnv } = require("./private_key.cjs");

async function main() {
  const pk1 = privateKeyFromEnv("PRIVATE_KEY");
  const pk2 = privateKeyFromEnv("PRIVATE_KEY2");
  const pk3 = privateKeyFromEnv("PRIVATE_KEY3");

  // Load token address
  const depFile = path.join(__dirname, "..", "deployments", "sepolia.json");
  if (!fs.existsSync(depFile)) {
    throw new Error(`Missing ${depFile}. Run sepolia_deploy_token.cjs first.`);
  }
  const { token: tokenAddr } = JSON.parse(fs.readFileSync(depFile, "utf8"));

  const provider = hre.ethers.provider;

  const w1 = new hre.ethers.Wallet(pk1, provider);
  const w2 = new hre.ethers.Wallet(pk2, provider);
  const w3 = new hre.ethers.Wallet(pk3, provider);

  const MokkoAt42Nice = await hre.ethers.getContractFactory("MokkoAt42Nice", w1);
  const token = MokkoAt42Nice.attach(tokenAddr);

  const wallets = [
    { name: "PK1", w: w1 },
    { name: "PK2", w: w2 },
    { name: "PK3", w: w3 },
  ];

  console.log("Token:", tokenAddr);
  console.log("");

  for (const { name, w } of wallets) {
    const eth = await provider.getBalance(w.address);
    const bal = await token.balanceOf(w.address);

    console.log(`${name} address:      ${w.address}`);
    console.log(`${name} ETH balance:   ${hre.ethers.formatEther(eth)}`);
    console.log(`${name} Token balance: ${hre.ethers.formatUnits(bal, 18)} M42`);
    console.log("");
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
