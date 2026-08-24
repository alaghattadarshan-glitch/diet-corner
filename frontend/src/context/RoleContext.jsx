import React, { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [role, setRoleState] = useState(() => {
    return localStorage.getItem('diet_corner_prototype_role') || 'customer';
  });

  const [customerId] = useState(() => {
    let existingId = localStorage.getItem('diet_corner_customer_id');
    if (!existingId || existingId.includes('demo_user') || existingId.includes('Guest')) {
      existingId = 'cust_' + (crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).substring(2, 10));
      localStorage.setItem('diet_corner_customer_id', existingId);
    }
    return existingId;
  });

  const setRole = (newRole) => {
    setRoleState(newRole);
    localStorage.setItem('diet_corner_prototype_role', newRole);
  };

  useEffect(() => {
    localStorage.setItem('diet_corner_prototype_role', role);
  }, [role]);

  return (
    <RoleContext.Provider value={{ role, setRole, customerId }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
