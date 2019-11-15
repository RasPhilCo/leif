# Leif Yaml
- config (required [exclusive: config_filepath]): Config
- config_filepath (required [exclusive: config]): string
- schema (required): Assertion[]
- description: string

# Config

- scope (required): string 
  - org or user name that owns repos
- repos (required): string[]
  - list of repos from user/org to run assertions on

# Assertion Types

## Sequence:
- type: 'sequence'
- assertions (required): Assertion[]
  - array of assertions run in syncronous order
- apply_only_to_repos: string[]
  - whitelist only the repos this sequence of assertions should apply to
  - a sequence type ignores any whitelisted repos of its component assertions
- description: string

## Files

### File Present
- type (required): 'file-present'
- target_filepath (required): string
  - path to file being asserted
- description: string
- apply_only_to_repos: string[]
  - whitelist only the repos this assertion should apply to

### File Not Present
- type (required): 'file-not-present'
- target_filepath (required): string
  - path to file being asserted
- description: string
- apply_only_to_repos: string[]
  - whitelist only the repos this assertion should apply to

### File Exact Match
- type (required): 'file-exact-match'
- target_filepath (required): string
  - path to file being asserted
- source_filepath (required [exclusive: source]): string 
  - path to a source file
  - assert target_filepath exactly matchs source_filepath content
- source (required [exclusive: source_filepath]): string 
  - literal text
  - assert target_filepath exactly matchs source content
- description: string
- apply_only_to_repos: string[]
  - whitelist only the repos this assertion should apply to

### File Contains
- type (required): 'file-contains' (required)
- target_filepath (required): string (required)
  - path to file being asserted
- source_filepath (required [exclusive: source]): string 
  - path to a source file
  - assert target_filepath string matches source_filepath content
  - if not, source_filepath content will be appended to the end of target_filepath
- source (required [exclusive: source_filepath]): string 
  - literal text
  - assert target_filepath string matches source content
  - if not, source content will be appended to end of target_filepath
- description: string
- apply_only_to_repos: string[]
  - whitelist only the repos this assertion should apply to

### JSON Assign
- type (required): 'json-assign'
- target_filepath (required): string
  - path to file being asserted
- source_filepath: string
  - path to a source file
  - assert target_filepath json contains source_filepath json, will overwrite exiting key values
- description: string
- apply_only_to_repos: string[]
  - whitelist only the repos this assertion should apply to

### JSON Exact Match
- _alias_: File Exact Match

## Dependencies

### Node Depedency
- type (required): 'dependency-node'
- manager (required): 'yarn' | 'npm'
- dependencies: string[]
  - assert array of dependency package names (& optionally package versions) are installed
- dev_dependencies: string[]
  - assert array of dev_dependencies package names (& optionally package versions) are installed
- not_present: string[]
  - assert array of not_present package names (& optionally dependency versions) are not installed
- description: string
- apply_only_to_repos: string[]
  - whitelist only the repos this assertion should apply to
