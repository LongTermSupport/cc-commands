/**
 * @file oclif command wrapper for g:gh:project:summary
 *
 * This is a thin wrapper that handles CLI parsing and delegates
 * all orchestration logic to the pure executeProjectSummary function.
 */
import type { LLMInfo } from '../../../../types/LLMInfo';
import { BaseCommand } from '../../../BaseCommand';
/**
 * Collect comprehensive data about a GitHub project
 */
export default class Summary extends BaseCommand {
    static args: {
        urlOrMode: import("@oclif/core/interfaces").Arg<string | undefined, Record<string, unknown>>;
        projectId: import("@oclif/core/interfaces").Arg<string | undefined, Record<string, unknown>>;
    };
    static description: string;
    static examples: string[];
    static flags: {
        audience: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        days: import("@oclif/core/interfaces").OptionFlag<number, import("@oclif/core/interfaces").CustomOptions>;
        org: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        owner: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        repo: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        token: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
    };
    /**
     * Execute the command by delegating to the pure orchestration function
     */
    execute(): Promise<LLMInfo>;
}
