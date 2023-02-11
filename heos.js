/**
 * 
 * A HEOS Node for Node-RED.
 * 
 **/

const heos = require('heos-api')

const heosAdminAPI = require('./heos-admin-api.js');

const sleep = require('util').promisify(setTimeout)

module.exports = function(RED) {

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

    RED.nodes.registerType("heos-device",HeosDeviceNode);

    /**
     * The HeosCommandNode can submit any command to the HEOS network.
     */
    function HeosCommandNode(config) {

        RED.nodes.createNode(this, config);
        var node = this;

        onInitNode(node)

        node.device = RED.nodes.getNode(config.device);
        node.deviceAutodiscover = config.deviceAutodiscover;

        node.heosCommandGroup = config.commandGroup;
        node.heosCommand = config.command;
        node.heosAttributes = config.attributes;

        var heosConnection;

        node.on('input', function(msg, send, done) {

            onHeosConnecting(node)

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

                    onHeosConnected(node)
                    
                    heosConnection = connection

                    connection
                        .on({ commandGroup: commandGroup, command: command}, (message) => {

                            // For maximum backwards compatibility, check that send exists.
                            // If this node is installed in Node-RED 0.x, it will need to
                            // fallback to using `node.send`
                            send = send || function() { node.send.apply(node,arguments) }

                            send(message);

                            doCloseHeosConnection(node, heosConnection)

                            if (done) {
                                done();
                            }
                        })
                        .onClose(error => {

                            onCloseHeosConnection(node, error)

                        })
                        .onError(error => {
                            
                            onErrorHeosConnection(node, error)
                        })
                        .write(commandGroup, command, attributes)
                })
                .catch(reason => {

                    onHeosDiscoveryAndConnectCatch(node) 
                })
            }
            else {

                // Autodiscovering is disabled - connect to specific device
                if(node.device) {

                    let ipAddress = node.device.ip;

                    heos.connect(ipAddress).then(connection => {
                        
                        onHeosConnected(node, ipAddress)

                        heosConnection = connection

                        connection
                            .on({ commandGroup: commandGroup, command: command}, (message) => {

                                // For maximum backwards compatibility, check that send exists.
                                // If this node is installed in Node-RED 0.x, it will need to
                                // fallback to using `node.send`
                                send = send || function() { node.send.apply(node,arguments) }

                                send(message);

                                doCloseHeosConnection(node, heosConnection)

                                if (done) {
                                    done();
                                }
                            })
                            .onClose(error => {
                                
                                onCloseHeosConnection(node, error)
                            })
                            .onError(error => {
                                
                                onErrorHeosConnection(node, error)
                            })
                            .write(commandGroup, command, attributes)
                    })
                    .catch(reason => {

                        onHeosDiscoveryAndConnectCatch(node, ipAddress) 
                    })
                }
                else {

                    onNodeNoIpDefined(node)
                }
            }

        });

        this.on('close', function(done) {

            onCloseNode(node, heosConnection, done)
        });
    }

    RED.nodes.registerType("heos-command", HeosCommandNode);

    /**
     * The HeosListenerNode is used to listen for change events in the HEOS network.
     */
    function HeosListenerNode(config) {

        RED.nodes.createNode(this, config);
        var node = this;

        onInitNode(node)

        onHeosConnecting(node)

        node.device = RED.nodes.getNode(config.device);
        node.deviceAutodiscover = config.deviceAutodiscover;

        node.heosCommandGroup = config.commandGroup;
        node.heosCommand = config.command;

        var heosConnection;

        if(node.deviceAutodiscover == "autodiscover") {

            // Autodiscovering is used - connect via discoverAndConnect
            heos.discoverAndConnect().then(connection => {

                onHeosConnected(node)

                heosConnection = connection

                connection
                    .on({ commandGroup: node.heosCommandGroup, command: node.heosCommand}, (message) => {

                        node.send(message);

                    })
                    .onClose(error => {

                        onCloseHeosConnection(node, error)
                    })
                    .onError(error => {
                        
                        onErrorHeosConnection(node, error)
                    })
                    .write("system", "register_for_change_events", {enable: "on"})
            })
            .catch(reason => {

                onHeosDiscoveryAndConnectCatch(node) 
            })
        }
        else {

            // Autodiscovering is disabled - connect to specific device
            if(node.device) {

                let ipAddress = node.device.ip;

                heos.connect(ipAddress).then(connection => {

                    onHeosConnected(node, ipAddress)

                    heosConnection = connection

                    connection
                        .on({ commandGroup: node.heosCommandGroup, command: node.heosCommand}, (message) => {

                            node.send(message);
                        })
                        .onClose(error => {

                            onCloseHeosConnection(node, error)
                        })
                        .onError(error => {
                            
                            onErrorHeosConnection(node, error)
                        })
                        .write("system", "register_for_change_events", {enable: "on"})
                })
                .catch(reason => {

                    onHeosDiscoveryAndConnectCatch(node, ipAddress) 
                })
            }
            else {

                onNodeNoIpDefined(node)
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

            onCloseNode(node, heosConnection, done)
        });
    }

    RED.nodes.registerType("heos-listener", HeosListenerNode);

    /**
     * The HeosPlayerStateNode can submit player state commands to the HEOS network.
     */
    function HeosPlayerStateNode(config) {

        RED.nodes.createNode(this, config);
        var node = this;

        onInitNode(node)

        node.device = RED.nodes.getNode(config.device);
        node.deviceAutodiscover = config.deviceAutodiscover;

        node.heosPlayerId = config.playerId;
        node.heosPlayerState = config.playerState;

        var heosConnection;

        node.on('input', function(msg, send, done) {

            onHeosConnecting(node)

            var playerId = node.heosPlayerId;
            var playerState = node.heosPlayerState;

            if(config.playerIdFromPayload && msg.payload.playerId) {
                playerId = msg.payload.playerId;
            }

            if(config.playerStateFromPayload && msg.payload.playerState) {
                playerState = msg.payload.playerState;
            }

            const attributes = {
                "pid": playerId,
                "state": playerState
            }

            if(node.deviceAutodiscover == "autodiscover") {

                // Autodiscovering is used - connect via discoverAndConnect
                heos.discoverAndConnect().then(connection => {
                    
                    onHeosConnected(node)

                    heosConnection = connection

                    connection
                        .on({ commandGroup: "player", command: "set_play_state"}, (message) => {

                            // For maximum backwards compatibility, check that send exists.
                            // If this node is installed in Node-RED 0.x, it will need to
                            // fallback to using `node.send`
                            send = send || function() { node.send.apply(node,arguments) }

                            send(message);

                            doCloseHeosConnection(node, heosConnection)

                            if (done) {
                                done();
                            }
                        })
                        .onClose(error => {
                            
                            onCloseHeosConnection(node, error)
                        })
                        .onError(error => {
                            
                            onErrorHeosConnection(node, error)
                        })
                        .write("player", "set_play_state", attributes)
                })
                .catch(reason => {

                    onHeosDiscoveryAndConnectCatch(node) 
                })
            }
            else {

                // Autodiscovering is disabled - connect to specific device
                if(node.device.ip) {

                    let ipAddress = node.device.ip;

                    heos.connect(ipAddress).then(connection => {
                        
                        onHeosConnected(node, ipAddress)

                        heosConnection = connection

                        connection
                            .on({ commandGroup: "player", command: "set_play_state"}, (message) => {

                                // For maximum backwards compatibility, check that send exists.
                                // If this node is installed in Node-RED 0.x, it will need to
                                // fallback to using `node.send`
                                send = send || function() { node.send.apply(node,arguments) }

                                send(message);

                                doCloseHeosConnection(node, heosConnection)

                                if (done) {
                                    done();
                                }
                            })
                            .onClose(error => {
                                
                                onCloseHeosConnection(node, error)
                            })
                            .onError(error => {
                                
                                onErrorHeosConnection(node, error)
                            })
                            .write("player", "set_play_state", attributes)
                    })
                    .catch(reason => {

                        onHeosDiscoveryAndConnectCatch(node, ipAddress) 
                    })
                }
                else {

                    onNodeNoIpDefined(node)
                }
            }

        });

        this.on('close', function(done) {

            onCloseNode(node, heosConnection, done)
        });
    }

    RED.nodes.registerType("heos-player-state", HeosPlayerStateNode);

    /**
     * The HeosPlayerVolumeNode can submit player volume commands to the HEOS network.
     */
    function HeosPlayerVolumeNode(config) {

        RED.nodes.createNode(this, config);
        var node = this;

        onInitNode(node)

        node.device = RED.nodes.getNode(config.device);
        node.deviceAutodiscover = config.deviceAutodiscover;

        node.heosPlayerId = config.playerId;
        node.heosPlayerVolume = config.playerVolume;

        var heosConnection;

        node.on('input', function(msg, send, done) {

            onHeosConnecting(node)

            var playerId = node.heosPlayerId;
            var playerVolumeLevel = node.heosPlayerVolumeLevel;

            if(config.playerIdFromPayload && msg.payload.playerId) {
                playerId = msg.payload.playerId;
            }

            if(config.playerVolumeLevelFromPayload && msg.payload.playerVolumeLevel) {
                playerVolumeLevel = msg.payload.playerVolumeLevel;
            }

            const attributes = {
                "pid": playerId,
                "level": playerVolumeLevel
            }

            if(node.deviceAutodiscover == "autodiscover") {

                // Autodiscovering is used - connect via discoverAndConnect
                heos.discoverAndConnect().then(connection => {
                    
                    onHeosConnected(node)

                    heosConnection = connection

                    connection
                        .on({ commandGroup: "player", command: "set_volume"}, (message) => {

                            // For maximum backwards compatibility, check that send exists.
                            // If this node is installed in Node-RED 0.x, it will need to
                            // fallback to using `node.send`
                            send = send || function() { node.send.apply(node,arguments) }

                            send(message);

                            doCloseHeosConnection(node, heosConnection)

                            if (done) {
                                done();
                            }
                        })
                        .onClose(error => {
                            
                            onCloseHeosConnection(node, error)
                        })
                        .onError(error => {
                            
                            onErrorHeosConnection(node, error)
                        })
                        .write("player", "set_volume", attributes)
                })
                .catch(reason => {

                    onHeosDiscoveryAndConnectCatch(node) 
                })
            }
            else {

                // Autodiscovering is disabled - connect to specific device
                if(node.device.ip) {

                    let ipAddress = node.device.ip;

                    heos.connect(ipAddress).then(connection => {
                        
                        onHeosConnected(node, ipAddress)

                        heosConnection = connection

                        connection
                            .on({ commandGroup: "player", command: "set_volume"}, (message) => {

                                // For maximum backwards compatibility, check that send exists.
                                // If this node is installed in Node-RED 0.x, it will need to
                                // fallback to using `node.send`
                                send = send || function() { node.send.apply(node,arguments) }

                                send(message);

                                doCloseHeosConnection(node, heosConnection)

                                if (done) {
                                    done();
                                }
                            })
                            .onClose(error => {
                                
                                onCloseHeosConnection(node, error)
                            })
                            .onError(error => {
                                
                                onErrorHeosConnection(node, error)
                            })
                            .write("player", "set_volume", attributes)
                    })
                    .catch(reason => {

                        onHeosDiscoveryAndConnectCatch(node, ipAddress) 
                    })
                }
                else {

                    onNodeNoIpDefined(node)
                }
            }

        });

        this.on('close', function(done) {

            onCloseNode(node, heosConnection, done)
        });
    }

    RED.nodes.registerType("heos-player-volume", HeosPlayerVolumeNode);

    // Data lookup for UI
    heosAdminAPI.heosAdminAPI(RED)
}