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
const PAW = "0xB43fd1dC4f02d81f962E98203b2cc4FD9E342964";
const IBGT = "0x46efc86f0d7455f135cc9df501673739d513e982";

// Station Berps bHONEY
// get from https://bartio.berps.berachain.com/vault
// plugin = 0x5CB754B91884E04924C7e1A12531E0a909d28c9a
// bribe = 0xf6ee04B16F4Df2A6e775f620e7d9A6D764655976
// gauge = 0xE599297f3EA31C4a639911A3A0F79BE91cf2e1b4
// vaultToken = 0xe330A3bD7449Ec36DfdC931bf8941Ba1d3bDF2CE
// rewardVault = 0xD7438143a6F23D59483175f01519d7789C00a097
const STATION0 = "0x1306D3c36eC7E38dd2c128fBe3097C2C2449af64";
const STATION0_TOKENS = [HONEY];
const STATION0_SYMBOL = "Berps bHONEY";
const STATION0_NAME = "Beradrome Station Berps bHONEY Vault Token";

// Station Bex HONEY-WBERA
// get from https://bartio.bex.berachain.com/add-liquidity/0xd28d852cbcc68DCEC922f6d5C7a8185dBaa104B7
// plugin = 0xE4059e765F66aee9Cd0a88D8a9Dd44A72F428760
// bribe = 0x7156AC6d7A6a772eA1d8A66561d9852F59d9e757
// gauge = 0xED3BF88A30fD6d1dc715b311767005161B3436B7
// vaultToken = 0x11e1E4d48b2020Fa2fC01423322de0a5A8B8dEE2
// rewardVault = 0x360C1e37e33457e1f6543515cDAa91F0425A6D77
const STATION1 = "0xd28d852cbcc68DCEC922f6d5C7a8185dBaa104B7";
const STATION1_TOKENS = [HONEY, WBERA];
const STATION1_SYMBOL = "Bex HONEY-WBERA";
const STATION1_NAME = "Beradrome Station Bex HONEY-WBERA Vault Token";

// Station Bex HONEY-USDC
// get from https://bartio.bex.berachain.com/add-liquidity/0xd69adb6fb5fd6d06e6ceec5405d95a37f96e3b96
// plugin = 0x210d85b2932372A6B3E609377e7407E91B84aA9d
// bribe = 0x876AF269ce9dcB9a85024B8d068Fe249801B7F63
// gauge = 0x520C68ADF4684237a9FF1d52B34d1FE260d74CCC
// vaultToken = 0x91010F5eEf6dDA764215445c6F969CFeB3E1919d
// rewardVault = 0x4F7957fEfe6DC5c532Bf1790B3FE0ECd2C8fF6f0
const STATION2 = "0xD69ADb6FB5fD6D06E6ceEc5405D95A37F96E3b96";
const STATION2_TOKENS = [HONEY, USDC];
const STATION2_SYMBOL = "Bex HONEY-USDC";
const STATION2_NAME = "Beradrome Station Bex HONEY-USDC Vault Token";

// Station Bex HONEY-WBTC
// get from https://bartio.bex.berachain.com/add-liquidity/0x9df84a72e6eb08ecd074626b931c93f92a134e23
// plugin = 0x74224c0e594dF5358ac65cE49b2Cb78B6Ed172D4
// bribe = 0xf38AD2E964617F4418d73e4a5DA75f0B974B3499
// gauge = 0x0bAeB4d9A8010eF7e649c8c933bAAA99ddB6d8D5
// vaultToken = 0x71A9186C239866F820E6Be0Fe68a729aC5d0334f
// rewardVault = 0x69644341fff974BEb0F0c6F2c85009397A84Ef69
const STATION3 = "0x9df84A72E6Eb08ecD074626b931c93f92a134e23";
const STATION3_TOKENS = [HONEY, WBTC];
const STATION3_SYMBOL = "Bex HONEY-WBTC";
const STATION3_NAME = "Beradrome Station Bex HONEY-WBTC Vault Token";

// Station Bex HONEY-WETH
// get from https://bartio.bex.berachain.com/add-liquidity/0xfbe71d98f9d2c658d52a2d72994c717637c3dda1
// plugin = 0x4ff9Cbe17717B698a2CC115AAdefC2e808a90f75
// bribe = 0x50D3f68C79dF82bCB52F0E948d549f986C6029Ff
// gauge = 0x758Dd26458B59ABFDf6Db5d60D79F5Eaf776b07A
// vaultToken = 0xA8f8B6816680f5da3C177c6Cc10b643e7453911A
// rewardVault = 0xD5CE26454ad775C5FBDc97887C3d4421C61b7De2
const STATION4 = "0xfbE71d98f9D2c658d52a2d72994c717637C3ddA1";
const STATION4_TOKENS = [HONEY, WETH];
const STATION4_SYMBOL = "Bex HONEY-WETH";
const STATION4_NAME = "Beradrome Station Bex HONEY-WETH Vault Token";

// Station Bex PAW-HONEY
// get from https://bartio.bex.berachain.com/add-liquidity/0xa51afaf359d044f8e56fe74b9575f23142cd4b76
// plugin = 0x2ea6089947484d69fCEF3Cdb661a2dd5618A6C31
// bribe = 0xeda51Ae94AAd310701D80620FA4D1Dab54CE2595
// gauge = 0xbDd2880cCf18141b0c5fD6B3616B2a50b182aaB1
// vaultToken = 0xA9c64D0126d2F1606B503E7fF93E8530c6d309cd
// rewardVault = 0x174ECb3fcc269f786EC1791f3eB42eFC25c0752A
const STATION5 = "0xa51afAF359d044F8e56fE74B9575f23142cD4B76";
const STATION5_TOKENS = [PAW, HONEY];
const STATION5_SYMBOL = "Bex PAW-HONEY";
const STATION5_NAME = "Beradrome Station Bex PAW-HONEY Vault Token";

// Station Kodiak HONEY-STGUSDC
// get from https://app.kodiak.finance/#/liquidity/islands/0xb73dee52f38539ba854979eab6342a60dd4c8c03?chain=berachain_bartio
// plugin = 0xC9e7AF5c63e7225f9FbE8A0c7d3BDED1f3e53A03
// bribe = 0x7736446158570c6438c7E34846c5D10bcdF083Ff
// gauge = 0x432d49ae13BFa50b733aD765cB9ae9ce52e72524
// vaultToken = 0x949920eb4830B0314E3D207059EE30d0C0d72b27
// rewardVault = 0xb65Cc761eE655d92947BA9B740E73926fe77E85b
const STATION6 = "0xb73deE52F38539bA854979eab6342A60dD4C8c03";
const STATION6_TOKENS = [HONEY, STGUSDC];
const STATION6_SYMBOL = "Kodiak HONEY-STGUSDC";
const STATION6_NAME = "Beradrome Station Kodiak HONEY-STGUSDC Vault Token";

// Station Kodiak iBGT-WBERA
// get from https://app.kodiak.finance/#/liquidity/islands/0x7fd165b73775884a38aa8f2b384a53a3ca7400e6?chain=berachain_bartio
// plugin = 0xda3e1DcE300c56c60DFE9C0f2Ec8412816E2B9d2
// bribe = 0x14ca06618e46ad41D2e6C24C02Fa3e6ca7f85728
// gauge = 0x0848C257D1A741ef3e4dC886D14bd62319c89CB2
// vaultToken = 0x4fFaF32B2296D76A6012e18f635B8e49687B685A
// rewardVault = 0xf2e3Ce2a70AB5b0DEc8ff3243b01F50c2918c4b6
const STATION7 = "0x7fd165B73775884a38AA8f2B384A53A3Ca7400E6";
const STATION7_TOKENS = [IBGT, WBERA];
const STATION7_SYMBOL = "Kodiak iBGT-WBERA";
const STATION7_NAME = "Beradrome Station Kodiak iBGT-WBERA Vault Token";

// Station Kodiak YEET-WBERA
// get from https://app.kodiak.finance/#/liquidity/islands/0xe5a2ab5d2fb268e5ff43a5564e44c3309609aff9?chain=berachain_bartio
// plugin = 0x3C8A1821106171216F6427B96D747bE2aF56f856
// bribe = 0xc034922d443710e2F82696d09F482B4f43750e51
// gauge = 0x811d039e4b7Fe007C14BF024f9cD433045d18468
// vaultToken = 0x2d8115DBd88E95C2f79CAa369b2CE1649dF4e76D
// rewardVault = 0x5E10749Ad98267a3d767fFE88bD63496ACF5BF49
const STATION8 = "0xE5A2ab5D2fb268E5fF43A5564e44c3309609aFF9";
const STATION8_TOKENS = [YEET, WBERA];
const STATION8_SYMBOL = "Kodiak YEET-WBERA";
const STATION8_NAME = "Beradrome Station Kodiak YEET-WBERA Vault Token";

// Station Kodiak NECT-HONEY
// get from https://app.kodiak.finance/#/liquidity/islands/0x63b0edc427664d4330f72eec890a86b3f98ce225?chain=berachain_bartio
// plugin = 0xC46D2D5a42d705b02c52366b4e6C995B5a7F340e
// bribe = 0xB1bfF2F34de5dc73b990e82431e3d486586f2973
// gauge = 0xC2bD74874F96C361834F52970c8058128F677fcf
// vaultToken = 0x0c8E89C3Ce90F07C0df224D59d400596AeA6EC35
// rewardVault = 0x0a0b0a509b6EC26604B65676b9fbEd32c08C7773
const STATION9 = "0x63b0EdC427664D4330F72eEc890A86b3F98ce225";
const STATION9_TOKENS = [NECT, HONEY];
const STATION9_SYMBOL = "Kodiak NECT-HONEY";
const STATION9_NAME = "Beradrome Station Kodiak NECT-HONEY Vault Token";

// Infrared Berps bHONEY
// get from https://bartio.berps.berachain.com/vault
// plugin = 0xE523bf4644c1B0Cf715237963a5dEF25E8DEFAEd
// bribe = 0xC6929b15aF40f298BA99CDD2D365E26bFBe23D73
// gauge = 0x706C5D47fD8162BecEB31AFA53a9A2ee21949158
// vaultToken = 0x64410118db9762cF4a11b95A3e8E6f059B11cFB7
// rewardVault = 0x968a3F5f8f2e9b30183407831415363aDf8c656D
const INFRARED_VAULT_0 = "0x7d91bf5851b3a8bcf8c39a69af2f0f98a4e2202a";
const INFRARED_TOKENS_0 = [HONEY];
const INFRARED_REWARDS_0 = [IBGT];
const INFRARED_SYMBOL_0 = "Berps bHONEY";
const INFRARED_NAME_0 = "Beradrome Infrared Berps bHONEY Vault Token";

// Infrared Bex HONEY-USDC
// get from https://bartio.bex.berachain.com/add-liquidity/0xd69adb6fb5fd6d06e6ceec5405d95a37f96e3b96
// plugin = 0xca0619Cbef3be8ca0DC9DeFFb194b21A28eA6e44
// bribe = 0xB29326a8710c3b9CEcfd518A9D4f13C95022A5aD
// gauge = 0x3E82606924222CB39cCff5fD991936bd5B364054
// vaultToken = 0x7c904bB8Bc7aaceaF69a72451E8EC6Db276711f3
// rewardVault = 0x1c3D9848450Ced041bFC263FED8ce4112C2E5CE0
const INFRARED_VAULT_1 = "0x675547750f4acdf64ed72e9426293f38d8138ca8";
const INFRARED_TOKENS_1 = [HONEY, USDC];
const INFRARED_REWARDS_1 = [IBGT];
const INFRARED_SYMBOL_1 = "Bex HONEY-USDC";
const INFRARED_NAME_1 = "Beradrome Infrared Bex HONEY-USDC Vault Token";

// Infrared Bex HONEY-WBERA
// get from https://bartio.bex.berachain.com/add-liquidity/0xd28d852cbcc68DCEC922f6d5C7a8185dBaa104B7
// plugin = 0xC3e08b557C70F2E8d8Ad5d05AcE4A17535d76fF9
// bribe = 0xF30c9Af7f402c630FEDC7086D4BC3f9Fd6382380
// gauge = 0x63F99d79429C92d6e43E97f82425a4fA03ac466C
// vaultToken = 0xd643E2D6cC7b1D5d0B79Fb6C89490034E6F9C1E6
// rewardVault = 0x1591131e420B4f47193D644F3941Da8F63642045
const INFRARED_VAULT_2 = "0x5c5f9a838747fb83678ece15d85005fd4f558237";
const INFRARED_TOKENS_2 = [HONEY, WBERA];
const INFRARED_REWARDS_2 = [IBGT];
const INFRARED_SYMBOL_2 = "Bex HONEY-WBERA";
const INFRARED_NAME_2 = "Beradrome Infrared Bex HONEY-WBERA Vault Token";

// Infrared Bex HONEY-WBTC
// get from https://bartio.bex.berachain.com/add-liquidity/0x9df84a72e6eb08ecd074626b931c93f92a134e23
// plugin = 0x8128DdB535f3a2cAAe61f7d57e08Ca3B01A3DA72
// bribe = 0xF79cAc11bc922dF0CFD476bCE65f5577123Cf22B
// gauge = 0xd352D57f8a842b8A9364C45958530f80A5a86321
// vaultToken = 0x07632EB60Aa3FeF656f4dbB46491b3c62e1F91DD
// rewardVault = 0xBaC773C2306270D592AD430C20e85a0B2bF309C4
const INFRARED_VAULT_3 = "0x42faa63ab12825ec2efb6ff01d7c1cf1327c3bab";
const INFRARED_TOKENS_3 = [HONEY, WBTC];
const INFRARED_REWARDS_3 = [IBGT];
const INFRARED_SYMBOL_3 = "Bex HONEY-WBTC";
const INFRARED_NAME_3 = "Beradrome Infrared Bex HONEY-WBTC Vault Token";

// Infrared Bex HONEY-WETH
// get from https://bartio.bex.berachain.com/add-liquidity/0xfbe71d98f9d2c658d52a2d72994c717637c3dda1
// plugin = 0xDC6e0d91839bD486d80b2C7400F3977711E9aAEC
// bribe = 0x578F2d80C1C0618939f86B7Ef017E129c9539Cc6
// gauge = 0x131628f5cc4370a0685Bf72a401E076cd46D4ef9
// vaultToken = 0x25b0fBB777B198236Ed8DE3884D1CE50291218e9
// rewardVault = 0xD268207aDdfEA206c8e01e0676974c736Cf48856
const INFRARED_VAULT_4 = "0x18800fD6b9fC335cDDEa49144fDd49bacce96362";
const INFRARED_TOKENS_4 = [HONEY, WETH];
const INFRARED_REWARDS_4 = [IBGT];
const INFRARED_SYMBOL_4 = "Bex HONEY-WETH";
const INFRARED_NAME_4 = "Beradrome Infrared Bex HONEY-WETH Vault Token";

// Infrared iBGT
// get from https://infrared.finance/vaults
// plugin = 0xb77Ab678dFe7E7f9af4f7d877a478816B2e9d072
// bribe = 0x08BDaD626d27ab907b6D638A42FfAb561229bD46
// gauge = 0x0dcb508BC2867C1256b6C98A250c3964B94Ca8eD
// vaultToken = 0x47004FAE747076A1e96bD654De1B8b8FA38e3482
// rewardVault = 0xd0AC58eE5cd3435D30C59863D7aA9001AC671375
const INFRARED_VAULT_5 = "0x31e6458c83c4184a23c761fdaffb61941665e012";
const INFRARED_TOKENS_5 = [IBGT];
const INFRARED_REWARDS_5 = [HONEY];
const INFRARED_SYMBOL_5 = "iBGT";
const INFRARED_NAME_5 = "Beradrome Infrared iBGT Vault Token";

// Infrared Kodiak iBGT-WBERA
// get from https://app.kodiak.finance/#/liquidity/islands/0x7fd165b73775884a38aa8f2b384a53a3ca7400e6?chain=berachain_bartio
// plugin = 0xB55091054bDbbb54Bf7969bfC9CB4F4CD0e4a4dF
// bribe = 0x1F0bD325cAD1c1F0F72387599Dcd37592b188972
// gauge = 0x7332FF463ecC8F5218493062819E9D4fcf60c181
// vaultToken = 0x6F45c95DA4475021bb12d8a25322034046864546
// rewardVault = 0xfe4C49dFba8Bf7e2C3d901e2440CFe97A6727c0E
const INFRARED_VAULT_6 = "0x763F65E5F02371aD6C24bD60BCCB0b14E160d49b";
const INFRARED_TOKENS_6 = [IBGT, WBERA];
const INFRARED_REWARDS_6 = [IBGT];
const INFRARED_SYMBOL_6 = "Kodiak iBGT-WBERA";
const INFRARED_NAME_6 = "Beradrome Infrared Kodiak iBGT-WBERA Vault Token";

// Infrared Kodiak HONEY-STGUSDC
// get from https://app.kodiak.finance/#/liquidity/islands/0xb73dee52f38539ba854979eab6342a60dd4c8c03?chain=berachain_bartio
// plugin = 0xE9Ce6630d8795Efa7Ca79864EEea539967c0ba55
// bribe = 0x0cBbCda4B581Ba2139Da0B0eCB97284FEb93B694
// gauge = 0x13639d7E9392f5E50989905bF2D547e75574BBd9
// vaultToken = 0xb7FcF54A7B4e5eeddA448b8aC22AE50292FEFa51
// rewardVault = 0xdb00CB52892c933222f1681EDeD680fd1b73a62A
const INFRARED_VAULT_7 = "0x1B602728805Ca854e0DFDbbBA9060345fB26bc20";
const INFRARED_TOKENS_7 = [HONEY, STGUSDC];
const INFRARED_REWARDS_7 = [IBGT];
const INFRARED_SYMBOL_7 = "Kodiak HONEY-STGUSDC";
const INFRARED_NAME_7 = "Beradrome Infrared Kodiak HONEY-STGUSDC Vault Token";

// Infrared Kodiak YEET-BERA
// get from https://app.kodiak.finance/#/liquidity/islands/0xe5a2ab5d2fb268e5ff43a5564e44c3309609aff9?chain=berachain_bartio
// plugin = 0x80578B45D012309EeD6D267A79d570F5aC16DB1d
// bribe = 0x68dA053743790335A08F09D26C763f38e1391F39
// gauge = 0xF14013D65EEf4D4cf841A5759E91269Dd6f4a80e
// vaultToken = 0xdB8608a753F0aa1EC95964B42D65E4F324aA2312
// rewardVault = 0x26C6784f3e0f17B698A50F82582C8b00331EEd24
const INFRARED_VAULT_8 = "0x89DAFF790313d0Cc5cC9971472f0C73A19D9C167";
const INFRARED_TOKENS_8 = [YEET, WBERA];
const INFRARED_REWARDS_8 = [IBGT];
const INFRARED_SYMBOL_8 = "Kodiak YEET-BERA";
const INFRARED_NAME_8 = "Beradrome Infrared Kodiak YEET-BERA Vault Token";

// Infrared Kodiak NECT-HONEY
// get from https://app.kodiak.finance/#/liquidity/islands/0x63b0edc427664d4330f72eec890a86b3f98ce225?chain=berachain_bartio
// plugin = 0xE847417023C59aD4C55bd2B5a6e0795dCf7714c4
// bribe = 0xb94a124d41e097593702E582F4FD8AF9a3BCf08D
// gauge = 0xCB8c085508f0736aBc36F9f45aa15Fc0031eeDaf
// vaultToken = 0x20a5c6251e798f9389B027c811533D1C0a44a986
// rewardVault = 0xaCFccBBDF42d02BCe4069D6bcF266F3eE04C6415
const INFRARED_VAULT_9 = "0x584084216b8D0193EB26f6e28466535f29f3B20c";
const INFRARED_TOKENS_9 = [NECT, HONEY];
const INFRARED_REWARDS_9 = [IBGT];
const INFRARED_SYMBOL_9 = "Kodiak NECT-HONEY";
const INFRARED_NAME_9 = "Beradrome Infrared Kodiak NECT-HONEY Vault Token";

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const tenThousand = convert("10000", 18);
const BUILDER_ADDRESS = "0xDeb7d9B443a3ab779DFe9Ff2Aa855b1eA5fD318e";

// Contract Variables
let TOKEN, OTOKEN, VTOKEN, fees, rewarder, governor;
let voter, minter, gaugeFactory, bribeFactory;
let multicall, controller;

let stationPlugin;
let stationPluginFactory;

let infraredPlugin;
let infraredPluginFactory;

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
    "0x6a1907ea0e1114400577331c0C6079e61eE5d135"
  );
  bribeFactory = await ethers.getContractAt(
    "contracts/BribeFactory.sol:BribeFactory",
    "0x7292334314d98c0CA6483A956dA88B8F74F5417A"
  );
  voter = await ethers.getContractAt(
    "contracts/VaultVoter.sol:VaultVoter",
    "0x9e45d76EbFA31c111336f9490C9BbA01825fdD5D"
  );
  minter = await ethers.getContractAt(
    "contracts/Minter.sol:Minter",
    "0x8A832cd3f401f6D32689B2ea2f2E1f7009BE00AC"
  );

  multicall = await ethers.getContractAt(
    "contracts/Multicall.sol:Multicall",
    "0xd1350C07Eb7C38Ce6232BABeAe779dB7cE562E37"
  );
  controller = await ethers.getContractAt(
    "contracts/Controller.sol:Controller",
    "0xDa6AB80a4fe4BeaEDDc18B4534CC715615a4756F"
  );

  stationPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/StationPluginFactory.sol:StationPluginFactory",
    "0x713699B526A32f8DD928eb4ca51236E8a08499cd"
  );
  stationPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/StationPluginFactory.sol:StationPlugin",
    "0x5CB754B91884E04924C7e1A12531E0a909d28c9a"
  );

  infraredPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPluginFactory",
    "0xe6ee9F5a11d9B25bDe7d032CcAAf38c9acFB35a8"
  );
  infraredPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPlugin",
    "0xE523bf4644c1B0Cf715237963a5dEF25E8DEFAEd"
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

  //   await voter.initialize(minter.address);
  // await sleep(5000);
  //   await minter.setVoter(voter.address);
  //   await sleep(5000);
  //   console.log("Minter Set Up");

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
    STATION9,
    STATION9_TOKENS,
    STATION9_SYMBOL,
    STATION9_NAME,
    { gasPrice: ethers.gasPrice }
  );
  await sleep(5000);
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
    INFRARED_VAULT_9,
    INFRARED_TOKENS_9,
    INFRARED_REWARDS_9,
    INFRARED_SYMBOL_9,
    INFRARED_NAME_9,
    { gasPrice: ethers.gasPrice }
  );
  await sleep(5000);
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
  //   await verifyController();
  //   console.log("Ancillary Contracts Verified");

  //===================================================================
  // 8. Set Up System
  //===================================================================

  //   console.log("Starting System Set Up");
  //   await setUpSystem(wallet.address);
  //   console.log("System Set Up");

  //===================================================================
  // 9. Transfer Ownership
  //===================================================================

  // console.log("Starting Ownership Transfer");
  // await transferOwnership();
  // console.log("Ownership Transferred");

  //===================================================================
  // 10. Add plugins to voter
  //===================================================================

  // Add station plugins
  //   console.log("Adding STATION0 to Voter");
  //   await voter.addPlugin("0x5CB754B91884E04924C7e1A12531E0a909d28c9a"); // Station Berps bHONEY
  //   console.log("Adding STATION1 to Voter");
  //   await voter.addPlugin("0xE4059e765F66aee9Cd0a88D8a9Dd44A72F428760"); // Station Bex HONEY-WBERA
  //   console.log("Adding STATION2 to Voter");
  //   await voter.addPlugin("0x210d85b2932372A6B3E609377e7407E91B84aA9d"); // Station Bex HONEY-USDC
  //   console.log("Adding STATION3 to Voter");
  //   await voter.addPlugin("0x74224c0e594dF5358ac65cE49b2Cb78B6Ed172D4"); // Station Bex HONEY-WBTC
  //   console.log("Adding STATION4 to Voter");
  //   await voter.addPlugin("0x4ff9Cbe17717B698a2CC115AAdefC2e808a90f75"); // Station Bex HONEY-WETH
  //   console.log("Adding STATION5 to Voter");
  //   await voter.addPlugin("0x2ea6089947484d69fCEF3Cdb661a2dd5618A6C31"); // Station Bex PAW-HONEY
  //   console.log("Adding STATION6 to Voter");
  //   await voter.addPlugin("0xC9e7AF5c63e7225f9FbE8A0c7d3BDED1f3e53A03"); // Station Kodiak HONEY-STGUSDC
  //   console.log("Adding STATION7 to Voter");
  //   await voter.addPlugin("0xda3e1DcE300c56c60DFE9C0f2Ec8412816E2B9d2"); // Station Kodiak iBGT-WBERA
  //   console.log("Adding STATION8 to Voter");
  //   await voter.addPlugin("0x3C8A1821106171216F6427B96D747bE2aF56f856"); // Station Kodiak YEET-WBERA
  //   console.log("Adding STATION9 to Voter");
  //   await voter.addPlugin("0xC46D2D5a42d705b02c52366b4e6C995B5a7F340e"); // Station Kodiak NECT-HONEY

  // Add infrared plugins
  //   console.log("Adding INFRARED0 to Voter");
  //   await voter.addPlugin("0xE523bf4644c1B0Cf715237963a5dEF25E8DEFAEd"); // Infrared Berps bHONEY
  //   console.log("Adding INFRARED1 to Voter");
  //   await voter.addPlugin("0xca0619Cbef3be8ca0DC9DeFFb194b21A28eA6e44"); // Infrared Bex HONEY-USDC
  //   console.log("Adding INFRARED2 to Voter");
  //   await voter.addPlugin("0xC3e08b557C70F2E8d8Ad5d05AcE4A17535d76fF9"); // Infrared Bex HONEY-WBERA
  //   console.log("Adding INFRARED3 to Voter");
  //   await voter.addPlugin("0x8128DdB535f3a2cAAe61f7d57e08Ca3B01A3DA72"); // Infrared Bex HONEY-WBTC
  //   console.log("Adding INFRARED4 to Voter");
  //   await voter.addPlugin("0xDC6e0d91839bD486d80b2C7400F3977711E9aAEC"); // Infrared Bex HONEY-WETH
  //   console.log("Adding INFRARED5 to Voter");
  //   await voter.addPlugin("0xb77Ab678dFe7E7f9af4f7d877a478816B2e9d072"); // Infrared iBGT
  //   console.log("Adding INFRARED6 to Voter");
  //   await voter.addPlugin("0xB55091054bDbbb54Bf7969bfC9CB4F4CD0e4a4dF"); // Infrared Kodiak iBGT-WBERA
  //   console.log("Adding INFRARED7 to Voter");
  //   await voter.addPlugin("0xE9Ce6630d8795Efa7Ca79864EEea539967c0ba55"); // Infrared Kodiak HONEY-STGUSDC
  //   console.log("Adding INFRARED8 to Voter");
  //   await voter.addPlugin("0x80578B45D012309EeD6D267A79d570F5aC16DB1d"); // Infrared Kodiak YEET-BERA
  console.log("Adding INFRARED9 to Voter");
  await voter.addPlugin("0xE847417023C59aD4C55bd2B5a6e0795dCf7714c4"); // Infrared Kodiak NECT-HONEY

  await sleep(10000);
  console.log("Plugin: ", "0xE847417023C59aD4C55bd2B5a6e0795dCf7714c4");
  await sleep(5000);
  console.log(
    "Bribe: ",
    await voter.bribes("0xE847417023C59aD4C55bd2B5a6e0795dCf7714c4")
  );
  console.log(
    "Gauge: ",
    await voter.gauges("0xE847417023C59aD4C55bd2B5a6e0795dCf7714c4")
  );

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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
