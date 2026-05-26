const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { privateKeyFromEnv } = require("./private_key.cjs");

async function main() {
  const pk1 = privateKeyFromEnv("PRIVATE_KEY");
  const pk2 = privateKeyFromEnv("PRIVATE_KEY2");

  // Load deployed token address
  const depFile = path.join(__dirname, "..", "deployments", "sepolia.json");
  if (!fs.existsSync(depFile)) {
    throw new Error(`Missing ${depFile}. Run sepolia_deploy_token.cjs first.`);
  }
  const { token: tokenAddr } = JSON.parse(fs.readFileSync(depFile, "utf8"));
  if (!tokenAddr) throw new Error("deployments/sepolia.json missing 'token'");

  const provider = hre.ethers.provider;
  const sender = new hre.ethers.Wallet(pk1, provider);
  const receiver = new hre.ethers.Wallet(pk2, provider); // only used for its address

  const MokkoAt42Nice = await hre.ethers.getContractFactory("MokkoAt42Nice", sender);
  const token = MokkoAt42Nice.attach(tokenAddr);

  console.log("Token:", tokenAddr);
  console.log("Sender:", sender.address);
  console.log("Receiver:", receiver.address);

  const amount = hre.ethers.parseUnits("42", 18); // your token uses 18 decimals
  console.log("Sending 42 tokens...");

  const tx = await token.transfer(receiver.address, amount);
  console.log("Tx hash:", tx.hash);
  await tx.wait();

  console.log("✅ Transfer confirmed");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
