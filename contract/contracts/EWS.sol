// SPDX-License-Identifier: CC-BY-NC-4.0

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Enums.sol";

interface IDC {
    function ownerOf(string memory name) external view returns (address);

    function nameExpires(string memory name) external view returns (uint256);
}

// Embedded Website Service

contract EWS is AccessControl {
    event RevenueAccountChanged(address from, address to);
    event EWSActivated(string name, bytes32 indexed node, string subdomain, bytes32 indexed label, EWSType indexed ewsType);
    event EWSUpdate(bytes32 indexed node, bytes32 indexed label,
        EWSType indexed ewsTypeFrom, string landingPageFrom, string[] additionalPagesFrom,
        EWSType indexed ewsTypeTo, string landingPageTo, string[] additionalPagesTo);
    event EWSAppendedAdditionalPages(bytes32 indexed node, bytes32 indexed label, string[] additionalPages);
    event EWSMaintainerPermissionChanged(bytes32 indexed node, bytes32 indexed label, bool maintainerAllowed);

    event EWSLandingPageFeeChanged(uint256 landingPageFeeFrom, uint256 landingPageFeeTo);
    event EWSPerAdditionalPageFeeChanged(uint256 perAdditionalPageFeeFrom, uint256 perAdditionalPageFeeTo);
    event EWSPerSubdomainFeeChanged(uint256 perSubdomainFeeFrom, uint256 perSubdomainFeeTo);

    bytes32 public constant MAINTAINER_ROLE = keccak256("MAINTAINER_ROLE");
    address public revenueAccount;
    struct EWSConfig {
        string landingPage;
        string[] allowedPages;
    }
    struct EWSMultiConfig {
        mapping(bytes32 => EWSConfig) subdomainConfigs;
        string[] subdomains;
        bool disallowMaintainer;
    }

    mapping(bytes32 => EWSMultiConfig) public configs;
    IDC public dc;
    uint256 public landingPageFee;
    uint256 public perAdditionalPageFee;
    uint256 public perSubdomainFee;

    constructor(IDC _dc, uint256 _landingPageFee, uint256 _perAdditionalPageFee, uint256 _perSubdomainFee) {
        dc = _dc;
        landingPageFee = _landingPageFee;
        perAdditionalPageFee = _perAdditionalPageFee;
        perSubdomainFee = _perSubdomainFee;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MAINTAINER_ROLE, msg.sender);
    }

    function getAllowMaintainerAccess(bytes32 node, bytes32 label) public view returns (bool){
        return !configs[node].subdomainConfigs[label].disallowMaintainer;
    }

    function getLandingPage(bytes32 node, bytes32 label) public view returns (string memory){
        return configs[node].subdomainConfigs[label].landingPage;
    }

    function getAllowedPagesSlice(bytes32 node, bytes32 label, uint256 start, uint256 end) public view returns (string[] memory){
        string[] memory ret = new string[](end - start);
        for (uint256 i = start; i < end; i++) {
            ret[i - start] = configs[node].subdomainConfigs[label].allowedPages[i];
        }
        return ret;
    }

    function getAllowedPages(bytes32 node, bytes32 label) public view returns (string[] memory){
        return configs[node].subdomainConfigs[label].allowedPages;
    }

    function getNumAllowedPages(bytes32 node, bytes32 label) public view returns (uint256){
        return configs[node].subdomainConfigs[label].allowedPages.length;
    }

    function getSubdomains(bytes32 node) public view returns (string[] memory){
        return configs[node].subdomains;
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

    function setPerSubdomainFee(uint256 _perSubdomainFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        perSubdomainFee = _perSubdomainFee;
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