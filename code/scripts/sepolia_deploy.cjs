const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { privateKeyFromEnv } = require("./private_key.cjs");

async function main() {
  const rpc = process.env.SEPOLIA_RPC;

  if (!rpc) throw new Error("Missing SEPOLIA_RPC in .env");
  const pk1 = privateKeyFromEnv("PRIVATE_KEY");

  const provider = hre.ethers.provider; // uses --network sepolia
  const deployer = new hre.ethers.Wallet(pk1, provider);

  const deployerEth = await provider.getBalance(deployer.address);
  console.log("Deployer:", deployer.address);
  console.log("Deployer ETH:", hre.ethers.formatEther(deployerEth));

  const Mokko42 = await hre.ethers.getContractFactory("MokkoAt42Nice", deployer);

  // Your constructor expects "whole tokens" and scales by decimals internally
  const initialSupplyWhole = 1000000;

  console.log("Deploying MokkoAt42Nice...");
  const token = await Mokko42.deploy(initialSupplyWhole);
  await token.waitForDeployment();

  const tokenAddr = await token.getAddress();
  console.log("Token deployed to:", tokenAddr);
  console.log("Token owner:", await token.owner());

  // Save address for other scripts
  const outDir = path.join(__dirname, "..", "deployments");
  const outFile = path.join(outDir, "sepolia.json");
  fs.mkdirSync(outDir, { recursive: true });

  const payload = {
    network: "sepolia",
    token: tokenAddr,
    deployer: deployer.address,
    initialSupplyWhole,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log("Saved:", outFile);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
