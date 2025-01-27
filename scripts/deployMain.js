const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;

const MARKET_RESERVES = "5000000"; // 5,000,000 TOKEN in market reserves

const BASE_ADDRESS = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03"; // HONEY address
const MULTISIG = "0x34D023ACa5A227789B45A62D377b5B18A680BE01"; // Multisig Address
const VAULT_FACTORY = "0x2B6e40f65D82A0cB98795bC7587a71bfa49fBB2B"; // Vault Factory Address

const BHONEY = "0x1306D3c36eC7E38dd2c128fBe3097C2C2449af64";
const HONEY = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";
const WBERA = "0x7507c1dc16935B82698e4C63f2746A2fCf994dF8";
const YEET = "0x8c245484890a61Eb2d1F81114b1a7216dCe2752b";
const IBGT = "0x46efc86f0d7455f135cc9df501673739d513e982";
const LBGT = "0x32Cf940DB5d7ea3e95e799A805B1471341241264";
const KDK = "0xfd27998fa0eaB1A6372Db14Afd4bF7c4a58C5364";
const XKDK = "0x414B50157a5697F14e91417C5275A7496DcF429D";

// Station Berps bHONEY
// get from https://bartio.berps.berachain.com/vault
const STATION_TOKEN_0 = BHONEY;
const STATION_TOKENS_0 = [HONEY];
const STATION_SYMBOL_0 = "Berps bHONEY";
const STATION_NAME_0 = "Beradrome BGT Station Berps bHONEY";
const STATION_PLUGIN_0 = "0xadcA05F72b2FbFF15fD8E584a64b018326aDF906";

// Infrared Berps bHONEY
const INFRARED_VAULT_0 = "0x7d91bf5851b3a8bcf8c39a69af2f0f98a4e2202a";
const INFRARED_TOKENS_0 = [HONEY];
const INFRARED_REWARDS_0 = [IBGT];
const INFRARED_SYMBOL_0 = "Berps bHONEY";
const INFRARED_NAME_0 = "Beradrome Infrared Berps bHONEY";
const INFRARED_PLUGIN_0 = "0x550A3A204C0889B826a2AA66844b71592bECE27c";

// BeraPaw Berps bHONEY
const BERAPAW_TOKEN_0 = BHONEY;
const BERAPAW_TOKENS_0 = [HONEY];
const BERAPAW_SYMBOL_0 = "Berps bHONEY";
const BERAPAW_NAME_0 = "Beradrome BeraPaw Berps bHONEY";
const BERAPAW_PLUGIN_0 = "0xFF5DF239dA19b60019EDaBD728Dd91F38577bF20";

// Trifecta Kodiak YEET-WBERA
const TRIFECTA_TOKEN_0 = "0x0001513F4a1f86da0f02e647609E9E2c630B3a14";
const TRIFECTA_FARM_0 = "0x62981673d7fcAf097A4Fc388A08C5726cA82522a";
const TRIFECTA_TOKEN0_0 = YEET;
const TRIFECTA_TOKEN1_0 = WBERA;
const TRIFECTA_OTHER_REWARDS_0 = [WBERA];
const TRIFECTA_SYMBOL_0 = "Kodiak Island-WBERA-YEET-1%";
const TRIFECTA_NAME_0 =
  "Beradrome Liquidity Trifecta Kodiak Island-WBERA-YEET-1%";
const TRIFECTA_PLUGIN_0 = "0xeb7ec84759dD2CF78DcB9902494dA982E06569bB";

// Bullas BULL iSH
const BULLAS_PLUGIN = "";

// Contract Variables
let OTOKENFactory, VTOKENFactory, feesFactory, rewarderFactory;
let TOKEN, OTOKEN, VTOKEN, fees, rewarder, governor;
let voter, minter, gaugeFactory, bribeFactory;
let multicall, controller, trifectaMulticall;

let stationPlugin;
let stationPluginFactory;

let infraredPlugin;
let infraredPluginFactory;

let trifectaPlugin;
let trifectaPluginFactory;

let berapawPlugin;
let berapawPluginFactory;

async function getContracts() {
  OTOKENFactory = await ethers.getContractAt(
    "contracts/OTOKENFactory.sol:OTOKENFactory",
    "0xBaE43C41A3511AdBED44f84119b06fB99218b53B"
  );
  VTOKENFactory = await ethers.getContractAt(
    "contracts/VTOKENFactory.sol:VTOKENFactory",
    "0xC8F6aB4e5Cadcf1416760470E290f65fFc26bCa7"
  );
  feesFactory = await ethers.getContractAt(
    "contracts/TOKENFeesFactory.sol:TOKENFeesFactory",
    "0x75bCDC4c0f5266ADB8a29D0B9fcE65D04B777f78"
  );
  rewarderFactory = await ethers.getContractAt(
    "contracts/VTOKENRewarderFactory.sol:VTOKENRewarderFactory",
    "0x6bE2c793C0824f5ff6d3b3ae50ca23E2e377F77A"
  );

  TOKEN = await ethers.getContractAt(
    "contracts/TOKEN.sol:TOKEN",
    "0xAB5E604ec509D123003ebC023EBF17Abe7354c9E"
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
    "0x7aa668c1465125d84F9BdE9a3434249B662895C0"
  );

  gaugeFactory = await ethers.getContractAt(
    "contracts/GaugeFactory.sol:GaugeFactory",
    "0x7Eb0041503124257F03b060Fc9C9f1310E850020"
  );
  bribeFactory = await ethers.getContractAt(
    "contracts/BribeFactory.sol:BribeFactory",
    "0x1b7d726b09c3dDAf964C70B1F2521d9DF1F0779E"
  );
  voter = await ethers.getContractAt(
    "contracts/VaultVoter.sol:VaultVoter",
    "0x8D3629b91Dfc11B438CE728f945F9FCfc90e2231"
  );
  minter = await ethers.getContractAt(
    "contracts/Minter.sol:Minter",
    "0x2BbD9cf40f383e6bfCd04767ecAdD6abe8951953"
  );

  multicall = await ethers.getContractAt(
    "contracts/Multicall.sol:Multicall",
    "0xe1C1369DBA4EcA2f427CEf0c4dAf2B4A508f4A03"
  );
  trifectaMulticall = await ethers.getContractAt(
    "contracts/TrifectaMulticall.sol:TrifectaMulticall",
    "0x790405A7Be020567ca9E8662aB54fedA04E7043c"
  );
  controller = await ethers.getContractAt(
    "contracts/Controller.sol:Controller",
    "0xAc350ad55080C4978D0886E798a9b8B0FD822b6C"
  );

  stationPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/StationPluginFactory.sol:StationPluginFactory",
    "0x6b3Ca094D1c085fd3c59993e60a91916aD1C4a11"
  );

  stationPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/StationPluginFactory.sol:StationPlugin",
    STATION_PLUGIN_0
  );

  infraredPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPluginFactory",
    "0xf2d60edd0634EaE0bEdE7D3BD0Dde80CF5aDeBdf"
  );

  infraredPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPlugin",
    INFRARED_PLUGIN_0
  );

  berapawPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/BeraPawPluginFactory.sol:BeraPawPluginFactory",
    "0x2B7b49Df8C01E0f6E612145d57dA99dA64A4E4e3"
  );

  berapawPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/BeraPawPluginFactory.sol:BeraPawPlugin",
    BERAPAW_PLUGIN_0
  );

  trifectaPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPluginFactory",
    "0x290DbDc28DaeDa506E895A43D485FAb0eFE5ccB0"
  );

  trifectaPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPlugin",
    TRIFECTA_PLUGIN_0
  );

  console.log("Contracts Retrieved");
}

async function deployOTOKENFactory() {
  console.log("Starting OTOKENFactory Deployment");
  const OTOKENFactoryArtifact = await ethers.getContractFactory(
    "OTOKENFactory"
  );
  const OTOKENFactoryContract = await OTOKENFactoryArtifact.deploy({
    gasPrice: ethers.gasPrice,
  });
  OTOKENFactory = await OTOKENFactoryContract.deployed();
  await sleep(5000);
  console.log("OTOKENFactory Deployed at:", OTOKENFactory.address);
}

async function deployVTOKENFactory() {
  console.log("Starting VTOKENFactory Deployment");
  const VTOKENFactoryArtifact = await ethers.getContractFactory(
    "VTOKENFactory"
  );
  const VTOKENFactoryContract = await VTOKENFactoryArtifact.deploy({
    gasPrice: ethers.gasPrice,
  });
  VTOKENFactory = await VTOKENFactoryContract.deployed();
  await sleep(5000);
  console.log("VTOKENFactory Deployed at:", VTOKENFactory.address);
}

async function deployFeesFactory() {
  console.log("Starting FeesFactory Deployment");
  const feesFactoryArtifact = await ethers.getContractFactory(
    "TOKENFeesFactory"
  );
  const feesFactoryContract = await feesFactoryArtifact.deploy({
    gasPrice: ethers.gasPrice,
  });
  feesFactory = await feesFactoryContract.deployed();
  await sleep(5000);
  console.log("FeesFactory Deployed at:", feesFactory.address);
}

async function deployRewarderFactory() {
  console.log("Starting RewarderFactory Deployment");
  const rewarderFactoryArtifact = await ethers.getContractFactory(
    "VTOKENRewarderFactory"
  );
  const rewarderFactoryContract = await rewarderFactoryArtifact.deploy({
    gasPrice: ethers.gasPrice,
  });
  rewarderFactory = await rewarderFactoryContract.deployed();
  await sleep(5000);
  console.log("RewarderFactory Deployed at:", rewarderFactory.address);
}

async function printFactoryAddresses() {
  console.log("**************************************************************");
  console.log("OTOKENFactory: ", OTOKENFactory.address);
  console.log("VTOKENFactory: ", VTOKENFactory.address);
  console.log("FeesFactory: ", feesFactory.address);
  console.log("RewarderFactory: ", rewarderFactory.address);
  console.log("**************************************************************");
}

async function deployTOKEN() {
  console.log("Starting TOKEN Deployment");
  const TOKENArtifact = await ethers.getContractFactory("TOKEN");
  const TOKENContract = await TOKENArtifact.deploy(
    BASE_ADDRESS,
    convert(MARKET_RESERVES, 18),
    OTOKENFactory.address,
    VTOKENFactory.address,
    rewarderFactory.address,
    feesFactory.address,
    VAULT_FACTORY,
    { gasPrice: ethers.gasPrice }
  );
  TOKEN = await TOKENContract.deployed();
  await sleep(5000);
  console.log("TOKEN Deployed at:", TOKEN.address);
}

async function deployGovernor() {
  console.log("Starting Governor Deployment");
  const governorArtifact = await ethers.getContractFactory("TOKENGovernor");
  const governorContract = await governorArtifact.deploy(VTOKEN.address, {
    gasPrice: ethers.gasPrice,
  });
  governor = await governorContract.deployed();
  await sleep(5000);
  console.log("Governor Deployed at:", governor.address);
}

async function printTokenAddresses() {
  console.log("**************************************************************");
  console.log("BERO: ", TOKEN.address);
  console.log("oBERO: ", OTOKEN.address);
  console.log("hiBERO: ", VTOKEN.address);
  console.log("Fees: ", fees.address);
  console.log("Rewarder: ", rewarder.address);
  console.log("Governor: ", governor.address);
  console.log("**************************************************************");
}

async function verifyTOKEN() {
  console.log("Starting TOKEN Verification");
  await hre.run("verify:verify", {
    address: TOKEN.address,
    contract: "contracts/TOKEN.sol:TOKEN",
    constructorArguments: [
      BASE_ADDRESS,
      convert(MARKET_RESERVES, 18),
      OTOKENFactory.address,
      VTOKENFactory.address,
      rewarderFactory.address,
      feesFactory.address,
      VAULT_FACTORY,
    ],
  });
  console.log("TOKEN Verified");
}

async function verifyOTOKEN(wallet) {
  console.log("Starting OTOKEN Verification");
  await hre.run("verify:verify", {
    address: OTOKEN.address,
    contract: "contracts/OTOKENFactory.sol:OTOKEN",
    constructorArguments: [wallet.address],
  });
  console.log("OTOKEN Verified");
}

async function verifyVTOKEN() {
  console.log("Starting VTOKEN Verification");
  await hre.run("verify:verify", {
    address: VTOKEN.address,
    contract: "contracts/VTOKENFactory.sol:VTOKEN",
    constructorArguments: [
      TOKEN.address,
      OTOKEN.address,
      rewarderFactory.address,
      VAULT_FACTORY,
    ],
  });
  console.log("VTOKEN Verified");
}

async function verifyFees() {
  console.log("TOKENFees Deployed at:", fees.address);
  console.log("Starting TOKENFees Verification");
  await hre.run("verify:verify", {
    address: await fees.address,
    contract: "contracts/TOKENFeesFactory.sol:TOKENFees",
    constructorArguments: [
      rewarder.address,
      TOKEN.address,
      BASE_ADDRESS,
      OTOKEN.address,
    ],
  });
  console.log("TOKENFees Verified");
}

async function verifyRewarder() {
  console.log("Rewarder Deployed at:", rewarder.address);
  console.log("Starting Rewarder Verification");
  await hre.run("verify:verify", {
    address: rewarder.address,
    contract: "contracts/VTOKENRewarderFactory.sol:VTOKENRewarder",
    constructorArguments: [VTOKEN.address],
  });
  console.log("Rewarder Verified");
}

async function verifyGovernor() {
  console.log("Starting Governor Verification");
  await hre.run("verify:verify", {
    address: governor.address,
    contract: "contracts/TOKENGovernor.sol:TOKENGovernor",
    constructorArguments: [VTOKEN.address],
  });
  console.log("Governor Verified");
}

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
  const voterArtifact = await ethers.getContractFactory("Voter");
  const voterContract = await voterArtifact.deploy(
    VTOKEN.address,
    gaugeFactory.address,
    bribeFactory.address,
    { gasPrice: ethers.gasPrice }
  );
  voter = await voterContract.deployed();
  await sleep(5000);
  console.log("Voter Deployed at:", voter.address);
}

async function deployMinter() {
  console.log("Starting Minter Deployment");
  const minterArtifact = await ethers.getContractFactory("Minter");
  const minterContract = await minterArtifact.deploy(
    voter.address,
    TOKEN.address,
    VTOKEN.address,
    OTOKEN.address,
    { gasPrice: ethers.gasPrice }
  );
  minter = await minterContract.deployed();
  await sleep(5000);
  console.log("Minter Deployed at:", minter.address);
}

async function printVotingAddresses() {
  console.log("**************************************************************");
  console.log("GaugeFactory: ", gaugeFactory.address);
  console.log("BribeFactory: ", bribeFactory.address);
  console.log("Voter: ", voter.address);
  console.log("Minter: ", minter.address);
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
    contract: "contracts/Voter.sol:Voter",
    constructorArguments: [
      VTOKEN.address,
      gaugeFactory.address,
      bribeFactory.address,
    ],
  });
  console.log("Voter Verified");
}

async function verifyMinter() {
  console.log("Starting Minter Verification");
  await hre.run("verify:verify", {
    address: minter.address,
    contract: "contracts/Minter.sol:Minter",
    constructorArguments: [
      voter.address,
      TOKEN.address,
      VTOKEN.address,
      OTOKEN.address,
    ],
  });
  console.log("Minter Verified");
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
  console.log("TrifectaMulticall: ", trifectaMulticall.address);
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

  await sleep(5000);
  await gaugeFactory.setVoter(voter.address);
  await sleep(5000);
  await bribeFactory.setVoter(voter.address);
  await sleep(5000);
  console.log("Factories Set Up");

  await VTOKEN.setVoter(voter.address);
  await sleep(5000);
  console.log("Token-Voting Set Up");

  await voter.initialize(minter.address);
  await sleep(5000);
  await minter.setVoter(voter.address);
  await sleep(5000);
  console.log("Minter Set Up");

  console.log("System Initialized");
}

async function transferOwnership() {
  await minter.setTeam(MULTISIG);
  await sleep(5000);
  console.log("Minter team set to MULTISIG");

  await minter.transferOwnership(MULTISIG);
  //   await minter.transferOwnership(governor.address);
  await sleep(5000);
  console.log("Minter ownership transferred to governor");

  await voter.transferOwnership(MULTISIG);
  //   await voter.transferOwnership(governor.address);
  await sleep(5000);
  console.log("Voter ownership transferred to governor");

  await VTOKEN.transferOwnership(MULTISIG);
  //   await VTOKEN.transferOwnership(governor.address);
  await sleep(5000);
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
    STATION_TOKEN_0,
    STATION_TOKENS_0,
    STATION_SYMBOL_0,
    STATION_NAME_0,
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
      STATION_TOKEN_0,
      voter.address,
      STATION_TOKENS_0,
      [WBERA],
      VAULT_FACTORY,
      "0xc5cb3459723b828b3974f7e58899249c2be3b33d",
      "BGT Station",
      STATION_SYMBOL_0,
      STATION_NAME_0,
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
    INFRARED_VAULT_0,
    INFRARED_TOKENS_0,
    INFRARED_REWARDS_0,
    INFRARED_SYMBOL_0,
    INFRARED_NAME_0,
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
    TRIFECTA_TOKEN_0,
    TRIFECTA_FARM_0,
    TRIFECTA_TOKEN0_0,
    TRIFECTA_TOKEN1_0,
    TRIFECTA_OTHER_REWARDS_0,
    TRIFECTA_SYMBOL_0,
    TRIFECTA_NAME_0
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
      TRIFECTA_TOKEN_0,
      voter.address,
      await trifectaPlugin.getAssetTokens(),
      await trifectaPlugin.getBribeTokens(),
      VAULT_FACTORY,
      TRIFECTA_FARM_0,
      "Liquidity Trifecta",
      TRIFECTA_SYMBOL_0,
      TRIFECTA_NAME_0,
    ],
  });
}

async function deployBeraPawPluginFactory() {
  console.log("Starting BeraPawPluginFactory Deployment");
  const berapawPluginFactoryArtifact = await ethers.getContractFactory(
    "BeraPawPluginFactory"
  );
  const berapawPluginFactoryContract =
    await berapawPluginFactoryArtifact.deploy(voter.address, {
      gasPrice: ethers.gasPrice,
    });
  berapawPluginFactory = await berapawPluginFactoryContract.deployed();
  console.log(
    "BeraPawPluginFactory Deployed at:",
    berapawPluginFactory.address
  );
}

async function verifyBeraPawPluginFactory() {
  console.log("Starting BeraPawPluginFactory Verification");
  await hre.run("verify:verify", {
    address: berapawPluginFactory.address,
    contract:
      "contracts/plugins/berachain/BeraPawPluginFactory.sol:BeraPawPluginFactory",
    constructorArguments: [voter.address],
  });
  console.log("BeraPawPluginFactory Verified");
}

async function deployBeraPawPlugin() {
  console.log("Starting BeraPawPlugin Deployment");
  await berapawPluginFactory.createPlugin(
    BERAPAW_TOKEN_0,
    BERAPAW_TOKENS_0,
    BERAPAW_SYMBOL_0,
    BERAPAW_NAME_0,
    { gasPrice: ethers.gasPrice }
  );
  await sleep(10000);
  console.log(
    "BeraPawPlugin Deployed at:",
    await berapawPluginFactory.last_plugin()
  );
}

async function verifyBeraPawPlugin() {
  console.log("Starting BeraPawPlugin Verification");
  await hre.run("verify:verify", {
    address: berapawPlugin.address,
    contract:
      "contracts/plugins/berachain/BeraPawPluginFactory.sol:BeraPawPlugin",
    constructorArguments: [
      BERAPAW_TOKEN_0,
      voter.address,
      BERAPAW_TOKENS_0,
      [LBGT],
      VAULT_FACTORY,
      "0xc5cb3459723b828b3974f7e58899249c2be3b33d",
      BERAPAW_SYMBOL_0,
      BERAPAW_SYMBOL_0,
      BERAPAW_NAME_0,
    ],
  });
  console.log("BeraPawPlugin Verified");
}

async function main() {
  const [wallet] = await ethers.getSigners();
  console.log("Using wallet: ", wallet.address);

  await getContracts();

  //===================================================================
  // 1. Deploy Token Factories
  //===================================================================

  // console.log("Starting Factory Deployment");
  // await deployOTOKENFactory();
  // await deployVTOKENFactory();
  // await deployFeesFactory();
  // await deployRewarderFactory();
  // await printFactoryAddresses();

  //===================================================================
  // 2. Deploy Token
  //===================================================================

  // console.log("Starting Token Deployment");
  // await deployTOKEN();
  // await deployGovernor();
  // await printTokenAddresses();

  //===================================================================
  // 3. Verify Token
  //===================================================================

  // console.log("Starting Token Verification");
  // await verifyTOKEN();
  // await verifyOTOKEN(wallet);
  // await verifyVTOKEN();
  // await verifyFees();
  // await verifyRewarder();
  // await verifyGovernor();
  // console.log("Token Verified");

  //===================================================================
  // 3. Deploy Voting System
  //===================================================================

  // console.log("Starting Voting Deployment");
  // await deployGaugeFactory(wallet.address);
  // await deployBribeFactory(wallet.address);
  // await deployVoter();
  // await deployMinter();
  // await printVotingAddresses();

  //===================================================================
  // 6. Verify Voting Contracts
  //===================================================================

  // console.log("Starting Voting Verification");
  // await verifyGaugeFactory(wallet.address);
  // await verifyBribeFactory(wallet.address);
  // await verifyVoter();
  // await verifyMinter();
  // console.log("Voting Contracts Verified");

  //===================================================================
  // 4. Deploy Ancillary Contracts
  //===================================================================

  // console.log("Starting Ancillary Deployment");
  // await deployMulticall();
  // await deployTrifectaMulticall();
  // await deployController();
  // await printAncillaryAddresses();

  //===================================================================
  // 7. Verify Ancillary Contracts
  //===================================================================

  // console.log("Starting Ancillary Verification");
  // await verifyMulticall();
  // await verifyTrifectaMulticall();
  // await verifyController();
  // console.log("Ancillary Contracts Verified");

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
  // 9. Print Deployment
  //===================================================================

  // console.log("Beradrome Mainnet Deployment");
  // console.log();
  // await printTokenAddresses();
  // console.log();
  // await printVotingAddresses();
  // console.log();
  // await printAncillaryAddresses();
  // console.log();

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
  // 19. Deploy BeraPaw Plugin Factory
  //===================================================================

  // console.log("Starting BeraPawPluginFactory Deployment");
  // await deployBeraPawPluginFactory();
  // await verifyBeraPawPluginFactory();
  // console.log("BeraPawPluginFactory Deployed and Verified");

  //===================================================================
  // 20. Deploy BeraPaw Plugin
  //===================================================================

  // console.log("Starting BeraPawPlugin Deployment");
  // await deployBeraPawPlugin();
  // await verifyBeraPawPlugin();
  // console.log("BeraPawPlugin Deployed and Verified");

  //===================================================================
  // 17. Deploy Trifecta Plugin Factory
  //===================================================================

  // console.log("Starting TrifectaPluginFactory Deployment");
  // await deployTrifectaPluginFactory();
  // await verifyTrifectaPluginFactory();
  // console.log("TrifectaPluginFactory Deployed and Verified");

  //===================================================================
  // 18. Deploy Trifecta Plugin
  //===================================================================

  // console.log("Starting TrifectaPlugin Deployment");
  // await deployTrifectaPlugin();
  // await verifyTrifectaPlugin();
  // console.log("TrifectaPlugin Deployed and Verified");

  //===================================================================
  // 13. Add Gauge Rewards
  //===================================================================

  // await voter.connect(wallet).addGaugeReward(
  //   await voter.gauges(TRIFECTA_PLUGIN_0),
  //   KDK // KDK
  // ); // KDK added to Trifecta YEET-WBERA Island Gauge
  // console.log("- KDK added as gauge reward");

  // await voter.connect(wallet).addGaugeReward(
  //   await voter.gauges(TRIFECTA_PLUGIN_0),
  //   XKDK // xKDK
  // ); // xKDK added to Trifecta YEET-WBERA Island Gauge
  // console.log("- xKDK added as gauge rewards");

  //===================================================================
  // 10. Add plugins to voter
  //===================================================================

  // // Add station plugins
  // console.log("Adding STATION_PLUGIN_0 to Voter");
  // await voter.addPlugin(STATION_PLUGIN_0); // Station Berps
  // await sleep(10000);

  // // Add infrared plugins
  // console.log("Adding INFRARED_PLUGIN_0 to Voter");
  // await voter.addPlugin(INFRARED_PLUGIN_0); // Infrared Berps bHONEY
  // await sleep(10000);

  // // Add berapaw plugins
  // console.log("Adding BERAPAW_PLUGIN_0 to Voter");
  // await voter.addPlugin(BERAPAW_PLUGIN_0); // BeraPaw Beraborrow sNECT
  // await sleep(10000);

  // Add trifecta plugins
  // console.log("Adding TRIFECTA_PLUGIN_0 to Voter");
  // await voter.addPlugin(TRIFECTA_PLUGIN_0); // Kodiak Trifecta YEET-WBERA Island
  // await sleep(10000);

  // Add game plugins
  // console.log("Adding BULLAS_PLUGIN to Voter");
  // await voter.addPlugin(BULLAS_PLUGIN); // Bullas BULL iSH
  // await sleep(10000);

  //===================================================================
  // 13. Print Deployment
  //===================================================================

  // console.log("Beradrome Mainnet Deployment");
  // console.log();
  // console.log("voter: ", await voter.address);
  // console.log("gaugeFactory: ", await gaugeFactory.address);
  // console.log("bribeFactory: ", await bribeFactory.address);
  // console.log();
  // console.log("multicall: ", await multicall.address);
  // console.log("trifectaMulticall: ", await trifectaMulticall.address);
  // console.log("controller: ", await controller.address);
  // console.log();
  // console.log("StationPluginFactory: ", await stationPluginFactory.address);
  // console.log("InfraredPluginFactory: ", await infraredPluginFactory.address);
  // console.log("BeraPawPluginFactory: ", await berapawPluginFactory.address);
  // console.log("TrifectaPluginFactory: ", await trifectaPluginFactory.address);
  // console.log();
  // console.log("Reward Vault: ", await VTOKEN.rewardVault());
  // console.log("Vault Token: ", await VTOKEN.vaultToken());

  //===================================================================
  // 13. Print Plugins
  //===================================================================

  // let plugins = [
  //   STATION_PLUGIN_0,
  //   INFRARED_PLUGIN_0,
  //   BERAPAW_PLUGIN_0,
  //   TRIFECTA_PLUGIN_0,
  //   // BULLAS_PLUGIN,
  // ];

  // for (let i = 0; i < plugins.length; i++) {
  //   let plugin = await controller.getPlugin(plugins[i]);

  //   console.log("Protocol: ", plugin.protocol);
  //   console.log("Name: ", plugin.name);
  //   console.log("Token: ", plugin.token);
  //   console.log("Plugin: ", plugin.plugin);
  //   console.log("Gauge: ", plugin.gauge);
  //   console.log("Bribe: ", plugin.bribe);
  //   console.log("Vault Token: ", plugin.vaultToken);
  //   console.log("Reward Vault: ", plugin.rewardVault);
  //   console.log();
  // }

  //===================================================================
  // 13. Distro
  //===================================================================

  // console.log("Distributing Rewards");
  // await voter.distro();
  // console.log("Voter Rewards Distributed");
  // await fees.distribute();
  // console.log("Fees Rewards Distributed");
  // await voter.distributeToBribes([
  //   STATION_PLUGIN, // Station Berps bHONEY
  // ]);
  // console.log("Station Bribe Rewards Distributed");
  // await voter.distributeToBribes([
  //   INFRARED_PLUGIN, // Infrared Berps bHONEY
  // ]);
  // console.log("Infrared Bribe Rewards Distributed");
  // await voter.distributeToBribes([
  //   TRIFECTA_PLUGIN, // Kodiak Trifecta YEET-WBERA Island
  // ]);
  // console.log("Kodiak TrifectaBribe Rewards Distributed");
  // await voter.distributeToBribes([
  //   BERAPAW_PLUGIN, // BeraPaw Beraborrow sNECT
  // ]);
  // console.log("BeraPaw Bribe Rewards Distributed");
  // await voter.distributeToBribes([
  //   BULLAS_PLUGIN,
  // ]);
  // console.log("Game Bribe Rewards Distributed");

  //===================================================================
  // 14. Remove Plugin
  //===================================================================

  // console.log("Removing Plugin from Voter"); // Remove BULL ISH plugin
  // await voter
  //   .connect(wallet)
  //   .killGauge("0x1a173326c5859CF5A67f6aEB83a9954EfCdBeC3d");
  // console.log("Plugin removed from Voter");

  //===================================================================
  // 13. Add Bribe Rewards
  //===================================================================

//   await voter
//     .connect(wallet)
//     .addBribeReward("0x91316cde390F239CbE039Ab39CbBfED0B86e6742", YEET);
//   console.log("YEET added as bribe reward");
// }

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
