// API Configuration
// TODO: Replace with your actual API Gateway endpoints from your teammates
const API_CONFIG = {
    baseUrl: 'https://40o4yaxd8d.execute-api.us-east-1.amazonaws.com/dev',
    endpoints: {
        upload: '/upload',
        search: '/search',
        searchBySpecies: '/search/species',
        searchByThumbnail: '/search/thumbnail', 
        searchByFile: '/search/file',
        manageTags: '/tags',
        deleteFiles: '/files',
        notifications: '/notifications'
    }
};

// Demo mode for testing without real API
const API_DEMO_MODE = false; // Set to false when connecting to real API

// Demo data for testing
const DEMO_DATA = {
    uploadedFiles: [
        {
            id: '1',
            filename: 'crow_in_park.jpg',
            url: 'https://example.s3.amazonaws.com/crow_in_park.jpg',
            thumbnail: 'https://example.s3.amazonaws.com/crow_in_park_thumb.jpg',
            tags: [
                { species: 'crow', count: 2 },
                { species: 'pigeon', count: 1 }
            ],
            fileType: 'image',
            uploadDate: new Date().toISOString()
        },
        {
            id: '2', 
            filename: 'pigeon_feeding.jpg',
            url: 'https://example.s3.amazonaws.com/pigeon_feeding.jpg',
            thumbnail: 'https://example.s3.amazonaws.com/pigeon_feeding_thumb.jpg',
            tags: [
                { species: 'pigeon', count: 5 },
                { species: 'sparrow', count: 2 }
            ],
            fileType: 'image',
            uploadDate: new Date().toISOString()
        },
        {
            id: '3',
            filename: 'eagle_soaring.mp4',
            url: 'https://example.s3.amazonaws.com/eagle_soaring.mp4',
            thumbnail: null,
            tags: [
                { species: 'eagle', count: 1 }
            ],
            fileType: 'video',
            uploadDate: new Date().toISOString()
        }
    ]
};

// Utility function to make API calls
async function makeApiCall(endpoint, method = 'GET', data = null) {
    if (API_DEMO_MODE) {
        return simulateApiCall(endpoint, method, data);
    }

    try {
        const tokens = getAuthTokens();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.accessToken}`
        };

        const config = {
            method: method,
            headers: headers
        };

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(API_CONFIG.baseUrl + endpoint, config);
        
        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Simulate API calls for demo mode
function simulateApiCall(endpoint, method, data) {
    return new Promise((resolve, reject) => {
        // Simulate network delay
        setTimeout(() => {
            try {
                let result;
                
                switch (endpoint) {
                    case '/upload':
                        result = simulateUpload(data);
                        break;
                    case '/search':
                        result = simulateSearch(data);
                        break;
                    case '/search/species':
                        result = simulateSearchBySpecies(data);
                        break;
                    case '/search/thumbnail':
                        result = simulateSearchByThumbnail(data);
                        break;
                    case '/search/file':
                        result = simulateSearchByFile(data);
                        break;
                    case '/tags':
                        result = simulateBulkTagging(data);
                        break;
                    case '/files':
                        result = simulateDeleteFiles(data);
                        break;
                    case '/notifications':
                        result = simulateNotifications(data);
                        break;
                    default:
                        result = { success: true, message: 'Demo API call successful' };
                }
                
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }, Math.random() * 1000 + 500); // Random delay 500-1500ms
    });
}

// Demo API simulation functions
function simulateUpload(data) {
    const newFile = {
        id: Date.now().toString(),
        filename: data.filename || 'uploaded_file.jpg',
        url: `https://demo.s3.amazonaws.com/${data.filename}`,
        thumbnail: `https://demo.s3.amazonaws.com/${data.filename}_thumb.jpg`,
        tags: [
            { species: 'unknown', count: 1 }
        ],
        fileType: data.type || 'image',
        uploadDate: new Date().toISOString()
    };
    
    DEMO_DATA.uploadedFiles.push(newFile);
    
    return {
        success: true,
        message: 'File uploaded successfully',
        file: newFile
    };
}

function simulateSearch(data) {
    const { tags } = data;
    let results = DEMO_DATA.uploadedFiles;
    
    if (tags && tags.length > 0) {
        results = results.filter(file => {
            return tags.every(searchTag => {
                const fileTag = file.tags.find(t => t.species === searchTag.species);
                return fileTag && fileTag.count >= searchTag.count;
            });
        });
    }
    
    return {
        success: true,
        results: results.map(file => ({
            url: file.thumbnail || file.url,
            fullUrl: file.url,
            filename: file.filename,
            tags: file.tags,
            fileType: file.fileType
        }))
    };
}

function simulateSearchBySpecies(data) {
    const { species } = data;
    const results = DEMO_DATA.uploadedFiles.filter(file => 
        file.tags.some(tag => tag.species.toLowerCase().includes(species.toLowerCase()))
    );
    
    return {
        success: true,
        results: results.map(file => ({
            url: file.thumbnail || file.url,
            fullUrl: file.url,
            filename: file.filename,
            tags: file.tags,
            fileType: file.fileType
        }))
    };
}

function simulateSearchByThumbnail(data) {
    const { thumbnailUrl } = data;
    const file = DEMO_DATA.uploadedFiles.find(f => f.thumbnail === thumbnailUrl);
    
    if (file) {
        return {
            success: true,
            fullImageUrl: file.url
        };
    } else {
        return {
            success: false,
            message: 'Thumbnail not found'
        };
    }
}

function simulateSearchByFile(data) {
    // Simulate finding similar files
    const randomResults = DEMO_DATA.uploadedFiles
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 1);
    
    return {
        success: true,
        message: 'Similar files found',
        results: randomResults.map(file => ({
            url: file.thumbnail || file.url,
            fullUrl: file.url,
            filename: file.filename,
            tags: file.tags,
            fileType: file.fileType
        }))
    };
}

function simulateBulkTagging(data) {
    const { urls, operation, tags } = data;
    
    return {
        success: true,
        message: `Tags ${operation === 1 ? 'added to' : 'removed from'} ${urls.length} files`,
        processedFiles: urls.length
    };
}

function simulateDeleteFiles(data) {
    const { urls } = data;
    
    // Remove files from demo data
    urls.forEach(url => {
        const index = DEMO_DATA.uploadedFiles.findIndex(f => f.url === url || f.thumbnail === url);
        if (index > -1) {
            DEMO_DATA.uploadedFiles.splice(index, 1);
        }
    });
    
    return {
        success: true,
        message: `${urls.length} files deleted successfully`,
        deletedCount: urls.length
    };
}

function simulateNotifications(data) {
    if (data.action === 'subscribe') {
        return {
            success: true,
            message: `Subscribed to notifications for ${data.species}`,
            subscriptionId: Date.now().toString()
        };
    } else if (data.action === 'unsubscribe') {
        return {
            success: true,
            message: 'Unsubscribed successfully'
        };
    } else {
        // Get subscriptions
        return {
            success: true,
            subscriptions: [
                { id: '1', species: 'crow', created: new Date().toISOString() },
                { id: '2', species: 'eagle', created: new Date().toISOString() }
            ]
        };
    }
}

// API Functions for the frontend to use

// Upload file
async function uploadFile(file, progressCallback) {
    try {
        if (API_DEMO_MODE) {
            // Simulate upload progress
            for (let i = 0; i <= 100; i += 10) {
                if (progressCallback) {
                    progressCallback(i);
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        const result = await makeApiCall('/upload', 'POST', {
            filename: file.name,
            type: file.type,
            size: file.size
        });
        
        return result;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

// Search files by tags
async function searchFiles(tags) {
    try {
        const result = await makeApiCall('/search', 'POST', { tags });
        return result;
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}

// Search files by species
async function searchBySpecies(species) {
    try {
        const result = await makeApiCall('/search/species', 'GET', { species });
        return result;
    } catch (error) {
        console.error('Species search error:', error);
        throw error;
    }
}

// Search by thumbnail URL
async function searchByThumbnailUrl(thumbnailUrl) {
    try {
        const result = await makeApiCall('/search/thumbnail', 'GET', { thumbnailUrl });
        return result;
    } catch (error) {
        console.error('Thumbnail search error:', error);
        throw error;
    }
}

// Search by uploaded file
async function searchByUploadedFile(file) {
    try {
        const result = await makeApiCall('/search/file', 'POST', {
            filename: file.name,
            type: file.type
        });
        return result;
    } catch (error) {
        console.error('File search error:', error);
        throw error;
    }
}

// Bulk tag management
async function manageBulkTags(urls, operation, tags) {
    try {
        const result = await makeApiCall('/tags', 'POST', {
            urls,
            operation,
            tags
        });
        return result;
    } catch (error) {
        console.error('Bulk tag error:', error);
        throw error;
    }
}

// Delete files
async function deleteMultipleFiles(urls) {
    try {
        const result = await makeApiCall('/files', 'DELETE', { urls });
        return result;
    } catch (error) {
        console.error('Delete error:', error);
        throw error;
    }
}

// Notification management
async function subscribeToSpecies(species) {
    try {
        const result = await makeApiCall('/notifications', 'POST', {
            action: 'subscribe',
            species
        });
        return result;
    } catch (error) {
        console.error('Subscribe error:', error);
        throw error;
    }
}

async function unsubscribeFromNotifications(subscriptionId) {
    try {
        const result = await makeApiCall('/notifications', 'DELETE', {
            action: 'unsubscribe',
            subscriptionId
        });
        return result;
    } catch (error) {
        console.error('Unsubscribe error:', error);
        throw error;
    }
}

async function getNotificationSubscriptions() {
    try {
        const result = await makeApiCall('/notifications', 'GET');
        return result;
    } catch (error) {
        console.error('Get subscriptions error:', error);
        throw error;
    }
}