import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import apiConfig from '../config/api';

interface ServerStatusProps {
  className?: string;
}

const ServerStatus: React.FC<ServerStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      setStatus('checking');
      const response = await fetch(`${apiConfig.baseURL}/api/health`, {
        method: 'GET',
        timeout: 5000
      } as any);
      
      if (response.ok) {
        setStatus('online');
        setError('');
      } else {
        setStatus('offline');
        setError(`Server responded with status ${response.status}`);
      }
    } catch (err: any) {
      setStatus('offline');
      setError(err.message || 'Cannot connect to server');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader className="w-4 h-4 animate-spin" />;
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Verificando servidor...';
      case 'online':
        return 'Servidor conectado';
      case 'offline':
        return 'Servidor desconectado';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'text-yellow-600';
      case 'online':
        return 'text-green-600';
      case 'offline':
        return 'text-red-600';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getStatusIcon()}
      <span className={`text-sm ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {error && (
        <span className="text-xs text-red-500 ml-2">
          ({error})
        </span>
      )}
      {status === 'offline' && (
        <button
          onClick={checkServerStatus}
          className="text-xs text-blue-500 hover:text-blue-700 underline ml-2"
        >
          Reintentar
        </button>
      )}
    </div>
  );
};

export default ServerStatus;
