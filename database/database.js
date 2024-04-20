const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');
const dotenv = require("dotenv").config();
const { retryApiCall,  accessSecret } = require('../utils/apiutils.js');
const dbName = 'OP-Governance'
const snapshotName = 'Snapshots'
const openName = 'Open Proposals'
const closedName = 'Closed Proposals'
let client


async function updateTimestamp(blockHeight, castArray) {
    let newTimestampObj = {
        timestamp: Date.now(),
        blockstamp: blockHeight,
        casts: castArray
    };

    try {
        await retryApiCall(() => pushOpSnapshot(newTimestampObj));
    } catch (error) {
        console.error('Error updating timestamp:', error);
        // Handle the error if needed
    }
    console.log("done updating timestamp")
}

async function pushOpSnapshot(snapshot) {
    const DB_URI = await retryApiCall(() => accessSecret('DB_URI'));
 
    try {
        if (!client || !client.topology || !client.topology.isConnected()) {
            client = new MongoClient(DB_URI);
            await retryApiCall(() => client.connect());
            console.log("Connected to the database");
        }
        // Get a reference to the database
        const db = client.db(dbName);
        
        // Get a reference to the collection
        const collection = db.collection(snapshotName);
        
        // Insert the document into the collection
        const result = await retryApiCall(() => collection.insertOne(snapshot));
        console.log(`Document inserted with _id: ${result.insertedId}`);
    } catch (error) {
        console.error('Error inserting document:', error);
    } finally {
        // Close the connection
        if (client && client.topology && client.topology.isConnected()) {
            await retryApiCall(() => client.close());

            console.log("Connection closed");
    }
}
}

async function updateProposalDatabases(newArray, closedArray) {
        try {
            
            const DB_URI = await retryApiCall(() => accessSecret('DB_URI'));
            if (!client || !client.topology || !client.topology.isConnected()) {
                client = new MongoClient(DB_URI);
                await retryApiCall(() => client.connect());
               
            }
            const db = client.db('OP-Governance');
                await retryApiCall(() => {
                if (newArray && newArray.length > 0) {
                    return Promise.all(newArray.map(async (element) => {
                        await db.collection(openName).insertOne(element);
                    }));
                }
            });
            await retryApiCall(() => {
                if (closedArray && closedArray.length > 0) {
                    return Promise.all(closedArray.map(async (element) => {
                        await db.collection(closedName).insertOne(element);
                    }));
                }
            });
            const proposalIdsToRemove = closedArray.map(element => element.proposalId);
            await retryApiCall(() => {
                if (closedArray && closedArray.length > 0) {
                    return Promise.all(closedArray.map(async (element) => {
                        await db.collection(closedName).insertOne(element);
                    }))
                    .then(async () => {
                        await db.collection(openName).deleteMany({ proposalId: { $in: proposalIdsToRemove } });
                    });
                }
            });
            
        console.log("done with updating proposal database")
        // Return updated array1
        return newArray;
    } catch (error) {
        
        console.error('Error updating databases:', error);
        throw error;
    }
}

async function getLastTimestamp() {
    try {
        return await retryApiCall(() => getLastTimestampInternal())
    } catch (error) {
        console.error('Error getting last timestamp:', error);
        // Handle the error if needed
    }

return
}

async function getLastTimestampInternal() {
    const DB_URI = await retryApiCall(() => accessSecret('DB_URI'));
    try {
        if (!client || !client.topology || !client.topology.isConnected()) {
            client = new MongoClient(DB_URI);
            await retryApiCall(() => client.connect());
            console.log("Connected to the database");
        }
        const db = client.db(dbName); // Assuming dbName is defined globally or passed as a parameter
        const collection = db.collection(snapshotName); // Assuming collectionName is defined globally or passed as a parameter
        const lastObject = await retryApiCall(() => collection.find().sort({ timestamp: -1 }).limit(1).toArray());


        if (lastObject.length > 0) {
            const lastBlockHeight = lastObject[0].blockstamp;
            const lastTimestamp = lastObject[0].timestamp;
            return [lastBlockHeight, lastTimestamp];
        } else {
            return null;
        }
    } catch (error) {
        console.log(DB_URI)
        console.error('Error fetching last timestamp:', error);
        throw error; // Rethrow the error to be caught by the caller
    }
}



//wraps pruneDatabaseAndEmailInternal in an additional error handler
async function pruneDatabaseAndEmail(){
    try {
        await retryApiCall(pruneDatabaseAndEmailInternal);
    } catch (error) {
        console.error('Error pruning database and sending email:', error);
        // Handle the error if needed
    }
}
//Prunes database and calls sendEmail
async function pruneDatabaseAndEmailInternal() {
    const DB_URI = await retryApiCall(() => accessSecret('DB_URI'));
    try {
        if (!client || !client.topology || !client.topology.isConnected()) {
            client = new MongoClient(DB_URI);
            await retryApiCall(() => client.connect());
            console.log("Connected to the database");
        }

    const db = client.db(dbName);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    await retryApiCall(() => db.collection(collectionName).deleteMany({ timestamp: { $lt: oneWeekAgo } }));

    const prunedData = await retryApiCall(() => db.collection(collectionName).find({ timestamp: { $lt: oneWeekAgo } }).toArray());
    await retryApiCall(() => sendEmail(prunedData));

    console.log('Pruning complete');
    }catch(err){
    console.log(err)
    }

    return
}


async function getOpenProposals() {
  

    try {
        if (!client || !client.topology || !client.topology.isConnected()) {
            const DB_URI = await retryApiCall(() => accessSecret('DB_URI'));
            client = new MongoClient(DB_URI);
            await retryApiCall(() => client.connect());
            console.log("Connected to the database");
        }
        const database = client.db('OP-Governance'); 
        const collection = database.collection('Open Proposals');

        const documents = await collection.find({}).toArray();
        console.log("finished openProposals")
        return documents;
    }catch(err){
        console.log(err)
        return
    }


}


module.exports = { updateTimestamp, getLastTimestamp, pruneDatabaseAndEmail, getOpenProposals, updateProposalDatabases }