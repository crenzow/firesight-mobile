import React from 'react';
import { Card, CardProps } from '../ui/Card';

export type GlassCardProps = CardProps;

/**
 * @deprecated Use `Card` from `components/ui/Card` directly.
 */
export const GlassCard: React.FC<GlassCardProps> = (props) => {
  return <Card {...props} />;
};