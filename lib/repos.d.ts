export default class RepoService {
    static runMany(repos: string[]): Promise<void>;
    static run(repoFullName: string): Promise<void>;
}
