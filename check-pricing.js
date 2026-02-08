// Check Horse 18 appraisal and pricing details
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🔍 Investigating Horse 18 Pricing...\n");
    console.log("=".repeat(60));
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("");
    
    const BONDING_CURVE = process.env.BONDING_CURVE;
    const FACTORY = process.env.FACTORY;
    const TEST_HORSE_ID = 18;
    
    // Connect to contracts
    const bondingCurve = await ethers.getContractAt(
        "contracts/IBondingCurve.sol:IBondingCurve",
        BONDING_CURVE
    );
    const factory = await ethers.getContractAt(
        "contracts/YellowBondingCurveAdapter.sol:IHorseSharesFactory",
        FACTORY
    );
    
    // Get share token
    const [shareToken, vault] = await factory.getHorseContracts(TEST_HORSE_ID);
    console.log("Horse ID:", TEST_HORSE_ID);
    console.log("Share Token:", shareToken);
    console.log("");
    
    // Get appraisal value (this is the key!)
    const appraisalValue = await bondingCurve.appraisalValue(shareToken);
    console.log("🐴 APPRAISAL VALUE (RAW):", appraisalValue.toString());
    
    // Try to interpret it
    console.log("");
    console.log("Interpreting appraisal value:");
    console.log("-".repeat(60));
    
    // As ETH (18 decimals)
    const asETH = ethers.formatEther(appraisalValue);
    console.log("As ETH (18 decimals):", asETH, "ETH");
    
    // As USDT (6 decimals)
    const asUSDT = ethers.formatUnits(appraisalValue, 6);
    console.log("As USDT (6 decimals):", asUSDT, "USDT");
    
    // As raw number
    const asNumber = Number(appraisalValue);
    console.log("As raw number:", asNumber.toLocaleString());
    console.log("");
    
    // Get shares sold
    const sharesSold = await bondingCurve.sharesSold(shareToken);
    console.log("📊 SHARES SOLD:", ethers.formatEther(sharesSold));
    console.log("");
    
    // Calculate current price per share
    const currentPrice = await bondingCurve.getCurrentPrice(shareToken);
    console.log("💰 CURRENT PRICE PER SHARE (RAW):", currentPrice.toString());
    console.log("As ETH:", ethers.formatEther(currentPrice), "ETH per share");
    console.log("As USDT:", ethers.formatUnits(currentPrice, 6), "USDT per share");
    console.log("");
    
    // Calculate cost for different amounts
    console.log("📈 COST CALCULATIONS:");
    console.log("-".repeat(60));
    
    const testAmounts = [
        1n * 10n**18n,      // 1 share
        10n * 10n**18n,     // 10 shares
        100n * 10n**18n,    // 100 shares
        1000n * 10n**18n,   // 1000 shares
    ];
    
    for (const amount of testAmounts) {
        try {
            const [cost, fee] = await bondingCurve.calculateBuyPrice(shareToken, amount);
            const totalCost = cost + fee;
            
            console.log(`\nFor ${ethers.formatEther(amount)} shares:`);
            console.log(`  Cost: ${cost.toString()}`);
            console.log(`  As ETH: ${ethers.formatEther(totalCost)} ETH`);
            console.log(`  As USDT: ${ethers.formatUnits(totalCost, 6)} USDT`);
        } catch (e) {
            console.log(`\nFor ${ethers.formatEther(amount)} shares: ERROR - ${e.message}`);
        }
    }
    
    console.log("");
    console.log("=".repeat(60));
    console.log("");
    
    // Figure out what 100 USDT can buy
    console.log("💵 WHAT CAN 100 USDT BUY?");
    console.log("-".repeat(60));
    
    const budget = 100n * 10n**6n; // 100 USDT (6 decimals)
    console.log("Budget:", ethers.formatUnits(budget, 6), "USDT");
    console.log("");
    
    // Binary search to find max shares
    let low = 1n;
    let high = 1000000n * 10n**18n; // 1M shares
    let bestShares = 0n;
    let bestCost = 0n;
    
    for (let i = 0; i < 30; i++) {
        const mid = (low + high) / 2n;
        try {
            const [cost, fee] = await bondingCurve.calculateBuyPrice(shareToken, mid);
            const totalCost = cost + fee;
            
            if (totalCost <= budget) {
                bestShares = mid;
                bestCost = totalCost;
                low = mid + 1n;
            } else {
                high = mid - 1n;
            }
        } catch (e) {
            high = mid - 1n;
        }
    }
    
    if (bestShares > 0n) {
        console.log("✅ You CAN afford:");
        console.log("  Shares:", ethers.formatEther(bestShares));
        console.log("  Cost:", ethers.formatUnits(bestCost, 6), "USDT");
    } else {
        console.log("❌ Cannot afford even 1 share with 100 USDT!");
        console.log("   Horse is too expensive.");
    }
    
    console.log("");
    console.log("=".repeat(60));
    console.log("");
    console.log("💡 ANALYSIS:");
    console.log("");
    
    if (asNumber > 1000000) {
        console.log("The appraisal value appears to be in ETH units (18 decimals).");
        console.log("Actual appraisal:", asETH, "ETH");
        console.log("");
        console.log("⚠️  ISSUE: Prices are calculated in ETH, but you're paying in USDT!");
        console.log("   This creates a unit mismatch problem.");
        console.log("");
        console.log("🔧 SOLUTION: The horse needs to be appraised in USDT units,");
        console.log("   OR the BondingCurve needs to convert ETH prices to USDT.");
    } else {
        console.log("The appraisal value appears to be in USDT units (6 decimals).");
        console.log("Actual appraisal:", asUSDT, "USDT");
    }
    
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
