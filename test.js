const dotenv = require("dotenv").config()
const { ethers, JsonRpcProvider } = require('ethers');
const { getOpenProposals } = require('./database/database.js');
const opTokenAddress = '0x4200000000000000000000000000000000000042'
const opGovernorProxyAddress = '0xcdf27f107725988f2261ce2256bdfcde8b382b10'
const opGovernorReadyAsProxyABI = JSON.parse(require('./abi/opGovernorReadAsProxy.json').result)
const provider = new ethers.providers.JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${process.env.INFURA_API}`)
const proposals = JSON.parse(require ('./proposals.json'))

// console.log(proposals)
const proposalId = ethers.BigNumber.from('20327152654308054166942093105443920402082671769027198649343468266910325783863')

async function getCanceledProposals(closedArray, openProposals, newProposals, fromBlock, toBlock, voteMinimum){
    try{

        console.log("FROM BLOCK: " + fromBlock)
        console.log("TO BLOCK: " + toBlock)
        const opGovernorProxyContract = new ethers.Contract(opGovernorProxyAddress, opGovernorReadyAsProxyABI, provider);
        const filter = opGovernorProxyContract.filters.ProposalCanceled()
        const events = await opGovernorProxyContract.queryFilter(filter, fromBlock, toBlock)
        let proposalIds = []
        let cancelIds = []
        let uncanceledIds = []
        for(let i = 0; i < events.length; i++){
            let id = events[i].args.proposalId
            id = (ethers.BigNumber.from(id).toString())
            cancelIds.push(id)
        
        }
        for(let i = 0; i < events.length; i++){
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
           console.log(castObj)
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
        const filter = opGovernorProxyContract.filters.VoteCast()
        const events = await opGovernorProxyContract.queryFilter(filter, fromBlock, toBlock)
        let voteResult = await opGovernorProxyContract.proposalVotes('64861580915106728278960188313654044018229192803489945934331754023009986585740')
        voteResult.forEach(function(result){
            result = ethers.BigNumber.from(result).toString()
            console.log(result)
        })
        let againstVotes = ethers.BigNumber.from(voteResult.againstVotes).toString()
        let forVotes = ethers.BigNumber.from(voteResult.forVotes).toString()
        let abstainVotes = ethers.BigNumber.from(voteResult.abstainVotes).toString()
        events.forEach(function(event){
            var voteValue = (ethers.BigNumber.from(event.args.weight).toString());
            voteValue = voteValue * Math.pow(10, -18);
            voteValue = Math.round(voteValue)
            if(voteValue > 500000){
            
        }

        })
    } catch(err){
        console.log("Get New Votes Error: " + err)
    }
    console.log("finishing get new votes")
    return

}

// getProposalCancelations()
// getNewVotes()
// getExpiredProposals()


function formatNumber(number) {

}
module.exports = { getExpiredProposals, getCanceledProposals, getNewVotes }

