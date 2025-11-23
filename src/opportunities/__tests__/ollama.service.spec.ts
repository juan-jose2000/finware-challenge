// Mock axios at the top
jest.mock('axios');
const mockAxios = require('axios');

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OllamaService } from '../services/ollama.service';

describe('OllamaService', () => {
  let service: OllamaService;
  let eventEmitter: EventEmitter2;

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockAxiosInstance = {
    post: jest.fn(),
  };

  // Setup axios mock before each test
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup axios create mock
    mockAxios.create.mockReturnValue(mockAxiosInstance);
    
    // Recreate service to get fresh mocks
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaService,
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<OllamaService>(OllamaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  describe('generateMarketAnalysisAsync', () => {
    it('should queue analysis job and return job ID', async () => {
      // Mock successful API call so queue processing completes
      mockAxiosInstance.post.mockResolvedValue({
        data: { response: 'Analysis complete' },
      });

      const jobId = await service.generateMarketAnalysisAsync(1, 'Test Opp', 300000);

      expect(jobId).toMatch(/^ollama_\d+_[a-z0-9]+$/);
      
      // Wait for queue processing to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Queue should be empty after auto-processing
      expect(service.getQueueStatus().queueLength).toBe(0);
      
      // Event should have been emitted
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('ollama.analysis.completed', {
        opportunityId: 1,
        analysis: 'Analysis complete',
      });
    });
  });

  describe('processQueue', () => {
    it('should process queued jobs and emit completion event', async () => {
      // Mock successful API call
      mockAxiosInstance.post.mockResolvedValue({
        data: { response: 'Excellent investment opportunity!' },
      });

      await service.generateMarketAnalysisAsync(1, 'Fintech Startup', 150000);

      // Wait for queue processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('ollama.analysis.completed', {
        opportunityId: 1,
        analysis: 'Excellent investment opportunity!',
      });
    });

    it('should emit error event when API call fails', async () => {
      // Mock failed API call
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

      await service.generateMarketAnalysisAsync(1, 'Test Opp', 100000);
      await (service as any).processQueue();

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('ollama.analysis.failed', {
        opportunityId: 1,
        error: 'Failed to generate market analysis: Network error', // Updated expectation
      });
    });

    it('should handle multiple jobs sequentially', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { response: 'Analysis result' },
      });

      await service.generateMarketAnalysisAsync(1, 'Opp 1', 300000);
      await service.generateMarketAnalysisAsync(2, 'Opp 2', 300000);

      // Process all queued jobs
      while (service.getQueueStatus().queueLength > 0) {
        await (service as any).processQueue();
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      }

      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(service.getQueueStatus().queueLength).toBe(0);
    });
  });

  describe('generateAnalysis', () => {
    it('should call Ollama API with correct parameters', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { response: 'Market analysis complete!' },
      });

      const result = await (service as any).generateAnalysis('Test Investment', 150000);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/generate', {
        model: 'phi:latest',
        prompt: expect.stringContaining('Test Investment'),
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        },
      });

      expect(result).toBe('Market analysis complete!');
    });

    it('should handle API errors', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('API timeout'));

      await expect((service as any).generateAnalysis('Test', 100000))
        .rejects.toThrow('Failed to generate market analysis: API timeout');
    });
  });

  describe('queue management', () => {
    it('should prevent concurrent processing', async () => {
      mockAxiosInstance.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { response: 'OK' } }), 50))
      );

      // Add multiple jobs
      await service.generateMarketAnalysisAsync(1, 'Opp 1', 100000);
      await service.generateMarketAnalysisAsync(2, 'Opp 2', 100000);

      // Check that only one is processing
      expect(service.getQueueStatus().isProcessing).toBe(true);
      expect(service.getQueueStatus().queueLength).toBe(1);
    });
  });
});
