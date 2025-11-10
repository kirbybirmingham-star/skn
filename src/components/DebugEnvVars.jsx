import React from 'react';

const DebugEnvVars = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const styles = {
    container: {
      backgroundColor: '#333',
      color: 'white',
      padding: '1rem',
      margin: '1rem',
      borderRadius: '8px',
      fontFamily: 'monospace',
    },
    title: {
      borderBottom: '1px solid #555',
      paddingBottom: '0.5rem',
      marginBottom: '0.5rem',
    },
    variable: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '0.5rem',
    },
    varName: {
      fontWeight: 'bold',
    },
    varValue: {
      color: supabaseUrl ? 'lightgreen' : 'salmon',
    },
    keyStatus: {
        color: supabaseAnonKey ? 'lightgreen' : 'salmon',
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Vite Environment Variables</h3>
      <div style={styles.variable}>
        <span style={styles.varName}>VITE_SUPABASE_URL:</span>
        <span style={styles.varValue}>{supabaseUrl || 'NOT SET'}</span>
      </div>
      <div style={styles.variable}>
        <span style={styles.varName}>VITE_SUPABASE_ANON_KEY:</span>
        <span style={styles.keyStatus}>{supabaseAnonKey ? 'Loaded' : 'NOT SET'}</span>
      </div>
    </div>
  );
};

export default DebugEnvVars;
