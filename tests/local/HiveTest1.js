const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const divDec6 = (amount, decimals = 6) => amount / 10 ** decimals;
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { execPath } = require("process");
const util = require("util");

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

let owner,
  multisig,
  treasury,
  user0,
  user1,
  user2,
  hiveOwner,
  hiveTreasury,
  hiveDelegate;
let VTOKENFactory,
  OTOKENFactory,
  feesFactory,
  rewarderFactory,
  gaugeFactory,
  bribeFactory;
let minter, voter, fees, rewarder, governance, multicall;
let TOKEN, VTOKEN, OTOKEN, BASE;
let vaultFactory;
let hiveFactory,
  hiveTokenFactory,
  hiveRewarderFactory,
  hiveDistroFactory,
  hiveFeeFlowFactory,
  hiveMulticall;
let hiveToken, hiveRewarder, hiveDistro, hiveFeeFlow;
let pluginFactory;
let TEST0, xTEST0, plugin0, gauge0, bribe0;
let TEST1, xTEST1, plugin1, gauge1, bribe1;
let TEST2, LP0, plugin2, gauge2, bribe2;
let TEST3, LP1, plugin3, gauge3, bribe3;

describe("Hive token testing multicall", function () {
  before("Initial set up", async function () {
    console.log("Begin Initialization");

    // initialize users
    [
      owner,
      multisig,
      treasury,
      user0,
      user1,
      user2,
      hiveOwner,
      hiveTreasury,
      hiveDelegate,
    ] = await ethers.getSigners();

    // initialize BASE
    const ERC20MockArtifact = await ethers.getContractFactory(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock"
    );
    BASE = await ERC20MockArtifact.deploy("BASE", "BASE");
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

    const PluginFactoryArtifact = await ethers.getContractFactory(
      "MockPluginFactory"
    );
    const PluginFactoryContract = await PluginFactoryArtifact.deploy(
      voter.address
    );
    pluginFactory = await ethers.getContractAt(
      "MockPluginFactory",
      PluginFactoryContract.address
    );
    console.log("- PluginFactory Initialized");

    await pluginFactory.createSingleStakePlugin("xTEST0", "TEST0");
    plugin0 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:MockPlugin",
      await pluginFactory.last_plugin()
    );
    console.log("- Plugin0 Initialized");

    await pluginFactory.createSingleStakePlugin("xTEST1", "TEST1");
    plugin1 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:MockPlugin",
      await pluginFactory.last_plugin()
    );
    console.log("- Plugin1 Initialized");

    await pluginFactory.createLPMockPlugin("LP0", "TEST2", "BASE");
    plugin2 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:MockPlugin",
      await pluginFactory.last_plugin()
    );
    console.log("- Plugin2 Initialized");

    await pluginFactory.createLPMockPlugin("LP1", "TEST3", "BASE");
    plugin3 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:MockPlugin",
      await pluginFactory.last_plugin()
    );
    console.log("- Plugin3 Initialized");

    // Initialize Mock Tokens
    xTEST0 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      await plugin0.getUnderlyingAddress()
    );
    TEST0 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      (
        await plugin0.getBribeTokens()
      )[0]
    );
    xTEST1 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      await plugin1.getUnderlyingAddress()
    );
    TEST1 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      (
        await plugin1.getBribeTokens()
      )[0]
    );
    LP0 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      await plugin2.getUnderlyingAddress()
    );
    TEST2 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      (
        await plugin2.getBribeTokens()
      )[0]
    );
    LP1 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      await plugin3.getUnderlyingAddress()
    );
    TEST3 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      (
        await plugin3.getBribeTokens()
      )[0]
    );
    console.log("- Mock Tokens Initialized");

    // add Plugin0 to Voter
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
    console.log("- Plugin0 Added in Voter");

    // add Plugin1 to Voter
    await voter.addPlugin(plugin1.address);
    let Gauge1Address = await voter.gauges(plugin1.address);
    let Bribe1Address = await voter.bribes(plugin1.address);
    gauge1 = await ethers.getContractAt(
      "contracts/GaugeFactory.sol:Gauge",
      Gauge1Address
    );
    bribe1 = await ethers.getContractAt(
      "contracts/BribeFactory.sol:Bribe",
      Bribe1Address
    );
    console.log("- Plugin1 Added in Voter");

    // add Plugin2 to Voter
    await voter.addPlugin(plugin2.address);
    let Gauge2Address = await voter.gauges(plugin2.address);
    let Bribe2Address = await voter.bribes(plugin2.address);
    gauge2 = await ethers.getContractAt(
      "contracts/GaugeFactory.sol:Gauge",
      Gauge2Address
    );
    bribe2 = await ethers.getContractAt(
      "contracts/BribeFactory.sol:Bribe",
      Bribe2Address
    );
    console.log("- Plugin2 Added in Voter");

    // add Plugin3 to Voter
    await voter.addPlugin(plugin3.address);
    let Gauge3Address = await voter.gauges(plugin3.address);
    let Bribe3Address = await voter.bribes(plugin3.address);
    gauge3 = await ethers.getContractAt(
      "contracts/GaugeFactory.sol:Gauge",
      Gauge3Address
    );
    bribe3 = await ethers.getContractAt(
      "contracts/BribeFactory.sol:Bribe",
      Bribe3Address
    );
    console.log("- Plugin3 Added in Voter");

    // Initialize hiveFactory
    const hiveFactoryArtifact = await ethers.getContractFactory("HiveFactory");
    const hiveFactoryContract = await hiveFactoryArtifact.deploy(
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address,
      voter.address
    );
    hiveFactory = await ethers.getContractAt(
      "HiveFactory",
      hiveFactoryContract.address
    );
    console.log("- HiveFactory Initialized");

    //Iniitialize HiveTokenFactory
    const hiveTokenFactoryArtifact = await ethers.getContractFactory(
      "HiveTokenFactory"
    );
    const hiveTokenFactoryContract = await hiveTokenFactoryArtifact.deploy(
      hiveFactory.address
    );
    hiveTokenFactory = await ethers.getContractAt(
      "HiveTokenFactory",
      hiveTokenFactoryContract.address
    );
    console.log("- HiveTokenFactory Initialized");

    //Initialize HiveRewarderFactory
    const hiveRewarderFactoryArtifact = await ethers.getContractFactory(
      "HiveRewarderFactory"
    );
    const hiveRewarderFactoryContract =
      await hiveRewarderFactoryArtifact.deploy(
        hiveFactory.address,
        vaultFactory.address
      );
    hiveRewarderFactory = await ethers.getContractAt(
      "HiveRewarderFactory",
      hiveRewarderFactoryContract.address
    );
    console.log("- HiveRewarderFactory Initialized");

    const distroFactoryArtifact = await ethers.getContractFactory(
      "HiveDistroFactory"
    );
    hiveDistroFactory = await distroFactoryArtifact.deploy(hiveFactory.address);
    console.log("- DistroFactory Initialized");

    const feeFlowFactoryArtifact = await ethers.getContractFactory(
      "HiveFeeFlowFactory"
    );
    hiveFeeFlowFactory = await feeFlowFactoryArtifact.deploy(
      hiveFactory.address
    );
    console.log("- FeeFlowFactory Initialized");

    // Set factories
    await hiveFactory.setHiveTokenFactory(hiveTokenFactory.address);
    await hiveFactory.setHiveRewarderFactory(hiveRewarderFactory.address);
    await hiveFactory.setHiveDistroFactory(hiveDistroFactory.address);
    await hiveFactory.setHiveFeeFlowFactory(hiveFeeFlowFactory.address);
    console.log("- Factories Set");

    // Initialize HiveMulticall
    const hiveMulticallArtifact = await ethers.getContractFactory(
      "HiveMulticall"
    );
    const hiveMulticallContract = await hiveMulticallArtifact.deploy(
      hiveFactory.address,
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address,
      voter.address
    );
    hiveMulticall = await ethers.getContractAt(
      "HiveMulticall",
      hiveMulticallContract.address
    );
    console.log("- HiveMulticall Initialized");

    // Create Hive
    await hiveFactory.createHive(
      "Profit Bero Hive",
      "profitBERO",
      "uri",
      "The profitBERO hive maxes out voting rewards.",
      BASE.address,
      oneHundred,
      ten
    );
    console.log("- HIVE Token deployed");

    // Initialize HiveToken
    let res = await hiveFactory.connect(owner).index_Hive(0);
    hiveToken = await ethers.getContractAt("HiveToken", res.hiveToken);
    console.log("- hiveToken Initialized at:", hiveToken.address);

    hiveRewarder = await ethers.getContractAt(
      "HiveRewarder",
      await hiveRewarderFactory.connect(owner).lastHiveRewarder()
    );
    console.log("- hiveRewarder Initialized");

    hiveDistro = await ethers.getContractAt(
      "HiveDistro",
      await hiveDistroFactory.connect(owner).lastHiveDistro()
    );
    console.log("- hiveDistro Initialized");

    hiveFeeFlow = await ethers.getContractAt(
      "HiveFeeFlow",
      await hiveFeeFlowFactory.connect(owner).lastHiveFeeFlow()
    );
    console.log("- hiveFeeFlow Initialized");

    console.log("Initialization Complete");
    console.log();
  });

  it("Mint test tokens to each user", async function () {
    console.log("******************************************************");
    await BASE.mint(user0.address, 1000);
    await BASE.mint(user1.address, 1000);
    await BASE.mint(user2.address, 1000);
    await xTEST0.mint(user0.address, 100);
    await xTEST0.mint(user1.address, 100);
    await xTEST0.mint(user2.address, 100);
    await xTEST1.mint(user0.address, 100);
    await xTEST1.mint(user1.address, 100);
    await xTEST1.mint(user2.address, 100);
    await LP0.mint(user0.address, 100);
    await LP0.mint(user1.address, 100);
    await LP0.mint(user2.address, 100);
    await LP1.mint(user0.address, 100);
    await LP1.mint(user1.address, 100);
    await LP1.mint(user2.address, 100);
    console.log(
      "User0 oTOKEN balance",
      divDec(await OTOKEN.balanceOf(user0.address))
    );
    console.log(
      "User1 oTOKEN balance",
      divDec(await OTOKEN.balanceOf(user1.address))
    );
  });

  it("User0 Buys TOKEN with 10 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, oneHundred);
    await TOKEN.connect(user0).buy(
      oneHundred,
      1,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("User1 stakes 0 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(VTOKEN.address, one);
    await VTOKEN.connect(user0).deposit(one);
  });

  it("User sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user0.address)
    );
    await TOKEN.connect(user0).sell(
      await TOKEN.balanceOf(user0.address),
      1,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("Owner mints OTOKEN and sends to fee contract", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(fees.address, ten);
  });

  it("User2 call distributeFees", async function () {
    console.log("******************************************************");
    await fees.distribute();
  });

  it("Forward 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("user0 votes on plugins a", async function () {
    console.log("******************************************************");
    await voter
      .connect(user0)
      .vote(
        [plugin0.address, plugin1.address, plugin2.address, plugin3.address],
        [ten, ten, ten, ten]
      );
  });

  it("User1 deposits xTEST0 in plugin0", async function () {
    console.log("******************************************************");
    await xTEST0.connect(user1).approve(plugin0.address, ten);
    await plugin0.connect(user1).depositFor(user1.address, ten);
  });

  it("User1 deposits xTEST1 in plugin1", async function () {
    console.log("******************************************************");
    await xTEST1.connect(user1).approve(plugin1.address, ten);
    await plugin1.connect(user1).depositFor(user1.address, ten);
  });

  it("User1 deposits LP0 in plugin2", async function () {
    console.log("******************************************************");
    await LP0.connect(user1).approve(plugin2.address, ten);
    await plugin2.connect(user1).depositFor(user1.address, ten);
  });

  it("User1 deposits LP1 in plugin3", async function () {
    console.log("******************************************************");
    await LP1.connect(user1).approve(plugin3.address, ten);
    await plugin3.connect(user1).depositFor(user1.address, ten);
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
  });

  it("Forward time by 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [1 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("owner distributes voting rewards", async function () {
    console.log("******************************************************");
    await voter.distributeToBribes([
      plugin0.address,
      plugin1.address,
      plugin2.address,
      plugin3.address,
    ]);
  });

  it("Forward time by 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [1 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("owner distributes voting rewards", async function () {
    console.log("******************************************************");
    await voter.distributeToBribes([
      plugin0.address,
      plugin1.address,
      plugin2.address,
      plugin3.address,
    ]);
  });

  it("Mint test tokens to each user", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(user0.address, oneHundred);
    await OTOKEN.connect(owner).transfer(user1.address, oneHundred);
    console.log(
      "User0 oTOKEN balance",
      divDec(await OTOKEN.balanceOf(user0.address))
    );
    console.log(
      "User1 oTOKEN balance",
      divDec(await OTOKEN.balanceOf(user1.address))
    );
  });

  it("HiveData", async function () {
    console.log("******************************************************");
    let res = await hiveMulticall.getHive(hiveToken.address, user0.address);
    console.log(res);
  });

  it("User0 mints hiveToken with 10 oTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user0).approve(hiveMulticall.address, ten);
    await hiveMulticall.connect(user0).mint(hiveToken.address, ten);
    console.log(
      "User0 hiveToken Balance: ",
      divDec(await hiveToken.balanceOf(user0.address))
    );
  });

  it("HiveData", async function () {
    console.log("******************************************************");
    let res = await hiveMulticall.getHive(hiveToken.address, user0.address);
    console.log(res);
  });

  it("User0 mints and deposits hiveToken with 10 oTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user0).approve(hiveMulticall.address, ten);
    await hiveMulticall.connect(user0).mintAndDeposit(hiveToken.address, ten);
    console.log(
      "User0 hiveToken Balance: ",
      divDec(await hiveToken.balanceOf(user0.address))
    );
    console.log(
      "User hiveToken Staked: ",
      divDec(await hiveRewarder.balanceOf(user0.address))
    );
  });

  it("HiveData", async function () {
    console.log("******************************************************");
    let res = await hiveMulticall.getHive(hiveToken.address, user0.address);
    console.log(res);
  });

  it("User1 mints hiveToken with five oTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user1).approve(hiveMulticall.address, five);
    await hiveMulticall.connect(user1).mint(hiveToken.address, five);
    console.log(
      "User1 hiveToken Balance: ",
      divDec(await hiveToken.balanceOf(user1.address))
    );
  });

  it("Delegate sets votes", async function () {
    console.log("******************************************************");
    await hiveToken
      .connect(owner)
      .setVotes(
        [plugin0.address, plugin1.address, plugin2.address, plugin3.address],
        [ten, ten, ten, ten]
      );
    console.log("Votes: ", await hiveToken.connect(user0).getVote());
  });

  it("HiveData", async function () {
    console.log("******************************************************");
    let res = await hiveMulticall.getHive(hiveToken.address, user0.address);
    console.log(res);
  });

  it("User1 mints and deposits hiveToken with five oTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user1).approve(hiveMulticall.address, five);
    await hiveMulticall.connect(user1).mintAndDeposit(hiveToken.address, five);
    console.log(
      "User1 hiveToken Balance: ",
      divDec(await hiveToken.balanceOf(user1.address))
    );
  });

  it("User1 withdraws 5 hiveToken", async function () {
    console.log("******************************************************");
    await hiveRewarder
      .connect(user1)
      .withdraw(user1.address, await hiveRewarder.balanceOf(user1.address));
    console.log(
      "User1 hiveToken Balance: ",
      divDec(await hiveToken.balanceOf(user1.address))
    );
  });

  it("HiveData", async function () {
    console.log("******************************************************");
    let res = await hiveMulticall.getHive(hiveToken.address, user1.address);
    console.log(res);
  });

  it("User1 deposits 5 hiveToken", async function () {
    console.log("******************************************************");
    await hiveToken.connect(user1).approve(hiveMulticall.address, five);
    await hiveMulticall.connect(user1).deposit(hiveToken.address, five);
    console.log(
      "User1 hiveToken Balance: ",
      divDec(await hiveToken.balanceOf(user1.address))
    );
  });

  it("HiveData", async function () {
    console.log("******************************************************");
    let res = await hiveMulticall.getHive(hiveToken.address, user1.address);
    console.log(res);
  });

  it("owner distributes voting rewards", async function () {
    console.log("******************************************************");
    await voter.distributeToBribes([
      plugin0.address,
      plugin1.address,
      plugin2.address,
      plugin3.address,
    ]);
  });

  it("HiveToken balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(hiveToken.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(hiveToken.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(hiveToken.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(hiveToken.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(hiveToken.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(hiveToken.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(hiveToken.address)));
  });

  it("HiveFeeFlow balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(hiveFeeFlow.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(hiveFeeFlow.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(hiveFeeFlow.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(hiveFeeFlow.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(hiveFeeFlow.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(hiveFeeFlow.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(hiveFeeFlow.address)));
  });

  it("HiveDistro balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(hiveDistro.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(hiveDistro.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(hiveDistro.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(hiveDistro.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(hiveDistro.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(hiveDistro.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(hiveDistro.address)));
  });

  it("AuctionData", async function () {
    console.log("******************************************************");
    let res = await hiveMulticall.getAuction(hiveToken.address);
    console.log(
      util.inspect(res, { showHidden: false, depth: null, colors: true })
    );
  });

  it("HiveFeeFlow buy", async function () {
    console.log("******************************************************");
    const price = await hiveFeeFlow.getPrice();
    await BASE.connect(user1).approve(hiveMulticall.address, price);
    await hiveMulticall
      .connect(user1)
      .buyAuction(hiveToken.address, 1792282187);
  });

  it("HiveToken balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(hiveToken.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(hiveToken.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(hiveToken.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(hiveToken.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(hiveToken.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(hiveToken.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(hiveToken.address)));
  });

  it("HiveFeeFlow balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(hiveFeeFlow.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(hiveFeeFlow.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(hiveFeeFlow.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(hiveFeeFlow.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(hiveFeeFlow.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(hiveFeeFlow.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(hiveFeeFlow.address)));
  });

  it("HiveDistro balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(hiveDistro.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(hiveDistro.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(hiveDistro.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(hiveDistro.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(hiveDistro.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(hiveDistro.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(hiveDistro.address)));
  });

  it("HiveRewarder balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(hiveRewarder.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(hiveRewarder.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(hiveRewarder.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(hiveRewarder.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(hiveRewarder.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(hiveRewarder.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(hiveRewarder.address)));
  });

  it("HiveFeeFlow stats", async function () {
    console.log("******************************************************");
    console.log("Auction Price: ", divDec(await hiveFeeFlow.getPrice()));
  });

  it("Owner adds base as bribe reward for plugin0", async function () {
    console.log("******************************************************");
    await voter
      .connect(owner)
      .addBribeReward(await voter.bribes(plugin0.address), BASE.address);
  });

  it("User0 Buys TOKEN with 10 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, oneHundred);
    await TOKEN.connect(user0).buy(
      oneHundred,
      1,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("User1 stakes 0 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(VTOKEN.address, one);
    await VTOKEN.connect(user0).deposit(one);
  });

  it("User sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user0.address)
    );
    await TOKEN.connect(user0).sell(
      await TOKEN.balanceOf(user0.address),
      1,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("Owner mints OTOKEN and sends to fee contract", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(fees.address, ten);
  });

  it("User2 call distributeFees", async function () {
    console.log("******************************************************");
    await fees.distribute();
  });

  it("owner distributes voting rewards", async function () {
    console.log("******************************************************");
    await voter.distributeToBribes([
      plugin0.address,
      plugin1.address,
      plugin2.address,
      plugin3.address,
    ]);
  });

  it("AuctionData", async function () {
    console.log("******************************************************");
    let res = await hiveMulticall.getAuction(hiveToken.address);
    console.log(
      util.inspect(res, { showHidden: false, depth: null, colors: true })
    );
  });

  // owner creates bribe on plugin0
  it("Owner creates bribe on plugin0", async function () {
    console.log("******************************************************");
    await BASE.connect(owner).mint(owner.address, 1000);
    await BASE.connect(owner).approve(bribe0.address, ten);
    await bribe0.connect(owner).notifyRewardAmount(BASE.address, ten);
  });

  it("Forward 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("AuctionData", async function () {
    console.log("******************************************************");
    let res = await hiveMulticall.getAuction(hiveToken.address);
    console.log(
      util.inspect(res, { showHidden: false, depth: null, colors: true })
    );
  });

  it("HiveRewarder balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(hiveRewarder.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(hiveRewarder.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(hiveRewarder.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(hiveRewarder.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(hiveRewarder.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(hiveRewarder.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(hiveRewarder.address)));
  });

  it("HiveFeeFlow buy", async function () {
    console.log("******************************************************");
    const price = await hiveFeeFlow.getPrice();
    await BASE.connect(owner).approve(hiveMulticall.address, price);
    await hiveMulticall
      .connect(owner)
      .buyAuction(hiveToken.address, 1792282187);
  });

  it("HiveRewarder balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(hiveRewarder.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(hiveRewarder.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(hiveRewarder.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(hiveRewarder.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(hiveRewarder.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(hiveRewarder.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(hiveRewarder.address)));
  });

  it("AuctionData", async function () {
    console.log("******************************************************");
    let res = await hiveMulticall.getAuction(hiveToken.address);
    console.log(
      util.inspect(res, { showHidden: false, depth: null, colors: true })
    );
  });

  it("HiveData", async function () {
    console.log("******************************************************");
    let res = await hiveMulticall.getHive(hiveToken.address, user0.address);
    console.log(res);
  });

  it("User0 claim hive rewards", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(user0.address)));
    await hiveRewarder.connect(user0).getReward(user0.address);
    console.log("BASE", divDec(await BASE.balanceOf(user0.address)));
  });

  it("Forward 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("User0 claim hive rewards", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(user0.address)));
    await hiveRewarder.connect(user0).getReward(user0.address);
    console.log("BASE", divDec(await BASE.balanceOf(user0.address)));
  });

  it("Forward 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("HiveFeeFlow buy", async function () {
    console.log("******************************************************");
    const price = await hiveFeeFlow.getPrice();
    await BASE.connect(owner).approve(hiveMulticall.address, price);
    await hiveMulticall
      .connect(owner)
      .buyAuction(hiveToken.address, 1792282187);
  });

  it("Owner sets Fee Flow", async function () {
    console.log("******************************************************");
    await hiveFactory
      .connect(owner)
      .setHiveFeeFlow(hiveToken.address, fiveHundred, ten);
  });

  it("AuctionData", async function () {
    console.log("******************************************************");
    let res = await hiveMulticall.getAuction(hiveToken.address);
    console.log(
      util.inspect(res, { showHidden: false, depth: null, colors: true })
    );
  });

  it("Owner creates bribe on plugin0", async function () {
    console.log("******************************************************");
    await BASE.connect(owner).mint(owner.address, 1000);
    await BASE.connect(owner).approve(bribe0.address, ten);
    await bribe0.connect(owner).notifyRewardAmount(BASE.address, ten);
  });

  it("Forward 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("AuctionData", async function () {
    console.log("******************************************************");
    let res = await hiveMulticall.getAuction(hiveToken.address);
    console.log(
      util.inspect(res, { showHidden: false, depth: null, colors: true })
    );
  });

  it("Forward 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("HiveRewarder balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(hiveRewarder.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(hiveRewarder.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(hiveRewarder.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(hiveRewarder.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(hiveRewarder.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(hiveRewarder.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(hiveRewarder.address)));
  });

  it("HiveFeeFlow buy", async function () {
    console.log("******************************************************");
    const price = await hiveMulticall.getFeeFlowPrice(hiveToken.address);
    console.log(
      "User1 BASE Balance: ",
      divDec(await BASE.balanceOf(user1.address))
    );
    console.log("Cost: ", divDec(price));
    await BASE.connect(user1).approve(hiveMulticall.address, price);
    await hiveMulticall
      .connect(user1)
      .buyAuction(hiveToken.address, 1792282187);
  });

  it("HiveRewarder balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(hiveRewarder.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(hiveRewarder.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(hiveRewarder.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(hiveRewarder.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(hiveRewarder.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(hiveRewarder.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(hiveRewarder.address)));
  });
});
