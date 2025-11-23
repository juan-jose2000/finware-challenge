import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios, { AxiosInstance } from 'axios';

export interface OllamaJob {
    id: string;
    opportunityId: number;
    name: string;
    amount: number;
    createdAt: Date;
}

export interface OllamaResponse {
    response: string;
    done: boolean;
}

@Injectable()
export class OllamaService {
    private readonly logger = new Logger(OllamaService.name);
    private readonly httpClient: AxiosInstance;
    private jobQueue: OllamaJob[] = [];
    private isProcessing = false;

    constructor(
        private eventEmitter: EventEmitter2,
    ) {
        this.httpClient = axios.create({
            baseURL: process.env.OLLAMA_URL || 'http://localhost:11434',
            timeout: 300000, // time for processing - 5 minutes (300 seconds)
        });
    }

    //Queue market analysis generation
    async generateMarketAnalysisAsync(
        opportunityId: number,
        name: string,
        amount: number
    ): Promise<string> {
        const jobId = `ollama_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const job: OllamaJob = {
            id: jobId,
            opportunityId,
            name,
            amount,
            createdAt: new Date(),
        };

        this.jobQueue.push(job);
        
        // Start processing if not already running
        this.processQueue();

        // Return job ID immediately
        return jobId;
    }

    // Process queue in background
    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.jobQueue.length === 0) return;

        this.isProcessing = true;

        while (this.jobQueue.length > 0) {
            const job = this.jobQueue.shift()!;

            try {
                this.logger.log(`Processing Ollama job ${job.id} for opportunity ${job.opportunityId}`);

                // Generate market analysis
                const analysis = await this.generateAnalysis(job.name, job.amount);

                // Emit event instead of direct service call
                this.eventEmitter.emit('ollama.analysis.completed', {
                    opportunityId: job.opportunityId,
                    analysis,
                });

                this.logger.log(`Completed Ollama job ${job.id} and emitted analysis event`);

            } catch (error) {
                this.logger.error(`Failed Ollama job ${job.id}:`, error.message);

                // Emit error event
                this.eventEmitter.emit('ollama.analysis.failed', {
                    opportunityId: job.opportunityId,
                    error: error.message,
                });
            }

            // Small delay between jobs to avoid overwhelming Ollama
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        this.isProcessing = false;
    }

    // Generate market analysis using Ollama
    private async generateAnalysis(name: string, amount: number): Promise<string> {
        try {
            //const prompt = `Generate a professional market analysis for an investment opportunity named "${name}" with a total investment amount of $${amount.toLocaleString()} MXN. Include market trends, potential risks, growth opportunities, and investment viability. Keep the analysis concise but comprehensive.`
            const prompt = `As a financial analyst, provide a brief market analysis for investing $${amount.toLocaleString()} MXN in "${name}". Consider fintech market trends, potential growth, and general investment viability. Keep your response professional and concise. max in 2-3 sentences`;

            const response = await this.httpClient.post('/api/generate', {
                model: 'phi:latest', // or whatever model installed
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                }
            });

            const data: OllamaResponse = response.data;
            return data.response || 'Market analysis could not be generated at this time.';

        } catch (error) {
            this.logger.error('Ollama API call failed:', error.message);
            throw new Error(`Failed to generate market analysis: ${error.message}`);
        }
    }
}
