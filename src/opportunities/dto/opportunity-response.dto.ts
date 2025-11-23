export class OpportunityResponseDto {
    id: number;
    name: string;
    totalAmount: number;
    details: string;
    marketAnalysis?: string;
    createdAt: Date;
    updatedAt: Date;
}