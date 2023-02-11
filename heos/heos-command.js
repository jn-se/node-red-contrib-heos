/**
 * 
 * The HeosCommandNode.
 * 
 **/

const heos = require('heos-api')
const heosHelper = require('./heos-helper.js');

module.exports = function(RED) {

    /**
     * The HeosCommandNode can submit any command to the HEOS network.
     */
    function HeosCommandNode(config) {

        RED.nodes.createNode(this, config);
        var node = this;

        heosHelper.onInitNode(node)

        node.device = RED.nodes.getNode(config.device);
        node.deviceAutodiscover = config.deviceAutodiscover;

        node.heosCommandGroup = config.commandGroup;
        node.heosCommand = config.command;
        node.heosAttributes = config.attributes;

        var heosConnection;

        node.on('input', function(msg, send, done) {

            heosHelper.onHeosConnecting(node)

            var commandGroup = node.heosCommandGroup;
            var command = node.heosCommand;
            var attributes = null;

            if(node.heosAttributes) {
                attributes = JSON.parse(node.heosAttributes);
            }

            if(config.commandGroupFromPayload && msg.payload.commandGroup) {
                commandGroup = msg.payload.commandGroup;
            }

            if(config.commandFromPayload && msg.payload.command) {
                command = msg.payload.command;
            }

            if(config.attributesFromPayload && msg.payload.attributes) {

                attributes = JSON.parse(msg.payload.attributes);
            }

            if(node.deviceAutodiscover == "autodiscover") {

                // Autodiscovering is used - connect via discoverAndConnect
                heos.discoverAndConnect().then(connection => {

                    heosHelper.onHeosConnected(node)
                    
                    heosConnection = connection

                    connection
                        .on({ commandGroup: commandGroup, command: command}, (message) => {

                            // For maximum backwards compatibility, check that send exists.
                            // If this node is installed in Node-RED 0.x, it will need to
                            // fallback to using `node.send`
                            send = send || function() { node.send.apply(node,arguments) }

                            send(message);

                            heosHelper.doCloseHeosConnection(node, heosConnection)

                            if (done) {
                                done();
                            }
                        })
                        .onClose(error => {

                            heosHelper.onCloseHeosConnection(node, error)

                        })
                        .onError(error => {
                            
                            heosHelper.onErrorHeosConnection(node, error)
                        })
                        .write(commandGroup, command, attributes)
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
                            .on({ commandGroup: commandGroup, command: command}, (message) => {

                                // For maximum backwards compatibility, check that send exists.
                                // If this node is installed in Node-RED 0.x, it will need to
                                // fallback to using `node.send`
                                send = send || function() { node.send.apply(node,arguments) }

                                send(message);

                                heosHelper.doCloseHeosConnection(node, heosConnection)

                                if (done) {
                                    done();
                                }
                            })
                            .onClose(error => {
                                
                                heosHelper.onCloseHeosConnection(node, error)
                            })
                            .onError(error => {
                                
                                heosHelper.onErrorHeosConnection(node, error)
                            })
                            .write(commandGroup, command, attributes)
                    })
                    .catch(reason => {

                        heosHelper.onHeosDiscoveryAndConnectCatch(node, ipAddress) 
                    })
                }
                else {

                    heosHelper.onNodeNoIpDefined(node)
                }
            }

        });

        this.on('close', function(done) {

            heosHelper.onCloseNode(node, heosConnection, done)
        });
    }

    RED.nodes.registerType("heos-command", HeosCommandNode);
}