// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FarmerCreditNFT
 * @dev Simplified NFT contract for tokenizing farmer credit profiles
 * Each NFT represents a farmer's creditworthiness and financial history
 */
contract FarmerCreditNFT {
    // ======================== STATE VARIABLES ========================
    string public name = "FarmerCreditProfile";
    string public symbol = "FCP";
    uint256 private _tokenIdCounter;

    // Role-based access control
    mapping(address => bool) public authorizedMinters;
    mapping(address => bool) public authorizedUpdaters;
    address public admin;

    // ERC721 mappings
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // Core farmer credit profile structure
    struct FarmerCreditProfile {
        bytes32 farmerDID; // Unique farmer identifier
        uint32 stateCode; // Government/ISO state code
        uint32 districtCode; // District code
        uint16 cropClusterCode; // Oilseed cluster/agro-climatic zone
        // Production + yield performance
        uint64 avgYieldKgPerAcre; // Rolling average yield
        uint64 AvgSeasonYieldIndex; // Normalized yield index
        // Financial/loan performance
        uint64 totalDisbursed; // Total loan disbursed (in paise)
        uint64 totalRepaid; // Total repaid (in paise)
        uint32 onTimeRepayments; // Count of on-time loans
        uint32 lateRepayments; // Count of late but settled loans
        uint32 defaults; // Count of defaults/write-offs
        // Trust and incentive metrics
        uint16 trustMetric; // 0-10 trust score
        uint16 incentiveScore; // Government incentive eligibility
        uint64 updateDate; // Date of profile creation/update
        uint64 lastUpdated; // Unix timestamp of last update
    }

    // Mappings
    mapping(uint256 => FarmerCreditProfile) public creditProfiles;
    mapping(bytes32 => uint256) public farmerDIDToTokenId;
    mapping(uint256 => string) public tokenURIs;

    // Events
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );
    event Approval(
        address indexed owner,
        address indexed approved,
        uint256 indexed tokenId
    );
    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    event CreditProfileMinted(
        uint256 indexed tokenId,
        bytes32 indexed farmerDID,
        address indexed recipient,
        uint16 trustMetric,
        uint16 incentiveScore
    );

    event CreditProfileUpdated(
        uint256 indexed tokenId,
        bytes32 indexed farmerDID,
        uint16 newTrustMetric,
        uint16 newIncentiveScore,
        uint64 timestamp
    );

    event TrustMetricChanged(
        uint256 indexed tokenId,
        uint16 oldTrustMetric,
        uint16 newTrustMetric,
        string reason
    );

    event LoanPerformanceUpdated(
        uint256 indexed tokenId,
        uint64 totalDisbursed,
        uint64 totalRepaid,
        uint32 onTimeRepayments,
        uint32 lateRepayments,
        uint32 defaults
    );

    // Custom errors
    error Unauthorized();
    error ProfileAlreadyExists();
    error ProfileNotFound();
    error InvalidTrustMetric();
    error InvalidIncentiveScore();
    error ZeroAddress();
    error TokenNotFound();
    error NotOwnerOrApproved();

    // ======================== CONSTRUCTOR ========================
    constructor() {
        admin = msg.sender;
        authorizedMinters[msg.sender] = true;
        authorizedUpdaters[msg.sender] = true;
    }

    // ======================== MODIFIERS ========================
    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlyMinter() {
        if (!authorizedMinters[msg.sender]) revert Unauthorized();
        _;
    }

    modifier onlyUpdater() {
        if (!authorizedUpdaters[msg.sender]) revert Unauthorized();
        _;
    }

    modifier validProfile(FarmerCreditProfile memory profile) {
        if (profile.trustMetric > 10) revert InvalidTrustMetric();
        if (profile.incentiveScore > 100) revert InvalidIncentiveScore();
        _;
    }

    // ======================== ERC721 IMPLEMENTATION ========================
    function balanceOf(address owner) public view returns (uint256) {
        if (owner == address(0)) revert ZeroAddress();
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        if (owner == address(0)) revert TokenNotFound();
        return owner;
    }

    function approve(address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        if (to == owner) revert();
        if (msg.sender != owner && !isApprovedForAll(owner, msg.sender))
            revert NotOwnerOrApproved();

        _approve(to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        if (!_exists(tokenId)) revert TokenNotFound();
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public {
        if (operator == msg.sender) revert();
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(
        address owner,
        address operator
    ) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        if (!_isApprovedOrOwner(msg.sender, tokenId))
            revert NotOwnerOrApproved();
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public {
        if (!_isApprovedOrOwner(msg.sender, tokenId))
            revert NotOwnerOrApproved();
        _safeTransfer(from, to, tokenId, data);
    }

    // ======================== ACCESS CONTROL ========================
    function setAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        admin = newAdmin;
    }

    function addMinter(address minter) external onlyAdmin {
        if (minter == address(0)) revert ZeroAddress();
        authorizedMinters[minter] = true;
    }

    function removeMinter(address minter) external onlyAdmin {
        authorizedMinters[minter] = false;
    }

    function addUpdater(address updater) external onlyAdmin {
        if (updater == address(0)) revert ZeroAddress();
        authorizedUpdaters[updater] = true;
    }

    function removeUpdater(address updater) external onlyAdmin {
        authorizedUpdaters[updater] = false;
    }

    // ======================== MINTING FUNCTIONS ========================
    function mintCreditProfile(
        address recipient,
        FarmerCreditProfile memory profile,
        string memory metadataURI
    ) external onlyMinter validProfile(profile) returns (uint256) {
        if (recipient == address(0)) revert ZeroAddress();
        if (farmerDIDToTokenId[profile.farmerDID] != 0)
            revert ProfileAlreadyExists();

        // Generate random token_id between 12 and 48 (inclusive)
        uint256 tokenId = 12 + (uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            profile.farmerDID,
            _tokenIdCounter
        ))) % 37); // 37 = (48 - 12 + 1)
        
        _tokenIdCounter++;

        // Store the credit profile
        creditProfiles[tokenId] = profile;
        farmerDIDToTokenId[profile.farmerDID] = tokenId;
        tokenURIs[tokenId] = metadataURI;

        // Mint the NFT
        _mint(recipient, tokenId);

        emit CreditProfileMinted(
            tokenId,
            profile.farmerDID,
            recipient,
            profile.trustMetric,
            profile.incentiveScore
        );

        return tokenId;
    }

    // ======================== UPDATE FUNCTIONS ========================
    function updateLoanPerformance(
        uint256 tokenId,
        uint64 totalDisbursed,
        uint64 totalRepaid,
        uint32 onTimeRepayments,
        uint32 lateRepayments,
        uint32 defaults
    ) external onlyUpdater {
        if (!_exists(tokenId)) revert ProfileNotFound();

        FarmerCreditProfile storage profile = creditProfiles[tokenId];
        profile.totalDisbursed = totalDisbursed;
        profile.totalRepaid = totalRepaid;
        profile.onTimeRepayments = onTimeRepayments;
        profile.lateRepayments = lateRepayments;
        profile.defaults = defaults;
        profile.lastUpdated = uint64(block.timestamp);

        emit LoanPerformanceUpdated(
            tokenId,
            totalDisbursed,
            totalRepaid,
            onTimeRepayments,
            lateRepayments,
            defaults
        );
    }

    function updateYieldPerformance(
        uint256 tokenId,
        uint64 avgYieldKgPerAcre,
        uint64 avgSeasonYieldIndex
    ) external onlyUpdater {
        if (!_exists(tokenId)) revert ProfileNotFound();

        FarmerCreditProfile storage profile = creditProfiles[tokenId];
        profile.avgYieldKgPerAcre = avgYieldKgPerAcre;
        profile.AvgSeasonYieldIndex = avgSeasonYieldIndex;
        profile.lastUpdated = uint64(block.timestamp);
    }

    function updateTrustMetric(
        uint256 tokenId,
        uint16 newTrustMetric,
        string memory reason
    ) external onlyUpdater {
        if (!_exists(tokenId)) revert ProfileNotFound();
        if (newTrustMetric > 10) revert InvalidTrustMetric();

        FarmerCreditProfile storage profile = creditProfiles[tokenId];
        uint16 oldTrustMetric = profile.trustMetric;
        profile.trustMetric = newTrustMetric;
        profile.lastUpdated = uint64(block.timestamp);

        // Update incentive score based on trust metric
        profile.incentiveScore = calculateIncentiveScore(newTrustMetric);

        emit TrustMetricChanged(
            tokenId,
            oldTrustMetric,
            newTrustMetric,
            reason
        );
        emit CreditProfileUpdated(
            tokenId,
            profile.farmerDID,
            newTrustMetric,
            profile.incentiveScore,
            uint64(block.timestamp)
        );
    }

    function updateTokenURI(
        uint256 tokenId,
        string memory newURI
    ) external onlyUpdater {
        if (!_exists(tokenId)) revert ProfileNotFound();
        tokenURIs[tokenId] = newURI;
    }

    // ======================== VIEW FUNCTIONS ========================
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        if (!_exists(tokenId)) revert TokenNotFound();
        return tokenURIs[tokenId];
    }

    function getCreditProfile(
        uint256 tokenId
    ) external view returns (FarmerCreditProfile memory) {
        if (!_exists(tokenId)) revert ProfileNotFound();
        return creditProfiles[tokenId];
    }

    function getCreditProfileByDID(
        bytes32 farmerDID
    ) external view returns (FarmerCreditProfile memory) {
        uint256 tokenId = farmerDIDToTokenId[farmerDID];
        if (tokenId == 0) revert ProfileNotFound();
        return creditProfiles[tokenId];
    }

    function getTrustAndIncentive(
        uint256 tokenId
    ) external view returns (uint16 trustMetric, uint16 incentiveScore) {
        if (!_exists(tokenId)) revert ProfileNotFound();
        FarmerCreditProfile memory profile = creditProfiles[tokenId];
        return (profile.trustMetric, profile.incentiveScore);
    }

    function getRepaymentRatio(
        uint256 tokenId
    ) external view returns (uint256 ratio) {
        if (!_exists(tokenId)) revert ProfileNotFound();
        FarmerCreditProfile memory profile = creditProfiles[tokenId];

        if (profile.totalDisbursed == 0) return 0;
        return (profile.totalRepaid * 10000) / profile.totalDisbursed; // Basis points
    }

    function getLoanStats(
        uint256 tokenId
    )
        external
        view
        returns (
            uint32 totalLoans,
            uint32 onTimeRepayments,
            uint32 lateRepayments,
            uint32 defaults,
            uint256 successRate
        )
    {
        if (!_exists(tokenId)) revert ProfileNotFound();
        FarmerCreditProfile memory profile = creditProfiles[tokenId];

        totalLoans =
            profile.onTimeRepayments +
            profile.lateRepayments +
            profile.defaults;
        onTimeRepayments = profile.onTimeRepayments;
        lateRepayments = profile.lateRepayments;
        defaults = profile.defaults;

        if (totalLoans > 0) {
            successRate = (profile.onTimeRepayments * 10000) / totalLoans; // Basis points
        }
    }

    function calculateIncentiveScore(
        uint16 trustMetric
    ) public pure returns (uint16) {
        if (trustMetric >= 9) return 95;
        if (trustMetric >= 8) return 85;
        if (trustMetric >= 7) return 75;
        if (trustMetric >= 6) return 65;
        if (trustMetric >= 5) return 55;
        if (trustMetric >= 4) return 45;
        if (trustMetric >= 3) return 35;
        return 25;
    }

    function isPremiumEligible(uint256 tokenId) external view returns (bool) {
        if (!_exists(tokenId)) revert ProfileNotFound();
        FarmerCreditProfile memory profile = creditProfiles[tokenId];

        return
            profile.trustMetric >= 8 &&
            profile.defaults == 0 &&
            profile.onTimeRepayments >= 3;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // ======================== INTERNAL FUNCTIONS ========================
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _owners[tokenId] != address(0);
    }

    function _mint(address to, uint256 tokenId) internal {
        if (to == address(0)) revert ZeroAddress();
        if (_exists(tokenId)) revert();

        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(address(0), to, tokenId);
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        if (ownerOf(tokenId) != from) revert();
        if (to == address(0)) revert ZeroAddress();

        _approve(address(0), tokenId);

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _approve(address to, uint256 tokenId) internal {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }

    function _safeTransfer(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal {
        _transfer(from, to, tokenId);
        if (!_checkOnERC721Received(from, to, tokenId, data)) revert();
    }

    function _isApprovedOrOwner(
        address spender,
        uint256 tokenId
    ) internal view returns (bool) {
        if (!_exists(tokenId)) return false;
        address owner = ownerOf(tokenId);
        return (spender == owner ||
            getApproved(tokenId) == spender ||
            isApprovedForAll(owner, spender));
    }

    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private returns (bool) {
        if (to.code.length > 0) {
            try
                IERC721Receiver(to).onERC721Received(
                    msg.sender,
                    from,
                    tokenId,
                    data
                )
            returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert();
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }

    // ======================== INTERFACES ========================
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC165 Interface ID for ERC165
            interfaceId == 0x80ac58cd || // ERC165 Interface ID for ERC721
            interfaceId == 0x5b5e139f; // ERC165 Interface ID for ERC721Metadata
    }
}

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}
