// SPDX-License-Identifier: CC-BY-NC-4.0

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IDC {
    function ownerOf(string memory name) external view returns (address);

    function nameExpires(string memory name) external view returns (uint256);
}

// Embedded Website Service

contract EWS is AccessControl {
    enum EWSType {
        EWS_UNKNOWN,
        EWS_NOTION,
        EWS_SUBSTACK
    }
    event RevenueAccountChanged(address indexed from, address to);
    event RevenueWithdrawn(address indexed to, uint256 amount);
    event EWSActivated(string name, bytes32 indexed node, string subdomain, bytes32 indexed label);
    event EWSUpdate(bytes32 indexed node, bytes32 indexed label, string landingPageFrom, string landingPageTo);
    event EWSTypeUpdate(bytes32 indexed node, bytes32 indexed label, EWSType ewsTypeFrom, EWSType ewsTypeTo);
    event EWSAdditionPageUpdate(bytes32 indexed node, bytes32 indexed label, string[] additionalPagesFrom, string[] additionalPagesTo);
    event EWSSubdomainRemoved(string name, bytes32 indexed node, string subdomain, bytes32 indexed label);
    event EWSAppendedAdditionalPages(bytes32 indexed node, bytes32 indexed label, string[] additionalPages);
    event EWSMaintainerPermissionChanged(bytes32 indexed node, bool maintainerAllowed);

    event EWSLandingPageFeeChanged(uint256 landingPageFeeFrom, uint256 landingPageFeeTo);
    event EWSPerAdditionalPageFeeChanged(uint256 perAdditionalPageFeeFrom, uint256 perAdditionalPageFeeTo);
    event EWSPerSubdomainFeeChanged(uint256 perSubdomainFeeFrom, uint256 perSubdomainFeeTo);
    event EWSDCContractChanged(address indexed from, address indexed to);
    event EWSUpgradedFromContractChanged(address indexed from, address indexed to);

    bytes32 public constant MAINTAINER_ROLE = keccak256("MAINTAINER_ROLE");
    address public revenueAccount;

    struct EWSConfig {
        string landingPage;
        string[] allowedPages;
        bool initialized;
        EWSType ewsType;
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
    EWS public upgradedFrom;

    constructor(IDC _dc, uint256 _landingPageFee, uint256 _perAdditionalPageFee, uint256 _perSubdomainFee) {
        dc = _dc;
        landingPageFee = _landingPageFee;
        perAdditionalPageFee = _perAdditionalPageFee;
        perSubdomainFee = _perSubdomainFee;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MAINTAINER_ROLE, msg.sender);
    }

    function getAllowMaintainerAccess(bytes32 node) public view returns (bool){
        return !configs[node].disallowMaintainer;
    }

    function getEwsType(bytes32 node, bytes32 label) public view returns (EWSType) {
        return configs[node].subdomainConfigs[label].ewsType;
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
        emit EWSDCContractChanged(address(dc), address(_dc));
        dc = _dc;
    }

    function setLandingPageFee(uint256 _landingPageFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        emit EWSLandingPageFeeChanged(landingPageFee, _landingPageFee);
        landingPageFee = _landingPageFee;
    }

    function setPerAdditionalPageFee(uint256 _perAdditionalPageFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        emit EWSPerAdditionalPageFeeChanged(perAdditionalPageFee, _perAdditionalPageFee);
        perAdditionalPageFee = _perAdditionalPageFee;
    }

    function setPerSubdomainFee(uint256 _perSubdomainFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        emit EWSPerSubdomainFeeChanged(perSubdomainFee, _perSubdomainFee);
        perSubdomainFee = _perSubdomainFee;
    }

    function setUpgradedFrom(EWS _upgradedFrom) public onlyRole(DEFAULT_ADMIN_ROLE) {
        emit EWSUpgradedFromContractChanged(address(upgradedFrom), address(_upgradedFrom));
        upgradedFrom = _upgradedFrom;
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
        emit EWSMaintainerPermissionChanged(node, configs[node].disallowMaintainer);
    }

    function getFees(string memory name, string memory subdomain, uint256 numAdditionalPages) public view returns (uint256){
        uint256 fees = landingPageFee + numAdditionalPages * perAdditionalPageFee;
        bytes32 node = keccak256(bytes(name));
        bytes32 label = keccak256(bytes(subdomain));
        EWSMultiConfig storage emc = configs[node];
        EWSConfig storage ec = emc.subdomainConfigs[label];
        if (!ec.initialized) {
            fees += perSubdomainFee;
        }
        return fees;
    }

    function _activate(string memory name, string memory subdomain) internal {
        bytes32 node = keccak256(bytes(name));
        bytes32 label = keccak256(bytes(subdomain));
        EWSMultiConfig storage emc = configs[node];
        EWSConfig storage ec = emc.subdomainConfigs[label];
        ec.initialized = true;
        emc.subdomains.push(subdomain);
        emit EWSActivated(name, node, subdomain, label);
    }

    function update(string memory name, string memory subdomain, EWSType ewsType, string memory landingPage, string[] memory allowedPages, bool landingPageOnly) public payable onlyNameOwnerOrMaintainer(name) {
        {
            uint256 fees = getFees(name, subdomain, landingPageOnly ? 0 : allowedPages.length);
            require(msg.value >= fees, "EWS:update: insufficient payment");
        }
        bytes32 node = keccak256(bytes(name));
        bytes32 label = keccak256(bytes(subdomain));
        EWSMultiConfig storage emc = configs[node];
        EWSConfig storage ec = emc.subdomainConfigs[label];
        if (keccak256(bytes(landingPage)) != keccak256(bytes(ec.landingPage))) {
            emit EWSUpdate(node, label, ec.landingPage, landingPage);
        }
        if (ec.ewsType != ewsType) {
            emit EWSTypeUpdate(node, label, ec.ewsType, ewsType);
        }
        emit EWSAdditionPageUpdate(node, label, ec.allowedPages, allowedPages);
        if (!ec.initialized) {
            _activate(name, subdomain);
        }
        ec.ewsType = ewsType;
        ec.landingPage = landingPage;
        if (!landingPageOnly) {
            ec.allowedPages = allowedPages;
        }

    }

    function appendAllowedPages(string memory name, string memory subdomain, string[] memory moreAllowedPages) public payable onlyNameOwnerOrMaintainer(name) {
        uint256 fees = moreAllowedPages.length * perAdditionalPageFee;
        require(msg.value >= fees, "EWS:append: insufficient payment");
        bytes32 node = keccak256(bytes(name));
        bytes32 label = keccak256(bytes(subdomain));
        EWSConfig storage ec = configs[node].subdomainConfigs[label];
        for (uint256 i = 0; i < moreAllowedPages.length; i++) {
            ec.allowedPages.push(moreAllowedPages[i]);
        }
        emit EWSAppendedAdditionalPages(node, label, moreAllowedPages);
    }

    function remove(string memory name, string memory subdomain) public onlyNameOwnerOrMaintainer(name) {
        bytes32 node = keccak256(bytes(name));
        bytes32 label = keccak256(bytes(subdomain));
        EWSConfig storage ec = configs[node].subdomainConfigs[label];
        delete ec.landingPage;
        delete ec.allowedPages;
        delete ec.initialized;
        delete ec.ewsType;
        delete configs[node].subdomainConfigs[label];
        string[] storage subdomains = configs[node].subdomains;
        for (uint256 i = 0; i < subdomains.length; i++) {
            if (keccak256(bytes(subdomains[i])) == keccak256(bytes(subdomain))) {
                subdomains[i] = subdomains[subdomains.length - 1];
                subdomains.pop();
                emit EWSSubdomainRemoved(name, node, subdomain, label);
                return;
            }
        }
        revert("EWS: subdomain not found");
    }

    function setRevenueAccount(address _revenueAccount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        emit RevenueAccountChanged(revenueAccount, _revenueAccount);
        revenueAccount = _revenueAccount;
    }

    function withdraw() external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || msg.sender == revenueAccount, "EWS: must be admin or revenue account");
        emit RevenueWithdrawn(revenueAccount, address(this).balance);
        (bool success,) = revenueAccount.call{value: address(this).balance}("");
        require(success, "EWS: failed to withdraw");
    }

    function restore(string memory name, string memory subdomain, EWSType ewsType) public onlyNameOwnerOrMaintainer(name) {
        if (address(upgradedFrom) == address(0)) {
            revert("EWS: no old contract");
        }
        bytes32 node = keccak256(bytes(name));
        bytes32 label = keccak256(bytes(subdomain));
        EWSMultiConfig storage emc = configs[node];
        EWSConfig storage ec = emc.subdomainConfigs[label];
        if (ec.initialized) {
            revert("EWS: already initialized");
        }
        //        upgradedFrom.get
        string memory landingPage = upgradedFrom.getLandingPage(node, label);
        if (bytes(landingPage).length == 0) {
            revert("EWS: not configured");
        }
        string[] memory allowedPages = upgradedFrom.getAllowedPages(node, label);
        if (keccak256(bytes(landingPage)) != keccak256(bytes(ec.landingPage))) {
            emit EWSUpdate(node, label, ec.landingPage, landingPage);
        }
        if (ec.ewsType != ewsType) {
            emit EWSTypeUpdate(node, label, ec.ewsType, ewsType);
        }
        ec.ewsType = ewsType;
        ec.landingPage = landingPage;
        ec.allowedPages = allowedPages;
        emit EWSAdditionPageUpdate(node, label, ec.allowedPages, allowedPages);
    }
}