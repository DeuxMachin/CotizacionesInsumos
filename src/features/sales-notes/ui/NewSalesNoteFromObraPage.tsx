"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { NewSalesNotePage } from './NewSalesNotePage';

export function NewSalesNoteFromObraPage() {
  const params = useParams();
  const obraId = params.id as string;

  return <NewSalesNotePage obraId={obraId} />;
}