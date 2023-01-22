# node-red-contrib-heos

* [Introduction](#introduction)
* [Installation](#installation)
* [Getting Started](#getting-started)
* [HEOS Nodes](#heos-nodes)
    * [HEOS Command Node](#heos-command-node)
    * [HEOS Player State Node](#heos-player-state-node)
* [Roadmap](#roadmap)
* [External Documentation](#external-documentation)

## Introduction

A HEOS Node for Node-RED.

Use this node to integrate your HEOS devices into your Node-RED flows. HEOS ist the multiroom audio system by Denon.

**Denon HEOS vs. Denon Home**

This node supports the legacy Denon HEOS (HS) devices and as well the newer Denon Home devices. Both the Denon HEOS and the Denon Home devices are based on the HEOS system.

## Installation

If you have already Node-RED installed you can install the HEOS nodes via the editor. Go to the Node-RED menu and `Manage palette`. Then select the `Ìnstall` tab and search for the package `node-red-contrib-heos`.

**Alternatively: Manual Installation via npm**

In Node-RED folder install with npm and point to the path where you downloaded the HEOS node.

    npm install path/to/node-red-contrib-heos

Then restart Node-RED to load the new HEOS node.

## Getting Started

This package offers nodes to send commands to the HEOS network and listen for responses.

HEOS devices are normally autodiscovered in the network. So there is no need to configure a gateway if your Node-RED installation has access to your network and can search for HEOS devices.

The connection it established to an arbitray device in the HEOS network that will act as the gateway. The commands are not adressed to a specific HEOS devices with an IP adresses. Instead all commands are send to the *random* gateway device but all commands are equipped with a `playerID` as recipient. The HEOS network will itself route the command to the appropriate player.

Use the [Quickstart Guide](documentation/Quickstart.md) and follow the steps to set up your first HEOS flow in a few minutes.

## HEOS Nodes

This package offers two nodes:
* HEOS Command node
* HEOS Player State node

More nodes will follow in the next releases.

### HEOS Command Node

Send a custom command to the HEOS system.

HEOS commands include the following configurations:
* **CommandGroup:** The group of the command.
* **Command:** The command.
* **Attributes:** The configuration details for the specific command.

So this node is completely generic and provides the possiility to send any command that is available in the HEOS network. For a complete reference of availabel commands please see the HEOS CLI reference linked at the [bottom of this page](#external-documentation).

For example to play or stop music use the following configurations.

**Play music**

>
>| Configuration Item| Value |
>| --- | ----------- |
>| CommandGroup | player |
>| Command | set_player_state |
>| Attributes | `{"pid":your-player-id,"state":"play"}` |

**Stop music music**

>| Configuration Item| Value |
>| --- | ----------- |
>| CommandGroup | player |
>| Command | set_player_state |
>| Attributes | `{"pid":your-player-id,"state":"stop"}` |

### HEOS Player State Node

Send a player state command that allows you to quickly send states to a player.

Allowed `states` are:
* play
* pause
* stop

This node is more easy to use than the generic command node. Simply configure the player ID and the state. Don't worry about the *Command Group* and the *Command*.

# Roadmap

This node is currently under development.
There is a roadmap of some tasks to be done for the next releases.

## Version 1.x

* Review & stabilization.
* Add tests.
* Add more nodes.
* Review player groups and check generel conditions. 

# External Documentation

* HEOS: [HEOS CLI Protocol Specification (2021)](https://rn.dmglobal.com/euheos/HEOS_CLI_ProtocolSpecification_2021.pdf)

