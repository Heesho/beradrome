const { ethers } = require("hardhat");

async function main() {
  const oBERO = "0x40A8d9efE6A2C6C9D193Cc0A4476767748E68133";
  const hiBERO = "0x7F0976b52F6c1ddcD4d6f639537C97DE22fa2b69";
  const merkleRootOBero =
    "0xfd921502d0408a50f9f9c3e4586faef80376a8f0d76639390df8af049ce3b791";
  const merkleRootHiBero =
    "0x5e1a74eb8a7d2e7d6978854aba438f7e916bc0df662f76abaed106e065b21112";

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
