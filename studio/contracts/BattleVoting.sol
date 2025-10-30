// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @title BattleManager
 * @dev Manages battle rap competitions with community voting on Hedera
 * @notice This contract handles battle creation, voting, and result determination
 */
contract BattleManager {
    struct Battle {
        uint256 id;
        string rapper1Name;
        string rapper2Name;
        address rapper1Address;
        address rapper2Address;
        uint256 rapper1Votes;
        uint256 rapper2Votes;
        uint256 startTime;
        uint256 endTime;
        string videoUrl;
        BattleStatus status;
        address winner;
    }

    enum BattleStatus {
        Active,
        Ended,
        Cancelled
    }

    // State variables
    address public owner;
    uint256 public battleCount;
    uint256 public votingFee = 100000000; // 0.1 HBAR in tinybars

    mapping(uint256 => Battle) public battles;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public judgeReputation;

    address[] public certifiedJudges;

    // Events for Hedera Mirror Node tracking
    event BattleCreated(
        uint256 indexed battleId,
        string rapper1Name,
        string rapper2Name,
        uint256 startTime,
        uint256 endTime
    );

    event VoteCast(
        uint256 indexed battleId,
        address indexed voter,
        uint8 rapperChoice,
        uint256 timestamp
    );

    event BattleEnded(
        uint256 indexed battleId,
        address winner,
        uint256 rapper1Votes,
        uint256 rapper2Votes
    );

    event JudgeAdded(address indexed judge, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    modifier battleExists(uint256 _battleId) {
        require(_battleId < battleCount, "Battle does not exist");
        _;
    }

    modifier battleActive(uint256 _battleId) {
        require(
            battles[_battleId].status == BattleStatus.Active,
            "Battle not active"
        );
        require(block.timestamp < battles[_battleId].endTime, "Voting ended");
        _;
    }

    constructor() {
        owner = msg.sender;
        battleCount = 0;
    }

    /**
     * @dev Create a new battle
     * @param _rapper1Name Name of first rapper
     * @param _rapper2Name Name of second rapper
     * @param _rapper1Address Hedera account of rapper 1
     * @param _rapper2Address Hedera account of rapper 2
     * @param _durationMinutes How long voting stays open
     * @param _videoUrl Link to battle video
     */
    function createBattle(
        string memory _rapper1Name,
        string memory _rapper2Name,
        address _rapper1Address,
        address _rapper2Address,
        uint256 _durationMinutes,
        string memory _videoUrl
    ) external onlyOwner returns (uint256) {
        require(_rapper1Address != _rapper2Address, "Same rapper address");
        require(_durationMinutes > 0, "Invalid duration");

        uint256 battleId = battleCount;
        uint256 endTime = block.timestamp + (_durationMinutes * 60);

        battles[battleId] = Battle({
            id: battleId,
            rapper1Name: _rapper1Name,
            rapper2Name: _rapper2Name,
            rapper1Address: _rapper1Address,
            rapper2Address: _rapper2Address,
            rapper1Votes: 0,
            rapper2Votes: 0,
            startTime: block.timestamp,
            endTime: endTime,
            videoUrl: _videoUrl,
            status: BattleStatus.Active,
            winner: address(0)
        });

        battleCount++;

        emit BattleCreated(
            battleId,
            _rapper1Name,
            _rapper2Name,
            block.timestamp,
            endTime
        );

        return battleId;
    }

    /**
     * @dev Cast a vote for a rapper
     * @param _battleId ID of the battle
     * @param _rapperChoice 1 for rapper1, 2 for rapper2
     */
    function vote(
        uint256 _battleId,
        uint8 _rapperChoice
    ) external payable battleExists(_battleId) battleActive(_battleId) {
        require(!hasVoted[_battleId][msg.sender], "Already voted");
        require(_rapperChoice == 1 || _rapperChoice == 2, "Invalid choice");
        require(msg.value >= votingFee, "Insufficient voting fee");

        hasVoted[_battleId][msg.sender] = true;

        if (_rapperChoice == 1) {
            battles[_battleId].rapper1Votes++;
        } else {
            battles[_battleId].rapper2Votes++;
        }

        emit VoteCast(_battleId, msg.sender, _rapperChoice, block.timestamp);
    }

    /**
     * @dev End a battle and determine winner
     * @param _battleId ID of the battle to end
     */
    function endBattle(
        uint256 _battleId
    ) external onlyOwner battleExists(_battleId) {
        require(
            battles[_battleId].status == BattleStatus.Active,
            "Battle not active"
        );
        require(
            block.timestamp >= battles[_battleId].endTime,
            "Voting still open"
        );

        Battle storage battle = battles[_battleId];
        battle.status = BattleStatus.Ended;

        // Determine winner
        if (battle.rapper1Votes > battle.rapper2Votes) {
            battle.winner = battle.rapper1Address;
        } else if (battle.rapper2Votes > battle.rapper1Votes) {
            battle.winner = battle.rapper2Address;
        }
        // If tie, winner remains address(0)

        emit BattleEnded(
            _battleId,
            battle.winner,
            battle.rapper1Votes,
            battle.rapper2Votes
        );
    }

    /**
     * @dev Add a certified judge
     * @param _judge Address of the judge
     */
    function addJudge(address _judge) external onlyOwner {
        require(_judge != address(0), "Invalid address");
        certifiedJudges.push(_judge);
        judgeReputation[_judge] = 100; // Starting reputation

        emit JudgeAdded(_judge, block.timestamp);
    }

    /**
     * @dev Get battle details
     */
    function getBattle(
        uint256 _battleId
    ) external view battleExists(_battleId) returns (Battle memory) {
        return battles[_battleId];
    }

    /**
     * @dev Check if user has voted
     */
    function checkVoted(
        uint256 _battleId,
        address _voter
    ) external view returns (bool) {
        return hasVoted[_battleId][_voter];
    }

    /**
     * @dev Get all active battles
     */
    function getActiveBattles() external view returns (uint256[] memory) {
        uint256 activeCount = 0;

        // Count active battles
        for (uint256 i = 0; i < battleCount; i++) {
            if (
                battles[i].status == BattleStatus.Active &&
                block.timestamp < battles[i].endTime
            ) {
                activeCount++;
            }
        }

        // Create array of active battle IDs
        uint256[] memory activeBattles = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < battleCount; i++) {
            if (
                battles[i].status == BattleStatus.Active &&
                block.timestamp < battles[i].endTime
            ) {
                activeBattles[index] = i;
                index++;
            }
        }

        return activeBattles;
    }

    /**
     * @dev Withdraw contract balance with split: 70% to rappers (35% each), 30% to owner
     */
    function withdraw(uint battleId) external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        // Calculate splits
        uint256 rapperShare = (balance * 35) / 100; // 35% for each rapper
        uint256 ownerShare = balance - (rapperShare * 2); // Remaining 30% to owner

        // Collect rappers' address for each battleId
        address rapper1 = battles[battleId].rapper1Address;
        address rapper2 = battles[battleId].rapper2Address;
        // Transfer to rappers
        payable(rapper1).transfer(rapperShare);
        payable(rapper2).transfer(rapperShare);

        // Transfer remainder to owner
        payable(owner).transfer(ownerShare);
    }

    /**
     * @dev Update voting fee
     */
    function setVotingFee(uint256 _newFee) external onlyOwner {
        votingFee = _newFee;
    }
}
