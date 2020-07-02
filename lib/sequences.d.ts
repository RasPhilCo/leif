import { Leif } from './types';
export default class SequenceService {
    static runMany(seqs: Leif.Sequence[]): Promise<void>;
    static run(seq: Leif.Sequence): Promise<void>;
    static applyAssertionsToRepo(repoFullName: string, sequence: Leif.Sequence): Promise<void>;
}
