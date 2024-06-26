const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

// PluginFactory settings
const VOTER_ADDRESS = "0x2363BB86cD2ABF89cc059A654f89f11bCceffcA9";

// Tokens
const WBERA = "0x7507c1dc16935B82698e4C63f2746A2fCf994dF8";
const HONEY = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";
const USDC = "0xd6D83aF58a19Cd14eF3CF6fe848C9A4d21e5727c";
const YEET = "0x1740F679325ef3686B2f574e392007A92e4BeD41";

// Kodiak Vault V1 HONEY/WBERA
const KODIAK1_SYMBOL = "HONEY-WBERA Island";
const KODIAK1 = "0x12C195768f65F282EA5F1B5C42755FBc910B0D8F";
const KODIAK1_FARM = "0x1878eb1cA6Da5e2fC4B5213F7D170CA668A0E225"; // rewards = KDK, xKDK

// Kodiak Vault V1 HONEY/USDC
const KODIAK2_SYMBOL = "HONEY-USDC Island";
const KODIAK2 = "0xb73deE52F38539bA854979eab6342A60dD4C8c03";
const KODIAK2_FARM = "0x43340e50807c1244c04e74C6539fe8632597Ca39"; // rewards = KDK, xKDK

// Kodiak Vault V1 YEET/WBERA
const KODIAK3_SYMBOL = "YEET-WBERA Island";
const KODIAK3 = "0xE5A2ab5D2fb268E5fF43A5564e44c3309609aFF9";
const KODIAK3_FARM = "0xbdEE3F788a5efDdA1FcFe6bfe7DbbDa5690179e6"; // rewards = KDK, xKDK, YEET

// Plugin settings
const LP_SYMBOL = ""; // Desired symbol for LP plugin
const LP_ADDRESS = ""; // Address of LP token
const TOKEN0 = ""; // HONEY address
const TOKEN1 = ""; // WBERA address
const FARM = ""; // Communal farm address

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);

// Contract Variables
let pluginFactory;
let plugin;

/*===================================================================*/
/*===========================  CONTRACT DATA  =======================*/

async function getContracts() {
  //   pluginFactory = await ethers.getContractAt(
  //     "contracts/plugins/berachain/KodiakFarmPluginFactory.sol:KodiakFarmPluginFactory",
  //     ""
  //   );
  // plugin = await ethers.getContractAt("contracts/plugins/berachain/KodiakFarmPluginFactory.sol:KodiakFarmPlugin", "");

  console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployPluginFactory() {
  console.log("Starting PluginFactory Deployment");
  const pluginFactoryArtifact = await ethers.getContractFactory(
    "KodiakFarmPluginFactory"
  );
  const pluginFactoryContract = await pluginFactoryArtifact.deploy(
    VOTER_ADDRESS,
    { gasPrice: ethers.gasPrice }
  );
  pluginFactory = await pluginFactoryContract.deployed();
  await sleep(5000);
  console.log("PluginFactory Deployed at:", pluginFactory.address);
}

async function printFactoryAddress() {
  console.log("**************************************************************");
  console.log("PluginFactory: ", pluginFactory.address);
  console.log("**************************************************************");
}

async function verifyPluginFactory() {
  console.log("Starting PluginFactory Verification");
  await hre.run("verify:verify", {
    address: pluginFactory.address,
    contract:
      "contracts/plugins/berachain/KodiakFarmPluginFactory.sol:KodiakFarmPluginFactory",
    constructorArguments: [VOTER_ADDRESS],
  });
  console.log("PluginFactory Verified");
}

async function deployPlugin() {
  console.log("Starting Plugin Deployment");
  await pluginFactory.createPlugin(
    LP_ADDRESS,
    FARM,
    TOKEN0,
    TOKEN1,
    [],
    LP_SYMBOL,
    {
      gasPrice: ethers.gasPrice,
    }
  );
  await sleep(5000);
  let pluginAddress = await pluginFactory.last_plugin();
  console.log("Plugin Deployed at:", pluginAddress);
  console.log("**************************************************************");
  console.log("Plugin: ", pluginAddress);
  console.log("**************************************************************");
}

async function verifyPlugin() {
  console.log("Starting Plugin Verification");
  await hre.run("verify:verify", {
    address: plugin.address,
    contract:
      "contracts/plugins/berachain/KodiakFarmPluginFactory.sol:KodiakFarmPlugin",
    constructorArguments: [
      await plugin.getUnderlyingAddress(),
      VOTER_ADDRESS,
      await plugin.getTokensInUnderlying(),
      await plugin.getBribeTokens(),
      await plugin.farm(),
      await plugin.getProtocol(),
      await plugin.getUnderlyingSymbol(),
    ],
  });
  console.log("Plugin Verified");
}

async function main() {
  const [wallet] = await ethers.getSigners();
  console.log("Using wallet: ", wallet.address);

  await getContracts();

  //===================================================================
  // 1. Deploy Plugin Factory
  //===================================================================

  // await deployPluginFactory();
  // await printFactoryAddress();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 2. Verify Plugin Factory
  //===================================================================

  // await verifyPluginFactory();

  //===================================================================
  // 3. Deploy Plugin
  //===================================================================
  // Only deploy one plugin at a time

  // await deployPlugin();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 4. Verify Plugin
  //===================================================================

  // await verifyPlugin();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
