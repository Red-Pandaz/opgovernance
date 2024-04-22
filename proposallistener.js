const dotenv = require("dotenv").config()
const { ethers, JsonRpcProvider } = require('ethers');
const fs = require('fs')
const opTokenAddress = '0x4200000000000000000000000000000000000042'
const opGovernorProxyAddress = '0xcdf27f107725988f2261ce2256bdfcde8b382b10'
const opGovernorReadyAsProxyABI = JSON.parse(require('./abi/opGovernorReadAsProxy.json').result)
const provider = new ethers.providers.JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${process.env.INFURA_API}`)

//There are 4 different CreatedProposal methods here, distinguished only by the variance in arguments
//As a result there are going to be 4 event listeners and 4 event handlers
//There is probably a way to refactor this and reduce the amounts of code but for now it works
//Ultimately this will be looped in server.js
const createdProposalMethod1 = ethers.utils.id('ProposalCreated(uint256,address,address,bytes,uint256,uint256,string,uint8)')
const createdProposalMethod2 = ethers.utils.id('ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string,uint8)')
const createdProposalMethod3 = ethers.utils.id('ProposalCreated(uint256,address,address,bytes,uint256,uint256,string)')
const createdProposalMethod4 = ethers.utils.id('ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)')

async function findNewProposals(castsToSend, fromBlock, toBlock){

   try {

    //Declaring function variables/constants
    const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
    const filter = opGovernorProxyContract.filters['()'];
    let currentBlock = await provider.getBlockWithTransactions('latest');
    let newProposals = []

    //Here we have 4 filters created
    const newProposalFilter1 = {
        address: opGovernorProxyAddress,
        topics: [createdProposalMethod1],
        fromBlock: fromBlock,
        toBlock: toBlock
    };
    const newProposalFilter2 = {
        address: opGovernorProxyAddress,
        topics: [createdProposalMethod2],
        fromBlock: fromBlock,
        toBlock: toBlock
    };

    const newProposalFilter3 = {
        address: opGovernorProxyAddress,
        topics: [createdProposalMethod3],
        fromBlock: fromBlock,
        toBlock: toBlock
    };

    const newProposalFilter4 = {
        address: opGovernorProxyAddress,
        topics: [createdProposalMethod4],
        fromBlock: fromBlock,
        toBlock: toBlock
    };
    const iface = new ethers.utils.Interface(opGovernorReadyAsProxyABI)
    //Searching for new proposals
    const createdProposal1Events = await opGovernorProxyContract.queryFilter(newProposalFilter1, fromBlock, toBlock)
    //Getting data from new proposals
    for (const event of createdProposal1Events){
        let decodedEvent = iface.decodeEventLog(createdProposalMethod1, event.data, event.topics)
        let header = decodedEvent[6]
        let proposalType = decodedEvent[7]
        let createBlock = await event.getTransactionReceipt()
        createBlock = createBlock.blockNumber
        let startBlock = parseInt((ethers.BigNumber.from(decodedEvent[4]).toString()))
        let endBlock  = parseInt((ethers.BigNumber.from(decodedEvent[5]).toString()))
        let proposalId = (ethers.BigNumber.from(decodedEvent.proposalId).toString())
        let proposer = decodedEvent.proposer
        let newProposalObject = {}
            //Formatting headers. This works on all proposals that have already been created
            //Unsure how to automatically parse titles when there seems to be no standardization
           if(header){
            header = header.slice(0, header.indexOf("\n"))
            if (header.includes('\\n')){
                header = header.slice(0, header.indexOf("\\n"))
            }
            if (header.includes(' - ')){
                header = header.slice(0, header.indexOf(" - "))
            }
            if (header.includes(' -- ')){
                header = header.slice(0, header.indexOf(" -- "))
            }
            if (header.includes('https')){
                header = header.slice(0, header.indexOf('https') - 2)
            }
            if (header.startsWith('# ')){
               header = header.substring(2);
             }
            //Creating new Proposal object
            newProposalObject.header = header;
            newProposalObject.proposer = proposer
            newProposalObject.transactionHash = event.transactionHash;
            newProposalObject.proposalId = proposalId;
            newProposalObject.createBlock = createBlock
            newProposalObject.startBlock = startBlock
            newProposalObject.endBlock = endBlock
            newProposalObject.proposalType = proposalType
            newProposalObject.filter = 1
            console.log("pushing " + newProposalObject)
            newProposals.push(newProposalObject)
                  
           }  else{
            console.log(null)
           }
        }

        //This entire process is repeated for all filters
        const createdProposal2Events = await opGovernorProxyContract.queryFilter(newProposalFilter2, fromBlock, toBlock)
        for (const event of createdProposal2Events){
        
            let decodedEvent = iface.decodeEventLog(createdProposalMethod2, event.data, event.topics)
            let header = decodedEvent[8]
            let proposalType = decodedEvent[9]
            let createBlock = await event.getTransactionReceipt()
            createBlock = createBlock.blockNumber
            let startBlock = parseInt((ethers.BigNumber.from(decodedEvent[6]).toString()))
            let endBlock  = parseInt((ethers.BigNumber.from(decodedEvent[7]).toString()))
            let proposalId = (ethers.BigNumber.from(decodedEvent.proposalId).toString())
            let proposer = decodedEvent.proposer
            let newProposalObject = {}
            //Formatting headers. This works on all proposals that have already been created
            //Unsure how to automatically parse titles when there seems to be no standardization
           if(header){
            header = header.slice(0, header.indexOf("\n"))
            if (header.includes('\\n')){
                header = header.slice(0, header.indexOf("\\n"))
            }
            if (header.includes(' - ')){
                header = header.slice(0, header.indexOf(" - "))
            }
            if (header.includes(' -- ')){
                header = header.slice(0, header.indexOf(" -- "))
            }
            if (header.includes('https')){
                header = header.slice(0, header.indexOf('https') - 2)
            }
            if (header.startsWith('# ')){
               header = header.substring(2);
             }
            //Creating new Proposal object
            newProposalObject.header = header;
            newProposalObject.proposer = proposer;
            newProposalObject.transactionHash = event.transactionHash;
            newProposalObject.proposalId = proposalId;
            newProposalObject.createBlock = createBlock
            newProposalObject.startBlock = startBlock
            newProposalObject.endBlock = endBlock
            newProposalObject.proposalType = proposalType
            newProposalObject.filter = 2
            console.log("pushing " + newProposalObject)
            newProposals.push(newProposalObject)
                  
           }  else{
            console.log(null)
           }
        }
        //This entire process is repeated for all filters
        const createdProposal3Events = await opGovernorProxyContract.queryFilter(newProposalFilter3, fromBlock, toBlock)
        for (const event of createdProposal3Events){
            let decodedEvent = iface.decodeEventLog(createdProposalMethod3, event.data, event.topics)
            let header = decodedEvent[6]
            let proposalType = null
            let createBlock = await event.getTransactionReceipt()
            createBlock = createBlock.blockNumber
            let startBlock = parseInt((ethers.BigNumber.from(decodedEvent[4]).toString()))
            let endBlock  = parseInt((ethers.BigNumber.from(decodedEvent[5]).toString()))
            let proposalId = (ethers.BigNumber.from(decodedEvent.proposalId).toString())
            let proposer = decodedEvent.proposer
            let newProposalObject = {}
            //Formatting headers. This works on all proposals that have already been created
            //Unsure how to automatically parse titles when there seems to be no standardization
           if(header){
            header = header.slice(0, header.indexOf("\n"))
            if (header.includes('\\n')){
                header = header.slice(0, header.indexOf("\\n"))
            }
            if (header.includes(' - ')){
                header = header.slice(0, header.indexOf(" - "))
            }
            if (header.includes(' -- ')){
                header = header.slice(0, header.indexOf(" -- "))
            }
            if (header.includes('https')){
                header = header.slice(0, header.indexOf('https') - 2)
            }
            if (header.startsWith('# ')){
               header = header.substring(2);
             }
            //Creating new Proposal object            
            newProposalObject.header = header;
            newProposalObject.proposer = proposer
            newProposalObject.transactionHash = event.transactionHash;
            newProposalObject.proposalId = proposalId;
            newProposalObject.createBlock = createBlock
            newProposalObject.startBlock = startBlock
            newProposalObject.endBlock = endBlock
            newProposalObject.proposalType = proposalType
            newProposalObject.filter = 3
            console.log("pushing " + newProposalObject)
            newProposals.push(newProposalObject)
                  
           }  else{
            console.log(null)
           }
        }
         //This entire process is repeated for all filters
        const createdProposal4Events = await opGovernorProxyContract.queryFilter(newProposalFilter4, fromBlock, toBlock)
        for (const event of createdProposal4Events){
          let decodedEvent = iface.decodeEventLog(createdProposalMethod4, event.data, event.topics)
            let header = decodedEvent[8]
            let proposalType = null
            let createBlock = await event.getTransactionReceipt()
            createBlock = createBlock.blockNumber
            let startBlock = parseInt((ethers.BigNumber.from(decodedEvent[6]).toString()))
            let endBlock  = parseInt((ethers.BigNumber.from(decodedEvent[7]).toString()))
            // let Quorum = parseInt(())
            let proposalId = (ethers.BigNumber.from(decodedEvent.proposalId).toString())
            let proposer = decodedEvent.proposer
            let newProposalObject = {}

            //Formatting headers. This works on all proposals that have already been created
            //Unsure how to automatically parse titles when there seems to be no standardization
           if(header){
            header = header.slice(0, header.indexOf("\n"))
            if (header.includes('\\n')){
                header = header.slice(0, header.indexOf("\\n"))
            }
            if (header.includes(' - ')){
                header = header.slice(0, header.indexOf(" - "))
            }
            if (header.includes(' -- ')){
                header = header.slice(0, header.indexOf(" -- "))
            }
            if (header.includes('https')){
                header = header.slice(0, header.indexOf('https') - 2)
            }
            if (header.startsWith('# ')){
               header = header.substring(2);
             }
             //Creating new Proposal object
            newProposalObject.header = header;
            newProposalObject.proposer = proposer;
            newProposalObject.transactionHash = event.transactionHash;
            newProposalObject.proposalId = proposalId
            newProposalObject.createBlock = createBlock
            newProposalObject.startBlock = startBlock
            newProposalObject.endBlock = endBlock
            newProposalObject.proposalType = proposalType
            newProposalObject.filter = 4
            console.log("pushing " + newProposalObject)
            newProposals.push(newProposalObject)
        
                  
           } 
        }
        // console.log("FOUND PROPOSALS: " + newProposals)
        newProposals.forEach(function(newProposal){
            let newCastObj = {}
            newCastObj.blockHeight = newProposal.createBlock
            newCastObj.transactionHash = newProposal.transactionHash
            const numberStr = newProposal.proposalId
            const firstSix = numberStr.substring(0, 6);
            const lastFour = numberStr.substring(numberStr.length - 4);
            const formattedId = firstSix + "..." + lastFour;
            newCastObj.cast = `New proposal created- ${newProposal.header} (proposalId ${formattedId})\nhttps://optimistic.etherscan.io/tx/${newProposal.transactionHash})`
            castsToSend.push(newCastObj)
            // console.log(newCastObj.cast)
        })
        console.log(newProposals)
        return newProposals
        // let idArray = []
        // proposalArray.forEach(function(proposal){
        //     idArray.push(proposal.proposalId)
        // })
//         const uniqueArray = Array.from(new Set(idArray));

//             if (uniqueArray.length === idArray.length) {
//         console.log('No duplicates found.');
//     } else {
//   console.log('Duplicates found.');
// }
//         //saving array locally, this will be saved to database one object at a time
        // proposalArray = JSON.stringify(proposalArray)
        // var fs = require('fs');
        // fs.writeFile("./proposons.json", proposalArray, function(err) {
        //     if (err) {
        //         console.log(err);
        //     }
        // });
    }catch(err){ 
        }
    return
    } 

module.exports = { findNewProposals } 