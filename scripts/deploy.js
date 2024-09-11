const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

const MARKET_RESERVES = "250000"; // 250,000 TOKEN in market reserves

const BASE_ADDRESS = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03"; // HONEY address
const MULTISIG = "0x34D023ACa5A227789B45A62D377b5B18A680BE01"; // Multisig Address

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
let OTOKENFactory, VTOKENFactory, rewarderFactory;
let voter, minter, gaugeFactory, bribeFactory;
let multicall, controller;
let trifectaMulticall;

/*===================================================================*/
/*===========================  CONTRACT DATA  =======================*/

async function getContracts() {
  OTOKENFactory = await ethers.getContractAt(
    "contracts/OTOKENFactory.sol:OTOKENFactory",
    "0xAB8EC0B41B510fe6Dc2Ac0a68828BfB1708c188f"
  );
  VTOKENFactory = await ethers.getContractAt(
    "contracts/VTOKENFactory.sol:VTOKENFactory",
    "0xf5cfBaF55036264B902D9ae55A114d9A22c42750"
  );
  feesFactory = await ethers.getContractAt(
    "contracts/TOKENFeesFactory.sol:TOKENFeesFactory",
    "0x2365fEaaa38cF59d3C80fE9119AB5DB2468Cd4E1"
  );
  rewarderFactory = await ethers.getContractAt(
    "contracts/VTOKENRewarderFactory.sol:VTOKENRewarderFactory",
    "0x7F78a39E9414f89abE94ED40b992D0101857Babb"
  );

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
    "0x473a6539F7E6995B1BeD3121116001DaCBCDBfdA"
  );
  bribeFactory = await ethers.getContractAt(
    "contracts/BribeFactory.sol:BribeFactory",
    "0xC0Af0298984d7444e7E82377d5C02f77Ad09ff4A"
  );
  voter = await ethers.getContractAt(
    "contracts/Voter.sol:Voter",
    "0x580ABF764405aA82dC96788b356435474c5956A7"
  );
  minter = await ethers.getContractAt(
    "contracts/Minter.sol:Minter",
    "0x8A832cd3f401f6D32689B2ea2f2E1f7009BE00AC"
  );

  multicall = await ethers.getContractAt(
    "contracts/Multicall.sol:Multicall",
    "0x8452DA49f0ae4dA4392b5714C2F0096997c93fE7"
  );
  controller = await ethers.getContractAt(
    "contracts/Controller.sol:Controller",
    "0x8058EC2572d8Bf6f85303714B06096CDf707d0CF "
  );

  trifectaMulticall = await ethers.getContractAt(
    "contracts/TrifectaMulticall.sol:TrifectaMulticall",
    "0x6d6C42723Dea7C2077AFF8a8fdB6417c6e20D041"
  );

  console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

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
    { gasPrice: ethers.gasPrice }
  );
  TOKEN = await TOKENContract.deployed();
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
  console.log("TOKEN: ", TOKEN.address);
  console.log("OTOKEN: ", OTOKEN.address);
  console.log("VTOKEN: ", VTOKEN.address);
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

  let amount = await OTOKEN.totalSupply();
  amount = amount.div(10);
  await OTOKEN.transfer(BUILDER_ADDRESS, amount);
  amount = await OTOKEN.balanceOf(wallet);
  await OTOKEN.transfer(MULTISIG, amount);
  console.log("OTOKEN Allocated");

  await sleep(5000);
  await gaugeFactory.setVoter(voter.address);
  await sleep(5000);
  await bribeFactory.setVoter(voter.address);
  await sleep(5000);
  console.log("Factories Set Up");

  await VTOKEN.addReward(TOKEN.address);
  await sleep(5000);
  await VTOKEN.addReward(OTOKEN.address);
  await sleep(5000);
  await VTOKEN.addReward(BASE_ADDRESS);
  await sleep(5000);
  console.log("VTOKEN Rewards Set Up");

  await VTOKEN.setVoter(voter.address);
  await sleep(5000);
  await OTOKEN.setMinter(minter.address);
  await sleep(5000);
  console.log("Token-Voting Set Up");

  await voter.initialize(minter.address);
  await sleep(5000);
  await minter.initialize();
  await sleep(5000);
  console.log("System Initialized");
}

async function transferOwnership() {
  await minter.setTeam(MULTISIG);
  await sleep(5000);
  console.log("Minter team set to MULTISIG");

  await minter.transferOwnership(MULTISIG);
  await minter.transferOwnership(governor.address);
  await sleep(5000);
  console.log("Minter ownership transferred to governor");

  await voter.transferOwnership(MULTISIG);
  await voter.transferOwnership(governor.address);
  await sleep(5000);
  console.log("Voter ownership transferred to governor");

  await VTOKEN.transferOwnership(MULTISIG);
  await VTOKEN.transferOwnership(governor.address);
  await sleep(5000);
  console.log("VTOKEN ownership transferred to governor");
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

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 2. Deploy Token
  //===================================================================

  //   console.log("Starting Token Deployment");
  //   await deployTOKEN();
  //   await deployGovernor();
  //   await printTokenAddresses();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 3. Deploy Voting System
  //===================================================================

  // console.log("Starting Voting Deployment");
  // await deployGaugeFactory(wallet.address);
  // await deployBribeFactory(wallet.address);
  // await deployVoter();
  // await deployMinter();
  // await printVotingAddresses();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 4. Deploy Ancillary Contracts
  //===================================================================

  // console.log("Starting Ancillary Deployment");
  // await deployMulticall();
  // await deployController();
  // await printAncillaryAddresses();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 5. Verify Token Contracts
  //===================================================================

  // console.log("Starting Token Verification");
  // await verifyTOKEN();
  // await verifyOTOKEN(wallet.address);
  // await verifyVTOKEN();
  // await verifyTOKENFees();
  // await verifyRewarder();
  // await verifyGovernor();
  // console.log("Token Contracts Verified");

  //===================================================================
  // 6. Verify Voting Contracts
  //===================================================================

  // console.log('Starting Voting Verification');
  // await verifyGaugeFactory(wallet.address);
  // await verifyBribeFactory(wallet.address);
  // await verifyVoter();
  // await verifyMinter();
  // console.log("Voting Contracts Verified")

  //===================================================================
  // 7. Verify Ancillary Contracts
  //===================================================================

  // console.log('Starting Ancillary Verification');
  // await verifyMulticall();
  // await verifyController();
  // console.log("Ancillary Contracts Verified")

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
  // 10. Add plugins to voter
  //===================================================================

  // console.log("Adding Plugin0 to Voter");
  // await voter.addPlugin("0x37e888f8a28BF1DA9761bbDd914fA4280dA434a8"); // BEX HONEY-WBERA
  // console.log("Adding Plugin1 to Voter");
  // await voter.addPlugin("0x9D7A7198eCfe07414C5e9B3e233878Fcc30B9048"); // BERPS bHONEY
  // console.log("Adding Plugin2 to Voter");
  // await voter.addPlugin("0xfE12B5f5adb8E20F7C43A6014844479e7dC8Dc49"); // Kodiak HONEY-WBERA Island
  // console.log("Adding Plugin3 to Voter");
  // await voter.addPlugin("0xb3D10C15360e444aBB2673D772D6f2EE32AAaB34"); // Kodiak HONEY-USDC Island
  // console.log("Adding Plugin4 to Voter");
  // await voter.addPlugin("0x80D7759Fa55f6a1F661D5FCBB3bC5164Dc63eb4D"); // Kodiak Trifecta YEET-WBERA Island
  // console.log("Adding Plugin5 to Voter");
  // await voter.addPlugin("0x61d0b4fbB9d507F64112e859523524AA2c548A6C"); // Bullas BULL ISH Game Plugin 0
  // console.log("Adding Plugin6 to Voter");
  // await voter.addPlugin("0xE9EE66a91F540A6E5297b1B1780061278AB1ac78"); // Infrared iBGT Plugin
  // console.log("Adding Plugin7 to Voter");
  // await voter.addPlugin("0x7Ab142C0FD1aF1EE0C52e80b251b3CF153Ad4033"); // Infrared bHONEY Plugin
  // console.log("Adding Plugin8 to Voter");
  // await voter.addPlugin("0x017A47E19e02d4aAf88738B8C78DE2a48904b2e1"); // Infrared HONEY-USDC Plugin
  // console.log("Adding Plugin9 to Voter");
  // await voter.addPlugin("0xb5469370776D165E82D726F36e3e0933c307d4c4"); // Infrared HONEY-WBTC Plugin
  // console.log("Adding Plugin10 to Voter");
  // await voter.addPlugin("0x170d64FB2FCD6bB6639eD0D37b981F6Af0E26C3a"); // Infrared HONEY-WETH Plugin
  // console.log("Adding Plugin11 to Voter");
  // await voter.addPlugin("0x120E4B564D608ab8ea110df0a1429998cCA580D0"); // Infrared HONEY-WBERA Plugin
  // console.log("Adding Plugin12 to Voter");
  // await voter.addPlugin("0x0375E50e3a58381b65Ce9D565313FD8f993101c5"); // Bullas BULL ISH Game Plugin 1
  // console.log("Adding Plugin13 to Voter");
  // await voter.addPlugin("0x62c310059A7d84805c675d2458234d3D137D9a1c"); // Kodiak Trifecta oBERO-WBERA Island
  // console.log("Adding Plugin13 to Voter");
  // await voter.addPlugin("0xC81c2E2415702179F78B51CbC5f9A16B957F5333"); // BUllas BULL ISH Game Plugin 2
  // console.log("Plugins added to Voter");

  //===================================================================
  // 11. Distro Rewards
  //===================================================================

  // console.log("Distributing Rewards");
  // await voter.distro();
  // console.log("Voter Rewards Distributed");
  // await fees.distribute();
  // console.log("Fees Rewards Distributed");
  // await voter.distributeToBribes([
  //   "0x37e888f8a28BF1DA9761bbDd914fA4280dA434a8", // BEX HONEY-WBERA
  //   "0x9D7A7198eCfe07414C5e9B3e233878Fcc30B9048", // BERPS bHONEY
  //   "0xfE12B5f5adb8E20F7C43A6014844479e7dC8Dc49", // Kodiak HONEY-WBERA Island
  //   "0xb3D10C15360e444aBB2673D772D6f2EE32AAaB34", // Kodiak HONEY-USDC Island
  //   "0x80D7759Fa55f6a1F661D5FCBB3bC5164Dc63eb4D", // Kodiak Trifecta YEET-WBERA Island
  //   "0x62c310059A7d84805c675d2458234d3D137D9a1c", // Kodiak Trifecta oBERO-WBERA Island
  // ]);
  // await voter.distributeToBribes([
  //   "0xE9EE66a91F540A6E5297b1B1780061278AB1ac78", // Infrared iBGT Plugin
  //   "0x7Ab142C0FD1aF1EE0C52e80b251b3CF153Ad4033", // Infrared bHONEY Plugin
  //   "0x017A47E19e02d4aAf88738B8C78DE2a48904b2e1", // Infrared HONEY-USDC Plugin
  //   "0xb5469370776D165E82D726F36e3e0933c307d4c4", // Infrared HONEY-WBTC Plugin
  //   "0x170d64FB2FCD6bB6639eD0D37b981F6Af0E26C3a", // Infrared HONEY-WETH Plugin
  //   "0x120E4B564D608ab8ea110df0a1429998cCA580D0", // Infrared HONEY-WBERA Plugin
  // ]);
  // await voter.distributeToBribes([
  //   "0xC81c2E2415702179F78B51CbC5f9A16B957F5333", // BULL ISH
  // ]);
  // console.log("Bribe Rewards Distributed");

  //===================================================================
  // 12. Plugin Data
  //===================================================================

  // console.log(
  //   await multicall
  //     .connect(wallet)
  //     .bribeCardData(
  //       "0x170d64FB2FCD6bB6639eD0D37b981F6Af0E26C3a",
  //       "0x0000000000000000000000000000000000000000"
  //     )
  // );

  // console.log(
  //   await multicall
  //     .connect(wallet)
  //     .gaugeCardData(
  //       "0xC81c2E2415702179F78B51CbC5f9A16B957F5333",
  //       "0x0000000000000000000000000000000000000000"
  //     )
  // );

  // console.log(
  //   await trifectaMulticall
  //     .connect(wallet)
  //     .gaugeRewardData(
  //       "0x80D7759Fa55f6a1F661D5FCBB3bC5164Dc63eb4D",
  //       "0x0000000000000000000000000000000000000000"
  //     )
  // );

  // console.log(await voter.connect(wallet).getPlugins());

  //===================================================================
  // 13. Add Gauge Rewards
  //===================================================================

  // await voter
  //   .connect(wallet)
  //   .addGaugeReward(
  //     "0x981E491Dd159F17009CF7cd27a98eAB995c2fa6C",
  //     "0xfd27998fa0eaB1A6372Db14Afd4bF7c4a58C5364"
  //   ); // KDK added to YEET-WBERA Island Gauge
  // console.log("- KDK added as gauge reward");
  // await voter
  //   .connect(wallet)
  //   .addGaugeReward(
  //     "0x981E491Dd159F17009CF7cd27a98eAB995c2fa6C",
  //     "0x414B50157a5697F14e91417C5275A7496DcF429D"
  //   ); // xKDK added to YEET-WBERA Island Gauge
  // console.log("- xKDK added as gauge rewards");
  // await voter
  //   .connect(wallet)
  //   .addBribeReward(
  //     "0xf045e041A63bC5Aa3523067F3C593FF3bb3d7827",
  //     "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03"
  //   ); // xKDK added to YEET-WBERA Island Gauge
  // console.log("- HONEY added as bribe rewards");
  // await voter
  //   .connect(wallet)
  //   .addGaugeReward(
  //     "0x5A0C0864FE63fb1a9364A4eFdd570497774288C7",
  //     "0xfd27998fa0eaB1A6372Db14Afd4bF7c4a58C5364"
  //   ); // KDK added to oBERO-WBERA Island Gauge
  // console.log("- KDK added as gauge reward");
  // await voter
  //   .connect(wallet)
  //   .addGaugeReward(
  //     "0x5A0C0864FE63fb1a9364A4eFdd570497774288C7",
  //     "0x414B50157a5697F14e91417C5275A7496DcF429D"
  //   ); // xKDK added to oBERO-WBERA Island Gauge
  // console.log("- xKDK added as gauge rewards");

  //===================================================================
  // 13. Deploy Trifecta Multicall
  //===================================================================

  // console.log("Starting TrifectaMulticall Deployment");
  // await deployTrifectaMulticall();
  // console.log("TrifectaMulticall Deployed at:", trifectaMulticall.address);

  // console.log(await minter.connect(wallet).active_period());

  //===================================================================
  // 14. Remove Plugin
  //===================================================================

  // console.log("Removing Plugin from Voter"); // Remove BULL ISH plugin
  // await voter
  //   .connect(wallet)
  //   .killGauge("0x489E3242d501c84d33A5858cfd2a35F64e157001");
  // console.log("Plugin removed from Voter");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
