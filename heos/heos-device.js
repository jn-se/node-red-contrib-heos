/**
 * 
 * The HeosDeviceNode.
 * 
 **/

const heosAdminAPI = require('./heos-admin-api.js');


module.exports = function(RED) {

    /**
     * The HeosDeviceNode configures a specific HEOS device as gateway.
     * 
     * The gateway can receive commands also for other players in the same HEOS network.
    **/
    function HeosDeviceNode(config) {

        RED.nodes.createNode(this, config);

        this.ip = config.ip
        this.name = config.name
    }

    RED.nodes.registerType("heos-device", HeosDeviceNode);

    // Data lookup for UI
    heosAdminAPI.heosAdminAPI(RED)
}
