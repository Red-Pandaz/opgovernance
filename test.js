const dotenv = require("dotenv").config()
const { ethers, JsonRpcProvider } = require('ethers');
const { getOpenProposals } = require('./database/database.js');
const { searchMatch } = require('./utils/helpers.js')
const opTokenAddress = '0x4200000000000000000000000000000000000042'
const opGovernorProxyAddress = '0xcdf27f107725988f2261ce2256bdfcde8b382b10'
const opGovernorReadyAsProxyABI = JSON.parse(require('./abi/opGovernorReadAsProxy.json').result)
const provider = new ethers.providers.JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${process.env.INFURA_API}`)
const proposals = JSON.parse(require ('./proposals.json'))
const againstVote = 0
const forVote = 1
const abstainVote = 2

// console.log(proposals)
const proposalId = ethers.BigNumber.from('20327152654308054166942093105443920402082671769027198649343468266910325783863')

async function getCanceledProposals(closedArray, openProposals, newProposals, fromBlock, toBlock, voteMinimum){

    try{

        console.log("FROM BLOCK: " + fromBlock)
        console.log("TO BLOCK: " + toBlock)
        const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
        const filter = opGovernorProxyContract.filters.ProposalCanceled()
        const cancelEvents = await opGovernorProxyContract.queryFilter(filter, fromBlock, toBlock)
        let proposalIds = []
        let canceledProposals = []
        let canceledNewProposals = []
        for(let i = 0; i < cancelEvents.length; i++){
            let id = cancelEvents[i].args.proposalId
            id = (ethers.BigNumber.from(id).toString())
            cancelIds.push(id)
        
        }
        for(let i = 0; i < cancelEvents.length; i++){
            let canceleddObject = {}
            array.find(item => item.proposalId === proposalIdToFind)
        }
        uncanceledIds = proposalIds.filter(id => !cancelIds.includes(id))
        // console.log(uncanceledIds.length)
        // console.log(uncanceledIds)
        const keyStart = 'startBlock'; 
        const keyEnd = 'endBlock';

        const arrayOfBlockMins = proposals.map(obj => obj[keyStart]);
        const arrayOfBlockMaxs = proposals.map(obj => obj[keyEnd]);
        const firstBlock = Math.min(...arrayOfBlockMins)
        const lastBlock = Math.max(...arrayOfBlockMaxs)
        console.log(firstBlock)
        console.log(lastBlock)
    }catch(err){
        console.log("canceled proposal error: " + err)
    } 
console.log("finishing get canceled proposals")
return
}

async function getExpiredProposals(castArray, openProposals, closedProposals, currentBlock){
   
    // const currentProposals = JSON.parse(require ('./proposals.json'))
  
    const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);

    // const currentProposals = await 
    for(let proposal of openProposals){
        console.log(proposal.endBlock)
        if(proposal.endBlock <= currentBlock.number){
            const resultsObj = {}
            console.log("Proposal " + proposal.header + " expired: " + proposal.endBlock +"   " + proposal.proposalId) 
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
        //    console.log(castObj)
           proposal.results = resultsObj
           closedProposals.push(proposal)
        }
    }
    console.log("ending get expired proposal")
    return
// return [expiredProposals, ongoingProposals]

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
        // console.log(voteEvents[0])
        for(let voteEvent of voteEvents){
          
            var voteValue = (ethers.BigNumber.from(voteEvent.args.weight).toString());
            voteValue = voteValue * Math.pow(10, -18);
            voteValue = Math.round(voteValue)
            if(voteValue >= 20000){
                let voteObj = {}
                console.log("Checking for Errors getting Id from event")
                voteObj.proposalId =(BigInt(voteEvent.data[0], 16)).toString()
                // console.log(voteObj.proposalId)
                voteObj.transactionHash = voteEvent.transactionHash
                voteObj.blockHeight = voteEvent.blockNumber
                voteObj.voter = voteEvent.voter
                voteObj.voteWeight = voteValue
                voteObj.support = voteEvent.args.support

                let voteArray = searchMatch(voteObj, openProposals, newProposals)
                let castObj = {}
                castObj.blockHeight = voteObj.blockHeight
                castObj.transactionHash = voteObj.transactionHash
                let formattedVoteValue = voteValue.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
                console.log("checking for errors converting id")
                const propNumberStr = voteObj.proposalId.toString();
                const propFirstSix = propNumberStr.substring(0, 6);
                const propLastFour = propNumberStr.substring(propNumberStr.length - 4);
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
                castObj.cast = `${formattedAddress} ${voteString} proposal ${voteArray[1].header} (proposalId ${formattedPropId}) with ${formattedVoteValue} OP vote weight: https://optimistic.etherscan.io/tx/${castObj.transactionHash}`
                // console.log(castObj)

            
          

        }
    }
    } catch(err){
        console.log("Get New Votes Error: " + err)
    }
    console.log("finishing get new votes")
    return

}

async function getVoteResults(proposalId){
    const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
    let voteResult = await opGovernorProxyContract.proposalVotes(proposalId)
    voteResult.forEach(function(result){
        result = ethers.BigNumber.from(result).toString()
        // console.log(voteResult)
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

// getProposalCancelations()
// getNewVotes()
// getExpiredProposals()




module.exports = { getExpiredProposals, getCanceledProposals, getNewVotes }

