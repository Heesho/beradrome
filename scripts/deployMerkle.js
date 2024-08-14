const { ethers } = require("hardhat");

async function main() {
  const oBERO = "0x7629668774f918c00Eb4b03AdF5C4e2E53d45f0b";
  const hiBERO = "0x2B4141f98B8cD2a03F58bD722D4E8916d2106504";
  const merkleRootOBero =
    "0x199da86b9d17aef05f78fb9af9f366e90cf862df56f327a014c6b9cd1db1f5fd";
  const merkleRootHiBero =
    "0x199da86b9d17aef05f78fb9af9f366e90cf862df56f327a014c6b9cd1db1f5fd";

  //   const MerkleClaim = await ethers.getContractFactory("MerkleClaim");
  //   const merkleClaim = await MerkleClaim.deploy(
  //     oBERO,
  //     hiBERO,
  //     merkleRootOBero,
  //     merkleRootHiBero
  //   );

  //   await merkleClaim.deployed();

  //   console.log("MerkleClaim deployed to:", merkleClaim.address);

  console.log("Starting Merkle Verification");
  await hre.run("verify:verify", {
    address: "0x43c1dAF1505022Cb5C0b4d76F29D466D6CE062ED",
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
