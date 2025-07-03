const { config } = require("dotenv");

require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require("solidity-coverage");

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

// const CHAIN_ID = 80069; // Berachain Bepolia chain id
const CHAIN_ID = 80094; // Berachain Mainnet chain id

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

config();
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const SCAN_API_KEY = process.env.SCAN_API_KEY || "";
const RPC_URL = process.env.RPC_URL || "";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    // mainnet: {
    //   url: RPC_URL,
    //   chainId: CHAIN_ID,
    //   accounts: [PRIVATE_KEY],
    // },
    hardhat: {
      chainId: CHAIN_ID,
      forking: {
        url: RPC_URL,
        // blockNumber: 7000000,
      },
    },
  },
  etherscan: {
    apiKey: SCAN_API_KEY,
    customChains: [
      {
        network: "berachain",
        chainId: 80094,
        urls: {
          apiURL: "https://api.berascan.com/api",
          browserURL: "https://berascan.com/",
        },
      },
      {
        network: "berachain_bepolia",
        chainId: 80069,
        urls: {
          apiURL:
            "https://api.routescan.io/v2/network/testnet/evm/80069/etherscan",
          browserURL: "https://bepolia.beratrail.io",
        },
      },
    ],
  },

  paths: {
    sources: "./contracts",
    tests: "./tests/bera",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 300000,
  },
};
