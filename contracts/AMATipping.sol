// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AMATipping is Ownable {
    using SafeERC20 for IERC20;

    address public platformFeeRecipient;
    uint256 public platformFeePercentage = 10; // Default 10% platform fee
    mapping(uint256 => mapping(address => uint256)) public totalTokenTips; // Tracks tips per session and token

    event TipReceived(
        uint256 indexed sessionId,
        address indexed sender,
        address indexed creator,
        address token,
        uint256 amount,
        uint256 timestamp
    );
    event PlatformFeeUpdated(uint256 newPercentage, uint256 timestamp);

    constructor() Ownable(msg.sender) {
        platformFeeRecipient = msg.sender;
    }

    function tip(
        uint256 sessionId,
        address creator,
        address token,
        uint256 amount
    ) external {
        require(amount > 0, "Amount must be greater than 0");
        require(creator != address(0), "Invalid creator address");
        require(token != address(0), "Invalid token address");

        IERC20 tokenContract = IERC20(token);
        uint256 fee = (amount * platformFeePercentage) / 100; // Calculate platform fee
        uint256 creatorAmount = amount - fee;
        uint256 totalAmount = fee + creatorAmount;

        require(
            tokenContract.allowance(msg.sender, address(this)) >= totalAmount,
            "Insufficient allowance"
        );

        totalTokenTips[sessionId][token] += amount;

        tokenContract.safeTransferFrom(msg.sender, platformFeeRecipient, fee);
        tokenContract.safeTransferFrom(msg.sender, creator, creatorAmount);

        emit TipReceived(
            sessionId,
            msg.sender,
            creator,
            token,
            amount,
            block.timestamp
        );
    }

    function setPlatformFeeRecipient(address _new) external onlyOwner {
        require(_new != address(0), "Invalid address");
        platformFeeRecipient = _new;
    }

    function setPlatformFeePercentage(uint256 _newPercentage)
        external
        onlyOwner
    {
        require(_newPercentage <= 100, "Percentage must be <= 100");
        require(_newPercentage > 0, "Percentage must be > 0");
        platformFeePercentage = _newPercentage;
        emit PlatformFeeUpdated(_newPercentage, block.timestamp);
    }
}
