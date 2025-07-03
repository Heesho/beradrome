const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const divDec6 = (amount, decimals = 6) => amount / 10 ** decimals;
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { execPath } = require("process");
const axios = require("axios");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
require("dotenv").config();

const AddressZero = "0x0000000000000000000000000000000000000000";
const one = convert("1", 18);
const two = convert("2", 18);
const five = convert("5", 18);
const ten = convert("10", 18);
const twenty = convert("20", 18);
const ninety = convert("90", 18);
const oneHundred = convert("100", 18);
const twoHundred = convert("200", 18);
const fiveHundred = convert("500", 18);
const eightHundred = convert("800", 18);
const oneThousand = convert("1000", 18);

// Standard ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

function timer(t) {
  return new Promise((r) => setTimeout(r, t));
}

const WBERA_ADDR = "0x6969696969696969696969696969696969696969";
const HONEY_ADDR = "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce";
const WBERA_HONEY_LP_ADDR = "0x4a254b11810b8ebb63c5468e438fc561cb1bb1da";
const WBERA_HONEY_LP_VAULT = "0x45325df4a6a6ebd268f4693474aaaa1f3f0ce8ca";
const WBERA_HONEY_LP_HOLDER = "0x55b93b7F5B75bec5804460cF9EF0269148758BD8";
const IBGT_ADDR = "0xac03CABA51e17c86c921E1f6CBFBdC91F8BB2E6b";

let owner, multisig, treasury, user0, user1, user2;
let vaultFactory;
let VTOKENFactory,
  OTOKENFactory,
  feesFactory,
  rewarderFactory,
  gaugeFactory,
  bribeFactory;
let minter, voter, fees, rewarder, governance;
let swapMulticall, farmMulticall, voterMulticall, auctionMulticall;
let controller, router;
let TOKEN, VTOKEN, OTOKEN, BASE;
let fundFactory, auctionFactory, rewardAuction;
let WBERA, HONEY, IBGT, LP0;
let fund0, gauge0, bribe0, auction0;

describe.only("bera: InfraredFundTest", function () {
  before("Initial set up", async function () {
    console.log("Begin Initialization");

    // Initialize provider
    provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    await provider.ready; // Ensure the provider is connected

    // initialize users
    [owner, multisig, treasury, user0, user1, user2] =
      await ethers.getSigners();

    // initialize ERC20s
    WBERA = new ethers.Contract(WBERA_ADDR, ERC20_ABI, provider);
    HONEY = new ethers.Contract(HONEY_ADDR, ERC20_ABI, provider);
    LP0 = new ethers.Contract(WBERA_HONEY_LP_ADDR, ERC20_ABI, provider);
    IBGT = new ethers.Contract(IBGT_ADDR, ERC20_ABI, provider);
    console.log("- ERC20s Initialized");

    // initialize BASE
    const MockERC20Artifact = await ethers.getContractFactory(
      "contracts/funds/MockFundFactory.sol:MockERC20"
    );
    BASE = await MockERC20Artifact.deploy("BASE", "BASE");
    console.log("- BASE Initialized");

    // initialize VaultFactory
    const VaultFactoryArtifact = await ethers.getContractFactory(
      "BerachainRewardsVaultFactory"
    );
    vaultFactory = await VaultFactoryArtifact.deploy();
    console.log("- VaultFactory Initialized");

    // initialize OTOKENFactory
    const OTOKENFactoryArtifact = await ethers.getContractFactory(
      "OTOKENFactory"
    );
    OTOKENFactory = await OTOKENFactoryArtifact.deploy();
    console.log("- OTOKENFactory Initialized");

    // initialize VTOKENFactory
    const VTOKENFactoryArtifact = await ethers.getContractFactory(
      "VTOKENFactory"
    );
    VTOKENFactory = await VTOKENFactoryArtifact.deploy();
    console.log("- VTOKENFactory Initialized");

    // initialize FeesFactory
    const FeesFactoryArtifact = await ethers.getContractFactory(
      "TOKENFeesFactory"
    );
    feesFactory = await FeesFactoryArtifact.deploy();
    console.log("- FeesFactory Initialized");

    // initialize RewarderFactory
    const RewarderFactoryArtifact = await ethers.getContractFactory(
      "VTOKENRewarderFactory"
    );
    rewarderFactory = await RewarderFactoryArtifact.deploy();
    console.log("- RewarderFactory Initialized");

    // intialize TOKEN
    const TOKENArtifact = await ethers.getContractFactory("TOKEN");
    TOKEN = await TOKENArtifact.deploy(
      BASE.address,
      oneThousand,
      OTOKENFactory.address,
      VTOKENFactory.address,
      rewarderFactory.address,
      feesFactory.address,
      vaultFactory.address
    );
    console.log("- TOKEN Initialized");

    // initialize TOKENFees
    fees = await ethers.getContractAt(
      "contracts/TOKENFeesFactory.sol:TOKENFees",
      await TOKEN.FEES()
    );
    console.log("- TOKENFees Initialized");

    //initialize OTOKEN
    OTOKEN = await ethers.getContractAt(
      "contracts/OTOKENFactory.sol:OTOKEN",
      await TOKEN.OTOKEN()
    );
    console.log("- OTOKEN Initialized");

    //initialize VTOKEN
    VTOKEN = await ethers.getContractAt(
      "contracts/VTOKENFactory.sol:VTOKEN",
      await TOKEN.VTOKEN()
    );
    console.log("- VTOKEN Initialized");

    //initialize VTOKENRewarder
    rewarder = await ethers.getContractAt(
      "contracts/VTOKENRewarderFactory.sol:VTOKENRewarder",
      await VTOKEN.rewarder()
    );
    console.log("- VTOKENRewarder Initialized");

    // initialize GaugeFactory
    const gaugeFactoryArtifact = await ethers.getContractFactory(
      "GaugeFactory"
    );
    const gaugeFactoryContract = await gaugeFactoryArtifact.deploy(
      owner.address
    );
    gaugeFactory = await ethers.getContractAt(
      "GaugeFactory",
      gaugeFactoryContract.address
    );
    console.log("- GaugeFactory Initialized");

    //initialize BribeFactory
    const bribeFactoryArtifact = await ethers.getContractFactory(
      "BribeFactory"
    );
    const bribeFactoryContract = await bribeFactoryArtifact.deploy(
      owner.address
    );
    bribeFactory = await ethers.getContractAt(
      "BribeFactory",
      bribeFactoryContract.address
    );
    console.log("- BribeFactory Initialized");

    // initialize Voter
    const voterArtifact = await ethers.getContractFactory("Voter");
    const voterContract = await voterArtifact.deploy(
      VTOKEN.address,
      gaugeFactory.address,
      bribeFactory.address
    );
    voter = await ethers.getContractAt("Voter", voterContract.address);
    console.log("- Voter Initialized");

    // initialize Minter
    const minterArtifact = await ethers.getContractFactory("Minter");
    const minterContract = await minterArtifact.deploy(
      voter.address,
      TOKEN.address,
      VTOKEN.address,
      OTOKEN.address
    );
    minter = await ethers.getContractAt("Minter", minterContract.address);
    console.log("- Minter Initialized");

    // initialize governanor
    const governanceArtifact = await ethers.getContractFactory("TOKENGovernor");
    const governanceContract = await governanceArtifact.deploy(VTOKEN.address);
    governance = await ethers.getContractAt(
      "TOKENGovernor",
      governanceContract.address
    );
    console.log("- TOKENGovernor Initialized");

    // initialize AuctionFactory
    const AuctionFactoryArtifact = await ethers.getContractFactory(
      "AuctionFactory"
    );
    auctionFactory = await AuctionFactoryArtifact.deploy();
    console.log("- AuctionFactory Initialized");

    // initialize RewardAuction
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
      "Auction",
      await auctionFactory.last_auction()
    );
    console.log("- RewardAuction Initialized");

    // initialize SwapMulticall
    const swapMulticallArtifact = await ethers.getContractFactory(
      "SwapMulticall"
    );
    const swapMulticallContract = await swapMulticallArtifact.deploy(
      voter.address,
      BASE.address,
      TOKEN.address,
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address
    );
    swapMulticall = await ethers.getContractAt(
      "SwapMulticall",
      swapMulticallContract.address
    );
    console.log("- SwapMulticall Initialized");

    // initialize FarmMulticall
    const farmMulticallArtifact = await ethers.getContractFactory(
      "FarmMulticall"
    );
    const farmMulticallContract = await farmMulticallArtifact.deploy(
      voter.address,
      TOKEN.address
    );
    farmMulticall = await ethers.getContractAt(
      "FarmMulticall",
      farmMulticallContract.address
    );
    console.log("- FarmMulticall Initialized");

    // initialize VoterMulticall
    const voterMulticallArtifact = await ethers.getContractFactory(
      "VoterMulticall"
    );
    const voterMulticallContract = await voterMulticallArtifact.deploy(
      voter.address
    );
    voterMulticall = await ethers.getContractAt(
      "VoterMulticall",
      voterMulticallContract.address
    );
    console.log("- VoterMulticall Initialized");

    // initialize AuctionMulticall
    const auctionMulticallArtifact = await ethers.getContractFactory(
      "AuctionMulticall"
    );
    const auctionMulticallContract = await auctionMulticallArtifact.deploy(
      voter.address,
      TOKEN.address,
      OTOKEN.address,
      rewardAuction.address
    );
    auctionMulticall = await ethers.getContractAt(
      "AuctionMulticall",
      auctionMulticallContract.address
    );
    console.log("- AuctionMulticall Initialized");

    // initialize Controller
    const controllerArtifact = await ethers.getContractFactory("Controller");
    controller = await controllerArtifact.deploy(voter.address, fees.address);
    console.log("- Controller Initialized");

    // initialize Router
    const routerArtifact = await ethers.getContractFactory("Router");
    router = await routerArtifact.deploy(
      controller.address,
      voter.address,
      TOKEN.address,
      OTOKEN.address,
      rewardAuction.address
    );
    console.log("- Router Initialized");

    // System set-up
    await gaugeFactory.setVoter(voter.address);
    await bribeFactory.setVoter(voter.address);
    await VTOKEN.connect(owner).addReward(TOKEN.address);
    await VTOKEN.connect(owner).addReward(OTOKEN.address);
    await VTOKEN.connect(owner).addReward(BASE.address);
    await VTOKEN.connect(owner).setVoter(voter.address);
    await OTOKEN.connect(owner).setMinter(minter.address);
    await voter.initialize(minter.address);
    await minter.initialize();
    console.log("- System set up");

    // initialize FundFactory
    const FundFactoryArtifact = await ethers.getContractFactory(
      "InfraredFundFactory"
    );
    fundFactory = await FundFactoryArtifact.deploy(
      multisig.address,
      rewardAuction.address,
      auctionFactory.address
    );
    console.log("- FundFactory Initialized");

    // initialize Fund
    await fundFactory.createFund(
      "Fund0",
      voter.address,
      LP0.address,
      WBERA_HONEY_LP_VAULT,
      oneHundred,
      24 * 3600,
      two,
      ten
    );
    fund0 = await ethers.getContractAt(
      "InfraredFund",
      await fundFactory.lastFund()
    );
    console.log("- Fund Initialized");

    auction0 = await ethers.getContractAt(
      "Auction",
      await fund0.getAssetAuction()
    );
    console.log("- Auction Initialized");

    // set fund0 isFund = true
    await controller.connect(owner).setIsFund(fund0.address, true);

    console.log("Initialization Complete");
    console.log();
  });

  it("Set Auction Split to 40%", async function () {
    console.log("******************************************************");
    await auctionFactory.connect(owner).setSplit(4000);
  });

  it("first test", async function () {
    console.log("******************************************************");
    console.log(
      "Balance of LP0 holder",
      await LP0.balanceOf(WBERA_HONEY_LP_HOLDER)
    );
  });

  it("Impersonate LP0 holder and send to user0", async function () {
    console.log("******************************************************");
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [WBERA_HONEY_LP_HOLDER],
    });
    const signer = ethers.provider.getSigner(WBERA_HONEY_LP_HOLDER);

    await LP0.connect(signer).transfer(
      user0.address,
      await LP0.connect(owner).balanceOf(WBERA_HONEY_LP_HOLDER)
    );

    console.log(
      "Holder LP0 balance: ",
      divDec(await LP0.connect(owner).balanceOf(WBERA_HONEY_LP_HOLDER))
    );
    console.log(
      "User0 LP0 balance: ",
      divDec(await LP0.connect(owner).balanceOf(user0.address))
    );
  });
});
