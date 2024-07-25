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
  relayOwner,
  relayTreasury,
  relayDelegate;
let VTOKENFactory,
  OTOKENFactory,
  feesFactory,
  rewarderFactory,
  gaugeFactory,
  bribeFactory;
let minter, voter, fees, rewarder, governance, multicall;
let TOKEN, VTOKEN, OTOKEN, BASE;
let relayFactory,
  relayTokenFactory,
  relayRewarderFactory,
  relayDistroFactory,
  relayFeeFlowFactory,
  relayMulticall;
let relayToken, relayRewarder, relayDistro, relayFeeFlow;
let pluginFactory;
let TEST0, xTEST0, plugin0, gauge0, bribe0;
let TEST1, xTEST1, plugin1, gauge1, bribe1;
let TEST2, LP0, plugin2, gauge2, bribe2;
let TEST3, LP1, plugin3, gauge3, bribe3;

describe.only("local: test6 relay token testing multicall", function () {
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
      relayOwner,
      relayTreasury,
      relayDelegate,
    ] = await ethers.getSigners();

    // initialize BASE
    const ERC20MockArtifact = await ethers.getContractFactory(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock"
    );
    BASE = await ERC20MockArtifact.deploy("BASE", "BASE");
    console.log("- BASE Initialized");

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

    // Initialize relayFactory
    const relayFactoryArtifact = await ethers.getContractFactory(
      "RelayFactory"
    );
    const relayFactoryContract = await relayFactoryArtifact.deploy(
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address,
      voter.address
    );
    relayFactory = await ethers.getContractAt(
      "RelayFactory",
      relayFactoryContract.address
    );
    console.log("- RelayFactory Initialized");

    //Iniitialize RelayTokenFactory
    const relayTokenFactoryArtifact = await ethers.getContractFactory(
      "RelayTokenFactory"
    );
    const relayTokenFactoryContract = await relayTokenFactoryArtifact.deploy(
      relayFactory.address
    );
    relayTokenFactory = await ethers.getContractAt(
      "RelayTokenFactory",
      relayTokenFactoryContract.address
    );
    console.log("- RelayTokenFactory Initialized");

    //Initialize RelayRewarderFactory
    const relayRewarderFactoryArtifact = await ethers.getContractFactory(
      "RelayRewarderFactory"
    );
    const relayRewarderFactoryContract =
      await relayRewarderFactoryArtifact.deploy(relayFactory.address);
    relayRewarderFactory = await ethers.getContractAt(
      "RelayRewarderFactory",
      relayRewarderFactoryContract.address
    );
    console.log("- RelayRewarderFactory Initialized");

    const distroFactoryArtifact = await ethers.getContractFactory(
      "RelayDistroFactory"
    );
    relayDistroFactory = await distroFactoryArtifact.deploy(
      relayFactory.address
    );
    console.log("- DistroFactory Initialized");

    const feeFlowFactoryArtifact = await ethers.getContractFactory(
      "RelayFeeFlowFactory"
    );
    relayFeeFlowFactory = await feeFlowFactoryArtifact.deploy(
      relayFactory.address
    );
    console.log("- FeeFlowFactory Initialized");

    // Set factories
    await relayFactory.setRelayTokenFactory(relayTokenFactory.address);
    await relayFactory.setRelayRewarderFactory(relayRewarderFactory.address);
    await relayFactory.setRelayDistroFactory(relayDistroFactory.address);
    await relayFactory.setRelayFeeFlowFactory(relayFeeFlowFactory.address);
    console.log("- Factories Set");

    // Initialize RelayMulticall
    const relayMulticallArtifact = await ethers.getContractFactory(
      "RelayMulticall"
    );
    const relayMulticallContract = await relayMulticallArtifact.deploy(
      relayFactory.address,
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address,
      voter.address
    );
    relayMulticall = await ethers.getContractAt(
      "RelayMulticall",
      relayMulticallContract.address
    );
    console.log("- RelayMulticall Initialized");

    // Create Relay
    await relayFactory.createRelay(
      "Profit Bero Relay",
      "profitBERO",
      "uri",
      "The profitBERO relay maxes out voting rewards.",
      BASE.address,
      oneHundred,
      ten
    );
    console.log("- RELAY Token deployed");

    // Initialize RelayToken
    let res = await relayFactory.connect(owner).index_Relay(0);
    relayToken = await ethers.getContractAt("RelayToken", res.relayToken);
    console.log("- relayToken Initialized at:", relayToken.address);

    relayRewarder = await ethers.getContractAt(
      "RelayRewarder",
      await relayRewarderFactory.connect(owner).lastRelayRewarder()
    );
    console.log("- relayRewarder Initialized");

    relayDistro = await ethers.getContractAt(
      "RelayDistro",
      await relayDistroFactory.connect(owner).lastRelayDistro()
    );
    console.log("- relayDistro Initialized");

    relayFeeFlow = await ethers.getContractAt(
      "RelayFeeFlow",
      await relayFeeFlowFactory.connect(owner).lastRelayFeeFlow()
    );
    console.log("- relayFeeFlow Initialized");

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

  it("RelayData", async function () {
    console.log("******************************************************");
    let res = await relayMulticall.getRelay(relayToken.address, user0.address);
    console.log(res);
  });

  it("User0 mints relayToken with 10 oTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user0).approve(relayMulticall.address, ten);
    await relayMulticall.connect(user0).mint(relayToken.address, ten);
    console.log(
      "User0 relayToken Balance: ",
      divDec(await relayToken.balanceOf(user0.address))
    );
  });

  it("RelayData", async function () {
    console.log("******************************************************");
    let res = await relayMulticall.getRelay(relayToken.address, user0.address);
    console.log(res);
  });

  it("User0 mints and deposits relayToken with 10 oTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user0).approve(relayMulticall.address, ten);
    await relayMulticall.connect(user0).mintAndDeposit(relayToken.address, ten);
    console.log(
      "User0 relayToken Balance: ",
      divDec(await relayToken.balanceOf(user0.address))
    );
    console.log(
      "User relayToken Staked: ",
      divDec(await relayRewarder.balanceOf(user0.address))
    );
  });

  it("RelayData", async function () {
    console.log("******************************************************");
    let res = await relayMulticall.getRelay(relayToken.address, user0.address);
    console.log(res);
  });

  it("User1 mints relayToken with five oTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user1).approve(relayMulticall.address, five);
    await relayMulticall.connect(user1).mint(relayToken.address, five);
    console.log(
      "User1 relayToken Balance: ",
      divDec(await relayToken.balanceOf(user1.address))
    );
  });

  it("Delegate sets votes", async function () {
    console.log("******************************************************");
    await relayToken
      .connect(owner)
      .setVotes(
        [plugin0.address, plugin1.address, plugin2.address, plugin3.address],
        [ten, ten, ten, ten]
      );
    console.log("Votes: ", await relayToken.connect(user0).getVote());
  });

  it("RelayData", async function () {
    console.log("******************************************************");
    let res = await relayMulticall.getRelay(relayToken.address, user0.address);
    console.log(res);
  });

  it("User1 mints and deposits relayToken with five oTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user1).approve(relayMulticall.address, five);
    await relayMulticall
      .connect(user1)
      .mintAndDeposit(relayToken.address, five);
    console.log(
      "User1 relayToken Balance: ",
      divDec(await relayToken.balanceOf(user1.address))
    );
  });

  it("User1 withdraws 5 relayToken", async function () {
    console.log("******************************************************");
    await relayRewarder
      .connect(user1)
      .withdraw(user1.address, await relayRewarder.balanceOf(user1.address));
    console.log(
      "User1 relayToken Balance: ",
      divDec(await relayToken.balanceOf(user1.address))
    );
  });

  it("RelayData", async function () {
    console.log("******************************************************");
    let res = await relayMulticall.getRelay(relayToken.address, user1.address);
    console.log(res);
  });

  it("User1 deposits 5 relayToken", async function () {
    console.log("******************************************************");
    await relayToken.connect(user1).approve(relayMulticall.address, five);
    await relayMulticall.connect(user1).deposit(relayToken.address, five);
    console.log(
      "User1 relayToken Balance: ",
      divDec(await relayToken.balanceOf(user1.address))
    );
  });

  it("RelayData", async function () {
    console.log("******************************************************");
    let res = await relayMulticall.getRelay(relayToken.address, user1.address);
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

  it("RelayToken balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(relayToken.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(relayToken.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(relayToken.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(relayToken.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(relayToken.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(relayToken.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(relayToken.address)));
  });

  it("RelayFeeFlow balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(relayFeeFlow.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(relayFeeFlow.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(relayFeeFlow.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(relayFeeFlow.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(relayFeeFlow.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(relayFeeFlow.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(relayFeeFlow.address)));
  });

  it("RelayDistro balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(relayDistro.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(relayDistro.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(relayDistro.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(relayDistro.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(relayDistro.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(relayDistro.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(relayDistro.address)));
  });

  it("AuctionData", async function () {
    console.log("******************************************************");
    let res = await relayMulticall.getAuction(relayToken.address);
    console.log(
      util.inspect(res, { showHidden: false, depth: null, colors: true })
    );
  });

  it("RelayFeeFlow buy", async function () {
    console.log("******************************************************");
    const price = await relayFeeFlow.getPrice();
    await BASE.connect(user1).approve(relayMulticall.address, price);
    await relayMulticall
      .connect(user1)
      .buyAuction(relayToken.address, 1792282187);
  });

  it("RelayToken balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(relayToken.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(relayToken.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(relayToken.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(relayToken.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(relayToken.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(relayToken.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(relayToken.address)));
  });

  it("RelayFeeFlow balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(relayFeeFlow.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(relayFeeFlow.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(relayFeeFlow.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(relayFeeFlow.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(relayFeeFlow.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(relayFeeFlow.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(relayFeeFlow.address)));
  });

  it("RelayDistro balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(relayDistro.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(relayDistro.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(relayDistro.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(relayDistro.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(relayDistro.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(relayDistro.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(relayDistro.address)));
  });

  it("RelayRewarder balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(relayRewarder.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(relayRewarder.address)));
    console.log(
      "oTOKEN",
      divDec(await OTOKEN.balanceOf(relayRewarder.address))
    );
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(relayRewarder.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(relayRewarder.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(relayRewarder.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(relayRewarder.address)));
  });

  it("RelayFeeFlow stats", async function () {
    console.log("******************************************************");
    console.log("Auction Price: ", divDec(await relayFeeFlow.getPrice()));
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
    let res = await relayMulticall.getAuction(relayToken.address);
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
    let res = await relayMulticall.getAuction(relayToken.address);
    console.log(
      util.inspect(res, { showHidden: false, depth: null, colors: true })
    );
  });

  it("RelayRewarder balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(relayRewarder.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(relayRewarder.address)));
    console.log(
      "oTOKEN",
      divDec(await OTOKEN.balanceOf(relayRewarder.address))
    );
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(relayRewarder.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(relayRewarder.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(relayRewarder.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(relayRewarder.address)));
  });

  it("RelayFeeFlow buy", async function () {
    console.log("******************************************************");
    const price = await relayFeeFlow.getPrice();
    await BASE.connect(owner).approve(relayMulticall.address, price);
    await relayMulticall
      .connect(owner)
      .buyAuction(relayToken.address, 1792282187);
  });

  it("RelayRewarder balances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(relayRewarder.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(relayRewarder.address)));
    console.log(
      "oTOKEN",
      divDec(await OTOKEN.balanceOf(relayRewarder.address))
    );
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(relayRewarder.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(relayRewarder.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(relayRewarder.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(relayRewarder.address)));
  });

  it("AuctionData", async function () {
    console.log("******************************************************");
    let res = await relayMulticall.getAuction(relayToken.address);
    console.log(
      util.inspect(res, { showHidden: false, depth: null, colors: true })
    );
  });

  it("RelayData", async function () {
    console.log("******************************************************");
    let res = await relayMulticall.getRelay(relayToken.address, user0.address);
    console.log(res);
  });

  it("User0 claim relay rewards", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(user0.address)));
    await relayRewarder.connect(user0).getReward(user0.address);
    console.log("BASE", divDec(await BASE.balanceOf(user0.address)));
  });

  it("Forward 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("User0 claim relay rewards", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(user0.address)));
    await relayRewarder.connect(user0).getReward(user0.address);
    console.log("BASE", divDec(await BASE.balanceOf(user0.address)));
  });
});
