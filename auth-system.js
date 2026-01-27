// ============================================================================
// MONA-TECH AUTHENTICATION & ROLE-BASED ACCESS CONTROL SYSTEM
// ============================================================================
// Add this script to your existing index.html before the closing </body> tag
// ============================================================================

(function() {
    'use strict';

    // ========================================================================
    // USER DATABASE (In production, this should be on a secure backend)
    // ========================================================================
    
    const USERS_DB_KEY = 'monatech_users';
    const SESSION_KEY = 'monatech_session';
    const ACTIVITY_LOG_KEY = 'monatech_activity_log';

    // Initialize default users if not exists
    function initializeUsers() {
        let users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
        
        if (users.length === 0) {
            users = [
                {
                    id: 1,
                    username: 'admin',
                    password: hashPassword('monatech2026'),
                    fullName: 'System Administrator',
                    role: 'admin',
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    username: 'sales1',
                    password: hashPassword('sales123'),
                    fullName: 'Sales Person 1',
                    role: 'salesperson',
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    username: 'viewer',
                    password: hashPassword('view123'),
                    fullName: 'Viewer Account',
                    role: 'viewer',
                    active: true,
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
        }
    }

    // Simple password hashing (In production, use proper bcrypt on backend)
    function hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    // ========================================================================
    // AUTHENTICATION FUNCTIONS
    // ========================================================================

    window.MonaTechAuth = {
        // Login user
        login: function(username, password) {
            const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
            const user = users.find(u => 
                u.username === username && 
                u.password === hashPassword(password) && 
                u.active
            );

            if (user) {
                const session = {
                    userId: user.id,
                    username: user.username,
                    fullName: user.fullName,
                    role: user.role,
                    loginTime: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
                };
                
                localStorage.setItem(SESSION_KEY, JSON.stringify(session));
                this.logActivity('LOGIN', `User ${user.username} logged in`);
                return { success: true, user: session };
            }
            
            return { success: false, message: 'Invalid username or password' };
        },

        // Logout user
        logout: function() {
            const session = this.getSession();
            if (session) {
                this.logActivity('LOGOUT', `User ${session.username} logged out`);
            }
            localStorage.removeItem(SESSION_KEY);
            window.location.reload();
        },

        // Get current session
        getSession: function() {
            const session = localStorage.getItem(SESSION_KEY);
            if (!session) return null;
            
            const sessionData = JSON.parse(session);
            
            // Check if session expired
            if (new Date() > new Date(sessionData.expiresAt)) {
                this.logout();
                return null;
            }
            
            return sessionData;
        },

        // Check if user is logged in
        isLoggedIn: function() {
            return this.getSession() !== null;
        },

        // Check permission
        hasPermission: function(permission) {
            const session = this.getSession();
            if (!session) return false;

            const permissions = {
                'admin': ['all'],
                'salesperson': [
                    'add_transaction',
                    'view_own_transactions',
                    'view_customers',
                    'add_customer',
                    'view_inventory'
                ],
                'viewer': [
                    'view_transactions',
                    'view_customers',
                    'view_inventory',
                    'view_reports_readonly'
                ]
            };

            const userPerms = permissions[session.role] || [];
            return userPerms.includes('all') || userPerms.includes(permission);
        },

        // Check if user can see menu item
        canAccessMenu: function(menuId) {
            const session = this.getSession();
            if (!session) return false;

            const menuAccess = {
                'dashboard': ['admin', 'salesperson', 'viewer'],
                'transactions': ['admin', 'salesperson', 'viewer'],
                'customers': ['admin', 'salesperson', 'viewer'],
                'inventory': ['admin', 'salesperson', 'viewer'],
                'reports': ['admin', 'viewer'],
                'settings': ['admin'],
                'users': ['admin']
            };

            const allowedRoles = menuAccess[menuId] || [];
            return allowedRoles.includes(session.role);
        },

        // Log activity
        logActivity: function(action, details) {
            const session = this.getSession();
            const logs = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
            
            logs.push({
                timestamp: new Date().toISOString(),
                username: session ? session.username : 'system',
                action: action,
                details: details
            });

            // Keep only last 1000 entries
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }

            localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(logs));
        },

        // Get activity logs (admin only)
        getActivityLogs: function(limit = 100) {
            if (!this.hasPermission('all')) return [];
            
            const logs = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
            return logs.slice(-limit).reverse();
        }
    };

    // ========================================================================
    // USER MANAGEMENT FUNCTIONS (Admin only)
    // ========================================================================

    window.MonaTechUsers = {
        // Get all users
        getAll: function() {
            if (!MonaTechAuth.hasPermission('all')) return [];
            return JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
        },

        // Create user
        create: function(userData) {
            if (!MonaTechAuth.hasPermission('all')) {
                return { success: false, message: 'Permission denied' };
            }

            const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
            
            // Check if username exists
            if (users.find(u => u.username === userData.username)) {
                return { success: false, message: 'Username already exists' };
            }

            const newUser = {
                id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
                username: userData.username,
                password: hashPassword(userData.password),
                fullName: userData.fullName,
                role: userData.role,
                active: true,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
            
            MonaTechAuth.logActivity('USER_CREATE', `Created user: ${userData.username}`);
            
            return { success: true, user: newUser };
        },

        // Update user
        update: function(userId, updates) {
            if (!MonaTechAuth.hasPermission('all')) {
                return { success: false, message: 'Permission denied' };
            }

            const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
            const index = users.findIndex(u => u.id === userId);
            
            if (index === -1) {
                return { success: false, message: 'User not found' };
            }

            // Update fields
            if (updates.fullName) users[index].fullName = updates.fullName;
            if (updates.role) users[index].role = updates.role;
            if (updates.password) users[index].password = hashPassword(updates.password);
            if (updates.hasOwnProperty('active')) users[index].active = updates.active;

            localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
            
            MonaTechAuth.logActivity('USER_UPDATE', `Updated user: ${users[index].username}`);
            
            return { success: true, user: users[index] };
        },

        // Delete user
        delete: function(userId) {
            if (!MonaTechAuth.hasPermission('all')) {
                return { success: false, message: 'Permission denied' };
            }

            const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
            const user = users.find(u => u.id === userId);
            
            if (!user) {
                return { success: false, message: 'User not found' };
            }

            // Cannot delete admin user with id 1
            if (userId === 1) {
                return { success: false, message: 'Cannot delete system administrator' };
            }

            const filtered = users.filter(u => u.id !== userId);
            localStorage.setItem(USERS_DB_KEY, JSON.stringify(filtered));
            
            MonaTechAuth.logActivity('USER_DELETE', `Deleted user: ${user.username}`);
            
            return { success: true };
        }
    };

    // ========================================================================
    // DATA FILTERING FUNCTIONS
    // ========================================================================

    window.MonaTechFilter = {
        // Filter transactions based on role
        filterTransactions: function(transactions) {
            const session = MonaTechAuth.getSession();
            if (!session) return [];

            if (session.role === 'admin' || session.role === 'viewer') {
                return transactions; // Can see all
            }

            if (session.role === 'salesperson') {
                // Only show transactions created by this user
                return transactions.filter(t => t.createdBy === session.username);
            }

            return [];
        },

        // Add created by info to transaction
        addUserInfo: function(transaction) {
            const session = MonaTechAuth.getSession();
            if (session) {
                transaction.createdBy = session.username;
                transaction.createdByName = session.fullName;
            }
            return transaction;
        }
    };

    // ========================================================================
    // UI HELPER FUNCTIONS
    // ========================================================================

    window.MonaTechUI = {
        // Hide/show menu items based on role
        initializeMenus: function() {
            const session = MonaTechAuth.getSession();
            if (!session) return;

            // Hide menus user doesn't have access to
            const menus = ['dashboard', 'transactions', 'customers', 'inventory', 'reports', 'settings', 'users'];
            
            menus.forEach(menuId => {
                const menuElement = document.querySelector(`[data-menu="${menuId}"]`);
                if (menuElement) {
                    if (MonaTechAuth.canAccessMenu(menuId)) {
                        menuElement.style.display = '';
                    } else {
                        menuElement.style.display = 'none';
                    }
                }
            });

            // Show user info
            this.updateUserDisplay();
        },

        // Update user display in header
        updateUserDisplay: function() {
            const session = MonaTechAuth.getSession();
            if (!session) return;

            const userDisplayElement = document.getElementById('current-user-display');
            if (userDisplayElement) {
                userDisplayElement.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span>👤 ${session.fullName}</span>
                        <span style="background: #E63946; padding: 3px 10px; border-radius: 12px; font-size: 0.8em;">
                            ${session.role.toUpperCase()}
                        </span>
                        <button onclick="MonaTechAuth.logout()" class="btn btn-danger btn-small">
                            Logout
                        </button>
                    </div>
                `;
            }
        },

        // Show/hide elements based on permission
        checkElementPermissions: function() {
            const session = MonaTechAuth.getSession();
            if (!session) return;

            // Hide delete buttons for non-admins
            if (session.role !== 'admin') {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = 'none';
                });
            }

            // Disable editing for viewers
            if (session.role === 'viewer') {
                document.querySelectorAll('input, select, textarea, button').forEach(el => {
                    if (!el.classList.contains('allow-viewer')) {
                        el.disabled = true;
                    }
                });
            }
        }
    };

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    // Initialize users database
    initializeUsers();

    // Auto-logout check (every minute)
    setInterval(function() {
        const session = MonaTechAuth.getSession();
        if (session) {
            // Extend session if user is active
            const newExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
            session.expiresAt = newExpiry;
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }
    }, 60000);

    console.log('✅ MonaTech Authentication System Loaded');
    console.log('📝 Default accounts:');
    console.log('   Admin: username="admin", password="monatech2026"');
    console.log('   Salesperson: username="sales1", password="sales123"');
    console.log('   Viewer: username="viewer", password="view123"');

})();
