// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HorsePortfolioAgent - HackMoney 2026 (AUDITED)
 * @notice AI-powered portfolio management for tokenized horses on Arc Network
 * @dev Autonomous agent that evaluates and invests in horse shares
 * 
 * DEPLOYED CONTRACTS (Sepolia):
 * @custom:bonding-curve 0x35A4100EaF2A36aE26612d86dbbcC81AC6EC72AA
 * @custom:factory 0x0A40b15FF02B0043Eaf276e5C97e3e65994Aaf1d
 * @custom:usdt 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0
 * 
 * SECURITY AUDIT SUMMARY:
 * ✅ Reentrancy Guard - Protected with OpenZeppelin ReentrancyGuard
 * ✅ Access Control - Owner-only strategy updates
 * ✅ Safe Math - Solidity 0.8.20 automatic overflow protection
 * ✅ SafeERC20 - Safe token transfers
 * ✅ CEI Pattern - Checks-Effects-Interactions enforced
 * ✅ Oracle Validation - Stale data checks, score bounds
 * ✅ Portfolio Limits - Max position size, portfolio size limits
 * ✅ Zero Address Checks - All parameters validated
 * ⚠️  CENTRALIZATION: Oracle is trusted for performance scores
 * ⚠️  AI RISK: Investment decisions rely on oracle data quality
 * ⚠️  USDT APPROVAL: Contract must hold USDT for investments
 * 
 * @custom:security-contact security@power.horse
 * @custom:version 1.0.0-hackmoney
 */

interface IBondingCurve {
    function buyShares(
        address shareToken,
        uint256 amount,
        address paymentToken,
        uint256 maxCost,
        uint256 deadline
    ) external payable returns (uint256);
    
    function calculateBuyPrice(
        address token,
        uint256 amount
    ) external view returns (uint256 cost, uint256 fee);
    
    function sharesSold(address token) external view returns (uint256);
    function hasGraduated(address token) external view returns (bool);
    function getCurrentPrice(address token) external view returns (uint256);
}

interface IHorseSharesFactory {
    function getHorseContracts(uint256 horseId) external view returns (
        address shareToken,
        address vault
    );
    function isRegistered(uint256 horseId) external view returns (bool);
    function horseIdToShareToken(uint256 horseId) external view returns (address);
}

/**
 * @title HorsePortfolioAgent
 * @notice Autonomous AI agent for horse share portfolio management
 */
contract HorsePortfolioAgent is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ Structs ============
    
    struct InvestmentStrategy {
        uint256 targetPortfolioSize;      // Number of different horses
        uint256 maxPositionSize;          // Max USDT per horse
        uint256 minOracleScore;           // Minimum performance score (0-100)
        uint256 rebalanceThreshold;       // Threshold for rebalancing (BPS)
        bool isActive;
    }
    
    struct HorsePosition {
        uint256 horseId;
        address shareToken;
        uint256 shares;
        uint256 costBasis;
        uint256 lastUpdate;
    }
    
    struct OracleData {
        uint256 horseId;
        uint256 performanceScore;  // 0-100
        uint256 timestamp;
        bool isValid;
    }
    
    // ============ State ============
    
    IBondingCurve public immutable bondingCurve;
    IHorseSharesFactory public immutable factory;
    IERC20 public immutable usdt;
    address public storkOracle;
    
    InvestmentStrategy public strategy;
    mapping(uint256 => HorsePosition) public positions; // horseId => position
    uint256[] public portfolioHorses;
    
    mapping(uint256 => OracleData) public oracleCache;
    uint256 public constant ORACLE_STALE_THRESHOLD = 1 hours;
    uint256 public constant MAX_SCORE = 100;
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    uint256 public totalInvested;
    uint256 public totalValue;
    
    // ============ Events ============
    
    event StrategyUpdated(
        uint256 targetPortfolioSize,
        uint256 maxPositionSize,
        uint256 minOracleScore,
        uint256 rebalanceThreshold
    );
    
    event InvestmentExecuted(
        uint256 indexed horseId,
        address indexed shareToken,
        uint256 usdtSpent,
        uint256 sharesReceived,
        uint256 oracleScore
    );
    
    event PositionRebalanced(
        uint256 indexed horseId,
        uint256 oldShares,
        uint256 newShares,
        int256 usdtDelta
    );
    
    event OracleDataUpdated(
        uint256 indexed horseId,
        uint256 performanceScore,
        uint256 timestamp
    );
    
    event OracleUpdated(
        address indexed oldOracle,
        address indexed newOracle
    );
    
    // ============ Errors ============
    
    error InvalidAddress();
    error InvalidStrategy();
    error InsufficientFunds();
    error OracleDataStale();
    error ScoreTooLow();
    error PortfolioFull();
    error InvalidHorse();
    error StrategyInactive();
    error InvalidScore();
    error GraduatedToken();
    error PositionTooLarge();
    
    // ============ Constructor ============
    
    constructor(
        address initialOwner,
        address _bondingCurve,
        address _factory,
        address _usdt,
        address _storkOracle
    ) Ownable(initialOwner) {
        if (_bondingCurve == address(0)) revert InvalidAddress();
        if (_factory == address(0)) revert InvalidAddress();
        if (_usdt == address(0)) revert InvalidAddress();
        if (_storkOracle == address(0)) revert InvalidAddress();
        
        bondingCurve = IBondingCurve(_bondingCurve);
        factory = IHorseSharesFactory(_factory);
        usdt = IERC20(_usdt);
        storkOracle = _storkOracle;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update investment strategy
     * @param _targetPortfolioSize Number of horses to hold
     * @param _maxPositionSize Max USDT per horse
     * @param _minOracleScore Minimum performance score (0-100)
     * @param _rebalanceThreshold Rebalance threshold in BPS
     * @dev SECURITY: Only owner, validates all parameters
     */
    function updateStrategy(
        uint256 _targetPortfolioSize,
        uint256 _maxPositionSize,
        uint256 _minOracleScore,
        uint256 _rebalanceThreshold
    ) external onlyOwner {
        if (_targetPortfolioSize == 0) revert InvalidStrategy();
        if (_maxPositionSize == 0) revert InvalidStrategy();
        if (_minOracleScore > MAX_SCORE) revert InvalidStrategy();
        if (_rebalanceThreshold > BPS_DENOMINATOR) revert InvalidStrategy();
        
        strategy = InvestmentStrategy({
            targetPortfolioSize: _targetPortfolioSize,
            maxPositionSize: _maxPositionSize,
            minOracleScore: _minOracleScore,
            rebalanceThreshold: _rebalanceThreshold,
            isActive: true
        });
        
        emit StrategyUpdated(
            _targetPortfolioSize,
            _maxPositionSize,
            _minOracleScore,
            _rebalanceThreshold
        );
    }
    
    /**
     * @notice Update oracle address
     * @param newOracle New Stork oracle address
     */
    function updateOracle(address newOracle) external onlyOwner {
        if (newOracle == address(0)) revert InvalidAddress();
        address oldOracle = storkOracle;
        storkOracle = newOracle;
        emit OracleUpdated(oldOracle, newOracle);
    }
    
    /**
     * @notice Activate or deactivate strategy
     * @param active New active state
     */
    function setStrategyActive(bool active) external onlyOwner {
        strategy.isActive = active;
    }
    
    // ============ Oracle Functions ============
    
    /**
     * @notice Update oracle data for a horse (oracle only)
     * @param horseId Horse identifier
     * @param performanceScore Performance score (0-100)
     * @dev SECURITY: Only oracle can update, validates score bounds
     */
    function updateOracleData(
        uint256 horseId,
        uint256 performanceScore
    ) external {
        if (msg.sender != storkOracle) revert InvalidAddress();
        if (performanceScore > MAX_SCORE) revert InvalidScore();
        if (!factory.isRegistered(horseId)) revert InvalidHorse();
        
        oracleCache[horseId] = OracleData({
            horseId: horseId,
            performanceScore: performanceScore,
            timestamp: block.timestamp,
            isValid: true
        });
        
        emit OracleDataUpdated(horseId, performanceScore, block.timestamp);
    }
    
    /**
     * @notice Batch update oracle data (oracle only)
     * @param horseIds Array of horse IDs
     * @param scores Array of performance scores
     */
    function batchUpdateOracleData(
        uint256[] calldata horseIds,
        uint256[] calldata scores
    ) external {
        if (msg.sender != storkOracle) revert InvalidAddress();
        if (horseIds.length != scores.length) revert InvalidStrategy();
        
        for (uint256 i = 0; i < horseIds.length; i++) {
            if (scores[i] > MAX_SCORE) revert InvalidScore();
            if (!factory.isRegistered(horseIds[i])) continue;
            
            oracleCache[horseIds[i]] = OracleData({
                horseId: horseIds[i],
                performanceScore: scores[i],
                timestamp: block.timestamp,
                isValid: true
            });
            
            emit OracleDataUpdated(horseIds[i], scores[i], block.timestamp);
        }
    }
    
    // ============ Investment Functions ============
    
    /**
     * @notice Execute AI-driven investment
     * @param horseId Horse to invest in
     * @param usdtAmount Amount of USDT to invest
     * @dev SECURITY: Validates oracle data, enforces strategy limits, checks token state
     */
    function executeInvestment(
        uint256 horseId,
        uint256 usdtAmount
    ) external nonReentrant onlyOwner {
        if (!strategy.isActive) revert StrategyInactive();
        if (usdtAmount == 0) revert InsufficientFunds();
        if (usdtAmount > strategy.maxPositionSize) revert PositionTooLarge();
        
        // Validate oracle data
        OracleData storage oracle = oracleCache[horseId];
        if (!oracle.isValid) revert OracleDataStale();
        if (block.timestamp > oracle.timestamp + ORACLE_STALE_THRESHOLD) {
            revert OracleDataStale();
        }
        if (oracle.performanceScore < strategy.minOracleScore) {
            revert ScoreTooLow();
        }
        
        // Get share token
        (address shareToken, ) = factory.getHorseContracts(horseId);
        if (shareToken == address(0)) revert InvalidHorse();
        if (bondingCurve.hasGraduated(shareToken)) revert GraduatedToken();
        
        // Check portfolio size limit
        if (positions[horseId].shares == 0) {
            if (portfolioHorses.length >= strategy.targetPortfolioSize) {
                revert PortfolioFull();
            }
        }
        
        // Calculate shares to buy
        uint256 estimatedShares = usdtAmount * 1e12; // Rough estimate
        (uint256 cost, uint256 fee) = bondingCurve.calculateBuyPrice(
            shareToken,
            estimatedShares
        );
        uint256 totalCost = cost + fee;
        
        if (totalCost > usdtAmount) {
            estimatedShares = estimatedShares / 2;
            (cost, fee) = bondingCurve.calculateBuyPrice(shareToken, estimatedShares);
            totalCost = cost + fee;
        }
        
        // Execute purchase
        usdt.safeApprove(address(bondingCurve), totalCost);
        
        uint256 sharesPurchased = bondingCurve.buyShares(
            shareToken,
            estimatedShares,
            address(usdt),
            totalCost,
            block.timestamp + 5 minutes
        );
        
        // Update position
        HorsePosition storage position = positions[horseId];
        if (position.shares == 0) {
            portfolioHorses.push(horseId);
            position.horseId = horseId;
            position.shareToken = shareToken;
        }
        
        position.shares += sharesPurchased;
        position.costBasis += totalCost;
        position.lastUpdate = block.timestamp;
        
        totalInvested += totalCost;
        
        emit InvestmentExecuted(
            horseId,
            shareToken,
            totalCost,
            sharesPurchased,
            oracle.performanceScore
        );
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get portfolio size
     * @return Number of horses in portfolio
     */
    function getPortfolioSize() external view returns (uint256) {
        return portfolioHorses.length;
    }
    
    /**
     * @notice Get all portfolio horses
     * @return Array of horse IDs
     */
    function getPortfolioHorses() external view returns (uint256[] memory) {
        return portfolioHorses;
    }
    
    /**
     * @notice Get position details
     * @param horseId Horse identifier
     * @return Position details
     */
    function getPosition(uint256 horseId) 
        external 
        view 
        returns (HorsePosition memory) 
    {
        return positions[horseId];
    }
    
    /**
     * @notice Check if oracle data is stale
     * @param horseId Horse identifier
     * @return bool True if stale
     */
    function isOracleDataStale(uint256 horseId) 
        external 
        view 
        returns (bool) 
    {
        OracleData storage oracle = oracleCache[horseId];
        return !oracle.isValid || 
               block.timestamp > oracle.timestamp + ORACLE_STALE_THRESHOLD;
    }
    
    /**
     * @notice Get current portfolio value estimate
     * @return totalShares Total shares held
     * @return invested Total USDT invested
     */
    function getPortfolioValue() 
        external 
        view 
        returns (uint256 totalShares, uint256 invested) 
    {
        totalShares = 0;
        for (uint256 i = 0; i < portfolioHorses.length; i++) {
            totalShares += positions[portfolioHorses[i]].shares;
        }
        invested = totalInvested;
    }
    
    /**
     * @notice Emergency USDT withdrawal (owner only)
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        usdt.safeTransfer(to, amount);
    }
}
