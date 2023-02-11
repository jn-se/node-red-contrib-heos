"use strict";

/**
 * An API to provide information about the HEOS network to the Node-RED frontend pages.
 */
function heosAdminAPI(RED) {

    const heos = require('heos-api')

    // API endpoint for retrieving device information. Devices are physical HEOS devices that provide HEOS players.
    RED.httpAdmin.get('/heos/data/devices', function (req, res, next) {
        
        console.log("GET: /heos/data/devices");

        heos.discoverDevices({ timeout: 5000 }, (address) => {

            // not used
    
        }, (addresses) => {
            
            try {

                // Return array of HEOS devices in the network
                res.end(JSON.stringify(addresses));
    
            } catch (error) {
    
                console.warn(error);
                
                res.end(JSON.stringify([
                    {
                        message: "Error while scanning for HEOS devices."
                    }
                ]));
            }
        })
        .catch(reason => console.warn('Did not find any HEOS devices with autodiscovery.'))

    });

    // API endpoint for retrieving player information. Player are the music players that are provided by the devices.
    RED.httpAdmin.get('/heos/data/players', function (req, res, next) {
        
        console.log("GET: /heos/data/players");

        heos.discoverAndConnect({ timeout: 5000 }).then(connection =>
    
            connection
                .on({ commandGroup: "player", command: "get_players"}, (response) => {
                    
                    if(response.payload) {

                        let players = response.payload;

                        try {

                            // Return array of HEOS players in the network
                            res.end(JSON.stringify(players));
                
                        } catch (error) {
                
                            console.warn(error);
                            
                            res.end(JSON.stringify([
                                {
                                    message: "Error while retrieving HEOS players."
                                }
                            ]));
                        }
                    }
                })
                .write("player", "get_players")
        )
        .catch(reason => console.warn('Did not find any HEOS devices with autodiscovery. Could not connect to HEOS network to retrieve list of players.'))
    });
}

module.exports.heosAdminAPI = heosAdminAPI;