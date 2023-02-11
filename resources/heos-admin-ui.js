"use strict";

/**
 * The Node-RED administration interface for the HEOS nodes.
 */
class heosAdminUI {

    /**
     * Wrapper method to request data from the API data endpoints (for example devices and players).
     * 
     * @param {*} path The path of the API endpoint to be used.
     * @param {*} callback Callback method returning the data. Callback parameters are error and data.
     */
    getData(path, callback) {

        console.log("Retrieving Data from API");

        let ui = this;

        try {

            $.ajax({
                url: path,
                method: 'GET',
                timeout: 10000
            })
                .done(function (response) {

                    if (response) {

                        callback(null, response);
                    } else {
                        callback("Expected data not returned.");
                    }

                })
                .fail(function (jqXHR, textStatus, errorThrown) {

                    callback(textStatus || "Unknown.");

                });
        } catch (err) {
            callback("API call error. Undefined.");
        }
    };

    /**
     * Updates the list of available HEOS devices in the network.
     */
    updateDevicesList() {

        console.log("Updating Devices List");

        // Hide layers
        $('#heos-devices-message-no-devices').hide();
        $('#heos-devices-message-error').hide();
        $('#heos-devices').hide();

        // Show discovering status
        $('#heos-devices-discovering').show();

        // clear list
        $("#heos-devices ul").empty();

        let ui = new heosAdminUI(),
                    typeDefault = "none";

        // The players endpoints is used for retrieving device information because devices do not have names but players do.
        // So the user can view a list of devices/players with names.
        ui.getData("heos/data/players", function (err, playersJson) {

            if (playersJson) {
                
                let playersList = playersJson.players;

                $('#heos-devices-discovering').hide();

                // Add devices

                if(playersList.length > 0) {

                    for (let player of playersList) {
                    
                        var li = $('<li>'+player.name+' ('+player.ip+')</li>');
                        $("#heos-devices ul").append(li);
                    }

                    $('#heos-devices').show();
                }
                else {

                    $('#heos-devices-message-no-devices').show();
                }
            }
            else {
                // Fallback
                $('#heos-devices-discovering').hide();
                $('#heos-devices-message-error').show();
            }
        });
    }
}