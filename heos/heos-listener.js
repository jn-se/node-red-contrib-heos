/**
 * 
 * The HeosListenerNode.
 * 
 **/

const heos = require('heos-api')
const heosHelper = require('./heos-helper.js');

module.exports = function(RED) {

    /**
     * The HeosListenerNode is used to listen for change events in the HEOS network.
     */
    function HeosListenerNode(config) {

        RED.nodes.createNode(this, config);
        var node = this;

        heosHelper.onInitNode(node)

        heosHelper.onHeosConnecting(node)

        node.device = RED.nodes.getNode(config.device);
        node.deviceAutodiscover = config.deviceAutodiscover;

        node.heosCommandGroup = config.commandGroup;
        node.heosCommand = config.command;

        var heosConnection;

        if(node.deviceAutodiscover == "autodiscover") {

            // Autodiscovering is used - connect via discoverAndConnect
            heos.discoverAndConnect().then(connection => {

                heosHelper.onHeosConnected(node)

                heosConnection = connection

                connection
                    .on({ commandGroup: node.heosCommandGroup, command: node.heosCommand}, (message) => {

                        node.send(message);

                    })
                    .onClose(error => {

                        heosHelper.onCloseHeosConnection(node, error)
                    })
                    .onError(error => {
                        
                        heosHelper.onErrorHeosConnection(node, error)
                    })
                    .write("system", "register_for_change_events", {enable: "on"})
            })
            .catch(reason => {

                heosHelper.onHeosDiscoveryAndConnectCatch(node) 
            })
        }
        else {

            // Autodiscovering is disabled - connect to specific device
            if(node.device) {

                let ipAddress = node.device.ip;

                heos.connect(ipAddress).then(connection => {

                    heosHelper.onHeosConnected(node, ipAddress)

                    heosConnection = connection

                    connection
                        .on({ commandGroup: node.heosCommandGroup, command: node.heosCommand}, (message) => {

                            node.send(message);
                        })
                        .onClose(error => {

                            heosHelper.onCloseHeosConnection(node, error)
                        })
                        .onError(error => {
                            
                            heosHelper.onErrorHeosConnection(node, error)
                        })
                        .write("system", "register_for_change_events", {enable: "on"})
                })
                .catch(reason => {

                    heosHelper.onHeosDiscoveryAndConnectCatch(node, ipAddress) 
                })
            }
            else {

                heosHelper.onNodeNoIpDefined(node)
            }
        }

        node.on('input', function(msg, send, done) {

            // For maximum backwards compatibility, check that send exists.
            // If this node is installed in Node-RED 0.x, it will need to
            // fallback to using `node.send`
            send = send || function() { node.send.apply(node,arguments) }

            send(msg);

            if (done) {
                done();
            }
        });
        
        this.on('close', function(done) {

            heosHelper.onCloseNode(node, heosConnection, done)
        });
    }

    RED.nodes.registerType("heos-listener", HeosListenerNode);
}