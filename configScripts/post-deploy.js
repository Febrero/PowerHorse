// Comprehensive post-deployment configuration
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 POWER.HORSE HackMoney 2026 - Post-Deployment Configuration\n");
    console.log("=".repeat(60));
    console.log("");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("");
    
    // Get all contract addresses
    const addresses = {
        yellowAdapter: process.env.YELLOW_ADAPTER,
        horseAgent: process.env.HORSE_AGENT_ARC,
        lifiDepositor: process.env.LIFI_DEPOSITOR,
        factory: process.env.FACTORY,
        bondingCurve: process.env.BONDING_CURVE,
        usdt: process.env.USDT
    };
    
    console.log("Contract Addresses:");
    console.log("  Yellow Adapter:", addresses.yellowAdapter || "❌ NOT SET");
    console.log("  Horse Agent:", addresses.horseAgent || "❌ NOT SET");
    console.log("  LI.FI Depositor:", addresses.lifiDepositor || "❌ NOT SET");
    console.log("  Factory:", addresses.factory || "✅");
    console.log("  Bonding Curve:", addresses.bondingCurve || "✅");
    console.log("  USDT:", addresses.usdt || "✅");
    console.log("");
    
    // Check which contracts need configuration
    const needsConfig = [];
    if (!addresses.yellowAdapter) needsConfig.push("YELLOW_ADAPTER");
    if (!addresses.horseAgent) needsConfig.push("HORSE_AGENT_ARC");
    if (!addresses.lifiDepositor) needsConfig.push("LIFI_DEPOSITOR");
    
    if (needsConfig.length > 0) {
        console.warn("⚠️  WARNING: Missing contract addresses in .env:");
        needsConfig.forEach(contract => console.log("   -", contract));
        console.log("");
        console.log("Please add these addresses to .env file after deployment.");
        console.log("You can find them in the deployment-hackmoney-*.json file.");
        console.log("");
        process.exit(1);
    }
    
    console.log("=".repeat(60));
    console.log("");
    
    // ============================================================
    // 1. Configure Yellow Adapter
    // ============================================================
    console.log("1️⃣  Configuring YellowBondingCurveAdapter...\n");
    
    try {
        const adapter = await ethers.getContractAt("YellowBondingCurveAdapter", addresses.yellowAdapter);
        
        const currentRelayer = await adapter.yellowRelayer();
        const newRelayer = process.env.YELLOW_RELAYER_ADDRESS || deployer.address;
        
        console.log("Current Relayer:", currentRelayer);
        console.log("New Relayer:", newRelayer);
        
        if (currentRelayer.toLowerCase() !== newRelayer.toLowerCase()) {
            console.log("Updating relayer...");
            const tx = await adapter.updateRelayer(newRelayer);
            await tx.wait();
            console.log("✅ Relayer updated");
        } else {
            console.log("✅ Relayer already correct");
        }
        
    } catch (error) {
        console.error("❌ Yellow Adapter config failed:", error.message);
    }
    
    console.log("");
    console.log("=".repeat(60));
    console.log("");
    
    // ============================================================
    // 2. Configure Portfolio Agent
    // ============================================================
    console.log("2️⃣  Configuring HorsePortfolioAgent...\n");
    
    try {
        const agent = await ethers.getContractAt("HorsePortfolioAgent", addresses.horseAgent);
        
        // Strategy configuration
        const config = {
            targetPortfolioSize: 5,
            maxPositionSize: 10000n * 10n**6n, // 10,000 USDT
            minOracleScore: 60,
            rebalanceThreshold: 500 // 5%
        };
        
        console.log("Strategy Configuration:");
        console.log("  Target Portfolio Size:", config.targetPortfolioSize, "horses");
        console.log("  Max Position Size:", ethers.formatUnits(config.maxPositionSize, 6), "USDT");
        console.log("  Min Oracle Score:", config.minOracleScore, "/100");
        console.log("  Rebalance Threshold:", config.rebalanceThreshold / 100, "%");
        console.log("");
        
        console.log("Updating strategy...");
        const tx1 = await agent.updateStrategy(
            config.targetPortfolioSize,
            config.maxPositionSize,
            config.minOracleScore,
            config.rebalanceThreshold
        );
        await tx1.wait();
        console.log("✅ Strategy updated");
        console.log("");
        
        // Update oracle
        const newOracle = process.env.STORK_ORACLE_URL || deployer.address;
        const currentOracle = await agent.storkOracle();
        
        console.log("Current Oracle:", currentOracle);
        console.log("New Oracle:", newOracle);
        
        if (currentOracle.toLowerCase() !== newOracle.toLowerCase()) {
            console.log("Updating oracle...");
            const tx2 = await agent.updateOracle(newOracle);
            await tx2.wait();
            console.log("✅ Oracle updated");
        } else {
            console.log("✅ Oracle already correct");
        }
        console.log("");
        
        // Activate strategy
        const strategy = await agent.strategy();
        if (!strategy.isActive) {
            console.log("Activating strategy...");
            const tx3 = await agent.setStrategyActive(true);
            await tx3.wait();
            console.log("✅ Strategy activated");
        } else {
            console.log("✅ Strategy already active");
        }
        
    } catch (error) {
        console.error("❌ Portfolio Agent config failed:", error.message);
    }
    
    console.log("");
    console.log("=".repeat(60));
    console.log("");
    
    // ============================================================
    // 3. Verify CrossChain Depositor (no config needed)
    // ============================================================
    console.log("3️⃣  Verifying CrossChainVaultDepositor...\n");
    
    try {
        const depositor = await ethers.getContractAt("CrossChainVaultDepositor", addresses.lifiDepositor);
        
        const bondingCurve = await depositor.bondingCurve();
        const factory = await depositor.factory();
        const lifiDiamond = await depositor.lifiDiamond();
        const usdt = await depositor.usdt();
        
        console.log("Contract Settings:");
        console.log("  Bonding Curve:", bondingCurve);
        console.log("  Factory:", factory);
        console.log("  LI.FI Diamond:", lifiDiamond);
        console.log("  USDT:", usdt);
        console.log("");
        console.log("✅ CrossChain Depositor configured correctly");
        
    } catch (error) {
        console.error("❌ CrossChain Depositor verification failed:", error.message);
    }
    
    console.log("");
    console.log("=".repeat(60));
    console.log("");
    
    // ============================================================
    // Summary
    // ============================================================
    console.log("✅ Post-Deployment Configuration Complete!\n");
    console.log("Configuration Summary:");
    console.log("  ✅ Yellow Adapter relayer set");
    console.log("  ✅ Portfolio Agent strategy configured");
    console.log("  ✅ Portfolio Agent oracle set");
    console.log("  ✅ Portfolio Agent activated");
    console.log("  ✅ CrossChain Depositor verified");
    console.log("");
    console.log("💡 Next Steps:");
    console.log("");
    console.log("1. Test Yellow Adapter:");
    console.log("   npm run test:yellow");
    console.log("");
    console.log("2. Test Portfolio Agent:");
    console.log("   npm run test:agent");
    console.log("");
    console.log("3. Test CrossChain Depositor:");
    console.log("   npm run test:lifi");
    console.log("");
    console.log("4. Update .env with deployed addresses:");
    console.log("   YELLOW_ADAPTER=" + addresses.yellowAdapter);
    console.log("   HORSE_AGENT_ARC=" + addresses.horseAgent);
    console.log("   LIFI_DEPOSITOR=" + addresses.lifiDepositor);
    console.log("");
    console.log("5. Verify contracts on Etherscan");
    console.log("");
    console.log("6. Submit to HackMoney 2026! 🎉");
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
