// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestWETH is ERC20 {
    constructor() ERC20("Test Wrapped Ether", "TWETH") {
        // No initial supply - users can mint what they need for testing
    }

    // Allow anyone to mint tokens for testing
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    // Optional: Add deposit/withdraw like real WETH if needed
    receive() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }
} 