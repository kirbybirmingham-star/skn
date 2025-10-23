import React from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

    const DashboardPage = () => {
      const { user } = useAuth();

      const getAvatarFallback = (email) => {
        if (!email) return "U";
        return email[0].toUpperCase();
      }

      return (
        <>
          <Helmet>
            <title>Dashboard | SKN Bridge Trade</title>
            <meta name="description" content="Your personal dashboard on SKN Bridge Trade." />
          </Helmet>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-12"
              >
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-600 text-lg">Welcome back, {user?.user_metadata?.username || user?.email}!</p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="lg:col-span-1"
                >
                  <Card>
                    <CardHeader className="items-center">
                      <Avatar className="w-24 h-24 mb-4">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-4xl">{getAvatarFallback(user?.email)}</AvatarFallback>
                      </Avatar>
                      <CardTitle>{user?.user_metadata?.username || 'User'}</CardTitle>
                      <CardDescription>{user?.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-center text-muted-foreground">Member since {new Date(user?.created_at).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="lg:col-span-2"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Overview</CardTitle>
                      <CardDescription>Your activity at a glance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">0</p>
                            <p className="text-sm text-muted-foreground">Active Listings</p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">0</p>
                            <p className="text-sm text-muted-foreground">Items Sold</p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">0</p>
                            <p className="text-sm text-muted-foreground">Items Bought</p>
                          </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </>
      );
    };

    export default DashboardPage;