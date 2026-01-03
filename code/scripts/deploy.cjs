const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];

  // parseUnits compatibility (v5 uses hre.ethers.utils.parseUnits)
  const parseUnits = hre.ethers.parseUnits || (hre.ethers.utils && hre.ethers.utils.parseUnits);
  if (!parseUnits) throw new Error("parseUnits not found on hre.ethers");

  const initialSupply = parseUnits("1000000", 18);

  const Mokko42 = await hre.ethers.getContractFactory("MokkoAt42Nice");
  const token = await Mokko42.deploy(initialSupply);

  // wait compatibility
  if (typeof token.waitForDeployment === "function") {
    await token.waitForDeployment();
  } else if (typeof token.deployed === "function") {
    await token.deployed();
  }

  // address compatibility
  let addr = token.address;
  if (!addr && typeof token.getAddress === "function") addr = await token.getAddress();

  console.log("Token deployed to:", addr);
  console.log("Deployer:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
