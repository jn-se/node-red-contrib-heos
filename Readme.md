# node-red-contrib-heos

* [Introduction](#introduction)
* [Installation](#installation)
* [Getting Started](#getting-started)
* [HEOS Nodes](#heos-nodes)
    * [Generic Nodes](#generic-nodes)
    * [Specifc Nodes](#specific-nodes)
* [Roadmap](#roadmap)
* [External Documentation](#external-documentation)

# Introduction

A HEOS Node for Node-RED.

Use this node to integrate your HEOS devices into your Node-RED flows. HEOS ist the multiroom audio system by Denon.

**Denon HEOS vs. Denon Home**

This node supports the legacy Denon HEOS (HS) devices and as well the newer Denon Home devices. Both the Denon HEOS and the Denon Home devices are based on the HEOS system.

# Installation

If you have already Node-RED installed you can install the HEOS nodes via the editor. Go to the Node-RED menu and `Manage palette`. Then select the `Install` tab and search for the package `node-red-contrib-heos`.

# Getting Started

This package offers nodes to send commands to the HEOS network and listen for responses.

HEOS devices are normally autodiscovered in the network. So there is no need to configure a gateway if your Node-RED installation has access to your network and can search for HEOS devices.

The connection it established to an arbitrary HEOS device in your network that will then act as the gateway. The commands for a player are not adressed to a specific HEOS devices with an IP adress. Instead all commands are send to the gateway device but all commands are equipped with a `playerID` as recipient. The HEOS network will itself route the command to the appropriate player.

Use the [Quickstart Guide](documentation/Quickstart.md) and follow the steps to set up your first HEOS flow in a few minutes.

There are also some example flows available in the `examples` folder:

* Get Players: [heos-get-players.json](examples/heos-get-players.json)
* Set Player State: [heos-set-player-state.json](examples/heos-set-player-state.json)
* Set Player Volume: [heos-set-player-volume.json](examples/heos-set-player-volume.json)
* Listen for Change Events: [heos-listen.json](examples/heos-listen.json)

# HEOS Nodes

This package offers two types of nodes:
* Generic nodes
* Specific nodes

## Generic Nodes

### HEOS Command Node

Send a custom command to the HEOS network.

HEOS commands include the following configurations:
* **Command Group:** The group of the command.
* **Command:** The command.
* **Attributes:** The configuration details for the specific command.

So this node is completely generic and can send any command to the HEOS network. For a complete reference of available commands please see the HEOS CLI reference linked at the [bottom of this page](#external-documentation).

For example to play or stop music use the following node configurations.

**Play music**

>
>| Configuration Item| Value |
>| --- | ----------- |
>| Command Group | player |
>| Command | set_player_state |
>| Attributes | `{"pid":your-player-id,"state":"play"}` |

**Stop music**

>| Configuration Item| Value |
>| --- | ----------- |
>| Command Group | player |
>| Command | set_player_state |
>| Attributes | `{"pid":your-player-id,"state":"stop"}` |

### HEOS Listener Node

Listen for specific change events in the HEOS network.

HEOS change events include the following configurations:
* **Command Group:** The group of the command.
* **Command:** The command.

So this node is completely generic and can get any change event available in the HEOS network. For a complete reference of available events please see the HEOS CLI reference linked at the [bottom of this page](#external-documentation).

The data of the change event can be read from the output in the `payload.heos` attribute.

For example to register player state events (like `play`, `pause` and `stop`) or player volume events use the following node configurations.

**Get Player State Events**

>
>| Configuration Item| Value |
>| --- | ----------- |
>| Command Group | event |
>| Command | player_state_changed |

**Get Player Volume Events**

>
>| Configuration Item| Value |
>| --- | ----------- |
>| Command Group | event |
>| Command | player_volume_changed |


## Specific Nodes

Specific nodes are more easy to use than the generic command node. Simply configure the `playerID` and the command.

Nodes available:

* HEOS Player State Node
* HEOS Player Volume Node

More nodes will follow in the next releases.

### HEOS Player State Node

Send a player state command that allows you to quickly send states to a player.

Allowed `states` are:
* `play`
* `pause`
* `stop`

### HEOS Player Volume Node

Send a player volume command that allows you to quickly change the volume level of a player.

Allowed `levels` are integer values between 0 and 100.

# Roadmap

This node is currently under development.
There is a roadmap of some tasks to be done for the next releases.

## Version 1.x

* Review & stabilization.
* Add tests.
* Add more nodes.
* Review player groups and check generel conditions. 

# External Documentation

* HEOS API: [HEOS CLI Protocol Specification (2021)](https://rn.dmglobal.com/euheos/HEOS_CLI_ProtocolSpecification_2021.pdf)

