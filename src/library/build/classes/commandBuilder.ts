import { BeforeChatEvent } from "mojang-minecraft";
import { configuration } from "../configurations.js";
import { storedRegisterInformation, registerInformation } from "../../@types/build/classes/CommandBuilder";

export class CommandBuilder {
    public prefix: string = configuration.prefix;
    private _registrationInformation: Array<storedRegisterInformation> = [];

    /**
     * Register a command with a callback
     * @param {registerInformation} register An object of information needed to register the custom command
     * @param {(data: BeforeChatEvent, args: Array<string>) => void}callback Code you want to execute when the command is executed
     * @example import { Server } from "../../Minecraft";
     *  const server = new Server();
     *  server.commands.register({ name: 'ping' }, (data, args) => {
     *  server.broadcast('Pong!', data.sender.nameTag);
     * });
     */
    register(register: registerInformation, callback: (data: BeforeChatEvent, args: Array<string>) => void): void {
        this._registrationInformation.push({
            private: register.private, // param is already boolean
            cancelMessage: register.cancelMessage, // param is already boolean
            name: register.name.toLowerCase(),
            aliases: register.aliases ? register.aliases.map(v => v.toLowerCase()) : null,
            description: register.description,
            usage: register.usage,
            example: register.example ? register.example : null,
            callback
        });
    };
    /**
     * Get a list of registered commands
     * @returns {Array<string>}
     * @example getAll();
     */
    getAll(): Array<string> {
        const commands: Array<string> = [];
        this._registrationInformation.forEach(element => {
            if(element.private) return;
            commands.push(element.name);
        });
        return commands;
    };
    /**
     * Get all the registered informations
     * @returns {Array<storedRegisterInformation>}
     * @example getAllRegistration();
     */
    getAllRegistation(): Array<storedRegisterInformation> {
        return this._registrationInformation;
    };
    /**
     * Get registration information on a specific command
     * @param name The command name or alias you want to get information on
     * @returns {storedRegisterInformation}
     * @example getRegistration('ping');
     */
    getRegistration(name: string): storedRegisterInformation {
        const command = this._registrationInformation.some(element => element.name.toLowerCase() === name || element.aliases && element.aliases.includes(name));
        if(!command) return;
        let register;
        this._registrationInformation.forEach(element => {
            if(element.private) return;
            const eachCommand = element.name.toLowerCase() === name || element.aliases && element.aliases.includes(name);
            if(!eachCommand) return;
            register = element;
        });
        return register;
    };
}
export const Command = new CommandBuilder();