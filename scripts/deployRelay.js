const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const ten = convert("10", 18);
const oneHundred = convert("100", 18);
const AddressZero = "0x0000000000000000000000000000000000000000";
const EPOCH_PERIOD = "864000";
const PRICE_MULTIPLIER = "2000000000000000000";

const OTOKEN = "0x7629668774f918c00Eb4b03AdF5C4e2E53d45f0b";
const VTOKEN = "0x2B4141f98B8cD2a03F58bD722D4E8916d2106504";
const rewarder = "0xD6c2BE22e7b766c810690B22234044407dDa1C1B";
const voter = "0x580ABF764405aA82dC96788b356435474c5956A7";

const RELAY_NAME = "Gumball Bero";
const RELAY_SYMBOL = "gumyBERO";
const RELAY_URI = "uri";
const RELAY_DESCRIPTION = "description";
const RELAY_REWARD = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03"; // HONEY

// Contract Variables
let relayFactory, relayMulticall;
let relayTokenFactory,
  relayRewarderFactory,
  relayDistroFactory,
  relayFeeFlowFactory;
let relayToken, relayRewarder, relayDistro, relayFeeFlow;

/*===================================================================*/
/*===========================  CONTRACT DATA  =======================*/

async function getContracts() {
  // console.log("Retrieving Contracts");

  relayFactory = await ethers.getContractAt(
    "contracts/RelayToken/RelayFactory.sol:RelayFactory",
    "0x8Bb156Cb6b31D99Af9201bF3093a8ee909a9c657"
  );

  relayTokenFactory = await ethers.getContractAt(
    "contracts/RelayToken/RelayTokenFactory.sol:RelayTokenFactory",
    "0x9b38FaF37702Aae1C1cA77706757a54EC6335C8A"
  );

  relayRewarderFactory = await ethers.getContractAt(
    "contracts/RelayToken/RelayRewarderFactory.sol:RelayRewarderFactory",
    "0x84F6da7d3e8E1bD71369b82236b81FEd5cD5858F"
  );

  relayDistroFactory = await ethers.getContractAt(
    "contracts/RelayToken/RelayDistroFactory.sol:RelayDistroFactory",
    "0xc9F82035F4ED10Fb189476F370b34f51FAe88952"
  );

  relayFeeFlowFactory = await ethers.getContractAt(
    "contracts/RelayToken/RelayFeeFlowFactory.sol:RelayFeeFlowFactory",
    "0xBD43465be5C66E290f8559336b369df96e4da8b4"
  );

  relayMulticall = await ethers.getContractAt(
    "contracts/RelayToken/RelayMulticall.sol:RelayMulticall",
    "0x59cc70742F8a8c3Db4d85a6D5413caDD84214b50"
  );

  relayToken = await ethers.getContractAt(
    "contracts/RelayToken/RelayTokenFactory.sol:RelayToken",
    "0xAe52a93fA067Ce101BBe46A946078EccDe4f99e4"
  );

  relayRewarder = await ethers.getContractAt(
    "contracts/RelayToken/RelayRewarderFactory.sol:RelayRewarder",
    "0x4efD5A2Dcadca58DA001953e20caa1d559f3C0eD"
  );

  relayDistro = await ethers.getContractAt(
    "contracts/RelayToken/RelayDistroFactory.sol:RelayDistro",
    "0xe5B701bEa714bA6965203372146Eb88702020Bd7"
  );

  relayFeeFlow = await ethers.getContractAt(
    "contracts/RelayToken/RelayFeeFlowFactory.sol:RelayFeeFlow",
    "0xE65BCd2308864d20C0f5cf9952865459BE173611"
  );

  console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployRelayFactory() {
  console.log("Starting RelayFactory Deployment");
  const relayFactoryArtifact = await ethers.getContractFactory("RelayFactory");
  const relayFactoryContract = await relayFactoryArtifact.deploy(
    OTOKEN,
    VTOKEN,
    rewarder,
    voter,
    { gasPrice: ethers.gasPrice }
  );
  relayFactory = await relayFactoryContract.deployed();
  await sleep(5000);
  console.log("RelayFactory Deployed at:", relayFactory.address);
}

async function deployRelayTokenFactory() {
  console.log("Starting RelayTokenFactory Deployment");
  const relayTokenFactoryArtifact = await ethers.getContractFactory(
    "RelayTokenFactory"
  );
  const relayTokenFactoryContract = await relayTokenFactoryArtifact.deploy(
    relayFactory.address,
    {
      gasPrice: ethers.gasPrice,
    }
  );
  relayTokenFactory = await relayTokenFactoryContract.deployed();
  await sleep(5000);
  console.log("RelayTokenFactory Deployed at:", relayTokenFactory.address);
}

async function deployRelayRewarderFactory() {
  console.log("Starting RelayRewarderFactory Deployment");
  const relayRewarderFactoryArtifact = await ethers.getContractFactory(
    "RelayRewarderFactory"
  );
  const relayRewarderFactoryContract =
    await relayRewarderFactoryArtifact.deploy(relayFactory.address, {
      gasPrice: ethers.gasPrice,
    });
  relayRewarderFactory = await relayRewarderFactoryContract.deployed();
  await sleep(5000);
  console.log(
    "RelayRewarderFactory Deployed at:",
    relayRewarderFactory.address
  );
}

async function deployRelayDistroFactory() {
  console.log("Starting RelayDistroFactory Deployment");
  const relayDistroFactoryArtifact = await ethers.getContractFactory(
    "RelayDistroFactory"
  );
  const relayDistroFactoryContract = await relayDistroFactoryArtifact.deploy(
    relayFactory.address,
    {
      gasPrice: ethers.gasPrice,
    }
  );
  relayDistroFactory = await relayDistroFactoryContract.deployed();
  await sleep(5000);
  console.log("RelayDistroFactory Deployed at:", relayDistroFactory.address);
}

async function deployRelayFeeFlowFactory() {
  console.log("Starting RelayFeeFlowFactory Deployment");
  const relayFeeFlowFactoryArtifact = await ethers.getContractFactory(
    "RelayFeeFlowFactory"
  );
  const relayFeeFlowFactoryContract = await relayFeeFlowFactoryArtifact.deploy(
    relayFactory.address,
    {
      gasPrice: ethers.gasPrice,
    }
  );
  relayFeeFlowFactory = await relayFeeFlowFactoryContract.deployed();
  await sleep(5000);
  console.log("RelayFeeFlowFactory Deployed at:", relayFeeFlowFactory.address);
}

async function deployRelayMulticall() {
  console.log("Starting RelayMulticall Deployment");
  const relayMulticallArtifact = await ethers.getContractFactory(
    "RelayMulticall"
  );
  const relayMulticallContract = await relayMulticallArtifact.deploy(
    relayFactory.address,
    OTOKEN,
    VTOKEN,
    rewarder,
    voter,
    {
      gasPrice: ethers.gasPrice,
    }
  );
  relayMulticall = await relayMulticallContract.deployed();
  await sleep(5000);
  console.log("RelayMulticall Deployed at:", relayMulticall.address);
}

async function printFactoryAddresses() {
  console.log("**************************************************************");
  console.log("RelayFactory: ", relayFactory.address);
  console.log("RelayTokenFactory: ", relayTokenFactory.address);
  console.log("RelayRewarderFactory: ", relayRewarderFactory.address);
  console.log("RelayDistroFactory: ", relayDistroFactory.address);
  console.log("RelayFeeFlowFactory: ", relayFeeFlowFactory.address);
  console.log("RelayMulticall: ", relayMulticall.address);
  console.log("**************************************************************");
}

async function verifyRelayFactory() {
  console.log("Starting RelayFactory Verification");
  await hre.run("verify:verify", {
    address: relayFactory.address,
    contract: "contracts/RelayToken/RelayFactory.sol:RelayFactory",
    constructorArguments: [OTOKEN, VTOKEN, rewarder, voter],
  });
  console.log("RelayFactory Verified");
}

async function verifyRelayTokenFactory() {
  console.log("Starting RelayTokenFactory Verification");
  await hre.run("verify:verify", {
    address: relayTokenFactory.address,
    contract: "contracts/RelayToken/RelayTokenFactory.sol:RelayTokenFactory",
    constructorArguments: [relayFactory.address],
  });
  console.log("RelayTokenFactory Verified");
}

async function verifyRelayRewarderFactory() {
  console.log("Starting RelayRewarderFactory Verification");
  await hre.run("verify:verify", {
    address: relayRewarderFactory.address,
    contract:
      "contracts/RelayToken/RelayRewarderFactory.sol:RelayRewarderFactory",
    constructorArguments: [relayFactory.address],
  });
  console.log("RelayRewarderFactory Verified");
}

async function verifyRelayDistroFactory() {
  console.log("Starting RelayDistroFactory Verification");
  await hre.run("verify:verify", {
    address: relayDistroFactory.address,
    contract: "contracts/RelayToken/RelayDistroFactory.sol:RelayDistroFactory",
    constructorArguments: [relayFactory.address],
  });
  console.log("RelayDistroFactory Verified");
}

async function verifyRelayFeeFlowFactory() {
  console.log("Starting RelayFeeFlowFactory Verification");
  await hre.run("verify:verify", {
    address: relayFeeFlowFactory.address,
    contract:
      "contracts/RelayToken/RelayFeeFlowFactory.sol:RelayFeeFlowFactory",
    constructorArguments: [relayFactory.address],
  });
  console.log("RelayFeeFlowFactory Verified");
}

async function verifyRelayMulticall() {
  console.log("Starting RelayMulticall Verification");
  await hre.run("verify:verify", {
    address: relayMulticall.address,
    contract: "contracts/RelayToken/RelayMulticall.sol:RelayMulticall",
    constructorArguments: [
      relayFactory.address,
      OTOKEN,
      VTOKEN,
      rewarder,
      voter,
    ],
  });
  console.log("RelayMulticall Verified");
}

async function setUpSystem() {
  console.log("Starting System Set Up");

  await relayFactory.setRelayTokenFactory(relayTokenFactory.address);
  await sleep(5000);
  console.log("RelayTokenFactory set to RelayFactory");
  await relayFactory.setRelayRewarderFactory(relayRewarderFactory.address);
  await sleep(5000);
  console.log("RelayRewarderFactory set to RelayFactory");
  await relayFactory.setRelayDistroFactory(relayDistroFactory.address);
  await sleep(5000);
  console.log("RelayDistroFactory set to RelayFactory");
  await relayFactory.setRelayFeeFlowFactory(relayFeeFlowFactory.address);
  await sleep(5000);
  console.log("RelayFeeFlowFactory set to RelayFactory");

  console.log("System Initialized");
}

async function deployRelay() {
  console.log("Starting Relay Deployment");
  await relayFactory.createRelay(
    RELAY_NAME,
    RELAY_SYMBOL,
    RELAY_URI,
    RELAY_DESCRIPTION,
    RELAY_REWARD,
    oneHundred,
    ten,
    { gasPrice: ethers.gasPrice }
  );
  console.log("Relay Deployed");
  let res = await relayFactory.index_Relay(0);
  console.log("RelayToken: ", res.relayToken);
  console.log("RelayRewarder: ", res.relayRewarder);
  console.log("RelayDistro: ", res.relayDistro);
  console.log("RelayFeeFlow: ", res.relayFeeFlow);
}

async function verifyRelayToken(wallet) {
  console.log("Starting Token Verification");
  await hre.run("verify:verify", {
    address: relayToken.address,
    contract: "contracts/RelayToken/RelayTokenFactory.sol:RelayToken",
    constructorArguments: [
      relayFactory.address,
      wallet,
      RELAY_NAME,
      RELAY_SYMBOL,
      RELAY_URI,
      RELAY_DESCRIPTION,
    ],
  });
  console.log("RelayToken Verified");
}

async function verifyRelayRewarder() {
  console.log("Starting Rewarder Verification");
  await hre.run("verify:verify", {
    address: relayRewarder.address,
    contract: "contracts/RelayToken/RelayRewarderFactory.sol:RelayRewarder",
    constructorArguments: [relayFactory.address, relayToken.address],
  });
  console.log("RelayRewarder Verified");
}

async function verifyRelayDistro() {
  console.log("Starting Distro Verification");
  await hre.run("verify:verify", {
    address: relayDistro.address,
    contract: "contracts/RelayToken/RelayDistroFactory.sol:RelayDistro",
    constructorArguments: [
      relayFactory.address,
      relayToken.address,
      relayRewarder.address,
    ],
  });
  console.log("RelayDistro Verified");
}

async function verifyRelayFeeFlow() {
  console.log("Starting FeeFlow Verification");
  await hre.run("verify:verify", {
    address: relayFeeFlow.address,
    contract: "contracts/RelayToken/RelayFeeFlowFactory.sol:RelayFeeFlow",
    constructorArguments: [
      AddressZero,
      oneHundred,
      RELAY_REWARD,
      relayDistro.address,
      EPOCH_PERIOD,
      PRICE_MULTIPLIER,
      ten,
    ],
  });
  console.log("RelayFeeFlow Verified");
}

async function main() {
  const [wallet] = await ethers.getSigners();
  console.log("Using wallet: ", wallet.address);

  await getContracts();

  //===================================================================
  // 1. Deploy Relay System
  //===================================================================

  // console.log("Starting Factory Deployment");
  // await deployRelayFactory();
  // await deployRelayTokenFactory();
  // await deployRelayRewarderFactory();
  // await deployRelayDistroFactory();
  // await deployRelayFeeFlowFactory();
  // await deployRelayMulticall();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 2. Verify factory contracts
  //===================================================================

  // console.log("Starting Factory Verification");
  // await verifyRelayFactory();
  // await verifyRelayTokenFactory();
  // await verifyRelayRewarderFactory();
  // await verifyRelayDistroFactory();
  // await verifyRelayFeeFlowFactory();
  // await verifyRelayMulticall();
  // console.log("Factory Contracts Verified");

  //===================================================================
  // 3. Set up System
  //===================================================================

  // console.log("Starting System Set Up");
  // await setUpSystem();
  // console.log("System Set Up");

  //===================================================================
  // 5. Deploy Relay
  //===================================================================

  // console.log("Starting Relay Deployment");
  // await deployRelay();
  // console.log("Relay Deployed");

  //===================================================================
  // 6. Verify Relay Contracts
  //===================================================================

  // console.log("Starting Relay Verification");
  // await verifyRelayToken(wallet.address);
  // await verifyRelayRewarder();
  // await verifyRelayDistro();
  // await verifyRelayFeeFlow();
  // console.log("Relay Contracts Verified");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
