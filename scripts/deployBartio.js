const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

const MARKET_RESERVES = "250000"; // 250,000 TOKEN in market reserves

const BASE_ADDRESS = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03"; // HONEY address
const MULTISIG = "0x34D023ACa5A227789B45A62D377b5B18A680BE01"; // Multisig Address
const VAULT_FACTORY = "0x2B6e40f65D82A0cB98795bC7587a71bfa49fBB2B"; // Vault Factory Address

const BHONEY = "0x1306D3c36eC7E38dd2c128fBe3097C2C2449af64";
const HONEY = "";
const WBERA = "";
const USDC = "";
const WBTC = "";
const WETH = "";
const STGUSDC = "";
const YEET = "";
const NECT = "";
const tHPOT = "";
const IBGT = "0x46efc86f0d7455f135cc9df501673739d513e982";

// Infrared Berps bHONEY
const INFRARED_VAULT_0 = "";
const INFRARED_TOKENS_0 = [HONEY];
const INFRARED_REWARDS_0 = [IBGT];
const INFRARED_SYMBOL_0 = "Berps bHONEY";
const INFRARED_NAME_0 = "Beradrome Infrared Berps bHONEY Vault Token";

// Infrared Bex HONEY-USDC
const INFRARED_VAULT_1 = "";
const INFRARED_TOKENS_1 = [HONEY, USDC];
const INFRARED_REWARDS_1 = [IBGT];
const INFRARED_SYMBOL_1 = "Bex HONEY-USDC";
const INFRARED_NAME_1 = "Beradrome Infrared Bex HONEY-USDC Vault Token";

// Infrared Bex HONEY-WBERA
const INFRARED_VAULT_2 = "";
const INFRARED_TOKENS_2 = [HONEY, WBERA];
const INFRARED_REWARDS_2 = [IBGT];
const INFRARED_SYMBOL_2 = "Bex HONEY-WBERA";
const INFRARED_NAME_2 = "Beradrome Infrared Bex HONEY-WBERA Vault Token";

// Infrared Bex HONEY-WBTC
const INFRARED_VAULT_3 = "";
const INFRARED_TOKENS_3 = [HONEY, WBTC];
const INFRARED_REWARDS_3 = [IBGT];
const INFRARED_SYMBOL_3 = "Bex HONEY-WBTC";
const INFRARED_NAME_3 = "Beradrome Infrared Bex HONEY-WBTC Vault Token";

// Infrared Bex HONEY-WETH
const INFRARED_VAULT_4 = "";
const INFRARED_TOKENS_4 = [HONEY, WETH];
const INFRARED_REWARDS_4 = [IBGT];
const INFRARED_SYMBOL_4 = "Bex HONEY-WETH";
const INFRARED_NAME_4 = "Beradrome Infrared Bex HONEY-WETH Vault Token";

// Infrared iBGT
const INFRARED_VAULT_5 = "";
const INFRARED_TOKENS_5 = [IBGT];
const INFRARED_REWARDS_5 = [HONEY];
const INFRARED_SYMBOL_5 = "iBGT";
const INFRARED_NAME_5 = "Beradrome Infrared iBGT Vault Token";

// Infrared Kodiak iBGT-WBERA
const INFRARED_VAULT_6 = "";
const INFRARED_TOKENS_6 = [IBGT, WBERA];
const INFRARED_REWARDS_6 = [IBGT];
const INFRARED_SYMBOL_6 = "Kodiak iBGT-WBERA";
const INFRARED_NAME_6 = "Beradrome Infrared Kodiak iBGT-WBERA Vault Token";

// Infrared Kodiak HONEY-STGUSDC
const INFRARED_VAULT_7 = "";
const INFRARED_TOKENS_7 = [HONEY, STGUSDC];
const INFRARED_REWARDS_7 = [IBGT];
const INFRARED_SYMBOL_7 = "Kodiak HONEY-STGUSDC";
const INFRARED_NAME_7 = "Beradrome Infrared Kodiak HONEY-STGUSDC Vault Token";

// Infrared Kodiak YEET-BERA
const INFRARED_VAULT_8 = "";
const INFRARED_TOKENS_8 = [YEET, WBERA];
const INFRARED_REWARDS_8 = [IBGT];
const INFRARED_SYMBOL_8 = "Kodiak YEET-BERA";
const INFRARED_NAME_8 = "Beradrome Infrared Kodiak YEET-BERA Vault Token";

// Infrared Kodiak NECT-HONEY
const INFRARED_VAULT_9 = "";
const INFRARED_TOKENS_9 = [NECT, HONEY];
const INFRARED_REWARDS_9 = [IBGT];
const INFRARED_SYMBOL_9 = "Kodiak NECT-HONEY";
const INFRARED_NAME_9 = "Beradrome Infrared Kodiak NECT-HONEY Vault Token";

// Infrared Honeypot WBERA-tHPOT
const INFRARED_VAULT_10 = "";
const INFRARED_TOKENS_10 = [WBERA, tHPOT];
const INFRARED_REWARDS_10 = [IBGT];
const INFRARED_SYMBOL_10 = "Honeypot WBERA-tHPOT";
const INFRARED_NAME_10 = "Beradrome Infrared Honeypot WBERA-tHPOT Vault Token";

// Kodiak HONEY-BERA Island
const KODIAK1 = "";
const KODIAK1_FARM = "";
const KODIAK1_TOKEN0 = HONEY;
const KODIAK1_TOKEN1 = WBERA;
const KODIAK1_OTHER_REWARDS = [];
const KODIAK1_SYMBOL = "HONEY-WBERA Island";
const KODIAK1_NAME = "Beradrome Kodiak HONEY-WBERA Island Vault Token";

// Kodiak HONEY-STGUSDC Island
const KODIAK2 = "";
const KODIAK2_FARM = "";
const KODIAK2_TOKEN0 = HONEY;
const KODIAK2_TOKEN1 = STGUSDC;
const KODIAK2_OTHER_REWARDS = [];
const KODIAK2_SYMBOL = "HONEY-STGUSDC Island";
const KODIAK2_NAME = "Beradrome Kodiak HONEY-STGUSDC Island Vault Token";

// Kodiak YEET-WBERA Island
const KODIAK3 = "";
const KODIAK3_FARM = "";
const KODIAK3_TOKEN0 = YEET;
const KODIAK3_TOKEN1 = WBERA;
const KODIAK3_OTHER_REWARDS = [YEET];
const KODIAK3_SYMBOL = "YEET-WBERA Island";
const KODIAK3_NAME = "Beradrome Kodiak YEET-WBERA Island Vault Token";

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const tenThousand = convert("10000", 18);
const BUILDER_ADDRESS = "0xDeb7d9B443a3ab779DFe9Ff2Aa855b1eA5fD318e";

// Contract Variables
let TOKEN, OTOKEN, VTOKEN, fees, rewarder, governor;
let voter, minter, gaugeFactory, bribeFactory;
let multicall, controller;
let trifectaMulticall;

let stationPlugin;
let stationPluginFactory;

let infraredPlugin;
let infraredPluginFactory;

let kodiakPlugin;
let kodiakPluginFactory;

/*===================================================================*/
/*===========================  CONTRACT DATA  =======================*/

async function getContracts() {
  TOKEN = await ethers.getContractAt(
    "contracts/TOKEN.sol:TOKEN",
    "0xB5A27c33bA2ADEcee8CdBE94cEF5576E2F364A8f"
  );
  OTOKEN = await ethers.getContractAt(
    "contracts/OTOKENFactory.sol:OTOKEN",
    await TOKEN.OTOKEN()
  );
  VTOKEN = await ethers.getContractAt(
    "contracts/VTOKENFactory.sol:VTOKEN",
    await TOKEN.VTOKEN()
  );
  fees = await ethers.getContractAt(
    "contracts/TOKENFeesFactory.sol:TOKENFees",
    await TOKEN.FEES()
  );
  rewarder = await ethers.getContractAt(
    "contracts/VTOKENRewarderFactory.sol:VTOKENRewarder",
    await VTOKEN.rewarder()
  );
  governor = await ethers.getContractAt(
    "contracts/TOKENGovernor.sol:TOKENGovernor",
    "0x5e608DfC40ACcBC1B830daA9350398e8017A2E0D"
  );

  gaugeFactory = await ethers.getContractAt(
    "contracts/GaugeFactory.sol:GaugeFactory",
    "0xA9E21e6aBf6A92CaEc52D14D4C76082321838cAE"
  );
  bribeFactory = await ethers.getContractAt(
    "contracts/BribeFactory.sol:BribeFactory",
    "0x4Bbb5456070dB7e47968c6F8DC715ea1254b3d30"
  );
  voter = await ethers.getContractAt(
    "contracts/VaultVoter.sol:VaultVoter",
    "0x823eF22dA06A9c0F15bdb10EcF1445954b37fBD3"
  );
  minter = await ethers.getContractAt(
    "contracts/Minter.sol:Minter",
    "0x8A832cd3f401f6D32689B2ea2f2E1f7009BE00AC"
  );

  multicall = await ethers.getContractAt(
    "contracts/Multicall.sol:Multicall",
    "0x56d14eFf7C1017cd60333b6d678715450159e82f"
  );
  controller = await ethers.getContractAt(
    "contracts/Controller.sol:Controller",
    "0x5dcAc080Fe375E36399591651ecA8012A1Ab2014"
  );

  //   trifectaMulticall = await ethers.getContractAt(
  //     "contracts/TrifectaMulticall.sol:TrifectaMulticall",
  //     ""
  //   );

  stationPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/StationPluginFactory.sol:StationPluginFactory",
    "0x29A503Cf472007921f0B0A5FDE008EedE709D529"
  );

  // stationPlugin = await ethers.getContractAt(
  //   "contracts/plugins/berachain/StationPluginFactory.sol:StationPlugin",
  //   ""
  // );

  infraredPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPluginFactory",
    "0x058068d109Fdb8CdcE69c4A788CBc7dFa8e9128c"
  );

  // infraredPlugin = await ethers.getContractAt(
  //   "contracts/plugins/berachain/InfraredPlugin.sol:InfraredPlugin",
  //   ""
  // );

  kodiakPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/KodiakPluginFactory.sol:KodiakPluginFactory",
    "0x63716E917A5873cedBE4f804fa55AfF32cB8042B"
  );

  // kodiakPlugin = await ethers.getContractAt(
  //   "contracts/plugins/berachain/KodiakPlugin.sol:KodiakPlugin",
  //   ""
  // );

  console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployGaugeFactory(wallet) {
  console.log("Starting GaugeFactory Deployment");
  const gaugeFactoryArtifact = await ethers.getContractFactory("GaugeFactory");
  const gaugeFactoryContract = await gaugeFactoryArtifact.deploy(wallet, {
    gasPrice: ethers.gasPrice,
  });
  gaugeFactory = await gaugeFactoryContract.deployed();
  await sleep(5000);
  console.log("GaugeFactory Deployed at:", gaugeFactory.address);
}

async function deployBribeFactory(wallet) {
  console.log("Starting BribeFactory Deployment");
  const bribeFactoryArtifact = await ethers.getContractFactory("BribeFactory");
  const bribeFactoryContract = await bribeFactoryArtifact.deploy(wallet, {
    gasPrice: ethers.gasPrice,
  });
  bribeFactory = await bribeFactoryContract.deployed();
  await sleep(5000);
  console.log("BribeFactory Deployed at:", bribeFactory.address);
}

async function deployVoter() {
  console.log("Starting Voter Deployment");
  const voterArtifact = await ethers.getContractFactory("VaultVoter");
  const voterContract = await voterArtifact.deploy(
    VTOKEN.address,
    gaugeFactory.address,
    bribeFactory.address,
    VAULT_FACTORY,
    { gasPrice: ethers.gasPrice }
  );
  voter = await voterContract.deployed();
  await sleep(5000);
  console.log("Voter Deployed at:", voter.address);
}

async function printVotingAddresses() {
  console.log("**************************************************************");
  console.log("GaugeFactory: ", gaugeFactory.address);
  console.log("BribeFactory: ", bribeFactory.address);
  console.log("Voter: ", voter.address);
  console.log("**************************************************************");
}

async function verifyGaugeFactory(wallet) {
  console.log("Starting GaugeFactory Verification");
  await hre.run("verify:verify", {
    address: gaugeFactory.address,
    contract: "contracts/GaugeFactory.sol:GaugeFactory",
    constructorArguments: [wallet],
  });
  console.log("GaugeFactory Verified");
}

async function verifyBribeFactory(wallet) {
  console.log("Starting BribeFactory Verification");
  await hre.run("verify:verify", {
    address: bribeFactory.address,
    contract: "contracts/BribeFactory.sol:BribeFactory",
    constructorArguments: [wallet],
  });
  console.log("BribeFactory Verified");
}

async function verifyVoter() {
  console.log("Starting Voter Verification");
  await hre.run("verify:verify", {
    address: voter.address,
    contract: "contracts/VaultVoter.sol:VaultVoter",
    constructorArguments: [
      VTOKEN.address,
      gaugeFactory.address,
      bribeFactory.address,
      VAULT_FACTORY,
    ],
  });
  console.log("Voter Verified");
}

async function deployMulticall() {
  console.log("Starting Multicall Deployment");
  const multicallArtifact = await ethers.getContractFactory("Multicall");
  const multicallContract = await multicallArtifact.deploy(
    voter.address,
    BASE_ADDRESS,
    TOKEN.address,
    OTOKEN.address,
    VTOKEN.address,
    rewarder.address,
    { gasPrice: ethers.gasPrice }
  );
  multicall = await multicallContract.deployed();
  await sleep(5000);
  console.log("Multicall Deployed at:", multicall.address);
}

async function deployTrifectaMulticall() {
  console.log("Starting TrifectaMulticall Deployment");
  const trifectaMulticallArtifact = await ethers.getContractFactory(
    "TrifectaMulticall"
  );
  const trifectaMulticallContract = await trifectaMulticallArtifact.deploy(
    voter.address,
    { gasPrice: ethers.gasPrice }
  );
  trifectaMulticall = await trifectaMulticallContract.deployed();
  await sleep(5000);
  console.log("TrifectaMulticall Deployed at:", trifectaMulticall.address);
}

async function deployController() {
  console.log("Starting Controller Deployment");
  const controllerArtifact = await ethers.getContractFactory("Controller");
  const controllerContract = await controllerArtifact.deploy(
    voter.address,
    fees.address,
    { gasPrice: ethers.gasPrice }
  );
  controller = await controllerContract.deployed();
  await sleep(5000);
  console.log("Controller Deployed at:", controller.address);
}

async function printAncillaryAddresses() {
  console.log("**************************************************************");
  console.log("Multicall: ", multicall.address);
  console.log("Controller: ", controller.address);
  console.log("**************************************************************");
}

async function verifyMulticall() {
  console.log("Starting Multicall Verification");
  await hre.run("verify:verify", {
    address: multicall.address,
    contract: "contracts/Multicall.sol:Multicall",
    constructorArguments: [
      voter.address,
      BASE_ADDRESS,
      TOKEN.address,
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address,
    ],
  });
  console.log("Multicall Verified");
}

async function verifyController() {
  console.log("Starting Controller Verification");
  await hre.run("verify:verify", {
    address: controller.address,
    contract: "contracts/Controller.sol:Controller",
    constructorArguments: [voter.address, fees.address],
  });
  console.log("Controller Verified");
}

async function setUpSystem(wallet) {
  console.log("Starting System Set Up");

  await sleep(5000);
  await gaugeFactory.setVoter(voter.address);
  await sleep(5000);
  await bribeFactory.setVoter(voter.address);
  await sleep(5000);
  console.log("Factories Set Up");

  //   await VTOKEN.setVoter(voter.address);
  //   await sleep(5000);
  //   console.log("Token-Voting Set Up");

  //   await voter.initialize(minter.address);
  //   await sleep(5000);
  //   await minter.setVoter(voter.address);
  //   await sleep(5000);
  //   console.log("Minter Set Up");

  console.log("System Initialized");
}

async function transferOwnership() {
  await voter.transferOwnership(MULTISIG);
  await sleep(5000);
  console.log("Voter ownership transferred to governor");

  console.log("VTOKEN ownership transferred to governor");
}

async function verifyGauge(pluginAddress, gaugeAddress) {
  console.log("Starting Gauge Verification");
  await hre.run("verify:verify", {
    address: gaugeAddress,
    contract: "contracts/GaugeFactory.sol:Gauge",
    constructorArguments: [pluginAddress, voter.address],
  });
  console.log("Gauge Verified");
}

async function verifyBribe(bribeAddress) {
  console.log("Starting Bribe Verification");
  await hre.run("verify:verify", {
    address: bribeAddress,
    contract: "contracts/BribeFactory.sol:Bribe",
    constructorArguments: [voter.address],
  });
  console.log("Bribe Verified");
}

async function deployStationPluginFactory() {
  console.log("Starting StationPluginFactory Deployment");
  const stationPluginFactoryArtifact = await ethers.getContractFactory(
    "StationPluginFactory"
  );
  const stationPluginFactoryContract =
    await stationPluginFactoryArtifact.deploy(voter.address, {
      gasPrice: ethers.gasPrice,
    });
  stationPluginFactory = await stationPluginFactoryContract.deployed();
  console.log(
    "StationPluginFactory Deployed at:",
    stationPluginFactory.address
  );
}

async function verifyStationPluginFactory() {
  console.log("Starting StationPluginFactory Verification");
  await hre.run("verify:verify", {
    address: stationPluginFactory.address,
    contract:
      "contracts/plugins/berachain/StationPluginFactory.sol:StationPluginFactory",
    constructorArguments: [voter.address],
  });
  console.log("StationPluginFactory Verified");
}

async function deployStationPlugin() {
  console.log("Starting StationPlugin Deployment");
  await stationPluginFactory.createPlugin(
    BHONEY,
    [HONEY],
    [WBERA],
    "Berps bHONEY",
    "Berps bHONEY Plugin Vault Token",
    { gasPrice: ethers.gasPrice }
  );
  console.log("StationPlugin Deployed at:", stationPlugin.address);
}

async function verifyStationPlugin() {
  console.log("Starting StationPlugin Verification");
  await hre.run("verify:verify", {
    address: stationPlugin.address,
    contract:
      "contracts/plugins/berachain/StationPluginFactory.sol:StationPlugin",
    constructorArguments: [
      BHONEY,
      [HONEY],
      [WBERA],
      "Berps bHONEY",
      "Berps bHONEY Plugin Vault Token",
    ],
  });
  console.log("StationPlugin Verified");
}

async function deployInfraredPluginFactory() {
  console.log("Starting InfraredPluginFactory Deployment");
  const infraredPluginFactoryArtifact = await ethers.getContractFactory(
    "InfraredPluginFactory"
  );
  const infraredPluginFactoryContract =
    await infraredPluginFactoryArtifact.deploy(voter.address, {
      gasPrice: ethers.gasPrice,
    });
  infraredPluginFactory = await infraredPluginFactoryContract.deployed();
  console.log(
    "InfraredPluginFactory Deployed at:",
    infraredPluginFactory.address
  );
}

async function verifyInfraredPluginFactory() {
  console.log("Starting InfraredPluginFactory Verification");
  await hre.run("verify:verify", {
    address: infraredPluginFactory.address,
    contract:
      "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPluginFactory",
    constructorArguments: [voter.address],
  });
  console.log("InfraredPluginFactory Verified");
}

async function deployInfraredPlugin() {
  console.log("Starting InfraredPlugin Deployment");
  await infraredPluginFactory.createPlugin(
    BHONEY_INFRARED_VAULT,
    [HONEY],
    [IBGT],
    "Berps bHONEY",
    "Berps bHONEY Plugin Vault Token",
    { gasPrice: ethers.gasPrice }
  );
  console.log("InfraredPlugin Deployed at:", infraredPlugin.address);
}

async function verifyInfraredPlugin() {
  console.log("Starting InfraredPlugin Verification");
  await hre.run("verify:verify", {
    address: infraredPlugin.address,
    contract:
      "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPlugin",
    constructorArguments: [
      BHONEY_INFRARED_VAULT,
      [HONEY],
      [IBGT],
      "Berps bHONEY",
      "Berps bHONEY Plugin Vault Token",
    ],
  });
  console.log("InfraredPlugin Verified");
}

async function deployKodiakPluginFactory() {
  console.log("Starting KodiakPluginFactory Deployment");
  const kodiakPluginFactoryArtifact = await ethers.getContractFactory(
    "KodiakPluginFactory"
  );
  const kodiakPluginFactoryContract = await kodiakPluginFactoryArtifact.deploy(
    voter.address,
    { gasPrice: ethers.gasPrice }
  );
  kodiakPluginFactory = await kodiakPluginFactoryContract.deployed();
  console.log("KodiakPluginFactory Deployed at:", kodiakPluginFactory.address);
}

async function verifyKodiakPluginFactory() {
  console.log("Starting KodiakPluginFactory Verification");
  await hre.run("verify:verify", {
    address: kodiakPluginFactory.address,
    contract:
      "contracts/plugins/berachain/KodiakPluginFactory.sol:KodiakPluginFactory",
    constructorArguments: [voter.address],
  });
  console.log("KodiakPluginFactory Verified");
}

async function deployKodiakPlugin() {
  console.log("Starting KodiakPlugin Deployment");
  await kodiakPluginFactory.createPlugin(
    KODIAK1,
    KODIAK1_FARM,
    HONEY,
    WBERA,
    [YEET],
    "YEET-BERA Island",
    "Kodiak YEET-BERA Island Plugin Vault Token",
    { gasPrice: ethers.gasPrice }
  );
  console.log("KodiakPlugin Deployed at:", kodiakPlugin.address);
}

async function verifyKodiakPlugin() {
  console.log("Starting KodiakPlugin Verification");
  await hre.run("verify:verify", {
    address: kodiakPlugin.address,
    contract:
      "contracts/plugins/berachain/KodiakPluginFactory.sol:KodiakPlugin",
    constructorArguments: [
      KODIAK1,
      KODIAK1_FARM,
      HONEY,
      WBERA,
      [YEET],
      "YEET-BERA Island",
      "Kodiak YEET-BERA Island Plugin Vault Token",
    ],
  });
  console.log("KodiakPlugin Verified");
}

async function main() {
  const [wallet] = await ethers.getSigners();
  console.log("Using wallet: ", wallet.address);

  await getContracts();

  //===================================================================
  // 3. Deploy Voting System
  //===================================================================

  // console.log("Starting Voting Deployment");
  // await deployGaugeFactory(wallet.address);
  // await deployBribeFactory(wallet.address);
  // await deployVoter();
  // await printVotingAddresses();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 4. Deploy Ancillary Contracts
  //===================================================================

  // console.log("Starting Ancillary Deployment");
  // await deployMulticall();
  // await deployController();
  // await printAncillaryAddresses();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 6. Verify Voting Contracts
  //===================================================================

  // console.log('Starting Voting Verification');
  // await verifyGaugeFactory(wallet.address);
  // await verifyBribeFactory(wallet.address);
  // await verifyVoter();
  // console.log("Voting Contracts Verified")

  //===================================================================
  // 7. Verify Ancillary Contracts
  //===================================================================

  // console.log('Starting Ancillary Verification');
  // await verifyMulticall();
  // await verifyController();
  // console.log("Ancillary Contracts Verified")

  //===================================================================
  // 8. Set Up System
  //===================================================================

  // console.log("Starting System Set Up");
  // await setUpSystem(wallet.address);
  // console.log("System Set Up");

  //===================================================================
  // 9. Transfer Ownership
  //===================================================================

  // console.log("Starting Ownership Transfer");
  // await transferOwnership();
  // console.log("Ownership Transferred");

  //===================================================================
  // 10. Add plugins to voter
  //===================================================================

  // console.log("Adding Plugin0 to Voter");
  // await voter.addPlugin("");

  //===================================================================
  // 11. Deploy Station Plugin Factory
  //===================================================================

  // console.log("Starting StationPlugin Deployment");
  // await deployStationPluginFactory();
  // await verifyStationPluginFactory();
  // console.log("StationPlugin Deployed and Verified");

  //===================================================================
  // 12. Deploy Station Plugin
  //===================================================================

  // console.log("Starting StationPlugin Deployment");
  // await deployStationPlugin();
  // await verifyStationPlugin();
  // console.log("StationPlugin Deployed and Verified");

  //===================================================================
  // 13. Deploy Infrared Plugin Factory
  //===================================================================

  // console.log("Starting InfraredPluginFactory Deployment");
  // await deployInfraredPluginFactory();
  // await verifyInfraredPluginFactory();
  // console.log("InfraredPluginFactory Deployed and Verified");

  //===================================================================
  // 14. Deploy Infrared Plugin
  //===================================================================

  // console.log("Starting InfraredPlugin Deployment");
  // await deployInfraredPlugin();
  // await verifyInfraredPlugin();
  // console.log("InfraredPlugin Deployed and Verified");

  //===================================================================
  // 15. Deploy Kodiak Plugin Factory
  //===================================================================

  // console.log("Starting KodiakPluginFactory Deployment");
  // await deployKodiakPluginFactory();
  // await verifyKodiakPluginFactory();
  // console.log("KodiakPluginFactory Deployed and Verified");

  //===================================================================
  // 16. Deploy Kodiak Plugin
  //===================================================================

  // console.log("Starting KodiakPlugin Deployment");
  // await deployKodiakPlugin();
  // await verifyKodiakPlugin();
  // console.log("KodiakPlugin Deployed and Verified");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
