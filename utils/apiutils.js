const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function retryApiCall(apiCall, maxRetries = 5, delayBetweenRetries = 1000) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const result = await apiCall();
            return result; 
        } catch (error) {
            console.error(`API call failed: ${error.message}`);
            retries++;
            if (retries < maxRetries) {
                console.log(`Retrying API call (${retries}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenRetries)); 
            } else {
                console.error('Max retries reached, giving up.');
                throw error; 

            }
        }
    }
return
}


//This latest update is intended to make the project compatible with Google Clound Functions. That means integrating Google Secrets instead of using .env
async function accessSecret(secretName) {
    const client = new SecretManagerServiceClient();
  
    try {
      const name = client.secretVersionPath('foamcaster-2', secretName, 'latest'); // Replace with your project ID
      const [version] = await client.accessSecretVersion({ name });
      const payload = version.payload.data.toString('utf8');
      return payload;
    } catch (error) {
      console.error('Error accessing secret:', error);
      throw error;
    }
  }
  
  module.exports = { retryApiCall, accessSecret }