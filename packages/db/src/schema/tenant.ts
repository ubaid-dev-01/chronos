import { Schema } from 'mongoose';

/** Every tenant-owned document must include orgId */
export const orgIdField = {
  orgId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
};

/** User who created the record (usually org admin or the worker) */
export const createdByField = {
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
};

/** Optional last editor */
export const updatedByField = {
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
};
