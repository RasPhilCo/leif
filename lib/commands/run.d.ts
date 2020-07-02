import { Command, flags } from '@oclif/command';
export default class Run extends Command {
    static description: string;
    static flags: {
        'dry-run': import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        dir: flags.IOptionFlag<string>;
    };
    static args: {
        name: string;
        description: string;
        required: boolean;
        default: () => string;
    }[];
    run(): Promise<void>;
}
