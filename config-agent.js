// Configure HorsePortfolioAgent after deployment
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🤖 Configuring HorsePortfolioAgent...\n");
    console.log("=".repeat(60));
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("");
    
    // Get deployed contract address
    const HORSE_AGENT = process.env.HORSE_AGENT_ARC;
    if (!HORSE_AGENT) {
        console.error("❌ ERROR: HORSE_AGENT_ARC not found in .env");
        console.log("Please add: HORSE_AGENT_ARC=0xYourDeployedAddress");
        process.exit(1);
    }
    
    console.log("Horse Agent Address:", HORSE_AGENT);
    console.log("");
    
    // Connect to contract
    const agent = await ethers.getContractAt("HorsePortfolioAgent", HORSE_AGENT);
    
    // Check current settings
    const strategy = await agent.strategy();
    console.log("Current Strategy:");
    console.log("  Target Portfolio Size:", strategy.targetPortfolioSize.toString());
    console.log("  Max Position Size:", ethers.formatUnits(strategy.maxPositionSize, 6), "USDT");
    console.log("  Min Oracle Score:", strategy.minOracleScore.toString());
    console.log("  Rebalance Threshold:", strategy.rebalanceThreshold.toString(), "BPS");
    console.log("  Is Active:", strategy.isActive);
    console.log("");
    
    // Configuration parameters
    const config = {
        targetPortfolioSize: 5,           // Hold 5 different horses
        maxPositionSize: 10000n * 10n**6n, // 10,000 USDT per horse
        minOracleScore: 60,               // Minimum performance score 60/100
        rebalanceThreshold: 500           // 5% rebalance threshold
    };
    
    console.log("📝 New Strategy Configuration:");
    console.log("  Target Portfolio Size:", config.targetPortfolioSize, "horses");
    console.log("  Max Position Size:", ethers.formatUnits(config.maxPositionSize, 6), "USDT");
    console.log("  Min Oracle Score:", config.minOracleScore, "/100");
    console.log("  Rebalance Threshold:", config.rebalanceThreshold / 100, "%");
    console.log("");
    
    // Update strategy
    console.log("🔄 Updating strategy...");
    const tx1 = await agent.updateStrategy(
        config.targetPortfolioSize,
        config.maxPositionSize,
        config.minOracleScore,
        config.rebalanceThreshold
    );
    console.log("Transaction hash:", tx1.hash);
    await tx1.wait();
    console.log("✅ Strategy updated!");
    console.log("");
    
    // Update oracle
    const STORK_ORACLE = process.env.STORK_ORACLE_URL || deployer.address;
    const currentOracle = await agent.storkOracle();
    
    console.log("Current Oracle:", currentOracle);
    console.log("New Oracle:", STORK_ORACLE);
    
    if (currentOracle.toLowerCase() !== STORK_ORACLE.toLowerCase()) {
        console.log("🔄 Updating oracle...");
        const tx2 = await agent.updateOracle(STORK_ORACLE);
        console.log("Transaction hash:", tx2.hash);
        await tx2.wait();
        console.log("✅ Oracle updated!");
    } else {
        console.log("✅ Oracle already set correctly");
    }
    console.log("");
    
    // Activate strategy if not active
    const updatedStrategy = await agent.strategy();
    if (!updatedStrategy.isActive) {
        console.log("🔄 Activating strategy...");
        const tx3 = await agent.setStrategyActive(true);
        console.log("Transaction hash:", tx3.hash);
        await tx3.wait();
        console.log("✅ Strategy activated!");
        console.log("");
    }
    
    console.log("=".repeat(60));
    console.log("");
    console.log("✅ Portfolio Agent Configuration Complete!");
    console.log("");
    console.log("Final Settings:");
    const finalStrategy = await agent.strategy();
    console.log("  Portfolio Size:", finalStrategy.targetPortfolioSize.toString(), "horses");
    console.log("  Max Position:", ethers.formatUnits(finalStrategy.maxPositionSize, 6), "USDT");
    console.log("  Min Score:", finalStrategy.minOracleScore.toString(), "/100");
    console.log("  Rebalance Threshold:", (Number(finalStrategy.rebalanceThreshold) / 100).toFixed(2), "%");
    console.log("  Active:", finalStrategy.isActive);
    console.log("  Oracle:", await agent.storkOracle());
    console.log("");
    console.log("💡 Next Steps:");
    console.log("1. Update oracle data for horses");
    console.log("2. Fund agent with USDT for investments");
    console.log("3. Execute test investment");
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
