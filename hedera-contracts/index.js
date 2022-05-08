console.clear();
require("dotenv").config();
const {
	AccountId,
	PrivateKey,
	Client,
	FileCreateTransaction,
	ContractCreateTransaction,
	ContractFunctionParameters,
	ContractExecuteTransaction,
	ContractCallQuery,
	Hbar,
} = require("@hashgraph/sdk");
const fs = require("fs");

// Configure accounts and client
const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function main() {
	// Import the compiled contract bytecode
	const contractBytecode = fs.readFileSync("PaymentGateway_sol_PaymentGateway.bin");

	// Create a file on Hedera and store the bytecode
	const fileCreateTx = new FileCreateTransaction()
		.setContents(contractBytecode)
		.setKeys([operatorKey])
		.freezeWith(client);
	const fileCreateSign = await fileCreateTx.sign(operatorKey);
	const fileCreateSubmit = await fileCreateSign.execute(client);
	const fileCreateRx = await fileCreateSubmit.getReceipt(client);
	const bytecodeFileId = fileCreateRx.fileId;
	console.log(`- The bytecode file ID is: ${bytecodeFileId} \n`);

	// Instantiate the smart contract
	const contractInstantiateTx = new ContractCreateTransaction()
		.setBytecodeFileId(bytecodeFileId)
		.setGas(100000)
		.setConstructorParameters(
            new ContractFunctionParameters().addUint256(10)
		);
	const contractInstantiateSubmit = await contractInstantiateTx.execute(client);
	const contractInstantiateRx = await contractInstantiateSubmit.getReceipt(client);
	const contractId = contractInstantiateRx.contractId;
	const contractAddress = contractId.toSolidityAddress();
	console.log(`- The smart contract ID is: ${contractId} \n`);
	console.log(`- The smart contract ID in Solidity format is: ${contractAddress} \n`);

    //TODO: How to attach payment when querying a contract function
    //TODO: How to get test HBAR
    //TODO: How to do client integration if Metamask is not supported

	// // Query the contract to check changes in state variable
	// const contractQueryTx = new ContractCallQuery()
	// 	.setContractId(contractId)
	// 	.setGas(100000)
	// 	.setFunction("getMobileNumber", new ContractFunctionParameters().addString("Alice"));
	// const contractQuerySubmit = await contractQueryTx.execute(client);
	// const contractQueryResult = contractQuerySubmit.getUint256(0);
	// console.log(`- Here's the phone number that you asked for: ${contractQueryResult} \n`);

	// Call contract function to update the state variable
	// register as issuer
	const contractExecuteTx1 = new ContractExecuteTransaction()
		.setContractId(contractId)
		.setGas(100000)
		.setFunction(
			"registerAsIssuer",
			new ContractFunctionParameters()
		);
	const contractExecuteSubmit1 = await contractExecuteTx1.execute(client);
	const contractExecuteRx1 = await contractExecuteSubmit1.getReceipt(client);
	console.log(`- Contract function call status: ${contractExecuteRx1.status} \n`);

	// make verification payment
	const contractExecuteTx2 = new ContractExecuteTransaction()
		.setContractId(contractId)
		.setGas(100000)
		.setPayableAmount(100)
		.setFunction(
			"makeVerificationPayment",
			new ContractFunctionParameters().addAddress("0x0000000000000000000000000000000000000001")
		);
	const contractExecuteSubmit2 = await contractExecuteTx2.execute(client);
	const contractExecuteRx2 = await contractExecuteSubmit2.getReceipt(client);
	console.log(`- Contract function call status: ${contractExecuteRx2.status} \n`);

	// // Query the contract to check changes in state variable
	// const contractQueryTx1 = new ContractCallQuery()
	// 	.setContractId(contractId)
	// 	.setGas(100000)
	// 	.setFunction("getMobileNumber", new ContractFunctionParameters().addString("Bob"));
	// const contractQuerySubmit1 = await contractQueryTx1.execute(client);
	// const contractQueryResult1 = contractQuerySubmit1.getUint256(0);
	// console.log(`- Here's the phone number that you asked for: ${contractQueryResult1} \n`);
}
main();