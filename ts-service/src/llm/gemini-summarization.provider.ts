import { Injectable, Logger } from '@nestjs/common';

import {
  CandidateSummaryInput,
  CandidateSummaryResult,
  SummarizationProvider,
} from './summarization-provider.interface';

@Injectable()
export class GeminiSummarizationProvider implements SummarizationProvider {
  private readonly logger = new Logger(GeminiSummarizationProvider.name);
  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

  async generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const prompt = this.buildPrompt(input.documents);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error('No response text from Gemini API');
      }

      // Parse the structured response
      const parsed = this.parseStructuredResponse(responseText);
      return parsed;
    } catch (error) {
      this.logger.error(`Failed to generate candidate summary: ${error}`);
      throw error;
    }
  }

  private buildPrompt(documents: string[]): string {
    const combinedDocuments = documents.join('\n\n---\n\n');

    return `You are a professional recruiter analyzing candidate application materials.

Analyze the following candidate documents and provide a structured JSON response with:
1. A score (0-100) indicating overall candidate strength
2. Key strengths (list of 2-4 main strengths)
3. Key concerns (list of 2-4 main concerns)
4. A 2-3 sentence professional summary
5. A recommended decision (advance, hold, or reject)

CANDIDATE DOCUMENTS:
${combinedDocuments}

Respond with ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "score": <number 0-100>,
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "concerns": ["<concern1>", "<concern2>", "<concern3>"],
  "summary": "<2-3 sentence summary>",
  "recommendedDecision": "<advance|hold|reject>"
}`;
  }

  private parseStructuredResponse(responseText: string): CandidateSummaryResult {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize response
      const score = this.normalizeScore(parsed.score);
      const strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
      const concerns = Array.isArray(parsed.concerns) ? parsed.concerns : [];
      const summary = String(parsed.summary || '').trim();
      const recommendedDecision = this.normalizeDecision(parsed.recommendedDecision);

      if (!summary) {
        throw new Error('Summary is empty');
      }

      return {
        score,
        strengths: strengths.slice(0, 4),
        concerns: concerns.slice(0, 4),
        summary,
        recommendedDecision,
      };
    } catch (error) {
      this.logger.error(`Failed to parse Gemini response: ${error}`);
      throw new Error(`Invalid response format from Gemini: ${error}`);
    }
  }

  private normalizeScore(score: unknown): number {
    const num = Number(score);
    if (isNaN(num)) return 50;
    return Math.min(100, Math.max(0, Math.round(num)));
  }

  private normalizeDecision(decision: string): 'advance' | 'hold' | 'reject' {
    const normalized = String(decision).toLowerCase().trim();
    if (normalized === 'advance' || normalized === 'accept' || normalized === 'yes') {
      return 'advance';
    }
    if (normalized === 'reject' || normalized === 'no') {
      return 'reject';
    }
    return 'hold';
  }
}
