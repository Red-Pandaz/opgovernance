const dotenv = require("dotenv").config()
const { ethers, JsonRpcProvider } = require('ethers');
const { getOpenProposals } = require('../database/database.js');
const { searchMatch } = require('../utils/helpers.js')
const opTokenAddress = '0x4200000000000000000000000000000000000042'
const opGovernorProxyAddress = '0xcdf27f107725988f2261ce2256bdfcde8b382b10'
const opGovernorReadyAsProxyABI = JSON.parse(require('../abi/opGovernorReadAsProxy.json').result)
const provider = new ethers.providers.JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${process.env.INFURA_API}`)
const proposals = JSON.parse(require ('../data/proposals.json'))




async function findNewProposals(castsToSend, fromBlock, toBlock){
    const createdProposalMethod1 = ethers.utils.id('ProposalCreated(uint256,address,address,bytes,uint256,uint256,string,uint8)')
    const createdProposalMethod2 = ethers.utils.id('ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string,uint8)')
    const createdProposalMethod3 = ethers.utils.id('ProposalCreated(uint256,address,address,bytes,uint256,uint256,string)')
    const createdProposalMethod4 = ethers.utils.id('ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)')
    
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
        })
        return newProposals
    }catch(err){ 
        }
    return
    } 

module.exports = { findNewProposals } 


const proposalId = ethers.BigNumber.from('20327152654308054166942093105443920402082671769027198649343468266910325783863')
async function getCanceledProposals(castArray, closedArray, openProposals, newProposals, fromBlock, toBlock){
    try{
        const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
        const filter = opGovernorProxyContract.filters.ProposalCanceled()
        const cancelEvents = await opGovernorProxyContract.queryFilter(filter, fromBlock, toBlock)
        for(let cancelEvent of cancelEvents){
            
            let castObj = {}
            let id = cancelEvent.args.proposalId
            let proposalId = (ethers.BigNumber.from(id).toString())
            castObj.blockHeight = cancelEvent.blockNumber
            castObj.transactionHash = cancelEvent.transactionHash
            let cancelObj = {}
            cancelObj.proposalId = proposalId
            // let cancelationArray = searchMatch(cancelObj, openProposals, newProposals)
            // console.log(cancelationArray)
            const firstSix = proposalId.substring(0, 6);
            const lastFour = proposalId.substring(proposalId.length - 4);
            const formattedId = firstSix + "..." + lastFour;
            let header
            const newIndex = newProposals.findIndex(item => item.proposalId === proposalId);
            if (newIndex !== -1) {
                header = newProposals[newIndex].header
                closedArray.push(newProposals[newIndex])
                newProposals.splice(newIndex, 1);
            } 
            const openIndex = openProposals.findIndex(item => item.proposalId === proposalId)
            if (openIndex !== -1) {
                header = openProposals[openIndex].header
                closedArray.push(openProposals[openIndex])
                openProposals.splice(openIndex, 1);
            } 
            castObj.cast = `Proposal Canceled- ${header}(ProposalId ${formattedId}): https://optimistic.etherscan.io/tx/${castObj.transactionHash})`
            castArray.push(castObj)
        }
    return
    }catch(err){
        console.log(err)
    }
}

async function getExpiredProposals(castArray, openProposals, closedProposals, currentBlock){
    const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
    for(let proposal of openProposals){
        if(proposal.endBlock <= currentBlock){
            const resultsObj = {}
            const results = await opGovernorProxyContract.proposalVotes(proposal.proposalId)
            resultsObj.forVotes = (parseInt((ethers.BigNumber.from(results.forVotes).toString()))) * Math.pow(10, -18)
            resultsObj.againstVotes = (parseInt((ethers.BigNumber.from(results.againstVotes).toString()))) * Math.pow(10, -18)
            resultsObj.abstainVotes = (parseInt((ethers.BigNumber.from(results.abstainVotes).toString()))) * Math.pow(10, -18)
            if(resultsObj.forVotes > resultsObj.againstVotes){
                resultsObj.results = "For"
           }
           if(resultsObj.forVotes < resultsObj.againstVotes){
                resultsObj.results = "Against"
           } 
           if(resultsObj.forVotes === resultsObj.againstVotes){
                resultsObj.results = "Tie"
           }
           resultsObj.forVotes = parseFloat(resultsObj.forVotes.toFixed(2)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
           resultsObj.againstVotes = parseFloat(resultsObj.againstVotes.toFixed(2)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
           resultsObj.abstainVotes = parseFloat(resultsObj.abstainVotes.toFixed(2)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
           const numberStr = proposal.proposalId.toString();
           const firstSix = numberStr.substring(0, 6);
           const lastFour = numberStr.substring(numberStr.length - 4);
           const formattedId = firstSix + "..." + lastFour;
           let castObject= {}
           castObject.transactionHash = null
           castObject.blockHeight = proposal.endBlock
           castObject.cast = (`Voting ended for Proposal ${proposal.header} (ID ${formattedId})\n For: ${resultsObj.forVotes} OP\n Against: ${resultsObj.againstVotes} OP\n Abstain: ${resultsObj.abstainVotes} OP` )
           castArray.push(castObject)
           proposal.results = resultsObj
           closedProposals.push(proposal)
        }
    }
    return
}

async function getNewVotes(castsToSend, openProposals, newProposals, fromBlock, toBlock, voteMinimum){
    try{
        const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
        const voteFilter = opGovernorProxyContract.filters.VoteCast()
        const voteWithParamsFilter = opGovernorProxyContract.filters.VoteCastWithParams()
        // const voteEvents = await Promise.all([
        //     opGovernorProxyContract.queryFilter(voteFilter, fromBlock, toBlock),
        //     opGovernorProxyContract.queryFilter(voteWithParamsFilter, fromBlock, toBlock)
        // ]);
        const voteEvents = await opGovernorProxyContract.queryFilter(voteFilter, fromBlock, toBlock)
        const voteParamEvents = await opGovernorProxyContract.queryFilter(voteWithParamsFilter, fromBlock, toBlock)
        console.log(voteParamEvents)
        for(let voteEvent of voteEvents){
            var voteValue = (ethers.BigNumber.from(voteEvent.args.weight).toString());
            voteValue = voteValue * Math.pow(10, -18);
            voteValue = Math.round(voteValue)
            if(voteValue >= voteMinimum){
                let voteObj = {}
                voteObj.proposalId = (BigInt(voteEvent.args.proposalId._hex, 16)).toString()
                voteObj.transactionHash = voteEvent.transactionHash
                voteObj.blockHeight = voteEvent.blockNumber
                voteObj.voter = voteEvent.args.voter
                voteObj.voteWeight = voteValue
                voteObj.support = voteEvent.args.support
                let voteArray = searchMatch(voteObj, openProposals, newProposals)
                let castObj = {}
                castObj.blockHeight = voteObj.blockHeight
                castObj.transactionHash = voteObj.transactionHash
                let formattedVoteValue = voteValue.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
                const propFirstSix = voteObj.proposalId.substring(0, 6);
                const propLastFour = voteObj.proposalId.substring(voteObj.proposalId.length - 4);
                const formattedPropId = propFirstSix + "..." + propLastFour;
                const addressStr = voteObj.voter
                const addressFirstEight = addressStr.substring(0, 8);
                const addressLastFour = addressStr.substring(addressStr.length - 4);
                const formattedAddress = addressFirstEight + "..." + addressLastFour;
                let voteString = ''
                if(voteObj.support === 0){
                    voteString = 'voted against'
                }else if(voteObj.support === 1){
                    voteString = 'voted for'
                }else{
                    voteString = 'voted to abstain from'
                }
                if(voteArray){
                    castObj.cast = `${formattedAddress} ${voteString} proposal ${voteArray[0].matchedObj.header} (proposalId ${formattedPropId}) with ${formattedVoteValue} OP vote weight: https://optimistic.etherscan.io/tx/${castObj.transactionHash}`
                    // console.log(castObj)
                } else{
                    castObj.cast = `${formattedAddress} ${voteString} proposal ${formattedPropId} with ${formattedVoteValue} OP vote weight: https://optimistic.etherscan.io/tx/${castObj.transactionHash}`
                }
                castsToSend.push(castObj)
            }
        }
    } catch(err){
        console.log("Get New Votes Error: " + err)
    }
    console.log("finishing get new votes")
    return

}

// async function getProposalUpdates(){
//     let currentBlock = await provider.getBlockWithTransactions('latest')
//     const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
//     const filter = opGovernorProxyContract.filters.ProposalCanceled()
//     const deadlineUpdateEvents = await opGovernorProxyContract.queryFilter(filter, currentBlock.number - 10000000, currentBlock.number)
//     console.log(deadlineUpdateEvents)

// }



async function getVoteResults(proposalId){
    const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
    let voteResult = await opGovernorProxyContract.proposalVotes(proposalId)
    voteResult.forEach(function(result){
        result = ethers.BigNumber.from(result).toString()
    })
    let againstVotes = ethers.BigNumber.from(voteResult.againstVotes).toString()
    let forVotes = ethers.BigNumber.from(voteResult.forVotes).toString()
    let abstainVotes = ethers.BigNumber.from(voteResult.abstainVotes).toString()

    let voteResults = {}
    voteResults.proposalId = proposalId
    voteResults.forVotes = forVotes
    voteResults.againstVotes = againstVotes
    voteResults.abstainVotes = abstainVotes
}



module.exports = { getExpiredProposals, getCanceledProposals, getNewVotes, getVoteResults, findNewProposals }

