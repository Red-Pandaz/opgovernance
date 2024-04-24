const dotenv = require("dotenv").config()
const { ethers, JsonRpcProvider } = require('ethers');
const crypto = require('crypto');
const { retryApiCall, accessSecret } = require('../utils/apiutils.js');
const { getOpenProposals, updateEndBlocks } = require('../database/database.js');
const { searchMatch } = require('../utils/helpers.js')
const opTokenAddress = '0x4200000000000000000000000000000000000042'
const opGovernorProxyAddress = '0xcdf27f107725988f2261ce2256bdfcde8b382b10'
const opGovernorReadyAsProxyABI = JSON.parse(require('../abi/opGovernorReadAsProxy.json').result)

const proposals = JSON.parse(require ('../data/proposals.json'))

//Scans for new proposals, if found sends out a cast and updates database
async function findNewProposals(castsToSend, fromBlock, toBlock){
    const INFURA_API = await retryApiCall(() => accessSecret('INFURA_API'));
    const provider = new ethers.providers.JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${INFURA_API}`)
    const mainNetProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API}`)
    const createdProposalMethod1 = ethers.utils.id('ProposalCreated(uint256,address,address,bytes,uint256,uint256,string,uint8)')
    const createdProposalMethod2 = ethers.utils.id('ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string,uint8)')
    const createdProposalMethod3 = ethers.utils.id('ProposalCreated(uint256,address,address,bytes,uint256,uint256,string)')
    const createdProposalMethod4 = ethers.utils.id('ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)')
    
    try {

    //Declaring function variables/constants
    const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
    const filter = opGovernorProxyContract.filters['()'];
    let currentBlock =  await retryApiCall(() =>  provider.getBlockWithTransactions('latest'));
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
    const createdProposal1Events = await retryApiCall(() =>  opGovernorProxyContract.queryFilter(newProposalFilter1, fromBlock, toBlock))
    //Getting data from new proposals
    for (const event of createdProposal1Events){
        let decodedEvent = iface.decodeEventLog(createdProposalMethod1, event.data, event.topics)
        let header = decodedEvent[6]
        let proposalType = decodedEvent[7]
        let createBlock = await retryApiCall(() =>  event.getTransactionReceipt())
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
            newProposals.push(newProposalObject)
                  
           }  else{
            console.log(null)
           }
        }

        //This entire process is repeated for all filters
        const createdProposal2Events = await retryApiCall(() =>  opGovernorProxyContract.queryFilter(newProposalFilter2, fromBlock, toBlock))
        for (const event of createdProposal2Events){
        
            let decodedEvent = iface.decodeEventLog(createdProposalMethod2, event.data, event.topics)
            let header = decodedEvent[8]
            let proposalType = decodedEvent[9]
            let createBlock = await retryApiCall(() => event.getTransactionReceipt())
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
            newProposals.push(newProposalObject)
                  
           }  else{
            console.log(null)
           }
        }
        //This entire process is repeated for all filters
        const createdProposal3Events = await retryApiCall(() =>  opGovernorProxyContract.queryFilter(newProposalFilter3, fromBlock, toBlock))
        for (const event of createdProposal3Events){
            let decodedEvent = iface.decodeEventLog(createdProposalMethod3, event.data, event.topics)
            let header = decodedEvent[6]
            let proposalType = null
            let createBlock = await retryApiCall(() =>  event.getTransactionReceipt())
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
            newProposals.push(newProposalObject)
                  
           }  else{
            console.log(null)
           }
        }
         //This entire process is repeated for all filters
        const createdProposal4Events = await retryApiCall(() =>  opGovernorProxyContract.queryFilter(newProposalFilter4, fromBlock, toBlock))
        for (const event of createdProposal4Events){
          let decodedEvent = iface.decodeEventLog(createdProposalMethod4, event.data, event.topics)
            let header = decodedEvent[8]
            let proposalType = null
            let createBlock = await retryApiCall(() => event.getTransactionReceipt())
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
            newCastObj.cast = `New proposal created- ${newProposal.header} (ID ${formattedId})`
            newCastObj.hasUrl = true
            castsToSend.push(newCastObj)
        })
        return newProposals
    }catch(err){ 
        }
    return
    } 

    //Looks for canceled proposals. If found, sends out a cast and sends proposal to closed collection
async function getCanceledProposals(castArray, closedArray, openProposals, newProposals, fromBlock, toBlock){
    try{
        const INFURA_API = await retryApiCall(() => accessSecret('INFURA_API'));
        const provider = new ethers.providers.JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${INFURA_API}`)
        const mainNetProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API}`)
        const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
        const filter = opGovernorProxyContract.filters.ProposalCanceled()
        const cancelEvents = await retryApiCall(() =>  opGovernorProxyContract.queryFilter(filter, fromBlock, toBlock))
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
            castObj.cast = `Proposal canceled- ${header}(ID ${formattedId})`
            castObj.hasUrl = true
            castArray.push(castObj)
        }
    return
    }catch(err){
        console.log(err)
    }
}

//Checks open proposals and compared endBlock vs. current block. IF expired casts out results and sends proposal to closed collection
async function getExpiredProposals(castArray, openProposals, closedProposals, currentBlock){
    const INFURA_API = await retryApiCall(() => accessSecret('INFURA_API'));
    const provider = new ethers.providers.JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${INFURA_API}`)
    const mainNetProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API}`)
    const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
    for(let proposal of openProposals){
        if(proposal.endBlock <= currentBlock){
            const resultsObj = {}
            const results = await retryApiCall(() => opGovernorProxyContract.proposalVotes(proposal.proposalId))
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
        
           castObject.blockHeight = proposal.endBlock
           castObject.cast = (`Voting ended for proposal ${proposal.header} (ID ${formattedId})\n For: ${resultsObj.forVotes} OP\n Against: ${resultsObj.againstVotes} OP\n Abstain: ${resultsObj.abstainVotes} OP` )
           let jsonString = JSON.stringify(castObject);
           castObject.transactionHash = crypto.createHash('sha256').update(jsonString).digest('hex');
           castObject.hasUrl = false;
           castArray.push(castObject)
           proposal.results = resultsObj
           closedProposals.push(proposal)
        }
    }
    return
}

//gets votes and votes with params, sends out a cast if vote weight is >= 500,000 OP
async function getNewVotes(castsToSend, openProposals, newProposals, fromBlock, toBlock, voteMinimum){
    try{
        const INFURA_API = await retryApiCall(() => accessSecret('INFURA_API'));
        const provider = new ethers.providers.JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${INFURA_API}`)
        const mainNetProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API}`)
        const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
        const voteFilter = opGovernorProxyContract.filters.VoteCast()
        const voteWithParamsFilter = opGovernorProxyContract.filters.VoteCastWithParams()
        const voteWithoutParamEvents = await retryApiCall(() => opGovernorProxyContract.queryFilter(voteFilter, fromBlock, toBlock))
        const voteWithParamEvents = await retryApiCall(() =>  opGovernorProxyContract.queryFilter(voteWithParamsFilter, fromBlock, toBlock))
        let voteEvents = voteWithoutParamEvents.concat(voteWithParamEvents)
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
                let formattedAddress = addressFirstEight + "..." + addressLastFour;
                const ensName = await retryApiCall(() => mainNetProvider.lookupAddress(addressStr))
                if(ensName){
                    formattedAddress = ensName
                }
                let voteString = ''
                if(voteObj.support === 0){
                    voteString = 'voted against'
                }else if(voteObj.support === 1){
                    voteString = 'voted for'
                }else{
                    voteString = 'voted to abstain from'
                }
                if(voteArray){
                    castObj.cast = `${formattedAddress} ${voteString} proposal ${voteArray[0].matchedObj.header} (ID ${formattedPropId}) with ${formattedVoteValue} OP vote weight`
                    // console.log(castObj)
                } else{
                    castObj.cast = `${formattedAddress} ${voteString} proposal ${formattedPropId} with ${formattedVoteValue} OP vote weight`
                }
                castObj.hasUrl = true
                castsToSend.push(castObj)
            }
        }
    } catch(err){
        console.log("Get New Votes Error: " + err)
    }
    console.log("finishing get new votes")
    return

}

//Currently only looks for updated proposal deadlines but will eventually have logic for updates quorums and proposal types
async function getProposalUpdates(castArray,  openProposals, newProposals, fromBlock, toBlock){
    const INFURA_API = await retryApiCall(() => accessSecret('INFURA_API'));
    const provider = new ethers.providers.JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${INFURA_API}`)
    const mainNetProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API}`)
    let currentBlock = await retryApiCall(() =>  provider.getBlockWithTransactions('latest'))
    const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
    const deadlineFilter = opGovernorProxyContract.filters.ProposalDeadlineUpdated()
    const quorumFilter = opGovernorProxyContract.filters.QuorumNumeratorUpdated()
    const deadlineUpdateEvents = await retryApiCall(() =>  opGovernorProxyContract.queryFilter(deadlineFilter,fromBlock, toBlock))
    const quorumUpdateEvents = await retryApiCall(() => opGovernorProxyContract.queryFilter(quorumFilter, fromBlock, toBlock))
    let proposalsToUpdate = []
    for(let deadlineUpdateEvent of deadlineUpdateEvents){
        
            let deadlineUpdateObj = {}
            let castObject = {}
            deadlineUpdateObj.proposalId = ((BigInt(deadlineUpdateEvent.args[0]._hex, 16)).toString())
            deadlineUpdateObj.newDeadline = Number(BigInt(deadlineUpdateEvent.args[1]._hex, 16));
            let deadlineIdMatch = searchMatch(deadlineUpdateObj, openProposals, newProposals)
            deadlineUpdateObj.endBlock = deadlineUpdateObj.newDeadline
            if(deadlineIdMatch[0].source === 'openProposals'){
                openProposals[deadlineIdMatch[0].index].endBlock =  deadlineUpdateObj.newDeadline 
                proposalsToUpdate.push(deadlineUpdateObj)
            }
            if(deadlineIdMatch[0].source === 'newProposals'){
            newProposals[deadlineIdMatch[0].index].endBlock = deadlineUpdateObj.newDeadline 
            }
                const propFirstSix = deadlineUpdateObj.proposalId.substring(0, 6);
                const propLastFour = deadlineUpdateObj.proposalId.substring(deadlineUpdateObj.proposalId.length - 4);
                const formattedPropId = propFirstSix + "..." + propLastFour;
            castObject.blockHeight = deadlineUpdateEvent.blockNumber
            castObject.transactionHash = deadlineUpdateEvent.transactionHash
            castObject.cast = `Proposal deadline updated for ${deadlineIdMatch[0].matchedObj.header} (ID ${formattedPropId} \n Old deadline: block ${deadlineUpdateObj.oldDeadline}\n New deadline: ${deadlineUpdateObj.newDeadline}`
            castObject.hasUrl = true
            castArray.push(castObject)
            // console.log("proposalId: " + proposalId)
            // console.log("new deadline: " + newDeadline)
        }
        await updateEndBlocks(proposalsToUpdate)    
 }          


 //This function isn't currently used anywhere but I created it just in case
async function getVoteResults(proposalId){
    const INFURA_API = await retryApiCall(() => accessSecret('INFURA_API'));
    const provider = new ethers.providers.JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${INFURA_API}`)
    const mainNetProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API}`)
    const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
    const voteFilter = opGovernorProxyContract.filters.VoteCast(ProposalDeadlineUpdated)
    let voteResult = await retryApiCall(() => opGovernorProxyContract.proposalVotes(proposalId))
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


module.exports = { getExpiredProposals, getCanceledProposals, getNewVotes, getVoteResults, findNewProposals, getProposalUpdates }

