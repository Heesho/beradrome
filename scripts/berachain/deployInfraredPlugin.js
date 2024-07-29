const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

// PluginFactory settings
const VOTER_ADDRESS = "0x580ABF764405aA82dC96788b356435474c5956A7";

// Plugin settings

// iBGT
const VAULT0 = "0x31e6458c83c4184a23c761fdaffb61941665e012";
const TOKENS0 = ["0x46efc86f0d7455f135cc9df501673739d513e982"]; // IBGT
const REWARDS0 = ["0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03"]; // HONEY
const SYMBOL0 = "iBGT";

// bHONEY
const VAULT1 = "0x7d91bf5851b3a8bcf8c39a69af2f0f98a4e2202a";
const TOKENS1 = ["0x1306D3c36eC7E38dd2c128fBe3097C2C2449af64"]; // bHONEY
const REWARDS1 = ["0x46efc86f0d7455f135cc9df501673739d513e982"]; // IBGT
const SYMBOL1 = "bHONEY";

// HONEY-USDC
const VAULT2 = "0x675547750f4acdf64ed72e9426293f38d8138ca8";
const TOKENS2 = [
  "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03",
  "0xd6D83aF58a19Cd14eF3CF6fe848C9A4d21e5727c",
]; // HONEY, USDC
const REWARDS2 = ["0x46efc86f0d7455f135cc9df501673739d513e982"]; // IBGT
const SYMBOL2 = "HONEY-USDC";

// HONEY-WBTC
const VAULT3 = "0x42faa63ab12825ec2efb6ff01d7c1cf1327c3bab";
const TOKENS3 = [
  "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03",
  "0x286F1C3f0323dB9c91D1E8f45c8DF2d065AB5fae",
]; // HONEY, WBTC
const REWARDS3 = ["0x46efc86f0d7455f135cc9df501673739d513e982"]; // IBGT
const SYMBOL3 = "HONEY-WBTC";

// HONEY-WETH
const VAULT4 = "0xa9480499b1faeaf225ceb88ade69de10b7f86c1e";
const TOKENS4 = [
  "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03",
  "0x6E1E9896e93F7A71ECB33d4386b49DeeD67a231A",
]; // HONEY, ETH
const REWARDS4 = ["0x46efc86f0d7455f135cc9df501673739d513e982"]; // IBGT
const SYMBOL4 = "HONEY-WETH";

// HONEY-WBERA
const VAULT5 = "0x5c5f9a838747fb83678ece15d85005fd4f558237";
const TOKENS5 = [
  "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03",
  "0x7507c1dc16935B82698e4C63f2746A2fCf994dF8",
]; // HONEY, WBERA
const REWARDS5 = ["0x46efc86f0d7455f135cc9df501673739d513e982"]; // IBGT
const SYMBOL5 = "HONEY-WBERA";

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
    "contracts/plugins/berachain/InfraredVaultPluginFactory.sol:InfraredVaultPluginFactory",
    "0x9C356543AB03f9c069B97c69717bdDF82302Ad7b"
  );
  // plugin = await ethers.getContractAt("contracts/plugins/berachain/InfraredVaultPluginFactory.sol:InfraredVaultPlugin", "0x0000000000000000000000000000000000000000");

  console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployPluginFactory() {
  console.log("Starting PluginFactory Deployment");
  const pluginFactoryArtifact = await ethers.getContractFactory(
    "InfraredVaultPluginFactory"
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
      "contracts/plugins/berachain/InfraredVaultPluginFactory.sol:InfraredVaultPluginFactory",
    constructorArguments: [VOTER_ADDRESS],
  });
  console.log("PluginFactory Verified");
}

async function deployPlugin() {
  console.log("Starting Plugin Deployment");
  await pluginFactory.createPlugin(VAULT5, TOKENS5, REWARDS5, SYMBOL5, {
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
      "contracts/plugins/berachain/InfraredVaultPluginFactory.sol:InfraredVaultPlugin",
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

  await deployPlugin();

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
