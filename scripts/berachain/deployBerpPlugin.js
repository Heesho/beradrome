const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

// PluginFactory settings
const VOTER_ADDRESS = "0x2363BB86cD2ABF89cc059A654f89f11bCceffcA9";
const HONEY = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";
const WBERA = "0x7507c1dc16935B82698e4C63f2746A2fCf994dF8";

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);

// Contract Variables
let plugin;

/*===================================================================*/
/*===========================  CONTRACT DATA  =======================*/

async function getContracts() {
  // plugin = await ethers.getContractAt("contracts/plugins/berachain/BerpsVaultPlugin.sol:BerpsVaultPlugin", "0x0000000000000000000000000000000000000000");

  console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployPlugin() {
  console.log("Starting Plugin Deployment");
  const pluginArtifact = await ethers.getContractFactory("BerpsVaultPlugin");
  const pluginContract = await pluginArtifact.deploy(
    VOTER_ADDRESS,
    [HONEY],
    [WBERA],
    "BERPS",
    "bHONEY",
    {
      gasPrice: ethers.gasPrice,
    }
  );
  plugin = await pluginContract.deployed();
  await sleep(5000);
  console.log("PluginDeployed at:", plugin.address);
  console.log("**************************************************************");
  console.log("Plugin: ", plugin.address);
  console.log("**************************************************************");
}

async function verifyPlugin() {
  console.log("Starting Plugin Verification");
  await hre.run("verify:verify", {
    address: plugin.address,
    contract:
      "contracts/plugins/berachain/BerpsVaultPlugin.sol:BerpsVaultPlugin",
    constructorArguments: [
      VOTER_ADDRESS,
      await plugin.getTokensInUnderlying(),
      await plugin.getBribeTokens(),
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
  // 1. Deploy Plugin
  //===================================================================
  // Only deploy one plugin at a time

  // await deployPlugin();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 2. Verify Plugin
  //===================================================================

  // await verifyPlugin();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
