import { Model, Document, FilterQuery } from 'mongoose';
import { PaginationMeta } from './ApiResponse';

/**
 * Pagination options interface
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  populate?: string | string[];
}

/**
 * Paginated result interface
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Default pagination limits
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Paginate mongoose queries with metadata
 * 
 * @param model - Mongoose model
 * @param filter - Query filter
 * @param options - Pagination options
 * @returns Promise<PaginatedResult<T>>
 */
export async function paginate<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    sort = '-createdAt',
    populate
  } = options;

  // Validate and normalize pagination parameters
  const normalizedPage = Math.max(1, Number(page));
  const normalizedLimit = Math.min(MAX_LIMIT, Math.max(1, Number(limit)));
  const skip = (normalizedPage - 1) * normalizedLimit;

  // Build query
  let query = model.find(filter).sort(sort).skip(skip).limit(normalizedLimit);

  // Add population if specified
  if (populate) {
    if (typeof populate === 'string') {
      query = query.populate(populate);
    } else {
      populate.forEach(field => {
        query = query.populate(field);
      });
    }
  }

  // Execute queries in parallel for better performance
  const [docs, total] = await Promise.all([
    query.lean().exec(),
    model.countDocuments(filter)
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / normalizedLimit);
  const hasNextPage = normalizedPage * normalizedLimit < total;
  const hasPrevPage = normalizedPage > 1;

  const meta: PaginationMeta = {
    page: normalizedPage,
    limit: normalizedLimit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage
  };

  return {
    data: docs as T[],
    meta
  };
}

/**
 * Cursor-based pagination for large datasets
 * Uses cursor (usually _id or createdAt) for efficient pagination
 * 
 * @param model - Mongoose model
 * @param filter - Query filter
 * @param cursor - Last document cursor from previous page
 * @param limit - Number of items per page
 * @param sort - Sort order (default: _id ascending)
 * @returns Promise<{ data: T[], nextCursor?: string, hasMore: boolean }>
 */
export async function cursorPaginate<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T> = {},
  cursor?: string,
  limit: number = DEFAULT_LIMIT,
  sort: string = '_id'
): Promise<{ data: T[]; nextCursor?: string; hasMore: boolean }> {
  const normalizedLimit = Math.min(MAX_LIMIT, Math.max(1, Number(limit)));

  // Build filter with cursor
  let cursorFilter = { ...filter };
  if (cursor) {
    const [sortField, sortOrder] = sort.split(' ');
    const isAscending = sortOrder !== '-';
    
    if (isAscending) {
      cursorFilter[sortField as keyof FilterQuery<T>] = {
        ...cursorFilter[sortField as keyof FilterQuery<T>],
        $gt: cursor
      };
    } else {
      cursorFilter[sortField as keyof FilterQuery<T>] = {
        ...cursorFilter[sortField as keyof FilterQuery<T>],
        $lt: cursor
      };
    }
  }

  // Fetch one extra document to determine if there are more results
  const docs = await model
    .find(cursorFilter)
    .sort(sort)
    .limit(normalizedLimit + 1)
    .lean()
    .exec();

  const hasMore = docs.length > normalizedLimit;
  const data = hasMore ? docs.slice(0, -1) : docs;
  const nextCursor = hasMore && data.length > 0 
    ? String(data[data.length - 1]._id) 
    : undefined;

  return {
    data: data as T[],
    nextCursor,
    hasMore
  };
}

/**
 * Build pagination metadata for manual pagination
 * 
 * @param page - Current page
 * @param limit - Items per page
 * @param total - Total items
 * @returns PaginationMeta
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page * limit < total;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage
  };
}

/**
 * Extract pagination info from query parameters
 * 
 * @param query - Express query object
 * @returns PaginationOptions
 */
export function extractPaginationOptions(query: any): PaginationOptions {
  const options: PaginationOptions = {};

  if (query.page) {
    options.page = Number(query.page);
  }

  if (query.limit) {
    options.limit = Number(query.limit);
  }

  if (query.sort) {
    options.sort = query.sort;
  }

  if (query.populate) {
    options.populate = Array.isArray(query.populate) 
      ? query.populate 
      : query.populate.split(',');
  }

  return options;
}
