const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { privateKeyFromEnv } = require("./private_key.cjs");

async function main() {
  const pk1 = privateKeyFromEnv("PRIVATE_KEY");
  const pk2 = privateKeyFromEnv("PRIVATE_KEY");

  const depFile = path.join(__dirname, "..", "deployments", "sepolia.json");
  if (!fs.existsSync(depFile)) {
    throw new Error(`Missing ${depFile}. Run sepolia_deploy.cjs first.`);
  }

  const { token: tokenAddr } = JSON.parse(fs.readFileSync(depFile, "utf8"));
  if (!tokenAddr) throw new Error("deployments/sepolia.json missing 'token'");

  const provider = hre.ethers.provider;
  const owner = new hre.ethers.Wallet(pk1, provider);
  const receiver = process.env.MINT_RECEIVER || new hre.ethers.Wallet(pk2, provider).address;
  const wholeTokens = BigInt(process.env.MINT_WHOLE || "21");

  const Mokko42 = await hre.ethers.getContractFactory("MokkoAt42Nice", owner);
  const token = Mokko42.attach(tokenAddr);

  console.log("Token:", tokenAddr);
  console.log("Token owner:", await token.owner());
  console.log("Mint signer:", owner.address);
  console.log("Receiver:", receiver);
  console.log("Amount:", wholeTokens.toString(), "M42");

  const tx = await token.mint(receiver, wholeTokens, {
    nonce: await provider.getTransactionCount(owner.address, "pending"),
  });
  console.log("Tx hash:", tx.hash);
  await tx.wait();

  const receiverBalance = await token.balanceOf(receiver);
  console.log("Receiver token balance:", hre.ethers.formatUnits(receiverBalance, 18), "M42");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
