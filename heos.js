/**
 * 
 * A HEOS Node for Node-RED.
 * 
 **/

const heos = require('heos-api')

const heosAdminAPI = require('./heos-admin-api.js');

const sleep = require('util').promisify(setTimeout)

module.exports = function(RED) {

    function initNode(node) {

        node.status({fill:"blue",shape:"ring",text:"idle"});
    }

    function onNodeConnecting(node) {

        node.status({fill:"yellow",shape:"ring",text:"connecting"});
    }

    function startConnectionAndLog(node, ipAddress = null) {

        if (ipAddress) {
            node.log("Connected to HEOS device ("+ipAddress+")")
        }
        else {
            node.log("Connected to HEOS device via autodiscover.")
        }
        
        node.status({fill:"green",shape:"dot",text:"connected"})
    }

    function closeConnectionAndLog(node, heosConnection) {

        heosConnection.close().then(resolve => {

            node.log("Disconnected from HEOS device ("+resolve+")")

        })
        .catch(err => {
            node.error("HEOS connection error: "+error)
        })
    }

    function onCloseConnection(node, error) {

        (async () => {
            await sleep(3000)
            node.status({fill:"blue",shape:"ring",text:"idle"});
        })()

        if (error) {
            node.error('HEOS connection: There was a transmission error and the connection closed.')
        } else {
            node.log('HEOS connection closed.')
        }
    }

    function onErrorConnection(node, error) {

        node.error("HEOS connection error: "+error)
    }

    function onDiscoveryAndConnectCatch(node, ipAddress) {

        if(ipAddress) {
            node.status({fill:"red",shape:"ring",text:"connection error"});
            node.warn('Could not connect to HEOS devices with IP '+ipAddress+'.')
        }
        else {
            node.status({fill:"red",shape:"ring",text:"autodiscovery failed"});
            node.warn('Did not find any HEOS devices with autodiscovery. Could not connect to HEOS network.')
        }
    }

    function noIPDefined(node) {

        node.status({fill:"red",shape:"ring",text:"could not connect"});
        node.warn("HEOS node: Autodiscover disabled but no IP specified.");
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

        initNode(node)

        node.device = RED.nodes.getNode(config.device);
        node.deviceAutodiscover = config.deviceAutodiscover;

        node.heosCommandGroup = config.commandGroup;
        node.heosCommand = config.command;
        node.heosAttributes = config.attributes;

        var heosConnection;

        node.on('input', function(msg, send, done) {

            onNodeConnecting(node)

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

                    startConnectionAndLog(node)
                    
                    heosConnection = connection

                    connection
                        .on({ commandGroup: commandGroup, command: command}, (message) => {

                            // For maximum backwards compatibility, check that send exists.
                            // If this node is installed in Node-RED 0.x, it will need to
                            // fallback to using `node.send`
                            send = send || function() { node.send.apply(node,arguments) }

                            send(message);

                            closeConnectionAndLog(node, heosConnection)

                            if (done) {
                                done();
                            }
                        })
                        .onClose(error => {

                            onCloseConnection(node, error)

                        })
                        .onError(error => {
                            
                            onErrorConnection(node, error)
                        })
                        .write(commandGroup, command, attributes)
                })
                .catch(reason => {

                    onDiscoveryAndConnectCatch(node) 
                })
            }
            else {

                // Autodiscovering is disabled - connect to specific device
                if(node.device) {

                    let ipAddress = node.device.ip;

                    heos.connect(ipAddress).then(connection => {
                        
                        startConnectionAndLog(node, ipAddress)

                        heosConnection = connection

                        connection
                            .on({ commandGroup: commandGroup, command: command}, (message) => {

                                // For maximum backwards compatibility, check that send exists.
                                // If this node is installed in Node-RED 0.x, it will need to
                                // fallback to using `node.send`
                                send = send || function() { node.send.apply(node,arguments) }

                                send(message);

                                closeConnectionAndLog(node, heosConnection)

                                if (done) {
                                    done();
                                }
                            })
                            .onClose(error => {
                                
                                onCloseConnection(node, error)
                            })
                            .onError(error => {
                                
                                onErrorConnection(node, error)
                            })
                            .write(commandGroup, command, attributes)
                    })
                    .catch(reason => {

                        onDiscoveryAndConnectCatch(node, ipAddress) 
                    })
                }
                else {

                    noIPDefined(node)
                }
            }

        });

        this.on('close', function(done) {

            heosConnection.close().then(resolve => {

                node.log("Disconnected from HEOS device ("+resolve+")")
                done();

            })
            .catch(err => {
                node.error("HEOS connection error: "+error)
            })
        });
    }

    RED.nodes.registerType("heos-command", HeosCommandNode);

    /**
     * The HeosListenerNode is used to listen for change events in the HEOS network.
     */
    function HeosListenerNode(config) {

        RED.nodes.createNode(this, config);
        var node = this;

        initNode(node)

        onNodeConnecting(node)

        node.device = RED.nodes.getNode(config.device);
        node.deviceAutodiscover = config.deviceAutodiscover;

        node.heosCommandGroup = config.commandGroup;
        node.heosCommand = config.command;

        var heosConnection;

        if(node.deviceAutodiscover == "autodiscover") {

            // Autodiscovering is used - connect via discoverAndConnect
            heos.discoverAndConnect().then(connection => {

                startConnectionAndLog(node)

                heosConnection = connection

                connection
                    .on({ commandGroup: node.heosCommandGroup, command: node.heosCommand}, (message) => {

                        node.send(message);

                    })
                    .onClose(error => {

                        onCloseConnection(node, error)
                    })
                    .onError(error => {
                        
                        onErrorConnection(node, error)
                    })
                    .write("system", "register_for_change_events", {enable: "on"})
            })
            .catch(reason => {

                onDiscoveryAndConnectCatch(node) 
            })
        }
        else {

            // Autodiscovering is disabled - connect to specific device
            if(node.device) {

                let ipAddress = node.device.ip;

                heos.connect(ipAddress).then(connection => {

                    startConnectionAndLog(node, ipAddress)

                    heosConnection = connection

                    connection
                        .on({ commandGroup: node.heosCommandGroup, command: node.heosCommand}, (message) => {

                            node.send(message);
                        })
                        .onClose(error => {

                            onCloseConnection(node, error)
                        })
                        .onError(error => {
                            
                            onErrorConnection(node, error)
                        })
                        .write("system", "register_for_change_events", {enable: "on"})
                })
                .catch(reason => {

                    onDiscoveryAndConnectCatch(node, ipAddress) 
                })
            }
            else {

                noIPDefined(node)
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

            heosConnection.close().then(resolve => {

                node.log("Disconnected from HEOS device ("+resolve+")")
                done();

            })
            .catch(err => {
                node.error("HEOS connection error: "+error)
            })
        });
    }

    RED.nodes.registerType("heos-listener", HeosListenerNode);

    /**
     * The HeosPlayerStateNode can submit player state commands to the HEOS network.
     */
    function HeosPlayerStateNode(config) {

        RED.nodes.createNode(this, config);
        var node = this;

        initNode(node)

        node.device = RED.nodes.getNode(config.device);
        node.deviceAutodiscover = config.deviceAutodiscover;

        node.heosPlayerId = config.playerId;
        node.heosPlayerState = config.playerState;

        var heosConnection;

        node.on('input', function(msg, send, done) {

            onNodeConnecting(node)

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
                    
                    startConnectionAndLog(node)

                    heosConnection = connection

                    connection
                        .on({ commandGroup: "player", command: "set_play_state"}, (message) => {

                            // For maximum backwards compatibility, check that send exists.
                            // If this node is installed in Node-RED 0.x, it will need to
                            // fallback to using `node.send`
                            send = send || function() { node.send.apply(node,arguments) }

                            send(message);

                            closeConnectionAndLog(node, heosConnection)

                            if (done) {
                                done();
                            }
                        })
                        .onClose(error => {
                            
                            onCloseConnection(node, error)
                        })
                        .onError(error => {
                            
                            onErrorConnection(node, error)
                        })
                        .write("player", "set_play_state", attributes)
                })
                .catch(reason => {

                    onDiscoveryAndConnectCatch(node) 
                })
            }
            else {

                // Autodiscovering is disabled - connect to specific device
                if(node.device.ip) {

                    let ipAddress = node.device.ip;

                    heos.connect(ipAddress).then(connection => {
                        
                        startConnectionAndLog(node, ipAddress)

                        heosConnection = connection

                        connection
                            .on({ commandGroup: "player", command: "set_play_state"}, (message) => {

                                // For maximum backwards compatibility, check that send exists.
                                // If this node is installed in Node-RED 0.x, it will need to
                                // fallback to using `node.send`
                                send = send || function() { node.send.apply(node,arguments) }

                                send(message);

                                closeConnectionAndLog(node, heosConnection)

                                if (done) {
                                    done();
                                }
                            })
                            .onClose(error => {
                                
                                onCloseConnection(node, error)
                            })
                            .onError(error => {
                                
                                onErrorConnection(node, error)
                            })
                            .write("player", "set_play_state", attributes)
                    })
                    .catch(reason => {

                        onDiscoveryAndConnectCatch(node, ipAddress) 
                    })
                }
                else {

                    noIPDefined(node)
                }
            }

        });

        this.on('close', function(done) {

            heosConnection.close().then(resolve => {

                node.log("Disconnected from HEOS device ("+resolve+")")
                done();

            })
            .catch(err => {
                node.error("HEOS connection error: "+error)
            })
        });
    }

    RED.nodes.registerType("heos-player-state", HeosPlayerStateNode);

    // Data lookup for UI
    heosAdminAPI.heosAdminAPI(RED)
}