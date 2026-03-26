import { FilterQuery } from 'mongoose';

/**
 * Analytics utility functions for MongoDB aggregation pipelines
 * Provides reusable building blocks for financial analytics
 */

/**
 * Build date range match stage for aggregation pipelines
 * 
 * @param from - Start date (ISO string or Date)
 * @param to - End date (ISO string or Date)
 * @param dateField - Field name to filter on (default: 'date')
 * @returns $match stage object
 */
export function buildDateMatch(
  from: string | Date,
  to: string | Date,
  dateField: string = 'date'
): FilterQuery<any> {
  return {
    [dateField]: {
      $gte: new Date(from),
      $lte: new Date(to)
    }
  };
}

/**
 * Build base user filter for aggregation pipelines
 * 
 * @param userId - User ID
 * @param extraFilter - Additional filter conditions
 * @returns Combined filter object
 */
export function buildUserFilter(
  userId: string,
  extraFilter: FilterQuery<any> = {}
): FilterQuery<any> {
  return {
    userId: new RegExp(`^${userId}$`),
    ...extraFilter
  };
}

/**
 * Build group by day stage for time series analysis
 * 
 * @param dateField - Field name to group by (default: 'date')
 * @returns $group stage object
 */
export function groupByDay(dateField: string = 'date'): any {
  return {
    $group: {
      _id: {
        $dateToString: {
          format: '%Y-%m-%d',
          date: `$${dateField}`
        }
      },
      date: { $first: `$${dateField}` },
      totalAmount: { $sum: '$amount' },
      count: { $sum: 1 },
      transactions: { $push: '$$ROOT' }
    }
  };
}

/**
 * Build group by week stage for time series analysis
 * 
 * @param dateField - Field name to group by (default: 'date')
 * @returns $group stage object
 */
export function groupByWeek(dateField: string = 'date'): any {
  return {
    $group: {
      _id: {
        year: { $year: `$${dateField}` },
        week: { $isoWeek: `$${dateField}` }
      },
      year: { $first: { $year: `$${dateField}` } },
      week: { $first: { $isoWeek: `$${dateField}` } },
      totalAmount: { $sum: '$amount' },
      count: { $sum: 1 },
      transactions: { $push: '$$ROOT' }
    }
  };
}

/**
 * Build group by month stage for time series analysis
 * 
 * @param dateField - Field name to group by (default: 'date')
 * @returns $group stage object
 */
export function groupByMonth(dateField: string = 'date'): any {
  return {
    $group: {
      _id: {
        $dateToString: {
          format: '%Y-%m',
          date: `$${dateField}`
        }
      },
      month: { $first: { $month: `$${dateField}` } },
      year: { $first: { $year: `$${dateField}` } },
      totalAmount: { $sum: '$amount' },
      count: { $sum: 1 },
      transactions: { $push: '$$ROOT' }
    }
  };
}

/**
 * Build group by category stage with category details
 * 
 * @returns $group stage object
 */
export function groupByCategory(): any {
  return {
    $group: {
      _id: '$categoryId',
      categoryId: { $first: '$categoryId' },
      totalAmount: { $sum: '$amount' },
      count: { $sum: 1 },
      avgAmount: { $avg: '$amount' },
      transactions: { $push: '$$ROOT' }
    }
  };
}

/**
 * Build category lookup stage to join category details
 * 
 * @returns $lookup stage object
 */
export function lookupCategory(): any {
  return {
    $lookup: {
      from: 'categories',
      localField: 'categoryId',
      foreignField: '_id',
      as: 'category',
      pipeline: [
        {
          $project: {
            name: 1,
            icon: 1,
            color: 1,
            type: 1
          }
        }
      ]
    }
  };
}

/**
 * Build account lookup stage to join account details
 * 
 * @returns $lookup stage object
 */
export function lookupAccount(): any {
  return {
    $lookup: {
      from: 'accounts',
      localField: 'accountId',
      foreignField: '_id',
      as: 'account',
      pipeline: [
        {
          $project: {
            name: 1,
            type: 1,
            currency: 1,
            color: 1,
            icon: 1
          }
        }
      ]
    }
  };
}

/**
 * Unwind array field stage
 * 
 * @param field - Field name to unwind
 * @returns $unwind stage object
 */
export function unwind(field: string): any {
  return {
    $unwind: {
      path: `$${field}`,
      preserveNullAndEmptyArrays: true
    }
  };
}

/**
 * Compute delta between current and previous values
 * 
 * @param current - Current value
 * @param previous - Previous value
 * @returns Delta object with value, percent, and direction
 */
export function computeDelta(
  current: number,
  previous: number
): {
  value: number;
  percent: number;
  direction: 'up' | 'down' | 'same';
} {
  if (previous === 0) {
    return {
      value: current,
      percent: current > 0 ? 100 : 0,
      direction: current > 0 ? 'up' : current < 0 ? 'down' : 'same'
    };
  }

  const value = current - previous;
  const percent = (value / Math.abs(previous)) * 100;
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'same';

  return {
    value,
    percent: Math.round(percent * 100) / 100, // Round to 2 decimal places
    direction
  };
}

/**
 * Build sort stage for time series data
 * 
 * @param order - Sort order (1 for ascending, -1 for descending)
 * @param dateField - Field name to sort by (default: 'date')
 * @returns $sort stage object
 */
export function sortByDate(order: 1 | -1 = 1, dateField: string = 'date'): any {
  return {
    $sort: {
      [dateField]: order
    }
  };
}

/**
 * Build facet stage for multiple aggregations in one query
 * 
 * @param facets - Object containing facet pipelines
 * @returns $facet stage object
 */
export function buildFacet(facets: Record<string, any[]>): any {
  return {
    $facet: facets
  };
}

/**
 * Build project stage to reshape output
 * 
 * @param projection - Projection object
 * @returns $project stage object
 */
export function buildProjection(projection: Record<string, any>): any {
  return {
    $project: projection
  };
}

/**
 * Build match stage for transaction type filtering
 * 
 * @param types - Array of transaction types
 * @returns $match stage object
 */
export function matchTransactionTypes(types: string[]): any {
  return {
    $match: {
      type: { $in: types }
    }
  };
}

/**
 * Build match stage to exclude soft-deleted documents
 * 
 * @returns $match stage object
 */
export function excludeDeleted(): any {
  return {
    $match: {
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false }
      ]
    }
  };
}
