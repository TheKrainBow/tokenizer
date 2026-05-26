const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { privateKeyFromEnv } = require("./private_key.cjs");

const tokenDepFile = path.join(__dirname, "..", "deployments", "sepolia.json");
const bonusDepFile = path.join(__dirname, "..", "deployments", "sepolia_bonus.json");

function loadDeployment() {
  if (!fs.existsSync(tokenDepFile)) {
    throw new Error(`Missing ${tokenDepFile}. Run sepolia_deploy.cjs first.`);
  }

  const tokenDeployment = JSON.parse(fs.readFileSync(tokenDepFile, "utf8"));
  if (!tokenDeployment.token) throw new Error("deployments/sepolia.json missing 'token'");

  const bonusDeployment = fs.existsSync(bonusDepFile)
    ? JSON.parse(fs.readFileSync(bonusDepFile, "utf8"))
    : {};

  return {
    ...bonusDeployment,
    network: tokenDeployment.network,
    token: tokenDeployment.token,
    tokenDeploymentFile: tokenDepFile,
  };
}

function saveDeployment(deployment) {
  const {
    tokenDeploymentFile,
    ...bonusDeployment
  } = deployment;

  fs.writeFileSync(bonusDepFile, JSON.stringify(bonusDeployment, null, 2));
}

function saveMultisig(deployment, multisigAddr, owners) {
  deployment.multisig = multisigAddr;
  deployment.multisigThreshold = 2;
  deployment.multisigOwners = owners.map((owner) => owner.address);
  deployment.multisigTimestamp = deployment.multisigTimestamp || new Date().toISOString();
  saveDeployment(deployment);
}

function getWallets(provider) {
  return [
    new hre.ethers.Wallet(privateKeyFromEnv("PRIVATE_KEY"), provider),
    new hre.ethers.Wallet(privateKeyFromEnv("PRIVATE_KEY2"), provider),
    new hre.ethers.Wallet(privateKeyFromEnv("PRIVATE_KEY3"), provider),
  ];
}

function getTransactionId(deployment) {
  const raw = process.env.TX_ID ?? deployment.bonusTransactionId;
  if (raw === undefined || raw === null || raw === "") {
    throw new Error("Missing transaction id. Run make sepolia-bonus-mint first or pass TX_ID=...");
  }
  return BigInt(raw);
}

async function getContracts(deployment, signer) {
  const Mokko42 = await hre.ethers.getContractFactory("MokkoAt42Nice", signer);
  const token = Mokko42.attach(deployment.token);

  let multisig = null;
  if (deployment.multisig) {
    const Multisig = await hre.ethers.getContractFactory("MultisigWallet", signer);
    multisig = Multisig.attach(deployment.multisig);
  }

  return { token, multisig };
}

async function setup() {
  const deployment = loadDeployment();
  const provider = hre.ethers.provider;
  const [owner1, owner2, owner3] = getWallets(provider);
  const { token } = await getContracts(deployment, owner1);

  if (deployment.multisig) {
    console.log("Multisig already configured:", deployment.multisig);
    const tokenOwner = await token.owner();
    console.log("Token owner:", tokenOwner);
    if (tokenOwner.toLowerCase() === deployment.multisig.toLowerCase()) {
      return;
    }

    if (tokenOwner.toLowerCase() !== owner1.address.toLowerCase()) {
      throw new Error(`Token owner is ${tokenOwner}. Cannot transfer ownership from owner1.`);
    }

    console.log("Transferring token ownership to saved multisig...");
    await (await token.transferOwnership(deployment.multisig, {
      nonce: await provider.getTransactionCount(owner1.address, "pending"),
    })).wait();
    console.log("Token owner:", await token.owner());
    return;
  }

  const currentTokenOwner = await token.owner();
  if (currentTokenOwner.toLowerCase() !== owner1.address.toLowerCase()) {
    throw new Error(`Token owner is ${currentTokenOwner}. It must be owner1 before setup.`);
  }

  const Multisig = await hre.ethers.getContractFactory("MultisigWallet", owner1);
  console.log("Deploying 2-of-3 multisig...");
  const multisig = await Multisig.deploy([owner1.address, owner2.address, owner3.address], 2);
  await multisig.waitForDeployment();

  const multisigAddr = await multisig.getAddress();
  console.log("Multisig deployed:", multisigAddr);
  saveMultisig(deployment, multisigAddr, [owner1, owner2, owner3]);
  console.log("Saved multisig address:", bonusDepFile);

  console.log("Transferring token ownership to multisig...");
  await (await token.transferOwnership(multisigAddr, {
    nonce: await provider.getTransactionCount(owner1.address, "pending"),
  })).wait();

  console.log("Token owner:", await token.owner());
  console.log("Saved:", bonusDepFile);
}

async function submitMint() {
  const deployment = loadDeployment();
  const provider = hre.ethers.provider;
  const [owner1, owner2] = getWallets(provider);
  const { token, multisig } = await getContracts(deployment, owner1);
  if (!multisig) throw new Error("Missing multisig. Run make sepolia-bonus-setup first.");

  const receiver = process.env.BONUS_RECEIVER || owner2.address;
  const mintWholeTokens = BigInt(process.env.BONUS_MINT_WHOLE || "21");
  const data = token.interface.encodeFunctionData("mint", [receiver, mintWholeTokens]);
  const transactionId = await multisig.transactionCount();

  console.log(`Submitting multisig mint(${receiver}, ${mintWholeTokens.toString()})...`);
  await (await multisig.connect(owner1).submit(deployment.token, 0, data)).wait();

  deployment.bonusTransactionId = transactionId.toString();
  deployment.bonusReceiver = receiver;
  deployment.bonusMintWhole = mintWholeTokens.toString();
  deployment.bonusSubmittedAt = new Date().toISOString();
  saveDeployment(deployment);

  console.log("Transaction id:", transactionId.toString());
  console.log("Saved:", bonusDepFile);
}

async function accept(ownerIndex) {
  const deployment = loadDeployment();
  const provider = hre.ethers.provider;
  const wallets = getWallets(provider);
  const signer = wallets[ownerIndex - 1];
  if (!signer) throw new Error(`Invalid owner index: ${ownerIndex}`);

  const { multisig } = await getContracts(deployment, signer);
  if (!multisig) throw new Error("Missing multisig. Run make sepolia-bonus-setup first.");

  const transactionId = getTransactionId(deployment);
  console.log(`Accepting transaction ${transactionId.toString()} with owner${ownerIndex}: ${signer.address}`);
  await (await multisig.connect(signer).approve(transactionId)).wait();
  await printStatus(deployment, transactionId);
}

async function execute(ownerIndex) {
  const deployment = loadDeployment();
  const provider = hre.ethers.provider;
  const wallets = getWallets(provider);
  const signer = wallets[ownerIndex - 1];
  if (!signer) throw new Error(`Invalid owner index: ${ownerIndex}`);

  const { token, multisig } = await getContracts(deployment, signer);
  if (!multisig) throw new Error("Missing multisig. Run make sepolia-bonus-setup first.");

  const transactionId = getTransactionId(deployment);
  console.log(`Executing transaction ${transactionId.toString()} with owner${ownerIndex}: ${signer.address}`);
  await (await multisig.connect(signer).execute(transactionId)).wait();
  await printStatus(deployment, transactionId);

  const receiver = deployment.bonusReceiver || wallets[1].address;
  const receiverBalance = await token.balanceOf(receiver);
  console.log("Receiver:", receiver);
  console.log("Receiver token balance:", hre.ethers.formatUnits(receiverBalance, 18), "M42");
}

async function status() {
  const deployment = loadDeployment();
  const transactionId = process.env.TX_ID ? BigInt(process.env.TX_ID) : deployment.bonusTransactionId;

  console.log("Token:", deployment.token);
  console.log("Multisig:", deployment.multisig || "(not configured)");
  console.log("Saved transaction id:", transactionId ?? "(none)");

  if (!deployment.multisig || transactionId === undefined || transactionId === null || transactionId === "") {
    return;
  }

  await printStatus(deployment, BigInt(transactionId));
}

async function printStatus(deployment, transactionId) {
  const provider = hre.ethers.provider;
  const [owner1, owner2, owner3] = getWallets(provider);
  const { multisig } = await getContracts(deployment, owner1);

  const tx = await multisig.transactions(transactionId);
  const owners = [owner1, owner2, owner3];

  console.log("");
  console.log("Transaction:", transactionId.toString());
  console.log("To:", tx.to);
  console.log("Executed:", tx.executed);
  console.log("Approvals:", tx.approvals.toString(), "/", (await multisig.threshold()).toString());

  for (let i = 0; i < owners.length; i++) {
    const approved = await multisig.approvedBy(transactionId, owners[i].address);
    console.log(`Owner${i + 1} accepted:`, approved);
  }
  console.log("");
}

async function main() {
  const action = process.env.ACTION || process.argv[2] || "status";
  const ownerIndex = Number(process.env.OWNER || process.argv[3] || "3");

  if (action === "setup") return setup();
  if (action === "mint" || action === "submit") return submitMint();
  if (action === "accept") return accept(ownerIndex);
  if (action === "execute") return execute(ownerIndex);
  if (action === "status") return status();

  throw new Error(`Unknown ACTION: ${action}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
