export class SlotDto {
    id: string;
    provider: string;
    start: string;
    end: string;
    available: boolean;
    created_at: string;

    constructor(slot: SlotDto) {
        this.id = slot.id;
        this.provider = slot.provider;
        this.start = slot.start;
        this.end = slot.end;
        this.available = slot.available;
        this.created_at = slot.created_at;
    }
}
