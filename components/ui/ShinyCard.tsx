import React from 'react';
import { Card, CardProps } from './Card';

export type ShinyCardProps = CardProps;

/**
 * @deprecated Use `Card` from `components/ui/Card` directly.
 */
export const ShinyCard: React.FC<ShinyCardProps> = (props) => {
  return <Card {...props} />;
};
