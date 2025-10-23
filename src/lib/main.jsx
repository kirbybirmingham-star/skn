Text file: main.jsx
Latest content with line numbers:
1	import React from 'react';
2	    import ReactDOM from 'react-dom/client';
3	    import { BrowserRouter } from 'react-router-dom';
4	    import App from '@/App';
5	    import '@/index.css';
6	    import { Toaster } from '@/components/ui/toaster';
7	    import { AuthProvider } from '@/contexts/SupabaseAuthContext';
8	
9	    ReactDOM.createRoot(document.getElementById('root')).render(
10	      <>
11	        <BrowserRouter>
12	          <AuthProvider>
13	            <App />
14	            <Toaster />
15	          </AuthProvider>
16	        </BrowserRouter>
17	      </>
18	    );