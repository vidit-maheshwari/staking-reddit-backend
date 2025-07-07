// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract RedditStaking {
    using SafeERC20 for IERC20;

    IERC20 public redditToken;

    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 apy;
    }

    mapping(address => StakeInfo) public stakes;

    event Staked(address indexed user, uint256 amount, uint256 apy);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);

    constructor(address _tokenAddress) {
        redditToken = IERC20(_tokenAddress);
    }

    /// @notice Stake RedditTokens with an APY (must be verified by backend logic)
    function stake(uint256 amount, uint256 apy) external {
        require(amount > 0, "Amount must be greater than 0");
        require(
            apy == 20 || apy == 50 || apy == 1000,
            "Invalid APY rate"
        );
        require(stakes[msg.sender].amount == 0, "Already staking");

        redditToken.safeTransferFrom(msg.sender, address(this), amount);

        stakes[msg.sender] = StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            apy: apy
        });

        emit Staked(msg.sender, amount, apy);
    }

    /// @notice Unstake and receive original + interest based on APY
    function unstake() external {
        StakeInfo memory info = stakes[msg.sender];
        require(info.amount > 0, "No tokens staked");

        uint256 duration = block.timestamp - info.startTime;
        uint256 reward = (info.amount * info.apy * duration) / (365 days * 100);

        uint256 total = info.amount + reward;

        delete stakes[msg.sender];
        redditToken.safeTransfer(msg.sender, total);

        emit Unstaked(msg.sender, info.amount, reward);
    }

    /// @notice Preview how much user will receive after unstaking
    function previewUnstake(address user) external view returns (uint256 total) {
        StakeInfo memory info = stakes[user];
        if (info.amount == 0) return 0;

        uint256 duration = block.timestamp - info.startTime;
        uint256 reward = (info.amount * info.apy * duration) / (365 days * 100);
        return info.amount + reward;
    }

    /// @notice View current stake info
    function getStakeInfo(address user) external view returns (StakeInfo memory) {
        return stakes[user];
    }
}
