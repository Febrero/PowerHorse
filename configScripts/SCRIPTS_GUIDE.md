# 🎬 Post-Deployment Scripts Guide

Complete guide for configuring and testing your HackMoney 2026 contracts after deployment.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Configuration Scripts](#configuration-scripts)
3. [Testing Scripts](#testing-scripts)
4. [Script Reference](#script-reference)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Step 1: Deploy All Contracts

```bash
npm run deploy
```

This creates a `deployment-hackmoney-[timestamp].json` file with all contract addresses.

### Step 2: Update .env

Add the deployed addresses to your `.env` file:

```env
# Add these after deployment
YELLOW_ADAPTER=0xYourYellowAdapterAddress
HORSE_AGENT_ARC=0xYourHorseAgentAddress
LIFI_DEPOSITOR=0xYourLiFiDepositorAddress
```

### Step 3: Run Post-Deployment Configuration

```bash
npm run config
```

This configures all three contracts automatically.

### Step 4: Test Everything

```bash
npm run test:yellow
npm run test:agent
npm run test:lifi
```

---

## ⚙️ Configuration Scripts

### 1. Configure All Contracts (Recommended)

```bash
npm run config
```

**What it does:**
- ✅ Sets Yellow Network relayer
- ✅ Configures Portfolio Agent strategy
- ✅ Sets Stork oracle address
- ✅ Activates Portfolio Agent
- ✅ Verifies CrossChain Depositor

**Script:** `post-deploy.js`

---

### 2. Configure Yellow Adapter Only

```bash
npm run config:yellow
```

**What it does:**
- Updates the Yellow Network relayer address
- Displays current configuration

**Environment Variables:**
```env
YELLOW_ADAPTER=0x...           # Required
YELLOW_RELAYER_ADDRESS=0x...   # Optional (defaults to deployer)
```

**Script:** `config-yellow.js`

**Example Output:**
```
🔧 Configuring YellowBondingCurveAdapter...
Current Relayer: 0x3a347b9762B80731fF98f10600F3f3AaD6361cc9
📝 Updating relayer to: 0xNewRelayerAddress
✅ Relayer updated successfully!
```

---

### 3. Configure Portfolio Agent Only

```bash
npm run config:agent
```

**What it does:**
- Sets investment strategy parameters
- Updates Stork oracle address
- Activates the agent

**Default Strategy:**
- Target Portfolio: 5 horses
- Max Position: 10,000 USDT per horse
- Min Score: 60/100
- Rebalance Threshold: 5%

**Environment Variables:**
```env
HORSE_AGENT_ARC=0x...         # Required
STORK_ORACLE_URL=0x...        # Optional (defaults to deployer)
```

**Script:** `config-agent.js`

**Example Output:**
```
🤖 Configuring HorsePortfolioAgent...
📝 New Strategy Configuration:
  Target Portfolio Size: 5 horses
  Max Position Size: 10000 USDT
  Min Oracle Score: 60 /100
  Rebalance Threshold: 5 %
✅ Strategy updated!
✅ Oracle updated!
✅ Strategy activated!
```

---

## 🧪 Testing Scripts

### 1. Test Yellow Adapter

```bash
npm run test:yellow
```

**What it tests:**
- Opening a trading session
- Checking session status
- Cancelling a session
- Refund handling

**Requirements:**
- At least 0.01 ETH in deployer wallet
- A tokenized horse (Horse ID 1 by default)

**Script:** `test-yellow.js`

**Example Output:**
```
🧪 Testing YellowBondingCurveAdapter...

Test 1: Opening Trading Session
Session Amount: 0.01 ETH
✅ Session opened successfully!

Session Details:
  User: 0x3a347b9762B80731fF98f10600F3f3AaD6361cc9
  Locked Amount: 0.01 ETH
  Expiry: 2/7/2026, 11:30:00 PM
  Active: true

Test 2: Checking Session Status
Session Expired: false

Test 3: Cancelling Session
✅ Session cancelled!
Refunded: 0.0098 ETH (minus gas)
```

---

### 2. Test Portfolio Agent

```bash
npm run test:agent
```

**What it tests:**
- Updating oracle data
- Executing investments
- Checking portfolio positions

**Requirements:**
- At least 1000 USDT in deployer wallet
- A tokenized horse (Horse ID 1 by default)

**Script:** `test-agent.js`

**Example Output:**
```
🧪 Testing HorsePortfolioAgent...

Test 1: Updating Oracle Data
Horse ID: 1
Performance Score: 75 /100
✅ Oracle data updated!

Test 2: Executing Investment
Investment Amount: 1000 USDT
✅ USDT transferred to agent
✅ Investment executed!

Position Details:
  Horse ID: 1
  Shares: 1234567.89
  Cost Basis: 1000 USDT

Test 3: Checking Portfolio
Portfolio Size: 1 horses
Total Invested: 1000 USDT
```

---

### 3. Test CrossChain Depositor

```bash
npm run test:lifi
```

**What it tests:**
- Creating deposit intents
- Getting intent details
- Executing deposits (simulating LI.FI)
- Share estimation

**Requirements:**
- At least 1000 USDT in deployer wallet
- A tokenized horse (Horse ID 1 by default)

**Script:** `test-lifi.js`

**Example Output:**
```
🧪 Testing CrossChainVaultDepositor...

Test 1: Creating Deposit Intent
Deposit Amount: 1000 USDT
Min Shares: 1000000
✅ USDT approved
✅ Intent created!
Intent ID: 0x1234...

Test 2: Getting Intent Details
Intent Details:
  User: 0x3a347b9762B80731fF98f10600F3f3AaD6361cc9
  Horse ID: 1
  USDT Amount: 1000 USDT
  Completed: false

Test 3: Executing Intent (simulating LI.FI)
✅ Intent executed!
Intent Completed: true
```

---

## 📚 Script Reference

### All Available Scripts

| Command | Description | Script File |
|---------|-------------|-------------|
| `npm run deploy` | Deploy all contracts | `deploy-all.js` |
| `npm run deploy:yellow` | Deploy Yellow Adapter only | `deploy-yellow.js` |
| `npm run deploy:agent` | Deploy Portfolio Agent only | `deploy-agent.js` |
| `npm run deploy:lifi` | Deploy CrossChain Depositor only | `deploy-lifi.js` |
| `npm run config` | Configure all contracts | `post-deploy.js` |
| `npm run config:yellow` | Configure Yellow Adapter | `config-yellow.js` |
| `npm run config:agent` | Configure Portfolio Agent | `config-agent.js` |
| `npm run test:yellow` | Test Yellow Adapter | `test-yellow.js` |
| `npm run test:agent` | Test Portfolio Agent | `test-agent.js` |
| `npm run test:lifi` | Test CrossChain Depositor | `test-lifi.js` |

---

## 🔧 Environment Variables Required

### For Deployment
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_API_KEY  # Optional

# Core contracts (already deployed)
BONDING_CURVE=0x35A4100EaF2A36aE26612d86dbbcC81AC6EC72AA
FACTORY=0x0A40b15FF02B0043Eaf276e5C97e3e65994Aaf1d
USDT=0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0
LIFI_DIAMOND=0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE
```

### After Deployment (add these)
```env
YELLOW_ADAPTER=0x...           # From deployment output
HORSE_AGENT_ARC=0x...          # From deployment output
LIFI_DEPOSITOR=0x...           # From deployment output
```

### Optional Configuration
```env
YELLOW_RELAYER_ADDRESS=0x...   # Yellow Network relayer (defaults to deployer)
STORK_ORACLE_URL=0x...         # Stork oracle address (defaults to deployer)
```

---

## 🐛 Troubleshooting

### "Contract address not found in .env"

**Problem:** Script can't find deployed contract address

**Solution:**
1. Check `deployment-hackmoney-*.json` file for addresses
2. Add addresses to `.env`:
   ```env
   YELLOW_ADAPTER=0xYourAddress
   HORSE_AGENT_ARC=0xYourAddress
   LIFI_DEPOSITOR=0xYourAddress
   ```

---

### "Horse ID 1 not registered"

**Problem:** Test scripts need a tokenized horse

**Solution:**
Either:
1. Tokenize a horse using your Factory contract
2. Change `TEST_HORSE_ID` in the test script to an existing horse

---

### "Insufficient USDT balance"

**Problem:** Tests need USDT but wallet has none

**Solution:**
1. Get testnet USDT from faucets
2. Deploy a mock USDT contract for testing
3. Skip USDT-dependent tests

---

### "Strategy not active"

**Problem:** Portfolio Agent investment fails

**Solution:**
Run configuration first:
```bash
npm run config:agent
```

---

### "Oracle data stale"

**Problem:** Oracle data is too old (>1 hour)

**Solution:**
Update oracle data:
```javascript
// In test-agent.js or manually
await agent.updateOracleData(HORSE_ID, PERFORMANCE_SCORE);
```

---

### "Session already active"

**Problem:** Trying to open session when one exists

**Solution:**
Cancel existing session first:
```javascript
await adapter.cancelSession(shareToken);
```

---

## 💡 Advanced Usage

### Custom Strategy Configuration

Edit `config-agent.js` to customize strategy:

```javascript
const config = {
    targetPortfolioSize: 10,          // Hold 10 horses
    maxPositionSize: 50000n * 10n**6n, // 50,000 USDT per horse
    minOracleScore: 80,               // Only invest in top performers
    rebalanceThreshold: 200           // 2% rebalance threshold
};
```

### Batch Oracle Updates

Update multiple horses at once:

```javascript
const horseIds = [1, 2, 3, 4, 5];
const scores = [75, 80, 65, 90, 70];

await agent.batchUpdateOracleData(horseIds, scores);
```

### Multi-Horse Testing

Test with multiple horses in `test-agent.js`:

```javascript
const TEST_HORSE_IDS = [1, 2, 3];
for (const horseId of TEST_HORSE_IDS) {
    await agent.updateOracleData(horseId, 75);
    await agent.executeInvestment(horseId, 1000n * 10n**6n);
}
```

---

## 📞 Support

### Documentation
- Main README: `README.md`
- Security Audit: `SECURITY_AUDIT.md`
- Deployment Guide: `DEPLOYMENT_GUIDE.md`

### Common Issues
See [Troubleshooting](#troubleshooting) section above

### Getting Help
1. Check script output for specific error messages
2. Review DEPLOYMENT_GUIDE.md for detailed setup
3. Verify all .env variables are set correctly

---

## ✅ Complete Workflow Example

```bash
# 1. Deploy all contracts
npm run deploy

# 2. Update .env with deployed addresses
# (manually add addresses from deployment-hackmoney-*.json)

# 3. Configure all contracts
npm run config

# 4. Test Yellow Adapter
npm run test:yellow

# 5. Test Portfolio Agent
npm run test:agent

# 6. Test CrossChain Depositor
npm run test:lifi

# 7. Verify contracts on Etherscan
# (use commands from deployment output)

# 8. Submit to HackMoney 2026! 🎉
```

---

**Ready to configure your contracts?** Start with `npm run config`! 🚀
