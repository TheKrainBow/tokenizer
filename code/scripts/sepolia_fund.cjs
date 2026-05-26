const hre = require("hardhat");
require("dotenv").config();
const { privateKeyFromEnv } = require("./private_key.cjs");

async function main() {
  const provider = hre.ethers.provider;
  const funder = new hre.ethers.Wallet(privateKeyFromEnv("PRIVATE_KEY"), provider);
  const receivers = [
    new hre.ethers.Wallet(privateKeyFromEnv("PRIVATE_KEY2"), provider),
    new hre.ethers.Wallet(privateKeyFromEnv("PRIVATE_KEY3"), provider),
  ];

  const amount = hre.ethers.parseEther(process.env.FUND_AMOUNT || "0.01");
  const funderBalance = await provider.getBalance(funder.address);
  const required = amount * BigInt(receivers.length);

  console.log("Funder:", funder.address);
  console.log("Funder ETH:", hre.ethers.formatEther(funderBalance));
  console.log("Target per receiver:", hre.ethers.formatEther(amount), "Sepolia ETH");
  console.log("");

  if (funderBalance <= required) {
    throw new Error(`Funder needs more than ${hre.ethers.formatEther(required)} Sepolia ETH for funding plus gas`);
  }

  let nonce = await provider.getTransactionCount(funder.address, "pending");

  for (let i = 0; i < receivers.length; i++) {
    const receiver = receivers[i];
    const balance = await provider.getBalance(receiver.address);

    console.log(`PK${i + 2}:`, receiver.address);
    console.log("Current ETH:", hre.ethers.formatEther(balance));

    if (balance >= amount) {
      console.log("Already funded, skipping.");
      console.log("");
      continue;
    }

    console.log("Sending:", hre.ethers.formatEther(amount), "Sepolia ETH");
    const tx = await funder.sendTransaction({
      to: receiver.address,
      value: amount,
      nonce,
    });
    nonce += 1;
    console.log("Tx hash:", tx.hash);
    await tx.wait();
    console.log("Confirmed.");
    console.log("");
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
