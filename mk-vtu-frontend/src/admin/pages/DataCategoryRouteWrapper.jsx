import React, { useState } from 'react';
import ProviderManager from './ProviderManager';
import DataCategoryManager from './DataCategoryManager';

const DataCategoryRouteWrapper = ({ token }) => {
  const [selectedProvider, setSelectedProvider] = useState(null);

  if (selectedProvider) {
    return (
      <DataCategoryManager 
        token={token} 
        providerName={selectedProvider} 
        onBack={() => setSelectedProvider(null)} 
      />
    );
  }

  return (
    <ProviderManager onManageCategories={(provider) => setSelectedProvider(provider)} />
  );
};

export default DataCategoryRouteWrapper;
