const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");
const util = require("util");

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const ten = convert("10", 18);
const oneHundred = convert("100", 18);
const AddressZero = "0x0000000000000000000000000000000000000000";
const EPOCH_PERIOD = "864000";
const PRICE_MULTIPLIER = "2000000000000000000";

const OTOKEN = "0x7629668774f918c00Eb4b03AdF5C4e2E53d45f0b";
const VTOKEN = "0x2B4141f98B8cD2a03F58bD722D4E8916d2106504";
const rewarder = "0xD6c2BE22e7b766c810690B22234044407dDa1C1B";
const voter = "0x1f9505Ae18755915DcD2a95f38c7560Cab149d9C";
const VAULT_FACTORY = "0x2B6e40f65D82A0cB98795bC7587a71bfa49fBB2B"; // Vault Factory Address

const HIVE_NAME = "Gumball Bero";
const HIVE_SYMBOL = "gumyBERO";
const HIVE_URI = "uri";
const HIVE_DESCRIPTION = "description";
const HIVE_REWARD = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03"; // HONEY

// Contract Variables
let hiveFactory, hiveMulticall;
let hiveTokenFactory,
  hiveRewarderFactory,
  hiveDistroFactory,
  hiveFeeFlowFactory;
let hiveToken, hiveRewarder, hiveDistro, hiveFeeFlow;

/*===================================================================*/
/*===========================  CONTRACT DATA  =======================*/

async function getContracts() {
  console.log("Retrieving Contracts");

  hiveFactory = await ethers.getContractAt(
    "contracts/HiveToken/HiveFactory.sol:HiveFactory",
    "0x0394F3ea16c1f28Bb164cE8e894A10167Fc76781"
  );
  hiveTokenFactory = await ethers.getContractAt(
    "contracts/HiveToken/HiveTokenFactory.sol:HiveTokenFactory",
    "0x175aB340088B7248584BaD2DFaCE04095f5De594"
  );
  hiveRewarderFactory = await ethers.getContractAt(
    "contracts/HiveToken/HiveRewarderFactory.sol:HiveRewarderFactory",
    "0xcdCf3125381684B2E8894Fa728f888e220841aEc"
  );
  hiveDistroFactory = await ethers.getContractAt(
    "contracts/HiveToken/HiveDistroFactory.sol:HiveDistroFactory",
    "0xa4A376D0f4492020AccFBC2717FAdDB7b2c74dc8"
  );
  hiveFeeFlowFactory = await ethers.getContractAt(
    "contracts/HiveToken/HiveFeeFlowFactory.sol:HiveFeeFlowFactory",
    "0xCd5206211FC9153E52BE9468Cb9396C09c5255cF"
  );
  hiveMulticall = await ethers.getContractAt(
    "contracts/HiveToken/HiveMulticall.sol:HiveMulticall",
    "0xD060CB4361c7F7B70243069C67c18CfdC3cFbd4C"
  );

  hiveToken = await ethers.getContractAt(
    "contracts/HiveToken/HiveTokenFactory.sol:HiveToken",
    "0x3319085Ab92ab235F9C904F2f9Aef9592D175Dd3"
  );
  hiveRewarder = await ethers.getContractAt(
    "contracts/HiveToken/HiveRewarderFactory.sol:HiveRewarder",
    "0xcCD6ca034E26F96aF1DDbe3927100d2804DB6f85"
  );
  hiveDistro = await ethers.getContractAt(
    "contracts/HiveToken/HiveDistroFactory.sol:HiveDistro",
    "0xFd60d2f8A67b41D3F2539f4f44714bBf3AD8e6B1"
  );
  hiveFeeFlow = await ethers.getContractAt(
    "contracts/HiveToken/HiveFeeFlowFactory.sol:HiveFeeFlow",
    "0x800620775d9c7318436312D634C643A22f085309"
  );

  console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployHiveFactory() {
  console.log("Starting HiveFactory Deployment");
  const hiveFactoryArtifact = await ethers.getContractFactory("HiveFactory");
  const hiveFactoryContract = await hiveFactoryArtifact.deploy(
    OTOKEN,
    VTOKEN,
    rewarder,
    voter,
    { gasPrice: ethers.gasPrice }
  );
  hiveFactory = await hiveFactoryContract.deployed();
  await sleep(5000);
  console.log("HiveFactory Deployed at:", hiveFactory.address);
}

async function deployHiveTokenFactory() {
  console.log("Starting HiveTokenFactory Deployment");
  const hiveTokenFactoryArtifact = await ethers.getContractFactory(
    "HiveTokenFactory"
  );
  const hiveTokenFactoryContract = await hiveTokenFactoryArtifact.deploy(
    hiveFactory.address,
    {
      gasPrice: ethers.gasPrice,
    }
  );
  hiveTokenFactory = await hiveTokenFactoryContract.deployed();
  await sleep(5000);
  console.log("HiveTokenFactory Deployed at:", hiveTokenFactory.address);
}

async function deployHiveRewarderFactory() {
  console.log("Starting HiveRewarderFactory Deployment");
  const hiveRewarderFactoryArtifact = await ethers.getContractFactory(
    "HiveRewarderFactory"
  );
  const hiveRewarderFactoryContract = await hiveRewarderFactoryArtifact.deploy(
    hiveFactory.address,
    VAULT_FACTORY,
    {
      gasPrice: ethers.gasPrice,
    }
  );
  hiveRewarderFactory = await hiveRewarderFactoryContract.deployed();
  await sleep(5000);
  console.log("HiveRewarderFactory Deployed at:", hiveRewarderFactory.address);
}

async function deployHiveDistroFactory() {
  console.log("Starting HiveDistroFactory Deployment");
  const hiveDistroFactoryArtifact = await ethers.getContractFactory(
    "HiveDistroFactory"
  );
  const hiveDistroFactoryContract = await hiveDistroFactoryArtifact.deploy(
    hiveFactory.address,
    {
      gasPrice: ethers.gasPrice,
    }
  );
  hiveDistroFactory = await hiveDistroFactoryContract.deployed();
  await sleep(5000);
  console.log("HiveDistroFactory Deployed at:", hiveDistroFactory.address);
}

async function deployHiveFeeFlowFactory() {
  console.log("Starting HiveFeeFlowFactory Deployment");
  const hiveFeeFlowFactoryArtifact = await ethers.getContractFactory(
    "HiveFeeFlowFactory"
  );
  const hiveFeeFlowFactoryContract = await hiveFeeFlowFactoryArtifact.deploy(
    hiveFactory.address,
    {
      gasPrice: ethers.gasPrice,
    }
  );
  hiveFeeFlowFactory = await hiveFeeFlowFactoryContract.deployed();
  await sleep(5000);
  console.log("HiveFeeFlowFactory Deployed at:", hiveFeeFlowFactory.address);
}

async function deployHiveMulticall() {
  console.log("Starting HiveMulticall Deployment");
  const hiveMulticallArtifact = await ethers.getContractFactory(
    "HiveMulticall"
  );
  const hiveMulticallContract = await hiveMulticallArtifact.deploy(
    hiveFactory.address,
    OTOKEN,
    VTOKEN,
    rewarder,
    voter,
    {
      gasPrice: ethers.gasPrice,
    }
  );
  hiveMulticall = await hiveMulticallContract.deployed();
  await sleep(5000);
  console.log("HiveMulticall Deployed at:", hiveMulticall.address);
}

async function printFactoryAddresses() {
  console.log("**************************************************************");
  console.log("HiveFactory: ", hiveFactory.address);
  console.log("HiveTokenFactory: ", hiveTokenFactory.address);
  console.log("HiveRewarderFactory: ", hiveRewarderFactory.address);
  console.log("HiveDistroFactory: ", hiveDistroFactory.address);
  console.log("HiveFeeFlowFactory: ", hiveFeeFlowFactory.address);
  console.log("HiveMulticall: ", hiveMulticall.address);
  console.log("**************************************************************");
}

async function verifyHiveFactory() {
  console.log("Starting HiveFactory Verification");
  await hre.run("verify:verify", {
    address: hiveFactory.address,
    contract: "contracts/HiveToken/HiveFactory.sol:HiveFactory",
    constructorArguments: [OTOKEN, VTOKEN, rewarder, voter],
  });
  console.log("HiveFactory Verified");
}

async function verifyHiveTokenFactory() {
  console.log("Starting HiveTokenFactory Verification");
  await hre.run("verify:verify", {
    address: hiveTokenFactory.address,
    contract: "contracts/HiveToken/HiveTokenFactory.sol:HiveTokenFactory",
    constructorArguments: [hiveFactory.address],
  });
  console.log("HiveTokenFactory Verified");
}

async function verifyHiveRewarderFactory() {
  console.log("Starting HiveRewarderFactory Verification");
  await hre.run("verify:verify", {
    address: hiveRewarderFactory.address,
    contract: "contracts/HiveToken/HiveRewarderFactory.sol:HiveRewarderFactory",
    constructorArguments: [hiveFactory.address, VAULT_FACTORY],
  });
  console.log("HiveRewarderFactory Verified");
}

async function verifyHiveDistroFactory() {
  console.log("Starting HiveDistroFactory Verification");
  await hre.run("verify:verify", {
    address: hiveDistroFactory.address,
    contract: "contracts/HiveToken/HiveDistroFactory.sol:HiveDistroFactory",
    constructorArguments: [hiveFactory.address],
  });
  console.log("HiveDistroFactory Verified");
}

async function verifyHiveFeeFlowFactory() {
  console.log("Starting HiveFeeFlowFactory Verification");
  await hre.run("verify:verify", {
    address: hiveFeeFlowFactory.address,
    contract: "contracts/HiveToken/HiveFeeFlowFactory.sol:HiveFeeFlowFactory",
    constructorArguments: [hiveFactory.address],
  });
  console.log("HiveFeeFlowFactory Verified");
}

async function verifyHiveMulticall() {
  console.log("Starting HiveMulticall Verification");
  await hre.run("verify:verify", {
    address: hiveMulticall.address,
    contract: "contracts/HiveToken/HiveMulticall.sol:HiveMulticall",
    constructorArguments: [
      hiveFactory.address,
      OTOKEN,
      VTOKEN,
      rewarder,
      voter,
    ],
  });
  console.log("HiveMulticall Verified");
}

async function setUpSystem() {
  console.log("Starting System Set Up");

  await hiveFactory.setHiveTokenFactory(hiveTokenFactory.address);
  await sleep(5000);
  console.log("HiveTokenFactory set to HiveFactory");
  await hiveFactory.setHiveRewarderFactory(hiveRewarderFactory.address);
  await sleep(5000);
  console.log("HiveRewarderFactory set to HiveFactory");
  await hiveFactory.setHiveDistroFactory(hiveDistroFactory.address);
  await sleep(5000);
  console.log("HiveDistroFactory set to HiveFactory");
  await hiveFactory.setHiveFeeFlowFactory(hiveFeeFlowFactory.address);
  await sleep(5000);
  console.log("HiveFeeFlowFactory set to HiveFactory");

  console.log("System Initialized");
}

async function deployHive() {
  console.log("Starting Hive Deployment");
  // await hiveFactory.createHive(
  //   HIVE_NAME,
  //   HIVE_SYMBOL,
  //   HIVE_URI,
  //   HIVE_DESCRIPTION,
  //   HIVE_REWARD,
  //   oneHundred,
  //   ten,
  //   { gasPrice: ethers.gasPrice }
  // );
  console.log("Hive Deployed");
  let res = await hiveFactory.index_Hive(0);
  console.log("HiveToken: ", res.hiveToken);
  console.log("HiveRewarder: ", res.hiveRewarder);
  console.log("HiveDistro: ", res.hiveDistro);
  console.log("HiveFeeFlow: ", res.hiveFeeFlow);
}

async function verifyHiveToken(wallet) {
  console.log("Starting Token Verification");
  await hre.run("verify:verify", {
    address: hiveToken.address,
    contract: "contracts/HiveToken/HiveTokenFactory.sol:HiveToken",
    constructorArguments: [
      hiveFactory.address,
      wallet,
      HIVE_NAME,
      HIVE_SYMBOL,
      HIVE_URI,
      HIVE_DESCRIPTION,
    ],
  });
  console.log("HiveToken Verified");
}

async function verifyHiveRewarder() {
  console.log("Starting Rewarder Verification");
  await hre.run("verify:verify", {
    address: hiveRewarder.address,
    contract: "contracts/HiveToken/HiveRewarderFactory.sol:HiveRewarder",
    constructorArguments: [
      hiveFactory.address,
      hiveToken.address,
      VAULT_FACTORY,
    ],
  });
  console.log("HiveRewarder Verified");
}

async function verifyHiveDistro() {
  console.log("Starting Distro Verification");
  await hre.run("verify:verify", {
    address: hiveDistro.address,
    contract: "contracts/HiveToken/HiveDistroFactory.sol:HiveDistro",
    constructorArguments: [
      hiveFactory.address,
      hiveToken.address,
      hiveRewarder.address,
    ],
  });
  console.log("HiveDistro Verified");
}

async function verifyHiveFeeFlow() {
  console.log("Starting FeeFlow Verification");
  await hre.run("verify:verify", {
    address: hiveFeeFlow.address,
    contract: "contracts/HiveToken/HiveFeeFlowFactory.sol:HiveFeeFlow",
    constructorArguments: [
      AddressZero,
      oneHundred,
      HIVE_REWARD,
      hiveDistro.address,
      EPOCH_PERIOD,
      PRICE_MULTIPLIER,
      ten,
    ],
  });
  console.log("HiveFeeFlow Verified");
}

async function main() {
  const [wallet] = await ethers.getSigners();
  console.log("Using wallet: ", wallet.address);

  await getContracts();

  //===================================================================
  // 1. Deploy Hive System
  //===================================================================

  // console.log("Starting Factory Deployment");
  // await deployHiveFactory();
  // await deployHiveTokenFactory();
  // await deployHiveRewarderFactory();
  // await deployHiveDistroFactory();
  // await deployHiveFeeFlowFactory();
  // await deployHiveMulticall();
  // await printFactoryAddresses();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 2. Verify factory contracts
  //===================================================================

  // console.log("Starting Factory Verification");
  // await verifyHiveFactory();
  // await verifyHiveTokenFactory();
  // await verifyHiveRewarderFactory();
  // await verifyHiveDistroFactory();
  // await verifyHiveFeeFlowFactory();
  // await verifyHiveMulticall();
  // console.log("Factory Contracts Verified");

  //===================================================================
  // 3. Set up System
  //===================================================================

  // console.log("Starting System Set Up");
  // await setUpSystem();
  // console.log("System Set Up");

  //===================================================================
  // 5. Deploy Hive
  //===================================================================

  // console.log("Starting Hive Deployment");
  // await deployHive();
  // console.log("Hive Deployed");

  //===================================================================
  // 6. Verify Hive Contracts
  //===================================================================

  // console.log("Starting Hive Verification");
  // await verifyHiveToken(wallet.address);
  // await verifyHiveRewarder();
  // await verifyHiveDistro();
  // await verifyHiveFeeFlow();
  // console.log("Hive Contracts Verified");

  //===================================================================
  // 7. Transactions
  //===================================================================

  // await hiveToken.setVotes(
  //   [
  //     "0xb488543f69a9462F62b2E944C81CFd16Cf0237c0",
  //     "0x1d0B737feFcF45BC550a0B9c8a0f7f14BcCEce4d",
  //     "0x6D1B5054C87dE76C8c4c3eCBe1cd5354b0876c32",
  //   ],
  //   [100, 100, 100]
  // );

  // console.log("Hive Index: ", await hiveFactory.hiveIndex());
  // console.log("Hive By Index: ", await hiveFactory.getHiveByIndex(0));

  // console.log("Hive length: ", await hiveMulticall.getHiveLength());
  // console.log("Hives: ", await hiveMulticall.getHives(0, 1));
  // console.log(
  //   "Get Hive at index 1: ",
  //   await hiveMulticall.getHive(
  //     "0xEecB3702A301AEab3E58D890847999A25972B74b",
  //     AddressZero
  //   )
  // );
  // console.log("Hive By Index: ", await hiveFactory.getHiveByIndex(0));
  const auction = await hiveMulticall.getAuction(
    "0x3319085Ab92ab235F9C904F2f9Aef9592D175Dd3"
  );
  console.log(
    "Auction: ",
    util.inspect(auction, { depth: null, colors: true })
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
