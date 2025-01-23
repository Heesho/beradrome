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
const USDC = "0xd6D83aF58a19Cd14eF3CF6fe848C9A4d21e5727c";
const WBTC = "0x2577D24a26f8FA19c1058a8b0106E2c7303454a4";
const WETH = "0xE28AfD8c634946833e89ee3F122C06d7C537E8A8";
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
const LBGT = "0x32Cf940DB5d7ea3e95e799A805B1471341241264";

// Station Berps bHONEY
const STATION = "0x1306D3c36eC7E38dd2c128fBe3097C2C2449af64";
const STATION_TOKENS = [HONEY];
const STATION_SYMBOL = "Berps bHONEY";
const STATION_NAME = "Beradrome Station Berps bHONEY";
const STATION_VAULT = "0xC5Cb3459723B828B3974f7E58899249C2be3B33d";
const STATION_PLUGIN = "";

// Infrared Berps bHONEY
const INFRARED_VAULT = "0x7d91bf5851b3a8bcf8c39a69af2f0f98a4e2202a";
const INFRARED_TOKENS = [HONEY];
const INFRARED_REWARDS = [IBGT];
const INFRARED_SYMBOL = "Berps bHONEY";
const INFRARED_NAME = "Beradrome Infrared Berps bHONEY";
const INFRARED_PLUGIN = "";

// Trifecta Kodiak YEET-WBERA
const TRIFECTA = "0xE5A2ab5D2fb268E5fF43A5564e44c3309609aFF9";
const TRIFECTA_FARM = "0xbdEE3F788a5efDdA1FcFe6bfe7DbbDa5690179e6";
const TRIFECTA_TOKEN0 = YEET;
const TRIFECTA_TOKEN1 = WBERA;
const TRIFECTA_OTHER_REWARDS = [YEET];
const TRIFECTA_SYMBOL = "Kodiak YEET-WBERA";
const TRIFECTA_NAME = "Beradrome Liquidity Trifecta Kodiak YEET-WBERA";
const TRIFECTA_PLUGIN = "";

// BeraPaw Beraborrow sNECT
const BERAPAW = "0x3a7f6f2F27f7794a7820a32313F4a68e36580864";
const BERAPAW_TOKENS = [NECT];
const BERAPAW_SYMBOL = "Beraborrow sNECT";
const BERAPAW_NAME = "Beradrome BeraPaw Beraborrow sNECT";
const BERAPAW_PLUGIN = "";

// Bullas BULL iSH
const BULLAS_PLUGIN = "";

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

let berapawPlugin;
let berapawPluginFactory;

async function getContracts() {
  TOKEN = await ethers.getContractAt("contracts/TOKEN.sol:TOKEN", "");
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
    ""
  );

  gaugeFactory = await ethers.getContractAt(
    "contracts/GaugeFactory.sol:GaugeFactory",
    ""
  );
  bribeFactory = await ethers.getContractAt(
    "contracts/BribeFactory.sol:BribeFactory",
    ""
  );
  voter = await ethers.getContractAt("contracts/VaultVoter.sol:VaultVoter", "");
  minter = await ethers.getContractAt("contracts/Minter.sol:Minter", "");

  multicall = await ethers.getContractAt(
    "contracts/Multicall.sol:Multicall",
    ""
  );
  trifectaMulticall = await ethers.getContractAt(
    "contracts/TrifectaMulticall.sol:TrifectaMulticall",
    ""
  );
  controller = await ethers.getContractAt(
    "contracts/Controller.sol:Controller",
    ""
  );

  stationPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/StationPluginFactory.sol:StationPluginFactory",
    ""
  );

  stationPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/StationPluginFactory.sol:StationPlugin",
    STATION_PLUGIN
  );

  infraredPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPluginFactory",
    ""
  );

  infraredPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPlugin",
    INFRARED_PLUGIN
  );

  trifectaPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPluginFactory",
    ""
  );

  trifectaPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPlugin",
    TRIFECTA_PLUGIN
  );

  berapawPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/BeraPawPluginFactory.sol:BeraPawPluginFactory",
    ""
  );

  berapawPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/BeraPawPluginFactory.sol:BeraPawPlugin",
    BERAPAW_PLUGIN
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
    constructorArguments: [wallet],
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

async function verifyTOKENFees() {
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
    contract: "contracts/Voter.sol:Voter",
    constructorArguments: [
      VTOKEN.address,
      gaugeFactory.address,
      bribeFactory.address,
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
    STATION,
    STATION_TOKENS,
    STATION_SYMBOL,
    STATION_NAME,
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
      STATION,
      voter.address,
      STATION_TOKENS,
      [WBERA],
      VAULT_FACTORY,
      STATION_VAULT,
      "BGT Station",
      STATION_SYMBOL,
      STATION_NAME,
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
    INFRARED_VAULT,
    INFRARED_TOKENS,
    INFRARED_REWARDS,
    INFRARED_SYMBOL,
    INFRARED_NAME,
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
      INFRARED_TOKENS,
      INFRARED_REWARDS,
      VAULT_FACTORY,
      INFRARED_VAULT,
      "Infrared",
      INFRARED_SYMBOL,
      INFRARED_NAME,
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
    TRIFECTA,
    TRIFECTA_FARM,
    TRIFECTA_TOKEN0,
    TRIFECTA_TOKEN1,
    TRIFECTA_OTHER_REWARDS,
    TRIFECTA_SYMBOL,
    TRIFECTA_NAME
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
      TRIFECTA,
      voter.address,
      [TRIFECTA_TOKEN0, TRIFECTA_TOKEN1],
      TRIFECTA_OTHER_REWARDS,
      VAULT_FACTORY,
      TRIFECTA_FARM,
      "Liquidity Trifecta",
      TRIFECTA_SYMBOL,
      TRIFECTA_NAME,
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
    BERAPAW,
    BERAPAW_TOKENS,
    BERAPAW_SYMBOL,
    BERAPAW_NAME,
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
      BERAPAW,
      voter.address,
      BERAPAW_TOKENS,
      [LBGT],
      VAULT_FACTORY,
      "0x72e222116fC6063f4eE5cA90A6C59916AAD8352a",
      "Beraborrow sNECT",
      BERAPAW_SYMBOL,
      BERAPAW_NAME,
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

  //   console.log("Starting Factory Deployment");
  //   await deployOTOKENFactory();
  //   await deployVTOKENFactory();
  //   await deployFeesFactory();
  //   await deployRewarderFactory();
  //   await printFactoryAddresses();

  //===================================================================
  // 2. Deploy Token
  //===================================================================

  //   console.log("Starting Token Deployment");
  //   await deployTOKEN();
  //   await deployGovernor();
  //   await printTokenAddresses();

  //===================================================================
  // 3. Deploy Voting System
  //===================================================================

  // console.log("Starting Voting Deployment");
  // await deployGaugeFactory(wallet.address);
  // await deployBribeFactory(wallet.address);
  // await deployVoter();
  // await printVotingAddresses();

  //===================================================================
  // 4. Deploy Ancillary Contracts
  //===================================================================

  // console.log("Starting Ancillary Deployment");
  // await deployMulticall();
  // await deployTrifectaMulticall();
  // await deployController();
  // await printAncillaryAddresses();

  //===================================================================
  // 6. Verify Voting Contracts
  //===================================================================

  // console.log("Starting Voting Verification");
  // await verifyGaugeFactory(wallet.address);
  // await verifyBribeFactory(wallet.address);
  // await verifyVoter();
  // console.log("Voting Contracts Verified");

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
  // 17. Deploy Trifecta Plugin Factoryu
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
  // 13. Add Gauge Rewards
  //===================================================================

  // await voter.connect(wallet).addGaugeReward(
  //   await voter.gauges(TRIFECTA9_PLUGIN),
  //   KDK // KDK
  // ); // KDK added to Trifecta YEET-WBERA Island Gauge
  // console.log("- KDK added as gauge reward");

  // await voter.connect(wallet).addGaugeReward(
  //   await voter.gauges(TRIFECTA9_PLUGIN),
  //   XKDK // xKDK
  // ); // xKDK added to Trifecta YEET-WBERA Island Gauge
  // console.log("- xKDK added as gauge rewards");

  //===================================================================
  // 10. Add plugins to voter
  //===================================================================

  // Add station plugins
  // console.log("Adding STATION to Voter");
  // await voter.addPlugin(STATION_PLUGIN); // Station Berps
  // await sleep(10000);

  // Add infrared plugins
  // console.log("Adding INFRARED to Voter");
  // await voter.addPlugin(INFRARED_PLUGIN); // Infrared Berps bHONEY
  // await sleep(10000);

  // Add trifecta plugins
  // console.log("Adding TRIFECTA3 to Voter");
  // await voter.addPlugin(TRIFECTA_PLUGIN); // Kodiak Trifecta YEET-WBERA Island
  // await sleep(10000);

  // Add berapaw plugins
  // console.log("Adding BERAPAW0 to Voter");
  // await voter.addPlugin(BERAPAW_PLUGIN); // BeraPaw Beraborrow sNECT
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
  // console.log("TrifectaPluginFactory: ", await trifectaPluginFactory.address);
  // console.log();
  // console.log("Reward Vault: ", await voter.rewardVault());
  // console.log("Vault Token: ", await voter.vaultToken());

  //===================================================================
  // 13. Print Plugins
  //===================================================================

  // let plugins = [
  //   STATION_PLUGIN,
  //   INFRARED_PLUGIN,
  //   TRIFECTA_PLUGIN,
  //   BERAPAW_PLUGIN,
  //   BULLAS_PLUGIN,
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

  // await voter
  //   .connect(wallet)
  //   .addBribeReward("0x771c14A042c845701903cD063f113172d427b441", YEET_NEW);
  // console.log("YEET_NEW added as bribe reward");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
