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
const pointZeroOne = convert("0.01", 18);
const one = convert("1", 18);
const one6 = convert("1", 6);
const two = convert("2", 18);
const five = convert("5", 18);
const ten = convert("10", 18);
const ten6 = convert("10", 6);
const twenty = convert("20", 18);
const thirty = convert("30", 18);
const fifty = convert("50", 18);
const ninety = convert("90", 18);
const oneHundred = convert("100", 18);
const twoHundred = convert("200", 18);
const fiveHundred = convert("500", 18);
const eightHundred = convert("800", 18);
const oneThousand = convert("1000", 18);
const oneThousand6 = convert("1000", 6);
const fourThousand = convert("4000", 18);
const fourThousand6 = convert("4000", 6);
const fiveThousand = convert("5000", 18);
const fiveThousand6 = convert("5000", 6);
const tenThousand6 = convert("10000", 6);
const oneHundred6 = convert("100", 6);

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

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function timer(t) {
  return new Promise((r) => setTimeout(r, t));
}

const WBERA_ADDR = "0x7507c1dc16935B82698e4C63f2746A2fCf994dF8";

let owner, multisig, treasury, user0, user1, user2;
let VTOKENFactory,
  OTOKENFactory,
  feesFactory,
  rewarderFactory,
  gaugeFactory,
  bribeFactory;
let minter, voter, fees, rewarder, governance, multicall, pluginFactory;
let TOKEN, VTOKEN, OTOKEN, BASE;
let WBERA;
let plugin, gauge0, bribe0;

describe.only("berachain: bento bera testing", function () {
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
    console.log("- ERC20s Initialized");

    // initialize ERC20Mocks
    const ERC20MockArtifact = await ethers.getContractFactory("ERC20Mock");
    BASE = await ERC20MockArtifact.deploy("BASE", "BASE");
    console.log("- ERC20Mocks Initialized");

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
      feesFactory.address
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

    // initialize Multicall
    const multicallArtifact = await ethers.getContractFactory("Multicall");
    const multicallContract = await multicallArtifact.deploy(
      voter.address,
      BASE.address,
      TOKEN.address,
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address
    );
    multicall = await ethers.getContractAt(
      "Multicall",
      multicallContract.address
    );
    console.log("- Multicall Initialized");

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

    // initialize Plugin Factory
    const pluginArtifact = await ethers.getContractFactory("BentoPlugin");
    const pluginContract = await pluginArtifact.deploy(
      WBERA_ADDR,
      voter.address,
      [WBERA_ADDR],
      [WBERA_ADDR],
      treasury.address
    );
    plugin = await ethers.getContractAt("BentoPlugin", pluginContract.address);
    console.log("- Bento Plugin Initialized");

    // add Plugin to Voter
    await voter.addPlugin(plugin.address);
    let Gauge0Address = await voter.gauges(plugin.address);
    let Bribe0Address = await voter.bribes(plugin.address);
    gauge0 = await ethers.getContractAt(
      "contracts/GaugeFactory.sol:Gauge",
      Gauge0Address
    );
    bribe0 = await ethers.getContractAt(
      "contracts/BribeFactory.sol:Bribe",
      Bribe0Address
    );
    console.log("- Plugin0 Added in Voter");

    console.log("Initialization Complete");
    console.log();
  });

  it("first test", async function () {
    console.log("******************************************************");
  });

  it("Set colors", async function () {
    console.log("******************************************************");
    await plugin.setColors([
      "#000000",
      "#18fc03",
      "#fce303",
      "#fc0317",
      "#03a5fc",
      "#db03fc",
    ]);
  });

  it("Mint test tokens to each user", async function () {
    console.log("******************************************************");
    await BASE.mint(user0.address, 1000);
    await BASE.mint(user1.address, 1000);
    await BASE.mint(user2.address, 1000);
  });

  it("User0 Buys TOKEN with 10 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await TOKEN.connect(user0).buy(
      ten,
      1,
      1992282187,
      user0.address,
      AddressZero
    );
  });

  it("User1 stakes TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(VTOKEN.address, one);
    await VTOKEN.connect(user0).deposit(one);
  });

  it("user0 votes on plugins a", async function () {
    console.log("******************************************************");
    await voter.connect(user0).vote([plugin.address], [ten]);
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
  });

  it("GaugeCardData, plugin, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin.address, user1.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.gauge);
    console.log("Plugin: ", res.plugin);
    console.log("Underlying: ", res.underlying);
    console.log("Tokens in Underlying: ");
    for (let i = 0; i < res.tokensInUnderlying.length; i++) {
      console.log(" - ", res.tokensInUnderlying[i]);
    }
    console.log("Underlying Decimals: ", res.underlyingDecimals);
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Reward Per token: ", divDec(res.rewardPerToken));
    console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
    console.log("Total Supply: ", divDec(res.totalSupply));
    console.log("Voting Weight: ", divDec(res.votingWeight), "%");
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
    console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
    console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
  });

  it("User0 places tiles randomly", async function () {
    console.log("******************************************************");
    console.log("ETH balance: ", divDec(await user0.getBalance()));
    for (let i = 0; i < 1000; i++) {
      await plugin
        .connect(user0)
        .placeFor(
          user0.address,
          [getRndInteger(0, 256)],
          [getRndInteger(0, 256)],
          getRndInteger(0, 6),
          {
            value: pointZeroOne,
          }
        );
    }
  });

  it("User1 places tiles randomly", async function () {
    console.log("******************************************************");
    console.log("ETH balance: ", divDec(await user1.getBalance()));
    for (let i = 0; i < 1000; i++) {
      await plugin
        .connect(user1)
        .placeFor(
          user1.address,
          [getRndInteger(0, 256)],
          [getRndInteger(0, 256)],
          getRndInteger(0, 6),
          {
            value: pointZeroOne,
          }
        );
    }
  });

  it("GaugeCardData, plugin, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin.address, user0.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.gauge);
    console.log("Plugin: ", res.plugin);
    console.log("Underlying: ", res.underlying);
    console.log("Tokens in Underlying: ");
    for (let i = 0; i < res.tokensInUnderlying.length; i++) {
      console.log(" - ", res.tokensInUnderlying[i]);
    }
    console.log("Underlying Decimals: ", res.underlyingDecimals);
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Reward Per token: ", divDec(res.rewardPerToken));
    console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
    console.log("Total Supply: ", divDec(res.totalSupply));
    console.log("Voting Weight: ", divDec(res.votingWeight), "%");
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
    console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
    console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
  });

  it("Forward 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
  });

  it("Forward 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("GaugeCardData, plugin, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin.address, user0.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.gauge);
    console.log("Plugin: ", res.plugin);
    console.log("Underlying: ", res.underlying);
    console.log("Tokens in Underlying: ");
    for (let i = 0; i < res.tokensInUnderlying.length; i++) {
      console.log(" - ", res.tokensInUnderlying[i]);
    }
    console.log("Underlying Decimals: ", res.underlyingDecimals);
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Reward Per token: ", divDec(res.rewardPerToken));
    console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
    console.log("Total Supply: ", divDec(res.totalSupply));
    console.log("Voting Weight: ", divDec(res.votingWeight), "%");
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
    console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
    console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
  });

  it("Retrieve and display grid tiles", async function () {
    console.log("******************************************************");
    const gridChunk = await plugin.getGridChunk(0, 0, 15, 255);
    console.log("Grid chunk: ", gridChunk);
  });
});
