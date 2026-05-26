const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const tokenDepFile = path.join(__dirname, "..", "deployments", "sepolia.json");
const bonusDepFile = path.join(__dirname, "..", "deployments", "sepolia_bonus.json");

function loadJson(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function verify(address, constructorArguments) {
  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments,
    });
  } catch (e) {
    const message = e && e.message ? e.message : String(e);
    if (message.includes("Already Verified")) {
      console.log("Already verified:", address);
      return;
    }
    throw e;
  }
}

async function main() {
  if (!process.env.ETHERSCAN_API_KEY) {
    throw new Error("Missing ETHERSCAN_API_KEY in .env");
  }

  const action = process.env.ACTION || process.argv[2] || "token";

  if (action === "token") {
    const deployment = loadJson(tokenDepFile);
    console.log("Verifying token:", deployment.token);
    await verify(deployment.token, [deployment.initialSupplyWhole]);
    return;
  }

  if (action === "bonus") {
    const deployment = loadJson(bonusDepFile);
    console.log("Verifying multisig:", deployment.multisig);
    await verify(deployment.multisig, [deployment.multisigOwners, deployment.multisigThreshold]);
    return;
  }

  throw new Error(`Unknown ACTION: ${action}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
