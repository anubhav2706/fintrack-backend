/**
 * Models Index
 * Exports all Mongoose models for easy importing
 */

// Core Models
export { User } from './User.model';
export { Account } from './Account.model';
export { Category } from './Category.model';
export { Transaction } from './Transaction.model';
export { Goal } from './Goal.model';
export { GoalContribution } from './GoalContribution.model';
export { Budget } from './Budget.model';
export { Debt, Split } from './Debt.model';

// Additional Models - Export all needed models
export { 
  Bill, 
  Installment,
  Investment,
  Template,
  Profile,
  Envelope,
  Tag
} from './Additional.models';

// Type exports for convenience
export type {
  IUserDocument,
  IAccountDocument,
  ICategoryDocument,
  ITransactionDocument,
  IGoalDocument,
  IGoalContributionDocument,
  IBudgetDocument,
  IDebtDocument,
  ISplitDocument,
  IInvestmentDocument,
  IBillDocument,
  IInstallmentDocument,
  ITemplateDocument,
  IProfileDocument,
  IActivityLogDocument,
  ITagDocument,
  IEnvelopeDocument,
  ITransactionCommentDocument,
  IBudgetGroupDocument,
  IDeviceSyncDocument
} from '../types';
