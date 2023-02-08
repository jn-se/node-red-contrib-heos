/**
 * 
 * A HEOS Node for Node-RED.
 * 
 **/

const heos = require('heos-api')

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

    RED.nodes.registerType("heos-device",HeosDeviceNode);

    /**
     * The HeosCommandNode can submit any command to the HEOS network.
     */
    function HeosCommandNode(config) {

        RED.nodes.createNode(this, config);
        var node = this;

        node.device = RED.nodes.getNode(config.device);
        node.deviceAutodiscover = config.deviceAutodiscover;

        node.heosCommandGroup = config.commandGroup;
        node.heosCommand = config.command;
        node.heosAttributes = config.attributes;

        var heosConnection;

        node.on('input', function(msg, send, done) {

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
                    
                    heosConnection = connection

                    connection
                        .on({ commandGroup: commandGroup, command: command}, (message) => {

                            // For maximum backwards compatibility, check that send exists.
                            // If this node is installed in Node-RED 0.x, it will need to
                            // fallback to using `node.send`
                            send = send || function() { node.send.apply(node,arguments) }

                            send(message);

                            if (done) {
                                done();
                            }
                        })
                        .onClose(hadError => {
                            if (hadError) {
                                node.error('There was a transmission error and the connection closed.')
                            } else {
                                node.warn('Connection closed.')
                            }
                        })
                        .write(commandGroup, command, attributes)
                })
                .catch(reason => node.warn('Did not find any HEOS devices with autodiscovery. Could not connect to HEOS network.'))
            }
            else {

                // Autodiscovering is disabled - connect to specific device
                if(node.device) {

                    let ipAddress = node.device.ip;

                    heos.connect(ipAddress).then(connection => {
                        
                        heosConnection = connection

                        connection
                            .on({ commandGroup: commandGroup, command: command}, (message) => {

                            // For maximum backwards compatibility, check that send exists.
                            // If this node is installed in Node-RED 0.x, it will need to
                            // fallback to using `node.send`
                            send = send || function() { node.send.apply(node,arguments) }

                            send(message);

                            if (done) {
                                done();
                            }
                        })
                        .write(commandGroup, command, attributes)
                    })
                    .catch(reason => node.warn('Could not connect to HEOS devices with IP '+ipAddress+'.'))
                }
                else {

                    // TODO: Handle error - autodicover disabled but no IP specified
                    node.warn("HEOS node: Autodicover disabled but no IP specified.");
                }
            }

        });

        this.on('close', function(done) {

            heosConnection.close().then(resolve => {
                console.log(resolve)
                done();
            })
            .catch(err => {
                console.error(err)
            })
        });
    }

    RED.nodes.registerType("heos-command", HeosCommandNode);

    /**
     * The HeosPlayerStateNode can submit player state commands to the HEOS network.
     */
    function HeosPlayerStateNode(config) {

        RED.nodes.createNode(this, config);
        var node = this;

        node.device = RED.nodes.getNode(config.device);
        node.deviceAutodiscover = config.deviceAutodiscover;

        node.heosPlayerId = config.playerId;
        node.heosPlayerState = config.playerState;

        var heosConnection;

        node.on('input', function(msg, send, done) {

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
                    
                    heosConnection = connection

                    connection
                        .on({ commandGroup: "player", command: "set_play_state"}, (message) => {

                            // For maximum backwards compatibility, check that send exists.
                            // If this node is installed in Node-RED 0.x, it will need to
                            // fallback to using `node.send`
                            send = send || function() { node.send.apply(node,arguments) }

                            send(message);

                            if (done) {
                                done();
                            }
                        })
                        .write("player", "set_play_state", attributes)
                })
                .catch(reason => node.warn('Did not find any HEOS devices with autodiscovery. Could not connect to HEOS network.'))
            }
            else {

                // Autodiscovering is disabled - connect to specific device
                if(node.device.ip) {

                    let ipAddress = node.device.ip;

                    heos.connect(ipAddress).then(connection => {
                        
                        heosConnection = connection

                        connection
                            .on({ commandGroup: "player", command: "set_play_state"}, (message) => {

                                // For maximum backwards compatibility, check that send exists.
                                // If this node is installed in Node-RED 0.x, it will need to
                                // fallback to using `node.send`
                                send = send || function() { node.send.apply(node,arguments) }

                                send(message);

                                if (done) {
                                    done();
                                }
                            })
                            .write("player", "set_play_state", attributes)
                    })
                    .catch(reason => node.warn('Could not connect to HEOS devices with IP '+ipAddress+'.'))
                }
                else {

                    // TODO: Handle error - autodicover disabled but no IP specified
                    node.warn("HEOS node: Autodicover disabled but no IP specified.");
                }
            }

        });

        this.on('close', function(done) {

            heosConnection.close().then(resolve => {
                console.log(resolve)
                done();
            })
            .catch(err => {
                console.error(err)
            })
        });
    }

    RED.nodes.registerType("heos-player-state", HeosPlayerStateNode);

    // Data lookup for UI
    heosAdminAPI.heosAdminAPI(RED)
}