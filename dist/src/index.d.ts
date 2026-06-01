export interface Story {
    name: string;
    weight: number;
    tellCount: number;
    lastTold: number;
    parentId: string | null;
    tags: string[];
}
export interface PraiseName {
    storyIds: string[];
    name: string;
    compressionRatio: number;
    density: number;
}
export interface CallResponse {
    callerStory: string;
    responderStory: string;
    similarity: number;
}
export declare class Griot {
    stories: Map<string, Story>;
    decayRate: number;
    constructor(decayRate?: number);
    addStory(s: Omit<Story, "tellCount" | "lastTold"> & {
        tellCount?: number;
        lastTold?: number;
    }): Story;
    findStory(name: string): Story | undefined;
    tellStory(name: string): number;
    applyDecay(elapsedMs: number): void;
    memoryStrengths(): number[];
    traditionScore(): number;
}
export declare function generatePraiseName(griot: Griot, storyIds: string[], name: string): PraiseName;
export declare function callAndResponse(caller: Griot, responder: Griot, storyName: string): CallResponse;
export declare function genealogy(griot: Griot, storyName: string): Story[];
export declare function descendants(griot: Griot, storyName: string): Story[];
export declare class Federation {
    griots: Griot[];
    private syncPairs;
    addGriot(g: Griot): number;
    syncStory(fromIdx: number, toIdx: number, storyName: string): void;
    mergeMemories(idx1: number, idx2: number): void;
    coverage(): number;
}
