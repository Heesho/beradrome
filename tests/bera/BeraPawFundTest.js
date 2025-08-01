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

const LP_ADDR = "0x4a254b11810b8ebb63c5468e438fc561cb1bb1da";
const VAULT_ADDR = "0x45325df4a6a6ebd268f4693474aaaa1f3f0ce8ca";
const LP_HOLDER = "0x55b93b7F5B75bec5804460cF9EF0269148758BD8";
const BGT_ADDR = "0xBaadCC2962417C01Af99fb2B7C75706B9bd6Babe";

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
let BGT, LP0;
let fund0, gauge0, bribe0, auction0;

describe("bera: BeraPawFundTest", function () {
  before("Initial set up", async function () {
    console.log("Begin Initialization");

    // Initialize provider
    provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    await provider.ready; // Ensure the provider is connected

    // initialize users
    [owner, multisig, treasury, user0, user1, user2] =
      await ethers.getSigners();

    // initialize ERC20s
    LP0 = new ethers.Contract(LP_ADDR, ERC20_ABI, provider);
    BGT = new ethers.Contract(BGT_ADDR, ERC20_ABI, provider);
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
      "BeraPawFundFactory"
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
      VAULT_ADDR,
      oneHundred,
      24 * 3600,
      two,
      ten
    );
    fund0 = await ethers.getContractAt(
      "BeraPawFund",
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
    console.log("Balance of LP0 holder", await LP0.balanceOf(LP_HOLDER));
  });

  it("Impersonate LP0 holder and send to user0", async function () {
    console.log("******************************************************");
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [LP_HOLDER],
    });
    const signer = ethers.provider.getSigner(LP_HOLDER);

    await LP0.connect(signer).transfer(
      user0.address,
      await LP0.connect(owner).balanceOf(LP_HOLDER)
    );
    await LP0.connect(user0).transfer(user1.address, oneHundred);
    await LP0.connect(user0).transfer(user2.address, oneHundred);

    console.log(
      "Holder LP0 balance: ",
      divDec(await LP0.connect(owner).balanceOf(LP_HOLDER))
    );
    console.log(
      "User0 LP0 balance: ",
      divDec(await LP0.connect(owner).balanceOf(user0.address))
    );
    console.log(
      "User1 LP0 balance: ",
      divDec(await LP0.connect(owner).balanceOf(user1.address))
    );
    console.log(
      "User2 LP0 balance: ",
      divDec(await LP0.connect(owner).balanceOf(user2.address))
    );
  });

  it("Mint test tokens to each user", async function () {
    console.log("******************************************************");
    await BASE.mint(user0.address, oneThousand);
    await BASE.mint(user1.address, oneThousand);
    await BASE.mint(user2.address, oneThousand);
  });

  it("Setup emissions for fund0", async function () {
    console.log("******************************************************");
    console.log("Setting up emissions for fund0");
    console.log();

    // Add plugin to voter which will create and set gauge and bribe
    await voter.connect(owner).addPlugin(fund0.address);

    // First get some BASE to purchase TOKEN
    const baseAmount = oneThousand;
    await BASE.mint(user0.address, baseAmount);
    await BASE.connect(user0).approve(TOKEN.address, baseAmount);

    // Purchase TOKEN
    console.log("Purchasing TOKEN...");
    await TOKEN.connect(user0).buy(
      baseAmount,
      1,
      1792282187,
      user0.address,
      AddressZero
    );
    const tokenBalance = await TOKEN.balanceOf(user0.address);
    console.log("TOKEN purchased:", ethers.utils.formatUnits(tokenBalance, 18));

    // Stake TOKEN for vTOKEN
    console.log("\nStaking TOKEN for vTOKEN...");
    await TOKEN.connect(user0).approve(VTOKEN.address, tokenBalance);
    await VTOKEN.connect(user0).deposit(tokenBalance);
    const vTokenBalance = await VTOKEN.balanceOf(user0.address);
    console.log(
      "vTOKEN received:",
      ethers.utils.formatUnits(vTokenBalance, 18)
    );

    // Vote for fund0
    console.log("\nVoting for fund0...");
    await voter.connect(user0).vote([fund0.address], [vTokenBalance]);

    // Verify the vote
    const weight = await voter.weights(fund0.address);
    console.log("Voting weight:", ethers.utils.formatUnits(weight, 18));

    // Get updated plugin data
    const auctionCard = await auctionMulticall.auctionCardData(
      fund0.address,
      user0.address
    );
    console.log("\nUpdated Fund Details:");
    console.log(
      "- Voting Weight:",
      ethers.utils.formatUnits(auctionCard.votingWeight, 18),
      "%"
    );
    console.log(
      "- Offered OTOKEN:",
      ethers.utils.formatUnits(auctionCard.offeredOTOKEN, 18)
    );

    expect(weight).to.equal(vTokenBalance);
    console.log("\nEmissions setup complete!");
  });

  it("Initialize fund0", async function () {
    console.log("******************************************************");
    console.log("Initializing fund0");
    console.log();

    // Initialize fund
    await fund0.connect(user2).initialize();
    console.log("- Fund initialized");

    // Verify initialization
    expect(await fund0.getInitialized()).to.be.true;
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await controller.connect(owner).distribute();
  });

  it("Test fund0 parameters via multicall", async function () {
    console.log("******************************************************");
    console.log("Testing plugin0 parameters via multicall");
    console.log();

    const auctionCard = await auctionMulticall.auctionCardData(
      fund0.address,
      user0.address
    );

    console.log("Plugin Details:");
    console.log("- Protocol:", auctionCard.protocol);
    console.log("- Name:", auctionCard.name);
    console.log("- Asset:", auctionCard.asset);
    console.log("- Gauge:", auctionCard.gauge);
    console.log("- Bribe:", auctionCard.bribe);
    console.log("- Asset Auction:", auctionCard.assetAuction);
    console.log("- Reward Auction:", auctionCard.rewardAuction);
    console.log("- TVL:", ethers.utils.formatUnits(auctionCard.tvl, 18));
    console.log(
      "- Voting Weight:",
      ethers.utils.formatUnits(auctionCard.votingWeight, 18),
      "%"
    );

    console.log("\nAuction Parameters:");
    console.log(
      "- Epoch Duration:",
      auctionCard.auctionEpochDuration.toString(),
      "seconds"
    );
    console.log(
      "- Price Multiplier:",
      ethers.utils.formatUnits(auctionCard.auctionPriceMultiplier, 18)
    );
    console.log(
      "- Min Init Price:",
      ethers.utils.formatUnits(auctionCard.auctionMinInitPrice, 18)
    );
    console.log("- Current Epoch:", auctionCard.auctionEpoch.toString());
    console.log(
      "- Current Init Price:",
      ethers.utils.formatUnits(auctionCard.auctionInitPrice, 18)
    );
    console.log(
      "- Start Time:",
      new Date(auctionCard.auctionStartTime * 1000).toLocaleString()
    );
    console.log(
      "- Current Price:",
      ethers.utils.formatUnits(auctionCard.auctionPrice, 18)
    );
    console.log(
      "- Offered OTOKEN:",
      ethers.utils.formatUnits(auctionCard.offeredOTOKEN, 18)
    );

    console.log("\nStatus:");
    console.log("- Is Alive:", auctionCard.isAlive);
    console.log("- Is Initialized:", auctionCard.isInitialized);
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await controller.distribute();
  });

  it("Test fund0 deposit and rewards", async function () {
    console.log("******************************************************");
    console.log("Testing fund0 deposits and rewards");
    console.log();

    // Get initial states
    const initialTotalSupply = await fund0.getTvl();
    console.log("Initial Fund State:");
    console.log("- TVL:", ethers.utils.formatUnits(initialTotalSupply, 18));

    // Mint some LP0 tokens to user1
    const depositAmount = await LP0.connect(user1).balanceOf(user1.address);

    console.log(
      "\nMinted",
      ethers.utils.formatUnits(depositAmount, 18),
      "LP0 to user1"
    );

    // Approve and deposit LP0 tokens
    await LP0.connect(user1).approve(fund0.address, depositAmount);
    await fund0.connect(user1).deposit(depositAmount);

    console.log("\nPost-Deposit State:");
    console.log(
      "- Fund TVL:",
      ethers.utils.formatUnits(await fund0.getTvl(), 18)
    );

    // Generate some fund rewards
    console.log("\nGenerating fund rewards...");
    await fund0.connect(owner).claim();

    // Forward time to accumulate rewards
    await network.provider.send("evm_increaseTime", [24 * 3600]); // 1 day
    await network.provider.send("evm_mine");

    // Claim rewards from fund
    console.log("\nClaiming fund rewards...");
    const preClaim = await BGT.connect(owner).balanceOf(fund0.address);
    await fund0.connect(multisig).claim();
    const postClaim = await BGT.connect(owner).balanceOf(fund0.address);

    console.log(
      "Rewards claimed:",
      ethers.utils.formatUnits(postClaim.sub(preClaim), 18),
      "LBGT"
    );

    // Distribute rewards to auction
    console.log("\nDistributing rewards to auction...");
    const preAuctionBalance = await BGT.connect(owner).balanceOf(
      rewardAuction.address
    );
    await fund0.connect(user2).distribute([BGT.address]);
    const postAuctionBalance = await BGT.connect(owner).balanceOf(
      rewardAuction.address
    );

    console.log(
      "Rewards sent to auction:",
      ethers.utils.formatUnits(postAuctionBalance.sub(preAuctionBalance), 18),
      "LBGT"
    );

    // Verify states
    expect(await fund0.getTvl()).to.equal(depositAmount);
    expect(postClaim).to.be.gt(preClaim);
    expect(postAuctionBalance).to.be.gt(preAuctionBalance);
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    // Forward time to start new epoch
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]); // 7 days
    await network.provider.send("evm_mine");

    await controller.distributeToGauges();
  });

  it("Buy from auction", async function () {
    console.log("******************************************************");
    // Buy from auction
    console.log("\nPurchasing from auction...");
    const currentPrice = await auction0.getPrice();
    const currentEpoch = (await auction0.getSlot0()).epochId;
    console.log("Current price:", ethers.utils.formatUnits(currentPrice, 18));
    console.log("Current epoch:", currentEpoch);

    // Get LP0 for auction payment
    await LP0.connect(user2).approve(router.address, currentPrice.mul(2));

    // Execute auction purchase
    await router.connect(user2).buyFromAssetAuction(
      fund0.address,
      currentEpoch,
      1792282187, // deadline
      currentPrice
    );

    console.log("\nPost-Purchase State:");
    console.log(
      "- Auction Price:",
      ethers.utils.formatUnits(await auction0.getPrice(), 18)
    );
    console.log(
      "- User2 OTOKEN Balance:",
      ethers.utils.formatUnits(await OTOKEN.balanceOf(user2.address), 18)
    );

    // Verify states
    expect(await OTOKEN.balanceOf(user2.address)).to.be.gt(0);
  });

  it("Test emergency withdrawal", async function () {
    console.log("******************************************************");
    console.log("Testing emergency withdrawal");
    console.log();

    // Try emergency withdraw from non-owner (should fail)
    await expect(fund0.connect(user1).withdraw()).to.be.reverted;

    // Emergency withdraw from owner
    const preBal = await LP0.balanceOf(treasury.address);
    await fund0.connect(multisig).withdraw();
    const postBal = await LP0.balanceOf(treasury.address);

    console.log("Emergency withdrawal results:");
    console.log(
      "- LP0 withdrawn:",
      ethers.utils.formatUnits(postBal.sub(preBal), 18)
    );

    // Verify farm is empty
    expect(await fund0.getTvl()).to.equal(0);
  });
});
