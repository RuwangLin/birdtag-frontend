// Global Variables
let currentTags = [];
let uploadedFiles = [];
let searchResults = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!requireAuth()) {
        return;
    }
    
    // Load user info
    loadUserInfo();
    
    // Initialize upload functionality
    initializeUpload();
    
    // Load initial data
    //loadNotificationSubscriptions();
    
    // Show welcome message
    showAlert('Welcome to BirdTag!', 'success');
});

// Load user information
function loadUserInfo() {
    if (DEMO_MODE) {
        const user = getCurrentUser();
        if (user) {
            document.getElementById('userWelcome').textContent = `Welcome, ${user.firstName}!`;
        }
    } else {
        getCurrentUser()
            .then(user => {
                document.getElementById('userWelcome').textContent = `Welcome, ${user.given_name || user.email}!`;
            })
            .catch(error => {
                console.error('Error loading user info:', error);
            });
    }
}

// Section Navigation
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName + '-section').classList.add('active');
    
    // Add active class to clicked nav item
    event.target.classList.add('active');
    
    // Load section-specific data
    switch(sectionName) {
        case 'search':
            loadSearchData();
            break;
        //case 'notifications':
            //loadNotificationSubscriptions();
           // break;
    }
}

// Upload Functionality
function initializeUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
}

function handleFiles(files) {
    const fileList = document.getElementById('fileList');
    
    Array.from(files).forEach(file => {
        // Validate file type
        if (!isValidFileType(file.type)) {
            showAlert(`File ${file.name} is not a supported format.`, 'warning');
            return;
        }
        
        // Add to uploaded files list
        uploadedFiles.push(file);
        
        // Create file item
        const fileItem = createFileItem(file);
        fileList.appendChild(fileItem);
        
        // Start upload
        uploadSingleFile(file, fileItem);
    });
}

function isValidFileType(mimeType) {
    const validTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'video/mp4', 'video/webm', 'video/ogg'
    ];
    return validTypes.includes(mimeType);
}

function createFileItem(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <div class="file-info">
            <div class="file-icon">
                <i class="bi bi-${getFileIcon(file.type)}"></i>
            </div>
            <div class="file-details">
                <h6>${file.name}</h6>
                <small>${formatFileSize(file.size)}</small>
            </div>
        </div>
        <div class="file-status">
            <div class="progress" style="width: 100px; height: 6px;">
                <div class="progress-bar" style="width: 0%"></div>
            </div>
            <small class="status-text">Uploading...</small>
        </div>
    `;
    return fileItem;
}

function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'music-note';
    if (mimeType.startsWith('video/')) return 'play-circle';
    return 'file-earmark';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadSingleFile(file, fileItem) {
    const progressBar = fileItem.querySelector('.progress-bar');
    const statusText = fileItem.querySelector('.status-text');
    
    try {
        const result = await uploadFile(file, (progress) => {
            progressBar.style.width = progress + '%';
            statusText.textContent = `${progress}%`;
        });
        
        // Upload completed
        progressBar.style.width = '100%';
        progressBar.classList.add('bg-success');
        statusText.textContent = 'Completed';
        
        showAlert(`${file.name} uploaded successfully!`, 'success');
        
    } catch (error) {
        progressBar.classList.add('bg-danger');
        statusText.textContent = 'Failed';
        showAlert(`Upload failed for ${file.name}: ${error.message}`, 'danger');
    }
}

// Search Functionality
function addTag() {
    const speciesInput = document.getElementById('birdSpecies');
    const countInput = document.getElementById('birdCount');
    
    const species = speciesInput.value.trim();
    const count = parseInt(countInput.value) || 1;
    
    if (!species) {
        showAlert('Please enter a bird species.', 'warning');
        return;
    }
    
    // Check if tag already exists
    const existingTag = currentTags.find(tag => tag.species === species);
    if (existingTag) {
        existingTag.count = count;
    } else {
        currentTags.push({ species, count });
    }
    
    // Clear inputs
    speciesInput.value = '';
    countInput.value = '1';
    
    // Update tag display
    updateTagDisplay();
}

function updateTagDisplay() {
    const tagList = document.getElementById('tagList');
    tagList.innerHTML = '';
    
    currentTags.forEach((tag, index) => {
        const tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.innerHTML = `
            ${tag.species}: ${tag.count}
            <button class="tag-remove" onclick="removeTag(${index})">×</button>
        `;
        tagList.appendChild(tagItem);
    });
}

function removeTag(index) {
    currentTags.splice(index, 1);
    updateTagDisplay();
}

function clearSearch() {
    currentTags = [];
    updateTagDisplay();
    document.getElementById('thumbnailUrl').value = '';
    document.getElementById('searchFile').value = '';
    document.getElementById('searchResults').innerHTML = '';
}

async function performSearch() {
    if (currentTags.length === 0) {
        showAlert('Please add at least one tag to search.', 'warning');
        return;
    }
    
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border"></div><p>Searching...</p></div>';
    
    try {
        const result = await searchFiles(currentTags);
        displaySearchResults(result.results);
    } catch (error) {
        showAlert('Search failed: ' + error.message, 'danger');
        resultsContainer.innerHTML = '<p class="text-muted">Search failed. Please try again.</p>';
    }
}

async function browseAll() {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border"></div><p>Loading all files...</p></div>';
    
    try {
        // Search with empty tags to get all files
        const result = await searchFiles([]);
        displaySearchResults(result.results);
    } catch (error) {
        showAlert('Failed to load files: ' + error.message, 'danger');
        resultsContainer.innerHTML = '<p class="text-muted">Failed to load files. Please try again.</p>';
    }
}

async function searchByThumbnail() {
    const thumbnailUrl = document.getElementById('thumbnailUrl').value.trim();
    
    if (!thumbnailUrl) {
        showAlert('Please enter a thumbnail URL.', 'warning');
        return;
    }
    
    try {
        const result = await searchByThumbnailUrl(thumbnailUrl);
        if (result.success) {
            showAlert('Full image URL: ' + result.fullImageUrl, 'info');
        } else {
            showAlert('Thumbnail not found.', 'warning');
        }
    } catch (error) {
        showAlert('Thumbnail search failed: ' + error.message, 'danger');
    }
}

async function searchByFile() {
    const fileInput = document.getElementById('searchFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('Please select a file to search.', 'warning');
        return;
    }
    
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border"></div><p>Finding similar files...</p></div>';
    
    try {
        const result = await searchByUploadedFile(file);
        displaySearchResults(result.results);
        showAlert('Found similar files!', 'success');
    } catch (error) {
        showAlert('File search failed: ' + error.message, 'danger');
        resultsContainer.innerHTML = '<p class="text-muted">Search failed. Please try again.</p>';
    }
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    
    // 检查结果格式 - 后端返回的是 {links: [...]} 格式
    let urlList;
    if (results && results.links) {
        urlList = results.links;
    } else if (Array.isArray(results)) {
        urlList = results;
    } else {
        resultsContainer.innerHTML = '<p class="text-muted">No results found.</p>';
        return;
    }
    
    if (!urlList || urlList.length === 0) {
        resultsContainer.innerHTML = '<p class="text-muted">No results found.</p>';
        return;
    }
    
    const resultsGrid = document.createElement('div');
    resultsGrid.className = 'results-grid';
    
    urlList.forEach(url => {
        // 从URL推断文件类型和名称
        const filename = url.split('/').pop();
        const isImage = url.includes('thumbnail') || /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
        const isVideo = /\.(mp4|webm|ogg|avi|mov)$/i.test(filename);
        const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(filename);
        
        let fileType = 'unknown';
        if (isImage) fileType = 'image';
        else if (isVideo) fileType = 'video';
        else if (isAudio) fileType = 'audio';
        
        const resultItem = {
            url: url,           // 缩略图或文件URL
            fullUrl: url,       // 完整文件URL（暂时相同）
            filename: filename,
            tags: [],           // 后端返回中没有标签信息
            fileType: fileType
        };
        
        const resultCard = createResultCard(resultItem);
        resultsGrid.appendChild(resultCard);
    });
    
    resultsContainer.innerHTML = `<h5>Search Results (${urlList.length} files)</h5>`;
    resultsContainer.appendChild(resultsGrid);
}

function createResultCard(result) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    const isVideo = result.fileType === 'video';
    const isAudio = result.fileType === 'audio';
    
    card.innerHTML = `
        ${!isAudio ? `
            <img src="${result.url}" class="result-image" alt="${result.filename}" 
                 onclick="showImageModal('${result.fullUrl}', '${result.filename}')">
        ` : `
            <div class="result-image d-flex align-items-center justify-content-center bg-light">
                <i class="bi bi-music-note" style="font-size: 3rem; color: #6c757d;"></i>
            </div>
        `}
        <div class="result-info">
            <h6>${result.filename}</h6>
            <div class="result-tags">
                ${result.tags.map(tag => `<span class="result-tag">${tag.species}: ${tag.count}</span>`).join('')}
            </div>
        </div>
        <div class="result-actions">
            ${isVideo || isAudio ? `
                <a href="${result.fullUrl}" class="btn btn-sm btn-primary" target="_blank">
                    <i class="bi bi-download"></i> Download
                </a>
            ` : `
                <button class="btn btn-sm btn-outline-primary" onclick="showImageModal('${result.fullUrl}', '${result.filename}')">
                    <i class="bi bi-eye"></i> View
                </button>
            `}
            <button class="btn btn-sm btn-outline-secondary" onclick="copyToClipboard('${result.fullUrl}')">
                <i class="bi bi-copy"></i> Copy URL
            </button>
        </div>
    `;
    
    return card;
}

function showImageModal(imageUrl, filename) {
    document.getElementById('modalImage').src = imageUrl;
    document.getElementById('modalImageInfo').innerHTML = `<strong>${filename}</strong><br>URL: ${imageUrl}`;
    new bootstrap.Modal(document.getElementById('imageModal')).show();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('URL copied to clipboard!', 'success');
    }).catch(() => {
        showAlert('Failed to copy URL.', 'danger');
    });
}

// Tag Management Functions
async function performBulkTagging() {
    const urls = document.getElementById('bulkUrls').value.trim().split('\n').filter(url => url.trim());
    const tags = document.getElementById('bulkTags').value.trim();
    const operation = document.querySelector('input[name="operation"]:checked').value;
    
    if (urls.length === 0) {
        showAlert('Please enter at least one file URL.', 'warning');
        return;
    }
    
    if (!tags) {
        showAlert('Please enter tags to add or remove.', 'warning');
        return;
    }
    
    // Parse tags (format: species:count,species:count)
    const tagList = tags.split(',').map(tag => {
        const [species, count] = tag.trim().split(':');
        return `${species},${count || 1}`;
    });
    
    try {
        const result = await manageBulkTags(urls, parseInt(operation), tagList);
        showAlert(result.message, 'success');
        
        // Clear form
        document.getElementById('bulkUrls').value = '';
        document.getElementById('bulkTags').value = '';
        
    } catch (error) {
        showAlert('Bulk tagging failed: ' + error.message, 'danger');
    }
}

async function deleteFiles() {
    const urls = document.getElementById('deleteUrls').value.trim().split('\n').filter(url => url.trim());
    
    if (urls.length === 0) {
        showAlert('Please enter at least one file URL to delete.', 'warning');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${urls.length} files? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const result = await deleteMultipleFiles(urls);
        showAlert(result.message, 'success');
        
        // Clear form
        document.getElementById('deleteUrls').value = '';
        
    } catch (error) {
        showAlert('Delete failed: ' + error.message, 'danger');
    }
}
/*
// Notification Functions
async function subscribeToNotifications() {
    const species = document.getElementById('notificationSpecies').value.trim();
    
    if (!species) {
        showAlert('Please enter a bird species.', 'warning');
        return;
    }
    
    try {
        const result = await subscribeToSpecies(species);
        showAlert(result.message, 'success');
        
        // Clear input
        document.getElementById('notificationSpecies').value = '';
        
        // Reload subscriptions
        loadNotificationSubscriptions();
        
    } catch (error) {
        showAlert('Subscription failed: ' + error.message, 'danger');
    }
}

async function loadNotificationSubscriptions() {
    try {
        const result = await getNotificationSubscriptions();
        const subscriptionList = document.getElementById('subscriptionList');
        
        if (result.subscriptions && result.subscriptions.length > 0) {
            subscriptionList.innerHTML = result.subscriptions.map(sub => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span><strong>${sub.species}</strong></span>
                    <button class="btn btn-sm btn-outline-danger" onclick="unsubscribe('${sub.id}')">
                        <i class="bi bi-x"></i> Unsubscribe
                    </button>
                </div>
            `).join('');
        } else {
            subscriptionList.innerHTML = '<div class="list-group-item text-muted">No active subscriptions</div>';
        }
    } catch (error) {
        console.error('Failed to load subscriptions:', error);
    }
}

async function unsubscribe(subscriptionId) {
    try {
        const result = await unsubscribeFromNotifications(subscriptionId);
        showAlert(result.message, 'success');
        loadNotificationSubscriptions();
    } catch (error) {
        showAlert('Unsubscribe failed: ' + error.message, 'danger');
    }
}
*/

// Utility Functions
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert-' + Date.now();
    
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            alertElement.remove();
        }
    }, 5000);
}

function loadSearchData() {
    // Load initial search data if needed
    // This could include popular tags, recent searches, etc.
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+U for upload
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        showSection('upload');
    }
    
    // Ctrl+F for search
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        showSection('search');
        document.getElementById('birdSpecies').focus();
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        clearSearch();
    }
});

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page became visible, check if user is still logged in
        if (!isUserLoggedIn()) {
            window.location.href = 'login.html';
        }
    }
});