import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/format';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-surface border-b border-border px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Good morning, {user?.first_name}
          </h1>
          <p className="text-sm text-text-secondary">
            Here's your school's payment overview.
          </p>
        </div>
        <div className="text-sm text-text-secondary">
          {formatDate(new Date())}
        </div>
      </div>
    </header>
  );
};

export default Header;