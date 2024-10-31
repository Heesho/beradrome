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
const HONEY = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";
const WBERA = "0x7507c1dc16935B82698e4C63f2746A2fCf994dF8";
const USDC = "0xd6D83aF58a19Cd14eF3CF6fe848C9A4d21e5727c";
const WBTC = "0x2577D24a26f8FA19c1058a8b0106E2c7303454a4";
const WETH = "0xE28AfD8c634946833e89ee3F122C06d7C537E8A8";
const STGUSDC = "0xd6D83aF58a19Cd14eF3CF6fe848C9A4d21e5727c";
const YEET = "0x1740F679325ef3686B2f574e392007A92e4BeD41";
const NECT = "0xf5AFCF50006944d17226978e594D4D25f4f92B40";
const POLLEN = "0xa591eef221369321De76d958dC023936Fb39B26A";
const MIM = "0x08B918dD18E087893bb9d711d9E0BBaA7a63Ef63";
const SPELL = "0x802762e604CE08a79DA2BA809281D727A690Fa0d";
const oBERO = "0x7629668774f918c00Eb4b03AdF5C4e2E53d45f0b";
const DIRAC = "0x277aaDBd9ea3dB8Fe9eA40eA6E09F6203724BdaE";
const PAW = "0xB43fd1dC4f02d81f962E98203b2cc4FD9E342964";
const IBGT = "0x46efc86f0d7455f135cc9df501673739d513e982";
const KDK = "0xfd27998fa0eaB1A6372Db14Afd4bF7c4a58C5364";
const XKDK = "0x414B50157a5697F14e91417C5275A7496DcF429D";

// Station Berps bHONEY
// get from https://bartio.berps.berachain.com/vault
const STATION0 = "0x1306D3c36eC7E38dd2c128fBe3097C2C2449af64";
const STATION0_TOKENS = [HONEY];
const STATION0_SYMBOL = "Berps bHONEY";
const STATION0_NAME = "Beradrome Station Berps bHONEY Vault Token";

// Station Bex HONEY-WBERA
// get from https://bartio.bex.berachain.com/add-liquidity/0xd28d852cbcc68DCEC922f6d5C7a8185dBaa104B7
const STATION1 = "0xd28d852cbcc68DCEC922f6d5C7a8185dBaa104B7";
const STATION1_TOKENS = [HONEY, WBERA];
const STATION1_SYMBOL = "Bex HONEY-WBERA";
const STATION1_NAME = "Beradrome Station Bex HONEY-WBERA Vault Token";

// Station Bex HONEY-USDC
// get from https://bartio.bex.berachain.com/add-liquidity/0xd69adb6fb5fd6d06e6ceec5405d95a37f96e3b96
const STATION2 = "0xD69ADb6FB5fD6D06E6ceEc5405D95A37F96E3b96";
const STATION2_TOKENS = [HONEY, USDC];
const STATION2_SYMBOL = "Bex HONEY-USDC";
const STATION2_NAME = "Beradrome Station Bex HONEY-USDC Vault Token";

// Infrared Berps bHONEY
// get from https://bartio.berps.berachain.com/vault
const INFRARED_VAULT_0 = "0x7d91bf5851b3a8bcf8c39a69af2f0f98a4e2202a";
const INFRARED_TOKENS_0 = [HONEY];
const INFRARED_REWARDS_0 = [IBGT];
const INFRARED_SYMBOL_0 = "Berps bHONEY";
const INFRARED_NAME_0 = "Beradrome Infrared Berps bHONEY Vault Token";

// Infrared Bex HONEY-USDC
// get from https://bartio.bex.berachain.com/add-liquidity/0xd69adb6fb5fd6d06e6ceec5405d95a37f96e3b96
const INFRARED_VAULT_1 = "0x675547750f4acdf64ed72e9426293f38d8138ca8";
const INFRARED_TOKENS_1 = [HONEY, USDC];
const INFRARED_REWARDS_1 = [IBGT];
const INFRARED_SYMBOL_1 = "Bex HONEY-USDC";
const INFRARED_NAME_1 = "Beradrome Infrared Bex HONEY-USDC Vault Token";

// Infrared Bex HONEY-WBERA
// get from https://bartio.bex.berachain.com/add-liquidity/0xd28d852cbcc68DCEC922f6d5C7a8185dBaa104B7
const INFRARED_VAULT_2 = "0x5c5f9a838747fb83678ece15d85005fd4f558237";
const INFRARED_TOKENS_2 = [HONEY, WBERA];
const INFRARED_REWARDS_2 = [IBGT];
const INFRARED_SYMBOL_2 = "Bex HONEY-WBERA";
const INFRARED_NAME_2 = "Beradrome Infrared Bex HONEY-WBERA Vault Token";

// Infrared iBGT
// get from https://infrared.finance/vaults
const INFRARED_VAULT_5 = "0x31e6458c83c4184a23c761fdaffb61941665e012";
const INFRARED_TOKENS_5 = [IBGT];
const INFRARED_REWARDS_5 = [HONEY];
const INFRARED_SYMBOL_5 = "iBGT";
const INFRARED_NAME_5 = "Beradrome Infrared iBGT Vault Token";

// Trifecta Kodiak YEET-WBERA Island
const TRIFECTA3 = "0xE5A2ab5D2fb268E5fF43A5564e44c3309609aFF9";
const TRIFECTA3_FARM = "0xbdEE3F788a5efDdA1FcFe6bfe7DbbDa5690179e6";
const TRIFECTA3_TOKEN0 = YEET;
const TRIFECTA3_TOKEN1 = WBERA;
const TRIFECTA3_OTHER_REWARDS = [YEET];
const TRIFECTA3_SYMBOL = "YEET-WBERA Island";
const TRIFECTA3_NAME = "Beradrome Trifecta YEET-WBERA Island Vault Token";

// Triefcta Kodiak BERA-oBERO Island
const TRIFECTA8 = "0xbfbEfcfAE7a58C14292B53C2CcD95bF2c5742EB0";
const TRIFECTA8_FARM = "0x1812FC946EF5809f8efCEF28Afa6ec9030907748";
const TRIFECTA8_TOKEN0 = WBERA;
const TRIFECTA8_TOKEN1 = oBERO;
const TRIFECTA8_OTHER_REWARDS = [oBERO, HONEY];
const TRIFECTA8_SYMBOL = "BERA-oBERO Island";
const TRIFECTA8_NAME = "Beradrome Trifecta BERA-oBERO Island Vault Token";

// Trifecta Kodiak HONEY-NECT Island
const TRIFECTA9 = "0x63b0EdC427664D4330F72eEc890A86b3F98ce225";
const TRIFECTA9_FARM = "0x09347F35B29bD3B8a581a8507F0831aA4d1Af8a9";
const TRIFECTA9_TOKEN0 = HONEY;
const TRIFECTA9_TOKEN1 = NECT;
const TRIFECTA9_OTHER_REWARDS = [POLLEN];
const TRIFECTA9_SYMBOL = "HONEY-NECT Island";
const TRIFECTA9_NAME = "Beradrome Trifecta HONEY-NECT Island Vault Token";

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;

// Contract Variables
let TOKEN, OTOKEN, VTOKEN, fees, rewarder, governor;
let voter, minter, gaugeFactory, bribeFactory;
let multicall, controller, trifectaMulticall;

let stationPlugin;
let stationPluginFactory;

let infraredPlugin;
let infraredPluginFactory;

let trifectaPlugin;
let trifectaPluginFactory;

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
    "0x7Be2f10657e9caE26362928bBC5BC57213daCbfC"
  );
  bribeFactory = await ethers.getContractAt(
    "contracts/BribeFactory.sol:BribeFactory",
    "0xe4dc780a0cd539C9a76f02a1315EdF50561eED6d"
  );
  voter = await ethers.getContractAt(
    "contracts/VaultVoter.sol:VaultVoter",
    "0xCb31ac33f2fa669FD043fA5539f5b28a0Bd21339"
  );
  minter = await ethers.getContractAt(
    "contracts/Minter.sol:Minter",
    "0x8A832cd3f401f6D32689B2ea2f2E1f7009BE00AC"
  );

  multicall = await ethers.getContractAt(
    "contracts/Multicall.sol:Multicall",
    "0x1cB91c6095F7C68E32d788316d547b278eDc49d0"
  );
  trifectaMulticall = await ethers.getContractAt(
    "contracts/TrifectaMulticall.sol:TrifectaMulticall",
    "0xF6b0EBa9Ff3caC2e3261084A7f3B7714aF4479d4"
  );
  controller = await ethers.getContractAt(
    "contracts/Controller.sol:Controller",
    "0x086c00d207f05DB520c58A2a5cC7B2D29226968D"
  );

  stationPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/StationPluginFactory.sol:StationPluginFactory",
    "0x8Ffd2893e0BCf4f822745Db64d61d5bd5824DA2D"
  );

  stationPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/StationPluginFactory.sol:StationPlugin",
    "0xD9431A6800Fbd31089a7B816fdd4689f413C07cc"
  );

  infraredPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPluginFactory",
    "0x490Ce0b0E8c5d4B7f4FD386cA8Bf71b799ECD6BB"
  );

  infraredPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPlugin",
    "0xa792a5f7d9B1Bfd572e6b7AbBe9344ca3eAE9345"
  );

  trifectaPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPluginFactory",
    "0xBa35c6A886bcd4A2C9F5d99040E008f58B785279"
  );

  trifectaPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPlugin",
    "0x7852c68E4959f056BC2DFD952C9C892daBe75Ce8"
  );

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

async function verifyTrifectaMulticall() {
  console.log("Starting TrifectaMulticall Verification");
  await hre.run("verify:verify", {
    address: trifectaMulticall.address,
    contract: "contracts/TrifectaMulticall.sol:TrifectaMulticall",
    constructorArguments: [voter.address],
  });
  console.log("TrifectaMulticall Verified");
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

  //   await sleep(5000);
  //   await gaugeFactory.setVoter(voter.address);
  //   await sleep(5000);
  //   await bribeFactory.setVoter(voter.address);
  //   await sleep(5000);
  //   console.log("Factories Set Up");

  // await VTOKEN.setVoter(voter.address);
  // await sleep(5000);
  // console.log("Token-Voting Set Up");

  // await voter.initialize(minter.address);
  // await sleep(5000);
  // await minter.setVoter(voter.address);
  // await sleep(5000);
  // console.log("Minter Set Up");

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
    STATION2,
    STATION2_TOKENS,
    STATION2_SYMBOL,
    STATION2_NAME,
    { gasPrice: ethers.gasPrice }
  );
  await sleep(10000);
  console.log(
    "StationPlugin Deployed at:",
    await stationPluginFactory.last_plugin()
  );
}

async function verifyStationPlugin() {
  console.log("Starting StationPlugin Verification");
  await hre.run("verify:verify", {
    address: stationPlugin.address,
    contract:
      "contracts/plugins/berachain/StationPluginFactory.sol:StationPlugin",
    constructorArguments: [
      STATION0,
      voter.address,
      STATION0_TOKENS,
      [WBERA],
      VAULT_FACTORY,
      "0xC5Cb3459723B828B3974f7E58899249C2be3B33d",
      "BGT Station",
      STATION0_SYMBOL,
      STATION0_NAME,
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
    INFRARED_VAULT_5,
    INFRARED_TOKENS_5,
    INFRARED_REWARDS_5,
    INFRARED_SYMBOL_5,
    INFRARED_NAME_5,
    { gasPrice: ethers.gasPrice }
  );
  await sleep(10000);
  console.log(
    "InfraredPlugin Deployed at:",
    await infraredPluginFactory.last_plugin()
  );
}

async function verifyInfraredPlugin() {
  console.log("Starting InfraredPlugin Verification");
  await hre.run("verify:verify", {
    address: infraredPlugin.address,
    contract:
      "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPlugin",
    constructorArguments: [
      BHONEY,
      voter.address,
      INFRARED_TOKENS_0,
      INFRARED_REWARDS_0,
      VAULT_FACTORY,
      INFRARED_VAULT_0,
      "Infrared",
      INFRARED_SYMBOL_0,
      INFRARED_NAME_0,
    ],
  });
  console.log("InfraredPlugin Verified");
}

async function deployTrifectaPluginFactory() {
  console.log("Starting TrifectaPluginFactory Deployment");
  const trifectaPluginFactoryArtifact = await ethers.getContractFactory(
    "TrifectaPluginFactory"
  );
  const trifectaPluginFactoryContract =
    await trifectaPluginFactoryArtifact.deploy(voter.address, {
      gasPrice: ethers.gasPrice,
    });
  trifectaPluginFactory = await trifectaPluginFactoryContract.deployed();
  console.log(
    "TrifectaPluginFactory Deployed at:",
    trifectaPluginFactory.address
  );
}

async function verifyTrifectaPluginFactory() {
  console.log("Starting TrifectaPluginFactory Verification");
  await hre.run("verify:verify", {
    address: trifectaPluginFactory.address,
    contract:
      "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPluginFactory",
    constructorArguments: [voter.address],
  });
  console.log("TrifectaPluginFactory Verified");
}

async function deployTrifectaPlugin() {
  console.log("Starting TrifectaPlugin Deployment");
  await trifectaPluginFactory.createPlugin(
    TRIFECTA9,
    TRIFECTA9_FARM,
    TRIFECTA9_TOKEN0,
    TRIFECTA9_TOKEN1,
    TRIFECTA9_OTHER_REWARDS,
    TRIFECTA9_SYMBOL,
    TRIFECTA9_NAME
  );
  await sleep(10000);
  console.log(
    "TrifectaPlugin Deployed at:",
    await trifectaPluginFactory.last_plugin()
  );
}

async function verifyTrifectaPlugin() {
  console.log("Starting TrifectaPlugin Verification");
  await hre.run("verify:verify", {
    address: trifectaPlugin.address,
    contract:
      "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPlugin",
    constructorArguments: [
      TRIFECTA3,
      voter.address,
      [TRIFECTA3_TOKEN0, TRIFECTA3_TOKEN1],
      TRIFECTA3_OTHER_REWARDS,
      VAULT_FACTORY,
      TRIFECTA3_FARM,
      "Kodiak Trifecta",
      TRIFECTA3_SYMBOL,
      TRIFECTA3_NAME,
    ],
  });
}

async function main() {
  const [wallet] = await ethers.getSigners();
  console.log("Using wallet: ", wallet.address);

  await getContracts();

  //===================================================================
  // 3. Deploy Voting System
  //===================================================================

  //   console.log("Starting Voting Deployment");
  //   await deployGaugeFactory(wallet.address);
  //   await deployBribeFactory(wallet.address);
  //   await deployVoter();
  //   await printVotingAddresses();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 4. Deploy Ancillary Contracts
  //===================================================================

  //   console.log("Starting Ancillary Deployment");
  //   await deployMulticall();
  //   await deployTrifectaMulticall();
  //   await deployController();
  //   await printAncillaryAddresses();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 6. Verify Voting Contracts
  //===================================================================

  //   console.log("Starting Voting Verification");
  //   await verifyGaugeFactory(wallet.address);
  //   await verifyBribeFactory(wallet.address);
  //   await verifyVoter();
  //   console.log("Voting Contracts Verified");

  //===================================================================
  // 7. Verify Ancillary Contracts
  //===================================================================

  //   console.log("Starting Ancillary Verification");
  //   await verifyMulticall();
  //   await verifyTrifectaMulticall();
  //   await verifyController();
  //   console.log("Ancillary Contracts Verified");

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
  //   await transferOwnership();
  // console.log("Ownership Transferred");

  //===================================================================
  // 11. Deploy Station Plugin Factory
  //===================================================================

  //   console.log("Starting StationPlugin Deployment");
  //   await deployStationPluginFactory();
  //   await verifyStationPluginFactory();
  //   console.log("StationPlugin Deployed and Verified");

  //===================================================================
  // 12. Deploy Station Plugin
  //===================================================================

  // console.log("Starting StationPlugin Deployment");
  //   await deployStationPlugin();
  //   await verifyStationPlugin();
  // console.log("StationPlugin Deployed and Verified");

  //===================================================================
  // 13. Deploy Infrared Plugin Factory
  //===================================================================

  // console.log("Starting InfraredPluginFactory Deployment");
  //   await deployInfraredPluginFactory();
  //   await verifyInfraredPluginFactory();
  // console.log("InfraredPluginFactory Deployed and Verified");

  //===================================================================
  // 14. Deploy Infrared Plugin
  //===================================================================

  // console.log("Starting InfraredPlugin Deployment");
  //   await deployInfraredPlugin();
  //   await verifyInfraredPlugin();
  // console.log("InfraredPlugin Deployed and Verified");

  //===================================================================
  // 17. Deploy Trifecta Plugin
  //===================================================================

  // console.log("Starting TrifectaPluginFactory Deployment");
  //   await deployTrifectaPluginFactory();
  //   await verifyTrifectaPluginFactory();
  // console.log("TrifectaPluginFactory Deployed and Verified");

  //===================================================================
  // 18. Deploy Trifecta Plugin
  //===================================================================

  // console.log("Starting TrifectaPlugin Deployment");
  //   await deployTrifectaPlugin();
  //   await verifyTrifectaPlugin();
  // console.log("TrifectaPlugin Deployed and Verified");

  //===================================================================
  // 13. Add Gauge Rewards
  //===================================================================

  //   await voter.connect(wallet).addGaugeReward(
  //     "0x08C90dCD955DD6fCF34B0222d8C65DB96dc671Ff",
  //     KDK // KDK
  //   ); // KDK added to Trifecta YEET-WBERA Island Gauge
  //   console.log("- KDK added as gauge reward");
  //   await voter.connect(wallet).addGaugeReward(
  //     "0x08C90dCD955DD6fCF34B0222d8C65DB96dc671Ff",
  //     XKDK // xKDK
  //   ); // xKDK added to Trifecta YEET-WBERA Island Gauge
  //   console.log("- xKDK added as gauge rewards");

  //===================================================================
  // 10. Add plugins to voter
  //===================================================================

  //   Add station plugins
  //   console.log("Adding STATION0 to Voter");
  //   await voter.addPlugin("0xD9431A6800Fbd31089a7B816fdd4689f413C07cc"); // Station Berps bHONEY
  //   await sleep(10000);
  //   console.log("Adding STATION1 to Voter");
  //   await voter.addPlugin("0x716129c60B5e9aCE74330becb2dC82DC45386679"); // Station Bex HONEY-WBERA
  //   await sleep(10000);
  //   console.log("Adding STATION2 to Voter");
  //   await voter.addPlugin("0x7dcDBd9CaDfD8Fad1622f83d1F4d6b527881fDA6"); // Station Bex HONEY-USDC
  //   await sleep(10000);

  //   Add infrared plugins
  //   console.log("Adding INFRARED0 to Voter");
  //   await voter.addPlugin("0xa792a5f7d9B1Bfd572e6b7AbBe9344ca3eAE9345"); // Infrared Berps bHONEY
  //   await sleep(10000);
  //   console.log("Adding INFRARED1 to Voter");
  //   await voter.addPlugin("0xc3520c7F0d101c4b4Cc2089D9896aD8C3C1c2691"); // Infrared Bex HONEY-USDC
  //   await sleep(10000);
  //   console.log("Adding INFRARED2 to Voter");
  //   await voter.addPlugin("0x1b5f2161fF46eEd74dC777F7BD9a78d565036349"); // Infrared Bex HONEY-WBERA
  //   await sleep(10000);
  //   console.log("Adding INFRARED5 to Voter");
  //   await voter.addPlugin("0xB6a8d4fb828FA9014568FbF85A65485194356C85"); // Infrared iBGT
  //   await sleep(10000);

  //   Add trifecta plugins
  //   console.log("Adding TRIFECTA3 to Voter");
  //   await voter.addPlugin("0x7852c68E4959f056BC2DFD952C9C892daBe75Ce8"); // Kodiak Trifecta YEET-WBERA Island
  //   await sleep(10000);
  //   console.log("Adding TRIFECTA8 to Voter");
  //   await voter.addPlugin("0x6392624B35CB280048311ac66e320a3F45f4fDCa"); // Kodiak Trifecta BERA-oBERO Island
  //   await sleep(10000);
  //   console.log("Adding TRIFECTA9 to Voter");
  //   await voter.addPlugin("0xcc6Cb6821DF1629297C8CC8998229c600DE4ab0d"); // Kodiak Trifecta HONEY-NECT Island
  //   await sleep(10000);

  //===================================================================
  // 13. Print Deployment
  //===================================================================

  //   console.log("BerachainV2 Bartio Deployment");
  //   console.log();
  //   console.log("voter: ", await voter.address);
  //   console.log("gaugeFactory: ", await gaugeFactory.address);
  //   console.log("bribeFactory: ", await bribeFactory.address);
  //   console.log();
  //   console.log("multicall: ", await multicall.address);
  //   console.log("trifectaMulticall: ", await trifectaMulticall.address);
  //   console.log("controller: ", await controller.address);
  //   console.log();
  //   console.log("StationPluginFactory: ", await stationPluginFactory.address);
  //   console.log("InfraredPluginFactory: ", await infraredPluginFactory.address);
  //   console.log("TrifectaPluginFactory: ", await trifectaPluginFactory.address);
  // console.log();
  // console.log("Reward Vault: ", await voter.rewardVault());
  // console.log("Vault Token: ", await voter.vaultToken());

  //===================================================================
  // 13. Print Plugins
  //===================================================================

  //   let plugins = [
  //     "0xD9431A6800Fbd31089a7B816fdd4689f413C07cc",
  //     "0x716129c60B5e9aCE74330becb2dC82DC45386679",
  //     "0x7dcDBd9CaDfD8Fad1622f83d1F4d6b527881fDA6",
  //     "0xa792a5f7d9B1Bfd572e6b7AbBe9344ca3eAE9345",
  //     "0xc3520c7F0d101c4b4Cc2089D9896aD8C3C1c2691",
  //     "0x1b5f2161fF46eEd74dC777F7BD9a78d565036349",
  //     "0xB6a8d4fb828FA9014568FbF85A65485194356C85",
  //     "0x7852c68E4959f056BC2DFD952C9C892daBe75Ce8",
  //     "0x6392624B35CB280048311ac66e320a3F45f4fDCa",
  //     "0xcc6Cb6821DF1629297C8CC8998229c600DE4ab0d",
  //   ];

  //   for (let i = 0; i < plugins.length; i++) {
  //     let plugin = await controller.getPlugin(plugins[i]);

  //     console.log("Protocol: ", plugin.protocol);
  //     console.log("Name: ", plugin.name);
  //     console.log("Token: ", plugin.token);
  //     console.log("Plugin: ", plugin.plugin);
  //     console.log("Gauge: ", plugin.gauge);
  //     console.log("Bribe: ", plugin.bribe);
  //     console.log("Vault Token: ", plugin.vaultToken);
  //     console.log("Reward Vault: ", plugin.rewardVault);
  //     console.log();
  //   }

  //===================================================================
  // 13. Print Plugins
  //===================================================================

  // console.log("Distributing Rewards");
  // await voter.distro();
  // console.log("Voter Rewards Distributed");
  // await fees.distribute();
  // console.log("Fees Rewards Distributed");
  // await voter.distributeToBribes([
  //   "0xD9431A6800Fbd31089a7B816fdd4689f413C07cc", // Station Berps bHONEY
  //   "0x716129c60B5e9aCE74330becb2dC82DC45386679", // Station Bex HONEY-WBERA
  //   "0x7dcDBd9CaDfD8Fad1622f83d1F4d6b527881fDA6", // Station Bex HONEY-USDC
  // ]);
  // console.log("Station Bribe Rewards Distributed");
  // await voter.distributeToBribes([
  //   "0xa792a5f7d9B1Bfd572e6b7AbBe9344ca3eAE9345", // Infrared Berps bHONEY
  //   "0xc3520c7F0d101c4b4Cc2089D9896aD8C3C1c2691", // Infrared Bex HONEY-USDC
  //   "0x1b5f2161fF46eEd74dC777F7BD9a78d565036349", // Infrared Bex HONEY-WBERA
  //   "0xB6a8d4fb828FA9014568FbF85A65485194356C85", // Infrared HONEY-WBTC Plugin
  // ]);
  // console.log("Infrared Bribe Rewards Distributed");
  // await voter.distributeToBribes([
  //   "0x7852c68E4959f056BC2DFD952C9C892daBe75Ce8", // Kodiak Trifecta YEET-WBERA Island
  //   "0x6392624B35CB280048311ac66e320a3F45f4fDCa", // Kodiak Trifecta BERA-oBERO Island
  //   "0xcc6Cb6821DF1629297C8CC8998229c600DE4ab0d", // Kodiak Trifecta HONEY-NECT Island
  // ]);
  // console.log("Kodiak TrifectaBribe Rewards Distributed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
