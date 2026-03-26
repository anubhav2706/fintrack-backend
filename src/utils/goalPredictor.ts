import { addMonths, differenceInMonths, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Goal prediction utility functions
 * Replicates the same prediction logic as the Android app
 */

/**
 * Goal prediction result interface
 */
export interface GoalPrediction {
  predictedDate: Date;
  isOnTrack: boolean;
  monthsNeeded: number;
  monthlyNeeded: number;
  avgMonthlySavings: number;
  surplusOrDeficit: number;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Goal tip interface
 */
export interface GoalTip {
  category: string;
  potentialSavings: number;
  tip: string;
  impact: 'high' | 'medium' | 'low';
}

/**
 * Goal projection data interface
 */
export interface GoalProjection {
  actual: Array<{ month: string; amount: number }>;
  projected: Array<{ month: string; amount: number }>;
  targetLine: number;
  predictedDate: Date;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Transaction summary interface
 */
export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  avgMonthlySavings: number;
  monthsAnalyzed: number;
}

/**
 * Predict goal achievement based on historical spending patterns
 * 
 * @param transactionSummary - User's transaction summary
 * @param goal - Goal details
 * @param extraMonthly - Additional monthly contribution (for what-if scenarios)
 * @returns Goal prediction with confidence levels
 */
export function predictGoalAchievement(
  transactionSummary: TransactionSummary,
  goal: {
    targetAmount: number;
    currentSaved: number;
    deadline: Date;
  },
  extraMonthly: number = 0
): GoalPrediction {
  const { targetAmount, currentSaved, deadline } = goal;
  const { avgMonthlySavings } = transactionSummary;
  
  // Calculate effective monthly savings
  const effectiveMonthlySavings = Math.max(avgMonthlySavings + extraMonthly, 1);
  
  // Calculate remaining amount and time
  const remainingAmount = targetAmount - currentSaved;
  const monthsUntilDeadline = Math.max(differenceInMonths(deadline, new Date()), 1);
  
  // Calculate months needed at current savings rate
  const monthsNeeded = Math.ceil(remainingAmount / effectiveMonthlySavings);
  
  // Calculate monthly needed to meet deadline
  const monthlyNeeded = Math.ceil(remainingAmount / monthsUntilDeadline);
  
  // Determine if on track
  const isOnTrack = monthsNeeded <= monthsUntilDeadline;
  
  // Calculate surplus or deficit
  const projectedSavings = effectiveMonthlySavings * monthsUntilDeadline;
  const surplusOrDeficit = projectedSavings - remainingAmount;
  
  // Calculate confidence based on data consistency
  const confidence = calculateConfidence(transactionSummary, monthsUntilDeadline);
  
  // Predict completion date
  const predictedDate = addMonths(new Date(), monthsNeeded);
  
  return {
    predictedDate,
    isOnTrack,
    monthsNeeded,
    monthlyNeeded,
    avgMonthlySavings: effectiveMonthlySavings,
    surplusOrDeficit,
    confidence
  };
}

/**
 * Calculate confidence level for prediction
 * 
 * @param summary - Transaction summary
 * @param monthsToPredict - Number of months to predict
 * @returns Confidence level
 */
function calculateConfidence(
  summary: TransactionSummary,
  monthsToPredict: number
): 'high' | 'medium' | 'low' {
  const { monthsAnalyzed, avgMonthlySavings } = summary;
  
  // High confidence: 3+ months of consistent data, predicting < 6 months
  if (monthsAnalyzed >= 3 && monthsToPredict <= 6 && avgMonthlySavings > 0) {
    return 'high';
  }
  
  // Medium confidence: 2+ months of data or predicting 6-12 months
  if (monthsAnalyzed >= 2 && monthsToPredict <= 12) {
    return 'medium';
  }
  
  // Low confidence: less data or long-term prediction
  return 'low';
}

/**
 * Generate smart tips to achieve goals faster
 * 
 * @param transactionSummary - User's transaction summary
 * @param topExpenseCategories - Top expense categories with amounts
 * @returns Array of actionable tips
 */
export function generateGoalTips(
  transactionSummary: TransactionSummary,
  topExpenseCategories: Array<{ category: string; amount: number; percentage: number }>
): GoalTip[] {
  const tips: GoalTip[] = [];
  const { avgMonthlySavings } = transactionSummary;
  
  // Analyze top expense categories
  topExpenseCategories.slice(0, 3).forEach((expense, index) => {
    const { category, amount, percentage } = expense;
    
    // Calculate potential savings from 20% reduction
    const potentialSavings = Math.round(amount * 0.2);
    
    // Determine impact based on category and amount
    let impact: 'high' | 'medium' | 'low';
    if (percentage >= 30 || potentialSavings >= avgMonthlySavings * 0.5) {
      impact = 'high';
    } else if (percentage >= 15 || potentialSavings >= avgMonthlySavings * 0.25) {
      impact = 'medium';
    } else {
      impact = 'low';
    }
    
    // Generate category-specific tips
    const tip = generateCategoryTip(category, amount, potentialSavings);
    
    tips.push({
      category,
      potentialSavings,
      tip,
      impact
    });
  });
  
  // Add general tips if needed
  if (tips.length < 3) {
    tips.push(...generateGeneralTips(transactionSummary));
  }
  
  return tips.slice(0, 3); // Return top 3 tips
}

/**
 * Generate category-specific saving tips
 */
function generateCategoryTip(category: string, amount: number, potentialSavings: number): string {
  const categoryTips: Record<string, string> = {
    'Food & Dining': `Cutting ${category} by 20% saves ₹${potentialSavings.toLocaleString()}/month. Try meal planning and cooking at home.`,
    'Transport': `Reducing ${category} costs by 20% saves ₹${potentialSavings.toLocaleString()}/month. Consider carpooling or public transport.`,
    'Shopping': `A 20% reduction in ${category} saves ₹${potentialSavings.toLocaleString()}/month. Try the 30-day rule for non-essential purchases.`,
    'Entertainment': `Cut ${category} spending by 20% to save ₹${potentialSavings.toLocaleString()}/month. Explore free or low-cost activities.`,
    'Bills & Utilities': `Optimize ${category} to save ₹${potentialSavings.toLocaleString()}/month. Review subscriptions and energy usage.`,
    default: `Reducing ${category} by 20% could save ₹${potentialSavings.toLocaleString()}/month. Track and optimize this expense category.`
  };
  
  return categoryTips[category] || categoryTips.default;
}

/**
 * Generate general financial tips
 */
function generateGeneralTips(summary: TransactionSummary): GoalTip[] {
  const tips: GoalTip[] = [];
  const { avgMonthlySavings, totalExpense } = summary;
  
  // Emergency fund tip
  if (avgMonthlySavings > 0) {
    tips.push({
      category: 'Emergency Fund',
      potentialSavings: avgMonthlySavings,
      tip: 'Build an emergency fund with 3-6 months of expenses. Start with ₹1,000 and grow gradually.',
      impact: 'high'
    });
  }
  
  // Automation tip
  tips.push({
    category: 'Automation',
    potentialSavings: Math.round(avgMonthlySavings * 0.1),
    tip: 'Automate your savings. Set up automatic transfers to save before you spend.',
    impact: 'medium'
  });
  
  // Review tip
  tips.push({
    category: 'Regular Review',
    potentialSavings: Math.round(totalExpense * 0.05),
    tip: 'Review your subscriptions and recurring expenses monthly. Cancel unused services.',
    impact: 'medium'
  });
  
  return tips;
}

/**
 * Generate projection data for goal visualization
 * 
 * @param contributions - Historical goal contributions
 * @param goal - Goal details
 * @param extraMonthly - Additional monthly contribution
 * @returns Projection data for charts
 */
export function generateGoalProjection(
  contributions: Array<{ date: Date; amount: number }>,
  goal: {
    targetAmount: number;
    currentSaved: number;
    deadline: Date;
  },
  extraMonthly: number = 0
): GoalProjection {
  const { targetAmount, currentSaved, deadline } = goal;
  
  // Process actual contributions by month
  const actualByMonth = new Map<string, number>();
  contributions.forEach(contribution => {
    const monthKey = contribution.date.toISOString().slice(0, 7); // YYYY-MM
    actualByMonth.set(monthKey, (actualByMonth.get(monthKey) || 0) + contribution.amount);
  });
  
  // Build actual data array
  const actual: Array<{ month: string; amount: number }> = [];
  let runningTotal = 0;
  actualByMonth.forEach((amount, month) => {
    runningTotal += amount;
    actual.push({ month, amount: runningTotal });
  });
  
  // Calculate projected data
  const projected: Array<{ month: string; amount: number }> = [];
  const currentMonth = startOfMonth(new Date());
  const projectedTotal = currentSaved;
  
  // Calculate monthly contribution based on remaining amount and time
  const monthsRemaining = Math.max(differenceInMonths(deadline, currentMonth), 1);
  const remainingAmount = targetAmount - currentSaved;
  const monthlyContribution = Math.ceil((remainingAmount / monthsRemaining) + extraMonthly);
  
  // Generate projected monthly data
  for (let i = 0; i < monthsRemaining; i++) {
    const monthDate = addMonths(currentMonth, i);
    const monthKey = monthDate.toISOString().slice(0, 7);
    const projectedAmount = Math.min(
      currentSaved + (monthlyContribution * (i + 1)),
      targetAmount
    );
    
    projected.push({ month: monthKey, amount: projectedAmount });
  }
  
  // Calculate confidence
  const confidence = actual.length >= 3 ? 'high' : actual.length >= 2 ? 'medium' : 'low';
  
  return {
    actual,
    projected,
    targetLine: targetAmount,
    predictedDate: deadline,
    confidence
  };
}

/**
 * Calculate monthly savings rate
 * 
 * @param income - Monthly income
 * @param expenses - Monthly expenses
 * @returns Savings rate as percentage
 */
export function calculateSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  const savings = Math.max(income - expenses, 0);
  return Math.round((savings / income) * 100);
}

/**
 * Determine financial health grade based on metrics
 * 
 * @param savingsRate - Savings rate percentage
 * @param budgetAdherence - Budget adherence percentage
 * @param goalProgress - Goal progress percentage
 * @returns Financial grade and description
 */
export function calculateFinancialGrade(
  savingsRate: number,
  budgetAdherence: number,
  goalProgress: number
): {
  grade: string;
  score: number;
  description: string;
} {
  const score = (savingsRate + budgetAdherence + goalProgress) / 3;
  
  let grade: string;
  let description: string;
  
  if (score >= 90) {
    grade = 'A+';
    description = 'Excellent financial health! Keep up the great work.';
  } else if (score >= 80) {
    grade = 'A';
    description = 'Very good financial health. Small improvements could make it excellent.';
  } else if (score >= 70) {
    grade = 'B+';
    description = 'Good financial health with room for improvement.';
  } else if (score >= 60) {
    grade = 'B';
    description = 'Fair financial health. Focus on building better habits.';
  } else if (score >= 50) {
    grade = 'C';
    description = 'Needs improvement. Review spending and increase savings.';
  } else if (score >= 40) {
    grade = 'D';
    description = 'Poor financial health. Significant changes needed.';
  } else {
    grade = 'F';
    description = 'Critical financial health. Immediate action required.';
  }
  
  return { grade, score: Math.round(score), description };
}
