import { z } from 'zod';
import { generatorParameters } from 'ts-fsrs';

export const schedulerParameterSetSchema = z.object({
  id: z.string().min(1),
  algorithm: z.literal('fsrs-6'),
  implementation: z.literal('ts-fsrs'),
  implementationVersion: z.literal('5.4.2'),
  weights: z.array(z.number()).length(21),
  learningSteps: z.array(z.union([z.string(), z.number()])),
  relearningSteps: z.array(z.union([z.string(), z.number()])),
  enableShortTerm: z.boolean(),
  maximumInterval: z.number().positive(),
  schemaVersion: z.literal(1).default(1),
});

export type SchedulerParameterSet = z.infer<typeof schedulerParameterSetSchema>;

// Get default library values dynamically to avoid hardcoding magic numbers
const defaultFsrsParams = generatorParameters();

export const DEFAULT_PARAMETER_SET: Readonly<SchedulerParameterSet> = Object.freeze({
  id: 'fsrs-6-default',
  algorithm: 'fsrs-6',
  implementation: 'ts-fsrs',
  implementationVersion: '5.4.2',
  weights: [...defaultFsrsParams.w],
  learningSteps: [...defaultFsrsParams.learning_steps],
  relearningSteps: [...defaultFsrsParams.relearning_steps],
  enableShortTerm: defaultFsrsParams.enable_short_term ?? true,
  maximumInterval: defaultFsrsParams.maximum_interval,
  schemaVersion: 1,
});
