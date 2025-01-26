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
const LBGT = "0x32Cf940DB5d7ea3e95e799A805B1471341241264";
const YEET_NEW = "0x8c245484890a61Eb2d1F81114b1a7216dCe2752b";

// Station Berps bHONEY
// get from https://bartio.berps.berachain.com/vault
const STATION0 = "0x1306D3c36eC7E38dd2c128fBe3097C2C2449af64";
const STATION0_TOKENS = [HONEY];
const STATION0_SYMBOL = "Berps bHONEY";
const STATION0_NAME = "Beradrome Station Berps bHONEY Vault Token";
const STATION0_PLUGIN = "0x9E16AA20B5c9F9dD3F364A1d212672E5356C8CF9";

// Station Bex HONEY-WBERA
// get from https://bartio.bex.berachain.com/add-liquidity/0xd28d852cbcc68DCEC922f6d5C7a8185dBaa104B7
const STATION1 = "0xd28d852cbcc68DCEC922f6d5C7a8185dBaa104B7";
const STATION1_TOKENS = [HONEY, WBERA];
const STATION1_SYMBOL = "Bex HONEY-WBERA";
const STATION1_NAME = "Beradrome Station Bex HONEY-WBERA Vault Token";
const STATION1_PLUGIN = "0xe94f91E6e320EBFB4d6b94E64Bc6Cd599AE26456";

// Station Bex HONEY-USDC
// get from https://bartio.bex.berachain.com/add-liquidity/0xd69adb6fb5fd6d06e6ceec5405d95a37f96e3b96
const STATION2 = "0xD69ADb6FB5fD6D06E6ceEc5405D95A37F96E3b96";
const STATION2_TOKENS = [HONEY, USDC];
const STATION2_SYMBOL = "Bex HONEY-USDC";
const STATION2_NAME = "Beradrome Station Bex HONEY-USDC Vault Token";
const STATION2_PLUGIN = "0xf0Fd3496Dd46b001f416C4314317D6453Bf26B94";

// Infrared Berps bHONEY
// get from https://bartio.berps.berachain.com/vault
const INFRARED_VAULT_0 = "0x7d91bf5851b3a8bcf8c39a69af2f0f98a4e2202a";
const INFRARED_TOKENS_0 = [HONEY];
const INFRARED_REWARDS_0 = [IBGT];
const INFRARED_SYMBOL_0 = "Berps bHONEY";
const INFRARED_NAME_0 = "Beradrome Infrared Berps bHONEY Vault Token";
const INFRARED0_PLUGIN = "0x8769b893684A72E8b018dB1a6760Ed8ae00f55B7";

// Infrared Bex HONEY-USDC
// get from https://bartio.bex.berachain.com/add-liquidity/0xd69adb6fb5fd6d06e6ceec5405d95a37f96e3b96
const INFRARED_VAULT_1 = "0x675547750f4acdf64ed72e9426293f38d8138ca8";
const INFRARED_TOKENS_1 = [HONEY, USDC];
const INFRARED_REWARDS_1 = [IBGT];
const INFRARED_SYMBOL_1 = "Bex HONEY-USDC";
const INFRARED_NAME_1 = "Beradrome Infrared Bex HONEY-USDC Vault Token";
const INFRARED1_PLUGIN = "0x3701B7427d85787A6FD2761eEa2243bD155939fA";

// Infrared Bex HONEY-WBERA
// get from https://bartio.bex.berachain.com/add-liquidity/0xd28d852cbcc68DCEC922f6d5C7a8185dBaa104B7
const INFRARED_VAULT_2 = "0x5c5f9a838747fb83678ece15d85005fd4f558237";
const INFRARED_TOKENS_2 = [HONEY, WBERA];
const INFRARED_REWARDS_2 = [IBGT];
const INFRARED_SYMBOL_2 = "Bex HONEY-WBERA";
const INFRARED_NAME_2 = "Beradrome Infrared Bex HONEY-WBERA Vault Token";
const INFRARED2_PLUGIN = "0x1D4483F516722E600D9Ce7157bEf8092908EE4d8";

// Infrared iBGT
// get from https://infrared.finance/vaults
const INFRARED_VAULT_5 = "0x31e6458c83c4184a23c761fdaffb61941665e012";
const INFRARED_TOKENS_5 = [IBGT];
const INFRARED_REWARDS_5 = [HONEY];
const INFRARED_SYMBOL_5 = "iBGT";
const INFRARED_NAME_5 = "Beradrome Infrared iBGT Vault Token";
const INFRARED5_PLUGIN = "0xA11935019cd3f2554d257f5Ccfa82e712f78e6A5";

// Trifecta Kodiak YEET-WBERA Island
const INFRARED_TRIFECTA3_VAULT = "0x89DAFF790313d0Cc5cC9971472f0C73A19D9C167";
const INFRARED_TRIFECTA3_TOKENS = [YEET, WBERA];
const INFRARED_TRIFECTA3_REWARDS = [YEET];
const INFRARED_TRIFECTA3_SYMBOL = "YEET-WBERA Island";
const INFRARED_TRIFECTA3_NAME =
  "Beradrome Infrared Trifecta YEET-WBERA Island Vault Token";
const INFRARED_TRIFECTA3_PLUGIN = "0x0c38658fA3B5114bBbE3299bdEb1C7b16a0bf89F";

// Trifecta Kodiak YEET-WBERA Island
const TRIFECTA3 = "0xE5A2ab5D2fb268E5fF43A5564e44c3309609aFF9";
const TRIFECTA3_FARM = "0xbdEE3F788a5efDdA1FcFe6bfe7DbbDa5690179e6";
const TRIFECTA3_TOKEN0 = YEET;
const TRIFECTA3_TOKEN1 = WBERA;
const TRIFECTA3_OTHER_REWARDS = [YEET];
const TRIFECTA3_SYMBOL = "YEET-WBERA Island";
const TRIFECTA3_NAME = "Beradrome Trifecta YEET-WBERA Island Vault Token";
const TRIFECTA3_PLUGIN = "0x0D71CdcC3686535479F6B153848519eFAfa87105";

// Triefcta Kodiak BERA-oBERO Island
const TRIFECTA8 = "0xbfbEfcfAE7a58C14292B53C2CcD95bF2c5742EB0";
const TRIFECTA8_FARM = "0x1812FC946EF5809f8efCEF28Afa6ec9030907748";
const TRIFECTA8_TOKEN0 = WBERA;
const TRIFECTA8_TOKEN1 = oBERO;
const TRIFECTA8_OTHER_REWARDS = [oBERO, HONEY];
const TRIFECTA8_SYMBOL = "BERA-oBERO Island";
const TRIFECTA8_NAME = "Beradrome Trifecta BERA-oBERO Island Vault Token";
const TRIFECTA8_PLUGIN = "0xA61f669A0335Ada0e5c3FE04aD8E29e7e55B51Ce";

// Trifecta Kodiak HONEY-NECT Island
const TRIFECTA9 = "0x63b0EdC427664D4330F72eEc890A86b3F98ce225";
const TRIFECTA9_FARM = "0x09347F35B29bD3B8a581a8507F0831aA4d1Af8a9";
const TRIFECTA9_TOKEN0 = HONEY;
const TRIFECTA9_TOKEN1 = NECT;
const TRIFECTA9_OTHER_REWARDS = [POLLEN];
const TRIFECTA9_SYMBOL = "HONEY-NECT Island";
const TRIFECTA9_NAME = "Beradrome Trifecta HONEY-NECT Island Vault Token";
const TRIFECTA9_PLUGIN = "0x398A242f9F9452C1fF0308D4b4bf7ae6F6323868";
const TRIFECTA10_PLUGIN = "0xB4E86Fd6D918eeb91602963Ca8eB94C168499d5C"; // the new YEET plugin

// BeraPaw Beraborrow sNECT
const BERAPAW0 = "0x3a7f6f2F27f7794a7820a32313F4a68e36580864";
const BERAPAW0_TOKENS = [NECT];
const BERAPAW0_SYMBOL = "Beraborrow sNECT";
const BERAPAW0_NAME = "Beradrome BeraPaw Beraborrow sNECT Vault Token";
const BERAPAW0_PLUGIN = "0x27502F04872F5b7e82e33D362edAfFcFdB7fC840";

// BeraPaw Bex HONEY-WBERA
const BERAPAW1 = "0xd28d852cbcc68DCEC922f6d5C7a8185dBaa104B7";
const BERAPAW1_TOKENS = [HONEY, WBERA];
const BERAPAW1_SYMBOL = "Bex HONEY-WBERA";
const BERAPAW1_NAME = "Beradrome BeraPaw Bex HONEY-WBERA Vault Token";
const BERAPAW1_PLUGIN = "0x445B03940c78bc571c8e70C6973436Dfd80129A2";

// BeraPaw Bex PAW-HONEY
const BERAPAW2 = "0xa51afAF359d044F8e56fE74B9575f23142cD4B76";
const BERAPAW2_TOKENS = [PAW, HONEY];
const BERAPAW2_SYMBOL = "Bex PAW-HONEY";
const BERAPAW2_NAME = "Beradrome BeraPaw Bex PAW-HONEY Vault Token";
const BERAPAW2_PLUGIN = "0xF89F4fdE1Bf970404160eD7B9F4758B0b1ae266D";

// BeraPaw BurrBear LBGT-WBERA
const BERAPAW3 = "0x6AcBBedEcD914dE8295428B4Ee51626a1908bB12";
const BERAPAW3_TOKENS = [LBGT, WBERA];
const BERAPAW3_SYMBOL = "BurrBear LBGT-WBERA";
const BERAPAW3_NAME = "Beradrome BeraPaw BurrBear LBGT-WBERA Vault Token";
const BERAPAW3_PLUGIN = "0xdC611Db44DeE53e14c2806b3cDBAea11d0404537";

// Bullas BULL iSH
const BULLAS_PLUGIN = "0xb488543f69a9462F62b2E944C81CFd16Cf0237c0";

// Gumball BentoBera
const GUMBALL0_PLUGIN = "0x1d0B737feFcF45BC550a0B9c8a0f7f14BcCEce4d";

// Gumball PastFactory
const GUMBALL1_PLUGIN = "0x6D1B5054C87dE76C8c4c3eCBe1cd5354b0876c32";

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

let berapawPlugin;
let berapawPluginFactory;

let infraredTrifectaPlugin;
let infraredTrifectaPluginFactory;

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
    "0x71b54d9B707d2cE431Fb7079C03376f4B8463B34"
  );
  bribeFactory = await ethers.getContractAt(
    "contracts/BribeFactory.sol:BribeFactory",
    "0x7552B6F945C57BB99C82a4324456DE9661B7B589"
  );
  voter = await ethers.getContractAt(
    "contracts/VaultVoter.sol:VaultVoter",
    "0x1f9505Ae18755915DcD2a95f38c7560Cab149d9C"
  );
  minter = await ethers.getContractAt(
    "contracts/Minter.sol:Minter",
    "0x8A832cd3f401f6D32689B2ea2f2E1f7009BE00AC"
  );

  multicall = await ethers.getContractAt(
    "contracts/Multicall.sol:Multicall",
    "0x0a205b57f39C8E085d2c864DA1055Aa1Fe482A4b"
  );
  trifectaMulticall = await ethers.getContractAt(
    "contracts/TrifectaMulticall.sol:TrifectaMulticall",
    "0x41482D319CbB505e2ccA6Fe708f639F084B0De06"
  );
  controller = await ethers.getContractAt(
    "contracts/Controller.sol:Controller",
    "0xBCE40Bf197Efbad68dc5CF3624e16EE374A9E251"
  );

  stationPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/StationPluginFactory.sol:StationPluginFactory",
    "0xB0e1edbd2D4BA5932F39E43445Cea7cA788b0A6E"
  );

  stationPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/StationPluginFactory.sol:StationPlugin",
    STATION0_PLUGIN
  );

  infraredPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPluginFactory",
    "0x1157be01468518A5422dC128ceBc1C0B900f488e"
  );

  infraredPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPlugin",
    INFRARED0_PLUGIN
  );

  trifectaPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPluginFactory",
    "0x708CAe5A63A25B5e1b2B07df6CeBeD8934960b49"
  );

  trifectaPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPlugin",
    TRIFECTA3_PLUGIN
  );

  berapawPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/BeraPawPluginFactory.sol:BeraPawPluginFactory",
    "0xd815EA83B1F28f3524d8C62d08cE4b14837eE726"
  );

  berapawPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/BeraPawPluginFactory.sol:BeraPawPlugin",
    BERAPAW0_PLUGIN
  );

  infraredTrifectaPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredTrifectaPluginFactory.sol:InfraredTrifectaPluginFactory",
    "0xDBfD560f14CD665C8E42b4ad7660d323e3bb8624"
  );

  infraredTrifectaPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredTrifectaPluginFactory.sol:InfraredTrifectaPlugin",
    INFRARED_TRIFECTA3_PLUGIN
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

  // await sleep(5000);
  // await gaugeFactory.setVoter(voter.address);
  // await sleep(5000);
  // await bribeFactory.setVoter(voter.address);
  // await sleep(5000);
  // console.log("Factories Set Up");

  await VTOKEN.setVoter(voter.address);
  await sleep(5000);
  console.log("Token-Voting Set Up");

  // await voter.initialize(minter.address);
  // await sleep(5000);
  await minter.setVoter(voter.address);
  await sleep(5000);
  console.log("Minter Set Up");

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

async function deployInfraredTrifectaPluginFactory() {
  console.log("Starting InfraredTrifectaPluginFactory Deployment");
  const infraredTrifectaPluginFactoryArtifact = await ethers.getContractFactory(
    "InfraredTrifectaPluginFactory"
  );
  const infraredTrifectaPluginFactoryContract =
    await infraredTrifectaPluginFactoryArtifact.deploy(voter.address, {
      gasPrice: ethers.gasPrice,
    });
  infraredTrifectaPluginFactory =
    await infraredTrifectaPluginFactoryContract.deployed();
  console.log(
    "InfraredTrifectaPluginFactory Deployed at:",
    infraredTrifectaPluginFactory.address
  );
}

async function verifyInfraredTrifectaPluginFactory() {
  console.log("Starting InfraredTrifectaPluginFactory Verification");
  await hre.run("verify:verify", {
    address: infraredTrifectaPluginFactory.address,
    contract:
      "contracts/plugins/berachain/InfraredTrifectaPluginFactory.sol:InfraredTrifectaPluginFactory",
    constructorArguments: [voter.address],
  });
  console.log("InfraredTrifectaPluginFactory Verified");
}

async function deployInfraredTrifectaPlugin() {
  console.log("Starting InfraredTrifectaPlugin Deployment");
  await infraredTrifectaPluginFactory.createPlugin(
    INFRARED_TRIFECTA3_VAULT,
    INFRARED_TRIFECTA3_TOKENS,
    INFRARED_TRIFECTA3_REWARDS,
    INFRARED_TRIFECTA3_SYMBOL,
    INFRARED_TRIFECTA3_NAME,
    { gasPrice: ethers.gasPrice }
  );
  await sleep(10000);
  console.log(
    "InfraredTrifectaPlugin Deployed at:",
    await infraredTrifectaPluginFactory.last_plugin()
  );
}

async function verifyInfraredTrifectaPlugin() {
  console.log("Starting InfraredTrifectaPlugin Verification");
  await hre.run("verify:verify", {
    address: infraredTrifectaPlugin.address,
    contract:
      "contracts/plugins/berachain/InfraredTrifectaPluginFactory.sol:InfraredTrifectaPlugin",
    constructorArguments: [
      TRIFECTA3,
      voter.address,
      INFRARED_TRIFECTA3_TOKENS,
      INFRARED_TRIFECTA3_REWARDS,
      VAULT_FACTORY,
      INFRARED_TRIFECTA3_VAULT,
      "Infrared Trifecta",
      INFRARED_TRIFECTA3_SYMBOL,
      INFRARED_TRIFECTA3_NAME,
    ],
  });
  console.log("InfraredTrifectaPlugin Verified");
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
    BERAPAW3,
    BERAPAW3_TOKENS,
    BERAPAW3_SYMBOL,
    BERAPAW3_NAME,
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
      BERAPAW0,
      voter.address,
      BERAPAW0_TOKENS,
      [LBGT],
      VAULT_FACTORY,
      "0x72e222116fC6063f4eE5cA90A6C59916AAD8352a",
      "Beraborrow sNECT",
      BERAPAW0_SYMBOL,
      BERAPAW0_NAME,
    ],
  });
  console.log("BeraPawPlugin Verified");
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
  // await deployTrifectaMulticall();
  // await deployController();
  // await printAncillaryAddresses();

  /*********** UPDATE getContracts() with new addresses *************/

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
  //   await transferOwnership();
  // console.log("Ownership Transferred");

  //===================================================================
  // 11. Deploy Station Plugin Factory
  //===================================================================

  //   console.log("Starting StationPlugin Deployment");
  // await deployStationPluginFactory();
  // await verifyStationPluginFactory();
  //   console.log("StationPlugin Deployed and Verified");

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
  // 17. Deploy Trifecta Plugin
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
  // 19. Deploy Infrared Trifecta Plugin Factory
  //===================================================================

  // console.log("Starting InfraredTrifectaPluginFactory Deployment");
  // await deployInfraredTrifectaPluginFactory();
  // await verifyInfraredTrifectaPluginFactory();
  // console.log("InfraredTrifectaPluginFactory Deployed and Verified");

  //===================================================================
  // 20. Deploy Infrared Trifecta Plugin
  //===================================================================

  // console.log("Starting InfraredTrifectaPlugin Deployment");
  // await deployInfraredTrifectaPlugin();
  // await verifyInfraredTrifectaPlugin();
  // console.log("InfraredTrifectaPlugin Deployed and Verified");

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
  // await voter.connect(wallet).addGaugeReward(
  //   await voter.gauges(INFRARED_TRIFECTA3_PLUGIN),
  //   IBGT // iBGT
  // ); // iBGT added to Infrared Trifecta YEET-WBERA Island Gauge
  // console.log("- iBGT added as gauge rewards");

  //===================================================================
  // 10. Add plugins to voter
  //===================================================================

  // Add station plugins
  // console.log("Adding STATION0 to Voter");
  // await voter.addPlugin(STATION0_PLUGIN); // Station Berps
  // await sleep(10000);
  // console.log("Adding STATION1 to Voter");
  // await voter.addPlugin(STATION1_PLUGIN); // Station Bex HONEY-WBERA
  // await sleep(10000);
  // console.log("Adding STATION2 to Voter");
  // await voter.addPlugin(STATION2_PLUGIN); // Station Bex HONEY-USDC
  // await sleep(10000);

  //   Add infrared plugins
  // console.log("Adding INFRARED0 to Voter");
  // await voter.addPlugin(INFRARED0_PLUGIN); // Infrared Berps bHONEY
  // await sleep(10000);
  // console.log("Adding INFRARED1 to Voter");
  // await voter.addPlugin(INFRARED1_PLUGIN); // Infrared Bex HONEY-USDC
  // await sleep(10000);
  // console.log("Adding INFRARED2 to Voter");
  // await voter.addPlugin(INFRARED2_PLUGIN); // Infrared Bex HONEY-WBERA
  // await sleep(10000);
  // console.log("Adding INFRARED5 to Voter");
  // await voter.addPlugin(INFRARED5_PLUGIN); // Infrared iBGT
  // await sleep(10000);

  //   Add trifecta plugins
  // console.log("Adding TRIFECTA3 to Voter");
  // await voter.addPlugin(TRIFECTA3_PLUGIN); // Kodiak Trifecta YEET-WBERA Island
  // await sleep(10000);
  // console.log("Adding TRIFECTA8 to Voter");
  // await voter.addPlugin(TRIFECTA8_PLUGIN); // Kodiak Trifecta BERA-oBERO Island
  // await sleep(10000);
  // console.log("Adding TRIFECTA9 to Voter");
  // await voter.addPlugin(TRIFECTA9_PLUGIN); // Kodiak Trifecta HONEY-NECT Island
  // await sleep(10000);

  // Add berapaw plugins
  // console.log("Adding BERAPAW0 to Voter");
  // await voter.addPlugin(BERAPAW0_PLUGIN); // BeraPaw Beraborrow sNECT
  // await sleep(10000);
  // console.log("Adding BERAPAW1 to Voter");
  // await voter.addPlugin(BERAPAW1_PLUGIN); // BeraPaw Bex HONEY-WBERA
  // await sleep(10000);
  // console.log("Adding BERAPAW2 to Voter");
  // await voter.addPlugin(BERAPAW2_PLUGIN); // BeraPaw Bex PAW-HONEY
  // await sleep(10000);
  // console.log("Adding BERAPAW3 to Voter");
  // await voter.addPlugin(BERAPAW3_PLUGIN); // BeraPaw BurrBear LBGT-WBERA
  // await sleep(10000);

  // Add game plugins
  // console.log("Adding BULLAS_PLUGIN to Voter");
  // await voter.addPlugin(BULLAS_PLUGIN); // Bullas BULL iSH
  // await sleep(10000);
  // console.log("Adding GUMBALL0_PLUGIN to Voter");
  // await voter.addPlugin(GUMBALL0_PLUGIN); // Gumball BentoBera
  // await sleep(10000);
  // console.log("Adding GUMBALL1_PLUGIN to Voter");
  // await voter.addPlugin(GUMBALL1_PLUGIN); // Gumball PastaFactory
  // await sleep(10000);

  // Add infrared trifecta plugin
  // console.log("Adding INFRARED_TRIFECTA3_PLUGIN to Voter");
  // await voter.addPlugin(INFRARED_TRIFECTA3_PLUGIN); // Infrared Trifecta YEET-WBERA Island
  // await sleep(10000);

  //===================================================================
  // 13. Print Deployment
  //===================================================================

  // console.log("BerachainV2 Bartio Deployment");
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
  // STATION0_PLUGIN,
  // STATION1_PLUGIN,
  // STATION2_PLUGIN,
  // INFRARED0_PLUGIN,
  // INFRARED1_PLUGIN,
  // INFRARED2_PLUGIN,
  // INFRARED5_PLUGIN,
  // TRIFECTA3_PLUGIN,
  // TRIFECTA8_PLUGIN,
  // TRIFECTA9_PLUGIN,
  // BERAPAW0_PLUGIN,
  // BERAPAW1_PLUGIN,
  // BERAPAW2_PLUGIN,
  // BERAPAW3_PLUGIN,
  // BULLAS_PLUGIN,
  // GUMBALL0_PLUGIN,
  // GUMBALL1_PLUGIN,
  // INFRARED_TRIFECTA3_PLUGIN,
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

  console.log("Distributing Rewards");
  await voter.distro();
  console.log("Voter Rewards Distributed");
  await fees.distribute();
  console.log("Fees Rewards Distributed");
  await voter.distributeToBribes([
    STATION0_PLUGIN, // Station Berps bHONEY
    STATION1_PLUGIN, // Station Bex HONEY-WBERA
    STATION2_PLUGIN, // Station Bex HONEY-USDC
  ]);
  console.log("Station Bribe Rewards Distributed");
  await voter.distributeToBribes([
    INFRARED0_PLUGIN, // Infrared Berps bHONEY
    INFRARED1_PLUGIN, // Infrared Bex HONEY-USDC
    INFRARED2_PLUGIN, // Infrared Bex HONEY-WBERA
    INFRARED5_PLUGIN, // Infrared HONEY-WBTC Plugin
  ]);
  console.log("Infrared Bribe Rewards Distributed");
  // await voter.distributeToBribes([
  //   TRIFECTA3_PLUGIN, // Kodiak Trifecta YEET-WBERA Island
  //   TRIFECTA8_PLUGIN, // Kodiak Trifecta BERA-oBERO Island
  //   TRIFECTA9_PLUGIN, // Kodiak Trifecta HONEY-NECT Island
  //   TRIFECTA10_PLUGIN, // Kodiak Trifecta KODI-YEET-BERA
  // ]);
  // console.log("Kodiak TrifectaBribe Rewards Distributed");
  await voter.distributeToBribes([
    BERAPAW0_PLUGIN, // BeraPaw Beraborrow sNECT
    BERAPAW1_PLUGIN, // BeraPaw Bex HONEY-WBERA
    BERAPAW2_PLUGIN, // BeraPaw Bex PAW-HONEY
    BERAPAW3_PLUGIN, // BeraPaw BurrBear LBGT-WBERA
  ]);
  console.log("BeraPaw Bribe Rewards Distributed");
  await voter.distributeToBribes([
    BULLAS_PLUGIN,
    GUMBALL0_PLUGIN,
    GUMBALL1_PLUGIN,
  ]);
  console.log("Game Bribe Rewards Distributed");
  await voter.distributeToBribes([INFRARED_TRIFECTA3_PLUGIN]);
  console.log("Infrared Trifecta Bribe Rewards Distributed");

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
