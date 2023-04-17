// SPDX-License-Identifier: CC-BY-NC-4.0

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IDC {
    function ownerOf(string memory name) external view returns (address);

    function nameExpires(string memory name) external view returns (uint256);
}

// Embedded Website Service

contract EWS is Ownable {
    struct EWSConfig {
        string landingPage;
        string[] allowedPages;
    }

    mapping(bytes32 => EWSConfig) public configs;
    IDC public dc;
    uint256 public landingPageFee;
    uint256 public perAdditionalPageFee;

    constructor(IDC _dc, uint256 _landingPageFee, uint256 _perAdditionalPageFee) {
        dc = _dc;
        landingPageFee = _landingPageFee;
        perAdditionalPageFee = _perAdditionalPageFee;
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

    function setDc(IDC _dc) public onlyOwner {
        dc = _dc;
    }
    function setLandingPageFee(uint256 _landingPageFee) public onlyOwner {
        landingPageFee = _landingPageFee;
    }
    function setPerAdditionalPageFee(uint256 _perAdditionalPageFee) public onlyOwner {
        perAdditionalPageFee = _perAdditionalPageFee;
    }

    modifier onlyNameOwner(string memory name){
        address renter = dc.ownerOf(name);
        uint256 expiry = dc.nameExpires(name);
        require(renter == msg.sender, "EWS: not domain owner");
        require(expiry > block.timestamp, "EWS: domain expired");
        _;
    }

    function update(string memory name, string memory landingPage, string[] memory allowedPages, bool landingPageOnly) public payable onlyNameOwner(name) {
        bytes32 node = keccak256(bytes(name));
        EWSConfig storage ec = configs[node];
        ec.landingPage = landingPage;
        if (!landingPageOnly) {
            ec.allowedPages = allowedPages;
        }
    }

    function appendAllowedPages(string memory name, string[] memory moreAllowedPages) public payable onlyNameOwner(name) {
        bytes32 node = keccak256(bytes(name));
        EWSConfig storage ec = configs[node];
        for (uint256 i = 0; i < moreAllowedPages.length; i++) {
            ec.allowedPages.push(moreAllowedPages[i]);
        }
    }

    function remove(string memory name) public onlyNameOwner(name) {
        bytes32 node = keccak256(bytes(name));
        EWSConfig storage ec = configs[node];
        ec.landingPage = "";
        delete ec.allowedPages;
        delete configs[node];
    }
}