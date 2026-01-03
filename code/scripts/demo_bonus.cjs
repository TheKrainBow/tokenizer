const hre = require("hardhat");

async function main() {
  const [owner1, owner2, owner3, receiver] = await hre.ethers.getSigners();

  console.log("=== Bonus Demo: Multisig Mint ===");
  console.log("Owner1:", owner1.address);
  console.log("Owner2:", owner2.address);
  console.log("Owner3:", owner3.address);
  console.log("Receiver:", receiver.address);
  console.log("");

  // 1) Deploy Token (owner = owner1)
  const Mokko42 = await hre.ethers.getContractFactory("MokkoAt42Nice");
  const token = await Mokko42.connect(owner1).deploy(1000000); // initial supply in whole tokens (your constructor scales by decimals)
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();

  console.log("Token deployed:", tokenAddr);
  console.log("Token owner (initial):", await token.owner());
  console.log("");

  // 2) Owner1 mints successfully (before multisig ownership)
  console.log("Step 1: owner1 mints 21 tokens to receiver (should succeed)...");
  await (await token.connect(owner1).mint(receiver.address, 21)).wait();
  console.log("Receiver balance after mint:", hre.ethers.formatUnits(await token.balanceOf(receiver.address), 18), "M42");
  console.log("");

  // 3) Deploy Multisig (2-of-3)
  const Multisig = await hre.ethers.getContractFactory("MultisigWallet");
  const multisig = await Multisig.deploy([owner1.address, owner2.address, owner3.address], 2);
  await multisig.waitForDeployment();
  const multisigAddr = await multisig.getAddress();

  console.log("Multisig deployed:", multisigAddr);
  console.log("");

  // 4) Transfer token ownership to multisig
  console.log("Step 2: transfer Token ownership to Multisig...");
  await (await token.connect(owner1).transferOwnership(multisigAddr)).wait();
  console.log("Token owner (after transfer):", await token.owner());
  console.log("");

  // 5) Try mint again as owner1 (should fail now)
  console.log("Step 3: owner1 tries to mint alone again (should FAIL)...");
  try {
    await (await token.connect(owner1).mint(receiver.address, 21)).wait();
    console.log("❌ Unexpected: mint succeeded (this should not happen)");
  } catch (e) {
    console.log("✅ Expected failure:", (e && e.message) ? e.message.split("\n")[0] : e);
  }
  console.log("");

  // 6) Mint via multisig: submit -> approve (2 owners) -> execute
  console.log("Step 4: mint via multisig (needs 2 approvals)...");
  const tokenIface = token.interface;

  // calldata for token.mint(receiver, 25)
  const data = tokenIface.encodeFunctionData("mint", [receiver.address, 21]);

  // submit transaction from owner1
  const submitTransawction = await multisig.connect(owner1).submit(tokenAddr, 0, data);
  await submitTransawction.wait();

  // transactionId is the last transaction index; easiest: read transactionCount-1
  const transactionCount = await multisig.transactionCount();
  const transactionId = transactionCount - 1n;

  console.log("Submitted multisig transactionId:", transactionId.toString());

  // approve by owner1
  await (await multisig.connect(owner1).approve(transactionId)).wait();
  console.log("Approved by owner1");

  // still fails since not enough approvals
  console.log("Trying to execute with only 1 approval (should FAIL)...");
  try {
    await (await multisig.connect(owner1).execute(transactionId)).wait();
    console.log("❌ Unexpected: execute succeeded with 1 approval");
  } catch (e) {
    console.log("✅ Expected failure:", (e && e.message) ? e.message.split("\n")[0] : e);
  }

  // approve by owner2
  await (await multisig.connect(owner2).approve(transactionId)).wait();
  console.log("Approved by owner2");

  // execute (any owner can execute once threshold met)
  await (await multisig.connect(owner3).execute(transactionId)).wait();
  console.log("Executed by owner3");

  console.log("");
  console.log("Receiver balance after multisig mint:", hre.ethers.formatUnits(await token.balanceOf(receiver.address), 18), "M42");
  console.log("✅ Multisig mint succeeded only after 2 approvals");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
