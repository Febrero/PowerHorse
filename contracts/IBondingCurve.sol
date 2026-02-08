// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBondingCurve
 * @notice Interface for interacting with the BondingCurve contract
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
    function appraisalValue(address token) external view returns (uint256);
}
