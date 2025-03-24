import React from 'react';
import ThematicNetworkFixed from './ThematicNetworkFixed';

/**
 * This component is a wrapper around ThematicNetworkFixed to maintain
 * backward compatibility while avoiding TypeScript errors.
 */
const ThematicNetworkNew: React.FC = () => {
  return <ThematicNetworkFixed />;
};

export default ThematicNetworkNew; 