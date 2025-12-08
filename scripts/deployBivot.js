const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const one = convert("1", 18);
const onePointTwo = convert("1.2", 18);
const ten = convert("10", 18);
const oneHundred = convert("100", 18);
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

const MULTISIG = "0xaB53AfB5C63E2552e7bD986c0a38E8a8dC58E09C"; // Multisig Address
const VAULT_FACTORY = "0x94Ad6Ac84f6C6FbA8b8CCbD71d9f4f101def52a8"; // Vault Factory Address
const BERO = "0x7838CEc5B11298Ff6a9513Fa385621B765C74174";
const FEES = "0x06030C39b241F5e7F3A2AF25e0D10ca1f8EbA5D3";
const VOTER = "0xd7ea36ECA1cA3E73bC262A6D05DB01E60AE4AD47";
const OBERO = "0x40A8d9efE6A2C6C9D193Cc0A4476767748E68133";
const HIBERO = "0x7F0976b52F6c1ddcD4d6f639537C97DE22fa2b69";
const REWARDER = "0x8a5547dBDBa815036aE67d36835DB687fd94865E";
const HONEY = "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce";

const INFRARED_FUND_FACTORY = "0x0a0C653F3FB69906dFC77b845a24c285071d3144";

// Contract Variables
let auctionFactory, rewardAuction;
let controller, router;
let swapMulticall, farmMulticall, voterMulticall, auctionMulticall;

let infraredFund;
let infraredFundFactory;

async function getContracts() {
  auctionFactory = await ethers.getContractAt(
    "contracts/AuctionFactory.sol:AuctionFactory",
    "0xf8A62A08fdEdc90F01226cAbb366ea78e2ed2eD3"
  );
  rewardAuction = await ethers.getContractAt(
    "contracts/AuctionFactory.sol:Auction",
    "0x7e915228aD9E1ce983E830eFb2b475E554274a3F"
  );

  controller = await ethers.getContractAt(
    "contracts/Controller.sol:Controller",
    "0xe03a89eb8b75d73Caf762a81dA260106fD42F18A"
  );
  router = await ethers.getContractAt(
    "contracts/Router.sol:Router",
    "0xf0A25665F14b49A233CDdbD2879B3AFA54172dF7"
  );

  swapMulticall = await ethers.getContractAt(
    "contracts/multicalls/SwapMulticall.sol:SwapMulticall",
    "0xF69614F4Ee8D4D3879dd53d5A039eB3114C794F6"
  );
  farmMulticall = await ethers.getContractAt(
    "contracts/multicalls/FarmMulticall.sol:FarmMulticall",
    "0x7a85CA4b4E15df2a7b927Fa56edb050d2399B34c"
  );
  voterMulticall = await ethers.getContractAt(
    "contracts/multicalls/VoterMulticall.sol:VoterMulticall",
    "0xC23E316705Feef0922F0651488264db90133ED38"
  );
  auctionMulticall = await ethers.getContractAt(
    "contracts/multicalls/AuctionMulticall.sol:AuctionMulticall",
    "0x30F8e847fCf1bC750A1fDCE7bd329FEc4c8277F9"
  );

  //   infraredFund = await ethers.getContractAt(
  //     "contracts/funds/InfraredFundFactory.sol:InfraredFund",
  //     ""
  //   );
  infraredFundFactory = await ethers.getContractAt(
    "contracts/funds/InfraredFundFactory.sol:InfraredFundFactory",
    INFRARED_FUND_FACTORY
  );

  console.log("Contracts Retrieved");
}

async function deployAuctionFactory() {
  console.log("Starting AuctionFactory Deployment");
  const auctionFactoryArtifact = await ethers.getContractFactory(
    "AuctionFactory"
  );
  const auctionFactoryContract = await auctionFactoryArtifact.deploy({
    gasPrice: ethers.gasPrice,
  });
  auctionFactory = await auctionFactoryContract.deployed();
  await sleep(5000);
  console.log("AuctionFactory Deployed at:", auctionFactory.address);
}

async function verifyAuctionFactory() {
  console.log("Starting AuctionFactory Verification");
  await hre.run("verify:verify", {
    address: auctionFactory.address,
    contract: "contracts/AuctionFactory.sol:AuctionFactory",
  });
  console.log("AuctionFactory Verified");
}

async function deployRewardAuction() {
  console.log("Starting RewardAuction Deployment");
  await auctionFactory.createAuction(
    oneHundred,
    false,
    BERO,
    FEES,
    86400,
    onePointTwo,
    ten
  );
  rewardAuction = await ethers.getContractAt(
    "contracts/AuctionFactory.sol:Auction",
    await auctionFactory.last_auction()
  );
  console.log(
    "RewardAuction Deployed at:",
    await auctionFactory.last_auction()
  );
}

async function verifyRewardAuction() {
  console.log("Starting RewardAuction Verification");
  await hre.run("verify:verify", {
    address: rewardAuction.address,
    contract: "contracts/AuctionFactory.sol:Auction",
    constructorArguments: [
      oneHundred,
      false,
      BERO,
      FEES,
      ADDRESS_ZERO,
      86400,
      onePointTwo,
      ten,
    ],
  });
  console.log("RewardAuction Verified");
}

async function printAuctionAddresses() {
  console.log("**************************************************************");
  console.log("AuctionFactory: ", auctionFactory.address);
  console.log("RewardAuction: ", rewardAuction.address);
  console.log("**************************************************************");
}

async function deployController() {
  console.log("Starting Controller Deployment");
  const controllerArtifact = await ethers.getContractFactory("Controller");
  const controllerContract = await controllerArtifact.deploy(VOTER, FEES, {
    gasPrice: ethers.gasPrice,
  });
  controller = await controllerContract.deployed();
  await sleep(5000);
  console.log("Controller Deployed at:", controller.address);
}

async function verifyController() {
  console.log("Starting Controller Verification");
  await hre.run("verify:verify", {
    address: controller.address,
    contract: "contracts/Controller.sol:Controller",
    constructorArguments: [VOTER, FEES],
  });
  console.log("Controller Verified");
}

async function deployRouter() {
  console.log("Starting Router Deployment");
  const routerArtifact = await ethers.getContractFactory("Router");
  const routerContract = await routerArtifact.deploy(
    controller.address,
    VOTER,
    BERO,
    OBERO,
    rewardAuction.address,
    { gasPrice: ethers.gasPrice }
  );
  router = await routerContract.deployed();
  await sleep(5000);
  console.log("Router Deployed at:", router.address);
}

async function verifyRouter() {
  console.log("Starting Router Verification");
  await hre.run("verify:verify", {
    address: router.address,
    contract: "contracts/Router.sol:Router",
    constructorArguments: [
      controller.address,
      VOTER,
      BERO,
      OBERO,
      rewardAuction.address,
    ],
  });
  console.log("Router Verified");
}

async function printAncillaryAddresses() {
  console.log("**************************************************************");
  console.log("Controller: ", controller.address);
  console.log("Router: ", router.address);
  console.log("**************************************************************");
}

async function deploySwapMulticall() {
  console.log("Starting SwapMulticall Deployment");
  const swapMulticallArtifact = await ethers.getContractFactory(
    "SwapMulticall"
  );
  const swapMulticallContract = await swapMulticallArtifact.deploy(
    VOTER,
    HONEY,
    BERO,
    OBERO,
    HIBERO,
    REWARDER,
    controller.address,
    { gasPrice: ethers.gasPrice }
  );
  swapMulticall = await swapMulticallContract.deployed();
  await sleep(5000);
  console.log("SwapMulticall Deployed at:", swapMulticall.address);
}

async function verifySwapMulticall() {
  console.log("Starting SwapMulticall Verification");
  await hre.run("verify:verify", {
    address: swapMulticall.address,
    contract: "contracts/multicalls/SwapMulticall.sol:SwapMulticall",
    constructorArguments: [
      VOTER,
      HONEY,
      BERO,
      OBERO,
      HIBERO,
      REWARDER,
      controller.address,
    ],
  });
  console.log("SwapMulticall Verified");
}

async function deployFarmMulticall() {
  console.log("Starting FarmMulticall Deployment");
  const farmMulticallArtifact = await ethers.getContractFactory(
    "FarmMulticall"
  );
  const farmMulticallContract = await farmMulticallArtifact.deploy(
    VOTER,
    BERO,
    controller.address,
    { gasPrice: ethers.gasPrice }
  );
  farmMulticall = await farmMulticallContract.deployed();
  await sleep(5000);
  console.log("FarmMulticall Deployed at:", farmMulticall.address);
}

async function verifyFarmMulticall() {
  console.log("Starting FarmMulticall Verification");
  await hre.run("verify:verify", {
    address: farmMulticall.address,
    contract: "contracts/multicalls/FarmMulticall.sol:FarmMulticall",
    constructorArguments: [VOTER, BERO, controller.address],
  });
  console.log("FarmMulticall Verified");
}

async function deployVoterMulticall() {
  console.log("Starting VoterMulticall Deployment");
  const voterMulticallArtifact = await ethers.getContractFactory(
    "VoterMulticall"
  );
  const voterMulticallContract = await voterMulticallArtifact.deploy(VOTER, {
    gasPrice: ethers.gasPrice,
  });
  voterMulticall = await voterMulticallContract.deployed();
  await sleep(5000);
  console.log("VoterMulticall Deployed at:", voterMulticall.address);
}

async function verifyVoterMulticall() {
  console.log("Starting VoterMulticall Verification");
  await hre.run("verify:verify", {
    address: voterMulticall.address,
    contract: "contracts/multicalls/VoterMulticall.sol:VoterMulticall",
    constructorArguments: [VOTER],
  });
  console.log("VoterMulticall Verified");
}
async function deployAuctionMulticall() {
  console.log("Starting AuctionMulticall Deployment");
  const auctionMulticallArtifact = await ethers.getContractFactory(
    "contracts/multicalls/AuctionMulticall.sol:AuctionMulticall"
  );
  const auctionMulticallContract = await auctionMulticallArtifact.deploy(
    VOTER,
    BERO,
    OBERO,
    rewardAuction.address,
    controller.address,
    { gasPrice: ethers.gasPrice }
  );
  auctionMulticall = await auctionMulticallContract.deployed();
  await sleep(5000);
  console.log("AuctionMulticall Deployed at:", auctionMulticall.address);
}

async function verifyAuctionMulticall() {
  console.log("Starting AuctionMulticall Verification");
  await hre.run("verify:verify", {
    address: auctionMulticall.address,
    contract: "contracts/multicalls/AuctionMulticall.sol:AuctionMulticall",
    constructorArguments: [
      VOTER,
      BERO,
      OBERO,
      rewardAuction.address,
      controller.address,
    ],
  });
  console.log("AuctionMulticall Verified");
}

async function printMulticallAddresses() {
  console.log("**************************************************************");
  console.log("SwapMulticall: ", swapMulticall.address);
  console.log("FarmMulticall: ", farmMulticall.address);
  console.log("VoterMulticall: ", voterMulticall.address);
  console.log("AuctionMulticall: ", auctionMulticall.address);
  console.log("**************************************************************");
}

async function deployInfraredFundFactory() {
  console.log("Starting Infrared Fund Factory Deployment");
  const infraredFundFactoryArtifact = await ethers.getContractFactory(
    "InfraredFundFactory"
  );
  const infraredFundFactoryContract = await infraredFundFactoryArtifact.deploy(
    MULTISIG,
    rewardAuction.address,
    auctionFactory.address,
    { gasPrice: ethers.gasPrice }
  );
  infraredFundFactory = await infraredFundFactoryContract.deployed();
  await sleep(5000);
  console.log(
    "Infrared Fund Factory Deployed at:",
    infraredFundFactory.address
  );
}

async function verifyInfraredFundFactory() {
  console.log("Starting Infrared Fund Factory Verification");
  await hre.run("verify:verify", {
    address: infraredFundFactory.address,
    contract: "contracts/funds/InfraredFundFactory.sol:InfraredFundFactory",
    constructorArguments: [
      MULTISIG,
      rewardAuction.address,
      auctionFactory.address,
    ],
  });
  console.log("Infrared Fund Factory Verified");
}

async function main() {
  const [wallet] = await ethers.getSigners();
  console.log("Using wallet: ", wallet.address);

  await getContracts();

  //===================================================================
  // Deploy Auction Factory
  //===================================================================

  //   console.log("Starting Auction Factory Deployment");
  //   await deployAuctionFactory();
  //   await deployRewardAuction();
  //   await printAuctionAddresses();

  //===================================================================
  // Verify Auction Factory
  //===================================================================

  //   console.log("Starting Auction Factory Verification");
  //   await verifyAuctionFactory();
  //   await verifyRewardAuction();
  //   console.log("Auction Factory Verified");

  //===================================================================
  // Deploy Ancillary Contracts
  //===================================================================

  //   console.log("Starting Ancillary Deployment");
  //   await deployController();
  //   await deployRouter();
  //   await printAncillaryAddresses();

  //===================================================================
  // Verify Ancillary Contracts
  //===================================================================

  //   console.log("Starting Ancillary Verification");
  //   await verifyController();
  //   await verifyRouter();
  //   console.log("Ancillary Contracts Verified");

  //===================================================================
  // Deploy Multicall Contracts
  //===================================================================

  //   console.log("Starting Multicall Deployment");
  //   await deploySwapMulticall();
  //   await deployFarmMulticall();
  //   await deployVoterMulticall();
  //   await deployAuctionMulticall();
  //   await printMulticallAddresses();

  //===================================================================
  // Verify Multicall Contracts
  //===================================================================

  //   console.log("Starting Multicall Verification");
  //   await verifySwapMulticall();
  //   await verifyFarmMulticall();
  //   await verifyVoterMulticall();
  //   await verifyAuctionMulticall();
  //   console.log("Multicall Contracts Verified");

  //===================================================================
  // Set Auction Split
  //===================================================================

  //   console.log("Starting Auction Split Set");
  //   await auctionFactory.setSplit(4000);
  //   console.log("Auction Split Set");

  //===================================================================
  // Transfer Auction Factory Ownership
  //===================================================================

  //   console.log("Starting Auction Factory Ownership Transfer");
  //   await auctionFactory.transferOwnership(MULTISIG);
  //   console.log("Auction Factory Ownership Transferred");

  //===================================================================
  // Deploy Infrared Fund Factory
  //===================================================================

  //   console.log("Starting Infrared Fund Factory Deployment");
  //   await deployInfraredFundFactory();
  //   console.log("Infrared Fund Factory Deployed");

  //===================================================================
  // Verify Infrared Fund Factory
  //===================================================================

  //   console.log("Starting Infrared Fund Factory Verification");
  //   await verifyInfraredFundFactory();
  //   console.log("Infrared Fund Factory Verified");

  //===================================================================
  // Deploy Infrared Fund
  //===================================================================

  //   console.log("Starting Infrared Fund Deployment");
  //   await deployInfraredFund();
  //   console.log("Infrared Fund Deployed");

  //===================================================================
  // Verify Infrared Fund
  //===================================================================

  //   console.log("Starting Infrared Fund Verification");
  //   await verifyInfraredFund();
  //   console.log("Infrared Fund Verified");

  //===================================================================
  // Print Deployment
  //===================================================================

  console.log("Beradrome Bivot Deployment");
  printAuctionAddresses();
  printAncillaryAddresses();
  printMulticallAddresses();
  console.log("Infrared Fund Factory: ", infraredFundFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
