// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.17;

interface IFlashToken {
    struct TransferInformation {
        uint256 startIndex;
        uint256 currentIndex;
    }

    struct TokenInformation {
        uint256 timestamp;
        uint256 expireTime;
        uint256 amount;
    }
}
