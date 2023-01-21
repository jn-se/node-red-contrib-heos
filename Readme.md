# node-red-contrib-heos

A HEOS Node for Node-RED.

Use this node to integrate your HEOS devices into your Node-RED flows. HEOS ist the multiroom audio system by Denon.

**Denon HEOS vs. Denon Home**

This node supports the legacy Denon HEOS (HS) devices and as well the newer Denon Home devices. Both the Denon HEOS and the Denon Home devices are based on the HEOS system.

## Installation

Install via Node-RED settings palette is not ye avalaible.

Please install via npm in Node-RED folder.

    npm install node-red-contrib-heos

## Usage

This package offers the following nodes:
* *Command* node
* *Player State* node

### How to configure the gateway?

HEOS devices can be autodiscovered in the network. So there is no need to configure a gateway if your Node-RED installation has access to your network and can search for HEOS devices.

When using the nodes in your flows you can choose betwenn

## Nodes

### Command

Send a custom command to the HEOS system.

Command are defined by four configurations:
* **CommandGroup:** The group of the command.
* **Command:** The specific command.
* **Attributes:** The configuration details for the command.

So this node is completely generic and provides the possiility to send any command that is available. For a full command specification see the HEOS CLI reference linked at the bottom of this page.

For example to play or stop music use the following configurations.

Play music:

| Configuration Item| Value |
| --- | ----------- |
| CommandGroup | player |
| Command | set_player_state |
| Attributes | `{"pid":your-player-id,"state":"play"}` |

Stop music music:

| Configuration Item| Value |
| --- | ----------- |
| CommandGroup | player |
| Command | set_player_state |
| Attributes | `{"pid":your-player-id,"state":"stop"}` |

### Player State

Send a player state command that allows you to quickly send states to a player.

States are:
* Play
* Pause
* Stop

This node is more easy to use that the generic command node. Simply configure the player ID and the state. Don't worry about the *CommandGroup* and the *Command*.

# Roadmap

This node is currently under development.
There is a roadmap of some tasks to be done until the release of the next versions.

## Version 1.x

* Review & stabilization.
* Add tests.
* Add more nodes.

## Version 2.x

* Handling of player groups.

# External Documentation

* HEOS: [HEOS CLI Protocol Specification (2021)](https://rn.dmglobal.com/euheos/HEOS_CLI_ProtocolSpecification_2021.pdf)

