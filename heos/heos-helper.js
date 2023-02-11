/**
 * 
 * A HEOS Node for Node-RED.
 * 
 **/

const sleep = require('util').promisify(setTimeout)

// Node Helper

/**
 * Helper method to be called at node initialization.
 * 
 * Updates the node status.
 * 
 * @param {*} node The node to be updated.
 */
function onInitNode(node) {

    node.status({fill:"blue",shape:"ring",text:"idle"});
}

/**
 * Helper method that should be called when the node is closed to disconnect from the HEOS network.
 * 
 * Updates the node status.
 * 
 * @param {*} node The node to be updated.
 * @param {*} heosConnection The HEOS connection used by the node.
 * @param {*} done The done callback of the node's onClose handler.
 */
function onCloseNode(node, heosConnection, done) {

    heosConnection.close().then(resolve => {

        node.log("Disconnected from HEOS device.")
        done();

    })
    .catch(err => {
        node.error("HEOS connection error: "+error)
    })
}

/**
 * The helper method to be called for error handling when the node does not have an IP address defined in non-autodiscovery mode.
 * 
 * Updates the node status.
 * 
 * @param {*} node The node to be updated.
 */
function onNodeNoIpDefined(node) {

    node.status({fill:"red",shape:"ring",text:"could not connect"});
    node.warn("HEOS node: Autodiscover disabled but no IP specified.");
}

// HEOS connection helper

/**
 * Helper method that should be called when the node starts connecting to the HEOS network.
 * 
 * Updates the node status.
 * 
 * @param {*} node The node to be updated.
 */
function onHeosConnecting(node) {

    node.status({fill:"yellow",shape:"ring",text:"connecting"});
}

/**
 * Helper method that should be called when the node established a connection to the HEOS network.
 * 
 * Updates the node status.
 * 
 * @param {*} node The node to be updated.
 * @param {*} ipAddress (optional) The IP address of the HEOS gateway if autodiscovery is not used.
 */
function onHeosConnected(node, ipAddress = null) {

    if (ipAddress) {
        node.log("Connected to HEOS device ("+ipAddress+")")
    }
    else {
        node.log("Connected to HEOS device via autodiscover.")
    }
    
    node.status({fill:"green",shape:"dot",text:"connected"})
}

/**
 * Helper method that should be called when the node closes the connection to the HEOS network.
 * 
 * Updates the node status.
 * 
 * @param {*} node The node to be updated.
 * @param {*} heosConnection The HEOS connection used by the node.
 */
function doCloseHeosConnection(node, heosConnection) {

    (async () => {
        await sleep(1000)
        node.status({fill:"blue",shape:"ring",text:"idle"});
    })()
    //node.status({fill:"blue",shape:"ring",text:"idle"});

    heosConnection.close().then(resolve => {

        node.log("Disconnected from HEOS device.")

    })
    .catch(err => {
        node.error("HEOS connection error: "+error)
    })
}

/**
 * Helper method that should be called in the onClose handler of the node's HEOS connection.
 * 
 * Updates the node status.
 * 
 * @param {*} node The node to be updated.
 * @param {*} error (optional) The error if connection close is caused by an error.
 */
function onCloseHeosConnection(node, error) {

    if (error) {
        node.error('HEOS connection: There was a transmission error and the connection closed.')
    } else {
        node.log('HEOS connection closed.')
    }
}

/**
 * Helper method that should be called in the onError handler of the node's HEOS connection.
 * 
 * Updates the node status.
 * 
 * @param {*} node The node to be updated.
 * @param {*} error The error.
 */
function onErrorHeosConnection(node, error) {

    node.status({fill:"red",shape:"ring",text:"connection error"});
    node.error("HEOS connection error: "+error)
}

/**
 * Helper method that should be called in the catch handler of the node's HEOS connection.
 * 
 * Updates the node status.
 * 
 * @param {*} node The node to be updated.
 * @param {*} ipAddress (optional) The IP address of the HEOS gateway if autodiscovery is not used.
 */
function onHeosDiscoveryAndConnectCatch(node, ipAddress) {

    if(ipAddress) {
        node.status({fill:"red",shape:"ring",text:"connection error"});
        node.warn('Could not connect to HEOS devices with IP '+ipAddress+'.')
    }
    else {
        node.status({fill:"red",shape:"ring",text:"autodiscovery failed"});
        node.warn('Did not find any HEOS devices with autodiscovery. Could not connect to HEOS network.')
    }
}

module.exports = {
    onInitNode,
    onCloseNode,
    onNodeNoIpDefined,
    onHeosConnecting,
    onHeosConnected,
    doCloseHeosConnection,
    onCloseHeosConnection,
    onErrorHeosConnection,
    onHeosDiscoveryAndConnectCatch
}