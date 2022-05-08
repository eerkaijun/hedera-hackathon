pragma solidity ^0.8.9; 

contract PaymentGateway {

    uint256 public verificationFee;
    mapping (address => bool) issuerRegistered;
    mapping (address => uint256) issuerBalance;

    constructor(uint256 _verificationFee) {
        verificationFee = _verificationFee;
    }

    function registerAsIssuer() public {
        require(issuerRegistered[msg.sender] == false, "Issuer already registered");
        issuerRegistered[msg.sender] = true;
        emit newIssuer(msg.sender);
    }

    function makeVerificationPayment(address issuer) public payable {
        require(msg.value >= verificationFee, "Issuficient verification fee");
        require(issuerRegistered[issuer] == true, "Issuer not registered yet");
        issuerBalance[issuer] += msg.value;
    }

    function withdrawPayment() public {
        require(issuerRegistered[msg.sender] == true, "Issuer not registered yet");
        uint256 totalAmount = issuerBalance[msg.sender];
        issuerBalance[msg.sender] = 0;
        payable(msg.sender).transfer(totalAmount);
    }

    event newIssuer(address);

}