// Test HorsePortfolioAgent
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🧪 Testing HorsePortfolioAgent...\n");
    console.log("=".repeat(60));
    
    const [deployer] = await ethers.getSigners();
    console.log("Tester:", deployer.address);
    console.log("");
    
    // Get contract addresses
    const HORSE_AGENT = process.env.HORSE_AGENT_ARC;
    const USDT = process.env.USDT;
    const FACTORY = process.env.FACTORY;
    
    if (!HORSE_AGENT || !USDT || !FACTORY) {
        console.error("❌ Missing contract addresses in .env");
        process.exit(1);
    }
    
    // Connect to contracts
    const agent = await ethers.getContractAt("HorsePortfolioAgent", HORSE_AGENT);
    const usdt = await ethers.getContractAt("IERC20", USDT);
    const factory = await ethers.getContractAt(
        "contracts/HorsePortfolioAgent.sol:IHorseSharesFactory",
        FACTORY
    );
    
    console.log("Horse Agent:", HORSE_AGENT);
    console.log("USDT:", USDT);
    console.log("Factory:", FACTORY);
    console.log("");
    
    // Check USDT balance
    const usdtBalance = await usdt.balanceOf(deployer.address);
    console.log("USDT Balance:", ethers.formatUnits(usdtBalance, 6), "USDT");
    
    if (usdtBalance < 100n * 10n**6n) {
        console.warn("⚠️  WARNING: Low USDT balance. You need at least 100 USDT to test.");
        console.log("You can get testnet USDT or deploy a mock USDT contract.");
        console.log("");
    }
    
    // Test 1: Update oracle data
    console.log("Test 1: Updating Oracle Data");
    console.log("-".repeat(60));
    
    const TEST_HORSE_ID = 18; // Change this to your tokenized horse ID
    const PERFORMANCE_SCORE = 75; // 75/100
    
    // Check if horse exists
    const isRegistered = await factory.isRegistered(TEST_HORSE_ID);
    if (!isRegistered) {
        console.error("❌ Horse ID", TEST_HORSE_ID, "not registered");
        process.exit(1);
    }
    
    console.log("Horse ID:", TEST_HORSE_ID);
    console.log("Performance Score:", PERFORMANCE_SCORE, "/100");
    
    try {
        const tx1 = await agent.updateOracleData(TEST_HORSE_ID, PERFORMANCE_SCORE);
        console.log("Transaction hash:", tx1.hash);
        await tx1.wait();
        console.log("✅ Oracle data updated!");
        console.log("");
        
        // Check oracle data
        const oracleData = await agent.oracleCache(TEST_HORSE_ID);
        console.log("Oracle Data:");
        console.log("  Horse ID:", oracleData.horseId.toString());
        console.log("  Performance Score:", oracleData.performanceScore.toString());
        console.log("  Timestamp:", new Date(Number(oracleData.timestamp) * 1000).toLocaleString());
        console.log("  Is Valid:", oracleData.isValid);
        console.log("");
        
        // Check if stale
        const isStale = await agent.isOracleDataStale(TEST_HORSE_ID);
        console.log("Oracle Data Stale:", isStale);
        console.log("");
        
    } catch (error) {
        console.error("❌ Oracle update failed:", error.message);
        console.log("You may not be the authorized oracle.");
        console.log("");
    }
    
    // Test 2: Execute investment (if we have USDT)
    if (usdtBalance >= 100n * 10n**6n) {
        console.log("Test 2: Executing Investment");
        console.log("-".repeat(60));
        
        const investmentAmount = 100n * 10n**6n; // 100 USDT
        console.log("Investment Amount:", ethers.formatUnits(investmentAmount, 6), "USDT");
        
        try {
            // First, transfer USDT to agent
            console.log("Transferring USDT to agent...");
            const tx2 = await usdt.transfer(HORSE_AGENT, investmentAmount);
            await tx2.wait();
            console.log("✅ USDT transferred to agent");
            console.log("");
            
            // Check agent's USDT balance
            const agentBalance = await usdt.balanceOf(HORSE_AGENT);
            console.log("Agent USDT Balance:", ethers.formatUnits(agentBalance, 6), "USDT");
            console.log("");
            
            // Execute investment
            console.log("Executing investment...");
            const tx3 = await agent.executeInvestment(TEST_HORSE_ID, investmentAmount);
            console.log("Transaction hash:", tx3.hash);
            const receipt = await tx3.wait();
            console.log("✅ Investment executed!");
            console.log("Gas used:", receipt.gasUsed.toString());
            console.log("");
            
            // Check position
            const position = await agent.getPosition(TEST_HORSE_ID);
            console.log("Position Details:");
            console.log("  Horse ID:", position.horseId.toString());
            console.log("  Share Token:", position.shareToken);
            console.log("  Shares:", ethers.formatEther(position.shares));
            console.log("  Cost Basis:", ethers.formatUnits(position.costBasis, 6), "USDT");
            console.log("  Last Update:", new Date(Number(position.lastUpdate) * 1000).toLocaleString());
            console.log("");
            
        } catch (error) {
            console.error("❌ Investment failed:", error.message);
            console.log("");
            console.log("Common issues:");
            console.log("- Strategy not active");
            console.log("- Oracle data stale");
            console.log("- Performance score too low");
            console.log("- Horse already graduated");
            console.log("");
        }
    } else {
        console.log("⏭️  Skipping investment test (insufficient USDT)");
        console.log("");
    }
    
    // Test 3: Check portfolio
    console.log("Test 3: Checking Portfolio");
    console.log("-".repeat(60));
    
    const portfolioSize = await agent.getPortfolioSize();
    console.log("Portfolio Size:", portfolioSize.toString(), "horses");
    
    if (portfolioSize > 0n) {
        const horses = await agent.getPortfolioHorses();
        console.log("Portfolio Horses:", horses.map(h => h.toString()).join(", "));
        
        const [totalShares, invested] = await agent.getPortfolioValue();
        console.log("Total Shares:", ethers.formatEther(totalShares));
        console.log("Total Invested:", ethers.formatUnits(invested, 6), "USDT");
    }
    console.log("");
    
    console.log("=".repeat(60));
    console.log("");
    console.log("✅ Portfolio Agent Tests Complete!");
    console.log("");
    console.log("💡 To test full flow:");
    console.log("1. Fund agent with USDT");
    console.log("2. Update oracle data for multiple horses");
    console.log("3. Execute investments based on scores");
    console.log("4. Monitor portfolio performance");
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
