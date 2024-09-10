const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

// PluginFactory settings
const VOTER_ADDRESS = "0x580ABF764405aA82dC96788b356435474c5956A7";

// Tokens
const WBERA = "0x7507c1dc16935B82698e4C63f2746A2fCf994dF8";
const YEET = "0x1740F679325ef3686B2f574e392007A92e4BeD41";
const oBERO = "0x7629668774f918c00Eb4b03AdF5C4e2E53d45f0b";

// Kodiak Vault V1 YEET/WBERA
const KODIAK3_SYMBOL = "YEET-WBERA Island";
const KODIAK3 = "0xE5A2ab5D2fb268E5fF43A5564e44c3309609aFF9";
const KODIAK3_FARM = "0xbdEE3F788a5efDdA1FcFe6bfe7DbbDa5690179e6"; // rewards = KDK, xKDK, YEET

// Kodiak Vault V1 oBERO/WBERA
const KODIAK8_SYMBOL = "oBERO-WBERA Island";
const KODIAK8 = "0xbfbEfcfAE7a58C14292B53C2CcD95bF2c5742EB0";
const KODIAK8_FARM = "0x1812FC946EF5809f8efCEF28Afa6ec9030907748"; // rewards = KDK, xKDK, oBERO

// Plugin settings
const LP_SYMBOL = KODIAK8_SYMBOL; // Desired symbol for LP plugin
const LP_ADDRESS = KODIAK8; // Address of LP token
const TOKEN0 = oBERO; // HONEY address
const TOKEN1 = WBERA; // WBERA address
const FARM = KODIAK8_FARM; // Communal farm address

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
  pluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPluginFactory",
    "0x7F1266993dE9eAfF3F8dECC3B1D2d5Bc836A996C"
  );
  plugin = await ethers.getContractAt(
    "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPlugin",
    "0x62c310059A7d84805c675d2458234d3D137D9a1c"
  );

  console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployPluginFactory() {
  console.log("Starting PluginFactory Deployment");
  const pluginFactoryArtifact = await ethers.getContractFactory(
    "TrifectaPluginFactory"
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
      "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPluginFactory",
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
    [oBERO],
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
      "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPlugin",
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
