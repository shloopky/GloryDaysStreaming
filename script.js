
// --- CONFIGURATION ---
const SUPABASE_URL = 'https://gzwjqzyedpxlhgwknndl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_r4jrV0e282f2TNc1QExFOQ_XuFxdHsC';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DOM ELEMENTS ---
const submitBtn = document.getElementById('submit-btn');
const boardContainer = document.getElementById('board-container');

// --- FUNCTIONS ---

// 1. Fetch and Display Threads
async function loadThreads() {
    boardContainer.innerHTML = '<div class="loading">Refreshing...</div>';
    
    // Get threads and join with their first post (simplified for MVP)
    const { data: threads, error } = await supabase
        .from('threads')
        .select(`
            *,
            posts (content)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    renderBoard(threads);
}

function renderBoard(threads) {
    boardContainer.innerHTML = ''; // Clear loading

    threads.forEach(thread => {
        // Find the "OP" post (usually the first one created)
        const opContent = thread.posts.length > 0 ? thread.posts[0].content : 'No content';
        
        const threadDiv = document.createElement('div');
        threadDiv.className = 'thread';
        threadDiv.innerHTML = `
            <div class="thread-header">
                <span style="color:#005a9c; font-weight:bold;">Anonymous</span> 
                <span>${new Date(thread.created_at).toLocaleString()}</span>
                <span style="float:right">No. ${thread.id}</span>
            </div>
            <div style="font-weight:bold; color:#0f3b5f; margin:5px 0;">${thread.subject || ''}</div>
            <div class="post-content">${opContent}</div>
        `;
        boardContainer.appendChild(threadDiv);
    });
}

// 2. Submit New Thread
submitBtn.addEventListener('click', async () => {
    const subject = document.getElementById('thread-subject').value;
    const content = document.getElementById('thread-content').value;

    if (!content) return alert("You can't post nothing!");

    // Step A: Create Thread
    const { data: threadData, error: threadError } = await supabase
        .from('threads')
        .insert([{ subject: subject, board: 'b' }])
        .select();

    if (threadError) return alert('Error creating thread');

    const newThreadId = threadData[0].id;

    // Step B: Create the OP Post
    const { error: postError } = await supabase
        .from('posts')
        .insert([{ 
            thread_id: newThreadId, 
            content: content, 
            is_op: true 
        }]);

    if (postError) {
        alert('Error posting content');
    } else {
        // Clear inputs and reload
        document.getElementById('thread-subject').value = '';
        document.getElementById('thread-content').value = '';
        loadThreads();
    }
});

// Load on start
loadThreads();
