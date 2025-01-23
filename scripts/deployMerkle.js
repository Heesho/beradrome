const { ethers } = require("hardhat");

async function main() {
  const oBERO = "0x7629668774f918c00Eb4b03AdF5C4e2E53d45f0b";
  const hiBERO = "0x2B4141f98B8cD2a03F58bD722D4E8916d2106504";
  const merkleRootOBero =
    "0xa024b9aa996a7ae554b4bd556fd4b91043f0d19872f048b3e25447c3b6d789b6";
  const merkleRootHiBero =
    "0x3addb757b02bdcea4771e6bab489e4e58a1c51b99562b976eddca017b0a3cf3a";

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
    address: merkleClaim.address,
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
