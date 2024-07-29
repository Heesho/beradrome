const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

// PluginFactory settings
const VOTER_ADDRESS = "0x580ABF764405aA82dC96788b356435474c5956A7";

// Plugin settings

// const LP_SYMBOL = "HONEY-WBERA"; // Desired symbol for LP plugin
// const LP_ADDRESS = "0xd28d852cbcc68DCEC922f6d5C7a8185dBaa104B7"; // Address of LP token
// const TOKEN0 = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03"; // HONEY address
// const TOKEN1 = "0x7507c1dc16935B82698e4C63f2746A2fCf994dF8"; // WBERA address

const LP_SYMBOL = "HONEY-USDC"; // Desired symbol for LP plugin
const LP_ADDRESS = "0xD69ADb6FB5fD6D06E6ceEc5405D95A37F96E3b96"; // Address of LP token
const TOKEN0 = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03"; // HONEY address
const TOKEN1 = "0xd6D83aF58a19Cd14eF3CF6fe848C9A4d21e5727c"; // USDC address

// const LP_SYMBOL = "HONEY-WETH"; // Desired symbol for LP plugin
// const LP_ADDRESS = "0xfbE71d98f9D2c658d52a2d72994c717637C3ddA1"; // Address of LP token
// const TOKEN0 = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03"; // HONEY address
// const TOKEN1 = "0x6E1E9896e93F7A71ECB33d4386b49DeeD67a231A"; // WETH address

// const LP_SYMBOL = "HONEY-WBTC"; // Desired symbol for LP plugin
// const LP_ADDRESS = ""; // Address of LP token
// const TOKEN0 = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03"; // HONEY address
// const TOKEN1 = "0x286F1C3f0323dB9c91D1E8f45c8DF2d065AB5fae"; // WBTC address

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
    "contracts/plugins/berachain/BexVaultPluginFactory.sol:BexVaultPluginFactory",
    "0x353b6735e288Aca27C45336bA178cBb50D958a92"
  );
  // plugin = await ethers.getContractAt("contracts/plugins/berachain/BexVaultPluginFactory.sol:BexVaultPlugin", "0x0000000000000000000000000000000000000000");

  console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployPluginFactory() {
  console.log("Starting PluginFactory Deployment");
  const pluginFactoryArtifact = await ethers.getContractFactory(
    "BexVaultPluginFactory"
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
      "contracts/plugins/berachain/BexVaultPluginFactory.sol:BexVaultPluginFactory",
    constructorArguments: [VOTER_ADDRESS],
  });
  console.log("PluginFactory Verified");
}

async function deployPlugin() {
  console.log("Starting Plugin Deployment");
  await pluginFactory.createPlugin(LP_ADDRESS, TOKEN0, TOKEN1, LP_SYMBOL, {
    gasPrice: ethers.gasPrice,
  });
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
      "contracts/plugins/berachain/BexVaultPluginFactory.sol:BexVaultPlugin",
    constructorArguments: [
      await plugin.getUnderlyingAddress(),
      VOTER_ADDRESS,
      await plugin.getTokensInUnderlying(),
      await plugin.getBribeTokens(),
      await plugin.rewardsVault(),
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
