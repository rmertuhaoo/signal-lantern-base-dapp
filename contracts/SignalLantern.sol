// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SignalLantern {
    uint256 public nextLanternId = 1;

    struct LanternEntry {
        address owner;
        string state;
        string color;
        string message;
        uint256 daysActive;
        uint256 createdAt;
    }

    mapping(uint256 => LanternEntry) private lanterns;

    event LanternPublished(
        uint256 indexed lanternId,
        address indexed owner,
        string state,
        string color,
        string message,
        uint256 daysActive
    );

    function publishLantern(
        string calldata state,
        string calldata color,
        string calldata message,
        uint256 daysActive
    ) external returns (uint256 lanternId) {
        require(bytes(state).length > 0 && bytes(state).length <= 16, "Invalid state");
        require(bytes(color).length > 0 && bytes(color).length <= 16, "Invalid color");
        require(bytes(message).length > 0 && bytes(message).length <= 180, "Invalid message");
        require(daysActive >= 1 && daysActive <= 30, "Invalid days");

        lanternId = nextLanternId++;
        lanterns[lanternId] = LanternEntry({
            owner: msg.sender,
            state: state,
            color: color,
            message: message,
            daysActive: daysActive,
            createdAt: block.timestamp
        });

        emit LanternPublished(lanternId, msg.sender, state, color, message, daysActive);
    }

    function getLantern(
        uint256 lanternId
    )
        external
        view
        returns (
            address owner,
            string memory state,
            string memory color,
            string memory message,
            uint256 daysActive,
            uint256 createdAt
        )
    {
        LanternEntry storage entry = lanterns[lanternId];
        return (
            entry.owner,
            entry.state,
            entry.color,
            entry.message,
            entry.daysActive,
            entry.createdAt
        );
    }
}
