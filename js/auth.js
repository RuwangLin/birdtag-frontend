// AWS Cognito Configuration
// TODO: Replace these with your actual Cognito settings from your teammates
const COGNITO_CONFIG = {
    region: 'us-east-1', // Replace with your region
    userPoolId: 'us-east-1_1fIpvejJB', // Replace with your User Pool ID
    clientId: '7qv1017295fg6i1m5iuiqqcutt', // Replace with your App Client ID
};

// Initialize AWS Cognito
let cognitoUser = null;
let userPool = null;

// Initialize Cognito User Pool (when real config is available)
function initializeCognito() {
    if (typeof AmazonCognitoIdentity  !== 'undefined') {
        AWS.config.region = COGNITO_CONFIG.region;
        
        const poolData = {
            UserPoolId: COGNITO_CONFIG.userPoolId,
            ClientId: COGNITO_CONFIG.clientId
        };
        
        userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    }
}

// For development/testing - simulate authentication
const DEMO_MODE = false; // Set to false when integrating with real Cognito

// Check if user is logged in
function isUserLoggedIn() {
    if (DEMO_MODE) {
        return localStorage.getItem('demoUserLoggedIn') === 'true';
    }
    
    // Real Cognito implementation
    if (userPool) {
        cognitoUser = userPool.getCurrentUser();
        return cognitoUser !== null;
    }
    
    return false;
}

// Sign up new user
function signUpUser(email, password, firstName, lastName) {
    return new Promise((resolve, reject) => {
        if (DEMO_MODE) {
            // Simulate signup process
            setTimeout(() => {
                // Store demo user data
                const userData = {
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    verified: false
                };
                localStorage.setItem('demoUserData', JSON.stringify(userData));
                resolve({ message: 'Demo account created successfully!' });
            }, 1500);
            return;
        }

        // Real Cognito implementation
        if (!userPool) {
            reject(new Error('Cognito not initialized'));
            return;
        }

        const attributeList = [];
        
        const emailAttribute = new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'email',
            Value: email
        });
        
        const firstNameAttribute = new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'given_name',
            Value: firstName
        });
        
        const lastNameAttribute = new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'family_name',
            Value: lastName
        });
        
        attributeList.push(emailAttribute);
        attributeList.push(firstNameAttribute);
        attributeList.push(lastNameAttribute);

        // 生成唯一用户名（基于邮箱但去掉特殊字符）
        const username = email.replace('@', '_at_').replace('.', '_dot_');

        userPool.signUp(username, password, attributeList, null, function(err, result) {
            if (err) {
                reject(err);
                return;
            }
            cognitoUser = result.user;
            resolve(result);
        });
    });
}

// Sign in user
function signInUser(email, password) {
    return new Promise((resolve, reject) => {
        if (DEMO_MODE) {
            // Simulate login process
            setTimeout(() => {
                // Check if demo user exists
                const userData = localStorage.getItem('demoUserData');
                if (userData) {
                    const user = JSON.parse(userData);
                    if (user.email === email) {
                        localStorage.setItem('demoUserLoggedIn', 'true');
                        localStorage.setItem('currentUser', JSON.stringify(user));
                        resolve({ message: 'Demo login successful!' });
                        return;
                    }
                }
                
                // Default demo login for testing
                if (email === 'demo@birdtag.com' && password === 'demo123') {
                    const defaultUser = {
                        email: 'demo@birdtag.com',
                        firstName: 'Demo',
                        lastName: 'User',
                        verified: true
                    };
                    localStorage.setItem('demoUserLoggedIn', 'true');
                    localStorage.setItem('currentUser', JSON.stringify(defaultUser));
                    resolve({ message: 'Demo login successful!' });
                } else {
                    reject(new Error('Invalid demo credentials. Use demo@birdtag.com / demo123'));
                }
            }, 1000);
            return;
        }

        // Real Cognito implementation
        if (!userPool) {
            reject(new Error('Cognito not initialized'));
            return;
        }

        const username = email.replace('@', '_at_').replace('.', '_dot_');

        const userData = {
            Username: username,
            Pool: userPool
        };

        cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        const authenticationData = {
            Username: username,
            Password: password
        };

        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {
                const accessToken = result.getAccessToken().getJwtToken();
                const idToken = result.getIdToken().getJwtToken();
                
                // Store tokens
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('idToken', idToken);
                
                resolve(result);
            },
            onFailure: function(err) {
                reject(err);
            }
        });
    });
}

// Sign out user
function signOutUser() {
    if (DEMO_MODE) {
        localStorage.removeItem('demoUserLoggedIn');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('demoUserData');
        window.location.href = 'login.html';
        return;
    }

    // Real Cognito implementation
    if (cognitoUser) {
        cognitoUser.signOut();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
    }
    
    window.location.href = 'login.html';
}

// Get current user information
function getCurrentUser() {
    if (DEMO_MODE) {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }

    // Real Cognito implementation
    return new Promise((resolve, reject) => {
        if (!cognitoUser) {
            reject(new Error('No user logged in'));
            return;
        }

        cognitoUser.getSession(function(err, session) {
            if (err) {
                reject(err);
                return;
            }

            if (session.isValid()) {
                cognitoUser.getUserAttributes(function(err, attributes) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const userData = {};
                    attributes.forEach(function(attribute) {
                        userData[attribute.getName()] = attribute.getValue();
                    });

                    resolve(userData);
                });
            } else {
                reject(new Error('Session invalid'));
            }
        });
    });
}

// Get authentication tokens for API calls
function getAuthTokens() {
    if (DEMO_MODE) {
        return {
            accessToken: 'demo-access-token',
            idToken: 'demo-id-token'
        };
    }

    return {
        accessToken: localStorage.getItem('accessToken'),
        idToken: localStorage.getItem('idToken')
    };
}

// Initialize Cognito when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (!DEMO_MODE) {
        initializeCognito();
    }
});

// Utility function to check authentication for protected pages
function requireAuth() {
    if (!isUserLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}