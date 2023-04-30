// SPDX-License-Identifier: CC-BY-NC-4.0

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IDC {
    function ownerOf(string memory name) external view returns (address);

    function nameExpires(string memory name) external view returns (uint256);
}

// Embedded Website Service

contract EWS is AccessControl {
    event RevenueAccountChanged(address from, address to);

    bytes32 public constant MAINTAINER_ROLE = keccak256("MAINTAINER_ROLE");
    address public revenueAccount;
    struct EWSConfig {
        string landingPage;
        string[] allowedPages;
        bool disallowMaintainer;
    }

    mapping(bytes32 => EWSConfig) public configs;
    IDC public dc;
    uint256 public landingPageFee;
    uint256 public perAdditionalPageFee;

    constructor(IDC _dc, uint256 _landingPageFee, uint256 _perAdditionalPageFee) {
        dc = _dc;
        landingPageFee = _landingPageFee;
        perAdditionalPageFee = _perAdditionalPageFee;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MAINTAINER_ROLE, msg.sender);
    }

    function getAllowMaintainerAccess(bytes32 node) public view returns (bool){
        return !configs[node].disallowMaintainer;
    }

    function getLandingPage(bytes32 node) public view returns (string memory){
        return configs[node].landingPage;
    }

    function getAllowedPagesSlice(bytes32 node, uint256 start, uint256 end) public view returns (string[] memory){
        string[] memory ret = new string[](end - start);
        for (uint256 i = start; i < end; i++) {
            ret[i - start] = configs[node].allowedPages[i];
        }
        return ret;
    }

    function getAllowedPages(bytes32 node) public view returns (string[] memory){
        return configs[node].allowedPages;
    }

    function getNumAllowedPages(bytes32 node) public view returns (uint256){
        return configs[node].allowedPages.length;
    }

    function setDc(IDC _dc) public onlyRole(DEFAULT_ADMIN_ROLE) {
        dc = _dc;
    }

    function setLandingPageFee(uint256 _landingPageFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        landingPageFee = _landingPageFee;
    }

    function setPerAdditionalPageFee(uint256 _perAdditionalPageFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        perAdditionalPageFee = _perAdditionalPageFee;
    }

    modifier onlyNameOwner(string memory name){
        address renter = dc.ownerOf(name);
        uint256 expiry = dc.nameExpires(name);
        require(expiry > block.timestamp, "EWS: domain expired");
        require(renter == msg.sender, "EWS: not domain owner");
        _;
    }

    modifier onlyNameOwnerOrMaintainer(string memory name){
        address renter = dc.ownerOf(name);
        uint256 expiry = dc.nameExpires(name);
        require(expiry > block.timestamp, "EWS: domain expired");
        bytes32 node = keccak256(bytes(name));
        if (configs[node].disallowMaintainer) {
            require(renter == msg.sender, "EWS: not domain owner");
        } else {
            require(renter == msg.sender || hasRole(MAINTAINER_ROLE, msg.sender), "EWS: not domain owner or maintainer");
        }
        _;
    }

    function toggleMaintainerAccess(string memory name) public onlyNameOwner(name) {
        bytes32 node = keccak256(bytes(name));
        configs[node].disallowMaintainer = !configs[node].disallowMaintainer;
    }

    function update(string memory name, string memory landingPage, string[] memory allowedPages, bool landingPageOnly) public payable onlyNameOwnerOrMaintainer(name) {
        uint256 fees = landingPageFee + (landingPageOnly ? 0 : allowedPages.length * perAdditionalPageFee);
        require(msg.value >= fees, "EWS:update: insufficient payment");
        bytes32 node = keccak256(bytes(name));
        EWSConfig storage ec = configs[node];
        ec.landingPage = landingPage;
        if (!landingPageOnly) {
            ec.allowedPages = allowedPages;
        }
    }

    function appendAllowedPages(string memory name, string[] memory moreAllowedPages) public payable onlyNameOwnerOrMaintainer(name) {
        uint256 fees = moreAllowedPages.length * perAdditionalPageFee;
        require(msg.value >= fees, "EWS:append: insufficient payment");
        bytes32 node = keccak256(bytes(name));
        EWSConfig storage ec = configs[node];
        for (uint256 i = 0; i < moreAllowedPages.length; i++) {
            ec.allowedPages.push(moreAllowedPages[i]);
        }
    }

    function remove(string memory name) public onlyNameOwnerOrMaintainer(name) {
        bytes32 node = keccak256(bytes(name));
        EWSConfig storage ec = configs[node];
        ec.landingPage = "";
        delete ec.allowedPages;
        delete configs[node];
    }

    function setRevenueAccount(address _revenueAccount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        emit RevenueAccountChanged(revenueAccount, _revenueAccount);
        revenueAccount = _revenueAccount;
    }

    function withdraw() external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || msg.sender == revenueAccount, "EWS: must be admin or revenue account");
        (bool success,) = revenueAccount.call{value : address(this).balance}("");
        require(success, "EWS: failed to withdraw");
    }
}