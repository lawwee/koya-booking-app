export class SlotDto {
    id: string;
    provider: string;
    start: string;
    end: string;
    available: boolean;
    createdAt: string;
    updatedAt: string;

    constructor(slot: SlotDto) {
        this.id = slot.id;
        this.provider = slot.provider;
        this.start = slot.start;
        this.end = slot.end;
        this.available = slot.available;
        this.createdAt = slot.createdAt;
        this.updatedAt = slot.updatedAt;
    }
}
