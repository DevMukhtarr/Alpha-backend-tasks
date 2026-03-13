import { Module } from '@nestjs/common';

import { FakeSummarizationProvider } from './fake-summarization.provider';
import { GeminiSummarizationProvider } from './gemini-summarization.provider';
import { SUMMARIZATION_PROVIDER } from './summarization-provider.interface';

@Module({
  providers: [
    FakeSummarizationProvider,
    GeminiSummarizationProvider,
    {
      provide: SUMMARIZATION_PROVIDER,
      useFactory: () => {
        // Use Gemini provider in production, fake in test/development if not configured
        const useGemini = process.env.GEMINI_API_KEY !== undefined;
        if (useGemini) {
          return new GeminiSummarizationProvider();
        }
        return new FakeSummarizationProvider();
      },
    },
  ],
  exports: [SUMMARIZATION_PROVIDER, FakeSummarizationProvider, GeminiSummarizationProvider],
})
export class LlmModule {}
