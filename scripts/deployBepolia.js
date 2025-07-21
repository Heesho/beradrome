const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const one = convert("1", 18);
const two = convert("2", 18);
const ten = convert("10", 18);
const oneHundred = convert("100", 18);
const oneHundredThousand = convert("100000", 18);
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

const WBERA_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
];

const MARKET_RESERVES = "5000000"; // 5,000,000 TOKEN in market reserves

const BASE_ADDRESS = "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce"; // HONEY address
const MULTISIG = "0x039ec2E90454892fCbA461Ecf8878D0C45FDdFeE"; // Multisig Address
const VAULT_FACTORY = "0x94Ad6Ac84f6C6FbA8b8CCbD71d9f4f101def52a8"; // Vault Factory Address

const HONEY = "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce";
const WBERA = "0x6969696969696969696969696969696969696969";

// Plugins
const BULLAS_PLUGIN = "0xe2719e4C3AC97890b2AF3783A3B892c3a6FF041C";
const BULLAS_PLUGIN_V2 = "0x436B9a684b6f26B34E9c353De05A0454b7996900";
const BULLAS_PLUGIN_V3 = "0x37bDB41e497C5b93C9D0652B52cF9979B1c8751e";
const BENTO_PLUGIN = "0xEfbcFD2666ea6f7Ebd87bF1166722d4f37dE5EF1";
const BENTO_PLUGIN_V2 = "0xEc76C06258D32890F492c6575708D12d0AF3B9c9";
const BENTO_PLUGIN_V3 = "0xa4Fcf5232Ad35c99449244427E308e6cf48FFf3D";
const BENTO_PLUGIN_V4 = "0x24f2b8BEb1F4D93Ea9599dd7E1e7Ca0B4Af6AF5D";
const BENTO_PLUGIN_V5 = "0x56C66F0ba4577182ED6217E1ac86B81C0BA47B35";
const BTT_PLUGIN = "0xeaB1A53350041eC038718e9b855d15FF471Ce172";
const BTT_PLUGIN_V2 = "0xd1F6920fF0bAaf628a0640B75F6506BCE3F66Ae2";
const CUB_PLUGIN = "0xC24435938b08a34e3913Abbf3C3cfE51802383a9";
const CUB_PLUGIN_V2 = "0x36357C56644F760781647F1AC6CaEE3734A162d1";

// Contract Variables
let provider, wbera;
let OTOKENFactory, VTOKENFactory, feesFactory, rewarderFactory;
let TOKEN, OTOKEN, VTOKEN, fees, rewarder;
let voter, minter, gaugeFactory, bribeFactory;
let swapMulticall, farmMulticall, voterMulticall, auctionMulticall;
let controller, router;
let auctionFactory, rewardAuction;
let fundFactory;
let asset0, reward0, fund0, auction0;
let asset1, reward1, fund1, auction1;

async function getContracts() {
  provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  wbera = new ethers.Contract(WBERA, WBERA_ABI, provider);
  OTOKENFactory = await ethers.getContractAt(
    "contracts/OTOKENFactory.sol:OTOKENFactory",
    "0x9C751E6825EDAa55007160b99933846f6ECeEc9B"
  );
  VTOKENFactory = await ethers.getContractAt(
    "contracts/VTOKENFactory.sol:VTOKENFactory",
    "0xa80Dd07aA0b220a31569Bd50E1398BCE8d35B85C"
  );
  feesFactory = await ethers.getContractAt(
    "contracts/TOKENFeesFactory.sol:TOKENFeesFactory",
    "0xD99bcEFe3fa1e84F44354F04B1C4c0403fd315cd"
  );
  rewarderFactory = await ethers.getContractAt(
    "contracts/VTOKENRewarderFactory.sol:VTOKENRewarderFactory",
    "0x46f8fb6ca3471a230D5aD8f5dDbF691fE43870e0"
  );

  TOKEN = await ethers.getContractAt(
    "contracts/TOKEN.sol:TOKEN",
    "0xA8Bfa9485B3253144e33892128C7A4eFef297FD6"
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

  gaugeFactory = await ethers.getContractAt(
    "contracts/GaugeFactory.sol:GaugeFactory",
    "0xC6966Cf3aEFA8668A1010f000a611770061bec48"
  );
  bribeFactory = await ethers.getContractAt(
    "contracts/BribeFactory.sol:BribeFactory",
    "0x1d3969836767A75b09E15F8588b58624b7df4044"
  );
  voter = await ethers.getContractAt(
    "contracts/Voter.sol:Voter",
    "0x54cCcf999B5bd3Ea12c52810fA60BB0eB41d109c"
  );
  minter = await ethers.getContractAt(
    "contracts/Minter.sol:Minter",
    "0x6A6A9AEeF062ce48Ec115182820415aC086FE139"
  );

  auctionFactory = await ethers.getContractAt(
    "contracts/AuctionFactory.sol:AuctionFactory",
    "0xBAb961cBEAdC65eb3B2158fE09EdC2553131A115"
  );
  rewardAuction = await ethers.getContractAt(
    "contracts/AuctionFactory.sol:Auction",
    "0x06CB13f412228A46dE72f0E918B12B5A31512025"
  );

  controller = await ethers.getContractAt(
    "contracts/Controller.sol:Controller",
    "0x8d6F9Cb274Cf0E27540e44F62427a61bD8EF6eD3"
  );
  router = await ethers.getContractAt(
    "contracts/Router.sol:Router",
    "0x6ab80fBD2C92DdDf85499DCF5dBEfeE34Df055dC"
  );

  swapMulticall = await ethers.getContractAt(
    "contracts/multicalls/SwapMulticall.sol:SwapMulticall",
    "0x85441fA528c781658B296c9e5654557bd83023ED"
  );
  farmMulticall = await ethers.getContractAt(
    "contracts/multicalls/FarmMulticall.sol:FarmMulticall",
    "0x63956a77d4507c43e8fb80d104d6d5a2dE734d26"
  );
  voterMulticall = await ethers.getContractAt(
    "contracts/multicalls/VoterMulticall.sol:VoterMulticall",
    "0x8D8da7A2fF7cbb1Dd96C77A9e0E11bbd429c8B84"
  );
  auctionMulticall = await ethers.getContractAt(
    "contracts/multicalls/AuctionMulticall.sol:AuctionMulticall",
    "0x6Bf84aaAD7aE76b6d17E2b7C79b58A831fE427A6"
  );

  asset0 = await ethers.getContractAt(
    "contracts/funds/MockFundFactory.sol:MockERC20",
    "0x5120123fD6b7FF18512a907fb704C5065743CcDa"
  );
  asset1 = await ethers.getContractAt(
    "contracts/funds/MockFundFactory.sol:MockERC20",
    "0xD9D1c695bc030C2A3Ba958fE3D96f45f5F06E4a3"
  );

  reward0 = await ethers.getContractAt(
    "contracts/funds/MockFundFactory.sol:MockERC20",
    "0x9dCeBcD336390BEC47C9806Ca44379d890468C64"
  );
  reward1 = await ethers.getContractAt(
    "contracts/funds/MockFundFactory.sol:MockERC20",
    "0x614C63de3909038D74afAF831D11440eD41602b1"
  );

  fundFactory = await ethers.getContractAt(
    "contracts/funds/MockFundFactory.sol:MockFundFactory",
    "0x26181F231fe2E8253Ffd7f8E303e71752923bc9c"
  );

  fund0 = await ethers.getContractAt(
    "contracts/funds/MockFundFactory.sol:MockFund",
    "0x75AAecD95AcC6bc9178F227a100cF01EA1C8389B"
  );
  fund1 = await ethers.getContractAt(
    "contracts/funds/MockFundFactory.sol:MockFund",
    "0x90F6E9e63e3685b45fB961270Cf79d4EC8775435"
  );

  console.log("Contracts Retrieved");
}

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
    VAULT_FACTORY,
    {
      gasPrice: ethers.gasPrice,
    }
  );
  TOKEN = await TOKENContract.deployed();
  await sleep(5000);
  console.log("TOKEN Deployed at:", TOKEN.address);
}

async function printTokenAddresses() {
  console.log("**************************************************************");
  console.log("BERO: ", TOKEN.address);
  console.log("oBERO: ", OTOKEN.address);
  console.log("hiBERO: ", VTOKEN.address);
  console.log("Fees: ", fees.address);
  console.log("Rewarder: ", rewarder.address);
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
      VAULT_FACTORY,
    ],
  });
  console.log("TOKEN Verified");
}

async function verifyOTOKEN(wallet) {
  console.log("Starting OTOKEN Verification");
  await hre.run("verify:verify", {
    address: OTOKEN.address,
    contract: "contracts/OTOKENFactory.sol:OTOKEN",
    constructorArguments: [wallet.address],
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
      VAULT_FACTORY,
    ],
  });
  console.log("VTOKEN Verified");
}

async function verifyFees() {
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

async function deployAuctionFactory() {
  console.log("Starting AuctionFactory Deployment");
  const auctionFactoryArtifact = await ethers.getContractFactory(
    "AuctionFactory"
  );
  const auctionFactoryContract = await auctionFactoryArtifact.deploy({
    gasPrice: ethers.gasPrice,
  });
  auctionFactory = await auctionFactoryContract.deployed();
  await sleep(5000);
  console.log("AuctionFactory Deployed at:", auctionFactory.address);
}

async function verifyAuctionFactory() {
  console.log("Starting AuctionFactory Verification");
  await hre.run("verify:verify", {
    address: auctionFactory.address,
    contract: "contracts/AuctionFactory.sol:AuctionFactory",
  });
  console.log("AuctionFactory Verified");
}

async function deployRewardAuction() {
  console.log("Starting RewardAuction Deployment");
  await auctionFactory.createAuction(
    oneHundred,
    false,
    TOKEN.address,
    fees.address,
    24 * 3600,
    two,
    ten
  );
  rewardAuction = await ethers.getContractAt(
    "contracts/AuctionFactory.sol:Auction",
    await auctionFactory.last_auction()
  );
  console.log("RewardAuction Deployed at:", rewardAuction.address);
}

async function verifyRewardAuction() {
  console.log("Starting RewardAuction Verification");
  await hre.run("verify:verify", {
    address: rewardAuction.address,
    contract: "contracts/AuctionFactory.sol:Auction",
    constructorArguments: [
      oneHundred,
      false,
      TOKEN.address,
      fees.address,
      ADDRESS_ZERO,
      24 * 3600,
      two,
      ten,
    ],
  });
  console.log("RewardAuction Verified");
}

async function printAuctionAddresses() {
  console.log("**************************************************************");
  console.log("AuctionFactory: ", auctionFactory.address);
  console.log("RewardAuction: ", rewardAuction.address);
  console.log("**************************************************************");
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

async function verifyController() {
  console.log("Starting Controller Verification");
  await hre.run("verify:verify", {
    address: controller.address,
    contract: "contracts/Controller.sol:Controller",
    constructorArguments: [voter.address, fees.address],
  });
  console.log("Controller Verified");
}

async function deployRouter() {
  console.log("Starting Router Deployment");
  const routerArtifact = await ethers.getContractFactory("Router");
  const routerContract = await routerArtifact.deploy(
    controller.address,
    voter.address,
    TOKEN.address,
    OTOKEN.address,
    rewardAuction.address,
    { gasPrice: ethers.gasPrice }
  );
  router = await routerContract.deployed();
  await sleep(5000);
  console.log("Router Deployed at:", router.address);
}

async function verifyRouter() {
  console.log("Starting Router Verification");
  await hre.run("verify:verify", {
    address: router.address,
    contract: "contracts/Router.sol:Router",
    constructorArguments: [
      controller.address,
      voter.address,
      TOKEN.address,
      OTOKEN.address,
      rewardAuction.address,
    ],
  });
  console.log("Router Verified");
}

async function printAncillaryAddresses() {
  console.log("**************************************************************");
  console.log("Controller: ", controller.address);
  console.log("Router: ", router.address);
  console.log("**************************************************************");
}

async function deploySwapMulticall() {
  console.log("Starting SwapMulticall Deployment");
  const swapMulticallArtifact = await ethers.getContractFactory(
    "SwapMulticall"
  );
  const swapMulticallContract = await swapMulticallArtifact.deploy(
    voter.address,
    BASE_ADDRESS,
    TOKEN.address,
    OTOKEN.address,
    VTOKEN.address,
    rewarder.address,
    controller.address,
    { gasPrice: ethers.gasPrice }
  );
  swapMulticall = await swapMulticallContract.deployed();
  await sleep(5000);
  console.log("SwapMulticall Deployed at:", swapMulticall.address);
}

async function verifySwapMulticall() {
  console.log("Starting SwapMulticall Verification");
  await hre.run("verify:verify", {
    address: swapMulticall.address,
    contract: "contracts/multicalls/SwapMulticall.sol:SwapMulticall",
    constructorArguments: [
      voter.address,
      BASE_ADDRESS,
      TOKEN.address,
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address,
      controller.address,
    ],
  });
  console.log("SwapMulticall Verified");
}

async function deployFarmMulticall() {
  console.log("Starting FarmMulticall Deployment");
  const farmMulticallArtifact = await ethers.getContractFactory(
    "FarmMulticall"
  );
  const farmMulticallContract = await farmMulticallArtifact.deploy(
    voter.address,
    TOKEN.address,
    controller.address,
    { gasPrice: ethers.gasPrice }
  );
  farmMulticall = await farmMulticallContract.deployed();
  await sleep(5000);
  console.log("FarmMulticall Deployed at:", farmMulticall.address);
}

async function verifyFarmMulticall() {
  console.log("Starting FarmMulticall Verification");
  await hre.run("verify:verify", {
    address: farmMulticall.address,
    contract: "contracts/multicalls/FarmMulticall.sol:FarmMulticall",
    constructorArguments: [voter.address, TOKEN.address, controller.address],
  });
  console.log("FarmMulticall Verified");
}

async function deployVoterMulticall() {
  console.log("Starting VoterMulticall Deployment");
  const voterMulticallArtifact = await ethers.getContractFactory(
    "VoterMulticall"
  );
  const voterMulticallContract = await voterMulticallArtifact.deploy(
    voter.address,
    { gasPrice: ethers.gasPrice }
  );
  voterMulticall = await voterMulticallContract.deployed();
  await sleep(5000);
  console.log("VoterMulticall Deployed at:", voterMulticall.address);
}

async function verifyVoterMulticall() {
  console.log("Starting VoterMulticall Verification");
  await hre.run("verify:verify", {
    address: voterMulticall.address,
    contract: "contracts/multicalls/VoterMulticall.sol:VoterMulticall",
    constructorArguments: [voter.address],
  });
  console.log("VoterMulticall Verified");
}
async function deployAuctionMulticall() {
  console.log("Starting AuctionMulticall Deployment");
  const auctionMulticallArtifact = await ethers.getContractFactory(
    "contracts/multicalls/AuctionMulticall.sol:AuctionMulticall"
  );
  const auctionMulticallContract = await auctionMulticallArtifact.deploy(
    voter.address,
    TOKEN.address,
    OTOKEN.address,
    rewardAuction.address,
    controller.address,
    { gasPrice: ethers.gasPrice }
  );
  auctionMulticall = await auctionMulticallContract.deployed();
  await sleep(5000);
  console.log("AuctionMulticall Deployed at:", auctionMulticall.address);
}

async function verifyAuctionMulticall() {
  console.log("Starting AuctionMulticall Verification");
  await hre.run("verify:verify", {
    address: auctionMulticall.address,
    contract: "contracts/multicalls/AuctionMulticall.sol:AuctionMulticall",
    constructorArguments: [
      voter.address,
      TOKEN.address,
      OTOKEN.address,
      rewardAuction.address,
      controller.address,
    ],
  });
  console.log("AuctionMulticall Verified");
}

async function printMulticallAddresses() {
  console.log("**************************************************************");
  console.log("SwapMulticall: ", swapMulticall.address);
  console.log("FarmMulticall: ", farmMulticall.address);
  console.log("VoterMulticall: ", voterMulticall.address);
  console.log("AuctionMulticall: ", auctionMulticall.address);
  console.log("**************************************************************");
}

async function setUpSystem(wallet) {
  console.log("Starting System Set Up");

  //   await OTOKEN.approve(VTOKEN.address, convert("200000", 18));
  //   await VTOKEN.burnFor(MULTISIG, convert("200000", 18));
  //   console.log("OTOKEN burned for builder");

  // amount = await OTOKEN.balanceOf(wallet);
  // await OTOKEN.transfer(MULTISIG, amount);
  // console.log("OTOKEN Allocated");

  //   await sleep(5000);
  //   await gaugeFactory.setVoter(voter.address);
  //   await sleep(5000);
  //   await bribeFactory.setVoter(voter.address);
  //   await sleep(5000);
  //   console.log("Factories Set Up");

  //   await VTOKEN.addReward(TOKEN.address);
  //   await sleep(5000);
  //   await VTOKEN.addReward(OTOKEN.address);
  //   await sleep(5000);
  //   await VTOKEN.addReward(BASE_ADDRESS);
  //   await sleep(5000);
  //   console.log("VTOKEN Rewards Set Up");

  //   await VTOKEN.setVoter(voter.address);
  //   await sleep(5000);
  //   console.log("Token-Voting Set Up");
  //   await OTOKEN.setMinter(minter.address);
  //   await sleep(5000);
  //   console.log("Token-Voting Set Up");

  //   await voter.initialize(minter.address);
  //   await sleep(5000);
  //   await minter.initialize();
  //   await sleep(5000);
  //   console.log("Minter Set Up");

  await auctionFactory.setSplit(4000);
  console.log("Auction Factory split set to 4000");

  console.log("System Initialized");
}

async function transferOwnership() {
  await minter.setTeam(MULTISIG);
  await sleep(5000);
  console.log("Minter team set to MULTISIG");

  await minter.transferOwnership(MULTISIG);
  //   await minter.transferOwnership(governor.address);
  await sleep(5000);
  console.log("Minter ownership transferred to governor");

  await voter.transferOwnership(MULTISIG);
  //   await voter.transferOwnership(governor.address);
  await sleep(5000);
  console.log("Voter ownership transferred to governor");

  await VTOKEN.transferOwnership(MULTISIG);
  //   await VTOKEN.transferOwnership(governor.address);
  await sleep(5000);
  console.log("VTOKEN ownership transferred to governor");
}

async function verifyGauge(pluginAddress, gaugeAddress) {
  console.log("Starting Gauge Verification");
  await hre.run("verify:verify", {
    address: gaugeAddress,
    contract: "contracts/GaugeFactory.sol:Gauge",
    constructorArguments: [voter.address, pluginAddress],
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

async function deployFundFactory() {
  console.log("Starting Fund Factory Deployment");
  const fundFactoryArtifact = await ethers.getContractFactory(
    "MockFundFactory"
  );
  const fundFactoryContract = await fundFactoryArtifact.deploy(
    MULTISIG,
    rewardAuction.address,
    auctionFactory.address,
    { gasPrice: ethers.gasPrice }
  );
  fundFactory = await fundFactoryContract.deployed();
  await sleep(5000);
  console.log("Fund Factory Deployed at:", fundFactory.address);
}

async function verifyFundFactory() {
  console.log("Starting Fund Factory Verification");
  await hre.run("verify:verify", {
    address: fundFactory.address,
    contract: "contracts/funds/MockFundFactory.sol:MockFundFactory",
    constructorArguments: [
      MULTISIG,
      rewardAuction.address,
      auctionFactory.address,
    ],
  });
  console.log("Fund Factory Verified");
}

async function deployFund() {
  console.log("Starting Fund Deployment");
  await fundFactory.createFund(
    "Protocol1",
    "Fund1",
    voter.address,
    asset1.address,
    [reward1.address],
    oneHundred,
    24 * 3600,
    two,
    ten
  );
  await sleep(5000);
  console.log("Fund Deployed at:", await fundFactory.lastFund());
}

async function verifyFund() {
  console.log("Starting Fund Verification");
  await hre.run("verify:verify", {
    address: await fundFactory.lastFund(),
    contract: "contracts/funds/MockFundFactory.sol:MockFund",
    constructorArguments: [
      "Protocol0",
      "Fund0",
      voter.address,
      asset0.address,
      [reward0.address],
    ],
  });
  console.log("Fund Verified");
}

async function main() {
  const [wallet] = await ethers.getSigners();
  console.log("Using wallet: ", wallet.address);

  await getContracts();

  //===================================================================
  // Deploy Token Factories
  //===================================================================

  //   console.log("Starting Factory Deployment");
  //   await deployOTOKENFactory();
  //   await deployVTOKENFactory();
  //   await deployFeesFactory();
  //   await deployRewarderFactory();
  //   await printFactoryAddresses();

  //===================================================================
  // Deploy Token
  //===================================================================

  //   console.log("Starting Token Deployment");
  //   await deployTOKEN();
  //   await printTokenAddresses();

  //===================================================================
  // Verify Token
  //===================================================================

  // console.log("Starting Token Verification");
  // await verifyTOKEN();
  // await verifyOTOKEN(wallet);
  // await verifyVTOKEN();
  // await verifyFees();
  // await verifyRewarder();
  // console.log("Token Verified");

  //===================================================================
  // Deploy Voting System
  //===================================================================

  //   console.log("Starting Voting Deployment");
  //   await deployGaugeFactory(wallet.address);
  //   await deployBribeFactory(wallet.address);
  //   await deployVoter();
  //   await deployMinter();
  //   await printVotingAddresses();

  //===================================================================
  // Verify Voting Contracts
  //===================================================================

  // console.log("Starting Voting Verification");
  // await verifyGaugeFactory(wallet.address);
  // await verifyBribeFactory(wallet.address);
  // await verifyVoter();
  // await verifyMinter();
  // console.log("Voting Contracts Verified");

  //===================================================================
  // Deploy Auction Factory
  //===================================================================

  // console.log("Starting Auction Factory Deployment");
  // await deployAuctionFactory();
  // await deployRewardAuction();
  // await printAuctionAddresses();

  //===================================================================
  // Verify Auction Factory
  //===================================================================

  // console.log("Starting Auction Factory Verification");
  // await verifyAuctionFactory();
  // await verifyRewardAuction();
  // console.log("Auction Factory Verified");

  //===================================================================
  // Deploy Ancillary Contracts
  //===================================================================

  // console.log("Starting Ancillary Deployment");
  // await deployController();
  // await deployRouter();
  // await printAncillaryAddresses();

  //===================================================================
  // Verify Ancillary Contracts
  //===================================================================

  // console.log("Starting Ancillary Verification");
  // await verifyController();
  // await verifyRouter();
  // console.log("Ancillary Contracts Verified");

  //===================================================================
  // Deploy Multicall Contracts
  //===================================================================

  // console.log("Starting Multicall Deployment");
  // await deploySwapMulticall();
  // await deployFarmMulticall();
  // await deployVoterMulticall();
  // await deployAuctionMulticall();
  // await printMulticallAddresses();

  //===================================================================
  // Verify Multicall Contracts
  //===================================================================

  // console.log("Starting Ancillary Verification");
  // await verifySwapMulticall();
  // await verifyFarmMulticall();
  // await verifyVoterMulticall();
  // await verifyAuctionMulticall();
  // console.log("Multicall Contracts Verified");

  //===================================================================
  // Set Up System
  //===================================================================

  // console.log("Starting System Set Up");
  // await setUpSystem(wallet.address);
  // console.log("System Set Up");

  //===================================================================
  // Deploy Tokens
  //===================================================================

  // const MockERC20Artifact = await ethers.getContractFactory(
  //   "contracts/funds/MockFundFactory.sol:MockERC20"
  // );
  // asset0 = await MockERC20Artifact.deploy("ASSET0", "ASSET0");
  // await sleep(5000);
  // console.log("- ASSET0 Initialized at ", asset0.address);
  // asset1 = await MockERC20Artifact.deploy("ASSET1", "ASSET1");
  // await sleep(5000);
  // console.log("- ASSET1 Initialized at ", asset1.address);
  // reward0 = await MockERC20Artifact.deploy("REWARD0", "REWARD0");
  // await sleep(5000);
  // console.log("- REWARD0 Initialized at ", reward0.address);
  // reward1 = await MockERC20Artifact.deploy("REWARD1", "REWARD1");
  // await sleep(5000);
  // console.log("- REWARD1 Initialized at ", reward1.address);

  // verify tokens
  // console.log("Starting Token Verification");
  // await hre.run("verify:verify", {
  //   address: asset0.address,
  //   contract: "contracts/funds/MockFundFactory.sol:MockERC20",
  //   constructorArguments: ["ASSET0", "ASSET0"],
  // });
  // console.log("Token Verified");

  //===================================================================
  // Deploy Fund Factory
  //===================================================================

  // console.log("Starting Fund Factory Deployment");
  // await deployFundFactory();
  // await verifyFundFactory();
  // console.log("Fund Factory Verified");

  //===================================================================
  // Deploy Fund
  //===================================================================

  // console.log("Starting Fund Deployment");
  // await deployFund();
  // await verifyFund();
  // console.log("Fund Verified");

  //===================================================================
  // Transfer Ownership
  //===================================================================

  // console.log("Starting Ownership Transfer");
  // await transferOwnership();
  // console.log("Ownership Transferred");

  //===================================================================
  // Add Plugin
  //===================================================================

  // await voter.connect(wallet).addPlugin(BULLAS_PLUGIN);
  // await voter.connect(wallet).addPlugin(BENTO_PLUGIN);
  // await voter.connect(wallet).addPlugin(BENTO_PLUGIN_V2);
  // await voter.connect(wallet).addPlugin(BULLAS_PLUGIN_V2);
  // await voter.connect(wallet).addPlugin(BTT_PLUGIN);
  // await voter.connect(wallet).addPlugin(BTT_PLUGIN_V2);
  // await voter.connect(wallet).addPlugin(CUB_PLUGIN);
  // await voter.connect(wallet).addPlugin(CUB_PLUGIN_V2);
  // await voter.connect(wallet).addPlugin(BULLAS_PLUGIN_V3);
  // await voter.connect(wallet).addPlugin(BENTO_PLUGIN_V3);
  // await voter.connect(wallet).addPlugin(BENTO_PLUGIN_V4);
  // await voter.connect(wallet).addPlugin(BENTO_PLUGIN_V5);
  // await voter.connect(wallet).addPlugin(fund0.address);
  // await voter.connect(wallet).addPlugin(fund1.address);
  // console.log("Plugin added");

  //===================================================================
  // Initialize Funds
  //===================================================================

  // await fund0.connect(wallet).initialize();
  // await fund1.connect(wallet).initialize();
  // console.log("Funds Initialized");

  //===================================================================
  // Set isFund on controller
  //===================================================================

  // await controller.connect(wallet).setPluginIsFund(fund0.address, true);
  // await controller.connect(wallet).setPluginIsFund(fund1.address, true);
  // console.log("Funds set as isFund");

  //===================================================================
  // Add Gauge Rewards
  //===================================================================

  // await voter.connect(wallet).addGaugeReward(
  //   await voter.gauges(TRIFECTA_PLUGIN_0),
  //   KDK // KDK
  // ); // KDK added to Trifecta YEET-WBERA Island Gauge
  // console.log("- KDK added as gauge reward");

  // await voter.connect(wallet).addGaugeReward(
  //   await voter.gauges(TRIFECTA_PLUGIN_0),
  //   XKDK // xKDK
  // ); // xKDK added to Trifecta YEET-WBERA Island Gauge
  // console.log("- xKDK added as gauge rewards");

  //===================================================================
  // Print Deployment
  //===================================================================

  // console.log("Beradrome Bepolia Deployment");
  // console.log();
  // printTokenAddresses();
  // console.log();
  // printVotingAddresses();
  // console.log();
  // printAncillaryAddresses();
  // console.log();
  // printMulticallAddresses();

  //===================================================================
  // Print Plugins
  //===================================================================

  // let plugins = [
  // BULLAS_PLUGIN,
  // BENTO_PLUGIN,
  // BENTO_PLUGIN_V2,
  // BULLAS_PLUGIN_V2,
  // BTT_PLUGIN,
  // BTT_PLUGIN_V2,
  // CUB_PLUGIN,
  // CUB_PLUGIN_V2,
  // BULLAS_PLUGIN_V3,
  // BENTO_PLUGIN_V3,
  // BENTO_PLUGIN_V4,
  // BENTO_PLUGIN_V5,
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

  // await verifyGauge(
  //   "0xc24435938b08a34e3913abbf3c3cfe51802383a9",
  //   "0x4E60297f2A5109E03d4C0Ed0C66E61Fc0fC1875D"
  // );

  // await verifyBribe("0xf909fc1dB5C67e3B2c6a6413848cf1e2923A50A7");

  //===================================================================
  // Vote on Plugins
  //===================================================================

  // await voter
  //   .connect(wallet)
  //   .vote([BENTO_PLUGIN_V5, fund0.address, fund1.address], [1, 1, 1]);
  // await voter
  //   .connect(wallet)
  //   .claimBribes(["0xf00ef45a47c1bb814d9a86ed781cff86b27d0024"]);

  //===================================================================
  // Distro
  //===================================================================

  // await wbera.connect(wallet).withdraw(ten);

  // console.log("Distributing Rewards");

  // await controller.connect(wallet).distribute();

  // await voter.distro();
  // console.log("Gauge Rewards Distributed");

  // await fees.distribute();
  // console.log("Fees Rewards Distributed");

  // await voter.distributeToBribes([BULLAS_PLUGIN_V2]);
  // console.log("Game Bribe Rewards Distributed");

  // await voter.distributeToBribes([BENTO_PLUGIN_V2]);
  // console.log("Bento Bribe Rewards Distributed");

  // await voter.distributeToBribes([BTT_PLUGIN_V2]);
  // console.log("BTT Bribe Rewards Distributed");

  // await voter.distributeToBribes([CUB_PLUGIN_V2]);
  // console.log("CUB Bribe Rewards Distributed");

  //===================================================================
  // Remove Plugin
  //===================================================================

  // console.log("Removing Plugin from Voter"); // Remove BULL ISH plugin
  // await voter
  //   .connect(wallet)
  //   .killGauge("0x1a173326c5859CF5A67f6aEB83a9954EfCdBeC3d");
  // console.log("Plugin removed from Voter");

  //===================================================================
  // Add Bribe Rewards
  //===================================================================

  //   await voter
  //     .connect(wallet)
  //     .addBribeReward("0x91316cde390F239CbE039Ab39CbBfED0B86e6742", YEET);
  //   console.log("YEET added as bribe reward");

  // let data = await multicall.bondingCurveData(
  //   "0x34D023ACa5A227789B45A62D377b5B18A680BE01"
  // );
  // console.log(data);

  // let data = await multicall
  //   .connect(wallet)
  //   .gaugeCardData(BULLAS_PLUGIN_V2, wallet.address);
  // console.log(data);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
