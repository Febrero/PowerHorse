# POWER.HORSE HackMoney 2026 - Deployment Guide

## 🎯 Overview

This guide walks you through deploying the three HackMoney 2026 integration contracts:
1. **YellowBondingCurveAdapter** - Yellow Network gasless trading
2. **HorsePortfolioAgent** - Arc Network AI portfolio management
3. **CrossChainVaultDepositor** - LI.FI cross-chain deposits

## 📋 Prerequisites

### Required Software
- Node.js v18+ and npm
- Hardhat
- A code editor (VS Code recommended)

### Required Accounts & Keys
1. **Sepolia RPC URL** - Get from Infura or Alchemy
2. **Deployer Private Key** - Dedicated wallet with testnet ETH
3. **Etherscan API Key** - For contract verification (optional)

### Testnet ETH
Get Sepolia testnet ETH from: https://sepoliafaucet.com
**Recommended amount:** 0.1 ETH (covers deployment + testing)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Edit `.env` file with your keys:

```env
# RPC URL (from Infura/Alchemy)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Deployer wallet private key (include 0x prefix)
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Etherscan API key (optional, for verification)
ETHERSCAN_API_KEY=YOUR_API_KEY_HERE

# Core contracts (ALREADY CONFIGURED - DO NOT CHANGE)
BONDING_CURVE=0x35A4100EaF2A36aE26612d86dbbcC81AC6EC72AA
FACTORY=0x0A40b15FF02B0043Eaf276e5C97e3e65994Aaf1d
USDT=0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0
LIFI_DIAMOND=0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE
```

### 3. Test Compilation

```bash
npx hardhat compile
```

Expected output:
```
Compiled 3 Solidity files successfully
```

### 4. Deploy All Contracts

```bash
npm run deploy
```

This will deploy:
- YellowBondingCurveAdapter
- HorsePortfolioAgent
- CrossChainVaultDepositor

Deployment addresses will be saved to `deployment-hackmoney-[timestamp].json`

---

## 📦 Individual Contract Deployment

### Deploy Only Yellow Network Adapter

```bash
npm run deploy:yellow
```

### Deploy Only AI Portfolio Agent

```bash
npm run deploy:agent
```

### Deploy Only LI.FI Cross-Chain Depositor

```bash
npm run deploy:lifi
```

---

## 🔍 Contract Verification

After deployment, verify contracts on Etherscan:

```bash
npx hardhat verify --network sepolia YELLOW_ADAPTER_ADDRESS "DEPLOYER_ADDRESS" "BONDING_CURVE_ADDRESS" "FACTORY_ADDRESS" "RELAYER_ADDRESS"

npx hardhat verify --network sepolia AGENT_ADDRESS "DEPLOYER_ADDRESS" "BONDING_CURVE_ADDRESS" "FACTORY_ADDRESS" "USDT_ADDRESS" "ORACLE_ADDRESS"

npx hardhat verify --network sepolia DEPOSITOR_ADDRESS "DEPLOYER_ADDRESS" "BONDING_CURVE_ADDRESS" "FACTORY_ADDRESS" "LIFI_DIAMOND_ADDRESS" "USDT_ADDRESS"
```

Replace addresses with your deployed contract addresses from the deployment JSON file.

---

## 🏗️ Contract Architecture

### YellowBondingCurveAdapter

**Purpose:** Gasless trading via Yellow Network state channels

**Key Parameters:**
- `bondingCurve`: `0x35A4100EaF2A36aE26612d86dbbcC81AC6EC72AA`
- `factory`: `0x0A40b15FF02B0043Eaf276e5C97e3e65994Aaf1d`
- `yellowRelayer`: Deployer address (can be updated later)

**Important Constants:**
- Session duration: 1 hour
- Settlement grace period: 15 minutes
- Minimum session amount: 0.001 ETH

### HorsePortfolioAgent

**Purpose:** AI-driven portfolio management

**Key Parameters:**
- `bondingCurve`: `0x35A4100EaF2A36aE26612d86dbbcC81AC6EC72AA`
- `factory`: `0x0A40b15FF02B0043Eaf276e5C97e3e65994Aaf1d`
- `usdt`: `0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0`
- `storkOracle`: Deployer address (configure after deployment)

**Important Constants:**
- Oracle stale threshold: 1 hour
- Max performance score: 100
- BPS denominator: 10000

### CrossChainVaultDepositor

**Purpose:** Cross-chain deposits via LI.FI

**Key Parameters:**
- `bondingCurve`: `0x35A4100EaF2A36aE26612d86dbbcC81AC6EC72AA`
- `factory`: `0x0A40b15FF02B0043Eaf276e5C97e3e65994Aaf1d`
- `lifiDiamond`: `0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE`
- `usdt`: `0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0`

**Important Constants:**
- Max deadline: 24 hours
- Min slippage BPS: 50 (0.5%)
- Min deposit: 1 USDT

---

## ⚙️ Post-Deployment Configuration

### 1. Update Relayer (Yellow Adapter)

```bash
# In Hardhat console
const adapter = await ethers.getContractAt("YellowBondingCurveAdapter", "ADAPTER_ADDRESS");
await adapter.updateRelayer("NEW_RELAYER_ADDRESS");
```

### 2. Configure AI Strategy (Portfolio Agent)

```bash
const agent = await ethers.getContractAt("HorsePortfolioAgent", "AGENT_ADDRESS");
await agent.updateStrategy(
    5,          // targetPortfolioSize (5 horses)
    10000e6,    // maxPositionSize (10,000 USDT)
    60,         // minOracleScore (60/100)
    500         // rebalanceThreshold (5%)
);
```

### 3. Update Oracle (Portfolio Agent)

```bash
await agent.updateOracle("STORK_ORACLE_ADDRESS");
```

---

## 🧪 Testing Deployments

### Test Yellow Adapter

```javascript
// Open a trading session
const adapter = await ethers.getContractAt("YellowBondingCurveAdapter", "ADDRESS");
await adapter.openSession(
    "SHARE_TOKEN_ADDRESS",
    ethers.ZeroAddress, // ETH payment
    ethers.parseEther("0.01"),
    { value: ethers.parseEther("0.01") }
);
```

### Test Portfolio Agent

```javascript
// Update oracle data
const agent = await ethers.getContractAt("HorsePortfolioAgent", "ADDRESS");
await agent.updateOracleData(1, 75); // horseId=1, score=75

// Execute investment
await agent.executeInvestment(1, 1000e6); // 1000 USDT
```

### Test Cross-Chain Depositor

```javascript
// Create deposit intent
const depositor = await ethers.getContractAt("CrossChainVaultDepositor", "ADDRESS");
const usdt = await ethers.getContractAt("IERC20", "USDT_ADDRESS");

// Approve USDT
await usdt.approve("DEPOSITOR_ADDRESS", 1000e6);

// Create intent
await depositor.createDepositIntent(
    1,          // horseId
    1000e6,     // 1000 USDT
    1000000e18, // min shares
    Math.floor(Date.now() / 1000) + 3600 // 1 hour deadline
);
```

---

## 🔒 Security Considerations

### Pre-Deployment Security Checklist

- [ ] Review SECURITY_AUDIT.md
- [ ] Verify all contract addresses in .env
- [ ] Use dedicated deployment wallet (not main wallet)
- [ ] Ensure sufficient testnet ETH
- [ ] Review deployment script parameters
- [ ] Prepare multi-sig for ownership transfer

### Post-Deployment Security Steps

1. **Transfer Ownership to Multi-Sig**
   ```bash
   await contract.transferOwnership("MULTISIG_ADDRESS");
   ```

2. **Set Up Monitoring**
   - Monitor contract events
   - Track unusual activity
   - Set up alerts for critical functions

3. **Document Emergency Procedures**
   - Emergency withdrawal procedures
   - Contact information
   - Incident response plan

4. **Regular Security Reviews**
   - Weekly transaction reviews
   - Monthly security audits
   - Quarterly strategy reviews

---

## 📊 Expected Gas Costs

Approximate gas costs on Sepolia (at 50 gwei):

| Contract                     | Deployment Cost |
|------------------------------|-----------------|
| YellowBondingCurveAdapter   | ~0.01 ETH       |
| HorsePortfolioAgent         | ~0.012 ETH      |
| CrossChainVaultDepositor    | ~0.011 ETH      |
| **Total**                   | **~0.033 ETH**  |

**Note:** Actual costs vary based on network congestion.

---

## 🐛 Troubleshooting

### Compilation Errors

**Error:** `HH1006: File is inside node_modules`
**Fix:** Ensure `hardhat.config.js` has `sources: "./contracts"`

**Error:** `Cannot find module '@openzeppelin/contracts'`
**Fix:** Run `npm install`

### Deployment Errors

**Error:** `insufficient funds`
**Fix:** Get more testnet ETH from faucet

**Error:** `missing revert data`
**Fix:** Check RPC URL is correct, verify network is Sepolia

**Error:** `nonce too low`
**Fix:** Clear transaction history or wait for pending transactions

### Contract Interaction Errors

**Error:** `Ownable: caller is not the owner`
**Fix:** Ensure you're calling from deployer address

**Error:** `USDT: transfer amount exceeds allowance`
**Fix:** Approve contract for USDT before operations

---

## 📞 Support

### Documentation
- Security Audit: `SECURITY_AUDIT.md`
- Setup Guide: `SETUP.md`
- README: `README.md`

### Resources
- Hardhat Docs: https://hardhat.org/docs
- OpenZeppelin: https://docs.openzeppelin.com
- Sepolia Faucet: https://sepoliafaucet.com
- Etherscan: https://sepolia.etherscan.io

### Community
- GitHub Issues: For bug reports
- Discord: For questions
- Email: security@power.horse (security issues)

---

## ✅ Deployment Success Checklist

- [ ] All contracts compiled successfully
- [ ] Deployment completed without errors
- [ ] Contract addresses saved to JSON file
- [ ] Contracts verified on Etherscan
- [ ] Post-deployment configuration completed
- [ ] Test transactions successful
- [ ] Ownership transferred to multi-sig (if applicable)
- [ ] Monitoring systems configured
- [ ] Documentation updated with addresses
- [ ] Team notified of deployment
- [ ] HackMoney 2026 submission prepared

---

**Congratulations on deploying POWER.HORSE HackMoney 2026 integration contracts!** 🎉

Now ready to submit to HackMoney 2026 hackathon!
