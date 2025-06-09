// API Configuration
// TODO: Replace with your actual API Gateway endpoints from your teammates
const API_CONFIG = {
    baseUrl: 'https://40o4yaxd8d.execute-api.us-east-1.amazonaws.com/dev',
    endpoints: {
        upload: '/Upload',
        search: '/query',
        searchBySpecies: '/query-species',
        searchByThumbnail: '/query-thumbnail', 
        searchByFile: '/query-tags',
        manageTags: '/query-manual',
        deleteFiles: '/query-manual',
        //notifications: '/notifications'
    }
};


// 添加这个函数来判断文件类型
function getFileTypeCategory(mimeType) {
    if (mimeType.startsWith('image/')) {
        return 'images';
    } else if (mimeType.startsWith('video/')) {
        return 'videos';
    } else if (mimeType.startsWith('audio/')) {
        return 'audios';
    }
    return 'images'; // 默认
}

// 添加S3上传函数
async function uploadToS3(file, presignedUrl, progressCallback) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // 监听上传进度
        xhr.upload.onprogress = function(event) {
            if (event.lengthComputable && progressCallback) {
                const progress = Math.round((event.loaded / event.total) * 100);
                progressCallback(progress);
            }
        };
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                resolve();
            } else {
                reject(new Error(`Upload failed: ${xhr.status}`));
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('Upload failed'));
        };
        
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    });
}

// Demo mode for testing without real API
const API_DEMO_MODE = true; // Set to false when connecting to real API

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
            // 保持Demo模式代码不变
            for (let i = 0; i <= 100; i += 10) {
                if (progressCallback) {
                    progressCallback(i);
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            // Demo模式的返回
            return { success: true, message: 'Demo upload successful' };
        } else {
            // 真实上传模式
            
            // 第一步：获取预签名URL
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const fileType = getFileTypeCategory(file.type);
            
            const uploadRequest = await makeApiCall(API_CONFIG.endpoints.upload, 'POST', {
                type: fileType,  // 'images', 'videos', 或 'audios'
                suffix: fileExtension
            });

            if (!uploadRequest.upload_url) {
                throw new Error('Failed to get upload URL from server');
            }
            
            // 第二步：使用预签名URL上传到S3
            const uploadUrl = uploadRequest.upload_url;
            
            await uploadToS3(file, uploadUrl, progressCallback);
            
            // 返回成功结果
            return { 
                success: true, 
                message: 'File uploaded successfully',
                s3Key: uploadRequest.s3_key 
            };
        }
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

// Search files by tags
async function searchFiles(tags) {
    try {
        // 转换tags格式：从 [{species: 'crow', count: 3}] 
        // 转为 {crow: 3, pigeon: 2}
        const tagsObject = {};
        tags.forEach(tag => {
            tagsObject[tag.species] = tag.count;
        });
        
        const result = await makeApiCall(API_CONFIG.endpoints.search, 'POST', { 
            tags: tagsObject 
        });
        return result;
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}

// Search files by species
async function searchBySpecies(species) {
    try {
        const result = await makeApiCall(API_CONFIG.endpoints.searchBySpecies, 'POST', { 
            tags: { [species]: null }  // 创建格式 {crow: null}
        });
        return result;
    } catch (error) {
        console.error('Species search error:', error);
        throw error;
    }
}

async function searchByThumbnailUrl(thumbnailUrl) {
    try {
        const result = await makeApiCall(API_CONFIG.endpoints.searchByThumbnail, 'POST', { 
            thumbnail: thumbnailUrl 
        });
        return result;
    } catch (error) {
        console.error('Thumbnail search error:', error);
        throw error;
    }
}

// Search by uploaded file
async function searchByUploadedFile(file) {
    try {
        // 将文件转换为base64
        const fileContent = await fileToBase64(file);
        
        // 确定文件类型
        let filetype;
        if (file.type.startsWith('image/')) {
            filetype = 'image';
        } else if (file.type.startsWith('video/')) {
            filetype = 'video';
        } else {
            throw new Error('Unsupported file type');
        }
        
        const result = await makeApiCall(API_CONFIG.endpoints.searchByFile, 'POST', {
            filename: file.name,
            filetype: filetype,      // 注意这里是 "filetype"
            content: fileContent     // base64编码的文件内容
        });
        return result;
    } catch (error) {
        console.error('File search error:', error);
        throw error;
    }
}

// 新增辅助函数：将文件转换为base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // 移除 "data:image/jpeg;base64," 前缀，只保留base64内容
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Bulk tag management
async function manageBulkTags(urls, operation, tags) {
    try {
        const result = await makeApiCall(API_CONFIG.endpoints.manageTags, 'POST', {
            url: urls,              // 后端期望 "url" 字段名
            operation: operation,    // 1 或 0
            tags: tags              // 已经是 ["crow,1", "pigeon,2"] 格式
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
        // 注意：根据后端代码，删除功能可能没有实现
        // 这里先保持调用，如果后端没有这个功能，需要另想办法
        const result = await makeApiCall(API_CONFIG.endpoints.deleteFiles, 'POST', {
            url: urls,              // 使用 "url" 字段名保持一致
            operation: 'delete'     // 添加操作类型标识
        });
        return result;
    } catch (error) {
        console.error('Delete error:', error);
        // 如果API不存在，提供友好的错误信息
        throw new Error('Delete functionality not yet implemented in backend');
    }
}
/*
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
*/