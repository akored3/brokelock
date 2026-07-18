// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title Brokelock — a commitment savings vault
/// @notice Lock MON toward a named goal with a deadline. Withdraw after the
///         deadline: free. Withdraw early: a penalty is skimmed off and
///         credited to your accountability partner — your weakness literally
///         pays your friend. No partner set? The penalty is burned.
/// @dev    Penalties use a pull-payment pattern (`claim`) so a reverting
///         partner contract can never block a saver's withdrawal.
contract Brokelock {
    uint16 public constant MAX_PENALTY_BPS = 5_000; // 50%
    uint16 private constant BPS = 10_000;

    struct Goal {
        string name;
        uint64 deadline;
        uint16 penaltyBps;
        address partner; // receives early-withdrawal penalties; 0x0 = burn
        uint256 balance;
    }

    mapping(address saver => Goal[]) private _goals;

    /// @notice Penalties credited to accountability partners, claimable anytime.
    mapping(address partner => uint256) public claimable;

    /// @notice Total MON burned by savers who rage-quit with no partner set.
    uint256 public totalBurned;

    event GoalCreated(
        address indexed saver,
        uint256 indexed goalId,
        string name,
        uint64 deadline,
        uint16 penaltyBps,
        address indexed partner
    );
    event Deposited(address indexed saver, uint256 indexed goalId, uint256 amount, uint256 newBalance);
    event Withdrawn(address indexed saver, uint256 indexed goalId, uint256 paidOut, uint256 penalty, bool early);
    event PenaltyClaimed(address indexed partner, uint256 amount);

    error EmptyName();
    error DeadlineInPast();
    error PenaltyTooHigh();
    error PartnerIsSelf();
    error NoSuchGoal();
    error ZeroDeposit();
    error NothingToWithdraw();
    error NothingToClaim();
    error TransferFailed();

    /// @notice Commit to a savings goal.
    /// @param partner Address that pockets your penalty if you bail early.
    ///                Use address(0) to burn penalties instead.
    function createGoal(string calldata name, uint64 deadline, uint16 penaltyBps, address partner)
        external
        returns (uint256 goalId)
    {
        if (bytes(name).length == 0) revert EmptyName();
        if (deadline <= block.timestamp) revert DeadlineInPast();
        if (penaltyBps > MAX_PENALTY_BPS) revert PenaltyTooHigh();
        if (partner == msg.sender) revert PartnerIsSelf();

        goalId = _goals[msg.sender].length;
        _goals[msg.sender].push(Goal(name, deadline, penaltyBps, partner, 0));
        emit GoalCreated(msg.sender, goalId, name, deadline, penaltyBps, partner);
    }

    /// @notice Stack MON toward a goal. Any amount, any time before you cash out.
    function deposit(uint256 goalId) external payable {
        if (msg.value == 0) revert ZeroDeposit();
        Goal storage g = _goal(msg.sender, goalId);
        g.balance += msg.value;
        emit Deposited(msg.sender, goalId, msg.value, g.balance);
    }

    /// @notice Withdraw a goal's full balance. Free after the deadline; before
    ///         it, the penalty is skimmed and credited to your partner.
    function withdraw(uint256 goalId) external {
        Goal storage g = _goal(msg.sender, goalId);
        uint256 balance = g.balance;
        if (balance == 0) revert NothingToWithdraw();

        bool early = block.timestamp < g.deadline;
        uint256 penalty = early ? (balance * g.penaltyBps) / BPS : 0;
        uint256 payout = balance - penalty;

        g.balance = 0;
        if (penalty != 0) {
            if (g.partner == address(0)) totalBurned += penalty;
            else claimable[g.partner] += penalty;
        }
        emit Withdrawn(msg.sender, goalId, payout, penalty, early);

        (bool ok,) = msg.sender.call{value: payout}("");
        if (!ok) revert TransferFailed();
    }

    /// @notice Partners collect the penalties their flaky friends paid them.
    function claim() external {
        uint256 amount = claimable[msg.sender];
        if (amount == 0) revert NothingToClaim();
        claimable[msg.sender] = 0;
        emit PenaltyClaimed(msg.sender, amount);

        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    /// @notice All goals for a saver, in creation order (index = goalId).
    function goalsOf(address saver) external view returns (Goal[] memory) {
        return _goals[saver];
    }

    /// @notice What a withdrawal would pay out right now.
    function previewWithdraw(address saver, uint256 goalId)
        external
        view
        returns (uint256 payout, uint256 penalty, bool early)
    {
        Goal storage g = _goal(saver, goalId);
        early = block.timestamp < g.deadline;
        penalty = early ? (g.balance * g.penaltyBps) / BPS : 0;
        payout = g.balance - penalty;
    }

    function _goal(address saver, uint256 goalId) private view returns (Goal storage g) {
        if (goalId >= _goals[saver].length) revert NoSuchGoal();
        g = _goals[saver][goalId];
    }
}
