import { clearTickInterval, clearTickTimeout, setTickInterval, setTickTimeout } from "./utils/scheduling.js";
export { clearTickInterval, clearTickTimeout, setTickInterval, setTickTimeout };

import { compressNumber, formatNumber, MS, rainbowText } from "./utils/formatter.js";
export { compressNumber, formatNumber, MS, rainbowText };

import Database from "./build/classes/databaseBuilder.js";
export { Database };

import { World } from 'Minecraft';
import { Entity } from "./build/classes/entityBuilder.js";
import { Player } from "./build/classes/playerBuilder.js";
import { Command } from "./build/classes/commandBuilder.js";
import { ServerBuilder } from "./build/classes/serverBuilder.js";

class ServerBuild extends ServerBuilder {
    public entity = Entity;
    public player = Player;
    public command = Command;
    constructor() {
        super();
        this._buildEvent();
    };
    /**
     * @private
     */
    private _buildEvent() {
        World.events.beforeChat.subscribe(data => {
            const date = new Date();
            /**
             * Emit to 'beforeMessage' event listener
             */
            this.emit('beforeMessage', data);
            /**
             * This is for the command builder and a emitter
             */
            if(!data.message.startsWith(this.command.prefix)) return;
            const args = data.message.slice(this.command.prefix.length).trim().split(/\s+/);
            const command = args.shift().toLowerCase();
            const getCommand = Command.getAllRegistation().some(element => element.name === command || element.aliases && element.aliases.includes(command));
            if(!getCommand) {
                data.canceled = true;
                return this.runCommand(`tellraw "${data.sender.nameTag}" {"rawtext":[{"text":"§c"},{"translate":"commands.generic.unknown", "with": ["§f${command}§c"]}]}`);
            };
            Command.getAllRegistation().forEach(element => {
                if(!data.message.startsWith(this.command.prefix) || element.name !== command) return;
                /**
                 * Registration callback
                 */
                if(element?.cancelMessage) data.canceled = true;
                try {
                    element.callback(data, args);
                } catch(error) {
                    this.broadcast(`§c${error}`, data.sender.nameTag);
                };
                /**
                 * Emit to 'customCommand' event listener
                 */
                this.emit('customCommand', {
                    registration: element,
                    data,
                    createdAt: date,
                    createdTimestamp: date.getTime() 
                });
            });
        });
        /**
         * Emit to 'messageCreate' event listener
         */
        World.events.chat.subscribe(data => this.emit('messageCreate', data));
        /**
         * Emit to 'entityEffected' event listener
         */
        World.events.addEffect.subscribe(data => this.emit('entityEffected', data));
        /**
         * Emit to 'weatherChange' event listener
         */
        World.events.changeWeather.subscribe(data => this.emit('weatherChange', data));
        
        let oldPlayer: Array<string> = [];
        World.events.createEntity.subscribe(data => {
            /**
             * Emit to 'entityCreate' event listener
             */
            this.emit('entityCreate', data);
        
            if(data.entity.id !== 'minecraft:player') return;
            let playerJoined = Player.list().filter(current => !oldPlayer.some(old => current === old));
            /**
             * Emit to 'playerJoin' event listener
             */
            if(playerJoined.includes(data.entity.nameTag)) this.emit('playerJoin', data.entity);
        });

        let worldLoaded = false, tickCount = 0;
        World.events.tick.subscribe(() => {
            /**
             * Emit to 'tick' event listener
             */
            this.emit('tick');
        
            let currentPlayer = Player.list();
            let playerLeft = oldPlayer.filter(old => !currentPlayer.some(current => old === current));
            /**
             * Emit to 'playerLeave' event listener
             */
            for(let player of playerLeft) this.emit('playerLeave', { name: player });
            oldPlayer = currentPlayer;
        
            tickCount++;
            if(!this.runCommand('testfor @a').error && !worldLoaded) {
                /**
                 * Emit to 'ready' event listener
                 */
                this.emit('ready', { loadTime: tickCount });
                worldLoaded = true;
            };
        });
    };
};
/**
 * Import this constructor
 */
export const Server = new ServerBuild();