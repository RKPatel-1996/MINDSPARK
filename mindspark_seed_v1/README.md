# MindSpark Real Seed Library v1

Purpose: a small real seed library for MindSpark integration/testing and actual continued use.

## Contract

- 32 standalone ImportPayloadDraft packets
- 8 Linux, 8 Bioinformatics, 8 ChimeraX, 8 Microbiology
- No IDs, timestamps, lifecycle status, FSRS state, difficulty, priority, or deck metadata
- Each packet contains exactly one `item` and one-or-more `cards`
- Controlled taxonomy and controlled tags only
- Current set uses exactly one card per knowledge item
- Card mix: 13 free_recall, 10 mcq, 6 flashcard, 3 true_false

## Files

- `seed_taxonomy_registry.json` — proposed controlled seed registry
- `packets/` — 32 standalone JSON packets; these match the one-packet-at-a-time import contract
- `mindspark_seed_packets.jsonl` — one complete packet per line
- `mindspark_seed_packets_AUDIT_ONLY_array.json` — convenience array for auditing only; do not treat this as the current importer contract

## Summary

| # | Domain | Topic | Subtopic | Title | Card type(s) |
|---:|---|---|---|---|---|
| 1 | computing | linux | shell | Why `cd` must run inside the current shell | free_recall |
| 2 | computing | linux | processes | Environment inheritance is downward, not upward | free_recall |
| 3 | computing | linux | shell | Single quotes and double quotes have different expansion behavior | mcq |
| 4 | computing | linux | shell | Capture `$?` immediately when you need a command's exit status | flashcard |
| 5 | computing | linux | filesystem-permissions | Directory read, write, and execute permissions control different operations | free_recall |
| 6 | computing | linux | filesystem-permissions | Deleting a file is primarily controlled by the parent directory | true_false |
| 7 | computing | linux | processes | Parent and child processes have separate process state | mcq |
| 8 | computing | linux | filesystem-permissions | Absolute, relative, and home-relative paths | mcq |
| 9 | bioinformatics | sequence-analysis | sequence-formats | FASTA stores sequence; FASTQ stores sequence plus per-base quality | free_recall |
| 10 | bioinformatics | sequence-analysis | sequence-formats | A FASTA record begins with a definition line starting with `>` | flashcard |
| 11 | bioinformatics | sequence-analysis | blast | BLAST E-value estimates chance matches at least as good as the observed alignment | free_recall |
| 12 | bioinformatics | sequence-analysis | blast | BLAST significance depends on the search space, not only sequence identity | mcq |
| 13 | bioinformatics | sequence-analysis | blast | BLAST is a local similarity search | true_false |
| 14 | bioinformatics | sequence-analysis | databases | Versioned accessions make database references reproducible | free_recall |
| 15 | bioinformatics | workflow-fundamentals | reproducibility | A reproducible CLI workflow records inputs, commands, versions, parameters, and outputs | free_recall |
| 16 | bioinformatics | workflow-fundamentals | cli-tools | Pipelines should fail visibly when an upstream command fails | mcq |
| 17 | structural-biology | chimerax | commands | `open` loads local data or fetches structures in ChimeraX | flashcard |
| 18 | structural-biology | chimerax | selection-display | ChimeraX atom specifications use a hierarchy of model, chain, residue, and atom | mcq |
| 19 | structural-biology | chimerax | selection-display | `sel` refers to the current ChimeraX selection | flashcard |
| 20 | structural-biology | chimerax | selection-display | Hiding a structure is not the same as deleting it | free_recall |
| 21 | structural-biology | chimerax | visualization | Cartoon representation emphasizes biopolymer backbone and secondary structure | free_recall |
| 22 | structural-biology | chimerax | visualization | `surface` creates/displays molecular surfaces in ChimeraX | mcq |
| 23 | structural-biology | chimerax | commands | The `color` command can target structural subsets | mcq |
| 24 | structural-biology | chimerax | selection-display | Combined atom specifications can target a precise structural region | free_recall |
| 25 | microbiology | laboratory-methods | staining | Gram staining differentiates cells largely through cell-envelope behavior during decolorization | free_recall |
| 26 | microbiology | laboratory-methods | staining | The classical Gram-stain reagent order matters | flashcard |
| 27 | microbiology | laboratory-methods | media | Selective and differential media answer different questions | mcq |
| 28 | microbiology | fundamentals | growth | Bacterial growth phases reflect changing population physiology | free_recall |
| 29 | microbiology | fundamentals | growth | Generation number relates population increase by powers of two during ideal binary fission | mcq |
| 30 | microbiology | fundamentals | cell-structure | Gram-positive and Gram-negative envelopes differ structurally | flashcard |
| 31 | microbiology | laboratory-methods | aseptic-technique | Aseptic technique reduces contamination in both directions | free_recall |
| 32 | microbiology | laboratory-methods | media | A visible colony is not guaranteed to originate from exactly one cell | true_false |
