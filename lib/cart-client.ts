'use client';

import { useSyncExternalStore } from "react";

import { getTableCommentSnapshot, subscribeTableComment } from "./cart";

export function useTableComment() {
  return useSyncExternalStore(subscribeTableComment, getTableCommentSnapshot, getTableCommentSnapshot);
}
