const { ethers } = require("hardhat");

async function main() {
  const oBERO = "0x7629668774f918c00Eb4b03AdF5C4e2E53d45f0b";
  const hiBERO = "0x2B4141f98B8cD2a03F58bD722D4E8916d2106504";
  const merkleRootOBero =
    "0xf8ea3b706870f12ee06d0d305bc8e42a3e692d15563ff3f6a9e7dc520390588a";
  const merkleRootHiBero =
    "0xf8ea3b706870f12ee06d0d305bc8e42a3e692d15563ff3f6a9e7dc520390588a";

  const MerkleClaim = await ethers.getContractFactory("MerkleClaim");
  const merkleClaim = await MerkleClaim.deploy(
    oBERO,
    hiBERO,
    merkleRootOBero,
    merkleRootHiBero
  );

  await merkleClaim.deployed();

  console.log("MerkleClaim deployed to:", merkleClaim.address);

  console.log("Starting Merkle Verification");
  await hre.run("verify:verify", {
    address: "0x6eC08E89a76E0709B8efaBE6508869A65F87d4bb",
    contract: "contracts/MerkleClaim.sol:MerkleClaim",
    constructorArguments: [oBERO, hiBERO, merkleRootOBero, merkleRootHiBero],
  });
  console.log("Merkle Verified");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
