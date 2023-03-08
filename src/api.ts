export interface EventSourceDataInterface {
    choices: EventSourceDataChoices[];
    created: number;
    id: string;
    model: string;
    object: string;
}

export type EventSourceData = EventSourceDataInterface | '[DONE]';

export interface EventSourceDataChoices {
    delta: EventSourceDataDelta;
    finish_reason?: string;
    index: number;
}

export interface EventSourceDataDelta {
    content?: string;
    role?: string;
}
