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

// XKDK ABI
const XKDK_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function updateTransferWhitelist(address account, bool add) external",
];
const XKDK_ADDR = "0x414B50157a5697F14e91417C5275A7496DcF429D";
const XKDK_OWNER = "0x064097EbcbFca546E5Fc6a19559EA1b90262E9D1";

function timer(t) {
  return new Promise((r) => setTimeout(r, t));
}

const WBERA_ADDR = "0x7507c1dc16935B82698e4C63f2746A2fCf994dF8";
const YEET_ADDR = "0x1740F679325ef3686B2f574e392007A92e4BeD41";
const KDK_ADDR = "0xfd27998fa0eaB1A6372Db14Afd4bF7c4a58C5364";
const KODIAK3_ADDR = "0xE5A2ab5D2fb268E5fF43A5564e44c3309609aFF9"; // Kodiak Vault V1 YEET/WBERA
const KODIAK3_FARM = "0xbdEE3F788a5efDdA1FcFe6bfe7DbbDa5690179e6";
const KODIAK3_HOLDER = "0x2268606f89189Ae4F87DF5e4Dc4855737dbf7e94";

let owner, multisig, treasury, user0, user1, user2;
let VTOKENFactory,
  OTOKENFactory,
  feesFactory,
  rewarderFactory,
  gaugeFactory,
  bribeFactory;
let minter,
  voter,
  fees,
  rewarder,
  governance,
  multicall,
  trifectaMulticall,
  pluginFactory;
let TOKEN, VTOKEN, OTOKEN, BASE;
let WBERA, YEET, XKDK;
let KODIAK3, plugin0, gauge0, bribe0;

describe.only("berachain: trifecta testing", function () {
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
    YEET = new ethers.Contract(YEET_ADDR, ERC20_ABI, provider);
    KODIAK3 = new ethers.Contract(KODIAK3_ADDR, ERC20_ABI, provider);
    XKDK = new ethers.Contract(XKDK_ADDR, XKDK_ABI, provider);
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

    // initialize TrifectaMulticall
    const trifectaMulticallArtifact = await ethers.getContractFactory(
      "TrifectaMulticall"
    );
    const trifectaMulticallContract = await trifectaMulticallArtifact.deploy(
      voter.address
    );
    trifectaMulticall = await ethers.getContractAt(
      "TrifectaMulticall",
      trifectaMulticallContract.address
    );
    console.log("- TrifectaMulticall Initialized");

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
    const pluginFactoryArtifact = await ethers.getContractFactory(
      "TrifectaPluginFactory"
    );
    const pluginFactoryContract = await pluginFactoryArtifact.deploy(
      voter.address
    );
    pluginFactory = await ethers.getContractAt(
      "TrifectaPluginFactory",
      pluginFactoryContract.address
    );
    console.log("- Plugin Factory Initialized");

    // initialize KODIAK3
    await pluginFactory.createPlugin(
      KODIAK3_ADDR,
      KODIAK3_FARM,
      YEET_ADDR,
      WBERA_ADDR,
      [YEET_ADDR],
      "YEET-WBERA Island"
    );
    plugin0 = await ethers.getContractAt(
      "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPlugin",
      await pluginFactory.last_plugin()
    );

    // add KODIAK3 Plugin to Voter
    await voter.addPlugin(plugin0.address);
    let Gauge0Address = await voter.gauges(plugin0.address);
    let Bribe0Address = await voter.bribes(plugin0.address);
    gauge0 = await ethers.getContractAt(
      "contracts/GaugeFactory.sol:Gauge",
      Gauge0Address
    );
    bribe0 = await ethers.getContractAt(
      "contracts/BribeFactory.sol:Bribe",
      Bribe0Address
    );
    console.log("- KODIAK3 Added in Voter");

    // add KDK and xKDK as gauge reward tokens from Voter
    await voter.addGaugeReward(gauge0.address, KDK_ADDR);
    await voter.addGaugeReward(gauge0.address, XKDK_ADDR);
    console.log("- KDK and XKDK added as gauge rewards");

    console.log("Initialization Complete");
    console.log();
  });

  it("first test", async function () {
    console.log("******************************************************");
    console.log(
      "Balance of LP0 holder",
      await KODIAK3.balanceOf(KODIAK3_HOLDER)
    );
  });

  it("Impersonate KODIAK3 holder and send to user0", async function () {
    console.log("******************************************************");
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [KODIAK3_HOLDER],
    });
    const signer = ethers.provider.getSigner(KODIAK3_HOLDER);

    await KODIAK3.connect(signer).transfer(
      user0.address,
      await KODIAK3.connect(owner).balanceOf(KODIAK3_HOLDER)
    );
    await KODIAK3.connect(user0).transfer(user1.address, ten);
    await KODIAK3.connect(user0).transfer(user2.address, ten);

    console.log(
      "Holder KODIAK3 balance: ",
      divDec(await KODIAK3.connect(owner).balanceOf(KODIAK3_HOLDER))
    );
    console.log(
      "User0 KODIAK3 balance: ",
      divDec(await KODIAK3.connect(owner).balanceOf(user0.address))
    );
    console.log(
      "User1 KODIAK3 balance: ",
      divDec(await KODIAK3.connect(owner).balanceOf(user1.address))
    );
    console.log(
      "User2 KODIAK3 balance: ",
      divDec(await KODIAK3.connect(owner).balanceOf(user2.address))
    );
  });

  it("User0 deposits in plugin", async function () {
    console.log("******************************************************");
    await KODIAK3.connect(user0).approve(plugin0.address, ten);
    await plugin0.connect(user0).depositFor(user0.address, ten);
  });

  it("View plugin stats", async function () {
    console.log("******************************************************");
    console.log(
      "LockedLiquidity",
      divDec(await plugin0.connect(owner).getLockedLiquidity())
    );
    console.log("LockedStakes", await plugin0.connect(owner).getLockedStakes());
  });

  it("User0 deposits in plugin", async function () {
    console.log("******************************************************");
    await KODIAK3.connect(user0).approve(plugin0.address, ten);
    await plugin0.connect(user0).depositFor(user0.address, ten);
  });

  it("View plugin stats", async function () {
    console.log("******************************************************");
    console.log(
      "LockedLiquidity",
      divDec(await plugin0.connect(owner).getLockedLiquidity())
    );
    console.log("LockedStakes", await plugin0.connect(owner).getLockedStakes());
  });

  it("User0 deposits in plugin", async function () {
    console.log("******************************************************");
    await KODIAK3.connect(user0).approve(plugin0.address, ten);
    await plugin0.connect(user0).depositFor(user0.address, ten);
  });

  it("User1 deposits in plugin", async function () {
    console.log("******************************************************");
    await KODIAK3.connect(user1).approve(plugin0.address, ten);
    await plugin0.connect(user1).depositFor(user1.address, ten);
  });

  it("User2 deposits in plugin", async function () {
    console.log("******************************************************");
    await KODIAK3.connect(user2).approve(plugin0.address, ten);
    await plugin0.connect(user2).depositFor(user2.address, ten);
  });

  it("View plugin stats", async function () {
    console.log("******************************************************");
    console.log(
      "LockedLiquidity",
      divDec(await plugin0.connect(owner).getLockedLiquidity())
    );
    console.log("LockedStakes", await plugin0.connect(owner).getLockedStakes());
  });

  it("Mint test tokens to each user", async function () {
    console.log("******************************************************");
    await BASE.mint(user0.address, 1000);
    await BASE.mint(user1.address, 1000);
    await BASE.mint(user2.address, 1000);
  });

  it("User1 Buys TOKEN with 100 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, oneHundred);
    await TOKEN.connect(user1).buy(
      oneHundred,
      1,
      1992282187,
      user1.address,
      AddressZero
    );
  });

  it("User1 stakes 50 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(VTOKEN.address, fifty);
    await VTOKEN.connect(user1).deposit(fifty);
  });

  it("User1 Sells 1 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user1.address)
    );
    await TOKEN.connect(user1).sell(
      await TOKEN.balanceOf(user1.address),
      1,
      1992282187,
      user1.address,
      user2.address
    );
  });

  it("user1 votes on plugins", async function () {
    console.log("******************************************************");
    await voter.connect(user1).vote([plugin0.address], [ten]);
  });

  it("BondingCurveData, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user1.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("GaugeCardData, plugin0, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin0.address, user1.address);
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

  it("BribeCardData, plugin0, user1 ", async function () {
    console.log("******************************************************");
    let res = await multicall.bribeCardData(plugin0.address, user1.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.bribe);
    console.log("Plugin: ", res.plugin);
    console.log("Reward Tokens: ");
    for (let i = 0; i < res.rewardTokens.length; i++) {
      console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
    }
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Voting Weight: ", divDec(res.voteWeight));
    console.log("Voting percent: ", divDec(res.votePercent), "%");
    console.log("Reward Per Token: ");
    for (let i = 0; i < res.rewardsPerToken.length; i++) {
      console.log(" - ", divDec(res.rewardsPerToken[i]));
    }
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Account Votes: ", divDec(res.accountVote));
    console.log("Earned Rewards: ");
    for (let i = 0; i < res.accountRewardsEarned.length; i++) {
      console.log(" - ", divDec(res.accountRewardsEarned[i]));
    }
  });

  it("GaugeCardData, plugin0, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin0.address, user0.address);
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

  it("Forward time by 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("GaugeCardData, plugin0, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin0.address, user0.address);
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

  it("Forward time by 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("Whitelist plugin and bribe contract to transfer xKDK", async function () {
    console.log("******************************************************");
    // transfer ETH to XKDK_OWNER
    await owner.sendTransaction({
      to: XKDK_OWNER,
      value: ethers.utils.parseEther("1.0"),
    });
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [XKDK_OWNER],
    });
    const signer = ethers.provider.getSigner(XKDK_OWNER);
    await XKDK.connect(signer).updateTransferWhitelist(plugin0.address, true);
    await XKDK.connect(signer).updateTransferWhitelist(gauge0.address, true);
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
    await fees.distribute();
    await voter.distributeToBribes([plugin0.address]);
  });

  it("BribeCardData, plugin0, user1 ", async function () {
    console.log("******************************************************");
    let res = await multicall.bribeCardData(plugin0.address, user1.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.bribe);
    console.log("Plugin: ", res.plugin);
    console.log("Reward Tokens: ");
    for (let i = 0; i < res.rewardTokens.length; i++) {
      console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
    }
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Voting Weight: ", divDec(res.voteWeight));
    console.log("Voting percent: ", divDec(res.votePercent), "%");
    console.log("Reward Per Token: ");
    for (let i = 0; i < res.rewardsPerToken.length; i++) {
      console.log(" - ", divDec(res.rewardsPerToken[i]));
    }
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Account Votes: ", divDec(res.accountVote));
    console.log("Earned Rewards: ");
    for (let i = 0; i < res.accountRewardsEarned.length; i++) {
      console.log(" - ", divDec(res.accountRewardsEarned[i]));
    }
  });

  it("Forward time by 2 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("BribeCardData, plugin0, user1 ", async function () {
    console.log("******************************************************");
    let res = await multicall.bribeCardData(plugin0.address, user1.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.bribe);
    console.log("Plugin: ", res.plugin);
    console.log("Reward Tokens: ");
    for (let i = 0; i < res.rewardTokens.length; i++) {
      console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
    }
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Voting Weight: ", divDec(res.voteWeight));
    console.log("Voting percent: ", divDec(res.votePercent), "%");
    console.log("Reward Per Token: ");
    for (let i = 0; i < res.rewardsPerToken.length; i++) {
      console.log(" - ", divDec(res.rewardsPerToken[i]));
    }
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Account Votes: ", divDec(res.accountVote));
    console.log("Earned Rewards: ");
    for (let i = 0; i < res.accountRewardsEarned.length; i++) {
      console.log(" - ", divDec(res.accountRewardsEarned[i]));
    }
  });

  /*

  it("User0 withdraws from all gauges", async function () {
    console.log("******************************************************");
    await plugin0
      .connect(user0)
      .withdrawTo(
        user0.address,
        await plugin0.connect(owner).balanceOf(user0.address)
      );
  });

  it("User2 attempts to withdraw more than they have from gauge", async function () {
    console.log("******************************************************");
    await expect(plugin0.connect(user2).withdrawTo(user2.address, twenty)).to.be
      .reverted;
    await plugin0.connect(user2).withdrawTo(user2.address, ten);
  });

  it("GaugeCardData, plugin0, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin0.address, user0.address);
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

  it("User1 claims bribes", async function () {
    console.log("******************************************************");
    await voter.connect(user1).claimBribes([bribe0.address]);
    console.log(
      "User1 xKDK balance: ",
      divDec(await XKDK.connect(owner).balanceOf(user1.address))
    );
  });

  it("BribeCardData, plugin0, user1 ", async function () {
    console.log("******************************************************");
    let res = await multicall.bribeCardData(plugin0.address, user1.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.bribe);
    console.log("Plugin: ", res.plugin);
    console.log("Reward Tokens: ");
    for (let i = 0; i < res.rewardTokens.length; i++) {
      console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
    }
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Voting Weight: ", divDec(res.voteWeight));
    console.log("Voting percent: ", divDec(res.votePercent), "%");
    console.log("Reward Per Token: ");
    for (let i = 0; i < res.rewardsPerToken.length; i++) {
      console.log(" - ", divDec(res.rewardsPerToken[i]));
    }
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Account Votes: ", divDec(res.accountVote));
    console.log("Earned Rewards: ");
    for (let i = 0; i < res.accountRewardsEarned.length; i++) {
      console.log(" - ", divDec(res.accountRewardsEarned[i]));
    }
  });

  it("View plugin stats", async function () {
    console.log("******************************************************");
    console.log(
      "LockedLiquidity",
      divDec(await plugin0.connect(owner).getLockedLiquidity())
    );
    console.log("LockedStakes", await plugin0.connect(owner).getLockedStakes());
  });

  */
});
