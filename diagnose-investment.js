// Diagnostic script to check investment failure
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🔍 Diagnosing Investment Failure...\n");
    console.log("=".repeat(60));
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("");
    
    // Get addresses
    const HORSE_AGENT = process.env.HORSE_AGENT_ARC;
    const BONDING_CURVE = process.env.BONDING_CURVE;
    const FACTORY = process.env.FACTORY;
    const USDT = process.env.USDT;
    const TEST_HORSE_ID = 18;
    
    console.log("Addresses:");
    console.log("  Horse Agent:", HORSE_AGENT);
    console.log("  Bonding Curve:", BONDING_CURVE);
    console.log("  Factory:", FACTORY);
    console.log("  USDT:", USDT);
    console.log("");
    
    // Connect to contracts
    const agent = await ethers.getContractAt("HorsePortfolioAgent", HORSE_AGENT);
    const bondingCurve = await ethers.getContractAt(
        "contracts/HorsePortfolioAgent.sol:IBondingCurve",
        BONDING_CURVE
    );
    const factory = await ethers.getContractAt(
        "contracts/HorsePortfolioAgent.sol:IHorseSharesFactory",
        FACTORY
    );
    const usdt = await ethers.getContractAt("IERC20", USDT);
    
    // Get share token
    const [shareToken, vault] = await factory.getHorseContracts(TEST_HORSE_ID);
    console.log("Horse ID:", TEST_HORSE_ID);
    console.log("Share Token:", shareToken);
    console.log("Vault:", vault);
    console.log("");
    
    // Check 1: Horse graduated?
    console.log("Check 1: Graduation Status");
    console.log("-".repeat(60));
    try {
        const hasGraduated = await bondingCurve.hasGraduated(shareToken);
        console.log("Has Graduated:", hasGraduated);
        if (hasGraduated) {
            console.log("❌ PROBLEM: Horse has already graduated!");
            console.log("   You cannot buy shares of graduated horses.");
        } else {
            console.log("✅ Horse has not graduated");
        }
    } catch (e) {
        console.log("❌ Error checking graduation:", e.message);
    }
    console.log("");
    
    // Check 2: Shares sold
    console.log("Check 2: Shares Sold");
    console.log("-".repeat(60));
    try {
        const sharesSold = await bondingCurve.sharesSold(shareToken);
        console.log("Shares Sold:", ethers.formatEther(sharesSold));
        console.log("Graduation Threshold:", "800,000,000 (800M)");
        
        const remaining = 800_000_000n * 10n**18n - sharesSold;
        console.log("Remaining Available:", ethers.formatEther(remaining));
        
        if (sharesSold >= 800_000_000n * 10n**18n) {
            console.log("❌ PROBLEM: No shares available (sold out)");
        } else {
            console.log("✅ Shares still available");
        }
    } catch (e) {
        console.log("❌ Error checking shares sold:", e.message);
    }
    console.log("");
    
    // Check 3: Calculate price
    console.log("Check 3: Price Calculation");
    console.log("-".repeat(60));
    const testAmount = 100_000n * 10n**18n; // 100k shares
    try {
        const [cost, fee] = await bondingCurve.calculateBuyPrice(shareToken, testAmount);
        const totalCost = cost + fee;
        console.log("For", ethers.formatEther(testAmount), "shares:");
        console.log("  Cost:", ethers.formatUnits(cost, 6), "USDT");
        console.log("  Fee (35%):", ethers.formatUnits(fee, 6), "USDT");
        console.log("  Total:", ethers.formatUnits(totalCost, 6), "USDT");
        console.log("✅ Price calculation works");
    } catch (e) {
        console.log("❌ Error calculating price:", e.message);
    }
    console.log("");
    
    // Check 4: Agent USDT balance and allowance
    console.log("Check 4: Agent USDT Status");
    console.log("-".repeat(60));
    try {
        const agentBalance = await usdt.balanceOf(HORSE_AGENT);
        console.log("Agent USDT Balance:", ethers.formatUnits(agentBalance, 6), "USDT");
        
        const allowance = await usdt.allowance(HORSE_AGENT, BONDING_CURVE);
        console.log("Allowance to Bonding Curve:", ethers.formatUnits(allowance, 6), "USDT");
        
        if (agentBalance === 0n) {
            console.log("❌ PROBLEM: Agent has no USDT");
        } else if (allowance === 0n) {
            console.log("⚠️  WARNING: Agent has not approved bonding curve");
        } else {
            console.log("✅ Agent has USDT and approval");
        }
    } catch (e) {
        console.log("❌ Error checking agent status:", e.message);
    }
    console.log("");
    
    // Check 5: Strategy active?
    console.log("Check 5: Strategy Status");
    console.log("-".repeat(60));
    try {
        const strategy = await agent.strategy();
        console.log("Strategy Active:", strategy.isActive);
        console.log("Min Oracle Score:", strategy.minOracleScore.toString());
        console.log("Max Position Size:", ethers.formatUnits(strategy.maxPositionSize, 6), "USDT");
        
        if (!strategy.isActive) {
            console.log("❌ PROBLEM: Strategy is not active");
        } else {
            console.log("✅ Strategy is active");
        }
    } catch (e) {
        console.log("❌ Error checking strategy:", e.message);
    }
    console.log("");
    
    // Check 6: Oracle data
    console.log("Check 6: Oracle Data");
    console.log("-".repeat(60));
    try {
        const oracleData = await agent.oracleCache(TEST_HORSE_ID);
        const isStale = await agent.isOracleDataStale(TEST_HORSE_ID);
        
        console.log("Oracle Score:", oracleData.performanceScore.toString(), "/100");
        console.log("Is Valid:", oracleData.isValid);
        console.log("Is Stale:", isStale);
        console.log("Timestamp:", new Date(Number(oracleData.timestamp) * 1000).toLocaleString());
        
        if (!oracleData.isValid) {
            console.log("❌ PROBLEM: Oracle data is not valid");
        } else if (isStale) {
            console.log("❌ PROBLEM: Oracle data is stale (>1 hour old)");
        } else if (oracleData.performanceScore < 60) {
            console.log("❌ PROBLEM: Performance score too low (<60)");
        } else {
            console.log("✅ Oracle data is valid and fresh");
        }
    } catch (e) {
        console.log("❌ Error checking oracle:", e.message);
    }
    console.log("");
    
    // Check 7: Try to simulate the purchase
    console.log("Check 7: Simulating Purchase");
    console.log("-".repeat(60));
    console.log("Attempting to call executeInvestment...");
    
    try {
        // This will fail but show us the exact error
        const tx = await agent.executeInvestment.staticCall(TEST_HORSE_ID, 100n * 10n**6n);
        console.log("✅ Simulation succeeded! Investment should work.");
    } catch (e) {
        console.log("❌ Simulation failed with error:");
        console.log("");
        console.log(e.message);
        console.log("");
        
        // Try to parse the error
        if (e.message.includes("StrategyInactive")) {
            console.log("💡 FIX: Strategy is not active. Run config-agent.js");
        } else if (e.message.includes("OracleDataStale")) {
            console.log("💡 FIX: Oracle data is stale. Update oracle data.");
        } else if (e.message.includes("ScoreTooLow")) {
            console.log("💡 FIX: Performance score is below minimum.");
        } else if (e.message.includes("GraduatedToken")) {
            console.log("💡 FIX: Horse has graduated. Choose a different horse.");
        } else if (e.message.includes("InsufficientFunds")) {
            console.log("💡 FIX: Agent doesn't have enough USDT.");
        } else if (e.message.includes("PortfolioFull")) {
            console.log("💡 FIX: Portfolio already has max number of horses.");
        } else if (e.message.includes("Graduated")) {
            console.log("💡 FIX: Horse has graduated from bonding curve.");
        } else if (e.message.includes("NotInitialized")) {
            console.log("💡 FIX: Share token not initialized in bonding curve.");
        } else {
            console.log("💡 Check the error message above for clues.");
        }
    }
    console.log("");
    
    console.log("=".repeat(60));
    console.log("");
    console.log("✅ Diagnostic Complete!");
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
