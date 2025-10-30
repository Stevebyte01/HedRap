// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @title BattleManager
 * @dev Manages battle rap competitions with weighted voting (70% judges, 30% fans)
 * @notice This contract handles battle creation, voting, and result determination
 */
contract BattleManager {
    struct Battle {
        address rapper1Address;
        address rapper2Address;
        address winner;
        uint256 rapper1FanVotes;
        uint256 rapper2FanVotes;
        uint256 rapper1JudgeVotes;
        uint256 rapper2JudgeVotes;
        uint256 endTime;
        BattleStatus status;
    }

    struct BattleInfo {
        string rapper1Name;
        string rapper2Name;
        string videoUrl;
        uint256 startTime;
    }

    enum BattleStatus {
        Active,
        Ended,
        Cancelled
    }

    // State variables
    address public owner;
    uint256 public battleCount;
    uint256 public votingFee = 10; // 10 HBAR

    // Voting weights
    uint256 public constant JUDGE_WEIGHT = 7000; // 70%
    uint256 public constant FAN_WEIGHT = 3000; // 30%

    mapping(uint256 => Battle) public battles;
    mapping(uint256 => BattleInfo) public battleInfo;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public judgeReputation;
    mapping(address => bool) public isJudge;

    address[] public certifiedJudges;

    // Events
    event BattleCreated(
        uint256 indexed battleId,
        string rapper1Name,
        string rapper2Name,
        uint256 endTime
    );

    event VoteCast(
        uint256 indexed battleId,
        address indexed voter,
        uint8 rapperChoice,
        bool isJudgeVote
    );

    event BattleEnded(
        uint256 indexed battleId,
        address winner,
        uint256 score1,
        uint256 score2
    );

    event JudgeAdded(address indexed judge);
    event JudgeRemoved(address indexed judge);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier battleExists(uint256 _id) {
        require(_id < battleCount, "Battle not exist");
        _;
    }

    modifier battleActive(uint256 _id) {
        require(battles[_id].status == BattleStatus.Active, "Not active");
        require(block.timestamp < battles[_id].endTime, "Ended");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Create a new battle
     */
    function createBattle(
        string calldata _name1,
        string calldata _name2,
        address _addr1,
        address _addr2,
        uint256 _duration,
        string calldata _video
    ) external onlyOwner returns (uint256) {
        require(_addr1 != _addr2, "Same address");
        require(_duration > 0, "Invalid duration");

        uint256 id = battleCount++;

        battles[id].rapper1Address = _addr1;
        battles[id].rapper2Address = _addr2;
        battles[id].endTime = block.timestamp + (_duration * 60);
        battles[id].status = BattleStatus.Active;

        battleInfo[id].rapper1Name = _name1;
        battleInfo[id].rapper2Name = _name2;
        battleInfo[id].videoUrl = _video;
        battleInfo[id].startTime = block.timestamp;

        emit BattleCreated(id, _name1, _name2, battles[id].endTime);
        return id;
    }

    /**
     * @dev Cast a vote
     */
    function vote(
        uint256 _id,
        uint8 _choice
    ) external payable battleExists(_id) battleActive(_id) {
        require(!hasVoted[_id][msg.sender], "Already voted");
        require(_choice == 1 || _choice == 2, "Invalid choice");
        require(msg.value >= votingFee, "Insufficient fee");

        hasVoted[_id][msg.sender] = true;
        bool judgeVote = isJudge[msg.sender];

        if (_choice == 1) {
            if (judgeVote) {
                battles[_id].rapper1JudgeVotes++;
            } else {
                battles[_id].rapper1FanVotes++;
            }
        } else {
            if (judgeVote) {
                battles[_id].rapper2JudgeVotes++;
            } else {
                battles[_id].rapper2FanVotes++;
            }
        }

        emit VoteCast(_id, msg.sender, _choice, judgeVote);
    }

    /**
     * @dev Calculate weighted score
     */
    function getScore(
        uint256 _jVotes,
        uint256 _fVotes,
        uint256 _totalJ,
        uint256 _totalF
    ) internal pure returns (uint256) {
        uint256 s = 0;
        if (_totalJ > 0) s += (_jVotes * JUDGE_WEIGHT) / _totalJ;
        if (_totalF > 0) s += (_fVotes * FAN_WEIGHT) / _totalF;
        return s;
    }

    /**
     * @dev End battle
     */
    function endBattle(uint256 _id) external onlyOwner battleExists(_id) {
        Battle storage b = battles[_id];
        require(b.status == BattleStatus.Active, "Not active");
        require(block.timestamp >= b.endTime, "Not ended");

        b.status = BattleStatus.Ended;

        uint256 tj = b.rapper1JudgeVotes + b.rapper2JudgeVotes;
        uint256 tf = b.rapper1FanVotes + b.rapper2FanVotes;

        uint256 s1 = getScore(b.rapper1JudgeVotes, b.rapper1FanVotes, tj, tf);
        uint256 s2 = getScore(b.rapper2JudgeVotes, b.rapper2FanVotes, tj, tf);

        if (s1 > s2) {
            b.winner = b.rapper1Address;
        } else if (s2 > s1) {
            b.winner = b.rapper2Address;
        }

        emit BattleEnded(_id, b.winner, s1, s2);
    }

    /**
     * @dev Add judge
     */
    function addJudge(address _j) external onlyOwner {
        require(_j != address(0), "Invalid");
        require(!isJudge[_j], "Exists");

        certifiedJudges.push(_j);
        isJudge[_j] = true;
        judgeReputation[_j] = 100;

        emit JudgeAdded(_j);
    }

    /**
     * @dev Remove judge
     */
    function removeJudge(address _j) external onlyOwner {
        require(isJudge[_j], "Not judge");
        isJudge[_j] = false;
        judgeReputation[_j] = 0;
        emit JudgeRemoved(_j);
    }

    /**
     * @dev Get battle with scores
     */
    function getBattleWithScores(uint256 _id)
        external
        view
        battleExists(_id)
        returns (
            Battle memory,
            BattleInfo memory,
            uint256,
            uint256
        )
    {
        Battle memory b = battles[_id];
        BattleInfo memory info = battleInfo[_id];

        uint256 tj = b.rapper1JudgeVotes + b.rapper2JudgeVotes;
        uint256 tf = b.rapper1FanVotes + b.rapper2FanVotes;

        return (
            b,
            info,
            getScore(b.rapper1JudgeVotes, b.rapper1FanVotes, tj, tf),
            getScore(b.rapper2JudgeVotes, b.rapper2FanVotes, tj, tf)
        );
    }

    /**
     * @dev Get battle
     */
    function getBattle(uint256 _id)
        external
        view
        battleExists(_id)
        returns (Battle memory, BattleInfo memory)
    {
        return (battles[_id], battleInfo[_id]);
    }

    /**
     * @dev Check voted
     */
    function checkVoted(uint256 _id, address _voter)
        external
        view
        returns (bool)
    {
        return hasVoted[_id][_voter];
    }

    /**
     * @dev Check if judge
     */
    function checkIsJudge(address _a) external view returns (bool) {
        return isJudge[_a];
    }

    /**
     * @dev Get active battles
     */
    function getActiveBattles() external view returns (uint256[] memory) {
        uint256 c = 0;
        for (uint256 i = 0; i < battleCount; i++) {
            if (battles[i].status == BattleStatus.Active && block.timestamp < battles[i].endTime) {
                c++;
            }
        }

        uint256[] memory r = new uint256[](c);
        uint256 idx = 0;
        for (uint256 i = 0; i < battleCount; i++) {
            if (battles[i].status == BattleStatus.Active && block.timestamp < battles[i].endTime) {
                r[idx++] = i;
            }
        }
        return r;
    }

    /**
     * @dev Get all judges
     */
    function getAllJudges() external view returns (address[] memory) {
        uint256 c = 0;
        for (uint256 i = 0; i < certifiedJudges.length; i++) {
            if (isJudge[certifiedJudges[i]]) c++;
        }

        address[] memory r = new address[](c);
        uint256 idx = 0;
        for (uint256 i = 0; i < certifiedJudges.length; i++) {
            if (isJudge[certifiedJudges[i]]) {
                r[idx++] = certifiedJudges[i];
            }
        }
        return r;
    }

    /**
     * @dev Withdraw: 35% each rapper, 30% owner
     */
    function withdraw(uint256 _id) external onlyOwner battleExists(_id) {
        uint256 bal = address(this).balance;
        require(bal > 0, "No funds");

        uint256 share = (bal * 35) / 100;
        uint256 ownerShare = bal - (share * 2);

        payable(battles[_id].rapper1Address).transfer(share);
        payable(battles[_id].rapper2Address).transfer(share);
        payable(owner).transfer(ownerShare);
    }

    /**
     * @dev Set voting fee
     */
    function setVotingFee(uint256 _fee) external onlyOwner {
        votingFee = _fee;
    }
}
