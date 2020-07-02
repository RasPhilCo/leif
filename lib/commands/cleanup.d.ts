import { Command } from '@oclif/command';
export default class Cleanup extends Command {
    static description: string;
    static args: {
        name: string;
        description: string;
    }[];
    static flags: {};
    run(): Promise<void>;
}
