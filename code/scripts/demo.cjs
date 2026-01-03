const hre = require("hardhat");

function format(amount, decimals) {
  return hre.ethers.formatUnits(amount, decimals);
}

async function main() {
  const [deployer, user] = await hre.ethers.getSigners();

  // Deploy token
  const Mokko42 = await hre.ethers.getContractFactory("MokkoAt42Nice");
  const token = await Mokko42.deploy(1000000);
  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();

  // Metadata
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();

  // Balances before
  const deployerBefore = await token.balanceOf(deployer.address);
  const userBefore = await token.balanceOf(user.address);

  // Transfer 42 tokens
  const amount = hre.ethers.parseUnits("42", decimals);
  const transaction = await token.transfer(user.address, amount);
  await transaction.wait();

  // Balances after
  const deployerAfter = await token.balanceOf(deployer.address);
  const userAfter = await token.balanceOf(user.address);

  console.log("=== Token Demo (Local Hardhat) ===");
  console.log("Token address :", tokenAddress);
  console.log("Deployer      :", deployer.address);
  console.log("Receiver      :", user.address);
  console.log("");

  console.log("Token info:");
  console.log(`  Name        : ${name}`);
  console.log(`  Symbol      : ${symbol}`);
  console.log(`  Decimals    : ${decimals}`);
  console.log(`  Total supply: ${format(totalSupply, decimals)} ${symbol}`);
  console.log("");

  console.log("Balances BEFORE transfer:");
  console.log(`  Deployer : ${format(deployerBefore, decimals)} ${symbol}`);
  console.log(`  Receiver : ${format(userBefore, decimals)} ${symbol}`);
  console.log("");

  console.log("Transfer:");
  console.log(`  Transaction hash   : ${transaction.hash}`);
  console.log(`  Amount    : ${format(amount, decimals)} ${symbol}`);
  console.log("");

  console.log("Balances AFTER transfer:");
  console.log(`  Deployer : ${format(deployerAfter, decimals)} ${symbol}`);
  console.log(`  Receiver : ${format(userAfter, decimals)} ${symbol}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
